import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Flame, Snowflake, Zap, Shield, Heart, Eye, Wind, Sparkles, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Spell {
  id: string;
  spell_name: string;
  spell_level: number;
  school: string;
  description: string;
  damage: string;
  range: string;
  casting_time: string;
  icon: string;
  uses_remaining: number;
  max_uses: number;
}

interface SpellBookSidebarProps {
  characterId: string | undefined;
  characterClass: string;
  characterLevel: number;
}

const SCHOOL_ICONS: Record<string, React.ReactNode> = {
  evocation: <Flame className="h-3.5 w-3.5" />,
  abjuration: <Shield className="h-3.5 w-3.5" />,
  conjuration: <Sparkles className="h-3.5 w-3.5" />,
  divination: <Eye className="h-3.5 w-3.5" />,
  enchantment: <Heart className="h-3.5 w-3.5" />,
  illusion: <Wind className="h-3.5 w-3.5" />,
  necromancy: <Zap className="h-3.5 w-3.5" />,
  transmutation: <RotateCcw className="h-3.5 w-3.5" />,
};

const SCHOOL_COLORS: Record<string, string> = {
  evocation: "text-destructive border-destructive/20 bg-destructive/5",
  abjuration: "text-primary border-primary/20 bg-primary/5",
  conjuration: "text-accent border-accent/20 bg-accent/5",
  divination: "text-blue-400 border-blue-400/20 bg-blue-400/5",
  enchantment: "text-pink-400 border-pink-400/20 bg-pink-400/5",
  illusion: "text-purple-400 border-purple-400/20 bg-purple-400/5",
  necromancy: "text-green-400 border-green-400/20 bg-green-400/5",
  transmutation: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
};

