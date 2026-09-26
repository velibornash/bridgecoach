/**
 * Post comments (Sprint 60).
 *
 *   GET  /api/community/comments?postId=… → list
 *   POST /api/community/comments          → add
 *   DELETE /api/community/comments?id=…   → soft-delete, author or admin
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, readJson, badRequest, notFound, forbidden, requireString } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_COMMENT = 300;

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  level: true,
} as const;

export const GET = handleRoute((request: Request) =>
  withUser(async () => {
    const postId = new URL(request.url).searchParams.get("postId");
    if (!postId) throw badRequest("postId is required", "MISSING_POST_ID");

    const comments = await prisma.postComment.findMany({
      where: { postId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.author.id,
          name: `${c.author.firstName} ${c.author.lastName}`.trim(),
          avatar: c.author.avatar,
          level: c.author.level,
        },
      })),
    });
  }),
);

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<{ postId?: unknown; body?: unknown }>(request);
    const postId = requireString(body.postId, "postId");
    const text = requireString(body.body, "body").trim();

    if (text.length > MAX_COMMENT) {
      throw badRequest(`Comments are limited to ${MAX_COMMENT} characters`, "COMMENT_TOO_LONG");
    }
    if (text.length < 1) throw badRequest("Write something first", "COMMENT_TOO_SHORT");

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, deletedAt: true },
    });
    if (!post || post.deletedAt) throw notFound("No such post");

    const comment = await prisma.postComment.create({
      data: { postId, authorId: userId, body: text },
      select: { id: true, body: true, createdAt: true },
    });

    return NextResponse.json(comment, { status: 201 });
  }),
);

export const DELETE = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw badRequest("id is required", "MISSING_ID");

    const comment = await prisma.postComment.findUnique({
      where: { id },
      select: { id: true, authorId: true, deletedAt: true },
    });
    if (!comment || comment.deletedAt) throw notFound("No such comment");

    const me = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } });
    if (comment.authorId !== userId && me.role !== "owner" && me.role !== "admin") {
      throw forbidden("You can only delete your own comments");
    }

    await prisma.postComment.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ deleted: true });
  }),
);
