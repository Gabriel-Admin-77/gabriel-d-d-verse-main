export interface Adventure {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Deadly";
  difficultyLevel: number; // 1-12
  icon: string;
  setting: string;
  recommendedLevel: string;
}

export const ADVENTURES: Adventure[] = [
  {
    id: "lost_mines",
    title: "Lost Mines of Phandelver",
    description: "Escort a wagon to the frontier town of Phandalin and uncover the lost mines of the Phandelver Pact.",
    difficulty: "Easy",
    difficultyLevel: 1,
    icon: "⛏️",
    setting: "Sword Coast",
    recommendedLevel: "1–4",
  },
  {
    id: "sunless_citadel",
    title: "The Sunless Citadel",
    description: "Descend into a ruined fortress now overrun by goblins, cultists, and a sinister druid.",
    difficulty: "Easy",
    difficultyLevel: 2,
    icon: "🏚️",
    setting: "Forgotten Realms",
    recommendedLevel: "1–3",
  },
  {
    id: "dragon_hatchery",
    title: "Dragon Hatchery",
    description: "Infiltrate a hidden cave where the Cult of the Dragon is nurturing deadly dragon eggs.",
    difficulty: "Easy",
    difficultyLevel: 3,
    icon: "🥚",
    setting: "Greenfields",
    recommendedLevel: "2–4",
  },
  {
    id: "haunted_manor",
    title: "Death House",
    description: "Explore a haunted manor in the mists of Barovia, where dark secrets lurk beneath the floorboards.",
    difficulty: "Medium",
    difficultyLevel: 4,
    icon: "🏚️",
    setting: "Barovia",
    recommendedLevel: "1–3",
  },
  {
    id: "forge_of_fury",
    title: "The Forge of Fury",
    description: "Delve into Khundrukar, a dwarven stronghold overtaken by orcs, troglodytes, and a young black dragon.",
    difficulty: "Medium",
    difficultyLevel: 5,
    icon: "🔨",
    setting: "Underdark Fringe",
    recommendedLevel: "3–5",
  },
  {
    id: "white_plume",
    title: "White Plume Mountain",
    description: "Recover three legendary weapons from the lair of the wizard Keraptis in a volcanic mountain.",
    difficulty: "Medium",
    difficultyLevel: 6,
    icon: "🌋",
    setting: "Greyhawk",
    recommendedLevel: "5–8",
  },
  {
    id: "curse_strahd",
    title: "Curse of Strahd",
    description: "Survive the dread domain of Barovia and confront the vampire lord Strahd von Zarovich.",
    difficulty: "Hard",
    difficultyLevel: 7,
    icon: "🧛",
    setting: "Barovia",
    recommendedLevel: "3–10",
  },
  {
    id: "tomb_annihilation",
    title: "Tomb of Annihilation",
    description: "Journey into the jungles of Chult to find and destroy the Soulmonger before death claims all.",
    difficulty: "Hard",
    difficultyLevel: 8,
    icon: "💀",
    setting: "Chult",
    recommendedLevel: "5–11",
  },
  {
    id: "descent_avernus",
    title: "Descent into Avernus",
    description: "Travel to the first layer of the Nine Hells to save the city of Elturel from damnation.",
    difficulty: "Hard",
    difficultyLevel: 9,
    icon: "🔥",
    setting: "Avernus",
    recommendedLevel: "5–13",
  },
  {
    id: "dungeon_mad_mage",
    title: "Dungeon of the Mad Mage",
    description: "Explore 23 levels of Undermountain beneath Waterdeep, realm of the mad wizard Halaster.",
    difficulty: "Deadly",
    difficultyLevel: 10,
    icon: "🧙",
    setting: "Undermountain",
    recommendedLevel: "5–20",
  },
  {
    id: "rise_tiamat",
    title: "Rise of Tiamat",
    description: "Stop the Cult of the Dragon from summoning the five-headed dragon goddess Tiamat.",
    difficulty: "Deadly",
    difficultyLevel: 11,
    icon: "🐉",
    setting: "Sword Coast",
    recommendedLevel: "8–15",
  },
  {
    id: "vecna_lives",
    title: "Vecna Lives!",
    description: "Face the arch-lich Vecna as he attempts to reshape reality itself and ascend to godhood.",
    difficulty: "Deadly",
    difficultyLevel: 12,
    icon: "👁️",
    setting: "Multiverse",
    recommendedLevel: "10–20",
  },
];

export const DIFFICULTY_COLORS: Record<Adventure["difficulty"], string> = {
  Easy: "text-green-400 border-green-500/30 bg-green-500/10",
  Medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  Hard: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  Deadly: "text-red-400 border-red-500/30 bg-red-500/10",
};
