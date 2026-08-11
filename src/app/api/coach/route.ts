import { NextRequest, NextResponse } from "next/server";
import { complete, isAiConfigured } from "@/lib/ai/gateway";
import { AiGatewayError, AiProviderType, SUPPORTED_PROVIDERS } from "@/lib/ai/types";

export const runtime = "nodejs";

interface CoachRequestBody {
  systemPrompt?: string;
  userPrompt?: string;
  provider?: string;
  model?: string;
}

/**
 * Server-side AI endpoint. Provider keys live only on the server (env vars)
 * and are resolved by the gateway — they are never sent to the browser.
 */
export async function POST(req: NextRequest) {
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

  const provider = body.provider
    ? (body.provider.toLowerCase() as AiProviderType)
    : undefined;
  if (provider && !(SUPPORTED_PROVIDERS as string[]).includes(provider)) {
    return NextResponse.json(
      { error: `Unsupported AI provider: ${body.provider}` },
      { status: 400 }
    );
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "No AI provider configured. The coach is running in offline mock mode.",
        code: "AI_PROVIDER_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  try {
    const response = await complete({
      systemPrompt: body.systemPrompt,
      userPrompt,
      provider,
      model: body.model,
    });
    return NextResponse.json({
      content: response.content,
      provider: response.provider,
      model: response.model,
    });
  } catch (e) {
    if (e instanceof AiGatewayError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error("AI coach route error:", e);
    return NextResponse.json({ error: "Unexpected AI error." }, { status: 500 });
  }
}
