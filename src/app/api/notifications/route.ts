/**
 * Notifications (Sprint 58 §11, §20).
 *
 * GET  /api/notifications → the user's notification feed
 * PATCH /api/notifications → mark read
 *
 * Derived from real activity (lesson completions, quiz attempts, practice
 * sessions, XP events) plus a persisted read-state table. Previously the bell
 * showed a hardcoded unread count from a fixture, so it never changed.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  refId: string | null;
  createdAt: string;
  read: boolean;
}

const ICON_FOR: Record<string, string> = {
  lesson: "📖",
  quiz: "🎯",
  practice: "♠",
  achievement: "🏆",
  xp: "⚡",
};

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const [lessons, quizzes, sessions, achievements, xpEvents, readState] =
      await Promise.all([
        prisma.lessonProgress.findMany({
          where: { userId, completed: true },
          include: { lesson: { select: { title: true } } },
          orderBy: { completedAt: "desc" },
          take: 20,
        }),
        prisma.quizAttempt.findMany({
          where: { userId },
          include: { quiz: { select: { title: true } } },
          orderBy: { completedAt: "desc" },
          take: 10,
        }),
        prisma.practiceSession.findMany({
          where: { userId, isComplete: true },
          orderBy: { completedAt: "desc" },
          take: 10,
        }),
        prisma.userAchievement.findMany({
          where: { userId, unlocked: true },
          include: { achievement: { select: { title: true, xpReward: true } } },
          orderBy: { unlockedAt: "desc" },
          take: 10,
        }),
        prisma.xPEvent.findMany({
          where: { userId, status: "applied" },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.activity.findMany({
          where: { userId, type: "notification_read" },
          select: { refId: true },
        }),
      ]);

    const read = new Set(readState.map((r) => r.refId).filter(Boolean) as string[]);

    const feed: NotificationRecord[] = [
      ...lessons.map((l) => ({
        id: `lesson:${l.lessonId}`,
        type: "lesson",
        title: `Lesson complete: ${l.lesson.title}`,
        body: "Your progress has been saved.",
        refId: l.lessonId,
        createdAt: (l.completedAt ?? l.lastViewedAt).toISOString(),
        read: read.has(l.lessonId),
      })),
      ...quizzes.map((a) => ({
        id: `quiz:${a.id}`,
        type: "quiz",
        title: `Quiz scored ${a.score}%`,
        body: `${a.correctAnswers} of ${a.totalQuestions} correct in ${a.quiz.title}.`,
        refId: a.id,
        createdAt: a.completedAt.toISOString(),
        read: read.has(a.id),
      })),
      ...sessions.map((s) => ({
        id: `practice:${s.id}`,
        type: "practice",
        title: `Practice session saved`,
        body:
          s.score !== null
            ? `You scored ${s.score}${s.maxScore ? ` of ${s.maxScore}` : ""}.`
            : "Your session was recorded.",
        refId: s.id,
        createdAt: (s.completedAt ?? s.startedAt).toISOString(),
        read: read.has(s.id),
      })),
      ...achievements.map((a) => ({
        id: `achievement:${a.achievementId}`,
        type: "achievement",
        title: `Achievement unlocked: ${a.achievement.title}`,
        body: `+${a.achievement.xpReward} XP`,
        refId: a.achievementId,
        createdAt: (a.unlockedAt ?? a.updatedAt).toISOString(),
        read: read.has(a.achievementId),
      })),
      ...xpEvents
        .filter((e) => e.type === "ACHIEVEMENT_UNLOCKED")
        .map((e) => ({
          id: `xp:${e.id}`,
          type: "xp",
          title: `+${e.amount} XP earned`,
          body: e.reference,
          refId: e.id,
          createdAt: e.createdAt.toISOString(),
          read: read.has(e.id),
        })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30);

    return NextResponse.json({
      notifications: feed.map((n) => ({ ...n, icon: ICON_FOR[n.type] ?? "🔔" })),
      unreadCount: feed.filter((n) => !n.read).length,
    });
  }),
);

export const PATCH = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = (await request.json().catch(() => null)) as { refId?: string } | null;
    const refId = body?.refId;
    if (!refId) {
      return NextResponse.json(
        { error: '"refId" is required', code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    // Read state is stored as Activity rows so no extra table is needed, and
    // marking twice is naturally idempotent.
    await prisma.activity.upsert({
      where: { id: `notif-read-${userId}-${refId}` },
      create: {
        id: `notif-read-${userId}-${refId}`,
        userId,
        type: "notification_read",
        refId,
        title: "Marked as read",
      },
      update: {},
    });

    return NextResponse.json({ refId, read: true });
  }),
);
