import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ADVENTURES } from "@/lib/adventures";
import { toast } from "sonner";
import { Send, BookOpen, Sparkles, Loader2, Users, Crown, ArrowLeft, Play, LogOut as LeaveIcon } from "lucide-react";
import PartyChatEmotes from "@/components/game/PartyChatEmotes";

interface SessionPlayer {
  id: string;
  user_id: string;
  character_name: string;
  character_class: string;
}

interface ChatMsg {
  id: string;
  role: string;
  content: string;
  player_name: string | null;
  created_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dungeon-master`;

function parseChoices(content: string) {
  const choiceRegex = /\[CHOICE_[1-4]\]\s*(.*)/g;
  const choices: string[] = [];
  let match;
  while ((match = choiceRegex.exec(content)) !== null) choices.push(match[1].trim());
  const narrative = content.replace(/\[CHOICE_[1-4]\]\s*.*/g, "").trim();
  return { narrative, choices };
}

const MultiplayerSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [character, setCharacter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isHost = session?.host_user_id === user?.id;
  const isMyTurn = session?.current_turn_user_id === user?.id;
  const adventure = ADVENTURES.find(a => a.id === session?.adventure_id) || null;

  // Load initial data
  useEffect(() => {
    if (!sessionId || !user) return;
    const load = async () => {
      const [sessRes, playersRes, msgsRes, charRes] = await Promise.all([
        supabase.from("game_sessions").select("*").eq("id", sessionId).single(),
        supabase.from("session_players").select("*").eq("session_id", sessionId),
        supabase.from("chat_messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
        supabase.from("characters").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setSession(sessRes.data);
      setPlayers(playersRes.data || []);
      setMessages(msgsRes.data || []);
      setCharacter(charRes.data);
      setLoadingInit(false);
    };
    load();
  }, [sessionId, user]);

  // Realtime subscriptions
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` },
        (payload) => { if (payload.new) setSession(payload.new); })
      .on("postgres_changes", { event: "*", schema: "public", table: "session_players", filter: `session_id=eq.${sessionId}` },
        () => {
          supabase.from("session_players").select("*").eq("session_id", sessionId).then(({ data }) => setPlayers(data || []));
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const msg = payload.new as ChatMsg;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start game (host only)
  const startGame = async () => {
    if (!isHost || !sessionId || !adventure) return;
    const turnOrder = players.map(p => p.user_id);
    const welcomeContent = `Welcome, adventurers! You are about to embark on **${adventure.title}** — set in the ${adventure.setting}.\n\n*${adventure.description}*\n\nYour party: ${players.map(p => `${p.character_name} (${p.character_class})`).join(", ")}.\n\n[CHOICE_1] Begin the adventure with caution, scouting ahead\n[CHOICE_2] Charge in boldly, ready for anything\n[CHOICE_3] Seek out local allies before proceeding\n[CHOICE_4] Study ancient texts about this place first`;

    await supabase.from("game_sessions").update({
      status: "playing",
      turn_order: turnOrder,
      current_turn_user_id: turnOrder[0],
    }).eq("id", sessionId);

    await supabase.from("chat_messages").insert({
      character_id: character.id,
      role: "dm",
      content: welcomeContent,
      session_id: sessionId,
      player_name: null,
    });
  };

  // Send a choice (player's turn)
  const sendChoice = async (choice: string) => {
    if (!isMyTurn || isLoading || !sessionId || !character) return;
    setIsLoading(true);
    setIsStreaming(true);

    // Save player message
    await supabase.from("chat_messages").insert({
      character_id: character.id,
      role: "player",
      content: choice,
      session_id: sessionId,
      player_name: character.name,
    });

    // Build AI messages from history
    const aiMessages = messages.concat({ id: "temp", role: "player", content: choice, player_name: character.name, created_at: "" })
      .map(m => ({
        role: m.role === "dm" ? "assistant" : "user",
        content: m.player_name ? `[${m.player_name}]: ${m.content}` : m.content,
      }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: aiMessages,
          character,
          adventure,
          multiplayer: true,
          partyMembers: players.map(p => `${p.character_name} (${p.character_class})`),
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("AI error");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) assistantSoFar += content;
          } catch { break; }
        }
      }

      // Save DM response
      if (assistantSoFar) {
        await supabase.from("chat_messages").insert({
          character_id: character.id,
          role: "dm",
          content: assistantSoFar,
          session_id: sessionId,
          player_name: null,
        });

        // Advance turn
        const turnOrder = session.turn_order || [];
        const currentIdx = turnOrder.indexOf(user!.id);
        const nextIdx = (currentIdx + 1) % turnOrder.length;
        await supabase.from("game_sessions").update({
          current_turn_user_id: turnOrder[nextIdx],
        }).eq("id", sessionId);
      }
    } catch (err) {
      toast.error("Error communicating with the Dungeon Master");
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const leaveSession = async () => {
    if (!sessionId || !user) return;
    await supabase.from("session_players").delete().eq("session_id", sessionId).eq("user_id", user.id);
    toast.success("Left the session");
    navigate("/lobby");
  };

  const lastDmMsg = [...messages].reverse().find(m => m.role === "dm");
  const lastDmParsed = lastDmMsg && !isStreaming ? parseChoices(lastDmMsg.content) : null;
  const availableChoices = lastDmParsed?.choices ?? [];
  const currentTurnPlayer = players.find(p => p.user_id === session?.current_turn_user_id);

  if (loadingInit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background cursor-quill">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <motion.button onClick={() => navigate("/lobby")} whileHover={{ scale: 1.05 }}
              className="btn-ink rounded-lg p-2"><ArrowLeft className="h-4 w-4" /></motion.button>
            <div>
              <h1 className="font-display text-lg font-semibold text-gold-glow">
                {session?.adventure_title || "Session"}
              </h1>
              <p className="text-[10px] text-muted-foreground">
                {session?.status === "waiting" ? "Waiting for players..." : "In progress"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isHost && session?.status === "waiting" && players.length >= 1 && (
              <motion.button onClick={startGame} whileHover={{ scale: 1.03 }}
                className="btn-wax flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-ui font-semibold">
                <Play className="h-4 w-4" /> Start Adventure
              </motion.button>
            )}
            <motion.button onClick={leaveSession} whileHover={{ scale: 1.03 }}
              className="btn-ink flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-destructive">
              <LeaveIcon className="h-4 w-4" /> Leave
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Chat area */}
        <div className="flex-1 flex flex-col" style={{ minHeight: 400 }}>
          {/* Turn indicator */}
          {session?.status === "playing" && (
            <div className="border-b border-border bg-card/30 px-5 py-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">
                {isMyTurn ? (
                  <span className="text-primary font-semibold">Your turn to act!</span>
                ) : (
                  <>Waiting for <span className="font-semibold text-foreground">{currentTurnPlayer?.character_name || "..."}</span> to act</>
                )}
              </span>
              {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto" />}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-fantasy">
            {session?.status === "waiting" && (
              <div className="parchment-card rounded-xl p-8 text-center mb-4">
                <Users className="mx-auto h-10 w-10 text-primary/30 mb-3" />
                <p className="text-sm text-muted-foreground">Waiting for the host to start the adventure...</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{players.length} player(s) ready</p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map(msg => {
                const parsed = msg.role === "dm" ? parseChoices(msg.content) : null;
                const displayContent = parsed ? parsed.narrative : msg.content;
                return (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 ${msg.role === "dm" ? "" : "flex justify-end"}`}>
                    <div className={`max-w-[85%] rounded-lg px-5 py-4 text-sm leading-relaxed ${
                      msg.role === "dm"
                        ? "parchment-card text-foreground"
                        : "ml-auto bg-primary/10 border border-primary/20 text-foreground"
                    }`}>
                      <div className="mb-2 flex items-center gap-2">
                        {msg.role === "dm" && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          {msg.role === "dm" ? "Dungeon Master" : msg.player_name || "You"}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{displayContent}</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Choices (only for current turn player) */}
          {availableChoices.length > 0 && isMyTurn && !isLoading && session?.status === "playing" && (
            <div className="border-t border-border bg-card/30 backdrop-blur-sm px-4 py-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider font-ui">Your turn — Choose your action</p>
              <div className="divider-ornate mb-3" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {availableChoices.map((choice, i) => (
                  <motion.button key={i}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => sendChoice(choice)}
                    className="btn-ink rounded-lg px-4 py-3 text-left text-sm text-foreground transition-all group">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full btn-wax text-[10px] font-bold font-ui">
                      {i + 1}
                    </span>
                    {choice}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Party chat input */}
          {session?.status === "playing" && character && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem("chatMsg") as HTMLInputElement);
                const msg = input.value.trim();
                if (!msg || msg.length > 500) return;
                input.value = "";
                await supabase.from("chat_messages").insert({
                  character_id: character.id,
                  role: "player",
                  content: msg,
                  session_id: sessionId!,
                  player_name: character.name,
                });
              }}
              className="border-t border-border bg-card/30 backdrop-blur-sm px-4 py-3 flex items-center gap-2"
            >
              <input
                name="chatMsg"
                type="text"
                maxLength={500}
                placeholder="Send a message to your party…"
                className="flex-1 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <PartyChatEmotes
                sessionId={sessionId!}
                playerName={character.name}
                userId={user!.id}
              />
              <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="btn-wax rounded-lg p-2.5">
                <Send className="h-4 w-4 text-foreground" />
              </motion.button>
            </form>
          )}
        </div>

        {/* Player sidebar */}
        <div className="w-64 border-l border-border bg-card/30 p-4 hidden lg:block">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Party</h3>
          </div>
          <div className="space-y-2">
            {players.map(p => (
              <div key={p.id} className={`rounded-xl border p-3 transition ${
                p.user_id === session?.current_turn_user_id
                  ? "border-primary/30 bg-primary/10"
                  : "border-border bg-muted/10"
              }`}>
                <div className="flex items-center gap-2">
                  {p.user_id === session?.host_user_id && <Crown className="h-3 w-3 text-primary" />}
                  <span className="text-xs font-semibold text-foreground">{p.character_name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.character_class}</p>
                {p.user_id === session?.current_turn_user_id && session?.status === "playing" && (
                  <span className="text-[9px] text-primary font-medium mt-1 block">⚔️ Acting</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerSession;
