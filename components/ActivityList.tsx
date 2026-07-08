"use client";

import { Edit2, Trash2 } from "lucide-react";
import { QuickStatusActions } from "@/components/QuickStatusActions";
import { getIconButtonClassName, getInteractiveSurfaceClassName, getSemanticChipClassName } from "@/lib/ui-state-styles";
import type { Activity, ActivityStatus, AppLanguage } from "@/lib/types";
import { activityStatuses } from "@/lib/types";
import { tActivityStatus, tCategory } from "@/lib/i18n";
import { cn, formatDate, getEffectiveActivityStatus } from "@/lib/utils";

interface ActivityListProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ActivityStatus) => void;
  now: number | null;
  language?: AppLanguage;
  timeZone?: string;
}

const statusStyles = {
  "Akan Datang": "upcoming",
  Direncanakan: "neutral",
  Berjalan: "info",
  Selesai: "success",
  Tertunda: "warning",
  Dibatalkan: "neutral"
} as const;

export function ActivityList({ activities, onEdit, onDelete, onStatusChange, now, language = "id", timeZone }: ActivityListProps) {
  const text = {
    empty: language === "id" ? "Tidak ada aktivitas sesuai filter." : "No activities match the current filters.",
    edit: language === "id" ? "Edit" : "Edit",
    delete: language === "id" ? "Hapus" : "Delete"
  };

  if (!activities.length) {
    return (
      <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
        {text.empty}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const effectiveStatus = getEffectiveActivityStatus(activity, now ?? Date.now(), timeZone);

        return (
          <article key={activity.id} className={getInteractiveSurfaceClassName() + " p-4"}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{activity.title}</h2>
                  <span className={getSemanticChipClassName("info")}>{tCategory(activity.category, language)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(activity.date, language, timeZone)} · {activity.startTime} - {activity.endTime}
                </p>
                {activity.notes ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{activity.notes}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {effectiveStatus !== "Selesai" && effectiveStatus !== "Dibatalkan" ? (
                  <QuickStatusActions
                    itemTitle={activity.title}
                    language={language}
                    onComplete={() => onStatusChange(activity.id, "Selesai")}
                    onCancel={() => onStatusChange(activity.id, "Dibatalkan")}
                  />
                ) : null}
                <select value={effectiveStatus} onChange={(event) => onStatusChange(activity.id, event.target.value as ActivityStatus)} className={cn("rounded border-0 px-2 py-2 text-xs font-semibold", getSemanticChipClassName(statusStyles[effectiveStatus]))}>
                  {activityStatuses.map((status) => (
                    <option key={status} value={status}>
                      {tActivityStatus(status, language)}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => onEdit(activity)} className={getIconButtonClassName()} aria-label={`${text.edit} ${activity.title}`}><Edit2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => onDelete(activity.id)} className={getIconButtonClassName("danger")} aria-label={`${text.delete} ${activity.title}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
