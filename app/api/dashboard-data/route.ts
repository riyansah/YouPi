import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, replaceDashboardData, updateDashboardData, type DashboardData } from "@/lib/server/dashboard-db";
import { getSessionFromRequest } from "@/lib/server/auth";
import { isActivity, isDashboardSettings, isHistoryEvent, isNote, isRoutine, isTask } from "@/lib/storage";
import { logWithContext, parseJsonBody, setRequestActor, withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePatch(value: unknown): Partial<DashboardData> | null {
  if (!isRecord(value)) {
    return null;
  }

  const patch: Partial<DashboardData> = {};

  if ("tasks" in value) {
    if (!Array.isArray(value.tasks) || !value.tasks.every(isTask)) {
      return null;
    }
    patch.tasks = value.tasks;
  }

  if ("activities" in value) {
    if (!Array.isArray(value.activities) || !value.activities.every(isActivity)) {
      return null;
    }
    patch.activities = value.activities;
  }

  if ("routines" in value) {
    if (!Array.isArray(value.routines) || !value.routines.every(isRoutine)) {
      return null;
    }
    patch.routines = value.routines;
  }

  if ("notes" in value) {
    if (!Array.isArray(value.notes) || !value.notes.every(isNote)) {
      return null;
    }
    patch.notes = value.notes;
  }

  if ("history" in value) {
    if (!Array.isArray(value.history) || !value.history.every(isHistoryEvent)) {
      return null;
    }
    patch.history = value.history;
  }

  if ("settings" in value) {
    if (!isDashboardSettings(value.settings)) {
      return null;
    }
    patch.settings = value.settings;
  }

  return patch;
}

function validateDashboardData(value: unknown): DashboardData | null {
  const patch = validatePatch(value);

  if (!patch?.tasks || !patch.activities || !patch.routines || !patch.notes || !patch.history || !patch.settings) {
    return null;
  }

  return {
    tasks: patch.tasks,
    activities: patch.activities,
    routines: patch.routines,
    notes: patch.notes,
    history: patch.history,
    settings: patch.settings
  };
}

export const GET = withRequestContext(function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  return NextResponse.json(getDashboardData());
});

export const PATCH = withRequestContext(async function PATCH(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  const patch = validatePatch(await parseJsonBody(request));

  if (!patch) {
    return NextResponse.json({ error: "Payload data tidak valid." }, { status: 400 });
  }

  updateDashboardData(patch);
  return NextResponse.json(getDashboardData());
});

export const PUT = withRequestContext(async function PUT(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  const data = validateDashboardData(await parseJsonBody(request));

  if (!data) {
    return NextResponse.json({ error: "Payload data tidak valid." }, { status: 400 });
  }

  const isReset = data.tasks.length === 0 && data.activities.length === 0 && data.routines.length === 0 && data.notes.length === 0 && data.history.length === 0;

  replaceDashboardData(data, { recordHistory: false });
  logWithContext({
    level: "info",
    category: "USER_ACTIVITY",
    action: isReset ? "dashboard.reset" : "dashboard.replaced",
    activity: isReset ? "Menghapus semua data" : "Mengganti seluruh data dashboard",
    entityType: "dashboard",
    entityId: "primary",
    status: "success",
    description: isReset ? `${session.user} mengosongkan seluruh data dashboard.` : `${session.user} mengganti seluruh data dashboard.`,
    metadata: {
      tasks: data.tasks.length,
      activities: data.activities.length,
      routines: data.routines.length,
      notes: data.notes.length,
      history: data.history.length
    }
  });
  return NextResponse.json(getDashboardData());
});
