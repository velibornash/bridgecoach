"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BridgeCard, Suit, SuitColor, Rank, CardSize, CardEngineProps } from "./types";

const sizeMap: Record<CardSize, { w: number; h: number; rankSize: number; suitSize: number; cornerSize: number }> = {
  xs: { w: 56, h: 80, rankSize: 13, suitSize: 17, cornerSize: 9 },
  sm: { w: 74, h: 104, rankSize: 16, suitSize: 22, cornerSize: 11 },
  md: { w: 96, h: 134, rankSize: 20, suitSize: 28, cornerSize: 14 },
  lg: { w: 124, h: 176, rankSize: 26, suitSize: 38, cornerSize: 18 },
  xl: { w: 160, h: 226, rankSize: 34, suitSize: 48, cornerSize: 22 },
};

const suitConfig: Record<Suit, { color: SuitColor; svg: string; label: string }> = {
  '♠': { color: 'black', svg: 'M12 2 L16 8 L12 6 L8 8 Z M12 6 L8 10 L16 10 Z M6 10 L18 10 L15 14 L9 14 Z', label: '♠' },
  '♥': { color: 'red', svg: 'M12 4 C8 0 2 2 2 6 C2 10 8 14 12 16 C16 14 22 10 22 6 C22 2 16 0 12 4 Z', label: '♥' },
  '♦': { color: 'red', svg: 'M12 2 L20 8 L12 18 L4 8 Z', label: '♦' },
  '♣': { color: 'black', svg: 'M12 4 C12 4 6 4 6 8 C6 12 10 12 12 14 C14 12 18 12 18 8 C18 4 12 4 12 4 Z M12 14 L12 20 M8 18 L16 18', label: '♣' },
};

function CardInner({ card, size, interactive, hoverable, onClick, onHover }: {
  card: BridgeCard;
  size: CardSize;
  interactive: boolean;
  hoverable: boolean;
  onClick?: (card: BridgeCard) => void;
  onHover?: (card: BridgeCard | null) => void;
}) {
  const s = sizeMap[size];
  const config = suitConfig[card.suit || '♠'];

  const displaySuit = config.label;
  const rank = card.rank || 'A';
  const color = config.color === 'red' ? '#E0244A' : '#14161E';
  const isRed = config.color === 'red';
  const cardFace = '#FDFDF7';

  return (
    <g
      className={cn(
        "cursor-pointer select-none",
        interactive && hoverable && "hover:drop-shadow-lg hover:scale-105",
      )}
      onClick={() => interactive && onClick?.(card)}
      onPointerEnter={() => interactive && onHover?.(card)}
      onPointerLeave={() => interactive && onHover?.(null)}
    >
      {/* Card shadow */}
      <rect
        x={2} y={2}
        width={s.w} height={s.h}
        rx={5} ry={5}
        fill="rgba(0,0,0,0.2)"
      />
      {/* Card background */}
      <rect
        x={0} y={0}
        width={s.w} height={s.h}
        rx={5} ry={5}
        fill={cardFace}
        stroke={card.highlighted ? '#FBBF24' : card.selected ? '#6366F1' : '#E6E3DA'}
        strokeWidth={card.highlighted ? 2.5 : card.selected ? 2 : 0.5}
      />
      {/* Highlighted glow */}
      {card.highlighted && (
        <rect
          x={0} y={0}
          width={s.w} height={s.h}
          rx={5} ry={5}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={2}
          opacity={0.4}
        >
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" repeatCount="indefinite" />
        </rect>
      )}
      {/* Playable indicator */}
      {card.playable && (
        <rect
          x={0} y={0}
          width={s.w} height={s.h}
          rx={5} ry={5}
          fill="none"
          stroke="#10B981"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          opacity={0.7}
        />
      )}

      {/* Corner rank (top-left) */}
      <text
        x={5} y={s.cornerSize + 1}
        fontSize={s.cornerSize}
        fontWeight="bold"
        fontFamily="Georgia, serif"
        fill={color}
        textAnchor="start"
      >
        {rank}
      </text>
      <text
        x={5} y={s.cornerSize + s.cornerSize}
        fontSize={Math.max(s.cornerSize - 1, 6)}
        fontFamily="serif"
        fill={color}
        textAnchor="start"
      >
        {displaySuit}
      </text>

      {/* Corner rank (bottom-right, rotated) */}
      <g transform={`translate(${s.w - 5}, ${s.h - 2}) rotate(180)`}>
        <text
          x={0} y={s.cornerSize + 1}
          fontSize={s.cornerSize}
          fontWeight="bold"
          fontFamily="Georgia, serif"
          fill={color}
          textAnchor="start"
        >
          {rank}
        </text>
        <text
          x={0} y={s.cornerSize + s.cornerSize}
          fontSize={Math.max(s.cornerSize - 1, 6)}
          fontFamily="serif"
          fill={color}
          textAnchor="start"
        >
          {displaySuit}
        </text>
      </g>

      {/* Center suit symbol */}
      <text
        x={s.w / 2}
        y={s.h / 2 + s.suitSize / 3}
        fontSize={s.suitSize}
        fontFamily="serif"
        fill={color}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {displaySuit}
      </text>
    </g>
  );
}

