"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardEngine, CardBack, createDeck, shuffleDeck } from "@/components/cardEngine/CardEngine";
import type { BridgeCard } from "@/components/cardEngine/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface DealAnimationProps {
  onComplete?: (hands: Record<string, BridgeCard[]>) => void;
  size?: 'sm' | 'md' | 'lg';
}

const dealSpeed = 120;
const positions = ['north', 'east', 'south', 'west'] as const;

export function DealAnimation({ onComplete, size = 'md' }: DealAnimationProps) {
  const [dealIndex, setDealIndex] = useState(0);
  const [deck, setDeck] = useState<BridgeCard[]>([]);

  const hands = useMemo(() => {
    const result: Record<string, BridgeCard[]> = { north: [], east: [], south: [], west: [] };
    deck.slice(0, Math.min(dealIndex, 52)).forEach((card, i) => {
      result[positions[i % 4]].push({ ...card, faceUp: true });
    });
    return result;
  }, [deck, dealIndex]);

  const isDealing = dealIndex > 0 && dealIndex < 52;

  const startDeal = () => {
    const newDeck = shuffleDeck(createDeck());
    setDeck(newDeck);
    setDealIndex(0);
  };

  useEffect(() => {
    if (dealIndex >= 52) return;
    if (deck.length === 0) return;
    const interval = setInterval(() => setDealIndex((prev) => Math.min(52, prev + 1)), dealSpeed);
    return () => clearInterval(interval);
  }, [dealIndex, deck.length]);

  useEffect(() => {
    if (dealIndex === 52 && deck.length === 52) {
      onComplete?.(hands);
    }
  }, [dealIndex, deck.length, hands, onComplete]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Deal button */}
      <Button
        onClick={startDeal}
        disabled={isDealing}
        size="lg"
      >
        {isDealing ? 'Dealing...' : '🃏 Deal Cards'}
      </Button>

      {/* Deal progress */}
      {isDealing && (
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between text-xs text-text-tertiary mb-1">
            <span>Dealing...</span>
            <span>{dealIndex}/52</span>
          </div>
          <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(dealIndex / 52) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>
      )}

      {/* Deal animation area */}
      <div className="relative w-full max-w-3xl aspect-video bg-gradient-to-br from-emerald-900 to-green-900 rounded-xl border border-emerald-700/20 overflow-hidden">
        {/* Deck pile */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {dealIndex < 52 && deck.length > 0 && (
            <motion.div
              layout
              initial={{ scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.1 }}
            >
              <CardBack size="md" />
            </motion.div>
          )}
        </div>

        {/* Dealing animation for current card */}
        <AnimatePresence>
          {isDealing && deck[dealIndex] && (
            <motion.div
              key={`deal-${dealIndex}`}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <CardEngine
                card={{ ...deck[dealIndex], faceUp: true, zIndex: dealIndex }}
                size={size === 'lg' ? 'lg' : size === 'sm' ? 'xs' : 'sm'}
                interactive={false}
                animate
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sound placeholder */}
        <div className="absolute bottom-3 right-3">
          <button
            className="flex items-center gap-1.5 rounded-full bg-bg-primary/80 border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Toggle sound"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
            </svg>
            Sound
          </button>
        </div>
      </div>

      {/* Summary after deal */}
      {dealIndex === 52 && deck.length === 52 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 text-sm"
        >
          <span className="text-text-secondary">Hands dealt:</span>
          {positions.map((pos) => (
            <Badge key={pos} variant="default">
              {pos}: {hands[pos]?.length || 0} cards
            </Badge>
          ))}
        </motion.div>
      )}
    </div>
  );
}
