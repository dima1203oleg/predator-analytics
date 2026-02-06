/**
 * PREDATOR AZR Improvement Trace
 * Візуалізація циклу самовдосконалення AI
 * Логування рішень, валідація та трасування логіки
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Brain, Shield, CheckCircle2, AlertTriangle,
  Terminal, Activity, Search, Filter, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface AZRDecision {
    id: string;
    target_component: string;
    action_type: string;
    logic_chain: string;
    risk_score: number;
    status: 'PENDING' | 'VERIFIED' | 'EXECUTED' | 'REJECTED';
    timestamp: string;
    performance_impact?: number;
}

export const AZRImprovementTrace: React.FC = () => {
    const [decisions, setDecisions] = useState<AZRDecision[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchDecisions = async () => {
        setLoading(true);
        try {
            // Using resilience-enabled API
            const res = await api.azr.getDecisions(20);
            if (Array.isArray(res)) {
                setDecisions(res);
                if (res.length > 0 && !selectedId) setSelectedId(res[0].id);
            }
        } catch (e) {
            console.error("Failed to fetch AZR decisions", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDecisions();
        const interval = setInterval(fetchDecisions, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleVerify = async (id: string) => {
        try {
            await api.azr.verifyDecision(id);
            // Local update for immediate feedback
            setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: 'VERIFIED' } : d));
        } catch (e) {
            alert(premiumLocales.evolution.trace.verificationError);
        }
    };

    const activeDecision = decisions.find(d => d.id === selectedId);

    const filteredDecisions = decisions.filter(d =>
        filter === 'ALL' ? true : d.status === filter
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
            {/* Sidebar List */}
            <div className="lg:col-span-4 flex flex-col bg-slate-900/40 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-3xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-3">
                        <Terminal size={18} className="text-amber-400" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">{premiumLocales.evolution.trace.logStream}</span>
                    </div>
                    <button
                        onClick={fetchDecisions}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        title="Оновити дані"
                        aria-label="Оновити дані"
                    >
                        <RefreshCw size={14} className={cn("text-slate-500", loading && "animate-spin")} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" ref={scrollRef}>
                    {loading && decisions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-20">
                            <RefreshCw size={32} className="animate-spin mb-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{premiumLocales.evolution.trace.scanning}</span>
                        </div>
                    ) : filteredDecisions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-20">
                            <Search size={32} className="mb-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{premiumLocales.evolution.trace.noSignals}</span>
                        </div>
                    ) : (
                        filteredDecisions.map((decision) => (
                            <motion.div
                                key={decision.id}
                                layoutId={decision.id}
                                onClick={() => setSelectedId(decision.id)}
                                className={cn(
                                    "p-4 rounded-2xl cursor-pointer border transition-all duration-300 relative overflow-hidden group",
                                    selectedId === decision.id
                                        ? "bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                                        : "bg-black/40 border-white/5 hover:border-white/20"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-[10px] font-black text-white uppercase tracking-tighter">
                                        {decision.action_type} // {decision.id.substring(0, 8)}
                                    </div>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                                        decision.status === 'EXECUTED' ? 'bg-emerald-500/10 text-emerald-400' :
                                        decision.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                                        'bg-amber-500/10 text-amber-400'
                                    )}>
                                        {decision.status}
                                    </div>
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono flex justify-between">
                                    <span>{new Date(decision.timestamp).toLocaleTimeString()}</span>
                                    <span className={cn(
                                        decision.risk_score > 70 ? 'text-rose-400' : 'text-slate-500'
                                    )}>RISK: {decision.risk_score}</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Inspection Panel */}
            <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-3xl flex flex-col">
                <AnimatePresence mode="wait">
                    {activeDecision ? (
                        <motion.div
                            key={activeDecision.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 p-8 flex flex-col"
                        >
                            <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/5">
                                <div className="p-5 bg-amber-500/10 rounded-3xl border border-amber-500/20 text-amber-500 shadow-2xl shadow-amber-500/10">
                                    <Brain size={32} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{activeDecision.action_type}</h3>
                                        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black text-amber-400 uppercase tracking-widest">
                                            {activeDecision.target_component}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono font-bold tracking-widest uppercase opacity-60">DECISION_TRACE_IDENTIFIER: {activeDecision.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Shield size={12} className="text-amber-500" />
                                        {premiumLocales.evolution.trace.cognitiveMonologue}
                                    </div>
                                    <p className="text-[13px] text-slate-300 leading-relaxed font-mono italic">
                                        "{activeDecision.logic_chain}"
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-between">
                                        <div>
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{premiumLocales.evolution.trace.potentialResponse}</div>
                                            <div className="text-sm font-black text-emerald-400 uppercase tracking-widest">{premiumLocales.evolution.trace.optimal}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{premiumLocales.evolution.trace.impact}</div>
                                            <div className="text-sm font-black text-white">+{activeDecision.performance_impact || 12}%</div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{premiumLocales.evolution.trace.confidenceScore}</span>
                                            <span className="text-[10px] font-black text-amber-400 font-mono">{(100 - activeDecision.risk_score)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${100 - activeDecision.risk_score}%` }}
                                                className={cn(
                                                    "h-full rounded-full",
                                                    (100 - activeDecision.risk_score) > 50 ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-amber-500 shadow-[0_0_10px_#f59e0b]"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-8 border-t border-white/5">
                                <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-2">
                                        <Activity size={14} className="text-emerald-500" />
                                        {premiumLocales.evolution.trace.safeExecution}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-blue-500" />
                                        {premiumLocales.evolution.trace.policyAlignment}
                                    </span>
                                </div>

                                {activeDecision.status === 'PENDING' && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleVerify(activeDecision.id)}
                                        className="px-10 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black rounded-[20px] uppercase tracking-widest text-[10px] shadow-2xl shadow-amber-600/20 border border-white/10"
                                    >
                                        {premiumLocales.evolution.trace.verifyDecision}
                                    </motion.button>
                                )}
                                {activeDecision.status === 'VERIFIED' && (
                                    <div className="px-10 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black rounded-[20px] uppercase tracking-widest text-[10px] flex items-center gap-3">
                                        <CheckCircle2 size={16} />
                                        {premiumLocales.evolution.trace.decisionApproved}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                            <Brain size={120} />
                            <h4 className="text-2xl font-black uppercase tracking-[0.4em] mt-8">Selecting_Sequence...</h4>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
