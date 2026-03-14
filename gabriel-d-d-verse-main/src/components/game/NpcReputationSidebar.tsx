import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Heart, Skull, Minus, Eye, ChevronLeft } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

interface NpcEntry {
  id: string;
  npc_id: string;
  npc_name: string;
  reputation: number;
  disposition: string;
  interactions: number;
  last_interaction: string;
  first_met_at: string;
  last_met_at: string;
}

interface NpcReputationSidebarProps {
  characterId: string | undefined;
}

const DISPOSITION_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  hostile: { icon: "😡", color: "text-destructive", label: "Hostile" },
  unfriendly: { icon: "😠", color: "text-orange-400", label: "Unfriendly" },
  neutral: { icon: "😐", color: "text-muted-foreground", label: "Neutral" },
  friendly: { icon: "😊", color: "text-accent", label: "Friendly" },
  allied: { icon: "🤝", color: "text-primary", label: "Allied" },
  devoted: { icon: "💖", color: "text-pink-400", label: "Devoted" },
};

function getDisposition(rep: number): string {
  if (rep <= -50) return "hostile";
  if (rep <= -20) return "unfriendly";
  if (rep < 20) return "neutral";
  if (rep < 50) return "friendly";
  if (rep < 80) return "allied";
  return "devoted";
}

function getRepBar(rep: number) {
  // Clamp to -100 to 100, map to 0-100%
  const clamped = Math.max(-100, Math.min(100, rep));
  const pct = (clamped + 100) / 2;
  return pct;
}

const NpcReputationSidebar = ({ characterId }: NpcReputationSidebarProps) => {
  const [entries, setEntries] = useState<NpcEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<NpcEntry | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!characterId) return;
    const { data } = await supabase
      .from("npc_reputation")
      .select("*")
      .eq("character_id", characterId)
      .order("last_met_at", { ascending: false });
    if (data) setEntries(data as NpcEntry[]);
  }, [characterId]);

  useEffect(() => {
    if (open) fetchEntries();
  }, [open, fetchEntries]);

  const friendlyCount = entries.filter(e => e.reputation >= 20).length;
  const hostileCount = entries.filter(e => e.reputation <= -20).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card/50 text-muted-foreground transition hover:border-primary/30 hover:text-primary">
          <Users className="h-5 w-5" />
          {entries.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
              {entries.length}
            </span>
          )}
        </motion.button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] sm:w-[440px] bg-background/95 backdrop-blur-xl border-border p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <SheetHeader>
            <SheetTitle className="font-display text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" /> NPC Relationships
            </SheetTitle>
          </SheetHeader>
          <div className="flex gap-4 mt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{entries.length}</p>
              <p className="text-[10px] text-muted-foreground">NPCs Met</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{friendlyCount}</p>
              <p className="text-[10px] text-muted-foreground">Allies</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-destructive">{hostileCount}</p>
              <p className="text-[10px] text-muted-foreground">Enemies</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-fantasy" style={{ maxHeight: "calc(100vh - 160px)" }}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
                  <ChevronLeft className="h-3 w-3" /> Back to list
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{DISPOSITION_CONFIG[getDisposition(selected.reputation)]?.icon || "😐"}</span>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{selected.npc_name}</h2>
                    <span className={`text-xs font-medium ${DISPOSITION_CONFIG[getDisposition(selected.reputation)]?.color}`}>
                      {DISPOSITION_CONFIG[getDisposition(selected.reputation)]?.label}
                    </span>
                  </div>
                </div>

                {/* Reputation bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Hostile</span>
                    <span>Rep: {selected.reputation}</span>
                    <span>Devoted</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden relative">
                    <div className="absolute inset-0 flex">
                      <div className="w-1/4 bg-destructive/20" />
                      <div className="w-1/4 bg-orange-400/10" />
                      <div className="w-1/4 bg-accent/10" />
                      <div className="w-1/4 bg-primary/20" />
                    </div>
                    <motion.div
                      className="absolute top-0 h-full w-1 bg-foreground rounded-full shadow-lg"
                      animate={{ left: `${getRepBar(selected.reputation)}%` }}
                      transition={{ duration: 0.5, type: "spring" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl border border-border bg-muted/15 px-3 py-2 text-center">
                    <Heart className="h-4 w-4 mx-auto text-accent mb-1" />
                    <p className="text-sm font-bold text-foreground">{selected.interactions}</p>
                    <p className="text-[9px] text-muted-foreground">Interactions</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/15 px-3 py-2 text-center">
                    <Eye className="h-4 w-4 mx-auto text-primary mb-1" />
                    <p className="text-sm font-bold text-foreground">{new Date(selected.first_met_at).toLocaleDateString()}</p>
                    <p className="text-[9px] text-muted-foreground">First Met</p>
                  </div>
                </div>

                {selected.last_interaction && (
                  <div className="rounded-xl border border-border bg-muted/15 px-4 py-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last Interaction</p>
                    <p className="text-xs text-foreground italic">"{selected.last_interaction}"</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(selected.last_met_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Reputation effects hint */}
                <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                  <p className="text-[10px] text-accent uppercase tracking-wider mb-1">Reputation Effects</p>
                  <p className="text-xs text-foreground">
                    {selected.reputation >= 50
                      ? "This NPC offers you special discounts and hidden dialogue options."
                      : selected.reputation >= 20
                      ? "This NPC is willing to help and share information freely."
                      : selected.reputation >= -20
                      ? "This NPC treats you with cautious indifference."
                      : selected.reputation >= -50
                      ? "This NPC is wary of you and may refuse services."
                      : "This NPC actively works against you and may alert enemies."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {entries.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No NPCs encountered yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Meet NPCs in your adventure to build relationships!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {entries.map((entry, i) => {
                      const disp = getDisposition(entry.reputation);
                      const cfg = DISPOSITION_CONFIG[disp];
                      return (
                        <motion.button key={entry.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          onClick={() => setSelected(entry)}
                          className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/10 px-4 py-3 text-left transition hover:border-primary/20 hover:bg-primary/5">
                          <span className="text-2xl shrink-0">{cfg.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{entry.npc_name}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <span className="text-[10px] text-muted-foreground">Rep: {entry.reputation}</span>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <span className="text-[10px] text-muted-foreground">{entry.interactions}× met</span>
                            </div>
                          </div>
                          <Eye className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NpcReputationSidebar;
