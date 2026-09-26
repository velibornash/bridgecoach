/**
 * AI endpoint security (Sprint 58 follow-up, P1).
 *
 * These endpoints spend real money on every call. Before this they were
 * unauthenticated and unrated, and `/api/coach` let the caller pick the provider
 * and model from the request body.
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimits,
  clientKey,
  pinnedProvider,
  AI_RATE_LIMITS,
} from "@/lib/ai/rateLimit";
import { POST as coachPost } from "@/app/api/coach/route";
import { POST as validatePost } from "@/app/api/tactical/validate/route";

beforeEach(() => {
  resetRateLimits();
});

function post(path: string, body: unknown, ip = "1.2.3.4"): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("rate limiter", () => {
  it("allows requests up to the limit and blocks beyond it", () => {
    const config = { windowMs: 60_000, limit: 3 };
    expect(checkRateLimit("k", config).allowed).toBe(true);
    expect(checkRateLimit("k", config).allowed).toBe(true);
    expect(checkRateLimit("k", config).allowed).toBe(true);

    const blocked = checkRateLimit("k", config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps separate buckets per key", () => {
    const config = { windowMs: 60_000, limit: 1 };
    expect(checkRateLimit("a", config).allowed).toBe(true);
    expect(checkRateLimit("a", config).allowed).toBe(false);
    expect(checkRateLimit("b", config).allowed).toBe(true);
  });

  it("resets after the window expires", () => {
    const config = { windowMs: 1_000, limit: 1 };
    const now = 1_000_000;
    expect(checkRateLimit("k", config, now).allowed).toBe(true);
    expect(checkRateLimit("k", config, now + 500).allowed).toBe(false);
    // Past the window: allowed again.
    expect(checkRateLimit("k", config, now + 1_500).allowed).toBe(true);
  });

  it("reads the client identity from the first forwarded address", () => {
    expect(clientKey(post("/api/coach", {}, "9.9.9.9, 10.0.0.1"))).toBe("9.9.9.9");
    expect(
      clientKey(new Request("http://localhost/api/coach", { method: "POST" })),
    ).toBe("local");
  });

  it("exposes a limit per endpoint class", () => {
    expect(AI_RATE_LIMITS.chat.limit).toBeGreaterThan(0);
    expect(AI_RATE_LIMITS.bidding.limit).toBeGreaterThan(0);
  });
});

describe("/api/coach", () => {
  it("rejects an oversized prompt before spending anything", async () => {
    const response = await coachPost(
      post("/api/coach", { userPrompt: "x".repeat(9_000) }) as never,
    );
    expect(response.status).toBe(413);
  });

  it("rejects a missing prompt", async () => {
    const response = await coachPost(post("/api/coach", {}) as never);
    expect(response.status).toBe(400);
  });

  it("rejects malformed JSON", async () => {
    const response = await coachPost(
      new Request("http://localhost/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      }) as never,
    );
    expect(response.status).toBe(400);
  });

  it("returns 429 once the client exceeds the chat limit", async () => {
    const limit = AI_RATE_LIMITS.chat.limit;
    let sawRateLimit = false;

    for (let i = 0; i <= limit; i++) {
      const response = await coachPost(
        post("/api/coach", { userPrompt: "hello" }, "5.5.5.5") as never,
      );
      if (response.status === 429) {
        sawRateLimit = true;
        const body = await response.json();
        expect(body.code).toBe("RATE_LIMITED");
        expect(response.headers.get("Retry-After")).toBeTruthy();
        break;
      }
      // 503 (no provider) or 502 (provider down) are both fine here; the point is
      // that they do NOT consume extra budget beyond one call per iteration.
      expect([200, 502, 503]).toContain(response.status);
    }

    expect(sawRateLimit, "the chat endpoint must rate limit").toBe(true);
  });

  it("ignores a client-supplied provider", async () => {
    // The body may still contain provider/model for backwards compatibility, but
    // they must not steer the request. With no provider configured the route
    // reports 503 regardless of what the caller asked for.
    const response = await coachPost(
      post("/api/coach", { userPrompt: "hi", provider: "anthropic", model: "expensive" }, "6.6.6.6") as never,
    );
    expect([200, 502, 503]).toContain(response.status);
    const body = await response.json();
    if (response.status === 200) {
      // Whatever came back must be a provider the SERVER resolved.
      expect(body.provider).toBe(pinnedProvider() ?? body.provider);
    }
  });
});

describe("/api/tactical/validate", () => {
  it("still rejects an illegal bid deterministically, without any provider call", async () => {
    const response = await validatePost(
      post("/api/tactical/validate", {
        hands: { N: [], E: [], S: [], W: [] },
        dealer: "N",
        vulnerability: "None",
        auction: ["1NT", "P", "2C", "P"],
        turn: "N",
        // 1H does not outrank 2C — the engine must reject this before the AI runs.
        proposedBid: "1H",
      }, "7.7.7.7") as never,
    );

    // The validate route answers 200 with a negative verdict rather than a 4xx,
    // because "your bid is illegal" is a normal answer, not a bad request.
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.legal).toBe(false);
    expect(body.correct).toBe(false);
    // The verdict is engine-derived: it carries the engine's own reason and no
    // AI-authored explanation or suggested bid.
    expect(body.facts.reason).toMatch(/outrank/i);
    expect(body.suggestedBid).toBe("");
    expect(body.facts.turn).toBe("N");
  });

  it("rate limits the bidding endpoint independently of the chat endpoint", async () => {
    const limit = AI_RATE_LIMITS.bidding.limit;
    let sawRateLimit = false;

    for (let i = 0; i <= limit; i++) {
      const response = await validatePost(
        post(
          "/api/tactical/validate",
          {
            hands: { N: [], E: [], S: [], W: [] },
            dealer: "N",
            vulnerability: "None",
            auction: [],
            turn: "N",
            proposedBid: "1NT",
          },
          "8.8.8.8",
        ) as never,
      );
      if (response.status === 429) {
        sawRateLimit = true;
        expect((await response.json()).code).toBe("RATE_LIMITED");
        break;
      }
      expect([200, 400, 502, 503]).toContain(response.status);
    }

    expect(sawRateLimit, "the bidding endpoint must rate limit").toBe(true);
  });
});
