"use client";

import { AuctionStateMachine } from "@/bridge/auction";
import { parseBid, bidOutranks } from "@/bridge/bid";
import { judgeCallText, isDrillComplete } from "@/bridge/drill";
import type { Contract, Strain } from "@/bridge/types";

export type Suit = "S" | "H" | "D" | "C" | "NT";
export type Position = "N" | "E" | "S" | "W";
export type Vulnerability = "None" | "NS" | "EW" | "All";

export interface BridgeBid {
  level: number; // 1 to 7
  suit: Suit;
  declarer?: Position;
}

export interface BridgeHand {
  spades: string[];
  hearts: string[];
  diamonds: string[];
  clubs: string[];
}

export interface TacticalScenario {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  dealer: Position;
  vulnerability: Vulnerability;
  hands: Record<Position, BridgeHand>;
  expectedAuction: string[]; // e.g. ["1NT", "P", "2D", "P", "2H", "P", "P", "P"]
  /**
   * Whether a different route to the same contract counts. Defaults to `true`.
   *
   * Two kinds of drill need different treatment, and the engine cannot tell them
   * apart from the auction alone:
   *
   * - A **concept** drill (Stayman, transfers) is about a partnership agreement.
   *   Any legal auction that reaches the contract teaches the concept, so
   *   alternatives must be accepted or the learner is graded on recall.
   * - An **exact** drill is about one specific call — "open 1NT with 15-17". Here
   *   any legal call really is a wrong answer, and a permissive rule would let a
   *   learner pass without learning the thing being taught.
   *
   * Set `false` for the second kind. The default is `true` because the common
   * failure was marking a good alternative wrong.
   */
  allowAlternatives?: boolean;
  expectedPlaySequence?: string[]; // e.g. ["S2", "SA", "S5", "S3"]
  /**
   * REMOVED: `alternativeLines`. It was declared and never read by anything, so
   * it advertised support for alternative lines that did not exist. The real
   * mechanism is `allowAlternatives` above.
   */
  explanation: string;
}

export class TacticalEngine {
  private scenario: TacticalScenario;
  private currentBids: string[] = [];
  private currentPlay: string[] = [];
  private score = 0;

  constructor(scenario: TacticalScenario) {
    this.scenario = scenario;
  }

  public reset() {
    this.currentBids = [];
    this.currentPlay = [];
    this.score = 0;
  }

  // Validate if a player bid matches the expected auction path
  /**
   * Judge a bid against the drill's **contract**, not against a stored string.
   *
   * This used to be `bid === expectedAuction[currentBids.length]`: a test of
   * transcription, not of judgement. A learner who reached the drill's contract
   * by a different and equally good route was told they were wrong, and the only
   * way to be told right was to recall the book.
   *
   * The call is now put to the engine's acceptability rule — legal, and it does
   * not put the target contract out of reach — and the drill ends when the
   * auction completes at that contract, however many calls it took. The book line
   * is still here, unchanged, as the hint.
   */
  public submitBid(bid: string): {
    isCorrect: boolean;
    isComplete: boolean;
    expected: string;
    explanation?: string;
    /** The contract this drill is about. */
    target?: Contract;
  } {
    const nextExpectedIndex = this.currentBids.length;
    const expected = this.scenario.expectedAuction[nextExpectedIndex];
    const target = this.targetContract();

    if (this.isAuctionComplete()) {
      return { isCorrect: false, isComplete: true, expected: "", explanation: "Auction is already finished." };
    }

    if (this.scenario.allowAlternatives === false) {
      // The drill teaches one specific call, so matching it is the point.
      const matches = bid.toUpperCase() === (expected ?? "").toUpperCase();
      if (matches) this.currentBids.push(bid);
      return {
        isCorrect: matches,
        isComplete: this.isAuctionComplete(),
        expected: expected ?? "",
        explanation: matches ? undefined : this.scenario.explanation,
        target,
      };
    }

    const judgement = judgeCallText(this.engineState(), bid, target);
    if (!judgement.acceptable) {
      return {
        isCorrect: false,
        isComplete: false,
        expected: expected ?? "",
        explanation: judgement.reason,
        target,
      };
    }

    this.currentBids.push(bid);

    const complete = this.isAuctionComplete();
    const delivered = complete && isDrillComplete(this.engineState(), target);
    return {
      isCorrect: true,
      isComplete: delivered || (complete && !delivered),
      expected: expected ?? "",
      // Reached the end of the auction at the wrong contract: say so rather than
      // reporting a pass.
      explanation: complete && !delivered
        ? `The auction ended at a different contract than this drill's ${target.level}${target.strain}.`
        : undefined,
      target,
    };
  }

  /**
   * The contract the drill is about, taken from the book line's highest bid.
   *
   * Derived rather than stored separately, so a scenario cannot declare a target
   * that disagrees with the line it teaches.
   */
  public targetContract(): Contract {
    let level = 0;
    let strain: Strain = "NT";
    for (const call of this.scenario.expectedAuction) {
      const parsed = parseBid(call);
      if (parsed && parsed.type === "bid" && bidOutranks(parsed, { level, strain })) {
        level = parsed.level ?? level;
        strain = parsed.strain ?? strain;
      }
    }
    return { level, strain, doubled: false, redoubled: false };
  }

  /** The auction as the engine sees it, replayed from the accepted calls. */
  private engineState() {
    const machine = new AuctionStateMachine({ dealer: this.scenario.dealer, vulnerability: this.scenario.vulnerability });
    for (const call of this.currentBids) {
      const parsed = parseBid(call);
      if (parsed) machine.submit(parsed);
    }
    return machine.getState();
  }

  /** Record a bid that the AI coach accepted even though it differs from the expert line. */
  public pushBid(bid: string) {
    this.currentBids.push(bid);
  }

  /** The auction is over after a contract followed by three consecutive passes. */
  public isAuctionComplete(): boolean {
    if (this.currentBids.length < 3) return false;
    const hadContract = this.currentBids.some((b) => b.toUpperCase() !== "P");
    if (!hadContract) return false;
    return this.currentBids.slice(-3).every((b) => b.toUpperCase() === "P");
  }

  // Validate a card play (Sprint 53)
  public submitPlay(card: string): { isCorrect: boolean; isComplete: boolean; expected: string; explanation?: string } {
    if (!this.scenario.expectedPlaySequence) {
      return { isCorrect: true, isComplete: true, expected: "" };
    }

    const nextExpectedIndex = this.currentPlay.length;
    const expected = this.scenario.expectedPlaySequence[nextExpectedIndex];

    if (!expected) {
      return { isCorrect: false, isComplete: true, expected: "", explanation: "All plays completed." };
    }

    const isCorrect = card.toUpperCase() === expected.toUpperCase();
    if (isCorrect) {
      this.currentPlay.push(card);
    }

    const isComplete = this.currentPlay.length === this.scenario.expectedPlaySequence.length;

    return {
      isCorrect,
      isComplete,
      expected,
      explanation: isCorrect ? undefined : this.scenario.explanation,
    };
  }

  public getCurrentState() {
    return {
      scenario: this.scenario,
      currentBids: this.currentBids,
      currentPlay: this.currentPlay,
    };
  }
}
