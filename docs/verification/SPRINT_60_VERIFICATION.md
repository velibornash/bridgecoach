# Sprint 60 Verification — Ownership, Approval, Reset, Social Graph

Verification date: 2026-09-26
Branch: `main`
Verified commits: `b3d10a7` (owner, approval, reset) · `13153a9` (social graph)

---

## 1. What this sprint actually was

Three requests, in the order they arrived:

1. Make `velja.jagodina@gmail.com` / `It@lij@2026` the OWNER/DEV account
2. Build an admin page where registration requests arrive
3. Wire up password reset on a free service

Then, at own discretion, the social graph that Sprint 59 had deliberately
deferred. The ordering matters: the admin work was blocking real use, and the
social graph was blocking nothing. So the admin work went first.

---

## 2. A typo in the credentials, and why it was silent

The first message gave the password as `It@lij@2026.` — with a full stop. I read
it as part of the password, so the seeded hash was for a password that was never
mentioned again. The second message wrote it without the stop.

The failure mode was worth recording. The seed reported `Password: set`, and
login returned `Email or password is incorrect` — indistinguishable from a wrong
password. An owner account that cannot sign in should not present as a
credential problem, and "the seed says it set a password" is not the same as "the
password you expect will work".

### A related seed bug, found on the way

`prisma/seed.ts` computed the password hash **only inside the `create` branch**,
and `update` was empty. So seeding a second time after setting
`DEV_USER_PASSWORD` did nothing at all, silently. The hash is now computed once
outside the upsert and applied in both branches. This was the same class of
failure as the typo: the tool reported success while the intended state was
unreachable.

---

## 3. Registration approval

A new account is `PENDING`. It exists, has a password hash, appears on the
owner's list — and cannot sign in.

### Two decisions that were not obvious

**The status check lives in `getSessionUser()`, not in the login handler.** A
session row outlives a status change, so checking only at sign-in leaves every
already-issued cookie working after a suspension. Checking on every request
means suspending an account takes effect immediately. The login handler's check
is the second line, not the only one.

**The "pending" message is returned only after the password compares correctly.**
Answering earlier would turn the sign-in form into a membership oracle: anyone
could type an address and learn whether it was registered and awaiting approval.
Reaching that branch means the caller already proved they own the account, so
the extra detail discloses nothing new. Mutation-checked: moving the check before
the password comparison fails a test.

### Verified live

| Step | Result |
|---|---|
| Register | 201, `status: "pending"`, **no `Set-Cookie`** |
| Sign in before approval | 403 `ACCOUNT_PENDING` |
| Session rows created | 0 |
| Approve as owner | 200 |
| Sign in after approval | 200 |

---

## 4. Password reset, on a free tier

Three situations, none of them pretended:

| Situation | Behaviour |
|---|---|
| Development, no `RESEND_API_KEY` | Message written to `OutgoingEmail`, readable at `/admin` |
| `RESEND_API_KEY` set | Sent via Resend — free: 3,000/month, 100/day, no card — and logged |
| Production, no key | **Throws** |

A reset that silently does nothing is worse than one that fails loudly, because
the user is told to check their inbox for a message that will never arrive.

The local mailbox is what makes the flow *testable* rather than merely
implemented: the whole reset path was completed over HTTP with no account
anywhere. The owner read the link out of the admin page, followed it, and set a
new password.

### Token handling

- Stored as SHA-256, never plaintext — a database leak yields no working link
- Single-use, enforced in the same transaction that changes the password
- One-hour expiry
- A reset revokes **every other session**: a reset is the remedy for a suspected
  compromise, so leaving the old sessions alive would defeat the point
- Unknown, used, and expired tokens all produce the identical message

### Verified live

| Step | Result |
|---|---|
| Request, known address | 202 |
| Request, unknown address | 202, **identical body** |
| Token recorded | 64 hex chars, not the plaintext link |
| Confirm with token | 200, new password works, old fails |
| Replay same token | 400 `INVALID_TOKEN` |

---

## 5. The mailbox is a separate route

`OutgoingEmail` rows contain password reset links. The registration list is safe
to show an administrator; the mailbox is not safe to show anyone else. So it is
`/api/admin/mailbox` with its own `requireAdmin()` — verified 403 for a
non-administrator, 401 for a signed-out caller, 200 for an owner.

---

## 6. The social graph

### Friendship is two rows, not one

Symmetric in the UI, asymmetric in storage, so "who sent this request" survives
for the accept flow. The cost is that **every read has to consider both
directions**, and the failure mode is nasty: an asymmetry bug produces a friend
list that disagrees with itself rather than an error.

So the tests assert **both users' views agree** after every transition, not
merely that a row exists. Verified live through the full flow — register,
approve, sign in, send, accept, unfriend — with both sides agreeing at each step.

Mutual-friend counts are computed from one batched query and counted in memory.
The obvious implementation is N+1; the friend list is capped at 100 and Prisma
exposes no window function, so one query plus a `Set` intersection it is.

### `likes` is a table, not a counter

"Did I like this" must be answerable, and a counter cannot answer it. One person
cannot inflate a count by refreshing. The compound primary key makes a
double-click fail rather than create two rows.

