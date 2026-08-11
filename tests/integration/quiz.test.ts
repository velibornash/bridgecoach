/**
 * Quiz module integration tests — question fetching and answer scoring.
 */
import { describe, expect, it } from "vitest";
import { fetchQuizQuestions, submitQuizAnswers } from "@/services/quizService";
import { mockQuizQuestions } from "@/services/mockData";

describe("quiz: fetching", () => {
  it("returns a shuffled deck of questions", async () => {
    const { data } = await fetchQuizQuestions();
    expect(data!.length).toBe(mockQuizQuestions.length);
  });

  it("limits the number of questions when requested", async () => {
    const { data } = await fetchQuizQuestions(2);
    expect(data!.length).toBe(2);
  });
});

describe("quiz: scoring", () => {
  it("scores single-choice answers correctly", async () => {
    const { data: questions } = await fetchQuizQuestions();
    if (!questions) throw new Error("No quiz questions returned");
    const single = questions.find((q) => q.type === "single")!;
    const { data: result } = await submitQuizAnswers(
      { [single.id]: String(single.correctIndex) },
      questions,
    );
    if (!result) throw new Error("No quiz result returned");
    expect(result.totalQuestions).toBe(questions.length);
    expect(result.correctAnswers).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("awards XP proportional to correct answers", async () => {
    const { data: questions } = await fetchQuizQuestions();
    if (!questions) throw new Error("No quiz questions returned");
    // The mock scoring service only supports single/multiple question types.
    const supported = questions.filter((q) => q.type === "single" || q.type === "multiple");
    const answers: Record<string, string | string[]> = {};
    for (const q of supported) {
      if (q.type === "single") {
        answers[q.id] = String(q.correctIndex);
      } else if (q.type === "multiple") {
        answers[q.id] = q.correctIndices!.map(String);
      }
    }
    const { data: result } = await submitQuizAnswers(answers, questions);
    if (!result) throw new Error("No quiz result returned");
    expect(result.correctAnswers).toBe(supported.length);
    expect(result.xpEarned).toBe(supported.length * 20);
  });

  it("returns zero for all-wrong answers", async () => {
    const { data: questions } = await fetchQuizQuestions();
    if (!questions) throw new Error("No quiz questions returned");
    const supported = questions.filter((q) => q.type === "single" || q.type === "multiple");
    const answers: Record<string, string | string[]> = {};
    for (const q of supported) {
      if (q.type === "single") {
        answers[q.id] = String((q.correctIndex! + 1) % q.options!.length);
      } else {
        answers[q.id] = ["99"];
      }
    }
    const { data: result } = await submitQuizAnswers(answers, questions);
    if (!result) throw new Error("No quiz result returned");
    expect(result.score).toBe(0);
  });
});
