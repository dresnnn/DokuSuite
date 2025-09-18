import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';

export type ToastType = 'success' | 'error';
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutHandles = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => () => {
    timeoutHandles.current.forEach((handle) => clearTimeout(handle));
    timeoutHandles.current.clear();
  }, []);

  const createToastId = useCallback(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = createToastId();
    setToasts((prev) => [...prev, { id, type, message }]);
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutHandles.current.delete(id);
    }, 3000);
    timeoutHandles.current.set(id, timeout);
  }, [createToastId]);

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

