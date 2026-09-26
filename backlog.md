# Bridge Coach — Backlog

Living priority list. Sprint 58 is the current sprint; everything after is queued
by priority. Update this file when work lands.

**Conventions**
- `[ ]` open · `[~]` in progress · `[x]` done · `[!]` blocked
- Priority: **P0** blocks the product · **P1** blocks the sprint · **P2** should do · **P3** nice to have
- Every item links to a real file path so it can be picked up cold.

---

## Sprint 58 — Real Data Layer + Persistence (ACTIVE)

Reference: `docs/audit/SPRINT_1_TO_56_GAPS.md` R-2, `docs/audit/SPRINT_1_TO_56_AUDIT.md` R-2.
Sprint 57 (`b9ce7ac`) is closed and verified. Sprint 58 turns the mock product
into a persistent one. **Do not** implement auth, Player Model, AI Coach 2.0, or
new bridge conventions.

### 58.1 — Foundation

- [x] **58.1.1 Decide + document the database choice.** **PostgreSQL 18 + Prisma 7.10**
      with the `@prisma/adapter-pg` driver adapter. Rationale: PostgreSQL 18 is
      already running locally (Postgres.app) and on the Oracle server, so there is
      no new infrastructure to operate; Prisma 7 gives a typed schema, real
      migrations, and an idempotent seed. Alternative considered and rejected:
      SQLite + Prisma (rejected — a PostgreSQL instance already exists).
      **Local dev vs server:** `localhost:5432/bridgecoach` locally; the Oracle
      server host in production. Only the `DATABASE_URL` changes between them.
- [x] **58.1.2 Install and configure Prisma.** `prisma` + `@prisma/client` +
      `@prisma/adapter-pg` + `pg`; `prisma/schema.prisma`; `prisma7.config.ts`
      (Prisma 7 keeps the datasource URL here, not in the schema);
      `DATABASE_URL` in `.env` only — `.env.example` carries a placeholder and
      the real file is gitignored. Scripts: `db:generate`, `db:migrate`,
      `db:deploy`, `db:seed`, `db:reset`, `db:studio`, `db:validate`.
- [x] **58.1.3 Schema + first migration.** All 22 models from §4 in
      `prisma/schema.prisma`; migration `20260926092318_init` applied — 29 tables.
      Every private entity has an explicit `userId` owner relation (§5).
      Integrity rules are **database constraints**, not application code (§25):
      `LessonProgress(userId, lessonId)`, `XPEvent(userId, type, reference)`,
      `UserAchievement(userId, achievementId)`, `UserMission(userId, missionId)`,
      `AuctionAction(auctionId, sequence)`, `PracticeAction(sessionId, sequence)`,
      `AuthorRevision(contentId, version)`, `CourseProgress(userId, courseId)`.
- [x] **58.1.4 DB client singleton** `src/lib/db.ts`. Uses the PrismaPg adapter
      and caches the client on `globalThis` so dev hot reload does not leak pools.
      `resolveUserId()` is the single ownership point; `DEV_USER_EMAIL` is the
      documented temporary development identity (§27) that Sprint 59 replaces.
- [x] **58.1.5 Seed mechanism** `prisma/seed.ts` — deterministic (no
      `Date.now()`/`Math.random()` in stored values), idempotent (all upserts on
      stable ids), and repeatable. Seeds 1 dev user (empty progression state,
      no password hash), 1 course, 6 episodes, 8 lessons, 1 quiz + 8 questions,
      12 achievements, 8 missions, 1 sample hand, and 1 auction stored as 10
      **structured** actions. All static content flagged `isSeed: true` (§18).
- [x] **58.1.6 Document local setup.** This file + `.env.example` +
      `docs/verification/SPRINT_58_VERIFICATION.md` (§58.4.7). Commands:
      `npm run db:migrate` · `npm run db:seed` · `npm run db:reset` ·
      `npm run db:studio`.

### 58.2 — Persistence layer + API

