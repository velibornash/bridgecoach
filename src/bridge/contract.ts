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
  isPartner,
  seatAt,
} from "./types";

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
