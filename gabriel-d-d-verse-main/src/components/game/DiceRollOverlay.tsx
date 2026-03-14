import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DiceRollOverlayProps {
  rolling: boolean;
  result: number | null;
  isSuccess: boolean | null;
  isCritical?: boolean;
  onComplete?: () => void;
}

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

// Generate particles with stable random positions
function generateParticles(count: number, spread: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * spread,
    y: (Math.random() - 0.5) * spread,
    rotation: Math.random() * 720 - 360,
    scale: 0.5 + Math.random() * 1.5,
    delay: i * 0.015,
    size: 2 + Math.random() * 4,
  }));
}

function generateRunes(count: number) {
  const runeChars = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛈ", "ᛉ", "ᛋ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛞ"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    char: runeChars[Math.floor(Math.random() * runeChars.length)],
    angle: (i / count) * 360,
    radius: 100 + Math.random() * 60,
    delay: i * 0.04,
    duration: 1.5 + Math.random() * 0.5,
  }));
}

function generateEmbers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    startY: 50 + Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1.5,
    size: 1 + Math.random() * 3,
  }));
}

const DiceRollOverlay = ({ rolling, result, isSuccess, isCritical = false, onComplete }: DiceRollOverlayProps) => {
  const [currentFace, setCurrentFace] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [phase, setPhase] = useState<"rolling" | "reveal" | "idle">("idle");

  const particles = useMemo(() => generateParticles(isCritical ? 30 : 20, isCritical ? 350 : 250), [isCritical, showResult]);
  const runes = useMemo(() => generateRunes(12), [showResult]);
  const embers = useMemo(() => generateEmbers(20), [showResult]);

  useEffect(() => {
    if (!rolling) { setShowResult(false); setPhase("idle"); return; }
    setShowResult(false);
    setPhase("rolling");

    const interval = setInterval(() => {
      setCurrentFace(Math.floor(Math.random() * 6));
    }, 70);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setShowResult(true);
      setPhase("reveal");
      setTimeout(() => onComplete?.(), isCritical ? 2500 : 1800);
    }, 900);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [rolling, onComplete, isCritical]);

  const successLabel = isCritical ? "CRITICAL HIT!" : "SUCCESS!";
  const failureLabel = isCritical ? "CRITICAL FAIL!" : "FAILURE!";
  const label = isSuccess ? successLabel : failureLabel;

  return (
    <AnimatePresence>
      {rolling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Background overlay with color shift */}
          <motion.div
            className="absolute inset-0"
            animate={showResult ? {
              backgroundColor: isSuccess
                ? "hsla(var(--accent) / 0.08)"
                : "hsla(var(--destructive) / 0.08)",
            } : {}}
            style={{ backgroundColor: "hsla(0, 0%, 0%, 0.75)", backdropFilter: "blur(12px)" }}
          />

          {/* Screen shake on reveal */}
          <motion.div
            className="relative flex flex-col items-center gap-6"
            animate={showResult && isCritical ? {
              x: [0, -8, 8, -5, 5, -2, 2, 0],
              y: [0, 5, -5, 3, -3, 1, -1, 0],
            } : {}}
            transition={{ duration: 0.4 }}
          >
            {/* Rotating rune circle (success) */}
            {showResult && isSuccess && (
              <div className="absolute inset-0 flex items-center justify-center">
                {runes.map((rune) => (
                  <motion.span
                    key={rune.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 0.6, 0],
                      scale: [0.5, 1, 0.5],
                      rotate: [rune.angle, rune.angle + 60],
                    }}
                    transition={{ duration: rune.duration, delay: rune.delay, ease: "easeOut" }}
                    className="absolute text-accent/40 font-display text-lg"
                    style={{
                      left: `calc(50% + ${Math.cos((rune.angle * Math.PI) / 180) * rune.radius}px)`,
                      top: `calc(50% + ${Math.sin((rune.angle * Math.PI) / 180) * rune.radius}px)`,
                    }}
                  >
                    {rune.char}
                  </motion.span>
                ))}
              </div>
            )}

            {/* Falling embers (failure) */}
            {showResult && !isSuccess && (
              <div className="absolute inset-0 flex items-center justify-center overflow-visible">
                {embers.map((ember) => (
                  <motion.div
                    key={ember.id}
                    initial={{ opacity: 0.8, y: -ember.startY, x: ember.x }}
                    animate={{ opacity: 0, y: ember.startY + 150, x: ember.x + (Math.random() - 0.5) * 40 }}
                    transition={{ duration: ember.duration, delay: ember.delay, ease: "easeIn" }}
                    className="absolute rounded-full bg-destructive"
                    style={{ width: ember.size, height: ember.size, filter: "blur(0.5px)" }}
                  />
                ))}
              </div>
            )}

            {/* Glow ring behind dice */}
            {showResult && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 2.5, 2], opacity: [0, 0.4, 0] }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`absolute h-32 w-32 rounded-full ${
                  isSuccess ? "bg-accent/30" : "bg-destructive/30"
                }`}
                style={{ filter: "blur(30px)" }}
              />
            )}

            {/* Secondary pulse ring for criticals */}
            {showResult && isCritical && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 3.5, 3], opacity: [0, 0.3, 0] }}
                transition={{ duration: 1.2, delay: 0.15, ease: "easeOut" }}
                className={`absolute h-32 w-32 rounded-full border-2 ${
                  isSuccess ? "border-accent/40" : "border-destructive/40"
                }`}
              />
            )}

            {/* The dice */}
            <motion.div
              animate={
                showResult
                  ? { rotate: 0, scale: [1.3, 1.1] }
                  : {
                      rotate: [0, 180, 360, 540, 720],
                      scale: [1, 1.2, 0.85, 1.15, 1],
                      y: [0, -30, 10, -15, 0],
                    }
              }
              transition={
                showResult
                  ? { type: "spring", stiffness: 400, damping: 15 }
                  : { duration: 0.9, ease: "easeInOut" }
              }
            >
              <div
                className={`relative flex h-32 w-32 items-center justify-center rounded-2xl border-2 text-5xl transition-all duration-500 ${
                  showResult
                    ? isSuccess
                      ? isCritical
                        ? "border-accent bg-accent/20 shadow-[0_0_80px_20px_hsl(var(--accent)/0.4)]"
                        : "border-accent/50 bg-accent/15 shadow-[0_0_60px_hsl(var(--accent)/0.3)]"
                      : isCritical
                        ? "border-destructive bg-destructive/20 shadow-[0_0_80px_20px_hsl(var(--destructive)/0.4)]"
                        : "border-destructive/50 bg-destructive/15 shadow-[0_0_60px_hsl(var(--destructive)/0.3)]"
                    : "border-primary/30 bg-card/90 shadow-[0_0_40px_hsl(var(--primary)/0.2)] backdrop-blur-sm"
                }`}
              >
                {/* Inner glow effect */}
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0.2] }}
                    transition={{ duration: 0.6 }}
                    className={`absolute inset-0 rounded-2xl ${
                      isSuccess
                        ? "bg-gradient-to-br from-accent/20 to-transparent"
                        : "bg-gradient-to-br from-destructive/20 to-transparent"
                    }`}
                  />
                )}

                {showResult ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 12 }}
                    className={`font-display text-5xl font-bold relative z-10 ${
                      isSuccess ? "text-accent" : "text-destructive"
                    }`}
                    style={{
                      textShadow: isSuccess
                        ? "0 0 20px hsl(var(--accent) / 0.6), 0 0 40px hsl(var(--accent) / 0.3)"
                        : "0 0 20px hsl(var(--destructive) / 0.6), 0 0 40px hsl(var(--destructive) / 0.3)",
                    }}
                  >
                    {result}
                  </motion.span>
                ) : (
                  <motion.span
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                    className="select-none text-5xl"
                  >
                    {DICE_FACES[currentFace]}
                  </motion.span>
                )}
              </div>
            </motion.div>

            {/* Result label */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <motion.p
                    animate={isCritical ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 0.6, repeat: isCritical ? 2 : 0 }}
                    className={`font-display text-2xl font-bold tracking-[0.2em] ${
                      isSuccess ? "text-accent" : "text-destructive"
                    }`}
                    style={{
                      textShadow: isSuccess
                        ? "0 0 30px hsl(var(--accent) / 0.5), 0 2px 10px rgba(0,0,0,0.5)"
                        : "0 0 30px hsl(var(--destructive) / 0.5), 0 2px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {label}
                  </motion.p>

                  {/* Sub-text flavor */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-muted-foreground font-medium"
                  >
                    {isSuccess
                      ? isCritical
                        ? "The gods smile upon you!"
                        : "Fortune favors the bold"
                      : isCritical
                        ? "Darkness claims this moment..."
                        : "The fates are not kind"}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Particle burst */}
            {showResult && (
              <div className="absolute inset-0 flex items-center justify-center">
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0.9, x: 0, y: 0, scale: p.scale, rotate: 0 }}
                    animate={{
                      opacity: 0,
                      x: p.x,
                      y: p.y,
                      scale: 0,
                      rotate: p.rotation,
                    }}
                    transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
                    className={`absolute rounded-full ${
                      isSuccess ? "bg-accent" : "bg-destructive"
                    }`}
                    style={{
                      width: p.size,
                      height: p.size,
                      boxShadow: isSuccess
                        ? `0 0 ${p.size * 2}px hsl(var(--accent) / 0.5)`
                        : `0 0 ${p.size * 2}px hsl(var(--destructive) / 0.5)`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Lightning bolts for critical failure */}
            {showResult && !isSuccess && isCritical && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`bolt-${i}`}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 0] }}
                    transition={{ duration: 0.2, delay: 0.1 + i * 0.15 }}
                    className="absolute w-0.5 bg-destructive"
                    style={{
                      height: 120 + Math.random() * 60,
                      left: `calc(50% + ${(i - 1) * 40}px)`,
                      top: -60,
                      transformOrigin: "top",
                      filter: "blur(1px)",
                      boxShadow: "0 0 10px hsl(var(--destructive) / 0.6)",
                    }}
                  />
                ))}
              </>
            )}

            {/* Radiant burst for critical success */}
            {showResult && isSuccess && isCritical && (
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`ray-${i}`}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: [0, 0.6, 0], scaleX: [0, 1, 1.5] }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                    className="absolute h-0.5 bg-gradient-to-r from-accent to-transparent"
                    style={{
                      width: 100 + Math.random() * 50,
                      transform: `rotate(${i * 45}deg)`,
                      transformOrigin: "left center",
                      filter: "blur(1px)",
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiceRollOverlay;
