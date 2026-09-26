/**
 * Library counts for the search page's idle state (Sprint 60 follow-up).
 *
 * Separate from `/api/search` so the empty state can show what exists without
 * sending a query the user has not typed. Three `count()` calls in parallel, no
 * rows transferred.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(() =>
  withUser(async () => {
    const [lessons, quizzes, courses] = await Promise.all([
      prisma.lesson.count(),
      prisma.quiz.count(),
      prisma.course.count(),
    ]);
    return NextResponse.json({ lessons, quizzes, courses });
  }),
);
