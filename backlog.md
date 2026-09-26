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

- [ ] **58.2.1 API routes** (§20). Suggested set:
      `GET/POST /api/progress` · `GET/POST /api/practice` · `GET/POST /api/auctions` ·
      `GET/POST /api/quiz-attempts` · `GET /api/achievements` · `GET /api/missions` ·
      `GET/POST /api/bookmarks` + `DELETE /api/bookmarks/:id` ·
      `GET/POST /api/notes` + `PATCH/DELETE /api/notes/:id` ·
      `GET/POST /api/ai/conversations` + `POST /api/ai/messages` ·
      `GET/POST /api/author-studio/drafts` + `DELETE /api/author-studio/drafts/:id`.
      Reuse the existing two routes; no duplicates.
- [ ] **58.2.2 Refactor the service layer** (§19). `Component → Service → API → DB`.
      Replace `simulateDelay`/`mockApiCall` in `src/services/api.ts` with real
      `fetch` wrappers. Incremental — do not rewrite every component at once.
- [ ] **58.2.3 Author Studio off localStorage** (§15). `src/services/authorStudioService.ts`
      becomes API-backed; localStorage may remain as a cache but must not be
      authoritative. Preserve drafts/editing/blocks/metadata/preview/publish UX.
- [ ] **58.2.4 AI conversation persistence** (§16, §17). Persist conversations and
      messages; reference `practiceSessionId`/`handId` instead of duplicating
      hand+auction. Never persist API keys. Preserve provider/model/usage
      metadata. Conversations must survive refresh.

### 58.3 — Domain wiring

- [ ] **58.3.1 Learning progress** (§6). `completeLesson` and `saveLessonProgress`
      must actually persist. Current bug: `src/services/lessonService.ts:46`
      accepts progress and discards it.
- [ ] **58.3.2 Quiz attempts** (§6). Move grading server-side; persist score,
      correct count, per-question answers, timestamp.
- [ ] **58.3.3 Practice + auction persistence** (§7, §8, §9). Store **structured**
      `AuctionAction` rows (player, bid, timestamp, engine result) — not
      `"1NT 2C 2H 3NT"` strings. The DB stores facts; the Bridge Engine stays
      the authority. Loading an auction must reconstruct state through
      `AuctionStateMachine`. Store enough evidence of player behaviour for the
      future Player Model.
- [ ] **58.3.4 XP events + progression engine** (§10). Persist `XPEvent` rows
      (`LESSON_COMPLETED`, `QUIZ_COMPLETED`, `PRACTICE_COMPLETED`,
      `ACHIEVEMENT_UNLOCKED`, `MISSION_COMPLETED`). No component may mutate XP
      directly. `src/services/xpService.ts` remains the calculation authority.
- [ ] **58.3.5 Achievements + missions** (§13). Persist unlock/progress state;
      no duplicate state in mock fixtures. Verify trigger → refresh → persists.
- [ ] **58.3.6 Bookmarks + notes** (§14). Full create/update/delete persistence.
- [ ] **58.3.7 Dashboard from real data** (§11). Replace `mockUser`/`mockUserStats`
      in `src/app/dashboard/page.tsx:11` and the dashboard components with a
      persisted user state. A fresh dev user must have a valid empty state.
- [ ] **58.3.8 Statistics from real activity** (§12). Remove fabricated chart
      values. Specifically: `src/components/progression/ProgressionMasteryWidget.tsx:14-25`
      (`defaultStats`), `src/components/statistics/SkillRadar.tsx:121-127`
      (`defaultSkillProfile`), `src/components/statistics/LearningHeatmap.tsx:80`
      (`Math.random()` intensities), `src/app/statistics/page.tsx:72`
      (accuracy synthesised from XP), `src/app/dashboard/page.tsx:204`
      (`Confidence: 78`).
- [ ] **58.3.9 Error / loading / empty states** (§21). Every migrated operation
      handles loading, empty, validation error, server error, retry, success.
      No fake network latency, no silently swallowed persistence errors.

### 58.4 — Verification

- [ ] **58.4.1 Persistence tests** (§23). Lesson, quiz, practice, auction
      reconstruct-through-`AuctionStateMachine`, XP, achievement, mission,
      bookmark, note, author studio, AI conversation. Sprint 57's 162 tests must
      stay green.
- [ ] **58.4.2 E2E persistence journey** (§24). New user → lesson → XP →
      practice → bids → auction complete → result saved → achievement updates →
      AI conversation saved → **refresh** → all state still correct.
      This is the single most important Sprint 58 test.
- [ ] **58.4.3 Data integrity checks** (§25). No orphaned private records, valid
      FKs, correct ownership, consistent timestamps, no duplicate XP events /
      achievements / auction actions, no data loss on refresh. Enforce with
      constraints + indexes (§26).
- [ ] **58.4.4 Full regression** (§29). landing, login, dashboard,
      learning-path, lessons, quizzes, practice, bidding, tactical, replay,
      statistics, achievements, missions, rewards, bookmarks, notes, community,
      profile, Author Studio, AI Coach.
- [ ] **58.4.5 Mock dependency classification** (§28). Classify every remaining
      `mockData` / hardcoded XP / hardcoded stats / localStorage-only usage as
      `KEEP` (static content) · `SEED` (dev only) · `TEST` (fixture) ·
      `REMOVE` (production mock). No production user state may depend on `REMOVE`.
- [ ] **58.4.6 Quality gate** (§30): `npm run typecheck` · `npm run lint` ·
      `npm test` · `npm run test:coverage` · `npm run test:e2e` · `npm run build`.
- [ ] **58.4.7 Verification report** (§31):
      `docs/verification/SPRINT_58_VERIFICATION.md` with all 20 sections, every
      requirement classified `PASS` / `PARTIAL` / `FAIL` / `NOT IMPLEMENTED`.

---

## Post-Sprint 58 (queued, by priority)

### P1 — Security & correctness debt

- [ ] **59 — Real authentication** (spec not yet written). Replace hardcoded
      `mockUser` (`src/services/mockData.ts:11`) with real sign-in, hashed
      passwords, server sessions/cookies, and route protection. This unblocks
      friends / leaderboard / public profile, which are currently fake.
      Replace the dead `src/services/authService.ts` (0 importers, hardcoded
      password check at line 81) and the disposable-token `src/services/auth.ts`.
      Swap the dev identity resolver in `src/lib/db.ts` for the real session.
- [ ] **Secure the AI endpoints.** `src/app/api/coach/route.ts` and
      `src/app/api/tactical/validate/route.ts` are unauthenticated and
      unrated-limited, and the client can override `provider`/`model` in the
      request body. Add auth + rate limiting + server-side provider pinning
      before any public deploy.
- [ ] **Remove hardcoded personal data from shipped code.**
      `velja.jagodina@gmail.com` appears as a billing email in
      `src/app/subscription/page.tsx:28` and as support contact in
      `src/app/contact/page.tsx:76,122`, `src/app/faq/page.tsx:22,40`,
      `src/app/email-preferences/page.tsx:80`. `"Velja Jagodina"` is hardcoded in
      `src/components/layout/DashboardSidebar.tsx:117-118`. These must be real
      user data (Sprint 58 / 59) or a single config constant.

### P2 — Product integrity

- [ ] **60 — Player Model.** Use the persisted `PracticeAction` /
      `AuctionAction` / `QuizAttempt` evidence to build a real skill profile:
      weakness detection, per-skill stats, and AI Coach context. Replaces the
      fabricated `ProgressionMasteryWidget` defaults.
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
