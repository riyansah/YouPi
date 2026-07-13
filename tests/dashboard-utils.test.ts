import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { defaultActivities, defaultNotes, defaultRoutines, defaultSettings, defaultTasks } from "../lib/data";
import { getActivityCategoryFilterParam, matchesActivityCategoryFilter } from "../lib/activity-filters";
import { formatHistoryMetadata } from "../lib/history-utils";
import { appRoutes } from "../lib/navigation";
import { translateNoteValidationErrors } from "../lib/notes";
import {
  buildReportCsvContent,
  buildReportCsvRows,
  buildReportExcelSheets,
  buildReportExportModel,
  getReportCsvFilename,
  getReportExcelFilename,
  getReportPdfFilename,
  reportCsvColumns
} from "../lib/report-export";
import { createDashboardBackup, getDashboardBackupErrorMessage, parseDashboardBackup } from "../lib/storage";
import { APP_DEFAULT_TIME_ZONE, zonedDateTimeToTimestamp } from "../lib/time";
import {
  activityCategoryChartData,
  buildScheduleItems,
  buildScheduleRange,
  buildTodayAgendaItems,
  countActivitiesNeedingAction,
  countActiveWorkItems,
  dailyActivityChartData,
  filterByReportPeriod,
  filterTasksByReportPeriod,
  filterScheduleItems,
  formatDeadlineCountdown,
  getDeadlineCountdownState,
  getDeadlineCountdownTone,
  getEffectiveActivityStatus,
  getEffectiveRoutineStatus,
  getEffectiveTaskStatus,
  getOverdueActivities,
  getTaskCountdownState,
  getTaskStartTimestamp,
  normalizeActivitiesForTime,
  normalizeTaskStatusForDate,
  normalizeTaskStatusForTime,
  normalizeTasksForTime,
  paginateItems,
  reportActivityChartData,
  reportTaskProgressChartData,
  restoreItemAtIndex,
  sortRoutines,
  summarizeScheduleItems,
  sortTasksByNearestDeadline,
  summarizeActivities,
  summarizeTasks,
  taskStatusChartData,
  toCsv,
  todayDate,
  dateKeyFromTimestamp
} from "../lib/utils";
import { validateActivityForm, validateNoteForm, validateRoutineForm, validateTaskForm } from "../lib/validation";

function zonedTimestamp(date: string, time = "00:00", endOfMinute = false) {
  return zonedDateTimeToTimestamp(date, time, APP_DEFAULT_TIME_ZONE, endOfMinute);
}


test("todayDate resolves using Asia/Jakarta", () => {
  const reference = Date.UTC(2026, 6, 7, 17, 30, 0, 0);

  assert.equal(todayDate(APP_DEFAULT_TIME_ZONE, reference), "2026-07-08");
  assert.equal(dateKeyFromTimestamp("2026-07-07T20:30:00.000Z"), "2026-07-08");
  assert.equal(dateKeyFromTimestamp("2026-07-08T03:30:00.000+07:00"), "2026-07-08");
});

test("summarizeTasks counts task statuses and completion rate", () => {
  const summary = summarizeTasks(defaultTasks, "2026-07-04");

  assert.equal(summary.total, 8);
  assert.equal(summary.upcoming, 0);
  assert.equal(summary.running, 3);
  assert.equal(summary.completed, 2);
  assert.equal(summary.pending, 2);
  assert.equal(summary.canceled, 1);
  assert.equal(summary.overdue, 5);
  assert.equal(summary.completionRate, 25);
});

test("future task start dates become upcoming until the start date arrives", () => {
  const task = {
    ...defaultTasks[0],
    id: "task-future",
    status: "Berjalan" as const,
    startDate: "2026-07-10",
    deadline: "2026-07-12",
    startTime: null,
    endTime: "18:00"
  };

  assert.equal(normalizeTaskStatusForDate("Berjalan", "2026-07-10", "2026-07-04"), "Akan Datang");
  assert.equal(getEffectiveTaskStatus(task, "2026-07-04"), "Akan Datang");
  assert.equal(getEffectiveTaskStatus(task, "2026-07-10"), "Berjalan");

  const summary = summarizeTasks([task], "2026-07-04");
  const statusSeries = taskStatusChartData([task], "2026-07-04");

  assert.equal(summary.upcoming, 1);
  assert.equal(summary.running, 0);
  assert.equal(statusSeries.find((item) => item.name === "Akan Datang")?.value, 1);
});

