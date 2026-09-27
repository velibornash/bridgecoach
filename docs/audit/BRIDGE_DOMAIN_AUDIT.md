# Bridge Coach — Bridge Domain Audit

**Date:** 2026-09-26 · **Scope:** `src/bridge/**`, `src/components/{trickEngine,cardEngine,play,practice,handViewer,tactical}/**`, seeded teaching content · **Method:** source reading against standard contract bridge rules, plus executable probes for anything that could be settled by running it

This audit is written from two positions at once: a senior engineer reading for correctness and architecture, and a bridge player reading for whether the game being taught is actually the game being simulated. Several findings are invisible from one position and obvious from the other.

---

## 1. Executive summary

The **teaching content is correct.** The quiz answers, the point ranges, the balanced-hand patterns, the Stayman logic, HCP, the doubling legality, and the declarer rule are all right. A learner will not be taught a falsehood from the lesson material.

The **mechanics underneath it are not.** Four findings are serious enough that I would not ship this to a paying bridge student without fixing them first:

| # | Finding | Severity |
|---|---|---|
| **B1** | **Turn order is clockwise. Bridge is counter-clockwise.** Locked in by the test suite. | **Critical** |
| **B2** | **There is no contract scoring at all.** No "did you make it", no vulnerability, no doubling bonuses. | **Critical** |
| **B3** | **`/practice` does not follow suit**, and its trump suit is permanently spades. | **Critical** |
| **B4** | **"Deal of the day" is a decorative card fan**, and "Play this hand" deals a different random hand. | **High** |

Plus one architectural fault that made B1 possible and will make it expensive to fix:

| # | Finding | Severity |
|---|---|---|
| **A1** | Seat-order logic is **duplicated in three files**. Fixing B1 correctly means three coordinated edits, or the codebase splits into two truths. | **High** |

And one integrity problem that undermines a feature the product advertises:

| # | Finding | Severity |
|---|---|---|
| **P1** | The "independent AI judgement" in `/tactical` is **sent the answer key** before being asked to judge. | **High** |

---

## 2. What is correct — and should not be disturbed

Stating this first because an audit that only lists faults gives a false picture of risk, and because these are the parts most likely to be broken by a well-meaning fix.

| Area | Verdict |
|---|---|
| `hcp()` | Correct. A=4 K=3 Q=2 J=1. Verified 10 for AKQJ, 37 for a 13-card maximum. |
| `shape()` / `isBalanced()` | **Correct.** `shape()` sorts descending before the pattern test, so balance is suit-order independent. 4-3-3-3, 4-4-3-3, 4-4-3-2 and 5-3-3-2 all pass with the long suit in any position; 5-4-2-2, 6-3-2-2, 4-4-4-1 and 3-2-3-2 are correctly rejected. This is a place where "suspicious-looking code" turned out to be right, and I verified it rather than reporting it. |
| `isPartner()` | Correct: N–S and E–W. |
| Doubling legality (`canDouble`) | Correct. Requires a standing contract, not already doubled, doubler not the bidder's partner. |
| Redouble legality (`canRedouble`) | Correct. Scans back past passes for the most recent non-pass, requires it to be an opponent's double, refuses a second redouble. |
| Auction termination | Correct. Three passes after a standing bid end the auction; four passes with no bid is passed out. |
| Declarer (`findDeclarer`) | **Correct.** Finds the *first* player of the winning side to name the final strain — not the last bidder, which is the classic bridge bug. |
| `getWinner()` (trick resolution) | Correct. Trumps beat the lead suit, a higher trump beats a lower trump, the lead suit is compared only against the lead suit, and an off-suit card cannot win. |
| Rank ordering | Correct: A high to 2 low, compared by index. |
| UI table layout | Correct. North top, West left, South bottom, East right — the standard diagram. |
| Seeded quiz content | Correct throughout. 1NT = 15–17; 4-3-3-3 balanced, 5-4-2-2 and 6-3-2-2 not; 4-4-3-2 and 5-3-3-2 balanced; 14 HCP balanced opens 1 of a suit; 2♣ after 1NT is Stayman. |
| Bidding evaluation | The 1NT recommendation correctly requires 15–17 HCP *and* a balanced hand. |

**Conclusion:** the bridge *knowledge* encoded in this codebase is sound. The failures are in simulation, persistence of play, and product design — not in the bridge.

---

## 3. B1 — Turn order is clockwise. Bridge is counter-clockwise.

### The finding

`src/bridge/types.ts:95`

