"use client";

/**
 * The notification toggles, shared by `/email-preferences` and the Notifications
 * section of `/settings` so the two cannot drift.
 */
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { readPreferences } from "@/lib/preferences";
import { savePreferences } from "@/services/preferencesService";
import type { NotificationPreferences } from "@/lib/preferences";

const DESCRIPTIONS: { id: keyof NotificationPreferences; label: string; description: string }[] = [
  {
    id: "lesson_reminder",
    label: "Lesson reminders",
    description: "A nudge to complete your daily lesson.",
  },
  {
    id: "streak_alert",
    label: "Streak alerts",
    description: "A warning before your streak expires.",
  },
  {
    id: "achievement_unlock",
    label: "Achievement unlocks",
    description: "When you earn a new achievement.",
  },
  {
    id: "challenge_available",
    label: "New challenges",
    description: "When the daily challenge refreshes.",
  },
  {
    id: "product_updates",
    label: "Product updates",
    description: "New lessons, quizzes and changes to the app.",
  },
  {
    id: "community",
    label: "Community activity",
    description: "Friend requests and partner matches.",
  },
];

export function NotificationPreferencesForm({
  initial,
  showDeliveryNote = true,
}: {
  initial: NotificationPreferences;
  showDeliveryNote?: boolean;
}) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initial);
  const [saving, setSaving] = useState(false);

  const toggle = (id: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const save = async () => {
    setSaving(true);
    // `readPreferences` is what the server applies, so the same allow-list and
    // defaults are used on this side. Passing raw state would send keys the
    // server silently drops, and the page would then claim to have saved them.
    const result = await savePreferences(
      readPreferences({
        language: "en",
        notifications: prefs,
        privacy: {},
      }),
    );
    setSaving(false);
    if (result.error) {
      showToast("error", `Could not save: ${result.error}`);
      return;
    }
    // Adopt what the server actually stored.
    if (result.data) setPrefs(result.data.notifications);
    showToast("success", "Notification preferences saved");
  };

  return (
    <Card>
      {showDeliveryNote && (
        <p className="mb-4 text-[10px] text-text-tertiary">
          <strong>No email or push delivery exists yet</strong> — there is no
          notification system behind these toggles. They are saved so the choice
          is made once rather than forgotten.
        </p>
      )}
      <div className="space-y-0 divide-y divide-border">
        {DESCRIPTIONS.map((pref) => (
          <div
            key={pref.id}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium text-text-primary">{pref.label}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {pref.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggle(pref.id)}
              aria-pressed={prefs[pref.id]}
              aria-label={`${pref.label}: ${prefs[pref.id] ? "on" : "off"}`}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                prefs[pref.id] ? "bg-primary" : "bg-bg-secondary"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs[pref.id] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Preferences"}
        </Button>
      </div>
    </Card>
  );
}
