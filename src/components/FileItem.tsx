import { Download, Trash2, XCircle, CheckCircle2, Image } from 'lucide-react';
import type { ConvertedFile } from '../types/converter';
import { formatBytes } from '../lib/fileUtils';
import { downloadSingleFile } from '../lib/zipUtils';

interface FileItemProps {
  file: ConvertedFile;
  onRemove: (id: string) => void;
}

export default function FileItem({ file, onRemove }: FileItemProps) {
  return (
    <div
      className={[
        'group flex items-start gap-3 p-3 rounded-xl border transition-all',
        file.status === 'done'
          ? 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20'
          : file.status === 'error'
            ? 'border-red-100 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20'
            : file.status === 'converting'
              ? 'border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20'
              : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900',
      ].join(' ')}
    >
      {/* Thumbnail / Placeholder */}
      <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
        {file.previewUrl ? (
          <img
            src={file.previewUrl}
            alt={`Прев'ю ${file.outputFileName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Image className="w-6 h-6 text-slate-300 dark:text-slate-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate"
              title={file.outputFileName}
            >
              {file.outputFileName}
            </p>
            {file.relativePath && file.relativePath !== file.originalName && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate" title={file.relativePath}>
                {file.relativePath}
              </p>
            )}
            {file.isMultiFrame && (
              <span className="inline-block text-[11px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                Перший кадр
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {file.status === 'done' && (
              <button
                type="button"
                onClick={() => downloadSingleFile(file)}
                aria-label={`Завантажити ${file.outputFileName}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(file.id)}
              aria-label={`Видалити ${file.originalName}`}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            {formatBytes(file.originalSize)}
          </span>

          {file.status === 'done' && file.outputSize !== null && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
              → {formatBytes(file.outputSize)}
            </span>
          )}

          <StatusBadge file={file} />
        </div>

        {/* Progress bar */}
        {file.status === 'converting' && (
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}

        {/* Error message */}
        {file.status === 'error' && file.errorMessage && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1 line-clamp-2">
            {file.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ file }: { file: ConvertedFile }) {
  if (file.status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Готово
      </span>
    );
  }
  if (file.status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-red-400 font-medium">
        <XCircle className="w-3.5 h-3.5" />
        Помилка
      </span>
    );
  }
  if (file.status === 'converting') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        Конвертую… {file.progress}%
      </span>
    );
  }
  return (
    <span className="text-xs text-slate-400 dark:text-slate-500">
      У черзі
    </span>
  );
}