```ts
export function nextPosition(position: Position): Position {
  const order: Position[] = ["N", "E", "S", "W"];   // ← clockwise
  const idx = order.indexOf(position);
  return order[(idx + 1) % 4];
}
```

The UI draws the standard diagram — North top, West left, South bottom, East right (`BridgeTable.tsx:204–250`). On that layout, `N → E → S → W` walks **top → right → bottom → left**, which is clockwise.

Contract bridge is played **counter-clockwise**: with North at the top, the order is `N → W → S → E`. The player to the dealer's left acts next, and the dealer at North has West on their left, so North is followed by West, not East.

The same order is hard-coded a second and third time:

- `src/bridge/contract.ts:50` — `seatOfIndex`
- `src/bridge/validator.ts:145` — `seatOfIndex`

### Why it survived

Because the test suite asserts the same wrong rule:

```ts
// tests/unit/bridge/auction.test.ts:10
const auction = new AuctionStateMachine({ dealer: Position.SOUTH });
auction.submit("P");
expect(auction.currentBidder).toBe(Position.WEST);
```

and

```ts
// tests/unit/bridge/suits.test.ts:49
expect(nextPosition(Position.NORTH)).toBe(Position.EAST);
```

A suite that encodes the error will confirm the error indefinitely. 353 tests passing tells you nothing about this rule.

### Actual impact

Lower than "the game is unplayable", higher than "cosmetic", and I want to be precise about which is which:

- **The auction still resolves.** Because the order is internally consistent across the engine, declarer, validator and UI, a completed auction still produces a well-formed contract. Nothing crashes.
- **Seats are misattributed.** Every recorded call is credited to the wrong physical seat relative to a real deal. `seatAt()` exists to map history index → seat and inherits the error, so a saved auction cannot be reconciled with a real hand.
- **A learner is told the wrong player acts next.** For a teaching product, teaching the wrong turn order is the most serious consequence — it is the first thing a player internalises and it makes every other concept stick incorrectly.
- **Hand replay is unreconcilable.** `/replay` reconstructs from recorded actions; with the reversed order the sequence of plays does not correspond to any legal deal.

### Fix

Change the order array in all three files to `["N", "W", "S", "E"]` — or, better, fix A1 first and change it once. Then update the two tests, which will fail loudly and correctly.

### Regression test that would have caught it

```ts
it("plays counter-clockwise, as bridge does", () => {
  // North is at the top of the table and West is on their left.
  expect(nextPosition(Position.NORTH)).toBe(Position.WEST);
  expect(nextPosition(Position.WEST)).toBe(Position.SOUTH);
  expect(nextPosition(Position.SOUTH)).toBe(Position.EAST);
  expect(nextPosition(Position.EAST)).toBe(Position.NORTH);
});
```

The existing test asserted the opposite. That is the finding.

---

## 4. B2 — There is no contract scoring at all

### The finding

Searching the whole codebase for contract-made logic, tricks-required, vulnerability bonuses or rubber scores returns **nothing**. `FinalContract` carries `{ contract, declarer, passedOut }` and stops there.

Absent entirely:

- Trick requirements per contract (1♠ = 7, 4♠ = 10, 3NT = 9, 1NT = 7)
- Doubling and redoubling adjustments (1X and 2X = +1, 3X–6X = +2)
- Vulnerability bonuses and penalties
- Whether the contract was **made**, which is the single most important output of a hand of bridge
- Downgrades and slough, in either direction

### Impact

This is the gap that makes B3 and the `/practice` problem unfixable in isolation. A bridge drill that cannot say whether you made your contract cannot teach anything about *playing* — only about *moving cards*. There is no feedback loop, so there is no learning loop.

It also means `PracticeSession.score` and `maxScore` have no defined meaning, which is why the page has to declare "No scoring".

### Fix

Add `src/bridge/scoring.ts`, pure and table-driven, the same shape as the other engine modules:

```ts
export type Vulnerability = 'None' | 'NS' | 'EW' | 'All';
export type Doubling = 'none' | 'doubled' | 'redoubled';

export function tricksRequired(level: number, strain: Strain, doubling: Doubling): number
export function contractOutcome(
  contract: Contract,
  tricksTaken: number,
  vulnerability: Vulnerability,
): { made: boolean; score: number; label: string }
```

Tables that must be right:

| Level | Base tricks required |
|---|---|
| 1 | 7 |
| 2 | 8 |
| 3 | 9 |
| 4 | 10 |
| 5 | 11 (major: 10, minor: 11) |
| 6 | 12 (no-trump: 12) |

