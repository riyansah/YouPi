"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RotateCcw, Save } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { LinkedNotesPanel } from "@/components/LinkedNotesPanel";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { TaskTable } from "@/components/TaskTable";
import { TimePicker } from "@/components/TimePicker";
import { getFieldClassName, getFieldMessageClassName } from "@/lib/field-styles";
import { tPriority, tTaskStatus } from "@/lib/i18n";
import { useDashboardStore } from "@/lib/dashboard-store";
import { getLinkedNotes } from "@/lib/notes";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { taskFormStatuses, taskPriorities } from "@/lib/types";
import { cn, getEffectiveTaskStatus, normalizeTaskStatusForTime, nowIso, paginateItems, todayDate } from "@/lib/utils";
import { useNow } from "@/lib/use-now";
import { validateTaskForm } from "@/lib/validation";

const desktopPageSize = 10;
const mobilePageSize = 5;

const emptyTaskForm = {
  title: "",
  description: "",
  status: "Berjalan" as TaskStatus,
  priority: "Sedang" as TaskPriority,
  startDate: todayDate(),
  deadline: todayDate(),
  startTime: "",
  endTime: ""
};

function getStatusFilterParam(value: string | null): "Semua" | TaskStatus | null {
  if (value === "Semua" || taskFormStatuses.includes(value as TaskStatus)) {
    return value as "Semua" | TaskStatus;
  }

  return null;
}

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

function normalizeTaskForm(form: typeof emptyTaskForm, timeZone: string) {
  return {
    ...form,
    status: normalizeTaskStatusForTime(form.status, form.startDate, form.startTime || null, Date.now(), timeZone),
    startTime: form.startTime || null,
    endTime: form.endTime || null
  };
}

function translateTaskErrors(errors: string[], language: "en" | "id") {
  const messages = {
    "Judul pekerjaan minimal 3 karakter.": {
      id: "Judul pekerjaan minimal 3 karakter. Tambahkan nama pekerjaan yang lebih spesifik.",
      en: "Work title must be at least 3 characters. Add a more specific work title."
    },
    "Deskripsi pekerjaan minimal 5 karakter.": {
      id: "Deskripsi pekerjaan minimal 5 karakter. Jelaskan singkat tujuan pekerjaan ini.",
      en: "Work description must be at least 5 characters. Briefly explain the work goal."
    },
    "Deadline tidak boleh lebih awal dari tanggal mulai.": {
      id: "Deadline tidak boleh lebih awal dari tanggal mulai. Geser deadline ke hari yang sama atau setelah tanggal mulai.",
      en: "Deadline cannot be earlier than the start date. Move the deadline to the same day or after the start date."
    },
    "Jam selesai harus diisi jika jam mulai diisi.": {
      id: "Jam selesai harus diisi jika jam mulai diisi. Lengkapi jam selesai atau kosongkan jam mulai.",
      en: "End time is required when a start time is set. Add an end time or clear the start time."
    },
    "Jam selesai harus lebih besar dari jam mulai.": {
      id: "Jam selesai harus lebih besar dari jam mulai. Pilih jam selesai yang lebih akhir.",
      en: "End time must be later than start time. Choose a later end time."
    }
  } as const;

  return errors.map((error) => messages[error as keyof typeof messages]?.[language] || error);
}

