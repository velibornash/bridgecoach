"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { useTheme } from "@/providers/ThemeProvider";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import {
  savePreferences,
  updateProfile,
  changePassword,
  type NotificationPreferences,
  type PrivacyPreferences,
} from "@/services/preferencesService";
import type { Preferences } from "@/lib/preferences";

/**
 * Only English is actually available. The previous list offered eight languages
 * and switching one changed nothing but a `useState` value, so the picker was a
 * lie with a dropdown on it. The others are listed, disabled, and marked — the
 * preference is persisted so the choice is ready when the translations land.
 */
const languages = [
  { code: "en", label: "English", available: true },
  { code: "es", label: "Español", available: false },
  { code: "fr", label: "Français", available: false },
  { code: "de", label: "Deutsch", available: false },
  { code: "it", label: "Italiano", available: false },
  { code: "pt", label: "Português", available: false },
  { code: "zh", label: "中文", available: false },
  { code: "ja", label: "日本語", available: false },
];

const notificationSettings: { id: keyof NotificationPreferences; label: string; description: string }[] = [
  { id: "lesson_reminder", label: "Lesson Reminders", description: "Remind me to complete daily lessons" },
  { id: "streak_alert", label: "Streak Alerts", description: "Notify me before my streak expires" },
  { id: "achievement_unlock", label: "Achievement Unlocks", description: "Celebrate when I earn a new achievement" },
  { id: "challenge_available", label: "New Challenges", description: "Let me know when daily challenges refresh" },
  { id: "product_updates", label: "Product Updates", description: "New features and improvements" },
  { id: "community", label: "Community Activity", description: "Friend requests and partner matches" },
];

