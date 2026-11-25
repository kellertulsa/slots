export interface SlotMachineDefinition {
  id: string;
  name: string;
  theme: string;
  live: boolean;
  reelCount: number;
  rowCount: number;
  paylines: number[][];
  betOptions: number[];
  symbols: string[];
  reels: string[];
  stackProbability?: number;
  progressive?: {
    seedAmount: number;
    contributionRate: number;
    sequence: string[];
  };
}

export const SLOT_MACHINES_BY_ID = {
  helen: {
    id: 'helen',
    name: 'Helen’s Jackpot',
    live: true,
    theme: '',
    reelCount: 3,
    rowCount: 3,
    paylines: [[1, 1, 1]],
    betOptions: [1, 5, 10, 25],
    symbols: ['🍒', '🍋', '🍊', '🍇', '🍉', '7️⃣'],
    reels: ['🍇', '7️⃣', '🍒'],
  },
  joe: {
    id: 'joe',
    name: 'Joe’s Bingo Hall',
    live: true,
    theme: 'bingo',
    reelCount: 5,
    rowCount: 3,
    paylines: [[1, 1, 1, 1, 1]],
    betOptions: [100],
    symbols: ['🍒', 'B', 'I', 'N', 'G', 'O'],
    reels: ['B', 'I', 'N', 'G', 'O'],
    stackProbability: 0.7,
    progressive: {
      seedAmount: 10_000,
      contributionRate: 0.01,
      sequence: ['B', 'I', 'N', 'G', 'O'],
    },
  },
  ryan: {
    id: 'ryan',
    name: 'Ryan’s Galaxy',
    live: true,
    theme: 'space',
    reelCount: 5,
    rowCount: 3,
    paylines: [[1, 1, 1, 1, 1]],
    betOptions: [1, 5, 10, 25],
    symbols: ['🍒', '⭐', '🪐', '🚀', '👽', '🛸'],
    reels: ['🚀', '🪐', '👽', '🚀', '🛸'],
  },
  alex: {
    id: 'alex',
    name: 'Alex’s All-Star',
    live: true,
    theme: 'sports',
    reelCount: 5,
    rowCount: 3,
    paylines: [
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2],
      [0, 1, 2, 1, 0],
      [2, 1, 0, 1, 2],
    ],
    betOptions: [0.01, 0.05, 0.10, 0.25],
    symbols: ['🍒', '🏀', '⚽', '🏒', '🏈', '⚾'],
    reels: ['🍒', '🏀', '⚽', '🏒', '🏈'],
  },
  persephone: {
    id: 'persephone',
    name: 'Persephone’s Underworld',
    live: true,
    theme: 'greek',
    reelCount: 3,
    rowCount: 3,
    paylines: [
      [0, 0, 0],
      [1, 1, 1],
      [2, 2, 2],
      [0, 1, 2],
      [2, 1, 0],
    ],
    betOptions: [1, 5, 10, 25],
    symbols: ['🍒', '⚡', '🔱', '🦉', '🐍', '🏛️'],
    reels: ['🍒', '⚡', '🔱'],
  },
} satisfies Record<string, SlotMachineDefinition>;

export const SLOT_MACHINES = Object.values(SLOT_MACHINES_BY_ID);
