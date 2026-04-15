/**
 * NEURAL_COUNCIL Arbitrator | v55 Premium Edition
 * 
 * Багатомодельна система арбітражу та синтезу знань.
 * Координує роботу провідних ШІ (Gemini, Llama, GPT, Claude, Sentinel).
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v55
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, MessageSquare, ShieldCheck, Users,
    Zap, Clock, Target, AlertTriangle,
    ArrowRight, ChevronRight, CheckCircle2,
    BarChart3, Plus, Search, Sparkles, Shield,
    Terminal, Activity, Cpu, Hexagon, Globe,
    Maximize2, Share2, Layers, ZapOff
} from 'lucide-react';
import { cn } from '../utils/cn';
import { api, apiClient } from '../services/api';
import { CouncilResult } from '../types';
import { HoloContainer } from './HoloContainer';
import { TacticalCard } from './TacticalCard';
import { CyberOrb } from './CyberOrb';

interface LLMCouncilPanelProps {
    isLockdown?: boolean;
}

export const LLMCouncilPanel: React.FC<LLMCouncilPanelProps> = ({ isLockdown }) => {
    const [query, setQuery] = useState('');
    const [isDeliberating, setIsDeliberating] = useState(false);
    const [phase, setPhase] = useState<'IDLE' | 'GENERATING' | 'REVIEWING' | 'SYNTHESIZING' | 'COMPLETED'>('IDLE');
    const [result, setResult] = useState<CouncilResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedModels, setSelectedModels] = useState<string[]>(['gemini', 'groq']);

    const availableModels = useMemo(() => [
        { id: 'gemini', name: 'GEMINI_2.0_ULTRA', icon: <Sparkles size={16} />, color: 'blue', desc: 'Мутимодальний геній' },
        { id: 'groq', name: 'LLAMA_3_70B_GROQ', icon: <Zap size={16} />, color: 'orange', desc: 'Ультра-швидка логіка' },
        { id: 'ops-sentinel-v45', name: 'OPS_SENTINEL_V55', icon: <Shield size={16} />, color: 'emerald', desc: 'Безпека та інфраструктура' },
        { id: 'gpt4', name: 'GPT_4O_PREMIUM', icon: <Brain size={16} />, color: 'purple', desc: 'Глибоке розуміння контексту' },
        { id: 'claude', name: 'CLAUDE_3.5_SONNET', icon: <Target size={16} />, color: 'rose', desc: 'Точність та стиль' },
    ], []);

    const toggleModel = useCallback((id: string) => {
        if (isDeliberating) return;
        setSelectedModels(prev =>
            prev.includes(id)
                ? prev.filter(m => m !== id)
                : [...prev, id]
        );
    }, [isDeliberating]);

    const handleQuery = async () => {
        if (!query.trim() || selectedModels.length === 0) return;

        setIsDeliberating(true);
        setError(null);
        setResult(null);

        try {
            setPhase('GENERATING');
            const data = await apiClient.post('/intelligence/council', { query, models: selectedModels }).then(res => res.data);

            setResult(data);
            setPhase('COMPLETED');
        } catch (err: any) {
            console.error("Council Deliberation Failed:", err);
            setError(err.message || "Помилка деліберації. Перевірте з'єднання з моделями.");
            setPhase('IDLE');
        } finally {
            setIsDeliberating(false);
        }
    };

    const handleStrategicAnalysis = async () => {
        setIsDeliberating(true);
        setError(null);
        setResult(null);
        setQuery("Strategic Autonomous Analysis_v56.2-TITAN_Initiated...");

        try {
            setPhase('GENERATING');
            const data = (await apiClient.post('/intelligence/council/strategy', {})).data;
            setResult(data);
            setPhase('COMPLETED');
            setQuery("");
        } catch (err: any) {
            console.error("Strategic Analysis Failed:", err);
            setError(err.message || "Стратегічна сесія провалена.");
            setPhase('IDLE');
        } finally {
            setIsDeliberating(false);
        }
    };

    return (
        <div className="flex flex-col gap-10 min-h-[900px] animate-in fade-in duration-800">

            {/* Neural Header v55 */}
            <div className="p-10 bg-slate-950/40 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

                <div className="flex items-center gap-10 relative z-10">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-all duration-1000 scale-125" />
                        <div className="relative p-8 bg-slate-900 border border-cyan-500/30 rounded-[40px] shadow-2xl panel-3d rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <Brain className="text-cyan-400 icon-3d-blue scale-125" size={48} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-5xl font-black text-white leading-none tracking-tighter mb-4 group-hover:scale-[1.02] transition-transform duration-500 font-display">
                            NEURAL<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">_COUNCIL</span>
                        </h2>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3 px-4 py-1.5 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest font-mono">ARBITRATOR_v56.2-TITAN_ACTIVE</span>
                            </div>
                            {result && (
                                <div className="flex items-center gap-8 pl-8 border-l border-white/10">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">КОЕФІЦІЄНТ_ДОВІРИ</span>
                                        <span className="text-2xl font-black text-emerald-400 font-mono">{(result.confidence * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">ЗАТРИМКА_СИНТЕЗУ</span>
                                        <span className="text-2xl font-black text-cyan-400 font-mono">{(result.metadata.deliberation_time_seconds || 0).toFixed(1)}s</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 relative z-10 w-full md:w-auto">
                    <motion.button
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStrategicAnalysis}
                        disabled={isDeliberating}
                        className="flex-1 md:flex-none px-10 py-5 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-4 disabled:opacity-30 panel-3d font-display"
                    >
                        <Target size={20} /> STRATEGIC_MODE
                    </motion.button>
                    <motion.button
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleQuery}
                        disabled={isDeliberating || !query.trim()}
                        className="flex-1 md:flex-none px-12 py-5 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-4 shadow-2xl shadow-cyan-500/20 active:scale-95 disabled:opacity-30 panel-3d font-display"
                    >
                        {isDeliberating ? <Activity size={20} className="animate-spin" /> : <Sparkles size={20} />}
                        ІНІЦІЮВАТИ_СЕСІЮ
                    </motion.button>
                </div>
            </div>

            {/* Main Operational Hub */}
            <div className="flex-1 grid grid-cols-12 gap-10">

                {/* Left: Configuration & Phases */}
                <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">

                    {/* Fleet Matrix */}
                    <TacticalCard variant="holographic" title="COUNCIL_FLEET_SELECTION" className="p-8 border-white/5 bg-slate-950/40">
                        <div className="flex flex-col gap-5">
                            {availableModels.map(m => {
                                const isSelected = selectedModels.includes(m.id);
                                return (
                                    <motion.button
                                        key={m.id}
                                        whileHover={!isDeliberating ? { x: 5 } : {}}
                                        onClick={() => toggleModel(m.id)}
                                        disabled={isDeliberating}
                                        className={cn(
                                            "group flex items-center justify-between p-5 rounded-[32px] border transition-all duration-700 relative overflow-hidden",
                                            isSelected
                                                ? 'bg-cyan-500/10 border-cyan-500/40 shadow-xl'
                                                : 'bg-slate-900/40 border-white/5 opacity-40 hover:opacity-80'
                                        )}
                                    >
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500",
                                                isSelected
                                                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-2xl shadow-cyan-500/30'
                                                    : 'bg-slate-900 border-white/5 text-slate-600'
                                            )}>
                                                {m.icon}
                                            </div>
                                            <div className="text-left">
                                                <div className={cn("text-[11px] font-black uppercase tracking-widest mb-1 transition-colors", isSelected ? 'text-white' : 'text-slate-500')}>
                                                    {m.name}
                                                </div>
                                                <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{m.desc}</div>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="flex items-center gap-3 px-3 py-1 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                                                <span className="text-[9px] font-black text-cyan-400 uppercase font-mono">ONLINE</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </TacticalCard>

                    {/* Input Directive */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-[48px] opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                        <TacticalCard variant="holographic" title="INPUT_DIRECTIVE" className="p-1 border-white/5 bg-slate-950/60 shadow-2xl overflow-hidden">
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Введіть параметри запиту для мульти-модельного синтезу знань..."
                                className="w-full h-64 bg-transparent p-10 font-mono text-base text-slate-200 focus:text-white outline-none transition-all resize-none placeholder:text-slate-800 selection:bg-cyan-500/30"
                                disabled={isDeliberating}
                            />
                        </TacticalCard>
                    </div>

                    {/* Progress Phases */}
                    <div className="space-y-6">
                        {[
                            { id: 'GENERATING', label: 'НЕЙРО_ГЕНЕРАЦІЯ', icon: MessageSquare, desc: 'Паралельний запит до обраного флоту' },
                            { id: 'REVIEWING', label: 'ПЕРЕХРЕСНИЙ_АРБІТРАЖ', icon: ShieldCheck, desc: 'Взаємний аудит результатів моделями' },
                            { id: 'SYNTHESIZING', label: 'ФІНАЛЬНИЙ_СИНТЕЗ', icon: Brain, desc: 'Формування консенсусної відповіді' }
                        ].map((s, idx) => {
                            const isActive = phase === s.id;
                            const isPast = ['REVIEWING', 'SYNTHESIZING', 'COMPLETED'].includes(phase) && idx === 0 ||
                                ['SYNTHESIZING', 'COMPLETED'].includes(phase) && idx === 1 ||
                                phase === 'COMPLETED' && idx === 2;

                            return (
                                <motion.div
                                    key={s.id}
                                    className={cn(
                                        "p-8 rounded-[36px] border transition-all duration-1000 backdrop-blur-3xl panel-3d relative overflow-hidden",
                                        isActive ? 'bg-cyan-500/10 border-cyan-500/40 shadow-2xl' :
                                            isPast ? 'bg-emerald-500/5 border-emerald-500/20' :
                                                'bg-slate-950/60 border-white/5 opacity-30 focus-within:opacity-100'
                                    )}
                                >
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className={cn(
                                            "w-16 h-16 rounded-[22px] flex items-center justify-center border transition-all duration-700 shadow-2xl",
                                            isActive ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/40 scale-110' :
                                                isPast ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' :
                                                    'bg-slate-900 border-white/5 text-slate-700'
                                        )}>
                                            <s.icon size={28} className={isActive ? 'animate-pulse' : ''} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={cn(
                                                    "text-[11px] font-black uppercase tracking-[0.3em]",
                                                    isActive ? 'text-cyan-400' : isPast ? 'text-emerald-400' : 'text-slate-600'
                                                )}>
                                                    {s.label}
                                                </span>
                                                {isPast && <CheckCircle2 size={18} className="text-emerald-500" />}
                                                {isActive && <div className="flex gap-1"><div className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce" /><div className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce delay-150" /><div className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce delay-300" /></div>}
                                            </div>
                                            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest leading-relaxed opacity-60">{s.desc}</p>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="h-1 bg-white/5 rounded-full mt-8 overflow-hidden border border-white/10 relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 10, ease: "linear" }}
                                                className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Synthesis Results Area */}
                <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">
                    <AnimatePresence mode="wait">
                        {!result && !isDeliberating && (
                            <motion.div
                                key="standby"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="flex-1 flex flex-col items-center justify-center p-20 border border-white/5 rounded-[64px] bg-slate-950/20 backdrop-blur-3xl panel-3d shadow-2xl relative overflow-hidden group min-h-[800px]"
                            >
                                <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500/10 blur-[120px] rounded-full scale-150 group-hover:bg-cyan-500/20 transition-all duration-1000" />
                                    <CyberOrb size={450} color="#06b6d4" />
                                </div>
                                <div className="mt-20 text-center relative z-10">
                                    <h4 className="text-4xl font-black text-slate-700 uppercase tracking-tighter mb-6 font-display group-hover:text-slate-500 transition-colors">Council Standby</h4>
                                    <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.5em] max-w-sm mx-auto leading-loose opacity-60">Очікування ініціалізації нейронного ланцюга арбітражу знань v55.</p>
                                </div>
                            </motion.div>
                        )}

                        {isDeliberating && (
                            <motion.div
                                key="deliberating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center bg-slate-950/40 rounded-[64px] border border-white/5 backdrop-blur-3xl panel-3d shadow-2xl relative min-h-[800px]"
                            >
                                <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03] pointer-events-none" />
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse" />
                                    <CyberOrb size={480} color="#06b6d4" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.div
                                            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                            transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity } }}
                                            className="absolute inset-0 border-2 border-dashed border-cyan-500/20 rounded-full"
                                        />
                                        <Brain className="w-32 h-32 text-cyan-400 animate-pulse icon-3d-blue drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]" />
                                    </div>
                                </div>
                                <div className="mt-24 text-center">
                                    <h4 className="text-5xl font-black text-cyan-400 tracking-tighter animate-pulse uppercase font-display mb-6">PROCESSING_CONSENSUS</h4>
                                    <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.5em] font-mono opacity-80">АНАЛІЗ ПАРАДИГМ ТА ФОРМУВАННЯ СИНТЕТИЧНОГО КОНСЕНСУСУ...</p>
                                </div>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="flex-1 flex flex-col gap-10"
                            >
                                {/* Master Verdict Panel */}
                                <TacticalCard variant="holographic" title="FINAL_COUNCIL_SYNTHESIS" className="p-1 border-white/10 bg-slate-950/80 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-cyan-600/10 blur-[150px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-1000" />
                                    <div className="p-12 md:p-16 relative z-10">
                                        <div className="flex items-center justify-between mb-12">
                                            <div className="flex items-center gap-6 text-cyan-400 font-black text-[11px] uppercase tracking-[0.4em] font-display">
                                                <Sparkles size={24} className="icon-3d-blue animate-pulse" />
                                                Result Consensus Verdict
                                            </div>
                                            <div className="flex gap-4">
                                                <button className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-cyan-400 transition-all border border-white/5 hover:border-cyan-500/30"><Maximize2 size={20} /></button>
                                                <button className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-cyan-400 transition-all border border-white/5 hover:border-cyan-500/30"><Share2 size={20} /></button>
                                            </div>
                                        </div>
                                        <div className="text-2xl md:text-3xl text-slate-100 leading-relaxed font-black tracking-tight hacker-terminal-text italic border-l-4 border-l-cyan-500 pl-10 py-4 shadow-inner bg-slate-900/40 rounded-r-[40px]">
                                            {result.final_answer}
                                        </div>
                                    </div>
                                </TacticalCard>

                                {/* Participants Hub */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <TacticalCard variant="holographic" title="CONTRIBUTING_NEURAL_NODES" className="p-10 border-white/5 bg-slate-950/40">
                                        <div className="flex items-center justify-between mb-12">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Node Distribution</span>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] font-black text-emerald-400 uppercase">SYNCED</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {result.contributing_models.map((model, idx) => (
                                                <div key={idx} className="p-6 rounded-[32px] bg-slate-900/60 border border-white/5 hover:border-cyan-500/40 transition-all duration-500 group">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                                            <span className="font-black text-xl text-cyan-400 font-mono">{model.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-white truncate uppercase tracking-tighter">{model}</span>
                                                            <span className="text-[9px] text-slate-600 font-mono uppercase">NODE_TRACE_{idx + 1}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(result.peer_review_summary?.average_scores?.[model] || 0.8) * 100}%` }}
                                                            className="h-full bg-gradient-to-r from-cyan-600 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                                            transition={{ duration: 1.5, delay: idx * 0.1 }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TacticalCard>

                                    <TacticalCard variant="holographic" title="DIVERGENT_ANALYSIS" className="p-10 border-white/5 bg-slate-950/40">
                                        <div className="flex items-center justify-between mb-12">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Divergent Paradigms</span>
                                            {result.dissenting_opinions.length > 0 && (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/30">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                                    <span className="text-[9px] font-black text-rose-400 uppercase">ACTIVE_CONFLICT</span>
                                                </div>
                                            )}
                                        </div>
                                        {result.dissenting_opinions.length > 0 ? (
                                            <div className="space-y-6">
                                                {result.dissenting_opinions.map((d, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="p-8 rounded-[36px] bg-rose-950/10 border border-rose-500/20 shadow-xl group hover:bg-rose-950/20 transition-all"
                                                    >
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30"><ZapOff size={14} /></div>
                                                                <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">{d.model}</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-600 font-mono tracking-widest">{(d.score * 100).toFixed(0)} CP</span>
                                                        </div>
                                                        <p className="text-[12px] text-slate-300 italic font-black leading-relaxed group-hover:text-white transition-colors border-l-2 border-rose-500/30 pl-6">"{d.text}"</p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-20 opacity-40 group hover:opacity-100 transition-opacity">
                                                <div className="w-24 h-24 rounded-full bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center mb-8 shadow-2xl">
                                                    <CheckCircle2 size={48} className="text-emerald-500/50 icon-3d-emerald" />
                                                </div>
                                                <h5 className="text-xl font-black text-slate-500 uppercase tracking-tighter mb-2">Absolute Consensus</h5>
                                                <p className="text-[9px] text-slate-600 font-mono uppercase tracking-[0.3em]">Відхилення парадигм не виявлено в поточному циклі</p>
                                            </div>
                                        )}
                                    </TacticalCard>
                                </div>

                                {/* Peer Review Matrix */}
                                <TacticalCard variant="holographic" title="PEER_REVIEW_METADATA" className="p-10 border-white/5 bg-slate-950/60 shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                                        {Object.entries(result.peer_review_summary?.by_model || {}).slice(0, 4).map(([model, reviews], idx) => (
                                            <div key={idx} className="space-y-6 group">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2 group-hover:text-cyan-400 transition-colors truncate w-full">{model}</span>
                                                        <div className="flex items-baseline gap-3">
                                                            <span className="text-4xl font-black text-white font-display">
                                                                {(result.peer_review_summary?.average_scores?.[model] || 0).toFixed(2)}
                                                            </span>
                                                            <span className="text-[10px] text-slate-600 font-black uppercase">Score</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(result.peer_review_summary?.average_scores?.[model] || 0) * 100}%` }}
                                                        transition={{ duration: 2, ease: "circOut" }}
                                                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TacticalCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed bottom-10 right-10 z-50 p-8 bg-rose-950/80 border border-rose-500/50 rounded-[40px] text-rose-400 backdrop-blur-3xl shadow-2xl flex items-center gap-10 max-w-2xl border-l-8 border-l-rose-500"
                    >
                        <div className="p-4 bg-rose-500/20 rounded-2xl">
                            <AlertTriangle size={32} className="shrink-0 animate-pulse" />
                        </div>
                        <div>
                            <div className="text-xl font-black text-white mb-2 uppercase tracking-tighter font-display">Neural Synthesis Failure</div>
                            <div className="text-sm opacity-80 font-mono tracking-wide">{error}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LLMCouncilPanel;
