# Sprint 1→56 Audit — Integration Report

**Date:** 2026-08-09

## Module map (current wiring)

```
mockData.ts ──┬─ lessons/quiz/cards ── BlockRenderer ── /lesson
              ├─ mockUser ── XPBar, WelcomeHeader, PremiumHero, DashboardHeader, profile
              ├─ mockUserStats ── Statistics widget, /statistics, profile
              ├─ leaderboard/friends/community ── /leaderboard /friends /community
              └─ achievements/certificates/activity ── /achievements /certificates profile

learningEngine/BlockRenderer ── heading/text/tip/example/hint/reveal_answer/quiz/flashcard/
                                interactive_board/divider ── used by /lesson + /author-studio preview

progression/ProgressEngine ── ProgressionMasteryWidget ── /statistics
replayEngine/HandReplayer ── /replay
tacticalEngine/TacticalEngine ── /tactical
tableEngine/TrickEngine, CardTable ── /play, interactive_board
xpService (LEVEL_THRESHOLDS) ── level/xp calculations, LevelUpModal, XPProgress
ThemeProvider ── localStorage('theme') ── applied to <html class>
```

## Integration checks performed

| Check | Result |
|-------|--------|
| 44 routes compile & serve (43 static + 1 dynamic) | ✅ |
| Shared `BlockRenderer` works for both lesson delivery and Author Studio preview (same component) | ✅ |
| XP service thresholds consistent with mockUser (level 7 ⇔ 3300–4200 XP) | ✅ |
| CardSelect submits only when selection matches a subset of `correctCards` | ✅ |
| ProgressionMasteryWidget fed derived `masteryStats` from LearningStats + mockUserStats | ✅ |
| Theme: `@theme` variables + `.light` override cascade to all `bg-*`/`text-*` utilities | ✅ |
| Nav: DashboardHeader links include /replay, /tactical, /author-studio | ✅ |
| No circular imports; no orphaned engine code except SurfaceCard | ✅ |

## Data-flow risks

1. **Single source of truth**: `mockData.ts` is the de-facto DB — every consumer imports
   the same frozen objects. Mutating shared mock arrays anywhere (e.g., a new XP gain)
   is not reflected globally because XP updates are local state, not written back.
2. **Author Studio uses `localStorage`** keys `authorStudio.current` / `authorStudio.drafts`
   — the only real persistence in the app. No migration/versioning on the schema.
3. **`/statistics` derives mastery from async `getLearningStats`** — client-hydrated; SSR
   shows a skeleton. Fine, but there is no error path.
4. **`/lesson` is dynamic (`ƒ`)** due to `use(searchParams)`; the rest are static. Confirmed
   in build output.

## Recommended next integration steps (Sprint 57)

1. Introduce `src/services/*` async API layer over a real store; keep `mockData` as seed.
2. Replace ad-hoc local XP state with a single `useProgress` context hydrated from the store.
3. Version the Author Studio localStorage schema; add import validation.
4. Delete or adopt `SurfaceCard` (unused 614-line surface system duplicates `GlassCard`/`Card`).
5. Wire hero/progression literals (`weeklyProgress`, `currentLesson`, `dailyObjective`) to state.
