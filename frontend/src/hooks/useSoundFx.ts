
import { useCallback, useRef } from 'react';

type SoundType = 'HOVER' | 'CLICK' | 'SUCCESS' | 'ERROR' | 'ALERT' | 'TYPE' | 'SCAN';

export const useSoundFx = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    const initAudio = useCallback(() => {
        if (typeof window === 'undefined') return;

        if (!audioContextRef.current) {
            const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextCtor) {
                try {
                    // Prevent Illegal Constructor if context is not allowed
                    audioContextRef.current = new AudioContextCtor();
                } catch (e) {
                    console.error("[SoundFx] Failed to create AudioContext (possibly blocked or not supported):", e);
                }
            }
        }
        
        // Resume if suspended (browser autoplay policy)
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            try {
                audioContextRef.current.resume().catch(e => console.warn("[SoundFx] Resume failed:", e));
            } catch (e) {
                console.warn("[SoundFx] Resume error:", e);
            }
        }
    }, []);

    const play = useCallback((type: SoundType) => {
        try {
            initAudio();
            const ctx = audioContextRef.current;
            
            // If context is still null or closed, abort
            if (!ctx || ctx.state === 'closed') return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            switch (type) {
                case 'HOVER':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
                    gain.gain.setValueAtTime(0.01, now); // Lower volume
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    osc.start(now);
                    osc.stop(now + 0.05);
                    break;

                case 'CLICK':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(150, now);
                    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
                    gain.gain.setValueAtTime(0.02, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    osc.start(now);
                    osc.stop(now + 0.1);
                    break;

                case 'SUCCESS':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.setValueAtTime(554.37, now + 0.1);
                    gain.gain.setValueAtTime(0.02, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.4);
                    osc.start(now);
                    osc.stop(now + 0.4);
                    break;

                case 'ERROR':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(100, now);
                    osc.frequency.linearRampToValueAtTime(80, now + 0.3);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.3);
                    osc.start(now);
                    osc.stop(now + 0.3);
                    break;
                
                case 'SCAN':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(2000, now);
                    osc.frequency.exponentialRampToValueAtTime(500, now + 0.2);
                    gain.gain.setValueAtTime(0.01, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.2);
                    osc.start(now);
                    osc.stop(now + 0.2);
                    break;
            }
        } catch (e) {
            // Suppress errors to avoid console spam
        }
    }, [initAudio]);

    return { play };
};
