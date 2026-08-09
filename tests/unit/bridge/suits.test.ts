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
  it("rotates clockwise", () => {
    expect(nextPosition(Position.NORTH)).toBe(Position.EAST);
    expect(nextPosition(Position.EAST)).toBe(Position.SOUTH);
    expect(nextPosition(Position.SOUTH)).toBe(Position.WEST);
    expect(nextPosition(Position.WEST)).toBe(Position.NORTH);
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
