"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RotateCcw, Save } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { ActivityList } from "@/components/ActivityList";
import { LinkedNotesPanel } from "@/components/LinkedNotesPanel";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { TimePicker } from "@/components/TimePicker";
import { getActivityCategoryFilterParam, matchesActivityCategoryFilter } from "@/lib/activity-filters";
import type { ActivityCategoryFilter } from "@/lib/activity-filters";
import { tActivityFilter, tActivityStatus, tCategory } from "@/lib/i18n";
import { getFieldClassName, getFieldMessageClassName } from "@/lib/field-styles";
import { useDashboardStore } from "@/lib/dashboard-store";
import { getLinkedNotes } from "@/lib/notes";
import type { Activity, ActivityCategory, ActivityStatus } from "@/lib/types";
import { activityCategories, activityFormStatuses } from "@/lib/types";
import { getEffectiveActivityStatus, normalizeActivityStatusForTime, paginateItems, todayDate } from "@/lib/utils";
import { useNow } from "@/lib/use-now";
import { validateActivityForm } from "@/lib/validation";

const pageSize = 10;

const emptyActivityForm = {
  title: "",
  category: "Kerja" as ActivityCategory,
  date: todayDate(),
  startTime: "09:00",
  endTime: "10:00",
  status: "Direncanakan" as ActivityStatus,
  notes: ""
};

function getDateFilterParam(value: string | null) {
  return value && value.length === 10 && value[4] === "-" && value[7] === "-" ? value : null;
}

function normalizeActivityForm(form: typeof emptyActivityForm, timeZone: string) {
  return { ...form, status: normalizeActivityStatusForTime(form.status, form.date, form.startTime, Date.now(), timeZone) };
}

function translateErrors(errors: string[], language: "en" | "id") {
  const messages = {
    "Judul aktivitas minimal 3 karakter.": {
      id: "Judul aktivitas minimal 3 karakter. Tambahkan nama aktivitas yang lebih jelas.",
      en: "Activity title must be at least 3 characters. Add a clearer activity title."
    },
    "Waktu selesai harus lebih besar dari waktu mulai.": {
      id: "Waktu selesai harus lebih besar dari waktu mulai. Pilih jam selesai yang lebih akhir.",
      en: "End time must be later than start time. Choose a later end time."
    }
  } as const;

  return errors.map((error) => messages[error as keyof typeof messages]?.[language] || error);
}

