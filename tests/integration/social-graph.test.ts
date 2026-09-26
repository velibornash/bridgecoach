/**
 * Social graph (Sprint 60).
 *
 * The friend state machine is where the interesting failures live: friendship is
 * symmetric in the UI and stored as two rows, so an asymmetry bug produces a list
 * that disagrees with itself rather than an error. These tests assert the
 * symmetry explicitly, from both users' points of view, after every transition.
 */
import { describe, expect, it, beforeAll, afterAll, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as sessionModule from "@/lib/session";
import { hashPassword } from "@/lib/password";

let stamp: number;
let aliceId: string;
let bobId: string;
let carolId: string;
let daveId: string;
const emails: string[] = [];

beforeAll(async () => {
  stamp = Date.now();
  const make = async (handle: string) => {
    const email = `sg-${handle}-${stamp}@test.local`;
    emails.push(email);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword("password123"),
        firstName: handle,
        lastName: "Test",
        role: "user",
        status: "active",
      },
    });
    return user.id;
  };
  aliceId = await make("alice");
  bobId = await make("bob");
  carolId = await make("carol");
  daveId = await make("dave");
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await prisma.$disconnect();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function asUser(id: string, handle: string) {
  vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue({
    id,
    email: `sg-${handle}-${stamp}@test.local`,
    firstName: handle,
    lastName: "Test",
    role: "user",
    status: "active",
  });
}

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/friends", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const get = (url = "http://localhost/api/friends") => new Request(url);

async function friendsOf(userId: string, handle: string) {
  asUser(userId, handle);
  const { GET } = await import("@/app/api/friends/route");
  return (await GET(get())).json();
}

async function reset() {
  await prisma.friendship.deleteMany({
    where: { requesterId: { in: [aliceId, bobId, carolId, daveId] } },
  });
}

