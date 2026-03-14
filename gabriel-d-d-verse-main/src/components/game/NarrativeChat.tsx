import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, BookOpen, Sparkles, Loader2, ImageIcon, Trash2 } from "lucide-react";
import { ChatMessage } from "@/lib/gameTypes";
import { Adventure } from "@/lib/adventures";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import WeatherParticles, { detectWeather, type WeatherType } from "./WeatherParticles";
import CinematicTransition, { detectSceneType, type SceneType } from "./CinematicTransition";

interface NarrativeChatProps {
  characterId: string | null;
  character: any | null;
  adventure: Adventure | null;
  worldEventContext?: string;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onDmResponse?: (content: string) => void;
  onMonsterEncounter?: (monster: { id: string; name: string; hp: number; maxHp: number; ac: number; cr: string }) => void;
  onMonsterDefeated?: (monsterId: string) => void;
  onPuzzleTrigger?: (type: "lockpick" | "riddle" | "trap", dc: number) => void;
  onNpcInteraction?: (npc: { id: string; name: string; repChange: number; summary: string }) => void;
  onStatusEffect?: (effectId: string, duration: number) => void;
  onSkillCheck?: (skill: string, dc: number) => void;
  onRecipeDiscover?: (recipe: { id: string; name: string; ingredients: string[]; skill: string; dc: number; icon: string }) => void;
}

