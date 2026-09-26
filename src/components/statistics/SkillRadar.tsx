"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";

export interface SkillProfile {
  label: string;
  /**
   * `null` means "not enough evidence to report a percentage", which is not the
   * same as zero. Zero would claim the player scored nothing on every attempt.
   */
  value: number | null;
  /** Sample size behind the figure, so a percentage can be judged. */
  attempts?: number;
}

interface SkillRadarProps {
  skills: SkillProfile[];
  className?: string;
}

export function SkillRadar({ skills, className }: SkillRadarProps) {
  /**
   * A radar polygon needs every axis to have a value. Plotting a missing one at
   * zero would assert the player scored nothing there, which is a claim rather
   * than an absence of one. So when any skill is unreported the shape is not
   * drawn at all and the counts are listed instead.
   */
  const complete = skills.every((s) => s.value !== null);

  const size = 240;
  const center = size / 2;
  const radius = 90;
  const levels = 4;
  const angleStep = (2 * Math.PI) / skills.length;

  const points = skills.map((skill, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = ((skill.value ?? 0) / 100) * radius;
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
      {!complete && (
        <p className="mb-3 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-[11px] text-text-tertiary">
          The chart needs a percentage on every axis, and a percentage needs
          enough calls behind it. Play more auctions to fill it in.
        </p>
      )}

      {complete && (
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
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        {skills.map((skill) => (
          <div key={skill.label} className="flex flex-col">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-text-tertiary">{skill.label}</span>
              {skill.value !== null ? (
                <span className="font-semibold text-text-primary">{skill.value}%</span>
              ) : (
                <span className="text-text-tertiary">&mdash;</span>
              )}
            </div>
            {typeof skill.attempts === "number" && (
              <span className="text-[9px] text-text-tertiary">
                {skill.attempts} {skill.attempts === 1 ? "call" : "calls"}
              </span>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * Removed. These were five invented percentages — Opening Bids 84, Takeout
 * Doubles 52, Defense 73, Slams 29, Signals 61 — shown to a user who had
 * recorded nothing. They are now computed from `AuctionAction.engineLegal` by
 * `/api/statistics/skills`.
 *
 * "Signals" is gone as a category: card-play communication is not recorded in
 * anything this can measure, and a proxy for it would be the same fabrication
 * with extra steps.
 */
