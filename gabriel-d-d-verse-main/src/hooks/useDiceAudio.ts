import { useCallback } from "react";

const audioCtxRef = { current: null as AudioContext | null };

function getAudioCtx(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtxRef.current.state === "suspended") {
    audioCtxRef.current.resume();
  }
  return audioCtxRef.current;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", gain = 0.15, delay = 0) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  g.gain.setValueAtTime(gain, ctx.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playNoise(duration: number, gain: number, delay = 0) {
  const ctx = getAudioCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  g.gain.setValueAtTime(gain, ctx.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  source.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  source.start(ctx.currentTime + delay);
}

export function useDiceAudio() {
  const playRoll = useCallback(() => {
    // Realistic dice tumble: multiple bouncing impacts
    for (let i = 0; i < 8; i++) {
      const t = i * 0.07;
      playNoise(0.03, 0.08 - i * 0.008, t);
      playTone(1200 + Math.random() * 800, 0.04, "square", 0.04, t);
    }
    // Rolling surface friction
    playNoise(0.5, 0.03, 0);
  }, []);

  const playSuccess = useCallback(() => {
    // Epic fanfare: rising power chord with shimmer
    playTone(262, 0.15, "sine", 0.1, 0);       // C4 base
    playTone(330, 0.15, "sine", 0.1, 0.05);     // E4
    playTone(392, 0.2, "sine", 0.12, 0.1);      // G4
    playTone(523, 0.25, "sine", 0.14, 0.15);    // C5
    playTone(659, 0.3, "triangle", 0.12, 0.2);  // E5
    playTone(784, 0.35, "sine", 0.15, 0.25);    // G5
    playTone(1047, 0.5, "sine", 0.12, 0.35);    // C6
    playTone(1319, 0.6, "triangle", 0.08, 0.4); // E6 shimmer
    // Sparkle hits
    for (let i = 0; i < 5; i++) {
      playTone(2000 + Math.random() * 2000, 0.08, "sine", 0.03, 0.5 + i * 0.06);
    }
  }, []);

  const playFailure = useCallback(() => {
    // Doom: low descending brass + thunder rumble
    playTone(220, 0.3, "sawtooth", 0.08, 0);     // A3
    playTone(185, 0.35, "sawtooth", 0.07, 0.12);  // F#3
    playTone(147, 0.4, "sawtooth", 0.07, 0.25);   // D3
    playTone(110, 0.6, "sawtooth", 0.06, 0.4);    // A2
    playTone(82, 0.8, "sawtooth", 0.05, 0.55);    // low rumble
    // Thunder crack
    playNoise(0.15, 0.1, 0.3);
    playNoise(0.4, 0.05, 0.45);
  }, []);

  const playCriticalSuccess = useCallback(() => {
    // NAT 20! Angelic choir + explosion
    playTone(523, 0.4, "sine", 0.15, 0);
    playTone(659, 0.4, "sine", 0.15, 0);
    playTone(784, 0.4, "sine", 0.15, 0);
    playTone(1047, 0.5, "triangle", 0.12, 0.1);
    playTone(1319, 0.5, "triangle", 0.12, 0.1);
    playTone(1568, 0.6, "sine", 0.1, 0.2);
    playTone(2093, 0.7, "sine", 0.08, 0.3);
    // Sparkle burst
    for (let i = 0; i < 10; i++) {
      playTone(3000 + Math.random() * 3000, 0.1, "sine", 0.025, 0.3 + i * 0.04);
    }
    playNoise(0.08, 0.12, 0.05);
  }, []);

  const playCriticalFailure = useCallback(() => {
    // NAT 1! Glass shatter + descent into darkness
    playNoise(0.2, 0.15, 0);
    playTone(300, 0.5, "sawtooth", 0.1, 0.1);
    playTone(200, 0.6, "sawtooth", 0.09, 0.25);
    playTone(120, 0.7, "sawtooth", 0.08, 0.4);
    playTone(60, 1.0, "sawtooth", 0.06, 0.6);
    // Shatter tinkles
    for (let i = 0; i < 6; i++) {
      playTone(4000 + Math.random() * 2000, 0.05, "square", 0.02, 0.05 + i * 0.03);
    }
  }, []);

  return { playRoll, playSuccess, playFailure, playCriticalSuccess, playCriticalFailure };
}
