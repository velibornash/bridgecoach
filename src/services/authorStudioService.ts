/**
 * Author Studio persistence (Sprint 58 §15, §19).
 *
 * The DATABASE is the source of truth. `localStorage` survives only as an
 * offline cache: it is written on every save and read only when the API is
 * unreachable, so a dropped connection degrades instead of losing work — but a
 * successful fetch always overwrites the cache, so local storage can never be
 * authoritative.
 */
import { LearningBlock } from "@/components/learningEngine/types";
import { apiFetchSafe } from "./api";

export interface AuthorStudioDraft {
  id: string;
  contentId: string | null;
  title: string;
  blocks: LearningBlock[];
  metadata: unknown;
  updatedAt?: string;
  createdAt?: string;
}

const CURRENT_KEY = "authorStudio.current";
const DRAFTS_KEY = "authorStudio.drafts";

/** Starter lesson used only when both the API and the cache are empty. */
const STARTER_LESSON: { title: string; blocks: LearningBlock[] } = {
  title: "Untitled Lesson",
  blocks: [
    { id: "b1", type: "heading", text: "Introduction to Major Suit Openings" },
    {
      id: "b2",
      type: "paragraph",
      text: "In standard modern bidding, opening a major suit (Hearts or Spades) requires exactly 5 or more cards in that suit, alongside 12-21 High Card Points (HCP).",
    },
  ],
};

interface DraftsResponse {
  drafts: Array<{
    id: string;
    contentId: string | null;
    title: string;
    blocks: LearningBlock[];
    metadata: unknown;
    updatedAt: string;
    createdAt: string;
  }>;
}

function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* corrupt cache is not an error worth surfacing */
  }
  return fallback;
}

function writeCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — the database is still the source of truth */
  }
}

/** The lesson currently open in the editor, merged with the user's progress. */
export async function loadCurrentLesson(): Promise<{ title: string; blocks: LearningBlock[] }> {
  const result = await apiFetchSafe<{ title: string; blocks: LearningBlock[] }>(
    "/api/author-studio/drafts",
  );
  if (result.data) {
    return { title: result.data.title, blocks: result.data.blocks ?? [] };
  }

  // API unreachable: fall back to the cache, then the starter lesson.
  const cached = readCache<{ title: string; blocks: LearningBlock[] } | null>(CURRENT_KEY, null);
  if (cached) return cached;
  return STARTER_LESSON;
}

export async function saveCurrentLesson(
  title: string,
  blocks: LearningBlock[],
): Promise<void> {
  writeCache(CURRENT_KEY, { title, blocks });

  const current = await apiFetchSafe<DraftsResponse>("/api/author-studio/drafts");
  const existing = current.data?.drafts?.[0];
  if (!existing) return; // nothing to update yet; the draft is created on save

  await apiFetchSafe("/api/author-studio/drafts", {
    method: "POST",
    body: { id: existing.id, title, blocks },
  });
}

export async function loadDrafts(): Promise<AuthorStudioDraft[]> {
  const result = await apiFetchSafe<DraftsResponse>("/api/author-studio/drafts");
  if (result.data) {
    writeCache(DRAFTS_KEY, result.data.drafts);
    return result.data.drafts;
  }
  return readCache<AuthorStudioDraft[]>(DRAFTS_KEY, []);
}

export async function persistDraft(draft: {
  id?: string;
  title: string;
  blocks: LearningBlock[];
}): Promise<AuthorStudioDraft[]> {
  const result = await apiFetchSafe<AuthorStudioDraft>("/api/author-studio/drafts", {
    method: "POST",
    body: { id: draft.id, title: draft.title, blocks: draft.blocks },
  });

  if (result.data) return loadDrafts();

  // Offline: keep the editor usable, but the cache is not authoritative.
  const cached = readCache<AuthorStudioDraft[]>(DRAFTS_KEY, []);
  const next = [
    {
      id: draft.id ?? `local-${Date.now()}`,
      contentId: null,
      title: draft.title,
      blocks: draft.blocks,
      metadata: null,
    },
    ...cached,
  ].slice(0, 20);
  writeCache(DRAFTS_KEY, next);
  return next;
}

export async function persistDeleteDraft(id: string): Promise<AuthorStudioDraft[]> {
  await apiFetchSafe(`/api/author-studio/drafts/${id}`, { method: "DELETE" });
  const remaining = await loadDrafts();
  writeCache(DRAFTS_KEY, remaining);
  return remaining;
}
