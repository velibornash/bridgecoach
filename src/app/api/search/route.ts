/**
 * Search (Sprint 60 follow-up).
 *
 *   GET /api/search?q=… → lessons, quizzes, and courses matching the query
 *
 * Replaces `mockSearchResults`, a hand-written index of four lessons whose ids
 * matched no database row and whose `href` was identical for all of them. It was
 * the last file still reading fixtures, and it had drifted: the "catalogue" it
 * described was a subset of the real `Lesson` table, so search could not find
 * anything the learner did not already know existed.
 *
 * ## Why this is raw SQL rather than Prisma's query API
 *
 * `Lesson.content` is a `Json` column holding a nested document, and the lesson
 * body a learner would search for ("Notrump", "finesse", "trick") lives inside
 * it. Two Prisma operators were tried and neither is usable:
 *
 * - `contains` with `mode: "insensitive"` is rejected at runtime for a Json
 *   field. It is not a type error, so `tsc` passes and the route returns 500
 *   only when it is called.
 * - `string_contains` is accepted, but it compiles to `LIKE`, which is
 *   **case-sensitive**. It silently missed a lesson whose body contained
 *   "Notrump" when the user typed "notrump" — a search that returns nothing for
 *   a word that is plainly in the document is worse than no search.
 *
 * So the query is written as SQL with `ILIKE` against `content::text`, which is
 * the correct operator for the job. Every user-supplied value goes through
 * Prisma's tagged template, so values are bound as parameters and never
 * interpolated into the query string.
 *
 * Scoring is done in SQL so ranking happens before the row limit: a title match
 * outranks a description match, which outranks a body match. Selecting first and
 * sorting afterwards would rank only the arbitrary subset the database returned.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma } from "@/lib/apiRoute";
import { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type SearchKind = "lessons" | "quizzes" | "courses";

export interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  description: string;
  href: string;
  /** Higher is a better match. */
  score: number;
}

const RESULT_LIMIT = 20;
/** Cap on individual terms, so a pasted paragraph does not produce a huge query. */
const MAX_TERMS = 6;

interface RawLesson {
  id: string;
  title: string;
  description: string;
  score: number;
}

export const GET = handleRoute((request: Request) =>
  withUser(async () => {
    const raw = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (raw.length < 2) {
      return NextResponse.json({ query: raw, results: [] as SearchHit[], total: 0 });
    }

    // Every term must appear somewhere. "1nt stayman" should find a lesson about
    // both, not either.
    const terms = raw.toLowerCase().split(/\s+/).filter(Boolean).slice(0, MAX_TERMS);

    // A term containing a LIKE metacharacter is matched literally. The escape
    // character is the default backslash, so a literal backslash is doubled.
    const escape = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);
    const like = (value: string) => `%${escape(value)}%`;

    const termClauses = terms.map(
      (t) => Prisma.sql`
        (l.title ILIKE ${like(t)}
          OR l.description ILIKE ${like(t)}
          OR COALESCE(l.content::text, '') ILIKE ${like(t)})
      `,
    );

    const lessonRows = await prisma.$queryRaw<RawLesson[]>(Prisma.sql`
      SELECT
        l.id,
        l.title,
        l.description,
        (
          -- Title is the strongest signal: someone typing a lesson name means it.
          (length(l.title) - length(replace(lower(l.title), ${terms[0]}, ''))) / greatest(length(${terms[0]}), 1) * 10
          + CASE WHEN l.description ILIKE ${like(terms[0])} THEN 4 ELSE 0 END
          + CASE WHEN COALESCE(l.content::text, '') ILIKE ${like(terms[0])} THEN 1 ELSE 0 END
        )::int AS score
      FROM "Lesson" l
      WHERE ${Prisma.join(termClauses, " AND ")}
      ORDER BY score DESC, l.title ASC
      LIMIT ${RESULT_LIMIT}
    `);

    // Quizzes and courses are plain string columns, so Prisma's API handles them
    // correctly and case-insensitively. Only the JSON body needed raw SQL.
    const [quizzes, courses] = await Promise.all([
      prisma.quiz.findMany({
        where: {
          AND: terms.map((t) => ({
            OR: [
              { title: { contains: t, mode: "insensitive" as const } },
              { description: { contains: t, mode: "insensitive" as const } },
            ],
          })),
        },
        select: { id: true, title: true, description: true },
        take: RESULT_LIMIT,
      }),
      prisma.course.findMany({
        where: {
          AND: terms.map((t) => ({
            OR: [
              { title: { contains: t, mode: "insensitive" as const } },
              { description: { contains: t, mode: "insensitive" as const } },
            ],
          })),
        },
        select: { id: true, title: true, description: true },
        take: RESULT_LIMIT,
      }),
    ]);

    const scoreText = (terms: string[], fields: string[]) =>
      terms.reduce(
        (total, t) => total + fields.filter((f) => f.toLowerCase().includes(t)).length * 4,
        0,
      );

    const results: SearchHit[] = [
      ...lessonRows.map((l) => ({
        id: l.id,
        kind: "lessons" as const,
        title: l.title,
        description: l.description,
        href: `/lesson/${l.id}`,
        score: l.score,
      })),
      ...quizzes.map((q) => ({
        id: q.id,
        kind: "quizzes" as const,
        title: q.title,
        description: q.description,
        href: `/quiz?id=${q.id}`,
        score: scoreText(terms, [q.title, q.description]),
      })),
      ...courses.map((c) => ({
        id: c.id,
        kind: "courses" as const,
        title: c.title,
        description: c.description,
        href: "/learning-path",
        score: scoreText(terms, [c.title, c.description]),
      })),
    ]
      .filter((r) => r.score > 0)
      // Score first, then title, so equal-scoring results are stable between
      // requests rather than reshuffling on every keystroke.
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, RESULT_LIMIT);

    return NextResponse.json({ query: raw, results, total: results.length });
  }),
);
