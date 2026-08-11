/**
 * Bridge Engine — public surface.
 *
 * Architecture:
 *   Bridge Engine
 *     ├── Auction State        (auction.ts — AuctionStateMachine)
 *     ├── Legal Bid Validator  (validator.ts)
 *     ├── Contract Calculator  (contract.ts)
 *     └── Bidding Evaluation   (strategy.ts → evaluation.ts + conventions.ts)
 *           ├── Conventions    (conventions.ts — Stayman, Jacoby transfers)
 *           ├── Rules          (evaluation.ts — deterministic)
 *           └── Confirmation   (confirmation.ts)
 */

export * from "./types";
export * from "./suits";
export * from "./bid";
export * from "./auction";
export * from "./validator";
export * from "./contract";
export * from "./evaluation";
export * from "./conventions";
export * from "./strategy";
export * from "./confirmation";
