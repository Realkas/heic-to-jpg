import { useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types/converter';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Сповіщення"
      className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const dismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  useEffect(() => {
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  const config = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-200 dark:border-emerald-800',
      bg: 'bg-white dark:bg-slate-900',
      iconColor: 'text-emerald-500',
      bar: 'bg-emerald-500',
    },
    error: {
      icon: XCircle,
      border: 'border-red-200 dark:border-red-800',
      bg: 'bg-white dark:bg-slate-900',
      iconColor: 'text-red-500',
      bar: 'bg-red-500',
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-200 dark:border-amber-800',
      bg: 'bg-white dark:bg-slate-900',
      iconColor: 'text-amber-500',
      bar: 'bg-amber-500',
    },
    info: {
      icon: Info,
      border: 'border-blue-200 dark:border-blue-800',
      bg: 'bg-white dark:bg-slate-900',
      iconColor: 'text-blue-500',
      bar: 'bg-blue-500',
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={[
        'pointer-events-auto relative flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg',
        config.border,
        config.bg,
        'animate-in slide-in-from-right-8 duration-300',
      ].join(' ')}
    >
      {/* Accent bar */}
      <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${config.bar}`} />

      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
      <p className="flex-1 text-sm text-slate-700 dark:text-slate-200 leading-snug pr-2">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Закрити сповіщення"
        className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
