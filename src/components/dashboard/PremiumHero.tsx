"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Target, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Typography } from "@/components/ui/Typography";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PremiumMetric } from "@/components/ui/PremiumMetric";
import { Icon } from "@/components/icons/Icon";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchLessons } from "@/services/lessonService";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { fadeUp, staggerContainer } from "@/design-system/motion";

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function PremiumHero() {
  // The clock is read after mount. Computing it during render made the server
  // and client disagree, which React reported as a hydration mismatch.
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  // Real progression and a real next lesson (Sprint 58 §11).
  const { data } = useDashboardData();
  const { data: lessons } = useApiResource(fetchLessons);
  const nextLesson = lessons?.find((l) => !l.completed && !l.locked);

  const lessonProgress = nextLesson
    ? Math.round(
        (nextLesson.sectionsCompleted.length / Math.max(nextLesson.content.length, 1)) * 100,
      )
    : 0;

  const dailyGoal = 3;
  const dailyProgress = 2;

  return (
    <section className="relative overflow-hidden mb-8" aria-label="Continue learning">
      {/* Animated bridge club background */}
      <div className="absolute inset-0 bridge-cloth-bg walnut-texture opacity-40" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-bg-primary/80 via-transparent to-accent/10"
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-bg-primary/50 backdrop-blur-sm" />

      <div className="relative container mx-auto px-4 py-10 sm:py-14">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto"
        >
          <GlassCard variant="premium" hover={false} className="p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              {/* Left — emotional center */}
              <motion.div variants={fadeUp} className="space-y-4">
                <p className="text-label text-premium">
                  Level {data?.progression.level ?? 1}
                </p>

                <Typography variant="hero">
                  {greeting}, {data?.user.firstName ?? "there"}.
                </Typography>

                <p className="text-lg text-text-secondary font-light">
                  Continue your journey.
                </p>

                {(data?.progression.streak ?? 0) > 0 && (
                  <div className="flex items-center gap-2 text-sm text-xp">
                    <Icon icon={Flame} size={16} />
                    <span>{data?.progression.streak}-day learning streak</span>
                  </div>
                )}

                {/* Daily objective */}
                <div className="flex items-center gap-4 pt-2">
                  <ProgressRing
                    progress={(dailyProgress / dailyGoal) * 100}
                    size={56}
                    strokeWidth={4}
                    label={`${dailyProgress}/${dailyGoal}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Daily Objective</p>
                    <p className="text-xs text-text-tertiary">
                      {dailyProgress} of {dailyGoal} lessons today
                    </p>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <PremiumMetric icon={BookOpen} label="This Week" value={12} max={15} />
                  <PremiumMetric icon={Target} label="Accuracy" value={84} max={100} suffix="%" />
                  <PremiumMetric icon={Flame} label="Streak" value={data?.progression.streak ?? 0} max={Math.max(data?.progression.longestStreak ?? 0, 1)} suffix="d" />
                </div>
              </motion.div>

              {/* Right — next lesson CTA */}
              <motion.div variants={fadeUp} className="lg:w-80">
                {nextLesson ? (
                  <div className="space-y-5 text-center lg:text-left">
                    <div>
                      <p className="text-label text-text-tertiary mb-2">Next Lesson</p>
                      <Typography variant="heading" className="text-xl sm:text-2xl">
                        {nextLesson.title}
                      </Typography>
                      <p className="text-sm text-text-tertiary mt-1">
                        {nextLesson.duration} · +{nextLesson.xpReward} XP
                      </p>
                    </div>

                    {lessonProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-text-tertiary">
                          <span>Progress</span>
                          <span>{lessonProgress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${lessonProgress}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>
                    )}

                    <Button variant="primary" size="lg" fullWidth asChild>
                      <Link href="/lesson">Continue Learning</Link>
                    </Button>
                  </div>
                ) : (
                  <Button variant="primary" size="lg" fullWidth asChild>
                    <Link href="/catalog">Start Learning</Link>
                  </Button>
                )}
              </motion.div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
