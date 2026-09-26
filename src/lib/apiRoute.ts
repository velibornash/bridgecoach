/**
 * Shared helpers for persistence API routes (Sprint 58 §20, §21).
 *
 * SERVER-ONLY. Every route that touches private data resolves its owner through
 * `withUser`, so ownership can never be forgotten at the call site.
 *
 * Error handling follows §21: each mutation must be able to distinguish
 * validation errors, not-found, and server errors. `ApiError` carries an HTTP
 * status so `handleRoute` can turn it into a real response instead of a 500.
 */

import { prisma, resolveUserId } from "@/lib/db";
import { ApiError, badRequest, notFound, forbidden } from "@/lib/errors";

export { ApiError, badRequest, notFound, forbidden };
import { NextResponse } from "next/server";

/**
 * Route handlers that read `[id]` params use Next.js' own
 * `RouteContext<'/api/...'>` type. The wrapper stays generic by inferring the
 * route union from the global `RouteContext` helper rather than importing the
 * non-global `AppRouteHandlerRoutes`.
 */
/**
 * Structural context for route handlers.
 *
 * Next.js types `ctx` as `RouteContext<'/api/...'>` with a route-specific
 * `params` shape. `Promise<any>` is used deliberately so the wrapper accepts
 * every concrete `RouteContext<...>` without each handler having to re-declare
 * the wrapper's type. Handlers that need the params should still annotate
 * themselves with Next's `RouteContext<'/api/...'>`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteCtx = { params: Promise<any> };

/**
 * The wrapped handler. `ctx` is optional at the call site so a test can invoke a
 * route with only a Request; Next.js always supplies it.
 */
type RouteHandler = (request: Request, ctx?: RouteCtx) => Promise<NextResponse>;

/**
 * Wraps a route handler with uniform error mapping. Persistence failures are
 * never swallowed (§21): anything that is not an `ApiError` becomes a 500 with
 * the real error logged server-side.
 */
export function handleRoute<H extends (request: Request, ctx: never) => Promise<NextResponse>>(
  handler: H,
): RouteHandler {
  return async (request: Request, ctx?: RouteCtx) => {
    try {
      return await (handler as unknown as (
        request: Request,
        ctx?: RouteCtx,
      ) => Promise<NextResponse>)(request, ctx);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message, code: error.code ?? "ERROR" },
          { status: error.status },
        );
      }
      console.error("[api] unhandled error:", error);
      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 },
      );
    }
  };
}

/**
 * Resolves the owner for private data. TEMPORARY (Sprint 58 §27) — returns the
 * configured development identity. Sprint 59 replaces the body of
 * `resolveUserId` with real session resolution; call sites do not change.
 */
export async function withUser<T>(fn: (userId: string) => Promise<T>): Promise<T> {
  const userId = await resolveUserId();
  return fn(userId);
}

/** Parses and validates a JSON body, converting malformed input to a 400. */
export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw badRequest("Request body must be valid JSON", "INVALID_JSON");
  }
}

/** Validates a required non-empty string field. */
export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw badRequest(`"${field}" is required`, "VALIDATION_ERROR");
  }
  return value.trim();
}

/** Validates an optional integer field. */
export function optionalInt(
  value: unknown,
  field: string,
  { min, max }: { min?: number; max?: number } = {},
): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed)) {
    throw badRequest(`"${field}" must be an integer`, "VALIDATION_ERROR");
  }
  if (min !== undefined && parsed < min) {
    throw badRequest(`"${field}" must be >= ${min}`, "VALIDATION_ERROR");
  }
  if (max !== undefined && parsed > max) {
    throw badRequest(`"${field}" must be <= ${max}`, "VALIDATION_ERROR");
  }
  return parsed;
}

/** Validates an optional string-array field (used for completedSectionIds). */
export function optionalStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw badRequest(`"${field}" must be an array of strings`, "VALIDATION_ERROR");
  }
  return value as string[];
}

export { prisma };
