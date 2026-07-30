"use client";

import { motion } from "framer-motion";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Card } from "@/components/ui/Card";
import { mockAchievements } from "@/services/mockData";
import Link from "next/link";

const rarityColors: Record<string, string> = {
  common: "border-zinc-500/30",
  rare: "border-indigo-500/40",
  epic: "border-purple-500/40",
  legendary: "border-amber-500/40",
};

export function Achievements() {
  const unlocked = mockAchievements.filter((a) => a.unlocked);
  const total = mockAchievements.length;

  return (
    <AnimatedSection delay={0.25}>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m0 0a6.027 6.027 0 01-2.77-.897" />
            </svg>
            <h3 className="font-semibold text-text-primary">Achievements</h3>
          </div>
          <Link href="/achievements" className="text-xs text-primary hover:text-primary/80 transition-colors">
            View all
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {mockAchievements.slice(0, 6).map((achievement) => (
            <div
              key={achievement.id}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all duration-150 ${
                achievement.unlocked
                  ? rarityColors[achievement.rarity] + " bg-bg-secondary"
                  : "border border-transparent bg-bg-secondary/20 opacity-40"
              }`}
            >
              <span className="text-2xl">{achievement.icon}</span>
              <span className="text-[10px] font-medium leading-tight text-text-secondary">
                {achievement.title}
              </span>
              {/* Progress dot for in-progress */}
              {!achievement.unlocked && achievement.progress > 0 && (
                <div className="w-full h-1 rounded-full bg-bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <Link
          href="/achievements"
          className="mt-3 block text-center text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          {unlocked.length}/{total} unlocked
        </Link>
      </Card>
    </AnimatedSection>
  );
}
