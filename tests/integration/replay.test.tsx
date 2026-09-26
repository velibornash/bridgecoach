/**
 * Replay module smoke tests — the hand replayer renders and navigates.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HandReplayer, type ReplayScenario } from "@/components/replayEngine/HandReplayer";

/**
 * The stepping behaviour is unchanged and still worth testing. The component
 * used to carry its own hardcoded hand, which meant these tests were coupled to
 * a fixture rather than to the navigation logic. They now pass a scenario in, so
 * they test what they claim to test and the component keeps reading the player's
 * real auctions when no scenario is supplied.
 */
const SCENARIO: ReplayScenario = {
  id: "test",
  title: "Opening Lead Defense Replay",
  contract: "4♠ by South",
  declarer: "South",
  actions: [
    { player: "West", action: "♥K", explanation: "Lead from the King-Queen sequence.", isBestPlay: true },
    { player: "North", action: "♥2", explanation: "Follows suit low from dummy.", isBestPlay: true },
    { player: "East", action: "♥7", explanation: "Encouraging signal.", isBestPlay: true },
    { player: "South", action: "♥A", explanation: "Wins the trick, keeping control.", isBestPlay: true },
    { player: "South", action: "♠Q", explanation: "Premature trump lead.", isBestPlay: false },
    { player: "West", action: "♠K", explanation: "Covers to retain the tempo.", isBestPlay: true },
  ],
};

const renderReplayer = () => render(<HandReplayer providedScenarios={[SCENARIO]} />);

describe("HandReplayer", () => {
  it("renders the scenario header with contract and declarer", () => {
    renderReplayer();
    expect(screen.getByText("Opening Lead Defense Replay")).toBeInTheDocument();
    expect(screen.getByText(/4♠ by South/)).toBeInTheDocument();
  });

  it("starts on the first action", () => {
    renderReplayer();
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
    expect(screen.getByText(/Played ♥K/)).toBeInTheDocument();
  });

  it("steps forward, backward and resets", async () => {
    const user = userEvent.setup();
    renderReplayer();

    await user.click(screen.getByTitle("Step Forward"));
    expect(screen.getByText("2 / 6")).toBeInTheDocument();
    expect(screen.getByText(/Played ♥2/)).toBeInTheDocument();

    await user.click(screen.getByTitle("Step Back"));
    expect(screen.getByText("1 / 6")).toBeInTheDocument();

    await user.click(screen.getByTitle("Step Forward"));
    await user.click(screen.getByTitle("Step Forward"));
    await user.click(screen.getByTitle("Reset"));
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });

  it("cannot step before the first or after the last action", async () => {
    const user = userEvent.setup();
    renderReplayer();

    expect(screen.getByTitle("Step Back")).toBeDisabled();

    for (let i = 0; i < 10; i++) {
      await user.click(screen.getByTitle("Step Forward"));
    }
    expect(screen.getByText("6 / 6")).toBeInTheDocument();
    expect(screen.getByTitle("Step Forward")).toBeDisabled();
  });
});
