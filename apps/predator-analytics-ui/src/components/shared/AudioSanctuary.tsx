import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🔊 SYNERGETIC AUDIO SANCTUARY | v58.2-WRAITH
 * П ЕДАТО : АУДІО-СУП ОВІД (TACTICAL AMBIENCE)
 * 
 * Генерує низькочастотний ембієнт та тактичні звуковірефекти через Web Audio API.
 * Створює атмосферу серйозності та "хижацького" спостереження.
 */

export const AudioSanctuary: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const droneRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            const masterGain = audioCtxRef.current.createGain();
            masterGain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
            masterGain.connect(audioCtxRef.current.destination);
            gainRef.current = masterGain;

            // Base Drone Layer (Deep Low Frequency)
            const osc1 = audioCtxRef.current.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(40, audioCtxRef.current.currentTime);
            
            const filter = audioCtxRef.current.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(150, audioCtxRef.current.currentTime);
            filter.Q.setValueAtTime(5, audioCtxRef.current.currentTime);

            const lfo = audioCtxRef.current.createOscillator();
            lfo.frequency.setValueAtTime(0.1, audioCtxRef.current.currentTime);
            const lfoGain = audioCtxRef.current.createGain();
            lfoGain.gain.setValueAtTime(5, audioCtxRef.current.currentTime);
            lfo.connect(lfoGain);
            lfoGain.connect(osc1.frequency);

            osc1.connect(filter);
            filter.connect(masterGain);
            
            osc1.start();
            lfo.start();
            droneRef.current = osc1;
        }

        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        setIsPlaying(true);
    };

    const stopAudio = () => {
        if (audioCtxRef.current) {
            audioCtxRef.current.suspend();
        }
        setIsPlaying(false);
    };

    const toggleAudio = () => {
        if (isPlaying) stopAudio();
        else initAudio();
    };

    return (
        <div className="fixed bottom-12 right-12 z-[9999] flex items-center gap-6">
            <AnimatePresence>
                {isPlaying && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-red-500/10 border border-red-500/30 px-6 py-3 rounded-2xl backdrop-blur-3xl shadow-3xl flex items-center gap-4"
                    >
                        <ShieldAlert size={14} className="text-red-500 animate-pulse" />
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] italic">АКТИВНИЙ_ТАКТИЧНИЙ_ЕМБІЄНТ</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleAudio}
                className={cn(
                    "p-6 rounded-[2rem] border transition-all shadow-3xl backdrop-blur-3xl group",
                    isPlaying 
                        ? "bg-red-600/20 border-red-500/40 text-red-400" 
                        : "bg-slate-900/80 border-white/10 text-slate-500 hover:text-white hover:border-indigo-500/40"
                )}
            >
                {isPlaying ? <Volume2 size={24} className="group-hover:scale-110 transition-transform" /> : <VolumeX size={24} />}
                
                {/* Tactical Ring */}
                <div className={cn(
                    "absolute -inset-1 rounded-[2.2rem] border opacity-0 group-hover:opacity-100 transition-opacity",
                    isPlaying ? "border-red-500/20 animate-ping" : "border-indigo-500/20"
                )} />
            </motion.button>
        </div>
    );
};

// CSS utility if not available
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
