# Sprint 58 §28 — Mock Dependency Classification

Every remaining dependency on `mockData.ts`, classified. The rule applied:
**no production user state may depend on `REMOVE`-classified data.**

Scan date: end of Sprint 58. Method: `grep -rl mockData src/`.

---

## Summary

Re-audited at the end of Sprint 59, after authentication made multi-user data
possible for the first time.

| Class | Count | Meaning |
|---|---|---|
| **SEED** | 0 remaining | Converted to database seed data |
| **REMOVE** | 0 remaining | Was production mock user state — deleted |
| **KEEP** | 7 files | Legitimate static content, not user state |
| **LABELLED → now real** | 2 files | Unblocked by sessions, migrated to PostgreSQL |
| **LABELLED → still labelled** | 2 files | Blocked on a missing data model, not on auth |
| **TEST** | 1 file | Test fixture (correct location) |

**9 real imports remain, down from 45 at the start of Sprint 58** (7 KEEP +
2 LABELLED).

---

## REMOVE — was production mock user state, now deleted

These were showing invented numbers as if they were the user's own. All are gone.

| Was | Now |
|---|---|
| `mockUser` (level 7, xp 3500, streak 12) in 6 components | `/api/dashboard` via `DashboardDataProvider` |
| `mockUserStats` (48 lessons, 78%, 2450 XP, 28 h, **3840 cards played**) | `/api/stats`, derived from persisted rows |
| `mockLessons` / `mockEpisodes` in lesson + learning-path pages | `/api/content` + `/api/progress` |
| `mockAchievements` in `AchievementGrid` | `/api/achievements` |
| `mockMissions` in `/missions` | `/api/missions` |
| `mockAllNotes` (`useState` seed) | `/api/notes` — real CRUD |
| `mockBookmarks` (`useState` seed) | `/api/bookmarks` — real CRUD |
| `mockActivity` | `recentActivity` from `/api/dashboard` |
| `mockDailyMission` | `/api/missions` |
| `mockDailyChallenges` / `mockDailyChallengeHistory` (dates relative to `Date.now()`) | `/api/missions` daily rows |
| `mockXpEntries` (14 entries relative to `Date.now()`) | `GET /api/xp/history` from the `XPEvent` log |
| `mockCertificates` / `mockExtendedCertificates` (4 "earned" certificates) | `/api/certificates`, derived from lesson completion |
| `mockNotifications` (hardcoded unread count) | `/api/notifications`, derived from activity |
| `mockQuizQuestions` + browser-side grading | `/api/content` (no key) + `/api/quiz/check` + `/api/quiz-attempts` |
| `ProgressionMasteryWidget` `defaultStats` (15 lessons, 84%, 1540 rating) | deleted; the component now renders nothing without real stats |
| `SkillRadar` `defaultSkillProfile` (static radar) | still static — see Known gaps |
| `LearningHeatmap` `Math.random()` generator | real 30-day heatmap from XP events |
| `const timeLeft = 365` (fake 6:05 countdown) | real seconds to end of day |
| `"Confidence", value: 78` | deleted; no such metric exists |

---

## KEEP — legitimate static content, not user state

These describe the *product*, not the *user*. They are not persistence bugs and
migrating them would be wasted work.

| File | Exports | Why KEEP |
|---|---|---|
| `src/app/catalog/page.tsx` | `mockCatalog` | Course catalogue copy. Static marketing content. |
| `src/app/flashcards/page.tsx` | `mockFlashcards` | Flashcard content. Static learning material, not user state. |
| `src/app/search/page.tsx` | `mockSearchResults` | Search index over static content. |
| `src/app/rewards/page.tsx` | `mockRewards` | Rewards catalogue and cosmetic item prices. |
| `src/components/landing/Features.tsx` | `mockFeatures` | Marketing copy. |
| `src/components/landing/Testimonials.tsx` | `mockTestimonials` | Marketing copy. |
| `src/components/video/VideoPlayer.tsx` | `mockCaptions` | Caption tracks for sample video. |

**Note:** `Hero.tsx` marketing claims (`"50K+"`, `"200+"`, `"15K+"`) were found
during the Sprint 58 audit and are queued in `backlog.md` as fabricated numbers
with no data source. They are marketing copy rather than user state, so they are
classified the same way, but they should be softened or sourced.

