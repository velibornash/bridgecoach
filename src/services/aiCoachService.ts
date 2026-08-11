import { simulateDelay } from "./api";

interface CoachMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  timestamp: number;
}

interface CoachApiResponse {
  content: string;
  provider: string;
  model: string;
}

const COACH_SYSTEM_PROMPT = `You are Bridge Coach, a friendly, expert contract-bridge teacher inside the Bridge Coach app.

Rules:
- Answer in clear, concise language. Use short bullet lists when helpful.
- Use bridge suit symbols (♠ ♥ ♦ ♣) and standard notation (e.g. 1NT, 2♣, P, X, XX).
- Tailor the depth to the student's level: beginner questions get step-by-step basics.
- Never claim certainty about opponents' hands; teach concepts, conventions and reasoning.
- If the question is about a specific deal, reason about it using standard bidding and play logic.
- If you don't know, say so honestly and suggest what to learn next.`;

const suggestedQuestions = [
  "What is a balanced hand?",
  "How do I bid 1NT?",
  "What is Stayman?",
  "How do finesses work?",
  "Tips for opening leads",
  "What is the Jacoby transfer?",
  "How do I count points?",
];

const mockResponses: Record<string, string> = {
  "What is a balanced hand?": "A balanced hand is one with:\n\n\u2022 No void or singleton\n\u2022 At most one doubleton\n\u2022 Distribution patterns: 4-3-3-3, 4-4-3-2, or 5-3-3-2\n\nWith a balanced hand and 15-17 HCP, open 1NT!",
  "How do I bid 1NT?": "Opening 1NT is simple:\n\n1. Count your high card points (A=4, K=3, Q=2, J=1)\n2. Check you have 15-17 HCP\n3. Verify your hand is balanced\n4. Open 1NT!\n\nExample: \u2660AJ3 \u2665KQ7 \u2666A84 \u2663KJ5 \u2014 16 HCP, balanced. Open 1NT.",
  "What is Stayman?": "Stayman is a convention used after a 1NT opening to find a 4-4 major suit fit:\n\n\u2022 Responder bids 2\u2663 (artificial, not clubs)\n\u2022 Opener bids a 4-card major if they have one\n\u2022 With no 4-card major, opener bids 2\u2666\n\nIt's one of the first conventions every player learns!",
  "How do finesses work?": "A finesse is a technique to win a trick with a lower card when the opponent holds a higher one:\n\n1. Lead toward your honor (not from it)\n2. If the opponent plays low, play your lower honor\n3. If they play high, play your higher card\n\nExample: You hold AQ, lead toward the Q. If the K is on your left, the Q wins!",
  "Tips for opening leads": "Key opening lead principles:\n\n\u2022 Against NT: Lead your longest and strongest suit\n\u2022 Against suit contracts: Lead a singleton or partner's suit\n\u2022 Lead top of a sequence (KQJ \u2192 K)\n\u2022 Avoid leading away from an ace\n\nThe opening lead often decides the contract!",
  "What is the Jacoby transfer?": "Jacoby transfers allow responder to show a 5+ card major after partner's 1NT opening:\n\n\u2022 Bid 2\u2666 to show 5+ hearts\n\u2022 Bid 2\u2665 to show 5+ spades\n\u2022 Opener must 'accept' by bidding the next suit up\n\nThis keeps the strong hand as declarer!",
  "How do I count points?": "High Card Points (HCP):\n\n\u2022 Ace = 4 points\n\u2022 King = 3 points\n\u2022 Queen = 2 points\n\u2022 Jack = 1 point\n\nTotal HCP in a deck = 40. Average hand = 10 HCP.\n\nDistribution points:\n\u2022 Void = 3 points\n\u2022 Singleton = 2 points\n\u2022 Doubleton = 1 point",
};

export function getSuggestedQuestions(): string[] {
  return suggestedQuestions;
}

export interface BidHintContext {
  hands: Record<string, string[]>;
  dealer: string;
  vulnerability: string;
  auction: string[];
  turn: string;
  expectedNextBid?: string;
}

const BID_HINT_SYSTEM_PROMPT = `You are an expert contract-bridge coach analyzing a bidding drill.

Rules:
- Explain the correct bid for the position to act and WHY, in up to 4 short sentences.
- Use bridge notation (1NT, 2♣, P, X). Show suits as ♠ ♥ ♦ ♣.
- Mention key features of the hand that justify the call (HCP, shape, controls, convention).
- Be encouraging and concise. Never answer in more than 90 words.`;

