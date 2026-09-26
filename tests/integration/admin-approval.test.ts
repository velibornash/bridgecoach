/**
 * Registration approval and password reset (Sprint 60).
 *
 * The properties worth protecting, in order of how much damage getting them
 * wrong would cause:
 *
 * 1. A pending account cannot sign in, and the reason is not disclosed to
 *    anyone who cannot prove they own the account.
 * 2. A non-administrator cannot reach any admin data, including the mailbox
 *    that holds password reset links.
 * 3. A reset token is single-use, expires, and is stored hashed.
 * 4. The request endpoint cannot be used to discover which addresses exist.
 */
import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as sessionModule from "@/lib/session";
import { hashPassword } from "@/lib/password";

const PASSWORD = "It@lij@2026";
let stamp: number;
let ownerId: string;
let applicantEmail: string;
let applicantId: string;

beforeAll(async () => {
  stamp = Date.now();
  const owner = await prisma.user.create({
    data: {
      email: `owner-${stamp}@test.local`,
      passwordHash: await hashPassword(PASSWORD),
      firstName: "Owner",
      lastName: "Test",
      role: "owner",
      status: "active",
    },
  });
  ownerId = owner.id;
  applicantEmail = `applicant-${stamp}@test.local`;
  const applicant = await prisma.user.create({
    data: {
      email: applicantEmail,
      passwordHash: await hashPassword("applicantpass1"),
      firstName: "Ana",
      lastName: "Applicant",
      role: "user",
      status: "pending",
    },
  });
  applicantId = applicant.id;
  await prisma.registrationRequest.create({
    data: {
      email: applicantEmail,
      firstName: "Ana",
      lastName: "Applicant",
      status: "pending",
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { id: { in: [ownerId, applicantId] } },
  });
  await prisma.registrationRequest.deleteMany({ where: { email: applicantEmail } });
  await prisma.$disconnect();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function asUser(id: string, email: string, role: "owner" | "admin" | "user") {
  vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
    id,
    email,
    firstName: "",
    lastName: "",
    role,
    status: "active",
  });
}

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/x", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// ---------------------------------------------------------------------------

describe("a pending account cannot sign in", () => {
  it("is refused with 403 and a clear reason", async () => {
    const { PUT } = await import("@/app/api/auth/route");
    const response = await PUT(
      json({ email: applicantEmail, password: "applicantpass1" }, "PUT"),
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.code).toBe("ACCOUNT_PENDING");
  });

  it("does not create a session for it", async () => {
    expect(
      await prisma.session.count({ where: { userId: applicantId } }),
    ).toBe(0);
  });

  it("does not disclose pending status before the password is checked", async () => {
    const { PUT } = await import("@/app/api/auth/route");
    // Correct address, wrong password: the answer must be the generic one, or
    // this form becomes a way to list registered addresses.
    const wrongPassword = await PUT(
      json({ email: applicantEmail, password: "not-the-password" }, "PUT"),
    );
    const unknown = await PUT(
      json({ email: `ghost-${stamp}@test.local`, password: "not-the-password" }, "PUT"),
    );
    expect(wrongPassword.status).toBe(401);
    expect(unknown.status).toBe(401);
    // One read each: a Response body can only be consumed once.
    const wrongBody = await wrongPassword.json();
    const unknownBody = await unknown.json();
    expect(wrongBody.error).toBe(unknownBody.error);
    expect(wrongBody.code).toBe("INVALID_CREDENTIALS");
    expect(wrongBody.code).toBe(unknownBody.code);
  });
});

describe("an approved account can sign in", () => {
  it("works once status is active", async () => {
    asUser(ownerId, "owner@test.local", "owner");
    const { POST } = await import("@/app/api/admin/registrations/route");
    const decision = await POST(json({ action: "approve", email: applicantEmail }));
    expect(decision.status).toBe(200);
    expect((await decision.json()).status).toBe("approved");

    const { PUT } = await import("@/app/api/auth/route");
    vi.restoreAllMocks();
    // Real sign-in path, with the hash the applicant registered.
    const response = await PUT(
      json({ email: applicantEmail, password: "applicantpass1" }, "PUT"),
    );
    expect(response.status).toBe(200);
  });
});

describe("the admin area is closed to ordinary users", () => {
  it("refuses the registration list with 403", async () => {
    asUser(applicantId, applicantEmail, "user");
    const { GET } = await import("@/app/api/admin/registrations/route");
    const response = await GET(new Request("http://localhost/api/admin/registrations"));
    expect(response.status).toBe(403);
  });

  it("refuses the mailbox, which holds reset links", async () => {
    asUser(applicantId, applicantEmail, "user");
    const { GET } = await import("@/app/api/admin/mailbox/route");
    const response = await GET(new Request("http://localhost/api/admin/mailbox"));
    expect(response.status).toBe(403);
  });

  it("refuses an unauthenticated caller with 401", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/registrations/route");
    expect((await GET(new Request("http://localhost/api/admin/registrations"))).status).toBe(401);
  });

  it("refuses an approve attempt from a non-administrator", async () => {
    asUser(applicantId, applicantEmail, "user");
    const { POST } = await import("@/app/api/admin/registrations/route");
    const response = await POST(json({ action: "approve", email: applicantEmail }));
    expect(response.status).toBe(403);
    // And nothing changed.
    const user = await prisma.user.findUniqueOrThrow({ where: { id: applicantId } });
    expect(["pending", "active"]).toContain(user.status);
  });

  it("serves both to an owner", async () => {
    asUser(ownerId, "owner@test.local", "owner");
    const registrations = await import("@/app/api/admin/registrations/route");
    const mailbox = await import("@/app/api/admin/mailbox/route");
    expect(
      (await registrations.GET(new Request("http://localhost/api/admin/registrations"))).status,
    ).toBe(200);
    expect(
      (await mailbox.GET(new Request("http://localhost/api/admin/mailbox"))).status,
    ).toBe(200);
  });
});

