import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export type SceneType = "exploration" | "combat" | "dialogue" | "mystery" | "rest";

interface CinematicTransitionProps {
  sceneType: SceneType;
  active: boolean;
  onComplete?: () => void;
}

// Keywords to detect scene type from narrative
const SCENE_KEYWORDS: Record<SceneType, string[]> = {
  combat: [
    "attack", "sword", "fight", "battle", "combat", "slash", "strike", "arrow",
    "shield", "weapon", "hit", "damage", "enemy", "charge", "initiative", "war",
    "foe", "ambush", "duel", "claws", "fangs", "teeth", "blood", "wound",
  ],
  dialogue: [
    "speak", "says", "told", "ask", "reply", "conversation", "merchant",
    "innkeeper", "tavern", "negotiate", "persuade", "diplomat", "greet",
    "whisper", "voice", "words", "plea", "offer", "barter", "npc",
  ],
  mystery: [
    "mysterious", "puzzle", "riddle", "strange", "arcane", "rune", "symbol",
    "secret", "hidden", "clue", "investigate", "examine", "decipher", "trap",
    "lock", "ancient", "inscription", "glyph",
  ],
  rest: [
    "camp", "rest", "sleep", "campfire", "dawn", "morning", "inn", "bed",
    "recover", "heal", "peaceful", "calm", "safe",
  ],
  exploration: [
    "enter", "path", "door", "corridor", "cave", "forest", "mountain",
    "bridge", "river", "road", "tunnel", "chamber", "hall", "ruins",
    "descend", "climb", "venture", "journey", "travel", "explore",
  ],
};

export function detectSceneType(text: string): SceneType {
  const lower = text.toLowerCase();
  const scores: Record<SceneType, number> = {
    combat: 0, dialogue: 0, mystery: 0, rest: 0, exploration: 0,
  };

  for (const [type, keywords] of Object.entries(SCENE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[type as SceneType] += 1;
    }
  }

  let best: SceneType = "exploration";
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) { best = type as SceneType; bestScore = score; }
  }
  return best;
}

const SCENE_CONFIG: Record<SceneType, {
  label: string;
  icon: string;
  color: string;
  bgGradient: string;
}> = {
  exploration: {
    label: "Exploring...",
    icon: "🗺️",
    color: "hsl(45, 80%, 55%)",
    bgGradient: "radial-gradient(ellipse at center, hsla(45, 40%, 10%, 0.95) 0%, hsla(0, 0%, 3%, 0.98) 100%)",
  },
  combat: {
    label: "Roll Initiative!",
    icon: "⚔️",
    color: "hsl(0, 80%, 55%)",
    bgGradient: "radial-gradient(ellipse at center, hsla(0, 50%, 10%, 0.95) 0%, hsla(0, 0%, 3%, 0.98) 100%)",
  },
  dialogue: {
    label: "A voice speaks...",
    icon: "💬",
    color: "hsl(200, 60%, 55%)",
    bgGradient: "radial-gradient(ellipse at center, hsla(200, 30%, 10%, 0.95) 0%, hsla(0, 0%, 3%, 0.98) 100%)",
  },
  mystery: {
    label: "Something stirs...",
    icon: "🔮",
    color: "hsl(270, 70%, 60%)",
    bgGradient: "radial-gradient(ellipse at center, hsla(270, 40%, 10%, 0.95) 0%, hsla(0, 0%, 3%, 0.98) 100%)",
  },
  rest: {
    label: "A moment of peace",
    icon: "🏕️",
    color: "hsl(30, 60%, 50%)",
    bgGradient: "radial-gradient(ellipse at center, hsla(30, 30%, 10%, 0.95) 0%, hsla(0, 0%, 3%, 0.98) 100%)",
  },
};

// Torch flicker particles
function TorchFlicker({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + Math.random() * 8,
            height: 4 + Math.random() * 8,
            left: `${15 + Math.random() * 70}%`,
            bottom: `${10 + Math.random() * 30}%`,
            background: color,
            filter: "blur(2px)",
          }}
          animate={{
            y: [0, -(40 + Math.random() * 80)],
            x: [0, (Math.random() - 0.5) * 40],
            opacity: [0.8, 0],
            scale: [1, 0.3],
          }}
          transition={{
            duration: 1.5 + Math.random() * 1.5,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// Fog roll effect
function FogRoll() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-[200%] h-[40%]"
          style={{
            bottom: `${i * 15 - 10}%`,
            background: `radial-gradient(ellipse 60% 100% at 50% 80%, hsla(0,0%,100%,${0.04 - i * 0.01}) 0%, transparent 70%)`,
          }}
          animate={{
            x: ["-50%", "0%", "-50%"],
          }}
          transition={{
            duration: 8 + i * 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// Page turn curl effect
function PageTurn({ phase }: { phase: "in" | "out" }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-30"
      initial={phase === "in" ? { clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)" } : { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
      animate={phase === "in" ? { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" } : { clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)" }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: "linear-gradient(90deg, hsla(30,20%,8%,0.95) 0%, hsla(30,15%,12%,0.9) 40%, hsla(30,10%,15%,0.6) 80%, transparent 100%)",
      }}
    >
      {/* Page edge highlight */}
      <motion.div
        className="absolute top-0 right-0 w-[2px] h-full"
        style={{ background: "linear-gradient(180deg, hsla(40,50%,50%,0.3) 0%, hsla(40,50%,50%,0.1) 100%)" }}
      />
    </motion.div>
  );
}

export default function CinematicTransition({ sceneType, active, onComplete }: CinematicTransitionProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit" | "done">("done");
  const config = SCENE_CONFIG[sceneType];
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!active) return;

    setPhase("enter");

    timeoutRef.current = setTimeout(() => {
      setPhase("hold");
      timeoutRef.current = setTimeout(() => {
        setPhase("exit");
        timeoutRef.current = setTimeout(() => {
          setPhase("done");
          onComplete?.();
        }, 600);
      }, 1200);
    }, 600);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, sceneType]);

  const isVisible = phase !== "done";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "exit" ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ background: config.bgGradient }}
        >
          {/* Page turn animation */}
          {phase === "enter" && <PageTurn phase="in" />}
          {phase === "exit" && <PageTurn phase="out" />}

          {/* Fog */}
          <FogRoll />

          {/* Torch flicker particles */}
          <TorchFlicker color={config.color} />

          {/* Center content */}
          <motion.div
            className="flex flex-col items-center gap-4 z-40"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{
              opacity: phase === "hold" ? 1 : phase === "enter" ? 0.8 : 0,
              scale: phase === "hold" ? 1 : 0.95,
              y: 0,
            }}
            transition={{ duration: 0.5 }}
          >
            {/* Icon with glow */}
            <motion.div
              className="text-5xl"
              animate={{
                filter: [
                  `drop-shadow(0 0 10px ${config.color}66)`,
                  `drop-shadow(0 0 20px ${config.color}44)`,
                  `drop-shadow(0 0 10px ${config.color}66)`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {config.icon}
            </motion.div>

            {/* Label */}
            <motion.p
              className="font-display text-lg font-semibold tracking-wide"
              style={{ color: config.color }}
              initial={{ letterSpacing: "0.05em" }}
              animate={{ letterSpacing: "0.15em" }}
              transition={{ duration: 1.5 }}
            >
              {config.label}
            </motion.p>

            {/* Decorative line */}
            <motion.div
              className="h-[1px] rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }}
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </motion.div>

          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 30%, hsla(0,0%,0%,0.6) 100%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
