"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Lock } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Icon } from "@/components/icons/Icon";
import { cardHover } from "@/design-system/motion";
import type { CatalogCourse } from "@/types";

interface CourseCardProps {
  course: CatalogCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  const progress = course.progress;

  return (
    <Link href={`/catalog?course=${course.id}`} className="block">
      <motion.div initial="rest" whileHover="hover" whileTap="tap" variants={cardHover}>
        <GlassCard variant="elevated" hover={false} className="p-0 overflow-hidden h-full">
          <div
            className={`h-28 bg-gradient-to-br ${course.gradient} relative flex items-center justify-center`}
          >
            <Icon icon={BookOpen} size={32} className="text-white/80" />
            {course.locked && (
              <div className="absolute inset-0 bg-bg-primary/60 flex items-center justify-center">
                <Icon icon={Lock} size={24} className="text-locked" />
              </div>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Typography variant="sectionTitle" className="line-clamp-1">
                {course.title}
              </Typography>
              {!course.locked && progress > 0 && (
                <ProgressRing progress={progress} size={40} strokeWidth={3} showLabel={false} />
              )}
            </div>

            <Typography variant="caption" className="line-clamp-2 mb-3">
              {course.description}
            </Typography>

            <div className="flex items-center gap-2">
              <Badge variant="default">{course.difficulty}</Badge>
              <span className="text-xs text-text-tertiary">
                {course.completedCount}/{course.lessonCount} lessons
              </span>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </Link>
  );
}
