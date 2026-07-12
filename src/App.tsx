import { useState, useCallback, useEffect, useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import SettingsPanel from './components/SettingsPanel';
import FileList from './components/FileList';
import StatsCards from './components/StatsCards';
import ActionBar from './components/ActionBar';
import ToastContainer from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { useFileQueue } from './hooks/useFileQueue';
import { useLocalStorage } from './hooks/useLocalStorage';
import { downloadAsZip } from './lib/zipUtils';
import type { ConversionSettings, ToastMessage, ConfirmModalState } from './types/converter';

const DEFAULT_SETTINGS: ConversionSettings = {
  quality: 92,
  maxWidth: null,
  maxHeight: null,
  keepFolderStructure: true,
  autoConvert: true,
  stripExif: true,
};

export default function App() {
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('heic-dark-mode', false);
  const [settings, setSettings] = useLocalStorage<ConversionSettings>(
    'heic-settings',
    DEFAULT_SETTINGS,
  );

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => undefined,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
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
  } = useFileQueue(settings);

  // Apply dark mode to html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const showToast = useCallback(
    (type: ToastMessage['type'], message: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message }]);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // --- Selection handlers ---
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(files.map((f) => f.id)));
  }, [files]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Keep selectedIds in sync when files are removed / cleared
  const validSelectedIds = useMemo(() => {
    const fileIdSet = new Set(files.map((f) => f.id));
    const next = new Set([...selectedIds].filter((id) => fileIdSet.has(id)));
    return next;
  }, [files, selectedIds]);

  const handleFilesSelected = useCallback(
    (entries: { file: File; relativePath: string }[]) => {
      const result = addFiles(entries, (count, proceed) => {
        setConfirmModal({
          visible: true,
          title: 'Багато файлів',
          message: `Ви обрали ${count} файлів. Це може уповільнити браузер. Продовжити?`,
          onConfirm: proceed,
        });
      });

      if (result.overLimit) return;

      if (result.skipped > 0) {
        showToast(
          'warning',
          `Пропущено ${result.skipped} файлів: підтримуються лише HEIC та HEIF.`,
        );
      }
      if (result.duplicates > 0) {
        showToast('info', `${result.duplicates} файлів вже є у списку — пропущено.`);
      }
      if (result.added > 0) {
        showToast(
          'success',
          `Додано ${result.added} ${pluralFiles(result.added)}.${settings.autoConvert ? ' Конвертація розпочата.' : ''}`,
        );
      }
    },
    [addFiles, showToast, settings.autoConvert],
  );

  const handleDownloadAll = useCallback(async () => {
    if (stats.done === 0) return;
    setZipProgress(0);
    try {
      await downloadAsZip(files, settings.keepFolderStructure, (pct) => setZipProgress(pct));
      showToast('success', 'Файли успішно завантажено!');
    } catch (err) {
      showToast('error', `Помилка при створенні архіву: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTimeout(() => setZipProgress(null), 800);
    }
  }, [files, settings.keepFolderStructure, stats.done, setZipProgress, showToast]);

  const handleDownloadSelected = useCallback(async () => {
    const selectedFiles = files.filter((f) => validSelectedIds.has(f.id) && f.status === 'done');
    if (selectedFiles.length === 0) return;
    setZipProgress(0);
    try {
      await downloadAsZip(selectedFiles, settings.keepFolderStructure, (pct) => setZipProgress(pct));
      showToast('success', `Завантажено ${selectedFiles.length} вибраних файлів!`);
    } catch (err) {
      showToast('error', `Помилка при створенні архіву: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTimeout(() => setZipProgress(null), 800);
    }
  }, [files, validSelectedIds, settings.keepFolderStructure, setZipProgress, showToast]);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {/* Privacy notice */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium w-fit mx-auto mb-6">
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Файли обробляються лише у вашому браузері та не завантажуються на сервер</span>
        </div>

        {files.length === 0 ? (
          /* ── Single-column empty state ── */
          <div className="space-y-6">
            <DropZone onFilesSelected={handleFilesSelected} disabled={isConverting} />
            <SettingsPanel settings={settings} onChange={setSettings} />
            <EmptyState />
          </div>
        ) : (
          /* ── Two-column layout ── */
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* LEFT — file list */}
            <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 space-y-4">
              <StatsCards stats={stats} />
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-3">
                  <FileList
                files={files}
                selectedIds={validSelectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onRemove={removeFile}
                onClearAll={clearAll}
              />
                </div>
              </div>
            </div>

            {/* RIGHT — controls */}
            <div className="flex-1 min-w-0 space-y-5">
              <DropZone onFilesSelected={handleFilesSelected} disabled={isConverting} />
              <SettingsPanel settings={settings} onChange={setSettings} />
            </div>

          </div>
        )}
      </main>

      <ActionBar
        files={files}
        stats={stats}
        selectedIds={validSelectedIds}
        isConverting={isConverting}
        isCancelled={isCancelled}
        zipProgress={zipProgress}
        onConvert={startConversion}
        onDownloadAll={handleDownloadAll}
        onDownloadSelected={handleDownloadSelected}
        onCancel={cancelConversion}
        onRetryErrors={retryErrors}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmModal modal={confirmModal} onClose={closeConfirmModal} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8 space-y-2">
      <p className="text-sm text-slate-400 dark:text-slate-500">
        Ще немає файлів. Перетягніть HEIC-фото або скористайтеся кнопками вище.
      </p>
      <p className="text-xs text-slate-300 dark:text-slate-600">
        Найкраще тестувати у Chrome або Edge для повної підтримки вибору папок.
      </p>
    </div>
  );
}

function pluralFiles(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'файл';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'файли';
  return 'файлів';
}
