import {
  APP_DEFAULT_TIME_ZONE,
  addDaysToDateKey,
  endOfMonthDateKey,
  formatDateKeyInTimeZone,
  getCurrentTimestampInTimeZone,
  getDateKeyFromTimestamp,
  getDateKeyInTimeZone,
  getEndOfDayTimestampInTimeZone,
  getTimeValueInTimeZone,
  getWeekdayIndexFromDateKey,
  startOfWeekDateKey,
  zonedDateTimeToTimestamp
} from "@/lib/time";

import type {
  Activity,
  ActivityCategory,
  ActivityStatus,
  ActivitySummary,
  AppLanguage,
  ReportPeriod,
  Routine,
  ScheduleDisplayStatus,
  ScheduleItem,
  ScheduleSourceFilter,
  ScheduleStatusFilter,
  ScheduleViewMode,
  Task,
  TaskPriority,
  TaskStatus,
  TaskSummary,
  Weekday
} from "@/lib/types";
import { taskStatuses, weekdays } from "@/lib/types";

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

export function todayDate(timeZone = APP_DEFAULT_TIME_ZONE, reference = Date.now()) {
  return getDateKeyInTimeZone(reference, timeZone);
}

export function nowIso() {
  return getCurrentTimestampInTimeZone();
}

export function dateKeyFromTimestamp(value: string | number | Date, timeZone = APP_DEFAULT_TIME_ZONE) {
  return getDateKeyFromTimestamp(value, timeZone);
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

export function formatDate(value: string, language: "id" | "en" = "id", timeZone = APP_DEFAULT_TIME_ZONE) {
  if (!value) {
    return "-";
  }

  return formatDateKeyInTimeZone(value, language === "id" ? "id-ID" : "en-US", timeZone);
}

export function formatDateWithWeekday(value: string, language: "id" | "en" = "id", timeZone = APP_DEFAULT_TIME_ZONE) {
  if (!value) {
    return "-";
  }

  return formatDateKeyInTimeZone(value, language === "id" ? "id-ID" : "en-US", timeZone, true);
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime} - ${endTime}`;
}

export function getDeadlineTimestamp(value: string, endTime?: string | null, timeZone = APP_DEFAULT_TIME_ZONE) {
  if (endTime) {
    return zonedDateTimeToTimestamp(value, endTime, timeZone, true);
  }

  return getEndOfDayTimestampInTimeZone(value, timeZone);
}

export function getTaskStartTimestamp(value: string, startTime?: string | null, timeZone = APP_DEFAULT_TIME_ZONE) {
  return zonedDateTimeToTimestamp(value, startTime || "00:00", timeZone);
}

export function getActivityStartTimestamp(value: string, startTime: string, timeZone = APP_DEFAULT_TIME_ZONE) {
  return zonedDateTimeToTimestamp(value, startTime, timeZone);
}

export function getActivityEndTimestamp(value: string, endTime: string, timeZone = APP_DEFAULT_TIME_ZONE) {
  return zonedDateTimeToTimestamp(value, endTime, timeZone, true);
}

function resolveStatusTimestamp(reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  return typeof reference === "string" ? getEndOfDayTimestampInTimeZone(reference, timeZone) : reference;
}

function referenceDate(reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  return typeof reference === "string" ? reference : getDateKeyInTimeZone(reference, timeZone);
}

export type RoutineEffectiveStatus = "Akan Datang" | "Berjalan" | null;

type CountdownTone = "green" | "amber" | "red";

export interface DeadlineCountdownState {
  fullLabel: string;
  displayLabel: string;
  isOverdue: boolean;
  tone: CountdownTone;
}

export interface TaskCountdownState extends DeadlineCountdownState {
  mode: "upcoming" | "active";
  label: string;
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

function formatOverdueCompact(days: number, hours: number, minutes: number, language: AppLanguage = "id") {
  if (days > 0) {
    return language === "id"
      ? `Terlambat ${padCountdown(days)} Hari ${padCountdown(hours)} Jam`
      : `Overdue ${padCountdown(days)}d ${padCountdown(hours)}h`;
  }

  if (hours > 0) {
    return language === "id" ? `Terlambat ${padCountdown(hours)} Jam` : `Overdue ${padCountdown(hours)}h`;
  }

  return language === "id" ? `Terlambat ${padCountdown(minutes)} Menit` : `Overdue ${padCountdown(minutes)}m`;
}

function getCountdownToneByDiff(diff: number): CountdownTone {
  if (diff < 86400000) {
    return "red";
  }

  if (diff < 259200000) {
    return "amber";
  }

  return "green";
}

function getTimestampCountdownState(timestamp: number, now = Date.now(), language: AppLanguage = "id"): DeadlineCountdownState {
  const diff = timestamp - now;
  const { days, hours, minutes, seconds } = getCountdownParts(diff);
  const detail = language === "id"
    ? `${days} hari ${hours} jam ${minutes} menit ${seconds} detik`
    : `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;

  return {
    fullLabel: diff >= 0 ? (language === "id" ? `${detail} lagi` : `${detail} remaining`) : language === "id" ? `Terlambat ${detail}` : `Overdue ${detail}`,
    displayLabel:
      diff >= 0
        ? `${padCountdown(days)}:${padCountdown(hours)}:${padCountdown(minutes)}:${padCountdown(seconds)}`
        : formatOverdueCompact(days, hours, minutes, language),
    isOverdue: diff < 0,
    tone: getCountdownToneByDiff(diff)
  };
}

