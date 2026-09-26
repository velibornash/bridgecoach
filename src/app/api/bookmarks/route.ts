/**
 * Bookmarks (Sprint 58 §14, §20).
 *
 * GET    /api/bookmarks     → the user's bookmarks
 * POST   /api/bookmarks     → create
 * DELETE /api/bookmarks/[id] → delete
 */
import { NextResponse } from "next/server";
import {
  handleRoute,
  withUser,
  prisma,
  readJson,
  requireString,
  optionalInt,
  notFound,
  forbidden,
} from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        lessonId: b.lessonId,
        type: b.type,
        refId: b.refId,
        title: b.title,
        description: b.description,
        position: b.position,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  }),
);

interface BookmarkBody {
  lessonId?: unknown;
  type?: unknown;
  refId?: unknown;
  title?: unknown;
  description?: unknown;
  position?: unknown;
}

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<BookmarkBody>(request);
    const title = requireString(body.title, "title");

    if (body.lessonId != null && typeof body.lessonId !== "string") {
      throw notFound('"lessonId" must be a string');
    }
    if (body.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: body.lessonId },
        select: { id: true },
      });
      if (!lesson) throw notFound(`Lesson "${body.lessonId}" does not exist`);
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        lessonId: (body.lessonId as string | undefined) ?? null,
        type: typeof body.type === "string" ? body.type : "lesson",
        refId: typeof body.refId === "string" ? body.refId : null,
        title,
        description: typeof body.description === "string" ? body.description : "",
        position: optionalInt(body.position, "position", { min: 0 }) ?? 0,
      },
    });

    return NextResponse.json(
      {
        id: bookmark.id,
        lessonId: bookmark.lessonId,
        type: bookmark.type,
        refId: bookmark.refId,
        title: bookmark.title,
        description: bookmark.description,
        position: bookmark.position,
        createdAt: bookmark.createdAt.toISOString(),
      },
      { status: 201 },
    );
  }),
);
