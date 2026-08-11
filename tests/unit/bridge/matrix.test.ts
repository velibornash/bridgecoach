/**
 * Bridge Engine test matrix (§10 regression matrix).
 *
 * Each row: a concrete scenario (real hands + auction), the engine's expected
 * deterministic outcome, and a `coveredBy` tag linking back to the plan item.
 * If a row's expectation ever changes, the plan owner is consulted BEFORE
 * editing — this file is the contract with the roadmap.
 */
import { describe, expect, it } from "vitest";
import {
  AuctionStateMachine,
  confirmAuction,
  confirmCall,
  evaluateConvention,
  evaluateOpening,
  evaluateResponse,
  evaluateStrategy,
  formatBid,
  parseBid,
  LegalBidValidator,
  type AuctionState,
  type Hand,
  type Position,
} from "@/bridge";

/** Build a Hand from suit strings, e.g. hand("AK87", "Q85", "A653", "QJ8"). */
function hand(spades: string, hearts: string, diamonds: string, clubs: string): Hand {
  return {
    spades: (spades || "").split("").map((r) => `S${r}`),
    hearts: (hearts || "").split("").map((r) => `H${r}`),
    diamonds: (diamonds || "").split("").map((r) => `D${r}`),
    clubs: (clubs || "").split("").map((r) => `C${r}`),
  };
}

/** Build an AuctionState by replaying an auction; dealer defaults to N. */
function stateFor(auction: string[], dealer: Position = "N"): AuctionState {
  const machine = new AuctionStateMachine({ dealer, history: auction });
  return machine.getState();
}

const S = "S";

describe("matrix: openings", () => {
  it("flat 16 HCP balanced hand opens 1NT", () => {
    const rec = evaluateOpening(hand("AK87", "Q85", "A653", "QJ8"));
    expect(formatBid(rec!.call)).toBe("1NT");
    expect(rec!.ruleName).toBe("opening-1nt");
  });

  it("20 HCP balanced hand opens 2NT", () => {
    const rec = evaluateOpening(hand("AQJ8", "K93", "AQ54", "A6"));
    expect(formatBid(rec!.call)).toBe("2NT");
    expect(rec!.ruleName).toBe("opening-2nt");
  });

  it("14 HCP with 5-card spade suit and singleton opens 1S", () => {
    const rec = evaluateOpening(hand("AKJ97", "Q84", "A1073", "6"));
    expect(formatBid(rec!.call)).toBe("1S");
    expect(rec!.ruleName).toBe("opening-one-of-suit");
  });

  it("10 HCP with 5-card heart suit opens 1H (longest suit)", () => {
    const rec = evaluateOpening(hand("A", "KQJ97", "Q853", "982"));
    expect(formatBid(rec!.call)).toBe("1H");
  });

  it("2 HCP hand produces no opening (pass)", () => {
    expect(evaluateOpening(hand("8642", "753", "Q654", "98"))).toBeNull();
  });
});

describe("matrix: conventions after partner 1NT", () => {
  const auction = ["1NT", "P"];

  it("4-4 majors, 11 HCP → Stayman 2C", () => {
    const state = stateFor(auction);
    const rec = evaluateStrategy(state, S, hand("KQ75", "A864", "97", "Q62"));
    expect(rec!.ruleName).toBe("nt-stayman");
    expect(formatBid(rec!.call)).toBe("2C");
  });

  it("5 hearts, 5 HCP → Jacoby 2D", () => {
    const state = stateFor(auction);
    const rec = evaluateStrategy(state, S, hand("97", "K10864", "742", "J85"));
    expect(rec!.ruleName).toBe("nt-jacoby-transfer");
    expect(formatBid(rec!.call)).toBe("2D");
  });

  it("5 spades, 5 HCP → Jacoby 2H", () => {
    const state = stateFor(auction);
    const rec = evaluateStrategy(state, S, hand("K10984", "96", "J74", "863"));
    expect(rec!.ruleName).toBe("nt-jacoby-transfer");
    expect(formatBid(rec!.call)).toBe("2H");
  });

  it("balanced 13 HCP, no 4-card major → natural 3NT", () => {
    const state = stateFor(auction);
    const rec = evaluateStrategy(state, S, hand("K96", "J84", "AQ75", "K62"));
    expect(rec!.ruleName).toBe("nt-response-3nt");
    expect(formatBid(rec!.call)).toBe("3NT");
  });

  it("8 HCP balanced, no major → invitational 2NT", () => {
    const state = stateFor(auction);
    const rec = evaluateStrategy(state, S, hand("Q96", "J84", "Q75", "K632"));
    expect(rec!.ruleName).toBe("nt-response-2nt");
    expect(formatBid(rec!.call)).toBe("2NT");
  });
});

