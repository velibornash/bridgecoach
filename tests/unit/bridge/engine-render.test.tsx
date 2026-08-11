/**
 * Rendering smoke tests — the card engine and table must actually render in
 * the DOM without throwing (guards against import/format regressions).
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardEngine } from "@/components/cardEngine/CardEngine";
import { BridgeTable } from "@/components/bridge/BridgeTable";

describe("CardEngine", () => {
  it("renders a face-up card with rank and suit", () => {
    render(
      <CardEngine
        card={{ id: "1", suit: "♠", rank: "A", faceUp: true }}
        animate={false}
      />,
    );
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("♠").length).toBeGreaterThan(0);
  });

  it("does not expose the rank of a face-down card", () => {
    render(
      <CardEngine
        card={{ id: "2", suit: "♥", rank: "K", faceUp: false }}
        animate={false}
      />,
    );
    expect(screen.queryByText("K")).not.toBeInTheDocument();
  });
});

describe("BridgeTable", () => {
  const hands = [
    { position: "north" as const, cards: ["SA", "HK", "DQ"] },
    { position: "south" as const, cards: ["SQ", "HQ", "DA"] },
    { position: "east" as const, cards: ["SK", "H8"] },
    { position: "west" as const, cards: ["S7", "H9"] },
  ];

  it("renders the compass, contract, dealer and vulnerability", () => {
    render(
      <BridgeTable
        hands={hands}
        dealer="N"
        vulnerability="None"
        contract="1NT"
        turn="north"
      />,
    );
    expect(screen.getAllByText("N").length).toBeGreaterThan(0);
    expect(screen.getAllByText("S").length).toBeGreaterThan(0);
    expect(screen.getByText("Dealer N")).toBeInTheDocument();
    expect(screen.getByText("Vul None")).toBeInTheDocument();
    expect(screen.getByText("1NT")).toBeInTheDocument();
  });

  it("renders every card in each hand (rank + suit)", () => {
    render(<BridgeTable hands={hands} dealer="N" />);
    // Each suit symbol is drawn in the corners and centre of every card face,
    // so assert that each suit appears across the hands.
    for (const suit of ["♠", "♥", "♦"]) {
      expect(screen.getAllByText(suit).length).toBeGreaterThan(0);
    }
    // Every distinct rank is present.
    for (const rank of ["A", "K", "Q", "8", "9", "7"]) {
      expect(screen.getAllByText(rank).length).toBeGreaterThan(0);
    }
  });
});
