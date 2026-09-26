/**
 * Replay shows real hands (Sprint 60 follow-up).
 *
 * `/replay` rendered a hardcoded six-card scenario under the heading "expert-played
 * hands, one card at a time, with coach annotations on every move". Both the
 * plural and the "expert" were false: there was one hand, it was invented, and
 * six of six plays were marked `isBestPlay: true` — a judgement nothing in the
 * database supported.
 *
 * These tests pin the replacement: a scenario is derived from a persisted
 * auction, a correct call gets no comment, and an empty history renders an empty
 * state rather than a demonstration hand.
 */
import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as sessionModule from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { scenarioFromAuction, EMPTY_SCENARIO } from "@/components/replayEngine/HandReplayer";
import type { AuctionRecord } from "@/services/auctionService";

let stamp: number;
let userId: string;
let auctionId: string;

const asAuction = (overrides: Partial<AuctionRecord> = {}): AuctionRecord => ({
  id: "a1",
  handId: null,
  dealer: "S",
  vulnerability: "None",
  isComplete: true,
  passedOut: false,
  engine: {
    isComplete: true,
    currentContract: null,
    finalContract: { level: 3, strain: "NT", declarer: "S", passedOut: false },
  },
  actions: [],
  startedAt: new Date("2026-01-01").toISOString(),
  completedAt: null,
  ...overrides,
});

beforeAll(async () => {
  stamp = Date.now();
  const user = await prisma.user.create({
    data: {
      email: `replay-${stamp}@test.local`,
      passwordHash: await hashPassword("password123"),
      firstName: "Replay",
      lastName: "User",
      role: "user",
      status: "active",
    },
  });
  userId = user.id;
  const auction = await prisma.auction.create({
    data: { userId, dealer: "S", isComplete: true, finalLevel: 3, finalStrain: "NT" },
  });
  auctionId = auction.id;
  await prisma.auctionAction.createMany({
    data: [
      { auctionId, player: "S", type: "bid", level: 1, strain: "S", engineLegal: false, engineReason: "Too weak for an opening at 1 level", sequence: 1 },
      { auctionId, player: "N", type: "bid", level: 3, strain: "NT", engineLegal: true, sequence: 2 },
      { auctionId, player: "E", type: "pass", engineLegal: true, sequence: 3 },
    ],
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

afterEach(() => vi.restoreAllMocks());

describe("a replay scenario is derived from a real auction", () => {
  it("turns persisted calls into steps, in sequence", () => {
    const scenario = scenarioFromAuction(
      asAuction({
        actions: [
          { sequence: 1, player: "S", type: "bid", level: 1, strain: "S", engineLegal: false, engineReason: "Too weak" },
          { sequence: 2, player: "N", type: "bid", level: 3, strain: "NT", engineLegal: true, engineReason: null },
          { sequence: 3, player: "E", type: "pass", level: null, strain: null, engineLegal: true, engineReason: null },
        ],
      }),
    );
    expect(scenario.actions.map((a) => a.action)).toEqual(["1S", "3NT", "Pass"]);
    expect(scenario.actions[0].player).toBe("South");
  });

  it("annotates only the calls the engine objected to", () => {
    const scenario = scenarioFromAuction(
      asAuction({
        actions: [
          { sequence: 1, player: "S", type: "bid", level: 1, strain: "S", engineLegal: false, engineReason: "Too weak" },
          { sequence: 2, player: "N", type: "bid", level: 3, strain: "NT", engineLegal: true, engineReason: null },
        ],
      }),
    );
    expect(scenario.actions[0].explanation).toBe("Too weak");
    // The old scenario annotated every move, including six it called "best".
    // There is nothing to say about a call the engine accepted.
    expect(scenario.actions[1].explanation).toBeUndefined();
  });

  it("marks a correct call as best play and a rejected one as not", () => {
    const scenario = scenarioFromAuction(
      asAuction({
        actions: [
          { sequence: 1, player: "S", type: "bid", level: 1, strain: "S", engineLegal: false, engineReason: "Too weak" },
          { sequence: 2, player: "N", type: "bid", level: 3, strain: "NT", engineLegal: true, engineReason: null },
        ],
      }),
    );
    expect(scenario.actions[0].isBestPlay).toBe(false);
    expect(scenario.actions[1].isBestPlay).toBe(true);
  });

  it("has a genuinely empty scenario, so the page can be empty", () => {
    expect(EMPTY_SCENARIO.actions).toEqual([]);
  });

  it("serves only the signed-in user's own auctions", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
      id: userId,
      email: `replay-${stamp}@test.local`,
      firstName: "",
      lastName: "",
      role: "user",
      status: "active",
    });
    const { GET } = await import("@/app/api/auctions/route");
    const body = await (await GET(new Request("http://localhost/api/auctions"))).json();
    expect(body.auctions.length).toBe(1);
    expect(body.auctions[0].id).toBe(auctionId);
    // The recorded engine reason has to survive the round trip, or the replayer
    // has nothing to show.
    expect(body.auctions[0].actions.some((a: { engineReason: string | null }) => a.engineReason === "Too weak for an opening at 1 level")).toBe(true);
  });

  it("shows a different user an empty list, not someone else's hand", async () => {
    const other = await prisma.user.create({
      data: {
        email: `replay-other-${stamp}@test.local`,
        passwordHash: await hashPassword("password123"),
        firstName: "Other",
        lastName: "User",
        role: "user",
        status: "active",
      },
    });
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
      id: other.id,
      email: other.email,
      firstName: "",
      lastName: "",
      role: "user",
      status: "active",
    });
    const { GET } = await import("@/app/api/auctions/route");
    const body = await (await GET(new Request("http://localhost/api/auctions"))).json();
    expect(body.auctions).toHaveLength(0);
    await prisma.user.delete({ where: { id: other.id } });
  });
});
