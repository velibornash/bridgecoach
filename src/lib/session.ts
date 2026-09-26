/**
 * Sessions (Sprint 59).
 *
 * SERVER-ONLY. Never import from a client component.
 *
 * DESIGN
 *  - The cookie carries an opaque random token. Only its SHA-256 hash is stored,
 *    so a database leak does not hand out live sessions.
 *  - Sessions live in the database, which makes them revocable server-side. A
 *    self-contained JWT cannot be revoked before its expiry, which is why this is
 *    a table and not a token.
 *  - The cookie itself is signed so a tampered value is rejected before any
 *    database lookup, and it is `httpOnly` so no script can read it.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "bridgecoach_session";
/** 30 days. Long enough to be usable, short enough to limit exposure. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Secret used to sign the cookie value. Falls back to a development-only value
 * so a fresh clone runs, but `assertProductionConfig` refuses to start in
 * production without a real secret.
 */
function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is required in production. Generate one with: openssl rand -base64 32",
    );
  }
  return "bridgecoach-development-session-secret-do-not-use-in-production";
}

/** Guards startup configuration. Call once from instrumentation or an API route. */
export function assertProductionConfig(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set in production.");
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sign(value: string): string {
  // HMAC over the token; the secret never leaves the server.
  const { createHmac } = require("node:crypto") as typeof import("node:crypto");
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function unsign(signed: string): string | null {
  const separator = signed.lastIndexOf(".");
  if (separator <= 0) return null;
  const value = signed.slice(0, separator);
  const signature = signed.slice(separator + 1);

  const expected = sign(value);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  // Length check first: timingSafeEqual throws on a length mismatch.
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? value : null;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

/** Creates a session row and returns the signed cookie value. */
export async function createSession(
  userId: string,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: meta.userAgent?.slice(0, 512) ?? null,
      ip: meta.ip ?? null,
    },
  });

  return { token: `${token}.${sign(token)}`, expiresAt };
}

/**
 * Resolves the current session's user, or null.
 *
 * Does NOT throw for a missing or invalid cookie — a logged-out visitor is a
 * normal state, not an error.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = await readSessionCookie();
  if (!raw) return null;

  const token = unsign(raw);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    // Expired: drop the row so the table does not accumulate dead sessions.
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session.user;
}

/**
 * Reads the session cookie, tolerating the absence of a request scope.
 *
 * `cookies()` returns a Promise in this Next version and throws outside a
 * request. Both are handled: a test invoking a route handler directly has no
 * request scope, and any path reaching this outside a server context has no
 * session either. In both cases "no session" is the correct answer, not a crash.
 */
async function readSessionCookie(): Promise<string | undefined> {
  try {
    const store = await cookies();
    return store.get(SESSION_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

/** Revokes the current session. Returns true when a session was actually removed. */
export async function destroySession(): Promise<boolean> {
  const raw = await readSessionCookie();
  if (!raw) return false;

  const token = unsign(raw);
  if (!token) return false;

  const result = await prisma.session.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
  return result.count > 0;
}

/**
 * Revokes every session for a user except the current one. Used on password
 * change: if a password was stolen, the thief's session must die.
 */
export async function revokeOtherSessions(userId: string, keepTokenHash: string): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { userId, NOT: { tokenHash: keepTokenHash } },
  });
  return result.count;
}

/** Removes expired sessions. Safe to call periodically. */
export async function purgeExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return result.count;
}

/** Cookie attributes for the session. */
export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/** Cookie attributes that clear the session. */
export function clearedCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

/** Extracts request metadata for the audit trail. */
export function requestMeta(request: Request): { userAgent?: string; ip?: string } {
  const forwarded = request.headers.get("x-forwarded-for");
  return {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ip: forwarded?.split(",")[0]?.trim() ?? undefined,
  };
}

/**
 * SHA-256 of the current raw token, for "keep this session, revoke the rest".
 * Returns null when there is no session.
 */
export async function currentTokenHash(): Promise<string | null> {
  const raw = await readSessionCookie();
  if (!raw) return null;
  const token = unsign(raw);
  return token ? hashToken(token) : null;
}
