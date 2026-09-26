/**
 * Sprint 58 §23 — persistence integration tests.
 *
 * Every domain follows the same contract: mutate → re-read → state persists.
 * These run against the real PostgreSQL instance using the development identity,
 * and clean up after themselves so the suite is repeatable.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma, resolveUserId } from "@/lib/db";
import { awardXp, recomputeProgression } from "@/lib/progression";
import { AuctionStateMachine, parseBid } from "@/bridge";

let userId: string;
/** Rows created by the test, removed in afterAll so the dev data stays clean. */
const created = {
  notes: [] as string[],
  bookmarks: [] as string[],
  drafts: [] as string[],
  conversations: [] as string[],
  auctions: [] as string[],
  sessions: [] as string[],
};

beforeAll(async () => {
  userId = await resolveUserId();
});

afterAll(async () => {
  await prisma.note.deleteMany({ where: { id: { in: created.notes } } });
  await prisma.bookmark.deleteMany({ where: { id: { in: created.bookmarks } } });
  await prisma.authorDraft.deleteMany({ where: { id: { in: created.drafts } } });
  await prisma.aIConversation.deleteMany({ where: { id: { in: created.conversations } } });
  await prisma.practiceSession.deleteMany({ where: { id: { in: created.sessions } } });
  await prisma.auction.deleteMany({ where: { id: { in: created.auctions } } });
  await recomputeProgression(userId);
  await prisma.$disconnect();
});

describe("LESSON: progress persists", () => {
  it("records completion, sections and timestamp", async () => {
    const now = new Date();
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: "l3" } },
      create: {
        userId,
        lessonId: "l3",
        completed: true,
        completedSectionIds: ["s1", "s2"],
        currentSectionIndex: 2,
        completedAt: now,
      },
      update: {},
    });

    // Re-read from the database, as a page refresh would.
    const reloaded = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: "l3" } },
    });
    expect(reloaded?.completed).toBe(true);
    expect(reloaded?.completedSectionIds).toEqual(["s1", "s2"]);
    expect(reloaded?.completedAt).toEqual(now);

    await prisma.lessonProgress.delete({ where: { id: reloaded!.id } });
  });
});

describe("XP: awards are idempotent and derived", () => {
  /**
   * Uses a throwaway user so the assertion holds regardless of what other test
   * files are doing to the shared development identity in parallel.
   */
  let xpUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `xp-test-${Date.now()}@bridgecoach.test`,
        firstName: "Xp",
        lastName: "Test",
      },
    });
    xpUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: xpUserId } }).catch(() => undefined);
  });

  it("does not double-award the same reference", async () => {
    const reference = `test:lesson:${Date.now()}`;
    const first = await awardXp(xpUserId, "LESSON_COMPLETED", reference, 42);
    const second = await awardXp(xpUserId, "LESSON_COMPLETED", reference, 42);

    expect(first.awarded).toBe(42);
    expect(second.awarded).toBe(0);

    const events = await prisma.xPEvent.findMany({
      where: { userId: xpUserId, reference },
    });
    expect(events).toHaveLength(1);
  });

  it("user.xp equals the sum of its applied XP events", async () => {
    await recomputeProgression(xpUserId);
    const [user, aggregate] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: xpUserId }, select: { xp: true } }),
      prisma.xPEvent.aggregate({
        where: { userId: xpUserId, status: "applied" },
        _sum: { amount: true },
      }),
    ]);
    expect(user.xp).toBe(aggregate._sum.amount ?? 0);
    expect(user.xp).toBeGreaterThan(0);
  });
});

describe("QUIZ: attempt persists with server-graded score", () => {
  it("stores the attempt and its per-question answers", async () => {
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId: "seed-quiz-bidding",
        score: 25,
        correctAnswers: 2,
        totalQuestions: 8,
        xpEarned: 30,
        answers: JSON.stringify({ q1: "1", q2: "0" }),
      },
    });

    const reloaded = await prisma.quizAttempt.findUnique({
      where: { id: attempt.id },
    });
    expect(reloaded?.score).toBe(25);
    expect(JSON.parse(String(reloaded!.answers))).toEqual({ q1: "1", q2: "0" });

    await prisma.quizAttempt.delete({ where: { id: attempt.id } });
  });
});

