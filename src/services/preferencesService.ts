/**
 * Preferences client (Sprint 60 follow-up).
 */
import { apiFetchSafe } from "./api";

/**
 * The types live in `src/lib/preferences.ts`, next to the allow-list that
 * enforces them, and are re-exported here for the client's convenience. Declaring
 * a second copy here is how the two drift apart and a setting stops saving.
 */
export type { Preferences } from "@/lib/preferences";
import type {
  Preferences as PreferencesType,
  PrivacyPreferences,
  NotificationPreferences,
} from "@/lib/preferences";

/** Re-exported for the form's typed key access. */
export type { PrivacyPreferences, NotificationPreferences };
type Prefs = PreferencesType;

export async function fetchPreferences(): Promise<{
  data: { preferences: Prefs } | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<{ preferences: Prefs }>("/api/profile/preferences");
  return { data: result.data, error: result.data ? null : result.error, status: result.status };
}

export async function savePreferences(preferences: Prefs): Promise<{
  data: Prefs | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<{ preferences: Prefs; saved: boolean }>(
    "/api/profile/preferences",
    { method: "PUT", body: preferences },
  );
  return { data: result.data?.preferences ?? null, error: result.data ? null : result.error, status: result.status };
}

/**
 * Profile editing (Sprint 60 follow-up).
 *
 * Email is not editable: changing an address needs verification, and there is
 * no verification flow.
 */
export interface EditableProfile {
  firstName: string;
  lastName: string;
  country: string;
  experienceLevel: string;
  /** Optional: the account form does not edit the bio, and an omitted key is
   *  left untouched rather than blanked. */
  bio?: string;
}

export async function updateProfile(profile: EditableProfile): Promise<{
  data: { user: { firstName: string; lastName: string; country: string; experienceLevel: string } } | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<{ user: EditableProfile }>("/api/profile", {
    method: "PATCH",
    body: profile,
  });
  return { data: result.data, error: result.data ? null : result.error, status: result.status };
}

/**
 * Changes the signed-in user's password.
 *
 * Points at the same endpoint `/auth/forgot-password` uses, which already
 * revokes every other session on success.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ error: string | null; otherSessionsRevoked: number }> {
  const result = await apiFetchSafe<{ changed: boolean; otherSessionsRevoked: number }>(
    "/api/auth/password",
    { method: "PATCH", body: { currentPassword, newPassword } },
  );
  return {
    error: result.data ? null : result.error,
    otherSessionsRevoked: result.data?.otherSessionsRevoked ?? 0,
  };
}
