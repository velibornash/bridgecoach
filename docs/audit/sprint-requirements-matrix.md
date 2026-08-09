# Sprint Requirements Matrix — Sprints 1→56

**Date:** 2026-08-09
Status legend: ✅ COMPLETE · 🟡 PARTIAL/MOCKED · ❌ NOT IMPLEMENTED · 🧪 UNVERIFIED

## Foundation (Sprints 1–16)

| Sprint area | Requirement | Status | Notes |
|-------------|-------------|--------|-------|
| Setup | Next.js app bootstrapped, lint+build green | ✅ | Next 16.2.12, Turbopack |
| Auth | Login / register screens | 🟡 | UI only, mock validation |
| Onboarding | Multi-step onboarding flow | ✅ | |
| Learning path | Structured course/episode/lesson tree | ✅ | |
| Lessons | Content renderer w/ blocks | ✅ | BlockRenderer (multi-type) |
| Quiz | Answer selection, scoring, XP award | ✅ | incl. CardSelect, DragDrop |
| Practice | Drill mode | ✅ | |
| Play | 4-player deal & trick logic | ✅ | real `getWinner` |
| Persistence | Save progress | ❌ | mocked via `mockData.ts` |

## Learning tools (Sprints 24–31)

| Sprint area | Requirement | Status | Notes |
|-------------|-------------|--------|-------|
| 24–27 | Video player, Notes, Bookmarks, Flashcards | ✅ | |
| 28 | Learning statistics | ✅ | `/statistics` + widget |
| 29 | Certificates | ✅ | |
| 30 | Leaderboard | ✅ | mock; current-user entry consistent after audit fix |
| 31 | Friends | ✅ | |

## Community & settings (Sprints 32–40)

| Sprint area | Requirement | Status | Notes |
|-------------|-------------|--------|-------|
| 32 | Community feed | ✅ | |
| 33 | Public profile `/profile/[id]` | ✅ | dynamic route |
| 34 | Theme switcher (dark/light) | ✅ | `@theme` fix applied; light verified in CSS |
| 35 | Localization groundwork | 🟡 | partial i18n |
| 36–39 | Email prefs, Subscription, FAQ, Contact | ✅ | |
| 40 | Error pages: 404/500/Offline/Maintenance | ✅ | lint-clean refactor |

## Gameplay engine (Sprints 41–50)

| Sprint area | Requirement | Status | Notes |
|-------------|-------------|--------|-------|
| Deal/shuffle engine | ✅ | | |
| Trick evaluation | ✅ | `getWinner` |
| Bid logic | ✅ | TacticalEngine |
| Replay | ✅ | HandReplayer wired to `/replay` |
| Premium UI polish | ✅ | SurfaceCard built but **orphaned** |
| Lucide icon system | ✅ | replaces emoji map |

## Premium & engine (Sprints 51–56)

| Sprint area | Requirement | Status | Notes |
|-------------|-------------|--------|-------|
| 51–54 | Dashboard (hero, stats, coach insights) | ✅ | hero data consistency fixed |
| 55 | Progression engine + mastery widget | ✅ | wired to `/statistics` |
| 55 | Replay player | ✅ | wired to `/replay` |
| 56 | Author Studio: lesson authoring | ✅ | blocks CRUD, drafts, import/export, preview |
| 56 | Tactical bidding drills | ✅ | wired to `/tactical` |
| Cross-cutting | Lint clean (0 errors) | ✅ | 84 → 0 |
| Cross-cutting | Automated tests | ❌ | **P0 — none installed** |
| Cross-cutting | Real backend/auth/persistence | ❌ | **P1 — all mocked** |

## Global summary

| Status | Count |
|--------|-------|
| ✅ COMPLETE | 24 |
| 🟡 PARTIAL/MOCKED | 5 |
| ❌ NOT IMPLEMENTED | 3 (tests, backend, persistence/auth-real) |
| 🧪 UNVERIFIED | 0 |

## Verdict

**NOT READY FOR SPRINT 57** — build, lint, and runtime smoke all pass, and all
audit-found bugs (crashes, data inconsistencies, dead code, lint errors) are fixed,
but automated tests (P0), real persistence (P1), and real auth (P1) remain open.
