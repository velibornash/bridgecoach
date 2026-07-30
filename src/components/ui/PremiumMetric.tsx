'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '@/components/icons/Icon';

interface PremiumMetricProps {
  icon: LucideIcon;
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}

export function PremiumMetric({
  icon,
  label,
  value,
  max,
  color = "text-primary",
  suffix = '',
}: PremiumMetricProps) {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-2"
    >
      <div className="flex justify-center mb-2">
        <div className="p-2 rounded-lg bg-primary-light">
          <Icon icon={icon} size={20} className={cn(color)} />
        </div>
      </div>

      <div className={cn("text-2xl font-bold text-text-primary")}>
        {value}{suffix}
      </div>

      <div className="text-xs font-medium text-text-tertiary">
        {label}
      </div>

      <div className="w-full bg-bg-secondary rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="h-full rounded-full bg-primary"
        />
      </div>
    </motion.div>
  );
}
