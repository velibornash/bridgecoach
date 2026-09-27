import { describe, it, expect } from "vitest";
import { AuctionStateMachine } from "@/bridge/auction";
import { Position, isPartner } from "@/bridge/types";
import { LegalBidValidator } from "@/bridge/validator";
import { parseBid } from "@/bridge/bid";

describe("AuctionStateMachine — deterministic auction", () => {
  it("tracks the current bidder counter-clockwise around the table", () => {
    // With South dealing, the order is South -> East -> North -> West: the
    // player to the dealer's left acts next. It previously ran South -> West ->
    // North -> East, which is clockwise.
    const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
    expect(auction.currentBidder).toBe(Position.SOUTH);
    auction.submit("P");
    expect(auction.currentBidder).toBe(Position.EAST);
    auction.submit("P");
    expect(auction.currentBidder).toBe(Position.NORTH);
    auction.submit("P");
    expect(auction.currentBidder).toBe(Position.WEST);
    auction.submit("P");
    expect(auction.currentBidder).toBe(Position.SOUTH);
  });

  it("puts the partner of the last caller in seat, not across the table", () => {
    // After South passes, East is next - an opponent, and therefore the seat
    // left to the dealer. North and West are dealt in after.
    const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
    auction.submit("P");
    expect(isPartner(Position.SOUTH, auction.currentBidder)).toBe(false);
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
    // Derived, not hard-coded: after the opener it is West's turn, and West is
    // an opponent of North. This test used to name East, which was only on
    // move under the old clockwise order.
    expect(auction.currentBidder).toBe(Position.WEST);
    const legal = auction.legalCalls(auction.currentBidder);
    const bids = legal.filter((c) => c.type === "bid");
    expect(bids.length).toBe(20); // 4 levels (4-7) × 5 strains
    expect(bids.every((b) => b.level! >= 4)).toBe(true);
    expect(legal.some((c) => c.type === "double")).toBe(true);
    expect(legal.some((c) => c.type === "pass")).toBe(true);
  });

  it("legalCalls gives the opener's partner only a pass", () => {
    // North opened 3NT; East is North's partner. You may not bid over your own
    // partner and you may not double them, so East's only option is to pass -
    // even though East is not on move.
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("3NT");
    const partnerCalls = auction.legalCalls(Position.EAST);
    expect(partnerCalls.every((c) => c.type === "pass")).toBe(true);
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
    auction.submit("P");   // W
    auction.submit("2NT"); // S - standing bid now belongs to East's opponent
    expect(auction.currentBidder).toBe(Position.EAST);
    expect(isPartner(Position.EAST, Position.NORTH)).toBe(false);
    const isLegal = validator.isLegal(auction.getState(), auction.currentBidder, parseBid("X")!);
    expect(isLegal.legal).toBe(true);
  });

  it("forbids doubling your own side's bid", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1C");  // N opens
    auction.submit("1S");  // W overcalls
    auction.submit("2C");  // S raises partner
    auction.submit("P");   // E
    // Current bidder is N; the standing contract is partner S's 2C.
    const isLegal = validator.isLegal(auction.getState(), Position.NORTH, parseBid("X")!);
    expect(isLegal.legal).toBe(false);
  });

  it("allows redouble only against a double of your side", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1NT"); // N
    auction.submit("X");   // W doubles N-S
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
    auction.submit("X");  // W
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
