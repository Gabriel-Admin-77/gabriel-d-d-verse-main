import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface MoralCompassProps {
  score: number; // 0-100, 50 = neutral, 100 = pure good, 0 = pure evil
  size?: number;
}

export default function MoralCompass({ score, size = 80 }: MoralCompassProps) {
  const [displayScore, setDisplayScore] = useState(score);

  // Smooth animated transition
  useEffect(() => {
    setDisplayScore(score);
  }, [score]);

  const clampedScore = Math.max(0, Math.min(100, displayScore));

  // Map score 0-100 to angle: -135° (evil) to +135° (good), with 0° being neutral (score=50)
  const angle = ((clampedScore - 50) / 50) * 135;

  // Color transitions
  const getColor = (s: number) => {
    if (s >= 70) return { main: "hsl(45, 90%, 55%)", glow: "hsl(45, 100%, 70%)", label: "Virtuous", bg: "hsl(45, 30%, 15%)" };
    if (s >= 55) return { main: "hsl(90, 60%, 50%)", glow: "hsl(90, 80%, 65%)", label: "Good", bg: "hsl(90, 20%, 12%)" };
    if (s >= 45) return { main: "hsl(200, 30%, 55%)", glow: "hsl(200, 40%, 65%)", label: "Neutral", bg: "hsl(200, 15%, 12%)" };
    if (s >= 30) return { main: "hsl(15, 70%, 50%)", glow: "hsl(15, 90%, 60%)", label: "Corrupt", bg: "hsl(15, 25%, 12%)" };
    return { main: "hsl(0, 80%, 45%)", glow: "hsl(0, 100%, 55%)", label: "Evil", bg: "hsl(0, 30%, 10%)" };
  };

  const colors = getColor(clampedScore);
  const r = size / 2;
  const needleLen = r * 0.65;
  const cx = r;
  const cy = r;

  // Arc path for the gauge background
  const arcRadius = r * 0.78;
  const startAngle = -135 * (Math.PI / 180);
  const endAngle = 135 * (Math.PI / 180);

  const arcStart = {
    x: cx + arcRadius * Math.cos(startAngle - Math.PI / 2),
    y: cy + arcRadius * Math.sin(startAngle - Math.PI / 2),
  };
  const arcEnd = {
    x: cx + arcRadius * Math.cos(endAngle - Math.PI / 2),
    y: cy + arcRadius * Math.sin(endAngle - Math.PI / 2),
  };

  // Filled arc to current position
  const filledAngle = angle * (Math.PI / 180);
  const filledEnd = {
    x: cx + arcRadius * Math.cos(filledAngle - Math.PI / 2),
    y: cy + arcRadius * Math.sin(filledAngle - Math.PI / 2),
  };

  const needleAngleRad = angle * (Math.PI / 180);
  const needleX = cx + needleLen * Math.sin(needleAngleRad);
  const needleY = cy - needleLen * Math.cos(needleAngleRad);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <filter id="compass-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="arc-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(0, 70%, 45%)" />
              <stop offset="25%" stopColor="hsl(15, 60%, 50%)" />
              <stop offset="50%" stopColor="hsl(200, 30%, 50%)" />
              <stop offset="75%" stopColor="hsl(90, 50%, 45%)" />
              <stop offset="100%" stopColor="hsl(45, 80%, 50%)" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.3" />

          {/* Gauge arc background */}
          <path
            d={`M ${arcStart.x} ${arcStart.y} A ${arcRadius} ${arcRadius} 0 1 1 ${arcEnd.x} ${arcEnd.y}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Gauge arc colored fill */}
          <path
            d={`M ${arcStart.x} ${arcStart.y} A ${arcRadius} ${arcRadius} 0 ${Math.abs(angle + 135) > 180 ? 1 : 0} 1 ${filledEnd.x} ${filledEnd.y}`}
            fill="none"
            stroke="url(#arc-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Tick marks */}
          {[-135, -90, -45, 0, 45, 90, 135].map((tickAngle, i) => {
            const tickRad = tickAngle * (Math.PI / 180);
            const inner = r * 0.68;
            const outer = r * 0.78;
            return (
              <line
                key={i}
                x1={cx + inner * Math.sin(tickRad)}
                y1={cy - inner * Math.cos(tickRad)}
                x2={cx + outer * Math.sin(tickRad)}
                y2={cy - outer * Math.cos(tickRad)}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}

          {/* Labels */}
          <text x={cx - r * 0.55} y={cy + r * 0.65} fill="hsl(0, 60%, 50%)" fontSize="7" fontWeight="600" opacity="0.7">
            Evil
          </text>
          <text x={cx + r * 0.3} y={cy + r * 0.65} fill="hsl(45, 70%, 55%)" fontSize="7" fontWeight="600" opacity="0.7">
            Good
          </text>

          {/* Needle glow */}
          <motion.line
            x1={cx} y1={cy}
            animate={{ x2: needleX, y2: needleY }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            stroke={colors.glow}
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#compass-glow)"
            opacity="0.5"
          />

          {/* Needle */}
          <motion.line
            x1={cx} y1={cy}
            animate={{ x2: needleX, y2: needleY }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            stroke={colors.main}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx={cx} cy={cy} r="3" fill={colors.main} />
          <circle cx={cx} cy={cy} r="1.5" fill="hsl(var(--background))" />

          {/* Score text */}
          <text
            x={cx}
            y={cy + r * 0.35}
            textAnchor="middle"
            fill={colors.main}
            fontSize="11"
            fontWeight="700"
            fontFamily="var(--font-display)"
          >
            {clampedScore}
          </text>
        </svg>

        {/* Animated glow ring */}
        <motion.div
          animate={{
            boxShadow: [
              `0 0 8px 2px ${colors.glow}33`,
              `0 0 16px 4px ${colors.glow}22`,
              `0 0 8px 2px ${colors.glow}33`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 rounded-full pointer-events-none"
        />
      </div>

      <motion.span
        key={colors.label}
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: colors.main }}
      >
        {colors.label}
      </motion.span>
    </div>
  );
}
