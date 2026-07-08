"use client";

import { Edit2, Trash2 } from "lucide-react";
import { QuickStatusActions } from "@/components/QuickStatusActions";
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
  Rendah: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  Sedang: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-100",
  Tinggi: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-100"
};

const statusStyles = {
  "Akan Datang": "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-100",
  Berjalan: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-100",
  Selesai: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-100",
  Tertunda: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-100",
  Dibatalkan: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100"
};

const countdownToneStyles = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  red: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100",
  upcoming: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-100"
};

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
      <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        {text.empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/70">
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
              const countdown = isActiveTask && now !== null ? getTaskCountdownState(task, now, timeZone) : null;
              const timeRange = task.endTime ? formatTimeRange(task.startTime || "00:00", task.endTime) : "-";

              return (
                <tr key={task.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="max-w-sm px-4 py-4">
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{task.title}</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{task.description}</p>
                  </td>
                  <td className="px-4 py-4">
                    <select value={effectiveStatus} onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)} className={cn("rounded border-0 px-2 py-1 text-xs font-semibold", statusStyles[effectiveStatus])}>
                      {taskStatuses.map((status) => (
                        <option key={status} value={status}>
                          {tTaskStatus(status, language)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityStyles[task.priority])}>{tPriority(task.priority, language)}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                    <p>{formatDate(task.startDate, language, timeZone)}</p>
                    <p className="mt-1">{text.until} {formatDate(task.deadline, language, timeZone)}</p>
                    {isActiveTask ? now === null ? <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{text.loading}</p> : countdown ? <div className={cn("mt-2 inline-flex max-w-full rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums leading-none sm:text-xs", countdown.mode === "upcoming" ? countdownToneStyles.upcoming : countdownToneStyles[countdown.tone])} aria-label={`${countdown.label}: ${countdown.fullLabel}`} title={`${countdown.label}: ${countdown.fullLabel}`}><span className="mr-1 font-bold">{countdown.label}</span><span className="truncate">{countdown.displayLabel}</span></div> : null : null}
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
                      <button type="button" onClick={() => onEdit(task)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" aria-label={`${text.edit} ${task.title}`}><Edit2 className="h-4 w-4" /></button>
                      <button type="button" onClick={() => onDelete(task.id)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/50" aria-label={`${text.delete} ${task.title}`}><Trash2 className="h-4 w-4" /></button>
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
