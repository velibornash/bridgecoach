"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Achievement, AchievementCategory } from "@/types";

interface AchievementCardProps {
  achievement: Achievement;
  index?: number;
}

const categoryGradients: Record<AchievementCategory, string> = {
  lessons: "from-blue-500 to-indigo-600",
  quizzes: "from-emerald-500 to-teal-600",
  streak: "from-rose-500 to-pink-600",
  mastery: "from-violet-500 to-purple-600",
  special: "from-amber-500 to-orange-600",
};

const rarityBorders: Record<string, string> = {
  common: "border-border",
  rare: "border-blue-500/40",
  epic: "border-purple-500/40",
  legendary: "border-amber-500/40",
};

const rarityGlows: Record<string, string> = {
  common: "",
  rare: "shadow-[0_0_12px_-4px_rgba(59,130,246,0.4)]",
  epic: "shadow-[0_0_16px_-4px_rgba(168,85,247,0.4)]",
  legendary: "shadow-[0_0_20px_-4px_rgba(245,158,11,0.5)]",
};

const categoryLabels: Record<AchievementCategory, string> = {
  lessons: "Lessons",
  quizzes: "Quizzes",
  streak: "Streak",
  mastery: "Mastery",
  special: "Special",
};

export function AchievementCard({ achievement, index = 0 }: AchievementCardProps) {
  const progressPct = Math.min((achievement.progress / achievement.maxProgress) * 100, 100);
  const isComplete = achievement.progress >= achievement.maxProgress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-3.5 transition-all duration-200",
        achievement.unlocked
          ? [rarityBorders[achievement.rarity], rarityGlows[achievement.rarity], "bg-bg-card"]
          : "border-border/50 bg-bg-card/40",
        !achievement.unlocked && "opacity-60 hover:opacity-80"
      )}
    >
      {/* Rarity glow background */}
      {achievement.unlocked && (
        <div className={cn(
          "absolute -top-8 -right-8 h-16 w-16 rounded-full blur-2xl opacity-20",
          rarityBorders[achievement.rarity].replace("border-", "bg-").replace("/40", "/30")
        )} />
      )}

      <div className="relative">
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg",
              achievement.unlocked ? categoryGradients[achievement.category] : "from-bg-secondary to-bg-tertiary",
              !achievement.unlocked && "grayscale"
            )}>
              {achievement.icon}
            </div>
            <div className="min-w-0">
              <p className={cn(
                "text-sm font-semibold truncate",
                achievement.unlocked ? "text-text-primary" : "text-text-tertiary"
              )}>
                {achievement.title}
              </p>
              <p className="text-[10px] text-text-tertiary truncate">{achievement.description}</p>
            </div>
          </div>

          {/* Rarity badge */}
          <span className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            achievement.rarity === "legendary" && "bg-amber-500/15 text-amber-400",
            achievement.rarity === "epic" && "bg-purple-500/15 text-purple-400",
            achievement.rarity === "rare" && "bg-blue-500/15 text-blue-400",
            achievement.rarity === "common" && "bg-zinc-500/15 text-zinc-400",
          )}>
            {achievement.rarity}
          </span>
        </div>

        {/* Category + XP row */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="rounded-md bg-bg-secondary px-1.5 py-0.5 text-[10px] text-text-tertiary">
            {categoryLabels[achievement.category]}
          </span>
          <span className="text-[10px] text-warning font-medium">+{achievement.xpReward} XP</span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className={achievement.unlocked ? "text-success" : "text-text-tertiary"}>
              {achievement.unlocked ? "Completed" : `${achievement.progress}/${achievement.maxProgress}`}
            </span>
            {!achievement.unlocked && (
              <span className="text-text-tertiary">{Math.round(progressPct)}%</span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                achievement.unlocked ? "bg-success" : "bg-primary/60"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${achievement.unlocked ? 100 : progressPct}%` }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.02 }}
            />
          </div>
        </div>

        {/* Unlock date */}
        {achievement.unlocked && achievement.unlockedAt && (
          <p className="mt-1.5 text-[10px] text-text-tertiary/60">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
