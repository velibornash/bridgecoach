# Sprint 59 Verification — Real Authentication

Verification date: 2026-09-26
Branch: `main`
Verified commits: `32bc2fc` (plan) · `7676bce` (core) · `8350567` (client, proxy,
quotas) · multi-user migration

---

## 1. The gap that existed at the start of this sprint

Stated plainly, because every number below is only meaningful against it:

- Every visitor to the app **was** the development user. There was no isolation.
- `mockLogin` returned a token that was never stored and never verified, so
  "signing in" changed nothing at all.
- `User.passwordHash` existed in the schema and was never written to.
- The AI rate limit was keyed on `x-forwarded-for`, a header the caller chooses.

---

## 2. The property Sprint 58 promised

Sprint 58 was designed so that replacing the body of `resolveUserId()` would be
the whole of authentication. **That held exactly.** Not one route handler and not
one service needed to change to gain ownership. The seam did what it was built
to do.

```
1. A real signed-in session always wins, including in development.
2. Outside production, the development identity is a fallback.
3. In production the development identity is refused; no session is a 401.
```

Step 3 returns `false` before the flag is read, so no environment combination can
reopen it.

---

## 3. Verified live, not just asserted

Run against a real server and a real PostgreSQL 18.4 instance.

| Check | Result |
|---|---|
| `POST /api/auth` registers a user | 201, `httpOnly` + `sameSite=lax` cookie set |
| `PUT /api/auth` with correct password | 200, user returned |
| `PUT /api/auth` with wrong password | 401 |
| `PUT /api/auth` for an unregistered address | 401, **identical body** — does not disclose which addresses exist |
| Token present in any response body | No — asserted by test over the serialized response |
| Password stored in plaintext | No — hash verified to differ from the input |
| `GET /dashboard` with no cookie | 307 → `/login?next=%2Fdashboard` |
| `GET /api/dashboard` with no cookie | 401 **JSON**, not an HTML redirect |
| `/about`, `/pricing`, `/faq`, `/auth/login` | 200, not intercepted |
| `/favicon.ico`, `/_next/static/*` | 200, not intercepted |
| Alice creates a private note | Bob receives nothing |
| Alice completes a lesson | Alice 1 completed, Bob 0 |

That last pair is the one that matters. It is the first time in this project's
history that ownership could be asserted at all: with a single user in the
database, no test could prove isolation, because there was no second party to
prove it against.

---

## 4. Two independent layers, deliberately

Next 16's documentation (`node_modules/next/dist/docs/`) states that `proxy` "can
run outside of your application's main runtime" and that shared modules must not
be relied on, and separately recommends avoiding proxy work "unless no other
options exist."

So the enforcement was **not** put in the proxy:

| Layer | Responsibility | Can it trust itself? |
|---|---|---|
| `src/proxy.ts` | Redirect a cookie-less visitor to sign-in. UX only. | No — checks cookie *presence* only |
| `resolveUserId()` | Decide who the caller is, on every private request | Yes — signed token, hashed lookup, expiry checked |

Because the proxy cannot import Prisma, it does not try. A forged or stale
cookie passes the proxy and is then rejected at the data boundary with a 401,
which is where the check belongs.

---

## 5. A real disagreement between the two layers, and who caught it

The development identity was honoured by `resolveUserId()` but **not** by the
proxy. A developer with no cookie was bounced off `/dashboard` while the API
would have served the request. The app was broken, not safe.

Playwright caught it. Both layers now agree, and three tests pin that agreement —
including that production honours neither.

---

## 6. Tests that were checked for the ability to fail

A test that cannot fail is worse than no test, because it is counted as
coverage. Three groups were mutation-checked by deliberately breaking the code
and confirming the failure:

| Mutation | Result |
|---|---|
| Remove the `NODE_ENV === "production"` short-circuit in `resolveUserId()` | The production-safety test **fails** |
| Read `isCurrentUser` from a query parameter on the leaderboard | The identity test **fails** |
| Add `email` to the public profile's `select` | The privacy test **fails** |

---

## 7. Rate limiting, re-keyed

`x-forwarded-for` is chosen by the caller, so it was a fairness control and never
a boundary. Quota is now charged to the user id:

- one account cannot spread usage across many addresses
- one address cannot spread usage across many accounts
- a crafted user id cannot impersonate another bucket (`user:x` ≠ `x`, and
  `anon:…` is namespaced separately)
- with no session, the network address is still used — correct for the sign-in
  route, which by definition has no session yet

---

## 8. Password storage

`bcryptjs`, cost 12, pure JavaScript.

Measured rather than assumed on this machine: **~330 ms hash, ~380 ms verify**.
Slower than native `bcrypt` (~80 ms), and irrelevant at sign-in frequency. Native
`bcrypt`/`argon2` prebuilds fail on a mismatched Node, CPU, or libc image, and
this app has to build identically on a laptop, on the Oracle server, and in CI.

Uniform work factor on unknown addresses: a login attempt for an address that
does not exist still runs a dummy hash comparison, so response timing does not
reveal which addresses are registered.

