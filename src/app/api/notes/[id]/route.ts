/**
 * Single-note update and delete (Sprint 58 §14, §20).
 *
 * PATCH  /api/notes/[id]
 * DELETE /api/notes/[id]
 *
 * A note owned by another user is reported as not found, never mutated.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, readJson, notFound } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface NotePatch {
  title?: unknown;
  content?: unknown;
  tags?: unknown;
  lessonId?: unknown;
  pinned?: unknown;
}

export const PATCH = handleRoute(
  async (request: Request, ctx: RouteContext<"/api/notes/[id]">) =>
    withUser(async (userId) => {
      const { id } = await ctx.params;
      const existing = await prisma.note.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
      if (!existing || existing.userId !== userId) {
        throw notFound(`Note "${id}" does not exist`);
      }

      const body = await readJson<NotePatch>(request);
      if (
        body.title !== undefined &&
        (typeof body.title !== "string" || body.title.trim().length === 0)
      ) {
        throw notFound('"title" must be a non-empty string');
      }
      if (body.tags !== undefined && !Array.isArray(body.tags)) {
        throw notFound('"tags" must be an array of strings');
      }

      const note = await prisma.note.update({
        where: { id },
        data: {
          ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
          ...(typeof body.content === "string" ? { content: body.content } : {}),
          ...(Array.isArray(body.tags)
            ? { tags: body.tags.filter((t): t is string => typeof t === "string") }
            : {}),
          ...(typeof body.lessonId === "string" ? { lessonId: body.lessonId } : {}),
          ...(typeof body.pinned === "boolean" ? { pinned: body.pinned } : {}),
        },
      });

      return NextResponse.json({
        id: note.id,
        lessonId: note.lessonId,
        title: note.title,
        content: note.content,
        tags: note.tags,
        pinned: note.pinned,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      });
    }),
);

export const DELETE = handleRoute(
  async (_request: Request, ctx: RouteContext<"/api/notes/[id]">) =>
    withUser(async (userId) => {
      const { id } = await ctx.params;
      const existing = await prisma.note.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
      if (!existing || existing.userId !== userId) {
        throw notFound(`Note "${id}" does not exist`);
      }
      await prisma.note.delete({ where: { id } });
      return NextResponse.json({ id, deleted: true });
    }),
);
