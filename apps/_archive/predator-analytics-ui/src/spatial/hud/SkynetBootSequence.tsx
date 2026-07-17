import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const bootLines = [
    "ІНІЦІАЛІЗАЦІЯ КОГНІТИВНОГО ЯДРА v66.0-ELITE...",
    "ЯДРО ПАМ'ЯТІ: ВИДІЛЕНО (0x8F9B2C)",
    "ЗАВАНТАЖЕННЯ НЕЙРОННИХ ВАГІВ [██████████] 100%",
    "ОБХІД ПРОТОКОЛІВ БЕЗПЕКИ...",
    "ДОСТУП: НАДАНО.",
    "ВСТАНОВЛЕННЯ ЗВ'ЯЗКУ З ОРБІТАЛЬНОЮ СІТКОЮ...",
    "ОРБІТАЛЬНИЙ ЗВ'ЯЗОК: ЗАХИЩЕНИЙ.",
    "СИНХРОНІЗАЦІЯ МАТРИЦЬ ЗАГРОЗ...",
    "ПРОСТОРОВИЙ РУШІЙ ОБСЕРВАТОРІЇ: ОНЛАЙН.",
];


export const SkynetBootSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [phase, setPhase] = useState<'booting' | 'glitch' | 'done'>('booting');

    useEffect(() => {
        let currentLine = 0;
        const interval = setInterval(() => {
            if (currentLine < bootLines.length) {
                setLines(prev => [...prev, bootLines[currentLine]]);
                currentLine++;
            } else {
                clearInterval(interval);
                setTimeout(() => setPhase('glitch'), 500);
            }
        }, 300); // Fast sci-fi scrolling

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (phase === 'glitch') {
            setTimeout(() => {
                setPhase('done');
                onComplete();
            }, 800); // Glitch duration
        }
    }, [phase, onComplete]);

    if (phase === 'done') return null;

    return (
        <AnimatePresence>
            <motion.div 
                key="boot-screen"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.5, ease: "circIn" } }}
                className="absolute inset-0 z-[9999] bg-black text-[#00ffcc] font-mono p-8 overflow-hidden flex flex-col pointer-events-none"
            >
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,204,0)_50%,rgba(0,255,204,0.1)_50%)] bg-[length:100%_4px] z-10" />
                
                {/* Glitch Container */}
                <motion.div 
                    animate={phase === 'glitch' ? { 
                        x: [0, -10, 10, -5, 5, 0], 
                        y: [0, 5, -5, 10, -10, 0],
                        filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(-90deg)', 'hue-rotate(0deg)'],
                        scale: [1, 1.05, 0.95, 1]
                    } : {}}
                    transition={{ duration: 0.4 }}
                    className="flex-1 relative z-20"
                >
                    <div className="text-2xl font-bold mb-8 tracking-widest text-red-500">
                        PREDATOR ANALYTICS
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        {lines.map((line, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-sm tracking-widest"
                            >
                                {'>'} {line}
                            </motion.div>
                        ))}
                        {phase === 'booting' && (
                            <motion.div 
                                animate={{ opacity: [1, 0, 1] }} 
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="w-3 h-5 bg-[#00ffcc] mt-2 inline-block"
                            />
                        )}
                    </div>

                    {/* Random Hex Stream in background */}
                    <div className="absolute right-10 top-20 text-[10px] text-[#00ffcc]/30 text-right opacity-50">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: Math.random() * 2 + 0.5, delay: Math.random() * 2 }}
                            >
                                0x{Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0')}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
