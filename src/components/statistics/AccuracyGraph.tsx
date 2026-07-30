"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";

interface AccuracyGraphProps {
  accuracy: number;
  history: { label: string; value: number }[];
  className?: string;
}

export function AccuracyGraph({ accuracy, history, className }: AccuracyGraphProps) {
  const width = 280;
  const height = 80;
  const padding = 8;
  const max = 100;
  const min = Math.min(...history.map((h) => h.value), accuracy) - 10;

  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1)) * (width - padding * 2);
    const y = height - padding - ((h.value - min) / (max - min)) * (height - padding * 2);
    return { x, y, ...h };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <GlassCard variant="elevated" className={className}>
      <div className="flex items-center justify-between mb-4">
        <Typography variant="sectionTitle">Quiz Accuracy</Typography>
        <div className="text-2xl font-bold text-completed">{accuracy}%</div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`Quiz accuracy ${accuracy}%`}>
        <defs>
          <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-completed)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-completed)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={`${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`}
          fill="url(#accuracyGrad)"
        />

        <motion.path
          d={pathD}
          fill="none"
          stroke="var(--color-completed)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />

        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--color-completed)" />
        ))}
      </svg>

      <div className="flex justify-between mt-2">
        {history.map((h) => (
          <span key={h.label} className="text-[10px] text-text-tertiary">{h.label}</span>
        ))}
      </div>
    </GlassCard>
  );
}
