# Sprint 51 — Design System 2.0 & Premium Experience

> Bridge Coach visual identity: premium members-only bridge club with modern interactions and timeless elegance.

## Vision

Avoid: corporate enterprise, gaming website, typical online course platform.

Inspiration: Apple simplicity · Chess.com clarity · Duolingo friendliness · MasterClass premium presentation.

Visual language: dark walnut wood · green bridge cloth · premium glass panels · subtle gold accents · elegant shadows · rounded corners · layered depth.

---

## Design Tokens

All tokens live in `src/app/globals.css` (`@theme inline`) and `src/design-system/tokens.ts`.

### Surface System

| Variant | Usage | Component |
|---------|-------|-----------|
| Primary | Default cards | `Surface`, `Card` |
| Secondary | Nested content | `Surface variant="secondary"` |
| Elevated | Modals, stats | `Surface variant="elevated"` |
| Glass | Overlays, hero panels | `GlassCard` |
| Premium | Hero, achievements | `GlassCard variant="premium"` |

### Typography (max 6 styles)

| Variant | Class | Usage |
|---------|-------|-------|
| Hero | `Typography variant="hero"` | Dashboard hero, landing |
| Heading | `Typography variant="heading"` | Page titles |
| Section Title | `Typography variant="sectionTitle"` | Card headers |
| Body | `Typography variant="body"` | Paragraphs |
| Caption | `Typography variant="caption"` | Secondary text |
| Label | `Typography variant="label"` | Badges, metadata |

### Spacing

Strict 4px / 8px grid. Use Tailwind spacing scale: `1=4px`, `2=8px`, `4=16px`, `6=24px`, `8=32px`.

### Semantic Colors

| Token | Purpose |
|-------|---------|
| `--color-success` | Completed actions |
| `--color-warning` | Caution states |
| `--color-danger` | Errors |
| `--color-info` | Information |
| `--color-premium` | Gold accents |
| `--color-ai` | AI Coach features |
| `--color-xp` | Experience points |
| `--color-locked` | Locked content |
| `--color-completed` | Finished items |

### Motion System

Presets in `src/design-system/motion.ts`:

- `cardHover` — card scale + lift
- `fadeUp` — entrance animation
- `pageTransition` — route changes
- `badgeUnlock` — achievement unlock
- `progressRing` — animated rings

All animations respect `prefers-reduced-motion`.

---

## Component Library

### Foundation UI (`src/components/ui/`)

- `Typography` — text hierarchy
- `Surface` — surface variants with hover
- `GlassCard` — glassmorphism panels
- `PremiumMetric` — animated metric with progress bar
- `ProgressRing` — circular progress
- `Skeleton` / `SkeletonCard` — loading states
- `EmptyState` — guided empty states

### Card Library (`src/components/cards/`)

- `LessonCard` — lesson with progress
- `CourseCard` — catalog course with ring
- `AchievementCard` — badge with rarity
- `StatisticCard` — metric display
- `MissionCardPremium` — daily/weekly missions
- `RecommendationCard` — AI recommendations
- `PracticeHandCard` — bridge hand practice

### Statistics (`src/components/statistics/`)

- `SkillRadar` — 5-axis skill profile
- `LearningHeatmap` — activity grid
- `StreakCalendar` — streak visualization
- `ProgressChart` — bar charts
- `AccuracyGraph` — line graph
- `MasteryIndicator` / `MasteryPanel` — mastery bars
- `ConfidenceScore` — confidence ring

### Empty States

Presets: `lessons`, `friends`, `bookmarks`, `achievements`, `statistics`, `generic`.

Each includes illustration, copy, and CTA.

---

## Premium Dashboard Hero

`src/components/dashboard/PremiumHero.tsx` — emotional center of the dashboard.

Includes:
- Time-based greeting
- Level + streak
- Daily objective with progress ring
- Weekly metrics
- Next lesson CTA

---

## Accessibility

- WCAG contrast via semantic color tokens
- `focus-visible` outline on all interactive elements
- `role` and `aria-*` on charts and progress indicators
- `prefers-reduced-motion` disables animations
- Semantic HTML via Typography `as` prop

---

## Usage Example

```tsx
import { Typography, GlassCard, EmptyState } from "@/components/ui";
import { LessonCard } from "@/components/cards";
import { SkillRadar, defaultSkillProfile } from "@/components/statistics";

<GlassCard variant="premium" className="p-6">
  <Typography variant="sectionTitle">Continue Learning</Typography>
  <LessonCard lesson={lesson} />
</GlassCard>

<SkillRadar skills={defaultSkillProfile} />
```

---

## Next Sprints

- **Sprint 52** — Universal Learning Engine (block-based renderer)
- **Sprint 53** — Bridge Tactical Engine
- **Sprint 54** — Advanced Progression Framework
- **Sprint 55** — Replay & Analysis Framework
- **Sprint 56** — Content Author Studio

After Sprint 56: AI Coach, Adaptive Learning, Personalized Study.
