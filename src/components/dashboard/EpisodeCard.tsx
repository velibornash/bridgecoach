"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import type { Episode } from "@/types";

interface EpisodeCardProps {
  episode: Episode;
  index: number;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  advanced: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export function EpisodeCard({ episode, index }: EpisodeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const status = episode.locked
    ? "locked"
    : episode.completion === 100
      ? "completed"
      : episode.completion > 0
        ? "in-progress"
        : "available";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
        {/* Top gradient banner */}
        <div
          className={`relative h-40 sm:h-48 bg-gradient-to-br ${episode.gradient} flex items-end p-5 overflow-hidden`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

          {/* Hover play button overlay */}
          <motion.div
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40"
          >
            {!episode.locked && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isHovered ? 1 : 0.8 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <Link href={`/lesson?episode=${episode.id}`}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform hover:scale-105">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white ml-0.5">
                      <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            )}
          </motion.div>

          {/* Episode icon and number */}
          <div className="relative z-[5] flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="text-lg">{episode.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/70">Episode {episode.episodeNumber}</span>
                {status === "completed" && (
                  <Badge variant="success">Complete</Badge>
                )}
                {status === "in-progress" && (
                  <Badge variant="primary">In Progress</Badge>
                )}
                {status === "locked" && (
                  <Badge variant="default">Locked</Badge>
                )}
              </div>
              <h3 className="text-lg font-bold text-white">{episode.title}</h3>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${difficultyColors[episode.difficulty] || "border-border text-text-tertiary"}`}>
              {episode.difficulty}
            </span>
            <span className="text-[11px] text-text-tertiary">{episode.duration}</span>
            <span className="text-[11px] text-text-tertiary">&middot;</span>
            <span className="text-[11px] text-text-tertiary">{episode.lessonCount} lessons</span>
            <span className="text-[11px] text-text-tertiary">&middot;</span>
            <span className="text-[11px] text-warning font-medium">+{episode.xpReward} XP</span>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-2">
            {episode.description}
          </p>

          {/* Progress bar for unlocked episodes */}
          {!episode.locked && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-text-tertiary">{episode.completedLessons}/{episode.lessonCount} lessons</span>
                <span className="text-text-secondary font-medium">{episode.completion}%</span>
              </div>
              <Progress value={episode.completion} />
            </div>
          )}

          {/* Action button */}
          <div className="flex items-center gap-3">
            {status === "locked" ? (
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Complete previous episode to unlock
              </div>
            ) : status === "completed" ? (
              <Link href={`/lesson?episode=${episode.id}`}>
                <Button variant="outline" size="sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                    <path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                  </svg>
                  Review
                </Button>
              </Link>
            ) : (
              <Link href={`/lesson?episode=${episode.id}`}>
                <Button variant="primary" size="sm">
                  {status === "in-progress" ? "Continue" : "Start"}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1.5">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}