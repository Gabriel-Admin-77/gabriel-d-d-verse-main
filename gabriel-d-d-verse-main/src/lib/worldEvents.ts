export interface WorldEventEffect {
  shopPriceModifier?: number;      // multiplier: 0.7 = 30% discount, 1.5 = 50% markup
  encounterDifficultyShift?: number; // -1, 0, +1 shift
  npcMoodShift?: number;           // global reputation modifier applied per interaction
  xpModifier?: number;             // multiplier on XP rewards
  goldModifier?: number;           // multiplier on gold rewards
  healOverTime?: number;           // HP restored per DM turn
  damageOverTime?: number;         // HP lost per DM turn
}

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "festival" | "disaster" | "political" | "supernatural" | "trade" | "military";
  duration: number; // number of DM responses it lasts
  effects: WorldEventEffect;
  flavorText: string; // short in-world announcement
}

export interface ActiveWorldEvent extends WorldEvent {
  turnsRemaining: number;
  startedAt: number;
}

const WORLD_EVENTS: WorldEvent[] = [
  // Festivals — positive
  {
    id: "harvest_festival",
    title: "Harvest Festival",
    description: "The townsfolk celebrate a bountiful harvest with feasts and revelry.",
    icon: "🎪",
    category: "festival",
    duration: 4,
    effects: { shopPriceModifier: 0.8, npcMoodShift: 5, xpModifier: 1.1 },
    flavorText: "Merchants lower their prices and spirits are high across the land!",
  },
  {
    id: "tournament_of_blades",
    title: "Tournament of Blades",
    description: "Warriors from across the realm gather for a grand tournament.",
    icon: "⚔️",
    category: "festival",
    duration: 3,
    effects: { xpModifier: 1.25, encounterDifficultyShift: 1, npcMoodShift: 3 },
    flavorText: "Combat encounters are fiercer, but the rewards are greater!",
  },
  {
    id: "mages_conclave",
    title: "Mages' Conclave",
    description: "Arcane practitioners convene, filling the air with magical energy.",
    icon: "🔮",
    category: "festival",
    duration: 3,
    effects: { xpModifier: 1.15, shopPriceModifier: 0.85, npcMoodShift: 2 },
    flavorText: "Magical items are discounted and arcane knowledge flows freely.",
  },

  // Disasters — negative
  {
    id: "plague_outbreak",
    title: "Plague Outbreak",
    description: "A mysterious illness sweeps through settlements. The sick crowd the streets.",
    icon: "☠️",
    category: "disaster",
    duration: 5,
    effects: { shopPriceModifier: 1.5, npcMoodShift: -10, damageOverTime: 2 },
    flavorText: "Shop prices soar, NPCs are fearful, and the plague saps your health.",
  },
  {
    id: "earthquake",
    title: "Earthquake",
    description: "The ground trembles violently. Buildings crack and tunnels collapse.",
    icon: "🌋",
    category: "disaster",
    duration: 3,
    effects: { encounterDifficultyShift: 1, npcMoodShift: -5, shopPriceModifier: 1.3 },
    flavorText: "Paths are blocked, dangers lurk in the rubble, and supplies grow scarce.",
  },
  {
    id: "dragon_sighting",
    title: "Dragon Sighting",
    description: "A great wyrm has been spotted flying over the region. Terror grips all.",
    icon: "🐉",
    category: "disaster",
    duration: 4,
    effects: { encounterDifficultyShift: 1, npcMoodShift: -8, goldModifier: 1.2 },
    flavorText: "Encounters are deadlier, but panicked merchants drop treasures as they flee.",
  },

  // Political — mixed
  {
    id: "new_king_crowned",
    title: "New King Crowned",
    description: "A new ruler takes the throne, bringing hope — or tyranny.",
    icon: "👑",
    category: "political",
    duration: 5,
    effects: { shopPriceModifier: 0.9, npcMoodShift: 3, xpModifier: 1.05 },
    flavorText: "The coronation brings tax relief and cautious optimism.",
  },
  {
    id: "bandit_uprising",
    title: "Bandit Uprising",
    description: "Organized bandits seize the trade roads. Commerce grinds to a halt.",
    icon: "🏴",
    category: "military",
    duration: 4,
    effects: { shopPriceModifier: 1.4, encounterDifficultyShift: 1, goldModifier: 1.3, npcMoodShift: -6 },
    flavorText: "Roads are dangerous, goods are expensive, but bandits carry gold!",
  },
  {
    id: "peace_treaty",
    title: "Peace Treaty Signed",
    description: "Warring factions agree to a ceasefire. Calm settles over the land.",
    icon: "🕊️",
    category: "political",
    duration: 4,
    effects: { encounterDifficultyShift: -1, npcMoodShift: 8, shopPriceModifier: 0.85, xpModifier: 0.9 },
    flavorText: "Fewer monsters roam, NPCs are friendly, but less XP from easy times.",
  },

  // Supernatural — dramatic
  {
    id: "blood_moon_rising",
    title: "Blood Moon Rising",
    description: "A crimson moon bathes the world in eerie light. Undead stir in their graves.",
    icon: "🌑",
    category: "supernatural",
    duration: 3,
    effects: { encounterDifficultyShift: 1, xpModifier: 1.3, npcMoodShift: -7, damageOverTime: 1 },
    flavorText: "Undead grow stronger, but defeating them yields rich rewards.",
  },
  {
    id: "ley_line_surge",
    title: "Ley Line Surge",
    description: "Magical ley lines pulse with energy. Spells crackle with extra power.",
    icon: "⚡",
    category: "supernatural",
    duration: 3,
    effects: { xpModifier: 1.2, healOverTime: 3, npcMoodShift: 2 },
    flavorText: "Magic flows strong — healing comes easier and power surges through you.",
  },
  {
    id: "veil_thinning",
    title: "The Veil Thins",
    description: "The barrier between planes weakens. Strange creatures slip through.",
    icon: "👁️",
    category: "supernatural",
    duration: 4,
    effects: { encounterDifficultyShift: 1, xpModifier: 1.25, goldModifier: 1.15, npcMoodShift: -5 },
    flavorText: "Extraplanar threats emerge, carrying otherworldly treasures.",
  },

  // Trade — economy
  {
    id: "merchant_caravan",
    title: "Merchant Caravan Arrives",
    description: "A wealthy caravan from distant lands sets up shop in the town square.",
    icon: "🐫",
    category: "trade",
    duration: 3,
    effects: { shopPriceModifier: 0.7, npcMoodShift: 4, goldModifier: 0.9 },
    flavorText: "Rare goods at low prices! But gold rewards are slightly reduced.",
  },
  {
    id: "trade_embargo",
    title: "Trade Embargo",
    description: "A neighboring kingdom blocks all trade routes. Supplies dwindle.",
    icon: "🚫",
    category: "trade",
    duration: 4,
    effects: { shopPriceModifier: 1.6, npcMoodShift: -4, goldModifier: 1.1 },
    flavorText: "Everything costs more, but looted goods sell at a premium.",
  },
];

