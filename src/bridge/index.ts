/**
 * Bridge Engine — public surface.
 *
 * Architecture:
 *   Bridge Engine
 *     ├── Auction State        (auction.ts — AuctionStateMachine)
 *     ├── Legal Bid Validator  (validator.ts)
 *     ├── Contract Calculator  (contract.ts)
 *     └── Bidding Evaluation   (evaluation.ts + confirmation.ts)
 *           ├── Rules          (evaluation.ts — limited, deterministic)
 *           ├── Conventions    (not implemented — explicit limitation)
 *           └── Hand Evaluation (evaluation.ts — HCP, shape)
 */

export * from "./types";
export * from "./suits";
export * from "./bid";
export * from "./auction";
export * from "./validator";
export * from "./contract";
export * from "./evaluation";
export * from "./confirmation";
