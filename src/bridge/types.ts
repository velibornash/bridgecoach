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
 * The order seats act in: **counter-clockwise**, N → W → S → E.
 *
 * ## Why this array is the only one in the codebase
 *
 * The UI draws the standard diagram — North top, West left, South bottom, East
 * right — and play runs N → W → S → E around it. The player to the dealer's
 * left acts next, and a dealer sitting North has West on their left.
 *
 * This used to be `["N", "E", "S", "W"]`, which is clockwise: top → right →
 * bottom → left. It was duplicated in five places (`nextPosition`, `seatAt`, and
 * a private `seatOfIndex` in both `contract.ts` and `validator.ts`, plus an array
 * in the tactical page), and two tests asserted the wrong order, so 300+ passing
 * tests confirmed the bug rather than catching it.
 *
 * A partial fix would be worse than the uniform one: if the state machine turned
 * one way and the declarer calculator the other, auctions would be subtly
 * invalid instead of obviously broken, and nothing would throw. So the rule
 * lives here, once, and everything imports it.
 */
export const SEAT_ORDER: readonly Position[] = Object.freeze([
  Position.NORTH,
  Position.WEST,
  Position.SOUTH,
  Position.EAST,
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

/** The next seat to act, counter-clockwise. */
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
