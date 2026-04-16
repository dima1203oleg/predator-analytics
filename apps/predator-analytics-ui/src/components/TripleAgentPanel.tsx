/**
 * Панель Trinity Nexus | v56.5-ELITE Trident Agent Controller
 * 
 * Синхронізоване керування трьома автономними агентами:
 * Governance (WinSURF), Synthesis (Gemini), Audit (Copilot).
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v56.5-ELITE
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, Play, CheckCircle2, XCircle,
    Loader2, Code, Brain, RefreshCcw, Clock, Shield,
    Zap, ZapOff, Activity, ShieldAlert, Cpu,
    ChevronRight, ArrowRight, Target, Share2, Maximize2,
    Lock, Unlock, Bot, Search, Boxes, Network
} from 'lucide-react';
import { api } from '../services/api';
import { HoloContainer } from './HoloContainer';
import { TacticalCard } from './TacticalCard';
import { CyberOrb } from './CyberOrb';
import { cn } from '../lib/utils';

interface Step {
    name: string;
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    details?: string;
    icon: React.ElementType;
    color: string;
}

interface TripleAgentPanelProps {
    isLockdown?: boolean;
}

export const TripleAgentPanel: React.FC<TripleAgentPanelProps> = ({ isLockdown }) => {
    const [command, setCommand] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [activeStep, setActiveStep] = useState<number>(-1);
    const [steps, setSteps] = useState<Step[]>([
        { id: 'gov', name: 'WinSURF Governance', status: 'pending', icon: Shield, color: 'emerald' },
        { id: 'plan', name: 'Gemini Strategic Engine', status: 'pending', icon: Brain, color: 'blue' },
        { id: 'gen', name: 'Mistral Vibe Synthesis', status: 'pending', icon: Code, color: 'purple' },
        { id: 'audit', name: 'Copilot Sentinel Audit', status: 'pending', icon: CheckCircle2, color: 'cyan' }
    ]);
    const [history, setHistory] = useState<any[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const fetchHistory = useCallback(async () => {
        try {
            const logs = await api.v45.trinity.getLogs(15);
            setHistory(logs);
        } catch (e) {
            console.error("Failed to fetch Trinity logs", e);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, [fetchHistory]);

    const handleProcess = async () => {
        if (!command.trim()) return;

        setIsProcessing(true);
        setResult(null);
        setActiveStep(0);
        setSteps(prev => prev.map(s => ({ ...s, status: 'pending', details: undefined })));

        try {
            // Step 0: WinSURF Governance
            setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'running' } : s));
            
            // Step 1: Gemini Strategic Engine
            setSteps(prev => prev.map((s, i) =>
                i === 0 ? { ...s, status: 'completed' } :
                    i === 1 ? { ...s, status: 'running' } : s
            ));
            setActiveStep(1);

            // Call Backend API
            const res = await api.v45.trinity.process(command);

            // Step 2 & 3: Mistral & Copilot (Synthesis & Audit)
            // Based on the real response, we mark these steps
            setSteps(prev => prev.map((s, i) =>
                i === 1 ? { ...s, status: 'completed' } :
                    i === 2 ? { ...s, status: 'running' } : s
            ));
            setActiveStep(2);

            setResult(res);

            const isSuccess = res.success !== false && !res.error;
            
            setSteps(prev => {
                const s = [...prev];
                
                // Finalize Synthesis (Step 2)
                s[2].status = isSuccess ? 'completed' : 'failed';
                
                // Handle optional Code/Audit Step (Step 3)
                if (res.code || res.audit_report) {
                    s[3].status = isSuccess ? 'completed' : 'failed';
                    setActiveStep(3);
                } else {
                    setActiveStep(isSuccess ? 4 : -1);
                }

                if (!isSuccess) {
                    const currentRunning = s.findIndex(step => step.status === 'running');
                    if (currentRunning !== -1) s[currentRunning].status = 'failed';
                }
                return s;
            });

        } catch (error) {
            console.error("Trident Chain Error:", error);
            setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'failed' } : s));
            setActiveStep(-1);
        } finally {
            setIsProcessing(false);
            fetchHistory();
        }
    };

    return (
        <div className="grid grid-cols-12 gap-10 min-h-[900px] animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* Left Column: Command & Orchestration */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">

                {/* Header Ribbon */}
                <div className="flex items-center justify-between p-8 bg-slate-950/60 border border-white/5 rounded-[40px] shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="p-5 bg-purple-600/20 rounded-3xl border border-purple-500/30 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)] icon-3d-purple">
                            <Terminal size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2 font-display">
                                Trident <span className="text-purple-500">Nexus</span> Controller
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20">
                                    <Bot size={14} className="text-purple-400" />
                                    <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">CHAIN_v56.5-ELITE</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full animate-pulse", isProcessing ? "bg-purple-500 shadow-[0_0_10px_#a855f7]" : "bg-emerald-500 shadow-[0_0_10px_#10b981]")} />
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] italic">
                                        {isProcessing ? "EXECUTION_IN_PROGRESS" : "SYSTEM_READY_FOR_DIRECTIVE"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <AnimatePresence>
                            {isLockdown && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex items-center gap-3 px-6 py-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                                >
                                    <ShieldAlert size={18} className="animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">LOCKDOWN_ACTIVE</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl">
                            <Cpu size={20} className="text-slate-500" />
                        </div>
                    </div>
                </div>

                {/* Command Input Area */}
                <TacticalCard variant="holographic" title="MISSION_DIRECTIVE_INPUT" className="p-1 border-white/5 overflow-hidden">
                    <div className="relative group p-10 bg-slate-950/40">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <textarea
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="Введіть стратегічне завдання для Trident Nexus (наприклад: 'Створити мікросервіс для обробки векторних ембеддінгів')..."
                            className="w-full h-44 bg-transparent font-mono text-base text-slate-200 placeholder:text-slate-700 outline-none resize-none transition-all scrollbar-hide"
                            disabled={isProcessing}
                        />
                        <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/5">
                            <div className="flex gap-4">
                                {['GOVERNANCE', 'PLANNING', 'SYNTHESIS'].map((label, i) => (
                                    <div key={label} className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-help">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : "bg-purple-500")} />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                                    </div>
                                ))}
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleProcess}
                                disabled={isProcessing || !command.trim()}
                                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-4 shadow-2xl shadow-purple-500/20 group active:scale-95 disabled:opacity-30 transition-all font-display"
                            >
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} className="group-hover:translate-x-1 transition-transform" fill="currentColor" />}
                                {isProcessing ? "EXECUTING_CHAIN" : "INITIALIZE_NEXUS"}
                            </motion.button>
                        </div>
                    </div>
                </TacticalCard>

                {/* Progress Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {steps.map((step, idx) => {
                        const colors = {
                            emerald: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 glow-emerald",
                            blue: "border-blue-500/30 text-blue-400 bg-blue-500/5 glow-blue",
                            purple: "border-purple-500/30 text-purple-400 bg-purple-500/5 glow-purple",
                            cyan: "border-cyan-500/30 text-cyan-400 bg-cyan-500/5 glow-cyan",
                            rose: "border-rose-500/30 text-rose-400 bg-rose-500/5 glow-rose"
                        };

                        const isActive = step.status === 'running';
                        const isCompleted = step.status === 'completed';
                        const isFailed = step.status === 'failed';

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={cn(
                                    "p-6 rounded-[32px] border transition-all duration-700 relative overflow-hidden group panel-3d",
                                    isActive ? colors[step.color as keyof typeof colors] :
                                        isCompleted ? "bg-slate-900/60 border-white/10 opacity-100" :
                                            isFailed ? "bg-rose-950/20 border-rose-500/40 text-rose-400" :
                                                "bg-slate-950/40 border-white/5 opacity-40 hover:opacity-60"
                                )}
                            >
                                <div className="absolute inset-0 bg-cyber-scanline opacity-[0.02] pointer-events-none" />
                                <div className="flex flex-col items-center text-center relative z-10">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[22px] flex items-center justify-center border transition-all duration-700 mb-5 relative",
                                        isActive ? "bg-slate-950 scale-110 shadow-2xl" : "bg-slate-900 border-white/5 shadow-xl"
                                    )}>
                                        {isActive && <div className="absolute inset-0 rounded-full bg-current opacity-10 animate-ping" />}
                                        <step.icon size={28} className={cn("transition-all", isActive ? "animate-pulse scale-110" : "")} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 leading-none">{step.name}</span>
                                    <div className="flex items-center gap-2">
                                        {isActive ? (
                                            <div className="px-3 py-0.5 bg-current/10 rounded-full text-[8px] font-black uppercase border border-current/20 animate-pulse">Running</div>
                                        ) : isCompleted ? (
                                            <div className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> <span className="text-[8px] font-black uppercase">Success</span></div>
                                        ) : isFailed ? (
                                            <div className="text-rose-500 flex items-center gap-1"><XCircle size={12} /> <span className="text-[8px] font-black uppercase">Failed</span></div>
                                        ) : (
                                            <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Standby</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Output Artifacts */}
                <AnimatePresence mode="wait">
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex flex-col gap-8"
                        >
                            {/* Strategy/Response Card */}
                            <TacticalCard variant="holographic" title="STRATEGIC_RESULT_SYNTHESIS" className="p-1 border-white/5 bg-slate-950/60 shadow-2xl">
                                <div className="p-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                                                <Brain size={24} />
                                            </div>
                                            <div>
                                                <div className="text-base font-black text-white uppercase tracking-tighter">Strategic Consensus Summary</div>
                                                <div className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Verified by Gemini & Mistral</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Maximize2 size={16} /></button>
                                            <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Share2 size={16} /></button>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-900/60 rounded-[32px] border border-white/5 text-sm md:text-base text-slate-200 leading-relaxed font-black tracking-tight italic border-l-4 border-l-blue-500 shadow-inner">
                                        {Array.isArray(result.plan) ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                                {result.plan.map((step: string, i: number) => (
                                                    <div key={i} className="flex gap-5 group items-start">
                                                        <span className="text-blue-500 font-mono font-black mt-1">[{String(i + 1).padStart(2, '0')}]</span>
                                                        <span className="text-slate-300 group-hover:text-white transition-colors text-xs font-mono uppercase tracking-wide leading-relaxed">{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            result.summary || result.answer || result.plan || "Результат згенеровано успішно."
                                        )}
                                    </div>

                                    {result.audit_report && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-8 bg-cyan-500/5 rounded-[32px] border border-cyan-500/20 relative group"
                                        >
                                            <div className="absolute top-4 right-8 text-[10px] font-black text-cyan-500/40 uppercase tracking-widest font-mono">AUDIT_PROTOCOL_v4</div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <Shield size={18} className="text-cyan-400" />
                                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest font-display">Sentinel Audit Verification</span>
                                            </div>
                                            <p className="text-[11px] text-cyan-200/80 font-mono leading-relaxed italic whitespace-pre-wrap">
                                                {result.audit_report}
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            </TacticalCard>

                            {/* Code Generator Block */}
                            {result.code && (
                                <TacticalCard variant="holographic" title="GENERATED_NEXUS_ARTIFACT" className="p-1 border-white/5 overflow-hidden">
                                    <div className="p-0 bg-black/40 flex flex-col font-mono text-sm group min-h-[400px]">
                                        <div className="bg-slate-950/80 px-8 py-4 border-b border-white/5 flex justify-between items-center group-hover:bg-slate-900/40 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                                    <Code size={14} />
                                                </div>
                                                <span className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase">generated_output_v56.5-ELITE.py</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-white/5 rounded-lg text-[9px] text-slate-500 font-mono">
                                                    <Activity size={10} /> 100%_SYNTHESIZED
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(result.code);
                                                    }}
                                                    className="px-4 py-1.5 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/40 text-purple-400 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all shadow-lg active:scale-95"
                                                >
                                                    Copy Artifact
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-10 overflow-y-auto text-purple-400/90 whitespace-pre scrollbar-hide max-h-[600px] leading-relaxed bg-[#020617] relative">
                                            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
                                            {result.code}
                                        </div>
                                    </div>
                                </TacticalCard>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State */}
                {!result && !isProcessing && (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[48px] bg-slate-950/20 group hover:bg-slate-950/40 transition-all duration-1000">
                        <div className="relative mb-12">
                            <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full scale-150 group-hover:bg-purple-500/20 transition-all duration-1000" />
                            <div className="relative p-10 bg-slate-900 border border-white/5 rounded-[40px] shadow-2xl group-hover:scale-105 transition-all">
                                <Terminal size={64} className="text-slate-800 group-hover:text-purple-500/40 transition-colors" />
                            </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-700 uppercase tracking-[0.4em] mb-4">Orchestration Standby</h4>
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] max-w-sm text-center leading-relaxed">
                            Trident Nexus чекає вашої директиви для ініціалізації ланцюга автономної розробки v56.5-ELITE.
                        </p>
                        <div className="mt-8 flex gap-3">
                            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-800 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />)}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: History & Neural Audit */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">

                {/* Real-time Audit Matrix */}
                <TacticalCard variant="holographic" title="NEURAL_AUDIT_MATRIX" className="flex-1 border-white/5 bg-slate-950/40 min-h-[850px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                    <div className="p-8 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <Clock size={20} className="text-slate-500" />
                                <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Historical Trace</span>
                            </div>
                            <button
                                onClick={fetchHistory}
                                className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white hover:bg-purple-600/20 transition-all"
                                title="Force Neural Sync"
                            >
                                <RefreshCcw size={16} className={cn(isProcessing ? "animate-spin" : "")} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-40 opacity-20">
                                    <Boxes size={48} />
                                    <p className="mt-4 text-[9px] font-black uppercase tracking-widest">No previous artifacts</p>
                                </div>
                            ) : (
                                history.map((log, i) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group p-6 rounded-[32px] bg-slate-900/40 border border-white/5 hover:border-purple-500/30 hover:bg-slate-900/80 transition-all duration-500 shadow-xl cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/0 group-hover:bg-purple-500/60 transition-all" />
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={cn(
                                                "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                                log.intent === 'ops_action' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                    log.intent === 'generate_code' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                                        "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                            )}>
                                                {log.intent?.replace('_', ' ')}
                                            </div>
                                            <span className="text-[9px] text-slate-600 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-mono line-clamp-2 mb-4 leading-relaxed group-hover:text-slate-100 transition-colors">
                                            {log.request_text}
                                        </p>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-1.5 h-1.5 rounded-full shadow-lg", log.status === 'verified' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-500 shadow-amber-500/50")} />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.status === 'verified' ? 'Verified' : 'Unsigned'}</span>
                                            </div>
                                            <span className="text-[9px] font-mono text-slate-600 group-hover:text-purple-400 transition-colors uppercase tracking-widest">{log.execution_time_ms}ms</span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 p-6 bg-purple-600/5 rounded-3xl border border-purple-500/10 flex items-center gap-4">
                            <Activity size={16} className="text-purple-400" />
                            <div>
                                <div className="text-[9px] font-black text-white uppercase tracking-widest">Global Synchronization</div>
                                <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1">Status: Cluster Health Optimal</div>
                            </div>
                        </div>
                    </div>
                </TacticalCard>
            </div>
        </div>
    );
};

export default TripleAgentPanel;
