import { OpenCodeConfig, ProviderHttpError, PROVIDER_CLIENTS } from "./providerClient";
import {
  AiGatewayError,
  AiProviderType,
  AiRequest,
  AiResponse,
  SUPPORTED_PROVIDERS,
} from "./types";

/**
 * Single entry point for all AI calls — the port of QALabAI's AiGateway.
 *
 * Responsibilities:
 *  - Resolve provider (request > AI_PROVIDER env > first configured key).
 *  - Resolve credentials from env (server-side only, never leaked to the client).
 *  - Execute the call with retries (not for invalid credentials / invalid request).
 *  - Classify provider HTTP errors into typed gateway errors.
 *  - Estimate tokens when the provider does not report usage.
 */

const DEFAULT_MODELS: Record<AiProviderType, string> = {
  opencode: "big-pickle",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
  ollama: "llama3.2",
};

const DEFAULT_BASE_URLS: Record<AiProviderType, string> = {
  opencode: "https://opencode.ai/zen",
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
  ollama: "http://localhost:11434/v1",
};

export async function complete(request: AiRequest): Promise<AiResponse> {
  const provider = resolveProvider(request);
  const client = PROVIDER_CLIENTS[provider];
  const model = resolveModel(request, provider);
  const apiKey = resolveApiKey(provider);
  const baseUrl = resolveBaseUrl(provider);

  const maxRetries = intFromEnv("AI_MAX_RETRIES", 2);
  const backoffMs = intFromEnv("AI_RETRY_BACKOFF_MS", 1500);

  let result;
  for (let attempt = 0; ; attempt++) {
    try {
      result = await client.call({
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        model,
        apiKey,
        baseUrl,
        maxOutputTokens: request.maxOutputTokens,
        opencode: provider === "opencode" ? resolveOpenCodeConfig() : undefined,
      });
      break;
    } catch (e) {
      if (e instanceof ProviderHttpError) {
        classifyHttpError(provider, e);
        if (attempt >= maxRetries) {
          throw AiGatewayError.providerUnavailable(
            `AI provider ${provider} unavailable: ${e.message}`
          );
        }
        await sleep(backoffMs * (attempt + 1));
        continue;
      }
      if (attempt >= maxRetries) {
        throw AiGatewayError.providerUnavailable(
          `AI provider ${provider} failed: ${(e as Error).message}`
        );
      }
      await sleep(backoffMs * (attempt + 1));
    }
  }

  let { inputTokens, outputTokens } = result;
  if (result.estimated) {
    inputTokens = estimateInputTokens(request.systemPrompt ?? "", request.userPrompt);
    outputTokens = estimateOutputTokens(result.content);
  }

  return {
    content: result.content,
    provider,
    model,
    inputTokens,
    outputTokens,
    estimated: result.estimated,
  };
}

/** Whether any AI provider is configured in the environment. */
export function isAiConfigured(): boolean {
  try {
    resolveProvider({ userPrompt: "" });
    return true;
  } catch {
    return false;
  }
}

function resolveProvider(request: AiRequest): AiProviderType {
  if (request.provider) return request.provider;

  const envProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (envProvider && (SUPPORTED_PROVIDERS as string[]).includes(envProvider)) {
    return envProvider as AiProviderType;
  }

  // OpenCode is the default managed provider (Go → Zen fallback chain).
  if (process.env.OPENCODE_GO_API_KEY || process.env.OPENCODE_ZEN_API_KEY) {
    return "opencode";
  }
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";

  throw AiGatewayError.notConfigured(
    "No AI provider configured. Set OPENCODE_GO_API_KEY / OPENCODE_ZEN_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or AI_PROVIDER=ollama."
  );
}

function resolveModel(request: AiRequest, provider: AiProviderType): string {
  if (request.model?.trim()) return request.model.trim();
  const envModel = envFor(provider, "MODEL");
  if (envModel?.trim()) return envModel.trim();
  return DEFAULT_MODELS[provider];
}

function resolveApiKey(provider: AiProviderType): string | undefined {
  if (provider === "openai") return process.env.OPENAI_API_KEY || undefined;
  if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY || undefined;
  if (provider === "opencode") return process.env.OPENCODE_ZEN_API_KEY || undefined;
  return undefined;
}

function resolveBaseUrl(provider: AiProviderType): string {
  const envBase = envFor(provider, "BASE_URL");
  return (envBase?.trim() || DEFAULT_BASE_URLS[provider]).trim();
}

/** OpenCode managed config: Go (primary) → Zen (fallback chain). */
function resolveOpenCodeConfig(): OpenCodeConfig {
  return {
    goApiKey: process.env.OPENCODE_GO_API_KEY || undefined,
    zenApiKey: process.env.OPENCODE_ZEN_API_KEY || undefined,
    goBaseUrl: process.env.OPENCODE_GO_BASE_URL?.trim() || "https://opencode.ai/zen/go",
    zenBaseUrl: process.env.OPENCODE_ZEN_BASE_URL?.trim() || "https://opencode.ai/zen/v1",
    goModel: process.env.OPENCODE_GO_MODEL?.trim() || "qwen3.7-plus",
    zenModel: process.env.OPENCODE_ZEN_MODEL?.trim() || "big-pickle",
    zenFallbackModel: process.env.OPENCODE_ZEN_FALLBACK_MODEL?.trim() || "mimo-v2.5-free",
  };
}

function envFor(provider: AiProviderType, suffix: string): string | undefined {
  const key = `${provider.toUpperCase()}_${suffix}`;
  return process.env[key];
}

function classifyHttpError(provider: AiProviderType, e: ProviderHttpError): void {
  const status = e.statusCode;
  if (status === 401 || status === 403) {
    throw AiGatewayError.credentialInvalid(
      `AI provider ${provider} rejected the credential (HTTP ${status}). Check your API key in the server .env.`
    );
  }
  if (status === 429) {
    throw AiGatewayError.rateLimited(
      `AI provider ${provider} rate limit reached (HTTP 429).`
    );
  }
  if (status === 400 || status === 404 || status === 422) {
    throw AiGatewayError.invalidRequest(
      `AI provider ${provider} rejected the request: ${e.message}`
    );
  }
  // Other statuses (5xx etc.) are retryable — return and let the caller retry.
}

function estimateInputTokens(systemPrompt: string, userPrompt: string): number {
  return Math.ceil((systemPrompt.length + userPrompt.length) / 4);
}

function estimateOutputTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function intFromEnv(key: string, fallback: number): number {
  const raw = Number(process.env[key]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
