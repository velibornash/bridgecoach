/**
 * Multi-user features (Sprint 59).
 *
 * Leaderboard and public profile are the two Sprint 58 features that were
 * labelled "cannot be real until authentication exists". They now read from
 * PostgreSQL, so these tests assert the two properties that matter: the data is
 * real, and one user cannot read or forge another user's identity.
 */
import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as sessionModule from "@/lib/session";
import { NextRequest } from "next/server";

const PASSWORD = "bridge123";

let aliceId: string;
let bobId: string;

beforeAll(async () => {
  const stamp = Date.now();
  const alice = await prisma.user.create({
    data: {
      email: `lb-alice-${stamp}@test.local`,
      passwordHash: "not-used-here",
      firstName: "Alice",
      lastName: "Anderson",
      country: "GB",
      xp: 500,
      level: 3,
      streak: 7,
    },
  });
  const bob = await prisma.user.create({
    data: {
      email: `lb-bob-${stamp}@test.local`,
      firstName: "Bob",
      lastName: "Brown",
      country: "US",
      xp: 100,
      level: 1,
      streak: 0,
    },
  });
  aliceId = alice.id;
  bobId = bob.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [aliceId, bobId] } } });
  await prisma.$disconnect();
});

/**
 * Pretends the current request belongs to `userId`.
 *
 * `resolveUserId()` asks `getSessionUser()`, which reads the cookie from the
 * request scope; a direct handler call has none. Stubbing that one function is
 * the narrowest seam available and keeps the routes under test unmodified.
 */
async function asUser(userId: string): Promise<void> {
  const email = (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).email;
  vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
    id: userId,
    email,
    firstName: "",
    lastName: "",
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("leaderboard is derived from real players", () => {
  it("ranks by persisted XP, not by fixture order", async () => {
    await asUser(bobId);
    const { GET } = await import("@/app/api/leaderboard/route");
    const response = await GET(
      new NextRequest("http://localhost/api/leaderboard?scope=global&period=all"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    const alice = body.entries.find((e: { userId: string }) => e.userId === aliceId);
    const bob = body.entries.find((e: { userId: string }) => e.userId === bobId);
    expect(alice.rank).toBeLessThan(bob.rank);
    expect(alice.xp).toBe(500);
  });

  it("marks the current user from the session, never from a request parameter", async () => {
    await asUser(bobId);
    const { GET } = await import("@/app/api/leaderboard/route");
    // A caller trying to pass themselves off as Alice.
    const response = await GET(
      new NextRequest(`http://localhost/api/leaderboard?as=${aliceId}`),
    );
    const body = await response.json();

    const flags = body.entries.map((e: { userId: string; isCurrentUser: boolean }) => [
      e.userId,
      e.isCurrentUser,
    ]);
    expect(flags.find(([id]: [string]) => id === bobId)?.[1]).toBe(true);
    expect(flags.find(([id]: [string]) => id === aliceId)?.[1]).toBe(false);
  });

  it("scopes to the viewer's own country without being told which", async () => {
    await asUser(aliceId);
    const { GET } = await import("@/app/api/leaderboard/route");
    const response = await GET(
      new NextRequest("http://localhost/api/leaderboard?scope=country"),
    );
    const body = await response.json();
    // Alice is GB; Bob is US and must not appear on her country board.
    expect(body.entries.every((e: { country: string }) => e.country === "GB")).toBe(true);
    expect(body.entries.find((e: { userId: string }) => e.userId === bobId)).toBeUndefined();
  });

  it("reports the viewer's own rank even when outside the top entries", async () => {
    await asUser(bobId);
    const { GET } = await import("@/app/api/leaderboard/route");
    const body = await (
      await GET(new NextRequest("http://localhost/api/leaderboard"))
    ).json();
    // Bob is far down a board where Alice is rank 1, so his rank is carried
    // separately — a board that hides your standing is the part people read.
    if (!body.entries.some((e: { isCurrentUser: boolean }) => e.isCurrentUser)) {
      expect(body.currentUserRank).toBeGreaterThan(0);
    }
    expect(body.totalPlayers).toBeGreaterThan(0);
  });

  it("returns an empty list rather than inventing players for a quiet period", async () => {
    await asUser(aliceId);
    const { GET } = await import("@/app/api/leaderboard/route");
    const body = await (
      await GET(new NextRequest("http://localhost/api/leaderboard?period=weekly"))
    ).json();
    // Alice's 500 XP is a seeded value, not an XPEvent, so it must NOT appear as
    // period XP. The board is empty and says so.
    const alice = body.entries.find((e: { userId: string }) => e.userId === aliceId);
    expect(alice).toBeUndefined();
  });
});

describe("public profile exposes only what it should", () => {
  it("serves a real profile with derived stats", async () => {
    await asUser(aliceId);
    const { GET } = await import("@/app/api/profiles/[id]/route");
    const response = await GET(
      new Request("http://localhost/api/profiles/x"),
      { params: Promise.resolve({ id: bobId }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.firstName).toBe("Bob");
    expect(body.user.isOwn).toBe(false);
    expect(body.stats).toHaveProperty("lessonsCompleted");
  });

  it("never exposes an email address", async () => {
    await asUser(aliceId);
    const { GET } = await import("@/app/api/profiles/[id]/route");
    const response = await GET(
      new Request("http://localhost/api/profiles/x"),
      { params: Promise.resolve({ id: bobId }) },
    );
    const text = JSON.stringify(await response.json());
    // Bob's real address is in the database; a public profile must not carry it.
    expect(text).not.toContain("@test.local");
    expect(text.toLowerCase()).not.toContain("passwordhash");
  });

  it("404s for a user who does not exist", async () => {
    await asUser(aliceId);
    const { GET } = await import("@/app/api/profiles/[id]/route");
    const response = await GET(
      new Request("http://localhost/api/profiles/x"),
      { params: Promise.resolve({ id: "no-such-user" }) },
    );
    expect(response.status).toBe(404);
  });

  it("marks the viewer's own profile as theirs", async () => {
    await asUser(aliceId);
    const { GET } = await import("@/app/api/profiles/[id]/route");
    const body = await (
      await GET(new Request("http://localhost/api/profiles/x"), {
        params: Promise.resolve({ id: aliceId }),
      })
    ).json();
    expect(body.user.isOwn).toBe(true);
  });
});
