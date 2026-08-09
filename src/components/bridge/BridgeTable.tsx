"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SuitSymbol, suitColor, type SuitLike } from "./SuitSymbol";

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
  className?: string;
}

const SUIT_ORDER: Record<string, number> = { "♠": 0, "♥": 1, "♦": 2, "♣": 3 };
const RANK_VALUE: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, "10": 10, "9": 9, "8": 8, "7": 7,
  "6": 6, "5": 5, "4": 4, "3": 3, "2": 2,
};

function parseCard(card: string): { rank: string; suit: SuitLike } {
  const first = card[0];
  if (first === "♠" || first === "♥" || first === "♦" || first === "♣") {
    return { rank: card.slice(1), suit: first };
  }
  if (first === "S" || first === "H" || first === "D" || first === "C") {
    return {
      rank: card.slice(1),
      suit: first === "S" ? "♠" : first === "H" ? "♥" : first === "D" ? "♦" : "♣",
    };
  }
  return { rank: card, suit: "♠" };
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

const SIZE_CHIP = {
  sm: { text: "text-[9px]", symbol: 8, pad: "gap-[1px] px-[2px] py-[2px] rounded-[4px]", gap: "gap-x-[3px]" },
  md: { text: "text-[10px]", symbol: 9, pad: "gap-[2px] px-[3px] py-[2px] rounded-[5px]", gap: "gap-x-[4px]" },
  lg: { text: "text-xs", symbol: 11, pad: "gap-[2px] px-1 py-[3px] rounded-md", gap: "gap-x-[5px]" },
} as const;

function CardChip({
  card,
  index,
  highlight,
  size,
}: {
  card: string;
  index: number;
  highlight?: boolean;
  size: keyof typeof SIZE_CHIP;
}) {
  const { rank, suit } = parseCard(card);
  const chip = SIZE_CHIP[size];
  return (
    <motion.span
      initial={{ opacity: 0, y: 6, scale: 0.6 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, type: "spring", damping: 20, stiffness: 260 }}
      className={cn(
        "inline-flex select-none items-center whitespace-nowrap border border-zinc-300/60 bg-white/95 font-mono font-bold shadow-md shadow-black/25",
        chip.text,
        chip.pad,
        highlight && "ring-2 ring-warning shadow-warning/40"
      )}
    >
      <span className="leading-none" style={{ color: suitColor(suit) }}>{rank}</span>
      <SuitSymbol suit={suit} size={chip.symbol} />
    </motion.span>
  );
}

function SideHand({
  hand,
  size,
  vertical,
  isSouth,
}: {
  hand?: BridgeTableHand;
  size: keyof typeof SIZE_CHIP;
  vertical: boolean;
  isSouth: boolean;
}) {
  const chip = SIZE_CHIP[size];
  if (!hand || hand.cards.length === 0) return null;
  const cards = sortCards(hand.cards);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-y-0.5",
        vertical ? "flex-col" : "flex-row",
        chip.gap,
        isSouth && "rounded-xl bg-primary/5 px-2 py-1 ring-1 ring-primary/25"
      )}
    >
      {cards.map((card, i) => (
        <CardChip
          key={`${card}-${i}`}
          card={card}
          index={i}
          highlight={hand.highlight?.includes(card)}
          size={size}
        />
      ))}
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
  className,
}: BridgeTableProps) {
  const byPosition = Object.fromEntries(hands.map((h) => [h.position, h]));
  const north = byPosition.north;
  const south = byPosition.south;
  const east = byPosition.east;
  const west = byPosition.west;

  return (
    <div className={cn("mx-auto w-full max-w-md sm:max-w-lg", className)}>
      {/* North */}
      <div className="mb-1.5 flex justify-center">
        <SideHand hand={north} size={size} vertical={false} isSouth={false} />
      </div>

      {/* Middle row: West | Table | East */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex min-w-0 justify-end">
          <SideHand hand={west} size={size} vertical isSouth={false} />
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
          <SideHand hand={east} size={size} vertical isSouth={false} />
        </div>
      </div>

      {/* South */}
      <div className="mt-1.5 flex justify-center">
        <SideHand hand={south} size={size} vertical={false} isSouth />
      </div>
    </div>
  );
}