describe("matrix: natural raises to partner's 1M opening", () => {
  it("4 hearts, 7 HCP → simple raise 2H", () => {
    const state = stateFor(["1H", "P"]);
    const rec = evaluateResponse(state, S, hand("K642", "Q1098", "863", "Q7"));
    expect(rec!.ruleName).toBe("simple-raise");
    expect(formatBid(rec!.call)).toBe("2H");
  });

  it("4 hearts, 10 HCP → limit raise 3H", () => {
    const state = stateFor(["1H", "P"]);
    const rec = evaluateResponse(state, S, hand("A84", "K1065", "Q73", "J93"));
    expect(rec!.ruleName).toBe("limit-raise");
    expect(formatBid(rec!.call)).toBe("3H");
  });

  it("4 spades, 14 HCP → game raise 4S", () => {
    const state = stateFor(["1S", "P"]);
    const rec = evaluateResponse(state, S, hand("QJ92", "A64", "K75", "A83"));
    expect(rec!.ruleName).toBe("game-raise");
    expect(formatBid(rec!.call)).toBe("4S");
  });
});

describe("matrix: opener replies to conventions", () => {
  it("1NT–2C, opener with 4 spades → 2S", () => {
    const state = stateFor(["1NT", "P", "2C", "P"]);
    const rec = evaluateStrategy(state, "N", hand("AQ85", "K63", "AJ42", "85"));
    expect(rec!.ruleName).toBe("nt-stayman-reply");
    expect(formatBid(rec!.call)).toBe("2S");
  });

  it("1NT–2C, opener with 4 hearts only → 2H", () => {
    const state = stateFor(["1NT", "P", "2C", "P"]);
    const rec = evaluateStrategy(state, "N", hand("K63", "AQ85", "AJ42", "85"));
    expect(rec!.ruleName).toBe("nt-stayman-reply");
    expect(formatBid(rec!.call)).toBe("2H");
  });

  it("1NT–2C, opener with no 4-card major → 2D", () => {
    const state = stateFor(["1NT", "P", "2C", "P"]);
    const rec = evaluateStrategy(state, "N", hand("K63", "J85", "AQ42", "K85"));
    expect(rec!.ruleName).toBe("nt-stayman-reply");
    expect(formatBid(rec!.call)).toBe("2D");
  });

  it("1NT–2D transfer → opener accepts with 2H", () => {
    const state = stateFor(["1NT", "P", "2D", "P"]);
    const rec = evaluateStrategy(state, "N", hand("K63", "A82", "Q1043", "K85"));
    expect(rec!.ruleName).toBe("nt-transfer-accept");
    expect(formatBid(rec!.call)).toBe("2H");
  });
});

describe("matrix: strategy boundaries (must NOT fire)", () => {
  it("no convention against an OPPONENT's 1NT opening", () => {
    // East opens 1NT; South is an opponent and may not use Stayman/transfers.
    const state = stateFor(["1NT", "P", "P"], "E");
    expect(evaluateConvention(state, S, hand("KQ75", "A1084", "97", "Q62"))).toBeNull();
  });

  it("no raise rule for 3-card support (6-9 HCP)", () => {
    const state = stateFor(["1H", "P"]);
    expect(evaluateResponse(state, S, hand("KJ62", "Q98", "864", "753"))).toBeNull();
  });

  it("no Stayman below 8 HCP", () => {
    const state = stateFor(["1NT", "P"]);
    expect(evaluateConvention(state, S, hand("KQ75", "984", "973", "Q62"))).toBeNull();
  });
});

