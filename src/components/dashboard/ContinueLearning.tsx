"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { mockLessons } from "@/services/mockData";

export function ContinueLearning() {
  const nextLesson = mockLessons.find((l) => !l.completed && !l.locked);

  if (!nextLesson) return null;

  return (
    <AnimatedSection delay={0.15}>
      <Card glow className="group relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              Continue Learning
            </span>
          </div>

          <h3 className="mt-3 text-xl font-bold text-text-primary">{nextLesson.title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{nextLesson.description}</p>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {nextLesson.duration}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-warning">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              +{nextLesson.xpReward} XP
            </div>
          </div>

          <Button variant="primary" size="lg" className="mt-5">
            Continue Lesson
          </Button>
        </div>
      </Card>
    </AnimatedSection>
  );
}
