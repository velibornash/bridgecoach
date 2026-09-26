# Sprint 59 — Plan: Real Authentication

Status: **AWAITING APPROVAL** — nothing implemented yet.

Sprint 58 is closed (`6f2977f`) with P0: 0 and P1: 0. Authentication is the last
structural gap.

---

## 1. Why this sprint exists

Sprint 58 built a persistence layer designed around user ownership, but ownership
is still a **development stand-in**. `src/lib/db.ts` resolves every private record
to a single seeded user via `DEV_USER_EMAIL`.

Consequences that are true today:

- Every visitor to the app **is** that user. There is no isolation whatsoever.
- The four multi-user pages (`/leaderboard`, `/friends`, `/community`,
  `/profile/[id]`) cannot show real data, so they render labelled sample content.
- `mockLogin` returns a token that is never stored or verified, so "logging in"
  changes nothing.
- The AI rate-limit key is a spoofable forwarded address.

## 2. The single most important property

**`resolveUserId()` is the only place ownership is decided.** Sprint 58 was
deliberately built so that replacing its body is the whole change:

```
src/lib/db.ts  →  resolveUserId()  ←  the seam
```

Everything else — 13 route files, 11 services, 29 tables — is already written
against a real `userId`. **No route or component should need to change** for
authentication to work. If a route does need changing, that is a design bug to fix
here, not a task for the sprint.

## 3. Proposed approach

### Sessions, not JWTs in localStorage

A signed, `httpOnly`, `secure`, `sameSite=lax` cookie holding a session id, with
the session stored server-side. Reasons: instantly revocable, no token in
JavaScript so XSS cannot read it, and a logout that actually logs out. A JWT in
localStorage (the Sprint 57 shape) cannot be revoked and is readable by any script.

### Password hashing

`bcryptjs` — pure JS, no native build step, so it cannot fail on a different
Node/CI image the way `bcrypt` or `argon2` can. Cost factor 12.

### No new infrastructure

PostgreSQL is already there. Sessions are a table. No Redis, no external auth
provider, no new service to run.

## 4. Schema

```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  // Store a HASH of the token, not the token. A database leak then does not
  // hand out live sessions.
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  lastSeenAt DateTime @default(now())
  userAgent String?
  ip        String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model AuthEvent {
  id        String   @id @default(cuid())
  userId    String?
  type      String   // SIGN_IN, SIGN_UP, SIGN_OUT, FAILED_SIGN_IN, PASSWORD_CHANGED
  ip        String?
  ok        Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([type, createdAt])
}
```

`User.passwordHash` already exists and is currently `null` for the dev user — the
column is in place, unused.

## 5. Endpoints

| Route | Purpose |
|---|---|
| `POST /api/auth/register` | create user + session, set cookie |
| `POST /api/auth/login` | verify password, create session, set cookie |
| `POST /api/auth/logout` | delete session, clear cookie |
| `GET  /api/auth/session` | current user or 401 — used by the client to gate UI |
| `POST /api/auth/password` | change password, revoke all other sessions |

All on the existing `withUser`/`handleRoute` scaffolding, so validation, error
mapping and ownership are already solved.

## 6. Middleware

Next.js middleware gating the app shell (`/dashboard`, `/profile`, `/tactical`,
`/practice`, `/settings`, …). Redirect to `/auth/login` with a `next` param so the
user returns where they were going. Public routes stay public: landing, pricing,
FAQ, contact, `/auth/*`.

Note from AGENTS.md: read `node_modules/next/dist/docs/` for the current
middleware API before writing it — the signature has changed across versions.

## 7. Client changes

- `auth.ts` (`mockLogin`/`mockRegister`) is **deleted**, replaced by real calls.
- `authService.ts` is **deleted** — it has zero importers and checks a hardcoded
  password literal.
- Login/register pages call the new endpoints; they currently call the mock
  service and `router.push("/dashboard")` with nothing established.
- `DashboardDataProvider` gains the session user, so the sidebar/settings stop
  needing a separate fetch.