describe("the friend request state machine", () => {
  it("starts with nobody as a friend", async () => {
    await reset();
    const view = await friendsOf(aliceId, "alice");
    expect(view.friends).toHaveLength(0);
    expect(view.incoming).toHaveLength(0);
    expect(view.outgoing).toHaveLength(0);
  });

  it("a request is not a friendship yet", async () => {
    await reset();
    asUser(aliceId, "alice");
    const { POST } = await import("@/app/api/friends/route");
    expect((await POST(json({ userId: bobId }))).status).toBe(201);

    // The sender sees an outgoing request, not a friend.
    const sender = await friendsOf(aliceId, "alice");
    expect(sender.friends).toHaveLength(0);
    expect(sender.outgoing.map((r: { id: string }) => r.id)).toContain(bobId);

    // The recipient sees an incoming request, not a friend.
    const recipient = await friendsOf(bobId, "bob");
    expect(recipient.friends).toHaveLength(0);
    expect(recipient.incoming.map((r: { id: string }) => r.id)).toContain(aliceId);
  });

  it("both sides see the friendship after accepting", async () => {
    asUser(bobId, "bob");
    const { PATCH } = await import("@/app/api/friends/route");
    expect((await PATCH(json({ userId: aliceId, action: "accept" }))).status).toBe(200);

    const a = await friendsOf(aliceId, "alice");
    const b = await friendsOf(bobId, "bob");
    // The assertion that matters: the two views agree. An asymmetry here is the
    // bug this whole model is prone to.
    expect(a.friends.map((f: { id: string }) => f.id)).toEqual([bobId]);
    expect(b.friends.map((f: { id: string }) => f.id)).toEqual([aliceId]);
    expect(a.outgoing).toHaveLength(0);
    expect(b.incoming).toHaveLength(0);
  });

  it("auto-accepts when the recipient had already asked", async () => {
    await reset();
    asUser(aliceId, "alice");
    const { POST } = await import("@/app/api/friends/route");
    await POST(json({ userId: bobId }));

    // Bob now asks Alice. Rather than creating a second dead request, this
    // should resolve the existing one.
    asUser(bobId, "bob");
    const response = await POST(json({ userId: aliceId }));
    expect(response.status).toBe(200);
    expect((await response.json()).autoAccepted).toBe(true);

    const a = await friendsOf(aliceId, "alice");
    expect(a.friends.map((f: { id: string }) => f.id)).toEqual([bobId]);
  });

  it("refuses a duplicate request instead of creating a dead second one", async () => {
    await reset();
    asUser(aliceId, "alice");
    const { POST } = await import("@/app/api/friends/route");
    await POST(json({ userId: bobId }));
    const second = await POST(json({ userId: bobId }));
    expect(second.status).toBe(400);
    expect((await second.json()).code).toBe("ALREADY_REQUESTED");
    expect(
      await prisma.friendship.count({
        where: { OR: [{ requesterId: aliceId, addresseeId: bobId }, { requesterId: bobId, addresseeId: aliceId }] },
      }),
    ).toBe(1);
  });

  it("refuses a request to yourself", async () => {
    asUser(aliceId, "alice");
    const { POST } = await import("@/app/api/friends/route");
    const response = await POST(json({ userId: aliceId }));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("SELF_REQUEST");
  });

  it("only the recipient may accept", async () => {
    await reset();
    asUser(aliceId, "alice");
    const { POST, PATCH } = await import("@/app/api/friends/route");
    await POST(json({ userId: bobId }));

    // The actual attack: Alice, who sent the request, claims to be Bob and
    // accepts it herself. A lookup that considers both directions without
    // checking who is speaking would let this through.
    const impersonate = await PATCH(json({ userId: bobId, action: "accept" }));
    expect(impersonate.status).toBe(404);
    // And it must not have taken effect.
    expect(
      (await prisma.friendship.findUnique({
        where: { requesterId_addresseeId: { requesterId: aliceId, addresseeId: bobId } },
      }))!.status,
    ).toBe("pending");

    // Alice also cannot respond to a non-existent request addressed to her.
    const self = await PATCH(json({ userId: aliceId, action: "accept" }));
    expect(self.status).toBe(404);

    // A third party cannot accept on Bob's behalf either.
    asUser(carolId, "carol");
    const third = await PATCH(json({ userId: aliceId, action: "accept" }));
    expect(third.status).toBe(404);
  });

  it("counts mutual friends correctly", async () => {
    await reset();
    const { POST, PATCH } = await import("@/app/api/friends/route");

    // Alice and Bob both know Carol, so they have one mutual friend.
    asUser(carolId, "carol");
    await POST(json({ userId: aliceId }));
    asUser(aliceId, "alice");
    await PATCH(json({ userId: carolId, action: "accept" }));

    asUser(bobId, "bob");
    await POST(json({ userId: carolId }));
    asUser(carolId, "carol");
    await PATCH(json({ userId: bobId, action: "accept" }));

    // Alice and Bob are not friends yet, so asking about Bob from Alice's view
    // is meaningless — but once they are:
    asUser(aliceId, "alice");
    await POST(json({ userId: bobId }));
    asUser(bobId, "bob");
    await PATCH(json({ userId: aliceId, action: "accept" }));

    // The graph is now a triangle: Alice-Bob, Alice-Carol, Bob-Carol. So Bob and
    // Carol each have exactly one mutual friend, and it is each other.
    const a = await friendsOf(aliceId, "alice");
    expect(a.friends.find((f: { id: string }) => f.id === bobId).mutualFriends).toBe(1);
    expect(a.friends.find((f: { id: string }) => f.id === carolId).mutualFriends).toBe(1);

    // Dave knows only Alice, so the count is genuinely zero. Without this the
    // test would pass even if the counter always returned 1.
    asUser(aliceId, "alice");
    await POST(json({ userId: daveId }));
    asUser(daveId, "dave");
    await PATCH(json({ userId: aliceId, action: "accept" }));

    const b = await friendsOf(bobId, "bob");
    const daveFromDave = await friendsOf(daveId, "dave");
    // Bob does not know Dave at all, so Dave is absent from Bob's list; what
    // matters is that from Dave's view Alice's other friends are not mutual.
    expect(b.friends.map((f: { id: string }) => f.id)).not.toContain(daveId);
    const aliceFromDave = daveFromDave.friends.find((f: { id: string }) => f.id === aliceId);
    expect(aliceFromDave.mutualFriends).toBe(0);
  });

  it("removes the friendship from both sides when unfriending", async () => {
    await reset();
    const { POST, PATCH, DELETE } = await import("@/app/api/friends/route");
    asUser(aliceId, "alice");
    await POST(json({ userId: bobId }));
    asUser(bobId, "bob");
    await PATCH(json({ userId: aliceId, action: "accept" }));

    // Bob unfriends Alice, even though Alice sent the request.
    const response = await DELETE(
      new Request(`http://localhost/api/friends?userId=${aliceId}`, { method: "DELETE" }),
    );
    expect(response.status).toBe(200);

    expect((await friendsOf(aliceId, "alice")).friends).toHaveLength(0);
    expect((await friendsOf(bobId, "bob")).friends).toHaveLength(0);
  });

  it("lets a declined request be sent again later", async () => {
    await reset();
    const { POST, PATCH } = await import("@/app/api/friends/route");
    asUser(aliceId, "alice");
    await POST(json({ userId: bobId }));
    asUser(bobId, "bob");
    await PATCH(json({ userId: aliceId, action: "decline" }));

    // Retrying must not fail on the compound primary key. This was a real
    // failure mode: the insert threw a unique violation instead of replacing
    // the declined row.
    asUser(aliceId, "alice");
    const retry = await POST(json({ userId: bobId }));
    expect(retry.status).toBe(201);
  });
});

