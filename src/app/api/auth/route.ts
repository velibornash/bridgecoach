/**
 * Authentication endpoints (Sprint 59).
 *
 * POST /api/auth/register  → create the user, start a session
 * POST /api/auth/login     → verify the password, start a session
 * POST /api/auth/logout    → revoke the session server-side
 * GET  /api/auth/session   → current user, or 401
 * POST /api/auth/password  → change password, revoke every other session
 *
 * SECURITY NOTES
 *  - Failed sign-ins are rate limited per email AND per IP, so neither
 *    credential-stuffing a single account nor spraying one address works.
 *  - A sign-in for an unknown email still runs a password comparison against a
 *    dummy hash, so response timing does not reveal which emails exist.
 *  - The session token is never returned in a response body; it lives only in an
 *    httpOnly cookie.
 *  - Every attempt is recorded in AuthEvent.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRoute, readJson, requireString, badRequest } from "@/lib/apiRoute";
import {
  hashPassword,
  verifyPassword,
  fakeVerify,
  validatePasswordStrength,
  MIN_PASSWORD_LENGTH,
} from "@/lib/password";
import {
  createSession,
  destroySession,
  getSessionUser,
  revokeOtherSessions,
  requestMeta,
  sessionCookieOptions,
  clearedCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session";
import { checkRateLimit, clientKey } from "@/lib/ai/rateLimit";
import { notifyOwnerOfRegistration } from "@/lib/mailer";
import type { ExperienceLevel, Sex } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sign-in attempts allowed per hour, per identity and per client. */
const SIGN_IN_LIMIT = { windowMs: 60 * 60 * 1000, limit: 10 } as const;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

async function record(params: {
  userId?: string | null;
  type: string;
  ip?: string | null;
  ok: boolean;
}): Promise<void> {
  await prisma.authEvent.create({
    data: {
      userId: params.userId ?? null,
      type: params.type,
      ip: params.ip ?? null,
      ok: params.ok,
    },
  });
}

interface RegisterBody {
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  country?: unknown;
  experienceLevel?: unknown;
  sex?: unknown;
}

export const POST = async (request: Request) =>
  handleRoute(async (req: Request) => {
    const body = await readJson<RegisterBody>(req);
    const meta = requestMeta(req);
    const ip = meta.ip ?? null;

    const email = normalizeEmail(requireString(body.email, "email"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw badRequest("Enter a valid email address", "INVALID_EMAIL");
    }

    const password = requireString(body.password, "password");
    const strength = validatePasswordStrength(password);
    if (strength) throw badRequest(strength, "WEAK_PASSWORD");

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      await record({ userId: existing.id, type: "SIGN_UP", ip, ok: false });
      throw badRequest("An account with that email already exists", "EMAIL_TAKEN");
    }

    // Sprint 60: a new account is PENDING. No session is created here — the
    // account exists, but it cannot be used until an owner approves it, and
    // createSession() is deliberately not called.
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        firstName: typeof body.firstName === "string" ? body.firstName.trim() : "Player",
        lastName: typeof body.lastName === "string" ? body.lastName.trim() : "",
        country: typeof body.country === "string" ? body.country : "US",
        experienceLevel:
          typeof body.experienceLevel === "string"
            ? (body.experienceLevel as ExperienceLevel)
            : "beginner",
        sex: typeof body.sex === "string" ? (body.sex as Sex) : null,
        role: "user",
        status: "pending",
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    await prisma.profile.create({ data: { userId: user.id } });
    await prisma.registrationRequest.create({
      data: {
        email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: typeof body.country === "string" ? body.country : "US",
        experienceLevel:
          typeof body.experienceLevel === "string"
            ? (body.experienceLevel as ExperienceLevel)
            : "beginner",
        status: "pending",
      },
    });
    await record({ userId: user.id, type: "SIGN_UP", ip, ok: true });

    // The owner is notified so the request does not sit unseen. A failure here
    // must not lose the registration, so it is logged and the response is
    // unchanged: the account exists either way.
    await notifyOwnerOfRegistration(user).catch((error) => {
      console.error("[auth] owner notification failed", error);
    });

    return NextResponse.json(
      {
        user,
        status: "pending",
        message:
          "Your account has been created and is waiting for approval. " +
          "You will be able to sign in once an administrator approves it.",
      },
      { status: 201 },
    );
  })(request);

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export const PUT = async (request: Request) =>
  handleRoute(async (req: Request) => {
    const body = await readJson<LoginBody>(req);
    const meta = requestMeta(req);
    const ip = meta.ip ?? null;

    const email = normalizeEmail(requireString(body.email, "email"));
    const password = requireString(body.password, "password");

    // Two limits: per account, and per client address. Either one alone is
    // insufficient — a limit keyed only on email allows spraying many accounts
    // from one host, and one keyed only on IP allows targeting one account from
    // many hosts.
    const perAccount = checkRateLimit(`login:account:${email}`, SIGN_IN_LIMIT);
    const perClient = checkRateLimit(`login:client:${clientKey(req)}`, SIGN_IN_LIMIT);
    if (!perAccount.allowed || !perClient.allowed) {
      const retry = Math.max(perAccount.retryAfterSeconds, perClient.retryAfterSeconds);
      await record({ type: "SIGN_IN_FAILED", ip, ok: false });
      return NextResponse.json(
        { error: `Too many sign-in attempts. Try again in ${Math.ceil(retry / 60)} minutes.`, code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(retry) } },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        status: true,
        role: true,
      },
    });

    if (!user) {
      // Compare against a dummy hash so timing does not reveal that the account
      // does not exist.
      await fakeVerify();
      await record({ type: "SIGN_IN_FAILED", ip, ok: false });
      return NextResponse.json(
        { error: "Email or password is incorrect.", code: "INVALID_CREDENTIALS" },
        { status: 401 },
      );
    }

    if (!user.passwordHash) {
      // A development identity with no password cannot be signed into.
      await fakeVerify();
      await record({ userId: user.id, type: "SIGN_IN_FAILED", ip, ok: false });
      return NextResponse.json(
        {
          error: "This account cannot sign in with a password. Set DEV_USER_PASSWORD and re-seed.",
          code: "PASSWORD_NOT_SET",
        },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await record({ userId: user.id, type: "SIGN_IN_FAILED", ip, ok: false });
      return NextResponse.json(
        { error: "Email or password is incorrect.", code: "INVALID_CREDENTIALS" },
        { status: 401 },
      );
    }

    // Checked AFTER the password comparison, and this ordering is the point.
    // Answering "this account is pending" before verifying would let anyone
    // enumerate which addresses are registered and awaiting approval. Reaching
    // here means the caller already proved they own the account, so the extra
    // detail discloses nothing new.
    if (user.status !== "active") {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await record({ userId: user.id, type: "SIGN_IN_FAILED", ip, ok: false });
      return NextResponse.json(
        {
          error:
            user.status === "pending"
              ? "Your account is waiting for approval. You will be able to sign in once an administrator approves it."
              : "This account has been suspended. Contact support.",
          code: user.status === "pending" ? "ACCOUNT_PENDING" : "ACCOUNT_SUSPENDED",
        },
        { status: 403 },
      );
    }

    const { token, expiresAt } = await createSession(user.id, meta);
    await record({ userId: user.id, type: "SIGN_IN", ip, ok: true });
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      status: user.status,
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    return response;
  })(request);

