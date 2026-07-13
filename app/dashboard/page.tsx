"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity as ActivityIcon, CalendarClock, CheckCircle2, Clock3, ListTodo, PauseCircle, Percent, Repeat2 } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { DailyActivityChart, TaskStatusChart, WeeklyProgressChart } from "@/components/Charts";
import { StatCard } from "@/components/StatCard";
import { tActivityStatus, tAgendaType, tCategory, tPriority, tTaskStatus } from "@/lib/i18n";
import { useDashboardStore } from "@/lib/dashboard-store";
import { getCountdownChipClassName, getInteractiveSurfaceClassName, getSemanticChipClassName } from "@/lib/ui-state-styles";
import { buildTodayAgendaItems, cn, formatDate, formatDateWithWeekday, formatTimeRange, getEffectiveTaskStatus, getTaskCountdownState, isRoutineScheduledForDate, paginateItems, sortTasksByNearestDeadline, summarizeActivities, summarizeTasks, todayDate } from "@/lib/utils";
import { useNow } from "@/lib/use-now";

const dashboardPageSize = 4;
const countdownToneStyles = {
  green: "success",
  amber: "warning",
  red: "danger",
  upcoming: "upcoming"
} as const;
const agendaTypeStyles = { Aktivitas: "success", Rutinitas: "upcoming" } as const;
const priorityStyles = { Rendah: "neutral", Sedang: "info", Tinggi: "danger" } as const;
const statusStyles = { "Akan Datang": "upcoming", Direncanakan: "neutral", Berjalan: "info", Selesai: "success", Tertunda: "warning", Dibatalkan: "neutral" } as const;

