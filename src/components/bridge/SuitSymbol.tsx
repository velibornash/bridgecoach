"use client";

import { cn } from "@/lib/utils";
import { Suit } from "@/bridge/types";
import { suitPresentation } from "@/bridge/suits";

/** Accepts either letter-codes ("S","H","D","C") or symbols ("♠","♥","♦","♣"). */
export type SuitLike = Suit | "♠" | "♥" | "♦" | "♣";

const CODE_TO_SYMBOL: Record<string, SuitLike> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

const SYMBOL_TO_SUIT: Record<SuitLike, Suit> = {
  "♠": Suit.SPADES,
  "♥": Suit.HEARTS,
  "♦": Suit.DIAMONDS,
  "♣": Suit.CLUBS,
  S: Suit.SPADES,
  H: Suit.HEARTS,
  D: Suit.DIAMONDS,
  C: Suit.CLUBS,
};

interface SuitSymbolProps {
  suit: SuitLike;
  size?: number;
  className?: string;
  /** When true, keeps the theme text color (for black suits on dark surfaces). */
  themed?: boolean;
}

/** Resolves a symbol/code to the canonical suit code. */
export function toSuitCode(suit: SuitLike): Suit {
  const code = CODE_TO_SYMBOL[suit] ?? suit;
  return SYMBOL_TO_SUIT[code];
}

/** Hex color of a suit (red suits red, black suits rich ink). */
export function suitColor(suit: SuitLike): string {
  return suitPresentation[toSuitCode(suit)].hex;
}

/** Soft glow shadow for a suit. */
export function suitGlow(suit: SuitLike): string {
  return suitPresentation[toSuitCode(suit)].glow;
}

/**
 * Renders a suit symbol in its proper color — red suits vivid red, black suits
 * a rich ink with a soft glow so they never look washed-out gray.
 */
export function SuitSymbol({
  suit,
  size = 16,
  className,
  themed = false,
}: SuitSymbolProps) {
  const code = CODE_TO_SYMBOL[suit] ?? suit;
  const presentation = suitPresentation[SYMBOL_TO_SUIT[code]];
  const symbol = presentation.symbol;

  if (themed) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex select-none font-serif leading-none",
          presentation.textClass,
          className,
        )}
        style={{ fontSize: size }}
      >
        {symbol}
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex select-none font-serif leading-none",
        className,
      )}
      style={{
        fontSize: size,
        color: presentation.hex,
        textShadow: `0 1px 10px ${presentation.glow}`,
      }}
    >
      {symbol}
    </span>
  );
}
