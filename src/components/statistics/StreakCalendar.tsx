"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface StreakCalendarProps {
  currentStreak: number;
  longestStreak: number;
  activeDays?: boolean[];
  className?: string;
}

export function StreakCalendar({
  currentStreak,
  longestStreak,
  activeDays = Array(28).fill(false).map((_, i) => i % 3 !== 0),
  className,
}: StreakCalendarProps) {
  const weeks = 4;

  return (
    <GlassCard variant="elevated" className={className}>
      <div className="flex items-center justify-between mb-4">
        <Typography variant="sectionTitle">Streak Calendar</Typography>
        <div className="text-right">
          <div className="text-2xl font-bold text-xp">{currentStreak}</div>
          <div className="text-xs text-text-tertiary">day streak</div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-4" role="img" aria-label={`${currentStreak} day streak calendar`}>
        {activeDays.slice(0, weeks * 7).map((active, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className={cn(
              "aspect-square rounded-md flex items-center justify-center text-[10px]",
              active ? "bg-xp/20 text-xp border border-xp/30" : "bg-bg-secondary text-text-tertiary",
            )}
          >
            {active ? "✓" : ""}
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-text-tertiary">
        <span>Longest: {longestStreak} days</span>
        <span>Keep it going!</span>
      </div>
    </GlassCard>
  );
}