// Default spell lists by class
const CLASS_SPELLS: Record<string, Array<Omit<Spell, "id" | "uses_remaining" | "max_uses"> & { max_uses: number; min_level: number }>> = {
  Wizard: [
    { spell_name: "Fire Bolt", spell_level: 0, school: "evocation", description: "Hurl a bolt of fire at a target", damage: "1d10 fire", range: "120 ft", casting_time: "1 action", icon: "🔥", max_uses: 99, min_level: 1 },
    { spell_name: "Magic Missile", spell_level: 1, school: "evocation", description: "Three darts of magical force strike targets", damage: "3d4+3 force", range: "120 ft", casting_time: "1 action", icon: "✨", max_uses: 3, min_level: 1 },
    { spell_name: "Shield", spell_level: 1, school: "abjuration", description: "+5 AC until start of next turn", damage: "", range: "Self", casting_time: "1 reaction", icon: "🛡️", max_uses: 2, min_level: 1 },
    { spell_name: "Misty Step", spell_level: 2, school: "conjuration", description: "Teleport up to 30 feet", damage: "", range: "Self", casting_time: "1 bonus action", icon: "💨", max_uses: 2, min_level: 3 },
    { spell_name: "Fireball", spell_level: 3, school: "evocation", description: "A massive explosion of flame", damage: "8d6 fire", range: "150 ft", casting_time: "1 action", icon: "💥", max_uses: 1, min_level: 5 },
    { spell_name: "Counterspell", spell_level: 3, school: "abjuration", description: "Interrupt a spell being cast", damage: "", range: "60 ft", casting_time: "1 reaction", icon: "🚫", max_uses: 1, min_level: 5 },
    { spell_name: "Polymorph", spell_level: 4, school: "transmutation", description: "Transform a creature into a beast", damage: "", range: "60 ft", casting_time: "1 action", icon: "🦎", max_uses: 1, min_level: 7 },
  ],
  Sorcerer: [
    { spell_name: "Ray of Frost", spell_level: 0, school: "evocation", description: "A frigid beam strikes a creature", damage: "1d8 cold", range: "60 ft", casting_time: "1 action", icon: "❄️", max_uses: 99, min_level: 1 },
    { spell_name: "Chaos Bolt", spell_level: 1, school: "evocation", description: "Crackling energy of random type", damage: "2d8+1d6", range: "120 ft", casting_time: "1 action", icon: "🌀", max_uses: 3, min_level: 1 },
    { spell_name: "Thunderwave", spell_level: 1, school: "evocation", description: "Wave of force pushes creatures away", damage: "2d8 thunder", range: "Self (15ft cube)", casting_time: "1 action", icon: "⚡", max_uses: 2, min_level: 1 },
    { spell_name: "Scorching Ray", spell_level: 2, school: "evocation", description: "Three rays of fire", damage: "2d6 fire × 3", range: "120 ft", casting_time: "1 action", icon: "🔥", max_uses: 2, min_level: 3 },
    { spell_name: "Fireball", spell_level: 3, school: "evocation", description: "A massive explosion of flame", damage: "8d6 fire", range: "150 ft", casting_time: "1 action", icon: "💥", max_uses: 1, min_level: 5 },
  ],
  Warlock: [
    { spell_name: "Eldritch Blast", spell_level: 0, school: "evocation", description: "Beam of crackling energy", damage: "1d10 force", range: "120 ft", casting_time: "1 action", icon: "💜", max_uses: 99, min_level: 1 },
    { spell_name: "Hex", spell_level: 1, school: "enchantment", description: "Curse a creature for extra damage", damage: "+1d6 necrotic", range: "90 ft", casting_time: "1 bonus action", icon: "🔮", max_uses: 2, min_level: 1 },
    { spell_name: "Hellish Rebuke", spell_level: 1, school: "evocation", description: "Engulf attacker in flames", damage: "2d10 fire", range: "60 ft", casting_time: "1 reaction", icon: "🔥", max_uses: 2, min_level: 1 },
    { spell_name: "Darkness", spell_level: 2, school: "evocation", description: "Magical darkness fills the area", damage: "", range: "60 ft", casting_time: "1 action", icon: "🌑", max_uses: 1, min_level: 3 },
  ],
  Cleric: [
    { spell_name: "Sacred Flame", spell_level: 0, school: "evocation", description: "Radiant flame descends on target", damage: "1d8 radiant", range: "60 ft", casting_time: "1 action", icon: "🌟", max_uses: 99, min_level: 1 },
    { spell_name: "Healing Word", spell_level: 1, school: "evocation", description: "Heal a creature with a word", damage: "1d4+mod HP", range: "60 ft", casting_time: "1 bonus action", icon: "💚", max_uses: 3, min_level: 1 },
    { spell_name: "Guiding Bolt", spell_level: 1, school: "evocation", description: "Bolt of radiant light", damage: "4d6 radiant", range: "120 ft", casting_time: "1 action", icon: "☀️", max_uses: 2, min_level: 1 },
    { spell_name: "Spiritual Weapon", spell_level: 2, school: "evocation", description: "Floating spectral weapon attacks", damage: "1d8+mod force", range: "60 ft", casting_time: "1 bonus action", icon: "⚔️", max_uses: 2, min_level: 3 },
    { spell_name: "Spirit Guardians", spell_level: 3, school: "conjuration", description: "Spirits protect you and damage foes", damage: "3d8 radiant", range: "Self (15ft)", casting_time: "1 action", icon: "👼", max_uses: 1, min_level: 5 },
  ],
  Druid: [
    { spell_name: "Thorn Whip", spell_level: 0, school: "transmutation", description: "Thorny vine lashes out", damage: "1d6 piercing", range: "30 ft", casting_time: "1 action", icon: "🌿", max_uses: 99, min_level: 1 },
    { spell_name: "Entangle", spell_level: 1, school: "conjuration", description: "Plants restrain creatures", damage: "", range: "90 ft", casting_time: "1 action", icon: "🌱", max_uses: 2, min_level: 1 },
    { spell_name: "Moonbeam", spell_level: 2, school: "evocation", description: "Beam of pale moonlight", damage: "2d10 radiant", range: "120 ft", casting_time: "1 action", icon: "🌙", max_uses: 2, min_level: 3 },
    { spell_name: "Call Lightning", spell_level: 3, school: "conjuration", description: "Storm cloud rains lightning", damage: "3d10 lightning", range: "120 ft", casting_time: "1 action", icon: "⛈️", max_uses: 1, min_level: 5 },
  ],
  Bard: [
    { spell_name: "Vicious Mockery", spell_level: 0, school: "enchantment", description: "Psychic damage through insults", damage: "1d4 psychic", range: "60 ft", casting_time: "1 action", icon: "🎭", max_uses: 99, min_level: 1 },
    { spell_name: "Healing Word", spell_level: 1, school: "evocation", description: "Heal a creature with a word", damage: "1d4+mod HP", range: "60 ft", casting_time: "1 bonus action", icon: "💚", max_uses: 3, min_level: 1 },
    { spell_name: "Dissonant Whispers", spell_level: 1, school: "enchantment", description: "Discordant melody causes pain", damage: "3d6 psychic", range: "60 ft", casting_time: "1 action", icon: "🎵", max_uses: 2, min_level: 1 },
    { spell_name: "Heat Metal", spell_level: 2, school: "transmutation", description: "Make metal glow red-hot", damage: "2d8 fire", range: "60 ft", casting_time: "1 action", icon: "🔥", max_uses: 2, min_level: 3 },
  ],
  Paladin: [
    { spell_name: "Divine Smite", spell_level: 1, school: "evocation", description: "Extra radiant damage on hit", damage: "2d8 radiant", range: "Self", casting_time: "Part of attack", icon: "⚡", max_uses: 3, min_level: 2 },
    { spell_name: "Shield of Faith", spell_level: 1, school: "abjuration", description: "+2 AC for 10 minutes", damage: "", range: "60 ft", casting_time: "1 bonus action", icon: "🛡️", max_uses: 2, min_level: 2 },
    { spell_name: "Lay on Hands", spell_level: 1, school: "evocation", description: "Heal with touch (pool of HP)", damage: "Heal 5×level", range: "Touch", casting_time: "1 action", icon: "🙏", max_uses: 1, min_level: 1 },
  ],
  Ranger: [
    { spell_name: "Hunter's Mark", spell_level: 1, school: "divination", description: "Mark a target for extra damage", damage: "+1d6", range: "90 ft", casting_time: "1 bonus action", icon: "🎯", max_uses: 3, min_level: 2 },
    { spell_name: "Ensnaring Strike", spell_level: 1, school: "conjuration", description: "Thorny vines bind target", damage: "1d6 piercing", range: "Self", casting_time: "1 bonus action", icon: "🌿", max_uses: 2, min_level: 2 },
    { spell_name: "Spike Growth", spell_level: 2, school: "transmutation", description: "Ground sprouts thorns", damage: "2d4 per 5ft", range: "150 ft", casting_time: "1 action", icon: "🌵", max_uses: 1, min_level: 5 },
  ],
};

