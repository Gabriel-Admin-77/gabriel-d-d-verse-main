import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dices, Shield, Heart, Swords, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DiceRollOverlay from "@/components/game/DiceRollOverlay";
import { useDiceAudio } from "@/hooks/useDiceAudio";
import { CLASS_IMAGES } from "@/lib/classImages";

const PORTRAIT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/character-portrait`;

const CLASSES = [
  { id: "Barbarian", label: "Barbarian", desc: "Primal fury & rage" },
  { id: "Bard", label: "Bard", desc: "Music & magic" },
  { id: "Cleric", label: "Cleric", desc: "Divine healer" },
  { id: "Druid", label: "Druid", desc: "Nature shapeshifter" },
  { id: "Fighter", label: "Fighter", desc: "Combat master" },
  { id: "Monk", label: "Monk", desc: "Martial artist" },
  { id: "Paladin", label: "Paladin", desc: "Holy warrior" },
  { id: "Ranger", label: "Ranger", desc: "Nature hunter" },
  { id: "Rogue", label: "Rogue", desc: "Stealth & cunning" },
  { id: "Sorcerer", label: "Sorcerer", desc: "Innate magic" },
  { id: "Warlock", label: "Warlock", desc: "Pact magic" },
  { id: "Wizard", label: "Wizard", desc: "Arcane scholar" },
];

const rollStat = () => {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
};

const rollAllStats = () => ({
  str: rollStat(), dex: rollStat(), con: rollStat(),
  int: rollStat(), wis: rollStat(), cha: rollStat(),
});

const calcModifier = (val: number) => Math.floor((val - 10) / 2);
const calcHp = (cls: string, con: number) => {
  const base: Record<string, number> = {
    Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8, Fighter: 10, Monk: 8,
    Paladin: 10, Ranger: 10, Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6,
  };
  return (base[cls] || 8) + calcModifier(con);
};
const calcAc = (cls: string, dex: number) => {
  const base: Record<string, number> = {
    Barbarian: 10, Bard: 11, Cleric: 14, Druid: 11, Fighter: 16, Monk: 10,
    Paladin: 16, Ranger: 14, Rogue: 12, Sorcerer: 10, Warlock: 11, Wizard: 10,
  };
  const maxDexBonus = ["Barbarian", "Monk"].includes(cls) ? 99 : 2;
  return (base[cls] || 10) + Math.min(calcModifier(dex), maxDexBonus);
};

const getStatTotal = (stats: ReturnType<typeof rollAllStats>) =>
  stats.str + stats.dex + stats.con + stats.int + stats.wis + stats.cha;

const CreateCharacter = () => {
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [stats, setStats] = useState(rollAllStats());
  const [loading, setLoading] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [rollSuccess, setRollSuccess] = useState<boolean | null>(null);
  const [rollCritical, setRollCritical] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { playRoll, playSuccess, playFailure, playCriticalSuccess, playCriticalFailure } = useDiceAudio();

  const handleRoll = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    playRoll();
    setTimeout(() => {
      const newStats = rollAllStats();
      const total = getStatTotal(newStats);
      const success = total >= 70;
      const critical = total >= 85 || total <= 45;
      setStats(newStats);
      setRollResult(total);
      setRollSuccess(success);
      setRollCritical(critical);
      setTimeout(() => {
        if (success) { critical ? playCriticalSuccess() : playSuccess(); }
        else { critical ? playCriticalFailure() : playFailure(); }
      }, 100);
    }, 500);
  }, [isRolling, playRoll, playSuccess, playFailure, playCriticalSuccess, playCriticalFailure]);

  const handleRollComplete = useCallback(() => {
    setIsRolling(false);
    setRollResult(null);
    setRollSuccess(null);
    setRollCritical(false);
  }, []);

  const generatePortrait = useCallback(async () => {
    if (!name.trim() || !selectedClass) {
      toast.error("Enter a name and choose a class first");
      return;
    }
    setGeneratingPortrait(true);
    setPortraitUrl(null);
    try {
      const resp = await fetch(PORTRAIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), characterClass: selectedClass }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Portrait generation failed");
      }
      const data = await resp.json();
      if (data.imageUrl) {
        setPortraitUrl(data.imageUrl);
        toast.success("Portrait generated!");
      } else {
        throw new Error("No portrait returned");
      }
    } catch (err: any) {
      console.error("Portrait error:", err);
      toast.error(err.message || "Failed to generate portrait");
    } finally {
      setGeneratingPortrait(false);
    }
  }, [name, selectedClass]);

  const handleCreate = async () => {
    if (!name.trim() || !selectedClass) {
      toast.error("Please enter a name and choose a class");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      
      // Generate portrait if not already done
      let finalPortraitUrl = portraitUrl;
      if (!finalPortraitUrl) {
        setGeneratingPortrait(true);
        try {
          const resp = await fetch(PORTRAIT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), characterClass: selectedClass }),
          });
          if (resp.ok) {
            const data = await resp.json();
            finalPortraitUrl = data.imageUrl || null;
          }
        } catch (e) {
          console.warn("Portrait generation failed during create:", e);
        }
        setGeneratingPortrait(false);
      }
      
      const hp = calcHp(selectedClass, stats.con);
      const ac = calcAc(selectedClass, stats.dex);
      const { error } = await supabase.from("characters").insert({
        user_id: user.id, name: name.trim(), class: selectedClass,
        hp_current: hp, hp_max: hp, ac,
        str: stats.str, dex: stats.dex, con: stats.con,
        int: stats.int, wis: stats.wis, cha: stats.cha,
        portrait_url: finalPortraitUrl,
      });
      if (error) throw error;
      toast.success("Character created successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Error creating character");
    } finally {
      setLoading(false);
    }
  };

  const statLabels: { key: keyof typeof stats; label: string }[] = [
    { key: "str", label: "STR" }, { key: "dex", label: "DEX" },
    { key: "con", label: "CON" }, { key: "int", label: "INT" },
    { key: "wis", label: "WIS" }, { key: "cha", label: "CHA" },
  ];

  const total = getStatTotal(stats);

  return (
    <div className="relative min-h-screen bg-background">
      <DiceRollOverlay rolling={isRolling} result={rollResult} isSuccess={rollSuccess} isCritical={rollCritical} onComplete={handleRollComplete} />

      {/* Subtle decorative background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent/3 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8">
        <button onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
            <h1 className="font-display text-3xl font-semibold text-gold-glow">Create Character</h1>
            <p className="mt-2 text-sm text-muted-foreground">Forge your hero and begin the adventure</p>
          </div>

          {/* Portrait Preview */}
          <div className="glass-card rounded-2xl p-6 mb-4">
            <label className="mb-3 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Character Portrait</label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 rounded-xl overflow-hidden border-2 border-primary/20 bg-muted/30 flex items-center justify-center shrink-0">
                <AnimatePresence mode="wait">
                  {generatingPortrait ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-1">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-[10px] text-muted-foreground">Generating...</span>
                    </motion.div>
                  ) : portraitUrl ? (
                    <motion.img key="portrait" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      src={portraitUrl} alt={`${name} portrait`}
                      className="h-full w-full object-cover" />
                  ) : selectedClass ? (
                    <motion.img key="class" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      src={CLASS_IMAGES[selectedClass]} alt={selectedClass}
                      className="h-full w-full object-cover opacity-50" />
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-muted-foreground">
                      <Sparkles className="h-8 w-8 opacity-30" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  {portraitUrl 
                    ? "AI-generated portrait ready! You can regenerate if you'd like a different look."
                    : "Generate a unique AI portrait for your character, or one will be created automatically when you start your adventure."
                  }
                </p>
                <motion.button
                  onClick={generatePortrait}
                  disabled={generatingPortrait || !name.trim() || !selectedClass}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-xl bg-primary/15 px-4 py-2 text-sm font-medium text-primary border border-primary/20 transition hover:bg-primary/25 disabled:opacity-40"
                >
                  <Sparkles className={`h-4 w-4 ${generatingPortrait ? "animate-pulse" : ""}`} />
                  {portraitUrl ? "Regenerate Portrait" : "Generate Portrait"}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="glass-card rounded-2xl p-6 mb-4">
            <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Character Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Enter your character's name..."
              className="w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          {/* Class Selection */}
          <div className="glass-card rounded-2xl p-6 mb-4">
            <label className="mb-3 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Choose Class</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {CLASSES.map((cls) => (
                <motion.button key={cls.id} onClick={() => setSelectedClass(cls.id)}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className={`rounded-xl border overflow-hidden text-center transition-all duration-200 ${
                    selectedClass === cls.id
                      ? "border-primary/40 bg-primary/10 shadow-gold ring-1 ring-primary/20"
                      : "border-border bg-muted/20 hover:border-muted-foreground/30 hover:bg-muted/40"
                  }`}>
                  <div className="relative h-24 w-full overflow-hidden">
                    <img src={CLASS_IMAGES[cls.id]} alt={cls.label}
                      className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  </div>
                  <div className="p-3">
                    <p className="font-heading text-sm font-medium text-foreground">{cls.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{cls.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="glass-card rounded-2xl p-6 mb-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Attributes</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  total >= 70
                    ? "bg-accent/15 text-accent-foreground border border-accent/20"
                    : total <= 55
                    ? "bg-destructive/15 text-destructive-foreground border border-destructive/20"
                    : "bg-muted text-muted-foreground border border-border"
                }`}>
                  Total: {total}
                </span>
              </div>
              <motion.button onClick={handleRoll} disabled={isRolling}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-xl bg-primary/15 px-4 py-2 text-sm font-medium text-primary border border-primary/20 transition hover:bg-primary/25 disabled:opacity-50">
                <Dices className={`h-4 w-4 ${isRolling ? "animate-spin" : ""}`} /> Roll Dice
              </motion.button>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {statLabels.map(({ key, label }, idx) => (
                <motion.div key={key}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-xl border p-3 text-center transition-all duration-300 ${
                    stats[key] >= 16
                      ? "border-accent/30 bg-accent/8"
                      : stats[key] <= 8
                      ? "border-destructive/30 bg-destructive/8"
                      : "border-border bg-muted/20"
                  }`}>
                  <p className="text-[10px] font-medium text-muted-foreground tracking-wider">{label}</p>
                  <p className={`font-display text-xl font-semibold mt-1 ${
                    stats[key] >= 16 ? "text-accent-foreground" : stats[key] <= 8 ? "text-destructive" : "text-foreground"
                  }`}>{stats[key]}</p>
                  <p className="text-[11px] text-primary/80 mt-0.5">
                    {calcModifier(stats[key]) >= 0 ? "+" : ""}{calcModifier(stats[key])}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {selectedClass && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="glass-card rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
                    <Heart className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hit Points</p>
                    <p className="text-lg font-display font-semibold text-foreground">{calcHp(selectedClass, stats.con)}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Armor Class</p>
                    <p className="text-lg font-display font-semibold text-foreground">{calcAc(selectedClass, stats.dex)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Create Button */}
          <motion.button onClick={handleCreate} disabled={loading || generatingPortrait || !name.trim() || !selectedClass}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-gold active:scale-[0.99] disabled:opacity-40">
            {loading || generatingPortrait ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {generatingPortrait ? "Generating Portrait..." : "Creating..."}
              </>
            ) : (
              <>
                <Swords className="h-5 w-5" />
                Create Character & Begin Adventure
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateCharacter;