describe("PRACTICE: session and its actions persist", () => {
  it("stores the evidence of what the player did, not just a score", async () => {
    const session = await prisma.practiceSession.create({
      data: {
        userId,
        scenario: "persistence-test",
        isComplete: true,
        score: 80,
        maxScore: 100,
        actions: {
          create: [
            { sequence: 0, phase: "bidding", player: "N", call: "1NT", isCorrect: true },
            { sequence: 1, phase: "bidding", player: "S", call: "2C", isCorrect: true },
            { sequence: 2, phase: "play", player: "W", card: "S7", isCorrect: false },
          ],
        },
      },
      include: { actions: true },
    });
    created.sessions.push(session.id);

    const reloaded = await prisma.practiceSession.findUniqueOrThrow({
      where: { id: session.id },
      include: { actions: { orderBy: { sequence: "asc" } } },
    });

    expect(reloaded.score).toBe(80);
    expect(reloaded.actions).toHaveLength(3);
    expect(reloaded.actions.map((a) => a.call).filter(Boolean)).toEqual(["1NT", "2C"]);
    expect(reloaded.actions.find((a) => a.card)?.card).toBe("S7");
  });
});

describe("AUCTION: structured actions replay through the engine", () => {
  it("persists structured calls that reconstruct the full auction", async () => {
    const auction = await prisma.auction.create({
      data: {
        userId,
        dealer: "N",
        vulnerability: "None",
        isComplete: true,
        completedAt: new Date(),
        finalLevel: 4,
        finalStrain: "S",
        declarer: "N",
        actions: {
          create: [
            { sequence: 0, player: "N", type: "bid", level: 1, strain: "NT", engineLegal: true },
            { sequence: 1, player: "E", type: "pass", engineLegal: true },
            { sequence: 2, player: "S", type: "bid", level: 2, strain: "C", engineLegal: true },
            { sequence: 3, player: "W", type: "pass", engineLegal: true },
            { sequence: 4, player: "N", type: "bid", level: 2, strain: "S", engineLegal: true },
            { sequence: 5, player: "E", type: "pass", engineLegal: true },
            { sequence: 6, player: "S", type: "bid", level: 4, strain: "S", engineLegal: true },
            { sequence: 7, player: "W", type: "pass", engineLegal: true },
            { sequence: 8, player: "N", type: "pass", engineLegal: true },
            { sequence: 9, player: "E", type: "pass", engineLegal: true },
          ],
        },
      },
      include: { actions: { orderBy: { sequence: "asc" } } },
    });
    created.auctions.push(auction.id);

    // Re-read and replay exactly as the API does.
    const reloaded = await prisma.auction.findUniqueOrThrow({
      where: { id: auction.id },
      include: { actions: { orderBy: { sequence: "asc" } } },
    });
    const machine = new AuctionStateMachine({ dealer: "N", vulnerability: "None" });
    for (const action of reloaded.actions) {
      const call =
        action.type === "bid"
          ? parseBid(`${action.level}${action.strain}`)
          : ({ type: action.type } as never);
      machine.submit(call!);
    }
    const state = machine.getState();
    expect(state.isComplete).toBe(true);
    expect(state.finalContract?.contract?.level).toBe(4);
    expect(state.finalContract?.declarer).toBe("N");
  });
});

describe("ACHIEVEMENT: unlock survives re-read and is never duplicated", () => {
  it("persists an unlock once", async () => {
    const achievement = await prisma.achievement.findFirstOrThrow({ where: { id: "a1" } });
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      create: { userId, achievementId: achievement.id, progress: 1, unlocked: true, unlockedAt: new Date() },
      update: { unlocked: true },
    });

    const reloaded = await prisma.userAchievement.findUniqueOrThrow({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    });
    expect(reloaded.unlocked).toBe(true);
    expect(reloaded.unlockedAt).not.toBeNull();

    // A second attempt to record the same unlock is rejected by the database.
    await expect(
      prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      }),
    ).rejects.toThrow();
  });
});

