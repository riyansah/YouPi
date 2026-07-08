"use client";

import Link from "next/link";
import { Edit2, Pin, Trash2 } from "lucide-react";
import type { AppLanguage, Note } from "@/lib/types";
import { getNoteCategoryLabel } from "@/lib/notes";
import { getIconButtonClassName, getInteractiveSurfaceClassName, getSemanticChipClassName } from "@/lib/ui-state-styles";
import { cn, dateKeyFromTimestamp, formatDate } from "@/lib/utils";

const categoryTone = {
  work: "info",
  activity: "success",
  routine: "upcoming",
  personal: "neutral"
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
    <article className={getInteractiveSurfaceClassName() + " p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">{note.title}</h2>
            <span className={cn(getSemanticChipClassName(categoryTone[note.category]))}>{getNoteCategoryLabel(note.category, language)}</span>
            {note.isPinned ? <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-100"><Pin className="h-3.5 w-3.5" />Pinned</span> : null}
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{note.content}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {linkedLabel ? linkedHref ? <Link href={linkedHref} className="rounded border border-slate-200 bg-slate-100 px-2 py-1 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">{linkedLabel}</Link> : <span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">{linkedLabel}</span> : null}
            {note.tags.map((tag) => <span key={tag} className="rounded border border-slate-200 bg-slate-100 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">#{tag}</span>)}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{language === "id" ? "Diperbarui" : "Updated"} {formatDate(dateKeyFromTimestamp(note.updatedAt), language)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => onOpen(note)} className={getIconButtonClassName()} aria-label={language === "id" ? `Edit ${note.title}` : `Edit ${note.title}`}><Edit2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(note.id)} className={getIconButtonClassName("danger")} aria-label={language === "id" ? `Hapus ${note.title}` : `Delete ${note.title}`}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </article>
  );
}
