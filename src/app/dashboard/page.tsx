"use client";

import { Container } from "@/components/ui/Container";
import { PremiumHero } from "@/components/dashboard/PremiumHero";
import { XPBar } from "@/components/dashboard/XPBar";
import { ContinueLearning } from "@/components/dashboard/ContinueLearning";
import { TodaysMission } from "@/components/dashboard/TodaysMission";
import { DailyChallenge } from "@/components/dashboard/DailyChallenge";
import { Achievements } from "@/components/dashboard/Achievements";
import { Statistics } from "@/components/dashboard/Statistics";
import { LearningPath } from "@/components/dashboard/LearningPath";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RecommendationCard } from "@/components/cards/RecommendationCard";

export default function DashboardPage() {
  return (
    <>
      <PremiumHero />

      <main className="py-8 sm:py-12">
        <Container>
          <div className="mb-8">
            <RecommendationCard
              title="Practice Takeout Doubles"
              description="Your weakest area — strengthen your competitive bidding with targeted practice."
              reason="Based on your skill profile"
              href="/practice"
              tag="AI Recommendation"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <XPBar />
              <div className="grid gap-6 sm:grid-cols-2">
                <ContinueLearning />
                <TodaysMission />
              </div>
              <LearningPath />
            </div>
            <div className="space-y-6 lg:col-span-5">
              <DailyChallenge />
              <Statistics />
              <Achievements />
              <RecentActivity />
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
