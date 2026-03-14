import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Heart, Shield, Dices } from "lucide-react";
import DiceRollOverlay from "./DiceRollOverlay";

interface DeathSavesOverlayProps {
  open: boolean;
  characterName: string;
  onStabilize: () => void;
  onDeath: () => void;
}

const DeathSavesOverlay = ({ open, characterName, onStabilize, onDeath }: DeathSavesOverlayProps) => {
  const [successes, setSuccesses] = useState(0);
  const [failures, setFailures] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [rollSuccess, setRollSuccess] = useState<boolean | null>(null);
  const [rollCritical, setRollCritical] = useState(false);
  const [resolved, setResolved] = useState(false);

  const rollDeathSave = useCallback(() => {
    if (rolling || resolved) return;
    const roll = Math.floor(Math.random() * 20) + 1;
    
    setLastRoll(roll);
    setRolling(true);

    if (roll === 20) {
      // Nat 20: instant stabilize
      setRollSuccess(true);
      setRollCritical(true);
      setTimeout(() => {
        setSuccesses(3);
        setResolved(true);
        setTimeout(() => onStabilize(), 1500);
      }, 1800);
    } else if (roll === 1) {
      // Nat 1: two failures
      setRollSuccess(false);
      setRollCritical(true);
      setTimeout(() => {
        const newFails = Math.min(3, failures + 2);
        setFailures(newFails);
        if (newFails >= 3) {
          setResolved(true);
          setTimeout(() => onDeath(), 1500);
        }
      }, 1800);
    } else if (roll >= 10) {
      // Success
      setRollSuccess(true);
      setRollCritical(false);
      setTimeout(() => {
        const newSucc = successes + 1;
        setSuccesses(newSucc);
        if (newSucc >= 3) {
          setResolved(true);
          setTimeout(() => onStabilize(), 1500);
        }
      }, 1800);
    } else {
      // Failure
      setRollSuccess(false);
      setRollCritical(false);
      setTimeout(() => {
        const newFails = failures + 1;
        setFailures(newFails);
        if (newFails >= 3) {
          setResolved(true);
          setTimeout(() => onDeath(), 1500);
        }
      }, 1800);
    }
  }, [rolling, resolved, successes, failures, onStabilize, onDeath]);

  if (!open) return null;

  return (
    <>
      <DiceRollOverlay
        rolling={rolling}
        result={lastRoll}
        isSuccess={rollSuccess}
        isCritical={rollCritical}
        onComplete={() => setRolling(false)}
      />
      <AnimatePresence>
        {open && !rolling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md mx-4 rounded-2xl border border-destructive/30 bg-card p-6 text-center"
            >
              {/* Skull icon */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-4"
              >
                <Skull className="h-12 w-12 text-destructive mx-auto" />
              </motion.div>

              <h2 className="font-display text-xl font-bold text-destructive mb-1">
                {resolved && successes >= 3 ? "Stabilized!" : resolved && failures >= 3 ? "Death Claims You" : "Death Saving Throws"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {resolved
                  ? successes >= 3
                    ? `${characterName} clings to life!`
                    : `${characterName} has fallen...`
                  : `${characterName} is unconscious. Roll to survive!`}
              </p>

              {/* Success/Failure Pips */}
              <div className="flex justify-center gap-8 mb-6">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-accent font-medium flex items-center gap-1">
                    <Heart className="h-3 w-3" /> Successes
                  </span>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={`s-${i}`}
                        animate={i < successes ? { scale: [0.5, 1.2, 1] } : {}}
                        className={`h-5 w-5 rounded-full border-2 transition-all duration-300 ${
                          i < successes
                            ? "border-accent bg-accent shadow-[0_0_10px_hsl(var(--accent)/0.5)]"
                            : "border-muted bg-muted/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-destructive font-medium flex items-center gap-1">
                    <Skull className="h-3 w-3" /> Failures
                  </span>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={`f-${i}`}
                        animate={i < failures ? { scale: [0.5, 1.2, 1] } : {}}
                        className={`h-5 w-5 rounded-full border-2 transition-all duration-300 ${
                          i < failures
                            ? "border-destructive bg-destructive shadow-[0_0_10px_hsl(var(--destructive)/0.5)]"
                            : "border-muted bg-muted/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Roll info */}
              {lastRoll && !rolling && !resolved && (
                <p className="text-xs text-muted-foreground mb-4">
                  Last roll: <span className={rollSuccess ? "text-accent font-semibold" : "text-destructive font-semibold"}>{lastRoll}</span>
                  {rollCritical && <span className="ml-1">(Critical!)</span>}
                  <span className="ml-1">— Need 10+ to succeed</span>
                </p>
              )}

              {/* Roll Button */}
              {!resolved && (
                <motion.button
                  onClick={rollDeathSave}
                  disabled={rolling}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 mx-auto rounded-xl bg-destructive/20 border border-destructive/30 px-8 py-3 text-sm font-display font-semibold text-destructive transition hover:bg-destructive/30 disabled:opacity-50"
                >
                  <Dices className="h-4 w-4" />
                  Roll Death Save ({successes}/3 ✓ — {failures}/3 ✗)
                </motion.button>
              )}

              {/* Rules hint */}
              <p className="mt-4 text-[10px] text-muted-foreground/60">
                10+ = Success • 1-9 = Failure • Nat 20 = Instant stabilize • Nat 1 = Two failures
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DeathSavesOverlay;
