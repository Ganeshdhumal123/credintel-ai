import { useState, useEffect } from 'react';

const TOAST_STYLES = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
};

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const Toast = ({ message, type = 'info', onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const styles = TOAST_STYLES[type] || TOAST_STYLES.info;
  const icon = TOAST_ICONS[type] || TOAST_ICONS.info;

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-lg border-l-4 shadow-lg max-w-sm animate-fade-in ${styles}`}
      role="alert"
    >
      <span className="font-bold text-lg mt-0.5">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="ml-2 text-lg leading-none opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

// ToastContainer manages multiple toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return { addToast, ToastContainer };
};

export default Toast;
