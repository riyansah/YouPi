"use client";

import { Edit2, Trash2 } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { taskStatuses } from "@/lib/types";
import { cn, formatDate, getDeadlineCountdownState } from "@/lib/utils";

interface TaskTableProps {
  tasks: Task[];
  now: number | null;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const priorityStyles = {
  Rendah: "bg-slate-100 text-slate-700",
  Sedang: "bg-blue-50 text-blue-700",
  Tinggi: "bg-rose-50 text-rose-700"
};

const statusStyles = {
  Berjalan: "bg-blue-50 text-blue-700",
  Selesai: "bg-teal-50 text-teal-700",
  Tertunda: "bg-amber-50 text-amber-700",
  Dibatalkan: "bg-slate-100 text-slate-700"
};

const countdownToneStyles = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-rose-200 bg-rose-50 text-rose-700"
};

export function TaskTable({ tasks, now, onEdit, onDelete, onStatusChange }: TaskTableProps) {
  if (!tasks.length) {
    return (
      <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Tidak ada pekerjaan sesuai filter.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Pekerjaan</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Prioritas</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Mulai</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Deadline</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tasks.map((task) => {
              const isActiveTask = task.status !== "Selesai" && task.status !== "Dibatalkan";
              const countdown = isActiveTask && now !== null ? getDeadlineCountdownState(task.deadline, now) : null;

              return (
                <tr key={task.id} className="align-top transition-colors hover:bg-slate-50">
                  <td className="max-w-sm px-4 py-4">
                    <p className="font-semibold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-slate-500">{task.description}</p>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={task.status}
                      onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
                      className={cn("rounded border-0 px-2 py-1 text-xs font-semibold", statusStyles[task.status])}
                    >
                      {taskStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityStyles[task.priority])}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(task.startDate)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    <p>{formatDate(task.deadline)}</p>
                    {isActiveTask ? (
                      now === null ? (
                        <p className="mt-1 text-xs font-medium text-slate-500">Memuat hitung mundur...</p>
                      ) : countdown ? (
                        <div
                          className={cn(
                            "mt-2 inline-flex max-w-full rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums leading-none sm:text-xs",
                            countdownToneStyles[countdown.tone]
                          )}
                          aria-label={countdown.fullLabel}
                          title={countdown.fullLabel}
                        >
                          <span className="truncate">{countdown.displayLabel}</span>
                        </div>
                      ) : null
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                        aria-label={`Edit ${task.title}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(task.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-rose-200 text-rose-600 hover:bg-rose-50"
                        aria-label={`Hapus ${task.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
