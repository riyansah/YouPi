"use client";

import { Ban, CheckCircle2 } from "lucide-react";
import type { AppLanguage } from "@/lib/types";

interface QuickStatusActionsProps {
  itemTitle: string;
  language?: AppLanguage;
  onComplete: () => void;
  onCancel: () => void;
}

const actionButtonClassName =
  "inline-flex items-center gap-2 rounded border px-3 py-2 text-xs font-semibold transition";

export function QuickStatusActions({ itemTitle, language = "id", onComplete, onCancel }: QuickStatusActionsProps) {
  const text = {
    complete: language === "id" ? "Selesai" : "Complete",
    cancel: language === "id" ? "Dibatalkan" : "Canceled",
    markComplete: language === "id" ? "Tandai" : "Mark",
    markCancel: language === "id" ? "Tandai" : "Mark"
  };

  return (
    <>
      <button
        type="button"
        onClick={onComplete}
        className={`${actionButtonClassName} border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-900 dark:text-teal-100 dark:hover:bg-teal-950/50`}
        aria-label={`${text.markComplete} ${itemTitle} ${text.complete.toLowerCase()}`}
      >
        <CheckCircle2 className="h-4 w-4" />
        <span>{text.complete}</span>
      </button>
      <button
        type="button"
        onClick={onCancel}
        className={`${actionButtonClassName} border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800`}
        aria-label={`${text.markCancel} ${itemTitle} ${text.cancel.toLowerCase()}`}
      >
        <Ban className="h-4 w-4" />
        <span>{text.cancel}</span>
      </button>
    </>
  );
}
