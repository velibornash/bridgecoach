/**
 * Lying pages, round two (Sprint 60 follow-up).
 *
 * An audit of all 44 page routes for toasts with no API call behind them turned
 * up four more surfaces that reported work they did not do. Each of these pages
 * told the user something had happened when nothing had.
 *
 * The pattern across all of them is the same: a success toast wired to a click
 * handler with no write behind it. The reason it survived so long is that toasts
 * are not assertions — a green "Saved!" looks identical whether or not a request
 * was ever made.
 */
import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as sessionModule from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { resetRateLimits } from "@/lib/ai/rateLimit";

let stamp: number;
let userId: string;
let ownerId: string;

beforeAll(async () => {
  stamp = Date.now();
  const user = await prisma.user.create({
    data: {
      email: `lies-user-${stamp}@test.local`,
      passwordHash: await hashPassword("password123"),
      firstName: "Lies",
      lastName: "User",
      role: "user",
      status: "active",
    },
  });
  const owner = await prisma.user.create({
    data: {
      email: `lies-owner-${stamp}@test.local`,
      passwordHash: await hashPassword("password123"),
      firstName: "Lies",
      lastName: "Owner",
      role: "owner",
      status: "active",
    },
  });
  userId = user.id;
  ownerId = owner.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userId, ownerId] } } });
  await prisma.practiceSession.deleteMany({ where: { userId: { in: [userId, ownerId] } } });
  await prisma.contactMessage.deleteMany({ where: { email: { contains: `lies-${stamp}` } } });
  await prisma.$disconnect();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetRateLimits();
});

function asUser(id: string, role: "user" | "owner" = "user") {
  vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
    id,
    email: "lies@test.local",
    firstName: "",
    lastName: "",
    role,
    status: "active",
  });
}

const withMethod = (method: string, body: unknown) =>
  new Request("http://localhost/api/x", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const post = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// ---------------------------------------------------------------------------

describe("the contact form actually stores the message", () => {
  const message = () => ({
    name: "Jane Bridge",
    email: `jane-${stamp}@test.local`,
    subject: "Question about bidding",
    message: "Why is 1NT with 16 HCP a balanced hand?",
  });

  it("writes a row the owner can read", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(post("http://localhost/api/contact", message()));
    expect(response.status).toBe(201);

    const stored = await prisma.contactMessage.findFirstOrThrow({
      where: { email: message().email },
      orderBy: { createdAt: "desc" },
    });
    expect(stored.subject).toBe("Question about bidding");
    expect(stored.body).toContain("balanced hand");
    expect(stored.readAt).toBeNull();
  });

  it("does not promise a reply and instead shows the owner the message", async () => {
    const { POST, GET } = await import("@/app/api/contact/route");
    await POST(post("http://localhost/api/contact", message()));

    // The queue is admin-only: it exposes submitters' email addresses.
    asUser(userId);
    expect((await GET(new Request("http://localhost/api/contact"))).status).toBe(403);

    asUser(ownerId, "owner");
    const queue = await (await GET(new Request("http://localhost/api/contact"))).json();
    expect(queue.unread).toBeGreaterThan(0);
    expect(queue.messages.some((m: { body: string }) => m.body.includes("balanced hand"))).toBe(true);
  });

  it("marks a message read exactly once", async () => {
    const { POST, PATCH, GET } = await import("@/app/api/contact/route");
    await POST(post("http://localhost/api/contact", message()));
    const row = await prisma.contactMessage.findFirstOrThrow({
      where: { email: message().email },
      orderBy: { createdAt: "desc" },
    });

    asUser(ownerId, "owner");
    const first = await PATCH(withMethod("PATCH", { id: row.id }));
    expect((await first.json()).read).toBe(true);
    // Re-marking is a no-op, so a double-click cannot rewrite the read time.
    const second = await PATCH(withMethod("PATCH", { id: row.id }));
    expect((await second.json()).read).toBe(false);
    // Asserted for this message specifically, not against the queue total: the
    // inbox is global, so earlier tests in this file have left unread messages
    // in it and a total of zero would be asserting about someone else's rows.
    const queue = await (await GET(new Request("http://localhost/api/contact"))).json();
    const entry = queue.messages.find((m: { id: string }) => m.id === row.id);
    expect(entry.read).toBe(true);
    expect(queue.unread).toBeGreaterThanOrEqual(0);
  });

  it("silently accepts a filled honeypot without storing anything", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const before = await prisma.contactMessage.count();
    const response = await POST(
      post("http://localhost/api/contact", {
        ...message(),
        email: `bot-${stamp}@test.local`,
        website: "http://spam.example",
      }),
    );
    // A 201 tells the bot nothing; an error would tell it it was caught.
    expect(response.status).toBe(201);
    expect(await prisma.contactMessage.count()).toBe(before);
  });

  it("rejects a malformed submission", async () => {
    const { POST } = await import("@/app/api/contact/route");
    expect(
      (await POST(post("http://localhost/api/contact", { ...message(), email: "not-an-email" }))).status,
    ).toBe(400);
    expect(
      (await POST(post("http://localhost/api/contact", { ...message(), message: "x".repeat(2001) }))).status,
    ).toBe(400);
  });
});

describe("practice records what was played", () => {
  it("stores the actions so there is a history to learn from", async () => {
    asUser(userId);
    const { POST } = await import("@/app/api/practice/route");
    const response = await POST(
      post("http://localhost/api/practice", {
        actions: [
          { phase: "bidding", player: "south", call: "1NT" },
          { phase: "bidding", player: "north", call: "Pass" },
          { phase: "play", player: "south", card: "♠A" },
        ],
        isComplete: false,
        durationMs: 42_000,
      }),
    );
    expect(response.status).toBe(201);

    // The point of the change: the rows exist, so a skill model has something
    // to mine. Before this, /api/practice was never called by the page.
    const actions = await prisma.practiceAction.findMany({
      where: { session: { userId } },
      orderBy: { sequence: "asc" },
    });
    expect(actions).toHaveLength(3);
    expect(actions[0].call).toBe("1NT");
    expect(actions[2].card).toBe("♠A");
  });

  it("lists a user's own history and nobody else's", async () => {
    asUser(userId);
    const { GET } = await import("@/app/api/practice/route");
    const mine = await (await GET(new Request("http://localhost/api/practice"))).json();
    expect(mine.sessions.length).toBeGreaterThan(0);

    asUser(ownerId, "owner");
    const theirs = await (await GET(new Request("http://localhost/api/practice"))).json();
    expect(theirs.sessions).toHaveLength(0);
  });
});
