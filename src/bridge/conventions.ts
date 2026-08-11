/**
 * Bridge Coach — Convention Rule Modules.
 *
 * Conventions are added as rule modules and registered in `CONVENTION_RULES`.
 * Each rule inspects the auction state + the player's hand and, when its
 * trigger fires, returns the conventional call. Rules that do not fire return
 * null so the next rule (or the natural strategy layer) can run.
 *
 * A rule NEVER decides legality — legality is owned by the LegalBidValidator.
 * Convention rules only produce *recommendations* for the current auction
 * position. They never run against an incomplete/foreign auction.
 *
 * Supported conventions (Sprint 57 scope):
 *   - Stayman (2♣ after a 1NT/2NT opening, both directions)
 *   - Jacoby transfers (2♦ → ♥, 2♥ → ♠)
 *
 * New conventions: add a module here, register it, and cover it with a test.
 */

import {
  AuctionState,
  BidCall,
  Hand,
  Position,
  Strain,
  Suit,
  isPartner,
  seatAt,
} from "./types";
import { hcp } from "./evaluation";

export interface ConventionRule {
  id: string;
  name: string;
  description: string;
  /**
   * Returns the conventional call for `position`, or null when the rule does
   * not apply to this auction + hand.
   */
  evaluate(state: AuctionState, position: Position, hand: Hand): BidCall | null;
}

export interface ConventionEvaluation {
  rule: ConventionRule;
  call: BidCall;
}

function suitLen(hand: Hand, suit: Suit): number {
  switch (suit) {
    case Suit.SPADES: return hand.spades.length;
    case Suit.HEARTS: return hand.hearts.length;
    case Suit.DIAMONDS: return hand.diamonds.length;
    case Suit.CLUBS: return hand.clubs.length;
  }
}

/**
 * True when `position` is responding to partner's 1NT/2NT opening with no
 * interference (every call after the opening is a pass).
 */
function respondingToPartnerNt(state: AuctionState, position: Position): boolean {
  const standing = state.currentContract;
  if (!standing || standing.strain !== Strain.NT) return false;
  if (standing.level !== 1 && standing.level !== 2) return false;
  const openerSeat = seatAt(state.dealer, state.lastBidIndex);
  if (!isPartner(openerSeat, position)) return false;
  return hasNoInterferenceAfter(state, state.lastBidIndex);
}

/** True when every call after `fromIndex` is a pass. */
function hasNoInterferenceAfter(state: AuctionState, fromIndex: number): boolean {
  for (let i = fromIndex + 1; i < state.history.length; i++) {
    if (state.history[i].type !== "pass") return false;
  }
  return true;
}

/** Index of the last non-pass call, or -1 when there is none. */
function lastNonPassIndex(state: AuctionState): number {
  for (let i = state.history.length - 1; i >= 0; i--) {
    if (state.history[i].type !== "pass") return i;
  }
  return -1;
}

/** Jacoby transfer — responder transfers to a 5+ card major after 1NT/2NT. */
const jacobyTransfer: ConventionRule = {
  id: "nt-jacoby-transfer",
  name: "Jacoby Transfer",
  description: "After partner's 1NT/2NT opening, 2♦ shows 5+ hearts and 2♥ shows 5+ spades.",
  evaluate(state, position, hand) {
    if (!respondingToPartnerNt(state, position)) return null;
    if (hand.hearts.length >= 5) {
      return { type: "bid", level: 2, strain: Strain.DIAMONDS };
    }
    if (hand.spades.length >= 5) {
      return { type: "bid", level: 2, strain: Strain.HEARTS };
    }
    return null;
  },
};

