"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { mockAchievements } from "@/services/mockData";
import { AchievementCard } from "./AchievementCard";
import type { AchievementCategory } from "@/types";

const categories: { key: AchievementCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "lessons", label: "Lessons" },
  { key: "quizzes", label: "Quizzes" },
  { key: "streak", label: "Streak" },
  { key: "mastery", label: "Mastery" },
  { key: "special", label: "Special" },
];

export function AchievementGrid() {
  const [filter, setFilter] = useState<AchievementCategory | "all">("all");
  const [showLocked, setShowLocked] = useState(true);

  const filtered = mockAchievements
    .filter((a) => filter === "all" || a.category === filter)
    .filter((a) => showLocked || a.unlocked);

  const unlocked = mockAchievements.filter((a) => a.unlocked).length;
  const total = mockAchievements.length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-bg-card p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
          <span className="text-2xl">🏆</span>
        </div>
        <div>
          <p className="text-lg font-bold text-text-primary">{unlocked}/{total} Unlocked</p>
          <p className="text-xs text-text-tertiary">
            {total - unlocked} remaining &middot;{" "}
            {mockAchievements.filter((a) => !a.unlocked).reduce((s, a) => s + a.xpReward, 0)} XP available
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              filter === cat.key
                ? "bg-primary text-white"
                : "bg-bg-secondary text-text-tertiary hover:text-text-secondary"
            )}
          >
            {cat.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowLocked((s) => !s)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              showLocked ? "bg-bg-secondary text-text-secondary" : "bg-bg-secondary/30 text-text-tertiary"
            )}
          >
            {showLocked ? "Hide Locked" : "Show Locked"}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((a, i) => (
          <AchievementCard key={a.id} achievement={a} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-text-tertiary py-8">No achievements match your filter.</p>
      )}
    </div>
  );
}
