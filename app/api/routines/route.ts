import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, jsonError, readJsonRecord } from "@/lib/server/api";
import { createRoutine, getRoutines } from "@/lib/server/dashboard-db";
import { parseCreateRoutine } from "@/lib/server/resource-validation";
import { withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export const GET = withRequestContext(function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json(getRoutines());
});

export const POST = withRequestContext(async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const body = await readJsonRecord(request);
  if (!body) return jsonError("Payload data tidak valid.");

  const parsed = parseCreateRoutine(body);
  if (!parsed.ok) return jsonError(parsed.error);

  return NextResponse.json(createRoutine(parsed.value), { status: 201 });
});
