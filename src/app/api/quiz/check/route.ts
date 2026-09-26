/**
 * Single-answer grading (Sprint 58 §6, §22).
 *
 * POST /api/quiz/check
 *
 * WHY THIS EXISTS
 * The quiz UI shows the learner immediately whether their answer was right and
 * highlights the correct option. That inherently needs the answer key — but
 * shipping the whole key to the browser let a learner read every answer before
 * starting, and (in Sprint 57) the browser computed the final score itself.
 *
 * So the key stays on the server: the client submits ONE answer and gets back
 * the verdict for that question only. Feedback stays instant and authoritative,
 * and no un-answered question is ever exposed.
 */
import { NextResponse } from "next/server";
import { handleRoute, prisma, readJson, requireString, badRequest, notFound } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckBody {
  questionId?: unknown;
  answer?: unknown;
}

export const POST = handleRoute(async (request: Request) => {
  const body = await readJson<CheckBody>(request);
  const questionId = requireString(body.questionId, "questionId");
  if (body.answer === undefined || body.answer === null) {
    throw badRequest('"answer" is required', "VALIDATION_ERROR");
  }

  const question = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      type: true,
      correctIndex: true,
      correctIndices: true,
      correctCards: true,
      explanation: true,
      xpReward: true,
    },
  });
  if (!question) throw notFound(`Question "${questionId}" does not exist`);

  const answer = body.answer;

  // Graded types: single and multiple. Interactive types (card-select,
  // drag-drop) are graded by the UI against `correctCards`, which the content
  // endpoint already returns because the learner must see the deck.
  let correct = false;
  const display: { correctIndex?: number | null; correctIndices?: number[] } = {};

  if (question.type === "single") {
    correct = Number(answer) === question.correctIndex;
    display.correctIndex = question.correctIndex;
  } else if (question.type === "multiple") {
    const expected = [...question.correctIndices].map(Number).sort();
    const received = (Array.isArray(answer) ? answer : [answer]).map(Number).sort();
    correct =
      expected.length === received.length && expected.every((v, i) => v === received[i]);
    display.correctIndices = expected;
  } else {
    correct = Array.isArray(answer)
      ? question.correctCards.every((c) => answer.includes(c)) && answer.length === question.correctCards.length
      : question.correctCards.includes(String(answer));
  }

  return NextResponse.json({
    questionId: question.id,
    correct,
    explanation: question.explanation,
    xpReward: question.xpReward,
    ...display,
  });
});
