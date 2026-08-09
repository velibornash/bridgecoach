import { describe, it, expect } from "vitest";
import { AuctionStateMachine } from "@/bridge/auction";
import { Position } from "@/bridge/types";

describe("ContractCalculator — declarer & final contract", () => {
  it("finds the declarer when partner bid the strain first", () => {
    // N opens 1S, S raises to 3S. Auction ends. Declarer should be N.
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1S"); // N
    auction.submit("P");  // E
    auction.submit("3S"); // S
    auction.submit("P");  // W
    auction.submit("P");  // N
    auction.submit("P");  // E
    const final = auction.finalContract()!;
    expect(final.passedOut).toBe(false);
    expect(final.contract).toEqual({ level: 3, strain: "S", doubled: false, redoubled: false });
    expect(final.declarer).toBe(Position.NORTH);
  });

  it("finds the declarer when the final bid was made by the partner", () => {
    // E opens 1C, W raises to 2C. Declarer should be E.
    const auction = new AuctionStateMachine({ dealer: Position.EAST });
    auction.submit("1C"); // E
    auction.submit("P");  // S
    auction.submit("2C"); // W
    auction.submit("P");  // N
    auction.submit("P");  // E
    auction.submit("P");  // S
    const final = auction.finalContract()!;
    expect(final.declarer).toBe(Position.EAST);
  });

  it("carries doubled/redoubled state into the final contract", () => {
    const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
    auction.submit("1NT"); // S
    auction.submit("X");   // W doubles
    auction.submit("XX");  // N redoubles
    auction.submit("P");   // E
    auction.submit("P");   // S
    auction.submit("P");   // W
    const final = auction.finalContract()!;
    expect(final.contract!.doubled).toBe(true);
    expect(final.contract!.redoubled).toBe(true);
    expect(final.declarer).toBe(Position.SOUTH);
  });

  it("reports passed out when no bid is made", () => {
    const auction = new AuctionStateMachine({ dealer: Position.WEST });
    auction.submit("P");
    auction.submit("P");
    auction.submit("P");
    auction.submit("P");
    const final = auction.finalContract()!;
    expect(final.passedOut).toBe(true);
    expect(final.contract).toBeNull();
    expect(final.declarer).toBeNull();
  });

  it("returns null while the auction is open", () => {
    const auction = new AuctionStateMachine({ dealer: Position.NORTH });
    auction.submit("1C");
    expect(auction.finalContract()).toBeNull();
  });
});
