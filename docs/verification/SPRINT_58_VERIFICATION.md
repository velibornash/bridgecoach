# Sprint 58 — Real Data Layer + Persistence: Verification

**Status: PASS with documented gaps**

Reference commit range: `52aaf52` … (Sprint 58)
Predecessor: `b9ce7ac` (Sprint 57, closed and verified)

Every requirement is classified **PASS** / **PARTIAL** / **FAIL** / **NOT IMPLEMENTED**.
Section 19 lists the known limitations honestly rather than claiming completion.

---

## 1. Architecture decision

**PASS**

```
React component → service layer → Next route handler → Prisma → PostgreSQL
```

- The service layer is the only place that knows the API exists. Components call
  services; no component touches `fetch`, the database, or a response envelope.
- `src/lib/apiRoute.ts` provides `withUser()`, uniform error mapping, and body
  validation, so **ownership cannot be forgotten at a call site** — every private
  route resolves its owner through `withUser`.
- The **Bridge Engine stays the sole authority** for bridge facts. The database
  stores events; it never implements a bidding rule. Proven by a test that
  replays a persisted auction whose `engineLegal` column lies, and asserts the
  engine still rejects it.
- Adapters (§22) are used where the persisted shape differs from what the UI
  renders — e.g. `statsService` maps `/api/stats` onto the legacy `LearningStats`
  interface, and `achievementService` maps the DB's normalised category enum onto
  the UI's category names.

## 2. Database choice

**PASS**

**PostgreSQL 18.4 + Prisma 7.10** with the `@prisma/adapter-pg` driver adapter.

| Consideration | Decision |
|---|---|
| Why not SQLite | A PostgreSQL 18 instance already runs locally (Postgres.app) **and** on the Oracle server. SQLite would have been new infrastructure for no benefit. |
| Driver adapter | Prisma 7 no longer bundles an engine; `@prisma/adapter-pg` is required. Verified installed and working. |
| Local vs server | `localhost:5432/bridgecoach` locally, Oracle host in production. Only `DATABASE_URL` changes. |
| Database name | A **new** `bridgecoach` database was created. `sokker_db` (another app) was deliberately not written to. |
| Secrets | `DATABASE_URL` lives in `.env` (gitignored). `.env.example` holds a placeholder only. Verified not staged in any commit. |

## 3. Schema overview

**PASS** — `prisma/schema.prisma`, 22 models, 29 tables.

| Group | Models |
|---|---|
| Identity | `User`, `Profile` |
| Learning content | `Course`, `Episode`, `Lesson` |
| Progress | `LessonProgress`, `CourseProgress` |
| Bridge | `Hand`, `Auction`, `AuctionAction`, `PracticeSession`, `PracticeAction` |
| Quiz | `Quiz`, `QuizQuestion`, `QuizAttempt` |
| Gamification | `Achievement`, `UserAchievement`, `Mission`, `UserMission`, `XPEvent`, `Activity` |
| User content | `Bookmark`, `Note` |
| AI | `AIConversation`, `AIMessage` |
| Author Studio | `AuthorContent`, `AuthorDraft`, `AuthorRevision` |

Two fields were added after the first draft because the product already had the
concept and dropping it would have lost a feature: `Achievement.rarity` and
`Note.pinned`.

## 4. Migration status

**PASS** — 4 migrations, all applied and verified against the live database.

| Migration | Change |
|---|---|
| `20260926092318_init` | Full schema, 29 tables |
| `20260926110032_add_achievement_rarity` | Restored `Achievement.rarity` |
| `20260926111027_add_note_pinned` | `Note.pinned` (pinning is an existing feature) |

**Local dev:** `npm run db:migrate` · **Deploy:** `npm run db:deploy` ·
**Reset:** `npm run db:reset` · **Studio:** `npm run db:studio`

`prisma migrate dev` requires a shadow database. `postgres` is a superuser on the
local instance, so this works. On the Oracle server, use `migrate deploy`, which
does not need that privilege.

## 5. Seed status

**PASS** — `prisma/seed.ts`, deterministic and idempotent.

- **Deterministic:** no `Date.now()` / `Math.random()` in stored values. Two runs
  produce identical rows. (mockData's XP entries and daily challenges *were*
  time-relative and were deliberately not seeded.)
- **Idempotent:** every write is an upsert on a stable id; re-running repairs a
  wrong metric from an earlier seed version.
- **Distinguishable:** static content carries `isSeed: true`.
- Seeds: 1 dev user (empty progression, **no password hash**), 1 course,
  6 episodes, 8 lessons, 1 quiz + 8 questions, 12 achievements, 8 missions,
  1 sample hand, 1 auction stored as **10 structured actions**.
- Seeded rows are static content, not user state. The dev user's progression is
  left empty so a new developer starts from a valid new-user state.

## 6. Learning persistence

**PASS**

Lesson completion, section ids, current index, and timestamps persist.
Completion is a **one-way transition** — a later "in progress" write cannot
un-complete a lesson or lose `completedAt`.

