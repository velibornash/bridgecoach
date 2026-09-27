# Bridge Remediation Backlog

**Source:** `docs/audit/BRIDGE_DOMAIN_AUDIT.md` · **Created:** 2026-09-26
**Rule:** tasks run in order. Each task ends with the document updated and a commit. A task is not done until its exit criteria are met and its tests pass.

**Why a separate file:** `backlog.md` is the project backlog (322 lines, 39 closed items). This is a distinct remediation programme with its own ordering dependency, and a single "open" list would hide that B1 blocks everything above it. This file is linked from `backlog.md`.

---

## Ordering constraint

```
T1  seat order (A1 + B1)   ← everything below depends on this
 ├── T2  contract scoring (B2)
 │    └── T3  trumps from contract (S8, B3.2)
 │         └── T4  follow suit (B3.1)
 │              └── T5  hand lifecycle (B3.3)
 │                   └── T6  /practice is or is not a sandbox (B3.4, B3.5)
 ├── T7  daily hand (B4)
 ├── T8  AI hint vs judgement (P1)
 └── T9-T11  the rest (S1, S3, S6)
```

T7, T8 and T9+ are independent of T1 and can be taken at any point. They are listed here in the recommended order so the numbering stays stable.

---

## T1 — Single source of seat order, and counter-clockwise

**Audit refs:** A1, B1, S4 · **Status:** TODO

### What

Turn order is currently `N → E → S → W` (clockwise) in three separate files plus a fourth array in the tactical page. Contract bridge is counter-clockwise: `N → W → S → E`.

1. Export one `SEAT_ORDER`, one `nextPosition` and one `seatAt` from `src/bridge/types.ts`.
2. Delete the duplicate `seatOfIndex` from `src/bridge/contract.ts` and `src/bridge/validator.ts`.
3. Delete `positionOrder` from `src/app/tactical/page.tsx` and import the shared one.
4. Set the order to `["N", "W", "S", "E"]`.
5. Fix the two tests that assert the old order.

### Why together and not separately

A partial fix is worse than the current uniform bug. If the engine turns one way and the declarer calculator the other, auctions become subtly invalid instead of obviously broken, and nothing throws.

### Exit criteria

- [ ] `grep -rn '"N", "E", "S", "W"' src/` returns nothing
- [ ] `nextPosition(N) === W`, `nextPosition(W) === S`, `nextPosition(S) === E`, `nextPosition(E) === N`
- [ ] `seatAt(dealer, 0) === dealer` and `seatAt(dealer, 4) === dealer`
- [ ] Declarer still correct for: `1♣ X 2♥`, `1NT P 2C P 2S P 4S P P P`
- [ ] Doubling legality unchanged: partner of the bidder still cannot double
- [ ] `npm run typecheck` 0, `npm run lint` 0 errors, `npm test` green, `npm run build` clean
- [ ] Every pre-existing auction test re-read for *intent*, not just made to pass

### How to test

New unit test asserting the counter-clockwise cycle explicitly. Then re-read all of `tests/unit/bridge/auction.test.ts` — assertions that pass with the old order were written against the bug and their intent must be preserved, not their expectation. Then `npm test`.

---

## T2 — Contract scoring

**Audit refs:** B2 · **Status:** TODO · **Blocked by:** T1

### What

No scoring exists. Add `src/bridge/scoring.ts`, pure, no database access, matching the separation the rest of the engine follows.

```ts
tricksRequired(level, strain, doubling): number
contractOutcome(contract, tricksTaken, vulnerability): { made, score, label }
```

### Required tables

| Level | Tricks required |
|---|---|
| 1 | 7 |
| 2 | 8 |
| 3 | 9 |
| 4 | 10 |
| 5 | 10 major / 11 minor |
| 6 | 12 |

Notrump: 1NT 7, 2NT 8, 3NT 9, 6NT 12 — never 9, 10, 13. This is the row most often got wrong.

Doubles: 1X and 2X +1 trick; 3X–6X +2. Redoubles: 1XX +2; 2XX–6XX +4.
Vulnerable XX: +1 small, +2 otherwise.

### Exit criteria

- [ ] `src/bridge/scoring.ts` imports no Prisma and no `src/lib/db`
- [ ] `tricksRequired` correct for all 35 (level × strain) combinations plus 6NT
- [ ] `tricksRequired(1, 'NT', 'none') === 7` and `=== 7` for every notrump level at its own value
- [ ] `contractOutcome(3NT, 9, 'None')` → made; `(3NT, 8, 'None')` → not made
- [ ] Vulnerable and non-vulnerable outcomes differ and are both tested
- [ ] Every product-reachable combination has a test; none skipped
- [ ] Full gate green