export function isTerminalTaskStatus(status: TaskStatus) {
  return status === "Selesai" || status === "Dibatalkan";
}

export function normalizeTaskStatusForTime(status: TaskStatus, startDate: string, startTime?: string | null, now = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE): TaskStatus {
  if (isTerminalTaskStatus(status)) {
    return status;
  }

  if (getTaskStartTimestamp(startDate, startTime, timeZone) > now) {
    return "Akan Datang";
  }

  return status === "Akan Datang" ? "Berjalan" : status;
}

export function normalizeTaskStatusForDate(status: TaskStatus, startDate: string, currentDate = todayDate(), timeZone = APP_DEFAULT_TIME_ZONE): TaskStatus {
  return normalizeTaskStatusForTime(status, startDate, null, resolveStatusTimestamp(currentDate, timeZone), timeZone);
}

export function getEffectiveTaskStatus(task: Task, reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  return normalizeTaskStatusForTime(task.status, task.startDate, task.startTime, resolveStatusTimestamp(reference, timeZone), timeZone);
}

export function isTerminalActivityStatus(status: ActivityStatus) {
  return status === "Selesai" || status === "Dibatalkan";
}

export function normalizeActivityStatusForTime(status: ActivityStatus, date: string, startTime: string, now = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE): ActivityStatus {
  if (isTerminalActivityStatus(status)) {
    return status;
  }

  if (getActivityStartTimestamp(date, startTime, timeZone) > now) {
    return "Akan Datang";
  }

  return status === "Akan Datang" || status === "Direncanakan" ? "Berjalan" : status;
}

export function getEffectiveActivityStatus(activity: Activity, reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  return normalizeActivityStatusForTime(activity.status, activity.date, activity.startTime, resolveStatusTimestamp(reference, timeZone), timeZone);
}

export function normalizeTasksForTime(tasks: Task[], now = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  let changed = false;
  const updatedAt = getCurrentTimestampInTimeZone(timeZone);
  const next = tasks.map((task) => {
    const status = normalizeTaskStatusForTime(task.status, task.startDate, task.startTime, now, timeZone);

    if (status === task.status) {
      return task;
    }

    changed = true;
    return {
      ...task,
      status,
      completedAt: status === "Selesai" ? task.completedAt : null,
      updatedAt
    };
  });

  return changed ? next : tasks;
}

export function normalizeActivitiesForTime(activities: Activity[], now = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  let changed = false;
  const updatedAt = getCurrentTimestampInTimeZone(timeZone);
  const next = activities.map((activity) => {
    const status = normalizeActivityStatusForTime(activity.status, activity.date, activity.startTime, now, timeZone);

    if (status === activity.status) {
      return activity;
    }

    changed = true;
    return { ...activity, status, updatedAt };
  });

  return changed ? next : activities;
}

