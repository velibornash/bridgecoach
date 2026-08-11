/**
 * Strategy dispatcher — precedence guarantees.
 *
 * evaluateStrategy must dispatch in a fixed order:
 *   opening → convention → natural response.
 * At most one recommendation; null means "no supported rule covers this".
 */
import { describe, expect, it } from "vitest";
import {
  AuctionStateMachine,
  evaluateStrategy,
  formatBid,
  type Hand,
} from "@/bridge";

function hand(spades: string, hearts: string, diamonds: string, clubs: string): Hand {
  return {
    spades: (spades || "").split("").map((r) => `S${r}`),
    hearts: (hearts || "").split("").map((r) => `H${r}`),
    diamonds: (diamonds || "").split("").map((r) => `D${r}`),
    clubs: (clubs || "").split("").map((r) => `C${r}`),
  };
}

describe("evaluateStrategy", () => {
  it("returns null for invalid input", () => {
    expect(evaluateStrategy(null as never, "N", hand("AK87", "Q85", "A653", "QJ8"))).toBeNull();
    expect(evaluateStrategy({} as never, "N", hand("AK87", "Q85", "A653", "QJ8"))).toBeNull();
    expect(evaluateStrategy(null as never, "N", null as never)).toBeNull();
  });

  it("opening rule runs when nothing is bid", () => {
    const state = new AuctionStateMachine({ dealer: "N" }).getState();
    const rec = evaluateStrategy(state, "N", hand("AK87", "Q85", "A653", "QJ8"));
    expect(rec!.ruleName).toBe("opening-1nt");
  });

  it("conventions take precedence over natural responses", () => {
    // 5 hearts + 13 HCP balanced: Jacoby beats the natural 3NT raise.
    const state = new AuctionStateMachine({ dealer: "N", history: ["1NT", "P"] }).getState();
    const rec = evaluateStrategy(state, "S", hand("K96", "K10864", "AQ7", "62"));
    expect(rec!.ruleName).toBe("nt-jacoby-transfer");
    expect(formatBid(rec!.call)).toBe("2D");
  });

  it("falls back to natural responses when no convention fires", () => {
    const state = new AuctionStateMachine({ dealer: "N", history: ["1NT", "P"] }).getState();
    const rec = evaluateStrategy(state, "S", hand("K96", "J84", "AQ75", "K62"));
    expect(rec!.ruleName).toBe("nt-response-3nt");
  });

  it("returns null when no rule covers the scenario", () => {
    // Opponent opened, no rule for South.
    const state = new AuctionStateMachine({ dealer: "E", history: ["1NT", "P", "P"] }).getState();
    expect(evaluateStrategy(state, "S", hand("K96", "J84", "AQ75", "K62"))).toBeNull();
  });
});
