/**
 * Settings (Sprint 60 follow-up).
 *
 * A server component that reads the signed-in user's stored preferences and
 * hands them to the form as props.
 *
 * It used to be a client component that fetched nothing on the server, showed
 * hardcoded defaults, and had a "Save Changes" button that reported success
 * without writing anything. Reading the values here means the form's first paint
 * is the real state, and it removes both the hydration effect and a client
 * request.
 */
import { SettingsClient } from "./SettingsClient";
import { readPreferences } from "@/lib/preferences";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSessionUser();

  // The form requires a session; `resolveUserId()` would throw and the proxy
  // normally redirects first, so this is only a guard for direct rendering.
  if (!session) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <main className="py-20 text-center text-sm text-text-tertiary">
          Sign in to change your settings.
        </main>
      </div>
    );
  }

  const [profile, user] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.id }, select: { preferences: true } }),
    prisma.user.findUniqueOrThrow({
      where: { id: session.id },
      select: { firstName: true, lastName: true, country: true, experienceLevel: true },
    }),
  ]);

  return (
    <SettingsClient
      initialPreferences={readPreferences(profile?.preferences)}
      initialAccount={{
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        experienceLevel: user.experienceLevel,
      }}
    />
  );
}
