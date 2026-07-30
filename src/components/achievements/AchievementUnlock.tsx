"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/types";

let showUnlockFn: ((achievement: Achievement) => void) | null = null;

export function triggerAchievementUnlock(achievement: Achievement) {
  showUnlockFn?.(achievement);
}

export function AchievementUnlockOverlay() {
  const [achievement, setAchievement] = useState<Achievement | null>(null);

  const show = useCallback((a: Achievement) => {
    setAchievement(a);
    setTimeout(() => setAchievement(null), 4500);
  }, []);

  useEffect(() => {
    showUnlockFn = show;
    return () => { showUnlockFn = null; };
  }, [show]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative mx-4 mb-20 sm:mb-0 w-full max-w-sm"
          >
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-bg-card to-bg-primary p-6 shadow-2xl shadow-amber-500/10 text-center">
              {/* Decorative top glow */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-20 w-32 rounded-full bg-amber-500/20 blur-3xl" />

              {/* Icon bubble */}
              <motion.div
                initial={{ scale: 0, rotateZ: -30 }}
                animate={{ scale: 1, rotateZ: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.1 }}
                className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl"
              >
                <span className="text-4xl">{achievement.icon}</span>
              </motion.div>

              {/* Text */}
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Achievement Unlocked</p>
                <h3 className="text-xl font-bold text-text-primary">{achievement.title}</h3>
                <p className="text-xs text-text-tertiary mt-1">{achievement.description}</p>

                {/* XP reward */}
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
                    <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  <span className="text-xs font-semibold text-warning">+{achievement.xpReward} XP</span>
                </div>
              </div>

              {/* Sparkles */}
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{
                    opacity: 0,
                    x: Math.cos((i / 12) * Math.PI * 2) * 120,
                    y: Math.sin((i / 12) * Math.PI * 2) * 120,
                    scale: 0,
                  }}
                  transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
                  style={{
                    top: "40%",
                    left: "50%",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
