import { Trash2 } from 'lucide-react';
import type { ConvertedFile } from '../types/converter';
import FileItem from './FileItem';

interface FileListProps {
  files: ConvertedFile[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export default function FileList({ files, onRemove, onClearAll }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <section aria-labelledby="file-list-title" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="file-list-title" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Файли ({files.length})
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
          aria-label="Очистити весь список файлів"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Очистити список
        </button>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <FileItem key={file.id} file={file} onRemove={onRemove} />
        ))}
      </div>
    </section>
  );
}
