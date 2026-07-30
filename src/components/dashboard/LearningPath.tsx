"use client";

import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockLessons } from "@/services/mockData";

export function LearningPath() {
  return (
    <AnimatedSection delay={0.3}>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <h3 className="font-semibold text-text-primary">Learning Path</h3>
          </div>
          <Link href="/learning-path">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {mockLessons.slice(0, 6).map((lesson, i) => (
            <div key={lesson.id}>
              <div
                className={`group flex items-center gap-4 rounded-xl p-4 transition-all duration-150 ${
                  lesson.completed
                    ? "bg-success-light"
                    : lesson.locked
                      ? "bg-bg-secondary/20 opacity-50"
                      : "bg-bg-secondary/30 hover:bg-bg-secondary/50"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                    lesson.completed
                      ? "bg-success text-white"
                      : lesson.locked
                        ? "bg-bg-secondary text-text-tertiary"
                        : "bg-bg-secondary text-text-secondary group-hover:bg-bg-secondary"
                  }`}
                >
                  {lesson.completed ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : lesson.locked ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {lesson.title}
                    </span>
                    {lesson.completed && (
                      <Badge variant="success">Done</Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-text-tertiary">
                    {lesson.category} &middot; {lesson.duration} &middot; +{lesson.xpReward} XP
                  </div>
                </div>
                {!lesson.completed && !lesson.locked && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary transition-colors group-hover:text-text-secondary shrink-0">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
              {i < 5 && (
                <div className="ml-[26px] h-3 w-0.5 bg-bg-secondary" />
              )}
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