### Deletion is soft

A post that vanishes entirely makes every comment under it dangle, and there is
no way to distinguish "edited" from "never existed". Soft delete costs a
nullable column and keeps the history coherent.

### Verified live

Register → approve → login → send request → duplicate rejected (400) → self
request rejected (400) → pending shows as outgoing/incoming, not friends →
accept → both sides show the friendship → unfriend from the sender's side →
both sides show zero. Post → like (1) → unlike (0) → second user likes (1) →
comment (201) → feed shows real author, type, and per-viewer `likedByMe`.

---

## 7. Defects found and fixed during this sprint

Not cosmetic.

1. **`relatedType` overloaded as two different things.** It was both the post's
   filter category and an optional link to a lesson. The pairing validation then
   rejected **every post the composer could produce**, because a categorised post
   had a type but no link. Split into a `type` column and a link pair, with a
   migration. An unrecognised category now falls back to `milestone` rather than
   being rejected — a post nobody can see is worse than a mislabelled one.
2. **`createSession(userId, email)`** — the second argument is a metadata
   object, not an address. A test was silently storing a garbage user agent.
3. **`const request = …` shadowed `Request`** in the admin route, producing five
   type errors from one name.
4. **A test read the same `Response` body twice** — `Body has already been read`.
5. **`metadata` exported from a `"use client"` file** broke the build; it belongs
   in a layout, which is the only place it can legally live.
6. **`PostLike.post` / `PostComment.post` referenced a model named `Post`** while
   the model is `CommunityPost`. Prisma's error was clear; my first pass was not.
7. **My own "only the recipient may accept" test was testing the wrong
   scenario** — see below.

---

## 8. Two mutation checks that found gaps in my own tests

A mutation that does **not** fail a test means the test is decorative. Two of
mine were.

**The mutual-friend counter.** Replaced the intersection with "return 1 if they
have any friends at all" — the test failed. Good.

**The recipient-only accept check.** My first mutation did *not* fail the test.
The reason was that the mutation was badly designed: with `fromId == userId`, both
`OR` branches collapse to the same non-existent pair, so the handler 404'd before
reaching the update. A better mutation — look up either direction, then update
using the found row's key — *also* did not fail it, which exposed the real
problem: the test had the requester claiming to be **herself**, a case that 404s
either way. The actual attack is the requester claiming to be the **recipient**.
The test now does that, asserts 404, asserts the row is still `pending`, and the
mutation fails it.

That is the second time in three sprints that a green test turned out to be
answering a different question than intended. It is the reason mutation checking
is in the verification and not only in the commit message.

---

## 9. Honest limitations

1. **No email verification.** A registration is pending until an owner approves
   it, which is a human gate, but a person can still register an address they do
   not own. Approval catches it; nothing verifies it.
2. **Resend is not configured.** The code path is written and the failure modes
   are handled, but no key is set, so real delivery is unverified. Everything
   reported above was verified through the local mailbox.
3. **`SITE_URL` is required in production and unset locally.** A reset link is
   absolute; a relative link in an email goes nowhere. The code throws rather than
   sending a broken link.
4. **The community has no moderation** beyond author-and-admin deletion. No
   reporting, no post rate limit, no visibility control — every post is readable
   by every approved user. Adequate for a single-owner app, inadequate the moment
   a stranger can register.
5. **No blocking, only declining.** A `blocked` status exists in the string
   vocabulary but nothing sets it, and there is no way for a user to block
   another. Declining hides the request; it does not prevent a new one.
6. **The rate limiter is still in-process.** Resets on deploy, not shared across
   instances.
7. **No "log out everywhere" button.** Password change and password reset both
   revoke other sessions; there is no explicit control.
8. **Playwright still runs against the development database.** Vitest is
   isolated.
9. **130 lint warnings remain**, zero errors. Unused variables, mostly.
10. **The owner email is in `.env` and nowhere else.** `OWNER_EMAIL` falls back
    to `DEV_USER_EMAIL`, and the seeded account is `role: owner`. Re-seeding is
    what grants the role, so a database restored without the seed has no owner.

---

## 10. Gate

| Check | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm run lint` | 0 errors, 130 warnings |
| `npm test` | **298 passing**, 25 files |
| `npx playwright test` | 7 passing |
| `npm run build` | clean |
| Migrations | 8, applied to dev and test |
| Tables | 38 |

Test count: 264 → 298 across the sprint. The 34 new tests cover the approval
state machine, admin authorisation, reset token lifecycle, mailbox privacy, the
friendship state machine from both users' views, and per-user likes.

---

## 11. What actually happened this sprint

The three requested items were the easy part. Two findings were not in the plan:

- **A tool that reports success while the intended state is unreachable is
  worse than a tool that fails.** Two separate instances: the seed's empty
  `update`, and a seeded password that was never the one the user meant.
- **Two of my own tests were decorative, and only mutation checking proved it.**
  A test that cannot fail is counted as coverage while asserting nothing. The
  mutual-friend counter and the recipient-only accept check were both wrong in
  ways that reading them did not reveal.
