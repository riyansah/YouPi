"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity as ActivityIcon, CheckCircle2, Clock3, ListTodo, PauseCircle, Percent } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { Pagination } from "@/components/Pagination";
import { DailyActivityChart, TaskStatusChart, WeeklyProgressChart } from "@/components/Charts";
import { StatCard } from "@/components/StatCard";
import { useDashboardStore } from "@/lib/dashboard-store";
import {
  buildTodayAgendaItems,
  cn,
  formatDate,
  formatDateWithWeekday,
  formatTimeRange,
  getDeadlineCountdownState,
  nowIso,
  paginateItems,
  sortTasksByNearestDeadline,
  summarizeActivities,
  summarizeTasks,
  todayDate,
  useNow
} from "@/lib/utils";

const dashboardPageSize = 4;

const countdownToneStyles = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  red: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
};

const agendaTypeStyles = {
  Aktivitas: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-100",
  Rutinitas: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-100"
};

const priorityStyles = {
  Rendah: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  Sedang: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-100",
  Tinggi: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-100"
};

const statusStyles = {
  Direncanakan: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  Berjalan: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-100",
  Selesai: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-100",
  Tertunda: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-100"
};

export default function DashboardPage() {
  const { tasks, activities, routines, settings, setActivities } = useDashboardStore();
  const { showToast } = useAppFeedback();
  const [taskPage, setTaskPage] = useState(1);
  const [agendaPage, setAgendaPage] = useState(1);
  const [completedRoutineKeys, setCompletedRoutineKeys] = useState<string[]>([]);
  const now = useNow();
  const today = todayDate();
  const taskSummary = summarizeTasks(tasks);
  const activitySummary = summarizeActivities(activities);
  const nearestDeadlineTasks = useMemo(() => sortTasksByNearestDeadline(tasks), [tasks]);
  const todayAgendaItems = useMemo(() => {
    if (now === null) {
      return [];
    }

    return buildTodayAgendaItems(activities, routines, today, now).filter(
      (item) => item.type === "Aktivitas" || !completedRoutineKeys.includes(`${today}-${item.id}`)
    );
  }, [activities, completedRoutineKeys, now, routines, today]);
  const paginatedTasks = useMemo(() => paginateItems(nearestDeadlineTasks, taskPage, dashboardPageSize), [nearestDeadlineTasks, taskPage]);
  const paginatedAgenda = useMemo(() => paginateItems(todayAgendaItems, agendaPage, dashboardPageSize), [agendaPage, todayAgendaItems]);

  function handleCompleteActivity(id: string) {
    const activity = activities.find((item) => item.id === id);
    const timestamp = nowIso();
    setActivities((current) => current.map((item) => (item.id === id ? { ...item, status: "Selesai", updatedAt: timestamp } : item)));
    if (activity && activity.status !== "Selesai") {
      showToast({ message: `Aktivitas "${activity.title}" diselesaikan.` });
    }
  }

  function handleCompleteRoutine(id: string, title: string) {
    const key = `${today}-${id}`;
    setCompletedRoutineKeys((current) => (current.includes(key) ? current : [...current, key]));
    showToast({ message: `Rutinitas "${title}" diselesaikan untuk hari ini.` });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 sm:text-3xl">{settings.dashboardName}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ringkasan pekerjaan, aktivitas, dan progress produktivitas.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total pekerjaan" value={taskSummary.total} href="/tasks?status=Semua" icon={ListTodo} tone="slate" />
        <StatCard title="Sedang berjalan" value={taskSummary.running} href="/tasks?status=Berjalan" icon={Clock3} tone="blue" />
        <StatCard title="Pekerjaan selesai" value={taskSummary.completed} href="/tasks?status=Selesai" icon={CheckCircle2} tone="teal" />
        <StatCard title="Pekerjaan tertunda" value={taskSummary.pending} href="/tasks?status=Tertunda" icon={PauseCircle} tone="amber" />
        <StatCard title="Aktivitas hari ini" value={activitySummary.today} href={`/activities?date=${today}&category=Semua`} icon={ActivityIcon} tone="blue" />
        <StatCard title="Progress penyelesaian" value={`${taskSummary.completionRate}%`} icon={Percent} tone="teal" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <TaskStatusChart tasks={tasks} />
        <DailyActivityChart activities={activities} routines={routines} />
        <WeeklyProgressChart tasks={tasks} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Deadline Terdekat</h2>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedTasks.totalItems ? (
              paginatedTasks.items.map((task) => (
                <Link key={task.id} href={`/tasks?taskId=${task.id}`} className="block rounded py-3 first:pt-0 last:pb-0 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:hover:bg-slate-800/70">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-950 dark:text-slate-50">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
                    </div>
                    <span className="shrink-0 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-100">{task.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="text-slate-500 dark:text-slate-400">Deadline {formatDate(task.deadline)}{task.startTime && task.endTime ? ` · ${task.startTime} - ${task.endTime}` : ""}</p>
                    {now === null ? <p className="font-medium text-slate-500 dark:text-slate-400">Memuat hitung mundur...</p> : (() => {
                      const countdown = getDeadlineCountdownState(task.deadline, now, task.endTime);

                      return (
                        <div className={cn("inline-flex max-w-full shrink-0 rounded-md border px-2 py-1 text-xs font-semibold tabular-nums leading-none sm:text-sm", countdownToneStyles[countdown.tone])} aria-label={countdown.fullLabel} title={countdown.fullLabel}>
                          <span className="truncate">{countdown.displayLabel}</span>
                        </div>
                      );
                    })()}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada pekerjaan aktif dengan deadline.</p>
            )}
          </div>
          <div className="mt-4">
            <Pagination currentPage={paginatedTasks.currentPage} totalPages={paginatedTasks.totalPages} totalItems={paginatedTasks.totalItems} startItem={paginatedTasks.startItem} endItem={paginatedTasks.endItem} onPageChange={setTaskPage} />
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Kegiatan Hari Ini</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDateWithWeekday(today)}</p>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
            {now === null ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Memuat kegiatan hari ini...</p>
            ) : paginatedAgenda.totalItems ? (
              paginatedAgenda.items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="rounded py-3 first:pt-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={item.href} className="min-w-0 flex-1 rounded focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded px-2 py-1 text-xs font-semibold", agendaTypeStyles[item.type])}>{item.type}</span>
                        {item.type === "Aktivitas" && item.status ? <span className={cn("rounded px-2 py-1 text-xs font-semibold", statusStyles[item.status])}>{item.status}</span> : null}
                        {item.type === "Rutinitas" && item.priority ? <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityStyles[item.priority])}>{item.priority}</span> : null}
                      </div>
                      <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatTimeRange(item.startTime, item.endTime)} · {item.metaLabel}</p>
                    </Link>
                    {item.type === "Aktivitas" ? (
                      <label className="inline-flex shrink-0 items-center gap-2 rounded border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-900 dark:text-teal-100 dark:hover:bg-teal-950/50">
                        <input type="checkbox" checked={false} onChange={() => handleCompleteActivity(item.id)} className="h-4 w-4 accent-teal-700" aria-label={`Tandai ${item.title} selesai`} />
                        <span>Selesai</span>
                      </label>
                    ) : (
                      <button type="button" onClick={() => handleCompleteRoutine(item.id, item.title)} className="inline-flex shrink-0 items-center gap-2 rounded border border-violet-200 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-100 dark:hover:bg-violet-950/50">
                        Selesai
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada kegiatan tersisa untuk hari ini.</p>
            )}
          </div>
          <div className="mt-4">
            <Pagination currentPage={paginatedAgenda.currentPage} totalPages={paginatedAgenda.totalPages} totalItems={paginatedAgenda.totalItems} startItem={paginatedAgenda.startItem} endItem={paginatedAgenda.endItem} onPageChange={setAgendaPage} />
          </div>
        </div>
      </section>
    </div>
  );
}
