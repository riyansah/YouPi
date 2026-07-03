"use client";

import { CheckCircle2, Edit2, Trash2 } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { taskStatuses } from "@/lib/types";
import { cn, formatDate, formatTimeRange, getDeadlineCountdownState } from "@/lib/utils";

interface TaskTableProps {
  tasks: Task[];
  now: number | null;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const priorityStyles = {
  Rendah: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  Sedang: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-100",
  Tinggi: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-100"
};

const statusStyles = {
  Berjalan: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-100",
  Selesai: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-100",
  Tertunda: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-100",
  Dibatalkan: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100"
};

const countdownToneStyles = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  red: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
};

export function TaskTable({ tasks, now, onEdit, onDelete, onStatusChange }: TaskTableProps) {
  if (!tasks.length) {
    return (
      <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Tidak ada pekerjaan sesuai filter.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/70">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Pekerjaan</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Prioritas</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Jam</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {tasks.map((task) => {
              const isActiveTask = task.status !== "Selesai" && task.status !== "Dibatalkan";
              const countdown = isActiveTask && now !== null ? getDeadlineCountdownState(task.deadline, now, task.endTime) : null;
              const hasTimeRange = Boolean(task.startTime && task.endTime);

              return (
                <tr key={task.id} className="align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="max-w-sm px-4 py-4">
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{task.title}</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{task.description}</p>
                  </td>
                  <td className="px-4 py-4">
                    <select value={task.status} onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)} className={cn("rounded border-0 px-2 py-1 text-xs font-semibold", statusStyles[task.status])}>
                      {taskStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityStyles[task.priority])}>{task.priority}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                    <p>{formatDate(task.startDate)}</p>
                    <p className="mt-1">s.d. {formatDate(task.deadline)}</p>
                    {isActiveTask ? now === null ? <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">Memuat hitung mundur...</p> : countdown ? <div className={cn("mt-2 inline-flex max-w-full rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums leading-none sm:text-xs", countdownToneStyles[countdown.tone])} aria-label={countdown.fullLabel} title={countdown.fullLabel}><span className="truncate">{countdown.displayLabel}</span></div> : null : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                    {hasTimeRange ? formatTimeRange(task.startTime!, task.endTime!) : "-"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      {task.status !== "Selesai" ? (
                        <button type="button" onClick={() => onStatusChange(task.id, "Selesai")} className="inline-flex items-center gap-2 rounded border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-900 dark:text-teal-100 dark:hover:bg-teal-950/50" aria-label={`Tandai ${task.title} selesai`}>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Selesai</span>
                        </button>
                      ) : null}
                      <button type="button" onClick={() => onEdit(task)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" aria-label={`Edit ${task.title}`}><Edit2 className="h-4 w-4" /></button>
                      <button type="button" onClick={() => onDelete(task.id)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/50" aria-label={`Hapus ${task.title}`}><Trash2 className="h-4 w-4" /></button>
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
