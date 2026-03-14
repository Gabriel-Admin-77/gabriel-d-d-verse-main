import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MapPin, AlertTriangle, Target, Loader2, X } from "lucide-react";

interface RecapData {
  title: string;
  subtitle: string;
  paragraphs: string[];
  currentState: {
    location: string;
    threat: string | null;
    objective: string;
  };
}

interface AdventureRecapProps {
  characterId: string | null;
  characterName: string | null;
  adventureTitle: string | null;
  chatMessages: Array<{ role: string; content: string }>;
  onDismiss: () => void;
}

const RECAP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/adventure-recap`;

const AdventureRecap = ({ characterId, characterName, adventureTitle, chatMessages, onDismiss }: AdventureRecapProps) => {
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);
  const [error, setError] = useState(false);

  const generateRecap = useCallback(async () => {
    if (!characterId || chatMessages.length < 2) {
      onDismiss();
      return;
    }

    setLoading(true);
    setShown(true);
    setError(false);

    try {
      // Send last 20 messages for context
      const recentMessages = chatMessages.slice(-20);
      const chatLog = recentMessages
        .map((m) => `[${m.role === "dm" ? "DM" : "Player"}]: ${m.content.slice(0, 300)}`)
        .join("\n\n");

      const resp = await fetch(RECAP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ chatLog, characterName, adventureTitle }),
      });

      if (!resp.ok) throw new Error("Recap failed");
      const data = await resp.json();
      setRecap(data);
    } catch (err) {
      console.warn("Recap generation failed:", err);
      setError(true);
      setTimeout(onDismiss, 2000);
    } finally {
      setLoading(false);
    }
  }, [characterId, characterName, adventureTitle, chatMessages, onDismiss]);

  return { generateRecap, shown, RecapOverlay: () => (
    <AnimatePresence>
      {shown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[90] flex items-center justify-center"
        >
          {/* Cinematic backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, hsl(var(--card)) 0%, hsl(var(--background)) 70%, rgba(0,0,0,0.95) 100%)",
            }}
          />

          <div className="relative z-10 w-full max-w-2xl px-6 max-h-[85vh] overflow-y-auto">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 py-20"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-display">Recalling your adventure...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-20"
              >
                <p className="text-sm text-muted-foreground">Could not generate recap. Resuming adventure...</p>
              </motion.div>
            ) : recap ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col gap-6"
              >
                {/* Title */}
                <div className="text-center">
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs uppercase tracking-[0.3em] text-primary/60 mb-2"
                  >
                    {recap.title}
                  </motion.p>
                  <motion.h2
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="font-display text-3xl sm:text-4xl font-bold text-gold-glow"
                    style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.3)" }}
                  >
                    {recap.subtitle}
                  </motion.h2>
                </div>

                {/* Narrative paragraphs */}
                <div className="space-y-4">
                  {recap.paragraphs.map((para, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.4, duration: 0.6 }}
                      className="text-sm sm:text-base text-foreground/80 leading-relaxed italic"
                    >
                      {para}
                    </motion.p>
                  ))}
                </div>

                {/* Current state cards */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + recap.paragraphs.length * 0.4 + 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <div className="rounded-xl border border-border bg-card/50 p-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Location</p>
                      <p className="text-xs font-medium text-foreground">{recap.currentState.location}</p>
                    </div>
                  </div>
                  {recap.currentState.threat && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Threat</p>
                        <p className="text-xs font-medium text-foreground">{recap.currentState.threat}</p>
                      </div>
                    </div>
                  )}
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Objective</p>
                      <p className="text-xs font-medium text-foreground">{recap.currentState.objective}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Continue button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + recap.paragraphs.length * 0.4 + 0.8 }}
                  className="flex justify-center pt-4"
                >
                  <motion.button
                    onClick={() => { setShown(false); onDismiss(); }}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 25px hsl(var(--primary) / 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 rounded-xl bg-primary px-8 py-3 font-display text-base font-semibold text-primary-foreground transition-all hover:brightness-110"
                  >
                    <BookOpen className="h-5 w-5" />
                    Continue Adventure
                  </motion.button>
                </motion.div>
              </motion.div>
            ) : null}

            {/* Close button */}
            {!loading && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={() => { setShown(false); onDismiss(); }}
                className="absolute top-2 right-2 p-2 rounded-lg text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )};
};

export default AdventureRecap;
