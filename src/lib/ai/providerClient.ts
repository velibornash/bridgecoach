import { AiProviderType } from "./types";

/**
 * Low-level provider clients (ported from QALabAI's OpenAiCompatProviderClient
 * and AnthropicCompatProviderClient). Each client calls exactly one provider
 * with explicit credentials and returns content plus token usage. Clients never
 * perform credential or config logic — the gateway handles that.
 */

export interface ProviderCallRequest {
  systemPrompt?: string;
  userPrompt: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxOutputTokens?: number;
  /** OpenCode-specific config (Go → Zen fallback chain). */
  opencode?: OpenCodeConfig;
}

/** OpenCode managed config, ported from QALabAI's OpenCodeAiProvider. */
export interface OpenCodeConfig {
  goApiKey?: string;
  zenApiKey?: string;
  goBaseUrl: string;
  zenBaseUrl: string;
  goModel: string;
  zenModel: string;
  zenFallbackModel: string;
}

export interface ProviderCallResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  estimated: boolean;
  model: string;
}

export interface ProviderClient {
  readonly type: AiProviderType;
  call(request: ProviderCallRequest): Promise<ProviderCallResult>;
}

/** Wraps HTTP status + body so the gateway can classify errors. */
export class ProviderHttpError extends Error {
  readonly statusCode: number;
  readonly responseBody: string;

