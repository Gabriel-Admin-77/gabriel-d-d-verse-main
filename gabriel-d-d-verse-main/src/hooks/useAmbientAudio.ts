import { useEffect, useRef, useState, useCallback } from "react";

type AdventureId = string;
type SceneMood = "exploration" | "combat" | "mystery" | "rest" | "none";

interface AmbientLayer {
  oscillator?: OscillatorNode;
  gain?: GainNode;
  filter?: BiquadFilterNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
}

// Each adventure gets a unique ambient soundscape definition
const SOUNDSCAPES: Record<string, {
  label: string;
  layers: Array<{
    type: OscillatorType;
    freq: number;
    volume: number;
    filterFreq: number;
    filterQ: number;
    lfoRate: number;
    lfoDepth: number;
    detune?: number;
  }>;
}> = {
  lost_mines: {
    label: "Echoing Caverns",
    layers: [
      { type: "sine", freq: 65, volume: 0.12, filterFreq: 300, filterQ: 2, lfoRate: 0.08, lfoDepth: 15 },
      { type: "triangle", freq: 130, volume: 0.04, filterFreq: 500, filterQ: 1, lfoRate: 0.15, lfoDepth: 8 },
      { type: "sine", freq: 195, volume: 0.02, filterFreq: 400, filterQ: 3, lfoRate: 0.05, lfoDepth: 20 },
    ],
  },
  sunless_citadel: {
    label: "Crumbling Depths",
    layers: [
      { type: "sawtooth", freq: 55, volume: 0.06, filterFreq: 200, filterQ: 5, lfoRate: 0.1, lfoDepth: 10 },
      { type: "sine", freq: 110, volume: 0.08, filterFreq: 350, filterQ: 2, lfoRate: 0.04, lfoDepth: 30 },
      { type: "triangle", freq: 220, volume: 0.03, filterFreq: 600, filterQ: 1, lfoRate: 0.2, lfoDepth: 5 },
    ],
  },
  dragon_hatchery: {
    label: "Dragon's Lair",
    layers: [
      { type: "sawtooth", freq: 45, volume: 0.07, filterFreq: 180, filterQ: 6, lfoRate: 0.06, lfoDepth: 25 },
      { type: "sine", freq: 90, volume: 0.1, filterFreq: 250, filterQ: 3, lfoRate: 0.03, lfoDepth: 40 },
      { type: "triangle", freq: 360, volume: 0.02, filterFreq: 800, filterQ: 1, lfoRate: 0.3, lfoDepth: 3, detune: 5 },
    ],
  },
  haunted_manor: {
    label: "Haunted Whispers",
    layers: [
      { type: "sine", freq: 80, volume: 0.1, filterFreq: 400, filterQ: 4, lfoRate: 0.12, lfoDepth: 35 },
      { type: "sine", freq: 83, volume: 0.08, filterFreq: 380, filterQ: 4, lfoRate: 0.11, lfoDepth: 30 },
      { type: "triangle", freq: 160, volume: 0.03, filterFreq: 250, filterQ: 8, lfoRate: 0.02, lfoDepth: 50 },
      { type: "sawtooth", freq: 40, volume: 0.04, filterFreq: 120, filterQ: 10, lfoRate: 0.07, lfoDepth: 15 },
    ],
  },
  forge_of_fury: {
    label: "Dwarven Forge",
    layers: [
      { type: "square", freq: 50, volume: 0.05, filterFreq: 150, filterQ: 8, lfoRate: 0.5, lfoDepth: 5 },
      { type: "sine", freq: 100, volume: 0.1, filterFreq: 300, filterQ: 2, lfoRate: 0.08, lfoDepth: 20 },
      { type: "sawtooth", freq: 200, volume: 0.03, filterFreq: 500, filterQ: 3, lfoRate: 0.15, lfoDepth: 10 },
    ],
  },
  white_plume: {
    label: "Volcanic Rumble",
    layers: [
      { type: "sawtooth", freq: 35, volume: 0.08, filterFreq: 120, filterQ: 6, lfoRate: 0.04, lfoDepth: 40 },
      { type: "sine", freq: 70, volume: 0.12, filterFreq: 200, filterQ: 3, lfoRate: 0.06, lfoDepth: 30 },
      { type: "square", freq: 140, volume: 0.02, filterFreq: 350, filterQ: 5, lfoRate: 0.8, lfoDepth: 2 },
    ],
  },
  curse_strahd: {
    label: "Barovian Mists",
    layers: [
      { type: "sine", freq: 73, volume: 0.1, filterFreq: 300, filterQ: 5, lfoRate: 0.05, lfoDepth: 40 },
      { type: "sine", freq: 77, volume: 0.08, filterFreq: 280, filterQ: 5, lfoRate: 0.04, lfoDepth: 35 },
      { type: "triangle", freq: 146, volume: 0.04, filterFreq: 450, filterQ: 2, lfoRate: 0.1, lfoDepth: 15 },
      { type: "sawtooth", freq: 36, volume: 0.05, filterFreq: 100, filterQ: 10, lfoRate: 0.02, lfoDepth: 50 },
    ],
  },
  tomb_annihilation: {
    label: "Jungle of Chult",
    layers: [
      { type: "sine", freq: 120, volume: 0.06, filterFreq: 600, filterQ: 1, lfoRate: 0.3, lfoDepth: 8 },
      { type: "triangle", freq: 240, volume: 0.04, filterFreq: 800, filterQ: 2, lfoRate: 0.5, lfoDepth: 5 },
      { type: "sine", freq: 60, volume: 0.1, filterFreq: 200, filterQ: 3, lfoRate: 0.07, lfoDepth: 25 },
      { type: "square", freq: 480, volume: 0.01, filterFreq: 1200, filterQ: 4, lfoRate: 1.2, lfoDepth: 3 },
    ],
  },
  descent_avernus: {
    label: "Hellfire Winds",
    layers: [
      { type: "sawtooth", freq: 40, volume: 0.09, filterFreq: 150, filterQ: 8, lfoRate: 0.03, lfoDepth: 45 },
      { type: "square", freq: 80, volume: 0.04, filterFreq: 200, filterQ: 6, lfoRate: 0.1, lfoDepth: 20 },
      { type: "sine", freq: 160, volume: 0.06, filterFreq: 400, filterQ: 3, lfoRate: 0.06, lfoDepth: 30 },
      { type: "sawtooth", freq: 320, volume: 0.02, filterFreq: 700, filterQ: 2, lfoRate: 0.4, lfoDepth: 8, detune: -10 },
    ],
  },
  dungeon_mad_mage: {
    label: "Arcane Hum",
    layers: [
      { type: "sine", freq: 100, volume: 0.08, filterFreq: 500, filterQ: 3, lfoRate: 0.15, lfoDepth: 20 },
      { type: "sine", freq: 150, volume: 0.06, filterFreq: 700, filterQ: 2, lfoRate: 0.2, lfoDepth: 12 },
      { type: "triangle", freq: 200, volume: 0.04, filterFreq: 900, filterQ: 1, lfoRate: 0.08, lfoDepth: 25 },
      { type: "sine", freq: 50, volume: 0.05, filterFreq: 180, filterQ: 6, lfoRate: 0.03, lfoDepth: 35 },
    ],
  },
  rise_tiamat: {
    label: "Dragon Storm",
    layers: [
      { type: "sawtooth", freq: 30, volume: 0.1, filterFreq: 100, filterQ: 8, lfoRate: 0.02, lfoDepth: 50 },
      { type: "sine", freq: 60, volume: 0.08, filterFreq: 200, filterQ: 4, lfoRate: 0.05, lfoDepth: 35 },
      { type: "square", freq: 120, volume: 0.03, filterFreq: 350, filterQ: 5, lfoRate: 0.6, lfoDepth: 4 },
      { type: "triangle", freq: 240, volume: 0.04, filterFreq: 600, filterQ: 2, lfoRate: 0.12, lfoDepth: 15 },
    ],
  },
  vecna_lives: {
    label: "Eldritch Void",
    layers: [
      { type: "sine", freq: 55, volume: 0.1, filterFreq: 250, filterQ: 6, lfoRate: 0.03, lfoDepth: 50 },
      { type: "sine", freq: 58, volume: 0.08, filterFreq: 230, filterQ: 6, lfoRate: 0.025, lfoDepth: 45 },
      { type: "sawtooth", freq: 27, volume: 0.06, filterFreq: 80, filterQ: 12, lfoRate: 0.01, lfoDepth: 60 },
      { type: "triangle", freq: 330, volume: 0.02, filterFreq: 800, filterQ: 3, lfoRate: 0.4, lfoDepth: 6, detune: 7 },
    ],
  },
};

