/**
 * Bridge Coach — Core Bridge Domain Types.
 *
 * This module is intentionally framework-free and side-effect free so it can be
 * unit-tested without a DOM or React.
 */

/** The four suits plus the no-trump strain. */
export const Suit = {
  CLUBS: "C",
  DIAMONDS: "D",
  HEARTS: "H",
  SPADES: "S",
} as const;

export type Suit = (typeof Suit)[keyof typeof Suit];

export const Strain = {
  ...Suit,
  NT: "NT",
} as const;

export type Strain = (typeof Strain)[keyof typeof Strain];

/**
 * Seats around the table.
 *
 * The names are compass points, not a turn order. Turn order is `SEAT_ORDER`
 * below, and it is counter-clockwise because that is how bridge is played.
 */
export const Position = {
  NORTH: "N",
  EAST: "E",
  SOUTH: "S",
  WEST: "W",
} as const;

export type Position = (typeof Position)[keyof typeof Position];

/**
 * The order seats act in: N → E → S → W.
 *
 * ## Why this order
 *
 * Each seat is followed by the player **on their left**, and the seat drawn
 * above North is East — a player facing the middle of the table has their left
 * hand on the opposite side from a viewer looking at them. So North's left-hand
 * opponent is East, East's is South, South's is West, and West's is North. That
 * gives the auction order North, East, South, West, which is why bridge is
 * described as being played *clockwise*.
 *
 * ## The correction, and why it matters that it happened
 *
 * This array was once `["N", "W", "S", "E"]` on the belief that bridge is played
 * counter-clockwise. It is not, and the reversal was a real defect: with a North
 * declarer, West is the seat that must lead, and in the reversed order West does
 * not sit between the declarer and their partner at all.
 *
 * The reversal survived because the code was **self-consistent**. The engine,
 * the declarer calculator and the validator all used the same wrong array, and
 * every test derived its expectation from that same array. The declarer tests
 * in particular could not have caught it: partnership is symmetric, so
 * `isPartner(N, S)` is true whichever way the seats run. Only a mechanical
 * check of the *comments* against the code found the discrepancy, and only
 * deriving the opening lead in a later task proved the order was wrong.
 *
 * Which is the argument for the single-source rule below: one constant, in one
 * file, is a thing a reader can check. Five copies are five chances to be
 * wrong in the same way and agree with each other.
 */
export const SEAT_ORDER: readonly Position[] = Object.freeze([
  Position.NORTH,
  Position.EAST,
  Position.SOUTH,
  Position.WEST,
] as const);

export const Vulnerability = {
  NONE: "None",
  NS: "NS",
  EW: "EW",
  ALL: "All",
} as const;

export type Vulnerability = (typeof Vulnerability)[keyof typeof Vulnerability];

export type CallType = "bid" | "pass" | "double" | "redouble";

/** A single legal call in the auction. */
export interface BidCall {
  type: CallType;
  /** Level 1–7. Only present for type === "bid". */
  level?: number;
  /** Strain of a bid. Only present for type === "bid". */
  strain?: Strain;
}

/** The current (highest) contract in the auction. */
export interface Contract {
  level: number;
  strain: Strain;
  doubled: boolean;
  redoubled: boolean;
}

/** The full contract including who plays it (determined when auction ends). */
export interface FinalContract {
  contract: Contract | null;
  declarer: Position | null;
  passedOut: boolean;
}

/** Immutable snapshot of the auction used by the validator and calculator. */
export interface AuctionState {
  dealer: Position;
  vulnerability: Vulnerability;
  history: BidCall[];
  currentBidder: Position;
  passesInRow: number;
  lastBidIndex: number;
  currentContract: Contract | null;
  isComplete: boolean;
  finalContract: FinalContract | null;
  isDoubled: boolean;
  isRedoubled: boolean;
}

/** Order of strain ranks for comparing bids: ♣ < ♦ < ♥ < ♠ < NT. */
export const STRAIN_ORDER: Record<Strain, number> = {
  C: 1,
  D: 2,
  H: 3,
  S: 4,
  NT: 5,
};

/** The next seat to act: the player on `position`'s left. */
export function nextPosition(position: Position): Position {
  const idx = SEAT_ORDER.indexOf(position);
  if (idx === -1) {
    throw new Error(`Not a seat: ${String(position)}`);
  }
  return SEAT_ORDER[(idx + 1) % SEAT_ORDER.length]!;
}

/**
 * The seat that made the call at zero-based history index `index`.
 *
 * Index 0 is the dealer. This is the single attribution rule for recorded
 * auctions: every call in a persisted hand is mapped to a seat through here, so
 * a replay can be reconciled with a real deal.
 */
export function seatAt(dealer: Position, index: number): Position {
  const start = SEAT_ORDER.indexOf(dealer);
  if (start === -1) {
    throw new Error(`Not a seat: ${String(dealer)}`);
  }
  return SEAT_ORDER[(start + index) % SEAT_ORDER.length]!;
}

/** Partners (N-S and E-W). */
export function isPartner(a: Position, b: Position): boolean {
  return (
    (a === Position.NORTH && b === Position.SOUTH) ||
    (a === Position.SOUTH && b === Position.NORTH) ||
    (a === Position.EAST && b === Position.WEST) ||
    (a === Position.WEST && b === Position.EAST)
  );
}

/** A 13-card hand keyed by suit. Cards use letter-code notation, e.g. "SA", "H10". */
export interface Hand {
  spades: string[];
  hearts: string[];
  diamonds: string[];
  clubs: string[];
}
