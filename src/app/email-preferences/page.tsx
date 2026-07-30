"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

const preferences = [
  { id: "newsletter", label: "Newsletter", description: "Receive weekly bridge tips and curated learning content." },
  { id: "reminders", label: "Reminders", description: "Get reminded to complete your daily lessons and challenges." },
  { id: "marketing", label: "Marketing", description: "Stay informed about promotions, new features, and special offers." },
  { id: "weekly_report", label: "Weekly Report", description: "A summary of your progress, streaks, and achievements every Monday." },
  { id: "product_updates", label: "Product Updates", description: "Be the first to know about new lessons, quizzes, and platform improvements." },
];

export default function EmailPreferencesPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    newsletter: true,
    reminders: true,
    marketing: false,
    weekly_report: true,
    product_updates: false,
  });

  const toggle = (id: string) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const save = () => {
    showToast("success", "Email preferences saved!");
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Email Preferences</h1>
            <p className="text-sm text-text-tertiary mb-8">
              Choose which emails you receive from Bridge Coach.
            </p>

            <Card>
              <div className="space-y-0 divide-y divide-border">
                {preferences.map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-medium text-text-primary">{pref.label}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{pref.description}</p>
                    </div>
                    <button
                      onClick={() => toggle(pref.id)}
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
                <Button onClick={save}>Save Preferences</Button>
              </div>
            </Card>

            <div className="mt-6 rounded-xl border border-border bg-bg-card p-4">
              <p className="text-xs text-text-tertiary">
                You can unsubscribe at any time. Your email is used only for Bridge Coach communications
                and is never shared with third parties. Contact us at{' '}
                <a href="mailto:velja.jagodina@gmail.com" className="text-primary hover:underline">velja.jagodina@gmail.com</a>.
              </p>
            </div>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