export default function DashboardPage() {
  const { tasks, activities, routines, settings } = useDashboardStore();
  const language = settings.language;
  const [taskPage, setTaskPage] = useState(1);
  const [agendaPage, setAgendaPage] = useState(1);
  const now = useNow();
  const timeZone = settings.timeZone;
  const today = todayDate(timeZone);
  const taskSummary = summarizeTasks(tasks, Date.now(), timeZone);
  const activitySummary = summarizeActivities(activities, timeZone);
  const todayRoutineCount = useMemo(() => routines.filter((routine) => isRoutineScheduledForDate(routine, today)).length, [routines, today]);
  const nearestDeadlineTasks = useMemo(() => sortTasksByNearestDeadline(tasks, timeZone), [tasks, timeZone]);
  const todayAgendaItems = useMemo(() => (now === null ? [] : buildTodayAgendaItems(activities, routines, today, now, timeZone)), [activities, now, routines, timeZone, today]);
  const paginatedTasks = useMemo(() => paginateItems(nearestDeadlineTasks, taskPage, dashboardPageSize), [nearestDeadlineTasks, taskPage]);
  const paginatedAgenda = useMemo(() => paginateItems(todayAgendaItems, agendaPage, dashboardPageSize), [agendaPage, todayAgendaItems]);

  const text = {
    description: language === "id" ? "Ringkasan pekerjaan, aktivitas, dan progress produktivitas." : "A summary of work, activities, and productivity progress.",
    totalWork: language === "id" ? "Total pekerjaan" : "Total work",
    upcoming: language === "id" ? "Akan datang" : "Upcoming",
    inProgress: language === "id" ? "Sedang berjalan" : "In progress",
    completed: language === "id" ? "Pekerjaan selesai" : "Completed work",
    pending: language === "id" ? "Pekerjaan tertunda" : "Pending work",
    todayActivities: language === "id" ? "Aktivitas hari ini" : "Today's activities",
    todayRoutines: language === "id" ? "Rutinitas hari ini" : "Today's routines",
    progress: language === "id" ? "Progress penyelesaian" : "Completion rate",
    nearest: language === "id" ? "Deadline Terdekat" : "Nearest Deadlines",
    deadline: language === "id" ? "Deadline" : "Deadline",
    loadingCountdown: language === "id" ? "Memuat hitung mundur..." : "Loading countdown...",
    noActiveDeadlines: language === "id" ? "Belum ada pekerjaan aktif dengan deadline." : "No active work items with deadlines yet.",
    todayAgenda: language === "id" ? "Kegiatan Hari Ini" : "Today's Agenda",
    loadingAgenda: language === "id" ? "Memuat kegiatan hari ini..." : "Loading today's agenda...",
    noAgenda: language === "id" ? "Belum ada kegiatan tersisa untuk hari ini." : "No remaining items for today."
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader eyebrow="Dashboard" title={settings.dashboardName} description={text.description} language={language} timeZone={timeZone} />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard title={text.totalWork} value={taskSummary.total} href="/tasks?status=Semua" icon={ListTodo} tone="slate" />
        <StatCard title={text.upcoming} value={taskSummary.upcoming} href="/tasks?status=Akan%20Datang" icon={CalendarClock} tone="slate" />
        <StatCard title={text.inProgress} value={taskSummary.running} href="/tasks?status=Berjalan" icon={Clock3} tone="blue" />
        <StatCard title={text.completed} value={taskSummary.completed} href="/tasks?status=Selesai" icon={CheckCircle2} tone="teal" />
        <StatCard title={text.pending} value={taskSummary.pending} href="/tasks?status=Tertunda" icon={PauseCircle} tone="amber" />
        <StatCard title={text.todayActivities} value={activitySummary.today} href={"/activities?date=" + today + "&category=Semua"} icon={ActivityIcon} tone="blue" />
        <StatCard title={text.todayRoutines} value={todayRoutineCount} href="/routines" icon={Repeat2} tone="slate" />
        <StatCard title={text.progress} value={taskSummary.completionRate + "%"} icon={Percent} tone="teal" />
      </section>

      <section className="grid items-stretch gap-3 sm:gap-4 xl:grid-cols-3">
        <div className="min-w-0">
          <TaskStatusChart tasks={tasks} maxLegendItems={4} language={language} timeZone={timeZone} contentClassName="mt-4 h-80 sm:h-96" />
        </div>
        <div className="min-w-0">
          <DailyActivityChart activities={activities} routines={routines} language={language} timeZone={timeZone} contentClassName="mt-4 h-80 sm:h-96" />
        </div>
        <div className="min-w-0">
          <WeeklyProgressChart tasks={tasks} language={language} timeZone={timeZone} contentClassName="mt-4 h-80 sm:h-96" />
        </div>
      </section>

      <section className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{text.nearest}</h2>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedTasks.totalItems ? paginatedTasks.items.map((task) => {
              const effectiveStatus = getEffectiveTaskStatus(task, now ?? Date.now(), timeZone);
              const timeRange = task.endTime ? ` · ${formatTimeRange(task.startTime || "00:00", task.endTime)}` : "";
              return (
                <Link key={task.id} href={`/tasks?taskId=${task.id}`} className={getInteractiveSurfaceClassName() + " block border-0 rounded-lg px-3 py-3 first:mt-0 last:mb-0 focus:outline-none focus:ring-2 focus:ring-teal-500"}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0"><p className="font-medium text-slate-950 dark:text-slate-50">{task.title}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.description}</p></div>
                    <span className={cn("shrink-0", getSemanticChipClassName(statusStyles[effectiveStatus]))}>{tTaskStatus(effectiveStatus, language)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="text-slate-500 dark:text-slate-400">{text.deadline} {formatDate(task.deadline, language, timeZone)}{timeRange}</p>
                    {now === null ? <p className="font-medium text-slate-500 dark:text-slate-400">{text.loadingCountdown}</p> : (() => {
                      const countdown = getTaskCountdownState(task, now, timeZone, language);
                      return countdown ? <div className={cn("inline-flex max-w-full shrink-0 items-center gap-1", getCountdownChipClassName(countdown.mode === "upcoming" ? countdownToneStyles.upcoming : countdownToneStyles[countdown.tone]))} aria-label={`${countdown.label}: ${countdown.fullLabel}`} title={`${countdown.label}: ${countdown.fullLabel}`}><span className="font-bold">{countdown.label}</span><span className="truncate">{countdown.displayLabel}</span></div> : null;
                    })()}
                  </div>
                </Link>
              );
            }) : <p className="text-sm text-slate-500 dark:text-slate-400">{text.noActiveDeadlines}</p>}
          </div>
          <div className="mt-4"><Pagination currentPage={paginatedTasks.currentPage} totalPages={paginatedTasks.totalPages} totalItems={paginatedTasks.totalItems} startItem={paginatedTasks.startItem} endItem={paginatedTasks.endItem} onPageChange={setTaskPage} language={language} /></div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{text.todayAgenda}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDateWithWeekday(today, language, timeZone)}</p>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
            {now === null ? <p className="text-sm text-slate-500 dark:text-slate-400">{text.loadingAgenda}</p> : paginatedAgenda.totalItems ? paginatedAgenda.items.map((item) => (
              <div key={`${item.type}-${item.id}`} className="py-3 first:pt-0 last:pb-0">
                <Link href={item.href} className={getInteractiveSurfaceClassName() + " block rounded-lg border-0 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(getSemanticChipClassName(agendaTypeStyles[item.type]))}>{tAgendaType(item.type, language)}</span>
                    {item.status ? <span className={cn(getSemanticChipClassName(statusStyles[item.status]))}>{tActivityStatus(item.status, language)}</span> : null}
                    {item.type === "Rutinitas" && item.priority ? <span className={cn(getSemanticChipClassName(priorityStyles[item.priority]))}>{tPriority(item.priority, language)}</span> : null}
                  </div>
                  <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatTimeRange(item.startTime, item.endTime)} · {item.type === "Aktivitas" ? tCategory(item.metaLabel as never, language) : item.metaLabel}</p>
                </Link>
              </div>
            )) : <p className="text-sm text-slate-500 dark:text-slate-400">{text.noAgenda}</p>}
          </div>
          <div className="mt-4"><Pagination currentPage={paginatedAgenda.currentPage} totalPages={paginatedAgenda.totalPages} totalItems={paginatedAgenda.totalItems} startItem={paginatedAgenda.startItem} endItem={paginatedAgenda.endItem} onPageChange={setAgendaPage} language={language} /></div>
        </div>
      </section>
    </div>
  );
}