/** Stayman — responder asks for a 4-card major after partner's NT opening. */
const staymanResponder: ConventionRule = {
  id: "nt-stayman",
  name: "Stayman",
  description: "With a 4-card major and 8+ HCP after partner's 1NT/2NT, bid 2♣ to look for a major fit.",
  evaluate(state, position, hand) {
    if (!respondingToPartnerNt(state, position)) return null;
    if (hcp(hand) < 8) return null;
    // 5+ card majors transfer instead (Jacoby runs first, so this is a guard).
    if (hand.hearts.length >= 5 || hand.spades.length >= 5) return null;
    if (hand.hearts.length >= 4 || hand.spades.length >= 4) {
      return { type: "bid", level: 2, strain: Strain.CLUBS };
    }
    return null;
  },
};

/** Stayman opener reply — show a 4-card major or deny one. */
const staymanOpenerReply: ConventionRule = {
  id: "nt-stayman-reply",
  name: "Stayman Reply",
  description: "After 1NT–2♣, opener bids 2♠/2♥ with a 4-card major, otherwise 2♦.",
  evaluate(state, position, hand) {
    const idx = lastNonPassIndex(state);
    if (idx < 0) return null;
    const reply = state.history[idx];
    if (reply.type !== "bid" || reply.level !== 2 || reply.strain !== Strain.CLUBS) {
      return null;
    }
    const responderSeat = seatAt(state.dealer, idx);
    if (!isPartner(responderSeat, position)) return null;

    // The call before the Stayman 2♣ must be this player's own 1NT/2NT opening.
    let previous: number = -1;
    for (let i = idx - 1; i >= 0; i--) {
      if (state.history[i].type !== "pass") { previous = i; break; }
    }
    if (previous < 0) return null;
    const opening = state.history[previous];
    if (opening.type !== "bid" || opening.strain !== Strain.NT) return null;
    if (opening.level !== 1 && opening.level !== 2) return null;
    if (seatAt(state.dealer, previous) !== position) return null;

    if (suitLen(hand, Suit.SPADES) >= 4) {
      return { type: "bid", level: 2, strain: Strain.SPADES };
    }
    if (suitLen(hand, Suit.HEARTS) >= 4) {
      return { type: "bid", level: 2, strain: Strain.HEARTS };
    }
    return { type: "bid", level: 2, strain: Strain.DIAMONDS };
  },
};

/** Transfer acceptance — opener bids the suit shown by partner's transfer. */
const transferAcceptance: ConventionRule = {
  id: "nt-transfer-accept",
  name: "Transfer Acceptance",
  description: "After partner's transfer (2♦→♥ or 2♥→♠), opener accepts by bidding the next suit up.",
  evaluate(state, position) {
    const idx = lastNonPassIndex(state);
    if (idx < 0) return null;
    const transfer = state.history[idx];
    if (transfer.type !== "bid" || transfer.level !== 2) return null;
    if (transfer.strain !== Strain.DIAMONDS && transfer.strain !== Strain.HEARTS) {
      return null;
    }
    const responderSeat = seatAt(state.dealer, idx);
    if (!isPartner(responderSeat, position)) return null;

    // Preceding non-pass must be this player's own 1NT/2NT opening.
    let previous: number = -1;
    for (let i = idx - 1; i >= 0; i--) {
      if (state.history[i].type !== "pass") { previous = i; break; }
    }
    if (previous < 0) return null;
    const opening = state.history[previous];
    if (opening.type !== "bid" || opening.strain !== Strain.NT) return null;
    if (opening.level !== 1 && opening.level !== 2) return null;
    if (seatAt(state.dealer, previous) !== position) return null;

    if (transfer.strain === Strain.DIAMONDS) {
      return { type: "bid", level: 2, strain: Strain.HEARTS };
    }
    return { type: "bid", level: 2, strain: Strain.SPADES };
  },
};

export const CONVENTION_RULES: ConventionRule[] = [
  jacobyTransfer,
  staymanResponder,
  transferAcceptance,
  staymanOpenerReply,
];

/** Returns the first convention rule that fires, or null. */
export function evaluateConvention(
  state: AuctionState,
  position: Position,
  hand: Hand,
): ConventionEvaluation | null {
  for (const rule of CONVENTION_RULES) {
    const call = rule.evaluate(state, position, hand);
    if (call) return { rule, call };
  }
  return null;
}
