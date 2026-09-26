/**
 * Outgoing email (Sprint 60).
 *
 * Password reset is the first feature that needs to send real mail, and this is
 * the layer that makes it work in three situations without lying about any of
 * them:
 *
 * 1. **Development, no API key.** The message is written to `OutgoingEmail` and
 *    the admin page can read it. That means the reset flow can be completed end
 *    to end on a laptop with no account anywhere, which is the difference
 *    between the feature being implemented and the feature being testable.
 * 2. **Production, `RESEND_API_KEY` set.** Sent through Resend (free tier:
 *    3,000 messages a month, 100 a day, no card) and also recorded, so a
 *    delivery failure is visible instead of silent.
 * 3. **Production, no key.** Throws. A password reset that silently does nothing
 *    is worse than one that fails loudly, because the user is told to check
 *    their inbox for a message that will never arrive.
 *
 * `OutgoingEmail` stores bodies, so it holds password reset links. It is read
 * only by admin-gated code and must never be exposed to a signed-in ordinary
 * user — see `assertAdmin` in `src/lib/admin.ts`.
 */
import { prisma } from "@/lib/db";

export type MailStatus = "sent" | "recorded" | "failed";

export interface MailResult {
  status: MailStatus;
  provider: string;
  error?: string;
}

export interface OutgoingMail {
  to: string;
  subject: string;
  body: string;
}

/** Absolute base URL used to build links in emails. */
function siteUrl(): string {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SITE_URL must be set in production: a password reset link cannot be built " +
        "from a relative URL, and a relative link in an email goes nowhere.",
    );
  }
  return "http://localhost:3000";
}

/** The address shown as the sender. Resend only accepts verified senders. */
function fromAddress(): string {
  const from = process.env.MAIL_FROM?.trim();
  if (from) return from;
  const domain = process.env.SITE_URL?.match(/https?:\/\/([^/]+)/)?.[1];
  if (domain) return `Bridge Coach <noreply@${domain}>`;
  return "Bridge Coach <noreply@localhost>";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends a message, or records it when there is nowhere to send it.
 *
 * The row is written first and updated afterwards, so a provider outage leaves
 * evidence rather than nothing.
 */
export async function sendMail(mail: OutgoingMail): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "RESEND_API_KEY is not set. Password reset is unavailable in production " +
          "rather than silently discarding the message.",
      );
    }
    await prisma.outgoingEmail.create({
      data: { to: mail.to, subject: mail.subject, body: mail.body, provider: "local", status: "recorded" },
    });
    return { status: "recorded", provider: "local" };
  }

  const row = await prisma.outgoingEmail.create({
    data: { to: mail.to, subject: mail.subject, body: mail.body, provider: "resend", status: "queued" },
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [mail.to],
        subject: mail.subject,
        html: mail.body,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      // The message may still have been accepted, so this is recorded as failed
      // rather than deleted: an administrator can see it and resend.
      await prisma.outgoingEmail.update({
        where: { id: row.id },
        data: { status: "failed", error: `${response.status}: ${detail.slice(0, 500)}` },
      });
      return { status: "failed", provider: "resend", error: `${response.status}: ${detail.slice(0, 200)}` };
    }

    await prisma.outgoingEmail.update({ where: { id: row.id }, data: { status: "sent" } });
    return { status: "sent", provider: "resend" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.outgoingEmail.update({
      where: { id: row.id },
      data: { status: "failed", error: message.slice(0, 500) },
    });
    return { status: "failed", provider: "resend", error: message };
  }
}

/** Password reset message. The link is the only place the token appears. */
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  token: string,
): Promise<MailResult> {
  const link = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const body = `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5">
  <h1>Reset your Bridge Coach password</h1>
  <p>Hello ${escapeHtml(firstName)},</p>
  <p>Use the link below to choose a new password. It works once and expires in
     ${RESET_TTL_HOURS} hours.</p>
  <p><a href="${link}">Choose a new password</a></p>
  <p>If you did not ask for this, ignore this message — your password has not
     changed and no one has been given access to your account.</p>
</body></html>`;
  return sendMail({ to, subject: "Reset your Bridge Coach password", body });
}

export const RESET_TTL_HOURS = 1;

/** Tells the owner that a registration is waiting for a decision. */
export async function notifyOwnerOfRegistration(user: {
  email: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  const ownerEmail = process.env.OWNER_EMAIL?.trim() ?? process.env.DEV_USER_EMAIL;
  if (!ownerEmail || ownerEmail === user.email) return;

  await sendMail({
    to: ownerEmail,
    subject: `New registration: ${user.email}`,
    body: `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5">
  <h1>Registration request</h1>
  <p><strong>${escapeHtml(user.email)}</strong> is waiting for approval.</p>
  <p><a href="${siteUrl()}/admin">Review it in the admin page</a></p>
</body></html>`,
  });
}

/** Recent messages, for the admin mailbox. Newest first. */
export async function recentMail(limit = 50) {
  return prisma.outgoingEmail.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
