/**
 * Bridge Coach — The deal of the day.
 *
 * A "deal of the day" that reshuffles every time you load the page is not a deal
 * of the day. It was a `<FloatingCards>` decoration with no deck and no date, and
 * the button under it led to a differently shuffled hand. This module makes the
 * claim true or the card removable: given a date, the same four hands come back
 * every time, and the contract is derived from the cards rather than picked to
 * look good.
 *
 * Framework-free, like the rest of the engine.
 */

import { Contract, Position, Strain, Suit } from "./types";
import { parseCard } from "./play";

/** A 13-card hand in engine notation, keyed by suit. */
export interface DealtHand {
  readonly spades: readonly string[];
  readonly hearts: readonly string[];
  readonly diamonds: readonly string[];
  readonly clubs: readonly string[];
}

export interface DailyDeal {
  /** The date this deal belongs to, as `YYYY-MM-DD`. */
  readonly date: string;
  readonly dealer: Position;
  /** The contract this deal is played as, or null if nothing is worth playing. */
  readonly contract: Contract | null;
  readonly north: DealtHand;
  readonly east: DealtHand;
  readonly south: DealtHand;
  readonly west: DealtHand;
}

const SEATS: readonly Position[] = [Position.NORTH, Position.EAST, Position.SOUTH, Position.WEST];
const SUIT_ORDER: readonly Suit[] = ["S", "H", "D", "C"];
const RANKS: readonly string[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

/**
 * A small, fast, repeatable PRNG (mulberry32).
 *
 * Seeded explicitly rather than from the clock, so the same seed always gives the
 * same stream. `Math.random` cannot be used here for the obvious reason, and
 * seeding `Date.now()` inside the generator would reintroduce the same bug one
 * level down.
 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Turn a `YYYY-MM-DD` into a seed.
 *
 * FNV-1a over the characters. The date string itself is the seed, so "one hand
 * per day" needs no stored state and no server round-trip: the browser and the
 * server compute the same deal independently.
 */
export function seedFromDate(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Expected a date as YYYY-MM-DD, got ${JSON.stringify(date)}.`);
  }
  let hash = 0x811c9dc5;
  for (let i = 0; i < date.length; i += 1) {
    hash ^= date.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Today's date in the viewer's own timezone, as `YYYY-MM-DD`. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The 52 cards, in engine notation, in a fixed order before shuffling. */
export function fullDeck(): string[] {
  const cards: string[] = [];
  for (const suit of SUIT_ORDER) for (const rank of RANKS) cards.push(`${suit}${rank}`);
  return cards;
}

/** Fisher-Yates over the card codes, using the seeded stream. */
function shuffleCodes(cards: string[], rng: () => number): string[] {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Group 13 card codes into a hand keyed by suit. */
function toHand(codes: readonly string[]): DealtHand {
  const hand: Record<Suit, string[]> = { S: [], H: [], D: [], C: [] };
  for (const code of codes) {
    const { suit } = parseCard(code);
    hand[suit].push(code);
  }
  // Sort each suit by rank, highest first, so the hand reads like a hand.
  for (const suit of SUIT_ORDER) {
    hand[suit] = hand[suit].sort(
      (a, b) => RANKS.indexOf(parseCard(b).rank) - RANKS.indexOf(parseCard(a).rank),
    );
  }
  return { spades: hand.S, hearts: hand.H, diamonds: hand.D, clubs: hand.C };
}

/** Gross tricks available in one suit from a pair of hands. */
function tricksInSuit(own: readonly string[], partner: readonly string[]): number {
  const held = [...own, ...partner];
  const ranks = held.map((c) => parseCard(c).rank);

  // One trick per top honour actually held.
  let tricks = 0;
  for (const honour of ["A", "K", "Q"] as const) {
    if (ranks.includes(honour)) tricks += 1;
  }
  // Every remaining card in a suit of five or more is a trick, provided the gap
  // above it is covered. A run of small cards under a held King is worth its
  // length; the same cards under a missing King are not.
  if (held.length >= 5) {
    const bestHeld = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"]
      .filter((r) => ranks.includes(r))
      .map((r) => RANKS.indexOf(r))
      .sort((a, b) => a - b)[0];
    if (bestHeld !== undefined) {
      tricks += Math.max(0, held.length - 1 - bestHeld);
    }
  }
  // A void alongside partner's length is a guaranteed ruff.
  if (own.length === 0 && partner.length >= 3) tricks += 1;
  if (partner.length === 0 && own.length >= 3) tricks += 1;
  return tricks;
}

/** Gross tricks in notrump: honours rank higher, and length needs a stopper. */
function tricksInNotrump(own: readonly string[], partner: readonly string[]): number {
  const ranks = [...own, ...partner].map((c) => parseCard(c).rank);
  let tricks = 0;
  if (ranks.includes("A")) tricks += 2;
  if (ranks.includes("K")) tricks += 1;
  const queens = ranks.filter((r) => r === "Q").length;
  tricks += Math.max(0, queens - (ranks.includes("A") ? 1 : 0));
  // Length beyond a stopper is unreliable, so only the first extra counts.
  if (own.length + partner.length >= 7) tricks += 1;
  return tricks;
}

/**
 * Pick the contract for a deal, from the cards alone.
 *
 * Deliberately a **gross trick count**, not a solver: it counts top honours and
 * reliable length and ignores finesse, entries and distribution. That makes it
 * conservative, which is the right direction for a contract offered as a daily
 * exercise — an optimistic estimate would hand out contracts that go down and
 * read as the engine being wrong.
 *
 * Returns null when neither partnership has 7 tricks in anything, rather than
 * inventing a contract that cannot be made.
 */
export function contractFor(
  north: DealtHand,
  south: DealtHand,
): Contract | null {
  const ns: Array<[Strain, number]> = [
    [Strain.SPADES, tricksInSuit(north.spades, south.spades)],
    [Strain.HEARTS, tricksInSuit(north.hearts, south.hearts)],
    [Strain.DIAMONDS, tricksInSuit(north.diamonds, south.diamonds)],
    [Strain.CLUBS, tricksInSuit(north.clubs, south.clubs)],
    [Strain.NT, tricksInNotrump(north.spades, south.spades) +
      tricksInNotrump(north.hearts, south.hearts) +
      tricksInNotrump(north.diamonds, south.diamonds) +
      tricksInNotrump(north.clubs, south.clubs)],
  ];

  const best = ns.reduce((a, b) => (b[1] > a[1] ? b : a));
  if (best[1] < 7) return null;

  // Notrump is a part score by nature: cap it at 3, since the count above is a
  // gross estimate and a 5NT "contract" from it would be a fiction.
  const level = best[0] === Strain.NT ? Math.min(3, best[1] - 6) : Math.min(7, best[1] - 6);
  return { level: Math.max(1, level), strain: best[0], doubled: false, redoubled: false };
}

/**
 * The deal for a date. The same date always produces the same hands, the same
 * dealer and the same contract, in any process, at any time.
 */
/** Every card in a hand, spades first, then hearts, diamonds, clubs. */
export function allCardsOf(hand: DealtHand): string[] {
  return [...hand.spades, ...hand.hearts, ...hand.diamonds, ...hand.clubs];
}

/**
 * The day's 52 cards in deal order: North, East, South, West, thirteen each.
 *
 * This is the order the cards actually come off the deck, so dealing this list
 * round the table reproduces the four hands exactly.
 */
export function dailyCardOrder(deal: DailyDeal): string[] {
  return SEATS.flatMap((seat) =>
    allCardsOf(
      seat === Position.NORTH ? deal.north
      : seat === Position.EAST ? deal.east
      : seat === Position.SOUTH ? deal.south
      : deal.west,
    ),
  );
}

export function dailyDeal(date: string): DailyDeal {
  const rng = seededRandom(seedFromDate(date));
  const codes = shuffleCodes(fullDeck(), rng);

  const hands: Record<string, DealtHand> = {};
  SEATS.forEach((seat, index) => {
    hands[seat] = toHand(codes.slice(index * 13, index * 13 + 13));
  });

  // The dealer comes off the same seeded stream, so it moves day to day rather
  // than always being South - which is what made every daily hand identical in
  // shape as well as in content.
  const dealer = SEATS[Math.floor(rng() * 4)]!;

  return {
    date,
    dealer,
    contract: contractFor(hands[Position.NORTH]!, hands[Position.SOUTH]!),
    north: hands[Position.NORTH]!,
    east: hands[Position.EAST]!,
    south: hands[Position.SOUTH]!,
    west: hands[Position.WEST]!,
  };
}
