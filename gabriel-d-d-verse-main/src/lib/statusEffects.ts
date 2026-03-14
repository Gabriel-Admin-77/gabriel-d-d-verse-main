export interface StatusEffectDef {
  id: string;
  name: string;
  icon: string;
  type: "buff" | "debuff";
  defaultDuration: number;
  damagePerTurn: number;
  healPerTurn: number;
  statModifier: Record<string, number>;
  description: string;
  color: string;
}

export const STATUS_EFFECTS: Record<string, StatusEffectDef> = {
  poisoned: {
    id: "poisoned",
    name: "Poisoned",
    icon: "🤢",
    type: "debuff",
    defaultDuration: 3,
    damagePerTurn: 3,
    healPerTurn: 0,
    statModifier: { str: -2, con: -1 },
    description: "Taking poison damage each turn. STR -2, CON -1.",
    color: "text-green-400",
  },
  stunned: {
    id: "stunned",
    name: "Stunned",
    icon: "💫",
    type: "debuff",
    defaultDuration: 2,
    damagePerTurn: 0,
    healPerTurn: 0,
    statModifier: { dex: -4, ac: -2 },
    description: "Cannot dodge effectively. DEX -4, AC -2.",
    color: "text-yellow-400",
  },
  frightened: {
    id: "frightened",
    name: "Frightened",
    icon: "😨",
    type: "debuff",
    defaultDuration: 2,
    damagePerTurn: 0,
    healPerTurn: 0,
    statModifier: { str: -2, cha: -2 },
    description: "Disadvantage on attacks. STR -2, CHA -2.",
    color: "text-purple-400",
  },
  burning: {
    id: "burning",
    name: "Burning",
    icon: "🔥",
    type: "debuff",
    defaultDuration: 3,
    damagePerTurn: 5,
    healPerTurn: 0,
    statModifier: {},
    description: "Taking fire damage each turn.",
    color: "text-orange-400",
  },
  blessed: {
    id: "blessed",
    name: "Blessed",
    icon: "✨",
    type: "buff",
    defaultDuration: 5,
    damagePerTurn: 0,
    healPerTurn: 0,
    statModifier: { str: 2, wis: 2 },
    description: "Divinely empowered. STR +2, WIS +2.",
    color: "text-yellow-300",
  },
  shielded: {
    id: "shielded",
    name: "Shielded",
    icon: "🛡️",
    type: "buff",
    defaultDuration: 3,
    damagePerTurn: 0,
    healPerTurn: 0,
    statModifier: { ac: 3 },
    description: "Magical barrier. AC +3.",
    color: "text-blue-400",
  },
  regenerating: {
    id: "regenerating",
    name: "Regenerating",
    icon: "💚",
    type: "buff",
    defaultDuration: 4,
    damagePerTurn: 0,
    healPerTurn: 3,
    description: "Healing 3 HP per turn.",
    statModifier: {},
    color: "text-green-300",
  },
  haste: {
    id: "haste",
    name: "Haste",
    icon: "⚡",
    type: "buff",
    defaultDuration: 3,
    damagePerTurn: 0,
    healPerTurn: 0,
    statModifier: { dex: 3, ac: 1 },
    description: "Supernaturally fast. DEX +3, AC +1.",
    color: "text-cyan-400",
  },
};
