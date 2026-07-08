import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server/api";
import { defaultSettings } from "@/lib/data";
import { getDashboardData, replaceDashboardData } from "@/lib/server/dashboard-db";
import { logWithContext, withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export const POST = withRequestContext(function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  replaceDashboardData({ tasks: [], activities: [], routines: [], notes: [], history: [], settings: defaultSettings }, { recordHistory: false });
  logWithContext({
    level: "info",
    category: "USER_ACTIVITY",
    action: "dashboard.reset",
    activity: "Menghapus semua data",
    entityType: "dashboard",
    entityId: "primary",
    status: "success",
    description: auth.session.user + " mengosongkan seluruh data dashboard."
  });
  return NextResponse.json(getDashboardData());
});
