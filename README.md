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
│   ├── challenges/         # Daily challenges
│   ├── dashboard/          # Main dashboard
│   ├── flashcards/         # Spaced-repetition flashcards
│   ├── learning-path/      # Episode-based curriculum
│   ├── lesson/             # Interactive lesson viewer with video player
│   ├── missions/           # Daily & weekly missions
│   ├── notes/              # Cross-lesson notes with search & pin
│   ├── notifications/      # Notification center with filters
│   ├── onboarding/         # Farmer Bob MVP onboarding
│   ├── pricing/            # SaaS pricing page
│   ├── profile/            # User profile
│   ├── quiz/               # Quiz engine
│   ├── rewards/            # Rewards system (coins, XP, stars, badges)
│   ├── search/             # Full-text search across content
│   ├── settings/           # User settings
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
│   ├── coach/              # AI Coach chat interface
│   ├── rewards/            # Reward popup animations
│   ├── notifications/      # Notification bell dropdown
│   ├── missions/           # Mission cards & groups
│   ├── video/              # Custom video player
│   └── flashcards/         # Flashcard components
├── services/               # Mock backend services
│   ├── api.ts              # API abstraction layer
│   ├── authService.ts      # Authentication
│   ├── lessonService.ts    # Lessons API
│   ├── quizService.ts      # Quiz API
│   ├── challengeService.ts # Challenges API
│   ├── achievementService.ts
│   ├── aiCoachService.ts   # AI Coach mock responses
│   └── mockData.ts         # All mock data
├── types/                  # TypeScript interfaces
└── lib/                    # Utilities
```

## Features

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
- **XP System** — Level tiers (Novice → Legend), daily/weekly/lifetime XP tracking, animated XP popups
- **Achievements** — 12 achievements across 5 categories, 4 rarity levels, animated unlock overlay
- **Daily Challenges** — One per day with countdown, bonus XP, history view
- **AI Coach** — Floating chat interface with mock bridge coaching responses
- **Farmer Bob Onboarding** — Game-like 8-step onboarding for absolute beginners
- **Pricing** — Saas-style with Free/Premium/Pro/Elite tiers, comparison table, FAQ
- **Settings** — Theme, Language, Notifications, Privacy, Account, Subscription, Danger Zone
- **User Profile** — Avatar, country flag, level/streak badges, stats grid, achievements, certificates, learning history
- **Dark Mode** — #0B1020 base, consistent design tokens
- **Mobile First** — Responsive down to 320px wide
- **Accessibility** — Semantic HTML, ARIA labels, keyboard navigation

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

All colors defined in `globals.css` via `@theme inline`:

- `bg-primary`: #0B1020
- `bg-card`: #111827
- `bg-secondary`: #1F2937
- `primary`: #3B82F6
- `text-primary`: #F9FAFB
- `text-secondary`: #9CA3AF
- `text-tertiary`: #6B7280
- `border`: rgba(255, 255, 255, 0.08)

## Mock Backend

All data is mocked. The `src/services/` layer provides a clean API abstraction with simulated network delays (200–800ms), making it straightforward to swap in a real backend.
