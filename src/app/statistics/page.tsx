"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getLearningStats } from "@/services/statsService";
import type { LearningStats } from "@/types";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function StatisticsPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);

  useEffect(() => {
    getLearningStats().then(setStats);
  }, []);

  if (!stats) return null;

  const statCards = [
    { label: "Hours Learned", value: stats.hoursLearned, suffix: "h", icon: "⏱", color: "text-indigo-400" },
    { label: "Lessons Finished", value: stats.lessonsFinished, icon: "📖", color: "text-emerald-400" },
    { label: "Quiz Accuracy", value: stats.quizAccuracy, suffix: "%", icon: "🎯", color: "text-amber-400" },
    { label: "Current Streak", value: stats.currentStreak, suffix: " days", icon: "🔥", color: "text-orange-400" },
    { label: "Average Score", value: stats.averageScore, suffix: "%", icon: "⭐", color: "text-violet-400" },
  ];

  const maxWeekly = Math.max(...stats.weeklyActivity.map((d) => d.hours), 1);
  const maxMonthlyXp = Math.max(...stats.monthlyProgress.map((d) => d.xp), 1);
  const maxMonthlyLessons = Math.max(...stats.monthlyProgress.map((d) => d.lessons), 1);
  const weekTotal = stats.weeklyActivity.reduce((s, d) => s + d.hours, 0);

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-4xl">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.h1 variants={item} className="text-2xl font-bold text-text-primary mb-6">Learning Statistics</motion.h1>

            {/* Stat cards grid */}
            <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
              {statCards.map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-bg-card p-4 text-center">
                  <div className={`text-2xl mb-1 ${s.color}`}>{s.icon}</div>
                  <div className="text-xl font-bold text-text-primary">
                    {s.value}{s.suffix}
                  </div>
                  <div className="text-[10px] text-text-tertiary mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Weekly Activity */}
            <motion.div variants={item} className="rounded-xl border border-border bg-bg-card p-5 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-text-primary">Weekly Activity</h2>
                <span className="text-xs text-text-tertiary">{weekTotal.toFixed(1)}h this week</span>
              </div>
              <div className="flex items-end gap-2" style={{ height: 120 }}>
                {stats.weeklyActivity.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] text-text-tertiary">{d.hours > 0 ? `${d.hours.toFixed(1)}h` : ""}</span>
                    <div
                      className="w-full rounded-md bg-primary/30 transition-all duration-500"
                      style={{ height: `${(d.hours / maxWeekly) * 80}%`, minHeight: d.hours > 0 ? 4 : 0 }}
                    >
                      <div
                        className="w-full h-full rounded-md bg-primary"
                        style={{ height: `${(d.hours / maxWeekly) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-tertiary font-medium">{d.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Monthly Progress - dual chart */}
            <motion.div variants={item} className="rounded-xl border border-border bg-bg-card p-5 mb-6">
              <h2 className="text-base font-bold text-text-primary mb-5">Monthly Progress</h2>

              {/* XP bars */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-secondary">XP Earned</span>
                </div>
                <div className="flex items-end gap-1.5" style={{ height: 64 }}>
                  {stats.monthlyProgress.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                      <div
                        className="w-full rounded-sm bg-primary/30"
                        style={{ height: `${(m.xp / maxMonthlyXp) * 48}px`, minHeight: m.xp > 0 ? 4 : 0 }}
                      >
                        <div
                          className="w-full rounded-sm bg-primary"
                          style={{ height: `${(m.xp / maxMonthlyXp) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-text-tertiary">{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lessons bars */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-secondary">Lessons Completed</span>
                </div>
                <div className="flex items-end gap-1.5" style={{ height: 48 }}>
                  {stats.monthlyProgress.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                      <div
                        className="w-full rounded-sm bg-emerald-500/30"
                        style={{ height: `${(m.lessons / maxMonthlyLessons) * 32}px`, minHeight: m.lessons > 0 ? 4 : 0 }}
                      >
                        <div
                          className="w-full rounded-sm bg-emerald-500"
                          style={{ height: `${(m.lessons / maxMonthlyLessons) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-text-tertiary">{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div variants={item} className="rounded-xl border border-border bg-bg-card p-5">
              <h2 className="text-base font-bold text-text-primary mb-4">Category Breakdown</h2>
              <div className="space-y-3">
                {stats.categoryBreakdown.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-secondary">{cat.category}</span>
                      <span className="text-xs text-text-tertiary">{cat.completed}/{cat.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(cat.completed / cat.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
