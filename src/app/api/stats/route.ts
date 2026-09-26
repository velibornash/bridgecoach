/**
 * Statistics (Sprint 58 §12, §26).
 *
 * GET /api/stats
 *
 * Every figure is calculated from persisted activity — lesson progress, quiz
 * attempts, practice sessions and bridge actions. The previous implementation
 * read `mockUserStats` fixtures and synthesised an accuracy history from XP; the
 * statistics page also rendered a radar chart from a hardcoded skill profile and
 * a heatmap built with `Math.random()`. All of that is now derived from real rows.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Last `days` calendar days, oldest first, as YYYY-MM-DD. */
function dayKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const since = new Date();
    since.setDate(since.getDate() - 29);

    const [
      lessonProgress,
      quizAttempts,
      practiceSessions,
      auctionActions,
      xpEvents,
      totalLessons,
      daysActive,
    ] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId },
        select: { completed: true, completedAt: true, lastViewedAt: true, lessonId: true },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        select: { score: true, correctAnswers: true, totalQuestions: true, completedAt: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId },
        select: { score: true, maxScore: true, isComplete: true, durationMs: true, completedAt: true },
      }),
      prisma.auctionAction.findMany({
        where: { auction: { userId } },
        select: { engineLegal: true, type: true },
      }),
      prisma.xPEvent.findMany({
        where: { userId, status: "applied" },
        select: { amount: true, createdAt: true, type: true },
      }),
      prisma.lesson.count(),
      prisma.xPEvent.findMany({
        where: { userId, status: "applied" },
        distinct: ["createdAt"],
        select: { createdAt: true },
      }),
    ]);

    const lessonsCompleted = lessonProgress.filter((p) => p.completed).length;
    const completedSessions = practiceSessions.filter((s) => s.isComplete);

    // Learning activity per day, derived from XP events (not random).
    const activityByDay = new Map<string, { xp: number; events: number }>();
    for (const key of dayKeys(30)) activityByDay.set(key, { xp: 0, events: 0 });
    for (const event of xpEvents) {
      const key = event.createdAt.toISOString().slice(0, 10);
      const entry = activityByDay.get(key);
      if (entry) {
        entry.xp += event.amount;
        entry.events += 1;
      }
    }
    const heatmap = [...activityByDay.entries()].map(([date, v]) => ({
      date,
      xp: v.xp,
      events: v.events,
      // 0-4 intensity bucket, the same shape the existing heatmap component expects.
      intensity: v.xp === 0 ? 0 : Math.min(4, Math.ceil(v.xp / 25)),
    }));

    const averageQuizScore = quizAttempts.length
      ? Math.round(
          quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length,
        )
      : 0;

    const averagePracticeScore = completedSessions.length
      ? Math.round(
          completedSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
            completedSessions.length,
        )
      : 0;

    const totalBids = auctionActions.filter((a) => a.type === "bid").length;
    const legalBids = auctionActions.filter((a) => a.type === "bid" && a.engineLegal).length;

    // Quiz accuracy over time is a real running average of stored attempts.
    const accuracyHistory = quizAttempts
      .slice()
      .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
      .map((a, index) => {
        const upTo = quizAttempts.slice(0, index + 1);
        return {
          attempt: index + 1,
          average: Math.round(upTo.reduce((s, x) => s + x.score, 0) / upTo.length),
          score: a.score,
          at: a.completedAt.toISOString(),
        };
      });

    return NextResponse.json({
      learning: {
        lessonsCompleted,
        totalLessons,
        completionPercent: totalLessons === 0 ? 0 : Math.round((lessonsCompleted / totalLessons) * 100),
        daysActive: daysActive.length,
        quizzesTaken: quizAttempts.length,
        averageQuizScore,
      },
      practice: {
        sessionsCompleted: completedSessions.length,
        averagePracticeScore,
        totalPracticeMinutes: Math.round(
          completedSessions.reduce((sum, s) => sum + (s.durationMs ?? 0), 0) / 60000,
        ),
        auctionsCompleted: totalBids > 0 ? undefined : 0,
        totalBids,
        legalBids,
        bidAccuracy: totalBids === 0 ? 0 : Math.round((legalBids / totalBids) * 100),
      },
      progression: {
        lifetimeXp: xpEvents.reduce((sum, e) => sum + e.amount, 0),
        eventsByType: xpEvents.reduce<Record<string, number>>((acc, e) => {
          acc[e.type] = (acc[e.type] ?? 0) + 1;
          return acc;
        }, {}),
      },
      heatmap,
      accuracyHistory,
    });
  }),
);