**Data-loss bug found and fixed:** a partial payload (`{completed:true}` only)
was **erasing** recorded `completedSectionIds`. Fields are now only written when
the caller actually sends them. Regression-tested.

## 7. Practice persistence

**PASS**

`PracticeSession` stores the **evidence** of what the player did, not just a
score: every bid and card with `isCorrect` and `engineFeedback`, plus scenario,
difficulty, start/completion time, duration, score, final contract and declarer.
This is the raw material the Sprint 60 Player Model needs.

## 8. Auction persistence

**PASS**

Auctions are stored as **structured `AuctionAction` rows** — player, type, level,
strain, sequence, engine verdict, strategy suggestion, timestamp. There is no
denormalised `"1NT 2C 2H 3NT"` column anywhere.

`POST /api/auctions` normalises and validates every call, replays it through
`AuctionStateMachine` to capture the engine's verdict, and **rejects the whole
auction before writing anything** if a call is illegal:

```
400 {"error":"Illegal call at sequence 2 for S: A bid of 1H does not outrank
the current contract.","code":"ILLEGAL_CALL"}
```

## 9. Bridge Engine + persistence

**PASS**

The database stores facts; the engine remains authoritative. Loading an auction
reconstructs state through `AuctionStateMachine`:

```
stored: 10 structured rows; engine says: {"level":4,"strain":"S","declarer":"N","passedOut":false}
```

A dedicated test replays a persisted auction whose `engineLegal` column claims a
call was legal when it was not, and asserts the engine **still rejects it** —
proving the DB never becomes a second bidding engine.

## 10. XP / progression persistence

**PASS**

`src/lib/progression.ts` is the **single writer** of user XP. `user.xp`,
`user.level`, `user.streak` and `user.longestStreak` are **derived caches**
recomputed from the `XPEvent` log, so progression can always be rebuilt and every
XP value traces back to the event that granted it. Streaks are computed from real
event timestamps in UTC, not a stored counter.

`awardXp()` is idempotent: the unique constraint on `(userId, type, reference)`
means a replayed request cannot inflate XP. Verified: first award 42, second 0.

## 11. Achievement / mission persistence

**PASS** — with one deliberate limitation, see §19.

Both derive progress from persisted activity; the unique constraint on
`(userId, achievementId)` makes duplicate unlocks impossible. Recompute is
idempotent (verified: `newlyUnlocked: []` on the second call).

## 12. Dashboard

**PASS** (server side) — `GET /api/dashboard` returns persisted user, progression,
stats, next lesson and recent activity. Verified live: `Dev User | xp 348 | level 2
| lessons 2/8 | next: NT Opening Bids`.

Fabricated values removed from the dashboard: `level 7 / xp 3500 / streak 12`,
`"34% complete"`, `"Confidence 78%"` (deleted — no such metric exists), a hardcoded
34% progress bar, `const timeLeft = 365` (fake 6:05 countdown), three hardcoded
AI insight strings, `weeklyGoal 15 / 12`, and `streak max 30`.

`DashboardDataProvider` fetches **once** for the whole tree, so components read
real data with no per-component request (§26).

## 13. Statistics

**PASS**

`GET /api/stats` derives everything from persisted rows: a 30-day activity heatmap
(bucket 0–4, deterministic), real quiz accuracy history, bid accuracy, practice
minutes, XP by event type.

Removed: the `Math.random()` heatmap generator, the `mockLearningStats` fixture
(28 h, 78%, 12-day streak), accuracy synthesised from XP, and
`ProgressionMasteryWidget`'s fabricated `defaultStats`.

**Bugs found and fixed while testing:** the page divided by `total: 0` producing
`NaN` (framer-motion logged `animate width from "NaN%"`), and a category with
`completed === total === 0` was counted as a completed course. Both regression-tested.

## 14. Author Studio persistence

**PASS**

localStorage is **no longer authoritative**. `authorStudioService` reads and
writes through `/api/author-studio/drafts`; localStorage survives only as an
offline cache that a successful fetch always overwrites. The page UX is unchanged
and the service API stayed the same, so call sites did not move.

## 15. AI conversation persistence

**PASS**

`AIConversation` + `AIMessage` persist; conversations survive refresh. The user's
message is committed **before** the provider is called, so a provider failure
never loses it. Context is stored as **references** (`practiceSessionId`,
`handId`, `auctionId`) rather than duplicated hand payloads. Only provider/model
**names** and token counts are stored — a test asserts the serialized conversation
never matches `/api[_-]?key|secret|bearer/i`.

## 16. Mock-data migration

**PASS** — `docs/audit/SPRINT_58_MOCK_CLASSIFICATION.md`

Real `mockData` imports: **45 → 11** (7 legitimate static content + 4 multi-user
pages deliberately labelled + 1 test fixture). **Zero `REMOVE`-classified
dependencies remain in production user state.**

## 17. Test results

**PASS**

| Suite | Result |
|---|---|
| Unit + integration | **213 passed / 0 failed**, 20 files (Sprint 57 had 162) |
| E2E | **7 passed / 0 failed** (Sprint 57 had 3) |
| Coverage | 49.07% stmts overall · **86.12% on the Bridge Engine** |
| typecheck | 0 errors |
| lint | 0 errors (115 pre-existing warnings) |
| build | clean, no warnings |

