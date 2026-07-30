"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";
import { ProgressRing } from "@/components/ui/ProgressRing";

interface ConfidenceScoreProps {
  score: number;
  label?: string;
  description?: string;
  className?: string;
}

export function ConfidenceScore({
  score,
  label = "Confidence Score",
  description = "Based on accuracy, consistency, and thinking time",
  className,
}: ConfidenceScoreProps) {
  const level =
    score >= 80 ? "High confidence" :
    score >= 60 ? "Moderate confidence" :
    score >= 40 ? "Building confidence" :
    "Needs practice";

  return (
    <GlassCard variant="premium" className={className}>
      <div className="flex items-center gap-6">
        <ProgressRing
          progress={score}
          size={96}
          strokeWidth={8}
          color="var(--color-premium)"
          label={`${score}`}
        />
        <div>
          <Typography variant="sectionTitle">{label}</Typography>
          <p className="text-sm font-medium text-premium mt-1">{level}</p>
          <Typography variant="caption" className="mt-2">
            {description}
          </Typography>
        </div>
      </div>
    </GlassCard>
  );
}
