import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: ToastItem["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] space-y-2 pointer-events-none">
        {toasts.map((t) => {
          const colors = {
            success: "bg-status-safe/90 text-white",
            error: "bg-status-danger/90 text-white",
            info: "bg-bg-card/95 text-txt-primary border border-line-primary",
          };
          return (
            <div
              key={t.id}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl animate-slide-up pointer-events-auto ${colors[t.type]}`}
            >
              {t.type === "success" && "✓ "}
              {t.type === "error" && "✗ "}
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
