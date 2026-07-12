"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListFilter,
  ListTodo,
  Repeat2,
  TriangleAlert
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getFieldClassName } from "@/lib/field-styles";
import { StatCard } from "@/components/StatCard";
import { tCategory, tPriority, tWeekday } from "@/lib/i18n";
import { useDashboardStore } from "@/lib/dashboard-store";
import type {
  AppLanguage,
  ScheduleDisplayStatus,
  ScheduleItem,
  ScheduleSource,
  ScheduleSourceFilter,
  ScheduleStatusFilter,
  ScheduleViewMode
} from "@/lib/types";
import { weekdays } from "@/lib/types";
import {
  buildScheduleItems,
  buildScheduleRange,
  cn,
  filterScheduleItems,
  formatDate,
  formatDateWithWeekday,
  formatTimeRange,
  groupScheduleItemsByDate,
  summarizeScheduleItems,
  todayDate
} from "@/lib/utils";
import { addDaysToDateKey, addMonthsToDateKey, formatDateTimeInTimeZone, zonedDateTimeToTimestamp } from "@/lib/time";
import { useNow } from "@/lib/use-now";

const sourceTone = {
  work: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-100",
  activity: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-100",
  routine: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-100"
} satisfies Record<ScheduleSource, string>;

const statusTone = {
  upcoming: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-100",
  done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
  missed: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-100",
  cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
} satisfies Record<ScheduleDisplayStatus, string>;

function addDays(value: string, offset: number) {
  return addDaysToDateKey(value, offset);
}

function addMonths(value: string, offset: number) {
  return addMonthsToDateKey(value, offset);
}

function getSourceLabel(source: ScheduleSource, language: AppLanguage) {
  if (source === "work") {
    return language === "id" ? "Pekerjaan" : "Work";
  }

  if (source === "activity") {
    return language === "id" ? "Aktivitas" : "Activity";
  }

  return language === "id" ? "Rutinitas" : "Routine";
}

function getStatusLabel(status: ScheduleDisplayStatus, language: AppLanguage) {
  if (status === "upcoming") {
    return language === "id" ? "Akan Datang" : "Upcoming";
  }

  if (status === "done") {
    return language === "id" ? "Selesai" : "Done";
  }

  if (status === "missed") {
    return language === "id" ? "Terlewat" : "Missed";
  }

  return language === "id" ? "Dibatalkan" : "Canceled";
}

function getViewLabel(viewMode: ScheduleViewMode, language: AppLanguage) {
  const labels: Record<ScheduleViewMode, { id: string; en: string }> = {
    today: { id: "Hari Ini", en: "Today" },
    week: { id: "Minggu", en: "Week" },
    month: { id: "Bulan", en: "Month" },
    agenda: { id: "Agenda", en: "Agenda" }
  };

  return labels[viewMode][language];
}

function getRangeLabel(viewMode: ScheduleViewMode, anchorDate: string, language: AppLanguage, timeZone: string) {
  const range = buildScheduleRange(anchorDate, viewMode);

  if (viewMode === "today") {
    return formatDateWithWeekday(anchorDate, language, timeZone);
  }

  if (viewMode === "month") {
    return formatDateTimeInTimeZone(zonedDateTimeToTimestamp(`${anchorDate.slice(0, 7)}-01`, "12:00", timeZone), language === "id" ? "id-ID" : "en-US", timeZone, { month: "long", year: "numeric" });
  }

  return `${formatDate(range.startDate, language, timeZone)} - ${formatDate(range.endDate, language, timeZone)}`;
}

function getTimeLabel(item: ScheduleItem, language: AppLanguage) {
  if (item.isAllDay) {
    return language === "id" ? "Tanpa jam khusus" : "No specific time";
  }

  if (item.startTime && item.endTime) {
    return formatTimeRange(item.startTime, item.endTime);
  }

  if (item.startTime) {
    return item.startTime;
  }

  if (item.endTime) {
    return item.endTime;
  }

  return language === "id" ? "Tanpa jam khusus" : "No specific time";
}

function getEmptyText(language: AppLanguage) {
  return language === "id" ? "Belum ada item jadwal pada rentang ini." : "No schedule items in this range yet.";
}

