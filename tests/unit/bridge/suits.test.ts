import { describe, it, expect } from "vitest";
import { Suit, Strain, Position, nextPosition, isPartner } from "@/bridge/types";
import { strainRank } from "@/bridge/bid";
import { suitPresentation, getSuitPresentation, isRedSuit, isBlackSuit, SUITS } from "@/bridge/suits";

describe("suit presentation — centralized colors", () => {
  it("maps HEARTS to red", () => {
    expect(suitPresentation[Suit.HEARTS].color).toBe("red");
  });
  it("maps DIAMONDS to red", () => {
    expect(suitPresentation[Suit.DIAMONDS].color).toBe("red");
  });
  it("maps CLUBS to black", () => {
    expect(suitPresentation[Suit.CLUBS].color).toBe("black");
  });
  it("maps SPADES to black", () => {
    expect(suitPresentation[Suit.SPADES].color).toBe("black");
  });

  it("uses the conventional symbols", () => {
    expect(suitPresentation[Suit.SPADES].symbol).toBe("♠");
    expect(suitPresentation[Suit.HEARTS].symbol).toBe("♥");
    expect(suitPresentation[Suit.DIAMONDS].symbol).toBe("♦");
    expect(suitPresentation[Suit.CLUBS].symbol).toBe("♣");
  });

  it("uses the same hex for both red suits and both black suits", () => {
    expect(getSuitPresentation(Suit.HEARTS).hex).toBe(getSuitPresentation(Suit.DIAMONDS).hex);
    expect(getSuitPresentation(Suit.SPADES).hex).toBe(getSuitPresentation(Suit.CLUBS).hex);
    expect(getSuitPresentation(Suit.HEARTS).hex).not.toBe(getSuitPresentation(Suit.SPADES).hex);
  });

  it("exposes isRedSuit / isBlackSuit helpers", () => {
    expect(isRedSuit(Suit.HEARTS)).toBe(true);
    expect(isRedSuit(Suit.DIAMONDS)).toBe(true);
    expect(isRedSuit(Suit.SPADES)).toBe(false);
    expect(isBlackSuit(Suit.CLUBS)).toBe(true);
    expect(isBlackSuit(Suit.SPADES)).toBe(true);
  });

  it("has all four suits present in SUITS", () => {
    expect(SUITS).toHaveLength(4);
    expect(new Set(SUITS)).toEqual(new Set([Suit.CLUBS, Suit.DIAMONDS, Suit.HEARTS, Suit.SPADES]));
  });
});

describe("seats", () => {
  it("rotates counter-clockwise, as bridge is played", () => {
    // The UI draws North top, West left, South bottom, East right. Play runs
    // counter-clockwise around that diagram: top -> left -> bottom -> right.
    // A dealer sitting North has West on their left, so North is followed by
    // West.
    //
    // This test asserted the opposite (N -> E) and was named "rotates
    // clockwise". The engine, the declarer calculator and the validator all
    // agreed, so 300+ tests confirmed the error rather than catching it.
    expect(nextPosition(Position.NORTH)).toBe(Position.WEST);
    expect(nextPosition(Position.WEST)).toBe(Position.SOUTH);
    expect(nextPosition(Position.SOUTH)).toBe(Position.EAST);
    expect(nextPosition(Position.EAST)).toBe(Position.NORTH);
  });

  it("turns through every seat exactly once", () => {
    // Guards against an edit that shortens or duplicates the cycle.
    // Four seats must have four distinct successors, and applying the function
    // four times must return to the start. A shortened or duplicated cycle fails
    // one of these.
    const seats = [Position.NORTH, Position.SOUTH, Position.EAST, Position.WEST];
    expect(new Set(seats.map(nextPosition)).size).toBe(4);
    let seat: Position = Position.NORTH;
    for (let i = 0; i < 4; i += 1) seat = nextPosition(seat);
    expect(seat).toBe(Position.NORTH);
  });

  it("knows partnerships", () => {
    expect(isPartner(Position.NORTH, Position.SOUTH)).toBe(true);
    expect(isPartner(Position.SOUTH, Position.NORTH)).toBe(true);
    expect(isPartner(Position.EAST, Position.WEST)).toBe(true);
    expect(isPartner(Position.NORTH, Position.EAST)).toBe(false);
    expect(isPartner(Position.NORTH, Position.NORTH)).toBe(false);
  });
});

describe("strain order", () => {
  it("orders ♣ < ♦ < ♥ < ♠ < NT", () => {
    const order = [Strain.CLUBS, Strain.DIAMONDS, Strain.HEARTS, Strain.SPADES, Strain.NT];
    const ranks = order.map((s) => strainRank(s));
    expect(ranks).toEqual([1, 2, 3, 4, 5]);
  });
});
