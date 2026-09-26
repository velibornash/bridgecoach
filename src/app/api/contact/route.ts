/**
 * Contact form (Sprint 60 follow-up).
 *
 *   GET  /api/contact        → open messages, for administrators
 *   POST /api/contact        → submit a message
 *   PATCH /api/contact       → mark one read
 *
 * The form previously showed "Message sent! We'll respond within 24 hours" and
 * threw the text away. There was no mail provider, so a mailto handoff would
 * also have been a promise nothing kept.
 *
 * Storing the message is the version of that sentence that is true: the message
 * arrives somewhere the owner reads it, at `/admin`. Nothing here claims a reply
 * is coming, because no one has committed to sending one.
 *
 * Rate limited per client, since this is the one endpoint on the site that
 * accepts anonymous writes and stores them.
 */
import { NextResponse } from "next/server";
import { handleRoute, prisma, readJson, badRequest, requireString } from "@/lib/apiRoute";
import { requireAdmin } from "@/lib/admin";
import { limitWrite } from "@/lib/writeLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SUBJECT = 150;
const MAX_BODY = 2000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = handleRoute(async (request: Request) => {
  const limited = await limitWrite(request, "contact:submit", {
    windowMs: 60 * 60_000,
    limit: 5,
  });
  if (limited) return limited;

  const body = await readJson<{
    name?: unknown;
    email?: unknown;
    subject?: unknown;
    message?: unknown;
    /** Honeypot. Bots fill every field; humans never see this one. */
    website?: unknown;
  }>(request);

  // Silently accepted rather than rejected, so a bot cannot tell it was caught.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ received: true }, { status: 201 });
  }

  const name = requireString(body.name, "name").trim();
  const email = requireString(body.email, "email").trim();
  const subject = requireString(body.subject, "subject").trim();
  const message = requireString(body.message, "message").trim();

  if (!EMAIL.test(email)) throw badRequest("Enter a valid email address", "INVALID_EMAIL");
  if (name.length > 120) throw badRequest("Name is too long", "NAME_TOO_LONG");
  if (subject.length > MAX_SUBJECT) {
    throw badRequest(`Subject must be ${MAX_SUBJECT} characters or fewer`, "SUBJECT_TOO_LONG");
  }
  if (message.length > MAX_BODY) {
    throw badRequest(`Message must be ${MAX_BODY} characters or fewer`, "MESSAGE_TOO_LONG");
  }

  const created = await prisma.contactMessage.create({
    data: { name, email, subject, body: message },
    select: { id: true },
  });

  return NextResponse.json({ received: true, id: created.id }, { status: 201 });
});

export const GET = handleRoute(async () => {
  await requireAdmin();
  /**
   * Newest first, and that is the whole ordering.
   *
   * This previously sorted by `readAt` ascending with nulls first, so unread
   * came first but a message you had *just* handled went to the back — the
   * queue buried the row you were looking at, which is the opposite of what a
   * triage queue should do. With enough messages it also fell outside the
   * window entirely.
   *
   * Unread is a badge and a count, not a sort key. `createdAt desc` is the order
   * a person actually reads a queue in: most recent at the top.
   */
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      subject: m.subject,
      body: m.body,
      read: m.readAt !== null,
      createdAt: m.createdAt.toISOString(),
    })),
    unread: messages.filter((m) => m.readAt === null).length,
  });
});

export const PATCH = handleRoute(async (request: Request) => {
  await requireAdmin();
  const body = await readJson<{ id?: unknown }>(request);
  const id = requireString(body.id, "id");
  const updated = await prisma.contactMessage.updateMany({
    where: { id, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ id, read: updated.count > 0 });
});
