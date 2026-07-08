import { APP_DEFAULT_TIME_ZONE, getCurrentTimestampInTimeZone, normalizeTimeZone } from "@/lib/time";
import { activityCategories, activityStatuses, taskPriorities, taskStatuses, weekdays } from "@/lib/types";
import type { Activity, DashboardSettings, HistoryEvent, Note, Routine, Task } from "@/lib/types";

export interface DashboardBackup {
  version: 6;
  exportedAt: string;
  tasks: Task[];
  activities: Activity[];
  routines: Routine[];
  notes: Note[];
  history: HistoryEvent[];
  settings: DashboardSettings;
}

export function createDashboardBackup(
  tasks: Task[],
  activities: Activity[],
  routines: Routine[],
  notes: Note[],
  settings: DashboardSettings,
  historyOrExportedAt: HistoryEvent[] | string = [],
  exportedAt = getCurrentTimestampInTimeZone()
): DashboardBackup {
  const history = Array.isArray(historyOrExportedAt) ? historyOrExportedAt : [];
  const resolvedExportedAt = typeof historyOrExportedAt === "string" ? historyOrExportedAt : exportedAt;

  return {
    version: 6,
    exportedAt: resolvedExportedAt,
    tasks,
    activities,
    routines,
    notes,
    history,
    settings: normalizeDashboardSettings(settings)
  };
}

export function parseDashboardBackup(value: string): { ok: true; backup: DashboardBackup } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isRecord(parsed)) {
      return { ok: false, error: "File backup tidak didukung." };
    }

    const version = typeof parsed.version === "number" ? parsed.version : null;
    if (!version || ![1, 2, 3, 4, 5, 6].includes(version)) {
      return { ok: false, error: "File backup tidak didukung." };
    }

    if (
      !isString(parsed.exportedAt) ||
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.activities) ||
      !isDashboardSettings(parsed.settings)
    ) {
      return { ok: false, error: "Struktur backup tidak valid." };
    }

    if (!parsed.tasks.every(isTask) || !parsed.activities.every(isActivity)) {
      return { ok: false, error: "Isi backup tidak valid." };
    }

    const routines = version === 1 ? [] : parsed.routines;
    const notes = version >= 4 ? parsed.notes : [];
    const history = version >= 5 ? parsed.history : [];

    if (!Array.isArray(routines) || !routines.every(isRoutine)) {
      return { ok: false, error: "Isi backup tidak valid." };
    }

    if (!Array.isArray(notes) || !notes.every(isNote)) {
      return { ok: false, error: "Isi backup tidak valid." };
    }

    if (!Array.isArray(history) || !history.every(isHistoryEvent)) {
      return { ok: false, error: "Isi backup tidak valid." };
    }

    return {
      ok: true,
      backup: {
        version: 6,
        exportedAt: parsed.exportedAt,
        tasks: parsed.tasks,
        activities: parsed.activities,
        routines,
        notes,
        history,
        settings: normalizeDashboardSettings(parsed.settings)
      }
    };
  } catch {
    return { ok: false, error: "File backup bukan JSON yang valid." };
  }
}

export function isTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.title) &&
    isString(value.description) &&
    includesValue(taskStatuses, value.status) &&
    includesValue(taskPriorities, value.priority) &&
    isString(value.startDate) &&
    isString(value.deadline) &&
    (isString(value.startTime) || value.startTime === null || value.startTime === undefined) &&
    (isString(value.endTime) || value.endTime === null || value.endTime === undefined) &&
    (isString(value.completedAt) || value.completedAt === null) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

export function isActivity(value: unknown): value is Activity {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.title) &&
    includesValue(activityCategories, value.category) &&
    isString(value.date) &&
    isString(value.startTime) &&
    isString(value.endTime) &&
    includesValue(activityStatuses, value.status) &&
    isString(value.notes) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

export function isRoutine(value: unknown): value is Routine {
  if (!isRecord(value) || !Array.isArray(value.days)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.title) &&
    value.days.every((day) => includesValue(weekdays, day)) &&
    isString(value.startTime) &&
    isString(value.endTime) &&
    includesValue(taskPriorities, value.priority) &&
    isString(value.notes) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

export function isNote(value: unknown): value is Note {
  if (!isRecord(value) || !Array.isArray(value.tags)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.title) &&
    isString(value.content) &&
    includesValue(["work", "activity", "routine", "personal"] as const, value.category) &&
    (value.linkedType === null || includesValue(["work", "activity", "routine"] as const, value.linkedType)) &&
    (value.linkedId === null || isString(value.linkedId)) &&
    value.tags.every(isString) &&
    typeof value.isPinned === "boolean" &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

export function isHistoryEvent(value: unknown): value is HistoryEvent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    includesValue(["created", "updated", "completed", "missed", "cancelled", "deleted", "pinned", "unpinned"] as const, value.eventType) &&
    includesValue(["work", "activity", "routine", "note"] as const, value.entityType) &&
    isString(value.entityId) &&
    isString(value.title) &&
    isString(value.description) &&
    (value.metadata === null || isString(value.metadata)) &&
    isString(value.createdAt)
  );
}

export function normalizeDashboardSettings(settings: DashboardSettings): DashboardSettings {
  return {
    dashboardName: settings.dashboardName,
    theme: includesValue(["Terang", "Gelap", "Sistem"], settings.theme) ? settings.theme : "Terang",
    preferredCategories: settings.preferredCategories.filter((category) => includesValue(activityCategories, category)),
    language: settings.language === "id" ? "id" : "en",
    timeZone: normalizeTimeZone(settings.timeZone || APP_DEFAULT_TIME_ZONE)
  };
}

export function isDashboardSettings(value: unknown): value is DashboardSettings {
  if (!isRecord(value) || !Array.isArray(value.preferredCategories)) {
    return false;
  }

  return (
    isString(value.dashboardName) &&
    includesValue(["Terang", "Gelap", "Sistem"], value.theme) &&
    value.preferredCategories.every((category) => includesValue(activityCategories, category)) &&
    (value.language === undefined || value.language === "en" || value.language === "id") &&
    (value.timeZone === undefined || isSupportedTimeZoneValue(value.timeZone))
  );
}

function includesValue<T extends string>(items: readonly T[], value: unknown): value is T {
  return typeof value === "string" && items.includes(value as T);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isSupportedTimeZoneValue(value: unknown): boolean {
  return typeof value === "string" && normalizeTimeZone(value) === value;
}
