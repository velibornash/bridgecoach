# Bridge Coach — User Manual

**Version:** Sprint 60 · **Date:** 2026-09-26 · **Branch:** `main` · **Commits:** 45

This is the complete operating manual for the Bridge Coach app: what it does, how
to run it, how each feature works, how to administer it, and — stated plainly —
what it does not do yet.

---

## Table of contents

1. [What this app is](#1-what-this-app-is)
2. [Requirements](#2-requirements)
3. [First-time setup](#3-first-time-setup)
4. [Running the app](#4-running-the-app)
5. [Signing in](#5-signing-in)
6. [The admin area](#6-the-admin-area)
7. [Password reset](#7-password-reset)
8. [Feature tour](#8-feature-tour)
9. [Configuration reference](#9-configuration-reference)
10. [Database](#10-database)
11. [Tests and quality gates](#11-tests-and-quality-gates)
12. [Deployment to a server](#12-deployment-to-a-server)
13. [Configuration in this workspace](#13-configuration-in-this-workspace)
14. [Troubleshooting](#14-troubleshooting)
15. [What is not implemented](#15-what-is-not-implemented)
16. [Architecture in one page](#16-architecture-in-one-page)

---

## 1. What this app is

Bridge Coach is a contract-bridge learning app. It teaches bidding, play, and
defence through a real bidding engine, drills, quizzes, and a persisted
progression system, and it tracks a learner's real practice rather than
displaying invented numbers.

**The governing rule of the whole codebase:** the bridge engine is the authority
for legality and auction state. The database stores facts and events. It never
re-derives or overrides a bidding judgement.

Everything a learner sees is read from PostgreSQL. As of Sprint 60 there are no
fabricated user statistics anywhere in the product.

---

## 2. Requirements

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ | Uses `fetch` and modern ESM |
| PostgreSQL | 15+ | Developed against 18.4 |
| npm | 10+ | Ships with Node |

Optional, only for real email: a [Resend](https://resend.com) account (free tier
is enough). Without it, password reset still works in development.

---

## 3. First-time setup

```bash
cd ~/Desktop/bridgeCoach
npm install
cp .env.example .env          # then edit it — see §9
createdb bridgecoach         # the main database
npm run db:deploy            # apply migrations
npm run db:seed              # courses, lessons, quizzes, the owner account
npm run dev                  # http://localhost:3000
```

`npm install` runs `prisma generate` automatically via `postinstall`.

### The test database

Integration tests use a **separate** database so they cannot corrupt your
development data:

```bash
createdb bridgecoach_test
npm run db:test:setup        # migrations + seed, against the test database
```

You do not need to create `.env.test`. The URL is derived automatically by
appending `_test` to your development database name. To override it, put
`TEST_DATABASE_URL` in the environment or a `DATABASE_URL` in `.env.test`.

Check what the tests will use:

```bash
npm run db:test:url          # prints the resolved URL
```

---

## 4. Running the app

```bash
npm run dev        # development, hot reload, http://localhost:3000
npm run build      # production build
npm start          # serve the production build
```

### All commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | All unit + integration tests (Vitest) |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only (needs PostgreSQL) |
| `npm run test:e2e` | Playwright browser tests (needs a free port 3000) |
| `npm run test:all` | All three suites in order |
| `npm run test:coverage` | Tests with a coverage report |
| `npm run db:migrate` | Create + apply a migration (dev) |
| `npm run db:deploy` | Apply existing migrations (prod/CI) |
| `npm run db:seed` | Seed content and the owner account |
| `npm run db:reset` | **Destructive.** Drop, re-migrate, re-seed |
| `npm run db:studio` | Prisma Studio, browse the database |
| `npm run db:validate` | Validate `schema.prisma` |
| `npm run db:test:setup` | Migrate + seed the test database |
| `npm run db:test:url` | Print the resolved test database URL |

> **`db:reset` destroys all data.** There is no confirmation beyond Prisma's own
> `--force` flag.

---

## 5. Signing in

### Accounts must be approved

Registration creates a **pending** account. It cannot sign in until an owner
approves it from `/admin`. You will see:

> Your account is waiting for approval. You will be able to sign in once an
> administrator approves it.

This is enforced in two places, deliberately: the login handler refuses a pending
account, and `getSessionUser()` refuses a session whose account is no longer
active. The second check is what makes suspending someone take effect
immediately rather than at their next sign-in.

### The session cookie

Sessions are server-side rows. The browser holds only a signed, `httpOnly`,
`sameSite=lax` cookie; the token itself is stored in PostgreSQL as a SHA-256
hash. Consequences worth knowing:

- Signing out on one device does not sign you out elsewhere. Use "change
  password" or reset to revoke other sessions — both revoke all others.
- A database leak does not hand out live sessions.
- No token is ever returned in a response body, so a script cannot read it.

### The development identity

Outside production only, a request with no session is attributed to
`DEV_USER_EMAIL` when `ALLOW_DEV_IDENTITY=true`. This is what lets you work on
the app without signing in on every request.

**In production it is refused unconditionally.** The guard returns before it even
reads the flag, so no environment combination can re-enable it. A test verifies
this by removing the guard and confirming the test fails.

---

## 6. The admin area

`/admin` — owner and admin accounts only. Everyone else gets 403; signed-out
callers get 401.

### Registration requests

Every new registration appears with its email, name, country, experience level,
and submission time. Two actions:

| Action | Effect |
|---|---|
| **Approve** | Account becomes `active` and can sign in. Any pre-existing sessions are deleted. |
| **Reject** | Account becomes `rejected` and can never sign in. Any sessions are deleted. |

A rejected address can be approved later, and re-approving also resets the
password. Deciding an already-decided request is refused rather than silently
overwriting the earlier decision.

### Granting an account directly

`PUT /api/admin/registrations` creates or resets an active account without a
prior request. Use this for onboarding a teammate by another channel.

### Reports

Reports filed from the community appear in the queue at the top of `/admin`,
with the reported content resolved inline so you can judge without opening
anything.

**Filing a report changes nothing.** No post is hidden, no account suspended, no
automatic action. That is deliberate: if reporting auto-hid content, one user
could remove another's post by clicking a button, which is the abuse the queue
exists to prevent. **You** decide, by closing the report.

A report cannot be closed twice, and the same person reporting the same thing
twice updates nothing rather than flooding the queue.

### Blocking

Any user can block another. A block is one-directional and personal:

- the blocker cannot send a friend request to the blocked user, and vice versa
- pending friend requests between them are cancelled
- the blocked user's posts and comments are hidden from the blocker's feed

It is **not** moderation. Nothing is removed for anyone else, and no account is
suspended. Only an owner acting on a report does that.

### Outgoing email

The lower half of `/admin` lists recent messages. In development this is your
**local mailbox**: every password reset link is recorded here and can be clicked
directly. This is how the reset flow is tested without any mail provider.

With `RESEND_API_KEY` set, this becomes the delivery log — sent, failed, and the
error text if any.

> This panel contains password reset links. It is admin-only by design and must
> never be exposed to ordinary users.

### Roles

| Role | Can |
|---|---|
| `owner` | Everything an admin can, plus is the seeded identity |
| `admin` | Approve/reject registrations, read the mailbox, delete any post |
| `user` | Use the app; manage own content only |

Set by `prisma/seed.ts` on the `DEV_USER_EMAIL` account, or by promoting a row in
Prisma Studio.

---

## 7. Password reset

Available at `/auth/forgot-password`.

1. Enter the address and submit.
2. The response is **always** the same, whether or not the address exists —
   otherwise the form becomes a way to discover who is registered.
3. In development, the link appears at `/admin`. In production it arrives by
   email.
4. Follow the link to `/reset-password`, choose a new password.

Guarantees:

- The token is stored hashed, so a database leak yields no working link.
- It works **once**. A replay is refused.
- It expires after one hour.
- Setting a new password **revokes every other session** — the point of a reset
  is to remedy a suspected compromise.
- At most 3 requests per address per hour. The throttled response is
  indistinguishable from the success response.

If you did not request a reset, ignore the message. Nothing has changed.

---

## 8. Feature tour

### Public pages (no sign-in needed)

`/` · `/about` · `/contact` · `/faq` · `/pricing` · `/catalog` · `/maintenance` ·
`/offline` · `/login` · `/auth/login` · `/auth/register` · `/auth/forgot-password` ·
`/reset-password`

Everything else requires a session and redirects to `/login?next=…`, returning
you to where you were headed after signing in.

### Learning

| Page | What it does |
|---|---|
| `/dashboard` | Real progression, level, XP, streak, next lesson, daily challenge |
| `/learning-path` | Ordered course and lesson structure from the database |
| `/lesson/[id]` | Lesson content, sections, completion |
| `/practice` | Full bidding practice with a real engine. Bids and cards are recorded, so practice history accumulates |
| `/play` | Play mode |
| `/replay` | Review previous hands, reconstructed through the state machine |
| `/flashcards` | Static drilling material |
| `/quiz` | Server-graded quizzes; attempts persisted |
| `/tactical` | Bidding/lead/card validation against the engine |
| `/challenges` | Challenge definitions |

### Progress and records

| Page | What it does |
|---|---|
| `/progress` | Per-lesson and per-course completion |
| `/statistics` | Derived statistics, a real 30-day XP heatmap, and a **skill profile computed from your own auctions** |
| `/xp` | XP event log |
| `/achievements` | Catalogue merged with your real unlock state |
| `/missions` | Missions and the daily mission |
| `/certificates` | Derived from lesson completion. Download produces a real PDF file |
| `/notes` | Real CRUD, searchable, per-lesson |
| `/bookmarks` | Real CRUD |
| `/rewards` | Rewards catalogue and cosmetic prices (static) |
| `/statistics`, `/profile` | Your public-facing profile |

### Social

| Page | What it does |
|---|---|
| `/leaderboard` | Ranked by real XP. Global, country, weekly, monthly. Weekly/monthly sum the `XPEvent` log, not the cached total. Shows your own rank even when outside the top 50. |
| `/friends` | Request/accept. Online status derived from `lastActiveAt`; mutual-friend counts computed from the graph. |
| `/community` | Real posts with per-user likes and comments. Composer, four categories, soft delete. Posts and comments are rate limited. |
| `/profile/[id]` | Another player's public profile. Progression, achievements, activity. **No email address is ever exposed.** |
| `/friends` → send a request | From the leaderboard or a profile |
| `/search` | Real database search over lesson titles, descriptions, and **full lesson text**. Case-insensitive, ranked, with a real count in the idle state. |

**Ranking against real players only.** A fresh install has one player, so the
leaderboard shows one row and an explicit empty state rather than padding the list
with fiction.

### AI coach

`/coach` (chat) and `/tactical/validate` (bid checking).

- Provider and model are **pinned server-side**. Anything the client sends is
  ignored — that would leak your configuration and let a caller pick the most
  expensive model.
- Quota is charged to your **user id**, not to a forwarded address, which the
  caller can forge.
- Prompts are length-capped.

### Author studio

`/author-studio` — create and edit courses, lessons, and quizzes. Role-gated for
privileged operations.

### Settings — what each control actually does

`/settings` is real. Every control writes, and the three privacy toggles are
enforced rather than decorative:

| Control | Effect |
|---|---|
| **Theme** | Applies and persists immediately. No Save button, because there is no second step. |
| **Language** | Saved. Only English is translated; the other options are disabled and marked "soon" rather than silently doing nothing. |
| **Notifications** | Saved. **No delivery exists yet** — there is no email or push system behind these. The section says so. |
| **Show Profile** | Enforced. Off means the public profile returns 404 to everyone except its owner. |
| **Show Activity** | Enforced. Off means recent activity is omitted from the public profile. |
| **AI Coach Data** | Enforced. Off makes `/api/coach` refuse with a clear message rather than ignoring the setting. |
| **Account fields** | Name, country and experience level are written by `PATCH /api/profile`. |
| **Email** | **Read-only.** Changing it needs a verification step that is not built. |
| **Change Password** | Real. Uses the same endpoint as the reset flow, and signs out every other device. |

### Other

`/settings` · `/email-preferences` · `/notifications` · `/onboarding` ·
`/subscription` · `/search` · `/community`

---

## 9. Configuration reference

All configuration lives in `.env`. **Never commit it.**

### Database

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql://user:pass@host:5432/dbname?schema=public` |

### Authentication

| Variable | Required | Notes |
|---|---|---|
| `SESSION_SECRET` | **yes in production** | Signs session cookies. The app refuses to start in production without it. Length is not validated, so use at least 32 characters: `openssl rand -base64 32`. |
| `DEV_USER_EMAIL` | dev | The development identity. Also the account seeded as `owner`. |
| `DEV_USER_PASSWORD` | dev | Enables sign-in for that account. **Changing it requires re-running `npm run db:seed`** — the seed only re-hashes on a seed run. |
| `ALLOW_DEV_IDENTITY` | dev | `true` attributes cookie-less requests to the dev user. Ignored entirely in production. |
| `BCRYPT_COST` | no | Default 12. Accepted range is 10–15; anything outside it is ignored and 12 is used. OWASP's floor is 10. Measured ~330 ms hash / ~380 ms verify. |

### Email (password reset)

| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | production | Free tier: 3,000/month, 100/day, no card. Unset in development → messages are recorded locally instead. |
| `SITE_URL` | **yes in production** | Absolute base URL for links. A relative link in an email goes nowhere; the app throws rather than send one. |
| `MAIL_FROM` | no | Must be on a domain verified with Resend. Defaults to `noreply@<SITE_URL domain>`. |
| `OWNER_EMAIL` | no | Who gets "new registration" notifications. Defaults to `DEV_USER_EMAIL`. |

### AI provider

| Variable | Notes |
|---|---|
| `AI_PROVIDER` | Which backend to use |
| `OPENCODE_ZEN_API_KEY` / `OPENCODE_ZEN_MODEL` | Primary model |
| `OPENCODE_ZEN_FALLBACK_MODEL` | Used if the primary fails |
| `OPENCODE_GO_API_KEY` / `OPENCODE_GO_MODEL` | Alternative backend |

---

## 10. Database

PostgreSQL. **39 models, 18 enums, 40 tables, 10 migrations.**

### Core tables

| Area | Tables |
|---|---|
| Identity | `User`, `Profile`, `Session`, `AuthEvent`, `PasswordResetToken`, `RegistrationRequest` |
| Content | `Course`, `Episode`, `Lesson`, `Quiz`, `QuizQuestion` |
| Progress | `LessonProgress`, `CourseProgress`, `XPEvent`, `UserMission`, `UserAchievement`, `Activity` |
| Play | `Hand`, `Auction`, `AuctionAction`, `PracticeSession`, `PracticeAction` |
| Authoring | `AuthorContent`, `AuthorDraft`, `AuthorRevision` |
| Social | `Friendship`, `CommunityPost`, `PostLike`, `PostComment` |
| Moderation | `BlockedUser`, `ContentReport` |
| Other | `Bookmark`, `Note`, `Mission`, `Achievement`, `AIConversation`, `AIMessage`, `OutgoingEmail` |

`Profile.preferences` holds the settings described below as a JSON column.

### Deliberate design decisions

- **`User.xp` and `User.level` are read-model caches.** The `XPEvent` log is the
  source of truth; the progression engine recomputes the caches. Period-based
  leaderboards read the log directly.
- **Only SHA-256 hashes of session and reset tokens are stored.** A database leak
  yields no live sessions and no working reset links.
- **Friendship is two rows, one per direction**, so the sender survives for the
  accept flow.
- **`PostLike` is a table, not a counter**, because "did I like this" must be
  answerable.
- **Deletion is soft** for posts and comments, so replies are not orphaned.

### Inspecting data

```bash
npm run db:studio            # browse in the browser
psql "$DATABASE_URL"         # or query directly
```

---

## 11. Tests and quality gates

### Current state

| Gate | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm run lint` | **0 errors**, 30 warnings |
| `npm test` | **333 passing**, 27 files |
| `npm run test:e2e` | 7 passing |
| `npm run build` | clean |
| `npm run test:e2e` | 7 passing, against `bridgecoach_test` |

Run everything before committing:

```bash
npm run typecheck && npm run lint && npm test && npm run build
lsof -ti:3000 | xargs kill -9   # free the port before E2E
npm run test:e2e
```

### What the tests cover

- **Sessions** — token hashing, expiry, revocation, single use
- **Passwords** — bcrypt cost, salting, malformed hashes, strength
- **Production safety** — the dev identity cannot be enabled in production
- **Approval** — pending accounts cannot sign in; status is not disclosed before
  the password is checked; only administrators reach admin data
- **Password reset** — token lifecycle, revocation of other sessions, uniform
  responses, mailbox privacy
- **Friendship** — the full request/accept state machine, asserted from **both
  users' views** so the two lists can never disagree
- **Ownership** — one user's data is invisible to another across notes,
  progress, and auctions
- **Rate limiting** — charged to the user id, not a forgeable header
- **Engine** — auction legality, reconstruction, and determinism

### Mutation checking

Several security assertions are verified by deliberately breaking the code and
confirming the test fails. This has twice caught tests that were passing without
asserting anything real. If you change a check in `src/lib/admin.ts`,
`src/lib/db.ts`, or the friendship/approval logic, consider re-running the
mutation described in `docs/verification/SPRINT_60_VERIFICATION.md` §8.

---

## 12. Deployment to a server

### Checklist

1. **PostgreSQL** installed and running; database created.
2. **Environment** — set in the service unit, never in git:
   - `DATABASE_URL`
   - `SESSION_SECRET` — `openssl rand -base64 32`
   - `SITE_URL` — the public origin, e.g. `https://yourdomain.com`
   - `RESEND_API_KEY` and `MAIL_FROM` — or password reset will throw
   - AI provider keys
   - `NODE_ENV=production`
3. **Do not set** `ALLOW_DEV_IDENTITY`, and omit `DEV_USER_PASSWORD`. Production
   refuses the dev identity regardless, but leaving the variables out removes the
   temptation.
4. **Migrate and seed:**
   ```bash
   npm ci
   npm run db:deploy
   npm run db:seed        # creates the owner account
   ```
5. **Build and serve:**
   ```bash
   npm run build
   npm start
   ```
6. **Confirm** the first visit to `/admin` works. If it 403s, no owner exists —
   run `npm run db:seed` with `DEV_USER_EMAIL` set to your address.

### Notes

- Run behind a reverse proxy with TLS. The session cookie will be sent over
  plain HTTP otherwise.
- Rate limiting is **in-process**: it resets on deploy and is not shared between
  instances. Fine for one instance; use a shared store for several.
- `Next.js 16` — the request-interception file is `src/proxy.ts`, not
  `middleware.ts`. Reading `node_modules/next/dist/docs/` before changing it is
  worth the two minutes; the conventions have changed.

---

## 13. Configuration in this workspace

Current local setup. **No credentials are reproduced here** — read them from
`.env`.

| Item | Value |
|---|---|
| Development database | `bridgecoach` (PostgreSQL 18.4, localhost) |
| Test database | `bridgecoach_test`, derived automatically |
| Owner account | the `DEV_USER_EMAIL` address in `.env` |
| AI provider | OpenCode Zen with a Go fallback |
| Email | **not configured** — reset links appear at `/admin` |
| `ALLOW_DEV_IDENTITY` | `true` |

The owner account has `role: owner` and `status: active`, granted by
`npm run db:seed`. Its name is `Velja J.`, country `RS`.

**To change the owner's password**, edit `DEV_USER_PASSWORD` in `.env` and run:

```bash
npm run db:seed
```

The seed re-hashes on every run. If it does not take effect, the most likely
cause is a trailing character in the value — a full stop at the end of a
sentence is easy to include by accident and produces a 401 that looks exactly
like a wrong password.

---

## 14. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Connection url is empty` from Prisma | `DATABASE_URL` unset. Run from the project root so `.env` is found. |
| Sign-in returns 401 with the right password | The seed's hash is stale. Run `npm run db:seed`. Also check for a trailing `.` in `DEV_USER_PASSWORD`. |
| Sign-in says "waiting for approval" | The account is `pending`. Approve it at `/admin`. |
| `/admin` returns 403 | The signed-in account is not `owner` or `admin`. Re-run `npm run db:seed`. |
| Owner cannot reach `/admin` | No owner exists. Set `DEV_USER_EMAIL` and run `npm run db:seed`. |
| Tests fail with "Development user does not exist" | The test database has no seed. Run `npm run db:test:setup`. |
| Playwright times out on the web server | Port 3000 is occupied. `lsof -ti:3000 \| xargs kill -9` |
| Password reset throws in production | `RESEND_API_KEY` or `SITE_URL` missing. Both are required; see §9. |
| No reset link in `/admin` | Expected in development when the address is unknown, pending, or throttled — all three return a uniform 202 on purpose. |
| `prisma` complains about an unknown field | The client is stale. Run `npx prisma generate`. |
| New migration needed after editing the schema | `npm run db:migrate`, then `npm run db:test:setup` for the test database. |

### Inspecting state directly

```bash
npm run db:studio
PGPASSWORD=... psql -h localhost -U postgres -d bridgecoach -c \
  'select email, role, status, "joinedAt" from "User";'
```

---

## 15. What is not implemented

Stated plainly, because a manual that only lists strengths is marketing.

### Security and identity

1. **No email verification.** Registration is gated by a human owner, which
   catches most of it, but nothing verifies the address belongs to the applicant.
2. **No multi-factor authentication.**
3. **No "log out everywhere" button.** Password change and password reset both
   revoke other sessions; there is no explicit control.
4. **Rate limiting is in-process** — resets on deploy, not shared across
   instances.
5. **No session rotation on privilege change** beyond the password paths.

### Community and social

6. **There is reporting, blocking, and a moderation queue** — see §8. What is
   still missing is the *policy* around them: no rate limit on filing reports
   beyond 10/hour, no bulk actions in the queue, and no escalation. An
   administrator must open each report and act individually.
7. **A block is a personal boundary, not moderation.** It hides one account's
   content from one account's feed and stops friend requests. It does not
   suspend anyone or remove anything for other users. Only an owner at
   `/admin` can do that, and only for reports.
8. **No friend search.** Requests are sent from the leaderboard or a profile.
9. **No email notification of a report.** The queue at `/admin` is the only
   signal that something arrived.

### Data and content

10. **Search has no full-text index.** It uses `ILIKE` against `content::text`,
    which is correct for ~10 lessons and would need a `tsvector` column and a GIN
    index at a few thousand. Ranking is title > description > body, computed in
    SQL so it happens before the row limit.
11. **`/rewards` balances are static.** No currency ledger exists.
12. **`SkillRadar` renders a static skill profile.** A real breakdown needs the
    Player Model, which will mine the persisted action rows.
13. **No thinking-time capture**, so average thinking time is reported as 0
    rather than invented.
14. **Study time is not tracked**, so no hours-learned figure is shown.

### Infrastructure

15. **The test database is never truncated.** `db:test:setup` migrates and
    seeds idempotently, so rows left by earlier runs accumulate. The browser
    suite does not depend on an empty database — it runs serially against one
    account — but a long-lived local test database will keep growing. Clearing it
    means `prisma migrate reset`, which is deliberately not automated: Prisma
    blocks AI agents from running it without your explicit consent, and it is
    irreversible.
16. **30 lint warnings remain.** Down from 131. Mostly unused locals in
    components that were partly built and never finished, plus four
    `exhaustive-deps` notices. No errors, and none of them indicates a defect.
17. **CI is configured but unverified.** `.github/workflows/ci.yml` runs the full
    gate plus a from-scratch migration job. It has never executed, because the
    repository has no remote — see §12.

### Deliberately out of scope

**Registration is owner-approved.** That is a choice, not an oversight: this is a
single-owner learning app, and open self-registration would put unmoderated
content in front of an owner who has not invited anyone.

---

## 16. Architecture in one page

```
Browser
  │
  ├─ src/proxy.ts ──── UX redirect only. Checks cookie PRESENCE.
  │                    Cannot query the database, so it cannot be trusted.
  │
  ▼
Route handler / Server Component
  │
  ├─ resolveUserId() ── THE decision point. Signed cookie → session row →
  │                    account must be `active`. Then, outside production
  │                    only, the dev identity as a fallback.
  │
  ▼
Service layer ────────► PostgreSQL via Prisma 7 + @prisma/adapter-pg
```

**The single most important property:** `resolveUserId()` is the only place
ownership is decided. Sprint 58 was deliberately structured so that implementing
authentication would mean changing that one function's body — and that is exactly
what happened. No route handler and no service needed to change to gain
ownership.

The proxy is a convenience, never a boundary. Enforcement lives at the data
boundary, where a forged or stale cookie is rejected with a 401.

### Why the engine is separate

Bidding legality is decided by `AuctionStateMachine` in `src/lib/`, with no
database access. A hand replays through it and must reach the same result. The
database records what happened; it is never asked whether it was legal.

---

## Related documents

| Document | Contents |
|---|---|
| `docs/verification/SPRINT_60_VERIFICATION.md` | Current sprint: what was verified, how, and the honest gaps |
| `docs/verification/SPRINT_59_VERIFICATION.md` | Authentication: sessions, passwords, proxy, rate limits |
| `docs/verification/SPRINT_58_VERIFICATION.md` | Persistence: schema, migrations, test isolation |
| `docs/audit/SPRINT_58_MOCK_CLASSIFICATION.md` | Every mock dependency, classified, and what replaced it |
| `docs/SPRINT_59_PLAN.md` | The authentication design and why |
| `backlog.md` | Priorities and status |
| `backlog_progress.md` | Dated log of what changed and why |
| `AGENTS.md` | Notes for AI agents working in this repository |
