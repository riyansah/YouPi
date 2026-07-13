"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useDashboardStore } from "@/lib/dashboard-store";
import { cn } from "@/lib/utils";
import { getFeedbackPanelClassName, getOutlineButtonClassName, getSemanticToneClassName, getSolidButtonClassName } from "@/lib/ui-state-styles";

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
  success: "success",
  warning: "warning",
  info: "info"
} as const;

const toastIconStyles = {
  success: "text-emerald-700 dark:text-emerald-200",
  warning: "text-amber-700 dark:text-amber-200",
  info: "text-blue-700 dark:text-blue-200"
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

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-full max-w-sm flex-col gap-3 px-4 sm:left-auto sm:right-4 sm:mx-0 sm:px-0 lg:bottom-4">
        {toasts.map((toast) => (
          <div key={toast.id} className={cn(getFeedbackPanelClassName("toast"), getSemanticToneClassName(toastToneStyles[toast.tone]), "pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 text-left")}>
            <ToastIcon tone={toast.tone} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{toast.message}</p>
              {toast.actionLabel && toast.onAction ? (
                <button type="button" onClick={() => runToastAction(toast)} className="mt-2 text-xs font-bold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200">
                  {toast.actionLabel}
                </button>
              ) : null}
            </div>
            {!toast.persistent ? (
              <button type="button" onClick={() => dismissToast(toast.id)} className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label={language === "id" ? "Tutup notifikasi" : "Dismiss notification"}>
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {confirmState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className={getFeedbackPanelClassName("modal") + " w-full max-w-md"}>
            <div className="flex items-start gap-3">
              <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full", confirmState.tone === "danger" ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-100" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-100")}>
                <TriangleAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{confirmState.title}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{confirmState.description}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => closeConfirm(false)} className={getOutlineButtonClassName()}>
                {confirmState.cancelLabel}
              </button>
              <button type="button" onClick={() => closeConfirm(true)} className={getSolidButtonClassName(confirmState.tone === "danger" ? "danger" : "brand")}>
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
