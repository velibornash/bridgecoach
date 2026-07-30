"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface HeatmapDay {
  date: string;
  intensity: 0 | 1 | 2 | 3 | 4;
}

interface LearningHeatmapProps {
  data: HeatmapDay[];
  weeks?: number;
  className?: string;
}

const intensityColors = [
  "bg-bg-secondary",
  "bg-accent/20",
  "bg-accent/40",
  "bg-accent/60",
  "bg-accent",
];

export function LearningHeatmap({ data, weeks = 12, className }: LearningHeatmapProps) {
  const daysPerWeek = 7;
  const totalDays = weeks * daysPerWeek;
  const cells = data.slice(-totalDays);

  while (cells.length < totalDays) {
    cells.unshift({ date: "", intensity: 0 });
  }

  const weekGroups: HeatmapDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    weekGroups.push(cells.slice(w * daysPerWeek, (w + 1) * daysPerWeek));
  }

  return (
    <GlassCard variant="elevated" className={className}>
      <Typography variant="sectionTitle" className="mb-4">
        Learning Activity
      </Typography>

      <div className="flex gap-1 overflow-x-auto pb-2" role="img" aria-label="Learning activity heatmap">
        {weekGroups.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={`${wi}-${di}`}
                className={cn("w-3 h-3 rounded-sm", intensityColors[day.intensity])}
                title={day.date ? `${day.date}: level ${day.intensity}` : "No activity"}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-text-tertiary">
        <span>Less</span>
        {intensityColors.map((color, i) => (
          <div key={i} className={cn("w-3 h-3 rounded-sm", color)} />
        ))}
        <span>More</span>
      </div>
    </GlassCard>
  );
}

/** Generate mock heatmap data for the last N weeks */
export function generateHeatmapData(weeks = 12): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  const total = weeks * 7;
  for (let i = total; i > 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split("T")[0],
      intensity: Math.random() > 0.3 ? (Math.floor(Math.random() * 4) + 1) as HeatmapDay["intensity"] : 0,
    });
  }
  return days;
}
