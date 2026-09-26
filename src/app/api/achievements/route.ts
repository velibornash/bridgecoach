/**
 * Achievements (Sprint 58 §13, §20).
 *
 * GET  /api/achievements → catalogue merged with the user's unlock state
 * POST /api/achievements → recompute progress/unlocks from persisted activity
 *
 * Progress is DERIVED from real activity (completed lessons, XP, streak), never
 * stored twice. The unique constraint on (userId, achievementId) is what
 * prevents duplicate unlocks.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, readJson } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Metrics {
  lessonsCompleted: number;
  xp: number;
  streak: number;
  practiceSessions: number;
  quizAttempts: number;
  /** Quizzes answered with a perfect score — a distinct metric from "taken". */
  perfectQuizzes: number;
}

/** Read the real metrics an achievement can be measured against. */
async function readMetrics(userId: string): Promise<Metrics> {
  const [lessonsCompleted, user, practiceSessions, quizAttempts, xpAggregate] =
    await Promise.all([
      prisma.lessonProgress.count({ where: { userId, completed: true } }),
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { xp: true, streak: true },
      }),
      prisma.practiceSession.count({ where: { userId, isComplete: true } }),
      prisma.quizAttempt.findMany({ where: { userId }, select: { score: true } }),
      prisma.xPEvent.aggregate({
        where: { userId, status: "applied" },
        _sum: { amount: true },
      }),
    ]);

  return {
    lessonsCompleted,
    xp: xpAggregate._sum.amount ?? user.xp,
    streak: user.streak,
    practiceSessions,
    quizAttempts: quizAttempts.length,
    perfectQuizzes: quizAttempts.filter((a) => a.score === 100).length,
  };
}

/**
 * Reads a metric by name, returning null when the metric is unknown or
 * deliberately not machine-evaluable (`"manual"`). `null` means "cannot be
 * evaluated" and must never be treated as 0-for-unlock purposes.
 */
function readMetric(metrics: Metrics, metric: string): number | null {
  if (metric === "manual") return null;
  const value = metrics[metric as keyof Metrics];
  return typeof value === "number" ? value : null;
}

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const [achievements, owned, metrics] = await Promise.all([
      prisma.achievement.findMany({ orderBy: { id: "asc" } }),
      prisma.userAchievement.findMany({ where: { userId } }),
      readMetrics(userId),
    ]);

    const ownedById = new Map(owned.map((o) => [o.achievementId, o]));

    return NextResponse.json({
      metrics,
      achievements: achievements.map((a) => {
        const state = ownedById.get(a.id);
        const measured = readMetric(metrics, a.metric);
        const measuredValid = measured !== null;
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          category: a.category,
          xpReward: a.xpReward,
          rarity: a.rarity,
          metric: a.metric,
          threshold: a.threshold,
          progress: state?.progress ?? (measuredValid ? Math.min(measured, a.threshold) : 0),
          // An achievement with no real metric behind it can never auto-unlock.
          unlocked: state?.unlocked ?? (measuredValid && measured >= a.threshold),
          unlockedAt: state?.unlockedAt?.toISOString() ?? null,
        };
      }),
    });
  }),
);

/**
 * Recomputes every achievement from persisted activity and persists any change.
 * Idempotent: calling it repeatedly converges on the same state.
 */
export const POST = handleRoute(async (_request: Request) =>
  withUser(async (userId) => {
    const [achievements, metrics] = await Promise.all([
      prisma.achievement.findMany(),
      readMetrics(userId),
    ]);

    const now = new Date();
    const newlyUnlocked: string[] = [];

    for (const achievement of achievements) {
      const measured = readMetric(metrics, achievement.metric);
      // "manual" achievements have no real metric behind them yet. Leave them
      // untouched rather than unlocking them on a guess (see prisma/seed.ts).
      if (measured === null) continue;
      const progress = Math.min(measured, achievement.threshold);
      const unlocked = measured >= achievement.threshold;

      const existing = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: { userId, achievementId: achievement.id },
        },
        select: { id: true, unlocked: true },
      });

      if (!existing) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress,
            unlocked,
            unlockedAt: unlocked ? now : null,
          },
        });
        if (unlocked) newlyUnlocked.push(achievement.id);
        continue;
      }

      // Never re-award an achievement that was already unlocked.
      if (unlocked && !existing.unlocked) {
        await prisma.userAchievement.update({
          where: { id: existing.id },
          data: { progress, unlocked: true, unlockedAt: now },
        });
        newlyUnlocked.push(achievement.id);
      } else if (progress !== undefined) {
        await prisma.userAchievement.update({
          where: { id: existing.id },
          data: { progress: unlocked ? achievement.threshold : progress },
        });
      }
    }

    return NextResponse.json({ newlyUnlocked, count: newlyUnlocked.length });
  }),
);
