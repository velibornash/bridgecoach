/**
 * Administrator API (Sprint 60).
 *
 *   GET    /api/admin/registrations  → pending and decided requests
 *   POST   /api/admin/registrations  → approve | reject, optionally with a password
 *   GET    /api/admin/mailbox        → recent outgoing email (dev mailbox / delivery log)
 *
 * Every handler calls `requireAdmin()`. There is no route in this file that
 * reads or writes administrator data without it, and that is the point: the
 * ownership check lives in one function so a new endpoint cannot forget it.
 */
import { NextResponse } from "next/server";
import { handleRoute, prisma, readJson, badRequest, requireString } from "@/lib/apiRoute";
import { requireAdmin } from "@/lib/admin";
import { hashPassword } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Minimum length enforced when an owner sets a password on someone's behalf. */
const MIN_PASSWORD = 8;

export const GET = handleRoute(async (request: Request) => {
  const admin = await requireAdmin();
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const requests = await prisma.registrationRequest.findMany({
    where: status && status !== "all" ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = await prisma.registrationRequest.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      country: r.country,
      experienceLevel: r.experienceLevel,
      status: r.status,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
      decidedAt: r.decidedAt?.toISOString() ?? null,
      decidedBy: r.decidedBy,
    })),
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    viewer: { email: admin.email, role: admin.role },
  });
});

interface DecisionBody {
  action?: unknown;
  email?: unknown;
  password?: unknown;
  note?: unknown;
}

export const POST = handleRoute(async (request: Request) => {
  const admin = await requireAdmin();
  const body = await readJson<DecisionBody>(request);

  const action = requireString(body.action, "action");
  if (action !== "approve" && action !== "reject") {
    throw badRequest("action must be 'approve' or 'reject'", "INVALID_ACTION");
  }
  const email = requireString(body.email, "email").toLowerCase();
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : null;

  const pending = await prisma.registrationRequest.findUnique({ where: { email } });
  if (!pending) {
    throw badRequest("No registration request for that address", "NO_SUCH_REQUEST");
  }
  if (pending.status !== "pending") {
    // Re-deciding an already-decided request would be a silent overwrite of an
    // administrator's earlier choice.
    throw badRequest(
      `That request was already ${pending.status}`,
      "ALREADY_DECIDED",
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (action === "reject") {
    if (user) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { status: "rejected" } }),
        // Any session issued before the rejection must stop working now.
        prisma.session.deleteMany({ where: { userId: user.id } }),
      ]);
    }
    await prisma.registrationRequest.update({
      where: { id: pending.id },
      data: { status: "rejected", note, decidedBy: admin.id, decidedAt: new Date() },
    });
    return NextResponse.json({ email, status: "rejected" });
  }

  // Approve. A password may be supplied, which is the escape hatch for an owner
  // who has verified someone by another channel; otherwise the person uses the
  // reset flow with the password they registered.
  let setPassword = false;
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < MIN_PASSWORD) {
      throw badRequest(
        `Password must be at least ${MIN_PASSWORD} characters`,
        "WEAK_PASSWORD",
      );
    }
    setPassword = true;
  }

  await prisma.$transaction([
    prisma.registrationRequest.update({
      where: { id: pending.id },
      data: { status: "approved", note, decidedBy: admin.id, decidedAt: new Date() },
    }),
    ...(user
      ? [
          prisma.user.update({
            where: { id: user.id },
            data: { status: "active" as const, ...(setPassword ? { passwordHash: await hashPassword(body.password as string) } : {}) },
          }),
          prisma.session.deleteMany({ where: { userId: user.id } }),
        ]
      : []),
  ]);

  return NextResponse.json({ email, status: "approved", passwordSet: setPassword });
});

/**
 * Approves an address with no prior request row.
 *
 * An owner bootstrapping a teammate directly should not have to fake a
 * registration first. Bounded by being admin-only.
 */
export const PUT = handleRoute(async (request: Request) => {
  const admin = await requireAdmin();
  const body = await readJson<{ email?: unknown; password?: unknown }>(request);
  const email = requireString(body.email, "email").toLowerCase();
  const password = requireString(body.password, "password");

  if (password.length < MIN_PASSWORD) {
    throw badRequest(`Password must be at least ${MIN_PASSWORD} characters`, "WEAK_PASSWORD");
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: await hashPassword(password),
      firstName: "Player",
      lastName: "",
      role: "user",
      status: "active",
    },
    // Approving an existing account also resets its password, which is the point
    // of an owner-granted account.
    update: { status: "active", passwordHash: await hashPassword(password) },
  });

  await prisma.registrationRequest.upsert({
    where: { email },
    create: { email, firstName: user.firstName, lastName: user.lastName, status: "approved", decidedBy: admin.id, decidedAt: new Date() },
    update: { status: "approved", decidedBy: admin.id, decidedAt: new Date() },
  });

  return NextResponse.json({ email, status: "active", created: true });
});
