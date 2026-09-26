/**
 * Certificates (Sprint 58 §11, §20).
 *
 * GET /api/certificates
 *
 * A certificate is EARNED, so it cannot be a fixture. One certificate is granted
 * per fully-completed course, and the award date comes from the persisted lesson
 * progress. The certificates page previously rendered four static certificates
 * as if the user had earned them.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stable per-course colours, indexed by position so they never shuffle. */
const GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-indigo-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
];

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const [courses, progress] = await Promise.all([
      prisma.course.findMany({
        where: { published: true },
        orderBy: { position: "asc" },
        include: {
          episodes: {
            orderBy: { position: "asc" },
            include: { lessons: { select: { id: true } } },
          },
        },
      }),
      prisma.lessonProgress.findMany({
        where: { userId, completed: true },
        select: { lessonId: true, completedAt: true },
      }),
    ]);

    const completedAtByLesson = new Map(
      progress.map((p) => [p.lessonId, p.completedAt]),
    );

    const certificates = courses.flatMap((course, courseIndex) => {
      const lessonIds = course.episodes.flatMap((e) => e.lessons.map((l) => l.id));
      if (lessonIds.length === 0) return [];

      const completedCount = lessonIds.filter((id) => completedAtByLesson.has(id)).length;
      if (completedCount < lessonIds.length) return [];

      // The certificate is dated when the last lesson of the course was finished.
      const dates = lessonIds
        .map((id) => completedAtByLesson.get(id))
        .filter((d): d is Date => Boolean(d))
        .sort((a, b) => b.getTime() - a.getTime());

      return [
        {
          id: `cert-${course.id}`,
          title: course.title,
          description: `All ${lessonIds.length} lessons completed`,
          earnedAt: (dates[0] ?? new Date()).toISOString(),
          episodeId: course.id,
          gradient: GRADIENTS[courseIndex % GRADIENTS.length],
        },
      ];
    });

    const totalCourses = courses.length;

    return NextResponse.json({
      certificates,
      totalCourses,
      // A learner should see how far they are towards the next one.
      inProgress: courses
        .map((course, index) => {
          const lessonIds = course.episodes.flatMap((e) => e.lessons.map((l) => l.id));
          const done = lessonIds.filter((id) => completedAtByLesson.has(id)).length;
          return {
            courseId: course.id,
            title: course.title,
            completed: done,
            total: lessonIds.length,
            percent: lessonIds.length === 0 ? 0 : Math.round((done / lessonIds.length) * 100),
            gradient: GRADIENTS[index % GRADIENTS.length],
          };
        })
        .filter((c) => c.percent > 0 && c.percent < 100),
    });
  }),
);
