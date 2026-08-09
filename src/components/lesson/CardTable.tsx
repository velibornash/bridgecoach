"use client";

import { cn } from "@/lib/utils";
import type { CardHand } from "@/types";
import { BridgeTable, type BridgeTableHand } from "@/components/bridge/BridgeTable";

interface CardTableProps {
  hands: CardHand[];
  className?: string;
  dealer?: string;
  vulnerability?: string;
  contract?: string;
}

export function CardTable({ hands, className, dealer, vulnerability, contract }: CardTableProps) {
  const tableHands: BridgeTableHand[] = hands.map((hand) => ({
    position: hand.position,
    cards: hand.cards,
    label: hand.label,
    highlight: hand.highlight,
  }));

  return <BridgeTable hands={tableHands} dealer={dealer} vulnerability={vulnerability} contract={contract} className={className} />;
}
