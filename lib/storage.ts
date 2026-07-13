import { APP_DEFAULT_TIME_ZONE, getCurrentTimestampInTimeZone, normalizeTimeZone } from "@/lib/time";
import { activityCategories, activityStatuses, taskPriorities, taskStatuses, weekdays } from "@/lib/types";
import type { Activity, AppLanguage, DashboardSettings, HistoryEvent, Note, Routine, Task } from "@/lib/types";

type DashboardSettingsInput = Partial<DashboardSettings> & { preferredCategories?: unknown };

export const DASHBOARD_BACKUP_VERSION = 6 as const;
export const MAX_DASHBOARD_BACKUP_BYTES = 25 * 1024 * 1024;

export type DashboardBackupVersion = 1 | 2 | 3 | 4 | 5 | 6;
export type DashboardBackupSection = "tasks" | "activities" | "routines" | "notes" | "history";
export type DashboardBackupIssueCode =
  | "file-too-large"
  | "invalid-json"
  | "unsupported-version"
  | "invalid-structure"
  | "invalid-exported-at"
  | "invalid-item"
  | "duplicate-id"
  | "invalid-note-link";

export interface DashboardBackupIssue {
  code: DashboardBackupIssueCode;
  section?: DashboardBackupSection;
  index?: number;
}

export type DashboardBackupParseResult =
  | { ok: true; backup: DashboardBackup; sourceVersion: DashboardBackupVersion }
  | { ok: false; issue: DashboardBackupIssue };

export interface DashboardBackup {
  version: typeof DASHBOARD_BACKUP_VERSION;
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
    version: DASHBOARD_BACKUP_VERSION,
    exportedAt: resolvedExportedAt,
    tasks,
    activities,
    routines,
    notes,
    history,
    settings: normalizeDashboardSettings(settings)
  };
}

export function parseDashboardBackup(value: string): DashboardBackupParseResult {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isRecord(parsed)) {
      return invalidBackup("invalid-structure");
    }

    const version = isDashboardBackupVersion(parsed.version) ? parsed.version : null;
    if (!version) {
      return invalidBackup("unsupported-version");
    }

    if (
      !isString(parsed.exportedAt) ||
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.activities) ||
      !isDashboardSettings(parsed.settings)
    ) {
      return invalidBackup("invalid-structure");
    }

    if (!isValidTimestamp(parsed.exportedAt)) {
      return invalidBackup("invalid-exported-at");
    }

    const routines = version === 1 ? [] : parsed.routines;
    const notes = version >= 4 ? parsed.notes : [];
    const history = version >= 5 ? parsed.history : [];

    if (!Array.isArray(routines) || !Array.isArray(notes) || !Array.isArray(history)) {
      return invalidBackup("invalid-structure");
    }

    const collections: Array<{
      section: DashboardBackupSection;
      items: unknown[];
      guard: (item: unknown) => boolean;
    }> = [
      { section: "tasks", items: parsed.tasks, guard: isTask },
      { section: "activities", items: parsed.activities, guard: isActivity },
      { section: "routines", items: routines, guard: isRoutine },
      { section: "notes", items: notes, guard: isNote },
      { section: "history", items: history, guard: isHistoryEvent }
    ];

    for (const collection of collections) {
      const invalidIndex = collection.items.findIndex((item) => !collection.guard(item));
      if (invalidIndex >= 0) {
        return invalidBackup("invalid-item", collection.section, invalidIndex);
      }

      const duplicateIndex = findDuplicateIdIndex(collection.items as Array<{ id: string }>);
      if (duplicateIndex >= 0) {
        return invalidBackup("duplicate-id", collection.section, duplicateIndex);
      }
    }

    const tasks = (parsed.tasks as Task[]).map((task) => ({
      ...task,
      startTime: task.startTime ?? null,
      endTime: task.endTime ?? null
    }));
    const activities = parsed.activities as Activity[];
    const typedRoutines = routines as Routine[];
    const typedNotes = notes as Note[];
    const typedHistory = history as HistoryEvent[];
    const invalidNoteLinkIndex = findInvalidNoteLinkIndex(typedNotes, tasks, activities, typedRoutines);

    if (invalidNoteLinkIndex >= 0) {
      return invalidBackup("invalid-note-link", "notes", invalidNoteLinkIndex);
    }

    return {
      ok: true,
      sourceVersion: version,
      backup: {
        version: DASHBOARD_BACKUP_VERSION,
        exportedAt: parsed.exportedAt,
        tasks,
        activities,
        routines: typedRoutines,
        notes: typedNotes,
        history: typedHistory,
        settings: normalizeDashboardSettings(parsed.settings)
      }
    };
  } catch {
    return invalidBackup("invalid-json");
  }
}

