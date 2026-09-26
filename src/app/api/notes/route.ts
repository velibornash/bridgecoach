/**
 * Notes (Sprint 58 §14, §20).
 *
 * GET    /api/notes      → the user's notes
 * POST   /api/notes      → create
 * PATCH  /api/notes/[id] → update
 * DELETE /api/notes/[id] → delete
 */
import { NextResponse } from "next/server";
import {
  handleRoute,
  withUser,
  prisma,
  readJson,
  requireString,
  notFound,
} from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        lessonId: n.lessonId,
        title: n.title,
        content: n.content,
        tags: n.tags,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    });
  }),
);

interface NoteBody {
  lessonId?: unknown;
  title?: unknown;
  content?: unknown;
  tags?: unknown;
}

function parseTags(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw notFound('"tags" must be an array of strings');
  }
  return value as string[];
}

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<NoteBody>(request);
    const title = requireString(body.title, "title");
    const content = typeof body.content === "string" ? body.content : "";

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

    const note = await prisma.note.create({
      data: {
        userId,
        lessonId: (body.lessonId as string | undefined) ?? null,
        title,
        content,
        tags: parseTags(body.tags),
      },
    });

    return NextResponse.json(
      {
        id: note.id,
        lessonId: note.lessonId,
        title: note.title,
        content: note.content,
        tags: note.tags,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      },
      { status: 201 },
    );
  }),
);
