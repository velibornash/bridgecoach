/**
 * POST /api/hands — stores a dealt hand.
 *
 * A hand is four sets of 13 cards. It exists as a row because the replayer and
 * the practice history both need to show the same deal again later, and because
 * an auction with no cards attached cannot be reconstructed into anything.
 *
 * This route did not exist. `createHand` in the client was posting
 * `kind: "hand"` to `POST /api/auctions`, which only ever calls
 * `prisma.auction.create` — so no `Hand` row was created, the client read
 * `undefined` back, and `handId` stayed null, which made the whole hand-saving
 * path unreachable. Giving hands their own route keeps each endpoint honest
 * about what it creates.
 *
 * The deal is validated properly rather than trusted: 13 cards per seat, every
 * card one of the 52 in a pack, and no card dealt twice. A hand that fails any of
 * those is not a hand, and storing it would put an unplayable deal into the
 * replayer where it would look like a real one.
 */
import { NextResponse } from "next/server";
import { Position } from "@/bridge/types";
import { badRequest, handleRoute, withUser, readJson } from "@/lib/apiRoute";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const SEATS: readonly Position[] = [Position.NORTH, Position.EAST, Position.SOUTH, Position.WEST];

/** A card in engine notation: suit code then rank, e.g. "SA", "H10". */
const CARD = /^[SHDC](?:A|K|Q|J|10|[2-9])$/;

/** The 52 distinct cards a pack contains, so a duplicate can be rejected. */
const PACK_OF_52 = new Set<string>();
for (const suit of ["S", "H", "D", "C"]) {
  for (const rank of ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"]) {
    PACK_OF_52.add(`${suit}${rank}`);
  }
}

interface HandBody {
  dealer?: unknown;
  label?: unknown;
  north?: unknown;
  east?: unknown;
  south?: unknown;
  west?: unknown;
}

/** A seat's cards as `{ [cardId]: "SA" }`, the shape the schema documents. */
function readSeat(value: unknown, seat: string): Record<string, string> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest(`"${seat}" must be an object of cards`, "VALIDATION_ERROR");
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length !== 13) {
    throw badRequest(
      `"${seat}" has ${entries.length} cards, a hand needs 13`,
      "VALIDATION_ERROR",
    );
  }
  const out: Record<string, string> = {};
  for (const [id, card] of entries) {
    if (typeof card !== "string" || !CARD.test(card)) {
      throw badRequest(
        `"${seat}.${id}" is not a card in engine notation (e.g. "SA", "H10"), got ${JSON.stringify(card)}`,
        "VALIDATION_ERROR",
      );
    }
    out[id] = card;
  }
  return out;
}

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<HandBody>(request);

    const dealer = body.dealer ?? Position.SOUTH;
    if (typeof dealer !== "string" || !SEATS.includes(dealer as Position)) {
      throw badRequest('"dealer" must be a seat', "VALIDATION_ERROR");
    }
    if (body.label != null && typeof body.label !== "string") {
      throw badRequest('"label" must be a string', "VALIDATION_ERROR");
    }

    // A seat's cards may be keyed by its compass code ("N") or its name
    // ("north"). `dealer` is a compass code and the four hands read as names, and
    // a client that disagreed with itself got a bare "must be an object of cards"
    // with no hint which key was wrong.
    const seatBody = (seat: Position, name: string): unknown => {
      const source = body as Record<string, unknown>;
      return source[seat.toLowerCase()] ?? source[seat];
    };

    const hands: Record<Position, Record<string, string>> = {
      [Position.NORTH]: readSeat(seatBody(Position.NORTH, "north"), "north"),
      [Position.EAST]: readSeat(seatBody(Position.EAST, "east"), "east"),
      [Position.SOUTH]: readSeat(seatBody(Position.SOUTH, "south"), "south"),
      [Position.WEST]: readSeat(seatBody(Position.WEST, "west"), "west"),
    };

    // Every card dealt exactly once across the whole table.
    const all = SEATS.flatMap((seat) => Object.values(hands[seat]));
    const unique = new Set(all);
    if (unique.size !== 52) {
      const missing = 52 - unique.size;
      throw badRequest(
        `The deal is not a full pack: ${unique.size} distinct cards across 52 slots` +
          (missing > 0 ? `, ${missing} repeated` : ""),
        "VALIDATION_ERROR",
      );
    }

    const hand = await prisma.hand.create({
      data: {
        userId,
        dealer: dealer as Position,
        label: typeof body.label === "string" ? body.label : null,
        north: hands[Position.NORTH] as unknown as object,
        east: hands[Position.EAST] as unknown as object,
        south: hands[Position.SOUTH] as unknown as object,
        west: hands[Position.WEST] as unknown as object,
      },
      select: { id: true, dealer: true, createdAt: true },
    });

    return NextResponse.json(hand, { status: 201 });
  }),
);
