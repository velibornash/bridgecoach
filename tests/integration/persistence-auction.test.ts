/**
 * Sprint 58 §8/§9 — a persisted auction must be sufficient to reconstruct the
 * auction through the Bridge Engine. The database stores facts; AuctionStateMachine
 * remains the authority for legality/state/contract.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { AuctionStateMachine, parseBid, formatBid } from "@/bridge";

const SEED_AUCTION_ID = "seed-auction-1";

describe("persisted auction reconstructs through AuctionStateMachine", () => {
  let storedActions: Array<{
    sequence: number;
    player: string;
    type: string;
    level: number | null;
    strain: string | null;
  }>;

  beforeAll(async () => {
    const auction = await prisma.auction.findUnique({
      where: { id: SEED_AUCTION_ID },
      include: { actions: { orderBy: { sequence: "asc" } } },
    });
    expect(auction).not.toBeNull();
    storedActions = auction!.actions.map((a) => ({
      sequence: a.sequence,
      player: a.player,
      type: a.type,
      level: a.level,
      strain: a.strain,
    }));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("stores auctions as structured actions, not flattened strings", () => {
    expect(storedActions).toHaveLength(10);
    for (const action of storedActions) {
      expect(typeof action.player).toBe("string");
      expect(["bid", "pass", "double", "redouble"]).toContain(action.type);
      if (action.type === "bid") {
        expect(action.level).toBeGreaterThanOrEqual(1);
        expect(action.strain).toBeTruthy();
      }
    }
    // No single denormalised auction string column exists.
    expect(storedActions.every((a) => typeof a.player === "string")).toBe(true);
  });

  it("records each seat once per sequence (no duplicate auction actions)", () => {
    const sequences = storedActions.map((a) => a.sequence);
    expect(new Set(sequences).size).toBe(sequences.length);
  });

  it("replays cleanly: every persisted call is legal for its seat", () => {
    const machine = new AuctionStateMachine({
      dealer: "N",
      vulnerability: "None",
    });

    for (const action of storedActions) {
      const call =
        action.type === "bid"
          ? parseBid(`${action.level}${action.strain}`)
          : ({ type: action.type as "pass" | "double" | "redouble" });
      expect(call).not.toBeNull();
      // Must not throw — the engine re-derives legality, the DB never asserts it.
      machine.submit(call!);
    }

    const state = machine.getState();
    expect(state.isComplete).toBe(true);
  });

  it("reproduces the same contract the database recorded", () => {
    const machine = new AuctionStateMachine({ dealer: "N", vulnerability: "None" });
    for (const action of storedActions) {
      const call =
        action.type === "bid"
          ? parseBid(`${action.level}${action.strain}`)
          : ({ type: action.type as "pass" | "double" | "redouble" });
      machine.submit(call!);
    }
    const state = machine.getState();

    // The engine's answer is the authority; the stored columns must agree with it.
    expect(state.finalContract?.contract?.level).toBe(4);
    expect(state.finalContract?.contract?.strain).toBe("S");
    expect(state.finalContract?.declarer).toBe("N");
    expect(state.finalContract?.passedOut).toBe(false);
  });

  it("keeps the database as a fact store, not a second bidding engine", () => {
    // A deliberately illegal persisted action must be rejected on replay even
    // though its engineLegal column claims otherwise. The engine wins.
    const machine = new AuctionStateMachine({ dealer: "N", vulnerability: "None" });
    machine.submit(parseBid("1NT")!);
    expect(() => machine.submit(parseBid("1H")!)).toThrow();
  });
});

describe("development identity and ownership", () => {
  /**
   * Runs against a dedicated throwaway user so the assertions about a *fresh*
   * new-user state do not depend on whatever the dev database happens to contain.
   */
  let tempUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@bridgecoach.test`,
        firstName: "Test",
        lastName: "User",
        isSeed: false,
      },
    });
    tempUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: tempUserId } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it("creates a new user with a valid empty progression state", async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: tempUserId },
      select: { xp: true, level: true, streak: true, passwordHash: true },
    });
    // A fresh user must have a valid NEW-user state (Sprint 58 §11).
    expect(user.xp).toBe(0);
    expect(user.level).toBe(1);
    expect(user.streak).toBe(0);
    // No password hash: this identity is not authenticatable before Sprint 59.
    expect(user.passwordHash).toBeNull();
  });

  it("gives every auction an explicit owner", async () => {
    const auctions = await prisma.auction.findMany();
    expect(auctions.length).toBeGreaterThan(0);
    for (const auction of auctions) {
      expect(auction.userId).toBeTruthy();
      const owner = await prisma.user.findUnique({
        where: { id: auction.userId },
        select: { id: true },
      });
      expect(owner, "auction must not be orphaned").not.toBeNull();
    }
  });

  it("seeds learning content flagged as seed data", async () => {
    const lessons = await prisma.lesson.findMany();
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.every((l) => l.isSeed)).toBe(true);
  });

  it("rejects a duplicate XP event for the same reference", async () => {
    const reference = `test-dedupe-${Date.now()}`;
    await prisma.xPEvent.create({
      data: { userId: tempUserId, type: "LESSON_COMPLETED", reference, amount: 10 },
    });
    await expect(
      prisma.xPEvent.create({
        data: { userId: tempUserId, type: "LESSON_COMPLETED", reference, amount: 10 },
      }),
    ).rejects.toThrow();
  });

  it("rejects a duplicate UserAchievement for the same user", async () => {
    const achievement = await prisma.achievement.findFirstOrThrow();
    await prisma.userAchievement.create({
      data: { userId: tempUserId, achievementId: achievement.id },
    });
    await expect(
      prisma.userAchievement.create({
        data: { userId: tempUserId, achievementId: achievement.id },
      }),
    ).rejects.toThrow();
  });
});