### How to test

Table-driven unit tests, one case per cell. Assert the boundary on both sides of every threshold (exactly required, and one short) — a scoring function that is off by one is a confident wrong answer, which is the failure mode this whole programme exists to remove.

---

## T3 — Trumps derived from the contract

**Audit refs:** S8, B3.2 · **Status:** TODO · **Blocked by:** T2

### What

`trumpSuit` in `/play` is `useState<Suit>('♠')` with no setter, so spades are trumps in every hand including notrump, and every recorded call is written with `strain: "♠"`. A 3NT auction is persisted as 3♠.

1. Derive trumps from the final contract: the named suit, or none in notrump.
2. Record `strain` from the call actually made, not from `trumpSuit`.
3. Represent "no trumps" explicitly rather than defaulting to a suit.

### Exit criteria

- [ ] `useState<Suit>('♠')` no longer appears in `/play`
- [ ] A 3NT contract results in no trump suit
- [ ] A recorded 3NT auction persists `strain: "NT"`
- [ ] `getWinner` with no trumps never lets an off-suit card win
- [ ] Full gate green

### How to test

Unit test on the derivation, and an integration test that plays a spade in a notrump hand and asserts it does not win the trick. That specific test is the whole point — it is the case the current code gets wrong.

---

## T4 — Following suit is enforced

**Audit refs:** B3.1 · **Status:** TODO · **Blocked by:** T3

### What

The human player may play any card from anywhere. Only the AI opponents follow suit. Following suit is mandatory.

Rule: if you hold the lead suit, you may play only that suit; otherwise any card is legal (discarding, including a trump which then wins the trick).

### Exit criteria

- [ ] `playable` is false for a wrong-suit card while the player holds the lead suit
- [ ] Choosing an illegal card is refused with a rule message, not silently ignored
- [ ] Playing a wrong-suit card when void is **allowed**
- [ ] Discarding a trump when void is allowed and it wins the trick
- [ ] The AI opponents' behaviour is unchanged
- [ ] Full gate green

### How to test

Unit test the legality function over: follows suit / must follow but did not / void so any card legal. Integration test that a refused play leaves the trick unchanged.

---

## T5 — Hand lifecycle: declarer, opening lead, 13 tricks

**Audit refs:** B3.3 · **Status:** TODO · **Blocked by:** T4

### What

`/play` hard-codes `dealer: "S"` and plays as South, but with South dealing the declarer is East. There is no opening lead, and no hand completion.

1. Declarer = the player left of the dealer, from the engine — not a hard-coded seat.
2. The opening lead is made by the player left of the declarer.
3. The hand completes at 13 tricks and the result is scored with T2.

### Exit criteria

- [ ] `dealer: "S"` is not hard-coded in `/play`
- [ ] Declarer matches `findDeclarer` output for the auction actually played
- [ ] Opening lead is by the correct seat
- [ ] The hand ends at 13 tricks and reports made / not made from T2
- [ ] A completed hand persists its result and the contract
- [ ] Full gate green

### How to test

Integration test over a scripted auction: assert the declarer, assert who leads, play out the hand, assert the outcome matches `contractOutcome`. The declarer assertion is the one that fails if T1 regressed.

---

## T6 — `/practice` is either bridge, or honestly a sandbox

**Audit refs:** B3.4, B3.5, S5 · **Status:** TODO · **Blocked by:** T5

### What

`/practice` has a bidding box whose calls affect nothing (any single non-pass jumps to play) and a `'result'` phase nothing ever enters. Meanwhile the dashboard calls it "Deal of the day".

**Recommended: Option 2 — make it bridge.** It has `/play` as the reference implementation, so the drilling is reuse, not new work. Option 1 (relabel and drop the bidding box) is an afternoon and is recorded as the fallback.

1. Run a real auction to a contract.
2. Derive trumps (T3), enforce follow-suit (T4), establish declarer and lead (T5).
3. Score the result (T2) and show it.
4. Remove the unreachable `'result'` phase, or make it reachable by finishing a hand.

### Exit criteria

- [ ] The bidding box affects the outcome, or is gone
- [ ] The page can state a contract, a declarer and a result
- [ ] No unreachable `phase` values remain
- [ ] Either the page is bridge, or it says "card play sandbox" in the dashboard card as well
- [ ] Full gate green

### How to test

End-to-end: deal, bid to a contract, play, see a score. If the bidding box can be removed instead, assert `/practice` no longer offers a control that does nothing.

---

## T7 — The daily hand is a real hand

**Audit refs:** B4 · **Status:** TODO

### What

"Deal of the day" is a `<FloatingCards>` decoration. No deck, no date, and "Play this hand" leads to a differently shuffled hand.

