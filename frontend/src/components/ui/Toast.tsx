'use client';

import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from 'react';
import { clsx } from 'clsx';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id:      string;
  message: string;
  type:    ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
  warn:    (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 4500);
  }, [remove]);

  const value: ToastContextValue = {
    toast:   add,
    success: (m) => add(m, 'success'),
    error:   (m) => add(m, 'error'),
    info:    (m) => add(m, 'info'),
    warn:    (m) => add(m, 'warning'),
  };

  const ICONS: Record<ToastType, ReactNode> = {
    success: <CheckCircle size={16} />,
    error:   <XCircle    size={16} />,
    info:    <Info       size={16} />,
    warning: <AlertTriangle size={16} />,
  };

  const STYLES: Record<ToastType, string> = {
    success: 'bg-[var(--success-subtle)] text-[var(--success-text)]  border-[var(--success)]',
    error:   'bg-[var(--danger-subtle)]  text-[var(--danger-text)]   border-[var(--danger)]',
    info:    'bg-[var(--brand-subtle)]   text-[var(--brand-text)]    border-[var(--brand)]',
    warning: 'bg-[var(--warning-subtle)] text-[var(--warning-text)]  border-[var(--warning)]',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            className={clsx(
              'pointer-events-auto flex items-center gap-3',
              'min-w-[280px] max-w-[360px] rounded-[var(--radius-lg)]',
              'border px-4 py-3 text-sm font-medium',
              'shadow-[var(--shadow-md)]',
              'animate-in slide-in-from-right-5 fade-in duration-200',
              STYLES[t.type]
            )}
            style={{
              animation: 'toast-in 0.2s var(--ease-spring) forwards',
            }}
          >
            <span className="shrink-0">{ICONS[t.type]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(16px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
