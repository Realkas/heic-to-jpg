/**
 * Checks if a File has a HEIC/HEIF extension (case-insensitive).
 * We rely on extension rather than MIME type because Windows often
 * sends wrong/empty MIME for HEIC files.
 */
export function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif');
}

/**
 * Checks if a File has a WEBP/JFIF extension (case-insensitive).
 */
export function isWebpOrJfifFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.webp') || name.endsWith('.jfif');
}

/**
 * Checks if a File is one of the supported input formats (HEIC/HEIF/WEBP/JFIF).
 */
export function isSupportedFile(file: File): boolean {
  return isHeicFile(file) || isWebpOrJfifFile(file);
}

/**
 * Builds a deduplication key from file identity fields.
 */
export function fileDedupeKey(file: File, relativePath: string): string {
  return `${file.name}__${file.size}__${file.lastModified}__${relativePath}`;
}

/**
 * Formats bytes into human-readable string.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(decimals))} ${sizes[index] ?? 'Б'}`;
}

/**
 * Generates output JPG filename from the original HEIC name.
 */
export function buildOutputFileName(originalName: string): string {
  return originalName.replace(/\.(heic|heif|webp|jfif)$/i, '.jpg');
}

/**
 * Ensures unique filenames by appending _1, _2, etc. when collisions occur.
 */
export function uniquifyFileName(name: string, usedNames: Set<string>): string {
  if (!usedNames.has(name)) return name;

  const dotIndex = name.lastIndexOf('.');
  const base = dotIndex > -1 ? name.slice(0, dotIndex) : name;
  const ext = dotIndex > -1 ? name.slice(dotIndex) : '';

  let counter = 1;
  let candidate = `${base}_${counter}${ext}`;
  while (usedNames.has(candidate)) {
    counter++;
    candidate = `${base}_${counter}${ext}`;
  }
  return candidate;
}

/**
 * Generates a short unique id.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Recursively reads a FileSystemDirectoryEntry into a flat list of File objects.
 * Returns [] if the DataTransfer API doesn't expose filesystem entries.
 */
export async function readDirectoryEntry(
  entry: FileSystemDirectoryEntry,
): Promise<{ file: File; relativePath: string }[]> {
  const results: { file: File; relativePath: string }[] = [];

  const readBatch = (
    reader: FileSystemDirectoryReader,
  ): Promise<FileSystemEntry[]> =>
    new Promise((resolve) => reader.readEntries(resolve, () => resolve([])));

  const reader = entry.createReader();
  let batch: FileSystemEntry[] = [];

  do {
    batch = await readBatch(reader);
    for (const childEntry of batch) {
      if (childEntry.isFile) {
        const file = await fileEntryToFile(childEntry as FileSystemFileEntry);
        if (file) {
          results.push({ file, relativePath: childEntry.fullPath.slice(1) });
        }
      } else if (childEntry.isDirectory) {
        const subResults = await readDirectoryEntry(
          childEntry as FileSystemDirectoryEntry,
        );
        results.push(...subResults);
      }
    }
  } while (batch.length > 0);

  return results;
}

function fileEntryToFile(entry: FileSystemFileEntry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file(
      (f) => resolve(f),
      () => resolve(null),
    );
  });
}

/**
 * Formats current date-time as YYYY-MM-DD-HHmm for ZIP filename.
 */
export function formatDateTimeForFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

/**
 * Computes compression percentage.
 */
export function compressionPercent(original: number, output: number): number {
  if (original === 0) return 0;
  return Math.round(((original - output) / original) * 100);
}