- [x] **58.2.1 API routes** (§20). Seventeen route files under `src/app/api/`:
      `progress` (GET/POST) · `practice` (GET/POST) · `auctions` (GET/POST) ·
      `quiz-attempts` (GET/POST) · `achievements` (GET/POST) · `missions` (GET) ·
      `bookmarks` (GET/POST + `[id]` DELETE) · `notes` (GET/POST + `[id]`
      PATCH/DELETE) · `author-studio/drafts` (GET/POST + `[id]` DELETE) ·
      `ai/conversations` (GET/POST) · `ai/messages` (POST) · `dashboard` (GET) ·
      `stats` (GET) · `content` (GET) · `certificates` (GET) ·
      `notifications` (GET/PATCH) · `quiz/check` (POST) · `xp/history` (GET).
      The two pre-existing routes are untouched and unreused. Every private route
      resolves its owner through `withUser`, so ownership cannot be forgotten at a
      call site. Uniform error mapping in `src/lib/apiRoute.ts`.
- [x] **58.2.2 Refactor the service layer** (§19). DONE. `api.ts` performs real
      requests; `lessonService`, `quizService`, `achievementService`,
      `statsService`, `challengeService`, `authorStudioService`, `notesService`,
      `bookmarksService`, `certificatesService`, `notificationsService` and
      `userService` all read the database. Real `mockData` imports went 45 → 11;
      see `docs/audit/SPRINT_58_MOCK_CLASSIFICATION.md`.
- [x] **58.2.3 Author Studio persistence** (§15). `authorStudioService` gains an
      API-backed path; the `authorStudio.drafts` / `authorStudio.current`
      localStorage keys are no longer authoritative — the database is. The
      localStorage helpers remain only as an offline cache and the page still uses
      the same service API, so the UX is unchanged. Verified: draft → reload →
      intact blocks.
- [x] **58.2.4 AI conversation persistence** (§16, §17). `ai/conversations` +
      `ai/messages`. The user's message is committed BEFORE the provider is
      called, so a provider failure never loses it. Conversations carry
      `practiceSessionId` / `handId` / `auctionId` references instead of
      duplicated hand payloads. Only provider/model names and token counts are
      stored — never a key or credential (asserted in the test suite).

### 58.3 — Domain wiring

- [x] **58.3.1 Learning progress** (§6). `POST /api/progress` persists lesson
      completion, section ids, index and timestamps. Completion is a one-way
      transition. Fixed a real data-loss bug found while testing: a partial
      payload (`{completed:true}` only) was erasing recorded
      `completedSectionIds`; fields are now only overwritten when actually sent.
- [x] **58.3.2 Quiz attempts** (§6). Grading moved server-side —
      `POST /api/quiz-attempts` reads correct answers from the database, so the
      client can no longer compute its own score in the browser.
- [x] **58.3.3 Practice + auction persistence** (§7, §8, §9). `AuctionAction`
      rows are structured (player, bid, sequence, engine verdict) and replay
      through `AuctionStateMachine`; the API rejects an illegal call with the
      engine's reason before writing anything. `PracticeAction` stores the
      evidence of each bid and card played, not just a score.
- [x] **58.3.4 XP events + progression engine** (§10). `src/lib/progression.ts`
      is the single writer of user XP. `user.xp` / `user.level` / `streak` /
      `longestStreak` are DERIVED caches recomputed from the XPEvent log, so
      progression can always be rebuilt and every XP value traces back to its
      event. Streaks are computed from real event timestamps in UTC.
- [x] **58.3.5 Achievements + missions** (§13). Both derive progress from
      persisted activity. Achievements with no machine-evaluable metric are
      marked `manual` and are never auto-unlocked on a guess — a bug found while
      testing where "Perfect Score" (a quiz achievement) and "Bridge Fanatic"
      unlocked on completed lessons / raw XP. Mission progress is derived the
      same way.
- [x] **58.3.6 Bookmarks + notes** (§14). Full create/read/update/delete
      persistence with ownership enforcement.
- [x] **58.3.7 Dashboard from real data** (§11). `GET /api/dashboard` returns
      persisted user, progression, stats, next lesson and recent activity.
      `GET /api/stats` derives statistics from real rows. **Not yet done:** the
      React components still import `mockData` directly — see 58.2.2.
