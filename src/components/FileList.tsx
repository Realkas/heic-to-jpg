import { Trash2, CheckSquare, Square, MinusSquare } from 'lucide-react';
import type { ConvertedFile } from '../types/converter';
import FileItem from './FileItem';

interface FileListProps {
  files: ConvertedFile[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export default function FileList({
  files,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onRemove,
  onClearAll,
}: FileListProps) {
  if (files.length === 0) return null;

  const allSelected = files.length > 0 && selectedIds.size === files.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < files.length;

  const handleToggleAll = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <section aria-labelledby="file-list-title" className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {/* Select all toggle */}
          <button
            type="button"
            onClick={handleToggleAll}
            aria-label={allSelected ? 'Зняти виділення з усіх' : 'Вибрати всі'}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-500" />
            ) : someSelected ? (
              <MinusSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {allSelected ? 'Зняти всі' : 'Вибрати всі'}
          </button>

          <h2 id="file-list-title" className="text-xs text-slate-400 dark:text-slate-500">
            {selectedIds.size > 0
              ? `${selectedIds.size} з ${files.length} вибрано`
              : `${files.length} файлів`}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
          aria-label="Очистити весь список файлів"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Очистити
        </button>
      </div>

      {/* File cards */}
      <div className="space-y-1.5">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            selected={selectedIds.has(file.id)}
            onToggleSelect={onToggleSelect}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}