function ActivitiesPageContent() {
  const { activities, createActivity, updateActivity, deleteActivity, notes, updateNote, settings } = useDashboardStore();
  const language = settings.language;
  const timeZone = settings.timeZone;
  const { confirm, showToast } = useAppFeedback();
  const now = useNow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedActivityId = searchParams.get("activityId");
  const composeQuery = searchParams.get("compose") === "1";
  const categoryQuery = getActivityCategoryFilterParam(searchParams.get("category"));
  const dateQuery = getDateFilterParam(searchParams.get("date"));
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategoryFilter>(() => categoryQuery || (settings.preferredCategories.length ? "Preferensi" : "Semua"));
  const [dateFilter, setDateFilter] = useState(() => dateQuery || todayDate(timeZone));
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyActivityForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const text = {
    eyebrow: language === "id" ? "Aktivitas Harian" : "Daily Activities",
    title: language === "id" ? "Catatan Aktivitas" : "Activity Log",
    description: language === "id" ? "Kelola aktivitas berdasarkan tanggal, kategori, dan status." : "Manage activities by date, category, and status.",
    edit: language === "id" ? "Edit Aktivitas" : "Edit Activity",
    add: language === "id" ? "Tambah Aktivitas" : "Add Activity",
    titleLabel: language === "id" ? "Judul" : "Title",
    category: language === "id" ? "Kategori" : "Category",
    date: language === "id" ? "Tanggal" : "Date",
    status: language === "id" ? "Status" : "Status",
    start: language === "id" ? "Mulai" : "Start",
    end: language === "id" ? "Selesai" : "End",
    notes: language === "id" ? "Catatan" : "Notes",
    save: language === "id" ? "Simpan perubahan" : "Save changes",
    addItem: language === "id" ? "Tambah aktivitas" : "Add activity",
    reset: "Reset",
    filterDate: language === "id" ? "Filter tanggal" : "Date filter",
    filterCategory: language === "id" ? "Filter kategori" : "Category filter",
    prefHelp: settings.preferredCategories.length ? (language === "id" ? `Menampilkan kategori preferensi: ${settings.preferredCategories.map((item) => tCategory(item, language)).join(", ")}. Filter tanggal tetap berlaku.` : `Showing preferred categories: ${settings.preferredCategories.map((item) => tCategory(item, language)).join(", ")}. The date filter still applies.`) : (language === "id" ? "Belum ada kategori preferensi dipilih di Pengaturan." : "No preferred categories are selected in Settings yet."),
    added: language === "id" ? "Aktivitas" : "Activity",
    addedTail: language === "id" ? "berhasil ditambahkan." : "was added successfully.",
    deletedTail: language === "id" ? "dihapus." : "was deleted.",
    deletedOk: language === "id" ? "Aktivitas berhasil dihapus." : "Activity deleted.",
    undo: language === "id" ? "Batalkan" : "Undo",
    completedTail: language === "id" ? "diselesaikan." : "was completed.",
    confirmTitle: language === "id" ? "Hapus aktivitas?" : "Delete activity?",
    confirmDesc: (title: string) => language === "id" ? `Aktivitas "${title}" akan dihapus permanen dari dashboard.` : `Activity "${title}" will be permanently removed from the dashboard.`,
    deleteLabel: language === "id" ? "Hapus" : "Delete"
  };

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({ ...emptyActivityForm, date: todayDate(timeZone) });
    setFormErrors([]);
  }, [timeZone]);

  const filteredActivities = useMemo(() => activities.filter((activity) => {
    const categoryMatch = matchesActivityCategoryFilter(activity.category, categoryFilter, settings.preferredCategories);
    const dateMatch = !dateFilter || activity.date === dateFilter;
    return categoryMatch && dateMatch;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime)), [activities, categoryFilter, dateFilter, settings.preferredCategories]);

  const paginatedActivities = useMemo(() => paginateItems(filteredActivities, currentPage, pageSize), [currentPage, filteredActivities]);
  const linkedNotes = useMemo(() => editingId ? getLinkedNotes(notes, "activity", editingId) : [], [editingId, notes]);

  const fieldErrors = useMemo(() => ({
    title: formErrors.find((error) => error.startsWith("Judul aktivitas") || error.startsWith("Activity title")) || null,
    endTime: formErrors.find((error) => error.startsWith("Waktu selesai") || error.startsWith("End time")) || null
  }), [formErrors]);

  useEffect(() => {
    if (selectedActivityId) return;
    if (categoryQuery && categoryFilter !== categoryQuery) setCategoryFilter(categoryQuery);
    if (dateQuery && dateFilter !== dateQuery) setDateFilter(dateQuery);
  }, [categoryFilter, categoryQuery, dateFilter, dateQuery, selectedActivityId]);

  useEffect(() => { setCurrentPage(1); }, [categoryFilter, dateFilter]);
  useEffect(() => { if (currentPage !== paginatedActivities.currentPage) setCurrentPage(paginatedActivities.currentPage); }, [currentPage, paginatedActivities.currentPage]);

  useEffect(() => {
    if (!composeQuery) return;
    resetForm();
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => titleInputRef.current?.focus(), 180);
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("compose");
    params.delete("activityId");
    const query = params.toString();
    router.replace(query ? `/activities?${query}` : "/activities", { scroll: false });
  }, [composeQuery, resetForm, router, searchParams]);

  useEffect(() => {
    if (composeQuery || !selectedActivityId) return;
    const activity = activities.find((item) => item.id === selectedActivityId);
    if (!activity) return;
    if (categoryFilter !== "Semua") { setCategoryFilter("Semua"); return; }
    if (dateFilter !== activity.date) { setDateFilter(activity.date); return; }
    const orderedActivities = activities.filter((item) => item.date === activity.date).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const targetIndex = orderedActivities.findIndex((item) => item.id === activity.id);
    const targetPage = Math.floor(targetIndex / pageSize) + 1;
    if (currentPage !== targetPage) { setCurrentPage(targetPage); return; }
    if (editingId !== activity.id) {
      setEditingId(activity.id);
      setForm({ title: activity.title, category: activity.category, date: activity.date, startTime: activity.startTime, endTime: activity.endTime, status: getEffectiveActivityStatus(activity, now ?? Date.now(), timeZone), notes: activity.notes });
      setFormErrors([]);
    }
    router.replace("/activities", { scroll: false });
  }, [activities, categoryFilter, composeQuery, currentPage, dateFilter, editingId, now, router, selectedActivityId, timeZone]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedForm = normalizeActivityForm(form, timeZone);
    const errors = validateActivityForm(normalizedForm);
    if (errors.length) {
      setFormErrors(translateErrors(errors, language));
      return;
    }

    setFormErrors([]);
    try {
      if (editingId) {
        await updateActivity(editingId, normalizedForm);
      } else {
        const activity = await createActivity(normalizedForm);
        showToast({ message: text.added + " \"" + activity.title + "\" " + text.addedTail });
      }

      resetForm();
    } catch (error) {
      setFormErrors([error instanceof Error ? error.message : "Failed to save activity."]);
    }
  }

  function handleEdit(activity: Activity) {
    setEditingId(activity.id);
    setForm({ title: activity.title, category: activity.category, date: activity.date, startTime: activity.startTime, endTime: activity.endTime, status: getEffectiveActivityStatus(activity, now ?? Date.now(), timeZone), notes: activity.notes });
  }

  async function handleDelete(id: string) {
    const activity = activities.find((item) => item.id === id);
    const confirmed = await confirm({ title: text.confirmTitle, description: text.confirmDesc(activity?.title || (language === "id" ? "ini" : "this item")), confirmLabel: text.deleteLabel, tone: "danger" });
    if (!confirmed) return;

    const affectedNoteIds = notes.filter((note) => note.linkedType === "activity" && note.linkedId === id).map((note) => note.id);
    await deleteActivity(id);
    if (editingId === id) resetForm();
    if (activity) {
      showToast({ message: text.added + " \"" + activity.title + "\" " + text.deletedTail, tone: "warning", durationMs: 10000, actionLabel: text.undo, onAction: () => { void createActivity(activity).then(() => Promise.all(affectedNoteIds.map((noteId) => updateNote(noteId, { linkedType: "activity", linkedId: id })))); } });
    } else {
      showToast({ message: text.deletedOk });
    }
  }

  function handleStatusChange(id: string, status: ActivityStatus) {
    const activity = activities.find((item) => item.id === id);
    const nextStatus = activity ? normalizeActivityStatusForTime(status, activity.date, activity.startTime, now ?? Date.now(), timeZone) : status;
    const justCompleted = activity && getEffectiveActivityStatus(activity, now ?? Date.now(), timeZone) !== "Selesai" && nextStatus === "Selesai";
    if (activity) {
      void updateActivity(id, { status: nextStatus });
    }
    if (justCompleted && activity) showToast({ message: text.added + " \"" + activity.title + "\" " + text.completedTail });
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={text.eyebrow} title={text.title} description={text.description} language={language} timeZone={timeZone} />

      <section ref={formSectionRef} className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-teal-700 dark:text-teal-300" /><h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{editingId ? text.edit : text.add}</h2></div>
                <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.titleLabel}</span><input ref={titleInputRef} required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder={language === "id" ? "Tulis nama aktivitas" : "Enter activity title"} className={getFieldClassName({ filled: Boolean(form.title), error: Boolean(fieldErrors.title) })} />
          {fieldErrors.title ? <p className={getFieldMessageClassName("error")}>{fieldErrors.title}</p> : null}</label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.category}</span><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ActivityCategory }))} className={getFieldClassName({ filled: Boolean(form.category) })}>{activityCategories.map((category) => <option key={category} value={category}>{tCategory(category, language)}</option>)}</select></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.date}</span><input type="date" required value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className={getFieldClassName({ filled: Boolean(form.date) })} /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.status}</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ActivityStatus }))} className={getFieldClassName({ filled: Boolean(form.status) })}>{activityFormStatuses.map((status) => <option key={status} value={status}>{tActivityStatus(status, language)}</option>)}</select></label>
          <TimePicker id="activity-start-time" label={text.start} value={form.startTime} onChange={(startTime) => setForm((current) => ({ ...current, startTime }))} language={language} />
          <TimePicker id="activity-end-time" label={text.end} value={form.endTime} onChange={(endTime) => setForm((current) => ({ ...current, endTime }))} language={language} error={fieldErrors.endTime} />
          <label className="space-y-1 lg:col-span-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.notes}</span><textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder={language === "id" ? "Tambahkan catatan jika perlu" : "Add notes if needed"} className={getFieldClassName({ filled: Boolean(form.notes) })} /></label>
          <div className="flex flex-wrap gap-2 lg:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"><Save className="h-4 w-4" />{editingId ? text.save : text.addItem}</button><button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"><RotateCcw className="h-4 w-4" />Reset</button></div>
        </form>
        {editingId ? <div className="mt-5"><LinkedNotesPanel notes={linkedNotes} linkedType="activity" linkedId={editingId} language={language} /></div> : null}
      </section>

      <section className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row">
        <label className="space-y-1"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.filterDate}</span><input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className={getFieldClassName({ filled: Boolean(dateFilter) })} /></label>
        <label className="space-y-1"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.filterCategory}</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as ActivityCategoryFilter)} className={getFieldClassName({ filled: Boolean(categoryFilter) })}><option value="Preferensi">{tActivityFilter("Preferensi", language)}</option><option value="Semua">{tActivityFilter("Semua", language)}</option>{activityCategories.map((category) => <option key={category} value={category}>{tCategory(category, language)}</option>)}</select>{categoryFilter === "Preferensi" ? <p className="text-xs text-slate-500 dark:text-slate-400">{text.prefHelp}</p> : null}</label>
      </section>

      <ActivityList activities={paginatedActivities.items} now={now} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} language={language} />
      <Pagination currentPage={paginatedActivities.currentPage} totalPages={paginatedActivities.totalPages} totalItems={paginatedActivities.totalItems} startItem={paginatedActivities.startItem} endItem={paginatedActivities.endItem} onPageChange={setCurrentPage} language={language} />
    </div>
  );
}

export default function ActivitiesPage() {
  return <Suspense fallback={null}><ActivitiesPageContent /></Suspense>;
}
