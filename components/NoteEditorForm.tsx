"use client";

import type { ChangeEventHandler, ReactNode } from "react";
import type { Activity, AppLanguage, NoteCategory, NoteLinkedType, Routine, Task } from "@/lib/types";
import { getFieldClassName, getFieldMessageClassName } from "@/lib/field-styles";
import { noteCategories, noteLinkedTypes, stringifyNoteTags, getNoteCategoryLabel, getNoteLinkedTypeLabel } from "@/lib/notes";

export interface NoteEditorState {
  title: string;
  content: string;
  category: NoteCategory;
  linkedType: NoteLinkedType;
  linkedId: string;
  tagsText: string;
  isPinned: boolean;
}

interface NoteEditorFormProps {
  form: NoteEditorState;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  onSubmit: () => void;
  tasks: Task[];
  activities: Activity[];
  routines: Routine[];
  errors: string[];
  submitLabel: string;
  language: AppLanguage;
  footer?: ReactNode;
}

function pickFieldError(errors: string[], prefixes: string[]) {
  return errors.find((error) => prefixes.some((prefix) => error.startsWith(prefix) || error.includes(prefix))) || null;
}

export function NoteEditorForm({ form, onChange, onSubmit, tasks, activities, routines, errors, submitLabel, language, footer }: NoteEditorFormProps) {
  const linkedOptions = form.linkedType === "work" ? tasks : form.linkedType === "activity" ? activities : form.linkedType === "routine" ? routines : [];
  const fieldErrors = {
    title: pickFieldError(errors, ["Judul catatan", "Note title"]),
    content: pickFieldError(errors, ["Isi catatan", "Note content"]),
    linkedType: pickFieldError(errors, ["Tipe link", "Linked type"]),
    linkedId: pickFieldError(errors, ["Item yang dihubungkan", "The linked item"]),
    tags: pickFieldError(errors, ["Tag tidak", "Tags cannot"])
  } as const;

  return (
    <div className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Judul" : "Title"}</span>
        <input name="title" value={form.title} onChange={onChange} placeholder={language === "id" ? "Tulis judul catatan" : "Enter note title"} className={getFieldClassName({ filled: Boolean(form.title), error: Boolean(fieldErrors.title) })} />
        {fieldErrors.title ? <p className={getFieldMessageClassName("error")}>{fieldErrors.title}</p> : null}
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Isi catatan" : "Note content"}</span>
        <textarea name="content" value={form.content} onChange={onChange} placeholder={language === "id" ? "Tulis isi catatan" : "Write your note"} className={getFieldClassName({ filled: Boolean(form.content), error: Boolean(fieldErrors.content) }) + " min-h-40"} />
        {fieldErrors.content ? <p className={getFieldMessageClassName("error")}>{fieldErrors.content}</p> : null}
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Kategori" : "Category"}</span>
          <select name="category" value={form.category} onChange={onChange} className={getFieldClassName({ filled: Boolean(form.category) })}>
            {noteCategories.map((category) => <option key={category} value={category}>{getNoteCategoryLabel(category, language)}</option>)}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Link ke" : "Link to"}</span>
          <select name="linkedType" value={form.linkedType || ""} onChange={onChange} className={getFieldClassName({ filled: Boolean(form.linkedType), error: Boolean(fieldErrors.linkedType) })}>
            <option value="">{language === "id" ? "Tidak terhubung" : "Not linked"}</option>
            {noteLinkedTypes.map((linkedType) => <option key={linkedType} value={linkedType}>{getNoteLinkedTypeLabel(linkedType, language)}</option>)}
          </select>
          {fieldErrors.linkedType ? <p className={getFieldMessageClassName("error")}>{fieldErrors.linkedType}</p> : null}
        </label>
      </div>

      {form.linkedType ? (
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Item terhubung" : "Linked item"}</span>
          <select name="linkedId" value={form.linkedId} onChange={onChange} className={getFieldClassName({ filled: Boolean(form.linkedId), error: Boolean(fieldErrors.linkedId) })}>
            <option value="">{language === "id" ? "Pilih item" : "Select item"}</option>
            {linkedOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          {fieldErrors.linkedId ? <p className={getFieldMessageClassName("error")}>{fieldErrors.linkedId}</p> : null}
        </label>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Tags" : "Tags"}</span>
        <input name="tagsText" value={form.tagsText} onChange={onChange} placeholder={language === "id" ? "contoh: ide, penting, follow-up" : "example: idea, important, follow-up"} className={getFieldClassName({ filled: Boolean(form.tagsText), error: Boolean(fieldErrors.tags) })} />
        {fieldErrors.tags ? <p className={getFieldMessageClassName("error")}>{fieldErrors.tags}</p> : null}
        {form.tagsText ? <p className={getFieldMessageClassName()}>{language === "id" ? "Preview tags:" : "Tag preview:"} {stringifyNoteTags(form.tagsText.split(',').map((item) => item.trim()).filter(Boolean))}</p> : null}
      </label>

      <label className="inline-flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
        <input type="checkbox" name="isPinned" checked={form.isPinned} onChange={onChange} className="h-4 w-4 accent-teal-700" />
        <span>{language === "id" ? "Sematkan note ini" : "Pin this note"}</span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onSubmit} className="inline-flex items-center rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">{submitLabel}</button>
        {footer}
      </div>
    </div>
  );
}
