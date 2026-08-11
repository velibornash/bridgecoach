# Sprint 57 — Bridge Engine Centralization & Test Grid: Verification

Status: ✅ VERIFIED

## What shipped this sprint

1. **Suit semantics centralized** — `src/bridge/suits.ts` is the single source of
   truth for suit color/class/hex. `CardEngine`, `BidCard`, `BiddingBox`,
   `CardSelect` now import from it (no local hardcodes). `types.ts` gained the
   shared `Suit`/`Strain` types.

2. **Deterministic strategy layer** — new `src/bridge/conventions.ts` (Stayman,
   Jacoby transfers, opener replies) and `src/bridge/strategy.ts` (dispatcher:
   opening → convention → natural response). `evaluation.ts` gained
   `evaluateResponse`; `confirmation.ts` gained `confirmAuction`.

3. **Engine-first bid validation** — `POST /api/tactical/validate` now re-plays
   the auction through `AuctionStateMachine` + `LegalBidValidator` and returns
   authoritative `legal`/`reason`/`turn`/`currentContract` facts BEFORE any LLM
   call. The AI may only explain; it never decides legality. `aiCoachService`
   surfaces the `legal` flag and the tactical page rejects illegal bids without
   counting them as strategy errors.

4. **Test grid** — full §10 regression matrix + unit + integration + e2e suites
   (see below).

## Verification results

| Gate | Command | Result |
| --- | --- | --- |
| Typecheck | `npm run typecheck` | ✅ 0 errors |
| Lint | `npm run lint` | ✅ 0 errors (pre-existing warnings only) |
| Unit tests | `npm test` (unit+bridge) | ✅ 162 tests, 16 files |
| Integration tests | `npm test` (integration) | ✅ included above |
| e2e smoke | `npm run test:e2e` | ✅ 3/3 (home, tactical, author studio) |
| Coverage | `npm run test:coverage` | ✅ v8 provider, html report |
| Production build | `npm run build` | ✅ no warnings |

## §10 bridge test matrix (`tests/unit/bridge/matrix.test.ts`, 33 cases)

- Openings: 1NT (15–17 balanced), 2NT (20–21), 1S/1H (longest suit), pass (weak).
- Conventions after partner 1NT: Stayman 2C, Jacoby 2D/2H, natural 3NT/2NT.
- Natural raises: simple 2M, limit 3M, game 4M.
- Opener replies: Stayman 2S/2H/2D, transfer accept 2H.
- Boundary cells (must NOT fire): opponent's NT, <8 HCP Stayman, 3-card raise.
- `confirmCall` verdicts: EXPECTED / ACCEPTABLE_ALTERNATIVE / INCORRECT_STRATEGY /
  LEGAL / ILLEGAL.
- `confirmAuction`: complete contract, mismatch → null, passed-out, open auction.
- Legality: level discipline, equal bids, engine-only authority.

## Engine fix surfaced by the matrix

`isBalanced` in `evaluation.ts` did not recognize **4-4-3-3** as a balanced shape
(only 4-3-3-3 / 4-4-3-2 / 5-3-3-2). Added the missing case. This is a behavior
change: a 15–17 HCP 4-4-3-3 hand now correctly recommends 1NT.

## Notes for the plan owner

- `STRATEGY_UNAVAILABLE_MESSAGE` is the documented "no strategy evidence" verdict.
- Conventions are registered in `CONVENTION_RULES`; new conventions MUST add a
  rule module + a matrix row.
- The matrix file is the contract with the roadmap — change expectations only
  through the plan owner.
