/**
 * Bridge Coach — Hand Confirmation / Answer Validation.
 *
 * When a user asks the system to confirm a bid, the verdict is derived from the
 * ACTUAL auction state (legality is always deterministic) plus a strictly
 * limited strategy layer. The result distinguishes:
 *
 *   LEGAL                   legal, no strategy rule evaluated
 *   ILLEGAL                 rejected by the LegalBidValidator
 *   EXPECTED                matches the scenario's expected bid
 *   ACCEPTABLE_ALTERNATIVE  listed as an acceptable alternative
 *   INCORRECT_STRATEGY      legal, but a supported rule contradicts it
 *
 * When no strategy evidence exists the message explicitly reports:
 *   "Legal bid, strategy evaluation not available for this scenario."
 */

import {
  AuctionState,
  BidCall,
  Hand,
  Position,
} from "./types";
import { formatBidPretty } from "./bid";
import { LegalBidValidator } from "./validator";
import { evaluateOpening, hasOpeningRecommendation } from "./evaluation";

export type ConfirmationVerdict =
  | "LEGAL"
  | "ILLEGAL"
  | "EXPECTED"
  | "ACCEPTABLE_ALTERNATIVE"
  | "INCORRECT_STRATEGY";

export const STRATEGY_UNAVAILABLE_MESSAGE =
  "Legal bid, strategy evaluation not available for this scenario.";

export interface ConfirmationContext {
  /** The bid the scenario/lesson marks as correct. */
  expected?: BidCall;
  /** Additional bids the scenario marks as acceptable. */
  alternatives?: BidCall[];
  /** The player's hand (used only when a supported strategy rule can fire). */
  hand?: Hand;
  /** True when this call is an opening bid (rules only apply to openings). */
  isOpening?: boolean;
}

export interface ConfirmationResult {
  verdict: ConfirmationVerdict;
  message: string;
  isLegal: boolean;
  /** True when a supported strategy rule actually produced this verdict. */
  strategyApplied: boolean;
}

const validator = new LegalBidValidator();

export function confirmCall(
  state: AuctionState,
  position: Position,
  call: BidCall,
  context: ConfirmationContext = {},
): ConfirmationResult {
  const legality = validator.isLegal(state, position, call);

  if (!legality.legal) {
    return {
      verdict: "ILLEGAL",
      message: legality.reason ?? "This call is not legal here.",
      isLegal: false,
      strategyApplied: false,
    };
  }

  const normalizedCall = normalize(call);

  // Explicit expected answer from the scenario.
  if (context.expected && sameCall(normalizedCall, context.expected)) {
    return {
      verdict: "EXPECTED",
      message: `That's the expected call: ${formatBidPretty(call)}.`,
      isLegal: true,
      strategyApplied: true,
    };
  }

  // Explicit acceptable alternatives.
  if (
    context.alternatives &&
    context.alternatives.some((a) => sameCall(normalizedCall, a))
  ) {
    return {
      verdict: "ACCEPTABLE_ALTERNATIVE",
      message: `Legal and a reasonable alternative to ${context.expected ? formatBidPretty(context.expected) : "the expected line"}.`,
      isLegal: true,
      strategyApplied: true,
    };
  }

  // Strategy: only for opening bids, and only when a rule actually fires.
  if (context.hand && context.isOpening && call.type === "bid") {
    const recommendation = evaluateOpening(context.hand);
    if (recommendation && !sameCall(normalizedCall, recommendation.call)) {
      return {
        verdict: "INCORRECT_STRATEGY",
        message: `Legal, but the supported rule (${recommendation.ruleName}) recommends ${formatBidPretty(recommendation.call)}: ${recommendation.reason}`,
        isLegal: true,
        strategyApplied: true,
      };
    }
  }

  return {
    verdict: "LEGAL",
    message: STRATEGY_UNAVAILABLE_MESSAGE,
    isLegal: true,
    strategyApplied: context.hand
      ? hasOpeningRecommendation(context.hand) && call.type === "bid"
      : false,
  };
}

function normalize(call: BidCall): BidCall {
  return { type: call.type, level: call.level, strain: call.strain };
}

function sameCall(a: BidCall, b: BidCall): boolean {
  return a.type === b.type && a.level === b.level && a.strain === b.strain;
}
