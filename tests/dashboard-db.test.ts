import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { defaultActivities, defaultRoutines, defaultSettings, defaultTasks } from "../lib/data";

test("dashboard database persists tasks, activities, routines, and settings", async () => {
  const previousSqlitePath = process.env.SQLITE_PATH;
  process.env.SQLITE_PATH = join(mkdtempSync(join(tmpdir(), "activity-dashboard-db-")), "activity.sqlite");

  try {
    const { getDashboardData, replaceDashboardData, updateDashboardData } = await import("../lib/server/dashboard-db");

    assert.deepEqual(getDashboardData(), {
      tasks: [],
      activities: [],
      routines: [],
      settings: defaultSettings
    });

    updateDashboardData({
      tasks: [defaultTasks[0]],
      activities: [defaultActivities[0]],
      routines: [defaultRoutines[0]],
      settings: { ...defaultSettings, dashboardName: "Dashboard Test" }
    });

    assert.deepEqual(getDashboardData(), {
      tasks: [defaultTasks[0]],
      activities: [defaultActivities[0]],
      routines: [defaultRoutines[0]],
      settings: { ...defaultSettings, dashboardName: "Dashboard Test" }
    });

    updateDashboardData({ activities: [] });
    assert.deepEqual(getDashboardData().activities, []);

    replaceDashboardData({
      tasks: [],
      activities: [],
      routines: [],
      settings: defaultSettings
    });

    assert.deepEqual(getDashboardData(), {
      tasks: [],
      activities: [],
      routines: [],
      settings: defaultSettings
    });
  } finally {
    if (previousSqlitePath === undefined) {
      delete process.env.SQLITE_PATH;
    } else {
      process.env.SQLITE_PATH = previousSqlitePath;
    }
  }
});
