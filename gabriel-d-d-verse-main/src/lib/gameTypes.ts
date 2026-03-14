export interface Character {
  name: string;
  class: string;
  level: number;
  hp: { current: number; max: number };
  ac: number;
  stats: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  moralScore: number;
  portraitUrl?: string | null;
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  attack: string;
  cr: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  ingredients: string[];
  check: string;
  dc: number;
  resultIcon: string;
}

export interface MoralDilemma {
  id: string;
  title: string;
  description: string;
  choiceGood: string;
  choiceEvil: string;
  moralShift: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  type: string;
  icon: string;
}

export interface CombatParticipant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  isPlayer: boolean;
}

export interface ChatMessage {
  id: string;
  role: "dm" | "player";
  content: string;
  timestamp: Date;
}
