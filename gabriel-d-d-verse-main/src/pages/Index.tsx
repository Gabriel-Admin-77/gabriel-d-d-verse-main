import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CharacterBar from "@/components/game/CharacterBar";
import DeathOverlay from "@/components/game/DeathOverlay";
import DeathSavesOverlay from "@/components/game/DeathSavesOverlay";
import WorldMap from "@/components/game/WorldMap";
import NarrativeChat, { NarrativeChatRef } from "@/components/game/NarrativeChat";
import ShopSidebar from "@/components/game/ShopSidebar";
import CombatTracker from "@/components/game/CombatTracker";
import InventorySidebar from "@/components/game/InventorySidebar";
import JournalSidebar from "@/components/game/JournalSidebar";
import QuestLogSidebar from "@/components/game/QuestLogSidebar";
import BestiarySidebar from "@/components/game/BestiarySidebar";
import AchievementsSidebar, { checkAndUnlockAchievement } from "@/components/game/AchievementsSidebar";
import SpellBookSidebar from "@/components/game/SpellBookSidebar";
import TrapPuzzleOverlay from "@/components/game/TrapPuzzleOverlay";
import NpcReputationSidebar from "@/components/game/NpcReputationSidebar";
import AdventurePicker from "@/components/game/AdventurePicker";
import ThemeToggle from "@/components/game/ThemeToggle";
import MobileNav from "@/components/game/MobileNav";
import SaveLoadPanel from "@/components/game/SaveLoadPanel";
import LevelUpOverlay from "@/components/game/LevelUpOverlay";
import RewardAnimations, { useRewardAnimations } from "@/components/game/RewardAnimations";
import AdventureRecap from "@/components/game/AdventureRecap";
import StatusEffectsBar from "@/components/game/StatusEffectsBar";
import RestPanel from "@/components/game/RestPanel";
import TavernPanel from "@/components/game/TavernPanel";
import SkillCheckOverlay from "@/components/game/SkillCheckOverlay";
import RandomEncounterOverlay from "@/components/game/RandomEncounterOverlay";
import WorldEventOverlay, { WorldEventBanner } from "@/components/game/WorldEventOverlay";
import { type ActiveWorldEvent, rollWorldEvent, tickWorldEvents, getActiveEffects, buildWorldEventContext } from "@/lib/worldEvents";
import { STATUS_EFFECTS } from "@/lib/statusEffects";
import { Character, ChatMessage } from "@/lib/gameTypes";
import { Adventure, ADVENTURES } from "@/lib/adventures";
import { XP_THRESHOLDS, MAX_LEVEL, CLASS_ABILITIES, getLevelUpBonuses } from "@/lib/progression";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { LogOut, Plus, Loader2, Sparkles, Map, Volume2, VolumeX, Users, Save } from "lucide-react";
import Footer from "@/components/Footer";
import { toast } from "sonner";

