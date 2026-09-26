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
- [ ] **58.4.5 Mock dependency classification** (§28).
- [x] **58.4.6 Quality gate** (§30): typecheck 0 errors · lint 0 errors ·
      `npm test` 184/184 · coverage 67.44% stmts (bridge engine 86.12%) ·
      `npm run test:e2e` 4/4 · `npm run build` clean.
- [x] **58.4.7 Verification report** (§31):
      `docs/verification/SPRINT_58_VERIFICATION.md` — 20 sections, every
      requirement classified PASS / PARTIAL / FAIL / NOT IMPLEMENTED.

---

## Post-Sprint 58 (queued, by priority)

### P1 — Security & correctness debt

- [~] **59 — Real authentication.** Plan: `docs/SPRINT_59_PLAN.md`. Decisions
      taken: signed-cookie sessions with a DB row (revocable), `bcryptjs` cost 12.
      **Done:** schema (`Session`, `AuthEvent`, migration
      `20260926152654`), `src/lib/session.ts`, `src/lib/password.ts`, the
      `/api/auth/*` endpoints, and `resolveUserId()` now resolving a real session
      with the dev identity refused in production. Cross-user isolation verified
      live and covered by 6 tests. **Remaining:** client migration, middleware,
      multi-user pages, per-user AI rate limiting. Three decisions are needed first (session storage,
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

- [ ] **60 — Player Model.** Use the persisted `PracticeAction` /
      `AuctionAction` / `QuizAttempt` evidence to build a real skill profile:
      weakness detection, per-skill stats, and AI Coach context. This is what
      `SkillRadar` and `ProgressEngine.calculateMastery` need — today they
      synthesise five percentages from accuracy and lesson count, which is the
      last fabricated chart in the app. The raw evidence is now persisted and
      waiting.
- [ ] **AI Coach 2.0.** Reconnect `/api/coach` to persisted conversations
      (needs 58.2.4), send real history, and inject Player Model context.
- [ ] **Fix the fake countdown** `src/app/dashboard/page.tsx:57` — `timeLeft = 365`
      renders a fabricated `6:05` timer.
- [ ] **Fix the hero marketing claims** `src/components/landing/Hero.tsx:13-17`
      — `"50K+ Active Learners"`, `"200+ Interactive Lessons"`,
      `"15K+ Daily Challenges Solved"` are fabricated with no data source.
- [ ] **Fix content contradictions.** `src/app/faq/page.tsx:20` claims "6 lessons"
      and "$9.99/$19.99"; fixtures say 8 lessons and $0/$9/$99
      (`src/components/landing/PricingPreview.tsx`).
- [ ] **Real leaderboard / friends / community.** Currently pure fixtures
      (`mockLeaderboard`, `mockFriends`, `mockCommunityPosts`). Depends on auth.
- [ ] **Real certificates** — `mockCertificates` / `mockExtendedCertificates`
      are static; should be derived from persisted lesson completion.
- [ ] **Settings persistence.** `src/app/settings/page.tsx:46-54` notification
      and privacy toggles are `useState` only, never saved.
- [ ] **Fix `bridgecoach-locale` write-only bug.**
      `src/i18n/useTranslation.tsx:19` writes the locale but never reads it, so
      the language always resets to `en` on reload.
- [ ] **Finish localization** (P3 in the 1–56 audit): theme switcher is real,
      strings are only partly translated.

### P3 — Cleanup

- [ ] **Delete or adopt `SurfaceCard.tsx`** (614 lines, 7 variants, orphaned —
      never imported). R-4 in the 1–56 audit.
- [ ] **Resolve XP semantics ambiguity.** R-5: `mockUserStats.totalXpEarned 2450`
      vs `mockUser.xp 3500`. Define current vs lifetime, then derive both.
- [ ] **Clear the 106 remaining lint warnings** (P3, R-7). All are unused
      imports/vars in pre-existing files.
- [ ] **Add CI** on `lint && typecheck && test && build` — nothing is guarded
      automatically today.
- [ ] **Add `/api` error + rate-limit conventions**, structured logging, and
      health checks before production.
- [ ] **Orphaned pages check.** 42 `page.tsx` routes; confirm every one is
      reachable and intentional (e.g. `/maintenance`, `/offline`).
- [ ] **Remove `test-results/` noise** from the working tree (gitignored, but
      Playwright leaves artefacts locally).

---

## Closed sprints

| Sprint | Commit | Summary |
|---|---|---|
| 1–56 | `2c8b149` … `ed27a83` | MVP, learning, gameplay, statistics, community, Author Studio. Audit in `docs/audit/`. |
| 57 | `b9ce7ac` | Suit centralization, `AuctionStateMachine`, `LegalBidValidator`, conventions/strategy layer, `confirmAuction`, engine-first tactical validation, 162 tests, 3 E2E, coverage, Playwright. Verified in `docs/audit/SPRINT_57_VERIFICATION.md`. |
| — | `886c425` | Card rank/suit symbols enlarged (all sizes, card dimensions unchanged). |
