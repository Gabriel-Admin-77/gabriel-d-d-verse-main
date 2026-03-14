import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RewardEvent {
  id: string;
  type: "xp" | "gold" | "loot";
  value: string;
  icon: string;
}

interface Coin {
  id: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

interface FloatingText {
  id: string;
  text: string;
  icon: string;
  x: number;
  color: string;
}

interface LootChest {
  id: string;
  icon: string;
  name: string;
  phase: "closed" | "shaking" | "opening" | "revealing" | "done";
}

export function useRewardAnimations() {
  const [events, setEvents] = useState<RewardEvent[]>([]);

  const triggerXP = useCallback((amount: number) => {
    setEvents(prev => [...prev, { id: crypto.randomUUID(), type: "xp", value: `+${amount} XP`, icon: "✨" }]);
  }, []);

  const triggerGold = useCallback((amount: number) => {
    setEvents(prev => [...prev, { id: crypto.randomUUID(), type: "gold", value: `+${amount}`, icon: "🪙" }]);
  }, []);

  const triggerLoot = useCallback((icon: string, name: string) => {
    setEvents(prev => [...prev, { id: crypto.randomUUID(), type: "loot", value: name, icon }]);
  }, []);

  const clearEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  return { events, triggerXP, triggerGold, triggerLoot, clearEvent };
}

/* ── Loot Chest Sub-component ── */
function LootChestAnimation({ chest, onDone }: { chest: LootChest; onDone: () => void }) {
  const [phase, setPhase] = useState<LootChest["phase"]>("closed");
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);

