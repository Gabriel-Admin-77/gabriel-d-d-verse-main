import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

interface Achievement {
  id: string;
  achievement_id: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  unlocked_at: string;
}

interface AchievementsSidebarProps {
  characterId: string | undefined;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "first_blood", title: "First Blood", description: "Deal damage in combat for the first time", icon: "⚔️", rarity: "common" },
  { id: "critical_hit", title: "Critical Strike", description: "Land a natural 20 on an attack roll", icon: "💥", rarity: "uncommon" },
  { id: "critical_fail", title: "Spectacularly Bad", description: "Roll a natural 1 on an attack", icon: "💀", rarity: "common" },
  { id: "level_5", title: "Seasoned Adventurer", description: "Reach level 5", icon: "⭐", rarity: "uncommon" },
  { id: "level_10", title: "Legendary Hero", description: "Reach the maximum level", icon: "👑", rarity: "legendary" },
  { id: "gold_hoarder", title: "Gold Hoarder", description: "Accumulate 500 gold", icon: "💰", rarity: "rare" },
  { id: "monster_slayer_10", title: "Monster Slayer", description: "Defeat 10 monsters total", icon: "🗡️", rarity: "uncommon" },
  { id: "bestiary_5", title: "Monster Scholar", description: "Discover 5 different monster types", icon: "📖", rarity: "rare" },
  { id: "quest_complete_5", title: "Quest Master", description: "Complete 5 quests", icon: "📜", rarity: "rare" },
  { id: "survivor", title: "Survivor", description: "Stabilize after death saves", icon: "💪", rarity: "uncommon" },
  { id: "shopaholic", title: "Shopaholic", description: "Buy 10 items from the shop", icon: "🛒", rarity: "common" },
  { id: "pacifist", title: "Silver Tongue", description: "Complete 5 encounters without combat", icon: "🕊️", rarity: "epic" },
  { id: "dragon_slayer", title: "Dragon Slayer", description: "Defeat a dragon", icon: "🐉", rarity: "legendary" },
  { id: "potion_master", title: "Potion Master", description: "Craft 5 potions", icon: "🧪", rarity: "rare" },
  { id: "spell_caster_10", title: "Arcane Adept", description: "Cast 10 spells", icon: "🔮", rarity: "uncommon" },
  { id: "trap_disarmer", title: "Nimble Fingers", description: "Disarm 3 traps", icon: "🪤", rarity: "rare" },
  { id: "puzzle_solver", title: "Riddle Master", description: "Solve 3 puzzles", icon: "🧩", rarity: "rare" },
  { id: "moral_hero", title: "Paragon of Light", description: "Reach moral score of 90+", icon: "😇", rarity: "epic" },
  { id: "moral_villain", title: "Lord of Shadows", description: "Drop moral score below 15", icon: "😈", rarity: "epic" },
  { id: "death_cheat", title: "Cheated Death", description: "Survive 3 death save encounters", icon: "☠️", rarity: "epic" },
];

const RARITY_STYLES: Record<string, string> = {
  common: "border-muted-foreground/30 bg-muted/10",
  uncommon: "border-accent/30 bg-accent/5",
  rare: "border-primary/30 bg-primary/5",
  epic: "border-purple-500/30 bg-purple-500/5",
  legendary: "border-yellow-500/30 bg-yellow-500/5",
};

const RARITY_TEXT: Record<string, string> = {
  common: "text-muted-foreground",
  uncommon: "text-accent",
  rare: "text-primary",
  epic: "text-purple-400",
  legendary: "text-yellow-500",
};

const AchievementsSidebar = ({ characterId }: AchievementsSidebarProps) => {
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);
  const [open, setOpen] = useState(false);

  const fetchAchievements = useCallback(async () => {
    if (!characterId) return;
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .eq("character_id", characterId)
      .order("unlocked_at", { ascending: false });
    if (data) setUnlocked(data as Achievement[]);
  }, [characterId]);

  useEffect(() => {
    if (open) fetchAchievements();
  }, [open, fetchAchievements]);

  const unlockedIds = new Set(unlocked.map(a => a.achievement_id));
  const locked = ACHIEVEMENT_DEFS.filter(d => !unlockedIds.has(d.id));
  const progress = Math.round((unlocked.length / ACHIEVEMENT_DEFS.length) * 100);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card/50 text-muted-foreground transition hover:border-primary/30 hover:text-primary">
          <Trophy className="h-5 w-5" />
          {unlocked.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
              {unlocked.length}
            </span>
          )}
        </motion.button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] sm:w-[440px] bg-background/95 backdrop-blur-xl border-border p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <SheetHeader>
            <SheetTitle className="font-display text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" /> Achievements
            </SheetTitle>
          </SheetHeader>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{unlocked.length} / {ACHIEVEMENT_DEFS.length} unlocked</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-fantasy" style={{ maxHeight: "calc(100vh - 160px)" }}>
          {/* Unlocked */}
          {unlocked.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Star className="h-3 w-3" /> Unlocked
              </h3>
              <div className="space-y-2 mb-6">
                {unlocked.map((a, i) => {
                  const def = ACHIEVEMENT_DEFS.find(d => d.id === a.achievement_id);
                  const r = def?.rarity || "common";
                  return (
                    <motion.div key={a.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${RARITY_STYLES[r]}`}>
                      <span className="text-2xl">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground">{a.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-medium uppercase tracking-wider ${RARITY_TEXT[r]}`}>{r}</span>
                          <span className="text-[9px] text-muted-foreground/50">
                            {new Date(a.unlocked_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* Locked */}
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Lock className="h-3 w-3" /> Locked
          </h3>
          <div className="space-y-2">
            {locked.map((def) => (
              <div key={def.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/5 px-4 py-3 opacity-50">
                <span className="text-2xl grayscale">🔒</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground truncate">{def.title}</p>
                  <p className="text-[10px] text-muted-foreground/60">{def.description}</p>
                  <span className={`text-[9px] font-medium uppercase tracking-wider ${RARITY_TEXT[def.rarity]}`}>{def.rarity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Achievement checker utility - call after game events
export async function checkAndUnlockAchievement(characterId: string, achievementId: string) {
  const def = ACHIEVEMENT_DEFS.find(d => d.id === achievementId);
  if (!def) return false;

  const { data: existing } = await supabase
    .from("achievements")
    .select("id")
    .eq("character_id", characterId)
    .eq("achievement_id", achievementId)
    .maybeSingle();

  if (existing) return false; // Already unlocked

  const { error } = await supabase.from("achievements").insert({
    character_id: characterId,
    achievement_id: def.id,
    title: def.title,
    description: def.description,
    icon: def.icon,
    rarity: def.rarity,
  });

  return !error;
}

export default AchievementsSidebar;
