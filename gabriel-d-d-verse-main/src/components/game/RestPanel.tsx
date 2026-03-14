import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Bed, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

interface RestPanelProps {
  characterId?: string | null;
  hpCurrent: number;
  hpMax: number;
  characterLevel: number;
  onRest?: () => void;
}

const RestPanel = ({ characterId, hpCurrent, hpMax, characterLevel, onRest }: RestPanelProps) => {
  const [resting, setResting] = useState(false);
  const [restType, setRestType] = useState<"short" | "long" | null>(null);

  const performShortRest = async () => {
    if (!characterId || resting) return;
    setResting(true);
    setRestType("short");

    // Short rest: heal 25% of max HP + restore some spell uses
    const healAmount = Math.floor(hpMax * 0.25);
    const newHp = Math.min(hpMax, hpCurrent + healAmount);

    await supabase.from("characters").update({ hp_current: newHp }).eq("id", characterId);

    // Restore 50% of spell uses
    const { data: spells } = await supabase
      .from("character_spells")
      .select("id, uses_remaining, max_uses")
      .eq("character_id", characterId);

    if (spells) {
      for (const spell of spells) {
        if (spell.uses_remaining < spell.max_uses) {
          const restored = Math.ceil(spell.max_uses * 0.5);
          const newUses = Math.min(spell.max_uses, spell.uses_remaining + restored);
          await supabase.from("character_spells").update({ uses_remaining: newUses }).eq("id", spell.id);
        }
      }
    }

    // Remove debuffs with 1 turn remaining
    await supabase.from("character_status_effects")
      .delete()
      .eq("character_id", characterId)
      .lte("turns_remaining", 1);

    setTimeout(() => {
      setResting(false);
      setRestType(null);
      toast.success(`☀️ Short rest complete! Healed ${newHp - hpCurrent} HP.`);
      onRest?.();
    }, 2000);
  };

  const performLongRest = async () => {
    if (!characterId || resting) return;
    setResting(true);
    setRestType("long");

    // Long rest: full HP restore + all spell uses + clear all status effects
    await supabase.from("characters").update({ hp_current: hpMax }).eq("id", characterId);

    // Restore all spell uses
    const { data: spells } = await supabase
      .from("character_spells")
      .select("id, max_uses")
      .eq("character_id", characterId);

    if (spells) {
      for (const spell of spells) {
        await supabase.from("character_spells").update({ uses_remaining: spell.max_uses }).eq("id", spell.id);
      }
    }

    // Clear all status effects
    await supabase.from("character_status_effects")
      .delete()
      .eq("character_id", characterId);

    setTimeout(() => {
      setResting(false);
      setRestType(null);
      toast.success(`🌙 Long rest complete! Fully restored.`);
      onRest?.();
    }, 3500);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-lg backdrop-blur-md transition hover:bg-primary/25 hover:shadow-gold"
        >
          <Bed className="h-5 w-5" />
        </motion.button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] sm:w-[360px] bg-background/95 backdrop-blur-xl border-border p-0">
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="font-display text-lg text-foreground">Rest & Recovery</SheetTitle>
        </SheetHeader>

        <div className="p-5 space-y-4">
          {/* Current HP display */}
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Current HP</span>
              <span className="text-sm font-semibold text-foreground">{hpCurrent}/{hpMax}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-destructive to-destructive/70"
                animate={{ width: `${(hpCurrent / hpMax) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {resting ? (
              <motion.div
                key="resting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl mb-3"
                >
                  {restType === "long" ? "🌙" : "☀️"}
                </motion.div>
                <p className="text-sm font-medium text-foreground">
                  {restType === "long" ? "Taking a long rest..." : "Taking a short rest..."}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {restType === "long" ? "Restoring all HP and spell slots" : "Recovering some HP and spell uses"}
                </p>
                <motion.div
                  className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: restType === "long" ? 3.5 : 2, ease: "linear" }}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div key="options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* Short Rest */}
                <motion.button
                  onClick={performShortRest}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full rounded-xl border border-border bg-muted/20 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <Sun className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-semibold text-foreground">Short Rest</h4>
                      <p className="text-[10px] text-muted-foreground">~1 hour in-game</p>
                    </div>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground ml-13">
                    <li>• Restore <span className="text-foreground font-medium">25%</span> of max HP ({Math.floor(hpMax * 0.25)} HP)</li>
                    <li>• Restore <span className="text-foreground font-medium">50%</span> of spell uses</li>
                    <li>• Clear expiring status effects</li>
                  </ul>
                </motion.button>

                {/* Long Rest */}
                <motion.button
                  onClick={performLongRest}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full rounded-xl border border-border bg-muted/20 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <Moon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-semibold text-foreground">Long Rest</h4>
                      <p className="text-[10px] text-muted-foreground">~8 hours in-game</p>
                    </div>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground ml-13">
                    <li>• Restore <span className="text-foreground font-medium">all</span> HP to full ({hpMax} HP)</li>
                    <li>• Restore <span className="text-foreground font-medium">all</span> spell uses</li>
                    <li>• Clear <span className="text-foreground font-medium">all</span> status effects</li>
                  </ul>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <Zap className="h-3 w-3 inline mr-1 text-primary" />
              <strong className="text-foreground">Tip:</strong> Short rests are quick recovery between encounters. Long rests fully restore you but advance time significantly — random encounters may occur!
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RestPanel;
