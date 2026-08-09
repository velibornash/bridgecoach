/**
 * Bridge Coach — Deterministic Auction State Machine.
 *
 * The auction is the part of bridge that MUST be deterministic. This machine
 * maintains, for every call:
 *   - dealer
 *   - current bidder
 *   - auction history
 *   - legal bids
 *   - current contract (highest bid + doubled/redoubled state)
 *   - passes
 *   - auction termination (contract or passed out)
 *
 * It does NOT contain any bidding strategy. Strategy lives in
 * `./evaluation.ts` and is strictly separated from legality.
 */

import {
  AuctionState,
  BidCall,
  Contract,
  FinalContract,
  Position,
  Vulnerability,
  nextPosition,
} from "./types";
import { parseBid } from "./bid";
import { LegalBidValidator } from "./validator";
import { ContractCalculator } from "./contract";

export interface CreateAuctionOptions {
  dealer: Position;
  vulnerability?: Vulnerability;
  /** Pre-seeded history (e.g. restoring a replay). */
  history?: string[];
}

export const PASSES_TO_END = 3;
export const PASSES_TO_PASS_OUT = 4;

export class AuctionStateMachine {
  private _dealer: Position;
  private _vulnerability: Vulnerability;
  private _history: BidCall[];
  private _currentBidder: Position;
  private _passesInRow: number;
  private _lastBidIndex: number;
  private _isComplete: boolean;
  private readonly _validator: LegalBidValidator;
  private readonly _calculator: ContractCalculator;

  constructor(options: CreateAuctionOptions) {
    this._dealer = options.dealer;
    this._vulnerability = options.vulnerability ?? "None";
    this._history = [];
    this._currentBidder = options.dealer;
    this._passesInRow = 0;
    this._lastBidIndex = -1;
    this._isComplete = false;
    this._validator = new LegalBidValidator();
    this._calculator = new ContractCalculator();

    if (options.history && options.history.length > 0) {
      for (const raw of options.history) {
        this.submit(raw);
      }
    }
  }

  get dealer(): Position {
    return this._dealer;
  }

  get vulnerability(): Vulnerability {
    return this._vulnerability;
  }

  get currentBidder(): Position {
    return this._currentBidder;
  }

  get history(): BidCall[] {
    return [...this._history];
  }

  get historyStrings(): string[] {
    return this._history.map(callToString);
  }

  get isComplete(): boolean {
    return this._isComplete;
  }

  /** The highest natural bid so far (standing contract), or null. */
  get currentContract(): Contract | null {
    if (this._lastBidIndex < 0) return null;
    const bid = this._history[this._lastBidIndex];
    if (bid.type !== "bid") return null;
    return {
      level: bid.level!,
      strain: bid.strain!,
      doubled: this.isDoubled,
      redoubled: this.isRedoubled,
    };
  }

  get isDoubled(): boolean {
    return this._hasCallAfterStandingBid("double");
  }

  get isRedoubled(): boolean {
    return this._hasCallAfterStandingBid("redouble");
  }

  get passesInRow(): number {
    return this._passesInRow;
  }

  /** True when any `type` call appears after the standing bid. */
  private _hasCallAfterStandingBid(type: "double" | "redouble"): boolean {
    if (this._lastBidIndex < 0) return false;
    for (let i = this._lastBidIndex + 1; i < this._history.length; i++) {
      if (this._history[i].type === type) return true;
    }
    return false;
  }

  /** All calls currently legal for `position` (usually the current bidder). */
  legalCalls(position: Position): BidCall[] {
    if (this._isComplete) return [];
    if (position !== this._currentBidder) return [];
    return this._validator.legalCalls(this.getState(), position);
  }

  /** True when `call` is legal for `position` right now. */
  isLegal(call: BidCall, position: Position): boolean {
    return this._validator.isLegal(this.getState(), position, call).legal;
  }

  /**
   * Submits a call on behalf of `position`. Throws when the call is not legal
   * for that position. Returns the updated state.
   */
  submit(input: string | BidCall, by?: Position): AuctionState {
    if (this._isComplete) {
      throw new Error("Auction has already ended.");
    }

    const call: BidCall = typeof input === "string"
      ? parseBidOrThrow(input)
      : input;

    const position = by ?? this._currentBidder;
    if (position !== this._currentBidder) {
      throw new Error(`Not ${position}'s turn; it is ${this._currentBidder}'s turn.`);
    }

    if (!this._validator.isLegal(this.getState(), position, call).legal) {
      throw new Error(`Illegal call "${callToString(call)}" for ${position}.`);
    }

    this._history.push(call);

    if (call.type === "bid") {
      this._lastBidIndex = this._history.length - 1;
      this._passesInRow = 0;
    } else if (call.type === "pass") {
      this._passesInRow += 1;
    } else {
      // double or redouble.
      this._passesInRow = 0;
    }

    this._currentBidder = nextPosition(position);

    // Termination rules.
    if (this._lastBidIndex >= 0 && this._passesInRow >= PASSES_TO_END) {
      this._isComplete = true;
    } else if (this._lastBidIndex < 0 && this._passesInRow >= PASSES_TO_PASS_OUT) {
      this._isComplete = true;
    }

    return this.getState();
  }

  /** The final contract (only valid once the auction is complete). */
  finalContract(): FinalContract | null {
    if (!this._isComplete) return null;
    return this._calculator.calculate(this._rawSnapshot());
  }

  getState(): AuctionState {
    const isComplete = this._isComplete;
    const snapshot = this._rawSnapshot();
    return {
      ...snapshot,
      finalContract: isComplete
        ? this._calculator.calculate(snapshot)
        : null,
    };
  }

  /** Builds the immutable AuctionState without recursion. */
  private _rawSnapshot(): AuctionState {
    return {
      dealer: this._dealer,
      vulnerability: this._vulnerability,
      history: this.history,
      currentBidder: this._currentBidder,
      passesInRow: this._passesInRow,
      lastBidIndex: this._lastBidIndex,
      currentContract: this.currentContract,
      isComplete: this._isComplete,
      finalContract: null,
      isDoubled: this.isDoubled,
      isRedoubled: this.isRedoubled,
    };
  }
}

function parseBidOrThrow(input: string): BidCall {
  const call = parseBid(input);
  if (!call) throw new Error(`Unrecognized bid "${input}".`);
  return call;
}

export function callToString(call: BidCall): string {
  switch (call.type) {
    case "pass":
      return "P";
    case "double":
      return "X";
    case "redouble":
      return "XX";
    case "bid":
      return `${call.level}${call.strain}`;
  }
}
