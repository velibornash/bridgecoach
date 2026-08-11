/**
 * Bridge Coach — Strategy Dispatcher.
 *
 * `evaluateStrategy` is the single entry point for deterministic strategic
 * recommendations. Precedence:
 *   1. Convention rules (Stayman, Jacoby transfers — ./conventions.ts)
 *   2. Natural responses / raises (./evaluation.ts)
 *   3. Opening bids (./evaluation.ts)
 *
 * It returns at most one recommendation. A `null` result means "no supported
 * rule covers this scenario" — callers MUST NOT invent strategy beyond this
 * module (the AI may explain, but never invent rules).
 *
 * Legality is NOT decided here. Recommendations must be checked against the
 * LegalBidValidator before being presented as answers.
 */

import { AuctionState, Hand, Position } from "./types";
import { evaluateConvention } from "./conventions";
import { evaluateOpening, evaluateResponse, Recommendation } from "./evaluation";

export function evaluateStrategy(
  state: AuctionState,
  position: Position,
  hand: Hand,
): Recommendation | null {
  if (!state || !position || !hand) return null;
  if (!Array.isArray(state.history)) return null;

  // Opening bid (nothing bid yet, or all passes so far).
  const nothingBid = state.lastBidIndex < 0;
  if (nothingBid) {
    return evaluateOpening(hand);
  }

  const convention = evaluateConvention(state, position, hand);
  if (convention) {
    return {
      call: convention.call,
      reason: `${convention.rule.name}: ${convention.rule.description}`,
      ruleName: convention.rule.id,
    };
  }

  const response = evaluateResponse(state, position, hand);
  if (response) return response;

  return null;
}