// 20% chance per DM response, avoid repeating the same event
export function rollWorldEvent(currentEventId?: string): WorldEvent | null {
  if (Math.random() > 0.18) return null;
  const available = WORLD_EVENTS.filter(e => e.id !== currentEventId);
  return available[Math.floor(Math.random() * available.length)];
}

export function getActiveEffects(events: ActiveWorldEvent[]): WorldEventEffect {
  const combined: WorldEventEffect = {};
  for (const e of events) {
    if (e.turnsRemaining <= 0) continue;
    const fx = e.effects;
    combined.shopPriceModifier = (combined.shopPriceModifier ?? 1) * (fx.shopPriceModifier ?? 1);
    combined.encounterDifficultyShift = (combined.encounterDifficultyShift ?? 0) + (fx.encounterDifficultyShift ?? 0);
    combined.npcMoodShift = (combined.npcMoodShift ?? 0) + (fx.npcMoodShift ?? 0);
    combined.xpModifier = (combined.xpModifier ?? 1) * (fx.xpModifier ?? 1);
    combined.goldModifier = (combined.goldModifier ?? 1) * (fx.goldModifier ?? 1);
    combined.healOverTime = (combined.healOverTime ?? 0) + (fx.healOverTime ?? 0);
    combined.damageOverTime = (combined.damageOverTime ?? 0) + (fx.damageOverTime ?? 0);
  }
  return combined;
}

export function tickWorldEvents(events: ActiveWorldEvent[]): ActiveWorldEvent[] {
  return events
    .map(e => ({ ...e, turnsRemaining: e.turnsRemaining - 1 }))
    .filter(e => e.turnsRemaining > 0);
}

export function buildWorldEventContext(events: ActiveWorldEvent[]): string {
  if (events.length === 0) return "";
  const lines = events.map(e => {
    const parts: string[] = [`"${e.title}" (${e.turnsRemaining} turns remaining)`];
    if (e.effects.encounterDifficultyShift && e.effects.encounterDifficultyShift > 0) parts.push("encounters are harder");
    if (e.effects.encounterDifficultyShift && e.effects.encounterDifficultyShift < 0) parts.push("encounters are easier");
    if (e.effects.npcMoodShift && e.effects.npcMoodShift > 0) parts.push("NPCs are friendlier");
    if (e.effects.npcMoodShift && e.effects.npcMoodShift < 0) parts.push("NPCs are more hostile/fearful");
    return `- ${parts.join(", ")}`;
  });
  return `\n\nACTIVE WORLD EVENTS (weave these into your narrative):\n${lines.join("\n")}`;
}
