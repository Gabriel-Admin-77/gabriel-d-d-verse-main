import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";

const UNLOCK_KEY = "audio_unlocked";

export default function AudioUnlockOverlay() {
  const [visible, setVisible] = useState(() => {
    return !sessionStorage.getItem(UNLOCK_KEY);
  });

  const unlock = useCallback(() => {
    // Create and immediately play a silent AudioContext to unlock audio on all browsers
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0; // silent
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.01);
      if (ctx.state === "suspended") ctx.resume();
      // Close after unlocking — individual hooks will create their own contexts
      setTimeout(() => ctx.close(), 100);
    } catch {}

    // Also unlock HTML5 Audio for iOS Safari
    try {
      const audio = new Audio();
      audio.play().catch(() => {});
    } catch {}

    sessionStorage.setItem(UNLOCK_KEY, "1");
    setVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md"
          onClick={unlock}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ delay: 0.1, type: "spring", damping: 20 }}
            className="flex flex-col items-center gap-5 text-center px-6"
          >
            {/* Pulsing icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10"
            >
              <Volume2 className="h-10 w-10 text-primary" />
            </motion.div>

            <div>
              <h2 className="font-display text-2xl font-bold text-gold-glow mb-2">
                The Sovereign Grimoire
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Tap anywhere to enable immersive audio — ambient soundscapes, dice rolls, and more.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={unlock}
              className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 hover:shadow-gold"
            >
              Enter the Grimoire
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
