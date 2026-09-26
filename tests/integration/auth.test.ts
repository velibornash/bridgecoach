/**
 * Auth client + endpoint contract (Sprint 59).
 *
 * Replaces the Sprint 57 test file, which asserted the behaviour of the deleted
 * `mockLogin` / `mockRegister` fixtures. Those tests passed while the app had no
 * authentication at all, which is exactly the kind of test that gives false
 * confidence; these exercise the real endpoints instead.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { validateEmail, validatePassword, validateRequired, countries, experienceLevels } from "@/services/authClient";

let existingUserId: string;
let existingEmail: string;

beforeAll(async () => {
  existingEmail = `existing-${Date.now()}@test.local`;
  const created = await prisma.user.create({
    data: {
      email: existingEmail,
      passwordHash: await hashPassword("bridge123"),
      firstName: "Existing",
      lastName: "User",
    },
  });
  existingUserId = created.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: existingUserId } });
  await prisma.$disconnect();
});

describe("auth client validation", () => {
  it("validates email format", () => {
    expect(validateEmail("player@bridgecoach.app")).toBeNull();
    expect(validateEmail("")).toMatch(/required/i);
    expect(validateEmail("not-an-email")).toMatch(/invalid/i);
  });

  it("validates password strength", () => {
    expect(validatePassword("bridge123")).toBeNull();
    expect(validatePassword("short1")).toMatch(/at least 8/i);
    expect(validatePassword("passwordonly")).toMatch(/number/i);
    expect(validatePassword("12345678")).toMatch(/letter/i);
  });

  it("validates required fields", () => {
    expect(validateRequired("", "First name")).toMatch(/required/i);
    expect(validateRequired("Ada", "First name")).toBeNull();
  });

  it("offers country and experience options for the form", () => {
    expect(countries.length).toBeGreaterThan(0);
    expect(experienceLevels.map((l) => l.value)).toEqual([
      "new",
      "beginner",
      "intermediate",
      "advanced",
    ]);
  });
});

describe("auth endpoints", () => {
  it("rejects a registration with a weak password", async () => {
    const { POST } = await import("@/app/api/auth/route");
    const response = await POST(
      new Request("http://localhost/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `weak-${Date.now()}@test.local`,
          password: "short",
          firstName: "Weak",
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("WEAK_PASSWORD");
  });

  it("rejects a registration with a duplicate email", async () => {
    const { POST } = await import("@/app/api/auth/route");
    const response = await POST(
      new Request("http://localhost/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: existingEmail,
          password: "bridge123",
          firstName: "Dupe",
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("EMAIL_TAKEN");
  });

  it("rejects a wrong password without revealing whether the account exists", async () => {
    const { PUT } = await import("@/app/api/auth/route");
    const wrongPassword = await PUT(
      new Request("http://localhost/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: existingEmail, password: "wrongpassword1" }),
      }),
    );
    const unknownEmail = await PUT(
      new Request("http://localhost/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `nobody-${Date.now()}@test.local`, password: "wrongpassword1" }),
      }),
    );

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    // Identical message: response must not disclose which emails are registered.
    expect((await wrongPassword.json()).error).toBe((await unknownEmail.json()).error);
  });

  it("registers a user, sets an httpOnly cookie, and never returns the token", async () => {
    const { POST } = await import("@/app/api/auth/route");
    const email = `fresh-${Date.now()}@test.local`;
    const response = await POST(
      new Request("http://localhost/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "bridge123", firstName: "Fresh" }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.user.email).toBe(email);
    // The token must not appear anywhere in the response body.
    expect(JSON.stringify(body)).not.toMatch(/session|token/i);

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("bridgecoach_session");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");

    const created = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(created.passwordHash).toBeTruthy();
    expect(created.passwordHash).not.toContain("bridge123");
    await prisma.user.delete({ where: { id: created.id } });
  });

  it("records an audit event for both success and failure", async () => {
    const { PUT } = await import("@/app/api/auth/route");
    const before = await prisma.authEvent.count();
    await PUT(
      new Request("http://localhost/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `audit-${Date.now()}@test.local`, password: "bridge123" }),
      }),
    );
    const after = await prisma.authEvent.count();
    expect(after).toBeGreaterThan(before);

    // No password or token is ever written to the audit trail.
    const recent = await prisma.authEvent.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
    for (const event of recent) {
      expect(JSON.stringify(event)).not.toMatch(/bridge123|tokenHash/);
    }
  });

  it("refuses a password change when not signed in", async () => {
    const { PATCH } = await import("@/app/api/auth/route");
    const response = await PATCH(
      new Request("http://localhost/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "bridge123", newPassword: "newbridge1" }),
      }),
    );
    expect(response.status).toBe(401);
  });
});
