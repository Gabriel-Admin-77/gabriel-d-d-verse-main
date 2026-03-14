import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, CheckCircle2, Circle, Loader2, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface Quest {
  id: string;
  quest_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface QuestLogSidebarProps {
  characterId: string | undefined;
  adventureId: string | null;
}

const QuestLogSidebar = ({ characterId, adventureId }: QuestLogSidebarProps) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchQuests = useCallback(async () => {
    if (!characterId) return;
    setLoading(true);
    const advId = adventureId ?? "free-roam";
    const { data } = await supabase
      .from("quest_log")
      .select("*")
      .eq("character_id", characterId)
      .eq("adventure_id", advId)
      .order("created_at", { ascending: true });
    setQuests((data as Quest[]) ?? []);
    setLoading(false);
  }, [characterId, adventureId]);

  useEffect(() => {
    if (open) fetchQuests();
  }, [open, fetchQuests]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!characterId) return;
    const channel = supabase
      .channel("quest_log_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "quest_log" }, () => {
        if (open) fetchQuests();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [characterId, open, fetchQuests]);

  const activeQuests = quests.filter(q => q.status === "active");
  const completedQuests = quests.filter(q => q.status === "completed");

  const clearCompleted = async () => {
    if (!characterId) return;
    const ids = completedQuests.map(q => q.id);
    if (ids.length === 0) return;
    await supabase.from("quest_log").delete().in("id", ids);
    fetchQuests();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-ink relative flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium font-ui transition"
        >
          <ScrollText className="h-4 w-4" />
          <span className="hidden sm:inline">Quests</span>
          {activeQuests.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {activeQuests.length}
            </span>
          )}
        </motion.button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[340px] sm:w-[400px] bg-card border-border p-0 flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold text-foreground">Quest Log</h3>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-fantasy">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : quests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No quests yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Quests will appear as you progress through your adventure</p>
            </div>
          ) : (
            <>
              {/* Active Quests */}
              {activeQuests.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[11px] font-medium text-primary uppercase tracking-wider mb-3 font-ui">
                    Active ({activeQuests.length})
                  </h4>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {activeQuests.map((quest) => (
                        <motion.div
                          key={quest.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="parchment-card rounded-lg px-4 py-3 border border-primary/20"
                        >
                          <div className="flex items-start gap-2.5">
                            <Circle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{quest.title}</p>
                              {quest.description && (
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{quest.description}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Completed Quests */}
              {completedQuests.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider font-ui">
                      Completed ({completedQuests.length})
                    </h4>
                    <button
                      onClick={clearCompleted}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {completedQuests.map((quest) => (
                        <motion.div
                          key={quest.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="rounded-lg px-4 py-3 bg-muted/30 border border-border/50 opacity-70"
                        >
                          <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground line-through">{quest.title}</p>
                              {quest.description && (
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{quest.description}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default QuestLogSidebar;
