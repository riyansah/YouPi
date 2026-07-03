import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { defaultActivities, defaultRoutines, defaultSettings, defaultTasks } from "../lib/data";
import { appRoutes } from "../lib/navigation";
import { createDashboardBackup, parseDashboardBackup } from "../lib/storage";
import {
  buildTodayAgendaItems,
  dailyActivityChartData,
  filterByReportPeriod,
  filterTasksByReportPeriod,
  formatDeadlineCountdown,
  getDeadlineCountdownState,
  getDeadlineCountdownTone,
  paginateItems,
  reportActivityChartData,
  reportTaskProgressChartData,
  sortRoutines,
  sortTasksByNearestDeadline,
  summarizeActivities,
  summarizeTasks,
  toCsv
} from "../lib/utils";
import { validateActivityForm, validateRoutineForm, validateTaskForm } from "../lib/validation";

test("summarizeTasks counts task statuses and completion rate", () => {
  const summary = summarizeTasks(defaultTasks);

  assert.equal(summary.total, 8);
  assert.equal(summary.running, 3);
  assert.equal(summary.completed, 2);
  assert.equal(summary.pending, 2);
  assert.equal(summary.completionRate, 25);
});

test("summarizeActivities finds totals and dominant values", () => {
  const summary = summarizeActivities(defaultActivities);

  assert.equal(summary.total, 20);
  assert.equal(summary.dominantCategory, "Kerja");
  assert.equal(summary.mostFrequentActivity, "Deep work dashboard");
});

test("dailyActivityChartData combines activities and scheduled routines for seven days", () => {
  const result = dailyActivityChartData(
    [
      {
        id: "activity-1",
        title: "Aktivitas 1",
        category: "Kerja",
        date: "2026-06-25",
        startTime: "08:00",
        endTime: "09:00",
        status: "Selesai",
        notes: "",
        createdAt: "2026-06-25T07:00:00.000Z",
        updatedAt: "2026-06-25T09:00:00.000Z"
      },
      {
        id: "activity-2",
        title: "Aktivitas 2",
        category: "Belajar",
        date: "2026-06-25",
        startTime: "10:00",
        endTime: "11:00",
        status: "Berjalan",
        notes: "",
        createdAt: "2026-06-25T09:00:00.000Z",
        updatedAt: "2026-06-25T09:00:00.000Z"
      },
      {
        id: "activity-3",
        title: "Aktivitas 3",
        category: "Olahraga",
        date: "2026-06-24",
        startTime: "07:00",
        endTime: "07:30",
        status: "Direncanakan",
        notes: "",
        createdAt: "2026-06-24T06:00:00.000Z",
        updatedAt: "2026-06-24T06:00:00.000Z"
      }
    ],
    [
      {
        id: "routine-thursday",
        title: "Rutinitas Kamis",
        days: ["Kamis"],
        startTime: "06:00",
        endTime: "06:30",
        priority: "Sedang",
        notes: "",
        createdAt: "2026-06-20T06:00:00.000Z",
        updatedAt: "2026-06-20T06:00:00.000Z"
      },
      {
        id: "routine-wednesday",
        title: "Rutinitas Rabu",
        days: ["Rabu"],
        startTime: "06:00",
        endTime: "06:30",
        priority: "Rendah",
        notes: "",
        createdAt: "2026-06-20T06:00:00.000Z",
        updatedAt: "2026-06-20T06:00:00.000Z"
      },
      {
        id: "routine-monday-thursday",
        title: "Rutinitas Senin Kamis",
        days: ["Senin", "Kamis"],
        startTime: "06:00",
        endTime: "06:30",
        priority: "Tinggi",
        notes: "",
        createdAt: "2026-06-20T06:00:00.000Z",
        updatedAt: "2026-06-20T06:00:00.000Z"
      }
    ],
    "2026-06-25"
  );

  assert.deepEqual(
    result.map((item) => item.total),
    [0, 0, 0, 1, 0, 2, 4]
  );
  assert.deepEqual(result[result.length - 1], { date: "25 Jun 2026", total: 4, activities: 2, routines: 2 });
});

test("filterByReportPeriod filters daily activity rows", () => {
  const filtered = filterByReportPeriod(defaultActivities, "2026-06-23", "Harian");

  assert.equal(filtered.length, 7);
});

