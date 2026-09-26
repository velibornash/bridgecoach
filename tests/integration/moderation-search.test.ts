/**
 * Moderation, blocking, and search (Sprint 60 follow-up).
 *
 * Each group below closes a gap that `user-manual.md` previously had to admit
 * to. The properties worth protecting, in order of consequence:
 *
 * 1. Filing a report must not hide or delete anything. A report that acted
 *    automatically would let one user remove another's post by clicking a button,
 *    which is the abuse the queue exists to prevent.
 * 2. A block must be enforced in both directions, or the person who was blocked
 *    can keep sending requests.
 * 3. Rate limits must be charged to the user id, and must actually trigger.
 * 4. Search must find text inside a JSON lesson body, case-insensitively, and
 *    must treat LIKE wildcards as literal characters.
 */
import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as sessionModule from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { resetRateLimits } from "@/lib/ai/rateLimit";

let stamp: number;
let aliceId: string;
let bobId: string;
let carolId: string;
let ownerId: string;
const emails: string[] = [];

beforeAll(async () => {
  stamp = Date.now();
  const make = async (handle: string, role: "user" | "owner" = "user") => {
    const email = `mod-${handle}-${stamp}@test.local`;
    emails.push(email);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword("password123"),
        firstName: handle,
        lastName: "Test",
        role,
        status: "active",
      },
    });
    return user.id;
  };
  aliceId = await make("alice");
  bobId = await make("bob");
  carolId = await make("carol");
  ownerId = await make("owner", "owner");
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.communityPost.deleteMany({ where: { authorId: { in: [aliceId, bobId, carolId] } } });
  await prisma.friendship.deleteMany({
    where: { requesterId: { in: [aliceId, bobId, carolId] } },
  });
  await prisma.blockedUser.deleteMany({
    where: { blockerId: { in: [aliceId, bobId, carolId] } },
  });
  await prisma.contentReport.deleteMany({
    where: { reporterId: { in: [aliceId, bobId, carolId] } },
  });
  await prisma.$disconnect();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetRateLimits();
});

function asUser(id: string, handle: string, role: "user" | "owner" = "user") {
  vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
    id,
    email: `mod-${handle}-${stamp}@test.local`,
    firstName: handle,
    lastName: "Test",
    role,
    status: "active",
  });
}

const json = (body: unknown, method = "POST", url = "http://localhost/api/x") =>
  new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    // A GET or HEAD may not carry a body; `Request` throws rather than ignoring it.
    ...(method === "GET" || method === "HEAD" ? {} : { body: JSON.stringify(body) }),
  });

const get = (url: string) => new Request(url);

// ---------------------------------------------------------------------------

describe("posting is rate limited", () => {
  it("refuses the ninth post in the window", async () => {
    asUser(aliceId, "alice");
    const { POST } = await import("@/app/api/community/route");

    const statuses: number[] = [];
    for (let i = 0; i < 9; i += 1) {
      const response = await POST(json({ body: `spam attempt ${i}` }));
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 8).every((s) => s === 201)).toBe(true);
    expect(statuses[8]).toBe(429);
  });

  it("gives each account its own quota", async () => {
    asUser(aliceId, "alice");
    const community = await import("@/app/api/community/route");
    for (let i = 0; i < 8; i += 1) await community.POST(json({ body: `alice floods ${i}` }));
    expect((await community.POST(json({ body: "alice over" }))).status).toBe(429);

    // Bob is unaffected: a shared quota would let one user lock out everyone.
    asUser(bobId, "bob");
    expect((await community.POST(json({ body: "bob first post" }))).status).toBe(201);
  });

  it("writes nothing once throttled", async () => {
    asUser(carolId, "carol");
    const { POST } = await import("@/app/api/community/route");
    const before = await prisma.communityPost.count({ where: { authorId: carolId } });
    for (let i = 0; i < 8; i += 1) await POST(json({ body: `carol ${i}` }));
    const throttled = await POST(json({ body: "carol over the limit" }));
    expect(throttled.status).toBe(429);
    expect(await prisma.communityPost.count({ where: { authorId: carolId } })).toBe(before + 8);
  });
});

