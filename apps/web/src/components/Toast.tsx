import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

export type ToastType = 'success' | 'error';
export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div aria-live="assertive" style={{ position: 'fixed', top: 10, right: 10 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            style={{
              marginBottom: '0.5rem',
              padding: '0.5rem',
              background: t.type === 'error' ? '#fdd' : '#dfd',
              border: '1px solid',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

