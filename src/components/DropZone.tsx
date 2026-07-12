import { useRef, useState, useCallback } from 'react';
import { Upload, FolderOpen, Image } from 'lucide-react';
import { readDirectoryEntry } from '../lib/fileUtils';

interface DropZoneProps {
  onFilesSelected: (entries: { file: File; relativePath: string }[]) => void;
  disabled?: boolean;
}

export default function DropZone({ onFilesSelected, disabled }: DropZoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
      if (disabled) return;

      const results: { file: File; relativePath: string }[] = [];

      const items = Array.from(e.dataTransfer.items);
      const hasFileSystemAccess = items.length > 0 && typeof items[0]?.webkitGetAsEntry === 'function';

      if (hasFileSystemAccess) {
        const entryPromises = items.map(async (item) => {
          const entry = item.webkitGetAsEntry();
          if (!entry) return;

          if (entry.isFile) {
            const fileEntry = entry as FileSystemFileEntry;
            await new Promise<void>((resolve) => {
              fileEntry.file((f) => {
                results.push({ file: f, relativePath: f.name });
                resolve();
              }, () => resolve());
            });
          } else if (entry.isDirectory) {
            const dirResults = await readDirectoryEntry(entry as FileSystemDirectoryEntry);
            results.push(...dirResults);
          }
        });
        await Promise.all(entryPromises);
      } else {
        // Fallback: use plain files from dataTransfer.files
        const rawFiles = Array.from(e.dataTransfer.files);
        rawFiles.forEach((f) => results.push({ file: f, relativePath: f.name }));
      }

      if (results.length > 0) {
        onFilesSelected(results);
      }
    },
    [disabled, onFilesSelected],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawFiles = Array.from(e.target.files ?? []);
      const entries = rawFiles.map((f) => ({
        file: f,
        relativePath: f.name,
      }));
      if (entries.length > 0) onFilesSelected(entries);
      // Reset input so same files can be re-selected
      e.target.value = '';
    },
    [onFilesSelected],
  );

  const handleFolderInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawFiles = Array.from(e.target.files ?? []);
      const entries = rawFiles.map((f) => ({
        file: f,
        relativePath: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
      }));
      if (entries.length > 0) onFilesSelected(entries);
      e.target.value = '';
    },
    [onFilesSelected],
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="region"
      aria-label="Зона перетягування файлів"
      className={[
        'relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-default',
        'flex flex-col items-center justify-center gap-4 py-14 px-8 text-center',
        isDraggingOver
          ? 'border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30 scale-[1.01] shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-300 dark:hover:border-indigo-600',
        disabled ? 'opacity-60 pointer-events-none' : '',
      ].join(' ')}
    >
      {/* Drop overlay indicator */}
      {isDraggingOver && (
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 pointer-events-none" />
      )}

      {/* Icon */}
      <div
        className={[
          'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200',
          isDraggingOver
            ? 'bg-indigo-100 dark:bg-indigo-900/50 scale-110'
            : 'bg-slate-100 dark:bg-slate-800',
        ].join(' ')}
      >
        {isDraggingOver ? (
          <Upload className="w-8 h-8 text-indigo-500 animate-bounce" />
        ) : (
          <Image className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        )}
      </div>

      {/* Text */}
      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
          {isDraggingOver
            ? 'Відпустіть файли тут!'
            : 'Перетягніть HEIC-файли або папку сюди'}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Або виберіть файли чи цілу папку з комп'ютера
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-medium transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          aria-label="Відкрити діалог вибору фото"
        >
          <Upload className="w-4 h-4" />
          Вибрати фото
        </button>
        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          aria-label="Відкрити діалог вибору папки"
        >
          <FolderOpen className="w-4 h-4" />
          Вибрати папку
        </button>
      </div>

      {/* Hint */}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Підтримуються .HEIC та .HEIF&nbsp;&nbsp;·&nbsp;&nbsp;Файли не залишають ваш пристрій
      </p>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        id="file-input"
        multiple
        accept=".heic,.heif,image/heic,image/heif"
        className="sr-only"
        onChange={handleFileInputChange}
        aria-label="Вибір HEIC файлів"
      />
      <input
        ref={folderInputRef}
        type="file"
        id="folder-input"
        multiple
        // @ts-expect-error -- non-standard attribute
        webkitdirectory=""
        directory=""
        className="sr-only"
        onChange={handleFolderInputChange}
        aria-label="Вибір папки з фотографіями"
      />
    </div>
  );
}
