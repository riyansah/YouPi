import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { listHistoryEventRecords } from "@/lib/server/dashboard-db";
import { setRequestActor, withRequestContext } from "@/lib/server/request-context";
import type { HistoryEntityType, HistoryEventType } from "@/lib/types";
import { getDateKeyFromTimestamp } from "@/lib/time";

export const runtime = "nodejs";

const entityTypes = new Set<HistoryEntityType>(["work", "activity", "routine", "note"]);
const eventTypes = new Set<HistoryEventType>(["created", "updated", "completed", "missed", "cancelled", "deleted", "pinned", "unpinned"]);

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const GET = withRequestContext(function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const entityType = searchParams.get("entityType");
  const eventType = searchParams.get("eventType");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const items = listHistoryEventRecords().filter((item) => {
    const entityMatch = !entityType || entityType === "all" ? true : entityTypes.has(entityType as HistoryEntityType) && item.entityType === entityType;
    const eventMatch = !eventType || eventType === "all" ? true : eventTypes.has(eventType as HistoryEventType) && item.eventType === eventType;
    const searchMatch = !query || [item.title, item.description, item.entityType, item.eventType, item.metadata || ""].join("\n").toLowerCase().includes(query);
    const dateMatch = (() => {
      const date = getDateKeyFromTimestamp(item.createdAt);
      if (from && date < from) {
        return false;
      }
      if (to && date > to) {
        return false;
      }
      return true;
    })();

    return entityMatch && eventMatch && searchMatch && dateMatch;
  });

  return NextResponse.json(items);
});
