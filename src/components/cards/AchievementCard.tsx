"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";
import { Progress } from "@/components/ui/Progress";
import { badgeUnlock } from "@/design-system/motion";
import type { Achievement } from "@/types";
import { emojiToIcon } from "@/components/icons/emojiMap";
import { Icon } from "@/components/icons/Icon";
import { Award } from "lucide-react";

interface AchievementCardProps {
  achievement: Achievement;
  animate?: boolean;
}

const rarityColors: Record<Achievement["rarity"], string> = {
  common: "border-border",
  rare: "border-info/30",
  epic: "border-premium/40",
  legendary: "border-xp/50 shadow-premium",
};

export function AchievementCard({ achievement, animate = false }: AchievementCardProps) {
  const IconComponent = emojiToIcon(achievement.icon) ?? Award;
  const progressPct = (achievement.progress / achievement.maxProgress) * 100;

  return (
    <motion.div variants={animate && achievement.unlocked ? badgeUnlock : undefined} initial="hidden" animate="visible">
      <GlassCard
        variant={achievement.unlocked ? "premium" : "secondary"}
        className={`p-4 ${rarityColors[achievement.rarity]} ${!achievement.unlocked ? "opacity-70" : ""}`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${achievement.unlocked ? "bg-premium-light" : "bg-locked-light"}`}>
            <Icon icon={IconComponent} size={24} className={achievement.unlocked ? "text-premium" : "text-locked"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Typography variant="sectionTitle" className="text-sm line-clamp-1">
                {achievement.title}
              </Typography>
              <Badge variant={achievement.unlocked ? "success" : "default"} className="shrink-0">
                {achievement.rarity}
              </Badge>
            </div>
            <Typography variant="caption" className="line-clamp-2 mb-2">
              {achievement.description}
            </Typography>
            {!achievement.unlocked && (
              <Progress value={progressPct} className="h-1" />
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
