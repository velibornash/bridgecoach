"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardEngine, CardBack, createDeck, shuffleDeck } from "@/components/cardEngine/CardEngine";
import type { BridgeCard, Suit } from "@/components/cardEngine/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface DealAnimationProps {
  onComplete?: (hands: Record<string, BridgeCard[]>) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function DealAnimation({ onComplete, size = 'md' }: DealAnimationProps) {
  const [isDealing, setIsDealing] = useState(false);
  const [hands, setHands] = useState<Record<string, BridgeCard[]>>({
    north: [], east: [], south: [], west: [],
  });
  const [dealIndex, setDealIndex] = useState(0);
  const [deck, setDeck] = useState<BridgeCard[]>([]);

  const startDeal = () => {
    const newDeck = shuffleDeck(createDeck());
    setDeck(newDeck);
    setHands({ north: [], east: [], south: [], west: [] });
    setDealIndex(0);
    setIsDealing(true);
  };

  const dealNextCard = () => {
    if (dealIndex >= 52 || !isDealing) {
      setIsDealing(false);
      onComplete?.(hands);
      return;
    }

    const positions: (keyof typeof hands)[] = ['north', 'east', 'south', 'west'];
    const target = positions[dealIndex % 4];
    const card = deck[dealIndex];

    setHands(prev => ({
      ...prev,
      [target]: [...prev[target], { ...card, faceUp: true }],
    }));
    setDealIndex(prev => prev + 1);
  };

  const dealSpeed = 120;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Deal button */}
      <Button
        onClick={startDeal}
        disabled={isDealing && dealIndex < 52}
        size="lg"
      >
        {isDealing && dealIndex < 52 ? 'Dealing...' : '🃏 Deal Cards'}
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
          {dealIndex < 52 && (
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
          {isDealing && dealIndex < 52 && (
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
      {!isDealing && dealIndex === 52 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 text-sm"
        >
          <span className="text-text-secondary">Hands dealt:</span>
          {(['north', 'east', 'south', 'west'] as const).map((pos) => (
            <Badge key={pos} variant="default">
              {pos}: {hands[pos]?.length || 0} cards
            </Badge>
          ))}
        </motion.div>
      )}
    </div>
  );
}