Notrump is the one that is usually got wrong and must be explicit: **1NT/2NT/3NT always require 7 / 8 / 9**, regardless of vulnerability, and 6NT requires 12.

Doubles: `1X, 2X = +1`; `3X, 4X, 5X, 6X = +2`. Redoubles: `1XX = +2`, `2XX–6XX = +4`. Vulnerable `XX = +1` small, `+2` game-and-above.

`tricksRequired` and `contractOutcome` should be pure functions with table-driven tests, because every number here is a place a bug becomes a confident wrong answer.

---

## 5. B3 — `/practice` is not bridge practice

This is the finding behind the report that the page "makes no sense as bridge practice". It is the correct observation, and the reasons are concrete.

### B3.1 Following suit is never enforced

`src/app/play/page.tsx` and `src/app/practice/page.tsx` let the human player play **any card from anywhere**. There is no follow-suit validation anywhere in the codebase — the only follow-suit logic in the project is the *opponents'* `autoPlayOpponent` in `/play`, which does it correctly for the AI:

```ts
const follow = hand.filter((c) => c.suit === leadSuit);
card = (follow.length > 0 ? follow : hand)[0];
```

So the computer follows suit and the player does not have to. Following suit is mandatory; breaking it is a fundamental rule, not a style preference. An app that lets a learner break it without comment teaches it by omission.

Discarding when void is legal, so the correct rule is: if you hold the lead suit, you may play only that suit; otherwise anything.

### B3.2 The trump suit is permanently spades

```ts
const [trumpSuit] = useState<Suit>('♠');   // no setter — it can never change
```

Spades are trumps in every hand, forever. Consequences:

- A notrump contract is still played with spades as trumps, so a spade ruffs a no-trump contract. The single most fundamental distinction in bridge play is not modelled.
- Every call recorded by my Sprint 20 change writes `strain: "♠"` regardless of what was bid, so a 3NT auction is persisted as 3♠.

Trump must be derived from the final contract: the named suit, or none at all in notrump.

### B3.3 Dealer, declarer and turn order are hard-coded

`/play` hard-codes `dealer: "S"` and plays as South. The declarer is the player left of the dealer, so with South dealing, South opens and **East** is the declarer. The page plays South as though South were declarer, and does not establish who leads.

A hand has not started until the auction is complete, the declarer is known, and the opening lead is made by the player left of the declarer. None of that exists.

### B3.4 The bidding box is decorative

`/play` shows a `BiddingBox` and calls `handleBid`, but the recorded call does not affect anything. Opponents "simulate passing" on a timer:

```ts
if (bid.label !== 'Pass') {
  setTimeout(() => { setPhase('trick'); setTab('trick'); }, 900);
}
```

Any single non-pass bid jumps straight to play. There is no auction to speak, no contract derived, no defenders, no scoring — and it is all recorded as if it were a real auction.

### B3.5 The page is honest about this, which is the problem

The page says *"No scoring, just explore bridge at your pace"* and *"Free Play"*. That honesty is correct and I want to credit it. But it sits behind a dashboard card labelled **"Deal of the day"** with a **"Play this hand"** button, next to `/play` which pretends to be a hand. The user is promised a hand of bridge and gets a trick-play sandbox with a bidding box that does nothing.

### Fix

Choose one of two honest products and build it properly. My recommendation is the second.

**Option 1 — relabel it.** Rename the dashboard card to "Card play sandbox", remove the bidding box from `/practice`, and accept that it is a trick-taking toy. Costs an afternoon.

**Option 2 — make it bridge.** A real single-hand drill is not large:

1. Deal four hands, store them (already done in Sprint 20).
2. Run a real auction to a contract — the engine already does this correctly, including legality and declarer (modulo B1).
3. Derive trumps from the contract; none in notrump.
4. Enforce follow-suit for the human player and return a rule error otherwise.
5. Play 13 tricks with correct lead order.
6. Count tricks and call `contractOutcome()` from B2.
7. Record the result, and only then award XP.

Steps 2–7 are maybe two to three days of work on top of B1 and B2. The engine to support it already exists and is, in the parts that matter, correct.

---

## 6. B4 — "Deal of the day" is a decoration, and the button lies

`src/app/dashboard/page.tsx:190–215`

```tsx
<span>Deal of the day</span>
<FloatingCards className="scale-[0.62] ..." cardHeight="h-28" ... />
<Button onClick={() => router.push("/practice")}>Play this hand</Button>
```

`FloatingCards` is an animated fan of cards with no deck behind it. It is:

