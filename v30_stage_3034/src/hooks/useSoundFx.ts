import { useCallback, useRef } from 'react';

// Sound effects utility hook
// Uses Web Audio API for crisp, low-latency sounds

type SoundType =
  | 'CLICK'
  | 'SUCCESS'
  | 'ERROR'
  | 'NOTIFICATION'
  | 'TRANSITION'
  | 'ALERT'
  | 'BOOT'
  | 'GODMODE';

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const createBeep = (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) => {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const sounds: Record<SoundType, () => void> = {
  CLICK: () => createBeep(800, 0.05, 'sine', 0.08),
  SUCCESS: () => {
    createBeep(523.25, 0.1, 'sine', 0.1); // C5
    setTimeout(() => createBeep(659.25, 0.1, 'sine', 0.1), 100); // E5
    setTimeout(() => createBeep(783.99, 0.15, 'sine', 0.1), 200); // G5
  },
  ERROR: () => {
    createBeep(200, 0.2, 'sawtooth', 0.15);
  },
  NOTIFICATION: () => {
    createBeep(880, 0.08, 'sine', 0.1);
    setTimeout(() => createBeep(1046.5, 0.1, 'sine', 0.1), 100);
  },
  TRANSITION: () => createBeep(440, 0.03, 'sine', 0.05),
  ALERT: () => {
    createBeep(440, 0.1, 'square', 0.1);
    setTimeout(() => createBeep(440, 0.1, 'square', 0.1), 200);
  },
  BOOT: () => {
    createBeep(200, 0.1, 'sine', 0.1);
    setTimeout(() => createBeep(400, 0.1, 'sine', 0.1), 100);
    setTimeout(() => createBeep(600, 0.15, 'sine', 0.1), 200);
    setTimeout(() => createBeep(800, 0.2, 'sine', 0.15), 300);
  },
  GODMODE: () => {
    createBeep(261.63, 0.15, 'sine', 0.1); // C4
    setTimeout(() => createBeep(329.63, 0.15, 'sine', 0.1), 100); // E4
    setTimeout(() => createBeep(392.00, 0.15, 'sine', 0.1), 200); // G4
    setTimeout(() => createBeep(523.25, 0.3, 'sine', 0.15), 300); // C5
  },
};

export const useSoundFx = () => {
  const isMuted = useRef(false);

  const play = useCallback((type: SoundType) => {
    if (isMuted.current) return;

    try {
      // Resume audio context if suspended (browser policy)
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
      sounds[type]?.();
    } catch (e) {
      // Silently fail - sound effects are non-critical
    }
  }, []);

  const mute = useCallback(() => {
    isMuted.current = true;
  }, []);

  const unmute = useCallback(() => {
    isMuted.current = false;
  }, []);

  const toggle = useCallback(() => {
    isMuted.current = !isMuted.current;
    return isMuted.current;
  }, []);

  return { play, mute, unmute, toggle, isMuted: isMuted.current };
};

export default useSoundFx;
