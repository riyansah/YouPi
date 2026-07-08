import { defaultSettings } from "@/lib/data";
import { normalizeDashboardSettings } from "@/lib/storage";
import { getCurrentTimestampInTimeZone } from "@/lib/time";
import {
  activityCategories,
  activityStatuses,
  taskPriorities,
  taskStatuses,
  weekdays,
  type Activity,
  type ActivityCategory,
  type AppLanguage,
  type DashboardSettings,
  type Routine,
  type Task,
  type ThemePreference,
  type Weekday
} from "@/lib/types";
import { makeId } from "@/lib/utils";
import { validateActivityForm, validateRoutineForm, validateTaskForm } from "@/lib/validation";

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const invalidPayload = "Payload data tidak valid.";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function hasOnlyFields(value: Record<string, unknown>, fields: readonly string[]) {
  const allowed = new Set(fields);
  return Object.keys(value).every((field) => allowed.has(field));
}

function oneOf<T extends string>(items: readonly T[], value: unknown): value is T {
  return typeof value === "string" && items.includes(value as T);
}

function nullableTime(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

const taskFields = ["id", "title", "description", "status", "priority", "startDate", "deadline", "startTime", "endTime", "completedAt", "createdAt", "updatedAt"] as const;
const activityFields = ["id", "title", "category", "date", "startTime", "endTime", "status", "notes", "createdAt", "updatedAt"] as const;
const routineFields = ["id", "title", "days", "startTime", "endTime", "priority", "notes", "createdAt", "updatedAt"] as const;
const settingsFields = ["dashboardName", "theme", "preferredCategories", "language", "timeZone"] as const;

export function parseCreateTask(value: Record<string, unknown>): ParseResult<Task> {
  if (!hasOnlyFields(value, taskFields)) {
    return { ok: false, error: invalidPayload };
  }

  const title = requiredString(value.title);
  const description = requiredString(value.description);
  const status = oneOf(taskStatuses, value.status) ? value.status : null;
  const priority = oneOf(taskPriorities, value.priority) ? value.priority : null;
  const startDate = requiredString(value.startDate);
  const deadline = requiredString(value.deadline);
  const startTime = nullableTime(value.startTime);
  const endTime = nullableTime(value.endTime);

  if (!title || !description || !status || !priority || !startDate || !deadline || startTime === undefined || endTime === undefined) {
    return { ok: false, error: invalidPayload };
  }

  const errors = validateTaskForm({ title, description, status, priority, startDate, deadline, startTime, endTime });
  if (errors.length) {
    return { ok: false, error: errors[0] };
  }

  const timestamp = getCurrentTimestampInTimeZone();
  return {
    ok: true,
    value: {
      id: isString(value.id) && value.id ? value.id : makeId("task"),
      title,
      description,
      status,
      priority,
      startDate,
      deadline,
      startTime,
      endTime,
      completedAt: status === "Selesai" ? (isString(value.completedAt) ? value.completedAt : timestamp) : null,
      createdAt: isString(value.createdAt) ? value.createdAt : timestamp,
      updatedAt: timestamp
    }
  };
}

export function parsePatchTask(value: Record<string, unknown>, current: Task): ParseResult<Partial<Task>> {
  if (!hasOnlyFields(value, taskFields)) {
    return { ok: false, error: invalidPayload };
  }

  const patch: Partial<Task> = {};
  if ("title" in value) {
    if (!isString(value.title)) return { ok: false, error: invalidPayload };
    patch.title = value.title.trim();
  }
  if ("description" in value) {
    if (!isString(value.description)) return { ok: false, error: invalidPayload };
    patch.description = value.description.trim();
  }
  if ("status" in value) {
    if (!oneOf(taskStatuses, value.status)) return { ok: false, error: invalidPayload };
    patch.status = value.status;
  }
  if ("priority" in value) {
    if (!oneOf(taskPriorities, value.priority)) return { ok: false, error: invalidPayload };
    patch.priority = value.priority;
  }
  if ("startDate" in value) {
    if (!isString(value.startDate)) return { ok: false, error: invalidPayload };
    patch.startDate = value.startDate;
  }
  if ("deadline" in value) {
    if (!isString(value.deadline)) return { ok: false, error: invalidPayload };
    patch.deadline = value.deadline;
  }
  if ("startTime" in value) {
    const startTime = nullableTime(value.startTime);
    if (startTime === undefined) return { ok: false, error: invalidPayload };
    patch.startTime = startTime;
  }
  if ("endTime" in value) {
    const endTime = nullableTime(value.endTime);
    if (endTime === undefined) return { ok: false, error: invalidPayload };
    patch.endTime = endTime;
  }
  if ("completedAt" in value) {
    if (value.completedAt !== null && !isString(value.completedAt)) return { ok: false, error: invalidPayload };
    patch.completedAt = value.completedAt;
  }

  const timestamp = getCurrentTimestampInTimeZone();
  const next = { ...current, ...patch, updatedAt: timestamp };
  const errors = validateTaskForm(next);
  if (errors.length) {
    return { ok: false, error: errors[0] };
  }

  patch.updatedAt = timestamp;
  if (patch.status && patch.status !== "Selesai" && !("completedAt" in value)) {
    patch.completedAt = null;
  }
  if (patch.status === "Selesai" && !("completedAt" in value)) {
    patch.completedAt = current.completedAt || timestamp;
  }
  return { ok: true, value: patch };
}

export function parseCreateActivity(value: Record<string, unknown>): ParseResult<Activity> {
  if (!hasOnlyFields(value, activityFields)) {
    return { ok: false, error: invalidPayload };
  }

  const title = requiredString(value.title);
  const category = oneOf(activityCategories, value.category) ? value.category : null;
  const date = requiredString(value.date);
  const startTime = requiredString(value.startTime);
  const endTime = requiredString(value.endTime);
  const status = oneOf(activityStatuses, value.status) ? value.status : null;
  const notes = isString(value.notes) ? value.notes : "";

  if (!title || !category || !date || !startTime || !endTime || !status) {
    return { ok: false, error: invalidPayload };
  }

  const errors = validateActivityForm({ title, category, date, startTime, endTime, status, notes });
  if (errors.length) {
    return { ok: false, error: errors[0] };
  }

  const timestamp = getCurrentTimestampInTimeZone();
  return {
    ok: true,
    value: {
      id: isString(value.id) && value.id ? value.id : makeId("activity"),
      title,
      category,
      date,
      startTime,
      endTime,
      status,
      notes,
      createdAt: isString(value.createdAt) ? value.createdAt : timestamp,
      updatedAt: timestamp
    }
  };
}

export function parsePatchActivity(value: Record<string, unknown>, current: Activity): ParseResult<Partial<Activity>> {
  if (!hasOnlyFields(value, activityFields)) {
    return { ok: false, error: invalidPayload };
  }

  const patch: Partial<Activity> = {};
  if ("title" in value) {
    if (!isString(value.title)) return { ok: false, error: invalidPayload };
    patch.title = value.title.trim();
  }
  if ("category" in value) {
    if (!oneOf(activityCategories, value.category)) return { ok: false, error: invalidPayload };
    patch.category = value.category;
  }
  if ("date" in value) {
    if (!isString(value.date)) return { ok: false, error: invalidPayload };
    patch.date = value.date;
  }
  if ("startTime" in value) {
    if (!isString(value.startTime)) return { ok: false, error: invalidPayload };
    patch.startTime = value.startTime;
  }
  if ("endTime" in value) {
    if (!isString(value.endTime)) return { ok: false, error: invalidPayload };
    patch.endTime = value.endTime;
  }
  if ("status" in value) {
    if (!oneOf(activityStatuses, value.status)) return { ok: false, error: invalidPayload };
    patch.status = value.status;
  }
  if ("notes" in value) {
    if (!isString(value.notes)) return { ok: false, error: invalidPayload };
    patch.notes = value.notes;
  }

  const timestamp = getCurrentTimestampInTimeZone();
  const next = { ...current, ...patch, updatedAt: timestamp };
  const errors = validateActivityForm(next);
  if (errors.length) {
    return { ok: false, error: errors[0] };
  }

  patch.updatedAt = timestamp;
  return { ok: true, value: patch };
}

export function parseCreateRoutine(value: Record<string, unknown>): ParseResult<Routine> {
  if (!hasOnlyFields(value, routineFields) || !Array.isArray(value.days)) {
    return { ok: false, error: invalidPayload };
  }

  const title = requiredString(value.title);
  const days = value.days.filter((day): day is Weekday => oneOf(weekdays, day));
  const startTime = requiredString(value.startTime);
  const endTime = requiredString(value.endTime);
  const priority = oneOf(taskPriorities, value.priority) ? value.priority : null;
  const notes = isString(value.notes) ? value.notes : "";

  if (!title || !startTime || !endTime || !priority || days.length !== value.days.length) {
    return { ok: false, error: invalidPayload };
  }

  const routine = { title, days: Array.from(new Set(days)), startTime, endTime, priority, notes };
  const errors = validateRoutineForm(routine);
  if (errors.length) {
    return { ok: false, error: errors[0] };
  }

  const timestamp = getCurrentTimestampInTimeZone();
  return {
    ok: true,
    value: {
      id: isString(value.id) && value.id ? value.id : makeId("routine"),
      ...routine,
      createdAt: isString(value.createdAt) ? value.createdAt : timestamp,
      updatedAt: timestamp
    }
  };
}

export function parsePatchRoutine(value: Record<string, unknown>, current: Routine): ParseResult<Partial<Routine>> {
  if (!hasOnlyFields(value, routineFields)) {
    return { ok: false, error: invalidPayload };
  }

  const patch: Partial<Routine> = {};
  if ("title" in value) {
    if (!isString(value.title)) return { ok: false, error: invalidPayload };
    patch.title = value.title.trim();
  }
  if ("days" in value) {
    if (!Array.isArray(value.days) || !value.days.every((day) => oneOf(weekdays, day))) return { ok: false, error: invalidPayload };
    patch.days = Array.from(new Set(value.days as Weekday[]));
  }
  if ("startTime" in value) {
    if (!isString(value.startTime)) return { ok: false, error: invalidPayload };
    patch.startTime = value.startTime;
  }
  if ("endTime" in value) {
    if (!isString(value.endTime)) return { ok: false, error: invalidPayload };
    patch.endTime = value.endTime;
  }
  if ("priority" in value) {
    if (!oneOf(taskPriorities, value.priority)) return { ok: false, error: invalidPayload };
    patch.priority = value.priority;
  }
  if ("notes" in value) {
    if (!isString(value.notes)) return { ok: false, error: invalidPayload };
    patch.notes = value.notes;
  }

  const timestamp = getCurrentTimestampInTimeZone();
  const next = { ...current, ...patch, updatedAt: timestamp };
  const errors = validateRoutineForm(next);
  if (errors.length) {
    return { ok: false, error: errors[0] };
  }

  patch.updatedAt = timestamp;
  return { ok: true, value: patch };
}

export function parsePatchSettings(value: Record<string, unknown>, current: DashboardSettings = defaultSettings): ParseResult<DashboardSettings> {
  if (!hasOnlyFields(value, settingsFields)) {
    return { ok: false, error: invalidPayload };
  }

  const patch: Partial<DashboardSettings> = {};
  if ("dashboardName" in value) {
    if (!isString(value.dashboardName)) return { ok: false, error: invalidPayload };
    patch.dashboardName = value.dashboardName;
  }
  if ("theme" in value) {
    if (!oneOf(["Terang", "Gelap", "Sistem"] as const, value.theme)) return { ok: false, error: invalidPayload };
    patch.theme = value.theme as ThemePreference;
  }
  if ("preferredCategories" in value) {
    if (!Array.isArray(value.preferredCategories) || !value.preferredCategories.every((category) => oneOf(activityCategories, category))) return { ok: false, error: invalidPayload };
    patch.preferredCategories = value.preferredCategories as ActivityCategory[];
  }
  if ("language" in value) {
    if (value.language !== "en" && value.language !== "id") return { ok: false, error: invalidPayload };
    patch.language = value.language as AppLanguage;
  }
  if ("timeZone" in value) {
    if (!isString(value.timeZone)) return { ok: false, error: invalidPayload };
    patch.timeZone = value.timeZone;
  }

  return { ok: true, value: normalizeDashboardSettings({ ...current, ...patch }) };
}
