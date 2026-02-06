
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table as TableIcon, Layers, Terminal, ArrowRight } from 'lucide-react';
import { DatabaseTable } from '../../types';

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
            className="space-y-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {tables.map((table, idx) => (
                        <motion.div
                            key={table.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative  p-6 glass-ultra rounded-3xl hover:border-blue-500/40 transition-all duration-500 shadow-2xl panel-3d"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <TableIcon size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-white uppercase tracking-tighter">{table.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                            <Layers size={10} /> {table.type} <span className="text-slate-700">•</span> {table.size}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black border border-emerald-500/20 uppercase tracking-widest">Стабільно</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                <div>
                                    <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Записів</div>
                                    <div className="text-sm font-black text-slate-300 font-mono">{table.records.toLocaleString()}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onOpenQuery(table.name)}
                                        className="p-2.5 bg-slate-950 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-blue-500/30 transition-all active:scale-95"
                                        title="Відкрити SQL Термінал"
                                    >
                                        <Terminal size={14} />
                                    </button>
                                    <button className="p-2.5 bg-slate-950 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95">
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
