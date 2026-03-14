import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Heart, AlertTriangle, Coins, Sparkles } from "lucide-react";

interface DeathOverlayProps {
  open: boolean;
  characterName: string;
  characterLevel: number;
  xpLost: number;
  goldLost: number;
  onRespawn: () => void;
}

const SKULL_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 2,
  duration: 3 + Math.random() * 2,
  size: 12 + Math.random() * 16,
}));

const DeathOverlay = ({ open, characterName, characterLevel, xpLost, goldLost, onRespawn }: DeathOverlayProps) => {
  const [phase, setPhase] = useState<"dying" | "dead" | "penalties" | "respawn">("dying");

  useEffect(() => {
    if (!open) { setPhase("dying"); return; }
    const t1 = setTimeout(() => setPhase("dead"), 1500);
    const t2 = setTimeout(() => setPhase("penalties"), 3500);
    const t3 = setTimeout(() => setPhase("respawn"), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Blood-red vignette backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, rgba(80,0,0,0.92) 0%, rgba(20,0,0,0.98) 70%, rgba(0,0,0,1) 100%)",
            }}
          />

          {/* Floating skull particles */}
          {SKULL_PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 0, x: `${p.x}vw` }}
              animate={{
                opacity: [0, 0.15, 0.08, 0],
                y: [0, -200, -400],
              }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
              className="absolute bottom-0 text-destructive/20 pointer-events-none"
              style={{ fontSize: p.size, left: `${p.x}%` }}
            >
              💀
            </motion.div>
          ))}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
            {/* Phase: Dying - red flash */}
            <AnimatePresence mode="wait">
              {phase === "dying" && (
                <motion.div
                  key="dying"
                  initial={{ scale: 3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.8, repeat: 2 }}
                  >
                    <Heart className="h-20 w-20 text-destructive drop-shadow-[0_0_30px_rgba(200,0,0,0.8)]" />
                  </motion.div>
                </motion.div>
              )}

              {/* Phase: Dead - skull reveal */}
              {phase === "dead" && (
                <motion.div
                  key="dead"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.8 }}
                  className="flex flex-col items-center gap-4"
                >
                  <motion.div
                    animate={{ rotateZ: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Skull className="h-24 w-24 text-foreground drop-shadow-[0_0_40px_rgba(200,50,50,0.6)]" />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="font-display text-4xl sm:text-5xl font-bold text-destructive"
                    style={{ textShadow: "0 0 30px rgba(200,0,0,0.6)" }}
                  >
                    YOU HAVE FALLEN
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-foreground/60 text-sm"
                  >
                    {characterName} has been defeated in battle...
                  </motion.p>
                </motion.div>
              )}

              {/* Phase: Penalties */}
              {phase === "penalties" && (
                <motion.div
                  key="penalties"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col items-center gap-6"
                >
                  <Skull className="h-16 w-16 text-foreground/40" />
                  <h2 className="font-display text-3xl font-bold text-destructive">Death Penalties</h2>

                  <div className="flex flex-col gap-3 w-full">
                    <motion.div
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
                    >
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                      <span className="text-sm text-foreground/80">Respawn at <strong>50% HP</strong></span>
                    </motion.div>

                    {xpLost > 0 && (
                      <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
                      >
                        <Sparkles className="h-5 w-5 text-destructive shrink-0" />
                        <span className="text-sm text-foreground/80">Lost <strong>{xpLost} XP</strong></span>
                      </motion.div>
                    )}

                    {goldLost > 0 && (
                      <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
                      >
                        <Coins className="h-5 w-5 text-destructive shrink-0" />
                        <span className="text-sm text-foreground/80">Lost <strong>{goldLost} gold</strong></span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Phase: Respawn button */}
              {phase === "respawn" && (
                <motion.div
                  key="respawn"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col items-center gap-6"
                >
                  <Skull className="h-14 w-14 text-foreground/30" />
                  <h2 className="font-display text-3xl font-bold text-destructive">Death Penalties</h2>

                  <div className="flex flex-col gap-2 w-full text-sm text-foreground/60">
                    <p>⚠️ Respawn at 50% HP</p>
                    {xpLost > 0 && <p>✨ Lost {xpLost} XP</p>}
                    {goldLost > 0 && <p>🪙 Lost {goldLost} gold</p>}
                  </div>

                  <motion.button
                    onClick={onRespawn}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(200,150,50,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-4 flex items-center gap-3 rounded-xl bg-primary px-8 py-3.5 font-display text-lg font-semibold text-primary-foreground transition-all hover:brightness-110"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                  >
                    <Heart className="h-5 w-5" />
                    Rise Again
                  </motion.button>

                  <p className="text-xs text-foreground/30 mt-2">
                    Level {characterLevel} • The adventure continues...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeathOverlay;
