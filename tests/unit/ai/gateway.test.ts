import { describe, it, expect, afterEach, vi } from "vitest";
import { complete, isAiConfigured } from "@/lib/ai/gateway";
import { AiGatewayError } from "@/lib/ai/types";

const OLD_ENV = process.env;

afterEach(() => {
  process.env = { ...OLD_ENV };
  vi.unstubAllGlobals();
});

function stubFetchOnce(status: number, body: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  }));
}

function stubFetchError(message: string) {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error(message)));
}

describe("AI gateway", () => {
  it("reports not configured when no provider env is set", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AI_PROVIDER;
    expect(isAiConfigured()).toBe(false);
  });

  it("throws AI_PROVIDER_NOT_CONFIGURED when nothing is configured", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AI_PROVIDER;

    await expect(complete({ userPrompt: "hello" })).rejects.toMatchObject({
      code: "AI_PROVIDER_NOT_CONFIGURED",
      status: 503,
    });
  });

  it("uses OPENAI_API_KEY as the default provider", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    stubFetchOnce(200, {
      choices: [{ message: { content: "Open 1NT" } }],
      usage: { prompt_tokens: 5, completion_tokens: 3 },
    });

    const result = await complete({ userPrompt: "what now?" });
    expect(result.content).toBe("Open 1NT");
    expect(result.provider).toBe("openai");
    expect(result.estimated).toBe(false);
    expect(result.inputTokens).toBe(5);
    expect(result.outputTokens).toBe(3);
  });

  it("parses Anthropic text blocks", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    stubFetchOnce(200, {
      content: [
        { type: "text", text: "Bid " },
        { type: "text", text: "2♣." },
      ],
      usage: { input_tokens: 7, output_tokens: 2 },
    });

    const result = await complete({ userPrompt: "hint please" });
    expect(result.content).toBe("Bid 2♣.");
    expect(result.provider).toBe("anthropic");
  });

  it("estimates tokens when usage is missing", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    stubFetchOnce(200, {
      choices: [{ message: { content: "Pass" } }],
    });

    const result = await complete({ userPrompt: "what now?" });
    expect(result.estimated).toBe(true);
    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThan(0);
  });

  it("classifies 401 as invalid credentials", async () => {
    process.env.OPENAI_API_KEY = "sk-wrong";
    stubFetchOnce(401, { error: "invalid_api_key" });

    await expect(complete({ userPrompt: "hi" })).rejects.toMatchObject({
      code: "AI_CREDENTIAL_INVALID",
      status: 401,
    });
  });

  it("classifies 429 as rate limited", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    stubFetchOnce(429, { error: "rate_limit_exceeded" });

    await expect(complete({ userPrompt: "hi" })).rejects.toMatchObject({
      code: "AI_RATE_LIMITED",
      status: 429,
    });
  });

  it("retries on 5xx then surfaces provider unavailable", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.AI_MAX_RETRIES = "1";
    process.env.AI_RETRY_BACKOFF_MS = "1";
    stubFetchOnce(500, { error: "boom" });

    await expect(complete({ userPrompt: "hi" })).rejects.toMatchObject({
      code: "AI_PROVIDER_UNAVAILABLE",
      status: 502,
    });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it("surfaces network failures as provider unavailable", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.AI_MAX_RETRIES = "0";
    stubFetchError("ECONNREFUSED");

    await expect(complete({ userPrompt: "hi" })).rejects.toMatchObject({
      code: "AI_PROVIDER_UNAVAILABLE",
      status: 502,
    });
  });

  it("throws a typed AiGatewayError instance", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AI_PROVIDER;
    delete process.env.OPENCODE_GO_API_KEY;
    delete process.env.OPENCODE_ZEN_API_KEY;

    try {
      await complete({ userPrompt: "hi" });
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(AiGatewayError);
    }
  });
});

describe("AI gateway — OpenCode (default)", () => {
  it("resolves opencode when OPENCODE keys are set", async () => {
    process.env.OPENCODE_GO_API_KEY = "sk-go-test";
    process.env.OPENCODE_ZEN_API_KEY = "sk-zen-test";
    expect(isAiConfigured()).toBe(true);
  });

  it("uses the Go endpoint first (Anthropic-style response)", async () => {
    process.env.OPENCODE_GO_API_KEY = "sk-go-test";
    process.env.OPENCODE_ZEN_API_KEY = "sk-zen-test";
    stubFetchOnce(200, {
      content: [{ type: "text", text: "Bid 3NT from Go." }],
      usage: { input_tokens: 3, output_tokens: 2 },
    });

    const result = await complete({ userPrompt: "what now?" });
    expect(result.content).toBe("Bid 3NT from Go.");
    expect(result.provider).toBe("opencode");

    const fetchMock = vi.mocked(fetch);
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/zen/go/v1/messages");
  });

  it("falls back to Zen when Go hits its usage limit (429 + usage)", async () => {
    process.env.OPENCODE_GO_API_KEY = "sk-go-test";
    process.env.OPENCODE_ZEN_API_KEY = "sk-zen-test";

    let calls = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => {
      calls += 1;
      if (String(url).includes("/go/v1/messages")) {
        return {
          ok: false,
          status: 429,
          text: () => Promise.resolve("{\"error\":\"usage limit exceeded\"}"),
        };
      }
      return {
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          choices: [{ message: { content: "Pass from Zen." } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        })),
      };
    }));

    const result = await complete({ userPrompt: "what now?" });
    expect(result.content).toBe("Pass from Zen.");
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it("tries the Zen fallback model after the primary returns empty", async () => {
    process.env.OPENCODE_GO_API_KEY = "sk-go-test";
    process.env.OPENCODE_ZEN_API_KEY = "sk-zen-test";

    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string, init?: { body?: string }) => {
      if (String(url).includes("/go/v1/messages")) {
        return {
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ content: [{ type: "text", text: "Go reply." }] })),
        };
      }
      const body = JSON.parse(init?.body ?? "{}");
      return {
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          choices: [{ message: { content: body.model === "mimo-v2.5-free" ? "Fallback reply." : "" } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        })),
      };
    }));

    const result = await complete({ userPrompt: "what now?" });
    expect(result.content).toBe("Go reply.");
  });
});
