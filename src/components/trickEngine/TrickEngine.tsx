"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CardEngine } from "@/components/cardEngine/CardEngine";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { BridgeCard, CardSize, Suit } from "@/components/cardEngine/types";

interface TrickEngineProps {
  playedCards: Array<{ player: string; card: BridgeCard; color: Suit }>;
  trumpSuit?: Suit;
  currentTrick?: number;
  size?: CardSize;
  animate?: boolean;
  highlightWinner?: boolean;
  winner?: string | null;
}

export function TrickEngine({ playedCards = [], trumpSuit = '♠', currentTrick = 1, size = 'md', animate = true, highlightWinner = false, winner = null }: TrickEngineProps) {
  const playerLabels: Record<string, string> = {
    north: 'North', south: 'South', east: 'East', west: 'West',
  };

  const getWinner = (cards: Array<{ player: string; card: BridgeCard }>) => {
    if (cards.length === 0) return null;
    if (cards.length === 1) return cards[0].player;

    const leadSuit = cards[0].card.suit;
    let winningCard = cards[0];
    let winningIndex = 0;

    cards.forEach((entry, index) => {
      if (index === 0) return;
      const isTrump = entry.card.suit === trumpSuit;
      const isLeadSuit = entry.card.suit === leadSuit;
      const isWinTrump = winningCard.card.suit === trumpSuit;

      if (isTrump && !isWinTrump) {
        winningCard = entry;
        winningIndex = index;
      } else if (isTrump && isWinTrump) {
        const trumpOrder = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
        const myRank = trumpOrder.indexOf(entry.card.rank);
        const winRank = trumpOrder.indexOf(winningCard.card.rank);
        if (myRank < winRank) {
          winningCard = entry;
          winningIndex = index;
        }
      } else if (isLeadSuit && !isTrump && !isWinTrump) {
        const suitOrder = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
        const myRank = suitOrder.indexOf(entry.card.rank);
        const winRank = suitOrder.indexOf(winningCard.card.rank);
        if (myRank < winRank) {
          winningCard = entry;
          winningIndex = index;
        }
      }
    });

    return winningCard.player;
  };

  const trickWinner = winner ?? getWinner(playedCards);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Trick header */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Trick {currentTrick}</span>
        {trumpSuit && (
          <Badge variant="default" className="text-[10px]">Trump: {trumpSuit}</Badge>
        )}
      </div>

       {/* Trick area - 4 card play area */}
       <div className="flex items-center justify-center gap-4 py-8 px-4">
         {(['north', 'south', 'east', 'west'] as const).map((position) => {
          const played = playedCards.find((p) => p.player === position);
          const isWinner = highlightWinner && trickWinner === position;

          return (
            <motion.div
              key={position}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="relative"
            >
              {played ? (
                <motion.div
                  layout
                  initial={{ scale: 0, rotateY: 180, opacity: 0 }}
                  animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className={cn(
                    "rounded-xl border-2 p-1 transition-all",
                    isWinner
                      ? "border-amber-400 shadow-lg shadow-amber-400/30 scale-110"
                      : "border-border bg-bg-card"
                  )}
                >
                  <CardEngine
                    card={{ ...played.card, faceUp: true, highlighted: isWinner, rotation: 0, scale: 1 }}
                    size={size}
                    interactive={false}
                    animate={animate}
                  />
                  {/* Play label */}
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-text-tertiary whitespace-nowrap">
                    {played.player === 'south' ? 'You' : playerLabels[played.player]}
                  </div>
                </motion.div>
              ) : (
                <div
                  className={cn(
                    "rounded-xl border-2 border-dashed flex items-center justify-center",
                    isWinner ? "border-amber-400 shadow-lg shadow-amber-400/20" : "border-border bg-bg-secondary/50"
                  )}
                  style={{
                    width: size === 'lg' ? 104 : size === 'sm' ? 64 : 80,
                    height: size === 'lg' ? 148 : size === 'sm' ? 90 : 112,
                  }}
                >
                  <span className="text-text-tertiary text-xs">{playerLabels[position]}</span>
                </div>
              )}

              {/* Winner crown */}
              {isWinner && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg"
                >
                  👑
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Trick result */}
      {playedCards.length === 4 && highlightWinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4"
        >
          <Badge variant={trickWinner === 'south' ? 'success' : 'default'}>
            {trickWinner === 'south' ? '⭐ You won the trick!' : `${playerLabels[trickWinner as string]} wins`}
          </Badge>
        </motion.div>
      )}
    </div>
  );
}