test("paginateItems returns the first page with range metadata", () => {
  const result = paginateItems(Array.from({ length: 25 }, (_, index) => index + 1), 1, 10);

  assert.deepEqual(result.items, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(result.currentPage, 1);
  assert.equal(result.totalPages, 3);
  assert.equal(result.startItem, 1);
  assert.equal(result.endItem, 10);
});

test("paginateItems clamps pages beyond the available range", () => {
  const result = paginateItems(Array.from({ length: 25 }, (_, index) => index + 1), 9, 10);

  assert.deepEqual(result.items, [21, 22, 23, 24, 25]);
  assert.equal(result.currentPage, 3);
  assert.equal(result.totalPages, 3);
  assert.equal(result.startItem, 21);
  assert.equal(result.endItem, 25);
});

test("paginateItems handles empty lists", () => {
  const result = paginateItems([], 1, 10);

  assert.deepEqual(result.items, []);
  assert.equal(result.currentPage, 1);
  assert.equal(result.totalPages, 1);
  assert.equal(result.startItem, 0);
  assert.equal(result.endItem, 0);
});

test("sortTasksByNearestDeadline keeps only active tasks ordered by nearest deadline", () => {
  const sorted = sortTasksByNearestDeadline(defaultTasks);

  assert.deepEqual(sorted.map((task) => task.id), ["task-4", "task-3", "task-6", "task-1", "task-7"]);
});

test("sortRoutines orders by first active day and start time", () => {
  const sorted = sortRoutines(defaultRoutines);

  assert.deepEqual(sorted.map((routine) => routine.id), ["routine-1", "routine-2", "routine-4", "routine-3"]);
});

test("buildTodayAgendaItems keeps overdue activities first and hides passed routines", () => {
  const items = buildTodayAgendaItems(
    [
      {
        id: "activity-overdue",
        title: "Aktivitas lewat",
        category: "Kerja",
        date: "2026-06-25",
        startTime: "08:00",
        endTime: "09:00",
        status: "Direncanakan",
        notes: "",
        createdAt: "2026-06-25T07:50:00.000Z",
        updatedAt: "2026-06-25T07:50:00.000Z"
      },
      {
        id: "activity-upcoming",
        title: "Aktivitas nanti",
        category: "Belajar",
        date: "2026-06-25",
        startTime: "10:00",
        endTime: "11:00",
        status: "Berjalan",
        notes: "",
        createdAt: "2026-06-25T09:00:00.000Z",
        updatedAt: "2026-06-25T09:00:00.000Z"
      },
      {
        id: "activity-done",
        title: "Aktivitas selesai",
        category: "Kerja",
        date: "2026-06-25",
        startTime: "07:00",
        endTime: "07:30",
        status: "Selesai",
        notes: "",
        createdAt: "2026-06-25T06:50:00.000Z",
        updatedAt: "2026-06-25T07:30:00.000Z"
      }
    ],
    [
      {
        id: "routine-visible",
        title: "Rutinitas terlihat",
        days: ["Kamis"],
        startTime: "09:30",
        endTime: "10:00",
        priority: "Sedang",
        notes: "",
        createdAt: "2026-06-20T06:00:00.000Z",
        updatedAt: "2026-06-20T06:00:00.000Z"
      },
      {
        id: "routine-past",
        title: "Rutinitas lewat",
        days: ["Kamis"],
        startTime: "08:00",
        endTime: "08:30",
        priority: "Rendah",
        notes: "",
        createdAt: "2026-06-20T06:00:00.000Z",
        updatedAt: "2026-06-20T06:00:00.000Z"
      }
    ],
    "2026-06-25",
    new Date(2026, 5, 25, 9, 15, 0, 0).getTime()
  );

  assert.deepEqual(
    items.map((item) => [item.id, item.type]),
    [
      ["activity-overdue", "Aktivitas"],
      ["routine-visible", "Rutinitas"],
      ["activity-upcoming", "Aktivitas"]
    ]
  );
});

test("formatDeadlineCountdown shows compact future countdown", () => {
  const now = new Date(2026, 5, 23, 12, 0, 0, 0).getTime();

  assert.equal(formatDeadlineCountdown("2026-06-24", now), "01:11:59:59");
});

test("formatDeadlineCountdown shows compact overdue countdown in minutes", () => {
  const now = new Date(2026, 5, 25, 0, 5, 0, 0).getTime();

  assert.equal(formatDeadlineCountdown("2026-06-24", now), "Terlambat 05 Menit");
});

test("formatDeadlineCountdown shows compact overdue countdown in hours", () => {
  const now = new Date(2026, 5, 25, 3, 2, 3, 0).getTime();

  assert.equal(formatDeadlineCountdown("2026-06-24", now), "Terlambat 03 Jam");
});

test("formatDeadlineCountdown shows compact overdue countdown in days and hours", () => {
  const now = new Date(2026, 5, 27, 4, 2, 3, 0).getTime();

  assert.equal(formatDeadlineCountdown("2026-06-24", now), "Terlambat 02 Hari 04 Jam");
});

test("getDeadlineCountdownTone returns green when more than three days remain", () => {
  const now = new Date(2026, 5, 20, 12, 0, 0, 0).getTime();

  assert.equal(getDeadlineCountdownTone("2026-06-24", now), "green");
});

test("getDeadlineCountdownTone returns amber when less than three days remain", () => {
  const now = new Date(2026, 5, 22, 12, 0, 0, 0).getTime();

  assert.equal(getDeadlineCountdownTone("2026-06-24", now), "amber");
});

test("getDeadlineCountdownTone returns red when less than one day remains or overdue", () => {
  const almostDue = new Date(2026, 5, 24, 12, 0, 0, 0).getTime();
  const overdue = new Date(2026, 5, 25, 1, 2, 3, 0).getTime();

  assert.equal(getDeadlineCountdownTone("2026-06-24", almostDue), "red");
  assert.equal(getDeadlineCountdownTone("2026-06-24", overdue), "red");
});

test("getDeadlineCountdownState exposes compact display label and verbose tooltip", () => {
  const now = new Date(2026, 5, 23, 12, 0, 0, 0).getTime();
  const countdown = getDeadlineCountdownState("2026-06-24", now);

  assert.equal(countdown.displayLabel, "01:11:59:59");
  assert.equal(countdown.fullLabel, "1 hari 11 jam 59 menit 59 detik lagi");
  assert.equal(countdown.isOverdue, false);
});

test("toCsv escapes quoted values", () => {
  const csv = toCsv([{ metric: "Judul", value: 'A "quoted" value' }]);

  assert.equal(csv, 'metric,value\n"Judul","A ""quoted"" value"');
});

test("validateTaskForm rejects invalid date order", () => {
  const errors = validateTaskForm({
    title: "Tes",
    description: "Valid description",
    status: "Berjalan",
    priority: "Sedang",
    startDate: "2026-06-24",
    deadline: "2026-06-23",
    startTime: null,
    endTime: null
  });

  assert.deepEqual(errors, ["Deadline tidak boleh lebih awal dari tanggal mulai."]);
});

test("validateTaskForm rejects partial or invalid optional time ranges", () => {
  assert.deepEqual(
    validateTaskForm({
      title: "Tes",
      description: "Valid description",
      status: "Berjalan",
      priority: "Sedang",
      startDate: "2026-06-24",
      deadline: "2026-06-24",
      startTime: "09:00",
      endTime: null
    }),
    ["Jam mulai dan jam selesai harus diisi bersamaan atau dikosongkan keduanya."]
  );

  assert.deepEqual(
    validateTaskForm({
      title: "Tes",
      description: "Valid description",
      status: "Berjalan",
      priority: "Sedang",
      startDate: "2026-06-24",
      deadline: "2026-06-24",
      startTime: "09:00",
      endTime: "08:00"
    }),
    ["Jam selesai harus lebih besar dari jam mulai."]
  );

  assert.deepEqual(
    validateTaskForm({
      title: "Tes",
      description: "Valid description",
      status: "Berjalan",
      priority: "Sedang",
      startDate: "2026-06-24",
      deadline: "2026-06-24",
      startTime: null,
      endTime: null
    }),
    []
  );
});

test("validateActivityForm rejects invalid time order", () => {
  const errors = validateActivityForm({
    title: "Tes",
    category: "Kerja",
    date: "2026-06-23",
    startTime: "10:00",
    endTime: "09:00",
    status: "Direncanakan",
    notes: ""
  });

  assert.deepEqual(errors, ["Waktu selesai harus lebih besar dari waktu mulai."]);
});

test("validateRoutineForm rejects empty day selection", () => {
  const errors = validateRoutineForm({
    title: "Rutinitas",
    days: [],
    startTime: "07:00",
    endTime: "07:30",
    priority: "Sedang",
    notes: ""
  });

  assert.deepEqual(errors, ["Pilih minimal satu hari untuk rutinitas."]);
});

test("dashboard backup round-trips valid local data", () => {
  const backup = createDashboardBackup(
    defaultTasks,
    defaultActivities,
    defaultRoutines,
    defaultSettings,
    "2026-06-24T00:00:00.000Z"
  );
  const parsed = parseDashboardBackup(JSON.stringify(backup));

  assert.equal(parsed.ok, true);

  if (parsed.ok) {
    assert.equal(parsed.backup.tasks.length, defaultTasks.length);
    assert.equal(parsed.backup.activities.length, defaultActivities.length);
    assert.equal(parsed.backup.routines.length, defaultRoutines.length);
    assert.equal(parsed.backup.settings.dashboardName, defaultSettings.dashboardName);
    assert.equal("accountName" in parsed.backup.settings, false);
    assert.equal("accountEmail" in parsed.backup.settings, false);
  }
});

test("dashboard backup does not require local account fields", () => {
  const backup = createDashboardBackup(
    defaultTasks,
    defaultActivities,
    defaultRoutines,
    defaultSettings,
    "2026-06-24T00:00:00.000Z"
  );
  const parsed = parseDashboardBackup(JSON.stringify(backup));

  assert.equal(parsed.ok, true);

  if (parsed.ok) {
    assert.equal("accountName" in parsed.backup.settings, false);
    assert.equal("accountEmail" in parsed.backup.settings, false);
  }
});

test("dashboard backup ignores legacy local account fields", () => {
  const legacyBackup = {
    version: 2,
    exportedAt: "2026-06-24T00:00:00.000Z",
    tasks: defaultTasks,
    activities: defaultActivities,
    routines: defaultRoutines,
    settings: {
      ...defaultSettings,
      accountName: "Pengguna Lama",
      accountEmail: "lama@example.com"
    }
  };
  const parsed = parseDashboardBackup(JSON.stringify(legacyBackup));

  assert.equal(parsed.ok, true);

  if (parsed.ok) {
    assert.equal(parsed.backup.settings.dashboardName, defaultSettings.dashboardName);
    assert.equal("accountName" in parsed.backup.settings, false);
    assert.equal("accountEmail" in parsed.backup.settings, false);
  }
});

test("dashboard backup keeps compatibility with v1 data", () => {
  const legacyBackup = {
    version: 1,
    exportedAt: "2026-06-24T00:00:00.000Z",
    tasks: defaultTasks,
    activities: defaultActivities,
    settings: defaultSettings
  };
  const parsed = parseDashboardBackup(JSON.stringify(legacyBackup));

  assert.equal(parsed.ok, true);

  if (parsed.ok) {
    assert.deepEqual(parsed.backup.routines, []);
  }
});

test("dashboard backup rejects invalid routine shape", () => {
  const backup = createDashboardBackup(
    defaultTasks,
    defaultActivities,
    defaultRoutines,
    defaultSettings,
    "2026-06-24T00:00:00.000Z"
  );
  const invalid = {
    ...backup,
    routines: [{ ...defaultRoutines[0], days: ["Hari Salah"] }]
  };

  const parsed = parseDashboardBackup(JSON.stringify(invalid));

  assert.deepEqual(parsed, { ok: false, error: "Isi backup tidak valid." });
});

test("navigation routes have matching app pages", () => {
  for (const route of appRoutes) {
    const pagePath = join(process.cwd(), "app", route.href.slice(1), "page.tsx");
    assert.equal(existsSync(pagePath), true, `${route.href} should have a page file`);
  }
});

test("formatDeadlineCountdown uses task end time when provided", () => {
  const now = new Date(2026, 5, 24, 16, 30, 0, 0).getTime();

  assert.equal(formatDeadlineCountdown("2026-06-24", now, "17:00"), "00:00:30:59");
});

test("report chart datasets follow the active period buckets", () => {
  const activityData = reportActivityChartData(defaultActivities, "2026-06-23", "Harian");
  const progressData = reportTaskProgressChartData(defaultTasks, "2026-06-23", "Harian");

  assert.deepEqual(activityData, [{ date: "23 Jun 2026", total: 7 }]);
  assert.deepEqual(progressData, [{ date: "23 Jun 2026", completed: 1 }]);
});

test("filterTasksByReportPeriod filters by deadline instead of createdAt", () => {
  const filtered = filterTasksByReportPeriod(defaultTasks, "2026-06-23", "Harian");

  assert.deepEqual(filtered.map((task) => task.id), ["task-2", "task-4"]);
});
