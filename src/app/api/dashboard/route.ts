/**
 * Dashboard aggregate (Sprint 58 §11, §26).
 *
 * GET /api/dashboard
 *
 * Every value here is computed from persisted rows. The dashboard previously read
 * `mockUser` / `mockUserStats` fixtures, which is why a fresh user saw a level-7
 * account with a 12-day streak.
 *
 * PERFORMANCE (§26): one user row, four aggregate counts, and three short lists.
 * No N+1 queries, and no "fetch the whole table" scan.
 */
import { NextResponse } from "next/server";
import { getLevelInfo } from "@/services/xpService";
import { handleRoute, withUser, prisma } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const [
      user,
      lessonsCompleted,
      practiceCompleted,
      quizAttemptCount,
      auctionsCompleted,
      activity,
      achievementsUnlocked,
      xpAggregate,
      nextLesson,
    ] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          country: true,
          experienceLevel: true,
          joinedAt: true,
          xp: true,
          level: true,
          streak: true,
          longestStreak: true,
        },
      }),
      prisma.lessonProgress.count({ where: { userId, completed: true } }),
      prisma.practiceSession.count({ where: { userId, isComplete: true } }),
      prisma.quizAttempt.count({ where: { userId } }),
      prisma.auction.count({ where: { userId, isComplete: true } }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.userAchievement.count({ where: { userId, unlocked: true } }),
      prisma.xPEvent.aggregate({
        where: { userId, status: "applied" },
        _sum: { amount: true },
      }),
      // "Next lesson" = the first seeded lesson the user has not completed.
      prisma.lesson.findFirst({
        where: { NOT: { progress: { some: { userId, completed: true } } } },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: { id: true, title: true, description: true, duration: true, xpReward: true },
      }),
    ]);

    const totalLessons = await prisma.lesson.count();
    const levelInfo = getLevelInfo(user.xp);
    const lifetimeXp = xpAggregate._sum.amount ?? 0;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        country: user.country,
        experienceLevel: user.experienceLevel,
        joinedAt: user.joinedAt.toISOString(),
      },
      progression: {
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        longestStreak: user.longestStreak,
        lifetimeXp,
        xpToNextLevel: levelInfo.maxXp,
        levelTitle: levelInfo.title,
      },
      stats: {
        lessonsCompleted,
        totalLessons,
        practiceSessions: practiceCompleted,
        quizAttempts: quizAttemptCount,
        auctionsCompleted,
        achievementsUnlocked,
      },
      nextLesson,
      recentActivity: activity.map((a) => ({
        id: a.id,
        type: a.type,
        refId: a.refId,
        title: a.title,
        xp: a.xp,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  }),
);
