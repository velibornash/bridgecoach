/**
 * Password change (Sprint 59).
 *
 * PATCH /api/auth/password
 *
 * Changing a password revokes every other session, so a stolen password does
 * not leave a live session behind.
 */
import { changePassword } from "@/app/api/auth/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  return changePassword(request);
}
