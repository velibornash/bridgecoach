"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { PremiumMetric } from "@/components/ui/PremiumMetric";
import { mockUser, mockUserStats } from "@/services/mockData";
import { AnimatedSuitsBackground } from "@/components/bridge/AnimatedSuitsBackground";
import { FloatingCards } from "@/components/bridge/FloatingCards";
import { SuitSymbol } from "@/components/bridge/SuitSymbol";
import { BookOpen, Target, Flame, Calendar, Brain, Award, Crown, Star, Sparkles, ArrowRight, Play } from "lucide-react";

interface UserStats {
  level: number;
  streak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  accuracy: number;
  currentLesson: {
    title: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    progress: string;
    nextConcept: string;
  };
  dailyObjective: string;
  aiCoachInsights: string[];
  userName: string;
}

function PremiumDashboardHero() {
  const router = useRouter();
  const userStats: UserStats = {
    level: mockUser.level,
    streak: mockUser.streak,
    weeklyGoal: 15,
    weeklyProgress: 12,
    accuracy: mockUserStats.averageScore,
    currentLesson: {
      title: "Competitive Bidding",
      difficulty: "Advanced",
      progress: "34% complete",
      nextConcept: "Conventional Bids"
    },
    dailyObjective: "Practice 2NT shows with balanced hands",
    aiCoachInsights: [
      "You're improving your 2NT opener coverage",
      "Focus on balanced 2C-2D hands",
      "Practice takeout doubles in vulnerable boards"
    ],
    userName: `${mockUser.firstName} ${mockUser.lastName}`
  };

  const timeLeft = 365;

  return (
    <section className="relative min-h-[90vh] overflow-hidden pt-24 pb-16">
      {/* Premium background */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/60 via-transparent to-bg-primary/30" />
        {/* Glow orbs */}
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-[120px]" />
        {/* Felt hint */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(27,77,62,0.18) 0%, transparent 65%)",
          }}
        />
        <AnimatedSuitsBackground density={10} intensity="subtle" />
      </div>

      <Container className="relative flex min-h-[80vh] flex-col justify-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar name={userStats.userName} size="xl" className="ring-4 ring-primary/20" />
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-glow-sm"
              >
                <Crown size={13} className="text-white" />
              </motion.div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <Award size={16} className="text-primary" />
                </div>
                <p className="text-sm font-medium text-text-secondary">
                  Bridge Player Level {userStats.level}
                </p>
              </div>
              <h1 className="text-3xl font-light tracking-tight text-text-primary sm:text-5xl">
                Good afternoon,{" "}
                <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {userStats.userName.split(" ")[0]}
                </span>
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-2"
            >
              <Flame size={16} className="text-orange-400" />
              <div className="leading-tight">
                <span className="block text-sm font-bold text-text-primary">{userStats.streak}-day</span>
                <span className="block text-[10px] uppercase tracking-wider text-text-tertiary">streak</span>
              </div>
            </motion.div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-bg-secondary/60 px-4 py-2">
              <Star size={16} className="text-warning" />
              <span className="text-sm font-semibold text-text-primary">{mockUser.xp.toLocaleString()} XP</span>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-8 space-y-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2">
                  <Sparkles size={15} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary">
                    Your Bridge Journey Continues
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-text-primary">
                  {userStats.streak > 0 && (
                    <span className="inline-flex items-center gap-2">
                      <Flame size={18} className="text-orange-400" />
                      {userStats.streak}-day learning streak
                    </span>
                  )}
                </h2>
                <p className="text-text-secondary leading-relaxed max-w-2xl">
                  {userStats.dailyObjective}
                </p>
              </div>

              {/* Quick practice hand */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="relative"
              >
                <GlassCard variant="premium" hover className="px-6 pt-6 pb-4 w-56">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Deal of the day</span>
                    <span className="flex gap-0.5">
                      {(["♠", "♥", "♦", "♣"] as const).map((s) => (
                        <SuitSymbol key={s} suit={s} size={10} />
                      ))}
                    </span>
                  </div>
                  <FloatingCards
                    className="scale-[0.62] origin-top -mt-2"
                    cardHeight="h-28"
                    cardWidth="w-20"
                    spread={20}
                  />
                  <Button variant="outline" size="sm" fullWidth className="mt-1" onClick={() => router.push("/practice")}>
                    <Play className="h-3.5 w-3.5" />
                    Play this hand
                  </Button>
                </GlassCard>
              </motion.div>
            </div>

            {/* Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {[
                { icon: BookOpen, label: "Lessons", value: userStats.weeklyProgress, max: userStats.weeklyGoal, color: "text-indigo-400" },
                { icon: Target, label: "Accuracy", value: userStats.accuracy, max: 100, color: "text-emerald-400" },
                { icon: Calendar, label: "Streak", value: userStats.streak, max: 30, color: "text-purple-400", suffix: " days" },
                { icon: Brain, label: "Confidence", value: 78, max: 100, color: "text-amber-400", suffix: "%" },
              ].map((m) => (
                <GlassCard key={m.label} hover className="p-4">
                  <PremiumMetric {...m} />
                </GlassCard>
              ))}
            </motion.div>

            {/* Current Lesson Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <GlassCard variant="premium" hover className="p-6 max-w-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <BookOpen size={12} className="text-primary" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Current Lesson</span>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {userStats.currentLesson.title}
                    </h3>
                  </div>
                  <Badge variant={userStats.currentLesson.difficulty === 'Advanced' ? 'warning' : 'success'}>
                    {userStats.currentLesson.difficulty}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-tertiary">Progress</span>
                      <span className="text-xs font-medium text-text-primary">{userStats.currentLesson.progress}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '34%' }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-text-tertiary mb-1">Next concept:</p>
                    <p className="text-sm text-text-primary font-medium">
                      {userStats.currentLesson.nextConcept}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button variant="primary" size="sm" className="flex-1">
                    Continue Learning
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="bg-bg-secondary/50">
                    View Details
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="lg:col-span-4 space-y-6"
          >
            {/* AI Coach Insights */}
            <GlassCard variant="elevated" hover={false} className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Brain size={18} className="text-primary" />
                </div>
                <h3 className="font-semibold text-text-primary">
                  AI Coach Insights
                </h3>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                {userStats.aiCoachInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary/50 hover:bg-bg-secondary transition-colors cursor-pointer group"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5 group-hover:bg-primary/20 transition-colors">
                      <span className="text-xs text-primary font-medium">•</span>
                    </div>
                    <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                      {insight}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <button className="text-sm text-primary hover:text-primary-hover font-medium transition-colors flex items-center gap-1.5">
                  Chat with AI Coach
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </GlassCard>

            {/* Daily Objectives */}
            <GlassCard variant="primary" hover={false} className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                  <Star size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-text-primary">Daily Objective</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {userStats.dailyObjective}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary">Progress</span>
                <span className="font-medium text-text-primary">3/5 completed</span>
              </div>
              <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden mt-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '60%' }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                  className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                />
              </div>
            </GlassCard>

            {/* Time to Next Goal */}
            <GlassCard variant="secondary" hover={false} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Next Goal</h4>
                  <p className="text-sm font-semibold text-text-primary mt-1">Complete current lesson</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-tertiary block mb-1">Time remaining</span>
                  <span className="text-lg font-mono font-bold text-text-primary">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '42%' }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                />
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <PremiumDashboardHero />
    </div>
  );
}
