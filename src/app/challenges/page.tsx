"use client";

import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { ChallengeHistory } from "@/components/challenge/ChallengeHistory";
import { XPOverlay } from "@/components/xp/XPAnimation";
import { LevelUpOverlay } from "@/components/xp/LevelUpModal";
import { AchievementUnlockOverlay } from "@/components/achievements/AchievementUnlock";

export default function ChallengesPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-4 sm:py-6">
        <Container className="max-w-2xl">
          <div className="mb-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">SPRINT 10</span>
            <h1 className="text-xl font-bold text-text-primary mt-0.5">Daily Challenges</h1>
            <p className="text-sm text-text-tertiary mt-1">Complete today's challenge and track your history.</p>
          </div>

          <div className="space-y-5">
            <ChallengeCard />
            <ChallengeHistory />
          </div>
        </Container>
      </main>
      <XPOverlay />
      <LevelUpOverlay />
      <AchievementUnlockOverlay />
    </div>
  );
}
