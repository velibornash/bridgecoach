"use client";

import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { EpisodeCard } from "@/components/dashboard/EpisodeCard";
import { mockEpisodes, mockLessons } from "@/services/mockData";
import { getCourseProgress } from "@/services/lessonService";
import Link from "next/link";

export default function LearningPathPage() {
  const totalLessons = mockEpisodes.reduce((s, e) => s + e.lessonCount, 0);
  const completedLessons = mockEpisodes.reduce((s, e) => s + e.completedLessons, 0);
  const totalXp = mockEpisodes.reduce((s, e) => s + e.totalXp, 0);
  const overallPct = Math.round((completedLessons / totalLessons) * 100);
  const course = getCourseProgress();
  const unlockedCount = mockEpisodes.filter((e) => !e.locked).length;
  const completeCount = mockEpisodes.filter((e) => e.completion === 100).length;

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-5xl">
          {/* Header */}
          <AnimatedSection>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
                    Learning Path
                  </h1>
                  <Badge variant="primary">{mockEpisodes.length} Episodes</Badge>
                </div>
                <p className="mt-1 text-text-secondary">
                  Your structured journey from beginner to expert.
                </p>
              </div>
              <Link
                href="/xp"
                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                View XP & Progress &rarr;
              </Link>
            </div>
          </AnimatedSection>

          {/* Stats row */}
          <AnimatedSection delay={0.05} className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-bg-card p-4">
                <div className="text-2xl font-bold text-text-primary">{overallPct}%</div>
                <div className="text-xs text-text-tertiary mt-0.5">Course Progress</div>
              </div>
              <div className="rounded-xl border border-border bg-bg-card p-4">
                <div className="text-2xl font-bold text-text-primary">{course.completedLessons}/{course.totalLessons}</div>
                <div className="text-xs text-text-tertiary mt-0.5">Lessons Done</div>
              </div>
              <div className="rounded-xl border border-border bg-bg-card p-4">
                <div className="text-2xl font-bold text-text-primary">{completeCount}/{mockEpisodes.length}</div>
                <div className="text-xs text-text-tertiary mt-0.5">Episodes Done</div>
              </div>
              <div className="rounded-xl border border-border bg-bg-card p-4">
                <div className="text-2xl font-bold text-warning">{totalXp.toLocaleString()}</div>
                <div className="text-xs text-text-tertiary mt-0.5">Total XP</div>
              </div>
            </div>
          </AnimatedSection>

          {/* Overall progress bar */}
          <AnimatedSection delay={0.1} className="mt-5">
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-text-secondary font-medium">Overall Progress</span>
                <span className="text-text-primary font-bold">{overallPct}%</span>
              </div>
              <Progress value={overallPct} max={100} />
              <div className="flex items-center gap-4 mt-2 text-[10px] text-text-tertiary">
                <span>{course.completedLessons} completed</span>
                <span>{course.inProgressLessons} in progress</span>
                <span>{course.lockedLessons} locked</span>
              </div>
            </div>
          </AnimatedSection>

          {/* Episodes Grid */}
          <AnimatedSection delay={0.15} className="mt-8">
            <div className="flex items-center gap-2 mb-6">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <h2 className="font-semibold text-text-primary">
                Episodes
                <span className="ml-2 text-xs text-text-tertiary font-normal">
                  ({unlockedCount} unlocked, {completeCount} completed)
                </span>
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {mockEpisodes.map((episode, i) => (
                <EpisodeCard key={episode.id} episode={episode} index={i} />
              ))}
            </div>
          </AnimatedSection>
        </Container>
      </main>
    </div>
  );
}