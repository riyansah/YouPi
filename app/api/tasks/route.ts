import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, jsonError, readJsonRecord } from "@/lib/server/api";
import { createTask, getTasks } from "@/lib/server/dashboard-db";
import { parseCreateTask } from "@/lib/server/resource-validation";
import { withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export const GET = withRequestContext(function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json(getTasks());
});

export const POST = withRequestContext(async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const body = await readJsonRecord(request);
  if (!body) return jsonError("Payload data tidak valid.");

  const parsed = parseCreateTask(body);
  if (!parsed.ok) return jsonError(parsed.error);

  return NextResponse.json(createTask(parsed.value), { status: 201 });
});
