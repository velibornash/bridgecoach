"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import Link from "next/link";
import { mockCatalog } from "@/services/mockData";
import type { CourseLevel } from "@/types";

const categories = ["All", "Basics", "Bidding", "Play", "Defense"];
const difficulties = [
  { value: "all" as CourseLevel, label: "All Levels" },
  { value: "beginner" as CourseLevel, label: "Beginner" },
  { value: "intermediate" as CourseLevel, label: "Intermediate" },
  { value: "advanced" as CourseLevel, label: "Advanced" },
];

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  advanced: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

type SortKey = "progress" | "duration" | "xp" | "lessons";

export default function CatalogPage() {
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState<CourseLevel>("all");
  const [sort, setSort] = useState<SortKey>("progress");
  const [showLocked, setShowLocked] = useState(false);

  const filtered = useMemo(() => {
    let items = [...mockCatalog];
    if (category !== "All") items = items.filter((c) => c.category === category);
    if (difficulty !== "all") items = items.filter((c) => c.difficulty === difficulty);
    if (!showLocked) items = items.filter((c) => !c.locked);
    items.sort((a, b) => {
      switch (sort) {
        case "progress": return b.progress - a.progress;
        case "duration": return parseInt(a.duration) - parseInt(b.duration);
        case "xp": return b.xpReward - a.xpReward;
        case "lessons": return b.lessonCount - a.lessonCount;
        default: return 0;
      }
    });
    return items;
  }, [category, difficulty, sort, showLocked]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Course Catalog</h1>
            <p className="text-sm text-text-tertiary mt-1">Explore all courses, filter by category and difficulty.</p>
          </div>

          {/* Filters bar */}
          <div className="rounded-xl border border-border bg-bg-card p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category */}
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      category === cat
                        ? "bg-primary text-white"
                        : "text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <span className="text-text-tertiary text-[10px] hidden sm:inline">|</span>

              {/* Difficulty */}
              <div className="flex gap-1">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      difficulty === d.value
                        ? "bg-primary text-white"
                        : "text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <span className="text-text-tertiary text-[10px] hidden sm:inline">|</span>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-secondary outline-none focus:border-primary/50"
              >
                <option value="progress">Progress</option>
                <option value="duration">Duration</option>
                <option value="xp">XP Reward</option>
                <option value="lessons">Lesson Count</option>
              </select>

              {/* Toggle locked */}
              <label className="flex items-center gap-2 text-xs text-text-tertiary cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={showLocked}
                  onChange={(e) => setShowLocked(e.target.checked)}
                  className="rounded border-border bg-bg-secondary text-primary focus:ring-primary/30"
                />
                Show locked
              </label>
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-text-tertiary mb-4">{filtered.length} course{filtered.length !== 1 ? "s" : ""} found</p>

          {/* Course grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((course, i) => (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 h-full flex flex-col">
                    {/* Header gradient */}
                    <div className={`relative h-32 bg-gradient-to-br ${course.gradient} flex items-end p-4 overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      {course.locked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                            <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                      )}
                      <div className="relative z-[5] flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                          <span className="text-base">{course.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white leading-tight">{course.title}</h3>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium border ${difficultyColors[course.difficulty] || "border-border text-text-tertiary"}`}>
                          {course.difficulty}
                        </span>
                        <span className="text-[10px] text-text-tertiary">{course.category}</span>
                        <span className="text-[10px] text-text-tertiary">&middot;</span>
                        <span className="text-[10px] text-text-tertiary">{course.duration}</span>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-2">
                        {course.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {course.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-bg-secondary px-2 py-0.5 text-[9px] text-text-tertiary">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Progress */}
                      {!course.locked && (
                        <div className="mt-auto">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-text-tertiary">{course.completedCount}/{course.lessonCount} lessons</span>
                            <span className="text-text-secondary font-medium">{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} />
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                          <span>{course.lessonCount} lessons</span>
                          <span>&middot;</span>
                          <span className="text-warning font-medium">+{course.xpReward} XP</span>
                        </div>
                        {!course.locked && (
                          <Link href={`/lesson?episode=${course.id}`}>
                            <Button variant="primary" size="sm" className="text-[10px] px-3 py-1">
                              {course.progress > 0 ? "Continue" : "Start"}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                  <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <p className="text-sm text-text-tertiary">No courses match your filters.</p>
              <p className="text-xs text-text-tertiary mt-1">Try adjusting your category or difficulty selection.</p>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}