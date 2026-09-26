/**
 * Profile editing (Sprint 60 follow-up).
 *
 *   PATCH /api/profile → first name, last name, country, experience level, bio
 *
 * The /settings account form had uncontrolled inputs with `defaultValue` and a
 * "Save Changes" button that reported success without reading a single field.
 * This endpoint is what makes that button mean something.
 *
 * Email is deliberately NOT editable here. Changing an address needs
 * verification of the new address, and there is no verification flow — an
 * endpoint that let anyone rewrite their email to another person's address
 * would be an account-takeover primitive the moment it existed.
 */
import { NextResponse } from "next/server";
import { handleRoute, withUser, prisma, badRequest } from "@/lib/apiRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPERIENCE_LEVELS = ["new", "beginner", "intermediate", "advanced"] as const;

/** ISO 3166-1 alpha-2, uppercased. Loose on purpose: the country list is a UI
 *  convenience, and rejecting an unlisted code would block legitimate values. */
const COUNTRY = /^[A-Z]{2}$/;

interface ProfileBody {
  firstName?: unknown;
  lastName?: unknown;
  country?: unknown;
  experienceLevel?: unknown;
  bio?: unknown;
}

export const PATCH = handleRoute(async (request: Request) =>
  withUser(async (userId) => {
    const body = (await request.json().catch(() => null)) as ProfileBody | null;
    if (body == null || typeof body !== "object") {
      throw badRequest("Request body must be a JSON object", "INVALID_BODY");
    }

    const data: Record<string, unknown> = {};

    if (body.firstName !== undefined) {
      const value = String(body.firstName).trim();
      if (value.length < 1 || value.length > 80) {
        throw badRequest("First name must be 1–80 characters", "INVALID_NAME");
      }
      data.firstName = value;
    }

    if (body.lastName !== undefined) {
      const value = String(body.lastName).trim();
      if (value.length > 80) {
        throw badRequest("Last name must be 80 characters or fewer", "INVALID_NAME");
      }
      data.lastName = value;
    }

    if (body.country !== undefined) {
      const value = String(body.country).trim().toUpperCase();
      if (!COUNTRY.test(value)) {
        throw badRequest("Country must be a two-letter code", "INVALID_COUNTRY");
      }
      data.country = value;
    }

    if (body.experienceLevel !== undefined) {
      const value = String(body.experienceLevel);
      if (!(EXPERIENCE_LEVELS as readonly string[]).includes(value)) {
        throw badRequest("Unknown experience level", "INVALID_EXPERIENCE");
      }
      data.experienceLevel = value;
    }

    if (body.bio !== undefined) {
      const value = String(body.bio).trim();
      if (value.length > 500) {
        throw badRequest("Bio must be 500 characters or fewer", "BIO_TOO_LONG");
      }
      data.bio = value;
    }

    if (Object.keys(data).length === 0) {
      throw badRequest("Nothing to update", "NO_CHANGES");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, firstName: true, lastName: true, country: true, experienceLevel: true },
    });

    if (typeof data.bio === "string") {
      await prisma.profile.upsert({
        where: { userId },
        create: { userId, bio: data.bio },
        update: { bio: data.bio },
      });
    }

    return NextResponse.json({ user });
  }),
);
