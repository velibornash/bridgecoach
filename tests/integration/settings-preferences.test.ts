/**
 * Settings persistence and enforced privacy (Sprint 60 follow-up).
 *
 * The /settings page had a "Save Changes" button that reported success without
 * writing anything, three password inputs that were never read, and four
 * uncontrolled fields next to a Save button. These tests exist so that "saved"
 * means written, and so a privacy toggle that claims to gate something actually
 * does.
 */
import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import * as sessionModule from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { readPreferences, DEFAULT_PREFERENCES } from "@/lib/preferences";

let stamp: number;
let userId: string;
let otherId: string;

beforeAll(async () => {
  stamp = Date.now();
  const a = await prisma.user.create({
    data: {
      email: `pref-a-${stamp}@test.local`,
      passwordHash: await hashPassword("password123"),
      firstName: "Pref",
      lastName: "One",
      country: "RS",
      role: "user",
      status: "active",
    },
  });
  const b = await prisma.user.create({
    data: {
      email: `pref-b-${stamp}@test.local`,
      passwordHash: await hashPassword("password123"),
      firstName: "Pref",
      lastName: "Two",
      role: "user",
      status: "active",
    },
  });
  userId = a.id;
  otherId = b.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherId] } } });
  await prisma.$disconnect();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await prisma.profile.deleteMany({ where: { userId } });
});

function asUser(id: string) {
  vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
    id,
    email: `pref-${id}@test.local`,
    firstName: "",
    lastName: "",
    role: "user",
    status: "active",
  });
}

const put = (body: unknown) =>
  new Request("http://localhost/api/profile/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/**
 * The dynamic profile route takes its id from a route context, not the URL, so
 * the context has to be supplied separately.
 */
const profileGet = async (id: string) => {
  const { GET } = await import("@/app/api/profiles/[id]/route");
  return GET(new Request("http://localhost/api/profiles/x"), {
    params: Promise.resolve({ id }),
  });
};

const patch = (url: string, body: unknown, method = "PATCH") =>
  new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    // A GET may not carry a body; `Request` throws rather than ignoring it.
    ...(method === "GET" || method === "HEAD" ? {} : { body: JSON.stringify(body) }),
  });

// ---------------------------------------------------------------------------

describe("preferences are actually written", () => {
  it("persists what the page saved, and reads it back", async () => {
    asUser(userId);
    const { PUT, GET } = await import("@/app/api/profile/preferences/route");

    const saved = await PUT(
      put({
        language: "en",
        notifications: { ...DEFAULT_PREFERENCES.notifications, streak_alert: false },
        privacy: { showProfile: false, showActivity: true, dataForAI: false },
      }),
    );
    expect(saved.status).toBe(200);

    // Read back through a fresh request, not from the response body, so this
    // proves the row exists rather than proving the handler echoed its input.
    const response = await GET(new Request("http://localhost/api/profile/preferences"));
    const body = await response.json();
    expect(body.preferences.notifications.streak_alert).toBe(false);
    expect(body.preferences.privacy).toEqual({
      showProfile: false,
      showActivity: true,
      dataForAI: false,
    });
  });

  it("returns the defaults when nothing was ever saved", async () => {
    asUser(userId);
    const { GET } = await import("@/app/api/profile/preferences/route");
    const body = await (
      await GET(new Request("http://localhost/api/profile/preferences"))
    ).json();
    expect(body.preferences).toEqual(DEFAULT_PREFERENCES);
  });

  it("drops keys that are not on the allow-list", async () => {
    asUser(userId);
    const { PUT, GET } = await import("@/app/api/profile/preferences/route");
    await PUT(
      put({
        language: "en",
        notifications: { lesson_reminder: false, isAdmin: true },
        privacy: { showProfile: true, showActivity: false, dataForAI: true, godMode: true },
        // A caller should not be able to persist arbitrary keys into a JSON
        // column and have them read back later.
        somethingElse: "should not survive",
      }),
    );
    const body = await (
      await GET(new Request("http://localhost/api/profile/preferences"))
    ).json();
    expect(body.preferences.notifications).not.toHaveProperty("isAdmin");
    expect(body.preferences.privacy).not.toHaveProperty("godMode");
    expect(body.preferences).not.toHaveProperty("somethingElse");
  });

  it("falls back to a valid language for an unknown code", async () => {
    expect(readPreferences({ language: "klingon" }).language).toBe("en");
    expect(readPreferences({ language: "sr" }).language).toBe("sr");
    expect(readPreferences(null).language).toBe("en");
    expect(readPreferences("not an object").language).toBe("en");
  });

  it("fills missing keys from the defaults rather than leaving them undefined", async () => {
    const partial = readPreferences({ notifications: { streak_alert: false } });
    expect(partial.notifications.streak_alert).toBe(false);
    expect(partial.notifications.lesson_reminder).toBe(true);
    expect(partial.privacy.dataForAI).toBe(true);
  });
});