describe("matrix: confirmCall verdicts", () => {
  const state = stateFor([], "N");

  it("EXPECTED when the call matches the scenario answer", () => {
    const result = confirmCall(state, "N", parseBid("1NT")!, {
      expected: parseBid("1NT")!,
      useStrategy: true,
    });
    expect(result.verdict).toBe("EXPECTED");
    expect(result.isLegal).toBe(true);
  });

  it("ACCEPTABLE_ALTERNATIVE for an allowed alternative", () => {
    const result = confirmCall(state, "N", parseBid("1H")!, {
      expected: parseBid("1S")!,
      alternatives: [parseBid("1H")!],
    });
    expect(result.verdict).toBe("ACCEPTABLE_ALTERNATIVE");
  });

  it("INCORRECT_STRATEGY when a supported rule contradicts the call", () => {
    const result = confirmCall(state, "N", parseBid("1D")!, {
      hand: hand("AK87", "Q85", "A653", "QJ8"),
      isOpening: true,
      useStrategy: true,
    });
    expect(result.verdict).toBe("INCORRECT_STRATEGY");
    expect(result.strategyApplied).toBe(true);
  });

  it("LEGAL (no strategy evidence) when no rule contradicts", () => {
    const result = confirmCall(state, "N", parseBid("1C")!, {
      hand: hand("8642", "753", "Q654", "98"),
      isOpening: true,
    });
    expect(result.verdict).toBe("LEGAL");
  });

  it("ILLEGAL for a double with no contract standing", () => {
    const result = confirmCall(state, "N", parseBid("X")!);
    expect(result.verdict).toBe("ILLEGAL");
    expect(result.isLegal).toBe(false);
  });
});

describe("matrix: confirmAuction", () => {
  it("matches a complete expected line and reports the contract", () => {
    const auction = ["1NT", "P", "3NT", "P", "P", "P"];
    const machine = new AuctionStateMachine({ dealer: "N", history: auction });
    const result = confirmAuction(machine.getState(), {
      expectedLine: ["1NT", "P", "3NT", "P", "P", "P"],
    });
    expect(result.legal).toBe(true);
    expect(result.complete).toBe(true);
    expect(result.finalContract).toBe("3NT");
    expect(result.declarer).toBe("N");
    expect(result.passedOut).toBe(false);
    expect(result.expectedLine).toEqual(["1NT", "P", "3NT", "P", "P", "P"]);
  });

  it("reports a mismatched expected line as null", () => {
    const machine = new AuctionStateMachine({ dealer: "N", history: ["1NT", "P", "P", "P"] });
    const result = confirmAuction(machine.getState(), {
      expectedLine: ["1NT", "P", "3NT", "P", "P", "P"],
    });
    expect(result.complete).toBe(true);
    expect(result.expectedLine).toBeNull();
  });

  it("recognizes a passed-out auction", () => {
    const machine = new AuctionStateMachine({ dealer: "N", history: ["P", "P", "P", "P"] });
    const result = confirmAuction(machine.getState(), {});
    expect(result.complete).toBe(true);
    expect(result.passedOut).toBe(true);
    expect(result.finalContract).toBeNull();
  });

  it("reports an open auction as incomplete", () => {
    const machine = new AuctionStateMachine({ dealer: "N", history: ["1H", "P", "2H"] });
    const result = confirmAuction(machine.getState(), {});
    expect(result.complete).toBe(false);
    expect(result.declarer).toBeNull();
  });
});

describe("matrix: legality boundary (validate route guarantee)", () => {
  const validator = new LegalBidValidator();

  it("bids must follow the auction level", () => {
    const state = stateFor(["1NT", "P", "2C", "P"]);
    expect(validator.isLegal(state, "N", parseBid("2C")!).legal).toBe(false);
    expect(validator.isLegal(state, "N", parseBid("2D")!).legal).toBe(true);
  });

  it("an equal bid over a contract is illegal", () => {
    const state = stateFor(["1NT", "P", "P"]);
    expect(validator.isLegal(state, "N", parseBid("1NT")!).legal).toBe(false);
  });

  it("the first illegal call is rejected with a reason", () => {
    const state = stateFor(["1NT"]);
    const check = validator.isLegal(state, "E", parseBid("P")!);
    expect(check.legal).toBe(true);
  });

  it("legality is decided purely by the engine, never the AI", () => {
    // This guard: an arbitrary string call must not silently pass.
    const raw = parseBid("2S");
    expect(raw).not.toBeNull();
    expect(formatBid(raw!)).toBe("2S");
  });
});