function ScheduleItemCard({ item, language, compact = false, timeZone }: { item: ScheduleItem; language: AppLanguage; compact?: boolean; timeZone: string }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "block rounded border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/70",
        compact ? "space-y-2" : "space-y-3"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide", sourceTone[item.source])}>{getSourceLabel(item.source, language)}</span>
        <span className={cn("rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide", statusTone[item.displayStatus])}>{getStatusLabel(item.displayStatus, language)}</span>
        {item.priority ? <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">{tPriority(item.priority, language)}</span> : null}
      </div>

      <div>
        <p className="font-semibold text-slate-950 dark:text-slate-50">{item.title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getTimeLabel(item, language)}</p>
      </div>

      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
        <p>{formatDate(item.date, language, timeZone)}</p>
        {item.detailCategory ? <p>{tCategory(item.detailCategory as never, language)}</p> : null}
        {item.deadline && item.deadline !== item.date ? <p>{language === "id" ? "Deadline" : "Deadline"} {formatDate(item.deadline, language, timeZone)}</p> : null}
        {item.notes ? <p className="line-clamp-2">{item.notes}</p> : null}
      </div>
    </Link>
  );
}

function DateSection({ date, items, language, timeZone }: { date: string; items: ScheduleItem[]; language: AppLanguage; timeZone: string }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{formatDateWithWeekday(date, language, timeZone)}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{items.length} {language === "id" ? "item" : "items"}</p>
      </div>
      <div className="grid gap-3">{items.map((item) => <ScheduleItemCard key={item.id} item={item} language={language} timeZone={timeZone} />)}</div>
    </section>
  );
}

