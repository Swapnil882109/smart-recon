import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getBorderAndIcon = () => {
    switch (toast.type) {
      case 'success':
        return {
          border: 'border-emerald-500/40 bg-[#0d281e]',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
        };
      case 'error':
        return {
          border: 'border-red-500/40 bg-[#2d1215]',
          icon: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
        };
      case 'warning':
        return {
          border: 'border-amber-500/40 bg-[#2b2111]',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
        };
      default:
        return {
          border: 'border-indigo-500/40 bg-[#161c33]',
          icon: <Info className="w-4 h-4 text-indigo-400 shrink-0" />,
        };
    }
  };

  const style = getBorderAndIcon();

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${style.border}`}
    >
      <div className="mt-0.5">{style.icon}</div>
      <div className="flex-1 overflow-hidden">
        <h4 className="text-xs font-bold text-white">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
