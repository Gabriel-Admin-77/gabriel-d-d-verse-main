import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Clock, TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import { type ActiveWorldEvent, type WorldEventEffect } from "@/lib/worldEvents";

interface WorldEventOverlayProps {
  event: ActiveWorldEvent | null;
  onDismiss: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  festival: "from-amber-500/20 to-yellow-500/10 border-amber-500/30",
  disaster: "from-red-500/20 to-orange-500/10 border-red-500/30",
  political: "from-blue-500/20 to-indigo-500/10 border-blue-500/30",
  supernatural: "from-purple-500/20 to-violet-500/10 border-purple-500/30",
  trade: "from-emerald-500/20 to-green-500/10 border-emerald-500/30",
  military: "from-red-600/20 to-amber-600/10 border-red-600/30",
};

function EffectRow({ label, value, positive }: { label: string; value: string; positive: boolean | null }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold flex items-center gap-1 ${
        positive === true ? "text-green-400" : positive === false ? "text-red-400" : "text-muted-foreground"
      }`}>
        {positive === true && <TrendingUp className="h-3 w-3" />}
        {positive === false && <TrendingDown className="h-3 w-3" />}
        {positive === null && <Minus className="h-3 w-3" />}
        {value}
      </span>
    </div>
  );
}

function formatEffect(fx: WorldEventEffect) {
  const rows: { label: string; value: string; positive: boolean | null }[] = [];
  if (fx.shopPriceModifier && fx.shopPriceModifier !== 1) {
    const pct = Math.round((fx.shopPriceModifier - 1) * 100);
    rows.push({ label: "Shop Prices", value: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct < 0 });
  }
  if (fx.xpModifier && fx.xpModifier !== 1) {
    const pct = Math.round((fx.xpModifier - 1) * 100);
    rows.push({ label: "XP Rewards", value: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct > 0 });
  }
  if (fx.goldModifier && fx.goldModifier !== 1) {
    const pct = Math.round((fx.goldModifier - 1) * 100);
    rows.push({ label: "Gold Drops", value: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct > 0 });
  }
  if (fx.encounterDifficultyShift && fx.encounterDifficultyShift !== 0) {
    rows.push({ label: "Encounter Difficulty", value: fx.encounterDifficultyShift > 0 ? "Harder" : "Easier", positive: fx.encounterDifficultyShift < 0 });
  }
  if (fx.npcMoodShift && fx.npcMoodShift !== 0) {
    rows.push({ label: "NPC Mood", value: fx.npcMoodShift > 0 ? "Friendlier" : "Hostile", positive: fx.npcMoodShift > 0 });
  }
  if (fx.healOverTime && fx.healOverTime > 0) {
    rows.push({ label: "Healing/Turn", value: `+${fx.healOverTime} HP`, positive: true });
  }
  if (fx.damageOverTime && fx.damageOverTime > 0) {
    rows.push({ label: "Damage/Turn", value: `-${fx.damageOverTime} HP`, positive: false });
  }
  return rows;
}

const WorldEventOverlay = ({ event, onDismiss }: WorldEventOverlayProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) setVisible(true);
  }, [event]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!event) return null;

  const colorClass = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.political;
  const effectRows = formatEffect(event.effects);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.7, y: 40, rotateX: 15 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.8, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`w-full max-w-sm rounded-2xl border bg-gradient-to-b ${colorClass} bg-background/95 backdrop-blur-xl p-6 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon pulse */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.6 }}
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-background/60 border border-border mb-3"
              >
                <span className="text-3xl">{event.icon}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  World Event — {event.category}
                </p>
                <h3 className="font-display text-lg font-bold text-foreground mb-1">{event.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{event.description}</p>
                <p className="text-xs italic text-primary/80 mb-4">"{event.flavorText}"</p>
              </motion.div>

              {/* Effects */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-1.5 rounded-xl bg-background/40 border border-border/50 p-3 mb-4"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Effects</p>
                {effectRows.map((row, i) => (
                  <EffectRow key={i} {...row} />
                ))}
                <div className="flex items-center justify-center gap-1 pt-2 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Lasts {event.duration} turns</span>
                </div>
              </motion.div>

              <motion.button
                onClick={handleDismiss}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl bg-primary/90 text-primary-foreground py-2.5 text-sm font-semibold transition hover:bg-primary"
              >
                Continue Adventuring
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Small banner for active world events in the game UI
export const WorldEventBanner = ({ events, onViewDetails }: { events: ActiveWorldEvent[]; onViewDetails?: () => void }) => {
  if (events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition"
      onClick={onViewDetails}
    >
      <Globe className="h-3.5 w-3.5 text-primary" />
      <div className="flex items-center gap-1.5">
        {events.map(e => (
          <span key={e.id} className="flex items-center gap-1 text-[10px] text-foreground font-medium">
            <span>{e.icon}</span>
            <span className="hidden sm:inline">{e.title}</span>
            <span className="text-muted-foreground">({e.turnsRemaining})</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default WorldEventOverlay;
