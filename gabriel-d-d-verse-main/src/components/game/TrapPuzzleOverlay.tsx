import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Brain, Timer, CheckCircle, XCircle, Zap } from "lucide-react";
import DiceRollOverlay from "./DiceRollOverlay";
import { useDiceAudio } from "@/hooks/useDiceAudio";

type PuzzleType = "lockpick" | "riddle" | "trap";

interface TrapPuzzleOverlayProps {
  active: boolean;
  type: PuzzleType;
  difficulty: number; // DC 10-20
  characterDex: number;
  characterInt: number;
  characterWis: number;
  onSuccess: () => void;
  onFailure: () => void;
  onClose: () => void;
}

// Riddle pool
const RIDDLES = [
  { question: "I have cities but no houses, mountains but no trees, water but no fish. What am I?", answer: "map" },
  { question: "The more you take, the more you leave behind. What am I?", answer: "footsteps" },
  { question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "echo" },
  { question: "What has keys but no locks, space but no room, and you can enter but can't go inside?", answer: "keyboard" },
  { question: "I can be cracked, made, told, and played. What am I?", answer: "joke" },
  { question: "What has a head, a tail, is brown, and has no legs?", answer: "penny" },
  { question: "I'm tall when I'm young and short when I'm old. What am I?", answer: "candle" },
  { question: "What can you catch but not throw?", answer: "cold" },
  { question: "What has many teeth but cannot bite?", answer: "comb" },
  { question: "What runs but never walks, has a mouth but never talks?", answer: "river" },
];

