"use client";

import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { motion } from "framer-motion";
import { mockUser } from "@/services/mockData";

export function XPBar() {
  return (
    <AnimatedSection delay={0.1}>
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-text-secondary">Level {mockUser.level}</div>
              <div className="text-lg font-bold text-text-primary">{mockUser.xp.toLocaleString()} XP</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-tertiary">
              Next level
            </div>
            <div className="text-sm font-semibold text-text-secondary">
              {mockUser.xpToNextLevel.toLocaleString()} XP
            </div>
          </div>
        </div>
        <motion.div
          className="mt-4"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ transformOrigin: "left" }}
        >
          <Progress
            value={mockUser.xp}
            max={mockUser.xpToNextLevel}
            showLabel
          />
        </motion.div>
      </Card>
    </AnimatedSection>
  );
}
