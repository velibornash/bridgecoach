import { mockQuizQuestions } from "./mockData";
import { mockApiCall, simulateDelay } from "./api";
import type { QuizQuestion, QuizResult } from "@/types";

export async function fetchQuizQuestions(count?: number) {
  await simulateDelay();
  const shuffled = [...mockQuizQuestions].sort(() => Math.random() - 0.5);
  const questions = count ? shuffled.slice(0, count) : shuffled;
  return mockApiCall(questions);
}

export async function submitQuizAnswers(
  answers: Record<string, string | string[]>,
  questions: QuizQuestion[]
) {
  await simulateDelay(500);
  let correct = 0;
  for (const q of questions) {
    const answer = answers[q.id];
    if (!answer) continue;
    if (q.type === "single") {
      const idx = parseInt(answer as string, 10);
      if (idx === q.correctIndex) correct++;
    } else if (q.type === "multiple" && Array.isArray(answer)) {
      const correctSet = new Set(q.correctIndices!);
      const answerNums = answer.map((a) => parseInt(a, 10));
      if (
        answerNums.length === q.correctIndices!.length &&
        answerNums.every((a) => correctSet.has(a))
      ) correct++;
    }
  }
  const total = questions.length;
  const result: QuizResult = {
    totalQuestions: total,
    correctAnswers: correct,
    score: Math.round((correct / total) * 100),
    xpEarned: correct * 20,
    answers: Object.fromEntries(questions.map((q) => [q.id, answers[q.id] !== undefined])),
  };
  return mockApiCall(result);
}