interface ParsedContent {
  narrative: string;
  choices: string[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dungeon-master`;
const SCENE_ART_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scene-art`;

function parseChoices(content: string): ParsedContent {
  const choiceRegex = /\[CHOICE_[1-4]\]\s*(.*)/g;
  const choices: string[] = [];
  let match;
  while ((match = choiceRegex.exec(content)) !== null) {
    choices.push(match[1].trim());
  }
  const narrative = content
    .replace(/\[CHOICE_[1-4]\]\s*.*/g, "")
    .replace(/\[XP_REWARD\]\s*\d+/gi, "")
    .replace(/\[GOLD_REWARD\]\s*\d+/gi, "")
    .replace(/\[LOOT_DROP\]\s*\S+\s+.+/gi, "")
    .replace(/\[HP_DAMAGE\]\s*\d+/gi, "")
    .replace(/\[QUEST_START\]\s*.+/gi, "")
    .replace(/\[QUEST_COMPLETE\]\s*.+/gi, "")
    .replace(/\[NPC_REP\]\s*.+/gi, "")
    .replace(/\[MONSTER\]\s*.+/gi, "")
    .replace(/\[MONSTER_DEFEATED\]\s*.+/gi, "")
    .replace(/\[PUZZLE\]\s*.+/gi, "")
    .replace(/\[STATUS_EFFECT\]\s*.+/gi, "")
    .replace(/\[SKILL_CHECK\]\s*.+/gi, "")
    .replace(/\[RECIPE_DISCOVER\]\s*.+/gi, "")
    .trim();
  return { narrative, choices };
}

// Parse quest tags from DM content
function parseQuestTags(content: string) {
  const starts: { questId: string; title: string; description: string }[] = [];
  const completes: string[] = [];
  
  const startRegex = /\[QUEST_START\]\s*(\S+)\s*\|\s*([^|]+)\s*\|\s*(.+)/gi;
  let m;
  while ((m = startRegex.exec(content)) !== null) {
    starts.push({ questId: m[1].trim(), title: m[2].trim(), description: m[3].trim() });
  }
  
  const completeRegex = /\[QUEST_COMPLETE\]\s*(\S+)/gi;
  while ((m = completeRegex.exec(content)) !== null) {
    completes.push(m[1].trim());
  }
  
  return { starts, completes };
}

// Track scene art per message
interface SceneArt {
  [messageId: string]: { url: string | null; loading: boolean };
}

const NarrativeChat = ({ characterId, character, adventure, worldEventContext, onMessagesChange, onDmResponse, onMonsterEncounter, onMonsterDefeated, onPuzzleTrigger, onNpcInteraction, onStatusEffect, onSkillCheck, onRecipeDiscover }: NarrativeChatProps) => {
  const getWelcomeMessage = (adv: Adventure | null): string => {
    if (adv) {
      return `Welcome, adventurer. You are about to embark on **${adv.title}** — set in the ${adv.setting}.\n\n*${adv.description}*\n\nDifficulty: ${adv.difficulty}. Prepare yourself.\n\n[CHOICE_1] Begin the adventure with caution, scouting ahead\n[CHOICE_2] Charge in boldly, ready for anything\n[CHOICE_3] Seek out local allies before proceeding\n[CHOICE_4] Study ancient texts about this place first`;
    }
    return "Welcome, adventurer. You stand at the entrance of an ancient cave. Cold wind blows from within, and extinguished torches hang on the walls. From the depths, strange scraping sounds echo...\n\n[CHOICE_1] Light a torch and cautiously enter the cave\n[CHOICE_2] Call out into the darkness to see if anyone responds\n[CHOICE_3] Search the entrance for traps or clues\n[CHOICE_4] Turn back and seek another path through the forest";
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sceneArt, setSceneArt] = useState<SceneArt>({});
  const [currentWeather, setCurrentWeather] = useState<WeatherType>("none");
  const [currentScene, setCurrentScene] = useState<SceneType>("exploration");
  const [showTransition, setShowTransition] = useState(false);
  const lastSceneRef = useRef<SceneType>("exploration");
  const bottomRef = useRef<HTMLDivElement>(null);
  const savingRef = useRef(false);

  // Save a single message to DB
  const saveMessageToDB = useCallback(async (msg: ChatMessage) => {
    if (!characterId) return;
    const adventureId = adventure?.id ?? "free-roam";
    try {
      await supabase.from("chat_messages").insert({
        id: msg.id,
        character_id: characterId,
        role: msg.role,
        content: msg.content,
        adventure_id: adventureId,
      });
    } catch (err) {
      console.warn("Failed to save message:", err);
    }
  }, [characterId, adventure?.id]);

  // Load chat history from DB on adventure/character change
  useEffect(() => {
    const adventureId = adventure?.id ?? "free-roam";
    const welcomeContent = getWelcomeMessage(adventure);

    if (!characterId) {
      setMessages([{ id: crypto.randomUUID(), role: "dm", content: welcomeContent, timestamp: new Date() }]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("character_id", characterId)
        .eq("adventure_id", adventureId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error || !data || data.length === 0) {
        // No history — show welcome and save it
        const welcomeMsg: ChatMessage = { id: crypto.randomUUID(), role: "dm" as const, content: welcomeContent, timestamp: new Date() };
        setMessages([welcomeMsg]);
        // Save welcome message
        await supabase.from("chat_messages").insert({
          id: welcomeMsg.id,
          character_id: characterId,
          role: welcomeMsg.role,
          content: welcomeMsg.content,
          adventure_id: adventureId,
        });
      } else {
        // Restore history
        const restored: ChatMessage[] = data.map((row: any) => ({
          id: row.id,
          role: row.role as "dm" | "player",
          content: row.content,
          timestamp: new Date(row.created_at),
        }));
        setMessages(restored);
      }
      setLoadingHistory(false);

      // Detect weather from last DM message
      const lastDm = (data ?? []).filter((r: any) => r.role === "dm").pop();
      if (lastDm) {
        const { narrative } = parseChoices(lastDm.content);
        setCurrentWeather(detectWeather(narrative));
      }
    };

    setInput("");
    setSceneArt({});
    setCurrentWeather("none");
    load();

    return () => { cancelled = true; };
  }, [characterId, adventure?.id]);

  // Generate scene art for a DM message
  const generateSceneArt = useCallback(async (messageId: string, narrative: string) => {
    setSceneArt((prev) => ({ ...prev, [messageId]: { url: null, loading: true } }));
    try {
      const resp = await fetch(SCENE_ART_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ narrative, adventure }),
      });
      if (!resp.ok) {
        console.warn("Scene art failed:", resp.status);
        setSceneArt((prev) => ({ ...prev, [messageId]: { url: null, loading: false } }));
        return;
      }
      const data = await resp.json();
      setSceneArt((prev) => ({ ...prev, [messageId]: { url: data.imageUrl, loading: false } }));
    } catch (err) {
      console.warn("Scene art error:", err);
      setSceneArt((prev) => ({ ...prev, [messageId]: { url: null, loading: false } }));
    }
  }, [adventure]);

