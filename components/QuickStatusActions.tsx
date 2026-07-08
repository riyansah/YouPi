"use client";

import { Ban, CheckCircle2 } from "lucide-react";
import { getOutlineButtonClassName } from "@/lib/ui-state-styles";
import type { AppLanguage } from "@/lib/types";

interface QuickStatusActionsProps {
  itemTitle: string;
  language?: AppLanguage;
  onComplete: () => void;
  onCancel: () => void;
}

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
        className={getOutlineButtonClassName("brand") + " gap-2 px-3 py-2 text-xs"}
        aria-label={`${text.markComplete} ${itemTitle} ${text.complete.toLowerCase()}`}
      >
        <CheckCircle2 className="h-4 w-4" />
        <span>{text.complete}</span>
      </button>
      <button
        type="button"
        onClick={onCancel}
        className={getOutlineButtonClassName("danger") + " gap-2 px-3 py-2 text-xs"}
        aria-label={`${text.markCancel} ${itemTitle} ${text.cancel.toLowerCase()}`}
      >
        <Ban className="h-4 w-4" />
        <span>{text.cancel}</span>
      </button>
    </>
  );
}
