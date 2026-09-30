export type MatchMode = 'identical' | 'image_to_text';

export interface CardItem {
  id: string;
  label: string;
  secondaryLabel?: string;
  iconName?: string;
  imageUrl?: string;
  secondaryIconName?: string;
  secondaryImageUrl?: string;
  color?: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  matchMode: MatchMode;
  leftColumnTitle?: string;
  rightColumnTitle?: string;
  cards: CardItem[];
  coverImage?: string;
  isBuiltIn?: boolean;
  category: string;
  createdAt: number;
}

export interface MemoryGameCard {
  instanceId: string;
  cardId: string;
  type: 'primary' | 'secondary';
  label: string;
  iconName?: string;
  imageUrl?: string;
  color?: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export type ActiveGameTab = 'memory' | 'sliding_puzzle' | 'tile_puzzle' | 'match_pairs' | 'deck_builder';

export interface PuzzleTile {
  currentPos: number; // 0 to N-1
  correctPos: number; // 0 to N-1
  isEmpty?: boolean;
}

export interface CustomPuzzle {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: number;
}

