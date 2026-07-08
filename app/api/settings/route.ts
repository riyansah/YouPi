import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, jsonError, readJsonRecord } from "@/lib/server/api";
import { getSettings, updateSettings } from "@/lib/server/dashboard-db";
import { parsePatchSettings } from "@/lib/server/resource-validation";
import { withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export const GET = withRequestContext(function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json(getSettings());
});

export const PATCH = withRequestContext(async function PATCH(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const body = await readJsonRecord(request);
  if (!body) return jsonError("Payload data tidak valid.");

  const parsed = parsePatchSettings(body, getSettings());
  if (!parsed.ok) return jsonError(parsed.error);
  return NextResponse.json(updateSettings(parsed.value));
});
