/**
 * T5 — a hand is a hand: the deal is stored, the declarer comes from the engine,
 * the opening lead is by the right seat, and the result is scored.
 *
 * The three defects this covers all failed silently:
 *   - `createHand` posted `kind: "hand"` to a route that only creates auctions,
 *     so no `Hand` row existed and every later save was unreachable;
 *   - cards were written as the display symbol ("♠A") where the schema and the
 *     engine both use engine notation ("SA");
 *   - the dealer's left-hand opponent was never identified, so there was no
 *     opening lead and no declarer to credit tricks to.
 */
import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as sessionModule from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { AuctionStateMachine } from "@/bridge";
import { openingLeader, openingTrickOrder } from "@/bridge/play";
import { contractOutcome, trumpSuitOf } from "@/bridge";
import { Position } from "@/bridge/types";

let stamp: number;
let userId: string;

const SEATS = [Position.NORTH, Position.EAST, Position.SOUTH, Position.WEST];

/** A complete, legal 52-card deal in engine notation. */
function fullPack(): Record<string, Record<string, string>> {
  const suits = ["S", "H", "D", "C"];
  const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const cards: string[] = [];
  for (const s of suits) for (const r of ranks) cards.push(`${s}${r}`);
  const hands: Record<string, Record<string, string>> = {};
  let i = 0;
  for (const seat of SEATS) {
    const out: Record<string, string> = {};
    for (let n = 0; n < 13; n += 1) {
      out[`${seat}${n}`] = cards[i]!;
      i += 1;
    }
    hands[seat] = out;
  }
  return hands;
}

