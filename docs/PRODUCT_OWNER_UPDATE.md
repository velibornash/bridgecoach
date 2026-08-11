# Product Owner Update — Real AI Coach, Tactical Drills, Table Polish & SEO

**Date:** 2026-08-11
**Scope:** this delivery (uncommitted work to be committed together).

---

## 1. What was done

### Real AI integration (server-side gateway)
- New **AI gateway** (`src/lib/ai/gateway.ts` + `providerClient.ts` + `types.ts`) — a single typed entry point for all AI calls, ported from the QALabAI gateway.
- **4 providers supported:** OpenCode (managed, default), OpenAI, Anthropic, Ollama (local).
  - OpenCode uses a **Go → Zen → Zen-fallback** fallback chain so the app keeps working when one endpoint is rate-limited or exhausted.
  - Automatic retries with backoff, typed error classification (invalid credentials / rate limit / provider down / bad request), and token estimation when the provider does not report usage.
- **All keys stay server-side** — nothing AI-related is ever exposed to the client bundle.
- `.env.example` documents every provider option. Without any key, the app **degrades gracefully to the offline coach** instead of breaking.
- Unit tests for provider resolution and the OpenCode fallback chain (68 tests total, all green).

### Tactical bidding drills — now powered by real AI
- **AI Coach chat (bottom-right message bubble)** — ask any bridge question in free text; answered by the real AI (confirmed working by the client).
- **"Show hint" in a bidding drill** — the AI explains the correct bid for the exact deal, auction, dealer and vulnerability.
- **Bid validation** — when the player makes a bid in a drill, the AI judges whether it is a good expert call for that exact deal and returns: `correct`, `suggestedBid`, and a short explanation. Falls back to the deterministic expert-line check when AI is unavailable.
- Deterministic bridge engine still computes the expected bid locally, so drills always have a correct answer even offline.

### Table & card polish (BBO-style)
- `BridgeTable` rewritten to render **real SVG playing cards** (`CardEngine`) on all four hands instead of text chips — rank + suit glyphs, felt-green table, overlapping E/W hands.
- **Adaptive fan overlap** for N/S hands — all 13 cards always fit the row (desktop and mobile), measured with a `ResizeObserver`.
- **Bigger, cleaner card glyphs** — corner rank/suit and center suit enlarged; card face warmed from stark white to `#FDFDF7`.
- **HandViewer overlap mode** with hover lift, used on practice and tactical pages.
- **Turn highlight** — the current bidder's position is highlighted on the table during drills.
- **BBO-style bid cards** in the bidding box on the tactical page.
- Dashboard **"Play this hand"** now navigates straight to the practice table.

### Google SEO
- Full metadata in the root layout: title template, description, keywords, canonical, Open Graph, Twitter card, robots, `metadataBase`.
- `sitemap.xml` (18 public routes), `robots.txt`.
- **Dynamic OG / Twitter images** generated with `next/og` (1200×630 PNG, brand felt-green + gold + fan of cards).
- **JSON-LD structured data** (`Organization`, `WebSite`, `LearningResource`) for rich Google results.
- Google Search Console verification token supported via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.

---

## 2. Exactly where real AI is used

| Option / screen | Where | What the AI does | Offline fallback |
|---|---|---|---|
| **AI Coach chat** | Message bubble, bottom-right on any page (component `AICoach`, route `/api/coach`) | Answers free-text bridge questions | Built-in canned answers for the 7 suggested questions |
| **Hint button** in a tactical drill | Tactical page → "Hint" | Explains the best bid for the current deal & why | Static "expected bid" note |
| **Bid validation** in a tactical drill | Tactical page → after you pick a bid | Judges if your bid is an expert call; returns correct/suggested/explanation | Deterministic engine verdict |

Everything else (content, progress, quizzes) is still the mock backend.

---

## 3. Known limitations

- **AI bid validation is not yet reliable on some convention auctions.** Example: after `1NT – 2♣ (Stayman)` with opener holding 4 spades, the AI occasionally suggests `2♦` (denies a 4-card major) even though it correctly states the opener has 4 spades. Cause: the reasoning model is called with thinking disabled for speed. **Recommendation:** add deterministic pre-checks for the common conventions (Stayman/transfers) before calling the AI, or enable the model's reasoning mode for the validate route only.

---

## 4. Suggested next steps (my recommendations)

1. **Fix AI bid-validation correctness** on conventions (deterministic Stayman/transfer layer + optional reasoning mode) — most important, directly affects teaching quality.
2. **Streaming AI responses** (SSE) for the coach chat — feels much more responsive.
3. **Rate limiting + per-user AI quota** — protect against API cost abuse once real users sign in.
4. **Persist data in a real backend** — all content/progress is mocked today; swap `services/` for a real API + DB (Supabase/Postgres).
5. **Persist AI conversation history** — chat resets on reload currently.
6. **Serbian (SR) localization** — app is English-only; i18n layer already exists, just needs translations + a language toggle.
7. **Auth** — login/register are mocked; connect to a real auth provider (NextAuth/Clerk).
8. **More tactical scenarios** — extend the drill library (preempts, weak twos, slam bidding, defense signals).
9. **Sound effects** for card play / trick collection.
10. **PWA** — manifest, offline support, "Add to Home Screen" for a native-like feel.
11. **Google Analytics / Search Console dashboards** — verify SEO impact once deployed; submit sitemap.

---

## 5. Files touched in this delivery

- `src/lib/ai/*` — gateway, provider clients, types (new)
- `src/app/api/coach/route.ts` — AI chat + hints (server)
- `src/app/api/tactical/validate/route.ts` — AI bid validation (new)
- `src/services/aiCoachService.ts` — client side of AI coach + hints + validation
- `src/components/tacticalEngine/TacticalEngine.ts` — drill engine
- `src/app/tactical/page.tsx`, `src/app/dashboard/page.tsx`
- `src/components/bridge/BridgeTable.tsx`, `src/components/bridge/BidCard.tsx`
- `src/components/cardEngine/CardEngine.tsx`, `src/components/handViewer/HandViewer.tsx`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx` (SEO, new)
- `src/components/seo/JsonLd.tsx`, `src/lib/seo/ogImage.tsx` (new)
- `README.md`, `.env.example`, `tests/unit/ai/gateway.test.ts`