describe("the privacy toggle gates the public profile", () => {
  it("serves the profile by default", async () => {
    asUser(otherId);
    const response = await profileGet(userId);
    expect(response.status).toBe(200);
  });

  it("404s for everyone else when showProfile is off", async () => {
    asUser(userId);
    const prefs = await import("@/app/api/profile/preferences/route");
    await prefs.PUT(
      put({
        language: "en",
        notifications: DEFAULT_PREFERENCES.notifications,
        privacy: { showProfile: false, showActivity: false, dataForAI: true },
      }),
    );

    asUser(otherId);
    const response = await profileGet(userId);
    // 404 rather than 403: the profile's existence is not something a blocked
    // viewer should learn.
    expect(response.status).toBe(404);
  });

  it("still serves it to the owner", async () => {
    asUser(userId);
    const prefs = await import("@/app/api/profile/preferences/route");
    await prefs.PUT(
      put({
        language: "en",
        notifications: DEFAULT_PREFERENCES.notifications,
        privacy: { showProfile: false, showActivity: false, dataForAI: true },
      }),
    );

    asUser(userId);
    const response = await profileGet(userId);
    expect(response.status).toBe(200);
    expect((await response.json()).user.isOwn).toBe(true);
  });

  it("omits activity when showActivity is off, and says so", async () => {
    asUser(userId);
    const prefs = await import("@/app/api/profile/preferences/route");
    await prefs.PUT(
      put({
        language: "en",
        notifications: DEFAULT_PREFERENCES.notifications,
        privacy: { showProfile: true, showActivity: false, dataForAI: true },
      }),
    );

    asUser(otherId);
    const body = await (await profileGet(userId)).json();
    expect(body.activity).toEqual([]);
    // Reported so the page can say "hidden" rather than "no activity".
    expect(body.activityVisible).toBe(false);
  });
});

describe("the dataForAI toggle gates the coach", () => {
  it("refuses the coach when it is off", async () => {
    asUser(userId);
    const prefs = await import("@/app/api/profile/preferences/route");
    await prefs.PUT(
      put({
        language: "en",
        notifications: DEFAULT_PREFERENCES.notifications,
        privacy: { showProfile: true, showActivity: false, dataForAI: false },
      }),
    );

    const { POST } = await import("@/app/api/coach/route");
    const response = await POST(
      new NextRequest("http://localhost/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "hello" }),
      }),
    );
    // Refused, not silently ignored: a toggle that gates nothing is a lie, and
    // one that gates the feature without saying so is worse.
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe("AI_DISABLED");
  });

  it("does not refuse when it is on", async () => {
    asUser(userId);
    const { POST } = await import("@/app/api/coach/route");
    // No provider is configured in tests, so this must fail on the provider, not
    // on the privacy gate. Anything other than 403 proves the gate let it through.
    const response = await POST(
      new NextRequest("http://localhost/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "hello" }),
      }),
    );
    expect(response.status).not.toBe(403);
  });
});

describe("profile editing writes real values", () => {
  it("updates the fields the form sends", async () => {
    asUser(userId);
    const { PATCH } = await import("@/app/api/profile/route");
    const response = await PATCH(
      patch("http://localhost/api/profile", {
        firstName: "Changed",
        lastName: "Name",
        country: "DE",
        experienceLevel: "advanced",
      }),
    );
    expect(response.status).toBe(200);

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(stored.firstName).toBe("Changed");
    expect(stored.country).toBe("DE");
    expect(stored.experienceLevel).toBe("advanced");
  });

  it("refuses an email change, which would need verification", async () => {
    asUser(userId);
    const { PATCH } = await import("@/app/api/profile/route");
    const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const response = await PATCH(
      patch("http://localhost/api/profile", { email: "someone-else@example.com" }),
    );
    // Silently ignored rather than accepted: the endpoint does not write email
    // at all, and there is no verification flow to make one safe.
    expect(response.status).toBe(400);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(after.email).toBe(before.email);
  });

  it("rejects a bad country code and an empty name", async () => {
    asUser(userId);
    const { PATCH } = await import("@/app/api/profile/route");
    expect(
      (await PATCH(patch("http://localhost/api/profile", { country: "Serbia" }))).status,
    ).toBe(400);
    expect(
      (await PATCH(patch("http://localhost/api/profile", { firstName: "   " }))).status,
    ).toBe(400);
    expect(
      (await PATCH(patch("http://localhost/api/profile", { experienceLevel: "god" }))).status,
    ).toBe(400);
  });

  it("refuses a body with nothing in it", async () => {
    asUser(userId);
    const { PATCH } = await import("@/app/api/profile/route");
    expect((await PATCH(patch("http://localhost/api/profile", {}))).status).toBe(400);
  });
});
