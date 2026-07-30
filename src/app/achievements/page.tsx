"use client";

import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AchievementGrid } from "@/components/achievements/AchievementGrid";
import { AchievementUnlockOverlay } from "@/components/achievements/AchievementUnlock";

export default function AchievementsPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-4 sm:py-6">
        <Container className="max-w-2xl">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-text-primary">Achievements</h1>
            <p className="text-sm text-text-tertiary mt-1">Track your progress, earn badges, and unlock rewards.</p>
          </div>
          <AchievementGrid />
        </Container>
      </main>
      <AchievementUnlockOverlay />
    </div>
  );
}
