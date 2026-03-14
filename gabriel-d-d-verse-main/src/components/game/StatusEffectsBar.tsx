import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_EFFECTS } from "@/lib/statusEffects";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusEffect {
  id: string;
  effect_name: string;
  effect_type: string;
  icon: string;
  turns_remaining: number;
  duration_turns: number;
}

interface StatusEffectsBarProps {
  characterId?: string | null;
  onEffectTick?: (damage: number, heal: number) => void;
}

const StatusEffectsBar = ({ characterId, onEffectTick }: StatusEffectsBarProps) => {
  const [effects, setEffects] = useState<StatusEffect[]>([]);

  const loadEffects = async () => {
    if (!characterId) return;
    const { data } = await supabase
      .from("character_status_effects")
      .select("*")
      .eq("character_id", characterId);
    if (data) setEffects(data as StatusEffect[]);
  };

  useEffect(() => { loadEffects(); }, [characterId]);

  // Subscribe to changes
  useEffect(() => {
    if (!characterId) return;
    const channel = supabase
      .channel(`status-effects-${characterId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "character_status_effects", filter: `character_id=eq.${characterId}` }, () => loadEffects())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [characterId]);

  if (effects.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <AnimatePresence>
          {effects.map((effect) => {
            const def = STATUS_EFFECTS[effect.effect_name];
            const isBuff = effect.effect_type === "buff";
            return (
              <Tooltip key={effect.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`relative flex items-center justify-center h-7 w-7 rounded-lg border text-sm cursor-help ${
                      isBuff
                        ? "border-primary/30 bg-primary/10"
                        : "border-destructive/30 bg-destructive/10"
                    }`}
                  >
                    <span>{effect.icon}</span>
                    <span className={`absolute -bottom-1 -right-1 text-[8px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center ${
                      isBuff ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
                    }`}>
                      {effect.turns_remaining}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-semibold text-xs">{def?.name || effect.effect_name}</p>
                  <p className="text-[10px] text-muted-foreground">{def?.description || `${effect.turns_remaining} turns remaining`}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
};

export default StatusEffectsBar;