export function useAmbientAudio(adventureId: string | null) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const layersRef = useRef<AmbientLayer[]>([]);
  const moodFilterRef = useRef<BiquadFilterNode | null>(null);
  const moodGainRef = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [currentMood, setCurrentMood] = useState<SceneMood>("none");
  const currentIdRef = useRef<string | null>(null);

  const stopAll = useCallback(() => {
    const now = ctxRef.current?.currentTime ?? 0;
    layersRef.current.forEach((l) => {
      try {
        if (l.gain) l.gain.gain.linearRampToValueAtTime(0, now + 1.5);
        setTimeout(() => {
          l.oscillator?.stop();
          l.lfo?.stop();
        }, 2000);
      } catch {}
    });
    layersRef.current = [];
  }, []);

  const startSoundscape = useCallback((id: string) => {
    const scape = SOUNDSCAPES[id];
    if (!scape) return;

    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.gain.value = volume;
      masterGainRef.current.connect(ctxRef.current.destination);
    }

    const ctx = ctxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const master = masterGainRef.current!;
    const now = ctx.currentTime;

    // Stop existing
    stopAll();

    const newLayers: AmbientLayer[] = scape.layers.map((def) => {
      // Main oscillator
      const osc = ctx.createOscillator();
      osc.type = def.type;
      osc.frequency.value = def.freq;
      if (def.detune) osc.detune.value = def.detune;

      // Filter
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = def.filterFreq;
      filter.Q.value = def.filterQ;

      // Gain with fade-in
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(def.volume, now + 3);

      // LFO for filter modulation
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = def.lfoRate;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = def.lfoDepth;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(now);
      lfo.start(now);

      return { oscillator: osc, gain, filter, lfo, lfoGain };
    });

    layersRef.current = newLayers;
    currentIdRef.current = id;
    setIsPlaying(true);
  }, [volume, stopAll]);

  // Change adventure
  useEffect(() => {
    if (!adventureId) {
      if (isPlaying) {
        stopAll();
        setIsPlaying(false);
        currentIdRef.current = null;
      }
      return;
    }

    if (adventureId !== currentIdRef.current && isPlaying) {
      // Cross-fade to new soundscape
      stopAll();
      setTimeout(() => startSoundscape(adventureId), 1600);
    }
    currentIdRef.current = adventureId;
  }, [adventureId]);

  // Volume changes
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(
        volume,
        ctxRef.current?.currentTime ?? 0 + 0.3
      );
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      ctxRef.current?.close();
    };
  }, [stopAll]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stopAll();
      setIsPlaying(false);
    } else if (currentIdRef.current) {
      startSoundscape(currentIdRef.current);
    }
  }, [isPlaying, stopAll, startSoundscape]);

  const play = useCallback(() => {
    const id = currentIdRef.current;
    if (id && !isPlaying) {
      startSoundscape(id);
    }
  }, [isPlaying, startSoundscape]);

  const getSoundscapeLabel = useCallback((id: string | null) => {
    if (!id) return null;
    return SOUNDSCAPES[id]?.label ?? null;
  }, []);

  // Dynamic mood shifting - modifies filter/gain to react to scene context
  const setSceneMood = useCallback((mood: SceneMood) => {
    if (!ctxRef.current || !masterGainRef.current || mood === currentMood) return;
    setCurrentMood(mood);
    const ctx = ctxRef.current;
    const now = ctx.currentTime;

    // Adjust existing layers based on mood
    layersRef.current.forEach((l) => {
      if (!l.filter || !l.gain) return;
      switch (mood) {
        case "combat":
          // Raise filter cutoff, boost gain slightly, speed up LFO
          l.filter.frequency.linearRampToValueAtTime(l.filter.frequency.value * 1.6, now + 1);
          l.gain.gain.linearRampToValueAtTime(l.gain.gain.value * 1.3, now + 0.5);
          if (l.lfo) l.lfo.frequency.linearRampToValueAtTime(l.lfo.frequency.value * 2, now + 0.5);
          break;
        case "mystery":
          // Lower filter, add resonance feel
          l.filter.frequency.linearRampToValueAtTime(l.filter.frequency.value * 0.5, now + 2);
          l.filter.Q.linearRampToValueAtTime(l.filter.Q.value * 1.5, now + 2);
          break;
        case "rest":
          // Soften everything
          l.filter.frequency.linearRampToValueAtTime(l.filter.frequency.value * 0.7, now + 2);
          l.gain.gain.linearRampToValueAtTime(l.gain.gain.value * 0.6, now + 2);
          if (l.lfo) l.lfo.frequency.linearRampToValueAtTime(l.lfo.frequency.value * 0.5, now + 2);
          break;
        default: // exploration - reset to default (handled by soundscape definition)
          break;
      }
    });
  }, [currentMood]);

  return { isPlaying, volume, setVolume, toggle, play, startSoundscape, getSoundscapeLabel, setSceneMood, currentMood };
}
