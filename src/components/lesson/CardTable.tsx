"use client";

import { cn } from "@/lib/utils";
import type { CardHand } from "@/types";
import { SuitSymbol, suitColor, suitGlow, type SuitLike } from "@/components/bridge/SuitSymbol";

interface CardTableProps {
  hands: CardHand[];
  className?: string;
}

const positionStyles: Record<string, string> = {
  north: "col-start-2 row-start-1",
  east: "col-start-3 row-start-2",
  south: "col-start-2 row-start-3",
  west: "col-start-1 row-start-2",
};

const positionLabels: Record<string, string> = {
  north: "N",
  east: "E",
  south: "S",
  west: "W",
};

function suitSymbol(suit: string): { sym: SuitLike; rank: string } {
  const sym = suit.includes("♠") ? "♠" : suit.includes("♥") ? "♥" : suit.includes("♦") ? "♦" : suit.includes("♣") ? "♣" : null;
  if (sym) return { sym: sym as SuitLike, rank: suit.replace(sym, "") };
  const code = suit[0];
  if (code === "S" || code === "H" || code === "D" || code === "C") {
    return {
      sym: code === "S" ? "♠" : code === "H" ? "♥" : code === "D" ? "♦" : "♣",
      rank: suit.slice(1),
    };
  }
  return { sym: "♠", rank: suit };
}

export function CardTable({ hands, className }: CardTableProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2 max-w-sm mx-auto", className)}>
      <div className="col-start-2 row-start-1 text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">N</span>
      </div>
      <div className="col-start-1 row-start-2 flex items-center justify-center">
        <span className="text-[10px] font-bold text-text-tertiary">W</span>
      </div>
      <div className="col-start-3 row-start-2 flex items-center justify-center">
        <span className="text-[10px] font-bold text-text-tertiary">E</span>
      </div>
      <div className="col-start-2 row-start-3 text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">S</span>
      </div>

      {hands.map((hand) => {
        const sorted = [...hand.cards].sort((a, b) => {
          const order = "♠♥♦♣";
          const ai = order.indexOf(a.slice(-1));
          const bi = order.indexOf(b.slice(-1));
          return ai - bi;
        });

        return (
          <div
            key={hand.position}
            className={cn(
              "rounded-xl p-2 transition-colors",
              positionStyles[hand.position],
              hand.position === "south" ? "bg-primary/10 ring-1 ring-primary/30" : "bg-bg-secondary/50"
            )}
          >
            <div className="flex flex-wrap gap-[2px] justify-center">
              {sorted.map((card, i) => {
                const suit = suitSymbol(card);
                return (
                  <span
                    key={i}
                    className={cn(
                      "text-[11px] font-mono font-bold leading-tight whitespace-nowrap",
                      hand.highlight?.includes(card) && "ring-1 ring-warning rounded-sm"
                    )}
                    style={{ color: suitColor(suit.sym), textShadow: `0 0 6px ${suitGlow(suit.sym)}` }}
                  >
                    {suit.rank}<SuitSymbol suit={suit.sym} size={11} />
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
