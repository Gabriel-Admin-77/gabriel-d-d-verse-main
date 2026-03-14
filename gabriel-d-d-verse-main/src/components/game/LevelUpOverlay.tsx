import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, TrendingUp, X } from "lucide-react";
import { getLevelUpBonuses, CLASS_ABILITIES } from "@/lib/progression";

interface LevelUpOverlayProps {
  open: boolean;
  onClose: () => void;
  newLevel: number;
  characterClass: string;
  onApply: (statChoice: string | null) => void;
}

const STATS = ["str", "dex", "con", "int", "wis", "cha"];

const LevelUpOverlay = ({ open, onClose, newLevel, characterClass, onApply }: LevelUpOverlayProps) => {
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const bonuses = getLevelUpBonuses(newLevel);
  const newAbility = CLASS_ABILITIES[characterClass]?.find(a => a.level === newLevel);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className="parchment-card rounded-2xl p-6 w-full max-w-sm text-center"
      >
        {/* Header */}
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 border-2 border-primary/40"
        >
          <Star className="h-8 w-8 text-primary animate-rune-glow" />
        </motion.div>

        <h2 className="font-display text-2xl font-bold text-gold-glow mb-1">Level Up!</h2>
        <p className="text-sm text-muted-foreground mb-4">You've reached <span className="text-foreground font-semibold">Level {newLevel}</span></p>

        {/* Bonuses */}
        <div className="space-y-2 mb-4 text-left">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/10 px-4 py-2.5">
            <span className="text-destructive text-sm">❤️</span>
            <span className="text-xs text-foreground">+{bonuses.hp} Max HP</span>
          </div>

          {newAbility && (
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">New Ability Unlocked!</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{newAbility.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{newAbility.description}</p>
              <span className="inline-block mt-1 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-border bg-muted/20 text-muted-foreground">
                {newAbility.type}
              </span>
            </motion.div>
          )}
        </div>

        {/* Stat allocation */}
        {bonuses.statPoints > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" /> Choose a stat to increase (+1)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {STATS.map(stat => (
                <motion.button
                  key={stat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedStat(stat)}
                  className={`rounded-lg px-3 py-2 text-xs font-ui font-semibold uppercase border transition ${
                    selectedStat === stat
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-muted/10 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {stat}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Apply button */}
        <motion.button
          onClick={() => { onApply(bonuses.statPoints > 0 ? selectedStat : null); onClose(); }}
          disabled={bonuses.statPoints > 0 && !selectedStat}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full btn-wax rounded-xl px-4 py-3 text-sm font-ui font-bold disabled:opacity-50"
        >
          Continue Adventuring
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default LevelUpOverlay;
