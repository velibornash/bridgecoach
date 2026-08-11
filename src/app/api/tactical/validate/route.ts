import { NextRequest, NextResponse } from "next/server";
import { complete, isAiConfigured } from "@/lib/ai/gateway";
import { AiGatewayError } from "@/lib/ai/types";

export const runtime = "nodejs";

interface ValidateRequestBody {
  hands: Record<string, string[]>;
  dealer: string;
  vulnerability: string;
  auction: string[];
  turn: string;
  proposedBid: string;
}

const SYSTEM_PROMPT = `You are a world-class contract-bridge bidding validator.
You are given a complete deal, the auction so far, and the call proposed by the player whose turn it is.

FIRST, explicitly note:
- The position to bid and their hand shape and HCP (e.g. "S has 4 spades, 3 hearts, 15 HCP").
- What each prior bid means in standard bidding (e.g. 2C after 1NT = Stayman, asking for a 4-card major).

THEN decide whether the proposed call is a GOOD bid — a reasonable expert call for this exact hand and auction — or a POOR bid.
A call is POOR if it misstates the bidder's shape or strength (e.g. a Stayman rebid that shows no 4-card major when the bidder HAS one, or that claims a major the bidder lacks).

Respond with ONLY a JSON object, no commentary:
{"correct": true|false, "suggestedBid": "<best call if poor, else leave blank>", "explanation": "<one short sentence>"}
- "correct": true only if the proposed call is reasonable for this exact position.
- "suggestedBid": the best expert call when "correct" is false; otherwise empty string.
- "explanation": one concise sentence (max 40 words) in the player's language if the app UI is non-English, otherwise English.`;

function extractJson(raw: string): { correct: boolean; suggestedBid: string; explanation: string } {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON object in AI response");
  }
  const parsed = JSON.parse(match[0]) as Partial<{
    correct: boolean;
    suggestedBid: string;
    explanation: string;
  }>;
  return {
    correct: Boolean(parsed.correct),
    suggestedBid: typeof parsed.suggestedBid === "string" ? parsed.suggestedBid.trim() : "",
    explanation: typeof parsed.explanation === "string" ? parsed.explanation.trim() : "",
  };
}

export async function POST(req: NextRequest) {
  let body: ValidateRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { hands, dealer, vulnerability, auction, turn, proposedBid } = body;
  if (
    !hands ||
    typeof dealer !== "string" ||
    typeof turn !== "string" ||
    typeof proposedBid !== "string" ||
    !Array.isArray(auction)
  ) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "No AI provider configured.", code: "AI_PROVIDER_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const handLines = (["N", "E", "S", "W"] as const)
    .map((pos) => `${pos}: ${(hands[pos] ?? []).join(" ")}`)
    .join("\n");

  const auctionLine =
    auction.length === 0 ? "(no prior calls)" : auction.join(" ");

  const userPrompt = `Deal (each entry is a full 13-card hand in suit order ♠ ♥ ♦ ♣):
${handLines}

Dealer: ${dealer}   Vulnerability: ${vulnerability}
Auction so far: ${auctionLine}
Position to bid: ${turn}
Proposed bid: ${proposedBid}

Is the proposed bid good? Answer with the JSON object.`;

  try {
    const response = await complete({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxOutputTokens: 400,
    });
    const verdict = extractJson(response.content);
    return NextResponse.json(verdict);
  } catch (e) {
    if (e instanceof AiGatewayError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error("Tactical validation route error:", e);
    return NextResponse.json({ error: "Unexpected AI error." }, { status: 500 });
  }
}
