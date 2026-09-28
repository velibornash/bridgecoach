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
/**
 * An **auction**, because that is what this component replays: its rows come from
 * `AuctionAction`, which holds calls and has no column for a played card.
 *
 * The fixture it replaces was the type confusion itself - "♥K", "Lead from the
 * King-Queen sequence", "Wins the trick" - card play fed to a call replayer, and
 * rendered back out as "Played ♥K". So a bid rendered as though someone had
 * played it.
 */
const SCENARIO: ReplayScenario = {
  id: "test",
  title: "Spade Opening Auction",
  contract: "4♠ by South",
  declarer: "South",
  actions: [
    { player: "South", kind: "bid", action: "1♠", explanation: "Five-card major, 13 points.", isBestPlay: true },
    { player: "West", kind: "double", action: "X", explanation: "Doubled for penalty: West holds spade length.", isBestPlay: true },
    { player: "North", kind: "redouble", action: "XX", explanation: "South is known to be long in spades.", isBestPlay: true },
    { player: "East", kind: "bid", action: "3NT", explanation: "Penalty double, not a takeout - bidding over it is a mistake.", isBestPlay: false },
    { player: "South", kind: "pass", action: "Pass", explanation: "Declines the penalty.", isBestPlay: true },
    { player: "East", kind: "pass", action: "Pass", explanation: "Auction over at four spades.", isBestPlay: true },
  ],
};

const renderReplayer = () => render(<HandReplayer providedScenarios={[SCENARIO]} />);

describe("HandReplayer", () => {
  it("renders the scenario header with contract and declarer", () => {
    renderReplayer();
    expect(screen.getByText("Spade Opening Auction")).toBeInTheDocument();
    expect(screen.getByText(/4♠ by South/)).toBeInTheDocument();
  });

  it("starts on the first action", () => {
    renderReplayer();
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
    // A call is labelled as the call it is. "Played 1♠" would tell the learner
    // someone played a card that does not exist.
    expect(screen.getByText("Bid 1♠")).toBeInTheDocument();
    // Every kind of call appears with its own verb, and no card-play label
    // appears anywhere in the stepper.
    expect(screen.getByText("Doubled X")).toBeInTheDocument();
    expect(screen.getByText("Redoubled XX")).toBeInTheDocument();
    expect(screen.queryByText(/Played/)).not.toBeInTheDocument();
  });

  it("steps forward, backward and resets", async () => {
    const user = userEvent.setup();
    renderReplayer();

    await user.click(screen.getByTitle("Step Forward"));
    expect(screen.getByText("2 / 6")).toBeInTheDocument();
    expect(screen.getByText("Bid 1♠")).toBeInTheDocument();

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
