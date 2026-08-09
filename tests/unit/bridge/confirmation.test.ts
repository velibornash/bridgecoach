import { describe, it, expect } from "vitest";
import { hcp, isBalanced, shape, evaluateOpening } from "@/bridge/evaluation";
import { confirmCall, STRATEGY_UNAVAILABLE_MESSAGE } from "@/bridge/confirmation";
import { AuctionStateMachine } from "@/bridge/auction";
import { Hand, Position } from "@/bridge/types";
import { parseBid } from "@/bridge/bid";

const balanced16: Hand = {
  spades: ["SA", "S3", "S2"],
  hearts: ["HK", "HQ", "H2"],
  diamonds: ["DA", "DQ", "D3"],
  clubs: ["CJ", "C8", "C5", "C4"],
};

const unbalanced12: Hand = {
  spades: ["SA", "SK", "S5", "S4", "S2"],
  hearts: ["HA", "H7"],
  diamonds: ["D6", "D3"],
  clubs: ["CJ", "C8", "C7", "C4"],
};

describe("hand evaluation", () => {
  it("computes HCP", () => {
    // A(4) K(3) Q(2) J(1) = 10 HCP in this hand
    expect(hcp({
      spades: ["SA"], hearts: ["HK"], diamonds: ["DQ"], clubs: ["CJ"],
    })).toBe(10);
    expect(hcp(balanced16)).toBe(16);
  });

  it("detects balanced shapes", () => {
    expect(isBalanced(balanced16)).toBe(true);
    expect(isBalanced(unbalanced12)).toBe(false);
  });

  it("returns shape counts sorted", () => {
    expect(shape(unbalanced12)).toEqual([5, 4, 2, 2]);
  });
});

describe("opening evaluation rules", () => {
  it("recommends 1NT for 15–17 balanced", () => {
    const r = evaluateOpening(balanced16)!;
    expect(r.call).toEqual({ type: "bid", level: 1, strain: "NT" });
    expect(r.ruleName).toBe("opening-1nt");
  });

  it("recommends 2NT for 20–21 balanced", () => {
    const hand20: Hand = {
      spades: ["SA", "SK", "S2"],
      hearts: ["HA", "HQ", "H2"],
      diamonds: ["DK", "D2", "D3"],
      clubs: ["CA", "C2", "C3", "C4"],
    };
    expect(hcp(hand20)).toBe(20);
    const r = evaluateOpening(hand20)!;
    expect(r.call).toEqual({ type: "bid", level: 2, strain: "NT" });
  });

  it("recommends one of the longest suit with 12+ HCP", () => {
    const r = evaluateOpening(unbalanced12)!;
    expect(r.ruleName).toBe("opening-one-of-suit");
    expect(r.call.level).toBe(1);
    expect(r.call.strain).toBe("S");
  });

  it("returns null below opening strength", () => {
    const weak: Hand = {
      spades: ["S2", "S3"],
      hearts: ["H4", "H5", "H6"],
      diamonds: ["D2", "D3", "D4", "D5"],
      clubs: ["C2", "C3", "C4", "C5"],
    };
    expect(evaluateOpening(weak)).toBeNull();
  });
});

describe("confirmCall — answer validation", () => {
  it("flags an illegal bid as ILLEGAL with a reason", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1NT");
    const result = confirmCall(auction.getState(), Position.EAST, parseBid("1C")!);
    expect(result.verdict).toBe("ILLEGAL");
    expect(result.isLegal).toBe(false);
  });

  it("returns LEGAL with strategy-unavailable message when no rule applies", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    const result = confirmCall(auction.getState(), Position.NORTH, parseBid("P")!);
    expect(result.verdict).toBe("LEGAL");
    expect(result.message).toBe(STRATEGY_UNAVAILABLE_MESSAGE);
  });

  it("returns EXPECTED when the call matches the scenario expectation", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    const result = confirmCall(auction.getState(), Position.NORTH, parseBid("1NT")!, {
      expected: parseBid("1NT")!,
    });
    expect(result.verdict).toBe("EXPECTED");
  });

  it("returns ACCEPTABLE_ALTERNATIVE for a listed alternative", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    const result = confirmCall(auction.getState(), Position.NORTH, parseBid("1S")!, {
      expected: parseBid("1H")!,
      alternatives: [parseBid("1S")!],
    });
    expect(result.verdict).toBe("ACCEPTABLE_ALTERNATIVE");
  });

  it("returns INCORRECT_STRATEGY only when a rule actually contradicts the bid", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    // 16 balanced → rule says 1NT. Opening 1C is legal but contradicts the rule.
    const result = confirmCall(auction.getState(), Position.NORTH, parseBid("1C")!, {
      hand: balanced16,
      isOpening: true,
    });
    expect(result.verdict).toBe("INCORRECT_STRATEGY");
    expect(result.strategyApplied).toBe(true);
  });

  it("does not claim INCORRECT_STRATEGY for a response (no rule supports it)", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1NT"); // N opens
    auction.submit("P");   // E
    // Partner's response — we have NO response rules, so we must not judge it.
    const result = confirmCall(auction.getState(), Position.SOUTH, parseBid("2H")!, {
      hand: balanced16,
      isOpening: false,
    });
    expect(result.verdict).toBe("LEGAL");
    expect(result.message).toBe(STRATEGY_UNAVAILABLE_MESSAGE);
  });

  it("returns EXPECTED for a pass that matches the scenario", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    const result = confirmCall(auction.getState(), Position.NORTH, parseBid("P")!, {
      expected: parseBid("P")!,
    });
    expect(result.verdict).toBe("EXPECTED");
  });
});
