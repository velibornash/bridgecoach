/**
 * Search client (Sprint 60 follow-up).
 *
 * Replaces the fixture index. Results come back ranked from the server, so the
 * page does not re-sort them — re-sorting client-side would discard the
 * database's ordering and its case-insensitive match against lesson bodies.
 */
import { apiFetchSafe } from "./api";

export type SearchKind = "lessons" | "quizzes" | "courses";

export interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  description: string;
  href: string;
  score: number;
}

/** How much of each kind exists, for the idle state. */
export async function fetchLibraryCounts(): Promise<{
  data: { lessons: number; quizzes: number; courses: number } | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<{ lessons: number; quizzes: number; courses: number }>(
    "/api/search/counts",
  );
  return {
    data: result.data,
    error: result.data ? null : result.error,
    status: result.status,
  };
}

export async function runSearch(query: string): Promise<{
  results: SearchHit[];
  error: string | null;
}> {
  const result = await apiFetchSafe<{ results: SearchHit[]; total: number }>(
    `/api/search?q=${encodeURIComponent(query)}`,
  );
  if (result.error) return { results: [], error: result.error };
  return { results: result.data?.results ?? [], error: null };
}
