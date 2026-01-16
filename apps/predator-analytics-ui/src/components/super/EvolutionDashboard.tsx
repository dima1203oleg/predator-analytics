import React, { useState, useEffect } from 'react';
import {
    api,
    v25Client // Нам потрібен v25Client для нових ендпоінтів
} from '../../services/api';
import { TacticalCard } from '../TacticalCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    ShieldAlert,
    Activity,
    Brain,
    Flame,
    CheckCircle2,
    RefreshCcw,
    Database,
    Cpu
} from 'lucide-react';

const EvolutionDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [chaosStatus, setChaosStatus] = useState<any>({ chaos_mode: false });
    const [recentExperience, setRecentExperience] = useState<any[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    const fetchData = async () => {
        try {
            const [statsRes, experienceRes, chaosRes] = await Promise.all([
                v25Client.get('/evolution/stats'),
                v25Client.get('/evolution/experience?limit=10'),
                fetch('/api/v1/som/chaos/status').then(res => res.json()).catch(() => ({ chaos_mode: false }))
            ]);
            setStats(statsRes.data);
            setRecentExperience(experienceRes.data);
            setChaosStatus(chaosRes);
        } catch (e) {
            console.error("Evolution fetch failed", e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const triggerChaos = async () => {
        setIsThinking(true);
        try {
            await fetch('/api/v1/som/chaos/spike?duration=15', { method: 'POST' });
        } finally {
            setTimeout(() => setIsThinking(false), 2000);
        }
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
            {/* Header / Central Vision */}
            <div className="col-span-12 flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-tighter">
                        AI Evolution Subsystem
                    </h1>
                    <p className="text-white/40 text-xs font-mono">SOVEREIGN CORE V27.2 • DEEP LEARNING ACTIVE</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={triggerChaos}
                        disabled={isThinking}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                            chaosStatus?.chaos_mode ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/5 border-white/10 text-white/60 hover:border-red-500/50 hover:text-red-400'
                        }`}
                    >
                        <Flame className={`w-4 h-4 ${isThinking ? 'animate-bounce' : ''}`} />
                        <span className="text-xs font-bold uppercase tracking-widest">Chaos Test</span>
                    </button>
                    <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" />
                        <span className="text-[10px] font-mono text-blue-400 uppercase">Self-Healer Online</span>
                    </div>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="col-span-12 md:col-span-4 space-y-4">
                <TacticalCard title="Evolution Gain" icon={<Brain className="w-4 h-4 text-purple-400" />}>
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                <motion.circle
                                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                    strokeDasharray={364}
                                    initial={{ strokeDashoffset: 364 }}
                                    animate={{ strokeDashoffset: 364 - (364 * 0.72) }}
                                    className="text-purple-500"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white">72%</span>
                                <span className="text-[8px] text-white/40 uppercase">Intelligence</span>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                            <div className="text-center p-2 bg-white/5 rounded-xl">
                                <div className="text-xs text-white/40">Fixed Bugs</div>
                                <div className="text-xl font-bold text-green-400">142</div>
                            </div>
                            <div className="text-center p-2 bg-white/5 rounded-xl">
                                <div className="text-xs text-white/40">Optimizations</div>
                                <div className="text-xl font-bold text-blue-400">89</div>
                            </div>
                        </div>
                    </div>
                </TacticalCard>

                <TacticalCard title="Immunology" icon={<ShieldAlert className="w-4 h-4 text-green-400" />}>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-white/80">Circuit Breaker</span>
                            </div>
                            <span className="text-[10px] font-mono text-green-400 px-2 py-0.5 border border-green-400/30 rounded uppercase">Stable</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <RefreshCcw className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-white/80">Self-Healer</span>
                            </div>
                            <span className="text-[10px] font-mono text-blue-400 px-2 py-0.5 border border-blue-400/30 rounded uppercase">Watching</span>
                        </div>
                    </div>
                </TacticalCard>
            </div>

            {/* Real-Time Evolution Logs */}
            <div className="col-span-12 md:col-span-8 flex flex-col">
                <TacticalCard title="Deep Experience Ledger" icon={<Activity className="w-4 h-4 text-blue-400" />}>
                    <div className="h-[380px] overflow-y-auto pr-2 space-y-2 font-mono scrollbar-hide">
                        <AnimatePresence mode="popLayout">
                            {recentExperience.map((exp: any, i: number) => (
                                <motion.div
                                    key={exp.timestamp || i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 bg-white/5 border-l-2 border-blue-500/50 rounded-r-xl flex items-start gap-4"
                                >
                                    <div className="mt-1">
                                        {exp.event?.includes('ai') ? <Brain className="w-4 h-4 text-purple-400" /> : <Cpu className="w-4 h-4 text-blue-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] text-white/30 uppercase">{exp.event || 'SYSTEM_EVENT'}</span>
                                            <span className="text-[9px] text-blue-400">{new Date(exp.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-xs text-white/80 leading-relaxed uppercase">
                                            {exp.data?.message || exp.data?.description || JSON.stringify(exp.data)}
                                        </p>
                                        <div className="mt-2 flex gap-2">
                                            <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">EXPERIENCE GAINED</span>
                                            <span className="text-[8px] px-1.5 py-0.5 bg-white/10 text-white/40 rounded italic">v{exp.version}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {recentExperience.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-white/20 uppercase tracking-widest text-xs">
                                <Activity className="w-12 h-12 mb-4 animate-pulse" />
                                Waiting for Evolution Experience...
                            </div>
                        )}
                    </div>
                </TacticalCard>
            </div>
        </div>
    );
};

export default EvolutionDashboard;
