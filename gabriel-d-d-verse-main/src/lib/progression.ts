// XP thresholds per level (index = level, value = xp needed for next level)
export const XP_THRESHOLDS = [
  0,     // Level 0 (unused)
  300,   // Level 1 -> 2
  900,   // Level 2 -> 3
  2700,  // Level 3 -> 4
  6500,  // Level 4 -> 5
  14000, // Level 5 -> 6
  23000, // Level 6 -> 7
  34000, // Level 7 -> 8
  48000, // Level 8 -> 9
  64000, // Level 9 -> 10
  85000, // Level 10 -> 11
];

export const MAX_LEVEL = 10;

// Class abilities unlocked at each level
export const CLASS_ABILITIES: Record<string, { level: number; name: string; description: string; type: string }[]> = {
  Fighter: [
    { level: 1, name: "Second Wind", description: "Heal 1d10 + level HP as a bonus action once per rest.", type: "active" },
    { level: 2, name: "Action Surge", description: "Take one additional action on your turn.", type: "active" },
    { level: 4, name: "Extra Attack", description: "Attack twice when you take the Attack action.", type: "passive" },
    { level: 6, name: "Indomitable", description: "Reroll a failed saving throw once per rest.", type: "active" },
    { level: 8, name: "Champion's Strike", description: "Critical hits on 19-20.", type: "passive" },
  ],
  Wizard: [
    { level: 1, name: "Arcane Recovery", description: "Recover spell slots during a short rest.", type: "active" },
    { level: 2, name: "Spell Mastery", description: "Cast a 1st-level spell at will.", type: "passive" },
    { level: 4, name: "Arcane Ward", description: "Create a magical shield absorbing damage.", type: "active" },
    { level: 6, name: "Potent Cantrip", description: "Cantrips deal half damage even on saves.", type: "passive" },
    { level: 8, name: "Overchannel", description: "Maximize damage of a spell once per rest.", type: "active" },
  ],
  Rogue: [
    { level: 1, name: "Sneak Attack", description: "Extra 1d6 damage when you have advantage.", type: "passive" },
    { level: 2, name: "Cunning Action", description: "Dash, Disengage, or Hide as bonus action.", type: "active" },
    { level: 4, name: "Uncanny Dodge", description: "Halve damage from an attack you can see.", type: "active" },
    { level: 6, name: "Evasion", description: "Take no damage on successful DEX saves.", type: "passive" },
    { level: 8, name: "Assassinate", description: "Auto-crit against surprised creatures.", type: "passive" },
  ],
  Cleric: [
    { level: 1, name: "Divine Intervention", description: "Call upon your deity for aid once per day.", type: "active" },
    { level: 2, name: "Turn Undead", description: "Force undead to flee from your holy power.", type: "active" },
    { level: 4, name: "Blessed Healer", description: "Heal yourself when healing others.", type: "passive" },
    { level: 6, name: "Divine Strike", description: "Add radiant damage to weapon attacks.", type: "passive" },
    { level: 8, name: "Supreme Healing", description: "Maximize all healing dice.", type: "passive" },
  ],
  Ranger: [
    { level: 1, name: "Favored Enemy", description: "Advantage on tracking certain creature types.", type: "passive" },
    { level: 2, name: "Hunter's Mark", description: "Deal extra 1d6 damage to a marked target.", type: "active" },
    { level: 4, name: "Extra Attack", description: "Attack twice when you take the Attack action.", type: "passive" },
    { level: 6, name: "Vanish", description: "Hide as a bonus action. Can't be tracked.", type: "active" },
    { level: 8, name: "Volley", description: "Attack all creatures within 10 feet of a point.", type: "active" },
  ],
  Barbarian: [
    { level: 1, name: "Rage", description: "Gain resistance to physical damage and bonus damage.", type: "active" },
    { level: 2, name: "Reckless Attack", description: "Gain advantage on attacks, enemies gain advantage on you.", type: "active" },
    { level: 4, name: "Feral Instinct", description: "Advantage on Initiative. Can't be surprised.", type: "passive" },
    { level: 6, name: "Brutal Critical", description: "Roll one additional damage die on critical hits.", type: "passive" },
    { level: 8, name: "Relentless Rage", description: "Drop to 1 HP instead of 0 once per rage.", type: "passive" },
  ],
  Bard: [
    { level: 1, name: "Bardic Inspiration", description: "Grant a d6 to an ally's roll.", type: "active" },
    { level: 2, name: "Song of Rest", description: "Allies regain extra HP during short rests.", type: "passive" },
    { level: 4, name: "Cutting Words", description: "Reduce an enemy's roll with your wit.", type: "active" },
    { level: 6, name: "Countercharm", description: "Allies have advantage vs charm and fear.", type: "active" },
    { level: 8, name: "Superior Inspiration", description: "Regain Bardic Inspiration on initiative if none remain.", type: "passive" },
  ],
  Paladin: [
    { level: 1, name: "Divine Smite", description: "Expend a spell slot to deal extra radiant damage.", type: "active" },
    { level: 2, name: "Lay on Hands", description: "Heal up to 5x your level in HP per day.", type: "active" },
    { level: 4, name: "Aura of Protection", description: "Allies within 10ft add your CHA to saves.", type: "passive" },
    { level: 6, name: "Aura of Courage", description: "You and allies within 10ft can't be frightened.", type: "passive" },
    { level: 8, name: "Improved Smite", description: "All melee attacks deal extra 1d8 radiant.", type: "passive" },
  ],
  Monk: [
    { level: 1, name: "Martial Arts", description: "Use DEX for unarmed strikes. Bonus unarmed attack.", type: "passive" },
    { level: 2, name: "Flurry of Blows", description: "Spend ki for two unarmed strikes as bonus action.", type: "active" },
    { level: 4, name: "Stunning Strike", description: "Spend ki to stun a creature on hit.", type: "active" },
    { level: 6, name: "Evasion", description: "Take no damage on successful DEX saves.", type: "passive" },
    { level: 8, name: "Diamond Soul", description: "Proficiency in all saving throws.", type: "passive" },
  ],
  Druid: [
    { level: 1, name: "Wild Shape", description: "Transform into a beast you've seen.", type: "active" },
    { level: 2, name: "Natural Recovery", description: "Recover spell slots during a short rest.", type: "active" },
    { level: 4, name: "Wild Shape Improvement", description: "Transform into stronger beasts.", type: "passive" },
    { level: 6, name: "Nature's Ward", description: "Immune to poison and disease.", type: "passive" },
    { level: 8, name: "Beast Spells", description: "Cast spells while in Wild Shape.", type: "passive" },
  ],
  Sorcerer: [
    { level: 1, name: "Font of Magic", description: "Convert sorcery points to spell slots.", type: "active" },
    { level: 2, name: "Metamagic", description: "Alter spells with Twinned, Quickened, or Subtle.", type: "active" },
    { level: 4, name: "Empowered Spell", description: "Reroll damage dice for better results.", type: "active" },
    { level: 6, name: "Bend Luck", description: "Spend sorcery points to alter any roll by 1d4.", type: "active" },
    { level: 8, name: "Sorcerous Restoration", description: "Regain sorcery points on short rest.", type: "passive" },
  ],
  Warlock: [
    { level: 1, name: "Eldritch Blast", description: "Powerful force cantrip dealing 1d10 damage.", type: "active" },
    { level: 2, name: "Agonizing Blast", description: "Add CHA modifier to Eldritch Blast damage.", type: "passive" },
    { level: 4, name: "Pact Boon", description: "Gain a pact weapon, tome, or familiar.", type: "passive" },
    { level: 6, name: "Accursed Specter", description: "Slay a humanoid to create a specter ally.", type: "active" },
    { level: 8, name: "Dark One's Own Luck", description: "Add d10 to an ability check once per rest.", type: "active" },
  ],
};

// Stat boosts on level up (flat bonuses)
export function getLevelUpBonuses(level: number): { hp: number; statPoints: number } {
  if (level <= 3) return { hp: 5, statPoints: 0 };
  if (level <= 5) return { hp: 7, statPoints: 1 };
  if (level <= 7) return { hp: 9, statPoints: 1 };
  return { hp: 12, statPoints: 2 };
}

// Rarity colors
export const RARITY_COLORS: Record<string, string> = {
  common: "text-muted-foreground border-border",
  uncommon: "text-accent border-accent/30",
  rare: "text-primary border-primary/30",
  legendary: "text-gold-glow border-gold-glow/30",
};

export const RARITY_BG: Record<string, string> = {
  common: "bg-muted/10",
  uncommon: "bg-accent/5",
  rare: "bg-primary/5",
  legendary: "bg-gold-glow/5",
};
