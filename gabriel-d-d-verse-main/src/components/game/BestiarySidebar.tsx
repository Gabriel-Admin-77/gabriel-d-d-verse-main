import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, Skull, Shield, Swords, Loader2, ImageIcon, X, Eye } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BestiaryEntry {
  id: string;
  monster_id: string;
  monster_name: string;
  hp: number;
  max_hp: number;
  ac: number;
  cr: string;
  times_encountered: number;
  times_defeated: number;
  weakness_notes: string;
  portrait_url: string | null;
  first_seen_at: string;
}

interface BestiarySidebarProps {
  characterId: string | undefined;
}

const SCENE_ART_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scene-art`;

const RARITY_BY_CR: Record<string, { color: string; label: string }> = {
  "1/4": { color: "text-muted-foreground", label: "Common" },
  "1/2": { color: "text-muted-foreground", label: "Common" },
  "1": { color: "text-accent", label: "Uncommon" },
  "2": { color: "text-accent", label: "Uncommon" },
  "3": { color: "text-primary", label: "Rare" },
  "4": { color: "text-primary", label: "Rare" },
  "5": { color: "text-destructive", label: "Very Rare" },
};

const BestiarySidebar = ({ characterId }: BestiarySidebarProps) => {
  const [entries, setEntries] = useState<BestiaryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BestiaryEntry | null>(null);
  const [generatingPortrait, setGeneratingPortrait] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!characterId) return;
    const { data } = await supabase
      .from("bestiary_entries")
      .select("*")
      .eq("character_id", characterId)
      .order("last_seen_at", { ascending: false });
    if (data) setEntries(data as BestiaryEntry[]);
  }, [characterId]);

  useEffect(() => {
    if (open) fetchEntries();
  }, [open, fetchEntries]);

  const generatePortrait = async (entry: BestiaryEntry) => {
    setGeneratingPortrait(entry.id);
    try {
      const resp = await fetch(SCENE_ART_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          narrative: `A dramatic portrait of a ${entry.monster_name}, a dangerous fantasy monster with CR ${entry.cr}. Close-up view, menacing pose, dark atmospheric background.`,
          adventure: null,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.imageUrl) {
          await supabase
            .from("bestiary_entries")
            .update({ portrait_url: data.imageUrl })
            .eq("id", entry.id);
          setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, portrait_url: data.imageUrl } : e));
          if (selected?.id === entry.id) setSelected({ ...entry, portrait_url: data.imageUrl });
        }
      }
    } catch {
      toast.error("Failed to generate portrait");
    }
    setGeneratingPortrait(null);
  };

  const rarity = (cr: string) => RARITY_BY_CR[cr] || { color: "text-destructive", label: "Legendary" };
  const totalDefeated = entries.reduce((s, e) => s + e.times_defeated, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card/50 text-muted-foreground transition hover:border-primary/30 hover:text-primary">
          <Bug className="h-5 w-5" />
          {entries.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {entries.length}
            </span>
          )}
        </motion.button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] sm:w-[440px] bg-background/95 backdrop-blur-xl border-border p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <SheetHeader>
            <SheetTitle className="font-display text-lg flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" /> Monster Bestiary
            </SheetTitle>
          </SheetHeader>
          <div className="flex gap-4 mt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{entries.length}</p>
              <p className="text-[10px] text-muted-foreground">Discovered</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-destructive">{totalDefeated}</p>
              <p className="text-[10px] text-muted-foreground">Defeated</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-fantasy" style={{ maxHeight: "calc(100vh - 160px)" }}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
                  ← Back to list
                </button>
                {/* Portrait */}
                <div className="relative mb-4 rounded-xl overflow-hidden border border-border bg-muted/20 aspect-[3/2]">
                  {selected.portrait_url ? (
                    <img src={selected.portrait_url} alt={selected.monster_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Skull className="h-10 w-10 text-muted-foreground/30" />
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => generatePortrait(selected)}
                        disabled={generatingPortrait === selected.id}
                        className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs text-primary">
                        {generatingPortrait === selected.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                        Generate Portrait
                      </motion.button>
                    </div>
                  )}
                </div>

                <h2 className="font-display text-xl font-bold text-foreground mb-1">{selected.monster_name}</h2>
                <span className={`text-xs font-medium ${rarity(selected.cr).color}`}>
                  {rarity(selected.cr).label} · CR {selected.cr}
                </span>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="rounded-xl border border-border bg-muted/15 px-3 py-2 text-center">
                    <Skull className="h-4 w-4 mx-auto text-destructive mb-1" />
                    <p className="text-sm font-bold text-foreground">{selected.max_hp}</p>
                    <p className="text-[9px] text-muted-foreground">Max HP</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/15 px-3 py-2 text-center">
                    <Shield className="h-4 w-4 mx-auto text-primary mb-1" />
                    <p className="text-sm font-bold text-foreground">{selected.ac}</p>
                    <p className="text-[9px] text-muted-foreground">AC</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/15 px-3 py-2 text-center">
                    <Swords className="h-4 w-4 mx-auto text-accent mb-1" />
                    <p className="text-sm font-bold text-foreground">{selected.times_defeated}</p>
                    <p className="text-[9px] text-muted-foreground">Kills</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-muted/15 px-4 py-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Encounter Log</p>
                  <p className="text-xs text-foreground">
                    Encountered <span className="font-bold">{selected.times_encountered}</span> time{selected.times_encountered !== 1 ? "s" : ""}.
                    Defeated <span className="font-bold text-destructive">{selected.times_defeated}</span> time{selected.times_defeated !== 1 ? "s" : ""}.
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    First seen: {new Date(selected.first_seen_at).toLocaleDateString()}
                  </p>
                </div>

                {selected.weakness_notes && (
                  <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                    <p className="text-[10px] text-accent uppercase tracking-wider mb-1">Weakness Notes</p>
                    <p className="text-xs text-foreground">{selected.weakness_notes}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {entries.length === 0 ? (
                  <div className="text-center py-16">
                    <Bug className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No monsters encountered yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Fight monsters in your adventure to catalog them!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {entries.map((entry, i) => (
                      <motion.button key={entry.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        onClick={() => setSelected(entry)}
                        className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/10 px-4 py-3 text-left transition hover:border-primary/20 hover:bg-primary/5">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border bg-muted/30 shrink-0">
                          {entry.portrait_url ? (
                            <img src={entry.portrait_url} alt={entry.monster_name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Skull className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{entry.monster_name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-medium ${rarity(entry.cr).color}`}>CR {entry.cr}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{entry.times_encountered}× seen</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-destructive">{entry.times_defeated}× killed</span>
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      </motion.button>
                    ))}
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

export default BestiarySidebar;
