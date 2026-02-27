
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, CheckCircle2, X, Binary } from 'lucide-react';
import { TacticalCard } from '../TacticalCard';
import { SqlTrainingPair } from '../../types';

interface CalibrationViewProps {
    trainingPairs: SqlTrainingPair[];
    onVerifySql: (id: string, isCorrect: boolean) => void;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({ trainingPairs, onVerifySql }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            <div className="lg:col-span-2 space-y-6">
                <TacticalCard variant="holographic" title="Text-to-SQL RLHF Optimization" className="panel-3d glass-morphism">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl relative ">
                            <motion.div
                                animate={{ opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent pointer-events-none"
                            />
                            <div className="relative z-10">
                                <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-1">Активна Нейронна Модель</div>
                                <div className="text-xl font-black text-white uppercase tracking-tighter">CodeLlama-34b-v45-Instruct</div>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1.5 grayscale opacity-60">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[9px] font-black text-white uppercase font-mono tracking-widest">Ваги: Заморожені</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        <span className="text-[9px] font-black text-white uppercase font-mono tracking-widest">LoRA: Активна</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right relative z-10">
                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">SQL Accuracy</div>
                                <div className="text-3xl font-black text-emerald-400 font-mono shadow-emerald-500/20 drop-shadow-lg">92.4%</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Queue of Pending Queries for Verification</h4>
                            <AnimatePresence mode="popLayout">
                                {trainingPairs.map((pair, idx) => (
                                    <motion.div
                                        key={pair.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-slate-950/60 border border-white/5 rounded-3xl p-5 group hover:border-blue-500/30 transition-all duration-300"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                                                    <MessageSquare size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Human Request</div>
                                                    <div className="text-sm font-black text-slate-200 italic">"{pair.question}"</div>
                                                </div>
                                            </div>
                                            <div className="text-[9px] font-mono text-slate-600 bg-slate-900 px-2 py-1 rounded-lg uppercase">{pair.timestamp}</div>
                                        </div>

                                        <div className="bg-black/80 p-4 rounded-2xl border border-white/5 font-mono text-xs text-blue-300 relative group/sql">
                                            <div className="absolute top-2 right-4 text-[8px] text-slate-700 font-black uppercase tracking-widest opacity-0 group-hover/sql:opacity-100 transition-opacity">Generated SQL</div>
                                            {pair.generatedSql}
                                        </div>

                                        <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Confidence</div>
                                                <div className={`text-xs font-black font-mono ${pair.confidence > 0.9 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {(pair.confidence * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {pair.status === 'PENDING' ? (
                                                    <>
                                                        <button
                                                            onClick={() => onVerifySql(pair.id, true)}
                                                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Схвалити
                                                        </button>
                                                        <button
                                                            onClick={() => onVerifySql(pair.id, false)}
                                                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Уточнити
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest ${pair.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                        }`}>
                                                        {pair.status === 'VERIFIED' ? <CheckCircle2 size={12} /> : <X size={12} />}
                                                        {pair.status}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </TacticalCard>
            </div>
            <div className="space-y-6">
                <TacticalCard variant="holographic" title="Training Stats" className="panel-3d">
                    <div className="space-y-6">
                        <div className="text-center p-8 bg-black/40 border border-white/5 rounded-3xl">
                            <Binary size={48} className="text-blue-500/40 mx-auto mb-4" />
                            <div className="text-4xl font-black text-white font-mono mb-2">1,542</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Зразків навчання</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="text-xs font-black text-emerald-400 font-mono">98%</div>
                                <div className="text-[8px] text-slate-600 uppercase font-black mt-1">Узгодженість</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="text-xs font-black text-blue-400 font-mono">15ms</div>
                                <div className="text-[8px] text-slate-600 uppercase font-black mt-1">Швидкість</div>
                            </div>
                        </div>
                        <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 transition-all btn-3d">
                            Запустити цикл донавчання
                        </button>
                    </div>
                </TacticalCard>
            </div>
        </motion.div>
    );
};
