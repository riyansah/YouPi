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
    const sampleNote = {
      id: "note-1",
      title: "Sample note",
      content: "This note is linked to a work item.",
      category: "work" as const,
      linkedType: "work" as const,
      linkedId: defaultTasks[0].id,
      tags: ["sample", "linked"],
      isPinned: true,
      createdAt: "2026-07-06T08:00:00.000Z",
      updatedAt: "2026-07-06T08:00:00.000Z"
    };

    assert.deepEqual(getDashboardData(), {
      tasks: [],
      activities: [],
      routines: [],
      notes: [],
      history: [],
      settings: defaultSettings
    });

    updateDashboardData({
      tasks: [defaultTasks[0]],
      activities: [defaultActivities[0]],
      routines: [defaultRoutines[0]],
      notes: [sampleNote],
      settings: { ...defaultSettings, dashboardName: "Dashboard Test" }
    });

    const saved = getDashboardData();
    assert.deepEqual(saved.tasks, [defaultTasks[0]]);
    assert.deepEqual(saved.activities, [defaultActivities[0]]);
    assert.deepEqual(saved.routines, [defaultRoutines[0]]);
    assert.deepEqual(saved.notes, [sampleNote]);
    assert.deepEqual(saved.settings, { ...defaultSettings, dashboardName: "Dashboard Test" });
    assert.equal(saved.history.length > 0, true);

    updateDashboardData({ activities: [] });
    assert.deepEqual(getDashboardData().activities, []);

    replaceDashboardData(
      {
        tasks: [],
        activities: [],
        routines: [],
        notes: [],
        history: [],
        settings: defaultSettings
      },
      { recordHistory: false }
    );

    assert.deepEqual(getDashboardData(), {
      tasks: [],
      activities: [],
      routines: [],
      notes: [],
      history: [],
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
