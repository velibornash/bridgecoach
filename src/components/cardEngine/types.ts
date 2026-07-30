export type Suit = '♠' | '♥' | '♦' | '♣';
export type SuitColor = 'black' | 'red';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CardPosition = 'north' | 'east' | 'south' | 'west' | 'center';

export interface BridgeCard {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  highlighted?: boolean;
  selected?: boolean;
  playable?: boolean;
  rotation?: number;
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  zIndex?: number;
}

export interface CardEngineProps {
  card: BridgeCard;
  size?: CardSize;
  interactive?: boolean;
  hoverable?: boolean;
  onClick?: (card: BridgeCard) => void;
  onHover?: (card: BridgeCard | null) => void;
  animate?: boolean;
}

export interface SuitConfig {
  suit: Suit;
  color: SuitColor;
  svgPath: string;
  label: string;
}