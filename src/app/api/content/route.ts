/**
 * Learning content catalogue (Sprint 58 §18, §22).
 *
 * GET /api/content            → courses, episodes and lessons
 * GET /api/content?quizId=…   → a quiz with its questions
 *
 * Serves the content that `mockData.ts` used to provide, now read from the seeded
 * database. This is STATIC content (courses, lessons, quiz definitions) — no
 * user data, so no ownership resolution is needed here.
 */
import { NextResponse } from "next/server";
import { handleRoute, prisma } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(async (request: Request) => {
  const quizId = new URL(request.url).searchParams.get("quizId");

  if (quizId) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { position: "asc" } } },
    });
    if (!quiz) {
      return NextResponse.json({ error: `Quiz "${quizId}" does not exist` }, { status: 404 });
    }
    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          type: q.type,
          question: q.question,
          // The browser needs the options to render, but NOT the answers.
          options: q.options,
          correctCards: q.correctCards,
          explanation: q.explanation,
          xpReward: q.xpReward,
        })),
      },
    });
  }

  const [courses, episodes, lessons] = await Promise.all([
    prisma.course.findMany({
      where: { published: true },
      orderBy: { position: "asc" },
      select: { id: true, slug: true, title: true, description: true, position: true },
    }),
    prisma.episode.findMany({
      orderBy: { position: "asc" },
      select: {
        id: true,
        courseId: true,
        title: true,
        description: true,
        position: true,
        _count: { select: { lessons: true } },
      },
    }),
    prisma.lesson.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: {
        id: true,
        courseId: true,
        episodeId: true,
        title: true,
        description: true,
        category: true,
        subcategory: true,
        duration: true,
        xpReward: true,
        position: true,
      },
    }),
  ]);

  return NextResponse.json({
    courses,
    episodes: episodes.map((e) => ({
      id: e.id,
      courseId: e.courseId,
      title: e.title,
      description: e.description,
      position: e.position,
      lessonCount: e._count.lessons,
    })),
    lessons,
  });
});
