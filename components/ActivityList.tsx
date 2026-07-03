"use client";

import { Edit2, Trash2 } from "lucide-react";
import type { Activity, ActivityStatus } from "@/lib/types";
import { activityStatuses } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

interface ActivityListProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ActivityStatus) => void;
  onComplete: (id: string) => void;
}

const statusStyles = {
  Direncanakan: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  Berjalan: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-100",
  Selesai: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-100",
  Tertunda: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-100"
};

export function ActivityList({ activities, onEdit, onDelete, onStatusChange, onComplete }: ActivityListProps) {
  if (!activities.length) {
    return (
      <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Tidak ada aktivitas sesuai filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <article key={activity.id} className="rounded border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{activity.title}</h2>
                <span className="rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-100">
                  {activity.category}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {formatDate(activity.date)} · {activity.startTime} - {activity.endTime}
              </p>
              {activity.notes ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{activity.notes}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-900 dark:text-teal-100 dark:hover:bg-teal-950/50">
                <input type="checkbox" checked={activity.status === "Selesai"} disabled={activity.status === "Selesai"} onChange={() => onComplete(activity.id)} className="h-4 w-4 accent-teal-700" />
                <span>Selesai</span>
              </label>
              <select value={activity.status} onChange={(event) => onStatusChange(activity.id, event.target.value as ActivityStatus)} className={cn("rounded border-0 px-2 py-2 text-xs font-semibold", statusStyles[activity.status])}>
                {activityStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => onEdit(activity)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" aria-label={`Edit ${activity.title}`}><Edit2 className="h-4 w-4" /></button>
              <button type="button" onClick={() => onDelete(activity.id)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/50" aria-label={`Hapus ${activity.title}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
