/**
 * Quiz attempts (Sprint 58 §6, §20).
 *
 * GET  /api/quiz-attempts → the user's attempt history
 * POST /api/quiz-attempts → grade and persist one attempt
 *
 * Grading moved SERVER-SIDE. The client used to compute its own score in
 * `quizService.submitQuizAnswers`, which meant the score was never recorded.
 * Correct answers are read from the database here, so the client cannot inflate
 * its own result.
 */
import { NextResponse } from "next/server";
import { awardXp } from "@/lib/progression";
import {
  handleRoute,
  withUser,
  prisma,
  readJson,
  requireString,
  
  badRequest,
  notFound,
} from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
      include: { quiz: { select: { id: true, title: true } } },
      orderBy: { completedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      attempts: attempts.map((a) => ({
        id: a.id,
        quizId: a.quizId,
        quizTitle: a.quiz.title,
        score: a.score,
        correctAnswers: a.correctAnswers,
        totalQuestions: a.totalQuestions,
        xpEarned: a.xpEarned,
        answers: a.answers,
        completedAt: a.completedAt.toISOString(),
      })),
    });
  }),
);

interface AttemptBody {
  quizId?: unknown;
  answers?: unknown;
}

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<AttemptBody>(request);
    const quizId = requireString(body.quizId, "quizId");

    if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
      throw badRequest('"answers" must be an object keyed by question id', "VALIDATION_ERROR");
    }
    const answers = body.answers as Record<string, string | string[]>;

    const questions = await prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { position: "asc" },
    });
    if (questions.length === 0) throw notFound(`Quiz "${quizId}" has no questions`);

    // Grade against the stored answers — never trust a client-supplied score.
    let correct = 0;
    let xpEarned = 0;
    for (const question of questions) {
      const given = answers[question.id];
      if (given === undefined) continue;

      let isCorrect = false;
      if (question.type === "single") {
        isCorrect = Number(given) === question.correctIndex;
      } else if (question.type === "multiple") {
        const expected = [...question.correctIndices].map(Number).sort();
        const received = (Array.isArray(given) ? given : [given]).map(Number).sort();
        isCorrect =
          expected.length === received.length &&
          expected.every((value, i) => value === received[i]);
      }
      // Other question types (card-select, drag-drop) are not auto-graded yet;
      // they are recorded but do not contribute to the score.
      if (isCorrect) {
        correct += 1;
        xpEarned += question.xpReward;
      }
    }

    const total = questions.length;
    const score = total === 0 ? 0 : Math.round((correct / total) * 100);
    const now = new Date();

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        correctAnswers: correct,
        totalQuestions: total,
        xpEarned,
        answers: JSON.stringify(
          Object.fromEntries(questions.map((q) => [q.id, answers[q.id] ?? null])),
        ),
        completedAt: now,
      },
    });

    // XP is recorded as an event, one per attempt, so the total is always the sum
    // of its parts and a single event can be traced back to its attempt (§10).
    const { awarded } = await awardXp(
      userId,
      "QUIZ_COMPLETED",
      `quiz-attempt:${attempt.id}`,
      xpEarned,
      { quizId, score, correctAnswers: correct, totalQuestions: total },
    );

    return NextResponse.json(
      {
        id: attempt.id,
        quizId,
        score,
        correctAnswers: correct,
        totalQuestions: total,
        xpEarned: awarded,
        completedAt: attempt.completedAt.toISOString(),
      },
      { status: 201 },
    );
  }),
);
