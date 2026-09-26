/**
 * HTTP client for the persistence API (Sprint 58 §19, §21).
 *
 * Replaces the Sprint 57 mock helpers (`simulateDelay` / `mockApiCall`), which
 * faked latency and returned fixture data. Everything here performs a real
 * request, so failures surface as real failures.
 *
 * The service layer is the only place that knows the API exists — components
 * call these helpers and never touch `fetch` or the database directly.
 */

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/** Error codes the API routes return, plus client-side transport failures. */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "ILLEGAL_CALL"
  | "INTERNAL_ERROR"
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "NETWORK_ERROR";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: ApiErrorCode | string = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/**
 * Performs a request against our own API and returns a parsed body.
 *
 * Throws `ApiRequestError` on any non-2xx response or transport failure, so a
 * caller can never mistake an error for an empty result (§21 — persistence
 * failures must not be silently swallowed).
 */
export async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiRequestError(
      0,
      "Could not reach the server. Check your connection and try again.",
      "NETWORK_ERROR",
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiRequestError(
        response.status,
        "The server returned a response we could not read.",
        "INTERNAL_ERROR",
      );
    }
  }

  if (!response.ok) {
    const record = payload as { error?: string; code?: string } | null;
    throw new ApiRequestError(
      response.status,
      record?.error ?? `Request failed with status ${response.status}`,
      record?.code ?? "INTERNAL_ERROR",
    );
  }

  return payload as T;
}

/**
 * Non-throwing variant for read paths where "no data yet" is a normal state the
 * UI must render as an empty view rather than an error (e.g. a new user with no
 * bookmarks). Write paths should use `apiFetch` so failures are loud.
 */
export async function apiFetchSafe<T>(
  path: string,
  options: Parameters<typeof apiFetch>[1] = {},
): Promise<ApiResponse<T>> {
  try {
    const data = await apiFetch<T>(path, options);
    return { data, error: null, status: 200 };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { data: null, error: error.message, status: error.status };
    }
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unexpected error",
      status: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Backwards-compatible shims
// ---------------------------------------------------------------------------
// Sprint 57 services and their tests import these names. They now hit the real
// API instead of faking latency. Removal is tracked in backlog 58.2.2.

/** @deprecated No longer simulates latency. Retained so existing imports resolve. */
export function simulateDelay(_ms = 0): Promise<void> {
  return Promise.resolve();
}

/** @deprecated Use {@link apiFetchSafe}. */
export async function mockApiCall<T>(path: string): Promise<ApiResponse<T>> {
  return apiFetchSafe<T>(path);
}

/** @deprecated Use {@link apiFetchSafe} and paginate in the route. */
export async function mockPaginatedApiCall<T>(
  path: string,
  page: number,
  pageSize: number,
): Promise<ApiResponse<{ items: T[]; total: number; page: number; pageSize: number }>> {
  const separator = path.includes("?") ? "&" : "?";
  const result = await apiFetchSafe<{ items: T[]; total: number }>(
    `${path}${separator}page=${page}&pageSize=${pageSize}`,
  );
  return {
    data: result.data
      ? { ...result.data, page, pageSize }
      : null,
    error: result.error,
    status: result.status,
  };
}

export function createApiResponse<T>(data: T): ApiResponse<T> {
  return { data, error: null, status: 200 };
}

export function createErrorResponse<T>(message: string, status = 500): ApiResponse<T> {
  return { data: null, error: message, status };
}
