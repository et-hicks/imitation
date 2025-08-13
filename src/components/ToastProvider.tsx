"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastContextValue = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const showError = useCallback((msg: string) => {
    setMessage(msg);
    setIsSuccess(false);
  }, []);

  const showSuccess = useCallback((msg: string) => {
    setMessage(msg);
    setIsSuccess(true);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      setMessage(null);
      setIsSuccess(false);
    }, 3000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      {message && (
        <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
          <div className={`max-w-md w-full rounded-md text-white shadow-lg ring-1 ring-black/10 ${
            isSuccess ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <div className="flex items-start gap-3 p-3">
              <div className="mt-0.5">{isSuccess ? '✅' : '⚠️'}</div>
              <div className="text-sm leading-5">{message}</div>
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setIsSuccess(false);
                }}
                className="ml-auto rounded-md px-2 py-1 text-sm hover:bg-white/20"
                aria-label="Close"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}