export function getDashboardBackupErrorMessage(issue: DashboardBackupIssue, language: AppLanguage) {
  const itemNumber = typeof issue.index === "number" ? issue.index + 1 : null;
  const sectionLabel = issue.section ? getBackupSectionLabel(issue.section, language) : null;

  if (language === "en") {
    if (issue.code === "file-too-large") return "The backup file exceeds the 25 MB limit.";
    if (issue.code === "invalid-json") return "The backup file is not valid JSON.";
    if (issue.code === "unsupported-version") return "This backup version is not supported.";
    if (issue.code === "invalid-structure") return "The backup structure is invalid or incomplete.";
    if (issue.code === "invalid-exported-at") return "The backup export timestamp is invalid.";
    if (issue.code === "invalid-note-link") return `Note ${itemNumber ?? "?"} links to data that is not available in this backup.`;
    if (issue.code === "duplicate-id") return `A duplicate ID was found in ${sectionLabel ?? "the backup"}${itemNumber ? ` at item ${itemNumber}` : ""}.`;
    return `Invalid data was found in ${sectionLabel ?? "the backup"}${itemNumber ? ` at item ${itemNumber}` : ""}.`;
  }

  if (issue.code === "file-too-large") return "Ukuran file backup melebihi batas 25 MB.";
  if (issue.code === "invalid-json") return "File backup bukan JSON yang valid.";
  if (issue.code === "unsupported-version") return "Versi file backup tidak didukung.";
  if (issue.code === "invalid-structure") return "Struktur file backup tidak valid atau tidak lengkap.";
  if (issue.code === "invalid-exported-at") return "Waktu ekspor pada file backup tidak valid.";
  if (issue.code === "invalid-note-link") return `Relasi catatan ke-${itemNumber ?? "?"} tidak menunjuk data yang tersedia dalam backup.`;
  if (issue.code === "duplicate-id") return `ID duplikat ditemukan pada ${sectionLabel ?? "backup"}${itemNumber ? ` di item ke-${itemNumber}` : ""}.`;
  return `Data tidak valid ditemukan pada ${sectionLabel ?? "backup"}${itemNumber ? ` di item ke-${itemNumber}` : ""}.`;
}

export function isTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.description) &&
    includesValue(taskStatuses, value.status) &&
    includesValue(taskPriorities, value.priority) &&
    isValidDateKey(value.startDate) &&
    isValidDateKey(value.deadline) &&
    value.deadline >= value.startDate &&
    isValidOptionalTimeRange(value.startTime, value.endTime) &&
    (value.completedAt === null || isValidTimestamp(value.completedAt)) &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.updatedAt)
  );
}

export function isActivity(value: unknown): value is Activity {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    includesValue(activityCategories, value.category) &&
    isValidDateKey(value.date) &&
    isValidTime(value.startTime) &&
    isValidTime(value.endTime) &&
    value.endTime > value.startTime &&
    includesValue(activityStatuses, value.status) &&
    isString(value.notes) &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.updatedAt)
  );
}

export function isRoutine(value: unknown): value is Routine {
  if (!isRecord(value) || !Array.isArray(value.days)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    value.days.length > 0 &&
    value.days.every((day) => includesValue(weekdays, day)) &&
    new Set(value.days).size === value.days.length &&
    isValidTime(value.startTime) &&
    isValidTime(value.endTime) &&
    value.endTime > value.startTime &&
    includesValue(taskPriorities, value.priority) &&
    isString(value.notes) &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.updatedAt)
  );
}

export function isNote(value: unknown): value is Note {
  if (!isRecord(value) || !Array.isArray(value.tags)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.content) &&
    includesValue(["work", "activity", "routine", "personal"] as const, value.category) &&
    (value.linkedType === null || includesValue(["work", "activity", "routine"] as const, value.linkedType)) &&
    (value.linkedId === null || isString(value.linkedId)) &&
    value.tags.every(isNonEmptyString) &&
    typeof value.isPinned === "boolean" &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.updatedAt)
  );
}

