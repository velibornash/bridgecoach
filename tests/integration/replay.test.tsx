/**
 * Replay module smoke tests — the hand replayer renders and navigates.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HandReplayer } from "@/components/replayEngine/HandReplayer";

describe("HandReplayer", () => {
  it("renders the scenario header with contract and declarer", () => {
    render(<HandReplayer />);
    expect(screen.getByText("Opening Lead Defense Replay")).toBeInTheDocument();
    expect(screen.getByText(/4♠ by South/)).toBeInTheDocument();
  });

  it("starts on the first action", () => {
    render(<HandReplayer />);
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
    expect(screen.getByText(/Played ♥K/)).toBeInTheDocument();
  });

  it("steps forward, backward and resets", async () => {
    const user = userEvent.setup();
    render(<HandReplayer />);

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
    render(<HandReplayer />);

    expect(screen.getByTitle("Step Back")).toBeDisabled();

    for (let i = 0; i < 10; i++) {
      await user.click(screen.getByTitle("Step Forward"));
    }
    expect(screen.getByText("6 / 6")).toBeInTheDocument();
    expect(screen.getByTitle("Step Forward")).toBeDisabled();
  });
});
