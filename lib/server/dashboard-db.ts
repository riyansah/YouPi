import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { defaultSettings } from "@/lib/data";
import { buildDashboardHistoryEvents, buildHistoryRecord, buildMissedHistoryEvents, getMissedEventKeyFromMetadata } from "@/lib/server/history";
import { logWithContext } from "@/lib/server/request-context";
import { normalizeDashboardSettings } from "@/lib/storage";
import { getCurrentTimestampInTimeZone } from "@/lib/time";
import type { Activity, DashboardSettings, HistoryEvent, HistoryEventRecord, Note, NoteCategory, NoteLinkedType, Routine, Task } from "@/lib/types";

const require = createRequire(import.meta.url);

export interface Statement {
  get: (...values: unknown[]) => Record<string, unknown> | undefined;
  all: (...values: unknown[]) => Array<Record<string, unknown>>;
  run: (...values: unknown[]) => unknown;
}

export interface Database {
  exec: (sql: string) => void;
  prepare: (sql: string) => Statement;
}

const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: new (path: string) => Database };

export interface DashboardData {
  tasks: Task[];
  activities: Activity[];
  routines: Routine[];
  notes: Note[];
  history: HistoryEvent[];
  settings: DashboardSettings;
}

interface UpdateDashboardOptions {
  recordHistory?: boolean;
  syncMissed?: boolean;
}

const tableNames = {
  tasks: "tasks",
  activities: "activities",
  routines: "routines"
} as const;

type ResourceTable = keyof typeof tableNames;
type ResourceItem = Task | Activity | Routine;
type LinkedResourceType = Exclude<NoteLinkedType, null>;

let database: Database | null = null;

function getDatabasePath() {
  return process.env.SQLITE_PATH || join(process.cwd(), "data", "activity.sqlite");
}

function parseNoteRow(row: Record<string, unknown>): Note {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    category: String(row.category) as NoteCategory,
    linkedType: row.linked_type ? (String(row.linked_type) as Exclude<NoteLinkedType, null>) : null,
    linkedId: row.linked_id ? String(row.linked_id) : null,
    tags: JSON.parse(String(row.tags_json)) as string[],
    isPinned: Number(row.is_pinned) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function parseHistoryRow(row: Record<string, unknown>): HistoryEvent {
  return {
    id: String(row.id),
    eventType: String(row.event_type) as HistoryEvent["eventType"],
    entityType: String(row.entity_type) as HistoryEvent["entityType"],
    entityId: String(row.entity_id),
    title: String(row.title),
    description: String(row.description),
    metadata: row.metadata_json === null || row.metadata_json === undefined ? null : String(row.metadata_json),
    createdAt: String(row.created_at)
  };
}

function noteToRow(note: Note) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    category: note.category,
    linkedType: note.linkedType,
    linkedId: note.linkedId,
    tagsJson: JSON.stringify(note.tags),
    isPinned: note.isPinned ? 1 : 0,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  };
}

function historyToRow(event: HistoryEvent) {
  const eventKey = getMissedEventKeyFromMetadata(event.metadata);
  return {
    id: event.id,
    eventType: event.eventType,
    entityType: event.entityType,
    entityId: event.entityId,
    title: event.title,
    description: event.description,
    metadataJson: event.metadata,
    createdAt: event.createdAt,
    eventKey
  };
}

function parseHistoryMetadata(metadata: string | null) {
  if (!metadata) {
    return {};
  }

  try {
    const parsed = JSON.parse(metadata) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : { value: parsed };
  } catch {
    return { raw_metadata: metadata };
  }
}

function eventAction(event: HistoryEvent) {
  if (event.eventType === "missed") {
    return `system.${event.entityType}_missed`;
  }

  if (event.eventType === "completed" || event.eventType === "cancelled") {
    return `${event.entityType}.status_changed`;
  }

  return `${event.entityType}.${event.eventType}`;
}

