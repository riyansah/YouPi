"use client";

import { Clock3 } from "lucide-react";
import { getLocale } from "@/lib/i18n";
import { APP_DEFAULT_TIME_ZONE, formatDateTimeInTimeZone } from "@/lib/time";
import type { AppLanguage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useNow } from "@/lib/use-now";

interface CurrentDateTimeProps {
  className?: string;
  compact?: boolean;
  mobile?: boolean;
  language?: AppLanguage;
  timeZone?: string;
}

function formatCurrentDateTime(timestamp: number, language: AppLanguage, timeZone: string) {
  const locale = getLocale(language);
  const dayLabel = formatDateTimeInTimeZone(timestamp, locale, timeZone, {
    weekday: "long"
  });
  const dateLabel = formatDateTimeInTimeZone(timestamp, locale, timeZone, {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const timeLabel = formatDateTimeInTimeZone(timestamp, locale, timeZone, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).replaceAll(".", ":");

  return {
    dayDateLabel: `${dayLabel}, ${dateLabel}`,
    timeLabel
  };
}

export function CurrentDateTime({ className, compact = false, mobile = false, language = "en", timeZone = APP_DEFAULT_TIME_ZONE }: CurrentDateTimeProps) {
  const now = useNow();
  const formatted = now === null ? null : formatCurrentDateTime(now, language, timeZone);
  const timezoneLabel = "WIB";
  const condensed = compact || mobile;

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border border-slate-200/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] text-left shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))]",
        condensed ? "px-3 py-2" : "px-4 py-3",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.12),transparent_48%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.1),transparent_54%)]" />
      <div className="relative flex min-w-0 items-center gap-2 whitespace-nowrap">
        <div className={cn("flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-200", condensed ? "h-8 w-8" : "h-9 w-9")}>
          <Clock3 className={cn(condensed ? "h-4 w-4" : "h-5 w-5")} />
        </div>
        <p className={cn("min-w-0 truncate font-medium text-slate-600 dark:text-slate-300", condensed ? "text-[11px]" : "text-sm")}>
          {formatted?.dayDateLabel || (language === "id" ? "Memuat hari, tanggal" : "Loading day, date")}
        </p>
        <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
        <p className={cn("shrink-0 font-black tabular-nums text-slate-950 dark:text-white", condensed ? "text-[14px]" : "text-base sm:text-lg")}>
          {formatted?.timeLabel || "--:--:--"}
        </p>
        <span className={cn("shrink-0 rounded-full border border-slate-300 bg-slate-100 font-bold uppercase tracking-[0.16em] text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100", condensed ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]")}>{timezoneLabel}</span>
      </div>
    </div>
  );
}
