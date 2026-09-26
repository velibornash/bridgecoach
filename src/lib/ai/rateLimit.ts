/**
 * Rate limiting for AI-consuming endpoints (Sprint 58 follow-up, P1).
 *
 * THE PROBLEM
 * `/api/coach` and `/api/tactical/validate` call paid external providers using
 * server-held API keys. Before this, they were unauthenticated and unrated: any
 * anonymous visitor could drive the account's quota, and `/api/coach` let the
 * caller choose `provider` and `model` from the request body.
 *
 * WHAT THIS DOES
 *  - Fixed-window limiter keyed by client identity + route.
 *  - Provider and model are PINNED SERVER-SIDE. The request body can no longer
 *    choose them, so a caller cannot steer requests to an expensive model.
 *
 * Deliberately in-memory: this is a single-instance app and Sprint 59 will add
 * real sessions. `KNOWN LIMITATION` is documented below and in
 * `docs/verification/SPRINT_58_VERIFICATION.md` §19 — a multi-instance
 * deployment must move this to a shared store (Redis/Postgres) or it will not
 * hold.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Buckets are also capped in size. Without the cap, a hostile client rotating
 * spoofed addresses could grow this map without bound.
 */
const MAX_BUCKETS = 10_000;

const globalForLimiter = globalThis as unknown as { __aiRateLimit?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = (globalForLimiter.__aiRateLimit ??= new Map());

export interface RateLimitConfig {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed per window. */
  limit: number;
}

export const AI_RATE_LIMITS = {
  /** Conversational coach: one call per user message. */
  chat: { windowMs: 60_000, limit: 20 },
  /** Bid hint/validation: called on every tactical bid. */
  bidding: { windowMs: 60_000, limit: 40 },
} satisfies Record<string, RateLimitConfig>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfterSeconds: number;
  limit: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_BUCKETS) {
      // Drop the oldest half rather than refusing all traffic.
      const entries = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
      for (const [k] of entries.slice(0, Math.floor(entries.length / 2))) {
        buckets.delete(k);
      }
    }
    const fresh: Bucket = { count: 1, resetAt: now + config.windowMs };
    buckets.set(key, fresh);
    return {
      allowed: true,
      remaining: config.limit - 1,
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
      limit: config.limit,
    };
  }

  bucket.count += 1;
  const allowed = bucket.count <= config.limit;
  return {
    allowed,
    remaining: Math.max(0, config.limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    limit: config.limit,
  };
}

/** Test helper — clears all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Best-effort *network* identity: the first forwarded address.
 *
 * Spoofable by anyone who can set a request header, so on its own this is only a
 * fairness control against accidental runaway clients, never a security
 * boundary. Use `rateLimitKey` for quota enforcement.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip && ip.length > 0 ? ip : "local";
}

/**
 * The identity a quota should be charged to.
 *
 * Prefers the authenticated user id, because that is the only part of the
 * request an attacker cannot change. Everything below the user id is a
 * convenience:
 *
 * - The network address still caps one person from consuming the whole quota
 *   with many accounts, and caps one account from spreading usage over many
 *   addresses.
 * - The unauthenticated marker keeps pre-sign-in traffic (the sign-in endpoint
 *   itself) bucketed without pretending it is a real account.
 *
 * Callers that have already resolved a session should pass its user id. When
 * `userId` is null the result degrades to the old spoofable behaviour, which is
 * correct for the sign-in route and for nothing else.
 */
export function rateLimitKey(request: Request, userId: string | null): string {
  if (userId) return `user:${userId}`;
  return `anon:${clientKey(request)}`;
}

/**
 * The provider the server is configured to use, ignoring anything the client
 * asks for. Returns undefined when the server has no provider configured.
 */
export function pinnedProvider(): string | undefined {
  return process.env.AI_PROVIDER?.toLowerCase();
}
