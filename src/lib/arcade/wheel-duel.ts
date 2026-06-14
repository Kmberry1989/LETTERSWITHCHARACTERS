export type WheelDuelPlayer = {
  uid: string;
  displayName: string;
  score: number;
};

export type WheelDuelDocument = {
  players: string[];
  playerData: Record<string, WheelDuelPlayer>;
  currentTurn: string;
  phrase: string;
  category: string;
  guessedLetters: string[];
  currentValue: number | null;
  status: 'active' | 'solved';
  spinState: {
    velocity: number;
    resultIndex: number | null;
    resultValue: number | null;
  };
  round: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};
