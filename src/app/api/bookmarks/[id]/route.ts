/**
 * Bookmark deletion (Sprint 58 §14, §20).
 *
 * DELETE /api/bookmarks/[id]
 *
 * Ownership is enforced: a bookmark belonging to another user is reported as not
 * found rather than deleted, so ids cannot be probed (§25, §27).
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, notFound } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = handleRoute(
  async (_request: Request, ctx: RouteContext<"/api/bookmarks/[id]">) =>
    withUser(async (userId) => {
      const { id } = await ctx.params;
      const existing = await prisma.bookmark.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
      if (!existing || existing.userId !== userId) {
        throw notFound(`Bookmark "${id}" does not exist`);
      }

      await prisma.bookmark.delete({ where: { id } });
      return NextResponse.json({ id, deleted: true });
    }),
);
