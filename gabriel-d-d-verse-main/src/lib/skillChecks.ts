export interface SkillDef {
  id: string;
  name: string;
  stat: "str" | "dex" | "con" | "int" | "wis" | "cha";
  icon: string;
}

export const SKILLS: SkillDef[] = [
  { id: "athletics", name: "Athletics", stat: "str", icon: "💪" },
  { id: "acrobatics", name: "Acrobatics", stat: "dex", icon: "🤸" },
  { id: "stealth", name: "Stealth", stat: "dex", icon: "🥷" },
  { id: "sleight_of_hand", name: "Sleight of Hand", stat: "dex", icon: "🤏" },
  { id: "arcana", name: "Arcana", stat: "int", icon: "🔮" },
  { id: "history", name: "History", stat: "int", icon: "📜" },
  { id: "investigation", name: "Investigation", stat: "int", icon: "🔍" },
  { id: "nature", name: "Nature", stat: "int", icon: "🌿" },
  { id: "perception", name: "Perception", stat: "wis", icon: "👁️" },
  { id: "insight", name: "Insight", stat: "wis", icon: "🧠" },
  { id: "medicine", name: "Medicine", stat: "wis", icon: "⚕️" },
  { id: "survival", name: "Survival", stat: "wis", icon: "🏕️" },
  { id: "persuasion", name: "Persuasion", stat: "cha", icon: "🗣️" },
  { id: "deception", name: "Deception", stat: "cha", icon: "🎭" },
  { id: "intimidation", name: "Intimidation", stat: "cha", icon: "😠" },
  { id: "performance", name: "Performance", stat: "cha", icon: "🎵" },
];

export function getStatModifier(statValue: number): number {
  return Math.floor((statValue - 10) / 2);
}

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function performSkillCheck(
  skill: SkillDef,
  statValue: number,
  dc: number,
  proficiencyBonus: number = 0
): { roll: number; modifier: number; total: number; success: boolean; critical: boolean } {
  const roll = rollD20();
  const modifier = getStatModifier(statValue) + proficiencyBonus;
  const total = roll + modifier;
  const critical = roll === 20 || roll === 1;
  const success = roll === 20 ? true : roll === 1 ? false : total >= dc;
  return { roll, modifier, total, success, critical };
}
