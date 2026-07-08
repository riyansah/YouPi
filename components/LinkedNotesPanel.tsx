"use client";

import Link from "next/link";
import { NotebookPen, Plus } from "lucide-react";
import type { AppLanguage, Note, NoteLinkedType } from "@/lib/types";
import { getNoteCategoryLabel } from "@/lib/notes";
import { dateKeyFromTimestamp, formatDate } from "@/lib/utils";

interface LinkedNotesPanelProps {
  notes: Note[];
  linkedType: Exclude<NoteLinkedType, null>;
  linkedId: string;
  language: AppLanguage;
}

export function LinkedNotesPanel({ notes, linkedType, linkedId, language }: LinkedNotesPanelProps) {
  const query = `linkedType=${linkedType}&linkedId=${linkedId}`;
  const composeHref = `/notes?compose=1&category=${linkedType}&${query}`;
  const viewAllHref = `/notes?${query}`;

  return (
    <section className="rounded border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-5 w-5 text-teal-700 dark:text-teal-300" />
          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">{language === "id" ? "Notes terkait" : "Linked notes"}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{language === "id" ? "Catatan yang terhubung ke item ini." : "Notes connected to this item."}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={composeHref} className="inline-flex items-center gap-2 rounded bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800"><Plus className="h-4 w-4" />{language === "id" ? "New linked note" : "New linked note"}</Link>
          <Link href={viewAllHref} className="inline-flex items-center rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{language === "id" ? "Lihat semua" : "View all"}</Link>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {notes.length ? notes.slice(0, 3).map((note) => (
          <article key={note.id} className="rounded border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{note.title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{getNoteCategoryLabel(note.category, language)} · {language === "id" ? "Diperbarui" : "Updated"} {formatDate(dateKeyFromTimestamp(note.updatedAt), language)}</p>
              </div>
              <Link href={`/notes?noteId=${note.id}&${query}`} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{language === "id" ? "Buka" : "Open"}</Link>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{note.content}</p>
          </article>
        )) : <div className="rounded border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{language === "id" ? "Belum ada note yang terhubung ke item ini." : "No notes are linked to this item yet."}</div>}
      </div>
    </section>
  );
}
