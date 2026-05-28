export type MetaBoardSpaceType = 'bonus' | 'penalty' | 'reward' | 'mini-game' | 'shop' | 'rest';

export type MetaBoardSpace = {
  id: string;
  label: string;
  description: string;
  type: MetaBoardSpaceType;
  rewardTurns?: number;
  rewardCoins?: number;
  penaltyCoins?: number;
};

export type CasualMiniGame = {
  id: string;
  title: string;
  category: 'crossword' | 'word-search' | 'sorting' | 'puzzle' | 'arcade';
  rewardTurns: number;
  description: string;
};

export type WheelPrize = {
  id: string;
  label: string;
  description: string;
  coinsDelta?: number;
  turnsDelta?: number;
};

export const META_BOARD_SPACES: MetaBoardSpace[] = [
  {
    id: 'bonus-wheel',
    label: 'Bonus Wheel',
    description: 'Spin for coins, turns, or a small curse.',
    type: 'bonus',
    rewardTurns: 1,
  },
  {
    id: 'snack-shop',
    label: 'Snack Shop',
    description: 'Spend coins to buy a one-time advantage.',
    type: 'shop',
  },
  {
    id: 'trap-door',
    label: 'Trap Door',
    description: 'Drop back a few spaces and lose a little coin.',
    type: 'penalty',
    penaltyCoins: 5,
  },
  {
    id: 'rest-stop',
    label: 'Rest Stop',
    description: 'Recover and bank your progress before the next challenge.',
    type: 'rest',
  },
  {
    id: 'mini-game-hub',
    label: 'Mini-game Hub',
    description: 'Earn extra turns from solo casual games.',
    type: 'mini-game',
    rewardTurns: 2,
  },
];

export const CASUAL_MINI_GAMES: CasualMiniGame[] = [
  {
    id: 'crossword',
    title: 'Crossword Drift',
    category: 'crossword',
    rewardTurns: 1,
    description: 'Solve a laid-back crossword to earn a turn token.',
  },
  {
    id: 'word-search',
    title: 'Word Search',
    category: 'word-search',
    rewardTurns: 1,
    description: 'Find hidden words without a timer pressure.',
  },
  {
    id: 'liquid-sort',
    title: 'Liquid Sort',
    category: 'sorting',
    rewardTurns: 1,
    description: 'Sort colors into tubes for a calm casual bonus.',
  },
];

export const WHEEL_PRIZES: WheelPrize[] = [
  { id: 'coin-burst', label: 'Coin Burst', description: '+15 coins', coinsDelta: 15 },
  { id: 'double-turn', label: 'Double Turn', description: '+2 turn tokens', turnsDelta: 2 },
  { id: 'quiet-week', label: 'Quiet Week', description: 'No change, but safe from penalties next round.' },
  { id: 'floor-drop', label: 'Floor Drop', description: '-5 coins', coinsDelta: -5 },
  { id: 'bonus-reroll', label: 'Bonus Reroll', description: 'Spin again once.', turnsDelta: 1 },
];
