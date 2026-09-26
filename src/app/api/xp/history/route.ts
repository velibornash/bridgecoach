/**
 * XP history (Sprint 58 §10, §19).
 *
 * GET /api/xp/history
 *
 * The XP page previously rendered `mockXpEntries` — fourteen hardcoded entries
 * generated relative to `Date.now()`. This serves the real `XPEvent` log, mapped
 * onto the `XpSource` labels the UI already renders.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma } from "@/lib/apiRoute";
import type { XpSource } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** XPEvent.type → the `XpSource` union the UI understands. */
const SOURCE_MAP: Record<string, XpSource> = {
  LESSON_COMPLETED: "lesson",
  QUIZ_COMPLETED: "quiz",
  PRACTICE_COMPLETED: "challenge",
  ACHIEVEMENT_UNLOCKED: "achievement",
  DAILY_CHALLENGE_COMPLETED: "daily_bonus",
  MISSION_COMPLETED: "daily_bonus",
  COURSE_COMPLETED: "lesson",
  BOOKMARK_CREATED: "daily_bonus",
  NOTE_CREATED: "daily_bonus",
};

const SOURCE_LABEL: Record<XpSource, string> = {
  lesson: "Lesson completed",
  quiz: "Quiz completed",
  challenge: "Practice session",
  achievement: "Achievement unlocked",
  streak_bonus: "Streak bonus",
  daily_bonus: "Daily bonus",
};

export const GET = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const requested = Number(new URL(request.url).searchParams.get("limit") ?? "50");
    const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, 200) : 50;

    const events = await prisma.xPEvent.findMany({
      where: { userId, status: "applied" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      totalXp: events.reduce((sum, e) => sum + e.amount, 0),
      entries: events.map((e) => {
        const source = SOURCE_MAP[e.type] ?? "daily_bonus";
        const reference = (e.metadata as { lessonId?: string; quizId?: string } | null)?.lessonId
          ?? (e.metadata as { quizId?: string } | null)?.quizId;
        return {
          id: e.id,
          amount: e.amount,
          source,
          description: reference ? `${SOURCE_LABEL[source]}: ${reference}` : SOURCE_LABEL[source],
          timestamp: e.createdAt.toISOString(),
        };
      }),
    });
  }),
);
