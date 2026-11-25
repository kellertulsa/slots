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
