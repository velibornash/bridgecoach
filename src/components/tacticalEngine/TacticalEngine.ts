"use client";

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
  expectedPlaySequence?: string[]; // e.g. ["S2", "SA", "S5", "S3"]
  alternativeLines?: Record<string, string[]>; // Map play or bid to alternatives
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
  public submitBid(bid: string): { isCorrect: boolean; isComplete: boolean; expected: string; explanation?: string } {
    const nextExpectedIndex = this.currentBids.length;
    const expected = this.scenario.expectedAuction[nextExpectedIndex];

    if (!expected) {
      return { isCorrect: false, isComplete: true, expected: "", explanation: "Auction is already finished." };
    }

    const isCorrect = bid.toUpperCase() === expected.toUpperCase();
    if (isCorrect) {
      this.currentBids.push(bid);
    }

    const isComplete = this.currentBids.length === this.scenario.expectedAuction.length;

    return {
      isCorrect,
      isComplete,
      expected,
      explanation: isCorrect ? undefined : this.scenario.explanation,
    };
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
