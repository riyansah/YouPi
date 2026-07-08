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

  return { dayLabel, dateLabel, timeLabel };
}

export function CurrentDateTime({ className, compact = false, language = "en", timeZone = APP_DEFAULT_TIME_ZONE }: CurrentDateTimeProps) {
  const now = useNow();
  const formatted = now === null ? null : formatCurrentDateTime(now, language, timeZone);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border border-teal-200/80 bg-[linear-gradient(135deg,rgba(240,253,250,0.96),rgba(255,255,255,0.96))] px-3 py-2 text-left shadow-[0_14px_34px_-20px_rgba(13,148,136,0.55)] backdrop-blur dark:border-teal-900/70 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,118,110,0.22))] dark:shadow-[0_18px_40px_-24px_rgba(45,212,191,0.45)]",
        compact ? "min-w-[11rem] px-3 py-2" : "min-w-[14rem] px-4 py-3",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.22),transparent_50%)]" />
      <div className="relative flex items-start gap-3">
        <div className={cn("flex shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/75 text-teal-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-teal-200", compact ? "h-9 w-9" : "h-10 w-10")}>
          <Clock3 className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
        </div>
        <div className="min-w-0">
          <p className={cn("truncate uppercase tracking-[0.18em] text-teal-700/80 dark:text-teal-200/80", compact ? "text-[9px] font-semibold" : "text-[10px] font-semibold")}>
            {formatted?.dayLabel || (language === "id" ? "Memuat hari" : "Loading day")}
          </p>
          <p className={cn("mt-1 truncate font-medium text-slate-600 dark:text-slate-300", compact ? "text-[11px]" : "text-xs")}>
            {formatted?.dateLabel || (language === "id" ? "Memuat tanggal" : "Loading date")}
          </p>
          <p className={cn("mt-1 font-black tabular-nums text-slate-950 dark:text-slate-50", compact ? "text-base" : "text-lg sm:text-xl")}>
            {formatted?.timeLabel || "--:--:--"}
          </p>
        </div>
      </div>
    </div>
  );
}
