"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useDashboardStore } from "@/lib/dashboard-store";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "warning" | "info";

type ToastInput = {
  key?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
  persistent?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  dismissOnAction?: boolean;
};

type ConfirmTone = "default" | "danger";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type ToastItem = ToastInput & {
  id: number;
  tone: ToastTone;
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type AppFeedbackContextValue = {
  showToast: (input: ToastInput) => number;
  dismissToast: (idOrKey: number | string) => void;
  activeToastCount: number;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const AppFeedbackContext = createContext<AppFeedbackContextValue | null>(null);

const toastToneStyles = {
  success: "border-teal-200 bg-white text-slate-900 dark:border-teal-800 dark:bg-slate-900 dark:text-slate-100",
  warning: "border-amber-200 bg-white text-slate-900 dark:border-amber-800 dark:bg-slate-900 dark:text-slate-100",
  info: "border-blue-200 bg-white text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100"
};

const toastIconStyles = {
  success: "text-teal-700 dark:text-teal-300",
  warning: "text-amber-600 dark:text-amber-300",
  info: "text-blue-700 dark:text-blue-300"
};

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "warning") {
    return <TriangleAlert className={cn("mt-0.5 h-5 w-5 shrink-0", toastIconStyles[tone])} />;
  }

  if (tone === "info") {
    return <Info className={cn("mt-0.5 h-5 w-5 shrink-0", toastIconStyles[tone])} />;
  }

  return <CheckCircle2 className={cn("mt-0.5 h-5 w-5 shrink-0", toastIconStyles[tone])} />;
}

export function AppFeedbackProvider({ children }: { children: ReactNode }) {
  const { settings } = useDashboardStore();
  const language = settings.language;
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const nextToastId = useRef(1);

  const dismissToast = useCallback((idOrKey: number | string) => {
    setToasts((current) => current.filter((item) => item.id !== idOrKey && item.key !== idOrKey));
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = nextToastId.current;
      nextToastId.current += 1;
      const toast: ToastItem = { ...input, id, tone: input.tone || "success" };

      setToasts((current) => [...current.filter((item) => !input.key || item.key !== input.key), toast]);

      if (!input.persistent) {
        window.setTimeout(() => dismissToast(id), input.durationMs ?? 2600);
      }

      return id;
    },
    [dismissToast]
  );

  const confirm = useCallback(
    (options: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        setConfirmState({
          title: options.title,
          description: options.description,
          confirmLabel: options.confirmLabel || (language === "id" ? "Lanjutkan" : "Continue"),
          cancelLabel: options.cancelLabel || (language === "id" ? "Batal" : "Cancel"),
          tone: options.tone || "default",
          resolve
        });
      });
    },
    [language]
  );

  const value = useMemo(() => ({ showToast, dismissToast, activeToastCount: toasts.length, confirm }), [confirm, dismissToast, showToast, toasts.length]);

  function closeConfirm(result: boolean) {
    setConfirmState((current) => {
      if (!current) {
        return null;
      }

      current.resolve(result);
      return null;
    });
  }

  function runToastAction(toast: ToastItem) {
    toast.onAction?.();

    if (toast.dismissOnAction !== false) {
      dismissToast(toast.id);
    }
  }

  return (
    <AppFeedbackContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className={cn("pointer-events-auto flex items-start gap-3 rounded border px-4 py-3 shadow-lg", toastToneStyles[toast.tone])}>
            <ToastIcon tone={toast.tone} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
              {toast.actionLabel && toast.onAction ? (
                <button type="button" onClick={() => runToastAction(toast)} className="mt-2 text-xs font-bold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200">
                  {toast.actionLabel}
                </button>
              ) : null}
            </div>
            {!toast.persistent ? (
              <button type="button" onClick={() => dismissToast(toast.id)} className="-mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label={language === "id" ? "Tutup notifikasi" : "Dismiss notification"}>
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {confirmState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  confirmState.tone === "danger"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200"
                )}
              >
                <TriangleAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{confirmState.title}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{confirmState.description}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => closeConfirm(false)} className="inline-flex items-center rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={cn(
                  "inline-flex items-center rounded px-4 py-2 text-sm font-semibold text-white",
                  confirmState.tone === "danger" ? "bg-rose-700 hover:bg-rose-800" : "bg-teal-700 hover:bg-teal-800"
                )}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppFeedbackContext.Provider>
  );
}

export function useAppFeedback() {
  const value = useContext(AppFeedbackContext);

  if (!value) {
    throw new Error("useAppFeedback must be used inside AppFeedbackProvider");
  }

  return value;
}
