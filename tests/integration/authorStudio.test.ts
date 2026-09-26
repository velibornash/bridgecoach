/**
 * Author Studio persistence (Sprint 58 §15, §23).
 *
 * Route handlers are invoked directly: what matters is that drafts live in
 * PostgreSQL rather than localStorage, and that they survive a reload.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma, resolveUserId } from "@/lib/db";
import {
  GET as getDrafts,
  POST as postDraft,
} from "@/app/api/author-studio/drafts/route";
import { DELETE as deleteDraft } from "@/app/api/author-studio/drafts/[id]/route";
import type { LearningBlock } from "@/components/learningEngine/types";

const block: LearningBlock = { id: "b1", type: "paragraph", text: "Body" };

let userId: string;

function postReq(body: unknown) {
  return new Request("http://localhost/api/author-studio/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deleteReq(id: string) {
  return {
    request: new Request(`http://localhost/api/author-studio/drafts/${id}`, {
      method: "DELETE",
    }),
    // Next.js supplies route params as a promise on the handler context.
    context: { params: Promise.resolve({ id }) },
  };
}

const getReq = () => new Request("http://localhost/api/author-studio/drafts");

beforeAll(async () => {
  userId = await resolveUserId();
});

afterAll(async () => {
  await prisma.authorDraft.deleteMany({ where: { title: { startsWith: "jest-" } } });
  await prisma.$disconnect();
});

describe("author studio: drafts persist in the database", () => {
  it("creates a draft and re-reads it with its blocks intact", async () => {
    const created = await postDraft(postReq({ title: "jest-draft-A", blocks: [block] }));
    expect(created.status).toBe(201);
    const draft = (await created.json()) as { id: string; title: string };

    // Read straight from PostgreSQL — the "after refresh" check.
    const stored = await prisma.authorDraft.findUniqueOrThrow({ where: { id: draft.id } });
    expect(stored.title).toBe("jest-draft-A");
    expect(stored.blocks).toEqual([block]);
    expect(stored.userId).toBe(userId);
  });

  it("lists the user's drafts", async () => {
    const body = (await (await getDrafts(getReq())).json()) as {
      drafts: Array<{ id: string; title: string }>;
    };
    expect(body.drafts.some((d) => d.title === "jest-draft-A")).toBe(true);
  });

  it("updates an existing draft when an id is supplied", async () => {
    const created = (await (await postDraft(postReq({ title: "jest-draft-B", blocks: [block] }))).json()) as {
      id: string;
    };
    const updated = await postDraft(
      postReq({ id: created.id, title: "jest-draft-B-renamed", blocks: [block] }),
    );
    expect(updated.status).toBe(200);
    expect((await updated.json()).title).toBe("jest-draft-B-renamed");

    const stored = await prisma.authorDraft.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.title).toBe("jest-draft-B-renamed");
  });

  it("deletes a draft and it stays deleted", async () => {
    const created = (await (await postDraft(postReq({ title: "jest-draft-C", blocks: [block] }))).json()) as {
      id: string;
    };
    const args = deleteReq(created.id);
    const deleted = await deleteDraft(args.request, args.context as never);
    expect(deleted.status).toBe(200);
    expect(await prisma.authorDraft.findUnique({ where: { id: created.id } })).toBeNull();
  });

  it("404s a delete for an id that does not exist", async () => {
    const args = deleteReq("no-such-draft");
    const response = await deleteDraft(args.request, args.context as never);
    expect(response.status).toBe(404);
  });

  it("404s an update for a draft owned by nobody", async () => {
    const response = await postDraft(
      postReq({ id: "no-such-draft", title: "x", blocks: [block] }),
    );
    expect(response.status).toBe(404);
  });

  it("rejects a draft with no title", async () => {
    const response = await postDraft(postReq({ blocks: [block] }));
    expect(response.status).toBe(400);
  });

  it("every draft belongs to the current user — no orphans", async () => {
    const drafts = await prisma.authorDraft.findMany({
      where: { title: { startsWith: "jest-" } },
    });
    for (const draft of drafts) expect(draft.userId).toBe(userId);
  });
});
