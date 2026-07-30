"use client";

import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { XPBar } from "@/components/dashboard/XPBar";
import { ContinueLearning } from "@/components/dashboard/ContinueLearning";
import { TodaysMission } from "@/components/dashboard/TodaysMission";
import { DailyChallenge } from "@/components/dashboard/DailyChallenge";
import { Achievements } from "@/components/dashboard/Achievements";
import { Statistics } from "@/components/dashboard/Statistics";
import { LearningPath } from "@/components/dashboard/LearningPath";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container>
          <WelcomeHeader />

          <div className="mt-8 grid gap-6 lg:grid-cols-12">
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
    </div>
  );
}
