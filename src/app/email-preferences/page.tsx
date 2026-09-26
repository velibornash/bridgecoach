/**
 * Notification preferences (Sprint 60 follow-up).
 *
 * This page and `/settings` each had their own invented set of preference keys —
 * `newsletter`, `reminders`, `marketing`, `weekly_report` here, and a different
 * six under Notifications there — and neither was stored anywhere. "Save
 * Preferences" showed a toast and wrote nothing.
 *
 * Both are now views of the same `Profile.preferences.notifications` map, keyed
 * by the six names the server actually recognises. Two pages inventing two
 * vocabularies for one setting is how a preference ends up looking saved on one
 * screen and lost on the other.
 */
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";
import { readPreferences } from "@/lib/preferences";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NotificationPreferencesForm } from "./NotificationPreferencesForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EmailPreferencesPage() {
  const session = await getSessionUser();

  if (!session) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <main className="py-20 text-center text-sm text-text-tertiary">
          Sign in to change your notification preferences.
        </main>
      </div>
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.id },
    select: { preferences: true },
  });

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Notification Preferences
            </h1>
            <p className="text-sm text-text-tertiary mb-8">
              These are the same settings shown under Notifications in{" "}
              <a href="/settings" className="text-primary hover:underline">
                Settings
              </a>
              .
            </p>

            <NotificationPreferencesForm
              initial={readPreferences(profile?.preferences).notifications}
            />

            <div className="mt-6 rounded-xl border border-border bg-bg-card p-4">
              <p className="text-xs text-text-tertiary">
                Your email address is used only by this application and is never
                shared with third parties. Contact the owner at{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </div>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