- **Not a deal.** No cards are generated, seeded or stored.
- **The same every day.** There is no date component, so "of the day" is decoration too.
- **Not the hand you get.** "Play this hand" navigates to `/practice`, which shuffles a fresh random deck.

This is the same failure class as the invented "50K Active Learners" and the phantom $9 tier, in the most prominent position on the dashboard: a specific promise attached to a decorative graphic and a random outcome.

### Fix

Either make it real or remove it. To make it real:

- Derive a **deterministic daily hand** from the date: `seed = hash(YYYY-MM-DD)`, shuffle with a seeded PRNG. Every user sees the same hand on the same day, which is what makes it worth discussing.
- Deal it into four hands, and — if the auction is scripted — a known contract, so the hand has a single correct line of play.
- Show the four hands and the contract in the card, and have "Play this hand" pass the hand id to `/practice`.
- If a real hand is out of scope now, delete the card. A dashboard is not the place for a placeholder that looks like a feature.

---

## 7. P1 — The "independent AI judgement" is given the answer key

`src/app/tactical/page.tsx:77–93`

When the learner's bid diverges from the expert line, the page asks the AI coach to judge it. The request body includes:

```ts
getBidHint({
  hands: ...,
  auction: bids,
  turn: currentBidder,
  expectedNextBid: scenario.expectedAuction[bids.length],   // ← the answer
});
```

The model is told the correct call and then asked whether the learner's call was good. That is not an independent judgement; it is a rubric-anchored one. At best the AI agrees, because it has been handed the target. At worst it rationalises toward whatever the key says, including defending a bid that is genuinely fine.

The consequence is a pedagogical one: this fallback is the *only* place a learner is told "your bid was reasonable, the book line is only a guide", and it is the place least able to say it.

### Fix

Split the two calls. The **hint** request may include `expectedNextBid`; the **judgement** request must not. Give judgement the hands, the auction and the turn, and let it reason from the cards.

---

## 8. A1 — Seat-order logic is duplicated in three files

| File | Symbol |
|---|---|
| `src/bridge/types.ts:95` | `nextPosition` |
| `src/bridge/contract.ts:49` | `seatOfIndex` |
| `src/bridge/validator.ts:144` | `seatOfIndex` |

Three independent implementations of the same rule, two of them in different modules. This is why B1 is a three-file fix rather than a one-line fix, and why a partial fix would leave the codebase in a worse state than uniformly wrong: declarer and doubling legality would disagree with turn order, and that produces auctions that are subtly invalid rather than obviously broken.

It is also the only place in `src/bridge` that the separation-of-concerns documented in the header of `auction.ts` is violated.

### Fix

One export, in `types.ts`:

```ts
export const SEAT_ORDER: readonly Position[] = ["N", "W", "S", "E"]; // counter-clockwise
export function nextPosition(position: Position): Position { ... }
export function seatAt(dealer: Position, index: number): Position { ... }
```

`contract.ts` and `validator.ts` import `seatAt` and delete their copies. Three edits become one, and the rule is stated once.

---

## 9. Secondary findings

| # | Finding | Where | Severity |
|---|---|---|---|
| S1 | **`Hand` is `string[]` with an undocumented encoding.** `hcp()` does `card.slice(1)`, so it expects engine notation `"SA"`. A caller who passes `"A"` — a perfectly reasonable thing to write — silently scores **0**, with no error. The `Hand` interface says nothing about the format. | `types.ts:118`, `evaluation.ts:23` | Medium |
| S2 | **Doubling your partner is refused.** `canDouble` requires the doubler not to be the bidder's partner. Doubling a partner's bid is legal in bridge, if rare and usually bad. Defensible as a teaching simplification; **undocumented as one**. | `validator.ts:110` | Low |
| S3 | **`/tactical` expects one hard-coded auction string.** `expectedAuction` is a fixed ten-call sequence, and the learner supplies every seat's call. That is a memorisation exercise, not judgement. The `score` counts matches against a string. | `tactical/page.tsx:27` | Medium |
| S4 | **`/tactical` has a fourth, competing order array** (`positionOrder`), so B1 is present in a *fourth* place. | `tactical/page.tsx:39` | High (as part of A1) |
| S5 | **`/practice` has a `result` phase that is never reached.** `phase` includes `'result'` and nothing ever sets it. | `practice/page.tsx:17` | Low |
| S6 | **`HandReplayer` is a card-play replayer fed auction calls.** It maps `AuctionAction` (bid/pass/double) to steps labelled "Played ♥K". The old hardcoded version had the same mismatch, so the component inherited it. | `HandReplayer.tsx` | Medium |
| S7 | **`floatingCards` and the `/practice` deck are unrelated**, so "Deal of the day" and "Start Practice" can never show the same hand. | dashboard / practice | Covered by B4 |
| S8 | **`/play` records `strain: trumpSuit` on every call**, which is always ♠. A 3NT auction is persisted as 3♠. Introduced by my Sprint 20 recording change; flagged here rather than hidden. | `play/page.tsx:91` | High |

