/**
 * Bridge Coach — Drill acceptability.
 *
 * A bidding drill used to be scored by comparing the learner's call to one
 * hard-coded ten-call sequence: `bid === expectedAuction[i]`. That is not a test
 * of judgement, it is a test of transcription. A learner who finds a *different*
 * and equally good route to the same contract was marked wrong, and the only way
 * to be marked right was to recall the book.
 *
 * The rule here is deliberately not "a better string match". It asks a question
 * that has an answer in the rules: **does this call leave the drill's contract
 * reachable?**
 *
 * ## What this rule does and does not judge
 *
 * It judges **legality and reachability**, both of which the engine can decide
 * from the auction and the cards. It does not judge whether a call is *good
 * bidding* for a particular hand — "is 1♣ right here" depends on a partnership's
 * conventions, whether the deal is a relay, whether the hand is a lead-off suit,
 * and on the opponents' ranges. An engine that answered that confidently would
 * be inventing authority it does not have, which is the failure this whole
 * programme exists to remove.
 *
 * So this rule is permissive on purpose, and the drill says so. Hand-quality
 * feedback is the coach's job — the page still consults the AI for an
 * explanation — and where the AI is unavailable the learner gets a verdict about
 * the *rules*, which is the part that can actually be decided, rather than a
 * verdict about taste dressed up as fact.
 */

import { AuctionState, BidCall, Contract, Strain } from "./types";
import { LegalBidValidator } from "./validator";
import { bidOutranks, parseBid } from "./bid";

export interface DrillJudgement {
  /** True when the call is legal and still leaves the drill's contract possible. */
  readonly acceptable: boolean;
  /** Why not, phrased for the learner. Empty when acceptable. */
  readonly reason: string;
  /** True when the call means the drill's contract can no longer be reached. */
  readonly overshoots: boolean;
}

const validator = new LegalBidValidator();

const ACCEPTABLE: DrillJudgement = { acceptable: true, reason: "", overshoots: false };

/** Whether two contracts are the same contract, ignoring who declared it. */
export function sameContract(a: Contract, b: Contract): boolean {
  return a.level === b.level && a.strain === b.strain;
}

/**
 * Judge one call against a drill's target contract.
 *
 * A call is acceptable when it is legal **and** it does not put the target
 * contract out of reach. Concretely:
 *
 * - **Pass** — always acceptable. Passing is never a rules error, and it keeps
 *   every contract possible.
 * - **Double / redouble** — acceptable if legal. A double belongs to many correct
 *   auctions; there is no one right place for it.
 * - **Bid** — unacceptable only if it *outranks the target*. Bidding past the
 *   contract the drill is about ends the drill, whatever the reason.
 */
export function judgeCall(
  state: AuctionState,
  call: BidCall,
  target: Contract,
): DrillJudgement {
  const legality = validator.isLegal(state, state.currentBidder, call);
  if (!legality.legal) {
    return {
      acceptable: false,
      reason: legality.reason ?? "That call is not legal here.",
      overshoots: false,
    };
  }

  if (call.type !== "bid") {
    return ACCEPTABLE;
  }

  if (bidOutranks(call, target)) {
    return {
      acceptable: false,
      reason:
        `A bid of ${call.level}${call.strain} is above this drill's ` +
        `${target.level}${target.strain}, so the drill's contract can no longer be reached.`,
      overshoots: true,
    };
  }

  return ACCEPTABLE;
}

/** Convenience wrapper for a call given in notation, e.g. "3NT", "P", "X". */
export function judgeCallText(
  state: AuctionState,
  text: string,
  target: Contract,
): DrillJudgement {
  const call = parseBid(text);
  if (!call) {
    return {
      acceptable: false,
      reason: `${JSON.stringify(text)} is not a bridge call.`,
      overshoots: false,
    };
  }
  return judgeCall(state, call, target);
}

/**
 * Whether a finished auction has actually delivered the drill.
 *
 * True when the engine says the auction is complete *and* the contract reached
 * is the drill's. Many different call sequences satisfy this, which is the whole
 * point: a learner can find their own route.
 */
export function isDrillComplete(state: AuctionState, target: Contract): boolean {
  if (!state.isComplete) return false;
  if (state.lastBidIndex < 0) return false;
  const reached: Strain = state.history[state.lastBidIndex]!.strain!;
  const level = state.history[state.lastBidIndex]!.level!;
  return sameContract({ level, strain: reached, doubled: state.isDoubled, redoubled: state.isRedoubled }, target);
}
