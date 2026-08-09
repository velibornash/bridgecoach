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
