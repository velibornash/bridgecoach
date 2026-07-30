"use client";

import { motion } from "framer-motion";
import { CardEngine, CardBack, createDeck, shuffleDeck } from "@/components/cardEngine/CardEngine";
import type { BridgeCard, CardSize } from "@/components/cardEngine/types";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface TableEngineProps {
  hands: { north: BridgeCard[]; east: BridgeCard[]; south: BridgeCard[]; west: BridgeCard[] };
  centerCards?: BridgeCard[];
  currentPlayer?: 'north' | 'east' | 'south' | 'west';
  selectedCard?: BridgeCard | null;
  onCardClick?: (card: BridgeCard) => void;
  size?: CardSize;
  animate?: boolean;
}

const positions = {
  north: { x: '50%', y: '8%', rotate: '0deg', align: 'center' as const, label: 'North (Partner)' },
  south: { x: '50%', y: '72%', rotate: '180deg', align: 'center' as const, label: 'South (You)' },
  east: { x: '82%', y: '40%', rotate: '-90deg', align: 'start' as const, label: 'East' },
  west: { x: '18%', y: '40%', rotate: '90deg', align: 'end' as const, label: 'West' },
};

export function TableEngine({ hands, centerCards = [], currentPlayer, selectedCard, onCardClick, size = 'md', animate = true }: TableEngineProps) {
  return (
    <div className="relative w-full aspect-video max-w-4xl mx-auto bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 rounded-2xl border border-emerald-700/30 shadow-2xl overflow-hidden">
      {/* Table felt */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }} />
      </div>

      {/* Center trick area */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
        {centerCards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.1, type: "spring", damping: 15 }}
            style={{ zIndex: 10 + i }}
          >
            <CardEngine card={card} size={size} interactive={false} />
          </motion.div>
        ))}
      </div>

      {/* Player positions */}
      {(Object.entries(positions) as [string, typeof positions.north][]).map(([position, pos]) => {
        const playerCards = hands[position as keyof typeof hands] || [];
        const isCurrentPlayer = currentPlayer === position;

        return (
          <motion.div
            key={position}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: position === 'south' || position === 'north' ? '50%' : pos.x,
              top: position === 'south' || position === 'north' ? pos.y : pos.y,
              transform: position === 'south' || position === 'north'
                ? `translateX(-50%)`
                : `translate(-50%, -50%)`,
            }}
          >
            {/* Player label */}
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
              isCurrentPlayer
                ? "bg-primary text-white shadow-md shadow-glow"
                : "bg-bg-card/80 text-text-secondary border border-border"
            )}>
              {pos.label}
              {isCurrentPlayer && <span className="ml-1">♣</span>}
            </div>

            {/* Card stacks */}
            <div className="flex" style={{
              flexDirection: position === 'east' || position === 'west' ? 'column' : 'row',
              gap: position === 'south' || position === 'north' ? '2px' : '4px',
            }}>
              {playerCards.slice(-6).map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ scale: 0.3, y: position === 'south' ? 20 : position === 'north' ? -20 : 0, x: position === 'west' ? -20 : position === 'east' ? 20 : 0 }}
                  animate={{ scale: 1, x: 0, y: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", damping: 20 }}
                  className="relative"
                  style={{
                    marginLeft: position === 'north' || position === 'south' ? `${-i * 2}px` : undefined,
                    marginTop: position === 'west' || position === 'east' ? `${-i * 2}px` : undefined,
                    zIndex: i + 1,
                  }}
                >
                  <CardEngine
                    card={card}
                    size={size === 'lg' ? 'sm' : size === 'xl' ? 'md' : 'sm'}
                    interactive={position === 'south' && onCardClick !== undefined && card.playable}
                    hoverable={position === 'south'}
                    onClick={onCardClick}
                    onHover={undefined}
                    animate={animate}
                  />
                </motion.div>
              ))}
              {playerCards.length > 6 && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-bg-primary/80 border border-border text-[9px] text-text-tertiary font-bold">
                  +{playerCards.length - 6}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Table center diamond */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 opacity-10">
        <div className="w-full h-full bg-white transform rotate-45 rounded-sm" />
      </div>
    </div>
  );
}
