"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/icons/Icon";
import { ArrowRight, BookOpen, Trophy, Users } from "lucide-react";
import { AnimatedSuitsBackground } from "@/components/bridge/AnimatedSuitsBackground";
import { FloatingCards } from "@/components/bridge/FloatingCards";
import { SuitSymbol } from "@/components/bridge/SuitSymbol";
import Link from "next/link";

const stats = [
  { value: "50K+", label: "Active Learners", icon: Users },
  { value: "200+", label: "Interactive Lessons", icon: BookOpen },
  { value: "15K+", label: "Daily Challenges Solved", icon: Trophy },
];

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-24">
      {/* Felt cloth background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#12402F] via-cloth to-[#0A2419]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(196,169,98,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 85%, rgba(63,165,126,0.18) 0%, transparent 60%)",
        }}
      />
      {/* Subtle weave */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <AnimatedSuitsBackground density={16} intensity="medium" />

      <Container className="relative z-10 flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass gradient-border inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/80">
            <span className="flex gap-1">
              {(["♠", "♥", "♦", "♣"] as const).map((s) => (
                <SuitSymbol key={s} suit={s} size={12} />
              ))}
            </span>
            Now in Beta — Free to join
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Master Contract Bridge.
          <br />
          <span className="gradient-text">One Trick at a Time.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl"
        >
          The modern way to learn Contract Bridge. Interactive lessons, smart quizzes,
          and an AI coach that guides you from your first trick to tournament play.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link href="/auth/register">
            <Button variant="primary" size="xl" className="text-base shadow-lg shadow-primary/20">
              <Icon icon={ArrowRight} size={16} />
              Start Learning Free
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="xl" className="text-base glass border-white/20 text-white/90">
              See How It Works
            </Button>
          </Link>
        </motion.div>

        {/* Card fan */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-14"
        >
          <FloatingCards className="mx-auto scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8 sm:gap-16"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 backdrop-blur-sm">
                <Icon icon={stat.icon} size={20} className="text-primary" />
              </div>
              <div className="text-2xl font-bold text-white sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-white/60 sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
