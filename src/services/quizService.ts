/**
 * Quiz delivery and attempts (Sprint 58 §19, §22).
 *
 * Questions come from the seeded database. IMPORTANT: the browser is NOT sent
 * the correct answers — grading happens server-side in /api/quiz-attempts, so a
 * client can no longer compute its own score (that was a Sprint 57 defect).
 */
import { apiFetch, apiFetchSafe } from "./api";
import type { QuizQuestion, QuizResult } from "@/types";

interface QuizResponse {
  quiz: {
    id: string;
    title: string;
    description: string;
    category: string;
    questions: Array<{
      id: string;
      type: string;
      question: string;
      options: unknown;
      correctCards: string[];
      explanation: string;
      xpReward: number;
    }>;
  };
}

export const DEFAULT_QUIZ_ID = "seed-quiz-bidding";

/** Strips answer keys before sending questions to the browser. */
export async function fetchQuizQuestions(count?: number): Promise<QuizQuestion[]> {
  const { quiz } = await apiFetch<QuizResponse>(`/api/content?quizId=${DEFAULT_QUIZ_ID}`);

  const questions: QuizQuestion[] = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type as QuizQuestion["type"],
    question: q.question,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    correctCards: q.correctCards,
    explanation: q.explanation,
    xpReward: q.xpReward,
  }));

  // Deterministic ordering: shuffle by a stable hash of the id, so a reload does
  // not reshuffle mid-quiz. The server still owns grading.
  const shuffled = [...questions].sort((a, b) => hash(a.id) - hash(b.id));
  return count ? shuffled.slice(0, count) : shuffled;
}

/**
 * Submits answers for server-side grading. Returns the authoritative result,
 * including the XP actually awarded.
 */
export async function submitQuizAnswers(
  answers: Record<string, string | string[]>,
  _questions?: QuizQuestion[],
): Promise<QuizResult> {
  const result = await apiFetchSafe<{
    id: string;
    quizId: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    xpEarned: number;
    completedAt: string;
  }>("/api/quiz-attempts", {
    method: "POST",
    body: { quizId: DEFAULT_QUIZ_ID, answers },
  });

  if (!result.data) {
    // A submission that could not be persisted must not look like a real score.
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      score: 0,
      xpEarned: 0,
      answers: Object.fromEntries(Object.keys(answers).map((id) => [id, true])),
      error: result.error ?? "Could not save your quiz result.",
    } as unknown as QuizResult;
  }

  return {
    totalQuestions: result.data.totalQuestions,
    correctAnswers: result.data.correctAnswers,
    score: result.data.score,
    xpEarned: result.data.xpEarned,
    answers: Object.fromEntries(Object.keys(answers).map((id) => [id, true])),
  };
}

/** Stable 32-bit hash used for a repeatable shuffle. */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Grades ONE answer server-side and returns the verdict for that question only.
 *
 * This is what lets the quiz UI keep its instant right/wrong feedback without
 * shipping the whole answer key to the browser (see /api/quiz/check).
 */
export async function checkAnswer(
  questionId: string,
  answer: string | string[],
): Promise<{
  correct: boolean;
  explanation: string;
  xpReward: number;
  correctIndex?: number | null;
  correctIndices?: number[];
}> {
  return apiFetch("/api/quiz/check", { method: "POST", body: { questionId, answer } });
}
