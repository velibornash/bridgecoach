/**
 * Author Studio drafts (Sprint 58 §15, §20).
 *
 * GET    /api/author-studio/drafts      → the user's drafts
 * POST   /api/author-studio/drafts      → create or update a draft
 * DELETE /api/author-studio/drafts/[id] → delete
 *
 * This replaces the localStorage-only persistence that Sprint 57 extracted into
 * `authorStudioService`. The service still exists, but the database is now the
 * source of truth; localStorage may only act as a cache.
 */
import { NextResponse } from "next/server";
import {
  handleRoute,
  withUser,
  prisma,
  readJson,
  requireString,
  notFound,
} from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const drafts = await prisma.authorDraft.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({
      drafts: drafts.map((d) => ({
        id: d.id,
        contentId: d.contentId,
        title: d.title,
        blocks: d.blocks,
        metadata: d.metadata,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
    });
  }),
);

interface DraftBody {
  id?: unknown;
  title?: unknown;
  blocks?: unknown;
  metadata?: unknown;
  contentId?: unknown;
}

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<DraftBody>(request);
    const title = requireString(body.title, "title");
    if (body.blocks === undefined || body.blocks === null) {
      throw notFound('"blocks" is required');
    }
    // Blocks are the learning-engine block array; stored as JSON.
    const blocks = JSON.parse(JSON.stringify(body.blocks));

    if (body.id != null && typeof body.id === "string") {
      // Update path — ownership enforced.
      const existing = await prisma.authorDraft.findUnique({
        where: { id: body.id },
        select: { id: true, userId: true },
      });
      if (!existing || existing.userId !== userId) {
        throw notFound(`Draft "${body.id}" does not exist`);
      }
      const updated = await prisma.authorDraft.update({
        where: { id: body.id },
        data: {
          title,
          blocks,
          ...(body.metadata !== undefined
            ? { metadata: JSON.parse(JSON.stringify(body.metadata)) }
            : {}),
        },
      });
      return NextResponse.json({
        id: updated.id,
        contentId: updated.contentId,
        title: updated.title,
        blocks: updated.blocks,
        metadata: updated.metadata,
        updatedAt: updated.updatedAt.toISOString(),
      });
    }

    // Create path.
    const draft = await prisma.authorDraft.create({
      data: {
        userId,
        contentId: typeof body.contentId === "string" ? body.contentId : null,
        title,
        blocks,
        metadata:
          body.metadata !== undefined
            ? JSON.parse(JSON.stringify(body.metadata))
            : undefined,
      },
    });

    return NextResponse.json(
      {
        id: draft.id,
        contentId: draft.contentId,
        title: draft.title,
        blocks: draft.blocks,
        metadata: draft.metadata,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      },
      { status: 201 },
    );
  }),
);
