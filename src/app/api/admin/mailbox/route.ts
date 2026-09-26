/**
 * Admin mailbox (Sprint 60).
 *
 * GET /api/admin/mailbox → recent outgoing messages.
 *
 * Gated by `requireAdmin()` because these rows contain password reset links.
 * That is the whole reason this is a separate admin-only route and not part of
 * the registrations response: the registration list is safe to show an
 * administrator, and the mailbox is not safe to show anyone else.
 */
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/apiRoute";
import { requireAdmin } from "@/lib/admin";
import { recentMail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(async () => {
  await requireAdmin();
  const messages = await recentMail(50);
  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      to: m.to,
      subject: m.subject,
      body: m.body,
      provider: m.provider,
      status: m.status,
      error: m.error,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});
