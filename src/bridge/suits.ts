/**
 * Bridge Coach — Centralized Suit Presentation.
 *
 * Every suit symbol in the application must derive its color from this single
 * source of truth. Do NOT hardcode suit colors inside random components.
 *
 * Conventional bridge colors:
 *   HEARTS ♥  = RED
 *   DIAMONDS ♦ = RED
 *   CLUBS ♣   = BLACK
 *   SPADES ♠  = BLACK
 */

import { Suit } from "./types";

export interface SuitPresentation {
  /** Unicode symbol, e.g. "♠". */
  symbol: string;
  /** Human name, e.g. "Spades". */
  name: string;
  /** Conventional color group. */
  color: "red" | "black";
  /**
   * Tailwind class for rendering the symbol as text on themed surfaces
   * (red suits use a red tint; black suits use the theme text color so they
   * remain readable on both dark and light surfaces).
   */
  textClass: string;
  /** Raw hex for SVG / white card surfaces. */
  hex: string;
  /** Soft glow used behind the symbol so black suits never read as washed-out gray. */
  glow: string;
  /** Natural suit sort order (lowest first). */
  sortOrder: number;
}

export const suitPresentation: Record<Suit, SuitPresentation> = {
  [Suit.SPADES]: {
    symbol: "♠",
    name: "Spades",
    color: "black",
    textClass: "text-text-primary",
    hex: "#14161E",
    glow: "rgba(20, 22, 30, 0.4)",
    sortOrder: 4,
  },
  [Suit.HEARTS]: {
    symbol: "♥",
    name: "Hearts",
    color: "red",
    textClass: "text-red-500",
    hex: "#E0244A",
    glow: "rgba(224, 36, 74, 0.4)",
    sortOrder: 3,
  },
  [Suit.DIAMONDS]: {
    symbol: "♦",
    name: "Diamonds",
    color: "red",
    textClass: "text-red-500",
    hex: "#E0244A",
    glow: "rgba(224, 36, 74, 0.4)",
    sortOrder: 2,
  },
  [Suit.CLUBS]: {
    symbol: "♣",
    name: "Clubs",
    color: "black",
    textClass: "text-text-primary",
    hex: "#14161E",
    glow: "rgba(20, 22, 30, 0.4)",
    sortOrder: 1,
  },
};

export const SUITS: Suit[] = [Suit.CLUBS, Suit.DIAMONDS, Suit.HEARTS, Suit.SPADES];

/** Neutral ink used for the no-trump strain (NT has no suit color). */
export const NT_COLOR = "#14161E";

/** Tailwind class used to render the "NT" strain label on themed surfaces. */
export const NT_TEXT_CLASS = "text-blue-400";

/** Maps every suit symbol to its canonical code, e.g. "♠" → Suit.SPADES. */
export const SUIT_SYMBOL_TO_CODE: Record<string, Suit> = {
  "♠": Suit.SPADES,
  "♥": Suit.HEARTS,
  "♦": Suit.DIAMONDS,
  "♣": Suit.CLUBS,
};

/** Returns the presentation for a suit code. */
export function getSuitPresentation(suit: Suit): SuitPresentation {
  return suitPresentation[suit];
}

/** True when the suit is a red suit (hearts or diamonds). */
export function isRedSuit(suit: Suit): boolean {
  return suitPresentation[suit].color === "red";
}

/** True when the suit is a black suit (spades or clubs). */
export function isBlackSuit(suit: Suit): boolean {
  return suitPresentation[suit].color === "black";
}

/** Themed Tailwind text class for a suit code (red suits red, black suits theme ink). */
export function suitTextClass(suit: Suit): string {
  return suitPresentation[suit].textClass;
}

/** Interactive tile classes for a suit code (red tint for red suits, neutral for black). */
export function suitTileClass(suit: Suit): string {
  return isRedSuit(suit)
    ? "bg-red-500/10 hover:bg-red-500/20"
    : "bg-zinc-500/10 hover:bg-zinc-500/20";
}

/** Hex color for a suit given as a symbol ("♠"/"♥"/"♦"/"♣"). */
export function suitHexForSymbol(symbol: string): string {
  const code = SUIT_SYMBOL_TO_CODE[symbol];
  return code ? suitPresentation[code].hex : NT_COLOR;
}

/** Tile classes for a suit given as a symbol; neutral fallback when unknown. */
export function suitTileClassForSymbol(symbol: string): string {
  const code = SUIT_SYMBOL_TO_CODE[symbol];
  return code ? suitTileClass(code) : "bg-bg-secondary";
}