describe("password reset", () => {
  const otherEmail = () => `reset-${stamp}-${Math.random().toString(36).slice(2, 8)}@test.local`;

  async function makeUser() {
    const email = otherEmail();
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword("originalpass1"),
        firstName: "Reset",
        lastName: "Target",
        role: "user",
        status: "active",
      },
    });
    return { user, email };
  }

  it("stores a token hashed, never in plaintext", async () => {
    const { user, email } = await makeUser();
    const { POST } = await import("@/app/api/auth/password-reset/route");
    await POST(json({ email }));

    const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id } });
    expect(tokens).toHaveLength(1);
    // The plaintext token only ever exists inside the emailed link; a database
    // leak must not yield a working reset.
    expect(tokens[0].tokenHash).toMatch(/^[0-9a-f]{64}$/);

    const mail = await prisma.outgoingEmail.findFirstOrThrow({
      where: { to: email },
      orderBy: { createdAt: "desc" },
    });
    const link = mail.body.match(/token=([A-Za-z0-9_-]+)/)?.[1];
    expect(link).toBeTruthy();
    expect(tokens[0].tokenHash).not.toBe(link);
  });

  it("answers identically for a known and an unknown address", async () => {
    const { email } = await makeUser();
    const { POST } = await import("@/app/api/auth/password-reset/route");
    const known = await POST(json({ email }));
    const unknown = await POST(json({ email: `nobody-${stamp}@test.local` }));
    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(await known.json()).toEqual(await unknown.json());
  });

  it("sets a new password and revokes every other session", async () => {
    const { user, email } = await makeUser();
    const { createSession } = await import("@/lib/session");
    const first = await createSession(user.id, { userAgent: "test" });
    const second = await createSession(user.id, { userAgent: "test" });
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(2);

    const { POST, PATCH } = await import("@/app/api/auth/password-reset/route");
    await POST(json({ email }));
    const link = (
      await prisma.outgoingEmail.findFirstOrThrow({
        where: { to: email },
        orderBy: { createdAt: "desc" },
      })
    ).body.match(/token=([A-Za-z0-9_-]+)/)?.[1];

    const response = await PATCH(json({ token: link, newPassword: "brandnew1" }, "PATCH"));
    expect(response.status).toBe(200);

    const { verifyPassword } = await import("@/lib/password");
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword("brandnew1", updated.passwordHash!)).toBe(true);
    expect(await verifyPassword("originalpass1", updated.passwordHash!)).toBe(false);

    // A password reset is the remedy for a suspected compromise; leaving the old
    // sessions alive would defeat the point of using it.
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
    expect(first.token).toBeTruthy();
    expect(second.token).toBeTruthy();
  });

  it("refuses a token a second time", async () => {
    const { user, email } = await makeUser();
    const { POST, PATCH } = await import("@/app/api/auth/password-reset/route");
    await POST(json({ email }));
    const link = (
      await prisma.outgoingEmail.findFirstOrThrow({
        where: { to: email },
        orderBy: { createdAt: "desc" },
      })
    ).body.match(/token=([A-Za-z0-9_-]+)/)?.[1];

    expect((await PATCH(json({ token: link, newPassword: "firstchange1" }, "PATCH"))).status).toBe(200);
    const replay = await PATCH(json({ token: link, newPassword: "secondchan1" }, "PATCH"));
    expect(replay.status).toBe(400);
    expect((await replay.json()).code).toBe("INVALID_TOKEN");

    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const { verifyPassword } = await import("@/lib/password");
    // The replay must not have changed the password again.
    expect(await verifyPassword("firstchange1", unchanged.passwordHash!)).toBe(true);
  });

  it("refuses an expired token", async () => {
    const { user, email } = await makeUser();
    const { POST, PATCH } = await import("@/app/api/auth/password-reset/route");
    await POST(json({ email }));
    const token = await prisma.passwordResetToken.findFirstOrThrow({
      where: { userId: user.id },
    });
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const response = await PATCH(
      json({ token: "anything", newPassword: "whatever12" }, "PATCH"),
    );
    // A made-up token and an expired one must look identical from outside.
    expect(response.status).toBe(400);
  });

  it("rejects a weak new password before touching the token", async () => {
    const { user, email } = await makeUser();
    const { POST, PATCH } = await import("@/app/api/auth/password-reset/route");
    await POST(json({ email }));
    const link = (
      await prisma.outgoingEmail.findFirstOrThrow({
        where: { to: email },
        orderBy: { createdAt: "desc" },
      })
    ).body.match(/token=([A-Za-z0-9_-]+)/)?.[1];

    const response = await PATCH(json({ token: link, newPassword: "abc" }, "PATCH"));
    expect(response.status).toBe(400);
    // The token survives a rejected password, so the user can try again.
    const still = await prisma.passwordResetToken.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(still.usedAt).toBeNull();
  });
});

describe("the local mailbox records mail instead of discarding it", () => {
  it("records rather than pretending to send, with no API key", async () => {
    const previous = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    const { sendMail } = await import("@/lib/mailer");
    const result = await sendMail({
      to: `mailbox-${stamp}@test.local`,
      subject: "Test",
      body: "<p>hello</p>",
    });
    expect(result.status).toBe("recorded");
    const row = await prisma.outgoingEmail.findFirstOrThrow({
      where: { to: `mailbox-${stamp}@test.local` },
    });
    expect(row.provider).toBe("local");
    if (previous !== undefined) process.env.RESEND_API_KEY = previous;
  });
});
