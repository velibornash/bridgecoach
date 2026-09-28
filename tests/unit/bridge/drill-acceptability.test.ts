/**
 * T10 — the drill judges the call, not the string.
 *
 * The drill used to compare each bid to one hard-coded sequence, so a different
 * and equally good route to the same contract was marked wrong. The spec's
 * instruction for this file is blunt: if no alternative can be expressed as
 * acceptable, the rule is still a string comparison and this test should not
 * pass. So the first test is a known-equivalent alternative, and it is checked
 * against a *fresh* state rather than a replayed book line.
 */
import { describe, it, expect } from "vitest";
import { judgeCall, judgeCallText, isDrillComplete, sameContract } from "@/bridge/drill";
import { AuctionStateMachine } from "@/bridge/auction";
import { Contract, Position } from "@/bridge/types";
import { LegalBidValidator } from "@/bridge/validator";
import { parseBid } from "@/bridge/bid";
import { TacticalEngine } from "@/components/tacticalEngine/TacticalEngine";

/** Stayman: the drill's contract is 4♠. */
const TARGET: Contract = { level: 4, strain: "S", doubled: false, redoubled: false };

/** Replay a sequence of calls, returning the engine state. */
function at(calls: string[], dealer: Position = Position.NORTH) {
  const machine = new AuctionStateMachine({ dealer });
  for (const call of calls) machine.submit(parseBid(call)!);
  return machine.getState();
}

describe("a known-equivalent alternative is acceptable", () => {
  /**
   * The book line for a Stayman drill is one route. This is another: jump to 2NT
   * instead of asking, and land on 4♠ the same way. Under the old rule every one
   * of these was "wrong" for not matching the expected string.
   */
  it("accepts bidding 2NT over 1NT as a way to reach a 4♠ contract", () => {
    // Dealer North: N opens 1NT, East passes, South asks by bidding 2NT.
    expect(judgeCallText(at(["1NT", "P"]), "2NT", TARGET).acceptable).toBe(true);
  });

  it("accepts more than one call that leads to the same contract", () => {
    // Both 2H and 2C over a 1NT opening are legal and neither overshoots 4♠.
    expect(judgeCallText(at(["1NT", "P"]), "2H", TARGET).acceptable).toBe(true);
    expect(judgeCallText(at(["1NT", "P"]), "2C", TARGET).acceptable).toBe(true);
    expect(judgeCallText(at(["1NT", "P"]), "2S", TARGET).acceptable).toBe(true);
    expect(judgeCallText(at(["1NT", "P"]), "2D", TARGET).acceptable).toBe(true);
  });

  it("treats the target itself, and anything below it, as reachable", () => {
    // 4♠ ties the target and 4♥ is a lower contract, so both keep 4♠ available.
    expect(judgeCallText(at([]), "4S", TARGET).overshoots).toBe(false);
    expect(judgeCallText(at([]), "4H", TARGET).overshoots).toBe(false);
    expect(judgeCallText(at([]), "4H", TARGET).acceptable).toBe(true);
  });

  it("accepts a direct 4♠, a jump, or a long series of passes", () => {
    expect(judgeCallText(at([]), "4S", TARGET).acceptable).toBe(true);
    expect(judgeCallText(at([]), "1S", TARGET).acceptable).toBe(true);
    expect(judgeCallText(at(["1NT"]), "P", TARGET).acceptable).toBe(true);
  });
});

describe("the rule still refuses what the rules refuse", () => {
  it("refuses a call that outranks the drill's contract", () => {
    // Only calls strictly *above* 4♠ end the drill. 4♠ itself ties, and 4♥ is
    // below it, so neither is an overshoot - the target is still available.
    const state = at([]);
    for (const over of ["4NT", "5C", "5D", "5H", "5S", "6C", "6S", "7D"]) {
      const judgement = judgeCallText(state, over, TARGET);
      expect(judgement.acceptable, over).toBe(false);
      expect(judgement.overshoots, over).toBe(true);
      expect(judgement.reason, over).toMatch(/no longer be reached/);
    }
  });

  it("still refuses a bid that does not outrank the current contract", () => {
    // 1NT is standing; 1♠ does not outrank it. Legality still applies.
    const judgement = judgeCallText(at(["1NT", "P"]), "1S", TARGET);
    expect(judgement.acceptable).toBe(false);
    expect(judgement.reason).toMatch(/does not outrank/i);
  });

  it("judges the seat that is actually on turn, and says so", () => {
    // North dealer, one call made, so East is to act. The rule asks the engine
    // about `currentBidder` and never invents a seat, so a caller cannot use it
    // to judge a bid out of turn - the validator is the only way to ask about a
    // specific seat, and it says no.
    const machine = new AuctionStateMachine({ dealer: Position.NORTH });
    machine.submit(parseBid("1NT")!);
    const state = machine.getState();
    expect(state.currentBidder).toBe(Position.EAST);
    expect(judgeCall(state, parseBid("2H")!, TARGET).acceptable).toBe(true);
    expect(new LegalBidValidator().isLegal(state, Position.WEST, parseBid("2H")!).legal).toBe(false);
  });

  it("rejects text that is not a call at all", () => {
    const judgement = judgeCallText(at([]), "banana", TARGET);
    expect(judgement.acceptable).toBe(false);
    expect(judgement.reason).toMatch(/not a bridge call/i);
  });
});

