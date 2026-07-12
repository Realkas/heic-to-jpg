export type FileStatus = 'queued' | 'converting' | 'done' | 'error';

export interface ConvertedFile {
  id: string;
  originalFile: File;
  originalName: string;
  relativePath: string;
  originalSize: number;
  status: FileStatus;
  progress: number;
  outputBlob: Blob | null;
  outputFileName: string;
  outputSize: number | null;
  errorMessage: string | null;
  previewUrl: string | null;
  isMultiFrame: boolean;
}

export interface ConversionSettings {
  quality: number;          // 50–100
  maxWidth: number | null;
  maxHeight: number | null;
  keepFolderStructure: boolean;
  autoConvert: boolean;
  stripExif: boolean;
}

export interface StatsData {
  total: number;
  done: number;
  converting: number;
  errors: number;
  totalOriginalSize: number;
  totalOutputSize: number;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface ConfirmModalState {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}