---

## 10. Recommended order of work

### Phase 1 — stop teaching the wrong game (B1, A1, S4)

1. Export `SEAT_ORDER`, `nextPosition`, `seatAt` from `types.ts`; delete the two duplicate `seatOfIndex` copies and the `positionOrder` in `/tactical`.
2. Set the order to `["N", "W", "S", "E"]`.
3. Fix the two tests that assert the old order, and add the counter-clockwise regression test from §3.

Do A1 and B1 together. Doing B1 alone invites the silent partial fix described in §8.

**Gate:** every existing auction test must be re-read after the change, because some were written to pass with the wrong order and their *intent* — not their assertion — has to be preserved.

### Phase 2 — make hands mean something (B2)

4. Add `src/bridge/scoring.ts` with `tricksRequired` and `contractOutcome`, plus table-driven tests.
5. Fix S8: derive strain from the contract rather than the hard-coded `trumpSuit`.

**Gate:** table-driven tests for every (level, strain, doubling, vulnerability) combination that appears in the product, including the notrump cases that are conventionally wrong.

### Phase 3 — fix the sandbox (B3)

6. Enforce follow-suit for the human player, with a rule message.
7. Derive trumps from the contract; none in notrump.
8. Establish declarer and opening lead.
9. Either remove the decorative bidding box from `/practice`, or wire it to the real engine and complete the auction.

**Gate:** a test that plays a trick illegally and expects a rejection, and a notrump contract in which a spade does not ruff.

### Phase 4 — fix the promises (B4, P1)

10. Make the daily hand deterministic and real, or delete the card.
11. Split the hint call from the judgement call; remove `expectedNextBid` from judgement.

### Phase 5 — the rest

12. S1: make `Hand` a typed card (`{ suit, rank }`) or validate and reject unknown encoding. Silent zero is the worst possible failure mode for a scoring function.
13. S3: replace the fixed auction line with engine-derived acceptable bids, so the drill tests judgement.
14. S6: decide whether the replayer steps through calls or through cards, and make the component match.

---

## 11. What I would not do

- **Do not add a "correct" order in one file and leave the others.** That is the specific failure mode A1 invites.
- **Do not add scoring to the database.** It belongs in `src/bridge/`, behind the same no-database-access rule the rest of the engine obeys. The database records the result; it does not compute it.
- **Do not make the daily hand random per user.** "Of the day" that differs per account is not a daily hand, and it removes the reason anyone would mention it to another player.
- **Do not fix the tests to match whatever the code does.** Two of the three order assertions in the suite currently encode the bug. They are specifications, and they are wrong.

---

## 12. Verification notes

Anything that could be settled by running it, was run rather than read:

- **HCP** — 10 for AKQJ, 37 for a 13-card maximum hand. Correct.
- **Balance** — 4-3-3-3, 4-4-3-3, 4-4-3-2 and 5-3-3-2 accepted with the long suit in **every** position; 5-4-2-2, 6-3-2-2, 4-4-4-1 and 3-2-3-2 rejected. Correct. I initially suspected this was a suit-order bug because `isBalanced` indexes a fixed `[spades, hearts, diamonds, clubs]` array; `shape()` sorts descending first, so it is not. Two probe rounds were spent confirming this before it was excluded from the findings.
- **Turn order** — confirmed by reading `nextPosition` and by comparing against the UI layout in `BridgeTable.tsx`, which places West on the left of the diagram. Two tests in the suite assert the reverse.
- **Declarer** — `findDeclarer` scans history in order and returns the first seat of the winning side to name the strain, which is the correct rule and not the common shortcut of using the last bidder.
- **Scoring** — absence confirmed by search across `src/bridge` and `src/lib` for contract-made, tricks-required, vulnerability and rubber-score logic.
- **Follow-suit** — absence confirmed across `src/`; the only implementation is the opponents' auto-play in `/play`.
- **Quiz content** — read from the seeded rows, not the source, so what the learner is actually served was checked.