  // Clear history for current adventure
  const clearHistory = useCallback(async () => {
    if (!characterId) return;
    const adventureId = adventure?.id ?? "free-roam";
    await supabase.from("chat_messages").delete()
      .eq("character_id", characterId)
      .eq("adventure_id", adventureId);
    const welcomeMsg: ChatMessage = { id: crypto.randomUUID(), role: "dm", content: getWelcomeMessage(adventure), timestamp: new Date() };
    setMessages([welcomeMsg]);
    await saveMessageToDB(welcomeMsg);
    toast.success("Adventure history cleared");
  }, [characterId, adventure, saveMessageToDB]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sceneArt]);

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  const sendMessage = async (userInput: string) => {
    if (!userInput.trim() || isLoading) return;
    const playerMsg: ChatMessage = { id: crypto.randomUUID(), role: "player", content: userInput, timestamp: new Date() };
    setMessages((prev) => [...prev, playerMsg]);
    saveMessageToDB(playerMsg);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    const aiMessages = messages.concat(playerMsg).map((m) => ({
      role: m.role === "dm" ? "assistant" : "user", content: m.content,
    }));

    let finalMessageId = "";

    // Fetch NPC relationships for context
    let npcContext: { name: string; reputation: number; disposition: string }[] = [];
    if (characterId) {
      const { data: npcs } = await supabase
        .from("npc_reputation")
        .select("npc_name, reputation, disposition")
        .eq("character_id", characterId);
      if (npcs) npcContext = npcs.map((n: any) => ({ name: n.npc_name, reputation: n.reputation, disposition: n.disposition }));
    }

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: aiMessages, character, adventure, npcRelationships: npcContext, worldEventContext }),
      });
      if (resp.status === 429) { toast.error("Rate limit hit, try again in a moment"); setIsLoading(false); setIsStreaming(false); return; }
      if (resp.status === 402) { toast.error("Out of credits, add credits in settings"); setIsLoading(false); setIsStreaming(false); return; }
      if (!resp.ok || !resp.body) throw new Error("AI error");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const cur = assistantSoFar;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "dm" && last.id === "streaming") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cur } : m);
                }
                return [...prev, { id: "streaming", role: "dm", content: cur, timestamp: new Date() }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Finalize the streaming message and save to DB
      finalMessageId = crypto.randomUUID();
      const finalId = finalMessageId;
      setMessages((prev) => prev.map((m) => m.id === "streaming" ? { ...m, id: finalId } : m));
      if (assistantSoFar) {
        saveMessageToDB({ id: finalId, role: "dm", content: assistantSoFar, timestamp: new Date() });
      }

      // Process completed DM response: weather, scene transition, art, quests
      if (assistantSoFar) {
        const { narrative } = parseChoices(assistantSoFar);
        setCurrentWeather(detectWeather(narrative));
        
        // Detect scene type change and trigger cinematic transition
        const newScene = detectSceneType(narrative);
        if (newScene !== lastSceneRef.current) {
          setCurrentScene(newScene);
          setShowTransition(true);
          lastSceneRef.current = newScene;
        }
        
        generateSceneArt(finalId, narrative);
        onDmResponse?.(assistantSoFar);

        // Process quest tags
        if (characterId) {
          const questTags = parseQuestTags(assistantSoFar);
          const advId = adventure?.id ?? "free-roam";
          for (const q of questTags.starts) {
            await supabase.from("quest_log").upsert({
              character_id: characterId,
              adventure_id: advId,
              quest_id: q.questId,
              title: q.title,
              description: q.description,
              status: "active",
            }, { onConflict: "character_id,adventure_id,quest_id" });
          }
          for (const qId of questTags.completes) {
            await supabase.from("quest_log").update({
              status: "completed",
              completed_at: new Date().toISOString(),
            }).eq("character_id", characterId).eq("adventure_id", advId).eq("quest_id", qId);
          }
        }

        // Process monster tags
        const monsterRegex = /\[MONSTER\]\s*(\S+)\s*\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\S+)/gi;
        let mm;
        while ((mm = monsterRegex.exec(assistantSoFar)) !== null) {
          onMonsterEncounter?.({
            id: mm[1].trim(),
            name: mm[2].trim(),
            hp: parseInt(mm[3]),
            maxHp: parseInt(mm[4]),
            ac: parseInt(mm[5]),
            cr: mm[6].trim(),
          });
        }
        const defeatRegex = /\[MONSTER_DEFEATED\]\s*(\S+)/gi;
        while ((mm = defeatRegex.exec(assistantSoFar)) !== null) {
          onMonsterDefeated?.(mm[1].trim());
        }

        // Process puzzle/trap tags
        const puzzleRegex = /\[PUZZLE\]\s*(lockpick|riddle|trap)\s*\|\s*(\d+)/gi;
        let pm;
        while ((pm = puzzleRegex.exec(assistantSoFar)) !== null) {
          onPuzzleTrigger?.(pm[1].trim() as "lockpick" | "riddle" | "trap", parseInt(pm[2]));
        }

        // Process NPC reputation tags
        const npcRegex = /\[NPC_REP\]\s*(\S+)\s*\|\s*([^|]+)\s*\|\s*(-?\d+)\s*\|\s*(.+)/gi;
        let nm;
        while ((nm = npcRegex.exec(assistantSoFar)) !== null) {
          onNpcInteraction?.({
            id: nm[1].trim(),
            name: nm[2].trim(),
            repChange: parseInt(nm[3]),
            summary: nm[4].trim(),
          });
        }

        // Process status effect tags
        const statusRegex = /\[STATUS_EFFECT\]\s*(\S+)\s*\|\s*(\d+)/gi;
        let sm;
        while ((sm = statusRegex.exec(assistantSoFar)) !== null) {
          onStatusEffect?.(sm[1].trim(), parseInt(sm[2]));
        }

        // Process skill check tags
        const skillRegex = /\[SKILL_CHECK\]\s*([^|]+)\s*\|\s*(\d+)/gi;
        let skm;
        while ((skm = skillRegex.exec(assistantSoFar)) !== null) {
          onSkillCheck?.(skm[1].trim(), parseInt(skm[2]));
        }

        // Process recipe discovery tags
        const recipeRegex = /\[RECIPE_DISCOVER\]\s*(\S+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\S+)\s*\|\s*(\d+)\s*\|\s*(\S+)/gi;
        let rm;
        while ((rm = recipeRegex.exec(assistantSoFar)) !== null) {
          onRecipeDiscover?.({
            id: rm[1].trim(),
            name: rm[2].trim(),
            ingredients: rm[3].split(",").map((s: string) => s.trim()),
            skill: rm[4].trim(),
            dc: parseInt(rm[5]),
            icon: rm[6].trim(),
          });
        }
      }
    } catch (err: any) {
      toast.error("Error communicating with the Dungeon Master");
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleChoiceClick = (choice: string) => sendMessage(choice);

  const lastDmMsg = [...messages].reverse().find((m) => m.role === "dm");
  const lastDmParsed = lastDmMsg && !isStreaming ? parseChoices(lastDmMsg.content) : null;
  const availableChoices = lastDmParsed?.choices ?? [];

  return (
    <div className="flex h-full flex-col relative">
      {/* Cinematic scene transition */}
      <CinematicTransition
        sceneType={currentScene}
        active={showTransition}
        onComplete={() => setShowTransition(false)}
      />

      {/* Weather particle overlay */}
      <WeatherParticles weather={currentWeather} />

      <div className="flex items-center gap-3 border-b border-border px-5 py-4 relative z-20">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-display text-sm font-semibold text-foreground">Adventure Journal</h3>
        {currentWeather !== "none" && (
          <span className="ml-2 text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/30 border border-border/50">
            {currentWeather === "embers" ? "🔥" : currentWeather === "rain" ? "🌧️" : currentWeather === "snow" ? "❄️" : currentWeather === "fog" ? "🌫️" : "⛈️"} {currentWeather}
          </span>
        )}
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />}
        {!isLoading && messages.length > 1 && (
          <motion.button
            onClick={clearHistory}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-destructive transition border border-transparent hover:border-destructive/20"
            title="Clear adventure history"
          >
            <Trash2 className="h-3 w-3" /> Clear
          </motion.button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-fantasy relative z-20">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Restoring your adventure...</p>
          </div>
        ) : (
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const parsed = msg.role === "dm" ? parseChoices(msg.content) : null;
            const displayContent = parsed ? parsed.narrative : msg.content;
            const art = sceneArt[msg.id];
            return (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`mb-4 ${msg.role === "dm" ? "" : "flex justify-end"}`}>
                <div className={`max-w-[85%] rounded-lg px-5 py-4 text-sm leading-relaxed ${
                  msg.role === "dm"
                    ? "parchment-card text-foreground"
                    : "ml-auto bg-primary/10 border border-primary/20 text-foreground"
                }`}>
                  <div className="mb-2 flex items-center gap-2">
                    {msg.role === "dm" && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {msg.role === "dm" ? "Dungeon Master" : "You"}
                    </span>
                  </div>

                  {/* Scene Art */}
                  {msg.role === "dm" && art && (
                    <div className="mb-3">
                      {art.loading ? (
                        <div className="flex items-center gap-2 rounded-xl bg-background/50 border border-border/50 px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Conjuring scene...</span>
                        </div>
                      ) : art.url ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="overflow-hidden rounded-xl border border-primary/20 shadow-lg"
                        >
                          <img
                            src={art.url}
                            alt="AI-generated scene"
                            className="w-full h-auto max-h-64 object-cover"
                            loading="lazy"
                          />
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background/80 border-t border-border/50">
                            <ImageIcon className="h-3 w-3 text-primary/60" />
                            <span className="text-[10px] text-muted-foreground">AI-generated scene</span>
                          </div>
                        </motion.div>
                      ) : null}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{displayContent}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Choice Buttons */}
      {availableChoices.length > 0 && !isLoading && (
        <div className="border-t border-border bg-card/30 backdrop-blur-sm px-4 py-4 torn-edge-bottom">
          <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider font-ui">Choose your action</p>
          <div className="divider-ornate mb-3" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {availableChoices.map((choice, i) => (
              <motion.button key={i}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => handleChoiceClick(choice)}
                disabled={!characterId}
                className="btn-ink rounded-lg px-4 py-3 text-left text-sm text-foreground transition-all disabled:opacity-50 group">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full btn-wax text-[10px] font-bold font-ui">
                  {i + 1}
                </span>
                {choice}
              </motion.button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default NarrativeChat;
