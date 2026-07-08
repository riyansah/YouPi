"use client";

import Link from "next/link";
import { Edit2, Pin, Trash2 } from "lucide-react";
import type { AppLanguage, Note } from "@/lib/types";
import { getNoteCategoryLabel } from "@/lib/notes";
import { cn, dateKeyFromTimestamp, formatDate } from "@/lib/utils";

const categoryTone = {
  work: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-100",
  activity: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-100",
  routine: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-100",
  personal: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
} as const;

interface NoteCardProps {
  note: Note;
  linkedLabel: string | null;
  linkedHref: string | null;
  onOpen: (note: Note) => void;
  onDelete: (id: string) => void;
  language: AppLanguage;
}

export function NoteCard({ note, linkedLabel, linkedHref, onOpen, onDelete, language }: NoteCardProps) {
  return (
    <article className="rounded border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">{note.title}</h2>
            <span className={cn("rounded px-2 py-1 text-xs font-semibold", categoryTone[note.category])}>{getNoteCategoryLabel(note.category, language)}</span>
            {note.isPinned ? <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-100"><Pin className="h-3.5 w-3.5" />{language === "id" ? "Pinned" : "Pinned"}</span> : null}
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{note.content}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {linkedLabel ? linkedHref ? <Link href={linkedHref} className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">{linkedLabel}</Link> : <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">{linkedLabel}</span> : null}
            {note.tags.map((tag) => <span key={tag} className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">#{tag}</span>)}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{language === "id" ? "Diperbarui" : "Updated"} {formatDate(dateKeyFromTimestamp(note.updatedAt), language)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => onOpen(note)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" aria-label={language === "id" ? `Edit ${note.title}` : `Edit ${note.title}`}><Edit2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(note.id)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/50" aria-label={language === "id" ? `Hapus ${note.title}` : `Delete ${note.title}`}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </article>
  );
}
