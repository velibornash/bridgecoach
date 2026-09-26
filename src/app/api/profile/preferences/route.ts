/**
 * User preferences (Sprint 60 follow-up).
 *
 *   GET /api/profile/preferences → the stored choices
 *   PUT /api/profile/preferences → replace them
 *
 * The /settings page kept language, notification and privacy choices in
 * `useState` and showed "settings saved" on a button click. Nothing was written
 * anywhere, so every choice vanished on refresh — a save button that reports
 * success without saving anything is worse than no button, because the user
 * believes their configuration is in effect.
 *
 * Theme is handled separately by `ThemeProvider`, which genuinely persists to
 * `localStorage`. It is not duplicated here so there is one source of truth per
 * setting rather than two that can disagree.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, badRequest } from "@/lib/apiRoute";
import { readPreferences, type Preferences } from "@/lib/preferences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleRoute(() =>
  withUser(async (userId) => {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { preferences: true },
    });
    return NextResponse.json({ preferences: readPreferences(profile?.preferences) });
  }),
);

export const PUT = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw badRequest("Request body must be valid JSON", "INVALID_JSON");
    }
    if (body == null || typeof body !== "object") {
      throw badRequest("Body must be an object", "INVALID_BODY");
    }

    // Read through the same allow-list the getter uses, so a value that could
    // not be read back can never be written.
    const preferences = readPreferences(body);
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, preferences: preferences as unknown as object },
      update: { preferences: preferences as unknown as object },
    });

    // The stored value is returned, not the submitted one. If the allow-list
    // dropped something, the client learns that rather than assuming it stuck.
    return NextResponse.json({ preferences, saved: true });
  }),
);
