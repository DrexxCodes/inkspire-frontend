import type { WorkDto } from "@/types/api";

export interface EditorFields {
  title: string;
  description: string;
  categoryId: string;
  content: string;
}

export const EMPTY_FIELDS: EditorFields = { title: "", description: "", categoryId: "", content: "" };

export const fieldsEqual = (a: EditorFields, b: EditorFields) =>
  a.title === b.title && a.description === b.description && a.categoryId === b.categoryId && a.content === b.content;

export interface FieldProblems {
  title?: string;
  categoryId?: string;
  content?: string;
}

/** Cheap client side checks. The backend repeats them and also enforces size limits. */
export function validateFields(f: EditorFields): FieldProblems {
  const p: FieldProblems = {};
  if (!f.title.trim()) p.title = "Give your work a title.";
  else if (f.title.length > 150) p.title = "Keep the title under 150 characters.";
  if (!f.categoryId) p.categoryId = "Choose a category.";
  if (!f.content.trim()) p.content = "Write something before you save.";
  return p;
}

export const hasProblems = (p: FieldProblems) => Object.keys(p).length > 0;

/**
 * Editing an older checkpoint creates a new revision that is NOT current by default.
 * The author must be told, and offered the choice to promote it.
 */
export function isEditingCheckpoint(editingRevisionId: string | null, currentRevisionId: string | undefined): boolean {
  return !!editingRevisionId && !!currentRevisionId && editingRevisionId !== currentRevisionId;
}

export type SaveAction = "save" | "ask-checkpoint";

export function planSave(editingRevisionId: string | null, currentRevisionId: string | undefined): SaveAction {
  return isEditingCheckpoint(editingRevisionId, currentRevisionId) ? "ask-checkpoint" : "save";
}

/** A flagged work can only be sent for review once the author has saved a new revision after the flag. */
export function canRequestReview(work: Pick<WorkDto, "status" | "moderationStatus">, dirty: boolean): boolean {
  if (work.status !== "flagged") return false;
  if (dirty) return false;
  return work.moderationStatus === "flagged" || work.moderationStatus === "rejected";
}

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function statusLabel(state: SaveState, savedAt: Date | null): string {
  switch (state) {
    case "saving":
      return "Saving draft";
    case "saved":
      return savedAt ? `Draft saved at ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Draft saved";
    case "dirty":
      return "Unsaved changes";
    case "error":
      return "Could not save draft. Retrying when you type";
    default:
      return "";
  }
}
