import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server/api";
import { buildReportExportModel } from "@/lib/report-export";
import { getDashboardData } from "@/lib/server/dashboard-db";
import { withRequestContext } from "@/lib/server/request-context";
import { getCurrentTimestampInTimeZone } from "@/lib/time";
import type { ReportPeriod } from "@/lib/types";
import { todayDate } from "@/lib/utils";

export const runtime = "nodejs";

const periods = new Set<ReportPeriod>(["Harian", "Mingguan", "Bulanan", "Kustom"]);

export const GET = withRequestContext(function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const data = getDashboardData();
  const selectedDate = searchParams.get("selectedDate") || todayDate(data.settings.timeZone);
  const rangeFrom = searchParams.get("rangeFrom");
  const rangeTo = searchParams.get("rangeTo");
  const period = periods.has(searchParams.get("period") as ReportPeriod) ? (searchParams.get("period") as ReportPeriod) : "Mingguan";

  return NextResponse.json(buildReportExportModel({
    tasks: data.tasks,
    activities: data.activities,
    selectedDate,
    period,
    rangeFrom,
    rangeTo,
    generatedAt: getCurrentTimestampInTimeZone(data.settings.timeZone),
    timeZone: data.settings.timeZone
  }));
});