---

## 9. Defects found and fixed along the way

Not cosmetic; four of these were real.

1. **`cookies()` treated as synchronous.** It returns a Promise in Next 16.
   Caught by Playwright, **not** by `tsc` — the type signature permits both.
2. **A rejected bid asserted as 400.** The validate route returns 200 with
   `legal: false`. A negative verdict is a normal answer, not a bad request.
3. **Session tests depending on state left by earlier tests in the same block.**
   They passed alone and failed in the suite.
4. **`DailyChallenge` had an early return between two hooks.** The hook count
   changes from 2 to 4 when the challenge loads, and React throws "Rendered more
   hooks than during the previous render". It was hidden behind a loading state.
5. **`notes/page.tsx` claimed a revert that never happened.** A comment stated a
   failed pin was undone by `reload()`; the failure branch returned before
   reaching it, so a rejected pin stayed flipped until a manual refresh.
6. **`db:test:setup` was silently broken.** It read an unset `TEST_DATABASE_URL`
   and ran migrations against an empty URL, while Prisma reported a missing
   connection. The test runner derived the URL by a different route and the two
   had drifted. Both now call one module that fails loudly.
7. **`XPEvent.status` ignored in the weekly leaderboard.** Pending and rejected
   rows exist in the log; summing them would have awarded XP for work the
   progression engine refused.

---

## 10. Lint: 5 errors → 0

The project had never been at zero.

- Three of the five were real bugs (items 4 and 5 above).
- One was a `require()` of `node:crypto` in a file that already statically
  imported the same module.
- One was `PremiumHero` setting state in an effect **on purpose**, to read the
  clock after mount and avoid a hydration mismatch. It now carries a disable with
  that reason written down; "fixing" it would reintroduce the mismatch.

---

## 11. Four multi-user pages

| Page | Status | Why |
|---|---|---|
| `/leaderboard` | **Real** | Ranked from persisted XP; country scope from the viewer's own row; weekly/monthly summed from the `XPEvent` log |
| `/profile/[id]` | **Real** | Progression, unlocked achievements, real activity, no email address |
| `/friends` | Deferred | Needs a `Friendship` model and a request/accept state machine |
| `/community` | Deferred | Needs `Post`/`Like`/`Comment` and answers about public visibility and blocking |

The two deferred pages keep their visible "sample data" notice. This is a
considered deferral, not an oversight: a social graph is a feature area with its
own moderation and privacy design, and inventing those answers under time
pressure inside an auth sprint would have been worse than deferring. Scheduled as
Sprint 60.

Fabricated statistics on the public profile were **removed rather than
re-derived** — "Avg Score 78%", "28 h learned", and "3840 cards played" had no
persisted origin, and this audit had already flagged them as REMOVE in Sprint 58.
The profile now shows six metrics that can be computed from real rows.

---

## 12. Honest limitations

1. **Password reset is not implemented.** It needs a transactional email
   provider. The page now says so and offers a support address; it previously
   called a mock that resolved after a delay and implied an email had been sent.
2. **The rate limiter is in-process.** It resets on deploy and is not shared
   across instances. A single-instance deployment is unaffected; a multi-instance
   one would need a shared store. Named as a candidate for a later sprint.
3. **Sessions are not rotated on privilege change** beyond the password-change
   path, which does revoke others. There is no "log out everywhere" button.
4. **No email verification.** A user can register any address, including one
   they do not control.
5. **The leaderboard is only as large as the real user count.** A fresh install
   shows one player and an explicit empty state rather than padding the list.
6. **`/search` still reads `mockSearchResults`** rather than the database. The
   catalogue describes lessons that exist as real rows, so this is nearer KEEP
   than a persistence gap, but it is not reading the database.
7. **Playwright still runs against the development database.** Vitest is
   isolated (`bridgecoach_test`); the E2E journey mutates the dev user.
8. **121 lint warnings remain** (unused variables, mostly). None indicate a
   defect; they are uncollected debt, not a gate failure.

---

## 13. Gate

| Check | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm run lint` | **0 errors**, 121 warnings |
| `npm test` | **264 passing**, 23 files |
| `npx playwright test` | 7 passing |
| `npm run build` | clean |
| `prisma migrate status` | up to date, 5 migrations |
| Tables | 31 |

Test count across the sprint: 213 → 264. The 51 new tests cover password hashing,
session lifecycle, sign-in, sign-up, sign-out, password change, production
safety, proxy redirect rules, rate-limit keying, and multi-user isolation.

---

## 14. What Sprint 59 proved

Sprint 58's central claim was that persistence without authentication produces an
app that looks correct and is not. It did: 213 tests passed, and every one of them
was true about a single fictional user.

The claim that replacing `resolveUserId()` would be sufficient also held, which
means the Sprint 57 refactor paid for itself. The two findings that mattered most
were not in the plan:

- a layer that can be bypassed should never be the only layer
- a green suite is only as good as the questions it refuses to fail