- `resolveUserId()` reads the session cookie and returns `session.userId`.

## 8. Rate limiting follow-through

Once sessions exist, re-key the AI limiter on `userId` instead of the forwarded
address, and add a **failed-sign-in** limiter (per email and per IP) to stop
credential stuffing. This is the concrete payoff for the Sprint 58 P1 fix.

## 9. Migration

Existing dev data is owned by `seed-user-dev` with `passwordHash: null`. Options:

- **(recommended)** Give the seeded dev user a password from
  `DEV_USER_PASSWORD` (dev-only, documented) so local work continues, and mark it
  clearly as a development account.
- Or leave it password-less and unauthenticated as an explicit escape hatch
  enabled only when `ALLOW_DEV_IDENTITY=true`.

Either way the dev identity must be impossible to reach in production — a startup
assertion that `resolveUserId` refuses the dev identity when `NODE_ENV=production`.

## 10. Testing

- Password hashing round-trip; wrong password rejected.
- Session cookie is `httpOnly` + `secure` in production; token is never returned
  in a response body.
- Logout invalidates the session server-side, not just in the browser.
- Expired session is rejected.
- **The critical test:** user A creates data, user B cannot read it. This proves
  ownership is real for the first time — no existing test can assert it today.
- Rate limit keyed per user.
- Protected route redirects; public route does not.
- All 213 Sprint 58 tests stay green.

## 11. Definition of Done

- [ ] No route or service needed changing to support auth (only `resolveUserId`)
- [ ] Register → session cookie → authenticated request works
- [ ] Login / logout / session-check endpoints
- [ ] Passwords hashed with bcrypt, cost ≥ 12
- [ ] Sessions revocable server-side; `httpOnly` + `secure` + `sameSite`
- [ ] Protected routes redirect; public routes stay public
- [ ] **Cross-user isolation test passes** (A cannot read B's data)
- [ ] AI rate limit re-keyed per user; sign-in attempt limiting added
- [ ] Dev identity unreachable in production
- [ ] `mockLogin` / `authService.ts` deleted
- [ ] `DEV_USER_EMAIL` no longer resolves private data on any public route
- [ ] 4 multi-user pages switch from labelled sample content to real data
- [ ] 213 Sprint 58 tests still green
- [ ] typecheck, lint, coverage, E2E, build all pass
- [ ] `docs/verification/SPRINT_59_VERIFICATION.md` written

## 12. Explicitly out of scope

- OAuth / social login
- Password reset email (needs an email provider; the forgot-password page stays a stub and is labelled as such)
- Multi-factor auth
- Roles and permissions beyond owner-scoped access
- Account deletion / data export (GDPR) — worth a later sprint
- Rate limiter moved to Redis (only needed if deployed multi-instance)

## 13. Risks

| Risk | Mitigation |
|---|---|
| Scope creep into a full identity system | The Definition of Done is deliberately narrow; anything not listed is a later sprint |
| Middleware API churn in Next 16 | Read `node_modules/next/dist/docs/` first, as AGENTS.md requires |
| `bcryptjs` is pure JS and slower than native | Cost 12 is ~250 ms; acceptable at sign-in frequency. Only raise if measured |
| Existing dev data orphaned if the dev user is recreated | Seed uses a stable id (`seed-user-dev`) and `upsert`, so it is never recreated |
| E2E tests assume a single shared user | Tests already run against `bridgecoach_test`; a second fixture user will be needed and is part of the isolation test |

## 14. Effort estimate

Roughly 2–3 working sessions: schema + hashing + endpoints (1), middleware +
client migration (1), cross-user isolation tests + multi-user pages (0.5–1).

---

## Decisions needed before implementation

1. **Session storage** — signed cookie id + DB row (recommended), or JWT in an
   `httpOnly` cookie with no revocation?
2. **Dev user** — give it a `DEV_USER_PASSWORD`, or keep a dev-only bypass
   identity behind a flag?
3. **bcryptjs** — acceptable, or must we use Argon2id for compliance reasons?
