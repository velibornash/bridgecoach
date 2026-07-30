"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockDailyChallenges } from "@/services/mockData";
import { triggerXpAnimation } from "@/components/xp/XPAnimation";
import { triggerLevelUp } from "@/components/xp/LevelUpModal";
import { triggerAchievementUnlock } from "@/components/achievements/AchievementUnlock";
import { mockAchievements } from "@/services/mockData";
import type { DailyChallengeData } from "@/types";

const typeIcons: Record<string, string> = {
  quiz: "🧪",
  puzzle: "🧩",
  practice: "📝",
  streak: "🔥",
};

const difficultyColors: Record<string, string> = {
  easy: "text-emerald-400 bg-emerald-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  hard: "text-rose-400 bg-rose-500/10",
};

export function ChallengeCard() {
  const today = new Date().toISOString().split("T")[0];
  const challenge = mockDailyChallenges.find((c) => c.date === today) || mockDailyChallenges[0];
  const [completed, setCompleted] = useState(challenge.completed);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleComplete = () => {
    if (completed) return;
    setCompleted(true);
    triggerXpAnimation(challenge.xpReward + challenge.bonusXp);
    setTimeout(() => {
      const a = mockAchievements.find((a) => a.id === "a4");
      if (a) triggerAchievementUnlock({ ...a, unlocked: true, unlockedAt: new Date().toISOString() });
    }, 800);
    setTimeout(() => triggerLevelUp(8), 1500);
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Decorative glow */}
      <div className={cn(
        "absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl transition-colors duration-500",
        completed ? "bg-success/20" : "bg-warning/15"
      )} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
                <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-warning">Daily Challenge</span>
              <p className="text-[10px] text-text-tertiary font-mono">Resets in {timeLeft}</p>
            </div>
          </div>
          <Badge variant={challenge.difficulty === "hard" ? "danger" : challenge.difficulty === "medium" ? "warning" : "primary"}>
            {challenge.difficulty}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">{typeIcons[challenge.type] || "📌"}</span>
          <div>
            <h3 className={cn(
              "text-lg font-bold",
              completed ? "text-success" : "text-text-primary"
            )}>
              {challenge.title}
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">{challenge.description}</p>
          </div>
        </div>

        {/* Rewards */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
              <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span className="text-xs font-semibold text-warning">{challenge.xpReward} XP</span>
          </div>
          {challenge.bonusXp > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold text-primary">+{challenge.bonusXp} bonus</span>
            </div>
          )}
        </div>

        {/* Action */}
        {completed ? (
          <div className="flex items-center gap-2 rounded-xl bg-success-light border border-success/20 p-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M7.5 12l3 3 6-6" />
            </svg>
            <span className="text-sm font-semibold text-success">Challenge completed for today!</span>
          </div>
        ) : (
          <Button onClick={handleComplete} className="w-full">
            Complete Challenge
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1.5">
              <path d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </Button>
        )}
      </div>
    </Card>
  );
}
