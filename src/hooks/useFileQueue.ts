import { useState, useRef, useCallback, useEffect } from 'react';
import type { ConvertedFile, ConversionSettings, StatsData } from '../types/converter';
import { convertHeicToJpg } from '../lib/converter';
import {
  isSupportedFile,
  fileDedupeKey,
  buildOutputFileName,
  uniquifyFileName,
  generateId,
} from '../lib/fileUtils';

const MAX_CONCURRENT_CONVERSIONS = 2;
const DEFAULT_BATCH_LIMIT = 300;

interface AddFilesResult {
  added: number;
  skipped: number;
  duplicates: number;
  overLimit: boolean;
}

interface UseFileQueueReturn {
  files: ConvertedFile[];
  isConverting: boolean;
  isCancelled: boolean;
  zipProgress: number | null;
  addFiles: (
    entries: { file: File; relativePath: string }[],
    onNeedConfirm?: (count: number, proceed: () => void) => void,
  ) => AddFilesResult;
  removeFile: (id: string) => void;
  clearAll: () => void;
  startConversion: () => void;
  cancelConversion: () => void;
  retryErrors: () => void;
  stats: StatsData;
  setZipProgress: (p: number | null) => void;
}

export function useFileQueue(settings: ConversionSettings): UseFileQueueReturn {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [zipProgress, setZipProgress] = useState<number | null>(null);

  // Refs to avoid stale closures in the queue runner
  const cancelledRef = useRef(false);
  const activeCountRef = useRef(0);
  const settingsRef = useRef(settings);
  const usedOutputNamesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Cleanup all blob URLs on unmount
  useEffect(() => {
    return () => {
      setFiles((prev) => {
        prev.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        return [];
      });
    };
  }, []);

  const addFiles = useCallback(
    (
      entries: { file: File; relativePath: string }[],
      onNeedConfirm?: (count: number, proceed: () => void) => void,
    ): AddFilesResult => {
      // Separate valid from invalid
      const valid = entries.filter((e) => isSupportedFile(e.file));
      const skipped = entries.length - valid.length;

      // Check existing dedup keys
      const existingKeys = new Set<string>(
        files.map((f) => fileDedupeKey(f.originalFile, f.relativePath)),
      );

      const uniqueEntries = valid.filter(
        (e) => !existingKeys.has(fileDedupeKey(e.file, e.relativePath)),
      );
      const duplicates = valid.length - uniqueEntries.length;

      const doAdd = (toAdd: { file: File; relativePath: string }[]) => {
        const newFiles: ConvertedFile[] = toAdd.map((entry) => {
          const rawOutputName = buildOutputFileName(entry.file.name);
          const outputFileName = uniquifyFileName(rawOutputName, usedOutputNamesRef.current);
          usedOutputNamesRef.current.add(outputFileName);

          return {
            id: generateId(),
            originalFile: entry.file,
            originalName: entry.file.name,
            relativePath: entry.relativePath,
            originalSize: entry.file.size,
            status: 'queued',
            progress: 0,
            outputBlob: null,
            outputFileName,
            outputSize: null,
            errorMessage: null,
            previewUrl: null,
            isMultiFrame: false,
          };
        });

        setFiles((prev) => [...prev, ...newFiles]);

        // Auto-convert if setting enabled
        if (settingsRef.current.autoConvert) {
          // Trigger after state update
          setTimeout(() => triggerQueue(), 50);
        }
      };

      if (uniqueEntries.length > DEFAULT_BATCH_LIMIT) {
        if (onNeedConfirm) {
          onNeedConfirm(uniqueEntries.length, () => doAdd(uniqueEntries));
        }
        return { added: 0, skipped, duplicates, overLimit: true };
      }

      doAdd(uniqueEntries);
      return { added: uniqueEntries.length, skipped, duplicates, overLimit: false };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files],
  );

  const updateFile = useCallback(
    (id: string, updates: Partial<ConvertedFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      );
    },
    [],
  );

  const processFile = useCallback(
    async (file: ConvertedFile) => {
      if (cancelledRef.current) return;

      updateFile(file.id, { status: 'converting', progress: 5 });

      try {
        const result = await convertHeicToJpg(
          file.originalFile,
          settingsRef.current,
          (pct) => updateFile(file.id, { progress: pct }),
        );

        const previewUrl = URL.createObjectURL(result.blob);
        updateFile(file.id, {
          status: 'done',
          progress: 100,
          outputBlob: result.blob,
          outputSize: result.blob.size,
          previewUrl,
          isMultiFrame: result.isMultiFrame,
        });
      } catch (err) {
        updateFile(file.id, {
          status: 'error',
          progress: 0,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [updateFile],
  );

  const triggerQueue = useCallback(() => {
    setFiles((currentFiles) => {
      if (cancelledRef.current) return currentFiles;

      const queued = currentFiles.filter((f) => f.status === 'queued');
      const converting = currentFiles.filter((f) => f.status === 'converting');
      const slots = MAX_CONCURRENT_CONVERSIONS - converting.length - activeCountRef.current;

      if (slots <= 0 || queued.length === 0) {
        // Check if queue is fully done
        if (converting.length === 0 && activeCountRef.current === 0) {
          setIsConverting(false);
        }
        return currentFiles;
      }

      const toStart = queued.slice(0, slots);
      activeCountRef.current += toStart.length;

      toStart.forEach((f) => {
        processFile(f).finally(() => {
          activeCountRef.current = Math.max(0, activeCountRef.current - 1);
          triggerQueue();
        });
      });

      return currentFiles;
    });
  }, [processFile]);

  const startConversion = useCallback(() => {
    cancelledRef.current = false;
    setIsCancelled(false);
    setIsConverting(true);
    triggerQueue();
  }, [triggerQueue]);

  const cancelConversion = useCallback(() => {
    cancelledRef.current = true;
    setIsCancelled(true);
    setIsConverting(false);
  }, []);

  const retryErrors = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'error'
          ? { ...f, status: 'queued', progress: 0, errorMessage: null }
          : f,
      ),
    );
    cancelledRef.current = false;
    setIsCancelled(false);
    setIsConverting(true);
    setTimeout(() => triggerQueue(), 50);
  }, [triggerQueue]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
      return [];
    });
    usedOutputNamesRef.current = new Set();
    cancelledRef.current = false;
    setIsCancelled(false);
    setIsConverting(false);
    activeCountRef.current = 0;
  }, []);

  const stats: StatsData = {
    total: files.length,
    done: files.filter((f) => f.status === 'done').length,
    converting: files.filter((f) => f.status === 'converting').length,
    errors: files.filter((f) => f.status === 'error').length,
    totalOriginalSize: files.reduce((acc, f) => acc + f.originalSize, 0),
    totalOutputSize: files
      .filter((f) => f.outputSize !== null)
      .reduce((acc, f) => acc + (f.outputSize ?? 0), 0),
  };

  return {
    files,
    isConverting,
    isCancelled,
    zipProgress,
    addFiles,
    removeFile,
    clearAll,
    startConversion,
    cancelConversion,
    retryErrors,
    stats,
    setZipProgress,
  };
}
