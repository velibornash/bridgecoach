"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";

export interface SkillProfile {
  label: string;
  value: number;
}

interface SkillRadarProps {
  skills: SkillProfile[];
  className?: string;
}

export function SkillRadar({ skills, className }: SkillRadarProps) {
  const size = 240;
  const center = size / 2;
  const radius = 90;
  const levels = 4;
  const angleStep = (2 * Math.PI) / skills.length;

  const points = skills.map((skill, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (skill.value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      labelX: center + (radius + 24) * Math.cos(angle),
      labelY: center + (radius + 24) * Math.sin(angle),
      label: skill.label,
      value: skill.value,
    };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <GlassCard variant="elevated" className={className}>
      <Typography variant="sectionTitle" className="mb-4">
        Skill Profile
      </Typography>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xs mx-auto" role="img" aria-label="Skill radar chart">
        {/* Grid rings */}
        {Array.from({ length: levels }, (_, l) => {
          const r = ((l + 1) / levels) * radius;
          const ringPoints = skills
            .map((_, i) => {
              const angle = angleStep * i - Math.PI / 2;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            })
            .join(" ");
          return (
            <polygon
              key={l}
              points={ringPoints}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {skills.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="var(--color-border)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <motion.polygon
          points={polygon}
          fill="var(--color-accent-light)"
          stroke="var(--color-accent)"
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-text-secondary)"
            fontSize="10"
          >
            {p.label}
          </text>
        ))}
      </svg>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {skills.map((skill) => (
          <div key={skill.label} className="flex items-center justify-between text-xs">
            <span className="text-text-tertiary">{skill.label}</span>
            <span className="font-semibold text-text-primary">{skill.value}%</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export const defaultSkillProfile: SkillProfile[] = [
  { label: "Opening Bids", value: 84 },
  { label: "Takeout Doubles", value: 52 },
  { label: "Defense", value: 73 },
  { label: "Slams", value: 29 },
  { label: "Signals", value: 61 },
];