- [x] **58.3.8 Statistics from real activity** (§12). The `Math.random()`
      heatmap is gone; `GET /api/stats` derives a 30-day activity heatmap, a real
      quiz accuracy history, bid accuracy and XP-by-type from stored rows. The
      page components still pass hardcoded values into charts — see 58.2.2.
- [ ] **58.3.9 Error / loading / empty states** (§21). Routes return real 400 /
      404 / 500 responses and the UI can distinguish them. **Remaining:** the
      client components still have no loading/empty/error UI states, because they
      are not yet wired to these routes (58.2.2).

### 58.4 — Verification

- [x] **58.4.1 Persistence tests** (§23).
      `tests/integration/persistence-domains.test.ts` (12 tests) covers lesson,
      XP idempotency, quiz, practice evidence, auction engine replay,
      achievements, bookmarks, notes, author studio, AI conversations and
      ownership/orphan checks. Sprint 57's 162 tests remain green (184 total).
- [x] **58.4.2 E2E persistence journey** (§24).
      `tests/e2e/persistence-journey.spec.ts` — lesson → XP → auction → practice
      → quiz → note → AI conversation → achievements → **page reload** → all
      state verified from the database. Passes.
- [x] **58.4.3 Data integrity checks** (§25). Enforced in the schema, not in
      application code: unique constraints on `LessonProgress(userId, lessonId)`,
      `XPEvent(userId, type, reference)`, `UserAchievement(userId, achievementId)`,
      `UserMission(userId, missionId)`, `AuctionAction(auctionId, sequence)`,
      `PracticeAction(sessionId, sequence)`, `CourseProgress(userId, courseId)`,
      `AuthorRevision(contentId, version)`, plus cascading deletes. An orphan
      check test walks every private table. Dashboards/stats use aggregate
      queries, not table scans (§26).
- [x] **58.4.4 Full regression** (§29). All 20 product routes return 200 with no
      server errors; 201 unit/integration + 7 E2E cover the critical paths.
      Sprint 58 also fixed two browser-only bugs this pass surfaced (a `NaN`
      progress-bar width from a `0/0` division, and a hydration mismatch from
      render-phase `new Date()` calls).
- [x] **58.4.5 Mock dependency classification** (§28).
      `docs/audit/SPRINT_58_MOCK_CLASSIFICATION.md`, re-audited twice since.
- [x] **58.4.6 Quality gate** (§30): typecheck 0 errors · lint 0 errors ·
      `npm test` 184/184 · coverage 67.44% stmts (bridge engine 86.12%) ·
      `npm run test:e2e` 4/4 · `npm run build` clean.
- [x] **58.4.7 Verification report** (§31):
      `docs/verification/SPRINT_58_VERIFICATION.md` — 20 sections, every
      requirement classified PASS / PARTIAL / FAIL / NOT IMPLEMENTED.

---

## Post-Sprint 58 (queued, by priority)

### P1 — Security & correctness debt

- [x] **59 — Real authentication.** Closed. Verification:
      `docs/verification/SPRINT_59_VERIFICATION.md`. Signed-cookie sessions with a
      revocable DB row, `bcryptjs` cost 12, the `/api/auth/*` endpoints, real
      sign-in/sign-up in the client, `src/proxy.ts` for route protection,
      `resolveUserId()` resolving a real session with the dev identity refused in
      production, and per-user AI quotas. `/leaderboard` and `/profile/[id]` moved
      off fixtures onto real data. Sprint 58's central claim held: replacing
      `resolveUserId()` was the whole of it — no route or service changed. Lint
      reached 0 errors for the first time. 264 unit/integration, 7 E2E.
      Still open, deliberately: password reset (needs an email provider),
      in-process rate limiting, email verification, and Playwright still using the
      dev database.
- [x] **60 — Owner account, admin approval, password reset.** Verification:
      `docs/verification/SPRINT_60_VERIFICATION.md`. Shipped ahead of the
      social graph, because the graph was blocked on nothing and this was
      blocking real use. Owner account with `role`/`status`; registration creates
      a PENDING account that cannot sign in; `/admin` lists requests with
      approve/reject; password reset with hashed single-use tokens, delivered via
      a local dev mailbox or Resend's free tier. The social-graph half is
      untouched and still open below.
