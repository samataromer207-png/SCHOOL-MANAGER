import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function Toast({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void; key?: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <Info className="w-5 h-5 text-amber-500 shrink-0" />,
  };

  const borderStyles = {
    success: "border-emerald-500/20 bg-emerald-50/90 text-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-100",
    error: "border-rose-500/20 bg-rose-50/90 text-rose-900 dark:bg-rose-950/90 dark:text-rose-100",
    warning: "border-amber-500/20 bg-amber-50/90 text-amber-900 dark:bg-amber-950/90 dark:text-amber-100",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg animate-fade-in ${borderStyles[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-sm font-medium leading-tight">
        {toast.message}
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