  useEffect(() => {
    // Phase timeline
    const t1 = setTimeout(() => setPhase("shaking"), 200);
    const t2 = setTimeout(() => setPhase("opening"), 1200);
    const t3 = setTimeout(() => {
      setPhase("revealing");
      setParticles(
        Array.from({ length: 16 }, (_, i) => ({
          id: i,
          x: Math.cos((i / 16) * Math.PI * 2) * (80 + Math.random() * 40),
          y: Math.sin((i / 16) * Math.PI * 2) * (80 + Math.random() * 40),
          angle: Math.random() * 360,
        }))
      );
    }, 1800);
    const t4 = setTimeout(() => { setPhase("done"); onDone(); }, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "done" ? 0 : 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Dark vignette backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "closed" ? 0 : phase === "done" ? 0 : 0.7 }}
        transition={{ duration: 0.5 }}
      />

      <div className="relative flex flex-col items-center">
        {/* Chest */}
        <motion.div
          className="text-7xl sm:text-8xl select-none relative"
          animate={
            phase === "shaking"
              ? { rotate: [0, -4, 4, -4, 4, -2, 2, 0], scale: [1, 1.02, 1, 1.02, 1] }
              : phase === "opening"
              ? { scale: [1, 1.3, 1.1], rotate: 0 }
              : phase === "revealing"
              ? { scale: [1.1, 0.9, 0], y: [0, 0, -50] }
              : {}
          }
          transition={
            phase === "shaking"
              ? { duration: 0.8, repeat: 1, ease: "easeInOut" }
              : phase === "opening"
              ? { duration: 0.6, ease: "easeOut" }
              : phase === "revealing"
              ? { duration: 0.5, ease: "easeIn" }
              : {}
          }
        >
          {phase === "opening" || phase === "revealing" ? "📭" : "📦"}
        </motion.div>

        {/* Glow ring behind chest during opening */}
        {(phase === "opening" || phase === "revealing") && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{ width: 200, height: 200, opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)",
            }}
          />
        )}

        {/* Explosion particles */}
        <AnimatePresence>
          {phase === "revealing" && particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute text-lg sm:text-xl"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0, rotate: p.angle }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {["✨", "⭐", "💫", "🔥", "💎"][p.id % 5]}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Revealed item */}
        {phase === "revealing" && (
          <motion.div
            className="flex flex-col items-center gap-2 mt-4"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "backOut" }}
          >
            <motion.span
              className="text-5xl sm:text-6xl"
              animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: 1, ease: "easeInOut" }}
            >
              {chest.icon}
            </motion.span>
            <motion.p
              className="font-display font-bold text-lg sm:text-xl text-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.6), 0 2px 8px rgba(0,0,0,0.5)" }}
            >
              {chest.name}
            </motion.p>
            <motion.p
              className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ delay: 0.8, duration: 2 }}
            >
              Loot Acquired!
            </motion.p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function RewardAnimations({
  events,
  onClear,
}: {
  events: RewardEvent[];
  onClear: (id: string) => void;
}) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [lootChests, setLootChests] = useState<LootChest[]>([]);

  useEffect(() => {
    events.forEach((event) => {
      // Loot events get the chest animation instead of floating text
      if (event.type === "loot") {
        setLootChests(prev => {
          if (prev.find(c => c.id === event.id)) return prev;
          return [...prev, { id: event.id, icon: event.icon, name: event.value, phase: "closed" }];
        });
        return;
      }

      // Floating text for xp and gold
      const color = event.type === "xp" ? "hsl(var(--primary))" : "#fbbf24";
      const ft: FloatingText = {
        id: event.id,
        text: `${event.icon} ${event.value}`,
        icon: event.icon,
        x: 30 + Math.random() * 40,
        color,
      };
      setFloatingTexts(prev => {
        if (prev.find(f => f.id === event.id)) return prev;
        return [...prev, ft];
      });

      // Gold coins shower
      if (event.type === "gold") {
        setCoins(prev => {
          if (prev.find(c => c.id.startsWith(event.id))) return prev;
          return [...prev, ...Array.from({ length: 12 }, (_, i) => ({
            id: `${event.id}-coin-${i}`,
            x: 10 + Math.random() * 80,
            delay: Math.random() * 0.6,
            duration: 1.2 + Math.random() * 0.8,
            size: 14 + Math.random() * 10,
            rotation: Math.random() * 720 - 360,
          }))];
        });
        setTimeout(() => {
          setCoins(prev => prev.filter(c => !c.id.startsWith(event.id)));
        }, 2500);
      }

      // Auto-clear after animation
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(f => f.id !== event.id));
        onClear(event.id);
      }, 2200);
    });
  }, [events, onClear]);

  const handleChestDone = useCallback((id: string) => {
    setLootChests(prev => prev.filter(c => c.id !== id));
    onClear(id);
  }, [onClear]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Gold coins falling */}
      <AnimatePresence>
        {coins.map((coin) => (
          <motion.div
            key={coin.id}
            initial={{ y: -30, x: `${coin.x}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: "105vh", opacity: 0, rotate: coin.rotation }}
            exit={{ opacity: 0 }}
            transition={{ duration: coin.duration, delay: coin.delay, ease: "easeIn" }}
            className="absolute"
            style={{ fontSize: coin.size }}
          >
            🪙
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating reward text */}
      <AnimatePresence>
        {floatingTexts.map((ft) => (
          <motion.div
            key={ft.id}
            initial={{ y: "50vh", x: `${ft.x}vw`, opacity: 0, scale: 0.5 }}
            animate={{ y: "20vh", opacity: [0, 1, 1, 0], scale: [0.5, 1.3, 1.1, 0.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute font-display font-bold text-xl sm:text-2xl drop-shadow-lg"
            style={{
              color: ft.color,
              textShadow: `0 0 20px ${ft.color}, 0 2px 8px rgba(0,0,0,0.5)`,
            }}
          >
            {ft.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* XP sparkle burst */}
      <AnimatePresence>
        {floatingTexts
          .filter(ft => events.find(e => e.id === ft.id && e.type === "xp"))
          .map((ft) => (
            <motion.div
              key={`sparkles-${ft.id}`}
              className="absolute"
              style={{ left: `${ft.x}vw`, top: "45vh" }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-xs"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: (Math.cos((i / 8) * Math.PI * 2)) * 60,
                    y: (Math.sin((i / 8) * Math.PI * 2)) * 60,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  ✨
                </motion.span>
              ))}
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Loot chest animations */}
      <AnimatePresence>
        {lootChests.map((chest) => (
          <LootChestAnimation
            key={chest.id}
            chest={chest}
            onDone={() => handleChestDone(chest.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