describe("BOOKMARK: create then delete", () => {
  it("persists a bookmark and removes it", async () => {
    const bookmark = await prisma.bookmark.create({
      data: { userId, lessonId: "l1", title: "Test bookmark", type: "lesson" },
    });
    created.bookmarks.push(bookmark.id);

    const reloaded = await prisma.bookmark.findUnique({ where: { id: bookmark.id } });
    expect(reloaded?.title).toBe("Test bookmark");

    await prisma.bookmark.delete({ where: { id: bookmark.id } });
    expect(await prisma.bookmark.findUnique({ where: { id: bookmark.id } })).toBeNull();
  });
});

describe("NOTE: create, update, delete", () => {
  it("survives every mutation", async () => {
    const note = await prisma.note.create({
      data: { userId, title: "Original", content: "v1", tags: ["a"] },
    });
    created.notes.push(note.id);
    expect((await prisma.note.findUnique({ where: { id: note.id } }))?.content).toBe("v1");

    const updated = await prisma.note.update({
      where: { id: note.id },
      data: { content: "v2", title: "Updated" },
    });
    expect(updated.content).toBe("v2");
    expect((await prisma.note.findUnique({ where: { id: note.id } }))?.title).toBe("Updated");

    await prisma.note.delete({ where: { id: note.id } });
    expect(await prisma.note.findUnique({ where: { id: note.id } })).toBeNull();
  });
});

describe("AUTHOR STUDIO: draft persists beyond localStorage", () => {
  it("stores blocks as JSON and re-reads them intact", async () => {
    const blocks = [
      { id: "b1", type: "heading", text: "Stayman" },
      { id: "b2", type: "paragraph", text: "Responder bids 2C." },
    ];
    const draft = await prisma.authorDraft.create({
      data: { userId, title: "Stayman Lesson", blocks },
    });
    created.drafts.push(draft.id);

    const reloaded = await prisma.authorDraft.findUniqueOrThrow({ where: { id: draft.id } });
    expect(reloaded.title).toBe("Stayman Lesson");
    expect(reloaded.blocks).toEqual(blocks);
  });
});

describe("AI: conversation and messages persist", () => {
  it("stores a conversation with messages and a context reference", async () => {
    const conversation = await prisma.aIConversation.create({
      data: {
        userId,
        title: "About my 1NT opening",
        auctionId: null,
        messages: {
          create: [
            { role: "user", content: "Why 1NT with 16?" },
            { role: "assistant", content: "15-17 balanced.", provider: "opencode", model: "test-model" },
          ],
        },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    created.conversations.push(conversation.id);

    const reloaded = await prisma.aIConversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    expect(reloaded.messages).toHaveLength(2);
    expect(reloaded.messages[0].role).toBe("user");
    expect(reloaded.messages[1].provider).toBe("opencode");
    // Never store credentials.
    expect(JSON.stringify(reloaded)).not.toMatch(/api[_-]?key|secret|bearer/i);
  });
});

describe("OWNERSHIP: private rows are never orphaned", () => {
  it("every private record has an existing owner", async () => {
    const owners = await prisma.user.findMany({ select: { id: true } });
    const ownerIds = new Set(owners.map((o) => o.id));

    const privateRows = {
      lessonProgress: await prisma.lessonProgress.findMany({ select: { userId: true } }),
      practiceSessions: await prisma.practiceSession.findMany({ select: { userId: true } }),
      auctions: await prisma.auction.findMany({ select: { userId: true } }),
      quizAttempts: await prisma.quizAttempt.findMany({ select: { userId: true } }),
      xpEvents: await prisma.xPEvent.findMany({ select: { userId: true } }),
      bookmarks: await prisma.bookmark.findMany({ select: { userId: true } }),
      notes: await prisma.note.findMany({ select: { userId: true } }),
      conversations: await prisma.aIConversation.findMany({ select: { userId: true } }),
    };

    for (const [table, rows] of Object.entries(privateRows)) {
      for (const row of rows) {
        expect(ownerIds.has(row.userId), `${table} has an orphaned row`).toBe(true);
      }
    }
  });
});
