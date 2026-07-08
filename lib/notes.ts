import type { Activity, AppLanguage, Note, NoteCategory, NoteLinkedType, Routine, Task } from "@/lib/types";

export type NoteFilterValue = "all" | NoteCategory | "pinned";

export const noteCategories: NoteCategory[] = ["work", "activity", "routine", "personal"];
export const noteLinkedTypes: Array<Exclude<NoteLinkedType, null>> = ["work", "activity", "routine"];

export function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    if (a.updatedAt !== b.updatedAt) {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    }

    return a.title.localeCompare(b.title);
  });
}

export function normalizeNoteTags(value: string) {
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
}

export function stringifyNoteTags(tags: string[]) {
  return tags.join(", ");
}

export function translateNoteValidationErrors(errors: string[], language: AppLanguage) {
  const map = {
    "Judul catatan minimal 3 karakter.": {
      id: "Judul catatan minimal 3 karakter. Tambahkan judul yang menjelaskan isi catatan.",
      en: "Note title must be at least 3 characters. Add a title that explains the note."
    },
    "Isi catatan minimal 5 karakter.": {
      id: "Isi catatan minimal 5 karakter. Tambahkan konteks singkat agar catatan mudah dipahami.",
      en: "Note content must be at least 5 characters. Add a bit more context so the note is clear."
    },
    "Tipe link dan item link harus diisi bersamaan.": {
      id: "Tipe link dan item link harus diisi bersamaan. Pilih jenis item lalu tentukan item yang terhubung.",
      en: "Linked type and linked item must be set together. Pick a linked type and then choose the linked item."
    },
    "Tag tidak boleh kosong.": {
      id: "Tag tidak boleh kosong. Hapus koma berlebih atau isi setiap tag dengan teks.",
      en: "Tags cannot be empty. Remove extra commas or give each tag a value."
    },
    "Item yang dihubungkan tidak ditemukan.": {
      id: "Item yang dihubungkan tidak ditemukan. Pilih item lain yang masih tersedia.",
      en: "The linked item could not be found. Choose another item that still exists."
    }
  } as const;

  return errors.map((error) => map[error as keyof typeof map]?.[language] || error);
}

export function matchesNoteFilter(note: Note, searchQuery: string, filter: NoteFilterValue) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const haystack = [note.title, note.content, note.category, ...note.tags].join("\n").toLowerCase();
  const searchMatch = !normalizedSearch || haystack.includes(normalizedSearch);
  const filterMatch = filter === "all" ? true : filter === "pinned" ? note.isPinned : note.category === filter;
  return searchMatch && filterMatch;
}

export function getNoteCategoryLabel(category: NoteCategory, language: AppLanguage) {
  const labels: Record<NoteCategory, { en: string; id: string }> = {
    work: { en: "Work", id: "Pekerjaan" },
    activity: { en: "Activity", id: "Aktivitas" },
    routine: { en: "Routine", id: "Rutinitas" },
    personal: { en: "Personal", id: "Personal" }
  };

  return labels[category][language];
}

export function getNoteLinkedTypeLabel(linkedType: Exclude<NoteLinkedType, null>, language: AppLanguage) {
  return getNoteCategoryLabel(linkedType, language);
}

export function findLinkedItemTitle(
  linkedType: NoteLinkedType,
  linkedId: string | null,
  tasks: Task[],
  activities: Activity[],
  routines: Routine[]
) {
  if (!linkedType || !linkedId) {
    return null;
  }

  if (linkedType === "work") {
    return tasks.find((item) => item.id === linkedId)?.title || null;
  }

  if (linkedType === "activity") {
    return activities.find((item) => item.id === linkedId)?.title || null;
  }

  return routines.find((item) => item.id === linkedId)?.title || null;
}

export function getLinkedItemHref(linkedType: NoteLinkedType, linkedId: string | null) {
  if (!linkedType || !linkedId) {
    return null;
  }

  if (linkedType === "work") {
    return `/tasks?taskId=${linkedId}`;
  }

  if (linkedType === "activity") {
    return `/activities?activityId=${linkedId}`;
  }

  return `/routines?routineId=${linkedId}`;
}

export function linkedItemExists(linkedType: NoteLinkedType, linkedId: string | null, tasks: Task[], activities: Activity[], routines: Routine[]) {
  return Boolean(findLinkedItemTitle(linkedType, linkedId, tasks, activities, routines));
}

export function getLinkedNotes(notes: Note[], linkedType: Exclude<NoteLinkedType, null>, linkedId: string) {
  return sortNotes(notes.filter((note) => note.linkedType === linkedType && note.linkedId === linkedId));
}

export function unlinkNotesForTarget(notes: Note[], linkedType: Exclude<NoteLinkedType, null>, linkedId: string, updatedAt: string) {
  return notes.map((note) => {
    if (note.linkedType !== linkedType || note.linkedId !== linkedId) {
      return note;
    }

    return {
      ...note,
      linkedType: null,
      linkedId: null,
      updatedAt
    } satisfies Note;
  });
}

export function relinkNotesForTarget(
  notes: Note[],
  noteIds: string[],
  linkedType: Exclude<NoteLinkedType, null>,
  linkedId: string,
  updatedAt: string
) {
  const ids = new Set(noteIds);
  return notes.map((note) => {
    if (!ids.has(note.id)) {
      return note;
    }

    return {
      ...note,
      linkedType,
      linkedId,
      updatedAt
    } satisfies Note;
  });
}