// For martial classes
const MARTIAL_ABILITIES: Array<Omit<Spell, "id" | "uses_remaining" | "max_uses"> & { max_uses: number; min_level: number }> = [
  { spell_name: "Second Wind", spell_level: 0, school: "abjuration", description: "Heal 1d10 + fighter level", damage: "Heal", range: "Self", casting_time: "1 bonus action", icon: "💨", max_uses: 1, min_level: 1 },
  { spell_name: "Action Surge", spell_level: 0, school: "transmutation", description: "Take an additional action", damage: "", range: "Self", casting_time: "Free", icon: "⚡", max_uses: 1, min_level: 2 },
];

const SpellBookSidebar = ({ characterId, characterClass, characterLevel }: SpellBookSidebarProps) => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [open, setOpen] = useState(false);
  const [castingSpell, setCastingSpell] = useState<string | null>(null);

  const isCaster = !!CLASS_SPELLS[characterClass];

  const initSpells = useCallback(async () => {
    if (!characterId) return;
    
    const { data: existing } = await supabase
      .from("character_spells")
      .select("*")
      .eq("character_id", characterId)
      .order("spell_level", { ascending: true });

    if (existing && existing.length > 0) {
      setSpells(existing as Spell[]);
      return;
    }

    // Initialize spells for this class
    const classSpells = CLASS_SPELLS[characterClass] || MARTIAL_ABILITIES;
    const available = classSpells.filter(s => s.min_level <= characterLevel);
    
    for (const spell of available) {
      await supabase.from("character_spells").upsert({
        character_id: characterId,
        spell_name: spell.spell_name,
        spell_level: spell.spell_level,
        school: spell.school,
        description: spell.description,
        damage: spell.damage,
        range: spell.range,
        casting_time: spell.casting_time,
        icon: spell.icon,
        uses_remaining: spell.max_uses,
        max_uses: spell.max_uses,
      }, { onConflict: "character_id,spell_name" });
    }

    const { data: fresh } = await supabase
      .from("character_spells")
      .select("*")
      .eq("character_id", characterId)
      .order("spell_level", { ascending: true });
    if (fresh) setSpells(fresh as Spell[]);
  }, [characterId, characterClass, characterLevel]);

  useEffect(() => {
    if (open) initSpells();
  }, [open, initSpells]);

  const castSpell = async (spell: Spell) => {
    if (spell.uses_remaining <= 0 && spell.max_uses < 99) {
      toast.error("No uses remaining!");
      return;
    }
    setCastingSpell(spell.id);
    
    if (spell.max_uses < 99) {
      await supabase
        .from("character_spells")
        .update({ uses_remaining: spell.uses_remaining - 1 })
        .eq("id", spell.id);
      setSpells(prev => prev.map(s => s.id === spell.id ? { ...s, uses_remaining: s.uses_remaining - 1 } : s));
    }

    toast.success(`${spell.icon} ${spell.spell_name} cast!${spell.damage ? ` (${spell.damage})` : ""}`, { duration: 3000 });
    setTimeout(() => setCastingSpell(null), 800);
  };

  const restoreAllSpells = async () => {
    if (!characterId) return;
    for (const spell of spells) {
      if (spell.uses_remaining < spell.max_uses && spell.max_uses < 99) {
        await supabase.from("character_spells").update({ uses_remaining: spell.max_uses }).eq("id", spell.id);
      }
    }
    setSpells(prev => prev.map(s => ({ ...s, uses_remaining: s.max_uses })));
    toast.success("All spell slots restored!");
  };

  const groupedByLevel = spells.reduce((acc, spell) => {
    const key = spell.spell_level === 0 ? "Cantrips" : `Level ${spell.spell_level}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(spell);
    return acc;
  }, {} as Record<string, Spell[]>);

  const totalSlots = spells.filter(s => s.max_uses < 99).reduce((a, s) => a + s.max_uses, 0);
  const usedSlots = spells.filter(s => s.max_uses < 99).reduce((a, s) => a + (s.max_uses - s.uses_remaining), 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card/50 text-muted-foreground transition hover:border-primary/30 hover:text-primary">
          <Wand2 className="h-5 w-5" />
        </motion.button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] sm:w-[440px] bg-background/95 backdrop-blur-xl border-border p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <SheetHeader>
            <SheetTitle className="font-display text-lg flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" /> {isCaster ? "Spell Book" : "Combat Abilities"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Spell Slots: {totalSlots - usedSlots} / {totalSlots}</p>
              <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden mt-1">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  animate={{ width: `${totalSlots > 0 ? ((totalSlots - usedSlots) / totalSlots) * 100 : 100}%` }} />
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={restoreAllSpells}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs text-primary">
              <RotateCcw className="h-3 w-3" /> Long Rest
            </motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-fantasy" style={{ maxHeight: "calc(100vh - 180px)" }}>
          {spells.length === 0 ? (
            <div className="text-center py-16">
              <Wand2 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isCaster ? "Open to initialize your spell book" : "No special abilities available"}
              </p>
            </div>
          ) : (
            Object.entries(groupedByLevel).map(([level, levelSpells]) => (
              <div key={level} className="mb-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{level}</h3>
                <div className="space-y-2">
                  {levelSpells.map((spell) => {
                    const schoolStyle = SCHOOL_COLORS[spell.school] || "text-muted-foreground border-border bg-muted/10";
                    const isCantrip = spell.max_uses >= 99;
                    const depleted = !isCantrip && spell.uses_remaining <= 0;
                    const isCasting = castingSpell === spell.id;

                    return (
                      <motion.button key={spell.id}
                        whileHover={depleted ? {} : { scale: 1.01 }}
                        whileTap={depleted ? {} : { scale: 0.99 }}
                        onClick={() => !depleted && castSpell(spell)}
                        disabled={depleted}
                        className={`w-full text-left rounded-xl border px-4 py-3 transition relative overflow-hidden ${
                          depleted ? "opacity-40 border-border bg-muted/5" : schoolStyle
                        }`}>
                        {/* Casting flash */}
                        <AnimatePresence>
                          {isCasting && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0.8 }}
                              animate={{ scale: 3, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.6 }}
                              className="absolute inset-0 rounded-xl bg-primary/30 pointer-events-none"
                              style={{ transformOrigin: "center" }}
                            />
                          )}
                        </AnimatePresence>

                        <div className="flex items-center gap-3 relative z-10">
                          <motion.span className="text-2xl"
                            animate={isCasting ? { scale: [1, 1.5, 1], rotate: [0, 15, -15, 0] } : {}}
                            transition={{ duration: 0.4 }}>
                            {spell.icon}
                          </motion.span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-foreground truncate">{spell.spell_name}</p>
                              {!isCantrip && (
                                <div className="flex gap-0.5 ml-2 shrink-0">
                                  {Array.from({ length: spell.max_uses }).map((_, i) => (
                                    <div key={i} className={`h-2 w-2 rounded-full ${
                                      i < spell.uses_remaining ? "bg-primary" : "bg-muted"
                                    }`} />
                                  ))}
                                </div>
                              )}
                              {isCantrip && (
                                <span className="text-[9px] text-muted-foreground ml-2 shrink-0">∞</span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{spell.description}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="flex items-center gap-0.5 text-[9px]">
                                {SCHOOL_ICONS[spell.school]} {spell.school}
                              </span>
                              {spell.damage && (
                                <span className="text-[9px] text-destructive font-medium">{spell.damage}</span>
                              )}
                              <span className="text-[9px] text-muted-foreground">{spell.range}</span>
                              <span className="text-[9px] text-muted-foreground">{spell.casting_time}</span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SpellBookSidebar;
