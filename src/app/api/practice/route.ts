/**
 * Practice sessions (Sprint 58 §7, §20).
 *
 * GET  /api/practice → the user's sessions
 * POST /api/practice → record a completed session
 *
 * A session stores the EVIDENCE of what the player did — every bid and card,
 * with the engine's verdict — not just a final score. The future Player Model
 * (Sprint 60) needs that history. The database records the engine's decisions;
 * it never computes them.
 */
import { NextResponse } from "next/server";
import { SEAT_ORDER, type Position } from "@/bridge";
import { awardXp } from "@/lib/progression";
import {
  handleRoute,
  withUser,
  prisma,
  readJson,
  
  optionalInt,
  badRequest,
  notFound,
} from "@/lib/apiRoute";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;
// The seat list, from the engine, so it cannot disagree with turn order.
const POSITIONS = SEAT_ORDER;

function parsePosition(value: unknown): Position | null {
  return typeof value === "string" && POSITIONS.includes(value as Position)
    ? (value as Position)
    : null;
}

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const sessions = await prisma.practiceSession.findMany({
      where: { userId },
      include: { actions: { orderBy: { sequence: "asc" } } },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        handId: s.handId,
        auctionId: s.auctionId,
        scenario: s.scenario,
        difficulty: s.difficulty,
        startedAt: s.startedAt.toISOString(),
        completedAt: s.completedAt?.toISOString() ?? null,
        durationMs: s.durationMs,
        score: s.score,
        maxScore: s.maxScore,
        isComplete: s.isComplete,
        finalContract: s.finalContract,
        declarer: s.declarer,
        actionCount: s.actions.length,
      })),
    });
  }),
);

interface PracticeActionBody {
  phase?: unknown;
  player?: unknown;
  call?: unknown;
  card?: unknown;
  isCorrect?: unknown;
  engineFeedback?: unknown;
}

interface PracticeBody {
  handId?: unknown;
  auctionId?: unknown;
  scenario?: unknown;
  difficulty?: unknown;
  startedAt?: unknown;
  completedAt?: unknown;
  durationMs?: unknown;
  score?: unknown;
  maxScore?: unknown;
  isComplete?: unknown;
  finalContract?: unknown;
  declarer?: unknown;
  notes?: unknown;
  actions?: unknown;
}

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<PracticeBody>(request);

    if (body.handId != null && typeof body.handId !== "string") {
      throw badRequest('"handId" must be a string', "VALIDATION_ERROR");
    }
    if (body.auctionId != null && typeof body.auctionId !== "string") {
      throw badRequest('"auctionId" must be a string', "VALIDATION_ERROR");
    }
    if (body.auctionId) {
      const auction = await prisma.auction.findFirst({
        where: { id: body.auctionId, userId },
        select: { id: true },
      });
      if (!auction) throw notFound(`Auction "${body.auctionId}" does not exist`);
    }

    const difficulty =
      typeof body.difficulty === "string" &&
      (DIFFICULTIES as readonly string[]).includes(body.difficulty)
        ? (body.difficulty as (typeof DIFFICULTIES)[number])
        : "Beginner";

    const rawActions = Array.isArray(body.actions) ? (body.actions as PracticeActionBody[]) : [];
    if (rawActions.length > 500) {
      throw badRequest("A session cannot exceed 500 actions", "VALIDATION_ERROR");
    }

    const now = new Date();
    const isComplete = body.isComplete === true;
    const score = optionalInt(body.score, "score", { min: 0 }) ?? null;
    const maxScore = optionalInt(body.maxScore, "maxScore", { min: 0 }) ?? null;
    const durationMs = optionalInt(body.durationMs, "durationMs", { min: 0 }) ?? null;

    const session = await prisma.practiceSession.create({
      data: {
        userId,
        handId: typeof body.handId === "string" ? body.handId : null,
        auctionId: typeof body.auctionId === "string" ? body.auctionId : null,
        scenario: typeof body.scenario === "string" ? body.scenario : null,
        difficulty,
        startedAt:
          typeof body.startedAt === "string" ? new Date(body.startedAt) : now,
        completedAt: isComplete
          ? typeof body.completedAt === "string"
            ? new Date(body.completedAt)
            : now
          : null,
        durationMs,
        score,
        maxScore,
        isComplete,
        finalContract: typeof body.finalContract === "string" ? body.finalContract : null,
        declarer: parsePosition(body.declarer),
        notes: typeof body.notes === "string" ? body.notes : null,
        actions: {
          create: rawActions.map((action, index) => ({
            sequence: index,
            phase: typeof action.phase === "string" ? action.phase : "bidding",
            player: parsePosition(action.player),
            call: typeof action.call === "string" ? action.call : null,
            card: typeof action.card === "string" ? action.card : null,
            isCorrect: typeof action.isCorrect === "boolean" ? action.isCorrect : null,
            engineFeedback:
              typeof action.engineFeedback === "string" ? action.engineFeedback : null,
          })),
        },
      },
      include: { actions: { orderBy: { sequence: "asc" } } },
    });

    // XP for a completed session is recorded as an event, once per session.
    let xpAwarded = 0;
    if (isComplete && score !== null) {
      const earned = Math.max(0, Math.round(score / 5));
      const result = await awardXp(
        userId,
        "PRACTICE_COMPLETED",
        `practice-session:${session.id}`,
        earned,
        { sessionId: session.id, score, maxScore, difficulty },
      );
      xpAwarded = result.awarded;
    }

    return NextResponse.json(
      {
        id: session.id,
        handId: session.handId,
        auctionId: session.auctionId,
        difficulty: session.difficulty,
        isComplete: session.isComplete,
        score: session.score,
        maxScore: session.maxScore,
        actionCount: session.actions.length,
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString() ?? null,
        xpAwarded,
      },
      { status: 201 },
    );
  }),
);
