/**
 * Bridge Engine — public surface.
 *
 * Architecture:
 *   Bridge Engine
 *     ├── Auction State        (auction.ts — AuctionStateMachine)
 *     ├── Legal Bid Validator  (validator.ts)
 *     ├── Contract Calculator  (contract.ts)
 *     ├── Duplicate Scoring    (scoring.ts)
 *     ├── Card Play Rules      (play.ts)
 *     ├── Daily Deal           (daily.ts)
 *     ├── Drill Acceptability  (drill.ts)
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
export * from "./scoring";
export * from "./play";
export * from "./daily";
export * from "./drill";
export * from "./evaluation";
export * from "./conventions";
export * from "./strategy";
export * from "./confirmation";
