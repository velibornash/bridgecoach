import { describe, it, expect } from "vitest";
import { AuctionStateMachine } from "@/bridge/auction";
import { Position } from "@/bridge/types";
import { LegalBidValidator } from "@/bridge/validator";
import { parseBid } from "@/bridge/bid";

describe("AuctionStateMachine — deterministic auction", () => {
  it("tracks the current bidder around the table", () => {
    const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
    expect(auction.currentBidder).toBe(Position.SOUTH);
    auction.submit("P");
    expect(auction.currentBidder).toBe(Position.WEST);
    auction.submit("P");
    expect(auction.currentBidder).toBe(Position.NORTH);
    auction.submit("P");
    expect(auction.currentBidder).toBe(Position.EAST);
    auction.submit("P");
    expect(auction.currentBidder).toBe(Position.SOUTH);
  });

  it("records the auction history", () => {
    const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
    auction.submit("1NT");
    auction.submit("P");
    auction.submit("2C");
    expect(auction.historyStrings).toEqual(["1NT", "P", "2C"]);
  });

  it("rejects a call when it is not the player's turn", () => {
    const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
    expect(() => auction.submit("1C", Position.NORTH)).toThrow(/turn/);
  });

  it("rejects a bid that does not outrank the current contract", () => {
    const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
    auction.submit("1NT");
    auction.submit("P");
    auction.submit("P");
    expect(() => auction.submit("1C")).toThrow(/Illegal call|outrank/);
    expect(() => auction.submit("1S")).toThrow(/Illegal call|outrank/);
    expect(() => auction.submit("1NT")).toThrow(/Illegal call|outrank/);
  });

  it("rejects any call after the auction has ended", () => {
    const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
    auction.submit("1NT");
    auction.submit("P");
    auction.submit("P");
    auction.submit("P");
    expect(auction.isComplete).toBe(true);
    expect(() => auction.submit("P")).toThrow(/ended/);
  });

  it("allows a higher bid after a lower one", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1C");
    auction.submit("X");
    auction.submit("1S");
    expect(auction.currentContract).toEqual({
      level: 1,
      strain: "S",
      doubled: false,
      redoubled: false,
    });
  });

  it("legalCalls returns only bids above the current contract", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("3NT");
    const legal = auction.legalCalls(Position.EAST);
    const bids = legal.filter((c) => c.type === "bid");
    expect(bids.length).toBe(20); // 4 levels (4-7) × 5 strains
    expect(bids.every((b) => b.level! >= 4)).toBe(true);
    expect(legal.some((c) => c.type === "double")).toBe(true);
    expect(legal.some((c) => c.type === "pass")).toBe(true);
  });

  it("passes out after four consecutive passes", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("P");
    auction.submit("P");
    auction.submit("P");
    auction.submit("P");
    expect(auction.isComplete).toBe(true);
    const final = auction.finalContract();
    expect(final!.passedOut).toBe(true);
    expect(final!.contract).toBeNull();
    expect(final!.declarer).toBeNull();
  });
});

describe("LegalBidValidator — doubles & redoubles", () => {
  const validator = new LegalBidValidator();

  it("allows double against an opponent's bid", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1NT"); // N opens
    auction.submit("P");   // E
    auction.submit("P");   // S
    const isLegal = validator.isLegal(auction.getState(), Position.WEST, parseBid("X")!);
    expect(isLegal.legal).toBe(true);
  });

  it("forbids doubling your own side's bid", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1C");  // N opens
    auction.submit("1S");  // E overcalls
    auction.submit("2C");  // S raises partner
    auction.submit("P");   // W
    // Current bidder is N; the standing contract is partner S's 2C.
    const isLegal = validator.isLegal(auction.getState(), Position.NORTH, parseBid("X")!);
    expect(isLegal.legal).toBe(false);
  });

  it("allows redouble only against a double of your side", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1NT"); // N
    auction.submit("X");   // E doubles N-S
    const redouble = validator.isLegal(auction.getState(), Position.SOUTH, parseBid("XX")!);
    expect(redouble.legal).toBe(true);
    // West (E-W) may NOT redouble E's own double.
    const westRedouble = validator.isLegal(auction.getState(), Position.WEST, parseBid("XX")!);
    expect(westRedouble.legal).toBe(false);
  });

  it("tracks doubled / redoubled state on the contract", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1NT");
    auction.submit("X");
    expect(auction.currentContract!.doubled).toBe(true);
    auction.submit("XX");
    expect(auction.currentContract!.redoubled).toBe(true);
  });

  it("resets the double when the contract is raised", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1C"); // N
    auction.submit("X");  // E
    auction.submit("2C"); // S raises
    expect(auction.currentContract!.doubled).toBe(false);
  });
});

describe("auction termination", () => {
  it("ends after three passes following a bid", () => {
    const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
    auction.submit("1NT");
    auction.submit("P");
    auction.submit("P");
    auction.submit("P");
    expect(auction.isComplete).toBe(true);
  });

  it("does not end on two passes following a bid", () => {
    const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
    auction.submit("1NT");
    auction.submit("P");
    auction.submit("P");
    expect(auction.isComplete).toBe(false);
  });
});
