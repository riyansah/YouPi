import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, jsonError, readJsonRecord } from "@/lib/server/api";
import { deleteTask, getNotes, getTaskById, updateTask } from "@/lib/server/dashboard-db";
import { parsePatchTask } from "@/lib/server/resource-validation";
import { withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export const GET = withRequestContext(async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const item = getTaskById(id);
  if (!item) return jsonError("Pekerjaan tidak ditemukan.", 404);
  return NextResponse.json(item);
});

export const PATCH = withRequestContext(async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const current = getTaskById(id);
  if (!current) return jsonError("Pekerjaan tidak ditemukan.", 404);

  const body = await readJsonRecord(request);
  if (!body) return jsonError("Payload data tidak valid.");

  const parsed = parsePatchTask(body, current);
  if (!parsed.ok) return jsonError(parsed.error);

  const item = updateTask(id, parsed.value);
  return NextResponse.json(item);
});

export const DELETE = withRequestContext(async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const item = deleteTask(id);
  if (!item) return jsonError("Pekerjaan tidak ditemukan.", 404);
  return NextResponse.json({ ok: true, item, notes: getNotes() });
});
