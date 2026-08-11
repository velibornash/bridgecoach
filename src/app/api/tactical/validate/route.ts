import { NextRequest, NextResponse } from "next/server";
import { complete, isAiConfigured } from "@/lib/ai/gateway";
import { AiGatewayError } from "@/lib/ai/types";
import {
  AuctionStateMachine,
  LegalBidValidator,
  parseBid,
  formatBid,
  type Position,
  type Vulnerability,
} from "@/bridge";

export const runtime = "nodejs";

interface ValidateRequestBody {
  hands: Record<string, string[]>;
  dealer: string;
  vulnerability: string;
  auction: string[];
  turn: string;
  proposedBid: string;
}

/**
 * AI safety boundary:
 *
 *   Bridge Engine ──► Facts / legality / evaluation ──► AI Coach ──► Explanation
 *
 * The deterministic Bridge Engine decides LEGALITY. The LLM is never asked
 * whether a bid is legal, what the contract is, whose turn it is, or whether
 * the auction has ended. The LLM only explains STRATEGY for a bid the engine
 * has already confirmed as legal.
 */
const STRATEGY_SYSTEM_PROMPT = `You are a world-class contract-bridge bidding coach.
The Bridge Engine has already verified that the proposed call is LEGAL for this deal and auction. Your ONLY job is to judge its strategic quality and explain.

Rules:
- The following facts are authoritative and MUST be treated as ground truth: legality, whose turn it is, the current contract, the dealer, the vulnerability.
- Do not claim a legal bid is "illegal" or "not allowed". Judge only strategy.
- A bid that is legal but clearly weak for this exact hand/auction is a POOR strategic choice.
- If the bid is a reasonable expert call, it is CORRECT.

Respond with ONLY a JSON object, no commentary:
{"correct": true|false, "suggestedBid": "<best call if poor, else empty string>", "explanation": "<one short sentence, max 40 words>"}`;

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

  // ---- Deterministic legality check (no LLM involved) ----
  const positions: Position[] = ["N", "E", "S", "W"];
  const parsedDealer = positions.find((p) => p === dealer) ?? "N";
  const parsedTurn = positions.find((p) => p === turn) ?? null;
  const proposed = parseBid(proposedBid);

  if (!proposed) {
    return NextResponse.json({
      legal: false,
      correct: false,
      suggestedBid: "",
      explanation: `"${proposedBid}" is not a recognized bridge call.`,
    });
  }

  let machine: AuctionStateMachine;
  try {
    machine = new AuctionStateMachine({
      dealer: parsedDealer,
      vulnerability: (vulnerability ?? "None") as Vulnerability,
      history: auction,
    });
  } catch {
    return NextResponse.json({
      legal: false,
      correct: false,
      suggestedBid: "",
      explanation: "The auction history is inconsistent — it cannot be replayed by the Bridge Engine.",
    });
  }

  const legalCheck = new LegalBidValidator().isLegal(
    machine.getState(),
    machine.currentBidder,
    proposed,
  );
  const state = machine.getState();

  const legalFacts = {
    legal: legalCheck.legal,
    reason: legalCheck.reason ?? null,
    currentContract: state.currentContract
      ? formatBid({ type: "bid", level: state.currentContract.level, strain: state.currentContract.strain })
      : null,
    turn: machine.currentBidder,
    auctionComplete: state.isComplete,
  };

  if (!legalCheck.legal) {
    return NextResponse.json({
      legal: false,
      correct: false,
      suggestedBid: "",
      explanation: legalCheck.reason ?? "This call is not legal here.",
      facts: legalFacts,
    });
  }

  if (state.isComplete) {
    return NextResponse.json({
      legal: true,
      correct: false,
      suggestedBid: "",
      explanation: "The auction has already ended.",
      facts: legalFacts,
    });
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "No AI provider configured.", code: "AI_PROVIDER_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  // ---- Strategy evaluation: the LLM explains, the engine decides legality ----
  const handLines = (["N", "E", "S", "W"] as const)
    .map((pos) => `${pos}: ${(hands[pos] ?? []).join(" ")}`)
    .join("\n");

  const auctionLine = auction.length === 0 ? "(no prior calls)" : auction.join(" ");

  const userPrompt = `Deal (each entry is a full 13-card hand in suit order ♠ ♥ ♦ ♣):
${handLines}

Authoritative engine facts:
- Dealer: ${dealer}
- Vulnerability: ${vulnerability}
- Auction so far: ${auctionLine}
- Position to bid: ${machine.currentBidder} (client reported ${parsedTurn ?? "unknown"})
- The proposed call "${proposedBid}" is LEGAL.

Proposed call to evaluate: ${proposedBid}

Evaluate its STRATEGIC quality for this exact hand and auction. Answer with the JSON object.`;

  try {
    const response = await complete({
      systemPrompt: STRATEGY_SYSTEM_PROMPT,
      userPrompt,
      maxOutputTokens: 300,
    });
    const verdict = extractJson(response.content);
    return NextResponse.json({ legal: true, ...verdict, facts: legalFacts });
  } catch (e) {
    if (e instanceof AiGatewayError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    console.error("Tactical validation route error:", e);
    return NextResponse.json({ error: "Unexpected AI error." }, { status: 500 });
  }
}
