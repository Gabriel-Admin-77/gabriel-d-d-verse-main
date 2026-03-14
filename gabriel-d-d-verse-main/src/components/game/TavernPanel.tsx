import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Beer, MessageSquare, Loader2, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Character } from "@/lib/gameTypes";
import { Adventure } from "@/lib/adventures";

interface TavernPanelProps {
  characterId?: string | null;
  character?: Character | null;
  adventure?: Adventure | null;
  onSelectRumor?: (rumorChoiceText: string) => void;
}

interface ParsedTavernContent {
  narrative: string;
  choices: string[];
}

function parseTavernChoices(content: string): ParsedTavernContent {
  const choiceRegex = /\[CHOICE_[1-4]\]\s*(.*)/g;
  const choices: string[] = [];
  let match;
  while ((match = choiceRegex.exec(content)) !== null) {
    choices.push(match[1].trim());
  }
  const narrative = content.replace(/\[CHOICE_[1-4]\]\s*.*/g, "").trim();
  return { narrative, choices };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dungeon-master`;

const TavernPanel = ({ characterId, character, adventure, onSelectRumor }: TavernPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'dm', content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const askTavernKeeper = async (promptType: "rumour" | "quest") => {
    if (!characterId || loading) return;
    setLoading(true);

    const userPrompt = promptType === "rumour" 
      ? "Buy a drink and listen for interesting local rumours."
      : "Ask the barkeep about any updates or leads on current quests.";

    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          // Provide custom prompt to the AI to behave as a tavern keeper
          messages: [
            { 
              role: "system", 
              content: `You are a gruff but friendly tavern keeper in ${adventure?.setting || "a fantasy world"}. The adventurer ${character?.name || "traveler"} comes to you.
              If they ask for rumours, provide a short 1-2 sentence hook about a local point of interest, monster sighting, or hidden treasure. THEN, you MUST provide exactly 2-4 choices for the player to pursue these rumors, formatted exactly as:
              [CHOICE_1] Pursue the rumor about the abandoned mine
              [CHOICE_2] Ask around town about the strange lights
              Make the choices actionable hooks that will lead the player into a new story branch.
              If they ask about quests, give them a subtle hint or reminder about their active tasks, or suggest who they should talk to next (no choices needed for quests). DO NOT emit tags like [XP_REWARD] or [LOOT_DROP], you are just giving information.` 
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          character,
          adventure
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("AI error");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;
      
      setMessages(prev => [...prev, { role: 'dm', content: "" }]);

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
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].content = assistantSoFar;
                return newMsgs;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

    } catch (err) {
      toast.error("The tavern keeper ignores you...");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/15 border border-amber-600/30 text-amber-500 shadow-lg backdrop-blur-md transition hover:bg-amber-600/25 hover:shadow-gold"
          title="Visit the Tavern"
        >
          <Beer className="h-5 w-5 pointer-events-none" />
        </motion.button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[400px] bg-background/95 backdrop-blur-xl border-border p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <SheetTitle className="font-display text-lg text-foreground flex items-center gap-2">
            <Beer className="h-5 w-5 text-amber-500" />
            The Local Tavern
          </SheetTitle>
        </SheetHeader>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 scrollbar-fantasy flex flex-col gap-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50 m-auto">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">The tavern is bustling with noise. Pull up a chair and listen in.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const parsed = msg.role === 'dm' ? parseTavernChoices(msg.content) : null;
                const displayContent = parsed ? parsed.narrative : msg.content;
                const choices = parsed ? parsed.choices : [];

                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary/10 border border-primary/20 text-foreground' 
                        : 'parchment-card text-foreground'
                    }`}>
                      {msg.role === 'dm' && (
                        <div className="flex items-center gap-1.5 mb-1.5 opacity-70">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Tavern Keeper</span>
                        </div>
                      )}
                      <span className="whitespace-pre-wrap leading-relaxed">{displayContent}</span>
                    </div>

                    {/* Render Choices if present */}
                    {choices.length > 0 && !loading && (
                      <div className="mt-3 flex flex-col gap-2 w-full max-w-[85%] pl-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Pursue Rumor:</p>
                        {choices.map((choice, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (onSelectRumor) {
                                setIsOpen(false);
                                onSelectRumor(choice);
                              }
                            }}
                            className="bg-accent/40 hover:bg-accent border border-border rounded-lg p-2 text-xs text-left transition-colors font-medium text-foreground flex gap-2 items-start"
                          >
                            <span className="text-primary font-bold">{idx + 1}.</span> {choice}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          {loading && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center text-muted-foreground text-xs p-2">
               <Loader2 className="h-3 w-3 animate-spin" />
               Barkeeper is pouring a drink...
             </motion.div>
          )}
        </div>

        <div className="p-4 border-t border-border/50 bg-card/30 space-y-2">
          <button
            onClick={() => askTavernKeeper("rumour")}
            disabled={loading}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 text-left transition hover:border-amber-500/30 hover:bg-amber-500/5 disabled:opacity-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
              <MessageSquare className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold text-foreground">Listen for Rumours</h4>
              <p className="text-[10px] text-muted-foreground">Hear tales of local lore & monsters</p>
            </div>
          </button>

          <button
            onClick={() => askTavernKeeper("quest")}
            disabled={loading}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 text-left transition hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold text-foreground">Ask about Quests</h4>
              <p className="text-[10px] text-muted-foreground">Get hints on your active tasks</p>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TavernPanel;
