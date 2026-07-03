import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { defaultSettings } from "@/lib/data";
import type { Activity, DashboardSettings, Routine, Task } from "@/lib/types";

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
  settings: DashboardSettings;
}

const tableNames = {
  tasks: "tasks",
  activities: "activities",
  routines: "routines"
} as const;

let database: Database | null = null;

function getDatabasePath() {
  return process.env.SQLITE_PATH || join(process.cwd(), "data", "activity.sqlite");
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
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  return database;
}

function readRows<T>(table: keyof typeof tableNames): T[] {
  const rows = getDatabase().prepare(`SELECT data FROM ${tableNames[table]} ORDER BY position ASC`).all();
  return rows.map((row) => JSON.parse(String(row.data)) as T);
}

function replaceRows<T extends { id: string }>(table: keyof typeof tableNames, rows: T[]) {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(`DELETE FROM ${tableNames[table]}`).run();
  const insert = db.prepare(`INSERT INTO ${tableNames[table]} (id, data, position, updated_at) VALUES (?, ?, ?, ?)`);
  rows.forEach((row, index) => insert.run(row.id, JSON.stringify(row), index, now));
}

function readSettings() {
  const rows = getDatabase().prepare("SELECT data FROM settings WHERE key = ?").all("dashboard");
  const row = rows[0];
  return row ? (JSON.parse(String(row.data)) as DashboardSettings) : defaultSettings;
}

function replaceSettings(settings: DashboardSettings) {
  getDatabase()
    .prepare("INSERT OR REPLACE INTO settings (key, data, updated_at) VALUES (?, ?, ?)")
    .run("dashboard", JSON.stringify(settings), new Date().toISOString());
}

export function getDashboardData(): DashboardData {
  return {
    tasks: readRows<Task>("tasks"),
    activities: readRows<Activity>("activities"),
    routines: readRows<Routine>("routines"),
    settings: readSettings()
  };
}

export function updateDashboardData(patch: Partial<DashboardData>) {
  const db = getDatabase();

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

    if (patch.settings) {
      replaceSettings(patch.settings);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function replaceDashboardData(data: DashboardData) {
  updateDashboardData(data);
}
