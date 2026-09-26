/**
 * Author Studio draft deletion (Sprint 58 §15, §20).
 *
 * DELETE /api/author-studio/drafts/[id]
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, notFound } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = handleRoute(
  async (_request: Request, ctx: RouteContext<"/api/author-studio/drafts/[id]">) =>
    withUser(async (userId) => {
      const { id } = await ctx.params;
      const existing = await prisma.authorDraft.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
      if (!existing || existing.userId !== userId) {
        throw notFound(`Draft "${id}" does not exist`);
      }
      await prisma.authorDraft.delete({ where: { id } });
      return NextResponse.json({ id, deleted: true });
    }),
);
