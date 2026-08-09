"use client";

import { motion } from "framer-motion";
import { SuitSymbol, type SuitLike } from "./SuitSymbol";
import { cn } from "@/lib/utils";

export interface MiniCard {
  rank: string;
  suit: SuitLike;
}

const DEFAULT_HAND: MiniCard[] = [
  { rank: "A", suit: "♠" },
  { rank: "K", suit: "♥" },
  { rank: "Q", suit: "♦" },
  { rank: "J", suit: "♣" },
  { rank: "10", suit: "♠" },
];

interface FloatingCardsProps {
  hand?: MiniCard[];
  className?: string;
  /** Horizontal fan spread in degrees. */
  spread?: number;
  cardHeight?: string;
  cardWidth?: string;
}

/**
 * A decorative fan of face-up playing cards that gently sways.
 * Pure visual — used in login and dashboard hero panels.
 */
export function FloatingCards({
  hand = DEFAULT_HAND,
  className,
  spread = 26,
  cardHeight = "h-44",
  cardWidth = "w-32",
}: FloatingCardsProps) {
  const center = (hand.length - 1) / 2;

  return (
    <div className={cn("relative flex items-end justify-center", className)}>
      {hand.map((card, i) => {
        const rotate = (i - center) * (spread / (hand.length - 1));
        return (
          <motion.div
            key={`${card.rank}-${card.suit}-${i}`}
            className={cn(
              "relative -ml-8 first:ml-0 flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-2xl shadow-black/40",
              cardHeight,
              cardWidth,
            )}
            style={{ zIndex: i + 1 }}
            initial={{ opacity: 0, y: 80, rotate: rotate + 14 }}
            animate={{ opacity: 1, y: 0, rotate }}
            transition={{
              delay: 0.15 + i * 0.09,
              type: "spring",
              damping: 17,
              stiffness: 110,
            }}
            whileHover={{
              y: -10,
              transition: { type: "spring", stiffness: 220, damping: 16 },
            }}
          >
            <div className="flex flex-col items-start leading-none">
              <span className="text-lg font-bold text-zinc-900">{card.rank}</span>
              <SuitSymbol suit={card.suit} size={14} />
            </div>

            <SuitSymbol suit={card.suit} size={30} className="self-center" />

            <div className="flex flex-col items-end leading-none">
              <span className="text-lg font-bold text-zinc-900">{card.rank}</span>
              <SuitSymbol suit={card.suit} size={14} />
            </div>
          </motion.div>
        );
      })}

      {/* Soft glow underneath the fan */}
      <div
        aria-hidden
        className="absolute bottom-[-18%] left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl"
      />
    </div>
  );
}
