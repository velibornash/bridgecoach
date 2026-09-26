/**
 * User preferences: the single source of truth (Sprint 60 follow-up).
 *
 * The types, the defaults, and the allow-list all live here so there is exactly
 * one definition of "what a preference is". The route that writes them, the page
 * that renders them, and the two endpoints that enforce them all import from
 * this module.
 *
 * That matters more than it looks. An earlier version declared the interface
 * twice — once in the API route and once in the client service — and the two
 * drifted into a type error the moment the page was converted to a server
 * component. A structurally identical duplicate type is one rename away from
 * being a silently ignored setting.
 */

/** The privacy keys, named so a typo in an id is a compile error. */
export interface PrivacyPreferences {
  /** When false, the profile is not served to anyone but its owner. */
  showProfile: boolean;
  /** When false, recent activity is omitted from the public profile. */
  showActivity: boolean;
  /** When false, the AI coach refuses to run for this account. */
  dataForAI: boolean;
}

export interface NotificationPreferences {
  lesson_reminder: boolean;
  streak_alert: boolean;
  achievement_unlock: boolean;
  challenge_available: boolean;
  product_updates: boolean;
  community: boolean;
}

export interface Preferences {
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

/**
 * Defaults. On for the things a learner would expect to be reminded about, off
 * for anything that would be marketing.
 */
export const DEFAULT_PREFERENCES: Preferences = {
  language: "en",
  notifications: {
    lesson_reminder: true,
    streak_alert: true,
    achievement_unlock: true,
    challenge_available: true,
    product_updates: false,
    community: false,
  },
  privacy: { showProfile: true, showActivity: false, dataForAI: true },
};

const NOTIFICATION_KEYS = Object.keys(
  DEFAULT_PREFERENCES.notifications,
) as (keyof NotificationPreferences)[];

const PRIVACY_KEYS = Object.keys(DEFAULT_PREFERENCES.privacy) as (keyof PrivacyPreferences)[];

const LANGUAGES = ["en", "sr", "de", "fr", "es"] as const;

/**
 * Coerces stored or submitted JSON into a complete `Preferences`.
 *
 * Anything unrecognised is dropped and anything missing is filled from the
 * defaults, so a profile written before a key existed — or hand-edited in the
 * database — cannot produce an undefined value downstream.
 */
export function readPreferences(raw: unknown): Preferences {
  if (raw == null || typeof raw !== "object") {
    return { ...DEFAULT_PREFERENCES, notifications: { ...DEFAULT_PREFERENCES.notifications }, privacy: { ...DEFAULT_PREFERENCES.privacy } };
  }
  const source = raw as Record<string, unknown>;

  const notifications = { ...DEFAULT_PREFERENCES.notifications };
  if (source.notifications && typeof source.notifications === "object") {
    for (const key of NOTIFICATION_KEYS) {
      const value = (source.notifications as Record<string, unknown>)[key];
      if (typeof value === "boolean") notifications[key] = value;
    }
  }

  const privacy = { ...DEFAULT_PREFERENCES.privacy };
  if (source.privacy && typeof source.privacy === "object") {
    for (const key of PRIVACY_KEYS) {
      const value = (source.privacy as Record<string, unknown>)[key];
      if (typeof value === "boolean") privacy[key] = value;
    }
  }

  const language =
    typeof source.language === "string" && (LANGUAGES as readonly string[]).includes(source.language)
      ? source.language
      : DEFAULT_PREFERENCES.language;

  return { language, notifications, privacy };
}

/** The languages the app can actually render. */
export const AVAILABLE_LANGUAGES = ["en"] as const;
