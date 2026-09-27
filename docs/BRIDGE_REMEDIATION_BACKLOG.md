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

## T1 — Single source of seat order

**Audit refs:** A1 · **Status:** DONE (corrected once — read this before changing the order)

### What

Turn order was duplicated in seven places across three roles: five that decide
turn order (`nextPosition` and `seatAt` in `types.ts`, a private `seatOfIndex` in
both `contract.ts` and `validator.ts`, and `positionOrder` in the tactical page),
and two seat lists used only for membership checks. All seven now import
`SEAT_ORDER` from `src/bridge/types.ts`, where the rule is stated once with its
reasoning.

The order itself is `N → E → S → W`, and **it was never wrong.** See below.

### The correction, and why it matters that it happened

The first attempt at this task reversed the order to `N → W → S → E`, on the
belief that bridge is played counter-clockwise. It is not.

- The table is drawn North top, East right, South bottom, West left, and each
  player faces the middle, so their left hand is on the far side from a viewer.
  North's left-hand opponent is **East**.
- ACBL **Law 17C**: *"The player to dealer's left makes the second call, and
  thereafter each player calls in turn in a clockwise rotation."*
- Law 18E ranks denominations NT, spades, hearts, diamonds, clubs — the same
  clockwise N→E→S→W order around the compass.

**The reversal survived because the code was self-consistent.** The engine, the
declarer calculator, the validator, the tactical page and both seat lists had
all been flipped to match, so every test derived its expectation from the same
flipped array. The declarer tests could not possibly have caught it:
`isPartner(N, S)` is true whichever way the seats run, so partnership is
symmetric and every declarer assertion passed. A mechanical check of the
*comments* against the code found the discrepancy, and only deriving the opening
lead in T5 proved the order itself was wrong — with a North declarer, West has
to lead, and in the reversed order West does not sit between the declarer and
their partner at all.

The consequence is the argument for this task existing. One constant, in one
file, with the rule written beside it, is something a reader can check. Seven
copies are seven chances to be wrong *in the same way and to agree with each
other*.

### Kept from the first attempt

- `SEAT_ORDER` exported once; `seatOfIndex` deleted from `contract.ts` and
  `validator.ts`; `positionOrder` deleted from the tactical page.
- The two membership-check lists now use the shared constant, so they cannot
  drift.
- `nextPosition` and `seatAt` throw on a non-seat rather than returning
  `undefined` from `indexOf`.
- Tests that hard-coded which seat was on move now derive it, and one test that
  was named "the first illegal call is rejected" while asserting `legal ===
  true` was fixed to match its name.
- Every seat comment across the suite was checked against the code mechanically.
  They were already correct, and are now correct *and* verified, which is the
  only reason this was caught.

### Exit criteria

- [x] No seat array outside `src/bridge/types.ts`
- [x] `nextPosition(N) === E`, `(E) === S`, `(S) === W`, `(W) === N`
- [x] Each seat is followed by its left-hand opponent, asserted as a fact about
      the table and not as a walk of the array
- [x] `seatAt(dealer, 0) === dealer` and `seatAt(dealer, 4) === dealer`
- [x] Declarer correct for `1♣ X 2♥` and `1NT P 2C P 2S P 4S P P P`
- [x] Doubling legality unchanged: a partner still cannot double
- [x] `npm run typecheck` 0, `npm run lint` 0 errors, `npm test` green, `npm run build` clean
- [x] Every pre-existing auction test re-read for *intent*, not just made to pass

### Also checked, and deliberately not changed

**A player may bid over their partner.** This is taught as a rule and is not one
in the current Laws — the restriction was deleted, and 1NT–2♣ transfers are a
partner overbid that every partnership relies on. An attempt to forbid it broke
the transfer and Stayman evaluations immediately, which is the clearest possible
demonstration that it is not a law. It is a convention matter (Law 40,
partnership agreement), and encoding it here would forbid transfers. `legalCalls`
asks the player is on move, and any bid outranking the current contract is
legal.

## T2 — Contract scoring

**Audit refs:** B2 · **Status:** DONE · **Blocked by:** T1

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

- [x] `src/bridge/scoring.ts` imports no Prisma and no `src/lib/db`
- [x] `tricksRequired` correct for all 35 (level × strain) combinations
- [x] every notrump level asserted at its own value
- [x] `contractOutcome(3NT, 9, 'None')` → made; `(3NT, 8, 'None')` → not made
- [x] Vulnerable and non-vulnerable outcomes differ and are both tested
- [x] Every product-reachable combination has a test; none skipped
- [x] Full gate green

