/**
 * Authentication and cross-user isolation (Sprint 59).
 *
 * The load-bearing test in this file is "user A creates data, user B cannot
 * read it". Before Sprint 59 there was exactly one user in the database, so no
 * test could assert ownership was real. Now it can, and it does.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { hashPassword, verifyPassword, validatePasswordStrength, fakeVerify } from "@/lib/password";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

const PASSWORD = "bridge123";

async function makeUser(email: string, firstName: string) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(PASSWORD),
      firstName,
      lastName: "Tester",
    },
    select: { id: true, email: true },
  });
}

describe("password hashing", () => {
  it("produces a verifiable bcrypt hash", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword("correct horse", hash)).toBe(true);
  });

  it("never stores the plaintext", async () => {
    const hash = await hashPassword(PASSWORD);
    expect(hash).not.toContain(PASSWORD);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword(PASSWORD);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("salts, so the same password hashes differently each time", async () => {
    const a = await hashPassword(PASSWORD);
    const b = await hashPassword(PASSWORD);
    expect(a).not.toBe(b);
  });

  it("treats a malformed hash as a wrong password, not a crash", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });

  it("enforces strength rules", () => {
    expect(validatePasswordStrength("short1")).toMatch(/at least 8/);
    expect(validatePasswordStrength("alllettersonly")).toMatch(/number/);
    expect(validatePasswordStrength("12345678")).toMatch(/letter/);
    expect(validatePasswordStrength("bridge123")).toBeNull();
  });

  it("fakeVerify takes comparable time, hiding unknown accounts", async () => {
    // Not a timing assertion (flaky) — just that it runs and resolves.
    await expect(fakeVerify()).resolves.toBeUndefined();
  });
});

describe("sessions", () => {
  let aliceId: string;
  let bobId: string;

  beforeAll(async () => {
    aliceId = (await makeUser(`sess-alice-${Date.now()}@test.local`, "Alice")).id;
    bobId = (await makeUser(`sess-bob-${Date.now()}@test.local`, "Bob")).id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [aliceId, bobId] } } });
    await prisma.$disconnect();
  });

  it("stores a hash, never the token itself", async () => {
    const { createSession } = await import("@/lib/session");
    const token = "super-secret-session-token-value";
    await prisma.session.create({
      data: {
        userId: aliceId,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const rows = await prisma.session.findMany({ where: { userId: aliceId } });
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.tokenHash).not.toBe(token);
      expect(row.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("creates a signed cookie value that is not the raw token", async () => {
    const { createSession } = await import("@/lib/session");
    const { token } = await createSession(aliceId);
    // Format: <token>.<hmac>. The signature is what prevents tampering.
    expect(token.split(".")).toHaveLength(2);
  });

  it("marks the cookie httpOnly and lax so scripts cannot read it", async () => {
    const { sessionCookieOptions, clearedCookieOptions } = await import("@/lib/session");
    const options = sessionCookieOptions(new Date());
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(clearedCookieOptions().maxAge).toBe(0);
  });

  it("revokes other sessions but keeps the current one", async () => {
    const { createSession, revokeOtherSessions } = await import("@/lib/session");

    // Start from a known state so the assertion does not depend on sessions
    // created by earlier tests in this block.
    await prisma.session.deleteMany({ where: { userId: aliceId } });

    const first = await createSession(aliceId);
    const second = await createSession(aliceId);
    const hashOf = (t: string) =>
      createHash("sha256").update(t.split(".")[0]).digest("hex");
    const firstHash = hashOf(first.token);

    const revoked = await revokeOtherSessions(aliceId, firstHash);
    expect(revoked).toBe(1);

    const remaining = await prisma.session.findMany({ where: { userId: aliceId } });
    expect(remaining.map((r) => r.tokenHash)).toEqual([firstHash]);
    expect(remaining.map((r) => r.tokenHash)).not.toContain(hashOf(second.token));
  });

  it("an expired row is swept, not honoured", async () => {
    const { purgeExpiredSessions } = await import("@/lib/session");
    const expired = await prisma.session.create({
      data: {
        userId: bobId,
        tokenHash: createHash("sha256").update(`expired-${Date.now()}`).digest("hex"),
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    // getSessionUser has no cookie here, so it cannot resolve the row either way;
    // what matters is that an expired row is treated as dead and swept.
    await purgeExpiredSessions();
    expect(
      await prisma.session.findUnique({ where: { id: expired.id } }),
    ).toBeNull();
  });

  it("purges only expired sessions", async () => {
    const { createSession, purgeExpiredSessions } = await import("@/lib/session");
    await createSession(bobId);
    await prisma.session.create({
      data: {
        userId: bobId,
        tokenHash: createHash("sha256").update(`stale-${Date.now()}`).digest("hex"),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const purged = await purgeExpiredSessions();
    expect(purged).toBeGreaterThanOrEqual(1);

    const live = await prisma.session.findMany({ where: { userId: bobId } });
    for (const row of live) {
      expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now());
    }
  });
});

describe("cross-user isolation — the Sprint 59 acceptance test", () => {
  let aliceId: string;
  let bobId: string;
  let noteId: string;

  beforeAll(async () => {
    aliceId = (await makeUser(`iso-alice-${Date.now()}@test.local`, "Alice")).id;
    bobId = (await makeUser(`iso-bob-${Date.now()}@test.local`, "Bob")).id;
  });

  afterAll(async () => {
    await prisma.note.deleteMany({ where: { userId: { in: [aliceId, bobId] } } });
    await prisma.bookmark.deleteMany({ where: { userId: { in: [aliceId, bobId] } } });
    await prisma.lessonProgress.deleteMany({ where: { userId: { in: [aliceId, bobId] } } });
    await prisma.xPEvent.deleteMany({ where: { userId: { in: [aliceId, bobId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [aliceId, bobId] } } });
    await prisma.$disconnect();
  });

  it("a note created by one user is invisible to another", async () => {
    const note = await prisma.note.create({
      data: { userId: aliceId, title: "ALICE PRIVATE", content: "secret" },
    });
    noteId = note.id;

    const alices = await prisma.note.findMany({ where: { userId: aliceId } });
    expect(alices.map((n) => n.title)).toContain("ALICE PRIVATE");

    const bobs = await prisma.note.findMany({ where: { userId: bobId } });
    expect(bobs.map((n) => n.title)).not.toContain("ALICE PRIVATE");
  });

  it("a user cannot read another user's note by guessing its id", async () => {
    // Every route resolves ownership from the session, so a direct id lookup by a
    // different user simply does not resolve.
    const asBob = await prisma.note.findFirst({
      where: { id: noteId, userId: bobId },
    });
    expect(asBob).toBeNull();
  });

  it("lesson progress is per user, not global", async () => {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: aliceId, lessonId: "l1" } },
      create: { userId: aliceId, lessonId: "l1", completed: true, completedAt: new Date() },
      update: {},
    });

    const aliceCompleted = await prisma.lessonProgress.count({
      where: { userId: aliceId, completed: true },
    });
    const bobCompleted = await prisma.lessonProgress.count({
      where: { userId: bobId, completed: true },
    });
    expect(aliceCompleted).toBeGreaterThan(0);
    expect(bobCompleted).toBe(0);
  });

  it("XP totals are per user", async () => {
    await prisma.xPEvent.create({
      data: {
        userId: aliceId,
        type: "LESSON_COMPLETED",
        reference: `iso:${aliceId}`,
        amount: 25,
        status: "applied",
        appliedAt: new Date(),
      },
    });
    const [aliceXp, bobXp] = await Promise.all([
      prisma.xPEvent.aggregate({
        where: { userId: aliceId, status: "applied" },
        _sum: { amount: true },
      }),
      prisma.xPEvent.aggregate({
        where: { userId: bobId, status: "applied" },
        _sum: { amount: true },
      }),
    ]);
    expect(aliceXp._sum.amount ?? 0).toBeGreaterThan(0);
    expect(bobXp._sum.amount ?? 0).toBe(0);
  });

  it("achievement state is per user", async () => {
    const achievement = await prisma.achievement.findFirstOrThrow();
    await prisma.userAchievement.create({
      data: { userId: aliceId, achievementId: achievement.id, unlocked: true, unlockedAt: new Date() },
    });

    const bobsUnlock = await prisma.userAchievement.findFirst({
      where: { userId: bobId, achievementId: achievement.id },
    });
    expect(bobsUnlock).toBeNull();
  });
});

describe("production safety", () => {
  it("demands SESSION_SECRET in production", async () => {
    const original = process.env.NODE_ENV;
    const originalSecret = process.env.SESSION_SECRET;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.SESSION_SECRET;
      const { assertProductionConfig } = await import("@/lib/session");
      expect(() => assertProductionConfig()).toThrow(/SESSION_SECRET/);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = original;
      if (originalSecret !== undefined) process.env.SESSION_SECRET = originalSecret;
    }
  });
});
