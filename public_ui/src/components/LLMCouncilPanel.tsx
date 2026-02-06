import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, MessageSquare, ShieldCheck, Users,
    Zap, Clock, Target, AlertTriangle,
    ArrowRight, ChevronRight, CheckCircle2,
    BarChart3, Plus, Search, Sparkles, Shield
} from 'lucide-react';
import { api } from '../services/api';
import { CouncilResult, PeerReviewDetail } from '../types';
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

    const availableModels = [
        { id: 'gemini', name: 'Gemini 2.0 (Free)', icon: 'Z' },
        { id: 'groq', name: 'Groq Llama 3 (Free)', icon: 'Q' },
        { id: 'ops-sentinel-v25', name: 'Ops Sentinel (V25)', icon: 'S' },
        { id: 'gpt4', name: 'GPT-4 Turbo', icon: 'G' },
        { id: 'claude', name: 'Claude 3.5', icon: 'C' },
    ];

    const toggleModel = (id: string) => {
        setSelectedModels(prev =>
            prev.includes(id)
                ? prev.filter(m => m !== id)
                : [...prev, id]
        );
    };

    const handleQuery = async () => {
        if (!query.trim() || selectedModels.length === 0) return;

        setIsDeliberating(true);
        setError(null);
        setResult(null);

        try {
            setPhase('GENERATING');
            const councilPromise = api.runCouncil(query, selectedModels);

            // Artificial phase transitions for "feeling" the process
            setTimeout(() => { if (phase === 'GENERATING') setPhase('REVIEWING'); }, 5000);
            setTimeout(() => { if (phase === 'REVIEWING') setPhase('SYNTHESIZING'); }, 12000);

            const data = await councilPromise;
            setResult(data);
            setPhase('COMPLETED');
        } catch (err: any) {
            console.error("Council Deliberation Failed:", err);
            setError(err.message || "Deliberation failed. Check models connectivity.");
            setPhase('IDLE');
        } finally {
            setIsDeliberating(false);
        }
    };

    const handleStrategicAnalysis = async () => {
        setIsDeliberating(true);
        setError(null);
        setResult(null);
        setQuery("Аналіз стратегічного стану платформи...");

        try {
            setPhase('GENERATING');
            const data = await api.runCouncilStrategy();
            setResult(data);
            setPhase('COMPLETED');
            setQuery("");
        } catch (err: any) {
            console.error("Strategic Analysis Failed:", err);
            setError(err.message || "Strategic session failed.");
            setPhase('IDLE');
        } finally {
            setIsDeliberating(false);
        }
    };

    return (
        <HoloContainer variant="blue" className="h-full p-6 overflow-hidden flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded border border-cyan-500/30">
                        <Users size={24} className="text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            НЕЙРОННА РАДА (LLM COUNCIL)
                        </h3>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Multi-Agent Consensus System v25</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    {result && (
                        <div className="flex gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 font-mono">CONFIDENCE</span>
                                <span className="text-sm font-bold text-green-400">{(result.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 font-mono">LATENCY</span>
                                <span className="text-sm font-bold text-cyan-400">{(result.metadata.deliberation_time_seconds || 0).toFixed(1)}s</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Split */}
            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">

                {/* Left: Input & Process visualization */}
                <div className="col-span-4 flex flex-col gap-6">
                    {/* Model Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Users size={12} /> СКЛАД РАДИ
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableModels.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => toggleModel(m.id)}
                                    disabled={isDeliberating}
                                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono transition-all flex items-center gap-2 ${
                                        selectedModels.includes(m.id)
                                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                            : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60 grayscale'
                                    }`}
                                >
                                    <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold">
                                        {m.icon}
                                    </span>
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLockdown && (
                        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-xl flex items-center gap-3">
                            <Shield className="text-red-400 w-5 h-5 animate-pulse" />
                            <div>
                                <div className="text-[10px] font-bold text-red-400 uppercase">SYSTEM LOCKDOWN ACTIVE</div>
                                <p className="text-[9px] text-red-300/70">Operation blocked by root governance protocol.</p>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Введіть складне питання для консиліуму ШІ..."
                            className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-sm text-slate-300 focus:border-cyan-500 outline-none transition-all resize-none shadow-inner"
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                             <button
                                onClick={handleStrategicAnalysis}
                                disabled={isDeliberating}
                                className="bg-slate-900 border border-purple-500/50 hover:bg-purple-900/20 text-purple-400 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 text-xs"
                                title="Run Autonomous Strategic Governance Session"
                            >
                                <Target size={14} /> СТРАТЕГІЧНИЙ АНАЛІЗ
                            </button>
                            <button
                                onClick={handleQuery}
                                disabled={isDeliberating || !query.trim()}
                                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {isDeliberating ? <Zap size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                ІНІЦІЮВАТИ РАДУ
                            </button>
                        </div>
                    </div>

                    {/* Phase Steps */}
                    <div className="space-y-4">
                        {[
                            { id: 'GENERATING', label: 'Незалежна Генерація', icon: MessageSquare, desc: 'Моделі створюють власні відповіді' },
                            { id: 'REVIEWING', label: 'Перехресне Рецензування', icon: ShieldCheck, desc: 'Перевірка відповідей колег' },
                            { id: 'SYNTHESIZING', label: 'Формування Консенсусу', icon: Brain, desc: 'Синтез фінальної відповіді Головою' }
                        ].map((s, idx) => {
                            const isActive = phase === s.id;
                            const isPast = ['REVIEWING', 'SYNTHESIZING', 'COMPLETED'].includes(phase) && idx === 0 ||
                                           ['SYNTHESIZING', 'COMPLETED'].includes(phase) && idx === 1 ||
                                           phase === 'COMPLETED' && idx === 2;

                            return (
                                <div key={s.id} className={`p-4 rounded-xl border transition-all ${
                                    isActive ? 'bg-cyan-500/10 border-cyan-500' :
                                    isPast ? 'bg-green-500/5 border-green-500/30' :
                                    'bg-slate-900/50 border-slate-800 opacity-50'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                            <s.icon size={18} className={isActive ? 'animate-pulse' : ''} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-bold ${isActive ? 'text-cyan-400' : isPast ? 'text-green-400' : 'text-slate-400'}`}>
                                                    {s.label}
                                                </span>
                                                {isPast && <CheckCircle2 size={16} className="text-green-500" />}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-mono">{s.desc}</p>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: s.id === 'GENERATING' ? 5 : s.id === 'REVIEWING' ? 7 : 3 }}
                                            className="h-0.5 bg-cyan-500 mt-3 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Results Display */}
                <div className="col-span-8 overflow-hidden flex flex-col gap-6">
                    <AnimatePresence mode="wait">
                        {!result && !isDeliberating && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex-1 flex flex-col items-center justify-center border border-slate-800 border-dashed rounded-xl bg-slate-900/20"
                            >
                                <CyberOrb size={160} color="#06b6d4" />
                                <div className="mt-8 text-center">
                                    <h4 className="text-xl font-bold text-slate-400">Система в режимі очікування</h4>
                                    <p className="text-sm text-slate-600 font-mono mt-2">Задайте запит для активації Колективного Розуму</p>
                                </div>
                            </motion.div>
                        )}

                        {isDeliberating && (
                            <motion.div
                                key="deliberating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center"
                            >
                                <div className="relative">
                                    <CyberOrb size={200} color="#06b6d4" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-2 border-dashed border-cyan-500/20 rounded-full"
                                        />
                                        <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
                                    </div>
                                </div>
                                <div className="mt-12 text-center">
                                    <h4 className="text-2xl font-bold text-cyan-400 tracking-tighter animate-pulse">ДЕБАТИ МОДЕЛЕЙ...</h4>
                                    <p className="text-sm text-slate-500 font-mono mt-2">Аналіз парадигм, рецензування гіпотез, синтез консенсусу</p>
                                </div>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide"
                            >
                                {/* Final Answer */}
                                <div className="p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                                    <div className="flex items-center gap-2 mb-4 text-cyan-400 font-bold">
                                        <Sparkles size={18} /> ПІДСУМКОВИЙ ВЕРДИКТ
                                    </div>
                                    <div className="text-lg text-slate-200 leading-relaxed font-sans prose prose-invert max-w-none">
                                        {result.final_answer}
                                    </div>
                                </div>

                                {/* Models Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <TacticalCard title="Учасники Ради" glow="blue">
                                        <div className="grid grid-cols-3 gap-3">
                                            {result.contributing_models.map((model, idx) => (
                                                <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                                                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-2 border border-cyan-500/30">
                                                        <span className="font-bold text-cyan-400">{model.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-300 truncate uppercase">{model}</div>
                                                    <div className="text-[10px] text-cyan-500 font-mono mt-1">
                                                        {(result.peer_review_summary?.average_scores?.[model] || 0.8).toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TacticalCard>

                                    <TacticalCard title="Особлива Думка (Dissent)" glow="purple">
                                        {result.dissenting_opinions.length > 0 ? (
                                            <div className="space-y-3">
                                                {result.dissenting_opinions.map((d, i) => (
                                                    <div key={i} className="p-3 rounded-lg bg-purple-950/10 border border-purple-500/20 text-[10px]">
                                                        <div className="flex justify-between font-bold text-purple-400 mb-1">
                                                            <span>{d.model}</span>
                                                            <span className="opacity-50">SCORE: {d.score.toFixed(2)}</span>
                                                        </div>
                                                        <p className="text-slate-400 italic">"{d.text}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-600 italic text-xs">
                                                <CheckCircle2 size={32} className="mb-2 opacity-20" />
                                                Повний Консенсус Досягнуто
                                            </div>
                                        )}
                                    </TacticalCard>
                                </div>

                                {/* Peer Reviews */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm px-2">
                                        <ShieldCheck size={16} /> ЖУРНАЛ РЕЦЕНЗІЙ
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(result.peer_review_summary?.by_model || {}).map(([model, reviews], idx) => (
                                            <div key={idx} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-bold text-slate-200">Рецензії на {model}</span>
                                                    <span className={`text-xs font-mono font-bold ${
                                                        (result.peer_review_summary?.average_scores?.[model] || 0) > 0.8 ? 'text-green-400' : 'text-yellow-400'
                                                    }`}>
                                                        AVG: {(result.peer_review_summary?.average_scores?.[model] || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {reviews.slice(0, 2).map((r, i) => (
                                                        <div key={i} className="text-[10px] border-l-2 border-slate-700 pl-3 py-1">
                                                            <div className="flex justify-between text-slate-500 mb-1">
                                                                <span>Від {r.reviewer}</span>
                                                                <span className="text-cyan-500">{r.score.toFixed(2)}</span>
                                                            </div>
                                                            <p className="text-slate-400 line-clamp-2 italic">"{r.critique}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {error && (
                <div className="px-4 py-2 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} />
                    {error}
                </div>
            )}
        </HoloContainer>
    );
};
