"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardEngine, SUITS, createDeck, shuffleDeck, type BridgeCard, type Suit, type CardSize } from "@/components/cardEngine/CardEngine";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type SortBy = 'suit' | 'rank';
type SuitFilter = Suit | 'all';

interface HandViewerProps {
  hand: BridgeCard[];
  size?: CardSize;
  interactive?: boolean;
  onCardClick?: (card: BridgeCard) => void;
  highlighted?: string[];
  selectable?: boolean;
  selected?: string[];
  maxVisible?: number;
}

const suitOrder: Record<Suit, number> = { '♣': 1, '♦': 2, '♥': 3, '♠': 4 };
const rankOrder: Record<string, number> = {
  'A': 1, 'K': 2, 'Q': 3, 'J': 4, '10': 5, '9': 6, '8': 7, '7': 8, '6': 9, '5': 10, '4': 11, '3': 12, '2': 13,
};

export function HandViewer({
  hand,
  size = 'md',
  interactive = false,
  onCardClick,
  highlighted = [],
  selectable = false,
  selected = [],
  maxVisible,
}: HandViewerProps) {
  const [sortBy, setSortBy] = useState<SortBy>('suit');
  const [suitFilter, setSuitFilter] = useState<SuitFilter>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const filteredHand = useMemo(() => {
    let cards = [...hand];
    if (suitFilter !== 'all') {
      cards = cards.filter((c) => c.suit === suitFilter);
    }
    cards.sort((a, b) => {
      if (sortBy === 'suit') {
        const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
        return suitDiff !== 0 ? suitDiff : rankOrder[a.rank] - rankOrder[b.rank];
      }
      return rankOrder[a.rank] - rankOrder[b.rank];
    });
    return maxVisible ? cards.slice(0, maxVisible) : cards;
  }, [hand, sortBy, suitFilter, maxVisible]);

  const suitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SUITS.forEach((s) => { counts[s] = 0; });
    counts['all'] = hand.length;
    hand.forEach((c) => { counts[c.suit]++; });
    return counts;
  }, [hand]);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setSortBy('suit')}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all ${
              sortBy === 'suit' ? 'bg-primary text-white' : 'bg-bg-secondary text-text-tertiary hover:text-text-secondary'
            }`}
          >
            By Suit
          </button>
          <button
            onClick={() => setSortBy('rank')}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all ${
              sortBy === 'rank' ? 'bg-primary text-white' : 'bg-bg-secondary text-text-tertiary hover:text-text-secondary'
            }`}
          >
            By Rank
          </button>
        </div>

        <div className="flex gap-1">
          {(['all', ...SUITS] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSuitFilter(s)}
              className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
                suitFilter === s
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-bg-secondary text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {s === 'all' ? `All (${suitCounts.all})` : `${s} (${suitCounts[s] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Card count */}
      <p className="text-[10px] text-text-tertiary mb-3">
        {filteredHand.length} of {hand.length} cards shown
      </p>

      {/* Cards */}
      <div className="flex flex-wrap gap-2 justify-center">
        <AnimatePresence mode="popLayout">
          {filteredHand.map((card, index) => {
            const isHighlighted = highlighted.includes(card.id);
            const isSelected = selected.includes(card.id);
            const isHovered = hoveredCard === card.id;

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                transition={{ delay: index * 0.03, type: "spring", damping: 20 }}
                className={cn(
                  'cursor-pointer transition-all',
                  interactive && onCardClick && 'hover:z-10',
                  isHighlighted && 'ring-2 ring-amber-400 ring-offset-2 ring-offset-bg-primary',
                  isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-bg-primary'
                )}
                onHoverStart={() => interactive && setHoveredCard(card.id)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <CardEngine
                  card={{
                    ...card,
                    highlighted: isHighlighted,
                    selected: isSelected,
                    playable: interactive && onCardClick !== undefined,
                    rotation: isHovered && interactive ? -8 : 0,
                  }}
                  size={size}
                  interactive={interactive && !!onCardClick}
                  hoverable={interactive}
                  onClick={onCardClick}
                  animate
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Suit distribution bar */}
      <div className="mt-4 flex items-center gap-2">
        {SUITS.map((s) => (
          <div key={s} className="flex-1">
            <div className="flex items-center justify-between text-[9px] text-text-tertiary mb-0.5">
              <span>{s}</span>
              <span>{suitCounts[s] || 0}</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${hand.length > 0 ? ((suitCounts[s] || 0) / 13) * 100 : 0}%`,
                  backgroundColor: s === '♠' || s === '♣' ? '#111827' : '#DC2626',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