// Parse rewards and damage from DM response
function parseRewards(content: string) {
  const xpMatch = content.match(/\[XP_REWARD\]\s*(\d+)/i);
  const goldMatch = content.match(/\[GOLD_REWARD\]\s*(\d+)/i);
  const lootMatches = [...content.matchAll(/\[LOOT_DROP\]\s*(\S+)\s+(.+)/gi)];
  const damageMatch = content.match(/\[HP_DAMAGE\]\s*(\d+)/i);
  
  let xp = xpMatch ? parseInt(xpMatch[1]) : 0;
  const gold = goldMatch ? parseInt(goldMatch[1]) : 0;
  const loot = lootMatches.map(m => ({ icon: m[1], name: m[2].trim() }));
  const damage = damageMatch ? parseInt(damageMatch[1]) : 0;

  // Fallback: if DM forgot rewards, grant minimum XP so progression never stalls
  if (xp === 0 && gold === 0 && loot.length === 0) {
    xp = 15; // minimum XP per action
  }

  return { xp, gold, loot, damage };
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<any | null>(null);
  const [loadingChar, setLoadingChar] = useState(true);
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const [showAdventurePicker, setShowAdventurePicker] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [pendingLevel, setPendingLevel] = useState(0);
  const [showDeath, setShowDeath] = useState(false);
  const [showDeathSaves, setShowDeathSaves] = useState(false);
  const [deathPenalties, setDeathPenalties] = useState({ xpLost: 0, goldLost: 0 });
  const [damageFlash, setDamageFlash] = useState(false);
  const [puzzleActive, setPuzzleActive] = useState(false);
  const [puzzleType, setPuzzleType] = useState<"lockpick" | "riddle" | "trap">("lockpick");
  const [puzzleDC, setPuzzleDC] = useState(12);
  const rewardAnims = useRewardAnimations();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [encounterTrigger, setEncounterTrigger] = useState(0);
  const [activeWorldEvents, setActiveWorldEvents] = useState<ActiveWorldEvent[]>([]);
  const [pendingWorldEvent, setPendingWorldEvent] = useState<ActiveWorldEvent | null>(null);
  const handleMessagesChange = useCallback((msgs: ChatMessage[]) => setChatMessages(msgs), []);
  const chatRef = useRef<NarrativeChatRef>(null);
  const ambient = useAmbientAudio(selectedAdventure?.id ?? null);
  const recap = AdventureRecap({
    characterId: character?.id ?? null,
    characterName: character?.name ?? null,
    adventureTitle: selectedAdventure?.title ?? null,
    chatMessages,
    onDismiss: () => {},
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const fetchCharacter = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("characters").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) { toast.error("Error loading character"); console.error(error); }
    setCharacter(data);
    setLoadingChar(false);
  }, [user]);

  useEffect(() => { fetchCharacter(); }, [fetchCharacter]);

  // Process rewards from DM messages
  const handleDmRewards = useCallback(async (content: string) => {
    if (!character) return;
    const rewards = parseRewards(content);

    const updates: any = {};

    // --- HP Damage ---
    if (rewards.damage > 0) {
      const newHp = Math.max(0, (character.hp_current || 0) - rewards.damage);
      updates.hp_current = newHp;
      toast.error(`💔 You took ${rewards.damage} damage!`, { duration: 3000 });
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 600);

      // Death check — trigger death saves instead of instant death
      if (newHp <= 0) {
        updates.hp_current = 0;
        await supabase.from("characters").update(updates).eq("id", character.id);
        setShowDeathSaves(true);
        fetchCharacter();
        return; // skip normal reward processing on death
      }
    }

    // --- Rewards ---
    // Apply world event modifiers
    const worldFx = getActiveEffects(activeWorldEvents);
    const modifiedXp = Math.round(rewards.xp * (worldFx.xpModifier ?? 1));
    const modifiedGold = Math.round(rewards.gold * (worldFx.goldModifier ?? 1));
    
    if (modifiedXp === 0 && modifiedGold === 0 && rewards.loot.length === 0 && rewards.damage === 0) return;

    // Apply heal/damage over time from world events
    if (worldFx.healOverTime && worldFx.healOverTime > 0 && !('hp_current' in updates)) {
      updates.hp_current = Math.min(character.hp_max, (character.hp_current || 0) + worldFx.healOverTime);
    }
    if (worldFx.damageOverTime && worldFx.damageOverTime > 0 && !('hp_current' in updates)) {
      updates.hp_current = Math.max(1, (character.hp_current || 0) - worldFx.damageOverTime);
    }

    let newXp = (character.xp || 0) + modifiedXp;
    let newLevel = character.level;
    let newXpToNext = character.xp_to_next || XP_THRESHOLDS[character.level] || 300;

    // Check for level up
    while (newXp >= newXpToNext && newLevel < MAX_LEVEL) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = XP_THRESHOLDS[newLevel] || 85000;
    }

    updates.xp = updates.xp ?? newXp;
    if (!('xp' in updates && rewards.damage > 0)) updates.xp = newXp;
    updates.xp_to_next = newXpToNext;

    if (modifiedGold > 0) {
      updates.gold = (character.gold || 0) + modifiedGold;
    }

    if (newLevel > character.level) {
      updates.level = newLevel;
      const bonuses = getLevelUpBonuses(newLevel);
      updates.hp_max = character.hp_max + bonuses.hp;
      updates.hp_current = character.hp_max + bonuses.hp; // Full heal on level up
      setPendingLevel(newLevel);
      setShowLevelUp(true);

      // Level achievements
      if (newLevel >= 5) checkAndUnlockAchievement(character.id, "level_5");
      if (newLevel >= 10) checkAndUnlockAchievement(character.id, "level_10");
    }

    await supabase.from("characters").update(updates).eq("id", character.id);

    // Add loot to inventory
    for (const loot of rewards.loot) {
      await supabase.from("character_inventory").insert({
        character_id: character.id,
        item_name: loot.name,
        item_type: "loot",
        item_icon: loot.icon,
        quantity: 1,
      });
    }

    // Show reward toasts + animations
    if (modifiedXp > 0) {
      const bonusLabel = modifiedXp !== rewards.xp ? ` (${rewards.xp} base)` : "";
      toast.success(`+${modifiedXp} XP gained!${bonusLabel}`, { duration: 3000 });
      rewardAnims.triggerXP(modifiedXp);
    }
    if (modifiedGold > 0) {
      const bonusLabel = modifiedGold !== rewards.gold ? ` (${rewards.gold} base)` : "";
      toast.success(`+${modifiedGold} gold found!${bonusLabel}`, { duration: 3000 });
      rewardAnims.triggerGold(modifiedGold);
    }
    rewards.loot.forEach(l => {
      toast.success(`${l.icon} Loot: ${l.name}`, { duration: 4000 });
      rewardAnims.triggerLoot(l.icon, l.name);
    });

    // Dynamic ambient mood based on content
    if (ambient.isPlaying) {
      const lower = content.toLowerCase();
      if (/combat|attack|fight|battle|sword|strike|blood|wound|damage/i.test(lower)) {
        ambient.setSceneMood("combat");
      } else if (/ghost|shadow|mystery|puzzle|riddle|strange|dark|whisper/i.test(lower)) {
        ambient.setSceneMood("mystery");
      } else if (/rest|camp|tavern|inn|sleep|heal|safe/i.test(lower)) {
        ambient.setSceneMood("rest");
      } else {
        ambient.setSceneMood("exploration");
      }
    }

    // Refresh character data
    fetchCharacter();
  }, [character, fetchCharacter, ambient, activeWorldEvents]);

  // Monster encounter handler — add to bestiary
  const handleMonsterEncounter = useCallback(async (monster: { id: string; name: string; hp: number; maxHp: number; ac: number; cr: string }) => {
    if (!character?.id) return;
    const { data: existing } = await supabase
      .from("bestiary_entries")
      .select("id, times_encountered")
      .eq("character_id", character.id)
      .eq("monster_id", monster.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("bestiary_entries").update({
        times_encountered: existing.times_encountered + 1,
        last_seen_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("bestiary_entries").insert({
        character_id: character.id,
        monster_id: monster.id,
        monster_name: monster.name,
        hp: monster.hp,
        max_hp: monster.maxHp,
        ac: monster.ac,
        cr: monster.cr,
      });
      toast.success(`📖 New bestiary entry: ${monster.name}`, { duration: 3000 });

      // Check bestiary achievement
      const { count } = await supabase
        .from("bestiary_entries")
        .select("id", { count: "exact", head: true })
        .eq("character_id", character.id);
      if (count && count >= 5) {
        const unlocked = await checkAndUnlockAchievement(character.id, "bestiary_5");
        if (unlocked) toast.success("🏆 Achievement: Monster Scholar!", { duration: 4000 });
      }
    }
  }, [character?.id]);

  // Monster defeated handler
  const handleMonsterDefeated = useCallback(async (monsterId: string) => {
    if (!character?.id) return;
    const { data: entry } = await supabase
      .from("bestiary_entries")
      .select("id, times_defeated, monster_name, cr")
      .eq("character_id", character.id)
      .eq("monster_id", monsterId)
      .maybeSingle();

    if (entry) {
      await supabase.from("bestiary_entries").update({
        times_defeated: entry.times_defeated + 1,
      }).eq("id", entry.id);

      // Check first blood achievement
      if (entry.times_defeated === 0) {
        const unlocked = await checkAndUnlockAchievement(character.id, "first_blood");
        if (unlocked) toast.success("🏆 Achievement: First Blood!", { duration: 4000 });
      }

      // Dragon slayer
      if (monsterId.includes("dragon")) {
        const unlocked = await checkAndUnlockAchievement(character.id, "dragon_slayer");
        if (unlocked) toast.success("🏆 Achievement: Dragon Slayer!", { duration: 5000 });
      }

      // Monster slayer 10
      const { data: allEntries } = await supabase
        .from("bestiary_entries")
        .select("times_defeated")
        .eq("character_id", character.id);
      const totalKills = allEntries?.reduce((s, e) => s + (e.times_defeated || 0), 0) || 0;
      if (totalKills >= 10) {
        const unlocked = await checkAndUnlockAchievement(character.id, "monster_slayer_10");
        if (unlocked) toast.success("🏆 Achievement: Monster Slayer!", { duration: 4000 });
      }
    }
  }, [character?.id]);

  // Puzzle trigger handler
  const handlePuzzleTrigger = useCallback((type: "lockpick" | "riddle" | "trap", dc: number) => {
    setPuzzleType(type);
    setPuzzleDC(dc);
    setPuzzleActive(true);
  }, []);

  // NPC reputation handler
  const handleNpcInteraction = useCallback(async (npc: { id: string; name: string; repChange: number; summary: string }) => {
    if (!character?.id) return;
    const { data: existing } = await supabase
      .from("npc_reputation")
      .select("id, reputation, interactions")
      .eq("character_id", character.id)
      .eq("npc_id", npc.id)
      .maybeSingle();

    if (existing) {
      const newRep = Math.max(-100, Math.min(100, (existing.reputation || 0) + npc.repChange));
      const disp = newRep <= -50 ? "hostile" : newRep <= -20 ? "unfriendly" : newRep < 20 ? "neutral" : newRep < 50 ? "friendly" : newRep < 80 ? "allied" : "devoted";
      await supabase.from("npc_reputation").update({
        reputation: newRep,
        disposition: disp,
        interactions: (existing.interactions || 1) + 1,
        last_interaction: npc.summary,
        last_met_at: new Date().toISOString(),
      }).eq("id", existing.id);

      if (npc.repChange > 0) {
        toast.success(`${npc.name}: +${npc.repChange} reputation`, { duration: 2500 });
      } else if (npc.repChange < 0) {
        toast.error(`${npc.name}: ${npc.repChange} reputation`, { duration: 2500 });
      }
    } else {
      const initRep = Math.max(-100, Math.min(100, npc.repChange));
      const disp = initRep <= -50 ? "hostile" : initRep <= -20 ? "unfriendly" : initRep < 20 ? "neutral" : initRep < 50 ? "friendly" : initRep < 80 ? "allied" : "devoted";
      await supabase.from("npc_reputation").insert({
        character_id: character.id,
        npc_id: npc.id,
        npc_name: npc.name,
        reputation: initRep,
        disposition: disp,
        last_interaction: npc.summary,
      });
      toast.success(`📋 New NPC met: ${npc.name}`, { duration: 3000 });
    }
  }, [character?.id]);

  // Status effect handler
  const handleStatusEffect = useCallback(async (effectId: string, duration: number) => {
    if (!character?.id) return;
    const def = STATUS_EFFECTS[effectId];
    if (!def) return;

    // Check if effect already exists
    const { data: existing } = await supabase
      .from("character_status_effects")
      .select("id")
      .eq("character_id", character.id)
      .eq("effect_name", effectId)
      .maybeSingle();

    if (existing) {
      // Refresh duration
      await supabase.from("character_status_effects").update({ turns_remaining: duration }).eq("id", existing.id);
    } else {
      await supabase.from("character_status_effects").insert({
        character_id: character.id,
        effect_name: effectId,
        effect_type: def.type,
        icon: def.icon,
        duration_turns: duration,
        turns_remaining: duration,
        damage_per_turn: def.damagePerTurn,
        heal_per_turn: def.healPerTurn,
        stat_modifier: def.statModifier,
      });
    }

    const emoji = def.type === "buff" ? "✨" : "⚠️";
    toast[def.type === "buff" ? "success" : "error"](`${emoji} ${def.name} applied! (${duration} turns)`, { duration: 3000 });
  }, [character?.id]);

  // Random encounter handler
  const handleEncounterStart = useCallback(async (encounter: any) => {
    if (!character?.id) return;
    // Send encounter to chat as context
    toast.info(`⚔️ ${encounter.name}!`, { duration: 3000 });
    // Trigger monster encounter if applicable
    if (encounter.monsterId) {
      handleMonsterEncounter({
        id: encounter.monsterId,
        name: encounter.name,
        hp: 30,
        maxHp: 30,
        ac: 13,
        cr: "1",
      });
    }
  }, [character?.id, handleMonsterEncounter]);

  // Recipe discovery handler
  const handleRecipeDiscover = useCallback(async (recipe: { id: string; name: string; ingredients: string[]; skill: string; dc: number; icon: string }) => {
    toast.success(`📜 Recipe discovered: ${recipe.icon} ${recipe.name}!`, { duration: 4000 });
  }, []);

  const handlePuzzleSuccess = useCallback(async () => {
    setPuzzleActive(false);
    toast.success("🎉 Puzzle solved! +50 XP", { duration: 3000 });
    if (character?.id) {
      await supabase.from("characters").update({ xp: (character.xp || 0) + 50 }).eq("id", character.id);
      // Check achievements
      const typeAchievement = puzzleType === "lockpick" || puzzleType === "trap" ? "trap_disarmer" : "puzzle_solver";
      await checkAndUnlockAchievement(character.id, typeAchievement);
      fetchCharacter();
    }
  }, [character, fetchCharacter, puzzleType]);

  const handlePuzzleFailure = useCallback(async () => {
    setPuzzleActive(false);
    if (puzzleType === "trap" && character?.id) {
      const dmg = 5 + Math.floor(Math.random() * 10);
      await supabase.from("characters").update({
        hp_current: Math.max(0, (character.hp_current || 0) - dmg),
      }).eq("id", character.id);
      toast.error(`💥 Trap sprung! You take ${dmg} damage!`, { duration: 3000 });
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 600);
      fetchCharacter();
    } else {
      toast.error("Failed... perhaps another approach?", { duration: 3000 });
    }
  }, [character, fetchCharacter, puzzleType]);

  const handleLevelUpApply = async (statChoice: string | null) => {
    if (!character || !statChoice) return;
    const updates: any = {};
    updates[statChoice] = (character[statChoice] || 10) + 1;
    await supabase.from("characters").update(updates).eq("id", character.id);

    // Unlock ability
    const newAbility = CLASS_ABILITIES[character.class]?.find(a => a.level === pendingLevel);
    if (newAbility) {
      await supabase.from("character_abilities" as any).insert({
        character_id: character.id,
        name: newAbility.name,
        description: newAbility.description,
        ability_type: newAbility.type,
        unlocked_at_level: newAbility.level,
      } as any);
    }

    fetchCharacter();
  };

  const handleRespawn = useCallback(async () => {
    if (!character) return;
    const respawnHp = Math.max(1, Math.floor(character.hp_max / 2));
    await supabase.from("characters").update({ hp_current: respawnHp }).eq("id", character.id);
    setShowDeath(false);
    toast.success(`${character.name} rises again with ${respawnHp} HP!`, { duration: 4000 });
    fetchCharacter();
  }, [character, fetchCharacter]);

  // Death saves handlers
  const handleDeathSaveStabilize = useCallback(async () => {
    if (!character) return;
    const respawnHp = Math.max(1, Math.floor(character.hp_max / 4));
    await supabase.from("characters").update({ hp_current: respawnHp }).eq("id", character.id);
    setShowDeathSaves(false);
    toast.success(`${character.name} stabilizes with ${respawnHp} HP!`, { duration: 4000 });
    await checkAndUnlockAchievement(character.id, "survivor");
    fetchCharacter();
  }, [character, fetchCharacter]);

  const handleDeathSaveFail = useCallback(async () => {
    if (!character) return;
    const xpPenalty = Math.floor((character.xp || 0) * 0.1);
    const goldPenalty = Math.floor((character.gold || 0) * 0.15);
    await supabase.from("characters").update({
      hp_current: 0,
      xp: Math.max(0, (character.xp || 0) - xpPenalty),
      gold: Math.max(0, (character.gold || 0) - goldPenalty),
    }).eq("id", character.id);
    setShowDeathSaves(false);
    setDeathPenalties({ xpLost: xpPenalty, goldLost: goldPenalty });
    setShowDeath(true);
    fetchCharacter();
  }, [character, fetchCharacter]);

  const handleLoadSave = (adventureId: string) => {
    const adv = ADVENTURES.find(a => a.id === adventureId) || null;
    setSelectedAdventure(adv);
    if (adv) ambient.startSoundscape(adv.id);
    // Trigger adventure recap after messages have loaded (poll for up to 5s)
    const startTime = Date.now();
    const pollForMessages = () => {
      // chatMessages updates async via NarrativeChat onMessagesChange
      // Use a longer delay to let the messages load from DB
      if (Date.now() - startTime > 5000) {
        recap.generateRecap(); // try anyway with whatever we have
        return;
      }
      setTimeout(pollForMessages, 800);
    };
    setTimeout(() => recap.generateRecap(), 2000);
  };

  if (authLoading || loadingChar) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  const charForBar: Character | null = character ? {
    name: character.name, class: character.class, level: character.level,
    hp: { current: character.hp_current, max: character.hp_max }, ac: character.ac,
    stats: { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha },
    moralScore: character.moral_score,
    portraitUrl: character.portrait_url,
  } : null;

  return (
    <div className={`flex min-h-screen flex-col bg-background cursor-quill ${damageFlash ? 'animate-damage-shake' : ''}`}>
      {/* Damage red flash vignette */}
      {damageFlash && (
        <div className="fixed inset-0 z-[100] pointer-events-none animate-damage-flash"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, hsl(0 80% 40% / 0.6) 100%)' }}
        />
      )}
      <RewardAnimations events={rewardAnims.events} onClear={rewardAnims.clearEvent} />
      {/* Header */}
      <header className="relative border-b border-border bg-card/50 backdrop-blur-md torn-edge-bottom">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full btn-wax animate-candle">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-gold-glow" />
            </div>
            <div>
              <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="font-display text-base sm:text-xl font-semibold text-gold-glow">The Sovereign Grimoire</motion.h1>
              <p className="hidden sm:block text-[11px] text-muted-foreground">AI-Powered Dungeon Master</p>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-2">
            {selectedAdventure && (
              <div className="flex items-center gap-2 mr-2">
                <motion.button
                  onClick={() => {
                    if (ambient.isPlaying) ambient.toggle();
                    else ambient.startSoundscape(selectedAdventure.id);
                  }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`relative flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    ambient.isPlaying
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}>
                  {ambient.isPlaying ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  <span className="hidden xl:inline">{ambient.getSoundscapeLabel(selectedAdventure.id)}</span>
                  {ambient.isPlaying && (
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="flex gap-0.5 ml-1">
                      {[1, 2, 3].map(i => (
                        <motion.span key={i} animate={{ scaleY: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          className="w-0.5 h-3 bg-primary rounded-full origin-bottom" />
                      ))}
                    </motion.span>
                  )}
                </motion.button>
                {ambient.isPlaying && (
                  <input type="range" min={0} max={1} step={0.05} value={ambient.volume}
                    onChange={(e) => ambient.setVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 accent-primary cursor-pointer" />
                )}
              </div>
            )}
            <motion.button onClick={() => setShowSaveLoad(true)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-ink flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-ui font-medium transition">
              <Save className="h-4 w-4" /> Save/Load
            </motion.button>
            <motion.button onClick={() => navigate("/lobby")}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-wax flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-ui font-semibold transition">
              <Users className="h-4 w-4" /> Multiplayer
            </motion.button>
            <motion.button onClick={() => setShowAdventurePicker(true)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-ink flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-ui font-medium transition">
              <Map className="h-4 w-4" />
              {selectedAdventure ? selectedAdventure.title : "Choose Adventure"}
            </motion.button>
            <motion.button onClick={() => navigate("/create-character")}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-ink flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-ui font-medium text-primary transition">
              <Plus className="h-4 w-4" /> New Character
            </motion.button>
            <ThemeToggle />
            <button onClick={signOut}
              className="btn-ink flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile nav */}
          <div className="flex items-center gap-2 lg:hidden">
            <motion.button onClick={() => setShowSaveLoad(true)} whileTap={{ scale: 0.95 }}
              className="btn-ink rounded-lg p-2">
              <Save className="h-4 w-4" />
            </motion.button>
            <MobileNav
              onAdventurePick={() => setShowAdventurePicker(true)}
              onNewCharacter={() => navigate("/create-character")}
              onMultiplayer={() => navigate("/lobby")}
              onSignOut={signOut}
              adventureTitle={selectedAdventure?.title}
            />
          </div>
        </div>
      </header>

      {charForBar ? (
        <CharacterBar character={charForBar} xp={character?.xp || 0} xpToNext={character?.xp_to_next || 300} rawCharacter={character} characterId={character?.id} />
      ) : (
        <div className="border-b border-border bg-card/30 px-4 sm:px-6 py-4 sm:py-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">You don't have a character yet.</p>
          <motion.button onClick={() => navigate("/create-character")}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 hover:shadow-gold">
            Create Your First Character
          </motion.button>
        </div>
      )}

      {/* Modals */}
      {showAdventurePicker && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAdventurePicker(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-hidden">
            <AdventurePicker
              selectedId={selectedAdventure?.id}
              onSelect={(adventure) => {
                setSelectedAdventure(adventure);
                setShowAdventurePicker(false);
                ambient.startSoundscape(adventure.id);
                toast.success(`Adventure selected: ${adventure.title}`);
              }}
            />
          </motion.div>
        </motion.div>
      )}

      <SaveLoadPanel
        open={showSaveLoad}
        onClose={() => setShowSaveLoad(false)}
        characterId={character?.id ?? null}
        characterName={character?.name ?? null}
        adventureId={selectedAdventure?.id ?? null}
        adventureTitle={selectedAdventure?.title ?? null}
        onLoad={handleLoadSave}
      />

      <LevelUpOverlay
        open={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        newLevel={pendingLevel}
        characterClass={character?.class || "Fighter"}
        onApply={handleLevelUpApply}
      />

      <DeathOverlay
        open={showDeath}
        characterName={character?.name || "Adventurer"}
        characterLevel={character?.level || 1}
        xpLost={deathPenalties.xpLost}
        goldLost={deathPenalties.goldLost}
        onRespawn={handleRespawn}
      />

      <DeathSavesOverlay
        open={showDeathSaves}
        characterName={character?.name || "Adventurer"}
        onStabilize={handleDeathSaveStabilize}
        onDeath={handleDeathSaveFail}
      />

      <recap.RecapOverlay />

      <TrapPuzzleOverlay
        active={puzzleActive}
        type={puzzleType}
        difficulty={puzzleDC}
        characterDex={character?.dex || 10}
        characterInt={character?.int || 10}
        characterWis={character?.wis || 10}
        onSuccess={handlePuzzleSuccess}
        onFailure={handlePuzzleFailure}
        onClose={() => setPuzzleActive(false)}
      />

      <RandomEncounterOverlay
        adventureId={selectedAdventure?.id ?? null}
        trigger={encounterTrigger}
        onEncounterStart={handleEncounterStart}
      />

      <WorldEventOverlay
        event={pendingWorldEvent}
        onDismiss={() => setPendingWorldEvent(null)}
      />

      <div className="flex flex-1 flex-col">
        {/* World Event Banner */}
        {activeWorldEvents.length > 0 && (
          <div className="border-b border-border bg-card/30 px-4 py-1.5 flex justify-center">
            <WorldEventBanner events={activeWorldEvents} />
          </div>
        )}
        <div className="flex-1" style={{ minHeight: "400px" }}>
          <NarrativeChat
            ref={chatRef}
            characterId={character?.id ?? null}
            character={character}
            adventure={selectedAdventure}
            worldEventContext={buildWorldEventContext(activeWorldEvents)}
            onMessagesChange={handleMessagesChange}
            onDmResponse={(content) => {
              handleDmRewards(content);
              setEncounterTrigger(prev => prev + 1);
              // Tick and roll world events
              setActiveWorldEvents(prev => {
                const ticked = tickWorldEvents(prev);
                const expiredCount = prev.length - ticked.length;
                if (expiredCount > 0) {
                  prev.filter(e => e.turnsRemaining <= 1).forEach(e =>
                    toast.info(`${e.icon} "${e.title}" has ended.`, { duration: 3000 })
                  );
                }
                const newEvent = rollWorldEvent(ticked[0]?.id);
                if (newEvent) {
                  const active: ActiveWorldEvent = { ...newEvent, turnsRemaining: newEvent.duration, startedAt: Date.now() };
                  setPendingWorldEvent(active);
                  return [...ticked, active];
                }
                return ticked;
              });
            }}
            onMonsterEncounter={handleMonsterEncounter}
            onMonsterDefeated={handleMonsterDefeated}
            onPuzzleTrigger={handlePuzzleTrigger}
            onNpcInteraction={handleNpcInteraction}
            onStatusEffect={handleStatusEffect}
            onRecipeDiscover={handleRecipeDiscover}
          />
        </div>

        <div className="border-t border-border bg-card/30 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <QuestLogSidebar characterId={character?.id} adventureId={selectedAdventure?.id ?? null} />
          <InventorySidebar
            characterId={character?.id}
            characterLevel={character?.level || 1}
            characterGold={character?.gold || 0}
            characterHpCurrent={character?.hp_current || 0}
            characterHpMax={character?.hp_max || 1}
            onGoldChange={() => fetchCharacter()}
            onHeal={() => fetchCharacter()}
          />
          <TavernPanel
            characterId={character?.id}
            character={character}
            adventure={selectedAdventure}
            onSelectRumor={(choice) => {
              if (chatRef.current) {
                chatRef.current.sendMessage(`[PURSUE RUMOR] ${choice}`);
              }
            }}
          />
          <ShopSidebar
            characterId={character?.id ?? null}
            characterLevel={character?.level || 1}
            characterGold={character?.gold || 0}
            onPurchase={() => fetchCharacter()}
          />
          <RestPanel
            characterId={character?.id}
            hpCurrent={character?.hp_current || 0}
            hpMax={character?.hp_max || 1}
            characterLevel={character?.level || 1}
            onRest={() => fetchCharacter()}
          />
          <SkillCheckOverlay
            characterStats={{
              str: character?.str || 10, dex: character?.dex || 10,
              con: character?.con || 10, int: character?.int || 10,
              wis: character?.wis || 10, cha: character?.cha || 10,
            }}
            characterLevel={character?.level || 1}
          />
          <WorldMap adventure={selectedAdventure} chatMessages={chatMessages} />
          <SpellBookSidebar
            characterId={character?.id}
            characterClass={character?.class || "Fighter"}
            characterLevel={character?.level || 1}
          />
          <BestiarySidebar characterId={character?.id} />
          <NpcReputationSidebar characterId={character?.id} />
          <AchievementsSidebar characterId={character?.id} />
          <JournalSidebar
            messages={chatMessages}
            characterName={character?.name}
            adventureTitle={selectedAdventure?.title}
          />
          <CombatTracker />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