describe("community posts", () => {
  let postId: string;

  afterEach(async () => {
    await prisma.communityPost.deleteMany({ where: { authorId: { in: [aliceId, bobId] } } });
  });

  it("creates a post and attributes it to a real user", async () => {
    asUser(aliceId, "alice");
    const { POST } = await import("@/app/api/community/route");
    const response = await POST(json({ body: "Unlocked the 30-day streak!" }));
    expect(response.status).toBe(201);
    const post = await response.json();
    postId = post.id;

    asUser(bobId, "bob");
    const { GET } = await import("@/app/api/community/route");
    const feed = await (await GET(get())).json();
    const entry = feed.posts.find((p: { id: string }) => p.id === postId);
    expect(entry.author.name).toBe("alice Test");
    expect(entry.likes).toBe(0);
    expect(entry.likedByMe).toBe(false);
  });

  it("toggles a like without inflating the count", async () => {
    asUser(aliceId, "alice");
    const community = await import("@/app/api/community/route");
    const post = await (
      await community.POST(json({ body: "Like me" }))
    ).json();

    asUser(bobId, "bob");
    const likes = await import("@/app/api/community/likes/route");
    const on = await likes.POST(json({ postId: post.id }));
    expect((await on.json()).likes).toBe(1);
    const off = await likes.POST(json({ postId: post.id }));
    expect((await off.json()).likes).toBe(0);

    // A different user liking it is a separate row, not a counter bump.
    asUser(carolId, "carol");
    expect((await (await likes.POST(json({ postId: post.id }))).json()).likes).toBe(1);
  });

  it("answers 'did I like this' per user", async () => {
    asUser(aliceId, "alice");
    const post = await (
      await (await import("@/app/api/community/route")).POST(json({ body: "Per-user likes" }))
    ).json();

    asUser(bobId, "bob");
    await (await import("@/app/api/community/likes/route")).POST(json({ postId: post.id }));

    asUser(aliceId, "alice");
    const feed = await (
      await (await import("@/app/api/community/route")).GET(get())
    ).json();
    expect(feed.posts.find((p: { id: string }) => p.id === post.id).likedByMe).toBe(false);

    asUser(bobId, "bob");
    const feed2 = await (
      await (await import("@/app/api/community/route")).GET(get())
    ).json();
    expect(feed2.posts.find((p: { id: string }) => p.id === post.id).likedByMe).toBe(true);
  });

  it("refuses to delete somebody else's post", async () => {
    asUser(aliceId, "alice");
    const post = await (
      await (await import("@/app/api/community/route")).POST(json({ body: "Mine" }))
    ).json();

    asUser(bobId, "bob");
    const response = await (
      await import("@/app/api/community/route")
    ).DELETE(
      new Request(`http://localhost/api/community?postId=${post.id}`, { method: "DELETE" }),
    );
    expect(response.status).toBe(403);
  });

  it("hides a deleted post rather than removing it from history", async () => {
    asUser(aliceId, "alice");
    const post = await (
      await (await import("@/app/api/community/route")).POST(json({ body: "Oops" }))
    ).json();

    await (
      await import("@/app/api/community/route")
    ).DELETE(
      new Request(`http://localhost/api/community?postId=${post.id}`, { method: "DELETE" }),
    );

    asUser(bobId, "bob");
    const feed = await (
      await (await import("@/app/api/community/route")).GET(get())
    ).json();
    expect(feed.posts.find((p: { id: string }) => p.id === post.id)).toBeUndefined();
    // Soft delete: the row survives, so comments under it are not orphaned.
    expect(await prisma.communityPost.count({ where: { id: post.id } })).toBe(1);
  });

  it("stores the post category separately from an optional related link", async () => {
    asUser(aliceId, "alice");
    const community = await import("@/app/api/community/route");

    // A categorised post with no link is valid. These were conflated into one
    // column first, and the pairing validation then rejected every post the
    // composer could produce.
    const categorised = await community.POST(
      json({ body: "Streak milestone", type: "streak" }),
    );
    expect(categorised.status).toBe(201);
    expect((await categorised.json()).type).toBe("streak");

    // A half-supplied relation is still an error, in either direction.
    expect(
      (await community.POST(json({ body: "bad rel", relatedType: "lesson" }))).status,
    ).toBe(400);
    expect(
      (await community.POST(json({ body: "bad rel", relatedId: "l1" }))).status,
    ).toBe(400);

    // An unknown category falls back rather than vanishing from every filter.
    const odd = await community.POST(json({ body: "weird type", type: "nonsense" }));
    expect(odd.status).toBe(201);
    expect((await odd.json()).type).toBe("milestone");
  });

  it("rejects an over-long post before writing anything", async () => {
    asUser(aliceId, "alice");
    const response = await (
      await import("@/app/api/community/route")
    ).POST(json({ body: "x".repeat(501) }));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("POST_TOO_LONG");
  });
});
