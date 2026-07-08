"use client";

import { Edit2, Trash2 } from "lucide-react";
import { QuickStatusActions } from "@/components/QuickStatusActions";
import { getCountdownChipClassName, getIconButtonClassName, getSemanticChipClassName } from "@/lib/ui-state-styles";
import type { Task, TaskStatus, AppLanguage } from "@/lib/types";
import { taskStatuses } from "@/lib/types";
import { tPriority, tTaskStatus } from "@/lib/i18n";
import { cn, formatDate, formatTimeRange, getEffectiveTaskStatus, getTaskCountdownState, isTerminalTaskStatus } from "@/lib/utils";

interface TaskTableProps {
  tasks: Task[];
  now: number | null;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  language?: AppLanguage;
  timeZone?: string;
}

const priorityStyles = {
  Rendah: "neutral",
  Sedang: "info",
  Tinggi: "danger"
} as const;

const statusStyles = {
  "Akan Datang": "upcoming",
  Berjalan: "info",
  Selesai: "success",
  Tertunda: "warning",
  Dibatalkan: "neutral"
} as const;

const countdownToneStyles = {
  green: "success",
  amber: "warning",
  red: "danger",
  upcoming: "upcoming"
} as const;

export function TaskTable({ tasks, now, onEdit, onDelete, onStatusChange, language = "id", timeZone }: TaskTableProps) {
  const text = {
    empty: language === "id" ? "Tidak ada pekerjaan sesuai filter." : "No work items match the current filters.",
    work: language === "id" ? "Pekerjaan" : "Work",
    status: language === "id" ? "Status" : "Status",
    priority: language === "id" ? "Prioritas" : "Priority",
    date: language === "id" ? "Tanggal" : "Date",
    time: language === "id" ? "Jam" : "Time",
    actions: language === "id" ? "Aksi" : "Actions",
    until: language === "id" ? "s.d." : "to",
    loading: language === "id" ? "Memuat hitung mundur..." : "Loading countdown...",
    edit: language === "id" ? "Edit" : "Edit",
    delete: language === "id" ? "Hapus" : "Delete"
  };

  if (!tasks.length) {
    return (
      <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
        {text.empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">{text.work}</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">{text.status}</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">{text.priority}</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">{text.date}</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">{text.time}</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">{text.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {tasks.map((task) => {
              const effectiveStatus = getEffectiveTaskStatus(task, now ?? Date.now(), timeZone);
              const isActiveTask = !isTerminalTaskStatus(effectiveStatus);
              const countdown = isActiveTask && now !== null ? getTaskCountdownState(task, now, timeZone, language) : null;
              const timeRange = task.endTime ? formatTimeRange(task.startTime || "00:00", task.endTime) : "-";

              return (
                <tr key={task.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80">
                  <td className="max-w-sm px-4 py-4">
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{task.title}</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{task.description}</p>
                  </td>
                  <td className="px-4 py-4">
                    <select value={effectiveStatus} onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)} className={cn("rounded border-0 px-2 py-1 text-xs font-semibold", getSemanticChipClassName(statusStyles[effectiveStatus]))}>
                      {taskStatuses.map((status) => (
                        <option key={status} value={status}>
                          {tTaskStatus(status, language)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className={getSemanticChipClassName(priorityStyles[task.priority])}>{tPriority(task.priority, language)}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                    <p>{formatDate(task.startDate, language, timeZone)}</p>
                    <p className="mt-1">{text.until} {formatDate(task.deadline, language, timeZone)}</p>
                    {isActiveTask ? now === null ? <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{text.loading}</p> : countdown ? <div className={cn("mt-2 inline-flex max-w-full items-center gap-1", getCountdownChipClassName(countdown.mode === "upcoming" ? countdownToneStyles.upcoming : countdownToneStyles[countdown.tone]))} aria-label={`${countdown.label}: ${countdown.fullLabel}`} title={`${countdown.label}: ${countdown.fullLabel}`}><span className="font-bold">{countdown.label}</span><span className="truncate">{countdown.displayLabel}</span></div> : null : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">{timeRange}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      {effectiveStatus !== "Selesai" && effectiveStatus !== "Dibatalkan" ? (
                        <QuickStatusActions
                          itemTitle={task.title}
                          language={language}
                          onComplete={() => onStatusChange(task.id, "Selesai")}
                          onCancel={() => onStatusChange(task.id, "Dibatalkan")}
                        />
                      ) : null}
                      <button type="button" onClick={() => onEdit(task)} className={getIconButtonClassName()} aria-label={`${text.edit} ${task.title}`}><Edit2 className="h-4 w-4" /></button>
                      <button type="button" onClick={() => onDelete(task.id)} className={getIconButtonClassName("danger")} aria-label={`${text.delete} ${task.title}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
