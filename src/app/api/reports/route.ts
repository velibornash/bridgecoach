/**
 * Content reports (Sprint 60 follow-up).
 *
 *   POST /api/reports → file a report against a post, comment, or user
 *   GET  /api/reports → the open queue, for administrators
 *
 * **Filing a report changes nothing.** No post is hidden, no account suspended,
 * no automatic action taken. That is the whole design constraint: if reporting
 * auto-hid content, one user could remove another's post by clicking a button,
 * which is the abuse the queue exists to prevent. An administrator decides, at
 * `/admin`.
 *
 * The compound unique index on (reporterId, targetType, targetId) means holding
 * the button cannot flood the queue with duplicates.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, readJson, badRequest, notFound, requireString } from "@/lib/apiRoute";
import { requireAdmin } from "@/lib/admin";
import { limitWrite } from "@/lib/writeLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGET_TYPES = new Set(["post", "comment", "user"]);
const REASONS = new Set(["spam", "abuse", "off_topic", "spam_misleading", "other"]);
const MAX_DETAIL = 500;

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    // Filing a report is a write from the user's point of view, so it shares the
    // posting quota. A report spammer is the same problem as a post spammer.
    const limited = await limitWrite(request, "reports:file", {
      windowMs: 60 * 60_000,
      limit: 10,
    });
    if (limited) return limited;

    const body = await readJson<{
      targetType?: unknown;
      targetId?: unknown;
      reason?: unknown;
      detail?: unknown;
    }>(request);

    const targetType = requireString(body.targetType, "targetType");
    if (!TARGET_TYPES.has(targetType)) {
      throw badRequest("targetType must be post, comment, or user", "INVALID_TARGET_TYPE");
    }
    const targetId = requireString(body.targetId, "targetId");
    const reason = requireString(body.reason, "reason");
    if (!REASONS.has(reason)) {
      throw badRequest("reason is not recognised", "INVALID_REASON");
    }
    if (targetType === "user" && targetId === userId) {
      throw badRequest("You cannot report yourself", "SELF_REPORT");
    }
    const detail =
      typeof body.detail === "string" ? body.detail.trim().slice(0, MAX_DETAIL) : null;

    // Confirm the target exists, so a report cannot be filed against nothing.
    if (targetType === "post") {
      const post = await prisma.communityPost.findUnique({
        where: { id: targetId },
        select: { id: true, deletedAt: true },
      });
      if (!post || post.deletedAt) throw notFound("No such post");
    } else if (targetType === "comment") {
      const comment = await prisma.postComment.findUnique({
        where: { id: targetId },
        select: { id: true, deletedAt: true },
      });
      if (!comment || comment.deletedAt) throw notFound("No such comment");
    } else {
      const user = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!user) throw notFound("No such user");
    }

    // Idempotent: a second report of the same target by the same person is a
    // no-op rather than an error, so a double-click is not a support ticket.
    const report = await prisma.contentReport.upsert({
      where: { reporterId_targetType_targetId: { reporterId: userId, targetType, targetId } },
      create: { reporterId: userId, targetType, targetId, reason, detail },
      update: {},
    });

    return NextResponse.json({ reportId: report.id, status: report.status }, { status: 201 });
  }),
);

export const GET = handleRoute(async () => {
  await requireAdmin();

  const reports = await prisma.contentReport.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  // Resolve the reported content in the same pass, so the queue is readable
  // without N queries and a deleted target shows as such rather than vanishing.
  const postIds = reports.filter((r) => r.targetType === "post").map((r) => r.targetId);
  const commentIds = reports.filter((r) => r.targetType === "comment").map((r) => r.targetId);
  const userIds = reports.filter((r) => r.targetType === "user").map((r) => r.targetId);

  const [posts, comments, users] = await Promise.all([
    postIds.length
      ? prisma.communityPost.findMany({
          where: { id: { in: postIds } },
          select: { id: true, body: true, deletedAt: true, author: { select: { id: true, firstName: true, lastName: true } } },
        })
      : Promise.resolve([]),
    commentIds.length
      ? prisma.postComment.findMany({
          where: { id: { in: commentIds } },
          select: { id: true, body: true, deletedAt: true, author: { select: { id: true, firstName: true, lastName: true } } },
        })
      : Promise.resolve([]),
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true, email: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const excerpt = (body: string) => (body.length > 140 ? `${body.slice(0, 140)}…` : body);

  return NextResponse.json({
    reports: reports.map((r) => {
      let content: { exists: boolean; body?: string; authorId?: string; authorName?: string } = {
        exists: false,
      };
      if (r.targetType === "post") {
        const p = posts.find((x) => x.id === r.targetId);
        content = p
          ? {
              exists: !p.deletedAt,
              body: excerpt(p.body),
              authorId: p.author.id,
              authorName: `${p.author.firstName} ${p.author.lastName}`.trim(),
            }
          : { exists: false };
      } else if (r.targetType === "comment") {
        const c = comments.find((x) => x.id === r.targetId);
        content = c
          ? {
              exists: !c.deletedAt,
              body: excerpt(c.body),
              authorId: c.author.id,
              authorName: `${c.author.firstName} ${c.author.lastName}`.trim(),
            }
          : { exists: false };
      } else {
        const u = users.find((x) => x.id === r.targetId);
        content = u
          ? { exists: true, authorId: u.id, authorName: `${u.firstName} ${u.lastName}`.trim() }
          : { exists: false };
      }

      return {
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        detail: r.detail,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        reporter: {
          id: r.reporter.id,
          name: `${r.reporter.firstName} ${r.reporter.lastName}`.trim(),
          email: r.reporter.email,
        },
        content,
      };
    }),
  });
});

interface ResolveBody {
  reportId?: unknown;
  action?: unknown;
  resolution?: unknown;
}

/** Close a report. `action` records what the administrator did, if anything. */
export const PATCH = handleRoute(async (request: Request) => {
  const admin = await requireAdmin();
  const body = await readJson<ResolveBody>(request);
  const reportId = requireString(body.reportId, "reportId");
  const action = typeof body.action === "string" ? body.action : "dismissed";
  const resolution = typeof body.resolution === "string" ? body.resolution.slice(0, 500) : null;

  const report = await prisma.contentReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report) throw notFound("No such report");

  // A queue entry can only be closed once. Re-resolving a closed report would
  // rewrite an administrator's recorded decision.
  if (report.status !== "open") {
    throw badRequest(`That report is already ${report.status}`, "ALREADY_RESOLVED");
  }

  await prisma.contentReport.update({
    where: { id: reportId },
    data: {
      status: "resolved",
      resolution: resolution ?? action,
      resolvedBy: admin.id,
      resolvedAt: new Date(),
    },
  });

  return NextResponse.json({ reportId, status: "resolved" });
});