test("task countdown distinguishes upcoming starts from active deadlines", () => {
  const upcomingTask = {
    ...defaultTasks[0],
    id: "task-upcoming-countdown",
    status: "Berjalan" as const,
    startDate: "2026-07-10",
    deadline: "2026-07-12",
    startTime: null,
    endTime: "18:00"
  };
  const upcomingNow = zonedTimestamp("2026-07-09", "12:00");
  const upcomingCountdown = getTaskCountdownState(upcomingTask, upcomingNow, APP_DEFAULT_TIME_ZONE, "en");

  assert.equal(getTaskStartTimestamp("2026-07-10", null), zonedTimestamp("2026-07-10"));
  assert.equal(upcomingCountdown?.mode, "upcoming");
  assert.equal(upcomingCountdown?.label, "Starts in");
  assert.equal(upcomingCountdown?.displayLabel, "00:12:00:00");

  const activeTask = {
    ...upcomingTask,
    id: "task-active-countdown",
    startDate: "2026-07-09",
    deadline: "2026-07-09"
  };
  const activeCountdown = getTaskCountdownState(activeTask, upcomingNow, APP_DEFAULT_TIME_ZONE, "en");

  assert.equal(activeCountdown?.mode, "active");
  assert.equal(activeCountdown?.label, "Deadline");
});

test("timed task normalization uses start time and excludes upcoming from completion rate", () => {
  const now = zonedTimestamp("2026-07-04", "10:00");
  const futureTask = { ...defaultTasks[0], id: "task-later", status: "Berjalan" as const, startDate: "2026-07-04", startTime: "11:00", deadline: "2026-07-04" };
  const completedTask = { ...defaultTasks[1], id: "task-done", status: "Selesai" as const, completedAt: "2026-07-04T09:00:00.000Z" };
  const normalized = normalizeTasksForTime([futureTask, completedTask], now);
  const summary = summarizeTasks(normalized, now);

  assert.equal(normalizeTaskStatusForTime("Berjalan", "2026-07-04", "11:00", now), "Akan Datang");
  assert.equal(normalized[0].status, "Akan Datang");
  assert.equal(summary.upcoming, 1);
  assert.equal(summary.completed, 1);
  assert.equal(summary.completionRate, 100);
});

test("activity status follows scheduled time and overdue detector returns unfinished expired activities", () => {
  const beforeStart = zonedTimestamp("2026-07-04", "09:30");
  const afterStart = zonedTimestamp("2026-07-04", "10:30");
  const activity = { ...defaultActivities[0], id: "activity-timed", status: "Direncanakan" as const, date: "2026-07-04", startTime: "10:00", endTime: "11:00" };
  const overdue = { ...activity, id: "activity-overdue", startTime: "08:00", endTime: "09:00" };
  const done = { ...overdue, id: "activity-done", status: "Selesai" as const };

  assert.equal(getEffectiveActivityStatus(activity, beforeStart), "Akan Datang");
  assert.equal(getEffectiveActivityStatus(activity, afterStart), "Berjalan");
  assert.equal(normalizeActivitiesForTime([activity], beforeStart)[0].status, "Akan Datang");
  assert.deepEqual(getOverdueActivities([activity, overdue, done], afterStart).map((item) => item.id), ["activity-overdue"]);
  assert.equal(countActivitiesNeedingAction([activity, overdue, done], afterStart), 1);
});

test("routine effective status applies only to today's scheduled time window", () => {
  const routine = { ...defaultRoutines[0], days: ["Sabtu" as const], startTime: "10:00", endTime: "11:00" };
  const beforeStart = zonedTimestamp("2026-07-04", "09:30");
  const during = zonedTimestamp("2026-07-04", "10:30");
  const afterEnd = zonedTimestamp("2026-07-04", "11:30");

  assert.equal(getEffectiveRoutineStatus(routine, beforeStart), "Akan Datang");
  assert.equal(getEffectiveRoutineStatus(routine, during), "Berjalan");
  assert.equal(getEffectiveRoutineStatus(routine, afterEnd), null);
});