const TrapPuzzleOverlay = ({
  active, type, difficulty, characterDex, characterInt, characterWis,
  onSuccess, onFailure, onClose,
}: TrapPuzzleOverlayProps) => {
  const [phase, setPhase] = useState<"intro" | "playing" | "rolling" | "result">("intro");
  const [timeLeft, setTimeLeft] = useState(0);
  const [lockpickProgress, setLockpickProgress] = useState<number[]>([]);
  const [lockpickTarget, setLockpickTarget] = useState<number[]>([]);
  const [currentPin, setCurrentPin] = useState(0);
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [riddleInput, setRiddleInput] = useState("");
  const [trapSequence, setTrapSequence] = useState<string[]>([]);
  const [trapInput, setTrapInput] = useState<string[]>([]);
  const [trapShowPhase, setTrapShowPhase] = useState(true);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceSuccess, setDiceSuccess] = useState<boolean | null>(null);
  const [diceCritical, setDiceCritical] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const audio = useDiceAudio();

  const totalTime = type === "lockpick" ? 15 : type === "riddle" ? 30 : 10;
  const pinCount = Math.min(3 + Math.floor((difficulty - 10) / 3), 6);

  const startGame = useCallback(() => {
    setPhase("playing");
    setTimeLeft(totalTime);

    if (type === "lockpick") {
      const targets = Array.from({ length: pinCount }, () => Math.floor(Math.random() * 5));
      setLockpickTarget(targets);
      setLockpickProgress(Array(pinCount).fill(-1));
      setCurrentPin(0);
    } else if (type === "riddle") {
      setRiddleIndex(Math.floor(Math.random() * RIDDLES.length));
      setRiddleInput("");
    } else if (type === "trap") {
      const dirs = ["↑", "↓", "←", "→"];
      const seq = Array.from({ length: 4 + Math.floor((difficulty - 10) / 2) }, () => dirs[Math.floor(Math.random() * 4)]);
      setTrapSequence(seq);
      setTrapInput([]);
      setTrapShowPhase(true);
      setTimeout(() => setTrapShowPhase(false), 2500);
    }
  }, [type, difficulty, pinCount, totalTime]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          doSkillCheck(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const doSkillCheck = useCallback((bonusFromMini: boolean) => {
    clearInterval(timerRef.current);
    setPhase("rolling");

    const stat = type === "lockpick" ? characterDex : type === "riddle" ? characterInt : characterWis;
    const mod = Math.floor((stat - 10) / 2);
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + mod + (bonusFromMini ? 5 : 0);
    const isCrit = roll === 20;
    const isCritFail = roll === 1;
    const success = isCrit || (!isCritFail && total >= difficulty);

    setDiceResult(total);
    setDiceSuccess(success);
    setDiceCritical(isCrit || isCritFail);
    setDiceRolling(true);
    setSucceeded(success);

    audio.playRoll();
    setTimeout(() => {
      if (success) {
        if (isCrit) audio.playCriticalSuccess();
        else audio.playSuccess();
      } else {
        if (isCritFail) audio.playCriticalFailure();
        else audio.playFailure();
      }
    }, 900);
  }, [type, characterDex, characterInt, characterWis, difficulty, audio]);

  const handleDiceComplete = () => {
    setDiceRolling(false);
    setPhase("result");
    setTimeout(() => {
      if (succeeded) onSuccess();
      else onFailure();
    }, 1500);
  };

  // Lockpick: click to set pin position
  const handleLockpickClick = (position: number) => {
    if (phase !== "playing" || type !== "lockpick") return;
    const newProgress = [...lockpickProgress];
    const isCorrect = position === lockpickTarget[currentPin];
    newProgress[currentPin] = isCorrect ? position : -2; // -2 = failed attempt

    setLockpickProgress(newProgress);

    if (isCorrect) {
      if (currentPin >= pinCount - 1) {
        doSkillCheck(true);
      } else {
        setCurrentPin(prev => prev + 1);
      }
    } else {
      // Reset on fail
      setTimeout(() => {
        setLockpickProgress(Array(pinCount).fill(-1));
        setCurrentPin(0);
      }, 300);
    }
  };

  // Riddle: check answer
  const handleRiddleSubmit = () => {
    const correct = riddleInput.toLowerCase().trim() === RIDDLES[riddleIndex].answer;
    doSkillCheck(correct);
  };

  // Trap: input direction
  const handleTrapDir = (dir: string) => {
    if (phase !== "playing" || type !== "trap" || trapShowPhase) return;
    const newInput = [...trapInput, dir];
    setTrapInput(newInput);

    if (newInput.length >= trapSequence.length) {
      const allCorrect = newInput.every((d, i) => d === trapSequence[i]);
      doSkillCheck(allCorrect);
    }
  };

  // Key handler for trap
  useEffect(() => {
    if (phase !== "playing" || type !== "trap" || trapShowPhase) return;
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, string> = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" };
      if (map[e.key]) handleTrapDir(map[e.key]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, type, trapShowPhase, trapInput.length]);

  if (!active) return null;

  const typeConfig = {
    lockpick: { icon: <Lock className="h-6 w-6" />, title: "Lock Picking", color: "text-accent", desc: "Set each pin to the correct position" },
    riddle: { icon: <Brain className="h-6 w-6" />, title: "Ancient Riddle", color: "text-primary", desc: "Solve the riddle to proceed" },
    trap: { icon: <Zap className="h-6 w-6" />, title: "Trap Disarm", color: "text-destructive", desc: "Memorize and repeat the sequence" },
  }[type];

  return (
    <>
      <DiceRollOverlay rolling={diceRolling} result={diceResult} isSuccess={diceSuccess} isCritical={diceCritical} onComplete={handleDiceComplete} />
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-background/95 backdrop-blur-xl p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`${typeConfig.color}`}>{typeConfig.icon}</div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">{typeConfig.title}</h2>
                    <p className="text-[10px] text-muted-foreground">DC {difficulty}</p>
                  </div>
                </div>
                {phase === "playing" && (
                  <div className="flex items-center gap-1.5 text-destructive">
                    <Timer className="h-4 w-4" />
                    <span className="font-display text-lg font-bold">{timeLeft}s</span>
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {/* INTRO */}
                {phase === "intro" && (
                  <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">{typeConfig.desc}</p>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame}
                      className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                      Begin
                    </motion.button>
                  </motion.div>
                )}

                {/* LOCKPICK */}
                {phase === "playing" && type === "lockpick" && (
                  <motion.div key="lockpick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-xs text-muted-foreground mb-4 text-center">Pin {currentPin + 1} of {pinCount} — tap the sweet spot</p>
                    <div className="flex justify-center gap-3 mb-4">
                      {lockpickTarget.map((_, i) => (
                        <div key={i} className={`h-3 w-3 rounded-full transition ${
                          lockpickProgress[i] >= 0 ? "bg-accent" : lockpickProgress[i] === -2 ? "bg-destructive" : i === currentPin ? "bg-primary animate-pulse" : "bg-muted"
                        }`} />
                      ))}
                    </div>
                    <div className="flex justify-center gap-2">
                      {Array.from({ length: 5 }).map((_, pos) => (
                        <motion.button key={pos} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleLockpickClick(pos)}
                          className={`h-16 w-12 rounded-xl border-2 transition flex items-center justify-center text-lg font-bold ${
                            pos === lockpickTarget[currentPin]
                              ? "border-accent/0 bg-muted/30 hover:bg-accent/20"
                              : "border-border bg-muted/15 hover:bg-muted/30"
                          }`}>
                          {pos + 1}
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-3">Find the right position for each pin</p>
                  </motion.div>
                )}

                {/* RIDDLE */}
                {phase === "playing" && type === "riddle" && (
                  <motion.div key="riddle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 mb-4">
                      <p className="text-sm text-foreground italic leading-relaxed">"{RIDDLES[riddleIndex].question}"</p>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={riddleInput} onChange={(e) => setRiddleInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRiddleSubmit()}
                        placeholder="Your answer..."
                        className="flex-1 rounded-xl border border-border bg-muted/15 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40" />
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRiddleSubmit}
                        className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                        Submit
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* TRAP DISARM */}
                {phase === "playing" && type === "trap" && (
                  <motion.div key="trap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {trapShowPhase ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground mb-3">Memorize this sequence!</p>
                        <div className="flex justify-center gap-2">
                          {trapSequence.map((dir, i) => (
                            <motion.span key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.2 }}
                              className="text-3xl font-bold text-primary">
                              {dir}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground mb-3">Repeat the sequence! ({trapInput.length}/{trapSequence.length})</p>
                        <div className="flex justify-center gap-1 mb-4 min-h-[32px]">
                          {trapInput.map((dir, i) => (
                            <span key={i} className={`text-xl font-bold ${dir === trapSequence[i] ? "text-accent" : "text-destructive"}`}>{dir}</span>
                          ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                          <div />
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleTrapDir("↑")}
                            className="h-12 rounded-xl border border-border bg-muted/15 text-xl hover:bg-primary/10">↑</motion.button>
                          <div />
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleTrapDir("←")}
                            className="h-12 rounded-xl border border-border bg-muted/15 text-xl hover:bg-primary/10">←</motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleTrapDir("↓")}
                            className="h-12 rounded-xl border border-border bg-muted/15 text-xl hover:bg-primary/10">↓</motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleTrapDir("→")}
                            className="h-12 rounded-xl border border-border bg-muted/15 text-xl hover:bg-primary/10">→</motion.button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* RESULT */}
                {phase === "result" && (
                  <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6">
                    {succeeded ? (
                      <>
                        <CheckCircle className="h-12 w-12 text-accent mx-auto mb-3" />
                        <p className="font-display text-xl font-bold text-accent">Success!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {type === "lockpick" ? "The lock clicks open!" : type === "riddle" ? "Ancient magic recognizes your wisdom!" : "The trap mechanism disengages safely!"}
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                        <p className="font-display text-xl font-bold text-destructive">Failed!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {type === "lockpick" ? "The lock holds firm..." : type === "riddle" ? "The riddle remains unsolved..." : "The trap springs!"}
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TrapPuzzleOverlay;