1. Deterministic daily hand: `seed = hash(YYYY-MM-DD)`, shuffled with a seeded PRNG.
2. Deal into four hands, and fix the contract so the hand has one correct line.
3. Show the hands and contract in the card; pass the hand id to the play page.
4. If a real hand is out of scope, delete the card.

### Exit criteria

- [ ] The same date yields the same four hands, verified across two separate loads
- [ ] Two consecutive days yield different hands
- [ ] "Play this hand" opens *that* hand
- [ ] Or the card is deleted and nothing links to it
- [ ] Full gate green

### How to test

Unit test determinism: run the generator twice, compare; run for two dates, assert difference. This is the only way to be sure it is not secretly random again.

---

## T8 — The AI is not shown the answer before judging

**Audit refs:** P1 · **Status:** TODO

### What

`/tactical` sends `expectedNextBid` to the AI and then asks it to judge the learner's bid.

1. Split the call. The **hint** may include `expectedNextBid`; the **judgement** must not.
2. Judgement receives hands, auction and turn only.

### Exit criteria

- [ ] The judgement request body contains no expected bid
- [ ] The hint request still does
- [ ] Judging a bid that matches the book line and one that does not both work
- [ ] Full gate green

### How to test

Assert the request bodies. A test that inspects what was sent is the only thing that catches a regression here, because the failure mode is the model agreeing too readily — which looks like success.

---

## T9 — `Hand` cannot silently score zero

**Audit refs:** S1 · **Status:** TODO

### What

`Hand` is `string[]` with no documented encoding. `hcp()` does `card.slice(1)`, so it expects `"SA"`. A caller who passes `"A"` — a reasonable thing to write — silently gets **0** points, with no error.

Make the card a typed `{ suit, rank }`, or validate and reject unknown encoding.

### Exit criteria

- [ ] An unparseable card raises rather than scoring 0
- [ ] `hcp({ spades: ["A"] })` no longer returns 0 silently
- [ ] Valid engine notation still scores correctly
- [ ] Full gate green

### How to test

`expect(() => hcp({ spades: ["A"] })).toThrow()`. Then the existing HCP and balance tests must still pass unchanged — they are the regression net for this one.

---

## T10 — `/tactical` tests judgement, not a memorised string

**Audit refs:** S3 · **Status:** TODO

### What

`expectedAuction` is one hard-coded ten-call sequence and `score` counts matches against it. A learner reproduces a string.

1. Derive acceptable bids from the engine plus hand evaluation.
2. Score on whether the bid is sound, not whether it matches.
3. Keep the book line as a hint only.

### Exit criteria

- [ ] More than one auction can complete a scenario correctly
- [ ] A defensible alternative to the book line is not scored wrong
- [ ] The book line is still reachable and is still offered as a hint
- [ ] Full gate green

### How to test

Unit test the acceptability rule with a known-equivalent alternative. If no alternative can be expressed as acceptable, the rule is still a string comparison and the test should not pass.

---

## T11 — The replayer steps through what it says it does

**Audit refs:** S6 · **Status:** TODO

### What

`HandReplayer` maps `AuctionAction` (bid / pass / double) into steps rendered as "Played ♥K". The component is a card-play replayer fed auction calls. The hardcoded version had the same mismatch, so it was inherited.

1. Decide: does the replayer step through calls or through cards?
2. If cards, source them from `PracticeAction` or a new `PlayedCard` record. If calls, rename it and render calls as calls.

### Exit criteria

- [ ] Every step's label matches the record it came from
- [ ] No "Played" label on a call that is not a card
- [ ] Full gate green

### How to test

Render with a scenario containing a known mix of calls and cards; assert each rendered label corresponds to its source row. The bug is a type confusion, so the test must be about correspondence, not count.

---

## Documented, not changing

**S2 — doubling a partner is refused.** `canDouble` requires the doubler not to be the bidder's partner. Doubling a partner's bid is legal, if rare and usually bad. A defensible teaching simplification. It is currently undocumented as one.

- [ ] Add a comment to `canDouble` stating the simplification and its reason

---

## Progress log

| Task | Status | Commit |
|---|---|---|
| T1 seat order | TODO | |
| T2 scoring | TODO | |
| T3 trumps from contract | TODO | |
| T4 follow suit | TODO | |
| T5 hand lifecycle | TODO | |
| T6 practice is bridge | TODO | |
| T7 daily hand | TODO | |
| T8 AI hint vs judgement | TODO | |
| T9 Hand type safety | TODO | |
| T10 tactical judgement | TODO | |
| T11 replayer | TODO | |
| S2 document | TODO | |