  constructor(provider: string, statusCode: number, responseBody: string) {
    super(`${provider}: HTTP ${statusCode}: ${responseBody}`);
    this.name = "ProviderHttpError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

interface OpenAiUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

interface OpenAiChoice {
  message?: { content?: string | Array<{ type?: string; text?: string }> };
}

interface OpenAiResponse {
  choices?: OpenAiChoice[];
  usage?: OpenAiUsage;
}

interface AnthropicTextBlock {
  type?: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

/**
 * Generic OpenAI-compatible chat client. Used for providers exposing an
 * OpenAI-style `/chat/completions` endpoint (OPENAI, OLLAMA via its
 * OpenAI-compatible gateway).
 */
class OpenAiCompatProviderClient implements ProviderClient {
  constructor(readonly type: AiProviderType) {}

  async call(request: ProviderCallRequest): Promise<ProviderCallResult> {
    const body = {
      model: request.model,
      max_tokens: request.maxOutputTokens ?? 4000,
      messages: [
        ...(request.systemPrompt
          ? [{ role: "system", content: request.systemPrompt }]
          : []),
        { role: "user", content: request.userPrompt },
      ],
    };

    const url = buildUrl(this.type, request.baseUrl, "/chat/completions");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (request.apiKey) {
      headers.Authorization = `Bearer ${request.apiKey}`;
    }

    const res = (await rawFetch(this.type, url, headers, body)) as OpenAiResponse;

    const content = extractOpenAiContent(res.choices);
    const usage = extractOpenAiUsage(res.usage);

    return {
      content,
      inputTokens: usage.input,
      outputTokens: usage.output,
      estimated: usage.estimated,
      model: request.model,
    };
  }
}

/**
 * Anthropic Messages API client. Same contract as the OpenAI-compatible client.
 */
class AnthropicCompatProviderClient implements ProviderClient {
  readonly type: AiProviderType = "anthropic";

  async call(request: ProviderCallRequest): Promise<ProviderCallResult> {
    const body = {
      model: request.model,
      max_tokens: request.maxOutputTokens ?? 4096,
      messages: [
        {
          role: "user",
          content: [
            ...(request.systemPrompt
              ? [{ type: "text", text: request.systemPrompt }]
              : []),
            { type: "text", text: request.userPrompt },
          ],
        },
      ],
    };

    const url = request.baseUrl?.endsWith("/messages")
      ? request.baseUrl
      : `${trimSlash(request.baseUrl ?? "https://api.anthropic.com")}/v1/messages`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    };
    if (request.apiKey) {
      headers["x-api-key"] = request.apiKey;
    }

    const res = (await rawFetch(this.type, url, headers, body)) as AnthropicResponse;

    const content = Array.isArray(res.content)
      ? res.content
          .filter((item) => item.type === "text")
          .map((item) => item.text ?? "")
          .join("")
      : "";

    const input = res.usage?.input_tokens ?? -1;
    const output = res.usage?.output_tokens ?? -1;
    const estimated = input < 0 || output < 0;

    return {
      content,
      inputTokens: estimated ? 0 : input,
      outputTokens: estimated ? 0 : output,
      estimated,
      model: request.model,
    };
  }
}

/**
 * OpenCode managed client, ported from QALabAI's OpenCodeAiProvider.
 *
 * Fallback chain:
 *  1. OpenCode Go   — Anthropic-style /v1/messages endpoint (x-api-key).
 *  2. OpenCode Zen  — OpenAI-style /chat/completions (primary model).
 *  3. OpenCode Zen  — fallback model.
 *
 * A Go 429 whose body mentions "usage" marks the Go allowance as exhausted,
 * skipping it for the remainder of the request.
 */
class OpenCodeProviderClient implements ProviderClient {
  readonly type: AiProviderType = "opencode";

  private static readonly MAX_ATTEMPTS = 2;
  private static readonly BASE_DELAY_MS = 1000;
  private static readonly MAX_DELAY_MS = 3000;

  async call(request: ProviderCallRequest): Promise<ProviderCallResult> {
    const cfg = request.opencode;
    if (!cfg) {
      throw new Error("opencode: missing OpenCodeConfig (gateway bug)");
    }

    const failures: string[] = [];
    let goExhausted = false;

    for (let attempt = 1; attempt <= OpenCodeProviderClient.MAX_ATTEMPTS; attempt++) {
      try {
        const content = await this.attemptChain(request, cfg, goExhausted);
        return {
          content,
          inputTokens: 0,
          outputTokens: 0,
          estimated: true,
          model: "opencode",
        };
      } catch (e) {
        if (e instanceof GoUsageLimitError) {
          goExhausted = true;
          failures.push(`Go: ${e.message}`);
        } else {
          failures.push((e as Error).message);
        }
        if (attempt < OpenCodeProviderClient.MAX_ATTEMPTS) {
          await sleep(this.backoff(attempt));
        }
      }
    }

    throw new Error(
      `opencode: all attempts failed. ${failures.join(" | ")}`
    );
  }

  private async attemptChain(
    request: ProviderCallRequest,
    cfg: OpenCodeConfig,
    goExhausted: boolean
  ): Promise<string> {
    if (!goExhausted && cfg.goApiKey) {
      const content = await callGoApi(request, cfg);
      if (content) return content;
    }

    if (cfg.zenApiKey) {
      const primary = await callZenApi(request, cfg, cfg.zenModel);
      if (primary) return primary;

      const fallback = await callZenApi(request, cfg, cfg.zenFallbackModel);
      if (fallback) return fallback;
    }

    throw new Error("no provider returned a usable response");
  }

  private backoff(attempt: number): number {
    return Math.min(
      OpenCodeProviderClient.MAX_DELAY_MS,
      OpenCodeProviderClient.BASE_DELAY_MS * 2 ** (attempt - 1)
    );
  }
}

async function callGoApi(
  request: ProviderCallRequest,
  cfg: OpenCodeConfig
): Promise<string> {
  const body = {
    model: cfg.goModel,
    max_tokens: request.maxOutputTokens ?? 12000,
    messages: [
      ...(request.systemPrompt
        ? [{ role: "system", content: request.systemPrompt }]
        : []),
      { role: "user", content: request.userPrompt },
    ],
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": cfg.goApiKey ?? "",
    "anthropic-version": "2023-06-01",
  };

  try {
    const res = await rawFetch(
      "opencode" as AiProviderType,
      trimSlash(cfg.goBaseUrl) + "/v1/messages",
      headers,
      body
    );
    return extractAnthropicContent(res);
  } catch (e) {
    if (e instanceof ProviderHttpError && isGoUsageLimit(e)) {
      throw new GoUsageLimitError(e.responseBody);
    }
    throw e;
  }
}

async function callZenApi(
  request: ProviderCallRequest,
  cfg: OpenCodeConfig,
  model: string
): Promise<string> {
  const body = {
    model,
    max_tokens: request.maxOutputTokens ?? 12000,
    // Zen reasoning models (big-pickle, mimo) burn the token budget on
    // "thinking" and can return empty content. Answer directly for fast,
    // reliable responses.
    thinking: { type: "disabled" },
    messages: [
      ...(request.systemPrompt
        ? [{ role: "system", content: request.systemPrompt }]
        : []),
      { role: "user", content: request.userPrompt },
    ],
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${cfg.zenApiKey ?? ""}`,
  };

  const res = (await rawFetch(
    "opencode" as AiProviderType,
    trimSlash(cfg.zenBaseUrl) + "/chat/completions",
    headers,
    body
  )) as OpenAiResponse;
  return extractOpenAiContent(res.choices);
}

function extractAnthropicContent(res: unknown): string {
  const content = (res as AnthropicResponse).content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("");
}

function isGoUsageLimit(e: ProviderHttpError): boolean {
  if (e.statusCode !== 429) return false;
  return e.responseBody.toLowerCase().includes("usage");
}

class GoUsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoUsageLimitError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Registry keyed by provider type (same role as the gateway's client map). */
export const PROVIDER_CLIENTS: Record<AiProviderType, ProviderClient> = {
  opencode: new OpenCodeProviderClient(),
  openai: new OpenAiCompatProviderClient("openai"),
  anthropic: new AnthropicCompatProviderClient(),
  ollama: new OpenAiCompatProviderClient("ollama"),
};

async function rawFetch(
  provider: AiProviderType,
  url: string,
  headers: Record<string, string>,
  body: unknown
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`${provider}: network error: ${(e as Error).message}`);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new ProviderHttpError(provider, res.status, text);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${provider}: invalid JSON response: ${text.slice(0, 200)}`);
  }
}

function buildUrl(
  provider: AiProviderType,
  baseUrl: string | undefined,
  suffix: string
): string {
  if (!baseUrl || baseUrl.trim() === "") {
    throw new Error(`${provider}: no base URL configured for this provider`);
  }
  return `${trimSlash(baseUrl)}${suffix}`;
}

function trimSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function extractOpenAiContent(choices: OpenAiChoice[] | undefined): string {
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const content = choices[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("");
  }
  return "";
}

function extractOpenAiUsage(usage: OpenAiUsage | undefined): {
  input: number;
  output: number;
  estimated: boolean;
} {
  if (!usage) return { input: 0, output: 0, estimated: true };
  const input = usage.prompt_tokens ?? -1;
  const output = usage.completion_tokens ?? -1;
  if (input < 0 || output < 0) return { input: 0, output: 0, estimated: true };
  return { input, output, estimated: false };
}
