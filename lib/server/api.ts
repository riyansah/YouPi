import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { parseJsonBody, setRequestActor } from "@/lib/server/request-context";

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function authenticateRequest(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return { ok: false as const, response: jsonError("Unauthorized", 401) };
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  return { ok: true as const, session };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonRecord(request: NextRequest) {
  const body = await parseJsonBody(request);
  return isRecord(body) ? body : null;
}