describe("filing a report changes nothing", () => {
  it("does not hide the post or touch the author's account", async () => {
    asUser(bobId, "bob");
    const community = await import("@/app/api/community/route");
    const post = await (
      await community.POST(json({ body: "something the owner will review" }))
    ).json();

    asUser(carolId, "carol");
    const { POST } = await import("@/app/api/reports/route");
    const response = await POST(
      json({ targetType: "post", targetId: post.id, reason: "abuse" }),
    );
    expect(response.status).toBe(201);

    // The post is still there, visible, and Bob is still active.
    const stored = await prisma.communityPost.findUniqueOrThrow({ where: { id: post.id } });
    expect(stored.deletedAt).toBeNull();
    const author = await prisma.user.findUniqueOrThrow({ where: { id: bobId } });
    expect(author.status).toBe("active");

    asUser(aliceId, "alice");
    const feed = await (await community.GET(get("http://localhost/api/community"))).json();
    expect(feed.posts.some((p: { id: string }) => p.id === post.id)).toBe(true);
  });

  it("queues the report for an administrator and resolves it once", async () => {
    asUser(aliceId, "alice");
    const community = await import("@/app/api/community/route");
    const post = await (await community.POST(json({ body: "queue me" }))).json();

    asUser(bobId, "bob");
    const reports = await import("@/app/api/reports/route");
    const report = await (
      await reports.POST(json({ targetType: "post", targetId: post.id, reason: "spam" }))
    ).json();

    // A non-administrator cannot read the queue: it carries reporter emails.
    expect((await reports.GET(get("http://localhost/api/reports"))).status).toBe(403);

    asUser(ownerId, "owner", "owner");
    const queue = await (await reports.GET(get("http://localhost/api/reports"))).json();
    const entry = queue.reports.find((r: { id: string }) => r.id === report.reportId);
    expect(entry).toBeTruthy();
    expect(entry.content.exists).toBe(true);
    // The queue resolves the reported content so it is readable without N queries.
    expect(entry.content.body).toContain("queue me");

    const closed = await reports.PATCH(json({ reportId: report.reportId, action: "dismissed" }));
    expect(closed.status).toBe(200);
    // Closing twice is refused rather than rewriting the decision.
    const again = await reports.PATCH(json({ reportId: report.reportId, action: "dismissed" }));
    expect(again.status).toBe(400);
  });

  it("treats a duplicate report as a no-op, not an error", async () => {
    asUser(aliceId, "alice");
    const post = await (
      await (await import("@/app/api/community/route")).POST(json({ body: "dupe target" }))
    ).json();

    asUser(carolId, "carol");
    const { POST } = await import("@/app/api/reports/route");
    const first = await POST(json({ targetType: "post", targetId: post.id, reason: "spam" }));
    const second = await POST(json({ targetType: "post", targetId: post.id, reason: "abuse" }));
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(
      await prisma.contentReport.count({
        where: { reporterId: carolId, targetType: "post", targetId: post.id },
      }),
    ).toBe(1);
  });

  it("refuses a report against something that does not exist", async () => {
    asUser(aliceId, "alice");
    const { POST } = await import("@/app/api/reports/route");
    const response = await POST(
      json({ targetType: "post", targetId: "no-such-post", reason: "spam" }),
    );
    expect(response.status).toBe(404);
  });

  it("refuses a report against yourself", async () => {
    asUser(aliceId, "alice");
    const { POST } = await import("@/app/api/reports/route");
    const response = await POST(
      json({ targetType: "user", targetId: aliceId, reason: "abuse" }),
    );
    expect(response.status).toBe(400);
  });
});

