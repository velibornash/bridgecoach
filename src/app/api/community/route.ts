/**
 * Community posts (Sprint 60).
 *
 *   GET    /api/community              → feed, newest first
 *   POST   /api/community              → create a post
 *   POST   /api/community/likes        → toggle a like
 *   POST   /api/community/comments     → add a comment
 *   DELETE /api/community?postId=…     → soft-delete, author or admin only
 *
 * Deletion is a soft delete (`deletedAt`), not a row removal. A post that
 * disappears entirely makes every comment under it dangle from the reader's
 * point of view, and there is no way to tell "edited" from "never existed".
 *
 * `likes` is a table, not a counter, so "did I like this" is answerable and one
 * person cannot inflate a count by refreshing.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, readJson, badRequest, notFound, forbidden, requireString } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 500;
const MAX_COMMENT = 300;
const PAGE_SIZE = 30;

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  level: true,
} as const;

export const GET = handleRoute((request: Request) =>
  withUser(async (userId) => {
    const before = new URL(request.url).searchParams.get("before");

    const posts = await prisma.communityPost.findMany({
      where: { deletedAt: null },
      // Cursor pagination on createdAt. Offset pagination would drift as new
      // posts arrive, which on a feed means silently skipping content.
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE,
      include: {
        author: { select: authorSelect },
        likes: { select: { userId: true } },
        _count: { select: { comments: { where: { deletedAt: null } } } },
      },
    });

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        body: p.body,
        type: p.type,
        relatedType: p.relatedType,
        relatedId: p.relatedId,
        createdAt: p.createdAt.toISOString(),
        author: {
          id: p.author.id,
          name: `${p.author.firstName} ${p.author.lastName}`.trim(),
          avatar: p.author.avatar,
          level: p.author.level,
        },
        likes: p.likes.length,
        likedByMe: p.likes.some((l) => l.userId === userId),
        comments: p._count.comments,
      })),
      nextCursor: posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null,
    });
  }),
);

interface CreateBody {
  body?: unknown;
  type?: unknown;
  relatedType?: unknown;
  relatedId?: unknown;
}

/** The categories the feed filter understands. */
const POST_TYPES = new Set(["achievement", "lesson_completed", "milestone", "streak"]);

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<CreateBody>(request);
    const text = requireString(body.body, "body").trim();

    if (text.length > MAX_BODY) {
      throw badRequest(`Posts are limited to ${MAX_BODY} characters`, "POST_TOO_LONG");
    }
    if (text.length < 2) {
      throw badRequest("Write something first", "POST_TOO_SHORT");
    }

    // An unrecognised category falls back to "milestone" rather than being
    // rejected: the feed filter would otherwise hide the post entirely, and a
    // post nobody can see is a worse outcome than a mislabelled one.
    const type =
      typeof body.type === "string" && POST_TYPES.has(body.type) ? body.type : "milestone";

    const relatedType =
      typeof body.relatedType === "string" ? body.relatedType : null;
    const relatedId = typeof body.relatedId === "string" ? body.relatedId : null;
    // Still a genuine pairing: a relation with no target is not a relation.
    if ((relatedType && !relatedId) || (!relatedType && relatedId)) {
      throw badRequest("relatedType and relatedId must be given together", "BAD_RELATION");
    }

    const post = await prisma.communityPost.create({
      data: { authorId: userId, body: text, type, relatedType, relatedId },
      select: { id: true, body: true, type: true, createdAt: true },
    });

    return NextResponse.json(post, { status: 201 });
  }),
);

export const DELETE = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const postId = new URL(request.url).searchParams.get("postId");
    if (!postId) throw badRequest("postId is required", "MISSING_POST_ID");

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, deletedAt: true },
    });
    if (!post || post.deletedAt) throw notFound("No such post");

    const me = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { role: true },
    });
    // Author or administrator. Checked against the stored authorId, never a
    // value from the request body.
    if (post.authorId !== userId && me.role !== "owner" && me.role !== "admin") {
      throw forbidden("You can only delete your own posts");
    }

    await prisma.communityPost.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ deleted: true });
  }),
);