const sections = [
  { id: "theme", label: "Theme" },
  { id: "language", label: "Language" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy" },
  { id: "account", label: "Account" },
  { id: "subscription", label: "Subscription" },
  { id: "danger", label: "Danger Zone" },
];

/**
 * The settings form (Sprint 60 follow-up).
 *
 * Split from the page so the stored preferences arrive as a prop rather than
 * being fetched here and written into state from an effect. That hydration
 * pattern causes a cascading render, and it also means the form renders its
 * defaults first and then swaps them, which is how a user ends up saving over
 * choices they never saw.
 */
export function SettingsClient({
  initialPreferences,
  initialAccount,
}: {
  initialPreferences: Preferences;
  initialAccount: { firstName: string; lastName: string; country: string; experienceLevel: string };
}) {
  // Real profile from the database; the form previously hardcoded "Bob Smith".
  const { data: dashboard } = useDashboardData();
  // Email is read-only here; the rest arrives from the server as a prop.
  const profile = dashboard?.user ?? { firstName: "", lastName: "", email: "" };
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("theme");
  const [language, setLanguage] = useState(initialPreferences.language);
  const [notifications, setNotifications] =
    useState<NotificationPreferences>(initialPreferences.notifications);
  const [privacy, setPrivacy] =
    useState<PrivacyPreferences>(initialPreferences.privacy);

  // Typed against the key union rather than `string`, so a typo in a
  // notification id is a compile error instead of a toggle that silently does
  // nothing.
  const toggleNotification = (id: keyof NotificationPreferences) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
  };


  const [saving, setSaving] = useState(false);
  // Account fields. Previously uncontrolled inputs with `defaultValue` that were
  // never read, next to a "Save Changes" button that reported success.
  const [account, setAccount] = useState(initialAccount);
  const [savingAccount, setSavingAccount] = useState(false);

  const saveAccount = async () => {
    setSavingAccount(true);
    const result = await updateProfile(account);
    setSavingAccount(false);
    if (result.error) {
      showToast("error", `Could not save your details: ${result.error}`);
      return;
    }
    showToast("success", "Account details saved");
  };

  // Password. The three inputs were never read and the button called the same
  // handler that saved preferences.
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const submitPassword = async () => {
    setPasswordError(null);
    if (passwords.next.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    const result = await changePassword(passwords.current, passwords.next);
    setSavingPassword(false);
    if (result.error) {
      setPasswordError(result.error);
      return;
    }
    setPasswords({ current: "", next: "", confirm: "" });
    showToast(
      "success",
      result.otherSessionsRevoked > 0
        ? `Password changed. ${result.otherSessionsRevoked} other ${
            result.otherSessionsRevoked === 1 ? "session was" : "sessions were"
          } signed out.`
        : "Password changed.",
    );
  };

  /**
   * Writes the preferences, and reports what actually happened.
   *
   * The previous version showed "settings saved" from a click handler that
   * touched nothing. Now a failure is reported as a failure, and success is only
   * claimed after the server confirms the write.
   */
  const saveSection = async (section: string) => {
    setSaving(true);
    const result = await savePreferences({ language, notifications, privacy });
    setSaving(false);
    if (result.error) {
      showToast("error", `Could not save ${section.toLowerCase()}: ${result.error}`);
      return;
    }
    showToast("success", `${section} settings saved`);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-4 sm:py-6">
        <Container className="max-w-4xl">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-text-primary">Settings</h1>
            <p className="text-sm text-text-tertiary mt-1">Manage your preferences and account.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar nav */}
            <nav className="lg:w-48 shrink-0">
              <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left whitespace-nowrap ${
                      activeSection === s.id
                        ? "bg-primary text-white"
                        : "text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* Theme */}
              {activeSection === "theme" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card>
                    <h2 className="text-base font-semibold text-text-primary mb-1">Appearance</h2>
                    <p className="text-xs text-text-tertiary mb-4">Choose your preferred theme.</p>
                    <div className="grid grid-cols-3 gap-3">
                      {(["dark", "light", "system"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setTheme(mode)}
                          className={`rounded-xl border p-4 text-center transition-all ${
                            theme === mode
                              ? "border-primary bg-primary/10"
                              : "border-border bg-bg-secondary/50 hover:border-border-hover"
                          }`}
                        >
                          <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${
                            mode === "dark" ? "bg-bg-primary" : mode === "light" ? "bg-white" : "bg-gradient-to-br from-bg-primary to-white"
                          }`}>
                            {mode === "dark" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>}
                            {mode === "light" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500"><path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>}
                            {mode === "system" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>}
                          </div>
                          <p className="text-xs font-medium text-text-primary capitalize">{mode}</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      {/* No Save button: the theme writes to localStorage the
                          moment it is chosen, so one would imply a step that does
                          not exist. */}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Language */}
              {activeSection === "language" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card>
                    <h2 className="text-base font-semibold text-text-primary mb-1">Language</h2>
                    <p className="text-xs text-text-tertiary mb-4">Select your preferred language.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          disabled={!lang.available}
                          onClick={() => setLanguage(lang.code)}
                          title={
                            lang.available
                              ? undefined
                              : "Not translated yet. The choice is saved so it applies when it is."
                          }
                          className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                            language === lang.code
                              ? "border-primary bg-primary/10 text-primary"
                              : lang.available
                                ? "border-border text-text-secondary hover:border-border-hover hover:bg-bg-secondary"
                                : "cursor-not-allowed border-border/50 text-text-tertiary/50"
                          }`}
                        >
                          {lang.label}
                          {!lang.available && <span className="ml-1.5 text-[9px]">soon</span>}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] text-text-tertiary">
                      Only English is translated. The other choices are stored and will
                      apply when the translations land.
                    </p>
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" onClick={() => saveSection("Language")}>Save</Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Notifications */}
              {activeSection === "notifications" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card>
                    <h2 className="text-base font-semibold text-text-primary mb-1">Notifications</h2>
                    <p className="text-xs text-text-tertiary mb-1">Control what alerts you receive.</p>
                    <p className="text-[10px] text-text-tertiary mb-4">
                      These choices are saved, but <strong>no email or push delivery
                      exists yet</strong> — there is no notification system behind them
                      yet. The toggles are here so the choice is made once rather than
                      forgotten.
                    </p>
                    <div className="space-y-1">
                      {notificationSettings.map((n) => (
                        <div key={n.id} className="flex items-center justify-between rounded-lg p-3 hover:bg-bg-secondary/50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{n.label}</p>
                            <p className="text-xs text-text-tertiary">{n.description}</p>
                          </div>
                          <button
                            onClick={() => toggleNotification(n.id)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${
                              notifications[n.id] ? "bg-primary" : "bg-bg-secondary"
                            }`}
                          >
                            <motion.div
                              className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow"
                              animate={{ x: notifications[n.id] ? 20 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" onClick={() => saveSection("Notifications")}>Save</Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Privacy */}
              {activeSection === "privacy" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card>
                    <h2 className="text-base font-semibold text-text-primary mb-1">Privacy</h2>
                    <p className="text-xs text-text-tertiary mb-4">Manage your privacy settings.</p>
                    <div className="space-y-1">
                      {[
                        { key: "showProfile" as const, label: "Show Profile", desc: "Let other users see your profile" },
                        { key: "showActivity" as const, label: "Show Activity", desc: "Share your learning activity on your public profile" },
                        { key: "dataForAI" as const, label: "AI Coach Data", desc: "Allow the AI coach to use your data. Turn off and the coach refuses to run." },
                      ].map((p) => (
                        <div key={p.key} className="flex items-center justify-between rounded-lg p-3 hover:bg-bg-secondary/50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{p.label}</p>
                            <p className="text-xs text-text-tertiary">{p.desc}</p>
                          </div>
                          <button
                            onClick={() => setPrivacy((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                            className={`relative h-6 w-11 rounded-full transition-colors ${
                              privacy[p.key] ? "bg-primary" : "bg-bg-secondary"
                            }`}
                          >
                            <motion.div
                              className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow"
                              animate={{ x: privacy[p.key] ? 20 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" onClick={() => saveSection("Privacy")}>Save</Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Account */}
              {activeSection === "account" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card>
                    <h2 className="text-base font-semibold text-text-primary mb-1">Account</h2>
                    <p className="text-xs text-text-tertiary mb-4">Update your account information.</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">First Name</label>
                          <input
                            value={account.firstName}
                            onChange={(e) => setAccount((p) => ({ ...p, firstName: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Last Name</label>
                          <input
                            value={account.lastName}
                            onChange={(e) => setAccount((p) => ({ ...p, lastName: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
                        <input
                          value={profile.email ?? ""}
                          readOnly
                          title="Changing your email needs verification, which is not implemented."
                          className="w-full cursor-not-allowed rounded-lg border border-border bg-bg-secondary/60 px-3 py-2 text-sm text-text-tertiary"
                        />
                        <p className="mt-1 text-[10px] text-text-tertiary">
                          Read-only. Changing your email needs a verification step that
                          is not built yet.
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Country</label>
                        <select
                          value={account.country}
                          onChange={(e) => setAccount((p) => ({ ...p, country: e.target.value }))}
                          className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="RS">🇷🇸 Serbia</option>
                          <option value="US">🇺🇸 United States</option>
                          <option value="GB">🇬🇧 United Kingdom</option>
                          <option value="CA">🇨🇦 Canada</option>
                          <option value="AU">🇦🇺 Australia</option>
                          <option value="RS">🇷🇸 Serbia</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Experience Level</label>
                        <select
                          value={account.experienceLevel}
                          onChange={(e) => setAccount((p) => ({ ...p, experienceLevel: e.target.value }))}
                          className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="new">New to Bridge</option>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setAccount(initialAccount)}
                      >
                        Reset
                      </Button>
                      <Button size="sm" disabled={savingAccount} onClick={saveAccount}>
                        {savingAccount ? "Saving…" : "Save Changes"}
                      </Button>
                    </div>
                  </Card>
                  <Card>
                    <h2 className="text-base font-semibold text-text-primary mb-1">Change Password</h2>
                    <p className="text-xs text-text-tertiary mb-4">Update your password.</p>
                    <div className="space-y-3">
                      <input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Current password"
                        value={passwords.current}
                        onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="password"
                        autoComplete="new-password"
                        placeholder="New password"
                        value={passwords.next}
                        onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {passwordError && <p className="text-xs text-error">{passwordError}</p>}
                      <p className="text-[10px] text-text-tertiary">
                        Changing your password signs out every other device.
                      </p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        disabled={savingPassword || passwords.current.length === 0}
                        onClick={submitPassword}
                      >
                        {savingPassword ? "Updating…" : "Update Password"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Subscription */}
              {activeSection === "subscription" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-text-primary mb-1">Current Plan</h2>
                        <p className="text-xs text-text-tertiary">You are on the Free plan.</p>
                      </div>
                      <span className="rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-primary">Free</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="primary" size="sm">Upgrade to Premium</Button>
                      <Button variant="secondary" size="sm">Compare Plans</Button>
                    </div>
                  </Card>
                  <Card>
                    <h2 className="text-base font-semibold text-text-primary mb-1">Billing History</h2>
                    <p className="text-xs text-text-tertiary">No billing history on the Free plan.</p>
                  </Card>
                </motion.div>
              )}

              {/* Danger Zone */}
              {activeSection === "danger" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card className="border-danger/30">
                    <h2 className="text-base font-semibold text-danger mb-1">Danger Zone</h2>
                    <p className="text-xs text-text-tertiary mb-4">Irreversible actions. Proceed with caution.</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="text-sm font-medium text-text-primary">Export My Data</p>
                          <p className="text-xs text-text-tertiary">Download all your learning data as JSON.</p>
                        </div>
                        <Button variant="secondary" size="sm">Export</Button>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-danger/20 p-3">
                        <div>
                          <p className="text-sm font-medium text-danger">Delete Account</p>
                          <p className="text-xs text-text-tertiary">Permanently delete your account and all data.</p>
                        </div>
                        <Button variant="danger" size="sm">Delete</Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
