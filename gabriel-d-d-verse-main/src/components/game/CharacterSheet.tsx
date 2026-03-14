import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Heart, Swords, Sparkles, Star, Lock, Unlock, Zap, Eye, User, Gem, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CLASS_ABILITIES } from "@/lib/progression";
import { CLASS_IMAGES } from "@/lib/classImages";
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem } from "@/lib/gameTypes";

interface CharacterSheetProps {
  character: any;
  xp: number;
  xpToNext: number;
}

type SheetTab = "stats" | "gear" | "abilities";

const STAT_INFO: Record<string, { label: string; full: string; icon: string; color: string }> = {
  str: { label: "STR", full: "Strength", icon: "💪", color: "text-destructive" },
  dex: { label: "DEX", full: "Dexterity", icon: "🏃", color: "text-accent" },
  con: { label: "CON", full: "Constitution", icon: "🛡️", color: "text-primary" },
  int: { label: "INT", full: "Intelligence", icon: "📖", color: "text-primary" },
  wis: { label: "WIS", full: "Wisdom", icon: "👁️", color: "text-accent" },
  cha: { label: "CHA", full: "Charisma", icon: "✨", color: "text-primary" },
};

function getModifier(stat: number): string {
  const mod = Math.floor((stat - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

const EQUIP_TYPES = ["weapon", "armor", "shield", "ring", "amulet", "helm", "boots", "gloves", "cloak"];

const CharacterSheet = ({ character, xp, xpToNext }: CharacterSheetProps) => {
  const [tab, setTab] = useState<SheetTab>("stats");
  const [equipment, setEquipment] = useState<InventoryItem[]>([]);
  const [abilities, setAbilities] = useState<{ name: string; description: string; ability_type: string; unlocked_at_level: number }[]>([]);

  useEffect(() => {
    if (!character?.id) return;
    // Load equipped gear (non-consumable inventory items)
    supabase.from("character_inventory").select("*").eq("character_id", character.id).then(({ data }) => {
      if (data) {
        setEquipment(data.map(d => ({ id: d.id, name: d.item_name, quantity: d.quantity, type: d.item_type, icon: d.item_icon })));
      }
    });
    // Load unlocked abilities
    supabase.from("character_abilities").select("*").eq("character_id", character.id).order("unlocked_at_level", { ascending: true }).then(({ data }) => {
      if (data) setAbilities(data as any);
    });
  }, [character?.id]);

  const classAbilities = CLASS_ABILITIES[character?.class] || [];
  const hpPercent = character ? (character.hp_current / character.hp_max) * 100 : 0;
  const xpPercent = xpToNext > 0 ? Math.min((xp / xpToNext) * 100, 100) : 0;

  const equippedItems = equipment.filter(i => EQUIP_TYPES.includes(i.type.toLowerCase()));
  const consumables = equipment.filter(i => !EQUIP_TYPES.includes(i.type.toLowerCase()));

  const tabs: { id: SheetTab; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "Stats", icon: <User className="h-4 w-4" /> },
    { id: "gear", label: "Gear", icon: <Gem className="h-4 w-4" /> },
    { id: "abilities", label: "Abilities", icon: <Zap className="h-4 w-4" /> },
  ];

  if (!character) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Character Sheet</span>
        </motion.button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[360px] sm:w-[420px] bg-background/95 backdrop-blur-xl border-border p-0 overflow-hidden">
        {/* Hero header */}
        <div className="relative px-5 pt-5 pb-4">
          <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg">
              <img
                src={character.portrait_url || CLASS_IMAGES[character.class]}
                alt={character.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5 text-center">
                <span className="text-[9px] font-bold text-white">LV {character.level}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-lg font-bold text-foreground truncate">{character.name}</h2>
              <p className="text-xs text-muted-foreground">{character.class} · Level {character.level}</p>
              <div className="mt-2 flex gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span className="flex items-center gap-1"><Heart className="h-2.5 w-2.5 text-destructive" /> HP</span>
                    <span>{character.hp_current}/{character.hp_max}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-destructive to-destructive/60" animate={{ width: `${hpPercent}%` }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span className="flex items-center gap-1"><Sparkles className="h-2.5 w-2.5 text-primary" /> XP</span>
                    <span>{xp}/{xpToNext}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" animate={{ width: `${xpPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-xs font-medium transition-all ${
                tab === t.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-fantasy" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <AnimatePresence mode="wait">
            {tab === "stats" && (
              <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* AC highlight */}
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Armor Class</p>
                      <p className="font-display text-xl font-bold text-foreground">{character.ac}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Gold</p>
                    <p className="font-display text-lg font-bold text-primary">{character.gold || 0} 🪙</p>
                  </div>
                </div>

                {/* Ability scores */}
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ability Scores</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {Object.entries(STAT_INFO).map(([key, info]) => {
                    const val = character[key] || 10;
                    const mod = getModifier(val);
                    return (
                      <motion.div key={key} whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 rounded-xl border border-border bg-muted/15 px-3 py-3 transition hover:border-primary/20">
                        <span className="text-lg">{info.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">{info.full}</span>
                            <span className={`text-xs font-bold ${parseInt(mod) >= 0 ? 'text-primary' : 'text-destructive'}`}>{mod}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary/50" style={{ width: `${Math.min((val / 20) * 100, 100)}%` }} />
                            </div>
                            <span className="text-sm font-display font-bold text-foreground w-6 text-right">{val}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Moral alignment */}
                <div className="rounded-xl border border-border bg-muted/15 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">Moral Alignment</span>
                    <span className="text-xs font-bold text-foreground">{character.moral_score}/100</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-destructive">Evil</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-destructive/40 via-muted to-primary/40" />
                      <motion.div className="absolute top-0 h-full w-1 bg-foreground rounded-full shadow-lg"
                        animate={{ left: `${character.moral_score}%` }} />
                    </div>
                    <span className="text-[10px] text-primary">Good</span>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "gear" && (
              <motion.div key="gear" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {equippedItems.length > 0 && (
                  <>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Equipped Gear</h3>
                    <div className="space-y-2 mb-5">
                      {equippedItems.map(item => (
                        <motion.div key={item.id} whileHover={{ scale: 1.01 }}
                          className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{item.type}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {consumables.length > 0 && (
                  <>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Consumables & Loot</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {consumables.map(item => (
                        <div key={item.id} className="flex flex-col items-center rounded-xl border border-border bg-muted/15 px-2 py-3 text-center">
                          <span className="text-xl">{item.icon}</span>
                          <p className="mt-1 text-[10px] font-medium text-foreground leading-tight">{item.name}</p>
                          <p className="text-[9px] text-muted-foreground">×{item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {equipment.length === 0 && (
                  <div className="text-center py-12">
                    <Gem className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No gear yet. Visit the shop or find loot!</p>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "abilities" && (
              <motion.div key="abilities" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Unlocked abilities */}
                {abilities.length > 0 && (
                  <>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Unlock className="h-3 w-3" /> Unlocked
                    </h3>
                    <div className="space-y-2 mb-5">
                      {abilities.map((a, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-foreground">{a.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              a.ability_type === "active" ? "bg-accent/15 text-accent border border-accent/20" : "bg-primary/15 text-primary border border-primary/20"
                            }`}>
                              {a.ability_type === "active" ? "⚡ Active" : "🔮 Passive"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{a.description}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">Unlocked at Level {a.unlocked_at_level}</p>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {/* Locked abilities */}
                {classAbilities.filter(a => a.level > character.level).length > 0 && (
                  <>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Lock className="h-3 w-3" /> Locked
                    </h3>
                    <div className="space-y-2">
                      {classAbilities.filter(a => a.level > character.level).map((a, i) => (
                        <div key={i} className="rounded-xl border border-border bg-muted/10 px-4 py-3 opacity-60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-muted-foreground">{a.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                              🔒 Level {a.level}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground/60 leading-relaxed">{a.description}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {classAbilities.length === 0 && abilities.length === 0 && (
                  <div className="text-center py-12">
                    <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No abilities data for this class.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CharacterSheet;
