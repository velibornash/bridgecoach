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

/** Seats around the table, clockwise N → E → S → W. */
export const Position = {
  NORTH: "N",
  EAST: "E",
  SOUTH: "S",
  WEST: "W",
} as const;

export type Position = (typeof Position)[keyof typeof Position];

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

/** Next seat clockwise after `position`. */
export function nextPosition(position: Position): Position {
  const order: Position[] = ["N", "E", "S", "W"];
  const idx = order.indexOf(position);
  return order[(idx + 1) % 4];
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
