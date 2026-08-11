"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { SuitSymbol } from "@/components/bridge/SuitSymbol";
import { NT_TEXT_CLASS } from "@/bridge/suits";
import type { Suit, SuitColor } from "@/components/cardEngine/types";

export interface Bid {
  level: number;
  suit: Suit | 'NT' | 'PASS' | 'DOUBLE' | 'REDOUBLE';
  label: string;
  description: string;
}

export interface SuitConfig {
  suit: Suit | 'NT';
  label: string;
  order: number;
}

export const BIDDING_SUITS: SuitConfig[] = [
  { suit: '♣', label: 'Clubs', order: 1 },
  { suit: '♦', label: 'Diamonds', order: 2 },
  { suit: '♥', label: 'Hearts', order: 3 },
  { suit: '♠', label: 'Spades', order: 4 },
  { suit: 'NT', label: 'No Trump', order: 5 },
];

const BID_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;

export const BIDS: Bid[] = [
  { level: 0, suit: 'PASS', label: 'Pass', description: 'Pass on this turn' },
  ...BID_LEVELS.flatMap((level) =>
    BIDDING_SUITS.map((s) => ({
      level,
      suit: s.suit as Bid['suit'],
      label: `${level}${s.suit}`,
      description: `${level} ${s.label}`,
    }))
  ),
  { level: 0, suit: 'DOUBLE', label: 'Double', description: 'Double the opponent\'s bid' },
  { level: 0, suit: 'REDOUBLE', label: 'Redouble', description: 'Redouble your partner\'s bid' },
];

interface BiddingBoxProps {
  yourHand: string;
  currentBid?: Bid | null;
  onBid: (bid: Bid) => void;
  disabled?: boolean;
  partnerBid?: Bid | null;
  opponentBid?: Bid | null;
}

export function BiddingBox({ yourHand, currentBid, onBid, disabled = false, partnerBid, opponentBid }: BiddingBoxProps) {
  const [activeCategory, setActiveCategory] = useState<'bids' | 'controls'>('bids');

  const controlsBid: Bid = { level: 0, suit: 'PASS', label: 'Pass', description: 'Pass' };
  const doubleBid: Bid = { level: 0, suit: 'DOUBLE', label: 'Double', description: 'Double' };
  const redoubleBid: Bid = { level: 0, suit: 'REDOUBLE', label: 'Redouble', description: 'Redouble' };

  const canDouble = currentBid && currentBid.suit !== 'PASS' && currentBid.suit !== 'DOUBLE' && currentBid.suit !== 'REDOUBLE';
  const canRedouble = currentBid?.suit === 'DOUBLE';

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Current bid display */}
      <div className="flex items-center justify-between mb-4 rounded-xl border border-border bg-bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-tertiary">Current Bid:</span>
          {currentBid ? (
            <Badge variant="primary" className="text-sm">{currentBid.label}</Badge>
          ) : (
            <span className="text-xs text-text-tertiary">Open</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {partnerBid && <Badge variant="default" className="text-[10px]">Partner: {partnerBid.label}</Badge>}
          {opponentBid && <Badge variant="default" className="text-[10px]">Opponent: {opponentBid.label}</Badge>}
        </div>
      </div>

      {/* Bid buttons */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {/* Pass */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onBid(controlsBid)}
          disabled={disabled}
          className={cn(
            "rounded-xl py-3 text-sm font-bold transition-all",
            disabled
              ? "bg-bg-secondary text-text-tertiary cursor-not-allowed"
              : "bg-bg-secondary text-text-primary hover:bg-bg-secondary/80 border border-border hover:border-primary"
          )}
        >
          Pass
        </motion.button>

        {/* Double */}
        {canDouble && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onBid(doubleBid)}
            disabled={disabled}
            className="rounded-xl py-3 bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50 font-bold text-sm transition-all"
          >
            Double
          </motion.button>
        )}

        {/* Redouble */}
        {canRedouble && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onBid(redoubleBid)}
            disabled={disabled}
            className="rounded-xl py-3 bg-amber-900/30 text-amber-400 border border-amber-500/30 hover:bg-amber-900/50 font-bold text-sm transition-all col-span-2"
          >
            Redouble
          </motion.button>
        )}

        {(canDouble && !canRedouble) && <div className="rounded-xl py-3 bg-bg-secondary" />}
        {(canDouble && !canRedouble) && <div className="rounded-xl py-3 bg-bg-secondary" />}
      </div>

      {/* Suit bids grid */}
      <div className="space-y-3">
        {BID_LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-2">
            <span className="w-6 text-xs font-bold text-text-tertiary text-center">{level}</span>
            <div className="flex gap-1.5 flex-1">
              {BIDDING_SUITS.map((s) => {
                const bid = BIDS.find((b) => b.level === level && b.suit === s.suit);
                const isActive = currentBid?.level === level && currentBid?.suit === s.suit;
                return (
                  <motion.button
                    key={`${level}-${s.suit}`}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => bid && onBid(bid)}
                    disabled={disabled}
                    className={cn(
                      "flex-1 rounded-xl py-3 text-sm font-bold transition-all border",
                      isActive
                        ? "border-primary bg-primary/20 text-primary shadow-md shadow-glow"
                        : disabled
                          ? "bg-bg-secondary text-text-tertiary border-border cursor-not-allowed"
                          : "bg-bg-card text-text-primary border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <span className={s.suit === 'NT' ? NT_TEXT_CLASS : undefined}>
                      {s.suit === 'NT' ? (
                        <span className={NT_TEXT_CLASS}>NT</span>
                      ) : (
                        <SuitSymbol suit={s.suit} size={14} themed />
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bid indicator legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-text-tertiary">
        <span>● Current</span>
        <span>○ Passed</span>
        <span>× Opponent</span>
      </div>
    </div>
  );
}
