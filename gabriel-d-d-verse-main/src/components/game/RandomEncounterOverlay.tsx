import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Swords, X } from "lucide-react";
import { type RandomEncounter, rollRandomEncounter } from "@/lib/encounters";

interface RandomEncounterOverlayProps {
  adventureId: string | null;
  trigger: number; // increment to trigger check
  onEncounterStart?: (encounter: RandomEncounter) => void;
  onDismiss?: () => void;
}

const RandomEncounterOverlay = ({ adventureId, trigger, onEncounterStart, onDismiss }: RandomEncounterOverlayProps) => {
  const [encounter, setEncounter] = useState<RandomEncounter | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0 || !adventureId) return;
    const enc = rollRandomEncounter(adventureId);
    if (enc) {
      setEncounter(enc);
      setVisible(true);
    }
  }, [trigger, adventureId]);

  const handleEngage = () => {
    if (encounter) onEncounterStart?.(encounter);
    setVisible(false);
    setEncounter(null);
  };

  const handleFlee = () => {
    setVisible(false);
    setEncounter(null);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {visible && encounter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 30 }}
            className="w-full max-w-sm rounded-2xl border border-destructive/30 bg-background/95 backdrop-blur-xl p-6 shadow-2xl"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 mb-4"
              >
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </motion.div>

              <h3 className="font-display text-lg font-bold text-foreground mb-1">Random Encounter!</h3>
              <p className="text-sm font-semibold text-primary mb-2">{encounter.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{encounter.description}</p>

              <div className="flex items-center justify-center gap-3 mb-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                  encounter.difficulty === "easy"
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : encounter.difficulty === "medium"
                      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}>
                  {encounter.difficulty.toUpperCase()}
                </span>
                <span className="text-[10px] text-muted-foreground">+{encounter.xpReward} XP</span>
              </div>

              <div className="flex gap-2">
                <motion.button
                  onClick={handleEngage}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive/90 text-destructive-foreground py-2.5 text-sm font-semibold transition hover:bg-destructive"
                >
                  <Swords className="h-4 w-4" /> Engage
                </motion.button>
                <motion.button
                  onClick={handleFlee}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 text-foreground py-2.5 text-sm font-medium transition hover:bg-muted/50"
                >
                  <X className="h-4 w-4" /> Flee
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RandomEncounterOverlay;