function TasksPageContent() {
  const { tasks, createTask, updateTask, deleteTask, notes, updateNote, settings } = useDashboardStore();
  const language = settings.language;
  const timeZone = settings.timeZone;
  const { confirm, showToast } = useAppFeedback();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTaskId = searchParams.get("taskId");
  const composeQuery = searchParams.get("compose") === "1";
  const statusQuery = getStatusFilterParam(searchParams.get("status"));
  const now = useNow();
  const [statusFilter, setStatusFilter] = useState<"Semua" | TaskStatus>(() => statusQuery || "Semua");
  const [priorityFilter, setPriorityFilter] = useState<"Semua" | TaskPriority>("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formExpanded, setFormExpanded] = useState(false);
  const pageSize = useResponsivePageSize();
  const [form, setForm] = useState(emptyTaskForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const text = {
    eyebrow: language === "id" ? "Pekerjaan" : "Work",
    title: language === "id" ? "Kelola Pekerjaan" : "Manage Work",
    description: language === "id" ? "Tambah, edit, hapus, filter, ubah status, dan kelola jam pekerjaan." : "Add, edit, delete, filter, update statuses, and manage work time windows.",
    edit: language === "id" ? "Edit Pekerjaan" : "Edit Work",
    add: language === "id" ? "Tambah Pekerjaan" : "Add Work",
    titleLabel: language === "id" ? "Judul" : "Title",
    descLabel: language === "id" ? "Deskripsi" : "Description",
    statusLabel: language === "id" ? "Status" : "Status",
    priorityLabel: language === "id" ? "Prioritas" : "Priority",
    startDate: language === "id" ? "Tanggal mulai" : "Start date",
    deadline: language === "id" ? "Deadline" : "Deadline",
    workTime: language === "id" ? "Jam pekerjaan" : "Work time",
    clearTime: language === "id" ? "Kosongkan jam" : "Clear time",
    optional: language === "id" ? "Opsional" : "Optional",
    timeHelp: language === "id" ? "Jam mulai opsional. Jika hanya jam selesai diisi, perhitungan dimulai dari 00:00 dan deadline mengikuti jam selesai." : "Start time is optional. If only an end time is set, the calculation starts from 00:00 and the deadline follows the end time.",
    save: language === "id" ? "Simpan perubahan" : "Save changes",
    addWork: language === "id" ? "Tambah pekerjaan" : "Add work",
    reset: "Reset",
    openForm: language === "id" ? "Tambah pekerjaan" : "Add work",
    closeForm: language === "id" ? "Tutup form" : "Close form",
    filterStatus: language === "id" ? "Filter status" : "Status filter",
    filterPriority: language === "id" ? "Filter prioritas" : "Priority filter",
    all: language === "id" ? "Semua" : "All",
    start: language === "id" ? "Mulai" : "Start",
    end: language === "id" ? "Selesai" : "End",
    added: language === "id" ? "berhasil ditambahkan." : "was added successfully.",
    deleted: language === "id" ? "dihapus." : "was deleted.",
    deletedOk: language === "id" ? "Pekerjaan berhasil dihapus." : "Work item deleted.",
    undo: language === "id" ? "Batalkan" : "Undo",
    completed: language === "id" ? "diselesaikan." : "was completed.",
    confirmTitle: language === "id" ? "Hapus pekerjaan?" : "Delete work item?",
    confirmDesc: (title: string) => language === "id" ? `Pekerjaan "${title}" akan dihapus permanen dari dashboard.` : `Work item "${title}" will be permanently removed from the dashboard.`,
    deleteLabel: language === "id" ? "Hapus" : "Delete"
  };

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({ ...emptyTaskForm, startDate: todayDate(timeZone), deadline: todayDate(timeZone) });
    setFormErrors([]);
  }, [timeZone]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const statusMatch = statusFilter === "Semua" || getEffectiveTaskStatus(task, Date.now(), timeZone) === statusFilter;
        const priorityMatch = priorityFilter === "Semua" || task.priority === priorityFilter;
        return statusMatch && priorityMatch;
      }),
    [priorityFilter, statusFilter, tasks, timeZone]
  );

  const paginatedTasks = useMemo(() => paginateItems(filteredTasks, currentPage, pageSize), [currentPage, filteredTasks, pageSize]);
  const linkedNotes = useMemo(() => editingId ? getLinkedNotes(notes, "work", editingId) : [], [editingId, notes]);

  const fieldErrors = useMemo(() => ({
    title: formErrors.find((error) => error.startsWith("Judul pekerjaan") || error.startsWith("Work title")) || null,
    description: formErrors.find((error) => error.startsWith("Deskripsi pekerjaan") || error.startsWith("Work description")) || null,
    deadline: formErrors.find((error) => error.startsWith("Deadline tidak") || error.startsWith("Deadline cannot")) || null,
    endTime: formErrors.find((error) => error.startsWith("Jam selesai") || error.startsWith("End time")) || null
  }), [formErrors]);

  useEffect(() => {
    if (!selectedTaskId && statusQuery && statusFilter !== statusQuery) {
      setStatusFilter(statusQuery);
    }
  }, [selectedTaskId, statusFilter, statusQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [priorityFilter, statusFilter]);

  useEffect(() => {
    if (currentPage !== paginatedTasks.currentPage) {
      setCurrentPage(paginatedTasks.currentPage);
    }
  }, [currentPage, paginatedTasks.currentPage]);

  useEffect(() => {
    if (!composeQuery) {
      return;
    }

    resetForm();
    setFormExpanded(true);
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => titleInputRef.current?.focus(), 180);
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("compose");
    params.delete("taskId");
    const query = params.toString();
    router.replace(query ? `/tasks?${query}` : "/tasks", { scroll: false });
  }, [composeQuery, resetForm, router, searchParams]);

  useEffect(() => {
    if (composeQuery || !selectedTaskId) {
      return;
    }

    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task) {
      return;
    }

    if (statusFilter !== "Semua") {
      setStatusFilter("Semua");
      return;
    }

    if (priorityFilter !== "Semua") {
      setPriorityFilter("Semua");
      return;
    }

    const targetIndex = tasks.findIndex((item) => item.id === task.id);
    const targetPage = Math.floor(targetIndex / pageSize) + 1;

    if (currentPage !== targetPage) {
      setCurrentPage(targetPage);
      return;
    }

    if (editingId !== task.id) {
      setFormExpanded(true);
      setEditingId(task.id);
      setForm({
        title: task.title,
        description: task.description,
        status: getEffectiveTaskStatus(task),
        priority: task.priority,
        startDate: task.startDate,
        deadline: task.deadline,
        startTime: task.startTime || "",
        endTime: task.endTime || ""
      });
      setFormErrors([]);
    }

    router.replace("/tasks", { scroll: false });
  }, [composeQuery, currentPage, editingId, priorityFilter, router, selectedTaskId, statusFilter, tasks, pageSize]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedForm = normalizeTaskForm(form, timeZone);
    const errors = validateTaskForm(normalizedForm);

    if (errors.length) {
      setFormErrors(translateTaskErrors(errors, language));
      return;
    }

    setFormErrors([]);
    const timestamp = nowIso();

    try {
      if (editingId) {
        const currentTask = tasks.find((task) => task.id === editingId);
        await updateTask(editingId, { ...normalizedForm, completedAt: normalizedForm.status === "Selesai" ? currentTask?.completedAt || timestamp : null });
      } else {
        const task = await createTask({ ...normalizedForm, completedAt: normalizedForm.status === "Selesai" ? timestamp : null });
        showToast({ message: (language === "id" ? "Pekerjaan" : "Work item") + " \"" + task.title + "\" " + text.added });
      }

      resetForm();
      setFormExpanded(false);
    } catch (error) {
      setFormErrors([error instanceof Error ? error.message : "Failed to save work item."]);
    }
  }

  function handleEdit(task: Task) {
    setFormExpanded(true);
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      status: getEffectiveTaskStatus(task),
      priority: task.priority,
      startDate: task.startDate,
      deadline: task.deadline,
      startTime: task.startTime || "",
      endTime: task.endTime || ""
    });
  }

  async function handleDelete(id: string) {
    const task = tasks.find((item) => item.id === id);
    const confirmed = await confirm({ title: text.confirmTitle, description: text.confirmDesc(task?.title || (language === "id" ? "ini" : "this item")), confirmLabel: text.deleteLabel, tone: "danger" });
    if (!confirmed) {
      return;
    }

    const affectedNoteIds = notes.filter((note) => note.linkedType === "work" && note.linkedId === id).map((note) => note.id);
    await deleteTask(id);
    if (editingId === id) {
      resetForm();
      setFormExpanded(false);
    }
    if (task) {
      showToast({ message: (language === "id" ? "Pekerjaan" : "Work item") + " \"" + task.title + "\" " + text.deleted, tone: "warning", durationMs: 10000, actionLabel: text.undo, onAction: () => { void createTask(task).then(() => Promise.all(affectedNoteIds.map((noteId) => updateNote(noteId, { linkedType: "work", linkedId: id })))); } });
    } else {
      showToast({ message: text.deletedOk });
    }
  }

  function handleStatusChange(id: string, status: TaskStatus) {
    const task = tasks.find((item) => item.id === id);
    const nextStatus = task ? normalizeTaskStatusForTime(status, task.startDate, task.startTime, now ?? Date.now(), timeZone) : status;
    const justCompleted = task && getEffectiveTaskStatus(task, now ?? Date.now()) !== "Selesai" && nextStatus === "Selesai";
    const timestamp = nowIso();
    const currentTask = tasks.find((item) => item.id === id);
    if (currentTask) {
      const normalizedStatus = normalizeTaskStatusForTime(status, currentTask.startDate, currentTask.startTime, now ?? Date.now(), timeZone);
      void updateTask(id, { status: normalizedStatus, completedAt: normalizedStatus === "Selesai" ? currentTask.completedAt || timestamp : null });
    }

    if (justCompleted && task) {
      showToast({ message: (language === "id" ? "Pekerjaan" : "Work item") + " \"" + task.title + "\" " + text.completed });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={text.eyebrow} title={text.title} description={text.description} language={language} timeZone={timeZone} />

      <button type="button" onClick={() => setFormExpanded((current) => !current)} className="inline-flex w-full items-center justify-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 md:hidden">
        <Plus className="h-4 w-4" />{formExpanded || editingId ? text.closeForm : text.openForm}
      </button>

      <section ref={formSectionRef} className={cn("rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-5", formExpanded || editingId ? "block" : "hidden md:block")}>
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-teal-700 dark:text-teal-300" />
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{editingId ? text.edit : text.add}</h2>
        </div>
                <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.titleLabel}</span>
            <input ref={titleInputRef} required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder={language === "id" ? "Tulis nama pekerjaan" : "Enter work title"} className={getFieldClassName({ filled: Boolean(form.title), error: Boolean(fieldErrors.title) })} />
            {fieldErrors.title ? <p className={getFieldMessageClassName("error")}>{fieldErrors.title}</p> : null}
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.descLabel}</span>
            <input required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder={language === "id" ? "Jelaskan pekerjaan secara singkat" : "Describe the work briefly"} className={getFieldClassName({ filled: Boolean(form.description), error: Boolean(fieldErrors.description) })} />
            {fieldErrors.description ? <p className={getFieldMessageClassName("error")}>{fieldErrors.description}</p> : null}
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.statusLabel}</span>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))} className={getFieldClassName({ filled: Boolean(form.status) })}>
              {taskFormStatuses.map((status) => <option key={status} value={status}>{tTaskStatus(status, language)}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.priorityLabel}</span>
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))} className={getFieldClassName({ filled: Boolean(form.priority) })}>
              {taskPriorities.map((priority) => <option key={priority} value={priority}>{tPriority(priority, language)}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.startDate}</span>
            <input type="date" required value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className={getFieldClassName({ filled: Boolean(form.startDate) })} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.deadline}</span>
            <input type="date" required value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className={getFieldClassName({ filled: Boolean(form.deadline), error: Boolean(fieldErrors.deadline) })} />
            {fieldErrors.deadline ? <p className={getFieldMessageClassName("error")}>{fieldErrors.deadline}</p> : null}
          </label>
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.workTime}</p>
              <button type="button" onClick={() => setForm((current) => ({ ...current, startTime: "", endTime: "" }))} className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">{text.clearTime}</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TimePicker id="task-start-time" label={text.start} value={form.startTime} onChange={(startTime) => setForm((current) => ({ ...current, startTime }))} placeholder={text.optional} allowClear language={language} />
              <TimePicker id="task-end-time" label={text.end} value={form.endTime} onChange={(endTime) => setForm((current) => ({ ...current, endTime }))} placeholder={text.optional} allowClear language={language} error={fieldErrors.endTime} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{text.timeHelp}</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"><Save className="h-4 w-4" />{editingId ? text.save : text.addWork}</button>
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"><RotateCcw className="h-4 w-4" />{text.reset}</button>
          </div>
        </form>
        {editingId ? <div className="mt-5"><LinkedNotesPanel notes={linkedNotes} linkedType="work" linkedId={editingId} language={language} /></div> : null}
      </section>

      <section className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.filterStatus}</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "Semua" | TaskStatus)} className={getFieldClassName({ filled: Boolean(statusFilter) })}>
            <option value="Semua">{text.all}</option>
            {taskFormStatuses.map((status) => <option key={status} value={status}>{tTaskStatus(status, language)}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.filterPriority}</span>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as "Semua" | TaskPriority)} className={getFieldClassName({ filled: Boolean(priorityFilter) })}>
            <option value="Semua">{text.all}</option>
            {taskPriorities.map((priority) => <option key={priority} value={priority}>{tPriority(priority, language)}</option>)}
          </select>
        </label>
      </section>

      <TaskTable tasks={paginatedTasks.items} now={now} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} language={language} timeZone={timeZone} />
      <Pagination currentPage={paginatedTasks.currentPage} totalPages={paginatedTasks.totalPages} totalItems={paginatedTasks.totalItems} startItem={paginatedTasks.startItem} endItem={paginatedTasks.endItem} onPageChange={setCurrentPage} language={language} />
    </div>
  );
}

export default function TasksPage() {
  return <Suspense fallback={null}><TasksPageContent /></Suspense>;
}
