/**
 * Bridge Coach — Contract Calculator.
 *
 * Given a completed auction, determines:
 *   - the final contract (level, strain, doubled/redoubled)
 *   - the declarer (first player of the winning side to name the final strain)
 *   - whether the hand was passed out
 */

import {
  AuctionState,
  BidCall,
  Contract,
  FinalContract,
  Position,
  Strain,
  Suit,
  isPartner,
  seatAt,
} from "./types";

/**
 * The trump suit of a contract, or `null` when there is none.
 *
 * Notrump is the whole point of returning `null` rather than defaulting to a
 * suit. A notrump contract has no trumps, so a spade in a 3NT hand cannot beat a
 * heart: the highest card of the suit led wins. Defaulting to any suit turns
 * every off-suit ace in a notrump deal into a winner and quietly teaches the
 * opposite of the rule.
 *
 * Takes a `Contract` because that is what the auction produces. Passing the
 * whole `FinalContract` is fine too — a passed-out auction has no contract and
 * therefore no trumps.
 */
export function trumpSuitOf(contract: Contract | null | undefined): Suit | null {
  if (!contract) return null;
  if (contract.strain === Strain.NT) return null;
  return contract.strain;
}

export class ContractCalculator {
  calculate(state: AuctionState): FinalContract {
    if (!state.isComplete) {
      throw new Error("Cannot compute a contract for an open auction.");
    }

    if (state.lastBidIndex < 0) {
      return { contract: null, declarer: null, passedOut: true };
    }

    const finalBid = state.history[state.lastBidIndex];
    if (finalBid.type !== "bid") {
      return { contract: null, declarer: null, passedOut: true };
    }

    const contract: Contract = {
      level: finalBid.level!,
      strain: finalBid.strain!,
      doubled: state.isDoubled,
      redoubled: state.isRedoubled,
    };

    const winningSideBidder = seatAt(state.dealer, state.lastBidIndex);
    const declarer = findDeclarer(state, finalBid.strain!, winningSideBidder);

    return { contract, declarer, passedOut: false };
  }
}


/** First player of the winning side to name the final strain. */
function findDeclarer(
  state: AuctionState,
  strain: Strain,
  winningSideBidder: Position,
): Position {
  for (let i = 0; i < state.history.length; i++) {
    const call: BidCall = state.history[i];
    if (call.type !== "bid") continue;
    if (call.strain !== strain) continue;
    const seat = seatAt(state.dealer, i);
    if (isPartner(seat, winningSideBidder) || seat === winningSideBidder) {
      return seat;
    }
  }
  return winningSideBidder;
}