export function getCardSize(size: CardSize): { w: number; h: number } {
  const s = sizeMap[size];
  return { w: s.w, h: s.h };
}

export function CardEngine({ card, size = 'md', interactive = false, hoverable = true, onClick, onHover, animate = true }: CardEngineProps) {
  const [flipped, setFlipped] = useState(false);
  const displayCard = useMemo(() => ({ ...card, faceUp: card.faceUp && !flipped }), [card]);

  const handleClick = () => {
    if (interactive && onClick) {
      if (card.faceUp && card.playable) {
        onClick(card);
      } else if (!card.faceUp) {
        setFlipped(prev => !prev);
        setTimeout(() => setFlipped(false), 300);
      }
    }
  };

  const content = (
    <CardInner
      card={displayCard}
      size={size}
      interactive={interactive}
      hoverable={hoverable}
      onClick={handleClick}
      onHover={onHover}
    />
  );

  if (animate) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8, y: 20, rotateZ: (card.rotation ?? 0) }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateZ: card.rotation ?? 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        style={{
          position: 'absolute',
          left: card.x ?? 0,
          top: card.y ?? 0,
          zIndex: card.zIndex ?? 1,
          opacity: card.opacity ?? 1,
          transform: `scale(${card.scale ?? 1})`,
        }}
      >
        {card.faceUp ? (
          <svg width={sizeMap[size].w} height={sizeMap[size].h}>{content}</svg>
        ) : (
          <motion.div
            initial={{ rotateY: 0 }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.4, type: "spring", damping: 15 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div style={{ backfaceVisibility: "hidden" }}>
              <svg width={sizeMap[size].w} height={sizeMap[size].h} viewBox={`0 0 ${sizeMap[size].w} ${sizeMap[size].h}`}>
                <rect width={sizeMap[size].w} height={sizeMap[size].h} rx={5} fill="#FDFDF7" stroke="#E6E3DA" strokeWidth="0.5" />
                <rect x="4" y="4" width={sizeMap[size].w - 8} height={sizeMap[size].h - 8} rx={3} fill="#F3F2EC" />
                <text x={sizeMap[size].w / 2} y={sizeMap[size].h / 2} textAnchor="middle" dominantBaseline="central" fontSize="16" fill="#9CA3AF" fontFamily="serif">⚡</text>
              </svg>
            </div>
            <div style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", position: "absolute", top: 0, left: 0 }}>
              <svg width={sizeMap[size].w} height={sizeMap[size].h}>{content}</svg>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return card.faceUp ? <svg style={{ width: sizeMap[size].w, height: sizeMap[size].h }}>{content}</svg> : (
    <svg width={sizeMap[size].w} height={sizeMap[size].h}>
      <rect width={sizeMap[size].w} height={sizeMap[size].h} rx={5} fill="#FDFDF7" stroke="#E6E3DA" strokeWidth="0.5" />
      <rect x="4" y="4" width={sizeMap[size].w - 8} height={sizeMap[size].h - 8} rx={3} fill="#F3F2EC" />
      <text x={sizeMap[size].w / 2} y={sizeMap[size].h / 2} textAnchor="middle" dominantBaseline="central" fontSize="16" fill="#9CA3AF" fontFamily="serif">⚡</text>
    </svg>
  );
}

export function CardBack({ size = 'md' }: { size?: CardSize }) {
  const s = sizeMap[size];
  return (
    <svg width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`}>
      <defs>
        <pattern id={`pattern-${size}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#1E3A5F" />
          <circle cx="4" cy="4" r="1" fill="#6366F1" opacity="0.5" />
          <circle cx="0" cy="0" r="1" fill="#7DD3FC" opacity="0.3" />
          <circle cx="8" cy="8" r="1" fill="#7DD3FC" opacity="0.3" />
        </pattern>
        <linearGradient id={`grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#1E3A5F" />
        </linearGradient>
      </defs>
      <rect width={s.w} height={s.h} rx={5} fill={`url(#grad-${size})`} stroke="#6366F1" strokeWidth="1" />
      <rect x="3" y="3" width={s.w - 6} height={s.h - 6} rx={3} fill={`url(#pattern-${size})`} />
      <circle cx={s.w / 2} cy={s.h / 2} r={Math.min(s.w, s.h) * 0.2} fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />
      <text x={s.w / 2} y={s.h / 2} textAnchor="middle" dominantBaseline="central" fontSize={s.suitSize * 0.6} fill="white" fontFamily="serif" opacity="0.6">♠</text>
    </svg>
  );
}

export type { BridgeCard, Suit, SuitColor, Rank, CardSize, CardEngineProps, SuitConfig } from "./types";

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

export function createDeck(): BridgeCard[] {
  const deck: BridgeCard[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank, i) => {
      deck.push({
        id: `${suit}${rank}`,
        suit,
        rank,
        faceUp: false,
        rotation: 0,
        scale: 1,
        opacity: 1,
        zIndex: 0,
      });
    });
  });
  return deck;
}

export function shuffleDeck(deck: BridgeCard[]): BridgeCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
