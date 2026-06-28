"use client";

import { useEffect, useState } from "react";
import type {
  Activity,
  ActivityCategory,
  ActivityStatus,
  ActivitySummary,
  ReportPeriod,
  Routine,
  Task,
  TaskPriority,
  TaskStatus,
  TaskSummary,
  Weekday
} from "@/lib/types";
import { weekdays } from "@/lib/types";

export interface TodayAgendaItem {
  id: string;
  type: "Aktivitas" | "Rutinitas";
  title: string;
  startTime: string;
  endTime: string;
  metaLabel: string;
  href: string;
  status?: ActivityStatus;
  priority?: TaskPriority;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const startIndex = totalItems ? (currentPage - 1) * safePageSize : 0;
  const endIndex = totalItems ? Math.min(startIndex + safePageSize, totalItems) : 0;

  return {
    items: items.slice(startIndex, endIndex),
    currentPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: endIndex
  };
}

export function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateWithWeekday(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime} - ${endTime}`;
}

export function getDeadlineTimestamp(value: string) {
  return new Date(`${value}T23:59:59.999`).getTime();
}

type CountdownTone = "green" | "amber" | "red";

export interface DeadlineCountdownState {
  fullLabel: string;
  displayLabel: string;
  isOverdue: boolean;
  tone: CountdownTone;
}

function getCountdownParts(diffMs: number) {
  const absoluteSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const days = Math.floor(absoluteSeconds / 86400);
  const hours = Math.floor((absoluteSeconds % 86400) / 3600);
  const minutes = Math.floor((absoluteSeconds % 3600) / 60);
  const seconds = absoluteSeconds % 60;

  return { days, hours, minutes, seconds };
}

function padCountdown(value: number) {
  return String(value).padStart(2, "0");
}

function formatOverdueCompact(days: number, hours: number, minutes: number) {
  if (days > 0) {
    return `Terlambat ${padCountdown(days)} Hari ${padCountdown(hours)} Jam`;
  }

  if (hours > 0) {
    return `Terlambat ${padCountdown(hours)} Jam`;
  }

  return `Terlambat ${padCountdown(minutes)} Menit`;
}

export function getDeadlineCountdownTone(value: string, now = Date.now()): CountdownTone {
  const diff = getDeadlineTimestamp(value) - now;

  if (diff < 86400000) {
    return "red";
  }

  if (diff < 259200000) {
    return "amber";
  }

  return "green";
}

export function getDeadlineCountdownState(value: string, now = Date.now()): DeadlineCountdownState {
  const diff = getDeadlineTimestamp(value) - now;
  const { days, hours, minutes, seconds } = getCountdownParts(diff);
  const detail = `${days} hari ${hours} jam ${minutes} menit ${seconds} detik`;

  return {
    fullLabel: diff >= 0 ? `${detail} lagi` : `Terlambat ${detail}`,
    displayLabel:
      diff >= 0
        ? `${padCountdown(days)}:${padCountdown(hours)}:${padCountdown(minutes)}:${padCountdown(seconds)}`
        : formatOverdueCompact(days, hours, minutes),
    isOverdue: diff < 0,
    tone: getDeadlineCountdownTone(value, now)
  };
}

export function formatDeadlineCountdown(value: string, now = Date.now()) {
  return getDeadlineCountdownState(value, now).displayLabel;
}

export function getWeekdayFromDate(value: string): Weekday {
  const dayIndex = new Date(`${value}T00:00:00`).getDay();
  const ordered: Weekday[] = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return ordered[dayIndex];
}

function getWeekdayOrder(day: Weekday) {
  return weekdays.indexOf(day);
}

export function sortWeekdays(days: Weekday[]) {
  return [...days].sort((a, b) => getWeekdayOrder(a) - getWeekdayOrder(b));
}

export function formatRoutineDays(days: Weekday[]) {
  return sortWeekdays(days).join(", ");
}

export function isRoutineScheduledForDate(routine: Routine, value: string) {
  return routine.days.includes(getWeekdayFromDate(value));
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function getCurrentTimeValue(now = Date.now()) {
  const date = new Date(now);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function sortRoutines(routines: Routine[]) {
  return [...routines].sort((a, b) => {
    const dayDiff = getWeekdayOrder(sortWeekdays(a.days)[0]) - getWeekdayOrder(sortWeekdays(b.days)[0]);
    if (dayDiff !== 0) {
      return dayDiff;
    }

    return a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title);
  });
}

export function buildTodayAgendaItems(
  activities: Activity[],
  routines: Routine[],
  date = todayDate(),
  now = Date.now()
): TodayAgendaItem[] {
  const currentTime = getCurrentTimeValue(now);

  const overdueActivities = activities
    .filter((activity) => activity.date === date && activity.status !== "Selesai" && activity.endTime < currentTime)
    .sort((a, b) => b.endTime.localeCompare(a.endTime) || a.startTime.localeCompare(b.startTime))
    .map<TodayAgendaItem>((activity) => ({
      id: activity.id,
      type: "Aktivitas",
      title: activity.title,
      startTime: activity.startTime,
      endTime: activity.endTime,
      metaLabel: activity.category,
      href: `/activities?activityId=${activity.id}`,
      status: activity.status
    }));

  const upcomingActivities = activities
    .filter((activity) => activity.date === date && activity.status !== "Selesai" && activity.endTime >= currentTime)
    .map<TodayAgendaItem>((activity) => ({
      id: activity.id,
      type: "Aktivitas",
      title: activity.title,
      startTime: activity.startTime,
      endTime: activity.endTime,
      metaLabel: activity.category,
      href: `/activities?activityId=${activity.id}`,
      status: activity.status
    }));

  const visibleRoutines = routines
    .filter((routine) => isRoutineScheduledForDate(routine, date) && routine.endTime >= currentTime)
    .map<TodayAgendaItem>((routine) => ({
      id: routine.id,
      type: "Rutinitas",
      title: routine.title,
      startTime: routine.startTime,
      endTime: routine.endTime,
      metaLabel: `Prioritas ${routine.priority}`,
      href: `/routines?routineId=${routine.id}`,
      priority: routine.priority
    }));

  const remainingItems = [...upcomingActivities, ...visibleRoutines].sort((a, b) => {
    const timeDiff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (timeDiff !== 0) {
      return timeDiff;
    }

    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }

    return a.title.localeCompare(b.title);
  });

  return [...overdueActivities, ...remainingItems];
}

export function sortTasksByNearestDeadline(tasks: Task[]) {
  return [...tasks]
    .filter((task) => task.status !== "Selesai" && task.status !== "Dibatalkan")
    .sort(
      (a, b) => getDeadlineTimestamp(a.deadline) - getDeadlineTimestamp(b.deadline) || a.createdAt.localeCompare(b.createdAt)
    );
}

export function useLocalStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(key);

    if (stored) {
      try {
        setValue(JSON.parse(stored) as T);
      } catch {
        setValue(fallback);
      }
    }

    setLoaded(true);
  }, [fallback, key]);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, loaded, value]);

  return [value, setValue] as const;
}

export function summarizeTasks(tasks: Task[]): TaskSummary {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "Selesai").length;
  const running = tasks.filter((task) => task.status === "Berjalan").length;
  const pending = tasks.filter((task) => task.status === "Tertunda").length;
  const canceled = tasks.filter((task) => task.status === "Dibatalkan").length;
  const today = todayDate();
  const overdue = tasks.filter(
    (task) => task.deadline < today && task.status !== "Selesai" && task.status !== "Dibatalkan"
  ).length;

  return {
    total,
    running,
    completed,
    pending,
    canceled,
    overdue,
    completionRate: total ? Math.round((completed / total) * 100) : 0
  };
}

export function summarizeActivities(activities: Activity[]): ActivitySummary {
  const today = todayDate();
  const categoryCounts = countBy(activities, "category");
  const titleCounts = countBy(activities, "title");

  return {
    total: activities.length,
    today: activities.filter((activity) => activity.date === today).length,
    dominantCategory: topEntry(categoryCounts) as ActivityCategory | "-",
    mostFrequentActivity: topEntry(titleCounts) || "-"
  };
}

export function countBy<T, K extends keyof T>(items: T[], key: K) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

export function topEntry(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
}

export function taskStatusChartData(tasks: Task[]) {
  const counts = countBy(tasks, "status");
  const statuses: TaskStatus[] = ["Berjalan", "Selesai", "Tertunda", "Dibatalkan"];
  return statuses.map((status) => ({ name: status, value: counts[status] || 0 }));
}

export function activityCategoryChartData(activities: Activity[]) {
  const counts = countBy(activities, "category");
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function activityPerDayChartData(activities: Activity[]) {
  const counts = countBy(activities, "date");
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, total]) => ({ date: formatDate(date), total }));
}

export function weeklyProgressData(tasks: Task[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });

  return days.map((date) => {
    const completed = tasks.filter((task) => task.completedAt?.slice(0, 10) === date).length;
    return { date: formatDate(date), completed };
  });
}

export function filterByReportPeriod<T extends { date?: string; createdAt: string }>(
  items: T[],
  selectedDate: string,
  period: ReportPeriod
) {
  return items.filter((item) => {
    const value = item.date || item.createdAt.slice(0, 10);

    if (period === "Harian") {
      return value === selectedDate;
    }

    if (period === "Bulanan") {
      return value.slice(0, 7) === selectedDate.slice(0, 7);
    }

    return getWeekKey(value) === getWeekKey(selectedDate);
  });
}

export function getWeekKey(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const dayOffset = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);
  const week = Math.ceil((dayOffset + firstDay.getDay() + 1) / 7);
  return `${date.getFullYear()}-${week}`;
}

export function toCsv(rows: Array<Record<string, string | number | null>>) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;

  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}