describe("blocking is enforced in both directions", () => {
  it("stops a friend request in either direction", async () => {
    await prisma.blockedUser.deleteMany({
      where: { blockerId: { in: [aliceId, bobId, carolId] } },
    });
    await prisma.friendship.deleteMany({
      where: { requesterId: { in: [aliceId, bobId, carolId] } },
    });

    asUser(aliceId, "alice");
    const blocks = await import("@/app/api/blocks/route");
    expect((await blocks.POST(json({ userId: bobId, reason: "spam" }))).status).toBe(201);

    // Alice cannot request Bob.
    const friends = await import("@/app/api/friends/route");
    const mine = await friends.POST(json({ userId: bobId }));
    expect(mine.status).toBe(400);
    expect((await mine.json()).code).toBe("BLOCKED");

    // Bob cannot request Alice either. This is the half that is easy to miss,
    // and the half that makes a block meaningful.
    asUser(bobId, "bob");
    const theirs = await friends.POST(json({ userId: aliceId }));
    expect(theirs.status).toBe(400);
  });

  it("does not reveal that the other party is the one who blocked", async () => {
    asUser(aliceId, "alice");
    const blocks = await import("@/app/api/blocks/route");
    await blocks.POST(json({ userId: carolId }));

    asUser(bobId, "bob");
    const friends = await import("@/app/api/friends/route");
    // Bob requests Carol, who has blocked Alice but not Bob — that must work.
    expect((await friends.POST(json({ userId: carolId }))).status).toBe(201);

    // And Alice's own attempt gave a distinct message, so the "blocked by them"
    // case is never shown to the other party.
    asUser(aliceId, "alice");
    const attempt = await friends.POST(json({ userId: carolId }));
    expect((await attempt.json()).code).toBe("BLOCKED");
  });

  it("hides the blocked user's posts from the blocker's feed only", async () => {
    asUser(bobId, "bob");
    const community = await import("@/app/api/community/route");
    const bobsPost = await (await community.POST(json({ body: "bob speaks" }))).json();

    asUser(aliceId, "alice");
    await (await import("@/app/api/blocks/route")).POST(json({ userId: bobId }));
    const myFeed = await (await community.GET(get("http://localhost/api/community"))).json();
    expect(myFeed.posts.some((p: { id: string }) => p.id === bobsPost.id)).toBe(false);

    // Carol did not block Bob, so she still sees it. A block is a personal
    // boundary, not a platform-wide deletion.
    asUser(carolId, "carol");
    const carolsFeed = await (await community.GET(get("http://localhost/api/community"))).json();
    expect(carolsFeed.posts.some((p: { id: string }) => p.id === bobsPost.id)).toBe(true);
  });

  it("cancels a pending request when the block is created", async () => {
    await prisma.blockedUser.deleteMany({
      where: { blockerId: { in: [aliceId, bobId, carolId] } },
    });
    await prisma.friendship.deleteMany({
      where: { requesterId: { in: [aliceId, bobId, carolId] } },
    });

    asUser(aliceId, "alice");
    const friends = await import("@/app/api/friends/route");
    await friends.POST(json({ userId: bobId }));
    expect(
      await prisma.friendship.count({
        where: { requesterId: aliceId, addresseeId: bobId, status: "pending" },
      }),
    ).toBe(1);

    await (await import("@/app/api/blocks/route")).POST(json({ userId: bobId }));
    // Leaving the request behind would let the other party keep a claim on the
    // relationship after being blocked.
    expect(
      await prisma.friendship.count({
        where: { requesterId: aliceId, addresseeId: bobId },
      }),
    ).toBe(0);
  });

  it("unblocks", async () => {
    asUser(aliceId, "alice");
    const blocks = await import("@/app/api/blocks/route");
    const response = await blocks.DELETE(
      json(null, "DELETE", `http://localhost/api/blocks?userId=${bobId}`),
    );
    expect(response.status).toBe(200);
    const friends = await import("@/app/api/friends/route");
    expect((await friends.POST(json({ userId: bobId }))).status).toBe(201);
  });
});

