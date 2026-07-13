import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { NextRequest } from "next/server";
import { defaultSettings } from "../lib/data";
import { MAX_DASHBOARD_BACKUP_BYTES, type DashboardBackup } from "../lib/storage";

test("authenticated REST API supports resources, read-only menus, backup, and reset", async () => {
  const previousSqlitePath = process.env.SQLITE_PATH;
  process.env.SQLITE_PATH = join(mkdtempSync(join(tmpdir(), "activity-api-routes-")), "activity.sqlite");

  try {
    const auth = await import("../lib/server/auth");
    assert.deepEqual(auth.registerUser("owner", "Password1"), { ok: true, userId: "user-1", username: "owner" });
    const token = auth.createSessionToken("user-1", "owner");

    const tasks = await import("../app/api/tasks/route");
    const taskById = await import("../app/api/tasks/[id]/route");
    const activities = await import("../app/api/activities/route");
    const activityById = await import("../app/api/activities/[id]/route");
    const routines = await import("../app/api/routines/route");
    const routineById = await import("../app/api/routines/[id]/route");
    const notes = await import("../app/api/notes/route");
    const noteById = await import("../app/api/notes/[id]/route");
    const settings = await import("../app/api/settings/route");
    const dashboard = await import("../app/api/dashboard/route");
    const schedule = await import("../app/api/schedule/route");
    const reports = await import("../app/api/reports/route");
    const history = await import("../app/api/history/route");
    const backup = await import("../app/api/backup/route");
    const reset = await import("../app/api/dashboard/reset/route");

    function req(path: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers);
      headers.set("cookie", auth.sessionCookieName + "=" + token);
      if (init.body && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
      const requestInit: { method?: string; headers: Headers; body?: BodyInit | null } = { method: init.method, headers };
      if (init.body !== undefined) {
        requestInit.body = init.body;
      }
      return new NextRequest(new URL(path, "http://localhost"), requestInit);
    }

    async function json<T>(response: Response) {
      return (await response.json()) as T;
    }

    const createdTaskResponse = await tasks.POST(req("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "Build API", description: "Add resource endpoints", status: "Berjalan", priority: "Tinggi", startDate: "2026-07-08", deadline: "2026-07-09", startTime: null, endTime: null, completedAt: null })
    }));
    assert.equal(createdTaskResponse.status, 201);
    const task = await json<{ id: string; title: string; status: string }>(createdTaskResponse);
    assert.equal(task.title, "Build API");

    const taskList = await json<Array<{ id: string }>>(await tasks.GET(req("/api/tasks")));
    assert.equal(taskList.length, 1);
    assert.equal((await json<{ id: string }>(await taskById.GET(req("/api/tasks/" + task.id), { params: Promise.resolve({ id: task.id }) }))).id, task.id);
    const updatedTask = await json<{ status: string }>(await taskById.PATCH(req("/api/tasks/" + task.id, { method: "PATCH", body: JSON.stringify({ status: "Selesai" }) }), { params: Promise.resolve({ id: task.id }) }));
    assert.equal(updatedTask.status, "Selesai");

    const activity = await json<{ id: string; title: string }>(await activities.POST(req("/api/activities", {
      method: "POST",
      body: JSON.stringify({ title: "API review", category: "Kerja", date: "2026-07-08", startTime: "10:00", endTime: "11:00", status: "Direncanakan", notes: "Review routes" })
    })));
    assert.equal((await json<Array<{ id: string }>>(await activities.GET(req("/api/activities")))).length, 1);
    assert.equal((await json<{ status: string }>(await activityById.PATCH(req("/api/activities/" + activity.id, { method: "PATCH", body: JSON.stringify({ status: "Selesai" }) }), { params: Promise.resolve({ id: activity.id }) }))).status, "Selesai");

    const routine = await json<{ id: string; title: string }>(await routines.POST(req("/api/routines", {
      method: "POST",
      body: JSON.stringify({ title: "API planning", days: ["Rabu"], startTime: "08:00", endTime: "08:30", priority: "Sedang", notes: "Plan API checks" })
    })));
    assert.equal((await json<Array<{ id: string }>>(await routines.GET(req("/api/routines")))).length, 1);
    assert.equal((await json<{ priority: string }>(await routineById.PATCH(req("/api/routines/" + routine.id, { method: "PATCH", body: JSON.stringify({ priority: "Tinggi" }) }), { params: Promise.resolve({ id: routine.id }) }))).priority, "Tinggi");

    const note = await json<{ id: string; linkedId: string }>(await notes.POST(req("/api/notes", {
      method: "POST",
      body: JSON.stringify({ title: "API note", content: "Linked to the API task.", category: "work", linkedType: "work", linkedId: task.id, tags: ["api"], isPinned: false })
    })));
    assert.equal(note.linkedId, task.id);
    assert.equal((await json<{ isPinned: boolean }>(await noteById.PATCH(req("/api/notes/" + note.id, { method: "PATCH", body: JSON.stringify({ isPinned: true }) }), { params: Promise.resolve({ id: note.id }) }))).isPinned, true);

    const patchedSettings = await json<{ dashboardName: string; language: string }>(await settings.PATCH(req("/api/settings", { method: "PATCH", body: JSON.stringify({ dashboardName: "API Dashboard", language: "id" }) })));
    assert.equal(patchedSettings.dashboardName, "API Dashboard");
    assert.equal((await json<{ dashboardName: string }>(await settings.GET(req("/api/settings")))).dashboardName, "API Dashboard");

    assert.equal((await json<{ taskSummary: { total: number } }>(await dashboard.GET(req("/api/dashboard")))).taskSummary.total, 1);
    assert.equal((await json<{ items: unknown[] }>(await schedule.GET(req("/api/schedule?view=week&anchorDate=2026-07-08")))).items.length > 0, true);
    assert.equal((await json<{ filteredTasks: unknown[] }>(await reports.GET(req("/api/reports?selectedDate=2026-07-08&period=Mingguan")))).filteredTasks.length, 1);
    const customReport = await json<{ rangeFrom: string; rangeTo: string; filteredTasks: unknown[]; filteredActivities: unknown[] }>(await reports.GET(req("/api/reports?period=Kustom&rangeFrom=2026-07-10&rangeTo=2026-07-08")));
    assert.equal(customReport.rangeFrom, "2026-07-08");
    assert.equal(customReport.rangeTo, "2026-07-10");
    assert.equal(customReport.filteredTasks.length, 1);
    assert.equal(customReport.filteredActivities.length, 1);
    assert.equal((await json<unknown[]>(await history.GET(req("/api/history")))).length > 0, true);

    const exported = await json<DashboardBackup>(await backup.GET(req("/api/backup")));
    assert.equal(exported.version, 6);
    assert.equal(exported.tasks.length, 1);

    const dataOnlyPayload = {
      tasks: exported.tasks,
      activities: exported.activities,
      routines: exported.routines,
      notes: exported.notes,
      history: exported.history,
      settings: exported.settings
    };
    const missingMetadataResponse = await backup.PUT(req("/api/backup", { method: "PUT", body: JSON.stringify(dataOnlyPayload) }));
    assert.equal(missingMetadataResponse.status, 400);

    const oversizedResponse = await backup.PUT(req("/api/backup", {
      method: "PUT",
      headers: { "content-length": String(MAX_DASHBOARD_BACKUP_BYTES + 1) },
      body: "{}"
    }));
    assert.equal(oversizedResponse.status, 413);

    const dataAfterRejectedRestore = await json<DashboardBackup>(await backup.GET(req("/api/backup")));
    assert.equal(dataAfterRejectedRestore.tasks.length, 1);
    assert.equal(dataAfterRejectedRestore.tasks[0].id, exported.tasks[0].id);

    const deletedTask = await json<{ ok: boolean; notes: Array<{ id: string; linkedType: string | null; linkedId: string | null }> }>(await taskById.DELETE(req("/api/tasks/" + task.id, { method: "DELETE" }), { params: Promise.resolve({ id: task.id }) }));
    assert.equal(deletedTask.ok, true);
    const unlinkedNote = deletedTask.notes.find((item) => item.id === note.id);
    assert.equal(unlinkedNote?.linkedType, null);
    assert.equal(unlinkedNote?.linkedId, null);
    const historyAfterDelete = await json<Array<{ eventType: string; entityType: string; entityId: string }>>(await history.GET(req("/api/history")));
    assert.equal(historyAfterDelete.some((event) => event.eventType === "deleted" && event.entityType === "work" && event.entityId === task.id), true);

    assert.equal((await activityById.DELETE(req("/api/activities/" + activity.id, { method: "DELETE" }), { params: Promise.resolve({ id: activity.id }) })).status, 200);
    assert.equal((await routineById.DELETE(req("/api/routines/" + routine.id, { method: "DELETE" }), { params: Promise.resolve({ id: routine.id }) })).status, 200);
    assert.equal((await noteById.DELETE(req("/api/notes/" + note.id, { method: "DELETE" }), { params: Promise.resolve({ id: note.id }) })).status, 200);

    const restored = await json<{ tasks: unknown[] }>(await backup.PUT(req("/api/backup", { method: "PUT", body: JSON.stringify(exported) })));
    assert.equal(restored.tasks.length, 1);

    const resetData = await json<{ tasks: unknown[]; activities: unknown[]; routines: unknown[]; notes: unknown[]; settings: typeof defaultSettings }>(await reset.POST(req("/api/dashboard/reset", { method: "POST" })));
    assert.deepEqual(resetData.tasks, []);
    assert.deepEqual(resetData.activities, []);
    assert.deepEqual(resetData.routines, []);
    assert.deepEqual(resetData.notes, []);
    assert.deepEqual(resetData.settings, defaultSettings);
  } finally {
    if (previousSqlitePath === undefined) {
      delete process.env.SQLITE_PATH;
    } else {
      process.env.SQLITE_PATH = previousSqlitePath;
    }
  }
});
