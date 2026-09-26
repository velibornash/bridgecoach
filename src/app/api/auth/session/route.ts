/**
 * Current session lookup (Sprint 59).
 *
 * GET /api/auth/session
 *
 * A thin re-export so clients have a stable, intention-revealing URL. The
 * handler lives in /api/auth/route.ts alongside the other auth operations.
 */
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null, code: "NOT_AUTHENTICATED" }, { status: 401 });
  }
  return NextResponse.json({ user });
}
