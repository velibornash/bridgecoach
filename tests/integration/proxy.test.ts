/**
 * Proxy redirect rules and rate-limit keying (Sprint 59).
 *
 * The proxy is a UX guard, not a security boundary — these tests pin that
 * contract so nobody later "strengthens" it into something that looks
 * authoritative but is not.
 */
import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { rateLimitKey, clientKey } from "@/lib/ai/rateLimit";
import { config as proxyConfig } from "@/proxy";

function request(path: string, cookie?: string): NextRequest {
  const req = new NextRequest(new URL(path, "http://localhost:3000"));
  if (cookie) req.cookies.set("bridgecoach_session", cookie);
  return req;
}

const COOKIE = "any-value-at-all";

function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

/**
 * The dev identity must be honoured by the proxy for the same reason it is
 * honoured by resolveUserId(): otherwise local development cannot reach a
 * private page at all, which is a broken app rather than a safe one.
 */
describe("proxy agrees with resolveUserId about the development identity", () => {
  const realAllow = process.env.ALLOW_DEV_IDENTITY;
  const realNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    setEnv("ALLOW_DEV_IDENTITY", realAllow);
    setEnv("NODE_ENV", realNodeEnv);
  });

  it("lets a dev-identity browser through without a cookie", () => {
    setEnv("ALLOW_DEV_IDENTITY", "true");
    setEnv("NODE_ENV", "development");
    const response = proxy(request("/dashboard"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("still redirects when the dev identity is off", () => {
    setEnv("ALLOW_DEV_IDENTITY", "false");
    setEnv("NODE_ENV", "development");
    expect(proxy(request("/dashboard")).headers.get("location")).toContain("/login");
  });

  it("does not honour the dev identity in production", () => {
    setEnv("ALLOW_DEV_IDENTITY", "true");
    setEnv("NODE_ENV", "production");
    expect(proxy(request("/dashboard")).headers.get("location")).toContain("/login");
  });
});

describe("proxy redirects signed-out visitors", () => {
  // The test runner enables the dev identity for handler tests; these cases are
  // about the no-session path, so it is switched off for the block.
  beforeEach(() => {
    setEnv("ALLOW_DEV_IDENTITY", "false");
    setEnv("NODE_ENV", "production");
  });

  it("sends a private page to the sign-in form", () => {
    const response = proxy(request("/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("remembers where the visitor was going", () => {
    const response = proxy(request("/statistics"));
    const location = new URL(response.headers.get("location")!, "http://localhost:3000");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/statistics");
  });

  it("leaves public pages alone", () => {
    for (const path of ["/about", "/pricing", "/faq", "/auth/login", "/auth/register"]) {
      const response = proxy(request(path));
      expect(response.headers.get("location")).toBeNull();
    }
  });

  it("does not bounce a signed-in visitor away from the sign-in form", () => {
    const response = proxy(request("/login", COOKIE));
    expect(response.headers.get("location")).toContain("/dashboard");
  });
});

describe("proxy matcher", () => {
  const matcher = proxyConfig.matcher as string[];
  const pattern = new RegExp(`^${matcher[0]}`);

  it("never matches API routes, so they can answer 401 in JSON", () => {
    // The exclusion is the load-bearing part: a redirect to an HTML sign-in page
    // in place of a JSON 401 breaks every client-side error path.
    expect(matcher[0]).toContain("api");
    expect(pattern.test("/api/dashboard")).toBe(false);
  });

  it("never matches static assets or images", () => {
    for (const path of ["/_next/static/chunk.js", "/_next/image", "/favicon.ico", "/logo.svg"]) {
      expect(pattern.test(path)).toBe(false);
    }
  });

  it("does match real pages", () => {
    expect(pattern.test("/dashboard")).toBe(true);
    expect(pattern.test("/lesson/1")).toBe(true);
  });
});

describe("rate limit keying", () => {
  it("charges the quota to the user id when signed in", () => {
    const req = new NextRequest(new URL("http://localhost/api/coach"));
    const key = rateLimitKey(req, "user-123");
    expect(key).toBe("user:user-123");
  });

  it("gives one account one bucket regardless of address", () => {
    const a = new NextRequest(new URL("http://localhost/api/coach"));
    const b = new NextRequest(new URL("http://localhost/api/coach"));
    a.headers.set("x-forwarded-for", "10.0.0.1");
    b.headers.set("x-forwarded-for", "203.0.113.9");
    // Same user, two spoofed addresses: still the same bucket.
    expect(rateLimitKey(a, "user-123")).toBe(rateLimitKey(b, "user-123"));
  });

  it("keeps separate buckets for separate users on one address", () => {
    const req = new NextRequest(new URL("http://localhost/api/coach"));
    expect(rateLimitKey(req, "alice")).not.toBe(rateLimitKey(req, "bob"));
  });

  it("falls back to the network address with no session", () => {
    const req = new NextRequest(new URL("http://localhost/api/coach"));
    req.headers.set("x-forwarded-for", "198.51.100.7");
    expect(rateLimitKey(req, null)).toBe("anon:198.51.100.7");
  });

  it("does not let an anonymous key collide with a user key", () => {
    const req = new NextRequest(new URL("http://localhost/api/coach"));
    // A crafted user id must not be able to impersonate the anonymous bucket
    // or another account's bucket.
    const crafted = "anon:someone-else";
    expect(rateLimitKey(req, crafted)).not.toBe(rateLimitKey(req, null));
    expect(rateLimitKey(req, "user:x")).not.toBe(rateLimitKey(req, "x"));
  });

  it("still reports a spoofable address for clientKey, and says so", () => {
    const req = new NextRequest(new URL("http://localhost/api/coach"));
    req.headers.set("x-forwarded-for", "1.2.3.4, 5.6.7.8");
    // First address only, and trivially set by the caller — which is precisely
    // why quota enforcement uses the user id instead.
    expect(clientKey(req)).toBe("1.2.3.4");
  });
});

