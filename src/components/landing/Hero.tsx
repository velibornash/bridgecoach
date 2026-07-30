"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/icons/Icon";
import { ArrowRight, BookOpen, Trophy, Users } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden pt-24">
      <div className="absolute inset-0" />
      <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-accent/5 blur-[80px]" />
      <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-indigo-500/5 blur-[60px]" />

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      <Container className="relative flex min-h-[80vh] flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass gradient-border inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-text-secondary">
            <span className="flex h-2 w-2 rounded-full bg-success" />
            Now in Beta — Free to join
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 max-w-4xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Master Contract Bridge.
          <br />
          <span className="gradient-text">One Trick at a Time.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl"
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
            <Button variant="outline" size="xl" className="text-base glass">
              See How It Works
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 grid grid-cols-3 gap-8 sm:gap-16"
        >
          {[
            { value: "50K+", label: "Active Learners", icon: Users },
            { value: "200+", label: "Interactive Lessons", icon: BookOpen },
            { value: "15K+", label: "Daily Challenges Solved", icon: Trophy },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon icon={stat.icon} size={20} className="text-primary" />
              </div>
              <div className="text-2xl font-bold text-text-primary sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-text-tertiary sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