export function isHistoryEvent(value: unknown): value is HistoryEvent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    includesValue(["created", "updated", "completed", "missed", "cancelled", "deleted", "pinned", "unpinned"] as const, value.eventType) &&
    includesValue(["work", "activity", "routine", "note"] as const, value.entityType) &&
    isNonEmptyString(value.entityId) &&
    isNonEmptyString(value.title) &&
    isString(value.description) &&
    (value.metadata === null || isString(value.metadata)) &&
    isValidTimestamp(value.createdAt)
  );
}

export function normalizeDashboardSettings(settings: DashboardSettingsInput): DashboardSettings {
  return {
    dashboardName: typeof settings.dashboardName === "string" ? settings.dashboardName : "YouPi Dashboard",
    theme: includesValue(["Terang", "Gelap", "Sistem"], settings.theme) ? settings.theme : "Terang",
    language: settings.language === "id" ? "id" : "en",
    timeZone: normalizeTimeZone(settings.timeZone || APP_DEFAULT_TIME_ZONE)
  };
}

export function isDashboardSettings(value: unknown): value is DashboardSettings {
  if (!isRecord(value)) {
    return false;
  }

  if ("preferredCategories" in value && (!Array.isArray(value.preferredCategories) || !value.preferredCategories.every((category) => includesValue(activityCategories, category)))) {
    return false;
  }

  return (
    isString(value.dashboardName) &&
    includesValue(["Terang", "Gelap", "Sistem"], value.theme) &&
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

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && Boolean(value.trim());
}

function isDashboardBackupVersion(value: unknown): value is DashboardBackupVersion {
  return typeof value === "number" && [1, 2, 3, 4, 5, 6].includes(value);
}

function isValidDateKey(value: unknown): value is string {
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isValidTime(value: unknown): value is string {
  return isString(value) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidOptionalTimeRange(startTime: unknown, endTime: unknown) {
  const normalizedStart = startTime === undefined ? null : startTime;
  const normalizedEnd = endTime === undefined ? null : endTime;

  if (normalizedStart === null && normalizedEnd === null) {
    return true;
  }

  if (normalizedStart === null) {
    return isValidTime(normalizedEnd) && normalizedEnd > "00:00";
  }

  return isValidTime(normalizedStart) && isValidTime(normalizedEnd) && normalizedEnd > normalizedStart;
}

function isValidTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})(?![\s\S])/.test(value) && Number.isFinite(Date.parse(value));
}

function invalidBackup(code: DashboardBackupIssueCode, section?: DashboardBackupSection, index?: number): DashboardBackupParseResult {
  const issue: DashboardBackupIssue = { code };
  if (section !== undefined) issue.section = section;
  if (index !== undefined) issue.index = index;
  return { ok: false, issue };
}

function findDuplicateIdIndex(items: Array<{ id: string }>) {
  const ids = new Set<string>();

  for (let index = 0; index < items.length; index += 1) {
    if (ids.has(items[index].id)) {
      return index;
    }
    ids.add(items[index].id);
  }

  return -1;
}

function findInvalidNoteLinkIndex(notes: Note[], tasks: Task[], activities: Activity[], routines: Routine[]) {
  const targetIds = {
    work: new Set(tasks.map((item) => item.id)),
    activity: new Set(activities.map((item) => item.id)),
    routine: new Set(routines.map((item) => item.id))
  };

  return notes.findIndex((note) => {
    if (note.linkedType === null || note.linkedId === null) {
      return note.linkedType !== null || note.linkedId !== null;
    }

    return !targetIds[note.linkedType].has(note.linkedId);
  });
}

function getBackupSectionLabel(section: DashboardBackupSection, language: AppLanguage) {
  const labels = language === "en"
    ? { tasks: "work items", activities: "activities", routines: "routines", notes: "notes", history: "history" }
    : { tasks: "pekerjaan", activities: "aktivitas", routines: "rutinitas", notes: "catatan", history: "history" };
  return labels[section];
}

function isSupportedTimeZoneValue(value: unknown): boolean {
  return typeof value === "string" && normalizeTimeZone(value) === value;
}
