/**
 * Notes (Sprint 58 §14, §19).
 *
 * The /notes page previously seeded `useState` from `mockAllNotes`, so every
 * create/edit/delete vanished on refresh. These helpers talk to /api/notes, and
 * the page re-reads after each mutation so what it shows always matches the
 * database.
 */
import { apiFetch, apiFetchSafe } from "./api";

export interface NoteRecord {
  id: string;
  lessonId: string | null;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchNotes(): Promise<{
  data: NoteRecord[] | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<{ notes: NoteRecord[] }>("/api/notes");
  return result.data
    ? { data: result.data.notes, error: null, status: 200 }
    : { data: null, error: result.error, status: result.status };
}

export async function createNote(input: {
  title: string;
  content: string;
  lessonId?: string;
  tags?: string[];
}) {
  return apiFetchSafe<NoteRecord>("/api/notes", { method: "POST", body: input });
}

export async function updateNote(
  id: string,
  input: { title?: string; content?: string; tags?: string[]; pinned?: boolean },
) {
  return apiFetchSafe<NoteRecord>(`/api/notes/${id}`, { method: "PATCH", body: input });
}

export async function deleteNote(id: string) {
  return apiFetchSafe<{ id: string; deleted: boolean }>(`/api/notes/${id}`, {
    method: "DELETE",
  });
}

/** Throws on failure so a caller cannot silently show an unsaved state. */
export async function createNoteOrThrow(input: {
  title: string;
  content: string;
}) {
  return apiFetch<NoteRecord>("/api/notes", { method: "POST", body: input });
}
