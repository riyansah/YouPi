"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity as ActivityIcon, ArrowRight, CalendarClock, CalendarDays, CheckCircle2, Clock3, ListTodo, PauseCircle, Percent, Repeat2, Target } from "lucide-react";
import { DashboardHero } from "@/components/DashboardHero";
import { Pagination } from "@/components/Pagination";
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
    deadlineEmptyTitle: language === "id" ? "Ruang fokus masih kosong" : "Your focus space is clear",
    deadlineDescription: language === "id" ? "Prioritaskan pekerjaan yang paling dekat dengan waktunya." : "Prioritize work that is closest to its deadline.",
    viewAllWork: language === "id" ? "Lihat semua" : "View all",
    addWork: language === "id" ? "Tambah pekerjaan" : "Add work",
    todayAgenda: language === "id" ? "Kegiatan Hari Ini" : "Today's Agenda",
    loadingAgenda: language === "id" ? "Memuat kegiatan hari ini..." : "Loading today's agenda...",
    noAgenda: language === "id" ? "Belum ada kegiatan tersisa untuk hari ini." : "No remaining items for today.",
    agendaEmptyTitle: language === "id" ? "Hari ini terasa lapang" : "Today looks spacious",
    agendaDescription: language === "id" ? "Aktivitas dan rutinitas berikutnya akan muncul di sini." : "Your next activities and routines will appear here.",
    openSchedule: language === "id" ? "Buka jadwal" : "Open schedule",
    addActivity: language === "id" ? "Tambah aktivitas" : "Add activity"
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardHero title={settings.dashboardName} description={text.description} language={language} timeZone={timeZone} focusTask={nearestDeadlineTasks[0]} now={now} />

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
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-100 dark:bg-teal-950/60 dark:text-teal-200 dark:ring-teal-800">
                <Target className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">{text.nearest}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{text.deadlineDescription}</p>
              </div>
            </div>
            <Link href="/tasks" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-teal-300 dark:hover:bg-teal-950/60">
              <span className="hidden sm:inline">{text.viewAllWork}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 space-y-2">
            {paginatedTasks.totalItems ? paginatedTasks.items.map((task) => {
              const effectiveStatus = getEffectiveTaskStatus(task, now ?? Date.now(), timeZone);
              const timeRange = task.endTime ? ` · ${formatTimeRange(task.startTime || "00:00", task.endTime)}` : "";
              return (
                <Link key={task.id} href={`/tasks?taskId=${task.id}`} className={getInteractiveSurfaceClassName() + " group block rounded-xl px-3.5 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500"}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-950 transition-colors group-hover:text-teal-800 dark:text-slate-50 dark:group-hover:text-teal-200">{task.title}</p>
                      {task.description ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">{task.description}</p> : null}
                    </div>
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
            }) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-7 text-center dark:border-slate-700 dark:bg-slate-950/40">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-200">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">{text.deadlineEmptyTitle}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-slate-500 dark:text-slate-400">{text.noActiveDeadlines}</p>
                <Link href="/tasks?compose=1" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-bold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus:ring-offset-slate-900">
                  {text.addWork}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
          <div className="mt-4"><Pagination currentPage={paginatedTasks.currentPage} totalPages={paginatedTasks.totalPages} totalItems={paginatedTasks.totalItems} startItem={paginatedTasks.startItem} endItem={paginatedTasks.endItem} onPageChange={setTaskPage} language={language} /></div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/60 dark:text-blue-200 dark:ring-blue-800">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">{text.todayAgenda}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{formatDateWithWeekday(today, language, timeZone)}</p>
              </div>
            </div>
            <Link href="/schedule" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-teal-300 dark:hover:bg-teal-950/60">
              <span className="hidden sm:inline">{text.openSchedule}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-3 text-sm leading-5 text-slate-500 dark:text-slate-400">{text.agendaDescription}</p>
          <div className="mt-4 space-y-2">
            {now === null ? (
              <div className="space-y-2" role="status" aria-label={text.loadingAgenda}>
                {[0, 1, 2].map((item) => (
                  <div key={item} className="animate-pulse rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-700 dark:bg-slate-950/40">
                    <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
                <span className="sr-only">{text.loadingAgenda}</span>
              </div>
            ) : paginatedAgenda.totalItems ? paginatedAgenda.items.map((item) => (
                <Link key={`${item.type}-${item.id}`} href={item.href} className={getInteractiveSurfaceClassName() + " group block rounded-xl px-3.5 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500"}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(getSemanticChipClassName(agendaTypeStyles[item.type]))}>{tAgendaType(item.type, language)}</span>
                    {item.status ? <span className={cn(getSemanticChipClassName(statusStyles[item.status]))}>{tActivityStatus(item.status, language)}</span> : null}
                    {item.type === "Rutinitas" && item.priority ? <span className={cn(getSemanticChipClassName(priorityStyles[item.priority]))}>{tPriority(item.priority, language)}</span> : null}
                  </div>
                  <p className="mt-2 font-semibold text-slate-950 transition-colors group-hover:text-teal-800 dark:text-slate-50 dark:group-hover:text-teal-200">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatTimeRange(item.startTime, item.endTime)} · {item.type === "Aktivitas" ? tCategory(item.metaLabel as never, language) : item.metaLabel}</p>
                </Link>
            )) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-7 text-center dark:border-slate-700 dark:bg-slate-950/40">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-200">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">{text.agendaEmptyTitle}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-slate-500 dark:text-slate-400">{text.noAgenda}</p>
                <Link href="/activities?compose=1" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-teal-700 dark:hover:bg-teal-950/50 dark:hover:text-teal-100 dark:focus:ring-offset-slate-900">
                  {text.addActivity}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
          <div className="mt-4"><Pagination currentPage={paginatedAgenda.currentPage} totalPages={paginatedAgenda.totalPages} totalItems={paginatedAgenda.totalItems} startItem={paginatedAgenda.startItem} endItem={paginatedAgenda.endItem} onPageChange={setAgendaPage} language={language} /></div>
        </div>
      </section>
    </div>
  );
}
