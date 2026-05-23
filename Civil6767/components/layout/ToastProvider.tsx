'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode
} from 'react';

type ToastType = 'info' | 'success' | 'error' | 'warning';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({
  toast: () => {}
});

export function useToast() {
  return useContext(ToastContext);
}

const ICON: Record<ToastType, string> = {
  info: 'info',
  success: 'check_circle',
  error: 'error',
  warning: 'warning'
};

const STYLE: Record<ToastType, string> = {
  info: 'border-primary/30 bg-primary/5 text-primary-dark',
  success: 'border-primary/30 bg-primary/10 text-primary-dark',
  error: 'border-critical/30 bg-critical/5 text-critical',
  warning: 'border-amber-500/30 bg-amber-50 text-amber-700'
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-14 right-4 z-[200] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded border px-4 py-2.5 shadow-xl backdrop-blur-sm animate-slide-in-right ${STYLE[t.type]}`}
          >
            <span className="material-symbols-outlined text-base">
              {ICON[t.type]}
            </span>
            <span className="font-headline text-xs font-semibold">
              {t.message}
            </span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="ml-2 material-symbols-outlined text-sm opacity-60 hover:opacity-100"
            >
              close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