export async function getBidHint(ctx: BidHintContext): Promise<string> {
  const handLines = Object.entries(ctx.hands)
    .map(([pos, cards]) => `${pos}: ${cards.join(" ")}`)
    .join("\n");

  const auctionLine =
    ctx.auction.length === 0
      ? "(opening bid — no prior calls)"
      : ctx.auction.join(" ");

  const userPrompt = `Deal (each entry is a full 13-card hand in suit order ♠ ♥ ♦ ♣):
${handLines}

Dealer: ${ctx.dealer}   Vulnerability: ${ctx.vulnerability}
Auction so far: ${auctionLine}
Now ${ctx.turn} is on lead in the bidding.
${ctx.expectedNextBid ? `The drill's expected call is: ${ctx.expectedNextBid}. ` : ""}Explain what the best call is and why.`;

  try {
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: BID_HINT_SYSTEM_PROMPT,
        userPrompt,
        maxOutputTokens: 300,
      }),
    });

    if (!response.ok) {
      return offlineHint(ctx);
    }
    const data = (await response.json()) as CoachApiResponse;
    const content = data.content.trim();
    return content || offlineHint(ctx);
  } catch {
    return offlineHint(ctx);
  }
}

function offlineHint(ctx: BidHintContext): string {
  const expected = ctx.expectedNextBid;
  if (!expected) {
    return "No AI provider is configured, so I'm running in offline mode. Connect a provider (OPENAI_API_KEY / ANTHROPIC_API_KEY / AI_PROVIDER=ollama) to get real coaching hints.";
  }
  return `Offline mode: the drill expects ${expected} here. Try it and read the feedback — a configured AI provider would explain the full reasoning.`;
}

export interface BidValidationContext extends BidHintContext {
  proposedBid: string;
}

export interface BidVerdict {
  correct: boolean;
  suggestedBid: string;
  explanation: string;
  /** True when the Bridge Engine confirmed the call is legal. */
  legal?: boolean;
}

/**
 * Ask the real AI coach to judge whether a proposed bid is a good call for the
 * actual deal and auction. Returns null when the AI provider is unavailable so
 * the caller can fall back to the deterministic expert-line check.
 *
 * Legality is decided server-side by the Bridge Engine before any AI call.
 */
export async function validateTacticalBid(ctx: BidValidationContext): Promise<BidVerdict | null> {
  try {
    const response = await fetch("/api/tactical/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hands: ctx.hands,
        dealer: ctx.dealer,
        vulnerability: ctx.vulnerability,
        auction: ctx.auction,
        turn: ctx.turn,
        proposedBid: ctx.proposedBid,
      }),
    });

    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as BidVerdict;
    return {
      correct: Boolean(data.correct),
      suggestedBid: data.suggestedBid || "",
      explanation: data.explanation || "",
      legal: typeof data.legal === "boolean" ? data.legal : undefined,
    };
  } catch {
    return null;
  }
}

export async function sendMessage(message: string): Promise<CoachMessage> {
  // 1. Try the real AI provider through the server-side gateway.
  try {
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: COACH_SYSTEM_PROMPT,
        userPrompt: message,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as CoachApiResponse;
      return {
        id: `c${Date.now()}`,
        role: "coach",
        content: data.content.trim(),
        timestamp: Date.now(),
      };
    }

    // 503 = no provider configured. Other statuses (401/429/502) mean the
    // provider failed — degrade gracefully to the offline coach.
    if (response.status === 503) {
      return fallbackReply(message);
    }
  } catch {
    // Network failure — fall through to offline coach.
  }

  await simulateDelay(600 + Math.random() * 800);
  return fallbackReply(message);
}

function fallbackReply(message: string): CoachMessage {
  return {
    id: `c${Date.now()}`,
    role: "coach",
    content: mockResponses[message] || getGenericResponse(message),
    timestamp: Date.now(),
  };
}

function getGenericResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi")) {
    return "Hello there! I'm your Bridge Coach. Feel free to ask me anything about bridge \u2014 rules, bidding, play, or defense. What would you like to learn about?";
  }
  if (lower.includes("thank")) {
    return "You're welcome! Keep up the great work. Is there anything else you'd like to know?";
  }
  if (lower.includes("bye")) {
    return "Goodbye! Keep practicing and see you at the tables. Remember: every expert was once a beginner.";
  }
  return "That's a great question! In bridge, the key is to practice consistently. I'd recommend starting with the basics \u2014 counting points, understanding balanced hands, and learning the 1NT opening. Would you like me to explain any of these topics in detail?";
}
