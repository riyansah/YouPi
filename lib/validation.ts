import type { Activity, Note, Routine, Task } from "@/lib/types";

export type TaskFormInput = Pick<Task, "title" | "description" | "status" | "priority" | "startDate" | "deadline" | "startTime" | "endTime">;
export type ActivityFormInput = Pick<
  Activity,
  "title" | "category" | "date" | "startTime" | "endTime" | "status" | "notes"
>;
export type RoutineFormInput = Pick<Routine, "title" | "days" | "startTime" | "endTime" | "priority" | "notes">;
export type NoteFormInput = Pick<Note, "title" | "content" | "category" | "linkedType" | "linkedId" | "tags" | "isPinned">;

export function validateTaskForm(input: TaskFormInput) {
  const errors: string[] = [];

  if (input.title.trim().length < 3) {
    errors.push("Judul pekerjaan minimal 3 karakter.");
  }

  if (input.description.trim().length < 5) {
    errors.push("Deskripsi pekerjaan minimal 5 karakter.");
  }

  if (input.deadline < input.startDate) {
    errors.push("Deadline tidak boleh lebih awal dari tanggal mulai.");
  }

  const hasStartTime = Boolean(input.startTime);
  const hasEndTime = Boolean(input.endTime);

  if (hasStartTime && !hasEndTime) {
    errors.push("Jam selesai harus diisi jika jam mulai diisi.");
  }

  if (hasEndTime && input.endTime! <= (input.startTime || "00:00")) {
    errors.push("Jam selesai harus lebih besar dari jam mulai.");
  }

  return errors;
}

export function validateActivityForm(input: ActivityFormInput) {
  const errors: string[] = [];

  if (input.title.trim().length < 3) {
    errors.push("Judul aktivitas minimal 3 karakter.");
  }

  if (input.endTime <= input.startTime) {
    errors.push("Waktu selesai harus lebih besar dari waktu mulai.");
  }

  return errors;
}

export function validateRoutineForm(input: RoutineFormInput) {
  const errors: string[] = [];

  if (input.title.trim().length < 3) {
    errors.push("Judul rutinitas minimal 3 karakter.");
  }

  if (!input.days.length) {
    errors.push("Pilih minimal satu hari untuk rutinitas.");
  }

  if (input.endTime <= input.startTime) {
    errors.push("Waktu selesai harus lebih besar dari waktu mulai.");
  }

  return errors;
}


export function validateNoteForm(input: NoteFormInput) {
  const errors: string[] = [];

  if (input.title.trim().length < 3) {
    errors.push("Judul catatan minimal 3 karakter.");
  }

  if (input.content.trim().length < 5) {
    errors.push("Isi catatan minimal 5 karakter.");
  }

  if ((input.linkedType && !input.linkedId) || (!input.linkedType && input.linkedId)) {
    errors.push("Tipe link dan item link harus diisi bersamaan.");
  }

  if (input.tags.some((tag) => !tag.trim())) {
    errors.push("Tag tidak boleh kosong.");
  }

  return errors;
}
