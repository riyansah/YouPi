import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server/api";
import { getDashboardData } from "@/lib/server/dashboard-db";
import { withRequestContext } from "@/lib/server/request-context";
import type { ScheduleSourceFilter, ScheduleStatusFilter, ScheduleViewMode } from "@/lib/types";
import { buildScheduleItems, buildScheduleRange, filterScheduleItems, summarizeScheduleItems, todayDate } from "@/lib/utils";

export const runtime = "nodejs";

const views = new Set<ScheduleViewMode>(["today", "week", "month", "agenda"]);
const sources = new Set<ScheduleSourceFilter>(["all", "work", "activity", "routine"]);
const statuses = new Set<ScheduleStatusFilter>(["all", "upcoming", "done", "missed"]);

export const GET = withRequestContext(function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const data = getDashboardData();
  const view = views.has(searchParams.get("view") as ScheduleViewMode) ? (searchParams.get("view") as ScheduleViewMode) : "today";
  const anchorDate = searchParams.get("anchorDate") || todayDate(data.settings.timeZone);
  const source = sources.has(searchParams.get("source") as ScheduleSourceFilter) ? (searchParams.get("source") as ScheduleSourceFilter) : "all";
  const status = statuses.has(searchParams.get("status") as ScheduleStatusFilter) ? (searchParams.get("status") as ScheduleStatusFilter) : "all";
  const range = buildScheduleRange(anchorDate, view);
  const items = filterScheduleItems(buildScheduleItems(data.tasks, data.activities, data.routines, range, Date.now(), data.settings.timeZone), source, status);

  return NextResponse.json({ view, anchorDate, source, status, range, summary: summarizeScheduleItems(items), items });
});
