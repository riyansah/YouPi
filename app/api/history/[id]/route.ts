import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getHistoryEventRecordById } from "@/lib/server/dashboard-db";
import { setRequestActor, withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const GET = withRequestContext(async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  const { id } = await context.params;
  const item = getHistoryEventRecordById(id);
  if (!item) {
    return NextResponse.json({ error: "History tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json(item);
});
