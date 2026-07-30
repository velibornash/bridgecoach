"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { mockDailyMission } from "@/services/mockData";

const missionIcons: Record<string, React.ReactNode> = {
  quiz: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
  play: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  streak: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  ),
  practice: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v2.25m0 0v13.5m0-13.5a6 6 0 015.25 6.375m-5.25-6.375a6 6 0 00-5.25 6.375m5.25-6.375v13.5m0 0a6 6 0 01-5.25-6.375m5.25 6.375a6 6 0 005.25-6.375" />
    </svg>
  ),
};

export function TodaysMission() {
  const mission = mockDailyMission;
  const pct = Math.round((mission.progress / mission.maxProgress) * 100);

  return (
    <AnimatedSection delay={0.2}>
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-primary/5 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light">
              <span className="text-primary">{missionIcons[mission.type]}</span>
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              Today&apos;s Mission
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-text-primary">{mission.title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{mission.description}</p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-text-tertiary">Progress</span>
              <span className="text-text-secondary font-medium">{mission.progress}/{mission.maxProgress}</span>
            </div>
            <Progress value={mission.progress} max={mission.maxProgress} />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="primary" size="sm">
              {pct === 100 ? "Claim Reward" : "Continue"}
            </Button>
            <span className="flex items-center gap-1 text-sm text-warning font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              +{mission.xpReward} XP
            </span>
          </div>
        </div>
      </Card>
    </AnimatedSection>
  );
}
