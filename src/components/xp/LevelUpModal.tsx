"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { getXpForLevel, getXpToNextLevel } from "@/services/xpService";

let showLevelUpFn: ((level: number) => void) | null = null;

const particles = Array.from({ length: 20 }, (_, i) => ({
  x: (Math.random() - 0.5) * 400,
  y: (Math.random() - 0.5) * 400,
  delay: 0.1 * Math.random(),
  color: ["#6366F1", "#818CF8", "#A78BFA", "#22D3EE", "#4F46E5"][i % 5],
}));

export function triggerLevelUp(level: number) {
  showLevelUpFn?.(level);
}

export function LevelUpOverlay() {
  const [level, setLevel] = useState<number | null>(null);

  const show = useCallback((l: number) => {
    setLevel(l);
    setTimeout(() => setLevel(null), 4000);
  }, []);

  useEffect(() => {
    showLevelUpFn = show;
    return () => { showLevelUpFn = null; };
  }, [show]);

  const levelInfo = level ? getXpForLevel(level) : null;

  return (
    <AnimatePresence>
      {level && levelInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateZ: -5 }}
            animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="relative flex flex-col items-center"
          >
            {/* Glow */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse" />

            {/* Level badge */}
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 shadow-2xl shadow-primary/30">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 10 }}
                className="flex flex-col items-center"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Level</span>
                <span className="text-5xl font-black text-white">{level}</span>
              </motion.div>
            </div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-5 text-center"
            >
              <h2 className="text-2xl font-bold text-white">Level Up!</h2>
              <p className="mt-1 text-lg font-medium text-primary-light">You are now a {levelInfo.title}</p>
            </motion.div>

            {/* Next level progress indicator */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-5 text-center"
            >
              <p className="text-xs text-text-tertiary">
                {getXpToNextLevel(0, level).toLocaleString()} XP to Level {level + 1}
              </p>
            </motion.div>

            {/* Particle burst */}
            {particles.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: p.x,
                  y: p.y,
                  scale: 0,
                }}
                transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: p.color,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
