import { LearningBlock } from "@/components/learningEngine/types";

export interface AuthorStudioDraft {
  id: string;
  title: string;
  updatedAt: number;
  blocks: LearningBlock[];
}

const CURRENT_KEY = "authorStudio.current";
const DRAFTS_KEY = "authorStudio.drafts";

export function loadCurrentLesson(): { title: string; blocks: LearningBlock[] } {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt storage */
  }
  return {
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
}

export function saveCurrentLesson(title: string, blocks: LearningBlock[]): void {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ title, blocks }));
  } catch {
    /* storage may be unavailable in private mode */
  }
}

export function loadDrafts(): AuthorStudioDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt storage */
  }
  return [];
}

export function persistDraft(draft: AuthorStudioDraft): AuthorStudioDraft[] {
  const next = [draft, ...loadDrafts()].slice(0, 20);
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable in private mode */
  }
  return next;
}

export function persistDeleteDraft(id: string): AuthorStudioDraft[] {
  const next = loadDrafts().filter((d) => d.id !== id);
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable in private mode */
  }
  return next;
}
