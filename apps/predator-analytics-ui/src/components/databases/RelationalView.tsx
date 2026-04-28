
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table as TableIcon, Layers, Terminal, ArrowRight, Hash, Database, Zap } from 'lucide-react';
import { DatabaseTable } from '../../types';
import { cn } from '../../utils/cn';

interface RelationalViewProps {
    tables: DatabaseTable[];
    onOpenQuery: (tableName: string) => void;
}

export const RelationalView: React.FC<RelationalViewProps> = ({ tables, onOpenQuery }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter"> еляційна Структура <span className="text-blue-500">PostgreSQL</span></h2>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Оптимізоване сховище для структурованих транзакційних даних</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                        <Database size={14} className="text-blue-400" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Master Node: rds-v58.2-WRAITH-primary</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {tables.map((table, idx) => (
                        <motion.div
                            key={table.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative p-8 bg-slate-900/40 border border-white/5 rounded-[32px] hover:border-blue-500/30 transition-all duration-500 shadow-2xl overflow-hidden"
                        >
                            {/* Animated Background Pulse */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full group-hover:bg-blue-500/10 transition-all" />

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-500">
                                        <TableIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none mb-1 group-hover:text-blue-400 transition-colors">{table.name}</h3>
                                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 bg-slate-950 rounded border border-white/5 uppercase tracking-widest text-[8px]">{table.type}</span>
                                            <span className="text-slate-700">/</span>
                                            <span>{table.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                    <Zap size={12} className="text-emerald-500 animate-pulse" />
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 relative z-10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-black/20 rounded-2xl border border-white/5">
                                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                                            <Hash size={8} /> Records
                                        </p>
                                        <p className="text-sm font-black text-slate-300 font-mono">{table.records.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-black/20 rounded-2xl border border-white/5">
                                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                                            <Layers size={8} /> Indices
                                        </p>
                                        <p className="text-sm font-black text-slate-300 font-mono">14</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center relative z-10">
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    Status: <span className="text-emerald-500">ACTIVE // OPTIMIZED</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onOpenQuery(table.name)}
                                        className="w-10 h-10 flex items-center justify-center bg-slate-950 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 transition-all active:scale-95 shadow-lg"
                                        title="Відкрити SQL Термінал"
                                    >
                                        <Terminal size={14} />
                                    </button>
                                    <button className="w-10 h-10 flex items-center justify-center bg-slate-950 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-95 shadow-lg">
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
