import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, jsonError, readJsonRecord } from "@/lib/server/api";
import { getDashboardData, replaceDashboardData } from "@/lib/server/dashboard-db";
import { logWithContext, withRequestContext } from "@/lib/server/request-context";
import { createDashboardBackup, parseDashboardBackup } from "@/lib/storage";

export const runtime = "nodejs";

export const GET = withRequestContext(function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const data = getDashboardData();
  return NextResponse.json(createDashboardBackup(data.tasks, data.activities, data.routines, data.notes, data.settings, data.history));
});

export const PUT = withRequestContext(async function PUT(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const body = await readJsonRecord(request);
  if (!body) return jsonError("Payload data tidak valid.");

  const parsed = parseDashboardBackup(JSON.stringify(body));
  if (!parsed.ok) return jsonError(parsed.error);

  replaceDashboardData({
    tasks: parsed.backup.tasks,
    activities: parsed.backup.activities,
    routines: parsed.backup.routines,
    notes: parsed.backup.notes,
    history: parsed.backup.history,
    settings: parsed.backup.settings
  }, { recordHistory: false });

  logWithContext({
    level: "info",
    category: "USER_ACTIVITY",
    action: "backup.restored",
    activity: "Restore backup",
    entityType: "dashboard",
    entityId: "primary",
    status: "success",
    description: auth.session.user + " memulihkan backup dashboard.",
    metadata: {
      tasks: parsed.backup.tasks.length,
      activities: parsed.backup.activities.length,
      routines: parsed.backup.routines.length,
      notes: parsed.backup.notes.length,
      history: parsed.backup.history.length
    }
  });

  return NextResponse.json(getDashboardData());
});