function SchedulePageContent() {
  const { tasks, activities, routines, settings } = useDashboardStore();
  const language = settings.language;
  const timeZone = settings.timeZone;
  const now = useNow(60000);
  const reference = now ?? Date.now();
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("today");
  const [anchorDate, setAnchorDate] = useState(() => todayDate(timeZone));
  const [sourceFilter, setSourceFilter] = useState<ScheduleSourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ScheduleStatusFilter>("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const range = useMemo(() => buildScheduleRange(anchorDate, viewMode), [anchorDate, viewMode]);
  const allItems = useMemo(() => buildScheduleItems(tasks, activities, routines, range, reference, timeZone), [activities, reference, range, routines, tasks, timeZone]);
  const filteredItems = useMemo(() => filterScheduleItems(allItems, sourceFilter, statusFilter), [allItems, sourceFilter, statusFilter]);
  const summary = useMemo(() => summarizeScheduleItems(allItems), [allItems]);
  const todaySummary = useMemo(() => {
    const todayItems = buildScheduleItems(tasks, activities, routines, buildScheduleRange(todayDate(timeZone), "today"), reference, timeZone);
    return summarizeScheduleItems(todayItems);
  }, [activities, reference, routines, tasks, timeZone]);
  const itemsByDate = useMemo(() => groupScheduleItemsByDate(filteredItems), [filteredItems]);

  const text = {
    eyebrow: language === "id" ? "Jadwal" : "Schedule",
    title: language === "id" ? "Pusat Jadwal" : "Schedule Hub",
    description: language === "id" ? "Gabungkan Pekerjaan, Aktivitas, dan Rutinitas dalam satu tampilan waktu tanpa mengubah alur edit yang sudah ada." : "View Work, Activities, and Routines in one time-based hub without changing the existing edit flows.",
    date: language === "id" ? "Tanggal" : "Date",
    source: language === "id" ? "Sumber" : "Source",
    status: language === "id" ? "Status" : "Status",
    all: language === "id" ? "Semua" : "All",
    work: language === "id" ? "Pekerjaan" : "Work",
    activities: language === "id" ? "Aktivitas" : "Activities",
    routines: language === "id" ? "Rutinitas" : "Routines",
    upcoming: language === "id" ? "Akan Datang" : "Upcoming",
    done: language === "id" ? "Selesai" : "Done",
    missed: language === "id" ? "Terlewat" : "Missed",
    todayTotal: language === "id" ? "Total jadwal hari ini" : "Today's schedule total",
    workTotal: language === "id" ? "Total pekerjaan" : "Total work",
    activityTotal: language === "id" ? "Total aktivitas" : "Total activities",
    routineTotal: language === "id" ? "Total rutinitas" : "Total routines",
    missedTotal: language === "id" ? "Total terlewat" : "Total missed",
    monthHint: language === "id" ? "Klik tanggal untuk menjadikannya tanggal acuan di Jadwal." : "Click a date to make it the schedule anchor date.",
    filterTitle: language === "id" ? "Filter dan mode tampilan" : "Filters and display mode",
    view: language === "id" ? "Mode tampilan" : "View mode",
    previousRange: language === "id" ? "Rentang sebelumnya" : "Previous range",
    nextRange: language === "id" ? "Rentang berikutnya" : "Next range",
    todayButton: language === "id" ? "Hari ini" : "Today",
    showFilters: language === "id" ? "Tampilkan filter" : "Show filters",
    hideFilters: language === "id" ? "Sembunyikan filter" : "Hide filters"
  };

  function shiftAnchor(direction: -1 | 1) {
    if (viewMode === "month") {
      setAnchorDate((current) => addMonths(current, direction));
      return;
    }

    if (viewMode === "week") {
      setAnchorDate((current) => addDays(current, direction * 7));
      return;
    }

    if (viewMode === "agenda") {
      setAnchorDate((current) => addDays(current, direction * 14));
      return;
    }

    setAnchorDate((current) => addDays(current, direction));
  }

  const monthCells = useMemo(() => {
    if (viewMode !== "month") {
      return [] as Array<{ date: string | null }>;
    }

    const firstDayIndex = (() => {
      const day = new Date(`${range.startDate}T00:00:00`).getDay();
      return day === 0 ? 6 : day - 1;
    })();
    const cells: Array<{ date: string | null }> = Array.from({ length: firstDayIndex }, () => ({ date: null }));

    range.dates.forEach((date) => {
      cells.push({ date });
    });

    while (cells.length % 7 !== 0) {
      cells.push({ date: null });
    }

    return cells;
  }, [range, viewMode]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={text.eyebrow} title={text.title} description={text.description} language={language} timeZone={timeZone} />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5 xl:gap-4">
        <StatCard title={text.todayTotal} value={todaySummary.total} icon={ListTodo} tone="slate" />
        <StatCard title={text.workTotal} value={summary.work} href="/tasks" icon={BriefcaseBusiness} tone="blue" />
        <StatCard title={text.activityTotal} value={summary.activity} href="/activities" icon={ActivityIcon} tone="teal" />
        <StatCard title={text.routineTotal} value={summary.routine} href="/routines" icon={Repeat2} tone="slate" />
        <StatCard title={text.missedTotal} value={summary.missed} icon={TriangleAlert} tone="rose" />
      </section>

      <section className="rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{text.filterTitle}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getRangeLabel(viewMode, anchorDate, language, timeZone)}</p>
          </div>
          <button type="button" onClick={() => setFiltersExpanded((current) => !current)} className="inline-flex shrink-0 items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"><ListFilter className="h-4 w-4" />{filtersExpanded ? text.hideFilters : text.showFilters}</button>
        </div>
        <div className={cn("mt-4 flex-col gap-4 xl:flex xl:flex-row xl:items-end xl:justify-between", filtersExpanded ? "flex" : "hidden md:flex")}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.date}</span>
              <input type="date" value={anchorDate} onChange={(event) => setAnchorDate(event.target.value)} className={getFieldClassName({ filled: Boolean(anchorDate) })} />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.source}</span>
              <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as ScheduleSourceFilter)} className={getFieldClassName({ filled: Boolean(sourceFilter) })}>
                <option value="all">{text.all}</option>
                <option value="work">{text.work}</option>
                <option value="activity">{text.activities}</option>
                <option value="routine">{text.routines}</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.status}</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ScheduleStatusFilter)} className={getFieldClassName({ filled: Boolean(statusFilter) })}>
                <option value="all">{text.all}</option>
                <option value="upcoming">{text.upcoming}</option>
                <option value="done">{text.done}</option>
                <option value="missed">{text.missed}</option>
              </select>
            </label>
            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.view}</span>
              <div className="grid grid-cols-2 gap-2">
                {(["today", "week", "month", "agenda"] as ScheduleViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "rounded border px-3 py-2 text-sm font-semibold",
                      viewMode === mode
                        ? "border-teal-700 bg-teal-700 text-white"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    )}
                  >
                    {getViewLabel(mode, language)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={cn("mt-4 flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700 md:flex", filtersExpanded ? "flex" : "hidden md:flex")}>
          <div className="inline-flex items-center gap-2">
            <button type="button" onClick={() => shiftAnchor(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" aria-label={text.previousRange}><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => setAnchorDate(todayDate(timeZone))} className="inline-flex items-center rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{text.todayButton}</button>
            <button type="button" onClick={() => shiftAnchor(1)} className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" aria-label={text.nextRange}><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="inline-flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
            <ListFilter className="h-4 w-4" />
            <span>{filteredItems.length} {language === "id" ? "item tampil" : "visible items"}</span>
          </div>
        </div>
      </section>

      {viewMode === "today" ? (
        filteredItems.length ? <DateSection date={anchorDate} items={filteredItems} language={language} timeZone={timeZone} /> : <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{getEmptyText(language)}</div>
      ) : null}

      {viewMode === "week" ? (
        <>
        <div className="space-y-4 md:hidden">
          {range.dates.map((date) => (itemsByDate[date] || []).length ? <DateSection key={date} date={date} items={itemsByDate[date] || []} language={language} timeZone={timeZone} /> : null)}
          {!filteredItems.length ? <div className="rounded border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{getEmptyText(language)}</div> : null}
        </div>
        <section className="hidden overflow-x-auto rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:block">
          <div className="grid min-w-[980px] grid-cols-7 gap-4">
            {range.dates.map((date) => (
              <div key={date} className="space-y-3 rounded border border-slate-200 p-3 dark:border-slate-700">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{formatDateWithWeekday(date, language, timeZone)}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{itemsByDate[date]?.length || 0} {language === "id" ? "item" : "items"}</p>
                </div>
                <div className="space-y-3">
                  {(itemsByDate[date] || []).length ? (itemsByDate[date] || []).map((item) => <ScheduleItemCard key={item.id} item={item} language={language} compact timeZone={timeZone} />) : <div className="rounded border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">{language === "id" ? "Kosong" : "Empty"}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
        </>
      ) : null}

      {viewMode === "month" ? (
        <section className="space-y-4 rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">{text.monthHint}</p>
          <div className="space-y-3 md:hidden">
            {range.dates.filter((date) => (itemsByDate[date] || []).length).map((date) => <DateSection key={date} date={date} items={itemsByDate[date] || []} language={language} timeZone={timeZone} />)}
            {!filteredItems.length ? <div className="rounded border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{getEmptyText(language)}</div> : null}
          </div>
          <div className="hidden grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 md:grid">
            {weekdays.map((day) => <div key={day} className="px-2 py-1">{tWeekday(day, language)}</div>)}
          </div>
          <div className="hidden grid-cols-7 gap-2 md:grid">
            {monthCells.map((cell, index) => (
              <div key={`${cell.date || "blank"}-${index}`} className={cn("min-h-32 rounded border p-2", cell.date ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40" : "border-transparent")}>
                {cell.date ? (
                  <button type="button" onClick={() => setAnchorDate(cell.date!)} className={cn("mb-2 inline-flex h-8 w-8 items-center justify-center rounded text-sm font-semibold", cell.date === anchorDate ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800")}>
                    {Number(cell.date.slice(-2))}
                  </button>
                ) : null}
                {cell.date ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{(itemsByDate[cell.date] || []).length} {language === "id" ? "item" : "items"}</p>
                    {(itemsByDate[cell.date] || []).slice(0, 3).map((item) => (
                      <div key={item.id} className={cn("rounded px-2 py-1 text-[11px] font-medium", sourceTone[item.source])}>{item.title}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {viewMode === "agenda" ? (
        filteredItems.length ? (
          <div className="space-y-6">
            {Object.entries(itemsByDate).map(([date, items]) => (
              <DateSection key={date} date={date} items={items} language={language} timeZone={timeZone} />
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{getEmptyText(language)}</div>
        )
      ) : null}

      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-teal-700 dark:text-teal-300" />
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{language === "id" ? "Agenda Ringkas" : "Agenda Snapshot"}</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.slice(0, 6).map((item) => <ScheduleItemCard key={`${item.id}-snapshot`} item={item} language={language} compact timeZone={timeZone} />)}
          {!filteredItems.length ? <div className="rounded border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">{getEmptyText(language)}</div> : null}
        </div>
      </section>
    </div>
  );
}

export default function SchedulePage() {
  return <SchedulePageContent />;
}
