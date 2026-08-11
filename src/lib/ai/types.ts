/**
 * AI provider layer, ported from the QALabAI project's AiGateway pattern.
 * The gateway is the single entry point for every AI call — agents and
 * services never talk to a provider directly.
 *
 * Server-only module: imported by the API route, never by client components.
 */

export type AiProviderType = "opencode" | "openai" | "anthropic" | "ollama";

export const SUPPORTED_PROVIDERS: AiProviderType[] = [
  "opencode",
  "openai",
  "anthropic",
  "ollama",
];

export interface AiRequest {
  /** System prompt that defines the role and rules for the model. */
  systemPrompt?: string;
  /** User prompt with the actual task/context. */
  userPrompt: string;
  /** Optional provider override; resolved from env when omitted. */
  provider?: AiProviderType;
  /** Optional model override; resolved from env when omitted. */
  model?: string;
  maxOutputTokens?: number;
}

export interface AiResponse {
  content: string;
  provider: AiProviderType;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** True when the provider did not return usage and tokens were estimated. */
  estimated: boolean;
}

export type AiGatewayErrorCode =
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "AI_CREDENTIAL_INVALID"
  | "AI_RATE_LIMITED"
  | "AI_INVALID_REQUEST"
  | "AI_PROVIDER_UNAVAILABLE";

/** Typed error thrown by the gateway; maps to an HTTP status for the API route. */
export class AiGatewayError extends Error {
  readonly code: AiGatewayErrorCode;
  readonly status: number;

  constructor(code: AiGatewayErrorCode, message: string, status: number) {
    super(message);
    this.name = "AiGatewayError";
    this.code = code;
    this.status = status;
  }

  static notConfigured(message: string): AiGatewayError {
    return new AiGatewayError("AI_PROVIDER_NOT_CONFIGURED", message, 503);
  }

  static credentialInvalid(message: string): AiGatewayError {
    return new AiGatewayError("AI_CREDENTIAL_INVALID", message, 401);
  }

  static rateLimited(message: string): AiGatewayError {
    return new AiGatewayError("AI_RATE_LIMITED", message, 429);
  }

  static invalidRequest(message: string): AiGatewayError {
    return new AiGatewayError("AI_INVALID_REQUEST", message, 400);
  }

  static providerUnavailable(message: string): AiGatewayError {
    return new AiGatewayError("AI_PROVIDER_UNAVAILABLE", message, 502);
  }
}
