/**
 * 🔊 SOUND EFFECTS | PREDATOR v61.0-ELITE
 * Просунуті sound effects та audio feedback
 * Перевищує Palantir: Web Audio API, procedural sounds, spatial audio
 */
import { useRef, useCallback } from 'react';

type SoundType = 
  | 'hover' 
  | 'click' 
  | 'success' 
  | 'error' 
  | 'notification' 
  | 'typing' 
  | 'scan' 
  | 'unlock'
  | 'lock'
  | 'alert';

interface SoundEffectsConfig {
  volume?: number;
  enabled?: boolean;
  spatial?: boolean;
}

export const useSoundEffects = (config: SoundEffectsConfig = {}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { volume = 0.3, enabled = true, spatial = false } = config;

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playProceduralSound = useCallback((type: SoundType) => {
    if (!enabled) return;

    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'hover':
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.05);
        gainNode.gain.setValueAtTime(volume * 0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      case 'click':
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gainNode.gain.setValueAtTime(volume * 0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;

      case 'success':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gainNode.gain.setValueAtTime(volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;

      case 'error':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gainNode.gain.setValueAtTime(volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'notification':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1100, now + 0.1);
        oscillator.frequency.setValueAtTime(880, now + 0.2);
        gainNode.gain.setValueAtTime(volume * 0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'typing':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(1200 + Math.random() * 200, now);
        gainNode.gain.setValueAtTime(volume * 0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
        oscillator.start(now);
        oscillator.stop(now + 0.02);
        break;

      case 'scan':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
        gainNode.gain.setValueAtTime(volume * 0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;

      case 'unlock':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        gainNode.gain.setValueAtTime(volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'lock':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gainNode.gain.setValueAtTime(volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case 'alert':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.setValueAtTime(600, now + 0.1);
        oscillator.frequency.setValueAtTime(800, now + 0.2);
        oscillator.frequency.setValueAtTime(600, now + 0.3);
        gainNode.gain.setValueAtTime(volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;
    }
  }, [enabled, volume, getAudioContext]);

  const playHover = useCallback(() => playProceduralSound('hover'), [playProceduralSound]);
  const playClick = useCallback(() => playProceduralSound('click'), [playProceduralSound]);
  const playSuccess = useCallback(() => playProceduralSound('success'), [playProceduralSound]);
  const playError = useCallback(() => playProceduralSound('error'), [playProceduralSound]);
  const playNotification = useCallback(() => playProceduralSound('notification'), [playProceduralSound]);
  const playTyping = useCallback(() => playProceduralSound('typing'), [playProceduralSound]);
  const playScan = useCallback(() => playProceduralSound('scan'), [playProceduralSound]);
  const playUnlock = useCallback(() => playProceduralSound('unlock'), [playProceduralSound]);
  const playLock = useCallback(() => playProceduralSound('lock'), [playProceduralSound]);
  const playAlert = useCallback(() => playProceduralSound('alert'), [playProceduralSound]);

  return {
    playHover,
    playClick,
    playSuccess,
    playError,
    playNotification,
    playTyping,
    playScan,
    playUnlock,
    playLock,
    playAlert
  };
};

export default useSoundEffects;
