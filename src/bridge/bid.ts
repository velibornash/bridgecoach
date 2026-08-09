/**
 * Bridge Coach — Bid Parsing & Formatting.
 *
 * Converts between structured BidCall objects and the string notation used
 * across the app ("1NT", "2C", "2♣", "P", "X", "XX").
 */

import { BidCall, CallType, Strain, STRAIN_ORDER } from "./types";
import { suitPresentation } from "./suits";

const CALL_SUFFIXES: Record<string, CallType> = {
  P: "pass",
  PASS: "pass",
  X: "double",
  DOUBLE: "double",
  XX: "redouble",
  REDOUBLE: "redouble",
};

/** Maps every accepted string token (letters and symbols) to a strain code. */
const STRAIN_TOKENS: Array<{ token: string; strain: Strain }> = [
  { token: "NT", strain: Strain.NT },
  { token: "C", strain: Strain.CLUBS },
  { token: "♣", strain: Strain.CLUBS },
  { token: "D", strain: Strain.DIAMONDS },
  { token: "♦", strain: Strain.DIAMONDS },
  { token: "H", strain: Strain.HEARTS },
  { token: "♥", strain: Strain.HEARTS },
  { token: "S", strain: Strain.SPADES },
  { token: "♠", strain: Strain.SPADES },
];

/** Parses a bid string into a structured BidCall, or null when invalid. */
export function parseBid(input: string): BidCall | null {
  if (!input) return null;
  const raw = input.trim().toUpperCase().replace(/\s+/g, "");

  if (CALL_SUFFIXES[raw]) {
    return { type: CALL_SUFFIXES[raw] };
  }

  // Level (1-7) + strain.
  const match = /^([1-7])(.+)$/.exec(raw);
  if (!match) return null;

  const level = Number(match[1]);
  const strain = STRAIN_TOKENS.find((s) => s.token === match[2]);
  if (!strain) return null;

  return { type: "bid", level, strain: strain.strain };
}

/** Formats a BidCall back into compact string notation ("1NT", "2C", "P", "X", "XX"). */
export function formatBid(call: BidCall): string {
  switch (call.type) {
    case "pass":
      return "P";
    case "double":
      return "X";
    case "redouble":
      return "XX";
    case "bid":
      return `${call.level}${call.strain}`;
  }
}

/** Symbol notation for display ("2♣", "1NT", "Pass", "Double", "Redouble"). */
export function formatBidPretty(call: BidCall): string {
  switch (call.type) {
    case "pass":
      return "Pass";
    case "double":
      return "Double";
    case "redouble":
      return "Redouble";
    case "bid":
      return `${call.level}${strainSymbol(call.strain!)}`;
  }
}

function strainSymbol(strain: Strain): string {
  if (strain === Strain.NT) return "NT";
  return suitPresentation[strain as Exclude<Strain, "NT">].symbol;
}

export function strainRank(strain: Strain): number {
  return STRAIN_ORDER[strain];
}

/** Returns a stable, comparable number for ordering bids in an auction. */
export function bidRank(call: BidCall): number {
  if (call.type !== "bid") return -1;
  return call.level! * 10 + strainRank(call.strain!);
}

/** True when `next` (a bid) outranks `current` (the standing contract). */
export function bidOutranks(
  next: BidCall,
  current: { level?: number; strain?: Strain } | null,
): boolean {
  if (next.type !== "bid" || next.level == null || next.strain == null) {
    return false;
  }
  if (!current || current.level == null || current.strain == null) {
    return true;
  }
  return (
    next.level * 10 + strainRank(next.strain) >
    current.level * 10 + strainRank(current.strain)
  );
}
