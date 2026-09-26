/**
 * Blocking (Sprint 60 follow-up).
 *
 *   GET    /api/blocks → who this account has blocked
 *   POST   /api/blocks → block someone
 *   DELETE /api/blocks?userId=… → unblock
 *
 * A block is one-directional on purpose. It is a personal boundary, and making
 * it symmetric would silently change the blocked user's own action list without
 * them doing anything — which is both surprising and a way to grief.
 *
 * What a block does:
 *   - the blocker cannot send a friend request to the blocked user
 *   - neither party can send a friend request to the other
 *   - the blocked user's posts and comments are hidden from the blocker's feed
 *
 * What it deliberately does not do: it is not a platform-wide action. The
 * blocked user is not suspended, and their content is still visible to everyone
 * else. Anything stronger is a moderation decision and belongs to an owner at
 * `/admin`.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, readJson, badRequest, notFound, requireString } from "@/lib/apiRoute";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ids this account has blocked, for filtering a feed.
 *
 * Returned as a Set so callers can do a single `has()` per row rather than
 * issuing a query per row.
 */
export async function blockedIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.blockedUser.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });
  return new Set(rows.map((r) => r.blockedId));
}

export const GET = handleRoute(() =>
  withUser(async (userId) => {
    const rows = await prisma.blockedUser.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        blocked: {
          select: { id: true, firstName: true, lastName: true, avatar: true, level: true },
        },
      },
    });

    return NextResponse.json({
      blocked: rows.map((r) => ({
        id: r.blocked.id,
        name: `${r.blocked.firstName} ${r.blocked.lastName}`.trim(),
        avatar: r.blocked.avatar,
        level: r.blocked.level,
        reason: r.reason,
        blockedAt: r.createdAt.toISOString(),
      })),
    });
  }),
);

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<{ userId?: unknown; reason?: unknown }>(request);
    const targetId = requireString(body.userId, "userId");
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 280) : null;

    if (targetId === userId) {
      throw badRequest("You cannot block yourself", "SELF_BLOCK");
    }
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, status: true },
    });
    if (!target) throw notFound("No such user");

    // Blocking removes any pending request in either direction, because leaving
    // one behind would let the other party keep a claim on the relationship
    // after the block.
    await prisma.$transaction([
      prisma.blockedUser.upsert({
        where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
        create: { blockerId: userId, blockedId: targetId, reason },
        update: { reason },
      }),
      prisma.friendship.deleteMany({
        where: {
          status: "pending",
          OR: [
            { requesterId: userId, addresseeId: targetId },
            { requesterId: targetId, addresseeId: userId },
          ],
        },
      }),
    ]);

    return NextResponse.json({ blocked: true, userId: targetId }, { status: 201 });
  }),
);

export const DELETE = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const targetId = new URL(request.url).searchParams.get("userId");
    if (!targetId) throw badRequest("userId is required", "MISSING_USER_ID");

    const { count } = await prisma.blockedUser.deleteMany({
      where: { blockerId: userId, blockedId: targetId },
    });
    if (count === 0) throw notFound("That account is not blocked");

    return NextResponse.json({ unblocked: true });
  }),
);
