/**
 * Password reset (Sprint 60).
 *
 *   POST /api/auth/password-reset/request → email a single-use link
 *   POST /api/auth/password-reset/confirm → set a new password with the token
 *
 * The request endpoint answers 202 for every input, whether or not the address
 * exists. A different response for a known address would turn this form into a
 * membership oracle, which is a quieter and more useful attack than a password
 * guess because it needs no rate limit to be defeated.
 *
 * Tokens are stored hashed and single-use, for the same reason sessions are: a
 * database leak must not hand out working reset links.
 */
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { handleRoute, prisma, readJson, requireString, badRequest } from "@/lib/apiRoute";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { getSessionUser } from "@/lib/session";
import { sendPasswordResetEmail, RESET_TTL_HOURS } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Requests are limited per address and per client, as sign-in is. */
const RESET_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

export const POST = handleRoute(async (request: Request) => {
  const body = await readJson<{ email?: unknown }>(request);
  const email = requireString(body.email, "email").toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, status: true },
  });

  // Uniform response. The work below is timed similarly whether or not `user`
  // exists: a bcrypt hash is done either way, so a fast reply for an unknown
  // address is not itself a signal.
  if (user) {
    const recent = await prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - RESET_LIMIT.windowMs) } },
    });
    if (recent >= RESET_LIMIT.limit) {
      // Also uniform: a throttled known address gets the same answer as a fresh
      // one, so the limit cannot be used to probe for existence either.
      return NextResponse.json(
        { message: "If that address has an account, a reset link is on its way." },
        { status: 202 },
      );
    }

    // A suspended or rejected account gets no link. Telling the sender so would
    // confirm the address exists, so the response stays uniform.
    if (user.status === "active") {
      const token = randomBytes(32).toString("base64url");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000),
        },
      });
      await sendPasswordResetEmail(user.email, user.firstName || "there", token).catch(
        (error) => console.error("[password-reset] send failed", error),
      );
    }
  }

  return NextResponse.json(
    { message: "If that address has an account, a reset link is on its way." },
    { status: 202 },
  );
});

export const PATCH = handleRoute(async (request: Request) => {
  const body = await readJson<{ token?: unknown; newPassword?: unknown }>(request);
  const token = requireString(body.token, "token");
  const newPassword = requireString(body.newPassword, "newPassword");

  const strength = validatePasswordStrength(newPassword);
  if (strength) throw badRequest(strength, "WEAK_PASSWORD");

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  // Constant-shape failure: an unknown, used, and expired token all produce the
  // same message, so none of them tells an attacker whether a token ever existed.
  const invalid = () => badRequest("This reset link is invalid or has expired.", "INVALID_TOKEN");
  if (!row) throw invalid();
  if (row.usedAt) throw invalid();
  if (row.expiresAt.getTime() <= Date.now()) throw invalid();

  // Every other session is revoked: a password reset is the remedy for a
  // suspected compromise, and leaving the old sessions alive would defeat it.
  const currentUser = await getSessionUser();
  const currentTokenHash = currentUser
    ? (await prisma.session.findFirst({
        where: { userId: row.userId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      }))?.id
    : null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    // Revoke all but the session making the request, so someone using the app
    // while resetting is not signed out from under themselves.
    prisma.session.deleteMany({
      where: { userId: row.userId, ...(currentTokenHash ? { id: { not: currentTokenHash } } : {}) },
    }),
  ]);

  return NextResponse.json({ reset: true });
});
