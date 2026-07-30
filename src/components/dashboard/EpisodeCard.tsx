"use client";

import { motion } from "framer-motion";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import type { Episode } from "@/types";

const difficultyConfig = {
  beginner: { label: "Beginner", variant: "success" as const },
  intermediate: { label: "Intermediate", variant: "warning" as const },
  advanced: { label: "Advanced", variant: "danger" as const },
};

interface EpisodeCardProps {
  episode: Episode;
  index: number;
}

export function EpisodeCard({ episode, index }: EpisodeCardProps) {
  const isComplete = episode.completion === 100;
  const isAvailable = !episode.locked;

  return (
    <AnimatedSection delay={index * 0.08} direction="up">
      <div className="group relative flex gap-4 sm:gap-6">
        {/* Timeline connector */}
        <div className="flex flex-col items-center">
          <div
            className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold shadow-lg transition-all duration-150 ${
              isComplete
                ? "bg-success text-white shadow-success/30"
                : episode.locked
                  ? "bg-bg-secondary text-text-tertiary"
                  : "bg-gradient-to-br " + episode.gradient + " text-white shadow-primary/20"
            }`}
          >
            {isComplete ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : episode.locked ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            ) : (
              episode.episodeNumber
            )}
          </div>
          {index < 5 && (
            <div className={`h-full w-0.5 ${isComplete ? "bg-success/30" : "bg-bg-secondary"}`} />
          )}
        </div>

        {/* Card */}
        <div className={`mb-8 flex-1 rounded-2xl border transition-all duration-150 ${
          episode.locked
            ? "border-border bg-bg-card/50 opacity-60"
            : "border-border bg-bg-card hover:border-border-hover hover:shadow-md"
        }`}>
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Episode {episode.episodeNumber}
                  </span>
                  <Badge variant={difficultyConfig[episode.difficulty].variant}>
                    {difficultyConfig[episode.difficulty].label}
                  </Badge>
                  {isComplete && (
                    <Badge variant="success">Completed</Badge>
                  )}
                </div>

                <h3 className={`text-lg font-bold mt-1 ${
                  episode.locked ? "text-text-tertiary" : "text-text-primary"
                }`}>
                  {episode.title}
                </h3>
                <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                  {episode.description}
                </p>
              </div>

              {/* Gradient icon/visual */}
              <div className={`hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${episode.gradient} shadow-lg`}>
                <span className="text-2xl font-black text-white/90">{episode.icon}</span>
              </div>
            </div>

            {/* Metadata row */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {episode.duration}
              </span>
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                {episode.lessonCount} lessons
              </span>
              <span className="flex items-center gap-1 text-warning">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                {episode.totalXp} XP
              </span>
            </div>

            {/* Progress bar */}
            {isAvailable && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-tertiary">
                    {episode.completedLessons}/{episode.lessonCount} lessons
                  </span>
                  <span className="text-text-secondary font-medium">
                    {episode.completion}%
                  </span>
                </div>
                <Progress
                  value={episode.completion}
                  max={100}
                  indicatorClassName={
                    isComplete
                      ? "bg-gradient-to-r from-success to-emerald-400"
                      : undefined
                  }
                />
              </div>
            )}

            {/* Action */}
            <div className="mt-5">
              {episode.locked ? (
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Complete previous episode to unlock
                </div>
              ) : isComplete ? (
                <div className="flex items-center gap-3">
                  <Badge variant="success">Episode Complete</Badge>
                  <span className="flex items-center gap-1 text-xs text-warning font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    +{episode.xpReward} XP earned
                  </span>
                </div>
              ) : (
                <Button variant="primary" size="sm">
                  {episode.completion > 0 ? "Continue Episode" : "Start Episode"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
