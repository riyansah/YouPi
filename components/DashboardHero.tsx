import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays, CalendarRange, CheckCircle2, Sparkles } from "lucide-react";
import { CurrentDateTime } from "@/components/CurrentDateTime";
import { tTaskStatus } from "@/lib/i18n";
import type { AppLanguage, Task } from "@/lib/types";
import { getCountdownChipClassName, getSemanticChipClassName } from "@/lib/ui-state-styles";
import { cn, formatDate, getEffectiveTaskStatus, getTaskCountdownState } from "@/lib/utils";

interface DashboardHeroProps {
  title: string;
  description: string;
  language: AppLanguage;
  timeZone: string;
  focusTask?: Task;
  now: number | null;
}

const countdownToneStyles = {
  green: "success",
  amber: "warning",
  red: "danger",
  upcoming: "upcoming"
} as const;

const statusStyles = {
  "Akan Datang": "upcoming",
  Berjalan: "info",
  Selesai: "success",
  Tertunda: "warning",
  Dibatalkan: "neutral"
} as const;

export function DashboardHero({ title, description, language, timeZone, focusTask, now }: DashboardHeroProps) {
  const text = {
    eyebrow: language === "id" ? "Ruang fokus hari ini" : "Today's focus space",
    focus: language === "id" ? "Fokus berikutnya" : "Up next",
    allClear: language === "id" ? "Semua pekerjaan aktif sudah tertangani" : "All active work is taken care of",
    allClearDescription: language === "id" ? "Tambahkan pekerjaan baru saat Anda siap memulai fokus berikutnya." : "Add new work whenever you are ready for the next focus.",
    deadline: language === "id" ? "Deadline" : "Deadline",
    loadingCountdown: language === "id" ? "Menyiapkan hitung mundur..." : "Preparing countdown...",
    openWork: language === "id" ? "Buka pekerjaan" : "Open work",
    addWork: language === "id" ? "Tambah pekerjaan" : "Add work",
    addActivity: language === "id" ? "Tambah aktivitas" : "Add activity",
    viewSchedule: language === "id" ? "Lihat jadwal" : "View schedule"
  };
  const effectiveStatus = focusTask ? getEffectiveTaskStatus(focusTask, now ?? Date.now(), timeZone) : null;
  const countdown = focusTask && now !== null ? getTaskCountdownState(focusTask, now, timeZone, language) : null;

  return (
    <section
      aria-labelledby="dashboard-title"
      className="relative isolate overflow-hidden rounded-[1.75rem] border border-slate-800/10 bg-[linear-gradient(135deg,#0f766e_0%,#0f5f65_46%,#172554_100%)] px-5 py-6 text-white shadow-[0_24px_70px_-34px_rgba(15,118,110,0.75)] sm:px-7 sm:py-7 lg:px-8"
    >
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-36 left-1/4 h-72 w-72 rounded-full bg-teal-200/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.08),transparent_38%)]" aria-hidden="true" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)] lg:items-start">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-50 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {text.eyebrow}
          </p>
          <h1 id="dashboard-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-50/80 sm:text-base">{description}</p>

          <div className="mt-6 rounded-2xl border border-white/15 bg-slate-950/20 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-100/80">
              {focusTask ? <BriefcaseBusiness className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {focusTask ? text.focus : text.allClear}
            </div>
            {focusTask ? (
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-white sm:text-xl">{focusTask.title}</p>
                  {focusTask.description ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-teal-50/70">{focusTask.description}</p> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {effectiveStatus ? <span className={cn(getSemanticChipClassName(statusStyles[effectiveStatus]), "border-white/15 bg-white/10 text-white")}>{tTaskStatus(effectiveStatus, language)}</span> : null}
                    <span className="text-xs font-medium text-teal-50/75">{text.deadline} {formatDate(focusTask.deadline, language, timeZone)}</span>
                    {now === null ? (
                      <span className="text-xs font-medium text-teal-50/65">{text.loadingCountdown}</span>
                    ) : countdown ? (
                      <span
                        className={cn("inline-flex items-center gap-1", getCountdownChipClassName(countdown.mode === "upcoming" ? countdownToneStyles.upcoming : countdownToneStyles[countdown.tone]))}
                        title={`${countdown.label}: ${countdown.fullLabel}`}
                      >
                        <span className="font-bold">{countdown.label}</span>
                        <span>{countdown.displayLabel}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
                <Link href={`/tasks?taskId=${focusTask.id}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-800">
                  {text.openWork}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-xl text-sm leading-6 text-teal-50/75">{text.allClearDescription}</p>
                <Link href="/tasks?compose=1" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-800">
                  {text.addWork}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <CurrentDateTime className="w-full border-white/20 shadow-xl shadow-slate-950/10" language={language} timeZone={timeZone} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <Link href="/tasks?compose=1" className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/25 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15"><BriefcaseBusiness className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 truncate">{text.addWork}</span>
              <ArrowRight className="h-4 w-4 text-teal-100 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/activities?compose=1" className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/25 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15"><CalendarDays className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 truncate">{text.addActivity}</span>
              <ArrowRight className="h-4 w-4 text-teal-100 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/schedule" className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/25 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15"><CalendarRange className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 truncate">{text.viewSchedule}</span>
              <ArrowRight className="h-4 w-4 text-teal-100 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
