import { describe, it, expect } from "vitest";
import {
  isLegalPlay,
  legalSuitsToPlay,
  openingLeader,
  openingTrickOrder,
  playRefusalReason,
} from "@/bridge/play";
import { Position, isPartner, nextPosition } from "@/bridge/types";
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


describe("opening lead and the opening trick", () => {
  it("is made by the declarer's left-hand opponent (Law 41A)", () => {
    // Law 41A: "the defender on presumed declarer's left makes the opening
    // lead". Each seat is followed by the player on their left, so that is the
    // next seat in SEAT_ORDER.
    expect(openingLeader(Position.NORTH)).toBe(Position.EAST);
    expect(openingLeader(Position.EAST)).toBe(Position.SOUTH);
    expect(openingLeader(Position.SOUTH)).toBe(Position.WEST);
    expect(openingLeader(Position.WEST)).toBe(Position.NORTH);
  });

  it("is always a defender, never the declarer or dummy", () => {
    for (const declarer of [Position.NORTH, Position.EAST, Position.SOUTH, Position.WEST]) {
      const leader = openingLeader(declarer);
      expect(leader).not.toBe(declarer);
      expect(isPartner(leader, declarer)).toBe(false);
    }
  });

  it("puts the declarer fourth, with dummy second", () => {
    // Law 41A's footnote: "Declarer's first turn to play is from dummy." The
    // assumption that the declarer plays second is the standard misreading and
    // skips a card in every hand.
    expect(openingTrickOrder(Position.SOUTH)).toEqual([
      Position.WEST,  // the lead
      Position.NORTH,  // dummy
      Position.EAST,
      Position.SOUTH,  // declarer
    ]);
  });

  it("runs in turn order all the way round, whichever seat declares", () => {
    for (const declarer of [Position.NORTH, Position.EAST, Position.SOUTH, Position.WEST]) {
      const order = openingTrickOrder(declarer);
      expect(new Set(order).size, String(declarer)).toBe(4);
      for (let i = 0; i < 3; i += 1) {
        expect(order[i + 1], `${declarer} step ${i}`).toBe(nextPosition(order[i]!));
      }
      // Dummy is the declarer's partner and plays second.
      expect(isPartner(order[0]!, declarer), String(declarer)).toBe(false);
      expect(isPartner(order[1]!, declarer), String(declarer)).toBe(true);
      expect(order[3]).toBe(declarer);
    }
  });

  it("matches a South declarer being led to by West", () => {
    // The worked example from every beginner text: South declares, West leads,
    // and dummy (North) plays the second card.
    const order = openingTrickOrder(Position.SOUTH);
    expect(order[0]).toBe(Position.WEST);
    expect(order[1]).toBe(Position.NORTH);
  });
});
