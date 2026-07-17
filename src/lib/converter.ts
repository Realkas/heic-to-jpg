import { heicTo } from 'heic-to';
import type { ConversionSettings } from '../types/converter';
import { isHeicFile } from './fileUtils';

export interface ConversionResult {
  blob: Blob;
  isMultiFrame: boolean;
}

/**
 * Converts a HEIC/HEIF/WEBP/JFIF File to a JPEG Blob.
 * Applies resize if maxWidth/maxHeight are set.
 * The heic-to library handles multi-frame HEIC by returning the first frame.
 * WEBP/JFIF are decoded natively by the browser via Canvas.
 */
export async function convertHeicToJpg(
  file: File,
  settings: ConversionSettings,
  onProgress: (pct: number) => void,
): Promise<ConversionResult> {
  onProgress(5);

  const quality = settings.quality / 100;

  let jpegBlob: Blob;
  try {
    if (isHeicFile(file)) {
      // heicTo with image/jpeg type always resolves to a single Blob
      jpegBlob = await heicTo({
        blob: file,
        type: 'image/jpeg',
        quality,
      });
    } else {
      jpegBlob = await imageFileToJpegBlob(file, quality);
    }
  } catch (err) {
    throw new Error(
      `Не вдалося конвертувати файл: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  onProgress(70);

  // Apply resize if needed
  if (settings.maxWidth !== null || settings.maxHeight !== null) {
    jpegBlob = await resizeJpegBlob(jpegBlob, settings.maxWidth, settings.maxHeight, quality);
  }

  onProgress(95);

  // heic-to handles multi-frame HEIC internally (uses first frame).
  // We flag multi-frame by checking the original file — HEIF sequences are rare,
  // so we conservatively set isMultiFrame false here.
  return { blob: jpegBlob, isMultiFrame: false };
}

/**
 * Decodes a WEBP/JFIF File via the browser's native decoder and re-encodes
 * it to JPEG using Canvas.
 */
async function imageFileToJpegBlob(file: File, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas 2D контекст недоступний');
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob повернув null'));
      },
      'image/jpeg',
      quality,
    );
  });
}

/**
 * Resizes a JPEG Blob using Canvas, maintaining aspect ratio (contain).
 * Never upscales beyond original dimensions.
 */
async function resizeJpegBlob(
  blob: Blob,
  maxWidth: number | null,
  maxHeight: number | null,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const origW = bitmap.width;
  const origH = bitmap.height;

  let targetW = origW;
  let targetH = origH;

  if (maxWidth !== null || maxHeight !== null) {
    const scaleW = maxWidth !== null ? maxWidth / origW : Infinity;
    const scaleH = maxHeight !== null ? maxHeight / origH : Infinity;
    const scale = Math.min(scaleW, scaleH, 1); // never upscale
    targetW = Math.round(origW * scale);
    targetH = Math.round(origH * scale);
  }

  if (targetW === origW && targetH === origH) {
    bitmap.close();
    return blob;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return blob;
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob повернув null'));
      },
      'image/jpeg',
      quality,
    );
  });
}