**Honest note on the coverage number:** it fell from 67% because the `services`
directory dropped to ~9%. Those services are thin typed `fetch` wrappers with no
logic of their own; they are covered through the route-handler integration tests
and the E2E journey rather than by unit tests, which is the correct place for
them. The number is reported as measured, not adjusted.

## 18. E2E persistence journey

**PASS** — `tests/e2e/persistence-journey.spec.ts`

New user → lesson → XP → structured auction → practice session → quiz → note →
AI conversation → achievements → **browser reload** → every value re-verified from
the database, including that the auction still replays to 4♠ by N through
`AuctionStateMachine`.

Two further E2E specs cover the dashboard showing real data, and that the fixture
user "Bob Smith" appears nowhere.

## 19. Known limitations

**PARTIAL** — these are real and are not claimed as done.

| # | Limitation | Why |
|---|---|---|
| 1 | **Authentication is still a mock.** `mockLogin` returns a throwaway token that is never verified. Ownership uses a development identity (`DEV_USER_EMAIL`). | Sprint 59. The data layer is already designed for it — ownership flows through one function. |
| 2 | **The AI endpoints are still unauthenticated.** Rate limiting is now in place, and `provider`/`model` are pinned server-side, but without sessions the rate-limit key is a spoofable forwarded address. | Sprint 59. `src/lib/ai/rateLimit.ts` documents this; the limiter must key on user id once sessions exist, and move to a shared store if deployed multi-instance. |
| 3 | **`SkillRadar` still renders a static skill profile.** `ProgressEngine.calculateMastery` synthesises 5 percentages from accuracy and lesson count. | Needs the Sprint 60 Player Model, which will mine the `AuctionAction` / `PracticeAction` rows Sprint 58 now collects. Left visible-but-honest rather than faked from unrelated numbers. |
| 4 | **4 multi-user pages cannot show real data** (`/leaderboard`, `/friends`, `/community`, `/profile/[id]`). | One user in the database until Sprint 59. They now render a visible `MultiUserNotice` and are classified `LABELLED`. |
| 5 | **Thinking time is not captured** (reported as 0). | The previous 14.5s had no source. Needs instrumentation. |
| 6 | **Reward balances are static** (coins 1250, stars 47). | No currency ledger exists. |
| 7 | **No CI.** Nothing runs the gate automatically on push. | Queued as P3. |
| 8 | ~~**Test data accumulates in the dev database.**~~ RESOLVED. | Integration tests now run against `bridgecoach_test`, derived automatically by `vitest.config.ts`. The development database is no longer touched by the test suite. |

## 20. Security preparation for Sprint 59

**PASS** (design) / **NOT IMPLEMENTED** (the auth itself)

- Every private entity has an explicit `userId` foreign key with `onDelete: Cascade`.
- Ownership resolves through **one** function, `resolveUserId()`. Sprint 59
  replaces its body with real session resolution; no other code changes.
- Ownership violations return **404, not 403**, so ids cannot be probed.
- `userId = "demo-user"` is **not** used as permanent architecture — the dev
  identity is resolved by email from the database.
- No API key, secret or credential is persisted. Asserted by test.
- `PasswordHash` exists but is `null` for the dev user — the dev identity is not
  authenticatable.
- Data-integrity rules live in the database (40 unique indexes), not in
  application code that a future refactor could bypass.

**Not implemented, by design:** real sign-in, hashed passwords, sessions, route
protection. Sprint 59.

---

## Definition of Done status

| Requirement | Status |
|---|---|
| Real database exists | PASS |
| Migrations work | PASS |
| Seed process works | PASS |
| Core user-owned data is persistent | PASS |
| Lesson progress persists | PASS |
| Quiz results persist | PASS |
| Practice sessions persist | PASS |
| Structured auctions persist | PASS |
| Auctions reconstruct through `AuctionStateMachine` | PASS |
| XP / progression persists | PASS |
| Achievements persist | PASS |
| Missions persist | PASS |
| Bookmarks persist | PASS |
| Notes persist | PASS |
| Author Studio not localStorage-only | PASS |
| AI conversations persist | PASS |
| Dashboard uses real data | PASS |
| Statistics use real activity | PASS |
| Production paths free of mockData user state | PASS |
| Sprint 57 tests still green | PASS (162 → 213) |
| Persistence integration tests pass | PASS |
| E2E persistence journey passes | PASS |
| typecheck passes | PASS |
| lint passes | PASS |
| coverage runs | PASS |
| production build passes | PASS |
| no P0 / P1 issue remains | **PASS** — the AI endpoint P1 was resolved in the follow-up; the remaining auth gap is Sprint 59 scope |

## P0 / P1 count

| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 0 |

The AI endpoint P1 was raised during Sprint 58 and resolved in the follow-up
commit: rate limiting was added, `provider`/`model` are pinned server-side, and
prompt length is capped. The remaining gap — no real authentication on any
route — is Sprint 59 scope, not a Sprint 58 defect.
