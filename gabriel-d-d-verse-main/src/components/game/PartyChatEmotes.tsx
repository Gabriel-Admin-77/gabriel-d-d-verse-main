import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EMOTES = [
  { id: "swords", emoji: "⚔️", label: "Attack!" },
  { id: "shield", emoji: "🛡️", label: "Defend" },
  { id: "skull", emoji: "💀", label: "Danger" },
  { id: "fire", emoji: "🔥", label: "Fire!" },
  { id: "thumbsup", emoji: "👍", label: "Nice" },
  { id: "laugh", emoji: "😂", label: "Haha" },
  { id: "scared", emoji: "😱", label: "Scary" },
  { id: "think", emoji: "🤔", label: "Hmm" },
  { id: "pray", emoji: "🙏", label: "Please" },
  { id: "heart", emoji: "❤️", label: "Love" },
  { id: "potion", emoji: "🧪", label: "Potion" },
  { id: "dice", emoji: "🎲", label: "Roll!" },
] as const;

interface FloatingEmote {
  id: string;
  emoji: string;
  playerName: string;
  x: number;
  y: number;
}

interface PartyChatEmotesProps {
  sessionId: string;
  playerName: string;
  userId: string;
}

const PartyChatEmotes = ({ sessionId, playerName, userId }: PartyChatEmotesProps) => {
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [floatingEmotes, setFloatingEmotes] = useState<FloatingEmote[]>([]);
  const [cooldown, setCooldown] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Subscribe to emote broadcast channel
  useEffect(() => {
    const channel = supabase
      .channel(`emotes-${sessionId}`)
      .on("broadcast", { event: "emote" }, (payload) => {
        const { emoji, senderName, senderId } = payload.payload as {
          emoji: string;
          senderName: string;
          senderId: string;
        };
        // Show floating emote
        const floater: FloatingEmote = {
          id: crypto.randomUUID(),
          emoji,
          playerName: senderName,
          x: 20 + Math.random() * 60,
          y: 30 + Math.random() * 40,
        };
        setFloatingEmotes((prev) => [...prev.slice(-8), floater]);
        // Auto-remove after animation
        setTimeout(() => {
          setFloatingEmotes((prev) => prev.filter((e) => e.id !== floater.id));
        }, 2200);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sendEmote = useCallback(
    (emoji: string) => {
      if (cooldown || !channelRef.current) return;
      channelRef.current.send({
        type: "broadcast",
        event: "emote",
        payload: { emoji, senderName: playerName, senderId: userId },
      });
      setCooldown(true);
      setIsWheelOpen(false);
      setTimeout(() => setCooldown(false), 1200);
    },
    [cooldown, playerName, userId]
  );

  return (
    <>
      {/* Floating emote animations */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <AnimatePresence>
          {floatingEmotes.map((emote) => (
            <motion.div
              key={emote.id}
              initial={{ opacity: 0, scale: 0.3, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -80 }}
              exit={{ opacity: 0, scale: 0.5, y: -140 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute flex flex-col items-center"
              style={{ left: `${emote.x}%`, top: `${emote.y}%` }}
            >
              <motion.span
                className="text-4xl drop-shadow-lg"
                animate={{ rotate: [0, -10, 10, -5, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5 }}
              >
                {emote.emoji}
              </motion.span>
              <span className="mt-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border/50 shadow-md whitespace-nowrap">
                {emote.playerName}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Emote wheel trigger */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsWheelOpen(!isWheelOpen)}
          disabled={cooldown}
          className={`rounded-lg p-2.5 transition border ${
            isWheelOpen
              ? "bg-primary/20 border-primary/40 text-primary"
              : "bg-muted/20 border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          } ${cooldown ? "opacity-50" : ""}`}
          title="Quick emote"
        >
          <Smile className="h-4 w-4" />
        </motion.button>

        {/* Emote wheel popup */}
        <AnimatePresence>
          {isWheelOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute bottom-full mb-2 right-0 z-40 rounded-xl border border-border bg-card/95 backdrop-blur-xl p-3 shadow-2xl"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 px-1">
                Quick React
              </p>
              <div className="grid grid-cols-4 gap-1.5" style={{ width: 200 }}>
                {EMOTES.map((emote, i) => (
                  <motion.button
                    key={emote.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, type: "spring", stiffness: 500 }}
                    whileHover={{ scale: 1.25 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => sendEmote(emote.emoji)}
                    className="flex flex-col items-center gap-0.5 rounded-lg p-1.5 hover:bg-primary/10 transition group"
                    title={emote.label}
                  >
                    <span className="text-xl group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]">
                      {emote.emoji}
                    </span>
                    <span className="text-[8px] text-muted-foreground group-hover:text-foreground transition">
                      {emote.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default PartyChatEmotes;
