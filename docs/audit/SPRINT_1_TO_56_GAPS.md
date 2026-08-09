# Sprint 1→56 Audit — Gap Analysis

**Date:** 2026-08-09

## 1. Blocker gaps (fix before Sprint 57)

| Gap | Details | Why it blocks | Suggested fix |
|-----|---------|---------------|---------------|
| **No automated tests** | Zero test files; no `test` script in `package.json` | Regressions are unguarded; 44 routes, game engine and lesson engine are the risk surface | Add Vitest + React Testing Library + Playwright; CI gate on `lint && test && build` |
| **No persistence / backend** | All data from `src/services/mockData.ts`; only Author Studio saves via `localStorage` | User progress, XP, lessons, certificates vanish on reload; "READY" status is misleading | Introduce a service layer + API routes + DB (e.g., SQLite/Postgres via Next route handlers), migrate mockData consumers |
| **Auth is a mock** | `/login`/`/register` validate against nothing; no session, no cookie, no security | Multi-user features (friends, leaderboard, profile) are fake | Real auth (NextAuth/credential + hashed passwords + session) |

## 2. Notable gaps (should fix in Sprint 57)

| Gap | Details | Severity |
|-----|---------|----------|
| `SurfaceCard.tsx` orphaned | 614-line, 7-variant card system never imported; contains dead hover/tap logic (now fixed but still unused) | P2 |
| Light theme untested E2E | CSS verified emitted; toggle behavior verified only by code review (no browser automation available) | P2 |
| XP semantics ambiguous | `mockUserStats.totalXpEarned 2450` vs `mockUser.xp 3500` | P2 |
| No loading/error states | Async `getLearningStats`/`getLessonContent` have no failure handling | P2 |
| Localization partial | Theme switcher real; i18n only partly applied | P3 |
| Hero constants | `weeklyProgress`, `currentLesson` in `PremiumDashboardHero` are page-local literals, not wired to state | P3 |
| 105 lint warnings | Style/deprecation warnings remain | P3 |

## 3. Gaps fixed during this audit run

- Lint errors 84 → 0 (react-compiler purity, setState-in-effect, `require()`, `as any`, entities, render-time `Date.now`/`Math.random`)
- `interactive_board` block crash in BlockRenderer
- Tactical drill runtime crash (suit-key mapping, render-phase ref)
- Dashboard hero level/streak/accuracy mismatch (`17/7/84` → mockUser values)
- Leaderboard current-user entry (xp 2450 → 3500, rank fix)
- mockUser XP/level consistency (xp 3500, xpToNextLevel 4200, level 7)
- Quiz q4 wrong answer + q6 unsolvable deck (full 52-card options, valid 16 HCP balanced hand)
- `@theme inline` → `@theme` (light theme actually emits variables)
- Light theme missing `--color-felt` token (added)
- Dead components wired: ProgressionMasteryWidget → `/statistics`, HandReplayer → `/replay`, TacticalEngine → `/tactical`
- Author Studio completed (was scaffold: edit/duplicate/reorder, drafts, import/export, preview)
- CardSelect generic copy + submit threshold vs `correctCards.length`

## 4. Suggested Sprint 57 scope

1. Add test infrastructure + smoke tests for the 5 core routes and game engine.
2. Stand up persistence (service layer + DB) and real auth.
3. Remove or adopt `SurfaceCard` (delete if unused).
4. Wire hero/progression metrics to real state; add loading/error handling.