export function getEffectiveRoutineStatus(routine: Routine, now = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE): RoutineEffectiveStatus {
  const date = referenceDate(now, timeZone);

  if (!isRoutineScheduledForDate(routine, date)) {
    return null;
  }

  if (getActivityStartTimestamp(date, routine.startTime, timeZone) > now) {
    return "Akan Datang";
  }

  return getActivityEndTimestamp(date, routine.endTime, timeZone) >= now ? "Berjalan" : null;
}

export function getOverdueActivities(activities: Activity[], now = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  return activities
    .filter((activity) => getEffectiveActivityStatus(activity, now, timeZone) !== "Selesai" && getActivityEndTimestamp(activity.date, activity.endTime, timeZone) < now)
    .sort((a, b) => getActivityEndTimestamp(a.date, a.endTime, timeZone) - getActivityEndTimestamp(b.date, b.endTime, timeZone) || a.title.localeCompare(b.title));
}

export function countActivitiesNeedingAction(activities: Activity[], now = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  return getOverdueActivities(activities, now, timeZone).length;
}

export function countActiveWorkItems(tasks: Task[], reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  return summarizeTasks(tasks, reference, timeZone).running;
}

export function restoreItemAtIndex<T extends { id: string }>(items: T[], item: T, index: number) {
  if (items.some((current) => current.id === item.id)) {
    return items;
  }

  const safeIndex = Math.min(Math.max(index, 0), items.length);
  return [...items.slice(0, safeIndex), item, ...items.slice(safeIndex)];
}

export function getDeadlineCountdownTone(value: string, now = Date.now(), endTime?: string | null, timeZone = APP_DEFAULT_TIME_ZONE): CountdownTone {
  return getCountdownToneByDiff(getDeadlineTimestamp(value, endTime, timeZone) - now);
}

export function getDeadlineCountdownState(value: string, now = Date.now(), endTime?: string | null, timeZone = APP_DEFAULT_TIME_ZONE, language: AppLanguage = "id"): DeadlineCountdownState {
  return getTimestampCountdownState(getDeadlineTimestamp(value, endTime, timeZone), now, language);
}

export function getTaskCountdownState(task: Task, now = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE, language: AppLanguage = "id"): TaskCountdownState | null {
  const status = getEffectiveTaskStatus(task, now, timeZone);

  if (isTerminalTaskStatus(status)) {
    return null;
  }

  if (status === "Akan Datang") {
    return {
      ...getTimestampCountdownState(getTaskStartTimestamp(task.startDate, task.startTime, timeZone), now, language),
      mode: "upcoming",
      label: language === "id" ? "Mulai dalam" : "Starts in"
    };
  }

  return {
    ...getDeadlineCountdownState(task.deadline, now, task.endTime, timeZone, language),
    mode: "active",
    label: "Deadline"
  };
}

export function formatDeadlineCountdown(value: string, now = Date.now(), endTime?: string | null, timeZone = APP_DEFAULT_TIME_ZONE) {
  return getDeadlineCountdownState(value, now, endTime, timeZone).displayLabel;
}

export function getWeekdayFromDate(value: string): Weekday {
  const dayIndex = getWeekdayIndexFromDateKey(value);
  const ordered: Weekday[] = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return ordered[dayIndex];
}

function getWeekdayOrder(day: Weekday) {
  return weekdays.indexOf(day);
}

export function sortWeekdays(days: Weekday[]) {
  return [...days].sort((a, b) => getWeekdayOrder(a) - getWeekdayOrder(b));
}

export function formatRoutineDays(days: Weekday[], language: "id" | "en" = "id") {
  const ordered = sortWeekdays(days);

  if (language === "id") {
    return ordered.join(", ");
  }

  const labels: Record<Weekday, string> = {
    Senin: "Monday",
    Selasa: "Tuesday",
    Rabu: "Wednesday",
    Kamis: "Thursday",
    Jumat: "Friday",
    Sabtu: "Saturday",
    Minggu: "Sunday"
  };

  return ordered.map((day) => labels[day]).join(", ");
}

