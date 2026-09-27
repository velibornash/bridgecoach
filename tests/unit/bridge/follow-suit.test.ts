import { describe, it, expect } from "vitest";
import { isLegalPlay, legalSuitsToPlay, playRefusalReason } from "@/bridge/play";
import { getWinner } from "@/components/trickEngine/TrickEngine";
import type { BridgeCard } from "@/components/cardEngine/types";

const ALL_FOUR = ["C", "D", "H", "S"] as const;

function card(suit: BridgeCard["suit"], rank: BridgeCard["rank"]): BridgeCard {
  return { id: `${suit}${rank}`, suit, rank, faceUp: true };
}

describe("legalSuitsToPlay", () => {
  it("allows anything when leading", () => {
    expect(legalSuitsToPlay(["H", "S"], null)).toEqual(ALL_FOUR);
  });

  it("forces the lead suit when the player holds it", () => {
    expect(legalSuitsToPlay(["H", "S"], "H")).toEqual(["H"]);
  });

  it("allows anything when the player is void in the suit led", () => {
    // Being void entitles you to discard freely, and a trump is a legal discard.
    expect(legalSuitsToPlay(["S", "D"], "H")).toEqual(ALL_FOUR);
  });

  it("treats a player who has played their last heart as void", () => {
    // The caller passes the suits still held, so this is just the void case with
    // an accurate input. Held suits are the only thing the rule consults.
    expect(legalSuitsToPlay(["S"], "H")).toEqual(ALL_FOUR);
  });
});

describe("isLegalPlay", () => {
  it("permits following suit", () => {
    expect(isLegalPlay("H", ["H", "S"], "H")).toBe(true);
  });

  it("refuses a wrong-suit card while the player holds the lead suit", () => {
    expect(isLegalPlay("S", ["H", "S"], "H")).toBe(false);
    expect(isLegalPlay("C", ["C", "D", "H", "S"], "H")).toBe(false);
    // A trump is no more legal than any other wrong suit.
    expect(isLegalPlay("S", ["H", "S"], "H")).toBe(false);
  });

  it("permits any card when void, including a trump", () => {
    for (const suit of ALL_FOUR) {
      expect(isLegalPlay(suit, ["S", "D"], "H")).toBe(true);
    }
  });

  it("permits anything when leading", () => {
    for (const suit of ALL_FOUR) {
      expect(isLegalPlay(suit, ["C"], null)).toBe(true);
    }
  });
});

describe("playRefusalReason", () => {
  it("says nothing when the play is legal", () => {
    expect(playRefusalReason("H", ["H", "S"], "H")).toBeNull();
    expect(playRefusalReason("S", ["H", "S"], null)).toBeNull();
    expect(playRefusalReason("S", ["S"], "H")).toBeNull();
  });

  it("names the rule when the play is not", () => {
    const reason = playRefusalReason("S", ["H", "S"], "H");
    expect(reason).toMatch(/must follow suit/i);
    expect(reason).toMatch(/H/);
    expect(reason).toMatch(/S/);
  });

  it("is the single decision point: refusal implies illegal and vice versa", () => {
    const cases: Array<Parameters<typeof isLegalPlay>> = [
      ["H", ["H", "S"], "H"],
      ["S", ["H", "S"], "H"],
      ["S", ["S"], "H"],
      ["D", ["D", "C"], "D"],
      ["D", ["D", "C"], null],
    ];
    for (const args of cases) {
      expect(playRefusalReason(...args) === null, JSON.stringify(args)).toBe(
        isLegalPlay(...args),
      );
    }
  });
});

describe("following suit and trick resolution together", () => {
  it("a void player may ruff, and the ruff wins", () => {
    // South leads a heart, North holds no heart, and discards a spade. With
    // hearts trump the heart wins; with spades trump the ruff wins. The discard
    // is legal either way - void entitles you to it - and the trick resolves on
    // trumps as usual.
    const trick = [
      { player: "south", card: card("♥", "2") },
      { player: "north", card: card("♠", "7") },
    ];
    expect(isLegalPlay("S", ["S", "D"], "H")).toBe(true);
    expect(getWinner(trick, "♠")).toBe("north");
    expect(getWinner(trick, "♥")).toBe("south");
  });

  it("a player who must follow cannot ruff instead", () => {
    // Same cards, but South still holds a heart, so the spade is not available.
    expect(isLegalPlay("S", ["H", "S"], "H")).toBe(false);
  });
});