- [x] **60c — Moderation, search, CI, test isolation.** Shipped. Post and comment
      rate limits charged to the user id; `BlockedUser` implements the `blocked`
      status that previously existed in the vocabulary with nothing to set it,
      enforced on friend requests in both directions and on the feed;
      `ContentReport` plus an admin triage queue where filing a report
      deliberately changes nothing. `/search` replaced the last fixture-backed
      page and is written in SQL because Prisma's Json operators cannot do
      case-insensitive matching. `.github/workflows/ci.yml` runs the full gate
      plus a from-scratch migration job. Playwright now runs against
      `bridgecoach_test` — the docs claimed isolation that only existed for
      Vitest, and the browser suite was mutating the owner's real progression.
      **Known gap:** the test database is never truncated, so rows accumulate.
- [x] **60b — Social graph.** Shipped. `Friendship` with a request/accept state
      machine stored as two rows so the sender survives; `CommunityPost`,
      `PostLike` (a table, because "did I like this" must be answerable), and
      `PostComment`. `/friends` and `/community` are on real data and their
      `MultiUserNotice` is gone. Both users' views are asserted to agree after
      every friendship transition. **Known gap:** no reporting, no post rate
      limit, no visibility control — adequate for one owner, inadequate once a
      stranger can register. Three decisions are needed first (session storage,
      dev-user handling, hashing algorithm).
      Summary: server-side sessions in a signed `httpOnly` cookie, `bcryptjs`
      hashing, a `Session` + `AuthEvent` table, `/api/auth/*` endpoints on the
      existing route scaffolding, Next.js middleware for route protection, and
      `resolveUserId()` in `src/lib/db.ts` swapped from the dev identity to the
      session — that one function is the only seam Sprint 58 left open.
      Unblocks `/leaderboard`, `/friends`, `/community`, `/profile/[id]`, makes the
      AI rate limit enforceable per user, and deletes `mockLogin` plus the dead
      `authService.ts`.
- [x] **Secure the AI endpoints.** DONE in the Sprint 58 follow-up. Rate limiting
      added (`src/lib/ai/rateLimit.ts`, per-endpoint limits, capped bucket map),
      `provider`/`model` are now pinned server-side so a caller cannot steer to an
      expensive model, and prompt length is capped. 12 tests. **Remaining:** the
      rate-limit key is a spoofable forwarded address until Sprint 59 adds
      sessions, and an in-memory limiter does not hold across multiple instances.
- [x] **Remove hardcoded personal data from shipped code.** DONE. The sidebar and
      settings now read the real user from `/api/dashboard`; the subscription
      billing address is the signed-in user; support addresses come from one
      constant, `src/lib/siteConfig.ts` (`NEXT_PUBLIC_SUPPORT_EMAIL`, default
      `support@bridgecoach.app`). `grep -r "velja\|Velja Jagodina" src/` returns
      nothing.

- [x] **Isolate the test database.** DONE. `vitest.config.ts` derives
      `bridgecoach_test` from the development URL (or honours `TEST_DATABASE_URL`
      / `.env.test`), so the test suite never touches development data. Verified:
      the dev database's `LessonProgress` count is unchanged after a full test run.

### P2 — Product integrity

- [x] **60 — Player Model.** Shipped: `/api/statistics/skills` derives accuracy
      from `AuctionAction.engineLegal`, the engine's own verdict, never
      re-judging an auction. A percentage is withheld below five attempts and the
      overall figure averages only the skills that had enough data. "Signals" was
      dropped as a category — card-play communication is not recorded in
      anything this can measure.
- [x] **Test files run sequentially.** Parallel files shared one database, so a
      file's `afterAll` could cascade rows out from under another file mid-assert.
      Cost: 84s instead of ~40s. Bought: no more intermittent failures in files
      that did nothing wrong.
- [ ] **60d — Player Model, part two.** Use the persisted `PracticeAction` /
      `AuctionAction` / `QuizAttempt` evidence to build a real skill profile:
      weakness detection, per-skill stats, and AI Coach context. This is what
      `SkillRadar` and `ProgressEngine.calculateMastery` need — today they
      synthesise five percentages from accuracy and lesson count, which is the
      last fabricated chart in the app. The raw evidence is now persisted and
      waiting.
