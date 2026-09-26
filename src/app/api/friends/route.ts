/**
 * Friends (Sprint 60).
 *
 *   GET    /api/friends               → accepted friends + incoming requests
 *   POST   /api/friends               → send a request
 *   PATCH  /api/friends               → accept or decline an incoming request
 *   DELETE /api/friends?userId=…      → remove a friend or cancel a request
 *
 * Symmetry is the awkward part. A friendship is one row in each direction, so
 * every read has to consider both columns, and "delete" has to remove whichever
 * direction actually exists. Getting that wrong produces a friend list that
 * disagrees with itself, so the direction handling is centralised in
 * `existingEdges()` rather than repeated per query.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, readJson, badRequest, notFound, requireString } from "@/lib/apiRoute";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Both rows describing a relationship between two users, either direction. */
async function existingEdges(a: string, b: string) {
  return prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function presence(lastActiveAt: Date | null): { online: boolean; lastActive: string | null } {
  if (!lastActiveAt) return { online: false, lastActive: null };
  const ms = Date.now() - lastActiveAt.getTime();
  return {
    online: ms <= ONLINE_WINDOW_MS,
    lastActive: lastActiveAt.toISOString(),
  };
}

export const GET = handleRoute(() =>
  withUser(async (userId) => {
    const [accepted, incoming, outgoing] = await Promise.all([
      // Accepted, either direction. `distinct` on the user is what collapses the
      // two rows into one entry, and it is the step most easily forgotten.
      prisma.user.findMany({
        where: {
          id: { not: userId },
          OR: [
            { friendshipsSent: { some: { addresseeId: userId, status: "accepted" } } },
            { friendshipsReceived: { some: { requesterId: userId, status: "accepted" } } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          country: true,
          level: true,
          xp: true,
          lastActiveAt: true,
          _count: { select: { friendshipsReceived: { where: { status: "accepted" } } } },
        },
        orderBy: [{ xp: "desc" }],
        take: 100,
      }),
      prisma.friendship.findMany({
        where: { addresseeId: userId, status: "pending" },
        select: {
          requesterId: true,
          createdAt: true,
          requester: {
            select: { id: true, firstName: true, lastName: true, avatar: true, level: true, country: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.friendship.findMany({
        where: { requesterId: userId, status: "pending" },
        select: { addresseeId: true, createdAt: true },
      }),
    ]);

    // Mutual friend count needs a second query per friend, which is N+1. The
    // friend list is capped at 100 and the alternative is a window function
    // Prisma does not expose, so the batched approach below fetches every
    // accepted edge once and counts in memory — one query, not 100.
    const allAccepted = await prisma.friendship.findMany({
      where: { status: "accepted" },
      select: { requesterId: true, addresseeId: true },
    });
    const neighbours = new Map<string, Set<string>>();
    for (const edge of allAccepted) {
      if (!neighbours.has(edge.requesterId)) neighbours.set(edge.requesterId, new Set());
      if (!neighbours.has(edge.addresseeId)) neighbours.set(edge.addresseeId, new Set());
      neighbours.get(edge.requesterId)!.add(edge.addresseeId);
      neighbours.get(edge.addresseeId)!.add(edge.requesterId);
    }
    const mine = neighbours.get(userId) ?? new Set<string>();
    const mutualCount = (other: string) => {
      const theirs = neighbours.get(other) ?? new Set<string>();
      let n = 0;
      for (const id of theirs) if (mine.has(id)) n += 1;
      return n;
    };

    return NextResponse.json({
      friends: accepted.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        avatar: u.avatar,
        level: u.level,
        xp: u.xp,
        country: u.country,
        achievements: u._count.friendshipsReceived,
        mutualFriends: mutualCount(u.id),
        ...presence(u.lastActiveAt),
      })),
      incoming: incoming.map((r) => ({
        id: r.requester.id,
        name: `${r.requester.firstName} ${r.requester.lastName}`.trim(),
        avatar: r.requester.avatar,
        level: r.requester.level,
        country: r.requester.country,
        requestedAt: r.createdAt.toISOString(),
      })),
      outgoing: outgoing.map((r) => ({
        id: r.addresseeId,
        requestedAt: r.createdAt.toISOString(),
      })),
    });
  }),
);

interface SendBody {
  userId?: unknown;
}

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<SendBody>(request);
    const targetId = requireString(body.userId, "userId");

    if (targetId === userId) {
      throw badRequest("You cannot send a friend request to yourself", "SELF_REQUEST");
    }
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, status: true },
    });
    if (!target) throw notFound("No such user");
    // Sending a request to a pending account would queue a notification for
    // someone who cannot sign in to read it.
    if (target.status !== "active") throw badRequest("That account is not active", "NOT_ACTIVE");

    const edges = await existingEdges(userId, targetId);

    // Already my friend.
    if (edges.some((e) => e.status === "accepted")) {
      throw badRequest("You are already friends", "ALREADY_FRIENDS");
    }
    // They already asked me: accept instead of creating a second, dead request.
    const theirPending = edges.find((e) => e.status === "pending" && e.requesterId === targetId);
    if (theirPending) {
      await prisma.friendship.update({
        where: { requesterId_addresseeId: { requesterId: targetId, addresseeId: userId } },
        data: { status: "accepted", respondedAt: new Date() },
      });
      return NextResponse.json({ status: "accepted", autoAccepted: true });
    }
    const myPending = edges.find((e) => e.status === "pending" && e.requesterId === userId);
    if (myPending) {
      throw badRequest("You have already sent a request", "ALREADY_REQUESTED");
    }
    if (edges.some((e) => e.status === "blocked")) {
      throw badRequest("That account is not accepting requests", "BLOCKED");
    }

    // A declined pair is retried by deleting the old row first, because the
    // compound primary key means a second insert for the same pair fails.
    await prisma.friendship.deleteMany({
      where: { OR: [{ requesterId: userId, addresseeId: targetId }, { requesterId: targetId, addresseeId: userId }] },
    });
    await prisma.friendship.create({ data: { requesterId: userId, addresseeId: targetId } });

    return NextResponse.json({ status: "pending" }, { status: 201 });
  }),
);

interface RespondBody {
  userId?: unknown;
  action?: unknown;
}

export const PATCH = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<RespondBody>(request);
    const fromId = requireString(body.userId, "userId");
    const action = requireString(body.action, "action");
    if (action !== "accept" && action !== "decline") {
      throw badRequest("action must be 'accept' or 'decline'", "INVALID_ACTION");
    }

    // Only the addressee may respond. Keyed on the exact direction, so a
    // requester cannot accept their own request.
    const edge = await prisma.friendship.findUnique({
      where: { requesterId_addresseeId: { requesterId: fromId, addresseeId: userId } },
    });
    if (!edge) throw notFound("No such request");
    if (edge.status !== "pending") {
      throw badRequest(`That request was already ${edge.status}`, "ALREADY_DECIDED");
    }

    await prisma.friendship.update({
      where: { requesterId_addresseeId: { requesterId: fromId, addresseeId: userId } },
      data: {
        status: action === "accept" ? "accepted" : "declined",
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ status: action === "accept" ? "accepted" : "declined" });
  }),
);

export const DELETE = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const targetId = new URL(request.url).searchParams.get("userId");
    if (!targetId) throw badRequest("userId is required", "MISSING_USER_ID");

    // Both directions, so unfriending works regardless of who sent the request.
    const { count } = await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetId },
          { requesterId: targetId, addresseeId: userId },
        ],
      },
    });
    if (count === 0) throw notFound("No relationship with that account");

    return NextResponse.json({ removed: true });
  }),
);