test("active work badge counts only running items", () => {
  const now = zonedTimestamp("2026-07-04", "10:00");
  const tasks = [
    { ...defaultTasks[0], id: "task-running", status: "Berjalan" as const, startDate: "2026-07-04", startTime: "09:00", deadline: "2026-07-04" },
    { ...defaultTasks[0], id: "task-upcoming", status: "Berjalan" as const, startDate: "2026-07-04", startTime: "11:00", deadline: "2026-07-04" },
    { ...defaultTasks[0], id: "task-pending", status: "Tertunda" as const, startDate: "2026-07-04", startTime: "08:00", deadline: "2026-07-04" },
    { ...defaultTasks[1], id: "task-done", status: "Selesai" as const, completedAt: "2026-07-04T09:00:00.000Z" }
  ];

  assert.equal(countActiveWorkItems(tasks, now), 1);
});

test("restoreItemAtIndex restores deleted items without duplicating existing ids", () => {
  const item = defaultTasks[1];
  const remaining = [defaultTasks[0], defaultTasks[2]];

  assert.deepEqual(restoreItemAtIndex(remaining, item, 1).map((task) => task.id), [defaultTasks[0].id, item.id, defaultTasks[2].id]);
  assert.deepEqual(restoreItemAtIndex([item, ...remaining], item, 1).map((task) => task.id), [item.id, defaultTasks[0].id, defaultTasks[2].id]);
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

test("buildScheduleRange resolves today week month and agenda ranges", () => {
  assert.deepEqual(buildScheduleRange("2026-07-06", "today"), {
    startDate: "2026-07-06",
    endDate: "2026-07-06",
    dates: ["2026-07-06"]
  });
  assert.deepEqual(buildScheduleRange("2026-07-08", "week"), {
    startDate: "2026-07-06",
    endDate: "2026-07-12",
    dates: ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11", "2026-07-12"]
  });
  assert.equal(buildScheduleRange("2026-07-08", "month").dates.length, 31);
  assert.equal(buildScheduleRange("2026-07-08", "agenda").dates.length, 14);
});

test("buildScheduleItems aggregates work activities and routines into a single timeline", () => {
  const range = buildScheduleRange("2026-07-04", "today");
  const items = buildScheduleItems(
    [
      {
        ...defaultTasks[0],
        id: "task-schedule-1",
        title: "Deadline task",
        startDate: "2026-07-01",
        deadline: "2026-07-04",
        startTime: null,
        endTime: null,
        status: "Berjalan"
      },
      {
        ...defaultTasks[0],
        id: "task-schedule-2",
        title: "Timed task",
        startDate: "2026-07-04",
        deadline: "2026-07-06",
        startTime: "07:30",
        endTime: "08:30",
        status: "Berjalan"
      },
      {
        ...defaultTasks[1],
        id: "task-schedule-3",
        title: "Canceled task",
        startDate: "2026-07-04",
        deadline: "2026-07-04",
        startTime: null,
        endTime: null,
        status: "Dibatalkan"
      }
    ],
    [
      {
        ...defaultActivities[0],
        id: "activity-schedule-1",
        title: "Missed activity",
        date: "2026-07-04",
        startTime: "08:00",
        endTime: "09:00",
        status: "Direncanakan"
      }
    ],
    [
      {
        ...defaultRoutines[0],
        id: "routine-schedule-1",
        title: "Saturday routine",
        days: ["Sabtu"],
        startTime: "10:00",
        endTime: "11:00"
      }
    ],
    range,
    zonedTimestamp("2026-07-04", "09:30")
  );

  assert.deepEqual(items.map((item) => [item.source, item.title]), [
    ["work", "Canceled task"],
    ["work", "Deadline task"],
    ["work", "Timed task"],
    ["activity", "Missed activity"],
    ["routine", "Saturday routine"]
  ]);
  assert.equal(items.find((item) => item.title === "Missed activity")?.displayStatus, "missed");
  assert.equal(items.find((item) => item.title === "Canceled task")?.displayStatus, "cancelled");
  assert.equal(items.find((item) => item.title === "Saturday routine")?.displayStatus, "upcoming");
  assert.equal(items.find((item) => item.title === "Deadline task")?.isAllDay, true);
  assert.equal(items.find((item) => item.title === "Deadline task")?.date, "2026-07-04");
});

test("schedule marks past routine occurrences as done instead of missed", () => {
  const range = buildScheduleRange("2026-07-04", "today");
  const items = buildScheduleItems(
    [],
    [],
    [
      {
        ...defaultRoutines[0],
        id: "routine-past",
        title: "Past routine",
        days: ["Sabtu"],
        startTime: "08:00",
        endTime: "09:00"
      }
    ],
    range,
    zonedTimestamp("2026-07-04", "09:30")
  );

  assert.equal(items[0]?.displayStatus, "done");
  assert.deepEqual(summarizeScheduleItems(items), { total: 1, work: 0, activity: 0, routine: 1, missed: 0 });
});

test("filterScheduleItems and summarizeScheduleItems apply source and status filters", () => {
  const items = [
    { source: "work", displayStatus: "upcoming" },
    { source: "activity", displayStatus: "missed" },
    { source: "routine", displayStatus: "upcoming" },
    { source: "work", displayStatus: "done" },
    { source: "work", displayStatus: "cancelled" }
  ] as const;

  assert.equal(filterScheduleItems(items as never, "all", "all").length, 5);
  assert.equal(filterScheduleItems(items as never, "work", "all").length, 3);
  assert.equal(filterScheduleItems(items as never, "all", "missed").length, 1);
  assert.deepEqual(summarizeScheduleItems(items as never), {
    total: 5,
    work: 3,
    activity: 1,
    routine: 1,
    missed: 1
  });
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
    zonedTimestamp("2026-06-25", "09:15")
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
  const now = zonedTimestamp("2026-06-23", "12:00");

  assert.equal(formatDeadlineCountdown("2026-06-24", now), "01:11:59:59");
});

test("formatDeadlineCountdown shows compact overdue countdown in minutes", () => {
  const now = zonedTimestamp("2026-06-25", "00:05");

  assert.equal(formatDeadlineCountdown("2026-06-24", now), "Terlambat 05 Menit");
});

test("formatDeadlineCountdown shows compact overdue countdown in hours", () => {
  const now = zonedTimestamp("2026-06-25", "03:02") + 3000;

  assert.equal(formatDeadlineCountdown("2026-06-24", now), "Terlambat 03 Jam");
});

test("formatDeadlineCountdown shows compact overdue countdown in days and hours", () => {
  const now = zonedTimestamp("2026-06-27", "04:02") + 3000;

  assert.equal(formatDeadlineCountdown("2026-06-24", now), "Terlambat 02 Hari 04 Jam");
});

test("getDeadlineCountdownTone returns green when more than three days remain", () => {
  const now = zonedTimestamp("2026-06-20", "12:00");

  assert.equal(getDeadlineCountdownTone("2026-06-24", now), "green");
});

test("getDeadlineCountdownTone returns amber when less than three days remain", () => {
  const now = zonedTimestamp("2026-06-22", "12:00");

  assert.equal(getDeadlineCountdownTone("2026-06-24", now), "amber");
});

test("getDeadlineCountdownTone returns red when less than one day remains or overdue", () => {
  const almostDue = zonedTimestamp("2026-06-24", "12:00");
  const overdue = zonedTimestamp("2026-06-25", "01:02") + 3000;

  assert.equal(getDeadlineCountdownTone("2026-06-24", almostDue), "red");
  assert.equal(getDeadlineCountdownTone("2026-06-24", overdue), "red");
});

test("getDeadlineCountdownState exposes compact display label and verbose tooltip", () => {
  const now = zonedTimestamp("2026-06-23", "12:00");
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

test("validateTaskForm rejects invalid optional time ranges and accepts end-only time", () => {
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
    ["Jam selesai harus diisi jika jam mulai diisi."]
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
      endTime: "08:00"
    }),
    []
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
    defaultNotes,
    defaultSettings,
    "2026-06-24T00:00:00.000Z"
  );
  const parsed = parseDashboardBackup(JSON.stringify(backup));

  assert.equal(parsed.ok, true);

  if (parsed.ok) {
    assert.equal(parsed.sourceVersion, 6);
    assert.equal(parsed.backup.tasks.length, defaultTasks.length);
    assert.equal(parsed.backup.activities.length, defaultActivities.length);
    assert.equal(parsed.backup.routines.length, defaultRoutines.length);
    assert.equal(parsed.backup.settings.dashboardName, defaultSettings.dashboardName);
    assert.equal(parsed.backup.notes.length, defaultNotes.length);
    assert.equal("accountName" in parsed.backup.settings, false);
    assert.equal("accountEmail" in parsed.backup.settings, false);
  }
});

test("sample dashboard backup passes current restore validation", () => {
  const sample = readFileSync(join(process.cwd(), "docs", "sample-backup-project-manager-2026-07.json"), "utf8");
  const parsed = parseDashboardBackup(sample);

  assert.equal(parsed.ok, true);
});

test("dashboard backup does not require local account fields", () => {
  const backup = createDashboardBackup(
    defaultTasks,
    defaultActivities,
    defaultRoutines,
    defaultNotes,
    defaultSettings,
    "2026-06-24T00:00:00.000Z"
  );
  const parsed = parseDashboardBackup(JSON.stringify(backup));

  assert.equal(parsed.ok, true);

  if (parsed.ok) {
    assert.deepEqual(parsed.backup.notes, defaultNotes);
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
    assert.equal(parsed.backup.notes.length, defaultNotes.length);
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
    assert.equal(parsed.sourceVersion, 1);
    assert.deepEqual(parsed.backup.routines, []);
    assert.deepEqual(parsed.backup.notes, []);
  }
});

test("validateNoteForm rejects incomplete link pairs and short content", () => {
  const errors = validateNoteForm({
    title: "No",
    content: "abc",
    category: "personal",
    linkedType: "work",
    linkedId: null,
    tags: ["ok"],
    isPinned: false
  });

  assert.deepEqual(errors, [
    "Judul catatan minimal 3 karakter.",
    "Isi catatan minimal 5 karakter.",
    "Tipe link dan item link harus diisi bersamaan."
  ]);
});

test("translateNoteValidationErrors localizes shared note validation messages", () => {
  assert.deepEqual(
    translateNoteValidationErrors([
      "Judul catatan minimal 3 karakter.",
      "Isi catatan minimal 5 karakter.",
      "Item yang dihubungkan tidak ditemukan."
    ], "en"),
    [
      "Note title must be at least 3 characters. Add a title that explains the note.",
      "Note content must be at least 5 characters. Add a bit more context so the note is clear.",
      "The linked item could not be found. Choose another item that still exists."
    ]
  );
  assert.deepEqual(translateNoteValidationErrors(["Judul catatan minimal 3 karakter."], "id"), ["Judul catatan minimal 3 karakter. Tambahkan judul yang menjelaskan isi catatan."]);
});

test("formatHistoryMetadata pretty prints JSON and preserves invalid backup strings", () => {
  assert.equal(formatHistoryMetadata(null), "-");
  assert.equal(formatHistoryMetadata("{\"eventKey\":\"missed:work:1\"}"), "{\n  \"eventKey\": \"missed:work:1\"\n}");
  assert.equal(formatHistoryMetadata("legacy plain text"), "legacy plain text");
});

test("dashboard backup rejects invalid routine shape", () => {
  const backup = createDashboardBackup(
    defaultTasks,
    defaultActivities,
    defaultRoutines,
    defaultNotes,
    defaultSettings,
    "2026-06-24T00:00:00.000Z"
  );
  const invalid = {
    ...backup,
    routines: [{ ...defaultRoutines[0], days: ["Hari Salah"] }]
  };

  const parsed = parseDashboardBackup(JSON.stringify(invalid));

  assert.deepEqual(parsed, { ok: false, issue: { code: "invalid-item", section: "routines", index: 0 } });
});

test("dashboard backup rejects invalid timestamps, dates, times, and duplicate ids", () => {
  const backup = createDashboardBackup(
    defaultTasks,
    defaultActivities,
    defaultRoutines,
    defaultNotes,
    defaultSettings,
    "2026-06-24T00:00:00.000Z"
  );

  assert.deepEqual(
    parseDashboardBackup(JSON.stringify({ ...backup, exportedAt: "2026-06-24" })),
    { ok: false, issue: { code: "invalid-exported-at" } }
  );
  assert.deepEqual(
    parseDashboardBackup(JSON.stringify({ ...backup, tasks: [{ ...backup.tasks[0], startDate: "2026-02-30" }] })),
    { ok: false, issue: { code: "invalid-item", section: "tasks", index: 0 } }
  );
  assert.deepEqual(
    parseDashboardBackup(JSON.stringify({ ...backup, activities: [{ ...backup.activities[0], startTime: "25:00" }] })),
    { ok: false, issue: { code: "invalid-item", section: "activities", index: 0 } }
  );
  assert.deepEqual(
    parseDashboardBackup(JSON.stringify({ ...backup, tasks: [...backup.tasks, { ...backup.tasks[0] }] })),
    { ok: false, issue: { code: "duplicate-id", section: "tasks", index: backup.tasks.length } }
  );

  const endOnlyTime = parseDashboardBackup(JSON.stringify({
    ...backup,
    tasks: [{ ...backup.tasks[0], startTime: null, endTime: "10:00" }]
  }));
  assert.equal(endOnlyTime.ok, true);
});

test("dashboard backup rejects broken note links with localized details", () => {
  const backup = createDashboardBackup(
    defaultTasks,
    defaultActivities,
    defaultRoutines,
    defaultNotes,
    defaultSettings,
    "2026-06-24T00:00:00.000Z"
  );
  const parsed = parseDashboardBackup(JSON.stringify({
    ...backup,
    notes: [{
      id: "note-invalid-link",
      title: "Broken link",
      content: "Missing linked item",
      category: "work",
      linkedType: "work",
      linkedId: "missing-task",
      tags: [],
      isPinned: false,
      createdAt: "2026-06-24T00:00:00.000Z",
      updatedAt: "2026-06-24T00:00:00.000Z"
    }]
  }));

  assert.deepEqual(parsed, { ok: false, issue: { code: "invalid-note-link", section: "notes", index: 0 } });
  if (!parsed.ok) {
    assert.equal(getDashboardBackupErrorMessage(parsed.issue, "id"), "Relasi catatan ke-1 tidak menunjuk data yang tersedia dalam backup.");
    assert.equal(getDashboardBackupErrorMessage(parsed.issue, "en"), "Note 1 links to data that is not available in this backup.");
  }

  const malformed = parseDashboardBackup("{");
  assert.deepEqual(malformed, { ok: false, issue: { code: "invalid-json" } });
});

test("navigation routes have matching app pages", () => {
  for (const route of appRoutes) {
    const pagePath = join(process.cwd(), "app", route.href.slice(1), "page.tsx");
    assert.equal(existsSync(pagePath), true, `${route.href} should have a page file`);
  }
});

test("formatDeadlineCountdown uses task end time when provided", () => {
  const now = zonedTimestamp("2026-06-24", "16:30");

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

test("custom report ranges normalize bounds and build daily buckets", () => {
  const report = buildReportExportModel({
    tasks: defaultTasks,
    activities: defaultActivities,
    selectedDate: "2026-06-24",
    period: "Kustom",
    rangeFrom: "2026-06-24",
    rangeTo: "2026-06-23",
    currentDate: "2026-06-24",
    generatedAt: "2026-06-24T00:00:00.000Z"
  });

  assert.equal(report.rangeFrom, "2026-06-23");
  assert.equal(report.rangeTo, "2026-06-24");
  assert.deepEqual(report.filteredTasks.map((task) => task.id), ["task-4", "task-2", "task-3"]);
  assert.equal(report.activitySummary.total, 7);
  assert.deepEqual(report.activitySeries.map((item) => item.total), [7, 0]);
  assert.deepEqual(report.taskProgressSeries.map((item) => item.completed), [1, 0]);
});


test("blank report reference dates produce an empty safe report", () => {
  const report = buildReportExportModel({
    tasks: defaultTasks,
    activities: defaultActivities,
    selectedDate: "",
    period: "Mingguan",
    currentDate: "2026-06-24",
    generatedAt: "2026-06-24T00:00:00.000Z"
  });

  assert.equal(report.rangeFrom, "");
  assert.equal(report.rangeTo, "");
  assert.equal(report.dateRangeLabel, "-");
  assert.equal(report.taskSummary.total, 0);
  assert.equal(report.activitySummary.total, 0);
  assert.deepEqual(report.filteredTasks, []);
  assert.deepEqual(report.filteredActivities, []);
  assert.deepEqual(report.categorySeries, []);
  assert.deepEqual(report.activitySeries, []);
  assert.deepEqual(report.taskProgressSeries, []);
  assert.equal(getReportCsvFilename(report), "productivity-report-mingguan-no-date-detail.csv");
  assert.equal(getReportExcelFilename(report), "productivity-report-mingguan-no-date.xls");
  assert.equal(getReportPdfFilename(report, "summary"), "productivity-report-mingguan-no-date-summary.pdf");
});


test("buildReportExportModel follows report filters and prepares important details", () => {
  const report = buildReportExportModel({
    tasks: defaultTasks,
    activities: defaultActivities,
    selectedDate: "2026-06-23",
    period: "Harian",
    currentDate: "2026-06-24",
    generatedAt: "2026-06-24T00:00:00.000Z"
  });

  assert.deepEqual(report.filteredTasks.map((task) => task.id), ["task-4", "task-2"]);
  assert.equal(report.filteredActivities.length, 7);
  assert.equal(report.taskSummary.total, 2);
  assert.equal(report.activitySummary.total, 7);
  assert.equal(report.overdueTasks.length, 1);
  assert.equal(report.metrics.at(-1)?.value, 1);
  assert.ok(report.categorySeries.length <= 4);
  assert.ok(report.importantTasks.length <= 8);
  assert.ok(report.importantActivities.length <= 8);
});

test("getReportPdfFilename includes period date and selected PDF mode", () => {
  const report = buildReportExportModel({
    tasks: defaultTasks,
    activities: defaultActivities,
    selectedDate: "2026-06-23",
    period: "Harian",
    currentDate: "2026-06-24",
    generatedAt: "2026-06-24T00:00:00.000Z"
  });

  assert.equal(getReportPdfFilename(report, "summary"), "productivity-report-harian-2026-06-23-summary.pdf");
  assert.equal(getReportPdfFilename(report, "full"), "productivity-report-harian-2026-06-23-full.pdf");
});


test("activityCategoryChartData can limit categories to the top values", () => {
  const activities = [
    ...Array.from({ length: 5 }, (_, index) => ({ ...defaultActivities[0], id: `kerja-${index}`, category: "Kerja" as const })),
    ...Array.from({ length: 4 }, (_, index) => ({ ...defaultActivities[0], id: `belajar-${index}`, category: "Belajar" as const })),
    ...Array.from({ length: 3 }, (_, index) => ({ ...defaultActivities[0], id: `meeting-${index}`, category: "Meeting" as const })),
    ...Array.from({ length: 2 }, (_, index) => ({ ...defaultActivities[0], id: `olahraga-${index}`, category: "Olahraga" as const })),
    { ...defaultActivities[0], id: "istirahat-1", category: "Istirahat" as const }
  ];

  const result = activityCategoryChartData(activities, 4);

  assert.deepEqual(result.map((item) => item.name), ["Kerja", "Belajar", "Meeting", "Olahraga"]);
  assert.deepEqual(result.map((item) => item.value), [5, 4, 3, 2]);
});

test("report CSV export rows include detail sections with stable columns", () => {
  const report = buildReportExportModel({
    tasks: defaultTasks,
    activities: defaultActivities,
    selectedDate: "2026-06-23",
    period: "Harian",
    currentDate: "2026-06-24",
    generatedAt: "2026-06-24T00:00:00.000Z"
  });
  const rows = buildReportCsvRows(report);
  const csv = buildReportCsvContent(report);

  assert.deepEqual(Object.keys(rows[0]), [...reportCsvColumns]);
  assert.equal(rows.some((row) => row.section === "pekerjaan" && row.type === "task"), true);
  assert.equal(rows.some((row) => row.section === "aktivitas" && row.type === "activity"), true);
  assert.equal(rows.some((row) => row.section === "grafik" && row.type === "kategori_aktivitas"), true);
  assert.equal(csv.startsWith("\uFEFF"), true);
  assert.equal(csv.includes("\r\n"), true);
});

test("report exports use effective task status for future start dates", () => {
  const futureTask = {
    ...defaultTasks[0],
    id: "task-report-future",
    status: "Berjalan" as const,
    startDate: "2026-07-05",
    deadline: "2026-07-05",
    startTime: null,
    endTime: "18:00",
    completedAt: null
  };
  const futureActivity = {
    ...defaultActivities[0],
    id: "activity-report-future",
    status: "Direncanakan" as const,
    date: "2026-07-05",
    startTime: "09:00",
    endTime: "10:00"
  };
  const report = buildReportExportModel({
    tasks: [futureTask],
    activities: [futureActivity],
    selectedDate: "2026-07-05",
    period: "Harian",
    currentDate: "2026-07-04",
    generatedAt: "2026-07-04T00:00:00.000Z"
  });
  const rows = buildReportCsvRows(report);
  const taskRow = rows.find((row) => row.section === "pekerjaan" && row.type === "task");
  const activityRow = rows.find((row) => row.section === "aktivitas" && row.type === "activity");
  const taskSheet = buildReportExcelSheets(report).find((sheet) => sheet.name === "Pekerjaan");

  assert.equal(report.taskSummary.upcoming, 1);
  assert.equal(report.taskStatusSeries.find((item) => item.name === "Akan Datang")?.value, 1);
  assert.equal(taskRow?.status, "Akan Datang");
  assert.equal(activityRow?.status, "Akan Datang");
  assert.equal(taskSheet?.rows[1][1], "Akan Datang");
});

test("report Excel export sheets follow the active report model", () => {
  const report = buildReportExportModel({
    tasks: defaultTasks,
    activities: defaultActivities,
    selectedDate: "2026-06-23",
    period: "Harian",
    currentDate: "2026-06-24",
    generatedAt: "2026-06-24T00:00:00.000Z"
  });
  const sheets = buildReportExcelSheets(report);

  assert.deepEqual(sheets.map((sheet) => sheet.name), [
    "Ringkasan",
    "Pekerjaan",
    "Aktivitas",
    "Kategori Aktivitas",
    "Kegiatan",
    "Progress Pekerjaan"
  ]);
  assert.equal(sheets.find((sheet) => sheet.name === "Pekerjaan")?.rows.length, report.filteredTasks.length + 1);
  assert.equal(sheets.find((sheet) => sheet.name === "Aktivitas")?.rows.length, report.filteredActivities.length + 1);
});

test("report export filenames distinguish CSV Excel and PDF", () => {
  const report = buildReportExportModel({
    tasks: defaultTasks,
    activities: defaultActivities,
    selectedDate: "2026-06-23",
    period: "Harian",
    currentDate: "2026-06-24",
    generatedAt: "2026-06-24T00:00:00.000Z"
  });

  assert.equal(getReportCsvFilename(report), "productivity-report-harian-2026-06-23-detail.csv");
  assert.equal(getReportExcelFilename(report), "productivity-report-harian-2026-06-23.xls");
  assert.equal(getReportPdfFilename(report, "summary"), "productivity-report-harian-2026-06-23-summary.pdf");
  assert.equal(getReportPdfFilename(report, "full"), "productivity-report-harian-2026-06-23-full.pdf");

  const customReport = buildReportExportModel({
    tasks: defaultTasks,
    activities: defaultActivities,
    selectedDate: "2026-06-24",
    period: "Kustom",
    rangeFrom: "2026-06-24",
    rangeTo: "2026-06-23",
    currentDate: "2026-06-24",
    generatedAt: "2026-06-24T00:00:00.000Z"
  });

  assert.equal(getReportCsvFilename(customReport), "productivity-report-kustom-2026-06-23-to-2026-06-24-detail.csv");
  assert.equal(getReportExcelFilename(customReport), "productivity-report-kustom-2026-06-23-to-2026-06-24.xls");
  assert.equal(getReportPdfFilename(customReport, "summary"), "productivity-report-kustom-2026-06-23-to-2026-06-24-summary.pdf");
});


test("matchesActivityCategoryFilter applies category filters strictly", () => {
  assert.equal(matchesActivityCategoryFilter("Kerja", "Semua"), true);
  assert.equal(matchesActivityCategoryFilter("Kerja", "Kerja"), true);
  assert.equal(matchesActivityCategoryFilter("Belajar", "Kerja"), false);
});

test("getActivityCategoryFilterParam accepts only valid category filter values", () => {
  assert.equal(getActivityCategoryFilterParam("Semua"), "Semua");
  assert.equal(getActivityCategoryFilterParam("Kerja"), "Kerja");
  assert.equal(getActivityCategoryFilterParam("Preferensi"), null);
  assert.equal(getActivityCategoryFilterParam("Tidak Valid"), null);
  assert.equal(getActivityCategoryFilterParam(null), null);
});
