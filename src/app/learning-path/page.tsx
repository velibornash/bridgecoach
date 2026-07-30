"use client";

import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { EpisodeCard } from "@/components/dashboard/EpisodeCard";
import { mockEpisodes } from "@/services/mockData";

export default function LearningPathPage() {
  const totalLessons = mockEpisodes.reduce((s, e) => s + e.lessonCount, 0);
  const completedLessons = mockEpisodes.reduce((s, e) => s + e.completedLessons, 0);
  const totalXp = mockEpisodes.reduce((s, e) => s + e.totalXp, 0);
  const overallPct = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-4xl">
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
            </div>
          </AnimatedSection>

          {/* Overall progress */}
          <AnimatedSection delay={0.05} className="mt-8">
            <div className="rounded-2xl border border-border bg-bg-card p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-glow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                      <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-secondary">Overall Progress</div>
                    <div className="text-2xl font-bold text-text-primary">{overallPct}%</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-text-primary">{completedLessons}/{totalLessons}</div>
                    <div className="text-xs text-text-tertiary">Lessons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-text-primary">{mockEpisodes.filter(e => e.completion === 100).length}/{mockEpisodes.length}</div>
                    <div className="text-xs text-text-tertiary">Episodes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-warning">{totalXp.toLocaleString()}</div>
                    <div className="text-xs text-text-tertiary">Total XP</div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Progress value={overallPct} max={100} />
              </div>
            </div>
          </AnimatedSection>

          {/* Episodes Timeline */}
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-6">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <h2 className="font-semibold text-text-primary">All Episodes</h2>
            </div>

            <div className="relative">
              {mockEpisodes.map((episode, i) => (
                <EpisodeCard key={episode.id} episode={episode} index={i} />
              ))}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
