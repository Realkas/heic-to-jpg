import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ConvertedFile } from '../types/converter';
import { formatDateTimeForFilename } from './fileUtils';

export interface ZipProgress {
  percent: number;
  done: boolean;
}

/**
 * Downloads a single JPG file directly via Blob URL.
 */
export function downloadSingleFile(file: ConvertedFile): void {
  if (!file.outputBlob) return;
  const url = URL.createObjectURL(file.outputBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.outputFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Builds a ZIP archive from done files and downloads it.
 */
export async function downloadAsZip(
  files: ConvertedFile[],
  keepFolderStructure: boolean,
  onProgress: (pct: number) => void,
): Promise<void> {
  const doneFiles = files.filter((f) => f.status === 'done' && f.outputBlob !== null);
  if (doneFiles.length === 0) return;

  if (doneFiles.length === 1) {
    downloadSingleFile(doneFiles[0]!);
    onProgress(100);
    return;
  }

  const zip = new JSZip();

  // Build conversion report
  const allErrors = files
    .filter((f) => f.status === 'error')
    .map((f) => `  - ${f.originalName}: ${f.errorMessage ?? 'невідома помилка'}`);

  const report = [
    'HEIC/WEBP/JFIF → JPG Conversion Report',
    '='.repeat(40),
    `Дата: ${new Date().toLocaleString('uk-UA')}`,
    '',
    `Успішно конвертовано: ${doneFiles.length}`,
    `Помилки: ${files.filter((f) => f.status === 'error').length}`,
    `Пропущено (непідтримуваний формат): 0`,
    '',
    ...(allErrors.length > 0
      ? ['Помилки:', ...allErrors]
      : ['Помилок немає.']),
  ].join('\n');

  zip.file('conversion-report.txt', report);

  // Track used paths to avoid collision inside ZIP
  const usedPaths = new Set<string>();

  for (const file of doneFiles) {
    if (!file.outputBlob) continue;

    let zipPath: string;
    if (keepFolderStructure && file.relativePath) {
      // Replace the HEIC extension in the relative path with .jpg
      zipPath = file.relativePath.replace(/\.(heic|heif|webp|jfif)$/i, '.jpg');
    } else {
      zipPath = file.outputFileName;
    }

    // Deduplicate path inside zip
    if (usedPaths.has(zipPath)) {
      const dotIdx = zipPath.lastIndexOf('.');
      const base = dotIdx > -1 ? zipPath.slice(0, dotIdx) : zipPath;
      const ext = dotIdx > -1 ? zipPath.slice(dotIdx) : '';
      let counter = 1;
      let candidate = `${base}_${counter}${ext}`;
      while (usedPaths.has(candidate)) {
        counter++;
        candidate = `${base}_${counter}${ext}`;
      }
      zipPath = candidate;
    }
    usedPaths.add(zipPath);

    const arrayBuffer = await file.outputBlob.arrayBuffer();
    zip.file(zipPath, arrayBuffer);
  }

  const zipName = `heic-to-jpg-${formatDateTimeForFilename()}.zip`;

  const zipBlob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } },
    (meta) => onProgress(Math.round(meta.percent)),
  );

  saveAs(zipBlob, zipName);
}
