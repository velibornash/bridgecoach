"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { Icon } from "@/components/icons/Icon";
import { cardHover } from "@/design-system/motion";

interface PracticeHandCardProps {
  title: string;
  description: string;
  difficulty: string;
  dealer: string;
  vulnerability: string;
  onPlay?: () => void;
}

export function PracticeHandCard({
  title,
  description,
  difficulty,
  dealer,
  vulnerability,
  onPlay,
}: PracticeHandCardProps) {
  return (
    <motion.div initial="rest" whileHover="hover" whileTap="tap" variants={cardHover}>
      <GlassCard variant="elevated" className="p-5 bridge-cloth-bg">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg opacity-60" aria-hidden="true">♠ ♥ ♦ ♣</span>
        </div>

        <Typography variant="sectionTitle" className="mb-1">
          {title}
        </Typography>
        <Typography variant="caption" className="mb-4 line-clamp-2">
          {description}
        </Typography>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="default">{difficulty}</Badge>
          <Badge variant="default">Dealer: {dealer}</Badge>
          <Badge variant="default">{vulnerability}</Badge>
        </div>

        <Button variant="primary" size="sm" className="w-full" onClick={onPlay}>
          <Icon icon={Play} size={14} />
          Play Hand
        </Button>
      </GlassCard>
    </motion.div>
  );
}
