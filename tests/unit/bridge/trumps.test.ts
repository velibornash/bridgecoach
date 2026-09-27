import { describe, it, expect } from "vitest";
import { trumpSuitOf } from "@/bridge/contract";
import { suitCodeFromSymbol, getSuitPresentation } from "@/bridge/suits";
import { getWinner } from "@/components/trickEngine/TrickEngine";
import { AuctionStateMachine } from "@/bridge/auction";
import type { BridgeCard } from "@/components/cardEngine/types";
import { Position, Strain } from "@/bridge/types";

function card(suit: BridgeCard["suit"], rank: BridgeCard["rank"]): BridgeCard {
  return { id: `${suit}${rank}`, suit, rank, faceUp: true };
}

describe("trumps come from the contract", () => {
  it("takes the trump suit from a suit contract", () => {
    for (const [level, strain] of [
      [1, Strain.CLUBS], [2, Strain.DIAMONDS], [3, Strain.HEARTS], [4, Strain.SPADES],
      [7, Strain.SPADES],
    ] as const) {
      expect(trumpSuitOf({ level, strain, doubled: false, redoubled: false })).toBe(strain);
    }
  });

  it("returns null for every notrump contract", () => {
    for (const level of [1, 2, 3, 4, 5, 6, 7]) {
      expect(trumpSuitOf({ level, strain: Strain.NT, doubled: false, redoubled: false })).toBeNull();
    }
  });

  it("returns null when there is no contract at all", () => {
    expect(trumpSuitOf(null)).toBeNull();
    expect(trumpSuitOf(undefined)).toBeNull();
  });

  it("derives trumps from the auction rather than from a fixed suit", () => {
    // This is the path /play takes: bid, three passes, read the contract.
    const machine = new AuctionStateMachine({ dealer: Position.SOUTH });
    machine.submit("3NT");
    machine.submit("P");
    machine.submit("P");
    machine.submit("P");
    expect(machine.finalContract()!.contract!.strain).toBe("NT");
    expect(trumpSuitOf(machine.finalContract()!.contract)).toBeNull();
  });

  it("derives spades only when spades were bid", () => {
    const machine = new AuctionStateMachine({ dealer: Position.SOUTH });
    machine.submit("4S");
    for (let i = 0; i < 3; i += 1) machine.submit("P");
    expect(trumpSuitOf(machine.finalContract()!.contract)).toBe(Strain.SPADES);
  });
});

describe("symbol/code conversion", () => {
  it("maps every suit symbol to its engine code", () => {
    expect(suitCodeFromSymbol("♠")).toBe("S");
    expect(suitCodeFromSymbol("♥")).toBe("H");
    expect(suitCodeFromSymbol("♦")).toBe("D");
    expect(suitCodeFromSymbol("♣")).toBe("C");
  });

  it("round-trips a code to a symbol and back", () => {
    for (const code of ["S", "H", "D", "C"] as const) {
      expect(suitCodeFromSymbol(getSuitPresentation(code).symbol)).toBe(code);
    }
  });

  it("rejects notrump and junk instead of returning undefined", () => {
    // A silent `undefined` here becomes a call persisted with no strain.
    expect(() => suitCodeFromSymbol("NT")).toThrow(/not a suit symbol/i);
    expect(() => suitCodeFromSymbol("")).toThrow(/not a suit symbol/i);
    expect(() => suitCodeFromSymbol("x")).toThrow(/not a suit symbol/i);
  });
});

describe("getWinner with no trumps", () => {
  it("never lets an off-suit card win", () => {
    // The case this task exists for. Hearts led, and a spade ace is played: in a
    // notrump contract the ace of spades is worthless and the queen of hearts
    // wins. With the old '♠' default the ace won every such trick.
    const trick = [
      { player: "south", card: card("♥", "Q") },
      { player: "west", card: card("♠", "A") },
      { player: "north", card: card("♥", "3") },
      { player: "east", card: card("♦", "K") },
    ];
    expect(getWinner(trick)).toBe("south");
    expect(getWinner(trick, undefined)).toBe("south");
  });

  it("gives the highest card of the suit led when there is no trump", () => {
    const trick = [
      { player: "south", card: card("♦", "7") },
      { player: "west", card: card("♦", "K") },
      { player: "north", card: card("♠", "A") },
      { player: "east", card: card("♦", "2") },
    ];
    expect(getWinner(trick)).toBe("west");
  });

  it("lets a real trump beat the suit led", () => {
    const trick = [
      { player: "south", card: card("♥", "A") },
      { player: "west", card: card("♠", "2") },
    ];
    expect(getWinner(trick, "♠")).toBe("west");
    // The same trick with hearts trump, or none, goes to the ace.
    expect(getWinner(trick, "♥")).toBe("south");
    expect(getWinner(trick)).toBe("south");
  });

  it("still ranks trumps against each other", () => {
    const trick = [
      { player: "south", card: card("♥", "A") },
      { player: "west", card: card("♠", "3") },
      { player: "north", card: card("♠", "K") },
      { player: "east", card: card("♦", "A") },
    ];
    expect(getWinner(trick, "♠")).toBe("north");
  });

  it("handles a partial trick and an empty one", () => {
    expect(getWinner([])).toBeNull();
    expect(getWinner([{ player: "south", card: card("♠", "A") }])).toBe("south");
  });
});