export const DELETE = async (request: Request) =>
  handleRoute(async () => {
    const user = await getSessionUser();
    const removed = await destroySession();
    if (user) {
      await record({ userId: user.id, type: "SIGN_OUT", ip: requestMeta(request).ip ?? null, ok: true });
    }
    const response = NextResponse.json({ signedOut: removed });
    response.cookies.set(SESSION_COOKIE, "", clearedCookieOptions());
    return response;
  })(request);

interface PasswordBody {
  currentPassword?: unknown;
  newPassword?: unknown;
}

/** Exposed as PATCH on /api/auth/password. */
export async function changePassword(request: Request) {
  return handleRoute(async (req: Request) => {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in", code: "NOT_AUTHENTICATED" }, { status: 401 });
    }

    const body = await readJson<PasswordBody>(req);
    const currentPassword = requireString(body.currentPassword, "currentPassword");
    const newPassword = requireString(body.newPassword, "newPassword");

    const strength = validatePasswordStrength(newPassword);
    if (strength) return NextResponse.json({ error: strength, code: "WEAK_PASSWORD" }, { status: 400 });

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: "Password too short", code: "WEAK_PASSWORD" }, { status: 400 });
    }

    const record_ = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!record_.passwordHash || !(await verifyPassword(currentPassword, record_.passwordHash))) {
      return NextResponse.json(
        { error: "Current password is incorrect.", code: "INVALID_CREDENTIALS" },
        { status: 401 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    // If a password was stolen, the thief's session must die. Every session
    // except the one making this request is revoked.
    const { currentTokenHash } = await import("@/lib/session");
    const keepHash = (await currentTokenHash()) ?? "";
    const revoked = await revokeOtherSessions(user.id, keepHash);

    await recordAuthEvent(user.id, "PASSWORD_CHANGED", requestMeta(req).ip, true);
    return NextResponse.json({ changed: true, otherSessionsRevoked: revoked });
  })(request);
}

async function recordAuthEvent(
  userId: string,
  type: string,
  ip: string | null | undefined,
  ok: boolean,
): Promise<void> {
  await prisma.authEvent.create({ data: { userId, type, ip: ip ?? null, ok } });
}

export const PATCH = changePassword;