---

## LABELLED → now real (Sprint 59)

Authentication removed the stated blocker — "the database contains exactly one
user" — so these two now read from PostgreSQL and their `MultiUserNotice` is
gone.

| File | Was | Now |
|---|---|---|
| `src/app/leaderboard/page.tsx` | `mockLeaderboard`, `mockFriends` | `GET /api/leaderboard` — ranked from persisted XP, country scope from the viewer's own row, weekly/monthly summed from the `XPEvent` log |
| `src/app/profile/[id]/page.tsx` | `mockPublicProfiles`, `mockUser`, `mockAchievements` | `GET /api/profiles/[id]` — progression, unlocked achievements, real activity |

Two details worth recording, because both are things the fixture did that the
real thing must not:

- **`isCurrentUser` comes from the session, never from a request parameter.** The
  fixture carried a literal `isCurrentUser: true` field. A test asserts that
  passing `?as=<someone-else's id>` does not move the flag.
- **The public profile exposes no email address.** A test asserts Bob's real
  address does not appear in the response. The mutation was run to confirm the
  test fails when the field is added to the `select`.

Fabricated statistics were removed rather than re-derived. "Avg Score 78%",
"28 h learned", and "3840 cards played" had no persisted origin — this audit
already flagged them as REMOVE in Sprint 58 — so the profile now shows six
metrics that can be computed from real rows.

## LABELLED → still labelled (blocked on a data model, not on auth)

| File | Exports | Why it is not done |
|---|---|---|
| `src/app/friends/page.tsx` | `mockFriends` | Needs a `Friendship` model with a request/accept state machine, plus a decision on who may send a request. `online` and `lastActive` are derivable from `User.lastActiveAt`; `mutualFriends` needs the graph. |
| `src/app/community/page.tsx` | `mockCommunityPosts` | Needs `Post`, `Like`, and `Comment` models, and answers to questions authentication does not: are posts public, is there blocking or reporting, and is `likes` a counter or a table. |

Both keep their visible `MultiUserNotice`. This is a deliberate deferral, not an
oversight: a social graph is a feature area with its own moderation and privacy
design, and building it inside the authentication sprint would have meant
inventing those answers under time pressure. Scheduled as Sprint 60.

---

## TEST — correct location

| File | Note |
|---|---|
| `tests/integration/quiz.test.ts` | Compares a submitted attempt against `mockQuizQuestions` only to prove the server graded it correctly. Test-only. |

---

## Remaining known gaps (honest list, re-audited Sprint 59)

1. **`SkillRadar` still renders a static skill profile** (`defaultSkillProfile`:
   Opening Bids 84, Takeout Doubles 52, Defense 73, Slams 29, Signals 61). A real
   skill breakdown needs the Player Model (Sprint 60), which will mine the
   persisted `AuctionAction` / `PracticeAction` rows that Sprint 58 now collects.
   It is deliberately left as static rather than faked from unrelated numbers.
2. **`averageThinkingTime`** is reported as 0. Thinking time is not captured, and
   the previous 14.5s had no source.
3. **`rewards` balances** (coins 1250, stars 47, badges 3) are static. They would
   need a currency ledger; out of scope for Sprint 58.
4. **Certificates in progress** are shown, but there is no persisted
   `CourseProgress` write yet — completion is derived on read. Acceptable because
   the derived value is correct and cannot drift.
5. **The leaderboard is only as large as the real user count.** A fresh install
   has one player, so the page shows one row and an explicit empty state rather
   than padding the list to look populated. Ranking users who do not exist would
   be the same fabrication as the Sprint 58 fixture, just harder to notice.
6. **`mockSearchResults`** still backs `/search`. It is a catalogue of lessons
   that exist as real `Lesson` rows, so this is closer to KEEP than to a
   persistence gap, but the page is not reading the database.

---

## Verification

- `grep -rl 'from "@/services/mockData"' src/` → 11 real imports (from 45 at Sprint 58
  start): 7 KEEP static-content files, 4 LABELLED multi-user pages
- No production user state depends on any `REMOVE`-classified export
- typecheck 0 errors · lint 0 errors · 199 unit/integration tests · 7 E2E · build clean
