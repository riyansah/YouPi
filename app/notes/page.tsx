"use client";

import { ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NotebookPen, Plus, Search, X } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { NoteCard } from "@/components/NoteCard";
import { NoteEditorForm, type NoteEditorState } from "@/components/NoteEditorForm";
import { PageHeader } from "@/components/PageHeader";
import { useDashboardStore } from "@/lib/dashboard-store";
import { findLinkedItemTitle, getLinkedItemHref, getNoteCategoryLabel, matchesNoteFilter, normalizeNoteTags, noteCategories, sortNotes, translateNoteValidationErrors, type NoteFilterValue } from "@/lib/notes";
import { getFieldClassName, getFieldShellClassName } from "@/lib/field-styles";
import type { Note, NoteCategory, NoteLinkedType } from "@/lib/types";
import { validateNoteForm } from "@/lib/validation";

function emptyForm(): NoteEditorState {
  return {
    title: "",
    content: "",
    category: "personal",
    linkedType: null,
    linkedId: "",
    tagsText: "",
    isPinned: false
  };
}

function noteToForm(note: Note): NoteEditorState {
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

function NotesPageContent() {
  const { notes, createNote, updateNote, deleteNote, tasks, activities, routines, settings } = useDashboardStore();
  const { confirm, showToast } = useAppFeedback();
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = settings.language;
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<NoteFilterValue>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NoteEditorState>(emptyForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const linkedScopeType = searchParams.get("linkedType") as Exclude<NoteLinkedType, null> | null;
  const linkedScopeId = searchParams.get("linkedId");
  const noteIdQuery = searchParams.get("noteId");
  const composeQuery = searchParams.get("compose") === "1";
  const text = {
    clear: language === "id" ? "Hapus filter" : "Clear",
    drawerDescription:
      language === "id"
        ? "Gunakan drawer ini untuk perubahan cepat. Untuk edit panjang atau mobile, buka halaman penuh note."
        : "Use this drawer for quick updates. For long-form edits or mobile, open the full note page.",
    drawerEyebrow: language === "id" ? "Catatan" : "Notes",
    drawerTitle: editingId ? (language === "id" ? "Edit Catatan" : "Edit Note") : language === "id" ? "Catatan Baru" : "New Note",
    newNote: language === "id" ? "Catatan Baru" : "New Note",
    pinned: language === "id" ? "Disematkan" : "Pinned",
    saveChanges: language === "id" ? "Simpan perubahan" : "Save changes"
  };

  const orderedNotes = useMemo(() => sortNotes(notes), [notes]);

  const visibleNotes = useMemo(() => {
    return orderedNotes.filter((note) => {
      const baseMatch = matchesNoteFilter(note, searchQuery, filter);
      const scopeMatch = linkedScopeType && linkedScopeId ? note.linkedType === linkedScopeType && note.linkedId === linkedScopeId : true;
      return baseMatch && scopeMatch;
    });
  }, [filter, linkedScopeId, linkedScopeType, orderedNotes, searchQuery]);

  useEffect(() => {
    if (!composeQuery) {
      return;
    }

    const categoryParam = searchParams.get("category");
    const linkedTypeParam = searchParams.get("linkedType");
    const linkedIdParam = searchParams.get("linkedId");
    const nextForm = emptyForm();

    if (noteCategories.includes(categoryParam as NoteCategory)) {
      nextForm.category = categoryParam as NoteCategory;
    }

    if (linkedTypeParam === "work" || linkedTypeParam === "activity" || linkedTypeParam === "routine") {
      nextForm.linkedType = linkedTypeParam;
      nextForm.linkedId = linkedIdParam || "";
    }

    setEditingId(null);
    setForm(nextForm);
    setFormErrors([]);
    setDrawerOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("compose");
    params.delete("noteId");
    const query = params.toString();
    router.replace(query ? `/notes?${query}` : "/notes", { scroll: false });
  }, [composeQuery, router, searchParams]);

  useEffect(() => {
    if (!noteIdQuery) {
      return;
    }

    const note = notes.find((item) => item.id === noteIdQuery);
    if (!note) {
      return;
    }

    setEditingId(note.id);
    setForm(noteToForm(note));
    setFormErrors([]);
    setDrawerOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("noteId");
    params.delete("compose");
    const query = params.toString();
    router.replace(query ? `/notes?${query}` : "/notes", { scroll: false });
  }, [noteIdQuery, notes, router, searchParams]);

  const scopeLabel = linkedScopeType && linkedScopeId
    ? findLinkedItemTitle(linkedScopeType, linkedScopeId, tasks, activities, routines)
    : null;

  function resetEditor() {
    setEditingId(null);
    setForm(emptyForm());
    setFormErrors([]);
  }

  function openNewNote() {
    resetEditor();
    setDrawerOpen(true);
  }

  function openNote(note: Note) {
    setEditingId(note.id);
    setForm(noteToForm(note));
    setFormErrors([]);
    setDrawerOpen(true);
  }

  function handleFormChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
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

  async function saveNote() {
    const payload = {
      title: form.title,
      content: form.content,
      category: form.category,
      linkedType: form.linkedType,
      linkedId: form.linkedType ? form.linkedId || null : null,
      tags: normalizeNoteTags(form.tagsText),
      isPinned: form.isPinned
    };
    const errors = validateNoteForm(payload);

    if (payload.linkedType && payload.linkedId) {
      const linkedTitle = findLinkedItemTitle(payload.linkedType, payload.linkedId, tasks, activities, routines);
      if (!linkedTitle) {
        errors.push("Item yang dihubungkan tidak ditemukan.");
      }
    }

    if (errors.length) {
      setFormErrors(translateNoteValidationErrors(errors, language));
      return;
    }

    try {
      if (editingId) {
        await updateNote(editingId, payload);
        showToast({ message: language === "id" ? "Note berhasil diperbarui." : "Note updated successfully." });
      } else {
        await createNote(payload);
        showToast({ message: language === "id" ? "Note berhasil ditambahkan." : "Note added successfully." });
      }

      setDrawerOpen(false);
      resetEditor();
    } catch (error) {
      setFormErrors([error instanceof Error ? error.message : "Failed to save note."]);
    }
  }

  async function handleDelete(id: string) {
    const note = notes.find((item) => item.id === id);
    const confirmed = await confirm({
      title: language === "id" ? "Hapus note?" : "Delete note?",
      description: language === "id" ? `Note "${note?.title || "ini"}" akan dihapus permanen.` : `Note "${note?.title || "this item"}" will be permanently deleted.`,
      confirmLabel: language === "id" ? "Hapus" : "Delete",
      tone: "danger"
    });

    if (!confirmed) {
      return;
    }

    await deleteNote(id);
    if (editingId === id) {
      setDrawerOpen(false);
      resetEditor();
    }
    showToast({ message: language === "id" ? "Note berhasil dihapus." : "Note deleted.", tone: "warning" });
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Notes" title={language === "id" ? "Catatan" : "Notes"} description={language === "id" ? "Pusat catatan pribadi yang bisa berdiri sendiri atau terhubung ke Work, Activities, dan Routines." : "A personal notes hub that can stand alone or connect to Work, Activities, and Routines."} language={language} />

      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-[1fr_auto]">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Cari note" : "Search notes"}</span>
              <div className={getFieldShellClassName({ filled: Boolean(searchQuery) }) + " px-3 py-2"}>
                <Search className="h-4 w-4 text-slate-400" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={language === "id" ? "Cari judul, isi, tag, atau kategori" : "Search title, content, tag, or category"} className="ml-2 w-full bg-transparent text-sm outline-none dark:text-slate-100" />
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Filter" : "Filter"}</span>
              <select value={filter} onChange={(event) => setFilter(event.target.value as NoteFilterValue)} className={getFieldClassName({ filled: Boolean(filter) })}>
                <option value="all">{language === "id" ? "Semua" : "All"}</option>
                <option value="work">{getNoteCategoryLabel("work", language)}</option>
                <option value="activity">{getNoteCategoryLabel("activity", language)}</option>
                <option value="routine">{getNoteCategoryLabel("routine", language)}</option>
                <option value="personal">{getNoteCategoryLabel("personal", language)}</option>
                <option value="pinned">{text.pinned}</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={openNewNote} className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"><Plus className="h-4 w-4" />{text.newNote}</button>
        </div>

        {scopeLabel && linkedScopeType && linkedScopeId ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <NotebookPen className="h-4 w-4 text-teal-700 dark:text-teal-300" />
            <span>{language === "id" ? "Menampilkan note untuk" : "Showing notes for"} <strong>{scopeLabel}</strong></span>
            <button type="button" onClick={() => router.replace("/notes", { scroll: false })} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><X className="h-3.5 w-3.5" />{text.clear}</button>
          </div>
        ) : null}
      </section>

      {visibleNotes.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleNotes.map((note) => {
            const linkedTitle = findLinkedItemTitle(note.linkedType, note.linkedId, tasks, activities, routines);
            const linkedHref = getLinkedItemHref(note.linkedType, note.linkedId);
            const linkedLabel = linkedTitle && note.linkedType ? `${getNoteCategoryLabel(note.linkedType, language)}: ${linkedTitle}` : null;

            return <NoteCard key={note.id} note={note} linkedLabel={linkedLabel} linkedHref={linkedHref} onOpen={openNote} onDelete={handleDelete} language={language} />;
          })}
        </div>
      ) : (
        <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{language === "id" ? "Belum ada note yang cocok dengan pencarian atau filter ini." : "No notes match the current search or filter."}</div>
      )}

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
          <button type="button" className="flex-1" onClick={() => { setDrawerOpen(false); resetEditor(); }} aria-label={language === "id" ? "Tutup editor note" : "Close note editor"} />
          <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-teal-700 dark:text-teal-300">{text.drawerEyebrow}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-50">{text.drawerTitle}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text.drawerDescription}</p>
              </div>
              <button type="button" onClick={() => { setDrawerOpen(false); resetEditor(); }} className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
            </div>

            <NoteEditorForm
              form={form}
              onChange={handleFormChange}
              onSubmit={saveNote}
              tasks={tasks}
              activities={activities}
              routines={routines}
              errors={formErrors}
              submitLabel={editingId ? text.saveChanges : text.newNote}
              language={language}
              footer={editingId ? <Link href={`/notes/${editingId}`} className="inline-flex items-center rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{language === "id" ? "Buka halaman penuh" : "Open full page"}</Link> : null}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export default function NotesPage() {
  return <Suspense fallback={null}><NotesPageContent /></Suspense>;
}
