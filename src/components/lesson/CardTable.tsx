"use client";

import { cn } from "@/lib/utils";
import type { CardHand } from "@/types";

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

function suitSymbol(suit: string) {
  if (suit.includes("♠")) return { sym: "♠", color: "text-zinc-300" };
  if (suit.includes("♥")) return { sym: "♥", color: "text-red-400" };
  if (suit.includes("♦")) return { sym: "♦", color: "text-amber-400" };
  if (suit.includes("♣")) return { sym: "♣", color: "text-emerald-400" };
  return { sym: suit.slice(-1), color: "text-zinc-300" };
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
                      suit.color,
                      hand.highlight?.includes(card) && "ring-1 ring-warning rounded-sm"
                    )}
                  >
                    {card.replace("♠", "").replace("♥", "").replace("♦", "").replace("♣", "")}{suit.sym}
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
