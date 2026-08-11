/**
 * Tactical training integration tests — the bidding drill engine plus the
 * AI-coach validation fallback (legality always lives on the server).
 */
import { describe, expect, it } from "vitest";
import { TacticalEngine, type TacticalScenario } from "@/components/tacticalEngine/TacticalEngine";
import { validateTacticalBid } from "@/services/aiCoachService";

const scenario: TacticalScenario = {
  id: "tactical-1",
  title: "1NT opener drills",
  difficulty: "Beginner",
  dealer: "N",
  vulnerability: "None",
  hands: {
    N: { spades: ["AK87"], hearts: ["Q85"], diamonds: ["A653"], clubs: ["QJ8"] },
    E: { spades: ["643"], hearts: ["972"], diamonds: ["982"], clubs: ["10763"] },
    S: { spades: ["Q95"], hearts: ["A104"], diamonds: ["K74"], clubs: ["A652"] },
    W: { spades: ["J102"], hearts: ["KJ63"], diamonds: ["QJ10"], clubs: ["K94"] },
  },
  expectedAuction: ["1NT", "P", "3NT", "P", "P", "P"],
  expectedPlaySequence: ["S2", "SA", "S5", "S3"],
  explanation: "Open 1NT with 15-17 HCP balanced, then raise to game.",
};

describe("TacticalEngine", () => {
  it("accepts the correct bid and advances", () => {
    const engine = new TacticalEngine(scenario);
    const first = engine.submitBid("1NT");
    expect(first.isCorrect).toBe(true);
    expect(first.expected).toBe("1NT");
    expect(engine.getCurrentState().currentBids).toEqual(["1NT"]);
  });

  it("rejects a wrong bid without advancing", () => {
    const engine = new TacticalEngine(scenario);
    const first = engine.submitBid("1H");
    expect(first.isCorrect).toBe(false);
    expect(first.explanation).toBe(scenario.explanation);
    expect(engine.getCurrentState().currentBids).toEqual([]);
  });

  it("detects auction completion after three passes following a contract", () => {
    const engine = new TacticalEngine(scenario);
    for (const bid of ["1NT", "P", "3NT", "P", "P", "P"]) {
      engine.submitBid(bid);
    }
    expect(engine.isAuctionComplete()).toBe(true);
    expect(engine.submitBid("P").isComplete).toBe(true);
  });

  it("records AI-accepted diverging bids without breaking the flow", () => {
    const engine = new TacticalEngine(scenario);
    engine.pushBid("2C");
    engine.pushBid("2H");
    const next = engine.submitBid("3NT");
    expect(next.isCorrect).toBe(true);
  });

  it("resets cleanly", () => {
    const engine = new TacticalEngine(scenario);
    engine.submitBid("1NT");
    engine.reset();
    expect(engine.getCurrentState().currentBids).toEqual([]);
  });

  it("validates the expected play sequence", () => {
    const engine = new TacticalEngine(scenario);
    const play = engine.submitPlay("S2");
    expect(play.isCorrect).toBe(true);
  });
});

describe("validateTacticalBid fallback", () => {
  it("returns null (offline fallback) when the API is unreachable", async () => {
    // jsdom has no fetch, so the service degrades to the deterministic path.
    const flatHands: Record<string, string[]> = Object.fromEntries(
      (["N", "E", "S", "W"] as const).map((pos) => [pos, [
        ...scenario.hands[pos].spades,
        ...scenario.hands[pos].hearts,
        ...scenario.hands[pos].diamonds,
        ...scenario.hands[pos].clubs,
      ]]),
    );
    const verdict = await validateTacticalBid({
      hands: flatHands,
      dealer: scenario.dealer,
      vulnerability: scenario.vulnerability,
      auction: [],
      turn: "N",
      proposedBid: "1NT",
    });
    expect(verdict).toBeNull();
  });
});
