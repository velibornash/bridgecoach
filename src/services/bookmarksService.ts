/**
 * Bookmarks (Sprint 58 §14, §19).
 *
 * Backed by /api/bookmarks, so a bookmark survives a reload. The previous
 * implementation read `mockBookmarks` and could not save anything.
 */
import { apiFetchSafe } from "./api";

export interface BookmarkRecord {
  id: string;
  lessonId: string | null;
  type: string;
  refId: string | null;
  title: string;
  description: string;
  position: number;
  createdAt: string;
}

export async function fetchBookmarks(): Promise<{
  data: BookmarkRecord[] | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<{ bookmarks: BookmarkRecord[] }>("/api/bookmarks");
  return result.data
    ? { data: result.data.bookmarks, error: null, status: 200 }
    : { data: null, error: result.error, status: result.status };
}

export async function createBookmark(input: {
  title: string;
  description?: string;
  lessonId?: string;
  type?: string;
  refId?: string;
  position?: number;
}) {
  return apiFetchSafe<BookmarkRecord>("/api/bookmarks", { method: "POST", body: input });
}

export async function deleteBookmark(id: string) {
  return apiFetchSafe<{ id: string; deleted: boolean }>(`/api/bookmarks/${id}`, {
    method: "DELETE",
  });
}
