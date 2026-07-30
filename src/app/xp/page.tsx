"use client";

import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { XPProgress } from "@/components/xp/XPProgress";
import { LevelUpOverlay } from "@/components/xp/LevelUpModal";
import { XPOverlay } from "@/components/xp/XPAnimation";

export default function XPPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-4 sm:py-6">
        <Container className="max-w-2xl">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-text-primary">XP & Progress</h1>
            <p className="text-sm text-text-tertiary mt-1">Track your experience, daily goals, and learning activity.</p>
          </div>
          <XPProgress />
        </Container>
      </main>
      <LevelUpOverlay />
      <XPOverlay />
    </div>
  );
}
