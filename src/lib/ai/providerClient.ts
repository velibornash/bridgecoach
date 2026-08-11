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

/** Registry keyed by provider type (same role as the gateway's client map). */
export const PROVIDER_CLIENTS: Record<AiProviderType, ProviderClient> = {
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
