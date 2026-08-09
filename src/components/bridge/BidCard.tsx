"use client";

import { cn } from "@/lib/utils";
import { SuitSymbol, suitColor, type SuitLike } from "./SuitSymbol";

export type BidType = "bid" | "pass" | "double" | "redouble";

export interface ParsedBid {
  type: BidType;
  level?: number; // 1-7 for bids
  suit?: SuitLike; // ♠♥♦♣NT for bids
  raw: string;
}

export function parseBid(bid: string): ParsedBid {
  const b = bid.trim().toUpperCase();
  if (b === "P" || b === "PASS") return { type: "pass", raw: b };
  if (b === "X" || b === "DBL" || b === "DOUBLE") return { type: "double", raw: b };
  if (b === "XX" || b === "RDBL" || b === "REDOUBLE") return { type: "redouble", raw: b };

  const levelMatch = b.match(/^([1-7])(.+)$/);
  if (levelMatch) {
    const level = parseInt(levelMatch[1], 10);
    const suitStr = levelMatch[2];
    let suit: SuitLike = "♠";
    if (suitStr === "C" || suitStr === "CLUBS" || suitStr === "♣") suit = "♣";
    else if (suitStr === "D" || suitStr === "DIAMONDS" || suitStr === "♦") suit = "♦";
    else if (suitStr === "H" || suitStr === "HEARTS" || suitStr === "♥") suit = "♥";
    else if (suitStr === "S" || suitStr === "SPADES" || suitStr === "♠") suit = "♠";
    else if (suitStr === "NT" || suitStr === "NOTRUMP" || suitStr === "SA") suit = "NT";
    return { type: "bid", level, suit, raw: b };
  }

  return { type: "bid", raw: b };
}

export function BidCard({
  bid,
  size = "md",
  highlight = false,
  className,
}: {
  bid: string;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
  className?: string;
}) {
  const parsed = parseBid(bid);

  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[9px] gap-[1px]",
    md: "px-2 py-1 text-[10px] gap-[2px]",
    lg: "px-2.5 py-1.5 text-xs gap-[2px]",
  } as const;

  const symbolSizes = { sm: 8, md: 9, lg: 11 } as const;

  const baseClass = cn(
    "inline-flex items-center justify-center font-mono font-bold rounded border-1.5 bg-white/95 border-zinc-300/60 shadow-sm shadow-black/15 transition-all",
    sizeStyles[size],
    className
  );

  if (parsed.type === "pass") {
    return (
      <span
        className={cn(
          baseClass,
          "text-green-700 border-green-400/50 bg-green-50/80",
          highlight && "ring-2 ring-green-400 shadow-green-400/30"
        )}
      >
        P
      </span>
    );
  }

  if (parsed.type === "double") {
    return (
      <span
        className={cn(
          baseClass,
          "text-red-700 border-red-400/50 bg-red-50/80",
          highlight && "ring-2 ring-red-400 shadow-red-400/30"
        )}
      >
        X
      </span>
    );
  }

  if (parsed.type === "redouble") {
    return (
      <span
        className={cn(
          baseClass,
          "text-blue-700 border-blue-400/50 bg-blue-50/80",
          highlight && "ring-2 ring-blue-400 shadow-blue-400/30"
        )}
      >
        XX
      </span>
    );
  }

  // Regular bid: level + suit symbol in suit color
  const level = parsed.level ?? 1;
  const suit = parsed.suit ?? "♠";
  const color = suitColor(suit);

  return (
    <span
      className={cn(
        baseClass,
        "text-zinc-900 border-zinc-300/60",
        highlight && "ring-2 ring-primary shadow-primary/30"
      )}
    >
      <span className="font-black">{level}</span>
      {suit !== "NT" && <SuitSymbol suit={suit} size={symbolSizes[size]} />}
      {suit === "NT" && <span className="font-bold text-[0.85em]" style={{ color }}>NT</span>}
    </span>
  );
}