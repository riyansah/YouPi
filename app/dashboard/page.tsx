"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity as ActivityIcon, CheckCircle2, Clock3, ListTodo, PauseCircle, Percent } from "lucide-react";
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
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-rose-200 bg-rose-50 text-rose-700"
};

const agendaTypeStyles = {
  Aktivitas: "bg-teal-50 text-teal-700",
  Rutinitas: "bg-violet-50 text-violet-700"
};

const priorityStyles = {
  Rendah: "bg-slate-100 text-slate-700",
  Sedang: "bg-blue-50 text-blue-700",
  Tinggi: "bg-rose-50 text-rose-700"
};

const statusStyles = {
  Direncanakan: "bg-slate-100 text-slate-700",
  Berjalan: "bg-blue-50 text-blue-700",
  Selesai: "bg-teal-50 text-teal-700",
  Tertunda: "bg-amber-50 text-amber-700"
};

export default function DashboardPage() {
  const { tasks, activities, routines, settings, setActivities } = useDashboardStore();
  const [taskPage, setTaskPage] = useState(1);
  const [agendaPage, setAgendaPage] = useState(1);
  const now = useNow();
  const taskSummary = summarizeTasks(tasks);
  const activitySummary = summarizeActivities(activities);
  const nearestDeadlineTasks = useMemo(() => sortTasksByNearestDeadline(tasks), [tasks]);
  const todayAgendaItems = useMemo(
    () => (now === null ? [] : buildTodayAgendaItems(activities, routines, todayDate(), now)),
    [activities, now, routines]
  );
  const paginatedTasks = useMemo(
    () => paginateItems(nearestDeadlineTasks, taskPage, dashboardPageSize),
    [nearestDeadlineTasks, taskPage]
  );
  const paginatedAgenda = useMemo(
    () => paginateItems(todayAgendaItems, agendaPage, dashboardPageSize),
    [agendaPage, todayAgendaItems]
  );

  function handleCompleteActivity(id: string) {
    const timestamp = nowIso();
    setActivities((current) =>
      current.map((activity) => (activity.id === id ? { ...activity, status: "Selesai", updatedAt: timestamp } : activity))
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{settings.dashboardName}</h1>
        <p className="mt-2 text-sm text-slate-500">Ringkasan pekerjaan, aktivitas, dan progress produktivitas.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total pekerjaan" value={taskSummary.total} href="/tasks?status=Semua" icon={ListTodo} tone="slate" />
        <StatCard title="Sedang berjalan" value={taskSummary.running} href="/tasks?status=Berjalan" icon={Clock3} tone="blue" />
        <StatCard title="Pekerjaan selesai" value={taskSummary.completed} href="/tasks?status=Selesai" icon={CheckCircle2} tone="teal" />
        <StatCard title="Pekerjaan tertunda" value={taskSummary.pending} href="/tasks?status=Tertunda" icon={PauseCircle} tone="amber" />
        <StatCard
          title="Aktivitas hari ini"
          value={activitySummary.today}
          href={"/activities?date=" + todayDate() + "&category=Semua"}
          icon={ActivityIcon}
          tone="blue"
        />
        <StatCard title="Progress penyelesaian" value={`${taskSummary.completionRate}%`} icon={Percent} tone="teal" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <TaskStatusChart tasks={tasks} />
        <DailyActivityChart activities={activities} routines={routines} />
        <WeeklyProgressChart tasks={tasks} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Deadline Terdekat</h2>
          <div className="mt-4 divide-y divide-slate-200">
            {paginatedTasks.totalItems ? (
              paginatedTasks.items.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks?taskId=${task.id}`}
                  className="block rounded py-3 first:pt-0 last:pb-0 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-950">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{task.description}</p>
                    </div>
                    <span className="shrink-0 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {task.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="text-slate-500">Deadline {formatDate(task.deadline)}</p>
                    {now === null ? (
                      <p className="font-medium text-slate-500">Memuat hitung mundur...</p>
                    ) : (
                      (() => {
                        const countdown = getDeadlineCountdownState(task.deadline, now);

                        return (
                          <div
                            className={cn(
                              "inline-flex max-w-full shrink-0 rounded-md border px-2 py-1 text-xs font-semibold tabular-nums leading-none sm:text-sm",
                              countdownToneStyles[countdown.tone]
                            )}
                            aria-label={countdown.fullLabel}
                            title={countdown.fullLabel}
                          >
                            <span className="truncate">{countdown.displayLabel}</span>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">Belum ada pekerjaan aktif dengan deadline.</p>
            )}
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={paginatedTasks.currentPage}
              totalPages={paginatedTasks.totalPages}
              totalItems={paginatedTasks.totalItems}
              startItem={paginatedTasks.startItem}
              endItem={paginatedTasks.endItem}
              onPageChange={setTaskPage}
            />
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Kegiatan Hari Ini</h2>
          <p className="mt-1 text-sm text-slate-500">{formatDateWithWeekday(todayDate())}</p>
          <div className="mt-4 divide-y divide-slate-200">
            {now === null ? (
              <p className="text-sm text-slate-500">Memuat kegiatan hari ini...</p>
            ) : paginatedAgenda.totalItems ? (
              paginatedAgenda.items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="rounded py-3 first:pt-0 last:pb-0 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={item.href}
                      className="min-w-0 flex-1 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded px-2 py-1 text-xs font-semibold", agendaTypeStyles[item.type])}>
                          {item.type}
                        </span>
                        {item.type === "Aktivitas" && item.status ? (
                          <span className={cn("rounded px-2 py-1 text-xs font-semibold", statusStyles[item.status])}>
                            {item.status}
                          </span>
                        ) : null}
                        {item.type === "Rutinitas" && item.priority ? (
                          <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityStyles[item.priority])}>
                            {item.priority}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 font-medium text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatTimeRange(item.startTime, item.endTime)} · {item.metaLabel}
                      </p>
                    </Link>
                    {item.type === "Aktivitas" ? (
                      <label className="inline-flex shrink-0 items-center gap-2 rounded border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleCompleteActivity(item.id)}
                          className="h-4 w-4 accent-teal-700"
                          aria-label={`Tandai ${item.title} selesai`}
                        />
                        <span>Selesai</span>
                      </label>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Belum ada kegiatan tersisa untuk hari ini.</p>
            )}
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={paginatedAgenda.currentPage}
              totalPages={paginatedAgenda.totalPages}
              totalItems={paginatedAgenda.totalItems}
              startItem={paginatedAgenda.startItem}
              endItem={paginatedAgenda.endItem}
              onPageChange={setAgendaPage}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
