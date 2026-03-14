import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ScrollText, Loader2, Swords, MessageCircle, Search, Moon, Compass, ChevronRight, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatMessage } from "@/lib/gameTypes";

const JOURNAL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journal-summarize`;

interface JournalChapter {
  heading: string;
  summary: string;
  keyEvent: string;
  mood: "exploration" | "combat" | "dialogue" | "mystery" | "rest";
}

interface JournalDecision {
  choice: string;
  consequence: string;
  moral: "good" | "neutral" | "evil";
}

interface JournalData {
  title: string;
  chapters: JournalChapter[];
  decisions: JournalDecision[];
  stats: {
    encountersCount: number;
    decisionsCount: number;
    currentQuest: string;
  };
}

const MOOD_ICONS: Record<string, React.ReactNode> = {
  exploration: <Compass className="h-3.5 w-3.5" />,
  combat: <Swords className="h-3.5 w-3.5" />,
  dialogue: <MessageCircle className="h-3.5 w-3.5" />,
  mystery: <Search className="h-3.5 w-3.5" />,
  rest: <Moon className="h-3.5 w-3.5" />,
};

const MORAL_COLORS: Record<string, string> = {
  good: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  neutral: "text-muted-foreground border-border bg-muted/20",
  evil: "text-red-400 border-red-500/30 bg-red-500/10",
};

interface JournalSidebarProps {
  messages: ChatMessage[];
  characterName?: string;
  adventureTitle?: string;
}

const JournalSidebar = ({ messages, characterName, adventureTitle }: JournalSidebarProps) => {
  const [journal, setJournal] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summarize = useCallback(async () => {
    if (messages.length < 2) {
      setError("Play a bit more before summarizing!");
      return;
    }
    setLoading(true);
    setError(null);

    const chatLog = messages
      .map((m) => `[${m.role === "dm" ? "DM" : "Player"}]: ${m.content.replace(/\[CHOICE_[1-4]\]\s*.*/g, "").trim()}`)
      .join("\n\n");

    try {
      const resp = await fetch(JOURNAL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ chatLog, characterName, adventureTitle }),
      });
      if (!resp.ok) throw new Error("Failed to summarize");
      const data = await resp.json();
      setJournal(data);
    } catch {
      setError("Could not generate journal. Try again.");
    } finally {
      setLoading(false);
    }
  }, [messages, characterName, adventureTitle]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-lg backdrop-blur-md transition hover:bg-primary/25 hover:shadow-gold"
        >
          <ScrollText className="h-5 w-5" />
        </motion.button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[360px] sm:w-[420px] bg-background/95 backdrop-blur-xl border-border p-0">
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="font-display text-lg text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Adventure Journal
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 pt-4">
          <motion.button
            onClick={summarize}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-wax w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-ui font-medium text-foreground transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scrying the past...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {journal ? "Update Journal" : "Generate Journal"}
              </>
            )}
          </motion.button>
          {error && (
            <p className="mt-2 text-xs text-destructive text-center">{error}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-fantasy" style={{ maxHeight: "calc(100vh - 180px)" }}>
          <AnimatePresence mode="wait">
            {!journal && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <ScrollText className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm text-muted-foreground">Your journal awaits...</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Play through the adventure, then generate a summary
                </p>
              </motion.div>
            )}

            {journal && (
              <motion.div
                key="journal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Title */}
                <div className="parchment-card rounded-xl px-5 py-4 text-center">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {journal.title}
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    {journal.stats.encountersCount} encounters · {journal.stats.decisionsCount} decisions
                  </p>
                </div>

                {/* Current Quest */}
                {journal.stats.currentQuest && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <p className="text-[10px] text-primary uppercase tracking-wider font-medium mb-1">Current Quest</p>
                    <p className="text-xs text-foreground">{journal.stats.currentQuest}</p>
                  </div>
                )}

                {/* Chapters */}
                {journal.chapters.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">
                      Chapters
                    </p>
                    <div className="space-y-3">
                      {journal.chapters.map((ch, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="rounded-xl border border-border bg-muted/10 p-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                              {MOOD_ICONS[ch.mood] || <Compass className="h-3.5 w-3.5" />}
                            </span>
                            <h3 className="text-xs font-semibold text-foreground flex-1">{ch.heading}</h3>
                            <span className="text-[9px] text-muted-foreground uppercase">{ch.mood}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{ch.summary}</p>
                          <div className="mt-2 flex items-start gap-1.5">
                            <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                            <p className="text-[11px] text-primary/80 italic">{ch.keyEvent}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decisions */}
                {journal.decisions.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">
                      Key Decisions
                    </p>
                    <div className="space-y-2">
                      {journal.decisions.map((d, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.08 }}
                          className={`rounded-xl border px-4 py-3 ${MORAL_COLORS[d.moral] || MORAL_COLORS.neutral}`}
                        >
                          <p className="text-xs font-medium">{d.choice}</p>
                          <p className="text-[11px] opacity-70 mt-1">{d.consequence}</p>
                        </motion.div>
                      ))}
                    </div>
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

export default JournalSidebar;
