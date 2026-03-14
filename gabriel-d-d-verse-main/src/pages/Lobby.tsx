import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ADVENTURES, Adventure } from "@/lib/adventures";
import { toast } from "sonner";
import { Users, Plus, Loader2, Sparkles, ArrowLeft, Swords, Crown, UserPlus } from "lucide-react";

interface GameSession {
  id: string;
  host_user_id: string;
  adventure_id: string;
  adventure_title: string;
  status: string;
  max_players: number;
  created_at: string;
  player_count?: number;
}

const Lobby = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [character, setCharacter] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  // Load character
  useEffect(() => {
    if (!user) return;
    supabase.from("characters").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setCharacter(data));
  }, [user]);

  // Load sessions
  const fetchSessions = async () => {
    setLoading(true);
    const { data: sessionsData } = await supabase
      .from("game_sessions").select("*").eq("status", "waiting")
      .order("created_at", { ascending: false });

    if (sessionsData) {
      // Get player counts
      const sessionIds = sessionsData.map(s => s.id);
      const { data: players } = await supabase
        .from("session_players").select("session_id").in("session_id", sessionIds.length > 0 ? sessionIds : ["none"]);

      const counts: Record<string, number> = {};
      players?.forEach(p => { counts[p.session_id] = (counts[p.session_id] || 0) + 1; });

      setSessions(sessionsData.map(s => ({ ...s, player_count: counts[s.id] || 0 })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  // Realtime subscription for lobby updates
  useEffect(() => {
    const channel = supabase
      .channel("lobby")
      .on("postgres_changes", { event: "*", schema: "public", table: "game_sessions" }, () => fetchSessions())
      .on("postgres_changes", { event: "*", schema: "public", table: "session_players" }, () => fetchSessions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const createSession = async () => {
    if (!user || !character || !selectedAdventure) return;
    setCreating(true);
    try {
      const { data: session, error } = await supabase.from("game_sessions").insert({
        host_user_id: user.id,
        adventure_id: selectedAdventure.id,
        adventure_title: selectedAdventure.title,
        max_players: 4,
        current_turn_user_id: user.id,
        turn_order: [user.id],
      }).select().single();

      if (error) throw error;

      // Join as first player
      await supabase.from("session_players").insert({
        session_id: session.id,
        user_id: user.id,
        character_id: character.id,
        character_name: character.name,
        character_class: character.class,
      });

      toast.success("Session created!");
      navigate(`/session/${session.id}`);
    } catch (err: any) {
      toast.error("Failed to create session");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    if (!user || !character) {
      toast.error("You need a character first!");
      navigate("/create-character");
      return;
    }

    try {
      // Check if already in session
      const { data: existing } = await supabase.from("session_players")
        .select("id").eq("session_id", sessionId).eq("user_id", user.id).maybeSingle();
      
      if (existing) {
        navigate(`/session/${sessionId}`);
        return;
      }

      // Add turn order
      const { data: session } = await supabase.from("game_sessions").select("turn_order, host_user_id").eq("id", sessionId).single();

      await supabase.from("session_players").insert({
        session_id: sessionId,
        user_id: user.id,
        character_id: character.id,
        character_name: character.name,
        character_class: character.class,
      });

      // Update turn order (host does this via their update policy, but we need a workaround)
      // For simplicity, the host's session update policy handles this
      toast.success("Joined session!");
      navigate(`/session/${sessionId}`);
    } catch (err: any) {
      toast.error("Failed to join session");
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cursor-quill">
      <header className="border-b border-border bg-card/50 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <motion.button onClick={() => navigate("/")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn-ink rounded-lg p-2">
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full btn-wax animate-candle">
              <Users className="h-5 w-5 text-gold-glow" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-gold-glow">Adventurer's Tavern</h1>
              <p className="text-[11px] text-muted-foreground">Public Lobbies — Join or Create</p>
            </div>
          </div>
          <motion.button onClick={() => setShowCreate(true)} disabled={!character}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="btn-wax flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-ui font-semibold text-foreground disabled:opacity-50">
            <Plus className="h-4 w-4" /> Host Session
          </motion.button>
        </div>
      </header>

      {!character && (
        <div className="border-b border-border bg-destructive/10 px-6 py-4 text-center">
          <p className="text-sm text-destructive">You need a character to join multiplayer sessions.</p>
          <motion.button onClick={() => navigate("/create-character")} whileHover={{ scale: 1.02 }}
            className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Create Character
          </motion.button>
        </div>
      )}

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="parchment-card rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Choose Adventure</h2>
              <div className="space-y-2 mb-4">
                {ADVENTURES.map(adv => (
                  <motion.button key={adv.id} whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedAdventure(adv)}
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      selectedAdventure?.id === adv.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/10 hover:border-primary/30"
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{adv.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{adv.title}</p>
                        <p className="text-[10px] text-muted-foreground">{adv.difficulty} · Level {adv.recommendedLevel}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-2">
                <motion.button onClick={() => setShowCreate(false)} whileHover={{ scale: 1.02 }}
                  className="btn-ink flex-1 rounded-xl px-4 py-2.5 text-sm font-ui">Cancel</motion.button>
                <motion.button onClick={createSession} disabled={!selectedAdventure || creating}
                  whileHover={{ scale: 1.02 }}
                  className="btn-wax flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-ui font-semibold disabled:opacity-50">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
                  Create Session
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session List */}
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Open Sessions
          </h2>
          <motion.button onClick={fetchSessions} whileHover={{ scale: 1.05 }}
            className="text-xs text-muted-foreground hover:text-foreground transition">
            Refresh
          </motion.button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="parchment-card rounded-2xl p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground">No open sessions yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Be the first to host an adventure!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <motion.div key={session.id}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="parchment-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <Swords className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{session.adventure_title}</h3>
                      {session.host_user_id === user?.id && (
                        <Crown className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {session.player_count}/{session.max_players} players · Waiting for adventurers
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => joinSession(session.id)}
                  disabled={!character || (session.player_count ?? 0) >= session.max_players}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn-wax flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-ui font-medium disabled:opacity-50">
                  <UserPlus className="h-4 w-4" />
                  {session.host_user_id === user?.id ? "Resume" : "Join"}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
