/**
 * Lesson + course progress (Sprint 58 §6, §20).
 *
 * GET  /api/progress → all progress for the current user
 * POST /api/progress → upsert progress for one lesson
 *
 * Replaces the mock path where `lessonService.saveLessonProgress()` accepted a
 * payload and discarded it. Completion is recorded once; re-completing does not
 * double-count, because the XPEvent unique constraint enforces it downstream.
 */
import { NextResponse } from "next/server";
import { awardXp } from "@/lib/progression";
import {
  handleRoute,
  withUser,
  prisma,
  readJson,
  requireString,
  optionalInt,
  optionalStringArray,
  notFound,
} from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProgressBody {
  lessonId?: unknown;
  completed?: unknown;
  completedSectionIds?: unknown;
  currentSectionIndex?: unknown;
}

/** Distinguishes "field not sent" (leave unchanged) from "sent empty" (clear). */
function isProvided(value: unknown): boolean {
  return value !== undefined && value !== null;
}

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const [lessonProgress, courseProgress, user, lessons] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId },
        include: { lesson: { select: { id: true, title: true, xpReward: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.courseProgress.findMany({ where: { userId } }),
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, xp: true, level: true, streak: true },
      }),
      prisma.lesson.findMany({ select: { id: true, courseId: true } }),
    ]);

    // Course progress is DERIVED from lesson progress, never stored twice (§10).
    const completedLessonIds = new Set(
      lessonProgress.filter((p) => p.completed).map((p) => p.lessonId),
    );
    const byCourse = new Map<string, { total: number; completed: number }>();
    for (const lesson of lessons) {
      if (!lesson.courseId) continue;
      const entry = byCourse.get(lesson.courseId) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (completedLessonIds.has(lesson.id)) entry.completed += 1;
      byCourse.set(lesson.courseId, entry);
    }

    return NextResponse.json({
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      lessons: lessonProgress.map((p) => ({
        lessonId: p.lessonId,
        title: p.lesson.title,
        xpReward: p.lesson.xpReward,
        completed: p.completed,
        completedSectionIds: p.completedSectionIds,
        currentSectionIndex: p.currentSectionIndex,
        startedAt: p.startedAt.toISOString(),
        completedAt: p.completedAt?.toISOString() ?? null,
        lastViewedAt: p.lastViewedAt.toISOString(),
      })),
      courseProgress: courseProgress.map((p) => ({
        courseId: p.courseId,
        completed: p.completed,
        completedAt: p.completedAt?.toISOString() ?? null,
      })),
      courseSummary: [...byCourse.entries()].map(([courseId, v]) => ({
        courseId,
        totalLessons: v.total,
        completedLessons: v.completed,
        completionPercent: v.total === 0 ? 0 : Math.round((v.completed / v.total) * 100),
      })),
    });
  }),
);

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<ProgressBody>(request);
    const lessonId = requireString(body.lessonId, "lessonId");
    const completed = body.completed === true;
    const providedSections = isProvided(body.completedSectionIds);
    const providedIndex = isProvided(body.currentSectionIndex);
    const completedSectionIds = providedSections
      ? optionalStringArray(body.completedSectionIds, "completedSectionIds")
      : [];
    const currentSectionIndex = providedIndex
      ? (optionalInt(body.currentSectionIndex, "currentSectionIndex", { min: 0 }) ?? 0)
      : 0;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, xpReward: true },
    });
    if (!lesson) throw notFound(`Lesson "${lessonId}" does not exist`);

    const now = new Date();
    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { completed: true },
    });

    // Completion is a one-way transition: a later "in progress" write must not
    // un-complete the lesson or lose the completion timestamp.
    const wasCompleted = existing?.completed ?? false;
    const nowCompleted = wasCompleted || completed;

    const progress = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        completed: nowCompleted,
        completedSectionIds,
        currentSectionIndex,
        lastViewedAt: now,
        completedAt: nowCompleted ? now : null,
      },
      update: {
        completed: nowCompleted,
        // Only overwrite a field when the caller actually sent it. A partial
        // payload (e.g. just `completed: true`) must not erase recorded work.
        ...(providedSections ? { completedSectionIds } : {}),
        ...(providedIndex ? { currentSectionIndex } : {}),
        lastViewedAt: now,
        ...(nowCompleted && !wasCompleted ? { completedAt: now } : {}),
      },
    });

    // A newly completed lesson awards XP exactly once. The progression engine is
    // the only writer of user XP, and the unique constraint on
    // (userId, type, reference) makes the award idempotent (§10, §25).
    let xpAwarded = 0;
    if (nowCompleted && !wasCompleted) {
      const { awarded } = await awardXp(userId, "LESSON_COMPLETED", `lesson:${lessonId}`, lesson.xpReward, {
        lessonId,
      });
      xpAwarded = awarded;
    }

    return NextResponse.json({
      lessonId: progress.lessonId,
      completed: progress.completed,
      completedSectionIds: progress.completedSectionIds,
      currentSectionIndex: progress.currentSectionIndex,
      completedAt: progress.completedAt?.toISOString() ?? null,
      xpAwarded,
    });
  }),
);
