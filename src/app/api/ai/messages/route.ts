/**
 * AI conversation messages (Sprint 58 §16, §20).
 *
 * POST /api/ai/messages
 *
 * Appends a user message, calls the existing AI gateway, and persists the reply
 * so the conversation survives a browser refresh. The gateway remains solely
 * responsible for provider communication and key handling; this route never sees
 * a credential — only the provider/model NAME and usage counters are stored.
 */
import { NextResponse } from "next/server";
import { complete, isAiConfigured } from "@/lib/ai/gateway";
import { AiGatewayError } from "@/lib/ai/types";
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

interface MessageBody {
  conversationId?: unknown;
  content?: unknown;
  systemPrompt?: unknown;
}

const COACH_SYSTEM_PROMPT =
  "You are the Bridge Coach. Explain bridge concepts clearly and concisely. " +
  "Never invent scoring or bidding rules that are not standard.";

export const POST = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = await readJson<MessageBody>(request);
    const conversationId = requireString(body.conversationId, "conversationId");
    const content = requireString(body.content, "content");

    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });
    if (!conversation) throw notFound(`Conversation "${conversationId}" does not exist`);

    // Persist the user's message first so it is never lost if the provider fails.
    const userMessage = await prisma.aIMessage.create({
      data: { conversationId, role: "user", content },
    });

    if (!isAiConfigured()) {
      return NextResponse.json(
        {
          error: "No AI provider configured.",
          code: "AI_PROVIDER_NOT_CONFIGURED",
          conversationId,
          userMessageId: userMessage.id,
        },
        { status: 503 },
      );
    }

    try {
      const response = await complete({
        systemPrompt:
          typeof body.systemPrompt === "string" ? body.systemPrompt : COACH_SYSTEM_PROMPT,
        userPrompt: content,
      });

      const assistantMessage = await prisma.aIMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: response.content,
          // Metadata only — never a key or credential.
          provider: response.provider,
          model: response.model,
          inputTokens: response.inputTokens ?? null,
          outputTokens: response.outputTokens ?? null,
          estimated: response.estimated,
        },
      });

      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json(
        {
          conversationId,
          userMessageId: userMessage.id,
          message: {
            id: assistantMessage.id,
            role: assistantMessage.role,
            content: assistantMessage.content,
            provider: assistantMessage.provider,
            model: assistantMessage.model,
            createdAt: assistantMessage.createdAt.toISOString(),
          },
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof AiGatewayError) {
        return NextResponse.json(
          { error: error.message, code: error.code, conversationId },
          { status: error.status },
        );
      }
      console.error("[api/ai/messages] unexpected error:", error);
      return NextResponse.json(
        { error: "Unexpected AI error.", code: "INTERNAL_ERROR", conversationId },
        { status: 500 },
      );
    }
  }),
);
