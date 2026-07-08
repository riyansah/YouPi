import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { unlinkNotesByTarget } from "@/lib/server/dashboard-db";
import { noteLinkedTypes } from "@/lib/notes";
import { logWithContext, parseJsonBody, setRequestActor, withRequestContext } from "@/lib/server/request-context";
import type { NoteLinkedType } from "@/lib/types";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const POST = withRequestContext(async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  const body = await parseJsonBody(request);
  if (!isRecord(body) || !noteLinkedTypes.includes(body.linkedType as Exclude<NoteLinkedType, null>) || typeof body.linkedId !== "string" || !body.linkedId) {
    return NextResponse.json({ error: "Payload data tidak valid." }, { status: 400 });
  }

  unlinkNotesByTarget(body.linkedType as Exclude<NoteLinkedType, null>, body.linkedId);
  logWithContext({
    level: "info",
    category: "USER_ACTIVITY",
    action: "note.unlinked",
    activity: "Melepas tautan note",
    entityType: String(body.linkedType),
    entityId: body.linkedId,
    status: "success",
    description: `${session.user} melepaskan tautan notes dari item ${body.linkedType}.`
  });
  return NextResponse.json({ ok: true });
});
