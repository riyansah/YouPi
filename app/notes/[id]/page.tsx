"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { NoteEditorForm, type NoteEditorState } from "@/components/NoteEditorForm";
import { PageHeader } from "@/components/PageHeader";
import { useDashboardStore } from "@/lib/dashboard-store";
import { findLinkedItemTitle, normalizeNoteTags, translateNoteValidationErrors } from "@/lib/notes";
import type { Note, NoteLinkedType } from "@/lib/types";
import { validateNoteForm } from "@/lib/validation";

function toForm(note: Note): NoteEditorState {
  return {
    title: note.title,
    content: note.content,
    category: note.category,
    linkedType: note.linkedType,
    linkedId: note.linkedId || "",
    tagsText: note.tags.join(", "),
    isPinned: note.isPinned
  };
}

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { confirm, showToast } = useAppFeedback();
  const { notes, updateNote, deleteNote, tasks, activities, routines, settings } = useDashboardStore();
  const language = settings.language;
  const note = useMemo(() => notes.find((item) => item.id === params.id) || null, [notes, params.id]);
  const [form, setForm] = useState<NoteEditorState>(() => note ? toForm(note) : { title: "", content: "", category: "personal", linkedType: null, linkedId: "", tagsText: "", isPinned: false });
  const [errors, setErrors] = useState<string[]>([]);
  const text = {
    back: language === "id" ? "Kembali ke Notes" : "Back to Notes",
    delete: language === "id" ? "Hapus note" : "Delete note",
    description: language === "id" ? "Edit panjang atau mobile view untuk note ini." : "Long-form or mobile view for this note.",
    notFoundDescription: language === "id" ? "Note ini mungkin sudah dihapus atau belum tersedia." : "This note may have been deleted or is not available.",
    notFoundTitle: language === "id" ? "Note tidak ditemukan" : "Note not found",
    save: language === "id" ? "Simpan perubahan" : "Save changes"
  };

  useEffect(() => {
    if (!note) {
      return;
    }

    setForm(toForm(note));
    setErrors([]);
  }, [note]);

  if (!note) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Notes" title={text.notFoundTitle} description={text.notFoundDescription} language={language} />
        <Link href="/notes" className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" />{text.back}</Link>
      </div>
    );
  }

  const currentNote = note;

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => {
      if (name === "isPinned" && event.target instanceof HTMLInputElement) {
        return { ...current, isPinned: event.target.checked };
      }

      if (name === "linkedType") {
        return { ...current, linkedType: value ? (value as Exclude<NoteLinkedType, null>) : null, linkedId: "" };
      }

      return { ...current, [name]: value };
    });
  }

  async function handleSave() {
    const payload = {
      title: form.title,
      content: form.content,
      category: form.category,
      linkedType: form.linkedType,
      linkedId: form.linkedType ? form.linkedId || null : null,
      tags: normalizeNoteTags(form.tagsText),
      isPinned: form.isPinned
    };
    const nextErrors = validateNoteForm(payload);
    if (payload.linkedType && payload.linkedId) {
      const linkedTitle = findLinkedItemTitle(payload.linkedType, payload.linkedId, tasks, activities, routines);
      if (!linkedTitle) {
        nextErrors.push("Item yang dihubungkan tidak ditemukan.");
      }
    }

    if (nextErrors.length) {
      setErrors(translateNoteValidationErrors(nextErrors, language));
      return;
    }

    try {
      await updateNote(currentNote.id, payload);
      setErrors([]);
      showToast({ message: language === "id" ? "Note berhasil diperbarui." : "Note updated successfully." });
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Failed to save note."]);
    }
  }

  async function handleDelete() {
    const confirmed = await confirm({ title: language === "id" ? "Hapus note?" : "Delete note?", description: language === "id" ? `Note "${currentNote.title}" akan dihapus permanen.` : `Note "${currentNote.title}" will be permanently deleted.`, confirmLabel: language === "id" ? "Hapus" : "Delete", tone: "danger" });
    if (!confirmed) {
      return;
    }
    await deleteNote(currentNote.id);
    showToast({ message: language === "id" ? "Note berhasil dihapus." : "Note deleted.", tone: "warning" });
    router.push("/notes");
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Notes" title={currentNote.title} description={text.description} language={language} />
      <div className="flex flex-wrap gap-2">
        <Link href="/notes" className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" />{text.back}</Link>
        <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 rounded border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/50"><Trash2 className="h-4 w-4" />{text.delete}</button>
      </div>
      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <NoteEditorForm form={form} onChange={handleChange} onSubmit={handleSave} tasks={tasks} activities={activities} routines={routines} errors={errors} submitLabel={text.save} language={language} />
      </section>
    </div>
  );
}
