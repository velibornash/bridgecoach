import { NextRequest, NextResponse } from "next/server";
import { complete, isAiConfigured } from "@/lib/ai/gateway";
import { AiGatewayError } from "@/lib/ai/types";
import { AI_RATE_LIMITS, checkRateLimit, rateLimitKey, pinnedProvider } from "@/lib/ai/rateLimit";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

interface CoachRequestBody {
  systemPrompt?: string;
  userPrompt?: string;
  /** Accepted for backwards compatibility but IGNORED — see provider below. */
  provider?: string;
  /** Accepted for backwards compatibility but IGNORED — see model below. */
  model?: string;
}

const MAX_PROMPT_LENGTH = 8_000;
const MAX_SYSTEM_PROMPT_LENGTH = 4_000;

/**
 * Server-side AI endpoint.
 *
 * SECURITY (Sprint 58 follow-up, P1)
 *  - Provider keys live only on the server and are never sent to the browser.
 *  - `provider` and `model` from the request body are IGNORED. Previously a
 *    caller could steer requests to any supported provider and model, which both
 *    leaked information about the server's configuration and let a caller pick the
 *    most expensive option.
 *  - Rate limited per authenticated account, falling back to the network
 *    address only when there is no session. This endpoint spends real money on
 *    every call, so the quota is charged to the user id, which no client can
 *    change by editing a header.
 */
export async function POST(req: NextRequest) {
  // ---- Rate limit -------------------------------------------------------
  const session = await getSessionUser();
  const limit = checkRateLimit(
    `coach:${rateLimitKey(req, session?.id ?? null)}`,
    AI_RATE_LIMITS.chat,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many requests. Try again in ${limit.retryAfterSeconds}s.`,
        code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      },
    );
  }

  // ---- Parse ------------------------------------------------------------
  let body: CoachRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userPrompt = body.userPrompt?.trim();
  if (!userPrompt) {
    return NextResponse.json({ error: "userPrompt is required." }, { status: 400 });
  }
  if (userPrompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `userPrompt exceeds ${MAX_PROMPT_LENGTH} characters.`, code: "PROMPT_TOO_LONG" },
      { status: 413 },
    );
  }
  if (body.systemPrompt && body.systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
    return NextResponse.json(
      {
        error: `systemPrompt exceeds ${MAX_SYSTEM_PROMPT_LENGTH} characters.`,
        code: "PROMPT_TOO_LONG",
      },
      { status: 413 },
    );
  }

  // ---- Provider availability --------------------------------------------
  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "No AI provider configured. The coach is running in offline mock mode.",
        code: "AI_PROVIDER_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  try {
    // provider/model are pinned server-side. The request body's values are
    // deliberately not forwarded.
    const response = await complete({
      systemPrompt: body.systemPrompt,
      userPrompt,
      provider: pinnedProvider() as never,
    });
    return NextResponse.json(
      {
        content: response.content,
        provider: response.provider,
        model: response.model,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      },
    );
  } catch (e) {
    if (e instanceof AiGatewayError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error("AI coach route error:", e);
    return NextResponse.json({ error: "Unexpected AI error." }, { status: 500 });
  }
}
