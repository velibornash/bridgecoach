# Sprint 1→56 Audit — Test Results

**Date:** 2026-08-09
**Commit under test:** `2c8b149` (Sprint 51-56) + working-tree fixes from audit run
**Environment:** macOS (darwin), Node.js via nvm, Next.js 16.2.12 (Turbopack), React 19

> **Important:** No automated test framework is installed. `package.json` defines only
> `dev`, `build`, `start`, and `lint` scripts. There are no test files and no
> `test` script. The results below therefore rely on (a) the production build,
> (b) ESLint, and (c) a runtime smoke test against the built server. Adding a real
> test suite (Jest/Vitest + React Testing Library + Playwright) is a P0 gap.

---

## 1. Production build (`npm run build`)

| Check | Result | Notes |
|-------|--------|-------|
| Build exit code | ✅ 0 | Turbopack, production build |
| Prerender static routes | ✅ | 43 static (`○`), 1 dynamic (`ƒ /lesson`), `/_not-found` |
| Dynamic route | ✅ `ƒ /lesson` | Uses `use(searchParams)` — correct |
| TypeScript (Next's `typecheck`) | ✅ Clean | No type errors |

### Verified routes (all return HTTP 200 on production server)

`/` `/dashboard` `/lesson` `/play` `/tactical` `/replay` `/statistics`
`/author-studio` `/practice` `/quiz` `/auth/login` `/auth/register`
`/onboarding` `/learning-path` `/catalog` `/flashcards` `/notes` `/bookmarks`
`/achievements` `/certificates` `/leaderboard` `/friends` `/community` `/profile`
`/profile/[id]` `/challenges` `/missions` `/rewards` `/pricing` `/subscription`
`/email-preferences` `/faq` `/contact` `/about` `/search` `/settings` `/notifications`
`/error` `/404` `/maintenance` `/offline`

`/login` → 307 (client-side auth mock redirect, not a broken route).

## 2. Linting (`npx eslint .`)

| Run | Errors | Warnings |
|-----|--------|----------|
| Before audit fixes | 84 | 122 |
| **Final (after fixes)** | **0** | **105** |

All 84 errors eliminated (react-compiler purity, setState-in-effect, `require()`,
`as any` casts, create-component-in-render, unescaped entities, `Date.now`/`Math.random`
in render). Remaining warnings are non-blocking style/deprecation warnings.
Full report: `lint5.txt`.

## 3. Runtime smoke test (production server)

| Page | SSR render | Verified content |
|------|-----------|------------------|
| `/dashboard` | ✅ | "Good afternoon, Bob Smith", level badge, 3,500 XP, 7-day streak, current lesson, AI Coach insights, progression widget data |
| `/lesson` | ✅ | "NT Opening Bids", lesson 3 of 5, 60% progress, sections, example cards, "Check / Reveal Answer" |
| `/play` | ✅ | "Bridge Play", "Deal Cards", table + hand render |
| `/tactical` | ✅ | "Bidding Tactical Engine", auction + quick-bid controls |
| `/replay` | ✅ | Hand replayer route renders |
| `/statistics` | ✅ | Route renders (widget data is client-hydrated via async `getLearningStats`) |
| `/author-studio` | ✅ | "Content Author Studio", Drafts, Import/Export JSON, block editor |
| `/practice`, `/quiz`, `/login`, `/register`, `/onboarding` | ✅ | Render without server errors |

### Theme (CSS emission check)

- `.light{--color-bg-primary:#F7F4EF; …}` and full light palette emitted in compiled CSS ✅
- `--color-felt` present in both `@theme` (dark) and `.light` overrides ✅
- `body` uses `var(--color-bg-primary)` / `var(--color-text-primary)` so theme switch restyles whole app ✅
- Toggle itself is client-side (`ThemeProvider` + `useEffect`); verified by code review, not by headless browser (no browser automation installed).

## 4. Known functional gaps observed (see GAPS report)

- No persistence: progress/XP/lessons reset on reload (only Author Studio drafts persist via `localStorage`).
- Auth is a mock (no backend, no session, no real credential validation).
- Light theme has no manual end-to-end click test (no browser automation available in this environment).
- `mockUserStats.totalXpEarned = 2450` vs `mockUser.xp = 3500` — semantic mismatch flagged (current vs lifetime XP) — low priority, ambiguous by design.

## 5. Severity summary

| Class | Count |
|-------|-------|
| P0 (blocks Sprint 57) | 1 — no automated test coverage |
| P1 | 2 — no backend/persistence; auth is mock |
| P2 | 4 — orphaned SurfaceCard (614 lines, unused); light-theme unverified E2E; remaining mock-data semantics; no network/error handling |
| P3 | several — minor entity/copy warnings |
