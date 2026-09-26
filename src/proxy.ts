/**
 * Route protection (Next 16 `proxy`, formerly `middleware`).
 *
 * WHAT THIS IS: a user-experience guard. Someone who clicks "Dashboard" while
 * signed out is redirected to the sign-in page instead of landing on a page
 * that renders empty and then fails.
 *
 * WHAT THIS IS NOT: security. It only checks that a cookie is *present* — not
 * that it is valid, not that the session exists, not that it is unexpired. A
 * request that skips this file entirely, or carries a forged cookie, is
 * rejected further in by `resolveUserId()`, which does the real, database-backed
 * check on every private request and returns 401.
 *
 * That split is deliberate and is the reason this file can be this small. Two
 * consequences of Next's guidance shaped it:
 *
 * 1. The docs warn that proxy "can run outside of your application's main
 *    runtime" and that shared modules and globals must not be relied on. So
 *    there is no Prisma client and no `src/lib/session.ts` import here — an
 *    edge or CDN deployment would break on both, and the failure would be a
 *    crash in front of every request rather than a denial of service.
 * 2. The docs recommend avoiding proxy work "unless no other options exist".
 *    Authentication is listed as a use case, but the enforcement belongs at the
 *    data boundary regardless. Doing it only here would mean trusting a layer
 *    that is explicitly documented as not part of the app.
 *
 * Cookie name and public-route list live in one place below. Keep
 * `SESSION_COOKIE` in `src/lib/session.ts` in sync — a rename there without a
 * change here would silently sign everyone out on every navigation.
 */
import { NextResponse, type NextRequest } from "next/server";

/** Must match SESSION_COOKIE in src/lib/session.ts. */
const SESSION_COOKIE = "bridgecoach_session";

/**
 * Pages reachable without a session. Marketing, pricing, help, and the sign-in
 * flows themselves. Everything else requires one.
 *
 * Note `/api` is excluded by the matcher below, not listed here: API routes must
 * return 401 JSON, never a redirect to an HTML page, and `withUser()` already
 * does that correctly.
 */
const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/contact",
  "/faq",
  "/pricing",
  "/maintenance",
  "/offline",
  "/login",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
]);

/** If signed in, these are pointless — send the user where they meant to go. */
const AUTH_PATHS = new Set([
  "/login",
  "/auth/login",
  "/auth/register",
]);

/**
 * Whether the development identity counts as signed in.
 *
 * Must agree with `devIdentityAllowed()` in `src/lib/db.ts`. When the two
 * disagree, the app is broken rather than insecure: the proxy bounces a
 * developer to the sign-in page while `resolveUserId()` would have happily
 * served the request. A Playwright test caught exactly that.
 *
 * Like the guard in db.ts, production short-circuits before the flag is read,
 * so no environment combination opens a hole here.
 */
function devIdentityActive(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_DEV_IDENTITY === "true";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = request.cookies.has(SESSION_COOKIE) || devIdentityActive();

  if (!signedIn && !PUBLIC_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    // Preserve the intended destination so sign-in can return the user to it
    // instead of dumping everyone on the dashboard.
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (signedIn && AUTH_PATHS.has(pathname)) {
    // The cookie may be stale; the destination validates it for real and will
    // bounce back here with a 401 if the session is gone.
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Pages only. Excludes API routes (they must answer 401 in JSON, not redirect
   * to HTML), Next internals, and anything with a file extension, so a missing
   * image or stylesheet can never be turned into a redirect to the sign-in page.
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
