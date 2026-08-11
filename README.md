# Bridge Coach

A modern, interactive learning platform for Contract Bridge. Built with Next.js, TypeScript, Tailwind CSS, and Framer Motion.

**Live demo:** [https://bridgecoach.vercel.app](https://bridgecoach.vercel.app)

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Animation | Framer Motion |
| Icons | Lucide React |
| Fonts | Geist (Sans + Mono) |

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── achievements/       # Achievement system
│   ├── auth/               # Login, Register, Forgot Password
│   ├── bookmarks/          # Bookmarked lessons/videos/articles
│   ├── catalog/            # Course catalog with filters & sorting
│   ├── certificates/       # Course completion certificates
│   ├── challenges/         # Daily challenges
│   ├── community/          # Community feed with posts, likes, comments
├── error.tsx             # Global error boundary (500)
│   ├── contact/            # Contact/support form with type selector
│   ├── api/                # Server routes: /api/coach (AI), /api/tactical/validate
│   ├── dashboard/          # Main dashboard
│   ├── email-preferences/  # Email notification preferences
│   ├── faq/                # FAQ with accordion, categories, search
│   ├── flashcards/         # Spaced-repetition flashcards
│   ├── friends/            # Friends list with profiles & invites
│   ├── leaderboard/        # Global/friends/country/weekly/monthly rankings
│   ├── learning-path/      # Episode-based curriculum
│   ├── lesson/             # Interactive lesson viewer with video player
│   ├── missions/           # Daily & weekly missions
│   ├── notes/              # Cross-lesson notes with search & pin
│   ├── notifications/      # Notification center with filters
│   ├── onboarding/         # Farmer Bob MVP onboarding
│   ├── pricing/            # SaaS pricing page
│   ├── profile/            # User profile + [id] public profile
│   ├── quiz/               # Quiz engine
│   ├── rewards/            # Rewards system (coins, XP, stars, badges)
│   ├── search/              # Full-text search across content
│   ├── settings/           # User settings (with live theme switcher)
│   ├── statistics/         # Learning statistics with charts
│   ├── subscription/       # Plan, billing, invoices, usage
│   ├── practice/           # Free-play table (deal any hand)
│   ├── tactical/           # Tactical bidding drills with AI coach
│   └── xp/                 # XP & progress tracking
├── components/
│   ├── ui/                 # Reusable design system (17 components)
│   ├── dashboard/          # Dashboard widgets
│   ├── landing/            # Marketing page sections
│   ├── layout/             # Navbar, Footer
│   ├── lesson/             # Lesson-specific components
│   ├── quiz/               # Question type components
│   ├── xp/                 # XP animations & progress
│   ├── achievements/       # Achievement cards & unlocks
│   ├── challenge/          # Daily challenge components
│   ├── bridge/             # BBO-style bridge table, bidding box, turn highlight
│   ├── cardEngine/         # SVG playing-card engine (sizes, glyphs, overlap)
│   ├── handViewer/         # Overlapping hand fan with hover lift
│   ├── tacticalEngine/     # Deterministic deal/bidding-drill engine
│   ├── coach/              # AI Coach chat interface
│   ├── rewards/            # Reward popup animations
│   ├── notifications/      # Notification bell dropdown
│   ├── missions/           # Mission cards & groups
│   ├── video/              # Custom video player
│   └── flashcards/         # Flashcard components
├── providers/              # React context providers
│   ├── index.tsx           # Combined Providers wrapper
│   └── ThemeProvider.tsx   # Dark/Light/System theme context
├── i18n/                   # Localization
│   ├── translations.ts     # Translation keys and English values
│   └── useTranslation.tsx  # LocaleProvider and useTranslation hook
├── services/               # Mock backend services
│   ├── api.ts              # API abstraction layer
│   ├── authService.ts      # Authentication
│   ├── lessonService.ts    # Lessons API
│   ├── quizService.ts      # Quiz API
│   ├── challengeService.ts # Challenges API
│   ├── achievementService.ts
│   ├── aiCoachService.ts   # AI Coach (real AI + offline fallback)
│   ├── statsService.ts     # Learning statistics
│   └── mockData.ts         # All mock data
├── types/                  # TypeScript interfaces
└── lib/                    # Utilities
    └── ai/                 # AI provider gateway (server-side only)
```

## Features

- **Real AI Coach** — free-text bridge questions answered by a real LLM (OpenCode/OpenAI/Anthropic/Ollama) with offline fallback; hint + bid validation in tactical drills
- **Tactical Bidding Drills** — `/tactical` scenario drills with expert-line answers, BBO-style bid cards, turn highlight, and AI feedback on your calls
- **BBO-style Bridge Table** — real SVG playing cards on all four hands, adaptive fan overlap that fits mobile, warm off-white card faces
- **Interactive Lessons** — Split-screen viewer with custom video player (speed, captions, seek), card tables, bookmarking, and notes panel
- **Quiz Engine** — Single/Multiple choice, Card Select, Drag & Drop question types with instant feedback
- **Lesson Progress** — Resumable lessons, chapter tracking, section mini-grid, course completion modal
- **Episode System** — 6 episodes with Netflix-style cards, stat cards, progress breakdown
- **Mission Engine** — Daily & weekly missions with Main/Side/Bonus categories, claim rewards with particle animations
- **Rewards System** — Coins, Stars, Badges wallet, rarity color coding, animated reward popup
- **Notifications** — Bell icon with unread count dropdown, full page with filter chips, action links
- **Search** — Instant full-text search with keyboard navigation, category filters, browse mode
- **Course Catalog** — Category/difficulty/sort filters, toggle locked courses, Netflix-style card grid
- **Flashcards** — 3D flip animation, Known/Unknown/Review Later tracking, spaced repetition mock
- **Notes** — Cross-lesson notes with inline editing, pinning, search, per-lesson badges
- **Bookmarks** — Favorite lessons/videos/articles by category, hover-reveal remove
- **Video Player** — Custom HTML5 video with play/pause, progress seek, volume, captions, 0.5x–2x speed, auto-advance
- **Email Preferences** — Newsletter, reminders, marketing, weekly report, and product update toggles
- **Subscription** — Plan management, upgrade/downgrade, billing info, monthly usage, invoice history
- **FAQ** — Categorized accordion FAQ with live search and animated expand/collapse
- **Contact** — Support, feedback, bug report, and feature request forms with type selector
- **Error Pages** — 404 (Not Found), 500 (Server Error), Offline, and Maintenance pages with themed illustrations
- **Community Feed** — Social feed with achievement shares, lesson completions, milestones, likes, and comments
- **Public Profiles** — Dynamic `/profile/[id]` pages with stats, achievements, level, and activity
- **Theme Switcher** — Dark, Light, and System modes, persisted to localStorage, smooth CSS variable transitions
- **Localization Ready** — i18n architecture with `LocaleProvider`, `useTranslation` hook, English-only for now
- **Learning Statistics** — Hours, lessons, accuracy, streak, average score with weekly & monthly bar charts, category breakdown
- **Game Engine** — Complete bridge gameplay: SVG Card Engine (shuffle/deal/flip/highlight/hover), 4-player Table Engine, Deal Animation (52 cards clockwise), Trick Engine (play/collect/winner highlight), Bidding Box (PASS/DOUBLE/REDOUBLE/1-7/NT)
- **Bidding Timeline** — Animated vertical bidding history with player badges and timeline dots
- **Interactive Hand Viewer** — Sortable hand by suit/rank, suit filtering, hover effects, distribution bar
- **Practice Mode** — Free exploration with no scoring, deal button, full gameplay loop
- **Game Demo** — Interactive showcase combining all game engines
- **Error Pages** — 404 (Not Found), 500 (Server Error), Offline, and Maintenance pages with themed illustrations
- **Email Preferences** — Newsletter, reminders, marketing, weekly report, and product update toggles
- **Subscription** — Plan management, upgrade/downgrade, billing info, monthly usage, invoice history
- **FAQ** — Categorized accordion FAQ with live search and animated expand/collapse
- **Contact** — Support, feedback, bug report, and feature request forms with type selector
- **Community Feed** — Social feed with achievement shares, lesson completions, milestones, likes, and comments
- **Public Profiles** — Dynamic `/profile/[id]` pages with stats, achievements, level, and activity
- **Theme Switcher** — Dark, Light, and System modes, persisted to localStorage, smooth CSS variable transitions
- **Localization Ready** — i18n architecture with `LocaleProvider`, `useTranslation` hook, English-only for now

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Build

```bash
npm run build
npm start
```

## Design Tokens

All colors defined in `globals.css` via `@theme inline` with `.light` class overrides:

| Token | Dark | Light | Purpose |
|-------|------|-------|---------|
| `bg-primary` | #070B1A | #F8FAFC | Page background |
| `bg-card` | #0F1629 | #FFFFFF | Card background |
| `bg-secondary` | #1A2340 | #F1F5F9 | Surface/secondary bg |
| `primary` | #6366F1 | #4F46E5 | Primary (indigo) |
| `accent` | #22D3EE | #0891B2 | Accent (cyan) |
| `text-primary` | #F1F5F9 | #0F172A | Primary text |
| `text-secondary` | #94A3B8 | #475569 | Secondary text |
| `text-tertiary` | #64748B | #94A3B8 | Tertiary text |
| `border` | rgba(255,255,255,0.06) | rgba(0,0,0,0.06) | Borders |

## Mock Backend

All data is mocked. The `src/services/` layer provides a clean API abstraction with simulated network delays (200–800ms), making it straightforward to swap in a real backend.

## AI Integration

Real AI calls run **server-side only** through `src/lib/ai/`. Configure at least one provider in `.env` (see `.env.example`); without any, the app falls back to the built-in offline coach.

| Provider | Env keys | Notes |
|----------|----------|-------|
| OpenCode (default) | `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY` | Go → Zen → fallback chain, no extra accounts needed |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o-mini` by default |
| Anthropic | `ANTHROPIC_API_KEY` | `claude-sonnet-4-20250514` by default |
| Ollama (local) | `AI_PROVIDER=ollama` | free, runs on localhost |

Where AI is used: **AI Coach chat** (message bubble, bottom-right), the **Hint** button in tactical drills, and **bid validation** in tactical drills (`/api/tactical/validate`).

## SEO

`/sitemap.xml`, `/robots.txt`, Open Graph + Twitter images (`next/og`), JSON-LD structured data, and full metadata in the root layout. Set `NEXT_PUBLIC_SITE_URL` for the canonical domain and `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` for Search Console verification.