- [ ] **AI Coach 2.0.** Reconnect `/api/coach` to persisted conversations
      (needs 58.2.4), send real history, and inject Player Model context.
- [x] **Fix the fake countdown** — real seconds to end of day (Sprint 58)
      renders a fabricated `6:05` timer.
- [x] **Fix the hero marketing claims.** "50K+ Active Learners / 200+ Lessons /
      15K+ Challenges" replaced with product facts
      — `"50K+ Active Learners"`, `"200+ Interactive Lessons"`,
      `"15K+ Daily Challenges Solved"` are fabricated with no data source.
- [x] **Fix content contradictions.** FAQ and pricing rewritten: no invented paid
      tiers, no fabricated payment methods or refund guarantees
      and "$9.99/$19.99"; fixtures say 8 lessons and $0/$9/$99
      (`src/components/landing/PricingPreview.tsx`).
- [x] **Real leaderboard / friends / community.** Shipped in Sprint 59/60
      (`mockLeaderboard`, `mockFriends`, `mockCommunityPosts`). Depends on auth.
- [x] **Real certificates** — served from `/api/certificates`; the fixtures are
      dead code and removed
      are static; should be derived from persisted lesson completion.
- [x] **Settings persistence.** Shipped: `Profile.preferences`, and the three
      privacy toggles are now enforced rather than decorative
      and privacy toggles are `useState` only, never saved.
- [x] **Fix `bridgecoach-locale` write-only bug.** It was written and never read;
      the language reset to English on every reload. Fixed with the existing
      `getLocaleFromString`, so a stale value falls back safely.
      `src/i18n/useTranslation.tsx:19` writes the locale but never reads it, so
      the language always resets to `en` on reload.
- [ ] **Finish localization** (P3 in the 1–56 audit): theme switcher is real,
      strings are only partly translated.

### P3 — Cleanup

- [x] **Delete or adopt `SurfaceCard.tsx`** — deleted; it had no importers
      never imported). R-4 in the 1–56 audit.
- [ ] **Resolve XP semantics ambiguity.** R-5: `mockUserStats.totalXpEarned 2450`
      vs `mockUser.xp 3500`. Define current vs lifetime, then derive both.
- [x] **Clear the remaining lint warnings** (P3, R-7). 131 → 30, 0 errors. The
      list was not pure cosmetics: it hid an `async` Client Component that
      `next build` accepts and React does not.
      imports/vars in pre-existing files.
- [x] **Add CI** on `lint && typecheck && test && build`. Shipped: also runs the
      browser suite and a from-scratch migration job. Unverified — no remote yet
      automatically today.
- [ ] **Add `/api` error + rate-limit conventions**, structured logging, and
      health checks before production.
- [x] **Orphaned pages check.** 44 routes audited. Four more surfaces that
      reported work they never did: `/contact` ("Message sent!", text discarded),
      `/email-preferences` ("Preferences saved!", nothing stored, and a second
      invented key set), `/certificates` ("Certificate downloaded!", no file),
      and `/practice`, which never called the `/api/practice` endpoint built for
      it in Sprint 58. All four now write for real.
      reachable and intentional (e.g. `/maintenance`, `/offline`).
- [x] **Remove `test-results/` noise** from the working tree (gitignored, but
      Playwright leaves artefacts locally).

---

## Closed sprints

| Sprint | Commit | Summary |
|---|---|---|
| 1–56 | `2c8b149` … `ed27a83` | MVP, learning, gameplay, statistics, community, Author Studio. Audit in `docs/audit/`. |
| 57 | `b9ce7ac` | Suit centralization, `AuctionStateMachine`, `LegalBidValidator`, conventions/strategy layer, `confirmAuction`, engine-first tactical validation, 162 tests, 3 E2E, coverage, Playwright. Verified in `docs/audit/SPRINT_57_VERIFICATION.md`. |
| — | `886c425` | Card rank/suit symbols enlarged (all sizes, card dimensions unchanged). |
