"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";
import { Progress } from "@/components/ui/Progress";
import { Icon } from "@/components/icons/Icon";
import { cardHover } from "@/design-system/motion";
import type { Mission } from "@/types";

interface MissionCardPremiumProps {
  mission: Mission;
}

export function MissionCardPremium({ mission }: MissionCardPremiumProps) {
  const progress = (mission.progress / mission.maxProgress) * 100;
  const isComplete = mission.completed;

  return (
    <motion.div initial="rest" whileHover="hover" variants={cardHover}>
      <GlassCard variant={isComplete ? "premium" : "primary"} className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={mission.category === "daily" ? "warning" : "default"}>
            {mission.type}
          </Badge>
          <span className="text-xs font-medium text-xp">+{mission.xpReward} XP</span>
        </div>

        <Typography variant="sectionTitle" className="mb-1">
          {mission.title}
        </Typography>
        <Typography variant="caption" className="mb-4">
          {mission.description}
        </Typography>

        <div className="flex items-center gap-3 mb-4">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-xs text-text-tertiary shrink-0">
            {mission.progress}/{mission.maxProgress}
          </span>
        </div>

        {isComplete && (
          <div className="flex items-center justify-center gap-2 text-completed text-sm font-medium">
            <Icon icon={Check} size={14} />
            Complete
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
