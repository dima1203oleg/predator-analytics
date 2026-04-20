
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, CheckCircle2, X, Binary, Cpu, Zap, Activity, ShieldCheck, Database, ArrowRight, BrainCircuit } from 'lucide-react';
import { TacticalCard } from '../TacticalCard';
import { SqlTrainingPair } from '../../types';
import { cn } from '../../utils/cn';

interface CalibrationViewProps {
    trainingPairs: SqlTrainingPair[];
    onVerifySql: (id: string, isCorrect: boolean) => void;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({ trainingPairs, onVerifySql }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
            {/* Core RLHF Control Section */}
            <div className="lg:col-span-2 space-y-8">
                <TacticalCard variant="holographic" title="TEXT-TO-SQL RLHF CALIBRATION v58.2-WRAITH" className="panel-3d group">
                    <div className="space-y-8">
                        {/* Model Status Module */}
                        <div className="relative p-8 bg-slate-900/60 border border-white/5 rounded-[40px] overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[24px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/5">
                                        <BrainCircuit size={32} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-2">
                                            <Activity size={10} className="text-blue-400" />
                                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Active Neural Core</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">CodeLlama-34b-v45-Instruct</h3>
                                        <div className="flex gap-4 mt-3">
                                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-700" /> Weights: Frozen</span>
                                            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> LoRA: Active_v58.2-WRAITH</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center md:text-right px-8 py-4 bg-black/40 rounded-[32px] border border-white/5">
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">SQL Accuracy (Synced)</div>
                                    <div className="text-4xl font-black text-emerald-400 font-mono tracking-tighter shadow-emerald-500/10 drop-shadow-xl">92.4%</div>
                                </div>
                            </div>
                        </div>

                        {/* Training Queue */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-1 h-4 bg-blue-500 rounded-full" />
                                    Validation Queue // RLHF_PULSE
                                </h4>
                                <span className="text-[10px] font-mono text-slate-700 uppercase">Wait Time: ~140ms</span>
                            </div>

                            <AnimatePresence mode="popLayout">
                                {trainingPairs.map((pair, idx) => (
                                    <motion.div
                                        key={pair.id}
                                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: idx * 0.1, type: 'spring', damping: 20 }}
                                        className="relative p-8 bg-slate-900/40 border border-white/5 rounded-[36px] group/card hover:border-blue-500/20 transition-all duration-500 overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <Binary size={120} className="text-white" />
                                        </div>

                                        <div className="flex flex-col xl:flex-row justify-between items-start gap-8 relative z-10">
                                            <div className="flex-1 space-y-6">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover/card:text-blue-400 group-hover/card:bg-blue-500/10 transition-colors">
                                                        <MessageSquare size={22} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-blue-500" /> Human Input Token
                                                        </div>
                                                        <div className="text-base font-black text-slate-200 tracking-tight leading-relaxed italic">"{pair.question}"</div>
                                                    </div>
                                                </div>

                                                <div className="relative group/sql">
                                                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover/sql:opacity-100 transition-opacity" />
                                                    <div className="relative bg-black/60 p-6 rounded-2xl border border-white/10 font-mono text-xs text-blue-300 leading-relaxed shadow-inner">
                                                        <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                                                            <Database size={12} className="text-slate-600" />
                                                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Target Language: POSTGRESQL</span>
                                                        </div>
                                                        {pair.generatedSql}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full xl:w-56 shrink-0 space-y-6">
                                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center">
                                                    <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Model Confidence</div>
                                                    <div className={cn("text-2xl font-black font-mono", pair.confidence > 0.9 ? 'text-emerald-400' : 'text-amber-400')}>
                                                        {(pair.confidence * 100).toFixed(0)}%
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    {pair.status === 'PENDING' ? (
                                                        <>
                                                            <button
                                                                onClick={() => onVerifySql(pair.id, true)}
                                                                className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/btn"
                                                            >
                                                                <CheckCircle2 size={14} /> APPROVE
                                                            </button>
                                                            <button
                                                                onClick={() => onVerifySql(pair.id, false)}
                                                                className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <X size={14} /> REJECT
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className={cn(
                                                            "w-full py-5 rounded-2xl border flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.3em]",
                                                            pair.status === 'VERIFIED' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                        )}>
                                                            {pair.status === 'VERIFIED' ? <ShieldCheck size={16} /> : <X size={16} />}
                                                            {pair.status}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-center text-[8px] font-mono text-slate-700 uppercase tracking-tighter">Processed: {pair.timestamp}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </TacticalCard>
            </div>

            {/* Neural Insights Section */}
            <div className="space-y-8">
                <TacticalCard variant="holographic" title="CALIBRATION METRICS" className="h-fit">
                    <div className="space-y-8 p-4">
                        <div className="text-center py-10 bg-slate-900/40 border border-white/5 rounded-[40px] relative overflow-hidden group/stats">
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/stats:opacity-100 transition-opacity" />
                            <Binary size={52} className="text-blue-500/30 mx-auto mb-6" />
                            <div className="text-5xl font-black text-white font-mono tracking-tighter mb-2">1,542</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Training Shards Synced</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Diversity', val: '98%', color: 'text-emerald-400', icon: Activity },
                                { label: 'Latency', val: '15ms', color: 'text-blue-400', icon: Zap }
                            ].map((stat, i) => (
                                <div key={i} className="p-6 bg-black/40 rounded-[32px] border border-white/5 flex flex-col items-center">
                                    <stat.icon size={16} className={cn("mb-3", stat.color)} />
                                    <div className={cn("text-xl font-black font-mono", stat.color)}>{stat.val}</div>
                                    <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-[40px] space-y-6">
                            <div className="flex items-center gap-3">
                                <Cpu size={18} className="text-blue-400" />
                                <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Synthesis Engine</h5>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Fine-tuning cycle is ready for execution. This will update the local LoRA weights based on verified approval queue.</p>
                            <button className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 transition-all flex items-center justify-center gap-3 group/train">
                                <RefreshCwIcon /> START RE-TRAINING
                            </button>
                        </div>
                    </div>
                </TacticalCard>

                {/* System Logs v58.2-WRAITH */}
                <div className="p-8 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[40px] space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Synthesis Logs</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="space-y-3 font-mono text-[9px]">
                        <div className="flex gap-3 text-slate-500">
                            <span className="text-blue-500/50">20:14:02</span>
                            <span>[INFO] Loss function converged at 0.024</span>
                        </div>
                        <div className="flex gap-3 text-slate-500">
                            <span className="text-blue-500/50">20:15:33</span>
                            <span>[WARN] Data drift detected in BI sector</span>
                        </div>
                        <div className="flex gap-3 text-emerald-400/60">
                            <span className="text-blue-500/50">20:18:45</span>
                            <span>[SUCCESS] Batch #441 uploaded to Master</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const RefreshCwIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
        <path d="M16 16h5v5"></path>
    </svg>
);