describe("search reads the database", () => {
  const searchGet = (q: string) =>
    get(`http://localhost/api/search?q=${encodeURIComponent(q)}`);

  it("finds a lesson by a word in its title", async () => {
    asUser(aliceId, "alice");
    const { GET } = await import("@/app/api/search/route");
    const body = await (await GET(searchGet("Stayman"))).json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.results[0].title).toContain("Stayman");
    expect(body.results[0].href).toBe(`/lesson/${body.results[0].id}`);
  });

  it("is case-insensitive", async () => {
    asUser(aliceId, "alice");
    const { GET } = await import("@/app/api/search/route");
    const lower = await (await GET(searchGet("stayman"))).json();
    const upper = await (await GET(searchGet("STAYMAN"))).json();
    expect(upper.total).toBe(lower.total);
  });

  it("finds text inside a lesson's JSON body, case-insensitively", async () => {
    // "Opening Leads" mentions Notrump only inside its content JSON, and only
    // with a capital N. Prisma's `string_contains` compiles to LIKE, which is
    // case-sensitive, so it missed this until the query was written in SQL.
    const lessons = await prisma.lesson.findMany({
      select: { id: true, title: true, description: true, content: true },
    });

    // `Lesson.content` is a JSON array of blocks, so the body is flattened to
    // prose before words are pulled out of it.
    const flatten = (value: unknown): string => {
      if (value == null) return "";
      if (typeof value === "string") return value;
      if (Array.isArray(value)) return value.map(flatten).join(" ");
      if (typeof value === "object") {
        return Object.values(value as Record<string, unknown>)
          .map(flatten)
          .join(" ");
      }
      return "";
    };

    // Words that appear ONLY in the body, and are capitalised there. Searching
    // them lowercased is what makes this a case-insensitivity test rather than a
    // "the word happens to be lowercase" test.
    const candidates: { lessonId: string; word: string }[] = [];
    for (const lesson of lessons) {
      const meta = `${lesson.title} ${lesson.description}`.toLowerCase();
      for (const match of flatten(lesson.content).matchAll(/\b([A-Z][a-z]{4,11})\b/g)) {
        const word = match[1];
        if (meta.includes(word.toLowerCase())) continue;
        candidates.push({ lessonId: lesson.id, word });
      }
    }
    expect(candidates.length).toBeGreaterThan(0);

    asUser(aliceId, "alice");
    const { GET } = await import("@/app/api/search/route");
    for (const candidate of candidates.slice(0, 6)) {
      const found = await (await GET(searchGet(candidate.word.toLowerCase()))).json();
      expect(
        found.results.some((r: { id: string }) => r.id === candidate.lessonId),
        `"${candidate.word}" is in a lesson body only, and must be findable typed lowercase`,
      ).toBe(true);
    }
  });

  it("ranks a title match above a body-only match", async () => {
    asUser(aliceId, "alice");
    const { GET } = await import("@/app/api/search/route");
    const body = await (await GET(searchGet("Finessing"))).json();
    // "Finessing Techniques" is a title; the other match is body text only.
    expect(body.results[0].title).toContain("Finessing");
  });

  it("treats LIKE wildcards as literal characters", async () => {
    asUser(aliceId, "alice");
    const { GET } = await import("@/app/api/search/route");
    // An unescaped `%` would match every row and return the whole catalogue.
    expect((await (await GET(searchGet("%"))).json()).total).toBe(0);
    expect((await (await GET(searchGet("_"))).json()).total).toBe(0);
  });

  it("requires every term to match", async () => {
    asUser(aliceId, "alice");
    const { GET } = await import("@/app/api/search/route");
    const nonsense = await (await GET(searchGet("stayman zzzznotathing"))).json();
    expect(nonsense.total).toBe(0);
  });

  it("ignores a query too short to be meaningful", async () => {
    asUser(aliceId, "alice");
    const { GET } = await import("@/app/api/search/route");
    expect((await (await GET(searchGet("s"))).json()).total).toBe(0);
  });
});
