"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";

interface DataPoint {
  label: string;
  value: number;
}

interface ProgressChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
  className?: string;
}

export function ProgressChart({ title, data, unit = "", className }: ProgressChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <GlassCard variant="elevated" className={className}>
      <Typography variant="sectionTitle" className="mb-5">
        {title}
      </Typography>

      <div className="flex items-end gap-2" style={{ height: 120 }} role="img" aria-label={title}>
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <span className="text-[10px] text-text-tertiary">
              {d.value > 0 ? `${d.value}${unit}` : ""}
            </span>
            <motion.div
              className="w-full rounded-md bg-primary/30 overflow-hidden"
              style={{ height: `${(d.value / max) * 80}%`, minHeight: d.value > 0 ? 4 : 0 }}
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 80}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
            >
              <div className="w-full h-full rounded-md bg-primary" />
            </motion.div>
            <span className="text-[10px] text-text-tertiary font-medium">{d.label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
