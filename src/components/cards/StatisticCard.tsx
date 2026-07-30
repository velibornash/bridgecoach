"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";
import { Icon } from "@/components/icons/Icon";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatisticCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatisticCard({
  label,
  value,
  suffix = "",
  icon,
  trend,
  className,
}: StatisticCardProps) {
  return (
    <GlassCard variant="elevated" className={cn("p-4 text-center", className)}>
      <div className="flex justify-center mb-2">
        <div className="p-2 rounded-lg bg-accent-light">
          <Icon icon={icon} size={22} className="text-accent" />
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary">
        {value}{suffix}
      </div>
      <Typography variant="caption" className="mt-0.5">
        {label}
      </Typography>
      {trend && (
        <span className={`text-xs font-medium mt-1 inline-block ${trend.positive ? "text-completed" : "text-danger"}`}>
          {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
        </span>
      )}
    </GlassCard>
  );
}
