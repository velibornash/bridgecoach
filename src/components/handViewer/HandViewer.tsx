"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardEngine, getCardSize, SUITS, createDeck, shuffleDeck, type BridgeCard, type Suit, type CardSize } from "@/components/cardEngine/CardEngine";
import { Badge } from "@/components/ui/Badge";
import { SuitSymbol, suitColor, suitGlow, type SuitLike } from "@/components/bridge/SuitSymbol";
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

  // Overlap the cards so a full hand fits on one row — the first card shows
  // fully and each following card reveals its rank+suit corner (like holding
  // a fan of cards). If even the minimum sliver is too wide, the row scrolls.
  const { w: cardW, h: cardH } = getCardSize(size);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [overlap, setOverlap] = useState(0);
  const gap = 8;
  const minVisible = Math.max(20, Math.round(cardW * 0.32));

  useEffect(() => {
    const el = containerRef;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      const n = filteredHand.length;
      if (n <= 1) { setOverlap(0); return; }
      const fullWidth = n * cardW + (n - 1) * gap;
      if (fullWidth <= width) { setOverlap(0); return; }
      const needed = Math.ceil((fullWidth - width) / (n - 1));
      setOverlap(Math.min(needed, Math.max(0, cardW - minVisible)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, filteredHand.length, cardW, gap, minVisible]);

  const rowWidth = overlap > 0
    ? filteredHand.length * cardW - (filteredHand.length - 1) * overlap
    : undefined;

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
              {s === 'all' ? `All (${suitCounts.all})` : (
                <span className="inline-flex items-center gap-0.5">
                  <SuitSymbol suit={s as SuitLike} size={12} />
                  {suitCounts[s] || 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Card count */}
      <p className="text-[10px] text-text-tertiary mb-3">
        {filteredHand.length} of {hand.length} cards shown
      </p>

      {/* Cards */}
      <div ref={setContainerRef} className="w-full overflow-x-auto py-2">
        <div
          className="flex items-center"
          style={{ minWidth: rowWidth }}
        >
          <AnimatePresence mode="popLayout">
            {filteredHand.map((card, index) => {
              const isHighlighted = highlighted.includes(card.id);
              const isSelected = selected.includes(card.id);
              const isHovered = hoveredCard === card.id;
              const isLast = index === filteredHand.length - 1;

              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -20 }}
                  transition={{ delay: index * 0.03, type: "spring", damping: 20 }}
                  whileHover={interactive ? { y: -16 } : undefined}
                  onHoverStart={() => interactive && setHoveredCard(card.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className={cn(
                    'relative shrink-0 cursor-pointer',
                    !isLast && overlap === 0 && 'mr-2',
                    isHighlighted && 'ring-2 ring-amber-400 ring-offset-2 ring-offset-bg-primary',
                    isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-bg-primary'
                  )}
                  style={{
                    marginLeft: index === 0 ? 0 : overlap > 0 ? -overlap : 0,
                    zIndex: isHovered ? 50 : index,
                    height: cardH,
                  }}
                >
                  <CardEngine
                    card={{
                      ...card,
                      highlighted: isHighlighted,
                      selected: isSelected,
                      playable: interactive && onCardClick !== undefined,
                      rotation: isHovered && interactive ? -6 : 0,
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
      </div>

      {/* Suit distribution bar */}
      <div className="mt-4 flex items-center gap-2">
        {SUITS.map((s) => (
          <div key={s} className="flex-1">
            <div className="flex items-center justify-between text-[9px] text-text-tertiary mb-0.5">
              <SuitSymbol suit={s as SuitLike} size={11} />
              <span>{suitCounts[s] || 0}</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${hand.length > 0 ? ((suitCounts[s] || 0) / 13) * 100 : 0}%`,
                  backgroundColor: suitColor(s as SuitLike),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