export function isRoutineScheduledForDate(routine: Routine, value: string) {
  return routine.days.includes(getWeekdayFromDate(value));
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function getCurrentTimeValue(now = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  return getTimeValueInTimeZone(now, timeZone);
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
  date: string | undefined = undefined,
  now = Date.now(),
  timeZone = APP_DEFAULT_TIME_ZONE
): TodayAgendaItem[] {
  const resolvedDate = date || todayDate(timeZone, now);
  const currentTime = getCurrentTimeValue(now, timeZone);

  const overdueActivities = activities
    .filter((activity) => activity.date === resolvedDate && getEffectiveActivityStatus(activity, now, timeZone) !== "Selesai" && getActivityEndTimestamp(activity.date, activity.endTime, timeZone) < now)
    .sort((a, b) => b.endTime.localeCompare(a.endTime) || a.startTime.localeCompare(b.startTime))
    .map<TodayAgendaItem>((activity) => ({
      id: activity.id,
      type: "Aktivitas",
      title: activity.title,
      startTime: activity.startTime,
      endTime: activity.endTime,
      metaLabel: activity.category,
      href: `/activities?activityId=${activity.id}`,
      status: getEffectiveActivityStatus(activity, now, timeZone)
    }));

  const upcomingActivities = activities
    .filter((activity) => activity.date === resolvedDate && getEffectiveActivityStatus(activity, now, timeZone) !== "Selesai" && activity.endTime >= currentTime)
    .map<TodayAgendaItem>((activity) => ({
      id: activity.id,
      type: "Aktivitas",
      title: activity.title,
      startTime: activity.startTime,
      endTime: activity.endTime,
      metaLabel: activity.category,
      href: `/activities?activityId=${activity.id}`,
      status: getEffectiveActivityStatus(activity, now, timeZone)
    }));

  const visibleRoutines = routines
    .filter((routine) => getEffectiveRoutineStatus(routine, now, timeZone) !== null)
    .map<TodayAgendaItem>((routine) => ({
      id: routine.id,
      type: "Rutinitas",
      title: routine.title,
      startTime: routine.startTime,
      endTime: routine.endTime,
      metaLabel: `Prioritas ${routine.priority}`,
      href: `/routines?routineId=${routine.id}`,
      status: getEffectiveRoutineStatus(routine, now, timeZone) || undefined,
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

export interface ScheduleRange {
  startDate: string;
  endDate: string;
  dates: string[];
}

export interface ScheduleSummary {
  total: number;
  work: number;
  activity: number;
  routine: number;
  missed: number;
}

function addDays(value: string, offset: number) {
  return addDaysToDateKey(value, offset);
}

function startOfWeek(value: string) {
  return startOfWeekDateKey(value);
}

function endOfMonth(value: string) {
  return endOfMonthDateKey(value);
}

function buildDateRange(startDate: string, totalDays: number) {
  return Array.from({ length: totalDays }, (_, index) => addDays(startDate, index));
}

function getScheduleTimestamp(date: string, time: string | null, fallback: "start" | "end", timeZone = APP_DEFAULT_TIME_ZONE) {
  const resolved = time || (fallback === "start" ? "00:00" : "23:59");
  return zonedDateTimeToTimestamp(date, resolved, timeZone, fallback === "end");
}

function mapTaskToScheduleStatus(task: Task, reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE): ScheduleDisplayStatus {
  const status = getEffectiveTaskStatus(task, reference, timeZone);

  if (status === "Selesai") {
    return "done";
  }

  if (status === "Dibatalkan") {
    return "cancelled";
  }

  return getDeadlineTimestamp(task.deadline, task.endTime, timeZone) < resolveStatusTimestamp(reference, timeZone) ? "missed" : "upcoming";
}

function mapActivityToScheduleStatus(activity: Activity, reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE): ScheduleDisplayStatus {
  const status = getEffectiveActivityStatus(activity, reference, timeZone);

  if (status === "Selesai") {
    return "done";
  }

  if (status === "Dibatalkan") {
    return "cancelled";
  }

  return getActivityEndTimestamp(activity.date, activity.endTime, timeZone) < resolveStatusTimestamp(reference, timeZone) ? "missed" : "upcoming";
}

function mapRoutineOccurrenceStatus(date: string, _startTime: string, endTime: string, reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE): ScheduleDisplayStatus {
  return getActivityEndTimestamp(date, endTime, timeZone) < resolveStatusTimestamp(reference, timeZone) ? "done" : "upcoming";
}

export function buildScheduleRange(anchorDate: string, viewMode: ScheduleViewMode): ScheduleRange {
  if (viewMode === "today") {
    return { startDate: anchorDate, endDate: anchorDate, dates: [anchorDate] };
  }

  if (viewMode === "week") {
    const startDate = startOfWeek(anchorDate);
    const dates = buildDateRange(startDate, 7);
    return { startDate, endDate: dates.at(-1) || startDate, dates };
  }

  if (viewMode === "agenda") {
    const dates = buildDateRange(anchorDate, 14);
    return { startDate: anchorDate, endDate: dates.at(-1) || anchorDate, dates };
  }

  const startDate = `${anchorDate.slice(0, 7)}-01`;
  const dates = buildDateRange(startDate, Number(endOfMonth(anchorDate).slice(-2)));
  return { startDate, endDate: endOfMonth(anchorDate), dates };
}

export function buildScheduleItems(tasks: Task[], activities: Activity[], routines: Routine[], range: ScheduleRange, reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  const dateSet = new Set(range.dates);

  const taskItems: ScheduleItem[] = tasks.flatMap((task) => {
    const hasSpecificTime = Boolean(task.startTime || task.endTime);
    const date = hasSpecificTime ? task.startDate : task.deadline;

    if (!dateSet.has(date)) {
      return [];
    }

    const startTime = task.startTime || (task.endTime ? "00:00" : null);
    const endTime = task.endTime;

    return [{
      id: `schedule-task-${task.id}-${date}`,
      source: "work",
      sourceId: task.id,
      title: task.title,
      category: "work",
      detailCategory: null,
      date,
      startTime,
      endTime,
      displayStatus: mapTaskToScheduleStatus(task, reference, timeZone),
      priority: task.priority,
      reminder: null,
      href: `/tasks?taskId=${task.id}`,
      sourceStatus: getEffectiveTaskStatus(task, reference, timeZone),
      deadline: task.deadline,
      notes: task.description,
      isAllDay: !task.startTime && !task.endTime,
      sortStartTimestamp: getScheduleTimestamp(date, startTime, "start", timeZone),
      sortEndTimestamp: getScheduleTimestamp(date, endTime || startTime, "end", timeZone)
    }];
  });

  const activityItems: ScheduleItem[] = activities.flatMap((activity) => {
    if (!dateSet.has(activity.date)) {
      return [];
    }

    return [{
      id: `schedule-activity-${activity.id}-${activity.date}`,
      source: "activity",
      sourceId: activity.id,
      title: activity.title,
      category: "activity",
      detailCategory: activity.category,
      date: activity.date,
      startTime: activity.startTime,
      endTime: activity.endTime,
      displayStatus: mapActivityToScheduleStatus(activity, reference, timeZone),
      priority: null,
      reminder: null,
      href: `/activities?activityId=${activity.id}`,
      sourceStatus: getEffectiveActivityStatus(activity, reference, timeZone),
      deadline: null,
      notes: activity.notes,
      isAllDay: false,
      sortStartTimestamp: getScheduleTimestamp(activity.date, activity.startTime, "start", timeZone),
      sortEndTimestamp: getScheduleTimestamp(activity.date, activity.endTime, "end", timeZone)
    }];
  });

  const routineItems: ScheduleItem[] = routines.flatMap((routine) => {
    return range.dates.flatMap((date) => {
      if (!isRoutineScheduledForDate(routine, date)) {
        return [];
      }

      const sourceStatus = (() => {
        const startTimestamp = getActivityStartTimestamp(date, routine.startTime, timeZone);
        const endTimestamp = getActivityEndTimestamp(date, routine.endTime, timeZone);
        const current = resolveStatusTimestamp(reference, timeZone);

        if (current < startTimestamp) {
          return "Akan Datang";
        }

        if (current <= endTimestamp) {
          return "Berjalan";
        }

        return null;
      })();

      return [{
        id: `schedule-routine-${routine.id}-${date}`,
        source: "routine",
        sourceId: routine.id,
        title: routine.title,
        category: "routine",
        detailCategory: null,
        date,
        startTime: routine.startTime,
        endTime: routine.endTime,
        displayStatus: mapRoutineOccurrenceStatus(date, routine.startTime, routine.endTime, reference, timeZone),
        priority: routine.priority,
        reminder: null,
        href: `/routines?routineId=${routine.id}`,
        sourceStatus,
        deadline: null,
        notes: routine.notes,
        isAllDay: false,
        sortStartTimestamp: getScheduleTimestamp(date, routine.startTime, "start", timeZone),
        sortEndTimestamp: getScheduleTimestamp(date, routine.endTime, "end", timeZone)
      }];
    });
  });

  return [...taskItems, ...activityItems, ...routineItems].sort((a, b) => {
    if (a.sortStartTimestamp !== b.sortStartTimestamp) {
      return a.sortStartTimestamp - b.sortStartTimestamp;
    }

    if (a.sortEndTimestamp !== b.sortEndTimestamp) {
      return a.sortEndTimestamp - b.sortEndTimestamp;
    }

    if (a.source !== b.source) {
      return a.source.localeCompare(b.source);
    }

    return a.title.localeCompare(b.title);
  });
}

export function filterScheduleItems(items: ScheduleItem[], sourceFilter: ScheduleSourceFilter, statusFilter: ScheduleStatusFilter) {
  return items.filter((item) => {
    const sourceMatch = sourceFilter === "all" || item.source === sourceFilter;
    const statusMatch = statusFilter === "all" ? true : item.displayStatus === statusFilter;
    return sourceMatch && statusMatch;
  });
}

export function summarizeScheduleItems(items: ScheduleItem[]): ScheduleSummary {
  return items.reduce<ScheduleSummary>((summary, item) => {
    summary.total += 1;
    summary[item.source] += 1;

    if (item.displayStatus === "missed") {
      summary.missed += 1;
    }

    return summary;
  }, { total: 0, work: 0, activity: 0, routine: 0, missed: 0 });
}

export function groupScheduleItemsByDate(items: ScheduleItem[]) {
  return items.reduce<Record<string, ScheduleItem[]>>((groups, item) => {
    if (!groups[item.date]) {
      groups[item.date] = [];
    }

    groups[item.date].push(item);
    return groups;
  }, {});
}

export function sortTasksByNearestDeadline(tasks: Task[], timeZone = APP_DEFAULT_TIME_ZONE) {
  return [...tasks]
    .filter((task) => !isTerminalTaskStatus(getEffectiveTaskStatus(task, Date.now(), timeZone)))
    .sort(
      (a, b) => getDeadlineTimestamp(a.deadline, a.endTime, timeZone) - getDeadlineTimestamp(b.deadline, b.endTime, timeZone) || Date.parse(a.createdAt) - Date.parse(b.createdAt)
    );
}

export function summarizeTasks(tasks: Task[], reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE): TaskSummary {
  const total = tasks.length;
  const date = referenceDate(reference, timeZone);
  const effectiveStatuses = tasks.map((task) => getEffectiveTaskStatus(task, reference, timeZone));
  const upcoming = effectiveStatuses.filter((status) => status === "Akan Datang").length;
  const completed = effectiveStatuses.filter((status) => status === "Selesai").length;
  const running = effectiveStatuses.filter((status) => status === "Berjalan").length;
  const pending = effectiveStatuses.filter((status) => status === "Tertunda").length;
  const canceled = effectiveStatuses.filter((status) => status === "Dibatalkan").length;
  const overdue = tasks.filter((task) => task.deadline < date && !isTerminalTaskStatus(getEffectiveTaskStatus(task, reference, timeZone))).length;
  const completionBase = total - upcoming;

  return {
    total,
    upcoming,
    running,
    completed,
    pending,
    canceled,
    overdue,
    completionRate: completionBase ? Math.round((completed / completionBase) * 100) : 0
  };
}

export function summarizeActivities(activities: Activity[], timeZone = APP_DEFAULT_TIME_ZONE, reference: string | number = Date.now()): ActivitySummary {
  const today = referenceDate(reference, timeZone);
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

export function taskStatusChartData(tasks: Task[], reference: string | number = Date.now(), timeZone = APP_DEFAULT_TIME_ZONE) {
  const counts = tasks.reduce<Record<string, number>>((acc, task) => {
    const status = getEffectiveTaskStatus(task, reference, timeZone);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return taskStatuses.map((status) => ({ name: status, value: counts[status] || 0 }));
}

export function activityCategoryChartData(activities: Activity[], maxItems?: number) {
  const counts = countBy(activities, "category");
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  if (!maxItems) {
    return data;
  }

  return data.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, maxItems);
}

export function activityPerDayChartData(activities: Activity[]) {
  const counts = countBy(activities, "date");
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, total]) => ({ date: formatDate(date, "id", APP_DEFAULT_TIME_ZONE), total }));
}

export function normalizeReportDateRange(rangeFrom?: string | null, rangeTo?: string | null, fallbackDate = todayDate(APP_DEFAULT_TIME_ZONE)) {
  const from = rangeFrom || fallbackDate;
  const to = rangeTo || fallbackDate;

  if (!from || !to) {
    return { from: from || "", to: to || "" };
  }

  if (from <= to) {
    return { from, to };
  }

  return { from: to, to: from };
}

export function getReportDateRange(selectedDate: string, period: ReportPeriod, rangeFrom?: string | null, rangeTo?: string | null) {
  if (period === "Kustom") {
    return normalizeReportDateRange(rangeFrom, rangeTo, selectedDate);
  }

  if (!selectedDate) {
    return { from: "", to: "" };
  }

  if (period === "Bulanan") {
    return { from: `${selectedDate.slice(0, 8)}01`, to: endOfMonthDateKey(selectedDate) };
  }

  if (period === "Mingguan") {
    const from = startOfWeekDateKey(selectedDate);
    return { from, to: addDaysToDateKey(from, 6) };
  }

  return { from: selectedDate, to: selectedDate };
}

function buildReportDates(selectedDate: string, period: ReportPeriod, rangeFrom?: string | null, rangeTo?: string | null) {
  const { from, to } = getReportDateRange(selectedDate, period, rangeFrom, rangeTo);

  if (!from || !to) {
    return [];
  }

  const dates: string[] = [];
  let current = from;

  while (current <= to) {
    dates.push(current);
    current = addDaysToDateKey(current, 1);
  }

  return dates;
}

export function getReportPeriodLabel(period: ReportPeriod) {
  if (period === "Harian") {
    return "Hari Ini";
  }

  if (period === "Bulanan") {
    return "Bulan Ini";
  }

  if (period === "Kustom") {
    return "Rentang Kustom";
  }

  return "Minggu Ini";
}

export function getReportChartTitle(baseTitle: string, period: ReportPeriod) {
  return `${baseTitle} ${getReportPeriodLabel(period)}`;
}

export function reportActivityChartData(activities: Activity[], selectedDate: string, period: ReportPeriod, timeZone = APP_DEFAULT_TIME_ZONE, rangeFrom?: string | null, rangeTo?: string | null) {
  return buildReportDates(selectedDate, period, rangeFrom, rangeTo).map((date) => ({
    date: formatDate(date, "id", timeZone),
    total: activities.filter((activity) => activity.date === date).length
  }));
}

export function reportTaskProgressChartData(tasks: Task[], selectedDate: string, period: ReportPeriod, timeZone = APP_DEFAULT_TIME_ZONE, rangeFrom?: string | null, rangeTo?: string | null) {
  return buildReportDates(selectedDate, period, rangeFrom, rangeTo).map((date) => ({
    date: formatDate(date, "id", timeZone),
    completed: tasks.filter((task) => task.completedAt && dateKeyFromTimestamp(task.completedAt, timeZone) === date).length
  }));
}

export function filterTasksByReportPeriod(tasks: Task[], selectedDate: string, period: ReportPeriod, timeZone = APP_DEFAULT_TIME_ZONE, rangeFrom?: string | null, rangeTo?: string | null) {
  return tasks.filter((task) => {
    if (period === "Kustom") {
      const { from, to } = getReportDateRange(selectedDate, period, rangeFrom, rangeTo);
      if (!from || !to) {
        return false;
      }
      return task.deadline >= from && task.deadline <= to;
    }

    if (!selectedDate) {
      return false;
    }

    if (period === "Harian") {
      return task.deadline === selectedDate;
    }

    if (period === "Bulanan") {
      return task.deadline.slice(0, 7) === selectedDate.slice(0, 7);
    }

    return getWeekKey(task.deadline, timeZone) === getWeekKey(selectedDate, timeZone);
  });
}

export function dailyActivityChartData(activities: Activity[], routines: Routine[], referenceDate = todayDate(APP_DEFAULT_TIME_ZONE), timeZone = APP_DEFAULT_TIME_ZONE) {
  const days = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(referenceDate, index - 6));

  return days.map((date) => {
    const activityTotal = activities.filter((activity) => activity.date === date).length;
    const routineTotal = routines.filter((routine) => isRoutineScheduledForDate(routine, date)).length;

    return {
      date: formatDate(date, "id", timeZone),
      total: activityTotal + routineTotal,
      activities: activityTotal,
      routines: routineTotal
    };
  });
}

export function weeklyProgressData(tasks: Task[], timeZone = APP_DEFAULT_TIME_ZONE, reference = Date.now()) {
  const baseDate = todayDate(timeZone, reference);
  const days = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(baseDate, index - 6));

  return days.map((date) => {
    const completed = tasks.filter((task) => task.completedAt && dateKeyFromTimestamp(task.completedAt, timeZone) === date).length;
    return { date: formatDate(date, "id", timeZone), completed };
  });
}

export function filterByReportPeriod<T extends { date?: string; createdAt: string }>(
  items: T[],
  selectedDate: string,
  period: ReportPeriod,
  timeZone = APP_DEFAULT_TIME_ZONE,
  rangeFrom?: string | null,
  rangeTo?: string | null
) {
  return items.filter((item) => {
    const value = item.date || dateKeyFromTimestamp(item.createdAt);

    if (period === "Kustom") {
      const { from, to } = getReportDateRange(selectedDate, period, rangeFrom, rangeTo);
      if (!from || !to) {
        return false;
      }
      return value >= from && value <= to;
    }

    if (!selectedDate) {
      return false;
    }

    if (period === "Harian") {
      return value === selectedDate;
    }

    if (period === "Bulanan") {
      return value.slice(0, 7) === selectedDate.slice(0, 7);
    }

    return getWeekKey(value, timeZone) === getWeekKey(selectedDate, timeZone);
  });
}

export function getWeekKey(value: string, timeZone = APP_DEFAULT_TIME_ZONE) {
  void timeZone;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const firstDay = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOffset = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);
  const week = Math.ceil((dayOffset + firstDay.getUTCDay() + 1) / 7);
  return `${date.getUTCFullYear()}-${week}`;
}

export function toCsv(rows: Array<Record<string, string | number | null>>, options: { bom?: boolean; lineEnding?: "\n" | "\r\n" } = {}) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lineEnding = options.lineEnding || "\n";
  const content = [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join(lineEnding);

  return options.bom ? `\uFEFF${content}` : content;
}
