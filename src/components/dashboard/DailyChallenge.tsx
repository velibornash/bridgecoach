"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchTodaysChallenge } from "@/services/challengeService";
import { triggerXpAnimation } from "@/components/xp/XPAnimation";
import Link from "next/link";

const typeIcons: Record<string, string> = { quiz: "🧪", puzzle: "🧩", practice: "📝", streak: "🔥" };

export function DailyChallenge() {
  // Real daily challenge derived from a seeded Mission row (Sprint 58 §13).
  // The old fixture generated its dates relative to Date.now().
  const { data: challenge } = useApiResource(fetchTodaysChallenge);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Countdown to midnight. Runs whether or not the challenge has loaded, so the
  // hook order stays constant across the loading -> loaded transition.
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      setTimeLeft(`${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  // Every hook above runs unconditionally. An early return placed between hooks
  // changes the hook count between renders, and React throws "Rendered more
  // hooks than during the previous render" the moment the challenge arrives.
  if (!challenge) return null;

  const handleComplete = () => {
    if (completed) return;
    setCompleted(true);
    triggerXpAnimation(challenge.xpReward + challenge.bonusXp);
  };

  return (
    <AnimatedSection delay={0.2}>
      <Card className="group relative overflow-hidden transition-all duration-150 hover:border-border-hover">
        <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-warning/5 blur-xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
                  <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-warning">Daily Challenge</span>
                <p className="text-[10px] text-text-tertiary font-mono">{timeLeft} left</p>
              </div>
            </div>
            <Badge variant={challenge.difficulty === "hard" ? "danger" : "warning"}>{challenge.difficulty}</Badge>
          </div>

          <div className="flex items-start gap-2 mb-3">
            <span className="text-xl">{typeIcons[challenge.type] || "📌"}</span>
            <div>
              <h3 className="text-base font-semibold text-text-primary">{challenge.title}</h3>
              <p className="text-xs text-text-secondary mt-0.5">{challenge.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {completed ? (
              <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M7.5 12l3 3 6-6" />
                </svg>
                Completed
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleComplete}>
                Complete
              </Button>
            )}
            <span className="text-xs text-text-tertiary">+{challenge.xpReward + challenge.bonusXp} XP</span>
            <Link href="/challenges" className="ml-auto text-[10px] text-primary hover:text-primary/80 transition-colors">
              History →
            </Link>
          </div>
        </div>
      </Card>
    </AnimatedSection>
  );
}
