"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastContextValue = {
  showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showError = useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      {message && (
        <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
          <div className="max-w-md w-full rounded-md bg-red-600 text-white shadow-lg ring-1 ring-black/10">
            <div className="flex items-start gap-3 p-3">
              <div className="mt-0.5">⚠️</div>
              <div className="text-sm leading-5">{message}</div>
              <button
                type="button"
                onClick={() => setMessage(null)}
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


