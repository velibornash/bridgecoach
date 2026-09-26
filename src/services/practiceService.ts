/**
 * Practice sessions (Sprint 60 follow-up).
 *
 * `/api/practice` was built in Sprint 58 — `PracticeSession` and
 * `PracticeAction` rows, action-level engine feedback, a score. The `/practice`
 * page never called it. Every drill started, was played, and vanished on
 * refresh, and the Player Model had nothing to mine.
 *
 * The page is a sandbox, so the recording is deliberately forgiving: a session is
 * saved when the user leaves the drill or ends it, carrying whatever actions were
 * played. A drill abandoned halfway is still evidence of what was attempted,
 * which is exactly what a skill model needs.
 */
import { apiFetchSafe } from "./api";

export type PracticePhase = "bidding" | "lead" | "play" | "defence";

export interface PracticeActionInput {
  phase: string;
  player?: string | null;
  call?: string | null;
  card?: string | null;
  isCorrect?: boolean | null;
  engineFeedback?: string | null;
}

export interface PracticeSessionSummary {
  id: string;
  startedAt: string;
  completed: boolean;
  score: number | null;
  maxScore: number | null;
  actions: number;
}

export async function recordPracticeSession(input: {
  actions: PracticeActionInput[];
  isComplete: boolean;
  score?: number;
  maxScore?: number;
  durationMs?: number;
}): Promise<{ data: PracticeSessionSummary | null; error: string | null }> {
  const result = await apiFetchSafe<{ session: PracticeSessionSummary }>("/api/practice", {
    method: "POST",
    body: input,
  });
  return { data: result.data?.session ?? null, error: result.data ? null : result.error };
}

export async function fetchPracticeHistory(): Promise<{
  data: PracticeSessionSummary[];
  error: string | null;
}> {
  const result = await apiFetchSafe<{ sessions: PracticeSessionSummary[] }>("/api/practice");
  return { data: result.data?.sessions ?? [], error: result.data ? null : result.error };
}
