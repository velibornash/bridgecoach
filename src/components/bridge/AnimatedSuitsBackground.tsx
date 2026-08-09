"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SuitSymbol, type SuitLike } from "./SuitSymbol";
import { cn } from "@/lib/utils";

const SUITS: SuitLike[] = ["♠", "♥", "♦", "♣"];

interface AnimatedSuitsBackgroundProps {
  /** Number of floating suit symbols. */
  density?: number;
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
}

interface Drift {
  left: number;
  top: number;
  size: number;
  suit: SuitLike;
  duration: number;
  delay: number;
  driftX: number;
  rotate: number;
  opacity: number;
}

/**
 * Decorative layer of slowly drifting, gently rotating suit symbols.
 * Pure CSS-animation friendly (framer-motion) and respects reduced motion
 * via the global CSS override.
 */
export function AnimatedSuitsBackground({
  density = 16,
  className,
  intensity = "medium",
}: AnimatedSuitsBackgroundProps) {
  const items = useMemo<Drift[]>(() => {
    const opacityBase = intensity === "strong" ? 0.45 : intensity === "medium" ? 0.24 : 0.12;
    return Array.from({ length: density }, (_, i) => ({
      left: (i * 137) % 96 + 2,
      top: (i * 211) % 92 + 4,
      size: 16 + ((i * 53) % 42),
      suit: SUITS[i % 4],
      duration: 13 + ((i * 7) % 13),
      delay: -((i * 3) % 12),
      driftX: (i % 2 === 0 ? 1 : -1) * (12 + ((i * 5) % 36)),
      rotate: ((i * 29) % 70) - 35,
      opacity: opacityBase * (0.6 + ((i * 13) % 40) / 100),
    }));
  }, [density, intensity]);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {items.map((it, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{ left: `${it.left}%`, top: `${it.top}%` }}
          animate={{
            y: [0, -34, 0],
            x: [0, it.driftX, 0],
            rotate: [0, it.rotate, 0],
            opacity: [it.opacity, it.opacity * 1.5, it.opacity],
          }}
          transition={{
            duration: it.duration,
            delay: it.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <SuitSymbol suit={it.suit} size={it.size} themed />
        </motion.span>
      ))}
    </div>
  );
}
