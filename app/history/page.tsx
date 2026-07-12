"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Clock3, ExternalLink, ListFilter, Search, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useDashboardStore } from "@/lib/dashboard-store";
import { formatHistoryMetadata } from "@/lib/history-utils";
import type { HistoryEventRecord, HistoryEventType } from "@/lib/types";
import { getFieldClassName, getFieldShellClassName } from "@/lib/field-styles";
import { dateKeyFromTimestamp, formatDate, todayDate } from "@/lib/utils";
import { APP_DEFAULT_TIME_ZONE, addDaysToDateKey, formatDateTimeInTimeZone } from "@/lib/time";

const eventOptions = ["all", "created", "updated", "completed", "missed", "cancelled", "deleted", "pinned", "unpinned"] as const;
type EntityFilter = "all" | "work" | "activity" | "routine" | "note";
type TimeFilter = "today" | "week" | "month" | "custom";

const eventTone: Record<HistoryEventType, string> = {
  created: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-100",
  updated: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
  missed: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-100",
  cancelled: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-100",
  deleted: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  pinned: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-100",
  unpinned: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-100"
};

function shiftDate(baseDate: string, days: number) {
  return addDaysToDateKey(baseDate, days);
}

function getRange(filter: TimeFilter, customFrom: string, customTo: string, timeZone: string) {
  if (filter === "today") {
    const date = todayDate(timeZone);
    return { from: date, to: date };
  }

  if (filter === "week") {
    const today = todayDate(timeZone);
    return { from: shiftDate(today, -6), to: today };
  }

  if (filter === "month") {
    const today = todayDate(timeZone);
    return { from: shiftDate(today, -29), to: today };
  }

  return { from: customFrom || "", to: customTo || "" };
}

