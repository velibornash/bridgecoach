import { describe, it, expect } from "vitest";
import { parseBid, formatBid, formatBidPretty, bidRank, bidOutranks } from "@/bridge/bid";
import { Strain, Suit } from "@/bridge/types";

describe("parseBid", () => {
  it("parses letter-code bids", () => {
    expect(parseBid("1NT")).toEqual({ type: "bid", level: 1, strain: Strain.NT });
    expect(parseBid("2C")).toEqual({ type: "bid", level: 2, strain: Suit.CLUBS });
    expect(parseBid("3D")).toEqual({ type: "bid", level: 3, strain: Suit.DIAMONDS });
    expect(parseBid("4H")).toEqual({ type: "bid", level: 4, strain: Suit.HEARTS });
    expect(parseBid("7S")).toEqual({ type: "bid", level: 7, strain: Suit.SPADES });
  });

  it("parses symbol bids", () => {
    expect(parseBid("2♣")).toEqual({ type: "bid", level: 2, strain: Suit.CLUBS });
    expect(parseBid("2♥")).toEqual({ type: "bid", level: 2, strain: Suit.HEARTS });
    expect(parseBid("3NT")).toEqual({ type: "bid", level: 3, strain: Strain.NT });
  });

  it("parses passes, doubles and redoubles (case-insensitive)", () => {
    expect(parseBid("P")).toEqual({ type: "pass" });
    expect(parseBid("p")).toEqual({ type: "pass" });
    expect(parseBid("PASS")).toEqual({ type: "pass" });
    expect(parseBid("X")).toEqual({ type: "double" });
    expect(parseBid("XX")).toEqual({ type: "redouble" });
    expect(parseBid("double")).toEqual({ type: "double" });
    expect(parseBid("redouble")).toEqual({ type: "redouble" });
  });

  it("rejects garbage", () => {
    expect(parseBid("")).toBeNull();
    expect(parseBid("0C")).toBeNull();
    expect(parseBid("8NT")).toBeNull();
    expect(parseBid("BC")).toBeNull();
    expect(parseBid("1")).toBeNull();
    expect(parseBid("foo")).toBeNull();
  });
});

describe("formatBid", () => {
  it("round-trips compact notation", () => {
    for (const raw of ["1C", "1D", "1H", "1S", "1NT", "7NT", "P", "X", "XX"]) {
      const parsed = parseBid(raw);
      expect(parsed).not.toBeNull();
      expect(formatBid(parsed!)).toBe(raw);
    }
  });

  it("renders pretty notation", () => {
    expect(formatBidPretty(parseBid("2C")!)).toBe("2♣");
    expect(formatBidPretty(parseBid("1NT")!)).toBe("1NT");
    expect(formatBidPretty(parseBid("P")!)).toBe("Pass");
    expect(formatBidPretty(parseBid("X")!)).toBe("Double");
    expect(formatBidPretty(parseBid("XX")!)).toBe("Redouble");
  });
});

describe("bidRank / bidOutranks", () => {
  it("ranks NT above suits at the same level", () => {
    expect(bidRank(parseBid("1C")!)).toBeLessThan(bidRank(parseBid("1NT")!));
    expect(bidRank(parseBid("1S")!)).toBeLessThan(bidRank(parseBid("1NT")!));
  });

  it("ranks a higher level above any lower-level bid", () => {
    expect(bidRank(parseBid("2C")!)).toBeGreaterThan(bidRank(parseBid("1NT")!));
  });

  it("determines outranking", () => {
    const oneNT = parseBid("1NT")!;
    expect(bidOutranks(parseBid("2C")!, oneNT)).toBe(true);
    expect(bidOutranks(parseBid("1C")!, oneNT)).toBe(false);
    expect(bidOutranks(parseBid("1NT")!, oneNT)).toBe(false);
    expect(bidOutranks(parseBid("1C")!, null)).toBe(true);
  });
});
