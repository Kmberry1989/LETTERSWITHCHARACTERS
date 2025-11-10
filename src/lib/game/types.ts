export interface Tile {
  letter: string;
  score: number;
  isBlank?: boolean;
}

export interface PlacedTile extends Tile {
  row: number;
  col: number;
}

export interface PlayerData {
  displayName: string;
  score: number;
  avatarId: string;
  photoURL?: string | null;
  tiles: Tile[];
  hintUsed?: boolean;
}

export interface Game {
  players: string[];
  playerData: Record<string, PlayerData>;
  board: Record<string, Tile>;
  tileBag: Tile[];
  currentTurn: string;
  status: 'active' | 'pending' | 'finished';
  consecutivePasses?: number;
  winner?: string;
  messages?: any[];
}
