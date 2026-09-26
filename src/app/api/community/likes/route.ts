/**
 * Post likes and comments (Sprint 60).
 *
 *   POST /api/community/likes    → toggle { postId }
 *   GET  /api/community/comments → list comments for { postId }
 *   POST /api/community/comments → add a comment
 *
 * Toggle rather than an explicit "like"/"unlike": the client always wants the
 * opposite of the current state, and one endpoint with a compound-key delete
 * cannot drift out of sync with the table. Two endpoints would have to agree
 * about which direction the UI meant.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, readJson, badRequest, notFound, requireString } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_COMMENT = 300;

interface PostBody {
  postId?: unknown;
  body?: unknown;
}

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<{ postId?: unknown }>(request);
    const postId = requireString(body.postId, "postId");

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, deletedAt: true },
    });
    if (!post || post.deletedAt) throw notFound("No such post");

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await prisma.postLike.delete({
        where: { postId_userId: { postId, userId } },
      });
      const count = await prisma.postLike.count({ where: { postId } });
      return NextResponse.json({ liked: false, likes: count });
    }

    // The compound primary key means a double-click racing itself fails here
    // rather than creating two rows.
    await prisma.postLike.create({ data: { postId, userId } });
    const count = await prisma.postLike.count({ where: { postId } });
    return NextResponse.json({ liked: true, likes: count });
  }),
);