function groupByDate(items: HistoryEventRecord[]) {
  return items.reduce<Record<string, HistoryEventRecord[]>>((groups, item) => {
    const key = dateKeyFromTimestamp(item.createdAt, APP_DEFAULT_TIME_ZONE);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

function eventLabel(type: HistoryEventType, language: "en" | "id") {
  const labels: Record<HistoryEventType, { en: string; id: string }> = {
    created: { en: "Created", id: "Dibuat" },
    updated: { en: "Updated", id: "Diperbarui" },
    completed: { en: "Completed", id: "Selesai" },
    missed: { en: "Missed", id: "Terlewat" },
    cancelled: { en: "Cancelled", id: "Dibatalkan" },
    deleted: { en: "Deleted", id: "Dihapus" },
    pinned: { en: "Pinned", id: "Disematkan" },
    unpinned: { en: "Unpinned", id: "Lepas sematan" }
  };

  return labels[type][language];
}

function entityLabel(type: HistoryEventRecord["entityType"], language: "en" | "id") {
  if (type === "work") return language === "id" ? "Pekerjaan" : "Work";
  if (type === "activity") return language === "id" ? "Aktivitas" : "Activity";
  if (type === "routine") return language === "id" ? "Rutinitas" : "Routine";
  return language === "id" ? "Catatan" : "Notes";
}

function relativeDateLabel(value: string, language: "en" | "id", timeZone: string) {
  const today = todayDate(timeZone);
  const yesterday = shiftDate(today, -1);
  if (value === today) {
    return language === "id" ? "Hari Ini" : "Today";
  }
  if (value === yesterday) {
    return language === "id" ? "Kemarin" : "Yesterday";
  }
  return formatDate(value, language, timeZone);
}

function formatTime(value: string, language: "en" | "id", timeZone: string) {
  return formatDateTimeInTimeZone(value, language === "id" ? "id-ID" : "en-US", timeZone, {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function HistoryPage() {
  const { settings } = useDashboardStore();
  const language = settings.language;
  const timeZone = settings.timeZone;
  const [items, setItems] = useState<HistoryEventRecord[]>([]);
  const [selected, setSelected] = useState<HistoryEventRecord | null>(null);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState<EntityFilter>("all");
  const [eventType, setEventType] = useState<(typeof eventOptions)[number]>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [customFrom, setCustomFrom] = useState(() => todayDate(timeZone));
  const [customTo, setCustomTo] = useState(() => todayDate(timeZone));
  const [loading, setLoading] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const text = {
    all: language === "id" ? "Semua" : "All",
    allEvents: language === "id" ? "Semua event" : "All Events",
    category: language === "id" ? "Kategori" : "Category",
    customDate: language === "id" ? "Tanggal kustom" : "Custom Date",
    description: language === "id" ? "Deskripsi" : "Description",
    detail: language === "id" ? "Detail Riwayat" : "History Detail",
    empty: language === "id" ? "Belum ada history yang cocok dengan filter ini." : "No history matches the current filters.",
    detailFailed: language === "id" ? "Gagal memuat detail history." : "Failed to load history detail.",
    event: language === "id" ? "Event" : "Event",
    from: language === "id" ? "Dari" : "From",
    linkedItem: language === "id" ? "Item Terkait" : "Linked Item",
    loading: language === "id" ? "Memuat riwayat..." : "Loading history...",
    loadingDetail: language === "id" ? "Memuat..." : "Loading...",
    metadata: language === "id" ? "Metadata" : "Metadata",
    search: language === "id" ? "Cari" : "Search",
    time: language === "id" ? "Waktu" : "Time",
    timeMonth: language === "id" ? "Bulan Ini" : "This Month",
    timeToday: language === "id" ? "Hari Ini" : "Today",
    timeWeek: language === "id" ? "Minggu Ini" : "This Week",
    to: language === "id" ? "Sampai" : "To",
    showFilters: language === "id" ? "Tampilkan filter" : "Show filters",
    hideFilters: language === "id" ? "Sembunyikan filter" : "Hide filters"
  };

  const range = useMemo(() => getRange(timeFilter, customFrom, customTo, timeZone), [customFrom, customTo, timeFilter, timeZone]);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (entityType !== "all") params.set("entityType", entityType);
    if (eventType !== "all") params.set("eventType", eventType);
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/history?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed");
        }
        const data = (await response.json()) as HistoryEventRecord[];
        if (!ignore) {
          setItems(data);
          setSelected((current) => current ? data.find((item) => item.id === current.id) || null : null);
        }
      } catch {
        if (!ignore) {
          setError(language === "id" ? "Gagal memuat history." : "Failed to load history.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [entityType, eventType, language, range.from, range.to, search]);

  const grouped = useMemo(() => groupByDate(items), [items]);
  const dates = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  async function openDetail(id: string) {
    setSelected(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/history/${id}`);
      if (!response.ok) {
        throw new Error("Failed");
      }
      const data = (await response.json()) as HistoryEventRecord;
      setSelected(data);
    } catch {
      setDetailError(text.detailFailed);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={language === "id" ? "Riwayat" : "History"}
        title={language === "id" ? "Riwayat" : "History"}
        description={language === "id" ? "Timeline otomatis untuk melihat kembali jejak perubahan penting dari Work, Activities, Routines, dan Notes." : "An automatic timeline of important changes across Work, Activities, Routines, and Notes."}
        language={language} timeZone={timeZone}
      />

      <section className="rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-5">
        <div className="flex items-center justify-between gap-3 md:hidden">
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{text.search} & {text.category}</p>
          <button type="button" onClick={() => setFiltersExpanded((current) => !current)} className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><ListFilter className="h-4 w-4" />{filtersExpanded ? text.hideFilters : text.showFilters}</button>
        </div>
        <div className={(filtersExpanded ? "grid" : "hidden md:grid") + " mt-4 gap-4 xl:grid-cols-[2fr_1fr_1fr_1fr] md:mt-0"}>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.search}</span>
            <div className={getFieldShellClassName({ filled: Boolean(search) }) + " px-3 py-2"}>
              <Search className="h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={language === "id" ? "Cari title, description, category, atau event" : "Search title, description, category, or event"} className="ml-2 w-full bg-transparent text-sm outline-none dark:text-slate-100" />
            </div>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.category}</span>
            <select value={entityType} onChange={(event) => setEntityType(event.target.value as EntityFilter)} className={getFieldClassName({ filled: Boolean(entityType) })}>
              <option value="all">{text.all}</option>
              <option value="work">{entityLabel("work", language)}</option>
              <option value="activity">{entityLabel("activity", language)}</option>
              <option value="routine">{entityLabel("routine", language)}</option>
              <option value="note">{entityLabel("note", language)}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.event}</span>
            <select value={eventType} onChange={(event) => setEventType(event.target.value as (typeof eventOptions)[number])} className={getFieldClassName({ filled: Boolean(eventType) })}>
              <option value="all">{text.allEvents}</option>
              {eventOptions.filter((item) => item !== "all").map((item) => <option key={item} value={item}>{eventLabel(item, language)}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.time}</span>
            <select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeFilter)} className={getFieldClassName({ filled: Boolean(timeFilter) })}>
              <option value="today">{text.timeToday}</option>
              <option value="week">{text.timeWeek}</option>
              <option value="month">{text.timeMonth}</option>
              <option value="custom">{text.customDate}</option>
            </select>
          </label>
        </div>
        {timeFilter === "custom" ? (
          <div className={(filtersExpanded ? "grid" : "hidden md:grid") + " mt-4 gap-4 sm:grid-cols-2"}>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.from}</span>
              <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className={getFieldClassName({ filled: Boolean(customFrom) })} />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.to}</span>
              <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className={getFieldClassName({ filled: Boolean(customTo) })} />
            </label>
          </div>
        ) : null}
      </section>

      {error ? <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">{error}</div> : null}

      <section className="space-y-6">
        {loading ? <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{text.loading}</div> : null}
        {!loading && !items.length ? <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{text.empty}</div> : null}
        {!loading && dates.map((date) => (
          <section key={date} className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-teal-700 dark:text-teal-300" />
              <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{relativeDateLabel(date, language, timeZone)}</h2>
            </div>
            <div className="space-y-3 border-l border-slate-200 pl-4 dark:border-slate-700">
              {grouped[date].map((item) => (
                <button key={item.id} type="button" onClick={() => void openDetail(item.id)} className="block w-full rounded border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/70 md:p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${eventTone[item.eventType]}`}>{eventLabel(item.eventType, language)}</span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-100">{entityLabel(item.entityType, language)}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Clock3 className="h-3.5 w-3.5" />{formatTime(item.createdAt, language, timeZone)}</span>
                  </div>
                  <p className="mt-3 font-semibold text-slate-950 dark:text-slate-50">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.linkedItem.exists ? (language === "id" ? "Item masih tersedia" : "Linked item is available") : language === "id" ? "Item terkait sudah tidak tersedia" : "Linked item is no longer available"}</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </section>

      {selected || detailLoading || detailError ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
          <button type="button" className="flex-1" onClick={() => { setSelected(null); setDetailError(null); }} aria-label={language === "id" ? "Tutup detail history" : "Close history detail"} />
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-teal-700 dark:text-teal-300">{text.detail}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-50">{selected?.title || (language === "id" ? "Memuat detail..." : "Loading detail...")}</h2>
              </div>
              <button type="button" onClick={() => { setSelected(null); setDetailError(null); }} className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
            </div>
            {detailLoading && !selected ? <p className="text-sm text-slate-500 dark:text-slate-400">{text.loadingDetail}</p> : null}
            {detailError ? <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">{detailError}</div> : null}
            {selected ? (
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${eventTone[selected.eventType]}`}>{eventLabel(selected.eventType, language)}</span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-100">{entityLabel(selected.entityType, language)}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{text.description}</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-200">{selected.description}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{text.time}</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-200">{new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.createdAt))}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{text.linkedItem}</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-200">{selected.linkedItem.exists ? selected.linkedItem.label || "-" : language === "id" ? "Item terkait sudah tidak tersedia." : "The linked item is no longer available."}</p>
                  {selected.linkedItem.exists && selected.linkedItem.href ? <Link href={selected.linkedItem.href} className="mt-3 inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"><ExternalLink className="h-4 w-4" />{language === "id" ? "Buka item terkait" : "Open linked item"}</Link> : null}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{text.metadata}</p>
                  <pre className="mt-1 overflow-x-auto rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">{formatHistoryMetadata(selected.metadata)}</pre>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