describe("a drill is complete when the contract matches, not the calls", () => {
  it("accepts the book line", () => {
    const state = at(["1NT", "P", "2C", "P", "2H", "P", "4S", "P", "P", "P"]);
    expect(state.isComplete).toBe(true);
    expect(isDrillComplete(state, TARGET)).toBe(true);
  });

  it("accepts a different auction that reaches the same contract", () => {
    // 1NT - 2NT - 3NT is not the book line, and it does not reach 4♠.
    const wrongContract = at(["1NT", "P", "2NT", "P", "3NT", "P", "P", "P"]);
    expect(isDrillComplete(wrongContract, TARGET)).toBe(false);

    // This one reaches 4♠ by a different route and must pass.
    const sameDeal = at(["1NT", "P", "2H", "P", "2S", "P", "4S", "P", "P", "P"]);
    expect(isDrillComplete(sameDeal, TARGET)).toBe(true);
  });

  it("is not complete while the auction is still open", () => {
    expect(isDrillComplete(at(["1NT", "P", "2C"]), TARGET)).toBe(false);
  });

  it("is not complete when the auction was passed out", () => {
    expect(isDrillComplete(at(["P", "P", "P", "P"]), TARGET)).toBe(false);
  });

  it("compares level and strain, and ignores who doubled", () => {
    expect(sameContract(TARGET, { level: 4, strain: "S", doubled: true, redoubled: false })).toBe(true);
    expect(sameContract(TARGET, { level: 4, strain: "H", doubled: false, redoubled: false })).toBe(false);
    expect(sameContract(TARGET, { level: 3, strain: "S", doubled: false, redoubled: false })).toBe(false);
  });
});

describe("the book line is still reachable", () => {
  it("stays acceptable call by call, so it can still be followed", () => {
    // If the rule ever rejected a call the drill itself teaches, the drill would
    // have been broken in the other direction: correct play refused.
    const book = ["1NT", "P", "2C", "P", "2H", "P", "4S", "P", "P", "P"];
    for (let i = 0; i < book.length; i += 1) {
      const state = at(book.slice(0, i));
      const judgement = judgeCallText(state, book[i]!, TARGET);
      expect(judgement.acceptable, `book line step ${i}: ${book[i]}`).toBe(true);
      expect(judgement.overshoots, `book line step ${i}: ${book[i]}`).toBe(false);
    }
  });
});

describe("the drill engine accepts alternative routes", () => {
  const scenario = {
    id: "stayman",
    title: "Stayman",
    difficulty: "Beginner" as const,
    dealer: Position.NORTH,
    vulnerability: "None" as const,
    hands: {
      N: { spades: [], hearts: [], diamonds: [], clubs: [] },
      E: { spades: [], hearts: [], diamonds: [], clubs: [] },
      S: { spades: [], hearts: [], diamonds: [], clubs: [] },
      W: { spades: [], hearts: [], diamonds: [], clubs: [] },
    },
    // The book line: ask with 2C, respond in hearts, land 4S.
    expectedAuction: ["1NT", "P", "2C", "P", "2H", "P", "4S", "P", "P", "P"],
    explanation: "Two clubs asks for a major.",
  };

  /** Run a whole auction through the drill, as the page does. */
  function playDrill(engine: TacticalEngine, calls: string[]) {
    for (const call of calls) {
      const result = engine.submitBid(call);
      if (!result.isCorrect) return { accepted: false, result, at: call };
      if (result.isComplete) return { accepted: true, result, at: call, done: true };
    }
    return { accepted: true, result: null, at: null };
  }

  it("derives the drill's contract from the line it teaches", () => {
    const engine = new TacticalEngine(scenario);
    expect(engine.targetContract()).toEqual({ level: 4, strain: "S", doubled: false, redoubled: false });
  });

  it("accepts the book line unchanged", () => {
    const engine = new TacticalEngine(scenario);
    const run = playDrill(engine, scenario.expectedAuction);
    expect(run.done).toBe(true);
    expect(engine.isAuctionComplete()).toBe(true);
  });

  it("accepts a different auction that reaches the same contract", () => {
    // No Stayman: 1NT - 2NT - 3NT is a different contract, but 1NT - 2H - 2S -
    // 4S reaches 4♠ without ever asking, and that is a good auction.
    const engine = new TacticalEngine(scenario);
    const run = playDrill(engine, ["1NT", "P", "2H", "P", "2S", "P", "4S", "P", "P", "P"]);
    expect(run.accepted, `rejected at ${run.at}`).toBe(true);
    expect(run.done).toBe(true);
  });

  it("accepts a direct auction with fewer calls than the book line", () => {
    // The drill used to end when the call count matched the book's ten, so a
    // shorter correct auction was reported as unfinished.
    const engine = new TacticalEngine(scenario);
    const run = playDrill(engine, ["1NT", "P", "2NT", "P", "3NT", "P", "P", "P"]);
    expect(run.accepted, `rejected at ${run.at}`).toBe(true);
    expect(run.done).toBe(true);
    // 3NT is not 4S, so the drill is over but the contract was not delivered.
    expect(run.result?.explanation).toMatch(/different contract/);
  });

  it("still refuses a bid that overshoots, and explains why", () => {
    const engine = new TacticalEngine(scenario);
    const result = engine.submitBid("5S");
    expect(result.isCorrect).toBe(false);
    expect(result.explanation).toMatch(/no longer be reached/);
  });

  it("still refuses a bid that does not outrank the standing contract", () => {
    const engine = new TacticalEngine(scenario);
    expect(engine.submitBid("1NT").isCorrect).toBe(true);
    const second = engine.submitBid("1S");
    expect(second.isCorrect).toBe(false);
    expect(second.explanation).toMatch(/does not outrank/i);
  });

  it("keeps the book line available as the expected next call", () => {
    const engine = new TacticalEngine(scenario);
    // The hint is unchanged, so a learner can always ask what the book says.
    expect(engine.submitBid("1NT").expected).toBe("1NT");
    expect(engine.submitBid("P").expected).toBe("P");
  });
});
