import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type WeatherType = "rain" | "snow" | "fog" | "embers" | "storm" | "none";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface WeatherParticlesProps {
  weather: WeatherType;
  className?: string;
}

const PARTICLE_CONFIGS: Record<Exclude<WeatherType, "none">, {
  count: number;
  color: string;
  spawn: (w: number, h: number) => Partial<Particle>;
  update: (p: Particle, w: number, h: number) => void;
  draw: (ctx: CanvasRenderingContext2D, p: Particle) => void;
}> = {
  rain: {
    count: 150,
    color: "rgba(140,180,220,",
    spawn: (w, h) => ({
      x: Math.random() * w * 1.2 - w * 0.1,
      y: Math.random() * -h,
      vx: -1.5 + Math.random() * -1,
      vy: 8 + Math.random() * 6,
      size: 1 + Math.random() * 1.5,
      opacity: 0.15 + Math.random() * 0.25,
      life: 0,
      maxLife: 200,
    }),
    update: (p, w, h) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > h) { p.y = -10; p.x = Math.random() * w * 1.2 - w * 0.1; }
    },
    draw: (ctx, p) => {
      ctx.strokeStyle = `rgba(140,180,220,${p.opacity})`;
      ctx.lineWidth = p.size * 0.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
      ctx.stroke();
    },
  },
  snow: {
    count: 80,
    color: "rgba(230,235,245,",
    spawn: (w, h) => ({
      x: Math.random() * w,
      y: Math.random() * -h * 0.5,
      vx: Math.sin(Math.random() * Math.PI * 2) * 0.5,
      vy: 0.5 + Math.random() * 1.5,
      size: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.4,
      life: 0,
      maxLife: 500,
    }),
    update: (p, w, h) => {
      p.life++;
      p.x += p.vx + Math.sin(p.life * 0.02) * 0.3;
      p.y += p.vy;
      if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
    },
    draw: (ctx, p) => {
      ctx.fillStyle = `rgba(230,235,245,${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  fog: {
    count: 12,
    color: "rgba(180,190,200,",
    spawn: (w, h) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0.2 + Math.random() * 0.4,
      vy: Math.random() * 0.1 - 0.05,
      size: 80 + Math.random() * 160,
      opacity: 0.02 + Math.random() * 0.06,
      life: 0,
      maxLife: 1000,
    }),
    update: (p, w, _h) => {
      p.life++;
      p.x += p.vx;
      p.opacity = (0.02 + Math.random() * 0.01) * (0.5 + 0.5 * Math.sin(p.life * 0.005));
      if (p.x - p.size > w) { p.x = -p.size; }
    },
    draw: (ctx, p) => {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, `rgba(180,190,200,${p.opacity})`);
      grad.addColorStop(1, `rgba(180,190,200,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  embers: {
    count: 40,
    color: "rgba(255,140,40,",
    spawn: (w, h) => ({
      x: Math.random() * w,
      y: h + Math.random() * 20,
      vx: Math.random() * 1 - 0.5,
      vy: -(1 + Math.random() * 2),
      size: 1.5 + Math.random() * 3,
      opacity: 0.5 + Math.random() * 0.5,
      life: 0,
      maxLife: 120 + Math.random() * 80,
    }),
    update: (p, w, _h) => {
      p.life++;
      p.x += p.vx + Math.sin(p.life * 0.05) * 0.5;
      p.y += p.vy;
      p.opacity = Math.max(0, (1 - p.life / p.maxLife) * 0.7);
      p.size *= 0.998;
    },
    draw: (ctx, p) => {
      // Glowing ember
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      grad.addColorStop(0, `rgba(255,200,80,${p.opacity})`);
      grad.addColorStop(0.4, `rgba(255,120,20,${p.opacity * 0.5})`);
      grad.addColorStop(1, `rgba(255,60,10,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();
      // Core
      ctx.fillStyle = `rgba(255,240,180,${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  storm: {
    count: 200,
    color: "rgba(160,180,210,",
    spawn: (w, h) => ({
      x: Math.random() * w * 1.4 - w * 0.2,
      y: Math.random() * -h,
      vx: -3 + Math.random() * -2,
      vy: 12 + Math.random() * 8,
      size: 1 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.2,
      life: 0,
      maxLife: 150,
    }),
    update: (p, w, h) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > h) { p.y = -10; p.x = Math.random() * w * 1.4 - w * 0.2; }
    },
    draw: (ctx, p) => {
      ctx.strokeStyle = `rgba(160,180,210,${p.opacity})`;
      ctx.lineWidth = p.size * 0.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 3, p.y + p.vy * 2.5);
      ctx.stroke();
    },
  },
};

// Detect weather from DM narrative text
const WEATHER_KEYWORDS: Record<WeatherType, string[]> = {
  rain: ["rain", "raining", "downpour", "drizzle", "wet", "puddle", "soaked", "drenched", "shower"],
  snow: ["snow", "snowing", "blizzard", "frost", "frozen", "ice", "icy", "cold wind", "tundra", "winter"],
  fog: ["fog", "mist", "misty", "haze", "hazy", "murky", "obscured", "swamp", "marsh", "barovian"],
  embers: ["fire", "flame", "burning", "lava", "magma", "torch", "inferno", "ember", "volcano", "hellfire", "forge", "furnace", "avernus"],
  storm: ["storm", "thunder", "lightning", "tempest", "hurricane", "gale", "howling wind"],
  none: [],
};

export function detectWeather(text: string): WeatherType {
  const lower = text.toLowerCase();
  const scores: Record<WeatherType, number> = { rain: 0, snow: 0, fog: 0, embers: 0, storm: 0, none: 0 };

  for (const [type, keywords] of Object.entries(WEATHER_KEYWORDS)) {
    if (type === "none") continue;
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[type as WeatherType] += 1;
    }
  }

  let best: WeatherType = "none";
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) { best = type as WeatherType; bestScore = score; }
  }
  return best;
}

export default function WeatherParticles({ weather, className = "" }: WeatherParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const [visible, setVisible] = useState(weather !== "none");

  useEffect(() => {
    if (weather === "none") {
      setVisible(false);
      return;
    }
    setVisible(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const config = PARTICLE_CONFIGS[weather];
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // Init particles
    particlesRef.current = Array.from({ length: config.count }, () => {
      const p = config.spawn(canvas.width, canvas.height);
      return {
        x: p.x ?? 0, y: p.y ?? 0, vx: p.vx ?? 0, vy: p.vy ?? 0,
        size: p.size ?? 2, opacity: p.opacity ?? 0.5, life: 0,
        maxLife: p.maxLife ?? 200,
      };
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        config.update(p, canvas.width, canvas.height);
        config.draw(ctx, p);

        // Respawn dead particles
        if (p.life > p.maxLife || p.opacity <= 0) {
          const np = config.spawn(canvas.width, canvas.height);
          particles[i] = {
            x: np.x ?? 0, y: np.y ?? 0, vx: np.vx ?? 0, vy: np.vy ?? 0,
            size: np.size ?? 2, opacity: np.opacity ?? 0.5, life: 0,
            maxLife: np.maxLife ?? 200,
          };
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [weather]);

  if (weather === "none" && !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.canvas
          ref={canvasRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className={`pointer-events-none absolute inset-0 z-10 ${className}`}
        />
      )}
    </AnimatePresence>
  );
}
