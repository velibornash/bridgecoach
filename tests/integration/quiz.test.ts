/**
 * Quiz module integration tests (Sprint 58 §6, §23).
 *
 * The load-bearing assertion is that grading is SERVER-SIDE: /api/content never
 * returns the answer key, and the persisted score is computed from the server's
 * own copy of the correct answers — so a client cannot inflate its own result.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma, resolveUserId } from "@/lib/db";
import { GET as getContent } from "@/app/api/content/route";
import { POST as postAttempt } from "@/app/api/quiz-attempts/route";
import { GET as getAttempts } from "@/app/api/quiz-attempts/route";

const QUIZ_ID = "seed-quiz-bidding";

const contentReq = () =>
  new Request(`http://localhost/api/content?quizId=${QUIZ_ID}`);

function attemptReq(answers: Record<string, string | string[]>) {
  return new Request("http://localhost/api/quiz-attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quizId: QUIZ_ID, answers }),
  });
}

let userId: string;
const createdAttemptIds: string[] = [];

beforeAll(async () => {
  userId = await resolveUserId();
});

afterAll(async () => {
  await prisma.quizAttempt.deleteMany({ where: { id: { in: createdAttemptIds } } });
  await prisma.xPEvent.deleteMany({
    where: { reference: { in: createdAttemptIds.map((id) => `quiz-attempt:${id}`) } },
  });
  const { recomputeProgression } = await import("@/lib/progression");
  await recomputeProgression(userId);
  await prisma.$disconnect();
});

describe("quiz: the answer key never leaves the server", () => {
  it("serves questions without correctIndex or correctIndices", async () => {
    const response = await getContent(contentReq());
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      quiz: { questions: Array<Record<string, unknown>> };
    };
    expect(body.quiz.questions.length).toBeGreaterThan(0);
    for (const q of body.quiz.questions) {
      expect(q.correctIndex).toBeUndefined();
      expect(q.correctIndices).toBeUndefined();
    }
  });

  it("still returns the explanation so a student can learn", async () => {
    const body = (await (await getContent(contentReq())).json()) as {
      quiz: { questions: Array<{ explanation: string }> };
    };
    expect(body.quiz.questions.every((q) => typeof q.explanation === "string")).toBe(true);
  });
});

describe("quiz: server-side grading", () => {
  it("scores a partially correct attempt and persists it", async () => {
    // q1 correctIndex=1, q2 correctIndex=0 (from the seed).
    const response = await postAttempt(attemptReq({ q1: "1", q2: "0" }));
    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      id: string;
      correctAnswers: number;
      score: number;
      xpEarned: number;
      totalQuestions: number;
    };
    createdAttemptIds.push(body.id);

    expect(body.correctAnswers).toBe(2);
    expect(body.xpEarned).toBeGreaterThan(0);
    expect(body.score).toBe(
      Math.round((body.correctAnswers / body.totalQuestions) * 100),
    );

    const stored = await prisma.quizAttempt.findUniqueOrThrow({ where: { id: body.id } });
    expect(stored.correctAnswers).toBe(2);
    expect(JSON.parse(String(stored.answers))).toMatchObject({ q1: "1", q2: "0" });
  });

  it("scores all-wrong answers as zero", async () => {
    const response = await postAttempt(attemptReq({ q1: "0", q2: "1" }));
    expect(response.status).toBe(201);
    const body = (await response.json()) as { id: string; score: number; xpEarned: number };
    createdAttemptIds.push(body.id);
    expect(body.score).toBe(0);
    expect(body.xpEarned).toBe(0);
  });

  it("records exactly one XP event per attempt", async () => {
    const events = await prisma.xPEvent.findMany({
      where: { reference: `quiz-attempt:${createdAttemptIds[0]}` },
    });
    expect(events).toHaveLength(1);
  });

  it("rejects a missing quizId with 400", async () => {
    const response = await postAttempt(
      new Request("http://localhost/api/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: {} }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("404s an unknown quiz", async () => {
    const response = await postAttempt(
      new Request("http://localhost/api/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: "nope", answers: {} }),
      }),
    );
    expect(response.status).toBe(404);
  });
});

describe("quiz: attempt history", () => {
  it("returns the user's stored attempts", async () => {
    const body = (await (await getAttempts(
      new Request("http://localhost/api/quiz-attempts"),
    )).json()) as { attempts: Array<{ id: string; score: number }> };

    for (const attempt of createdAttemptIds) {
      expect(body.attempts.some((a) => a.id === attempt)).toBe(true);
    }
  });
});
