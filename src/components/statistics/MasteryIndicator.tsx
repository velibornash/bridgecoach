"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface MasteryIndicatorProps {
  label: string;
  percentage: number;
  className?: string;
}

export function MasteryIndicator({ label, percentage, className }: MasteryIndicatorProps) {
  const level =
    percentage >= 80 ? "Mastered" :
    percentage >= 60 ? "Proficient" :
    percentage >= 40 ? "Developing" :
    "Beginner";

  const levelColor =
    percentage >= 80 ? "text-completed" :
    percentage >= 60 ? "text-primary" :
    percentage >= 40 ? "text-warning" :
    "text-text-tertiary";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Typography variant="caption" className="font-medium text-text-primary">
          {label}
        </Typography>
        <span className={cn("text-xs font-semibold", levelColor)}>{level}</span>
      </div>
      <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <span className="text-xs text-text-tertiary">{percentage}% mastery</span>
    </div>
  );
}

interface MasteryPanelProps {
  items: { label: string; percentage: number }[];
  className?: string;
}

export function MasteryPanel({ items, className }: MasteryPanelProps) {
  return (
    <GlassCard variant="elevated" className={className}>
      <Typography variant="sectionTitle" className="mb-4">
        Mastery Indicators
      </Typography>
      <div className="space-y-4">
        {items.map((item) => (
          <MasteryIndicator key={item.label} label={item.label} percentage={item.percentage} />
        ))}
      </div>
    </GlassCard>
  );
}
