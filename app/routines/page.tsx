"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppFeedback } from "@/components/AppFeedback";
import { LinkedNotesPanel } from "@/components/LinkedNotesPanel";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { TimePicker } from "@/components/TimePicker";
import { getFieldClassName, getFieldMessageClassName } from "@/lib/field-styles";
import { tPriority, tTaskStatus, tWeekday } from "@/lib/i18n";
import { useDashboardStore } from "@/lib/dashboard-store";
import { getLinkedNotes } from "@/lib/notes";
import type { Routine, TaskPriority, Weekday } from "@/lib/types";
import { taskPriorities, weekdays } from "@/lib/types";
import { cn, formatRoutineDays, formatTimeRange, getEffectiveRoutineStatus, getWeekdayFromDate, paginateItems, sortRoutines, todayDate } from "@/lib/utils";
import { useNow } from "@/lib/use-now";
import { validateRoutineForm } from "@/lib/validation";

const desktopPageSize = 10;
const mobilePageSize = 5;
const priorityStyles = { Rendah: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100", Sedang: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-100", Tinggi: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-100" };
const statusStyles = { "Akan Datang": "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-100", Berjalan: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-100" };
const emptyRoutineForm = { title: "", days: [getWeekdayFromDate(todayDate())] as Weekday[], startTime: "07:00", endTime: "07:30", priority: "Sedang" as TaskPriority, notes: "" };

function useResponsivePageSize() {
  const [pageSize, setPageSize] = useState(desktopPageSize);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setPageSize(mediaQuery.matches ? mobilePageSize : desktopPageSize);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return pageSize;
}

function translateErrors(errors: string[], language: "en" | "id") {
  const messages = {
    "Judul rutinitas minimal 3 karakter.": {
      id: "Judul rutinitas minimal 3 karakter. Tambahkan nama rutinitas yang mudah dikenali.",
      en: "Routine title must be at least 3 characters. Add a routine title that is easy to recognize."
    },
    "Pilih minimal satu hari untuk rutinitas.": {
      id: "Pilih minimal satu hari untuk rutinitas. Tandai hari saat rutinitas ini harus berjalan.",
      en: "Select at least one day for the routine. Choose the days when this routine should run."
    },
    "Waktu selesai harus lebih besar dari waktu mulai.": {
      id: "Waktu selesai harus lebih besar dari waktu mulai. Pilih jam selesai yang lebih akhir.",
      en: "End time must be later than start time. Choose a later end time."
    }
  } as const;
  return errors.map((error) => messages[error as keyof typeof messages]?.[language] || error);
}

function RoutinesPageContent() {
  const { routines, createRoutine, updateRoutine, deleteRoutine, notes, updateNote, settings } = useDashboardStore();
  const language = settings.language;
  const timeZone = settings.timeZone;
  const { confirm, showToast } = useAppFeedback();
  const now = useNow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRoutineId = searchParams.get("routineId");
  const composeQuery = searchParams.get("compose") === "1";
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formExpanded, setFormExpanded] = useState(false);
  const pageSize = useResponsivePageSize();
  const [form, setForm] = useState(emptyRoutineForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const text = {
    eyebrow: language === "id" ? "Rutinitas" : "Routines",
    title: language === "id" ? "Rutinitas Mingguan" : "Weekly Routines",
    description: language === "id" ? "Kelola rutinitas harian dari Senin sampai Minggu." : "Manage recurring routines across the week.",
    edit: language === "id" ? "Edit Rutinitas" : "Edit Routine",
    add: language === "id" ? "Tambah Rutinitas" : "Add Routine",
    titleLabel: language === "id" ? "Judul" : "Title",
    activeDays: language === "id" ? "Hari aktif" : "Active days",
    start: language === "id" ? "Mulai" : "Start",
    end: language === "id" ? "Selesai" : "End",
    priority: language === "id" ? "Prioritas" : "Priority",
    notes: language === "id" ? "Catatan" : "Notes",
    save: language === "id" ? "Simpan perubahan" : "Save changes",
    addItem: language === "id" ? "Tambah rutinitas" : "Add routine",
    openForm: language === "id" ? "Tambah rutinitas" : "Add routine",
    closeForm: language === "id" ? "Tutup form" : "Close form",
    empty: language === "id" ? "Belum ada rutinitas yang tersimpan." : "No saved routines yet.",
    deleteTitle: language === "id" ? "Hapus rutinitas?" : "Delete routine?",
    deleteLabel: language === "id" ? "Hapus" : "Delete",
    deleteDesc: (title: string) => language === "id" ? `Rutinitas "${title}" akan dihapus permanen dari dashboard.` : `Routine "${title}" will be permanently removed from the dashboard.`,
    added: language === "id" ? "Rutinitas" : "Routine",
    addedTail: language === "id" ? "berhasil ditambahkan." : "was added successfully.",
    deletedTail: language === "id" ? "dihapus." : "was deleted.",
    deletedOk: language === "id" ? "Rutinitas berhasil dihapus." : "Routine deleted.",
    undo: language === "id" ? "Batalkan" : "Undo",
    editAria: language === "id" ? "Edit" : "Edit",
    deleteAria: language === "id" ? "Hapus" : "Delete"
  };

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({ ...emptyRoutineForm, days: [getWeekdayFromDate(todayDate(timeZone))] });
    setFormErrors([]);
  }, [timeZone]);

  const orderedRoutines = useMemo(() => sortRoutines(routines), [routines]);
  const paginatedRoutines = useMemo(() => paginateItems(orderedRoutines, currentPage, pageSize), [currentPage, orderedRoutines, pageSize]);
  const linkedNotes = useMemo(() => editingId ? getLinkedNotes(notes, "routine", editingId) : [], [editingId, notes]);

  const fieldErrors = useMemo(() => ({
    title: formErrors.find((error) => error.startsWith("Judul rutinitas") || error.startsWith("Routine title")) || null,
    days: formErrors.find((error) => error.startsWith("Pilih minimal") || error.startsWith("Select at least")) || null,
    endTime: formErrors.find((error) => error.startsWith("Waktu selesai") || error.startsWith("End time")) || null
  }), [formErrors]);

  useEffect(() => { if (currentPage !== paginatedRoutines.currentPage) setCurrentPage(paginatedRoutines.currentPage); }, [currentPage, paginatedRoutines.currentPage]);

  useEffect(() => {
    if (!composeQuery) return;
    resetForm();
    setFormExpanded(true);
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => titleInputRef.current?.focus(), 180);
    });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("compose");
    params.delete("routineId");
    const query = params.toString();
    router.replace(query ? `/routines?${query}` : "/routines", { scroll: false });
  }, [composeQuery, resetForm, router, searchParams]);

  useEffect(() => {
    if (composeQuery || !selectedRoutineId) return;
    const routine = orderedRoutines.find((item) => item.id === selectedRoutineId);
    if (!routine) return;
    const targetIndex = orderedRoutines.findIndex((item) => item.id === routine.id);
    const targetPage = Math.floor(targetIndex / pageSize) + 1;
    if (currentPage !== targetPage) { setCurrentPage(targetPage); return; }
    if (editingId !== routine.id) {
      setFormExpanded(true);
      setEditingId(routine.id);
      setForm({ title: routine.title, days: routine.days, startTime: routine.startTime, endTime: routine.endTime, priority: routine.priority, notes: routine.notes });
      setFormErrors([]);
    }
    router.replace("/routines", { scroll: false });
  }, [composeQuery, currentPage, editingId, orderedRoutines, router, selectedRoutineId, pageSize]);

  function toggleDay(day: Weekday) {
    setForm((current) => ({ ...current, days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateRoutineForm(form);
    if (errors.length) {
      setFormErrors(translateErrors(errors, language));
      return;
    }

    setFormErrors([]);
    try {
      if (editingId) {
        await updateRoutine(editingId, form);
      } else {
        const routine = await createRoutine(form);
        showToast({ message: text.added + " \"" + routine.title + "\" " + text.addedTail });
      }

      resetForm();
      setFormExpanded(false);
    } catch (error) {
      setFormErrors([error instanceof Error ? error.message : "Failed to save routine."]);
    }
  }

  function handleEdit(routine: Routine) {
    setFormExpanded(true);
    setEditingId(routine.id);
    setForm({ title: routine.title, days: routine.days, startTime: routine.startTime, endTime: routine.endTime, priority: routine.priority, notes: routine.notes });
    setFormErrors([]);
  }

  async function handleDelete(id: string) {
    const routine = routines.find((item) => item.id === id);
    const confirmed = await confirm({ title: text.deleteTitle, description: text.deleteDesc(routine?.title || (language === "id" ? "ini" : "this item")), confirmLabel: text.deleteLabel, tone: "danger" });
    if (!confirmed) return;

    const affectedNoteIds = notes.filter((note) => note.linkedType === "routine" && note.linkedId === id).map((note) => note.id);
    await deleteRoutine(id);
    if (editingId === id) { resetForm(); setFormExpanded(false); }
    if (routine) {
      showToast({ message: text.added + " \"" + routine.title + "\" " + text.deletedTail, tone: "warning", durationMs: 10000, actionLabel: text.undo, onAction: () => { void createRoutine(routine).then(() => Promise.all(affectedNoteIds.map((noteId) => updateNote(noteId, { linkedType: "routine", linkedId: id })))); } });
    } else {
      showToast({ message: text.deletedOk });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={text.eyebrow} title={text.title} description={text.description} language={language} timeZone={timeZone} />

      <button type="button" onClick={() => setFormExpanded((current) => !current)} className="inline-flex w-full items-center justify-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 md:hidden">
        <Plus className="h-4 w-4" />{formExpanded || editingId ? text.closeForm : text.openForm}
      </button>

      <section ref={formSectionRef} className={cn("rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-5", formExpanded || editingId ? "block" : "hidden md:block")}>
        <div className="mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-teal-700 dark:text-teal-300" /><h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{editingId ? text.edit : text.add}</h2></div>
                <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1 lg:col-span-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.titleLabel}</span><input ref={titleInputRef} required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder={language === "id" ? "Tulis nama rutinitas" : "Enter routine title"} className={getFieldClassName({ filled: Boolean(form.title), error: Boolean(fieldErrors.title) })} />{fieldErrors.title ? <p className={getFieldMessageClassName("error")}>{fieldErrors.title}</p> : null}</label>
          <fieldset className="space-y-2 lg:col-span-2"><legend className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.activeDays}</legend><div className={cn("grid gap-2 rounded border p-3 sm:grid-cols-2 lg:grid-cols-4", fieldErrors.days ? "border-rose-500" : "border-slate-200 dark:border-slate-700")}>{weekdays.map((day) => <label key={day} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:text-slate-200"><input type="checkbox" checked={form.days.includes(day)} onChange={() => toggleDay(day)} className="h-4 w-4 accent-teal-700" /><span>{tWeekday(day, language)}</span></label>)}</div>{fieldErrors.days ? <p className={getFieldMessageClassName("error")}>{fieldErrors.days}</p> : null}</fieldset>
          <TimePicker id="routine-start-time" label={text.start} value={form.startTime} onChange={(startTime) => setForm((current) => ({ ...current, startTime }))} language={language} />
          <TimePicker id="routine-end-time" label={text.end} value={form.endTime} onChange={(endTime) => setForm((current) => ({ ...current, endTime }))} language={language} error={fieldErrors.endTime} />
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.priority}</span><select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))} className={getFieldClassName({ filled: Boolean(form.priority) })}>{taskPriorities.map((priority) => <option key={priority} value={priority}>{tPriority(priority, language)}</option>)}</select></label>
          <label className="space-y-1 lg:col-span-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.notes}</span><textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder={language === "id" ? "Tambahkan catatan jika perlu" : "Add notes if needed"} className={getFieldClassName({ filled: Boolean(form.notes) })} /></label>
          <div className="flex flex-wrap gap-2 lg:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"><Save className="h-4 w-4" />{editingId ? text.save : text.addItem}</button><button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"><RotateCcw className="h-4 w-4" />Reset</button></div>
        </form>
        {editingId ? <div className="mt-5"><LinkedNotesPanel notes={linkedNotes} linkedType="routine" linkedId={editingId} language={language} /></div> : null}
      </section>

      {paginatedRoutines.totalItems ? <div className="space-y-3">{paginatedRoutines.items.map((routine) => {
        const effectiveStatus = now === null ? null : getEffectiveRoutineStatus(routine, now);
        return <article key={routine.id} className="rounded border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/70"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{routine.title}</h2>{effectiveStatus ? <span className={cn("rounded px-2 py-1 text-xs font-semibold", statusStyles[effectiveStatus])}>{tTaskStatus(effectiveStatus as never, language)}</span> : null}<span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityStyles[routine.priority])}>{tPriority(routine.priority, language)}</span></div><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{formatRoutineDays(routine.days, language)} · {formatTimeRange(routine.startTime, routine.endTime)}</p>{routine.notes ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{routine.notes}</p> : null}</div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => handleEdit(routine)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" aria-label={`${text.editAria} ${routine.title}`}><Edit2 className="h-4 w-4" /></button><button type="button" onClick={() => handleDelete(routine.id)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/50" aria-label={`${text.deleteAria} ${routine.title}`}><Trash2 className="h-4 w-4" /></button></div></div></article>;
      })}</div> : <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{text.empty}</div>}

      <Pagination currentPage={paginatedRoutines.currentPage} totalPages={paginatedRoutines.totalPages} totalItems={paginatedRoutines.totalItems} startItem={paginatedRoutines.startItem} endItem={paginatedRoutines.endItem} onPageChange={setCurrentPage} language={language} />
    </div>
  );
}

export default function RoutinesPage() {
  return <Suspense fallback={null}><RoutinesPageContent /></Suspense>;
}
