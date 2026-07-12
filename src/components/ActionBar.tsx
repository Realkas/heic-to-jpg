import { Download, FileArchive, XCircle, RefreshCw } from 'lucide-react';
import type { ConvertedFile, StatsData } from '../types/converter';

interface ActionBarProps {
  files: ConvertedFile[];
  stats: StatsData;
  selectedIds: Set<string>;
  isConverting: boolean;
  isCancelled: boolean;
  zipProgress: number | null;
  onConvert: () => void;
  onDownloadAll: () => void;
  onDownloadSelected: () => void;
  onCancel: () => void;
  onRetryErrors: () => void;
}

export default function ActionBar({
  files,
  stats,
  selectedIds,
  isConverting,
  isCancelled,
  zipProgress,
  onConvert,
  onDownloadAll,
  onDownloadSelected,
  onCancel,
  onRetryErrors,
}: ActionBarProps) {
  if (files.length === 0) return null;

  const queued = files.filter((f) => f.status === 'queued').length;
  const canConvert = queued > 0 && !isConverting;
  const canDownloadAll = stats.done > 0;
  const hasErrors = stats.errors > 0;

  // Count how many selected files are 'done'
  const selectedDoneCount = files.filter(
    (f) => selectedIds.has(f.id) && f.status === 'done',
  ).length;
  const canDownloadSelected = selectedDoneCount > 0;

  return (
    <div className="sticky bottom-0 z-30 border-t border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-4 sm:px-6 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">

        {/* Left: convert / cancel / retry */}
        <div className="flex items-center gap-2 flex-wrap">
          {isConverting ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
            >
              <XCircle className="w-4 h-4" />
              Скасувати
            </button>
          ) : (
            <button
              type="button"
              onClick={onConvert}
              disabled={!canConvert}
              className={[
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                canConvert
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-indigo-900/40'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed',
              ].join(' ')}
              aria-label={`Конвертувати ${queued} файлів`}
            >
              <RefreshCw className="w-4 h-4" />
              Конвертувати {queued > 0 ? `${queued} ` : ''}фото
            </button>
          )}

          {isCancelled && queued > 0 && (
            <button
              type="button"
              onClick={onConvert}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all active:scale-95"
            >
              Продовжити
            </button>
          )}

          {hasErrors && !isConverting && (
            <button
              type="button"
              onClick={onRetryErrors}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Повторити помилкові ({stats.errors})
            </button>
          )}
        </div>

        {/* Right: download */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* ZIP progress */}
          {zipProgress !== null && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <FileArchive className="w-4 h-4" />
              <span>Архів: {zipProgress}%</span>
              <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-200"
                  style={{ width: `${zipProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Download selected */}
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={onDownloadSelected}
              disabled={!canDownloadSelected || zipProgress !== null}
              className={[
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                canDownloadSelected && zipProgress === null
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed',
              ].join(' ')}
              aria-label={`Завантажити ${selectedDoneCount} вибраних JPG`}
            >
              <Download className="w-4 h-4" />
              Завантажити вибрані ({selectedDoneCount})
            </button>
          )}

          {/* Download all */}
          <button
            type="button"
            onClick={onDownloadAll}
            disabled={!canDownloadAll || zipProgress !== null}
            className={[
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
              canDownloadAll && zipProgress === null
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed',
            ].join(' ')}
            aria-label={`Завантажити ${stats.done} готових JPG`}
          >
            <Download className="w-4 h-4" />
            {stats.done === 1 ? 'Завантажити JPG' : `Завантажити всі (${stats.done})`}
          </button>
        </div>
      </div>
    </div>
  );
}
