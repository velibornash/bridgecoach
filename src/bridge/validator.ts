/**
 * Bridge Coach — Legal Bid Validator.
 *
 * Deterministically answers "is this call legal at this point in the auction?"
 *
 * Rules enforced:
 *   - auction must be open
 *   - it must be the caller's turn
 *   - pass is always legal
 *   - a bid must outrank the current contract
 *   - double is legal only against an opponent's standing contract
 *   - redouble is legal only when the last action was an opponent's double
 *   - a side may not double its own side's contract or redouble its own double
 *
 * This module contains ZERO bidding strategy.
 */

import {
  AuctionState,
  BidCall,
  Position,
  isPartner,
} from "./types";
import { bidOutranks } from "./bid";

export interface LegalCheck {
  legal: boolean;
  reason?: string;
}

const STRAINS = ["C", "D", "H", "S", "NT"] as const;

export class LegalBidValidator {
  /** All calls currently legal for `position` in this state. */
  legalCalls(state: AuctionState, position: Position): BidCall[] {
    const calls: BidCall[] = [{ type: "pass" }];

    if (state.isComplete || position !== state.currentBidder) {
      return calls;
    }

    // Natural bids 1♣ … 7NT.
    for (let level = 1; level <= 7; level++) {
      for (const strain of STRAINS) {
        const call: BidCall = { type: "bid", level, strain };
        if (this.isLegal(state, position, call).legal) {
          calls.push(call);
        }
      }
    }

    if (this.canDouble(state, position)) {
      calls.push({ type: "double" });
    }
    if (this.canRedouble(state, position)) {
      calls.push({ type: "redouble" });
    }

    return calls;
  }

  isLegal(state: AuctionState, position: Position, call: BidCall): LegalCheck {
    if (state.isComplete) {
      return { legal: false, reason: "The auction has already ended." };
    }

    if (position !== state.currentBidder) {
      return { legal: false, reason: `It is not ${position}'s turn.` };
    }

    if (call.type === "pass") {
      return { legal: true };
    }

    if (call.type === "bid") {
      if (call.level == null || call.strain == null) {
        return { legal: false, reason: "Bid requires a level and strain." };
      }
      if (!bidOutranks(call, state.currentContract)) {
        return {
          legal: false,
          reason: `A bid of ${call.level}${call.strain} does not outrank the current contract.`,
        };
      }
      return { legal: true };
    }

    if (call.type === "double") {
      if (!this.canDouble(state, position)) {
        return { legal: false, reason: "Double is not legal here." };
      }
      return { legal: true };
    }

    if (call.type === "redouble") {
      if (!this.canRedouble(state, position)) {
        return { legal: false, reason: "Redouble is not legal here." };
      }
      return { legal: true };
    }

    return { legal: false, reason: "Unknown call." };
  }

  /** Double is legal against an opponent's standing (undoubled) contract. */
  private canDouble(state: AuctionState, position: Position): boolean {
    if (!state.currentContract) return false;
    if (state.isDoubled) return false;
    const bidder = standingBidder(state);
    if (isPartner(position, bidder)) return false;
    return true;
  }

  /**
   * Redouble is legal when the most recent non-pass action after the standing
   * bid is an opponent's double (and the contract is not already redoubled).
   */
  private canRedouble(state: AuctionState, position: Position): boolean {
    if (!state.currentContract) return false;
    if (state.isRedoubled) return false;

    // Scan backwards for the most recent non-pass action after the standing bid.
    let lastAction: { call: BidCall; index: number } | null = null;
    for (let i = state.history.length - 1; i > state.lastBidIndex; i--) {
      if (state.history[i].type !== "pass") {
        lastAction = { call: state.history[i], index: i };
        break;
      }
    }
    if (!lastAction || lastAction.call.type !== "double") return false;

    const doubler = seatOfIndex(state, lastAction.index);
    if (isPartner(position, doubler)) return false;

    return true;
  }
}

/** The seat that made the standing (highest) bid. */
function standingBidder(state: AuctionState): Position {
  return seatOfIndex(state, state.lastBidIndex);
}

function seatOfIndex(state: AuctionState, index: number): Position {
  const order: Position[] = ["N", "E", "S", "W"];
  const startIdx = order.indexOf(state.dealer);
  return order[(startIdx + index) % 4];
}
