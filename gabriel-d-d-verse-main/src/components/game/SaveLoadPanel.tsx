import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, FolderOpen, Trash2, Loader2, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaveSlot {
  id: string;
  slot_name: string;
  adventure_id: string;
  adventure_title: string;
  character_name: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface SaveLoadPanelProps {
  open: boolean;
  onClose: () => void;
  characterId: string | null;
  characterName: string | null;
  adventureId: string | null;
  adventureTitle: string | null;
  onLoad: (adventureId: string) => void;
}

const SaveLoadPanel = ({ open, onClose, characterId, characterName, adventureId, adventureTitle, onLoad }: SaveLoadPanelProps) => {
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSaves = async () => {
    if (!characterId) return;
    setLoading(true);
    const { data } = await supabase
      .from("save_slots" as any)
      .select("*")
      .eq("character_id", characterId)
      .order("updated_at", { ascending: false });
    setSaves((data as any[] || []) as SaveSlot[]);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchSaves();
  }, [open, characterId]);

  const saveGame = async () => {
    if (!characterId || !adventureId) {
      toast.error("Select an adventure first!");
      return;
    }
    setSaving(true);

    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("character_id", characterId)
      .eq("adventure_id", adventureId);

    const existing = saves.find(s => s.adventure_id === adventureId);
    if (existing) {
      await supabase.from("save_slots" as any).update({
        message_count: count || 0,
        adventure_title: adventureTitle || "Free Roam",
        character_name: characterName || "Unknown",
        updated_at: new Date().toISOString(),
      } as any).eq("id", existing.id);
    } else {
      await supabase.from("save_slots" as any).insert({
        character_id: characterId,
        adventure_id: adventureId,
        adventure_title: adventureTitle || "Free Roam",
        character_name: characterName || "Unknown",
        slot_name: `${adventureTitle || "Free Roam"} — ${new Date().toLocaleDateString()}`,
        message_count: count || 0,
      } as any);
    }

    toast.success("Adventure saved!");
    setSaving(false);
    fetchSaves();
  };

  const deleteSave = async (id: string) => {
    await supabase.from("save_slots" as any).delete().eq("id", id);
    toast.success("Save deleted");
    fetchSaves();
  };

  const loadSave = (save: SaveSlot) => {
    onLoad(save.adventure_id);
    onClose();
    toast.success(`Loaded: ${save.adventure_title}`);
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="parchment-card rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" /> Save / Load
          </h2>
          <motion.button onClick={onClose} whileTap={{ scale: 0.95 }} className="btn-ink rounded-lg p-1.5">
            <X className="h-4 w-4" />
          </motion.button>
        </div>

        <motion.button
          onClick={saveGame}
          disabled={saving || !adventureId}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full mb-4 btn-wax flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-ui font-semibold disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Current Adventure
        </motion.button>

        <div className="divider-ornate mb-4" />

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : saves.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No saves yet. Start an adventure and save your progress!</p>
        ) : (
          <div className="space-y-2">
            {saves.map((save) => (
              <div key={save.id} className="rounded-xl border border-border bg-muted/10 p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{save.adventure_title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(save.updated_at).toLocaleString()}
                    <span>· {save.message_count} msgs</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <motion.button
                    onClick={() => loadSave(save)}
                    whileTap={{ scale: 0.95 }}
                    className="btn-ink rounded-lg px-3 py-1.5 text-xs font-ui text-primary"
                  >
                    Load
                  </motion.button>
                  <motion.button
                    onClick={() => deleteSave(save.id)}
                    whileTap={{ scale: 0.95 }}
                    className="btn-ink rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SaveLoadPanel;
