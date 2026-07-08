import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { deleteNote, getDashboardData, getNoteById, updateNote } from "@/lib/server/dashboard-db";
import { noteCategories, noteLinkedTypes } from "@/lib/notes";
import { validateNoteForm } from "@/lib/validation";
import { getCurrentTimestampInTimeZone } from "@/lib/time";
import { parseJsonBody, setRequestActor, withRequestContext } from "@/lib/server/request-context";
import type { NoteCategory, NoteLinkedType } from "@/lib/types";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTags(value: unknown, fallback: string[]) {
  if (value === undefined) {
    return fallback;
  }

  if (Array.isArray(value)) {
    return Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)));
  }

  if (typeof value === "string") {
    return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
  }

  return fallback;
}

export const GET = withRequestContext(function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  return context.params.then(({ id }) => {
    const note = getNoteById(id);
    if (!note) {
      return NextResponse.json({ error: "Note tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json(note);
  });
});

export const PATCH = withRequestContext(async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  const { id } = await context.params;
  const current = getNoteById(id);
  if (!current) {
    return NextResponse.json({ error: "Note tidak ditemukan." }, { status: 404 });
  }

  const body = await parseJsonBody(request);
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Payload data tidak valid." }, { status: 400 });
  }

  const next = {
    title: typeof body.title === "string" ? body.title : current.title,
    content: typeof body.content === "string" ? body.content : current.content,
    category: noteCategories.includes(body.category as NoteCategory) ? (body.category as NoteCategory) : current.category,
    linkedType: body.linkedType === null || noteLinkedTypes.includes(body.linkedType as Exclude<NoteLinkedType, null>) ? ((body.linkedType ?? current.linkedType) as NoteLinkedType) : current.linkedType,
    linkedId: body.linkedId === null ? null : typeof body.linkedId === "string" ? body.linkedId : current.linkedId,
    tags: normalizeTags(body.tags, current.tags),
    isPinned: typeof body.isPinned === "boolean" ? body.isPinned : current.isPinned
  };

  const errors = validateNoteForm(next);
  if (errors.length) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  if (next.linkedType && next.linkedId) {
    const data = getDashboardData();
    const exists = next.linkedType === "work"
      ? data.tasks.some((item) => item.id === next.linkedId)
      : next.linkedType === "activity"
        ? data.activities.some((item) => item.id === next.linkedId)
        : data.routines.some((item) => item.id === next.linkedId);

    if (!exists) {
      return NextResponse.json({ error: "Item yang dihubungkan tidak ditemukan." }, { status: 400 });
    }
  }

  const updated = updateNote(id, { ...next, updatedAt: getCurrentTimestampInTimeZone() });
  return NextResponse.json(updated);
});

export const DELETE = withRequestContext(async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  const { id } = await context.params;
  const deleted = deleteNote(id);
  if (!deleted) {
    return NextResponse.json({ error: "Note tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
});
