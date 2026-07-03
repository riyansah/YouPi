import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, replaceDashboardData, updateDashboardData, type DashboardData } from "@/lib/server/dashboard-db";
import { getSessionFromRequest } from "@/lib/server/auth";
import { isActivity, isDashboardSettings, isRoutine, isTask } from "@/lib/storage";

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

  if (!patch?.tasks || !patch.activities || !patch.routines || !patch.settings) {
    return null;
  }

  return {
    tasks: patch.tasks,
    activities: patch.activities,
    routines: patch.routines,
    settings: patch.settings
  };
}

export function GET(request: NextRequest) {
  if (!getSessionFromRequest(request)) {
    return unauthorized();
  }

  return NextResponse.json(getDashboardData());
}

export async function PATCH(request: NextRequest) {
  if (!getSessionFromRequest(request)) {
    return unauthorized();
  }

  const patch = validatePatch(await request.json().catch(() => null));

  if (!patch) {
    return NextResponse.json({ error: "Payload data tidak valid." }, { status: 400 });
  }

  updateDashboardData(patch);
  return NextResponse.json(getDashboardData());
}

export async function PUT(request: NextRequest) {
  if (!getSessionFromRequest(request)) {
    return unauthorized();
  }

  const data = validateDashboardData(await request.json().catch(() => null));

  if (!data) {
    return NextResponse.json({ error: "Payload data tidak valid." }, { status: 400 });
  }

  replaceDashboardData(data);
  return NextResponse.json(getDashboardData());
}
