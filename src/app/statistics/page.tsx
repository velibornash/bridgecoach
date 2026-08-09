"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatisticCard } from "@/components/cards/StatisticCard";
import {
  SkillRadar,
  defaultSkillProfile,
  LearningHeatmap,
  generateHeatmapData,
  StreakCalendar,
  ProgressChart,
  AccuracyGraph,
  MasteryPanel,
  ConfidenceScore,
} from "@/components/statistics";
import { getLearningStats } from "@/services/statsService";
import { mockUserStats } from "@/services/mockData";
import type { LearningStats } from "@/types";
import { staggerContainer, fadeUp } from "@/design-system/motion";
import { Clock, BookOpen, Target, Flame, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProgressionMasteryWidget } from "@/components/progression/ProgressionMasteryWidget";

export default function StatisticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [heatmap] = useState(() => generateHeatmapData(12));

  useEffect(() => {
    getLearningStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <DashboardHeader />
        <main className="py-8 sm:py-12">
          <Container className="max-w-5xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </Container>
        </main>
      </div>
    );
  }

  const hasData = stats.lessonsFinished > 0;

  const statCards = [
    { label: "Hours Learned", value: stats.hoursLearned, suffix: "h", icon: Clock },
    { label: "Lessons Finished", value: stats.lessonsFinished, icon: BookOpen },
    { label: "Quiz Accuracy", value: stats.quizAccuracy, suffix: "%", icon: Target },
    { label: "Current Streak", value: stats.currentStreak, suffix: " days", icon: Flame },
    { label: "Average Score", value: stats.averageScore, suffix: "%", icon: Star },
  ];

  const masteryItems = stats.categoryBreakdown.map((c) => ({
    label: c.category,
    percentage: Math.round((c.completed / c.total) * 100),
  }));

  const accuracyHistory = stats.monthlyProgress.slice(-6).map((m) => ({
    label: m.month,
    value: Math.min(100, 60 + Math.round(m.xp / 20)),
  }));

  const sortedCategories = [...stats.categoryBreakdown].sort(
    (a, b) => b.completed / b.total - a.completed / a.total
  );
  const masteryStats = {
    lessonsCompleted: stats.lessonsFinished,
    coursesCompleted: stats.categoryBreakdown.filter((c) => c.completed >= c.total).length,
    handsSolved: mockUserStats.correctBids,
    accuracy: stats.quizAccuracy,
    averageThinkingTime: 14.5,
    weakAreas: sortedCategories.slice(0, 2).map((c) => c.category),
    strongAreas: sortedCategories.slice(-2).map((c) => c.category),
    streak: stats.currentStreak,
    confidenceScore: stats.averageScore,
    bridgeRating: 1540,
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-5xl">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.h1 variants={fadeUp} className="text-heading text-text-primary mb-6">
              Learning Statistics
            </motion.h1>

            {!hasData ? (
              <EmptyState
                variant="statistics"
                onAction={() => router.push("/lesson")}
              />
            ) : (
              <>
                <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                  {statCards.map((s) => (
                    <StatisticCard
                      key={s.label}
                      label={s.label}
                      value={s.value}
                      suffix={s.suffix}
                      icon={s.icon}
                    />
                  ))}
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-2 mb-6">
                  <SkillRadar skills={defaultSkillProfile} />
                  <ConfidenceScore score={stats.averageScore} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2 mb-6">
                  <LearningHeatmap data={heatmap} />
                  <StreakCalendar
                    currentStreak={stats.currentStreak}
                    longestStreak={mockUserStats.longestStreak}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2 mb-6">
                  <ProgressChart
                    title="Weekly Activity"
                    data={stats.weeklyActivity.map((d) => ({
                      label: d.day,
                      value: d.hours,
                    }))}
                    unit="h"
                  />
                  <AccuracyGraph accuracy={stats.quizAccuracy} history={accuracyHistory} />
                </div>

                <MasteryPanel items={masteryItems} />

                <ProgressionMasteryWidget stats={masteryStats} />
              </>
            )}
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
