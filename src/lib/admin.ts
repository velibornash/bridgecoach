/**
 * Administrator checks (Sprint 60).
 *
 * One place decides who may administer, so a new admin route cannot invent a
 * looser rule for itself.
 *
 * Note what is NOT here: no check on the proxy. The proxy is a UX redirect and
 * cannot make a database call, so `/admin` is not gated there. It is gated here,
 * on every request that touches administrator data, which is the only place the
 * answer can be trusted.
 */
import { getSessionUser } from "@/lib/session";
import { ApiError } from "@/lib/errors";

export type AdminRole = "owner" | "admin";

/** The current user, or 401. */
export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError(401, "You must be signed in to access this.", "NOT_AUTHENTICATED");
  }
  return user.id;
}

/**
 * The current user, only if they administer the app.
 *
 * 403 rather than 404 for a signed-in non-administrator: the existence of the
 * admin area is not a secret, and a confusing 404 would cost a real support
 * conversation. Both responses withhold the data, which is what matters.
 */
export async function requireAdmin(): Promise<{ id: string; email: string; role: AdminRole }> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError(401, "You must be signed in to access this.", "NOT_AUTHENTICATED");
  }
  if (user.role !== "owner" && user.role !== "admin") {
    throw new ApiError(403, "This area is restricted to administrators.", "FORBIDDEN");
  }
  return { id: user.id, email: user.email, role: user.role };
}

/** True when the address is configured as the app owner. */
export function isOwnerEmail(email: string): boolean {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return owner ? owner === email.toLowerCase() : false;
}
