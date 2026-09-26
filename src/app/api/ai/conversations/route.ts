/**
 * AI conversations (Sprint 58 §16, §17, §20).
 *
 * GET  /api/ai/conversations → the user's conversations with their messages
 * POST /api/ai/conversations → start a conversation, optionally bound to a
 *                               practice session / hand / auction (§17)
 *
 * SECURITY: the AI gateway stays responsible for provider communication and its
 * keys are never read here. Only provider NAME and model are stored — never a key
 * or any other credential.
 */
import { NextResponse } from "next/server";
import {
  handleRoute,
  withUser,
  prisma,
  readJson,
  optionalInt,
  badRequest,
  notFound,
} from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(async () =>
  withUser(async (userId) => {
    const conversations = await prisma.aIConversation.findMany({
      where: { userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        // Context is stored as references, not duplicated hand/auction payloads.
        practiceSessionId: c.practiceSessionId,
        handId: c.handId,
        auctionId: c.auctionId,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        messages: c.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          provider: m.provider,
          model: m.model,
          inputTokens: m.inputTokens,
          outputTokens: m.outputTokens,
          createdAt: m.createdAt.toISOString(),
        })),
      })),
    });
  }),
);

interface ConversationBody {
  title?: unknown;
  practiceSessionId?: unknown;
  handId?: unknown;
  auctionId?: unknown;
  context?: unknown;
}

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<ConversationBody>(request);

    if (body.practiceSessionId != null && typeof body.practiceSessionId !== "string") {
      throw badRequest('"practiceSessionId" must be a string', "VALIDATION_ERROR");
    }
    if (body.practiceSessionId) {
      const session = await prisma.practiceSession.findFirst({
        where: { id: body.practiceSessionId, userId },
        select: { id: true },
      });
      if (!session) {
        throw notFound(`Practice session "${body.practiceSessionId}" does not exist`);
      }
    }
    if (body.handId != null && typeof body.handId !== "string") {
      throw badRequest('"handId" must be a string', "VALIDATION_ERROR");
    }
    if (body.auctionId != null && typeof body.auctionId !== "string") {
      throw badRequest('"auctionId" must be a string', "VALIDATION_ERROR");
    }

    const conversation = await prisma.aIConversation.create({
      data: {
        userId,
        title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : "New conversation",
        practiceSessionId:
          typeof body.practiceSessionId === "string" ? body.practiceSessionId : null,
        handId: typeof body.handId === "string" ? body.handId : null,
        auctionId: typeof body.auctionId === "string" ? body.auctionId : null,
        context:
          body.context !== undefined ? JSON.parse(JSON.stringify(body.context)) : undefined,
      },
    });

    return NextResponse.json(
      {
        id: conversation.id,
        title: conversation.title,
        practiceSessionId: conversation.practiceSessionId,
        handId: conversation.handId,
        auctionId: conversation.auctionId,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: [],
      },
      { status: 201 },
    );
  }),
);
