"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SuitLike } from "./SuitSymbol";
import { CardEngine, getCardSize, type BridgeCard, type CardSize } from "@/components/cardEngine/CardEngine";

export type BridgePosition = "north" | "east" | "south" | "west";

export interface BridgeTableHand {
  position: BridgePosition;
  cards: string[];
  label?: string;
  highlight?: string[];
}

interface BridgeTableProps {
  hands: BridgeTableHand[];
  dealer?: string;
  vulnerability?: string;
  contract?: string;
  size?: "sm" | "md" | "lg";
  turn?: BridgePosition;
  className?: string;
}

const SUIT_ORDER: Record<string, number> = { "♠": 0, "♥": 1, "♦": 2, "♣": 3 };
const RANK_VALUE: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, "10": 10, "9": 9, "8": 8, "7": 7,
  "6": 6, "5": 5, "4": 4, "3": 3, "2": 2,
};

const SUIT_MAP: Record<string, SuitLike> = {
  S: "♠", H: "♥", D: "♦", C: "♣",
};

function parseCard(card: string): { rank: string; suit: SuitLike } {
  const first = card[0];
  if (first === "♠" || first === "♥" || first === "♦" || first === "♣") {
    return { rank: card.slice(1), suit: first };
  }
  if (first === "S" || first === "H" || first === "D" || first === "C") {
    return { rank: card.slice(1), suit: SUIT_MAP[first] };
  }
  return { rank: card, suit: "♠" };
}

function toBridgeCard(card: string, highlight: boolean): BridgeCard {
  const { rank, suit } = parseCard(card);
  return {
    id: `${suit}${rank}`,
    suit: suit as BridgeCard["suit"],
    rank: rank as BridgeCard["rank"],
    faceUp: true,
    highlighted: highlight,
  };
}

/** Sort ♠♥♦♣ left-to-right, high-to-low within each suit (bridge notation). */
function sortCards(cards: string[]) {
  return [...cards].sort((a, b) => {
    const pa = parseCard(a);
    const pb = parseCard(b);
    const suitDiff = SUIT_ORDER[pa.suit] - SUIT_ORDER[pb.suit];
    if (suitDiff !== 0) return suitDiff;
    return (RANK_VALUE[pb.rank] ?? 0) - (RANK_VALUE[pa.rank] ?? 0);
  });
}

type TableSize = "sm" | "md" | "lg";

const TABLE_WIDTH: Record<TableSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
};

const CARD_SIZE: Record<TableSize, CardSize> = {
  sm: "xs",
  md: "sm",
  lg: "sm",
};

/** Visible sliver of each overlapping E/W card (pixels). */
const VERTICAL_SLIVER: Record<TableSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

function SideHand({
  hand,
  size,
  vertical,
  isSouth,
  isTurn,
}: {
  hand?: BridgeTableHand;
  size: TableSize;
  vertical: boolean;
  isSouth: boolean;
  isTurn?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [overlap, setOverlap] = useState(0);
  const cards = hand ? sortCards(hand.cards) : [];
  const n = cards.length;
  const cardSize = CARD_SIZE[size];
  const { w: cardW, h: cardH } = getCardSize(cardSize);

  // Horizontal hands (N/S) overlap adaptively so all 13 cards fit the row.
  useEffect(() => {
    const el = ref.current;
    if (!el || vertical) return;
    const measure = () => {
      const width = el.clientWidth;
      if (n <= 1) { setOverlap(0); return; }
      const fullWidth = n * cardW;
      if (fullWidth <= width) { setOverlap(0); return; }
      const minVisible = Math.max(18, Math.round(cardW * 0.3));
      const needed = Math.ceil((fullWidth - width) / (n - 1));
      setOverlap(Math.min(needed, cardW - minVisible));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [vertical, n, cardW]);

  if (!hand || n === 0) return null;

  const verticalSliver = VERTICAL_SLIVER[size];
  const verticalOverlap = Math.max(0, cardH - verticalSliver);

  return (
    <div
      ref={ref}
      className={cn(
        "flex select-none items-center overflow-x-auto transition-all",
        vertical ? "flex-col" : "flex-row",
        isSouth && "rounded-xl bg-primary/5 px-1 py-1 ring-1 ring-primary/25",
        isTurn &&
          "rounded-xl bg-primary/10 ring-2 ring-primary/70 shadow-lg shadow-primary/25"
      )}
    >
      {cards.map((card, i) => {
        const isHighlighted = hand.highlight?.includes(card) ?? false;
        return (
          <motion.div
            key={`${card}-${i}`}
            initial={{ opacity: 0, y: 6, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.02, type: "spring", damping: 22, stiffness: 280 }}
            className="relative shrink-0"
            style={
              vertical
                ? { marginTop: i === 0 ? 0 : -verticalOverlap, zIndex: i }
                : { marginLeft: i === 0 ? 0 : -overlap, zIndex: i }
            }
          >
            <CardEngine
              card={toBridgeCard(card, isHighlighted)}
              size={cardSize}
              animate={false}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

function Compass({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "absolute select-none font-bold tracking-wider text-white/50",
        className
      )}
    >
      {label}
    </span>
  );
}

export function BridgeTable({
  hands,
  dealer,
  vulnerability,
  contract,
  size = "md",
  turn,
  className,
}: BridgeTableProps) {
  const byPosition = Object.fromEntries(hands.map((h) => [h.position, h]));
  const north = byPosition.north;
  const south = byPosition.south;
  const east = byPosition.east;
  const west = byPosition.west;

  return (
    <div className={cn("mx-auto w-full", TABLE_WIDTH[size], className)}>
      {/* North */}
      <div className="mb-1.5 flex justify-center">
        <SideHand hand={north} size={size} vertical={false} isSouth={false} isTurn={turn === "north"} />
      </div>

      {/* Middle row: West | Table | East */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex min-w-0 justify-end">
          <SideHand hand={west} size={size} vertical isSouth={false} isTurn={turn === "west"} />
        </div>

        {/* Table square */}
        <div
          className={cn(
            "relative aspect-square min-w-0 flex-1 rounded-2xl bg-gradient-to-br from-[#12402F] via-cloth to-[#0A2419] shadow-xl shadow-black/40 ring-1 ring-primary/25"
          )}
        >
          {/* Compass points inside the table */}
          <Compass label="N" className="left-1/2 top-2 -translate-x-1/2 text-sm" />
          <Compass label="S" className="bottom-2 left-1/2 -translate-x-1/2 text-sm" />
          <Compass label="W" className="left-2.5 top-1/2 -translate-y-1/2 text-sm" />
          <Compass label="E" className="right-2.5 top-1/2 -translate-y-1/2 text-sm" />

          {/* Center info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
            {contract && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black tracking-wide text-[#0A2419]">
                {contract}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              Dealer {dealer ? dealer.toUpperCase() : "—"}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-white/45">
              Vul {vulnerability ?? "—"}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 justify-start">
          <SideHand hand={east} size={size} vertical isSouth={false} isTurn={turn === "east"} />
        </div>
      </div>

      {/* South */}
      <div className="mt-1.5 flex justify-center">
        <SideHand hand={south} size={size} vertical={false} isSouth isTurn={turn === "south"} />
      </div>
    </div>
  );
}
