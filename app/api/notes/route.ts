import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { createNote, getDashboardData, getNotes } from "@/lib/server/dashboard-db";
import { noteCategories, noteLinkedTypes, sortNotes } from "@/lib/notes";
import { validateNoteForm } from "@/lib/validation";
import { getCurrentTimestampInTimeZone } from "@/lib/time";
import { parseJsonBody, setRequestActor, withRequestContext } from "@/lib/server/request-context";
import type { Note, NoteCategory, NoteLinkedType } from "@/lib/types";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function makeNoteId() {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)));
  }

  if (typeof value === "string") {
    return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
  }

  return [];
}

function parseCreatePayload(value: unknown): { ok: true; note: Note } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: "Payload data tidak valid." };
  }

  const title = typeof value.title === "string" ? value.title : "";
  const content = typeof value.content === "string" ? value.content : "";
  const category = noteCategories.includes(value.category as NoteCategory) ? (value.category as NoteCategory) : "personal";
  const linkedType = value.linkedType === null || noteLinkedTypes.includes(value.linkedType as Exclude<NoteLinkedType, null>) ? ((value.linkedType ?? null) as NoteLinkedType) : null;
  const linkedId = typeof value.linkedId === "string" && value.linkedId ? value.linkedId : null;
  const tags = normalizeTags(value.tags);
  const isPinned = Boolean(value.isPinned);
  const errors = validateNoteForm({ title, content, category, linkedType, linkedId, tags, isPinned });

  if (errors.length) {
    return { ok: false, error: errors[0] };
  }

  const data = getDashboardData();
  if (linkedType && linkedId) {
    const exists = linkedType === "work"
      ? data.tasks.some((item) => item.id === linkedId)
      : linkedType === "activity"
        ? data.activities.some((item) => item.id === linkedId)
        : data.routines.some((item) => item.id === linkedId);

    if (!exists) {
      return { ok: false, error: "Item yang dihubungkan tidak ditemukan." };
    }
  }

  const timestamp = getCurrentTimestampInTimeZone();
  return {
    ok: true,
    note: {
      id: makeNoteId(),
      title: title.trim(),
      content: content.trim(),
      category,
      linkedType,
      linkedId,
      tags,
      isPinned,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };
}

export const GET = withRequestContext(function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const category = searchParams.get("category");
  const linkedType = searchParams.get("linkedType");
  const linkedId = searchParams.get("linkedId");
  const pinned = searchParams.get("pinned");

  const items = sortNotes(getNotes()).filter((note) => {
    const searchMatch = !q || [note.title, note.content, note.category, ...note.tags].join("\n").toLowerCase().includes(q);
    const categoryMatch = !category || category === "all" ? true : note.category === category;
    const linkedTypeMatch = !linkedType ? true : note.linkedType === linkedType;
    const linkedIdMatch = !linkedId ? true : note.linkedId === linkedId;
    const pinnedMatch = pinned === "true" ? note.isPinned : true;
    return searchMatch && categoryMatch && linkedTypeMatch && linkedIdMatch && pinnedMatch;
  });

  return NextResponse.json(items);
});

export const POST = withRequestContext(async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return unauthorized();
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  const parsed = parseCreatePayload(await parseJsonBody(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  createNote(parsed.note);
  return NextResponse.json(parsed.note, { status: 201 });
});
