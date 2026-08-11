/**
 * Bridge Coach — Bidding Evaluation (Strategy Layer).
 *
 * IMPORTANT: This is a deliberately LIMITED strategy layer. It implements only
 * a small set of deterministic, widely accepted basic rules (HCP, balanced
 * shape, 1NT/2NT openings, simple responses and raises). Auction legality lives
 * in ./validator.ts and is complete. Strategy is NOT complete: competitive
 * bidding, slam bidding and most conventions are NOT implemented here — they
 * live in ./conventions.ts (conventional sequences) and ./strategy.ts (dispatch).
 *
 * Nothing in this module may claim a bid is strategically wrong unless a rule
 * in this module actually supports that conclusion.
 */

import { AuctionState, BidCall, Hand, Position, Strain, Suit, isPartner, seatAt } from "./types";
import { suitPresentation } from "./suits";

/** High-card points: A=4, K=3, Q=2, J=1. */
export function hcp(hand: Hand): number {
  let points = 0;
  for (const suitKey of ["spades", "hearts", "diamonds", "clubs"] as const) {
    for (const card of hand[suitKey]) {
      const rank = card.slice(1);
      if (rank === "A") points += 4;
      else if (rank === "K") points += 3;
      else if (rank === "Q") points += 2;
      else if (rank === "J") points += 1;
    }
  }
  return points;
}

/** Shape counts, ordered highest → lowest (e.g. [4,4,3,2]). */
export function shape(hand: Hand): number[] {
  return [hand.spades.length, hand.hearts.length, hand.diamonds.length, hand.clubs.length]
    .sort((a, b) => b - a);
}

/** Standard balanced shapes: 4-3-3-3, 4-4-3-3, 4-4-3-2, 5-3-3-2. */
export function isBalanced(hand: Hand): boolean {
  const s = shape(hand);
  return (
    (s[0] === 4 && s[1] === 3 && s[2] === 3 && s[3] === 3) ||
    (s[0] === 4 && s[1] === 4 && s[2] === 3 && s[3] === 3) ||
    (s[0] === 4 && s[1] === 4 && s[2] === 3 && s[3] === 2) ||
    (s[0] === 5 && s[1] === 3 && s[2] === 3 && s[3] === 2)
  );
}

export interface Recommendation {
  call: BidCall;
  reason: string;
  ruleName: string;
}

/** Longest suit (with tie-breaking toward the higher-ranking suit). */
function longestSuit(hand: Hand): Suit {
  const order: Array<{ key: keyof Hand; suit: Suit }> = [
    { key: "spades", suit: Suit.SPADES },
    { key: "hearts", suit: Suit.HEARTS },
    { key: "diamonds", suit: Suit.DIAMONDS },
    { key: "clubs", suit: Suit.CLUBS },
  ];
  let best: { key: keyof Hand; suit: Suit } | null = null;
  for (const entry of order) {
    if (!best || hand[entry.key].length > hand[best.key].length) {
      best = entry;
    }
  }
  return best!.suit;
}

/**
 * Basic opening recommendations. Returns at most one rule that fires.
 * If no rule fires, returns null (strategy is unavailable for this hand).
 */
export function evaluateOpening(hand: Hand): Recommendation | null {
  const points = hcp(hand);
  const balanced = isBalanced(hand);

  if (points >= 15 && points <= 17 && balanced) {
    return {
      call: { type: "bid", level: 1, strain: Strain.NT },
      reason: `15–17 HCP (${points}) with a balanced hand — standard 1NT opening.`,
      ruleName: "opening-1nt",
    };
  }

  if (points >= 20 && points <= 21 && balanced) {
    return {
      call: { type: "bid", level: 2, strain: Strain.NT },
      reason: `20–21 HCP (${points}) with a balanced hand — standard 2NT opening.`,
      ruleName: "opening-2nt",
    };
  }

  if (points >= 12) {
    const suit = longestSuit(hand);
    const name = suitPresentation[suit].name;
    return {
      call: { type: "bid", level: 1, strain: suit as Strain },
      reason: `${points} HCP — opening 1 of your longest suit (${name}).`,
      ruleName: "opening-one-of-suit",
    };
  }

  return null;
}

/** True when a basic opening rule exists for this hand. */
export function hasOpeningRecommendation(hand: Hand): boolean {
  return evaluateOpening(hand) !== null;
}

function suitLen(hand: Hand, suit: Suit): number {
  switch (suit) {
    case Suit.SPADES: return hand.spades.length;
    case Suit.HEARTS: return hand.hearts.length;
    case Suit.DIAMONDS: return hand.diamonds.length;
    case Suit.CLUBS: return hand.clubs.length;
  }
}

/** True when `position` is responding to partner's standing bid, no interference. */
function respondingToPartner(
  state: AuctionState,
  position: Position,
): boolean {
  const standing = state.currentContract;
  if (!standing) return false;
  const openerSeat = seatAt(state.dealer, state.lastBidIndex);
  if (!isPartner(openerSeat, position)) return false;
  // Opponents (or partner) must not have acted since the standing bid.
  for (let i = state.lastBidIndex + 1; i < state.history.length; i++) {
    if (state.history[i].type !== "pass") return false;
  }
  return true;
}

/**
 * NATURAL responses and raises to partner's opening. Conventions (Stayman,
 * transfers) are evaluated separately in ./conventions.ts and take precedence.
 * Returns null when no natural rule supports a recommendation.
 */
export function evaluateResponse(
  state: AuctionState,
  position: Position,
  hand: Hand,
): Recommendation | null {
  const standing = state.currentContract;
  if (!standing || !respondingToPartner(state, position)) return null;
  const points = hcp(hand);

  // Partner opened 1NT/2NT and no convention applies (no 4/5-card major).
  if (standing.strain === Strain.NT && (standing.level === 1 || standing.level === 2)) {
    if (points >= 10 && points <= 14 && isBalanced(hand)) {
      return {
        call: { type: "bid", level: 3, strain: Strain.NT },
        reason: `${points} HCP balanced with no major — raise to game in 3NT.`,
        ruleName: "nt-response-3nt",
      };
    }
    if ((points === 8 || points === 9) && isBalanced(hand)) {
      return {
        call: { type: "bid", level: 2, strain: Strain.NT },
        reason: `${points} HCP balanced with no major — invite with 2NT.`,
        ruleName: "nt-response-2nt",
      };
    }
    return null;
  }

  // Partner opened one of a suit — support raises.
  if (standing.strain !== Strain.NT) {
    const length = suitLen(hand, standing.strain);
    const name = suitPresentation[standing.strain].name;
    if (length >= 4) {
      if (points >= 6 && points <= 9) {
        return {
          call: { type: "bid", level: 2, strain: standing.strain },
          reason: `${length}-card ${name} support with ${points} HCP — simple raise to level 2.`,
          ruleName: "simple-raise",
        };
      }
      if (points >= 10 && points <= 12) {
        return {
          call: { type: "bid", level: 3, strain: standing.strain },
          reason: `${length}-card ${name} support with ${points} HCP — invitational limit raise.`,
          ruleName: "limit-raise",
        };
      }
      if (points >= 13) {
        return {
          call: { type: "bid", level: 4, strain: standing.strain },
          reason: `${length}-card ${name} support with ${points} HCP — raise to game.`,
          ruleName: "game-raise",
        };
      }
    }
  }

  return null;
}