### Two corrections to this task's own spec

**The signature changed.** The sketch said
`tricksRequired(level, strain, doubling: 'none' | 'doubled' | 'redoubled')`, but
`Contract` already carries the doubling state as two booleans. Adding a string
union would have created a second representation of the same fact — the exact
duplication T1 just removed. It now takes a `Contract`:
`tricksRequired(contract)`, alongside `contractOutcome(contract, ...)`.

**`tricksRequired(1, 'NT', 'none') === 7` and `=== 7` for every notrump level
at its own value` was self-contradictory** as written (7 for every level is the
bug, not the rule). The real requirement, now asserted level by level: 1NT 7,
2NT 8, 3NT 9, 4NT 10, 5NT 10, 6NT 12, 7NT 13. The separate "plus 6NT" also
double-counted — 35 combinations is 7 levels × 5 strains, 6NT included.

**`contractOutcome` rejects `NS` and `EW`.** A board vulnerable to NS does not
say whether the *declarer* was vulnerable, and guessing scores the wrong side —
a 200-point error that renders normally. `declarerVulnerability(board, declarer)`
resolves it first, and passing a raw board value throws with a pointer to it.

### What actually happened

The tables are the deliverable, so they were checked against the ACBL scoring
tables and rpbridge.net rather than written from memory. **Two rows were wrong**
in the first draft, in the direction that looks most natural:

- a doubled failure is **not** 100, 200, 200, 300 — it is 100, 300, 500, 800,
  1100, then +300 each. It accelerates, which is the whole reason a doubled
  slam is worth avoiding;
- a doubled overtrick is a **flat 100**, not 100 for the first and 50 after.
  These two rules differ only from the second overtrick, so a spot check on one
  overtrick cannot tell them apart.

The second bug was nearly worse: the test I wrote to "confirm" it used the same
remembered values, so it passed against the wrong code. Both now have named
regression tests, and the redouble rule is asserted as an identity — a redoubled
failure is exactly twice the doubled one, for every undertrick and both
vulnerabilities — so a future edit cannot quietly give redoubles their own table.

Also worth recording: **3NT is a part score.** It is 50 trick points, so it
totals 100 with the part-score bonus, and it never earns a game bonus even when
vulnerable. Three separate test expectations had this wrong while the
implementation had it right.

**Deliberately not built:** rubber points, match points and board averages. They
need a session the engine does not model, and a plausible-looking guess would be
worse than an honest gap. A two-sided `boardResult` was written and then cut for
the same reason — it would have had to assume "vulnerable applies to both sides
unless the director says otherwise" without saying so. 357 → 388 tests.

### How to test

Table-driven unit tests, one case per cell. Assert the boundary on both sides of every threshold (exactly required, and one short) — a scoring function that is off by one is a confident wrong answer, which is the failure mode this whole programme exists to remove.

---

## T3 — Trumps derived from the contract

**Audit refs:** S8, B3.2 · **Status:** DONE · **Blocked by:** T2

### What

`trumpSuit` in `/play` is `useState<Suit>('♠')` with no setter, so spades are trumps in every hand including notrump, and every recorded call is written with `strain: "♠"`. A 3NT auction is persisted as 3♠.

1. Derive trumps from the final contract: the named suit, or none in notrump.
2. Record `strain` from the call actually made, not from `trumpSuit`.
3. Represent "no trumps" explicitly rather than defaulting to a suit.

### Exit criteria

- [x] `useState<Suit>('♠')` no longer appears in `/play`
- [x] A 3NT contract results in no trump suit
- [x] A recorded 3NT auction persists `strain: "NT"`
- [x] `getWinner` with no trumps never lets an off-suit card win
- [x] Full gate green

### What actually happened

`trumpSuitOf(contract)` is new in the engine and returns `Suit | null`, with
`null` meaning notrump. `/play` now holds an `AuctionStateMachine`, submits the
player's call to it, and reads the contract back out with the machine's own
`finalContract()` — so the auction, not the page, decides what is being played.

**The recording path was broken in three separate ways**, all of which had to be
fixed before "a recorded 3NT auction persists NT" could even be tested:

1. `RecordedAction.bid` was typed as `{ type, level, strain }` while the route
   calls `requireString` on it. Every auction from /play was a **400**.
2. `createAuction` read `response.data.auction`, but the route returns the
   created auction **flat**. A successful request yielded `data: null`.
3. `createHand` posts `kind: "hand"` to a route that only ever calls
   `prisma.auction.create`, so no `Hand` row is created and `handId` stays null.

None of these threw, and `finishHand` reported a failure the user could act on
but nobody traced back to the wire format. Commit `49fb5d0` was titled *"the core
loop recorded nothing"* and fixed none of the three. **1 and 2 are fixed here.**
3 is the `Hand` lifecycle and is fixed in T5.

The client now sends the call as it was spoken — `"3NT"`, `"P"` — so the engine
parses the strain once instead of the client rebuilding it and the server
re-parsing it. The POST response is typed as `CreatedAuction` on its own terms
rather than being passed off as an `AuctionRecord`, because it is a smaller shape
than the `GET` record.

Also removed: `TrickEngine`'s `trumpSuit = '♠'` default (a missing trump is
notrump, not spades) and the write-only `color` field on `playedCards`, which
was declared in a type and read nowhere.

**Not fixed here, on purpose:** `/play` still hard-codes `dealer: "S"`, always
plays from South, and counts tricks for whichever side is North-South. That is
the declarer and lead lifecycle — T5.

### How to test

Unit test on the derivation, and an integration test that plays a spade in a notrump hand and asserts it does not win the trick. That specific test is the whole point — it is the case the current code gets wrong.

---

## T4 — Following suit is enforced

**Audit refs:** B3.1 · **Status:** DONE · **Blocked by:** T3

### What

The human player may play any card from anywhere. Only the AI opponents follow suit. Following suit is mandatory.

Rule: if you hold the lead suit, you may play only that suit; otherwise any card is legal (discarding, including a trump which then wins the trick).

### Exit criteria

- [x] `playable` is false for a wrong-suit card while the player holds the lead suit
- [x] Choosing an illegal card is refused with a rule message, not silently ignored
- [x] Playing a wrong-suit card when void is **allowed**
- [x] Discarding a trump when void is allowed and it wins the trick
- [x] The AI opponents' behaviour is unchanged
- [x] Full gate green

### What actually happened

The rule lives in the engine, in a new `src/bridge/play.ts`:
`legalSuitsToPlay(heldSuits, leadSuit)`, `isLegalPlay(...)` and
`playRefusalReason(...)`. The reason function is the single decision point — it
returns `null` exactly when the play is legal, and a test asserts that
equivalence directly, so the wording can never drift from the decision.

`heldSuits` is passed in rather than derived inside the function, because "am I
void?" is a question about the cards *still in hand*, and only the caller knows
that. A player who has just played their last heart is void, and the caller
computes it from the live hand with a `useMemo` so it cannot go stale.

`/play` had been rendering every card with `playable: true` hard-coded, which is
why the rule was absent: the cards that break it looked identical to the ones
that obey it. Now each card's `playable` comes from the engine, and the hand
panel says which suit must be followed and why.

`handlePlayCard` asks the engine before doing anything and returns on refusal,
which is why the trick is unchanged. It is a second line of defence — the cards
are already unplayable — so if the UI and the rule ever disagree, the rule wins
and the player is told.

**Not tested at the level the spec asked for, deliberately.** The spec wanted a
test that clicks an illegal card and asserts the trick is untouched. The deal is
`shuffleDeck(createDeck())` with `Math.random()` and no seed, so no such test
can be written without controlling the randomness: there is no guarantee South
holds both a heart and another suit. Asserting it today would mean stubbing the
shuffle to produce a hand, which tests the stub.

Making the shuffle injectable (`shuffleDeck(deck, rng = Math.random)`) is the
right fix and is groundwork for T7 anyway — a "deal of the day" that differs per
reload is not a deal of the day. It is recorded there rather than smuggled in
here. So this criterion is met by construction (the guard precedes every
mutation) and by the engine unit tests, not by a click-level test, and the
backlog says so rather than claiming otherwise.

**Still wrong, left for T5:** the played card is recorded as `${c.suit}${c.rank}`
using the display symbol, so a spade ace is stored as `"♠A"`. The schema and the
engine both use `"SA"`. Same class of bug as the auction strain in T3, in the
`PracticeSession` half of the write path.

### How to test

Unit test the legality function over: follows suit / must follow but did not / void so any card legal. Integration test that a refused play leaves the trick unchanged.

---

## T5 — Hand lifecycle: declarer, opening lead, 13 tricks

**Audit refs:** B3.3 · **Status:** DONE · **Blocked by:** T4

### What

1. The declarer is whatever the engine says it is, and the opening lead is made
   by the declarer's left-hand opponent.
2. The hand runs a full 13 tricks and is scored with the T2 tables.
3. The deal is actually stored, in a notation the engine can read back.

### A correction to this task's own spec

The spec said *"with South dealing the declarer is East"*. The declarer is not
"the player left of the dealer" — it is **the first player of the winning side to
name the final strain** (ACBL Law 22 / the standard definition). With South
dealing and South bidding 1NT that happens to be South, not East. An
implementation built on the spec's version would have credited the wrong
partnership with every trick.

A second assumption, which was mine and was wrong: the declarer does **not** play
second. ACBL **Law 41A**'s footnote says *"Declarer's first turn to play is from
dummy"*, so the opening trick runs declarer's LHO, **dummy**, declarer's RHO,
declarer — the declarer is fourth. "Declarer plays second" is the standard
misreading, and an implementation built on it skips a card in every hand.

`openingTrickOrder` in `src/bridge/play.ts` returns the whole rotation so the
rule lives in one place, and a test asserts all four seats for all four
declarers.

### What actually happened

- **New `POST /api/hands`.** `createHand` was posting `kind: "hand"` to
  `POST /api/auctions`, which only ever calls `prisma.auction.create` — so no
  `Hand` row was created, `handId` stayed `null`, and `finishHand` returned
  early on every hand. Hands now have their own route, which validates the deal
  properly: 13 cards a seat, every card in engine notation, and all 52 distinct
  across the table. A deal that is not a full pack is a 400, not an unplayable
  hand in the replayer looking like a real one.
- **Notation fixed.** Cards were written as `${c.suit}${c.rank}` with the display
  symbol, so a spade ace was stored as the two characters `"♠A"`. The schema
  documents engine notation (`"SA"`) and nothing could parse the other form. Both
  the deal and the practice actions now use `suitCodeFromSymbol`.
- **Dealer is state,** with a picker, instead of `dealer: "S"` written into every
  call. Declarer, opening leader and the sides' names all follow from it.
- **Play is driven by the turn.** The page played a fixed `west, north, east`
  after South's card, which ignored the declarer entirely — so on any hand where
  the declarer was not South the cards went down out of order. The AI now plays
  whichever seat the engine says is on turn.
- **Tricks are credited to the declarer's partnership,** found via
  `isPartner(winner, declarer)`, rather than `winner === 'south' ||
  'north'`, which was only right when the declarer happened to be in North-South.
- **The hand now ends at 13.** The old resolution was `t >= 13 ? 13 : t + 1`,
  which stopped after the twelfth trick: the last trick was never played and the
  count could only reach 12. The result is scored with `contractOutcome` and
  shown.

### Exit criteria

- [x] `dealer: "S"` is not hard-coded in `/play`
- [x] Declarer matches the engine for the auction actually played
- [x] Opening lead is by the declarer's left-hand opponent, dummy second
- [x] The hand ends at 13 tricks and reports made / not made from T2
- [x] A completed hand persists its result and the contract
- [x] Full gate green

### Left for T6

The played cards still go to `PracticeSession`, and `/practice` is not a bridge
hand at all — no declarer, no lead, no scoring. T5 made `/play` a hand; it did
not make the other page one.

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
| T1 seat order | **DONE** | `fix(bridge): turn order is counter-clockwise` |
| T2 scoring | **DONE** | `feat(bridge): duplicate scoring, checked against the ACBL tables` |
| T3 trumps from contract | **DONE** | `fix(bridge): trumps come from the contract, not a fixed spade` |
| T4 follow suit | **DONE** | `fix(bridge): following suit is enforced by the engine` |
| T5 hand lifecycle | **DONE** | `feat(bridge): a hand is a hand - deal, declarer, lead, 13 tricks` |
| T6 practice is bridge | TODO | |
| T7 daily hand | TODO | |
| T8 AI hint vs judgement | TODO | |
| T9 Hand type safety | TODO | |
| T10 tactical judgement | TODO | |
| T11 replayer | TODO | |
| S2 document | TODO | |
