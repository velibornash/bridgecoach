/**
 * Convention rule modules — unit tests.
 *
 * Each convention must be registered in CONVENTION_RULES and covered here.
 * Rules never decide legality; they only produce recommendations.
 */
import { describe, expect, it } from "vitest";
import {
  AuctionStateMachine,
  CONVENTION_RULES,
  evaluateConvention,
  formatBid,
  type Hand,
  type Position,
} from "@/bridge";

function hand(spades: string, hearts: string, diamonds: string, clubs: string): Hand {
  return {
    spades: (spades || "").split("").map((r) => `S${r}`),
    hearts: (hearts || "").split("").map((r) => `H${r}`),
    diamonds: (diamonds || "").split("").map((r) => `D${r}`),
    clubs: (clubs || "").split("").map((r) => `C${r}`),
  };
}

function stateFor(auction: string[], dealer: Position = "N") {
  return new AuctionStateMachine({ dealer, history: auction }).getState();
}

describe("CONVENTION_RULES registry", () => {
  it("registers Stayman, Jacoby, and their replies", () => {
    const ids = CONVENTION_RULES.map((r) => r.id);
    expect(ids).toContain("nt-stayman");
    expect(ids).toContain("nt-jacoby-transfer");
    expect(ids).toContain("nt-stayman-reply");
    expect(ids).toContain("nt-transfer-accept");
  });

  it("gives every rule a stable id, name and description", () => {
    for (const rule of CONVENTION_RULES) {
      expect(rule.id).toMatch(/^[a-z0-9-]+$/);
      expect(rule.name.length).toBeGreaterThan(0);
      expect(rule.description.length).toBeGreaterThan(0);
    }
  });
});

describe("Stayman (responder)", () => {
  const auction = ["1NT", "P"];

  it("bids 2C with a 4-card major and 8+ HCP", () => {
    const evaln = evaluateConvention(stateFor(auction), "S", hand("KQ75", "A864", "97", "Q62"));
    expect(evaln?.rule.id).toBe("nt-stayman");
    expect(formatBid(evaln!.call)).toBe("2C");
  });

  it("does not fire below 8 HCP", () => {
    const evaln = evaluateConvention(stateFor(auction), "S", hand("QJ75", "K864", "97", "62"));
    expect(evaln).toBeNull();
  });

  it("does not fire with a 5-card major (transfers instead)", () => {
    const evaln = evaluateConvention(stateFor(auction), "S", hand("KQ875", "A864", "97", "2"));
    expect(evaln?.rule.id).toBe("nt-jacoby-transfer");
  });
});

describe("Jacoby transfers", () => {
  const auction = ["1NT", "P"];

  it("2D transfers to hearts", () => {
    const evaln = evaluateConvention(stateFor(auction), "S", hand("97", "K10864", "742", "J85"));
    expect(evaln?.rule.id).toBe("nt-jacoby-transfer");
    expect(formatBid(evaln!.call)).toBe("2D");
  });

  it("2H transfers to spades", () => {
    const evaln = evaluateConvention(stateFor(auction), "S", hand("K10984", "96", "J74", "863"));
    expect(evaln?.rule.id).toBe("nt-jacoby-transfer");
    expect(formatBid(evaln!.call)).toBe("2H");
  });

  it("does not fire without a 5-card major", () => {
    const evaln = evaluateConvention(stateFor(auction), "S", hand("K97", "Q64", "J74", "Q863"));
    expect(evaln).toBeNull();
  });

  it("does not fire in a competitive auction", () => {
    const evaln = evaluateConvention(stateFor(["1NT", "X", "P"]), "S", hand("K10984", "96", "J74", "863"));
    expect(evaln).toBeNull();
  });
});

describe("Stayman opener reply", () => {
  const auction = ["1NT", "P", "2C", "P"];

  it("bids 2S with 4 spades, else 2H with 4 hearts", () => {
    const withSpades = evaluateConvention(stateFor(auction), "N", hand("AQ85", "K63", "AJ42", "85"));
    expect(formatBid(withSpades!.call)).toBe("2S");

    const withHearts = evaluateConvention(stateFor(auction), "N", hand("K63", "AQ85", "AJ42", "85"));
    expect(formatBid(withHearts!.call)).toBe("2H");
  });

  it("bids 2D denying a 4-card major", () => {
    const evaln = evaluateConvention(stateFor(auction), "N", hand("K63", "J85", "AQ42", "K85"));
    expect(formatBid(evaln!.call)).toBe("2D");
  });

  it("only fires when the opener really did open NT", () => {
    const evaln = evaluateConvention(stateFor(["1H", "P", "2C", "P"]), "N", hand("AQ85", "K63", "AJ42", "85"));
    expect(evaln).toBeNull();
  });
});

describe("Transfer acceptance", () => {
  it("accepts 2D transfer with 2H", () => {
    const evaln = evaluateConvention(stateFor(["1NT", "P", "2D", "P"]), "N", hand("K63", "A82", "Q1043", "K85"));
    expect(evaln?.rule.id).toBe("nt-transfer-accept");
    expect(formatBid(evaln!.call)).toBe("2H");
  });

  it("accepts 2H transfer with 2S", () => {
    const evaln = evaluateConvention(stateFor(["1NT", "P", "2H", "P"]), "N", hand("K63", "A82", "Q1043", "K85"));
    expect(formatBid(evaln!.call)).toBe("2S");
  });
});