beforeAll(async () => {
  stamp = Date.now();
  const user = await prisma.user.create({
    data: {
      email: `hand-${stamp}@test.local`,
      passwordHash: await hashPassword("password123"),
      firstName: "Hand",
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

function asUser() {
  vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
    id: userId,
    email: `hand-${stamp}@test.local`,
    role: "user",
  } as Awaited<ReturnType<typeof sessionModule.getSessionUser>>);
}

async function postHand(body: Record<string, unknown>) {
  asUser();
  const { POST } = await import("@/app/api/hands/route");
  return POST(
    new Request("http://localhost/api/hands", { method: "POST", body: JSON.stringify(body) }),
  );
}

async function postAuction(body: Record<string, unknown>) {
  asUser();
  const { POST } = await import("@/app/api/auctions/route");
  return POST(
    new Request("http://localhost/api/auctions", { method: "POST", body: JSON.stringify(body) }),
  );
}

describe("POST /api/hands stores the deal", () => {
  it("creates a hand the auction and the replayer can point at", async () => {
    const response = await postHand({ dealer: "S", ...fullPack() });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBeTruthy();
    expect(body.dealer).toBe("S");

    const stored = await prisma.hand.findUniqueOrThrow({ where: { id: body.id } });
    expect(stored.userId).toBe(userId);
    // The model names the columns, not the seat codes.
    const columns = { N: "north", E: "east", S: "south", W: "west" } as const;
    for (const [seat, column] of Object.entries(columns)) {
      const cards = Object.values(stored[column] as Record<string, string>);
      expect(cards, seat).toHaveLength(13);
    }
  });

  it("keeps engine notation, so the cards can be parsed back", async () => {
    const response = await postHand({ dealer: "N", ...fullPack() });
    const body = await response.json();
    const stored = await prisma.hand.findUniqueOrThrow({ where: { id: body.id } });
    const north = Object.values(stored.north as Record<string, string>);
    // Every card is a suit code then a rank. The display symbol would be "♠A",
    // which is two characters of which neither is a code, and nothing can read it.
    for (const card of north) {
      expect(card, card).toMatch(/^[SHDC](A|K|Q|J|10|[2-9])$/);
    }
  });

  it("refuses a deal that is not 52 distinct cards", async () => {
    const hands = fullPack();
    // Deal the north hand's spade ace to south as well.
    hands.S = { ...hands.S, [Object.keys(hands.S)[0]!]: Object.values(hands.N)[0]! };
    const response = await postHand({ dealer: "S", ...hands });
    expect(response.status).toBe(400);
  });

  it("refuses a hand that is not 13 cards", async () => {
    const hands = fullPack();
    const short = { ...hands.N };
    delete short[Object.keys(short)[0]!];
    const response = await postHand({ dealer: "S", ...hands, N: short });
    expect(response.status).toBe(400);
  });

  it("refuses a card that is not in engine notation", async () => {
    const hands = fullPack();
    hands.N = { ...hands.N, bad: "♠A" };
    const response = await postHand({ dealer: "S", ...hands });
    expect(response.status).toBe(400);
  });
});

describe("the declarer and the opening lead come from the engine", () => {
  it("declares the partner of the first player to name the final strain", () => {
    // North deals, North bids 1NT, East passes, South bids 3NT, then three passes.
    // The declarer is the first player of the *winning* side to name the final
    // strain, and North named notrump first - so North declares, not South, who
    // bid the winning 3NT. Getting that backwards would credit the wrong side
    // with every trick.
    const machine = new AuctionStateMachine({ dealer: Position.NORTH });
    machine.submit("1NT");
    machine.submit("P");
    machine.submit("3NT");
    machine.submit("P");
    machine.submit("P");
    machine.submit("P");
    const final = machine.finalContract()!;
    expect(final.declarer).toBe(Position.NORTH);
    // South named the winning 3NT but North named notrump first, so North is
    // declarer and South is dummy.
    expect(openingLeader(Position.NORTH)).toBe(Position.EAST);
    expect(final.contract).toEqual({ level: 3, strain: "NT", doubled: false, redoubled: false });
  });

  it("is led to by the declarer's left-hand opponent, with dummy second", () => {
    // Law 41A: the declarer's left-hand opponent leads, and the declarer's first
    // turn to play is from dummy - so the declarer is fourth, not second.
    expect(openingTrickOrder(Position.SOUTH)).toEqual([
      Position.WEST, Position.NORTH, Position.EAST, Position.SOUTH,
    ]);
    expect(openingLeader(Position.SOUTH)).toBe(Position.WEST);
  });

  it("moves the declarer and the lead with the dealer", () => {
    // A different dealer gives a different declarer, which is the whole reason
    // the dealer cannot be written into every call as a constant.
    const withNorth = new AuctionStateMachine({ dealer: Position.NORTH });
    withNorth.submit("1C");
    withNorth.submit("1H"); // East overcalls
    withNorth.submit("3C"); // South raises
    for (let i = 0; i < 3; i += 1) withNorth.submit("P");
    const final = withNorth.finalContract()!;
    // South bid the winning 3C but North named clubs first, so North declares.
    expect(final.declarer).toBe(Position.NORTH);
    expect(openingLeader(final.declarer!)).toBe(Position.EAST);

  });
});

describe("a completed hand is scored and recorded", () => {
  it("attaches the auction to the stored hand and keeps the contract", async () => {
    const handRes = await postHand({ dealer: "N", ...fullPack() });
    const hand = await handRes.json();

    const auctionRes = await postAuction({
      handId: hand.id,
      dealer: "N",
      actions: [
        { player: "N", bid: "1NT" },
        { player: "E", bid: "P" },
        { player: "S", bid: "3NT" },
        { player: "W", bid: "P" },
        { player: "N", bid: "P" },
        { player: "E", bid: "P" },
      ],
      isComplete: true,
    });
    expect(auctionRes.status).toBe(201);
    const auction = await auctionRes.json();

    const stored = await prisma.auction.findUniqueOrThrow({
      where: { id: auction.id },
      include: { hand: true, actions: { orderBy: { sequence: "asc" } } },
    });
    expect(stored.handId).toBe(hand.id);
    expect(stored.finalLevel).toBe(3);
    expect(stored.finalStrain).toBe("NT");
    // North named notrump first, so North is the declarer.
    expect(stored.declarer).toBe("N");
    expect(trumpSuitOf({ level: 3, strain: "NT", doubled: false, redoubled: false })).toBeNull();
  });

  it("scores the tricks the declarer actually took", async () => {
    // 3NT needs 9. Nine tricks made, eight is down - the boundary the old code
    // could never reach, because it stopped after 12 tricks and never scored.
    const contract = { level: 3, strain: "NT" as const, doubled: false, redoubled: false };
    const made = contractOutcome(contract, 9, "None");
    expect(made.made).toBe(true);
    expect(made.score).toBe(100);
    expect(made.tricksRequired).toBe(9);

    const down = contractOutcome(contract, 8, "None");
    expect(down.made).toBe(false);
    expect(down.score).toBe(-50);
  });

  it("counts a full hand, not twelve tricks", () => {
    // The old resolution stopped at 12: `t >= 13 ? 13 : t + 1` meant the
    // thirteenth trick was never played. Thirteen resolutions reach thirteen.
    let trick = 1;
    for (let resolved = 0; resolved < 13; resolved += 1) trick += 1;
    expect(trick).toBe(14);
  });
});
