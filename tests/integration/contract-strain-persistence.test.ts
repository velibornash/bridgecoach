/**
 * T3 — trumps are derived from the contract, and a recorded call keeps the
 * strain that was actually bid.
 *
 * The bug this guards against: /play held `useState<Suit>('♠')` with no setter,
 * so spades were trumps in every hand including notrump, and every call was
 * written as `strain: "S"`. A 3NT auction was persisted as 3♠ — the record
 * disagreed with the bidding box the user had just clicked, and a replay read
 * back a contract nobody had bid.
 */
import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as sessionModule from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { AuctionStateMachine } from "@/bridge";
import { trumpSuitOf } from "@/bridge/contract";

let stamp: number;
let userId: string;

beforeAll(async () => {
  stamp = Date.now();
  const user = await prisma.user.create({
    data: {
      email: `trumps-${stamp}@test.local`,
      passwordHash: await hashPassword("password123"),
      firstName: "Trumps",
      lastName: "User",
      role: "user",
      status: "active",
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** POST /api/auctions as this user, with the given actions. */
async function postAuction(actions: Array<Record<string, unknown>>) {
  vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
    id: userId,
    email: `trumps-${stamp}@test.local`,
    role: "user",
  } as Awaited<ReturnType<typeof sessionModule.getSessionUser>>);

  const { POST } = await import("@/app/api/auctions/route");
  const request = new Request("http://localhost/api/auctions", {
    method: "POST",
    body: JSON.stringify({
      handId: null,
      dealer: "S",
      actions,
      isComplete: true,
    }),
  });
  return POST(request);
}

/**
 * The calls /play builds, in the wire format the API accepts: the call as it was
 * spoken, e.g. "3NT" and "P". The client used to send a structured object here,
 * which the route rejected.
 */
const NOTRUMP_ACTIONS = [
  { player: "S", bid: "3NT" },
  { player: "W", bid: "P" },
  { player: "N", bid: "P" },
  { player: "E", bid: "P" },
];

const SPADE_ACTIONS = [
  { player: "S", bid: "4S" },
  { player: "W", bid: "P" },
  { player: "N", bid: "P" },
  { player: "E", bid: "P" },
];

describe("a recorded 3NT auction persists strain NT", () => {
  it("stores the notrump strain rather than a suit", async () => {
    const response = await postAuction(NOTRUMP_ACTIONS);
    expect(response.status).toBe(201);
    const body = await response.json();
    const auctionId = body.id as string;

    const stored = await prisma.auction.findUniqueOrThrow({
      where: { id: auctionId },
      include: { actions: { orderBy: { sequence: "asc" } } },
    });

    // The strain the user bid is the strain on disk.
    const bidAction = stored.actions.find((a) => a.type === "bid")!;
    expect(bidAction.strain).toBe("NT");
    expect(bidAction.level).toBe(3);
    expect(bidAction.strain).not.toBe("S");

    // And the final contract is notrump, not spades.
    expect(stored.finalStrain).toBe("NT");
    expect(stored.finalLevel).toBe(3);
  });

  it("reads the contract back with no trumps", async () => {
    const response = await postAuction(NOTRUMP_ACTIONS);
    const body = await response.json();
    const stored = await prisma.auction.findUniqueOrThrow({
      where: { id: body.id },
      include: { actions: { orderBy: { sequence: "asc" } } },
    });

    // Replay the persisted rows back through the engine, as the replay does.
    const machine = new AuctionStateMachine({ dealer: "S" });
    for (const action of stored.actions) {
      if (action.type === "bid") {
        machine.submit(`${action.level}${action.strain}`);
      } else {
        machine.submit(action.type as "P");
      }
    }
    const contract = machine.finalContract()!.contract!;
    expect(contract.strain).toBe("NT");
    expect(trumpSuitOf(contract)).toBeNull();
  });

  it("still records a spade contract as spades", async () => {
    // The complement: making sure NT is not simply the answer every time.
    const response = await postAuction(SPADE_ACTIONS);
    expect(response.status).toBe(201);
    const body = await response.json();
    const stored = await prisma.auction.findUniqueOrThrow({
      where: { id: body.id },
      include: { actions: { orderBy: { sequence: "asc" } } },
    });
    expect(stored.finalStrain).toBe("S");
    expect(trumpSuitOf({ level: 4, strain: "S", doubled: false, redoubled: false })).toBe("S");
  });

  it("rejects a call it cannot parse rather than storing it", async () => {
    // "3Z" is not a bridge call. It must be a 400, not a row with a null strain
    // that later replays as something else.
    const response = await postAuction([{ player: "S", bid: "3Z" }]);
    expect(response.status).toBe(400);
  });

  it("rejects the object form the client used to send", async () => {
    // Regression guard for the mismatch itself: `RecordedAction.bid` was typed
    // as an object while the route called `requireString` on it, so every
    // auction from /play was a 400 and nothing was ever recorded.
    const response = await postAuction([
      { player: "S", bid: { type: "bid", level: 3, strain: "NT" } },
    ]);
    expect(response.status).toBe(400);
  });
});
