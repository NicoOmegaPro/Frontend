import { createContext, useContext, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const META = {
  success: { icon: CheckCircle2,  color: 'var(--success)' },
  error:   { icon: XCircle,       color: 'var(--danger)'  },
  warning: { icon: AlertTriangle, color: 'var(--warning)' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const remove = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const { icon: Icon, color } = META[t.type] || META.success;
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 pl-3.5 pr-3 py-3 rounded-xl text-[13.5px] font-medium pointer-events-auto min-w-[260px] max-w-sm fade-up"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <Icon size={17} style={{ color }} className="flex-shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