function eventActivity(event: HistoryEvent) {
  const labels: Record<HistoryEvent["eventType"], string> = {
    created: "Membuat data",
    updated: "Mengubah data",
    completed: "Mengubah status data",
    missed: "Aktivitas sistem otomatis",
    cancelled: "Mengubah status data",
    deleted: "Menghapus data",
    pinned: "Mengubah data",
    unpinned: "Mengubah data"
  };

  return labels[event.eventType] || event.description;
}

function logHistoryEvent(event: HistoryEvent) {
  const metadata = parseHistoryMetadata(event.metadata);
  const isSystemEvent = event.eventType === "missed";

  logWithContext({
    level: "info",
    category: isSystemEvent ? "SYSTEM_ACTIVITY" : "USER_ACTIVITY",
    action: eventAction(event),
    activity: eventActivity(event),
    entityType: event.entityType,
    entityId: event.entityId,
    status: "success",
    description: event.description,
    metadata
  });
}

export function getDatabase() {
  if (!database) {
    const databasePath = getDatabasePath();
    mkdirSync(dirname(databasePath), { recursive: true });
    database = new DatabaseSync(databasePath);
    database.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        position INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        position INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        position INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        linked_type TEXT,
        linked_id TEXT,
        tags_json TEXT NOT NULL,
        is_pinned INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_notes_link ON notes (linked_type, linked_id);
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes (updated_at);
      CREATE TABLE IF NOT EXISTS history_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata_json TEXT,
        event_key TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_history_created_at ON history_events (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_history_event_type ON history_events (event_type);
      CREATE INDEX IF NOT EXISTS idx_history_entity_type ON history_events (entity_type);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_history_event_key ON history_events (event_key) WHERE event_key IS NOT NULL;
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  return database;
}

function readRows<T>(table: ResourceTable): T[] {
  const rows = getDatabase().prepare(`SELECT data FROM ${tableNames[table]} ORDER BY position ASC`).all();
  return rows.map((row) => JSON.parse(String(row.data)) as T);
}

function readRow<T>(table: ResourceTable, id: string): T | null {
  const row = getDatabase().prepare(`SELECT data FROM ${tableNames[table]} WHERE id = ?`).get(id);
  return row ? (JSON.parse(String(row.data)) as T) : null;
}

function replaceRows<T extends { id: string }>(table: ResourceTable, rows: T[]) {
  const db = getDatabase();
  const now = getCurrentTimestampInTimeZone();
  db.prepare(`DELETE FROM ${tableNames[table]}`).run();
  const insert = db.prepare(`INSERT INTO ${tableNames[table]} (id, data, position, updated_at) VALUES (?, ?, ?, ?)`);
  rows.forEach((row, index) => insert.run(row.id, JSON.stringify(row), index, now));
}

function appendDashboardHistory(before: DashboardData) {
  const after = getDashboardData(false);
  appendHistoryEvents(buildDashboardHistoryEvents(before, after, { existingMissedKeys: getExistingMissedKeys() }));
}

function writeResourceRows(table: ResourceTable, rows: ResourceItem[]) {
  if (table === "tasks") {
    replaceRows("tasks", rows as Task[]);
    return;
  }

  if (table === "activities") {
    replaceRows("activities", rows as Activity[]);
    return;
  }

  replaceRows("routines", rows as Routine[]);
}

function resourceRows(table: ResourceTable, data: DashboardData): ResourceItem[] {
  if (table === "tasks") {
    return data.tasks;
  }

  if (table === "activities") {
    return data.activities;
  }

  return data.routines;
}

function linkedTypeForTable(table: ResourceTable): LinkedResourceType {
  if (table === "tasks") {
    return "work";
  }

  if (table === "activities") {
    return "activity";
  }

  return "routine";
}

function unlinkNotesForTargetRows(notes: Note[], linkedType: LinkedResourceType, linkedId: string) {
  let changed = false;
  const updatedAt = getCurrentTimestampInTimeZone();
  const next = notes.map((note) => {
    if (note.linkedType !== linkedType || note.linkedId !== linkedId) {
      return note;
    }

    changed = true;
    return {
      ...note,
      linkedType: null,
      linkedId: null,
      updatedAt
    } satisfies Note;
  });

  return changed ? next : notes;
}

function createResource<T extends ResourceItem>(table: ResourceTable, item: T) {
  const db = getDatabase();
  const before = getDashboardData(false);
  const rows = resourceRows(table, before).filter((current) => current.id !== item.id);

  db.exec("BEGIN");
  try {
    writeResourceRows(table, [item, ...rows]);
    appendDashboardHistory(before);
    db.exec("COMMIT");
    return item;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function updateResource<T extends ResourceItem>(table: ResourceTable, id: string, patch: Partial<T>) {
  const db = getDatabase();
  const before = getDashboardData(false);
  const rows = resourceRows(table, before) as T[];
  const current = rows.find((item) => item.id === id);

  if (!current) {
    return null;
  }

  const nextItem = { ...current, ...patch, id: current.id } as T;

  db.exec("BEGIN");
  try {
    writeResourceRows(table, rows.map((item) => (item.id === id ? nextItem : item)));
    appendDashboardHistory(before);
    db.exec("COMMIT");
    return nextItem;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function deleteResource<T extends ResourceItem>(table: ResourceTable, id: string) {
  const db = getDatabase();
  const before = getDashboardData(false);
  const rows = resourceRows(table, before) as T[];
  const current = rows.find((item) => item.id === id);

  if (!current) {
    return null;
  }

  db.exec("BEGIN");
  try {
    writeResourceRows(table, rows.filter((item) => item.id !== id));
    replaceNotes(unlinkNotesForTargetRows(before.notes, linkedTypeForTable(table), id));
    appendDashboardHistory(before);
    db.exec("COMMIT");
    return current;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getTasks(): Task[] {
  return readRows<Task>("tasks");
}

export function getTaskById(id: string) {
  return readRow<Task>("tasks", id);
}

export function createTask(task: Task) {
  return createResource("tasks", task);
}

export function updateTask(id: string, patch: Partial<Task>) {
  return updateResource<Task>("tasks", id, patch);
}

export function deleteTask(id: string) {
  return deleteResource<Task>("tasks", id);
}

export function getActivities(): Activity[] {
  return readRows<Activity>("activities");
}

export function getActivityById(id: string) {
  return readRow<Activity>("activities", id);
}

export function createActivity(activity: Activity) {
  return createResource("activities", activity);
}

export function updateActivity(id: string, patch: Partial<Activity>) {
  return updateResource<Activity>("activities", id, patch);
}

export function deleteActivity(id: string) {
  return deleteResource<Activity>("activities", id);
}

export function getRoutines(): Routine[] {
  return readRows<Routine>("routines");
}

export function getRoutineById(id: string) {
  return readRow<Routine>("routines", id);
}

export function createRoutine(routine: Routine) {
  return createResource("routines", routine);
}

export function updateRoutine(id: string, patch: Partial<Routine>) {
  return updateResource<Routine>("routines", id, patch);
}

export function deleteRoutine(id: string) {
  return deleteResource<Routine>("routines", id);
}

export function getNotes(): Note[] {
  const rows = getDatabase()
    .prepare("SELECT id, title, content, category, linked_type, linked_id, tags_json, is_pinned, created_at, updated_at FROM notes ORDER BY position ASC")
    .all();
  return rows.map(parseNoteRow);
}

function replaceNotes(notes: Note[]) {
  const db = getDatabase();
  db.prepare("DELETE FROM notes").run();
  const insert = db.prepare(`
    INSERT INTO notes (
      id, title, content, category, linked_type, linked_id, tags_json, is_pinned, position, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  notes.forEach((note, index) => {
    const row = noteToRow(note);
    insert.run(row.id, row.title, row.content, row.category, row.linkedType, row.linkedId, row.tagsJson, row.isPinned, index, row.createdAt, row.updatedAt);
  });
}

export function getHistoryEvents(): HistoryEvent[] {
  const rows = getDatabase()
    .prepare("SELECT id, event_type, entity_type, entity_id, title, description, metadata_json, created_at FROM history_events")
    .all();
  return rows
    .map(parseHistoryRow)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id));
}

function replaceHistoryEvents(history: HistoryEvent[]) {
  const db = getDatabase();
  db.prepare("DELETE FROM history_events").run();
  const insert = db.prepare(`
    INSERT INTO history_events (
      id, event_type, entity_type, entity_id, title, description, metadata_json, event_key, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  history.forEach((event) => {
    const row = historyToRow(event);
    insert.run(row.id, row.eventType, row.entityType, row.entityId, row.title, row.description, row.metadataJson, row.eventKey, row.createdAt);
  });
}

function appendHistoryEvents(events: HistoryEvent[]) {
  if (!events.length) {
    return;
  }

  const insert = getDatabase().prepare(`
    INSERT OR IGNORE INTO history_events (
      id, event_type, entity_type, entity_id, title, description, metadata_json, event_key, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  events.forEach((event) => {
    const row = historyToRow(event);
    insert.run(row.id, row.eventType, row.entityType, row.entityId, row.title, row.description, row.metadataJson, row.eventKey, row.createdAt);
    logHistoryEvent(event);
  });
}

export function getHistoryEventById(id: string) {
  const row = getDatabase()
    .prepare("SELECT id, event_type, entity_type, entity_id, title, description, metadata_json, created_at FROM history_events WHERE id = ?")
    .get(id);
  return row ? parseHistoryRow(row) : null;
}

export function getHistoryEventRecordById(id: string): HistoryEventRecord | null {
  const event = getHistoryEventById(id);
  if (!event) {
    return null;
  }

  const snapshot = getDashboardData(false);
  return buildHistoryRecord(event, snapshot);
}

export function listHistoryEventRecords() {
  syncMissedHistoryEvents();
  const snapshot = getDashboardData(false);
  return getHistoryEvents().map((event) => buildHistoryRecord(event, snapshot));
}

export function getNoteById(id: string) {
  const row = getDatabase()
    .prepare("SELECT id, title, content, category, linked_type, linked_id, tags_json, is_pinned, created_at, updated_at FROM notes WHERE id = ?")
    .get(id);
  return row ? parseNoteRow(row) : null;
}

export function createNote(note: Note) {
  const current = getDashboardData(false);
  const position = current.notes.length;
  const row = noteToRow(note);
  getDatabase()
    .prepare(`
      INSERT INTO notes (
        id, title, content, category, linked_type, linked_id, tags_json, is_pinned, position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(row.id, row.title, row.content, row.category, row.linkedType, row.linkedId, row.tagsJson, row.isPinned, position, row.createdAt, row.updatedAt);

  const next = getDashboardData(false);
  appendHistoryEvents(buildDashboardHistoryEvents(current, next, { existingMissedKeys: getExistingMissedKeys() }));
  return note;
}

export function updateNote(id: string, patch: Partial<Note>) {
  const currentNote = getNoteById(id);
  if (!currentNote) {
    return null;
  }

  const before = getDashboardData(false);
  const next: Note = {
    ...currentNote,
    ...patch,
    id: currentNote.id,
    updatedAt: patch.updatedAt || currentNote.updatedAt
  };
  const row = noteToRow(next);
  getDatabase()
    .prepare(`
      UPDATE notes
      SET title = ?, content = ?, category = ?, linked_type = ?, linked_id = ?, tags_json = ?, is_pinned = ?, created_at = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(row.title, row.content, row.category, row.linkedType, row.linkedId, row.tagsJson, row.isPinned, row.createdAt, row.updatedAt, id);

  const after = getDashboardData(false);
  appendHistoryEvents(buildDashboardHistoryEvents(before, after, { existingMissedKeys: getExistingMissedKeys() }));
  return next;
}

export function deleteNote(id: string) {
  const current = getNoteById(id);
  if (!current) {
    return false;
  }

  const before = getDashboardData(false);
  getDatabase().prepare("DELETE FROM notes WHERE id = ?").run(id);
  replaceNotes(getNotes());
  const after = getDashboardData(false);
  appendHistoryEvents(buildDashboardHistoryEvents(before, after, { existingMissedKeys: getExistingMissedKeys() }));
  return true;
}

export function unlinkNotesByTarget(linkedType: Exclude<NoteLinkedType, null>, linkedId: string) {
  const notes = getNotes();
  let changed = false;
  const updatedAt = getCurrentTimestampInTimeZone();
  const next = notes.map((note) => {
    if (note.linkedType !== linkedType || note.linkedId !== linkedId) {
      return note;
    }

    changed = true;
    return {
      ...note,
      linkedType: null,
      linkedId: null,
      updatedAt
    } satisfies Note;
  });

  if (changed) {
    replaceNotes(next);
  }

  return next.filter((note) => note.linkedType !== linkedType || note.linkedId !== linkedId).length;
}

export function getSettings() {
  return readSettings();
}

export function updateSettings(settings: DashboardSettings) {
  updateDashboardData({ settings });
  return getSettings();
}

function readSettings() {
  const rows = getDatabase().prepare("SELECT data FROM settings WHERE key = ?").all("dashboard");
  const row = rows[0];
  return row ? normalizeDashboardSettings(JSON.parse(String(row.data)) as DashboardSettings) : defaultSettings;
}

function replaceSettings(settings: DashboardSettings) {
  getDatabase()
    .prepare("INSERT OR REPLACE INTO settings (key, data, updated_at) VALUES (?, ?, ?)")
    .run("dashboard", JSON.stringify(normalizeDashboardSettings(settings)), getCurrentTimestampInTimeZone());
}

function getExistingMissedKeys() {
  const keys = new Set<string>();
  getHistoryEvents().forEach((event) => {
    if (event.eventType !== "missed") {
      return;
    }

    const key = getMissedEventKeyFromMetadata(event.metadata);
    if (key) {
      keys.add(key);
    }
  });
  return keys;
}

export function syncMissedHistoryEvents() {
  const snapshot = getDashboardData(false);
  const events = buildMissedHistoryEvents(snapshot, getExistingMissedKeys());
  appendHistoryEvents(events);
}

export function getDashboardData(syncDerivedHistory = true): DashboardData {
  if (syncDerivedHistory) {
    syncMissedHistoryEvents();
  }

  return {
    tasks: readRows<Task>("tasks"),
    activities: readRows<Activity>("activities"),
    routines: readRows<Routine>("routines"),
    notes: getNotes(),
    history: getHistoryEvents(),
    settings: readSettings()
  };
}

export function updateDashboardData(patch: Partial<DashboardData>, options: UpdateDashboardOptions = {}) {
  const db = getDatabase();
  const recordHistory = options.recordHistory !== false;
  const syncMissed = options.syncMissed !== false;
  const before = getDashboardData(false);

  db.exec("BEGIN");
  try {
    if (patch.tasks) {
      replaceRows("tasks", patch.tasks);
    }

    if (patch.activities) {
      replaceRows("activities", patch.activities);
    }

    if (patch.routines) {
      replaceRows("routines", patch.routines);
    }

    if (patch.notes) {
      replaceNotes(patch.notes);
    }

    if (patch.history) {
      replaceHistoryEvents(patch.history);
    }

    if (patch.settings) {
      replaceSettings(patch.settings);
    }

    if (recordHistory) {
      const after = getDashboardData(false);
      appendHistoryEvents(buildDashboardHistoryEvents(before, after, { existingMissedKeys: getExistingMissedKeys() }));
    } else if (syncMissed) {
      const snapshot = getDashboardData(false);
      appendHistoryEvents(buildMissedHistoryEvents(snapshot, getExistingMissedKeys()));
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function replaceDashboardData(data: DashboardData, options: UpdateDashboardOptions = {}) {
  updateDashboardData(data, options);
}
