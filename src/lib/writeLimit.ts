/**
 * Write rate limiting for user-generated content (Sprint 60 follow-up).
 *
 * Community posts and comments are the only endpoints where a single account can
 * put arbitrary text in front of every other user, so they are the ones that
 * need a quota. Reads are not limited: a user paging through their own history
 * should never be throttled.
 *
 * Charged to the user id, so a caller cannot reset the window by changing a
 * header, and a network address cannot be used to spread one account's quota
 * across many IPs.
 */
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitKey, type RateLimitConfig } from "@/lib/ai/rateLimit";
import { getSessionUser } from "@/lib/session";

/**
 * Returns a 429 response when the caller is over quota, or null when they may
 * proceed. Call it before any database write.
 */
export async function limitWrite(
  request: Request,
  bucket: string,
  config: RateLimitConfig,
): Promise<NextResponse | null> {
  const user = await getSessionUser();
  const result = checkRateLimit(`${bucket}:${rateLimitKey(request, user?.id ?? null)}`, config);

  if (result.allowed) return null;

  return NextResponse.json(
    {
      error: `You are posting too quickly. Try again in ${result.retryAfterSeconds}s.`,
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}
