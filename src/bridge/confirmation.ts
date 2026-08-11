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
  seatAt,
} from "./types";
import { formatBid, formatBidPretty, parseBid } from "./bid";
import { LegalBidValidator } from "./validator";
import { AuctionStateMachine } from "./auction";
import { evaluateOpening, hasOpeningRecommendation } from "./evaluation";
import { evaluateStrategy } from "./strategy";

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
  /** True to run the full strategy layer (conventions + responses + openings). */
  useStrategy?: boolean;
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
  if (context.hand && call.type === "bid") {
    const recommendation = context.useStrategy
      ? evaluateStrategy(state, position, context.hand)
      : context.isOpening
        ? evaluateOpening(context.hand)
        : null;
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

// ---------------------------------------------------------------------------
// Full-auction confirmation
// ---------------------------------------------------------------------------

export interface AuctionConfirmationContext {
  /** Expected line given as engine notation ("1NT", "2C", "P", "X", "XX"). */
  expectedLine?: string[];
  /** Acceptable alternative lines in the same notation. */
  alternativeLines?: string[][];
  /** The player's hand + seat, used to report strategy coverage. */
  hand?: Hand;
  position?: Position;
}

export interface AuctionConfirmationResult {
  /** The auction history is always engine-produced, so this is true by construction. */
  legal: boolean;
  complete: boolean;
  finalContract: string | null;
  declarer: string | null;
  passedOut: boolean;
  /** The expected line, re-emitted in engine notation, or null when not provided/matched. */
  expectedLine: string[] | null;
  alternativeLines: string[][];
  strategyEvaluated: boolean;
  explanation: string;
}

/**
 * Confirms a completed (or in-progress) auction against structured expectations.
 *
 * The auction history is compared structurally (BidCall against BidCall), never
 * as raw strings. If the expected line cannot be parsed or does not match, it is
 * reported as null — the engine never guesses.
 */
export function confirmAuction(
  state: AuctionState,
  context: AuctionConfirmationContext = {},
): AuctionConfirmationResult {
  const final = state.finalContract;
  const declarer = final?.declarer ?? null;

  let expectedLine: string[] | null = null;
  if (context.expectedLine) {
    const parsed = context.expectedLine.map((raw) => parseBid(raw));
    if (parsed.every((call) => call !== null)) {
      const structured = parsed as BidCall[];
      const matches =
        structured.length === state.history.length &&
        structured.every((call, i) => sameCall(call, state.history[i]));
      expectedLine = matches ? structured.map(formatBid) : null;
    }
  }

  const alternativeLines = (context.alternativeLines ?? [])
    .map((line) => line.map((raw) => parseBid(raw)))
    .filter((line) => line.every((call) => call !== null))
    .map((line) => (line as BidCall[]).map(formatBid));

  const strategyEvaluated = strategyCoverage(state, context);

  const parts: string[] = [];
  if (state.isComplete) {
    if (final?.passedOut) {
      parts.push("The auction was passed out.");
    } else if (final?.contract && declarer) {
      parts.push(
        `Final contract: ${final.contract.level}${formatStrain(final.contract.strain)} by ${declarer}${
          final.contract.doubled ? " (doubled)" : ""
        }${final.contract.redoubled ? " (redoubled)" : ""}.`,
      );
    }
  } else {
    parts.push("The auction is still open.");
  }

  if (expectedLine) {
    parts.push(`The auction matches the expected line: ${expectedLine.join(" ")}.`);
  } else if (context.expectedLine) {
    parts.push("The auction does not match the expected line.");
  }

  parts.push(
    strategyEvaluated
      ? "Strategy evaluation is available for this deal."
      : "Strategy evaluation is not available for this scenario.",
  );

  return {
    legal: true,
    complete: state.isComplete,
    finalContract:
      final?.contract && !final.passedOut
        ? `${final.contract.level}${formatStrain(final.contract.strain)}${final.contract.doubled ? "X" : ""}${final.contract.redoubled ? "XX" : ""}`
        : null,
    declarer,
    passedOut: final?.passedOut ?? false,
    expectedLine,
    alternativeLines,
    strategyEvaluated,
    explanation: parts.join(" "),
  };
}

/** Whether a supported strategy rule fired at any of `position`'s turns. */
function strategyCoverage(
  state: AuctionState,
  context: AuctionConfirmationContext,
): boolean {
  if (!context.hand || !context.position) return false;

  for (let i = 0; i < state.history.length; i++) {
    const seat = seatAt(state.dealer, i);
    if (seat === context.position && state.history[i].type === "bid") {
      if (evaluateStrategyAtStep(state, i, context.position, context.hand)) return true;
    }
  }
  return false;
}

/** Replays the auction up to (not including) index `i` and runs the strategy. */
function evaluateStrategyAtStep(
  state: AuctionState,
  upTo: number,
  position: Position,
  hand: Hand,
): boolean {
  const machine = new AuctionStateMachine({
    dealer: state.dealer,
    vulnerability: state.vulnerability,
  });
  for (let i = 0; i < upTo; i++) {
    machine.submit(state.history[i]);
  }
  return evaluateStrategy(machine.getState(), position, hand) !== null;
}

function formatStrain(strain: string): string {
  return strain === "NT" ? "NT" : strain;
}
