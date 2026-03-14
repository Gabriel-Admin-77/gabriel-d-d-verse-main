export interface RandomEncounter {
  id: string;
  name: string;
  description: string;
  monsterId?: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  goldChance: number;
  goldRange: [number, number];
}

export interface BiomeEncounterTable {
  biome: string;
  adventureIds: string[];
  encounters: RandomEncounter[];
}

export const ENCOUNTER_TABLES: BiomeEncounterTable[] = [
  {
    biome: "Forest & Frontier",
    adventureIds: ["lost_mines", "sunless_citadel"],
    encounters: [
      { id: "wolf_pack", name: "Wolf Pack", description: "A pack of dire wolves circles your camp, eyes gleaming.", monsterId: "dire_wolf", difficulty: "easy", xpReward: 75, goldChance: 0.2, goldRange: [5, 15] },
      { id: "goblin_ambush", name: "Goblin Ambush", description: "Goblins leap from the undergrowth, weapons drawn!", monsterId: "goblin", difficulty: "easy", xpReward: 50, goldChance: 0.6, goldRange: [10, 30] },
      { id: "wandering_merchant", name: "Wandering Merchant", description: "A merchant with a rickety cart flags you down.", difficulty: "easy", xpReward: 25, goldChance: 0, goldRange: [0, 0] },
      { id: "hidden_shrine", name: "Hidden Shrine", description: "You discover a moss-covered shrine radiating faint magic.", difficulty: "easy", xpReward: 40, goldChance: 0.5, goldRange: [15, 40] },
      { id: "owlbear_den", name: "Owlbear Den", description: "You stumble upon an owlbear protecting its nest!", monsterId: "owlbear", difficulty: "hard", xpReward: 150, goldChance: 0.3, goldRange: [20, 50] },
    ],
  },
  {
    biome: "Dungeon & Underground",
    adventureIds: ["forge_of_fury", "dungeon_mad_mage", "dragon_hatchery"],
    encounters: [
      { id: "skeleton_patrol", name: "Skeleton Patrol", description: "Animated skeletons march through the corridor.", monsterId: "skeleton", difficulty: "easy", xpReward: 60, goldChance: 0.3, goldRange: [5, 20] },
      { id: "mimic_chest", name: "Suspicious Chest", description: "A treasure chest sits in the middle of an empty room...", monsterId: "mimic", difficulty: "medium", xpReward: 120, goldChance: 0.8, goldRange: [30, 80] },
      { id: "gelatinous_ambush", name: "Gelatinous Cube", description: "The corridor ahead shimmers — a gelatinous cube blocks the way.", monsterId: "gelatinous_cube", difficulty: "medium", xpReward: 100, goldChance: 0.7, goldRange: [20, 60] },
      { id: "collapsed_tunnel", name: "Collapsed Tunnel", description: "Rocks begin to fall! Athletics check to dodge.", difficulty: "medium", xpReward: 50, goldChance: 0, goldRange: [0, 0] },
      { id: "ancient_trap", name: "Ancient Trap", description: "Click. You hear a mechanism trigger beneath your foot.", difficulty: "hard", xpReward: 80, goldChance: 0.4, goldRange: [25, 50] },
    ],
  },
  {
    biome: "Gothic Horror",
    adventureIds: ["curse_strahd", "haunted_manor"],
    encounters: [
      { id: "ghost_encounter", name: "Restless Spirit", description: "A translucent figure drifts through the wall, wailing.", monsterId: "ghost", difficulty: "medium", xpReward: 130, goldChance: 0.2, goldRange: [10, 30] },
      { id: "cult_ritual", name: "Cultist Ritual", description: "Hooded figures chant around a dark altar.", monsterId: "cult_fanatic", difficulty: "medium", xpReward: 100, goldChance: 0.5, goldRange: [25, 60] },
      { id: "cursed_mirror", name: "Cursed Mirror", description: "Your reflection moves independently, reaching toward you.", difficulty: "medium", xpReward: 60, goldChance: 0, goldRange: [0, 0] },
      { id: "blood_moon", name: "Blood Moon", description: "The moon turns crimson. Undead rise from nearby graves.", monsterId: "skeleton", difficulty: "hard", xpReward: 120, goldChance: 0.4, goldRange: [15, 45] },
      { id: "ravens_warning", name: "Raven's Warning", description: "A raven lands before you, cawing urgently toward a hidden path.", difficulty: "easy", xpReward: 30, goldChance: 0, goldRange: [0, 0] },
    ],
  },
  {
    biome: "Volcanic & Hellscape",
    adventureIds: ["descent_avernus", "white_plume"],
    encounters: [
      { id: "lava_flow", name: "Lava Flow", description: "Molten rock surges across your path!", difficulty: "hard", xpReward: 80, goldChance: 0, goldRange: [0, 0] },
      { id: "fire_elementals", name: "Fire Elementals", description: "Flames coalesce into humanoid shapes blocking your way.", difficulty: "hard", xpReward: 180, goldChance: 0.3, goldRange: [40, 90] },
      { id: "devil_patrol", name: "Devil Patrol", description: "Barbed devils patrol the ashen road ahead.", difficulty: "hard", xpReward: 200, goldChance: 0.5, goldRange: [50, 120] },
      { id: "sulfur_vents", name: "Sulfur Vents", description: "Toxic fumes pour from cracks in the ground.", difficulty: "medium", xpReward: 50, goldChance: 0, goldRange: [0, 0] },
      { id: "damned_soul", name: "Damned Soul", description: "A tortured soul offers a deal — information for a favor.", difficulty: "easy", xpReward: 40, goldChance: 0, goldRange: [0, 0] },
    ],
  },
  {
    biome: "Jungle & Exotic",
    adventureIds: ["tomb_annihilation"],
    encounters: [
      { id: "quicksand", name: "Quicksand Trap", description: "The ground gives way — you're sinking fast!", difficulty: "medium", xpReward: 60, goldChance: 0, goldRange: [0, 0] },
      { id: "dinosaur_charge", name: "Dinosaur Charge", description: "A massive beast crashes through the jungle toward you!", difficulty: "hard", xpReward: 180, goldChance: 0.2, goldRange: [20, 50] },
      { id: "jungle_shrine", name: "Jungle Shrine", description: "Ancient stone tablets covered in Omuan script.", difficulty: "easy", xpReward: 50, goldChance: 0.5, goldRange: [20, 60] },
      { id: "poisoned_dart", name: "Poisoned Dart Trap", description: "A tripwire! Darts fly from the vegetation.", difficulty: "medium", xpReward: 70, goldChance: 0, goldRange: [0, 0] },
      { id: "undead_horde", name: "Undead Horde", description: "The Soulmonger's influence raises the dead around you.", monsterId: "skeleton", difficulty: "hard", xpReward: 150, goldChance: 0.3, goldRange: [30, 70] },
    ],
  },
  {
    biome: "Epic & Multiverse",
    adventureIds: ["rise_tiamat", "vecna_lives"],
    encounters: [
      { id: "dragon_flyby", name: "Dragon Flyby", description: "A chromatic dragon swoops overhead, raining fire!", monsterId: "young_red_dragon", difficulty: "hard", xpReward: 300, goldChance: 0.4, goldRange: [80, 200] },
      { id: "planar_rift", name: "Planar Rift", description: "Reality tears open — creatures from another plane spill through.", difficulty: "hard", xpReward: 200, goldChance: 0.3, goldRange: [50, 120] },
      { id: "ogre_warband", name: "Ogre Warband", description: "A group of ogres blocks the mountain pass.", monsterId: "ogre", difficulty: "medium", xpReward: 140, goldChance: 0.6, goldRange: [40, 100] },
      { id: "divine_messenger", name: "Divine Messenger", description: "A celestial being appears with cryptic guidance.", difficulty: "easy", xpReward: 60, goldChance: 0, goldRange: [0, 0] },
      { id: "reality_warp", name: "Reality Warp", description: "The laws of physics bend. Gravity reverses momentarily.", difficulty: "medium", xpReward: 80, goldChance: 0, goldRange: [0, 0] },
    ],
  },
];

export function getEncounterTable(adventureId: string): BiomeEncounterTable | null {
  return ENCOUNTER_TABLES.find(t => t.adventureIds.includes(adventureId)) || null;
}

export function rollRandomEncounter(adventureId: string): RandomEncounter | null {
  const table = getEncounterTable(adventureId);
  if (!table) return null;
  // 30% chance of encounter
  if (Math.random() > 0.30) return null;
  const idx = Math.floor(Math.random() * table.encounters.length);
  return table.encounters[idx];
}
