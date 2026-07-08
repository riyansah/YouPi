import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server/api";
import { getDashboardData } from "@/lib/server/dashboard-db";
import { withRequestContext } from "@/lib/server/request-context";
import { buildTodayAgendaItems, dailyActivityChartData, sortTasksByNearestDeadline, summarizeActivities, summarizeTasks, todayDate, weeklyProgressData } from "@/lib/utils";

export const runtime = "nodejs";

export const GET = withRequestContext(function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const data = getDashboardData();
  const timeZone = data.settings.timeZone;
  const now = Date.now();
  const today = todayDate(timeZone, now);

  return NextResponse.json({
    settings: data.settings,
    taskSummary: summarizeTasks(data.tasks, now, timeZone),
    activitySummary: summarizeActivities(data.activities, timeZone, now),
    nearestDeadlineTasks: sortTasksByNearestDeadline(data.tasks, timeZone),
    todayAgendaItems: buildTodayAgendaItems(data.activities, data.routines, today, now, timeZone),
    charts: {
      dailyActivity: dailyActivityChartData(data.activities, data.routines, today, timeZone),
      weeklyProgress: weeklyProgressData(data.tasks, timeZone, now)
    }
  });
});
