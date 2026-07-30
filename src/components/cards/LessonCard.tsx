"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Zap, Lock } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";
import { Icon } from "@/components/icons/Icon";
import { cardHover } from "@/design-system/motion";
import type { Lesson } from "@/types";

interface LessonCardProps {
  lesson: Lesson;
  href?: string;
}

export function LessonCard({ lesson, href = "/lesson" }: LessonCardProps) {
  const progress = lesson.sectionsCompleted.length / Math.max(lesson.content.length, 1);

  return (
    <Link href={href} className="block">
      <motion.div initial="rest" whileHover="hover" whileTap="tap" variants={cardHover}>
        <GlassCard hover={false} variant={lesson.completed ? "secondary" : "premium"} className="p-5 h-full">
          <div className="flex items-start justify-between gap-2 mb-3">
            <Badge variant={lesson.completed ? "success" : lesson.locked ? "default" : "warning"}>
              {lesson.completed ? "Completed" : lesson.locked ? "Locked" : lesson.category}
            </Badge>
            {lesson.locked && <Icon icon={Lock} size={16} className="text-locked" />}
          </div>

          <Typography variant="sectionTitle" className="mb-1 line-clamp-2">
            {lesson.title}
          </Typography>
          <Typography variant="caption" className="line-clamp-2 mb-4">
            {lesson.description}
          </Typography>

          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Icon icon={Clock} size={12} />
              {lesson.duration}
            </span>
            <span className="flex items-center gap-1 text-xp">
              <Icon icon={Zap} size={12} />
              +{lesson.xpReward} XP
            </span>
          </div>

          {!lesson.locked && !lesson.completed && progress > 0 && (
            <div className="mt-4 h-1 rounded-full bg-bg-secondary overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </GlassCard>
      </motion.div>
    </Link>
  );
}
