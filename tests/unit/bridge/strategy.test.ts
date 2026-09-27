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

/**
 * Build a hand from rank strings, e.g. hand("AKQ", "", "A2", "T9876").
 *
 * Ranks are read as **tokens**, not characters. This used to be
 * `.split("")`, which turned a ten into the two cards "1" and "0" - so no
 * fixture could express a ten at all, and the resulting "cards" were not cards.
 * That went unnoticed because `hcp` scored anything it could not read as zero,
 * and a ten is worth zero anyway. Tightening the engine exposed it.
 */
const RANK_TOKENS = "A K Q J T 10 9 8 7 6 5 4 3 2".split(" ");

function ranks(ranksText: string): string[] {
  return (ranksText || "")
    .replace(/10/g, "T")
    .split("")
    .map((r) => r.toUpperCase())
    .filter((r) => r.length > 0)
    .map((r) => {
      if (!RANK_TOKENS.includes(r)) {
        throw new Error(`Not a rank: ${JSON.stringify(r)} in ${JSON.stringify(ranksText)}`);
      }
      return r === "T" ? "10" : r;
    });
}

function hand(spades: string, hearts: string, diamonds: string, clubs: string): Hand {
  return {
    spades: ranks(spades).map((r) => `S${r}`),
    hearts: ranks(hearts).map((r) => `H${r}`),
    diamonds: ranks(diamonds).map((r) => `D${r}`),
    clubs: ranks(clubs).map((r) => `C${r}`),
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
