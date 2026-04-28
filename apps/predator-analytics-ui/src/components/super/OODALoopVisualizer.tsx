import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Compass, Brain, Zap, ArrowRight, Shield, Target, Activity } from 'lucide-react';

interface OODAStep {
    id: 'observe' | 'orient' | 'decide' | 'act';
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    glow: string;
}

const steps: OODAStep[] = [
    {
        id: 'observe',
        label: 'OBSERVE',
        description: 'Спектральний аналіз вхідних потоків та OSINT-сигналів.',
        icon: Eye,
        color: 'text-blue-400',
        glow: 'shadow-blue-500/20'
    },
    {
        id: 'orient',
        label: 'ORIENT',
        description: 'Контекстуалізація даних у семантичному просторі GraphRAG.',
        icon: Compass,
        color: 'text-purple-400',
        glow: 'shadow-purple-500/20'
    },
    {
        id: 'decide',
        label: 'DECIDE',
        description: 'Мульти-модельний арбітраж та верифікація стратегій.',
        icon: Brain,
        color: 'text-amber-400',
        glow: 'shadow-amber-500/20'
    },
    {
        id: 'act',
        label: 'ACT',
        description: 'Автономне впровадження NAS та виконання транзакцій.',
        icon: Zap,
        color: 'text-emerald-400',
        glow: 'shadow-emerald-500/20'
    }
];

export const OODALoopVisualizer: React.FC<{ activeStep?: string }> = ({ activeStep = 'observe' }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStepIndex((prev) => (prev + 1) % steps.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const currentIndex = steps.findIndex(s => s.id === activeStep) !== -1
        ? steps.findIndex(s => s.id === activeStep)
        : currentStepIndex;

    return (
        <div className="relative p-8 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[40px] overflow-hidden group shadow-2xl h-full flex flex-col justify-between">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <Activity className="text-blue-400 animate-pulse" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">OODA LOOP v45</h3>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Цикл Когнітивного Аналізу</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">LIVE_DYNAMICS</span>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-4 gap-4 mb-10">
                {steps.map((step, idx) => {
                    const isActive = idx === currentIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="relative flex flex-col items-center">
                            {/* Connecting Line */}
                            {idx < steps.length - 1 && (
                                <div className="absolute left-[calc(50%+25px)] top-8 w-[calc(100%-50px)] h-px bg-white/5 z-0">
                                    {isActive && (
                                        <motion.div
                                            initial={{ left: '-100%' }}
                                            animate={{ left: '100%' }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                                        />
                                    )}
                                </div>
                            )}

                            <motion.div
                                animate={isActive ? {
                                    scale: [1, 1.1, 1],
                                    borderColor: ['rgba(255,255,255,0.1)', 'rgba(59,130,246,0.5)', 'rgba(255,255,255,0.1)']
                                } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 z-10 shadow-2xl ${
                                    isActive
                                        ? `bg-slate-900 border-white/20 ${step.glow}`
                                        : 'bg-black/40 border-white/5 opacity-40'
                                }`}
                            >
                                <Icon size={24} className={isActive ? step.color : 'text-slate-600'} />
                                {isActive && (
                                    <motion.div
                                        layoutId="stepGlow"
                                        className="absolute inset-0 bg-blue-500/10 blur-xl rounded-2xl"
                                    />
                                )}
                            </motion.div>
                            <span className={`mt-3 text-[9px] font-black tracking-widest uppercase transition-colors duration-500 ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={steps[currentIndex].id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-black/40 p-6 rounded-[24px] border border-white/5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${steps[currentIndex].color}`}>
                                ФАЗА: {steps[currentIndex].label}
                            </span>
                            <div className="flex gap-1">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className={`w-4 h-1 rounded-full ${i === currentIndex ? 'bg-blue-500' : 'bg-white/5'}`} />
                                ))}
                            </div>
                        </div>
                        <p className="text-slate-200 text-sm font-medium leading-relaxed">
                            {steps[currentIndex].description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black text-slate-400">
                                AI
                            </div>
                        ))}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">3 АГЕНТИ В СИНК� ОНІ</span>
                </div>
                <button className="flex items-center gap-2 group text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
                    Детальна телеметрія <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default OODALoopVisualizer;
