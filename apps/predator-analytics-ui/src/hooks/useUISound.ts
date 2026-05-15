import { useCallback, useRef } from 'react';

export enum UISoundType {
  HOVER = 'hover',
  CLICK = 'click',
  SLIDE_COMPLETE = 'slide_complete',
  ERROR = 'error',
  SUCCESS = 'success',
}

const isEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('predator_ui_sounds') !== 'off';
  } catch {
    return false;
  }
};

let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
};

const playTone = (freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.06) => {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
};

export const playUISound = (type: UISoundType) => {
  if (!isEnabled()) return;

  switch (type) {
    case UISoundType.HOVER:
      playTone(1800, 0.04, 'sine', 0.018);
      break;
    case UISoundType.CLICK:
      playTone(900, 0.08, 'triangle', 0.04);
      setTimeout(() => playTone(1300, 0.05, 'sine', 0.025), 40);
      break;
    case UISoundType.SLIDE_COMPLETE:
      playTone(440, 0.12, 'sine', 0.05);
      setTimeout(() => playTone(660, 0.12, 'sine', 0.05), 80);
      setTimeout(() => playTone(880, 0.18, 'sine', 0.06), 160);
      break;
    case UISoundType.ERROR:
      playTone(200, 0.22, 'sawtooth', 0.04);
      setTimeout(() => playTone(160, 0.28, 'sawtooth', 0.035), 100);
      break;
    case UISoundType.SUCCESS:
      playTone(523, 0.1, 'sine', 0.04);
      setTimeout(() => playTone(784, 0.14, 'sine', 0.05), 60);
      break;
  }
};

export const useUISound = () => {
  const lastPlayRef = useRef<number>(0);

  const safePlay = useCallback((type: UISoundType, throttleMs = 60) => {
    const now = Date.now();
    if (now - lastPlayRef.current < throttleMs) return;
    lastPlayRef.current = now;
    playUISound(type);
  }, []);

  return {
    play: safePlay,
    playImmediate: playUISound,
    isEnabled,
    toggle: () => {
      if (typeof window === 'undefined') return;
      try {
        const next = localStorage.getItem('predator_ui_sounds') === 'off' ? 'on' : 'off';
        localStorage.setItem('predator_ui_sounds', next);
      } catch {
        // Ignore localStorage errors in test environment
      }
    },
  };
};

export default useUISound;
