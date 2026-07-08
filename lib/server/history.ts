import { getActivityEndTimestamp, getDeadlineTimestamp, getEffectiveActivityStatus, getEffectiveTaskStatus, nowIso } from "@/lib/utils";
import { APP_DEFAULT_TIME_ZONE, getTimestampInTimeZone } from "@/lib/time";
import { getLinkedItemHref } from "@/lib/notes";
import type { Activity, HistoryEntityType, HistoryEvent, HistoryEventRecord, Note, Routine, Task } from "@/lib/types";

interface DashboardHistorySnapshot {
  tasks: Task[];
  activities: Activity[];
  routines: Routine[];
  notes: Note[];
  settings?: { timeZone?: string };
}

interface HistoryBuildOptions {
  now?: string;
  existingMissedKeys?: Set<string>;
}

const ACTIVE_TASK_STATUSES = new Set(["Akan Datang", "Berjalan", "Tertunda"]);
const ACTIVE_ACTIVITY_STATUSES = new Set(["Akan Datang", "Direncanakan", "Berjalan", "Tertunda"]);

export function makeHistoryId() {
  return `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeHistoryEvent(input: Omit<HistoryEvent, "id">): HistoryEvent {
  return { id: makeHistoryId(), ...input };
}

export function buildDashboardHistoryEvents(previous: DashboardHistorySnapshot, next: DashboardHistorySnapshot, options: HistoryBuildOptions = {}) {
  const now = options.now || nowIso();
  const events: HistoryEvent[] = [];

  events.push(...buildTaskHistoryEvents(previous.tasks, next.tasks, now));
  events.push(...buildActivityHistoryEvents(previous.activities, next.activities, now));
  events.push(...buildRoutineHistoryEvents(previous.routines, next.routines, now));
  events.push(...buildNoteHistoryEvents(previous.notes, next.notes, now));
  events.push(...buildMissedHistoryEvents(next, options.existingMissedKeys || new Set()));

  return events.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
}

export function buildMissedHistoryEvents(snapshot: DashboardHistorySnapshot, existingMissedKeys: Set<string>) {
  const events: HistoryEvent[] = [];
  const timeZone = snapshot.settings?.timeZone || APP_DEFAULT_TIME_ZONE;

  snapshot.tasks.forEach((task) => {
    const status = getEffectiveTaskStatus(task, Date.now(), timeZone);
    if (!ACTIVE_TASK_STATUSES.has(status)) {
      return;
    }

    const deadline = getDeadlineTimestamp(task.deadline, task.endTime, timeZone);
    if (Number.isNaN(deadline) || deadline > Date.now()) {
      return;
    }

    const eventKey = `missed:work:${task.id}:${task.deadline}:${task.endTime || "all-day"}`;
    if (existingMissedKeys.has(eventKey)) {
      return;
    }

    events.push(
      makeHistoryEvent({
        eventType: "missed",
        entityType: "work",
        entityId: task.id,
        title: task.title,
        description: "Work deadline passed without completion",
        metadata: JSON.stringify({ oldStatus: status, deadline: task.deadline, endTime: task.endTime, eventKey }),
        createdAt: getTimestampInTimeZone(deadline)
      })
    );
    existingMissedKeys.add(eventKey);
  });

  snapshot.activities.forEach((activity) => {
    const status = getEffectiveActivityStatus(activity, Date.now(), timeZone);
    if (!ACTIVE_ACTIVITY_STATUSES.has(status)) {
      return;
    }

    const endAt = getActivityEndTimestamp(activity.date, activity.endTime, timeZone);
    if (Number.isNaN(endAt) || endAt > Date.now()) {
      return;
    }

    const eventKey = `missed:activity:${activity.id}:${activity.date}:${activity.endTime}`;
    if (existingMissedKeys.has(eventKey)) {
      return;
    }

    events.push(
      makeHistoryEvent({
        eventType: "missed",
        entityType: "activity",
        entityId: activity.id,
        title: activity.title,
        description: "Activity time window passed without completion",
        metadata: JSON.stringify({ oldStatus: status, date: activity.date, endTime: activity.endTime, eventKey }),
        createdAt: getTimestampInTimeZone(endAt)
      })
    );
    existingMissedKeys.add(eventKey);
  });

  return events;
}

export function getMissedEventKeyFromMetadata(metadata: string | null) {
  if (!metadata) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadata) as { eventKey?: unknown };
    return typeof parsed.eventKey === "string" ? parsed.eventKey : null;
  } catch {
    return null;
  }
}

export function buildHistoryRecord(event: HistoryEvent, snapshot: DashboardHistorySnapshot): HistoryEventRecord {
  const linkedItem = resolveLinkedItem(event.entityType, event.entityId, snapshot);
  return { ...event, linkedItem };
}

function buildTaskHistoryEvents(previous: Task[], next: Task[], now: string) {
  const events: HistoryEvent[] = [];
  const previousMap = new Map(previous.map((item) => [item.id, item]));
  const nextMap = new Map(next.map((item) => [item.id, item]));

  next.forEach((task) => {
    const current = previousMap.get(task.id);
    if (!current) {
      events.push(makeHistoryEvent({ eventType: "created", entityType: "work", entityId: task.id, title: task.title, description: "Work created", metadata: JSON.stringify({ priority: task.priority, status: task.status }), createdAt: task.createdAt || now }));
      return;
    }

    const metadata = changedTaskMetadata(current, task);
    if (!metadata) {
      return;
    }

    const previousStatus = getEffectiveTaskStatus(current);
    const nextStatus = getEffectiveTaskStatus(task);
    if (previousStatus !== "Selesai" && nextStatus === "Selesai") {
      events.push(makeHistoryEvent({ eventType: "completed", entityType: "work", entityId: task.id, title: task.title, description: "Work marked as completed", metadata: JSON.stringify({ oldStatus: previousStatus, newStatus: nextStatus }), createdAt: task.completedAt || task.updatedAt || now }));
      return;
    }

    if (previousStatus !== "Dibatalkan" && nextStatus === "Dibatalkan") {
      events.push(makeHistoryEvent({ eventType: "cancelled", entityType: "work", entityId: task.id, title: task.title, description: "Work marked as cancelled", metadata: JSON.stringify({ oldStatus: previousStatus, newStatus: nextStatus }), createdAt: task.updatedAt || now }));
      return;
    }

    events.push(makeHistoryEvent({ eventType: "updated", entityType: "work", entityId: task.id, title: task.title, description: "Work updated", metadata: JSON.stringify(metadata), createdAt: task.updatedAt || now }));
  });

  previous.forEach((task) => {
    if (nextMap.has(task.id)) {
      return;
    }

    events.push(makeHistoryEvent({ eventType: "deleted", entityType: "work", entityId: task.id, title: task.title, description: "Work deleted", metadata: JSON.stringify({ status: task.status, deadline: task.deadline }), createdAt: now }));
  });

  return events;
}

function buildActivityHistoryEvents(previous: Activity[], next: Activity[], now: string) {
  const events: HistoryEvent[] = [];
  const previousMap = new Map(previous.map((item) => [item.id, item]));
  const nextMap = new Map(next.map((item) => [item.id, item]));

  next.forEach((activity) => {
    const current = previousMap.get(activity.id);
    if (!current) {
      events.push(makeHistoryEvent({ eventType: "created", entityType: "activity", entityId: activity.id, title: activity.title, description: "Activity created", metadata: JSON.stringify({ category: activity.category, status: activity.status }), createdAt: activity.createdAt || now }));
      return;
    }

    const metadata = changedActivityMetadata(current, activity);
    if (!metadata) {
      return;
    }

    const previousStatus = getEffectiveActivityStatus(current);
    const nextStatus = getEffectiveActivityStatus(activity);
    if (previousStatus !== "Selesai" && nextStatus === "Selesai") {
      events.push(makeHistoryEvent({ eventType: "completed", entityType: "activity", entityId: activity.id, title: activity.title, description: "Activity marked as completed", metadata: JSON.stringify({ oldStatus: previousStatus, newStatus: nextStatus }), createdAt: activity.updatedAt || now }));
      return;
    }

    if (previousStatus !== "Dibatalkan" && nextStatus === "Dibatalkan") {
      events.push(makeHistoryEvent({ eventType: "cancelled", entityType: "activity", entityId: activity.id, title: activity.title, description: "Activity marked as cancelled", metadata: JSON.stringify({ oldStatus: previousStatus, newStatus: nextStatus }), createdAt: activity.updatedAt || now }));
      return;
    }

    events.push(makeHistoryEvent({ eventType: "updated", entityType: "activity", entityId: activity.id, title: activity.title, description: "Activity updated", metadata: JSON.stringify(metadata), createdAt: activity.updatedAt || now }));
  });

  previous.forEach((activity) => {
    if (nextMap.has(activity.id)) {
      return;
    }

    events.push(makeHistoryEvent({ eventType: "deleted", entityType: "activity", entityId: activity.id, title: activity.title, description: "Activity deleted", metadata: JSON.stringify({ status: activity.status, date: activity.date }), createdAt: now }));
  });

  return events;
}

function buildRoutineHistoryEvents(previous: Routine[], next: Routine[], now: string) {
  const events: HistoryEvent[] = [];
  const previousMap = new Map(previous.map((item) => [item.id, item]));
  const nextMap = new Map(next.map((item) => [item.id, item]));

  next.forEach((routine) => {
    const current = previousMap.get(routine.id);
    if (!current) {
      events.push(makeHistoryEvent({ eventType: "created", entityType: "routine", entityId: routine.id, title: routine.title, description: "Routine created", metadata: JSON.stringify({ days: routine.days, priority: routine.priority }), createdAt: routine.createdAt || now }));
      return;
    }

    const metadata = changedRoutineMetadata(current, routine);
    if (!metadata) {
      return;
    }

    events.push(makeHistoryEvent({ eventType: "updated", entityType: "routine", entityId: routine.id, title: routine.title, description: "Routine updated", metadata: JSON.stringify(metadata), createdAt: routine.updatedAt || now }));
  });

  previous.forEach((routine) => {
    if (nextMap.has(routine.id)) {
      return;
    }

    events.push(makeHistoryEvent({ eventType: "deleted", entityType: "routine", entityId: routine.id, title: routine.title, description: "Routine deleted", metadata: JSON.stringify({ days: routine.days }), createdAt: now }));
  });

  return events;
}

function buildNoteHistoryEvents(previous: Note[], next: Note[], now: string) {
  const events: HistoryEvent[] = [];
  const previousMap = new Map(previous.map((item) => [item.id, item]));
  const nextMap = new Map(next.map((item) => [item.id, item]));

  next.forEach((note) => {
    const current = previousMap.get(note.id);
    if (!current) {
      events.push(makeHistoryEvent({ eventType: "created", entityType: "note", entityId: note.id, title: note.title, description: "Note created", metadata: JSON.stringify({ category: note.category, pinned: note.isPinned }), createdAt: note.createdAt || now }));
      return;
    }

    if (current.isPinned !== note.isPinned) {
      events.push(makeHistoryEvent({ eventType: note.isPinned ? "pinned" : "unpinned", entityType: "note", entityId: note.id, title: note.title, description: note.isPinned ? "Note pinned" : "Note unpinned", metadata: JSON.stringify({ oldPinned: current.isPinned, newPinned: note.isPinned }), createdAt: note.updatedAt || now }));
    }

    const metadata = changedNoteMetadata(current, note);
    if (!metadata) {
      return;
    }

    events.push(makeHistoryEvent({ eventType: "updated", entityType: "note", entityId: note.id, title: note.title, description: "Note updated", metadata: JSON.stringify(metadata), createdAt: note.updatedAt || now }));
  });

  previous.forEach((note) => {
    if (nextMap.has(note.id)) {
      return;
    }

    events.push(makeHistoryEvent({ eventType: "deleted", entityType: "note", entityId: note.id, title: note.title, description: "Note deleted", metadata: JSON.stringify({ category: note.category, pinned: note.isPinned }), createdAt: now }));
  });

  return events;
}

function changedTaskMetadata(previous: Task, next: Task) {
  const changes = diffValues(previous, next, ["updatedAt", "completedAt"]);
  if (!changes.length) {
    return null;
  }

  if (changes.length === 1 && changes[0].field === "status") {
    const previousStatus = String(changes[0].from);
    const nextStatus = String(changes[0].to);
    if (["Akan Datang", "Berjalan"].includes(previousStatus) && ["Akan Datang", "Berjalan"].includes(nextStatus)) {
      return null;
    }
  }

  return changes.length ? { changes } : null;
}

function changedActivityMetadata(previous: Activity, next: Activity) {
  const changes = diffValues(previous, next, ["updatedAt"]);
  if (!changes.length) {
    return null;
  }

  if (changes.length === 1 && changes[0].field === "status") {
    const previousStatus = String(changes[0].from);
    const nextStatus = String(changes[0].to);
    if (["Akan Datang", "Direncanakan", "Berjalan"].includes(previousStatus) && ["Akan Datang", "Direncanakan", "Berjalan"].includes(nextStatus)) {
      return null;
    }
  }

  return changes.length ? { changes } : null;
}

function changedRoutineMetadata(previous: Routine, next: Routine) {
  const changes = diffValues(previous, next, ["updatedAt"]);
  return changes.length ? { changes } : null;
}

function changedNoteMetadata(previous: Note, next: Note) {
  const changes = diffValues(previous, next, ["updatedAt", "isPinned"]);
  return changes.length ? { changes } : null;
}

function diffValues<T extends object>(previous: T, next: T, ignoredFields: string[]) {
  const previousRecord = previous as Record<string, unknown>;
  const nextRecord = next as Record<string, unknown>;
  const ignored = new Set(ignoredFields);
  return Object.keys(nextRecord)
    .filter((key) => !ignored.has(key))
    .flatMap((key) => {
      const before = serializeComparable(previousRecord[key]);
      const after = serializeComparable(nextRecord[key]);
      if (before === after) {
        return [];
      }

      return [{ field: key, from: previousRecord[key] ?? null, to: nextRecord[key] ?? null }];
    });
}

function serializeComparable(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function resolveLinkedItem(entityType: HistoryEntityType, entityId: string, snapshot: DashboardHistorySnapshot) {
  if (entityType === "work") {
    const item = snapshot.tasks.find((current) => current.id === entityId);
    return { exists: Boolean(item), href: item ? getLinkedItemHref("work", item.id) : null, label: item?.title || null };
  }

  if (entityType === "activity") {
    const item = snapshot.activities.find((current) => current.id === entityId);
    return { exists: Boolean(item), href: item ? getLinkedItemHref("activity", item.id) : null, label: item?.title || null };
  }

  if (entityType === "routine") {
    const item = snapshot.routines.find((current) => current.id === entityId);
    return { exists: Boolean(item), href: item ? getLinkedItemHref("routine", item.id) : null, label: item?.title || null };
  }

  const item = snapshot.notes.find((current) => current.id === entityId);
  return { exists: Boolean(item), href: item ? `/notes?noteId=${item.id}` : null, label: item?.title || null };
}
