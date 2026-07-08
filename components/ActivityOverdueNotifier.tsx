"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { tCategory } from "@/lib/i18n";
import { useDashboardStore } from "@/lib/dashboard-store";
import { formatDate, formatTimeRange, getOverdueActivities, nowIso } from "@/lib/utils";
import { useNow } from "@/lib/use-now";
import type { ActivityStatus } from "@/lib/types";

const overdueToastKey = "overdue-activities";

export function ActivityOverdueNotifier() {
  const { activities, setActivities, settings } = useDashboardStore();
  const { dismissToast, showToast } = useAppFeedback();
  const language = settings.language;
  const now = useNow(30000);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toastSuppressed, setToastSuppressed] = useState(false);
  const overdueActivities = useMemo(() => (now === null ? [] : getOverdueActivities(activities, now, settings.timeZone)), [activities, now, settings.timeZone]);
  const overdueSignature = overdueActivities.map((activity) => activity.id).join("|");

  const text = {
    one: language === "id" ? "melewati waktu yang ditentukan." : "has passed its scheduled time.",
    many: language === "id" ? "aktivitas melewati waktu yang ditentukan." : "activities have passed their scheduled time.",
    complete: language === "id" ? "Selesai" : "Complete",
    cancel: language === "id" ? "Dibatalkan" : "Canceled",
    view: language === "id" ? "Lihat" : "View",
    title: language === "id" ? "Aktivitas perlu tindakan" : "Activities need attention",
    description: language === "id" ? "Pilih `Selesai` jika aktivitas sudah selesai atau `Dibatalkan` jika rencana tidak dijalankan." : "Choose `Complete` if the activity finished or `Canceled` if the plan will not be carried out.",
    close: language === "id" ? "Tutup daftar aktivitas lewat waktu" : "Close overdue activity list"
  };

  const updateActivityStatus = useCallback(
    (id: string, status: ActivityStatus) => {
      const timestamp = nowIso();
      setActivities((current) => current.map((activity) => (activity.id === id ? { ...activity, status, updatedAt: timestamp } : activity)));
    },
    [setActivities]
  );

  useEffect(() => {
    if (now === null) {
      return;
    }

    if (!overdueActivities.length) {
      dismissToast(overdueToastKey);
      setPanelOpen(false);
      setToastSuppressed(false);
      return;
    }

    if (panelOpen || toastSuppressed) {
      dismissToast(overdueToastKey);
      return;
    }

    if (overdueActivities.length === 1) {
      const activity = overdueActivities[0];
      showToast({
        key: overdueToastKey,
        message: `${language === "id" ? "Aktivitas" : "Activity"} "${activity.title}" ${text.one}`,
        tone: "warning",
        persistent: true,
        actionLabel: text.view,
        dismissOnAction: false,
        onAction: () => {
          dismissToast(overdueToastKey);
          setToastSuppressed(true);
          setPanelOpen(true);
        }
      });
      return;
    }

    showToast({
      key: overdueToastKey,
      message: `${overdueActivities.length} ${text.many}`,
      tone: "warning",
      persistent: true,
      actionLabel: text.view,
      dismissOnAction: false,
      onAction: () => {
          dismissToast(overdueToastKey);
          setToastSuppressed(true);
          setPanelOpen(true);
        }
    });
  }, [dismissToast, language, now, overdueActivities, overdueSignature, panelOpen, showToast, text.many, text.one, text.view, toastSuppressed]);

  if (!panelOpen || !overdueActivities.length) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-md rounded border border-amber-200 bg-white p-4 shadow-xl dark:border-amber-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-950 dark:text-slate-50">{text.title}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{text.description}</p>
        </div>
        <button type="button" onClick={() => { setPanelOpen(false); setToastSuppressed(false); }} className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label={text.close}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
        {overdueActivities.map((activity) => (
          <div key={activity.id} className="rounded border border-slate-200 p-3 dark:border-slate-700">
            <p className="font-medium text-slate-950 dark:text-slate-50">{activity.title}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatDate(activity.date, language, settings.timeZone)} · {formatTimeRange(activity.startTime, activity.endTime)} · {tCategory(activity.category, language)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => updateActivityStatus(activity.id, "Selesai")} className="rounded bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800">
                {text.complete}
              </button>
              <button type="button" onClick={() => updateActivityStatus(activity.id, "Dibatalkan")} className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                {text.cancel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
