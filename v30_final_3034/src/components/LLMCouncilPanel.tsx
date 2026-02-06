import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, MessageSquare, ShieldCheck, Users,
    Zap, Clock, Target, AlertTriangle,
    ArrowRight, ChevronRight, CheckCircle2,
    BarChart3, Plus, Search, Sparkles, Shield,
    Terminal, Activity
} from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../services/api';
import { CouncilResult, PeerReviewDetail } from '../types';
import { HoloContainer } from './HoloContainer';
import { TacticalCard } from './TacticalCard';
import { CyberOrb } from './CyberOrb';
import '../styles/LLMCouncilPanel.css';

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
        { id: 'gemini', name: 'GEMINI_2.0_ULTRA', icon: <Sparkles size={14} />, gradient: 'from-blue-500 to-indigo-600' },
        { id: 'groq', name: 'LLAMA_3_70B_GROQ', icon: <Zap size={14} />, gradient: 'from-orange-500 to-red-600' },
        { id: 'ops-sentinel-v25', name: 'OPS_SENTINEL_V25', icon: <Shield size={14} />, gradient: 'from-emerald-500 to-teal-600' },
        { id: 'gpt4', name: 'GPT_4O_PREMIUM', icon: <Brain size={14} />, gradient: 'from-purple-500 to-pink-600' },
        { id: 'claude', name: 'CLAUDE_3.5_SONNET', icon: <Target size={14} />, gradient: 'from-rose-500 to-orange-600' },
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
        setQuery("Strategic Autonomous Analysis_v25.8_Initiated...");

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
        <div className="h-full flex flex-col gap-10">
            {/* Header Section v25 */}
            <div className="flex items-center justify-between p-10 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[40px] shadow-2xl panel-3d">
                <div className="flex items-center gap-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 blur-2xl rounded-full opacity-30 group-hover:opacity-50 transition-all duration-700" />
                        <div className="relative p-6 bg-black/40 rounded-3xl border border-cyan-500/30 backdrop-blur-2xl shadow-2xl panel-3d">
                            <Brain className="text-cyan-400 icon-3d-blue" size={40} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white leading-none tracking-tighter mb-2 group-hover:scale-[1.01] transition-transform duration-500">
                            NEURAL_<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">COUNCIL</span>
                        </h2>
                        <div className="flex items-center gap-4">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-cyan-500 dynamic-color-pulse" />
                                Multi-Model Arbitration_v25_Active
                            </p>
                            {result && (
                                <div className="flex items-center gap-6 pl-6 border-l border-white/10">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">CONFIDENCE_INDEX</span>
                                        <span className="text-lg font-black text-emerald-400 font-mono">{(result.confidence * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">ARB_LATENCY</span>
                                        <span className="text-lg font-black text-cyan-400 font-mono">{(result.metadata.deliberation_time_seconds || 0).toFixed(1)}s</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleStrategicAnalysis}
                        disabled={isDeliberating}
                        className="px-8 py-4 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 disabled:opacity-30 panel-3d"
                    >
                        <Target size={16} /> STRATEGIC_MODE
                    </button>
                    <button
                        onClick={handleQuery}
                        disabled={isDeliberating || !query.trim()}
                        className="px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-4 shadow-xl shadow-cyan-500/20 active:scale-95 disabled:opacity-30 panel-3d"
                    >
                        {isDeliberating ? <Activity size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        INITIATE_SESSION
                    </button>
                </div>
            </div>

            {/* Main Interactive Deck */}
            <div className="flex-1 grid grid-cols-12 gap-10">
                {/* Left Controls & Status */}
                <div className="col-span-4 space-y-10">
                    {/* Model Fleet Selection */}
                    <div className="p-8 bg-black/40 border border-white/5 rounded-[40px] backdrop-blur-3xl shadow-2xl panel-3d">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Users size={14} className="text-cyan-500" /> COUNCIL_FLEET
                            </h3>
                            <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[9px] font-black text-cyan-400 font-mono">
                                {selectedModels.length}/{availableModels.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {availableModels.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => toggleModel(m.id)}
                                    disabled={isDeliberating}
                                    className={cn(
                                        "group flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 overflow-hidden relative",
                                        selectedModels.includes(m.id)
                                            ? 'bg-cyan-500/5 border-cyan-500/30'
                                            : 'bg-black/40 border-white/5 opacity-50 hover:opacity-100'
                                    )}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500",
                                            selectedModels.includes(m.id)
                                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/20'
                                                : 'bg-slate-900 border-white/5 text-slate-500'
                                        )}>
                                            {m.icon}
                                        </div>
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", selectedModels.includes(m.id) ? 'text-white' : 'text-slate-500')}>
                                            {m.name}
                                        </span>
                                    </div>
                                    {selectedModels.includes(m.id) && (
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 dynamic-color-pulse relative z-10" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Operational Feed / Input */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="INPUT_DIRECTIVE_FOR_NEURAL_SYNTHESIS..."
                            className="w-full h-64 bg-black/40 border border-white/5 rounded-[40px] p-8 font-mono text-sm text-slate-300 focus:border-cyan-500/50 outline-none transition-all resize-none shadow-2xl backdrop-blur-3xl panel-3d placeholder:text-slate-700"
                        />
                    </div>

                    {/* Evolution Phase visualization */}
                    <div className="space-y-4">
                        {[
                            { id: 'GENERATING', label: 'NEURAL_GENERATION', icon: MessageSquare, desc: 'Parallel model generation active' },
                            { id: 'REVIEWING', label: 'PEER_ARBITRATION', icon: ShieldCheck, desc: 'Cross-model validation protocol' },
                            { id: 'SYNTHESIZING', label: 'CORE_SYNTHESIS', icon: Brain, desc: 'Consensus engine finalization' }
                        ].map((s, idx) => {
                            const isActive = phase === s.id;
                            const isPast = ['REVIEWING', 'SYNTHESIZING', 'COMPLETED'].includes(phase) && idx === 0 ||
                                           ['SYNTHESIZING', 'COMPLETED'].includes(phase) && idx === 1 ||
                                           phase === 'COMPLETED' && idx === 2;

                            return (
                                <motion.div
                                    key={s.id}
                                    className={cn(
                                        "p-6 rounded-3xl border transition-all duration-700 backdrop-blur-2xl panel-3d",
                                        isActive ? 'bg-cyan-500/10 border-cyan-500/40 shadow-xl shadow-cyan-500/10' :
                                        isPast ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        'bg-black/40 border-white/5 opacity-40'
                                    )}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500",
                                            isActive ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30' :
                                            isPast ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 border-white/5 text-slate-600'
                                        )}>
                                            <s.icon size={20} className={isActive ? 'animate-pulse' : ''} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-[0.2em]",
                                                    isActive ? 'text-cyan-400' : isPast ? 'text-emerald-400' : 'text-slate-500'
                                                )}>
                                                    {s.label}
                                                </span>
                                                {isPast && <CheckCircle2 size={14} className="text-emerald-500" />}
                                            </div>
                                            <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">{s.desc}</p>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="h-1 bg-white/5 rounded-full mt-5 overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: s.id === 'GENERATING' ? 5 : s.id === 'REVIEWING' ? 7 : 3, ease: "linear" }}
                                                className="h-full bg-cyan-500 shadow-lg shadow-cyan-500/50"
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Results / Simulation Area */}
                <div className="col-span-8 flex flex-col gap-10 min-h-[800px]">
                    <AnimatePresence mode="wait">
                        {!result && !isDeliberating && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="flex-1 flex flex-col items-center justify-center border border-white/5 rounded-[40px] bg-black/20 backdrop-blur-3xl panel-3d shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute inset-0 neural-mesh opacity-10" />
                                <CyberOrb size={280} color="#06b6d4" />
                                <div className="mt-12 text-center relative z-10">
                                    <h4 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">COUNCIL_STANDBY</h4>
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] mt-4">Waiting for mission pulse parameters...</p>
                                </div>
                            </motion.div>
                        )}

                        {isDeliberating && (
                            <motion.div
                                key="deliberating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-[40px] border border-white/5 backdrop-blur-3xl panel-3d shadow-2xl relative"
                            >
                                <div className="absolute inset-0 scanline opacity-5" />
                                <div className="relative">
                                    <CyberOrb size={320} color="#06b6d4" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-2 border-dashed border-cyan-500/10 rounded-full"
                                        />
                                        <Brain className="w-20 h-20 text-cyan-400 animate-pulse icon-3d-blue" />
                                    </div>
                                </div>
                                <div className="mt-16 text-center">
                                    <h4 className="text-3xl font-black text-cyan-400 tracking-tighter animate-pulse uppercase">PROCESSING_CONSENSUS</h4>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-4">Analyzing paradigm divergence & synthesizing core response</p>
                                </div>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 space-y-10"
                            >
                                {/* Final Answer - Large Premium Panel */}
                                <div className="p-12 rounded-[48px] bg-cyan-950/20 border border-cyan-500/20 backdrop-blur-3xl shadow-2xl panel-3d relative overflow-hidden">
                                     <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full" />
                                    <div className="flex items-center gap-4 mb-8 text-cyan-400 font-black text-[10px] uppercase tracking-[0.4em]">
                                        <Sparkles size={20} className="icon-3d-blue" /> FINAL_COUNCIL_VERDICT
                                    </div>
                                    <div className="text-2xl text-slate-200 leading-relaxed font-black tracking-tight hacker-terminal-text italic">
                                        {result.final_answer}
                                    </div>
                                </div>

                                {/* Participants & Dissent Grid */}
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="p-10 bg-black/40 border border-white/5 rounded-[40px] shadow-22xl panel-3d">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center justify-between">
                                            <span>CONTRIBUTING_NODES</span>
                                            <span className="text-cyan-500">CONVERGED</span>
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            {result.contributing_models.map((model, idx) => (
                                                <div key={idx} className="p-6 rounded-3xl bg-black/40 border border-white/5 hover:border-cyan-500/30 transition-all duration-500">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                                            <span className="font-black text-lg text-cyan-400 font-mono">{model.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{model}</span>
                                                            <span className="text-[9px] text-slate-500 font-mono uppercase">NODE_{idx + 1}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(result.peer_review_summary?.average_scores?.[model] || 0.8) * 100}%` }}
                                                            className="h-full bg-cyan-500 shadow-lg"
                                                            transition={{ duration: 1, delay: idx * 0.1 }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-10 bg-black/40 border border-white/5 rounded-[40px] shadow-22xl panel-3d">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center justify-between">
                                            <span>DISSENTING_OPINIONS</span>
                                            <span className="text-rose-500 font-black">ACTIVE_THREADS</span>
                                        </h3>
                                        {result.dissenting_opinions.length > 0 ? (
                                            <div className="space-y-4">
                                                {result.dissenting_opinions.map((d, i) => (
                                                    <div key={i} className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 shadow-lg">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{d.model}</span>
                                                            <span className="text-[9px] font-black text-slate-500 font-mono">{(d.score * 100).toFixed(0)} CP</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-300 italic font-black leading-relaxed">"{d.text}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-20">
                                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
                                                   <CheckCircle2 size={32} className="text-emerald-500 icon-3d-emerald" />
                                                </div>
                                                <h5 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">ABSOLUTE_CONSENSUS</h5>
                                                <p className="text-[9px] text-slate-600 font-mono mt-2 lowercase">no divergent paradigms detected in current cycle</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Performance Analytics Summary */}
                                <div className="p-10 bg-black/40 border border-white/5 rounded-[40px] shadow-2xl panel-3d">
                                    <div className="flex items-center gap-4 mb-8">
                                        <Terminal size={20} className="text-slate-500" />
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">PEER_REVIEW_METRICS</h3>
                                    </div>
                                    <div className="grid grid-cols-4 gap-6">
                                        {Object.entries(result.peer_review_summary?.by_model || {}).slice(0, 4).map(([model, reviews], idx) => (
                                            <div key={idx} className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter truncate w-32">{model}</span>
                                                        <span className="text-xl font-black text-white font-mono">
                                                            {(result.peer_review_summary?.average_scores?.[model] || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                     <motion.div
                                                         initial={{ width: 0 }}
                                                         animate={{ width: `${(result.peer_review_summary?.average_scores?.[model] || 0) * 100}%` }}
                                                         transition={{ duration: 1, ease: "easeOut" }}
                                                         className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                                     />
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
                <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-6 shadow-xl animate-pulse">
                    <AlertTriangle size={24} className="shrink-0" />
                    <div>
                        <div className="text-white mb-1">SYSTEM_DELIBERATION_FAULT</div>
                        <div className="opacity-70">{error}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LLMCouncilPanel;
