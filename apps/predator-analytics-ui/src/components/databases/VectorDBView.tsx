
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Binary, Scan } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { TacticalCard } from '../TacticalCard';

interface VectorData {
    id: string;
    x: number;
    y: number;
    z: number;
    cluster: string;
}

interface VectorDBViewProps {
    vectorData: VectorData[];
    selectedVector: VectorData | null;
    onSelectVector: (vector: VectorData | null) => void;
}

export const VectorDBView: React.FC<VectorDBViewProps> = ({ vectorData, selectedVector, onSelectVector }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            <div className="lg:col-span-2">
                <TacticalCard variant="holographic" title="Qdrant Векторний Простір (Semantic Radar)" className="h-[500px] panel-3d glass-morphism relative ">
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none"></div>
                    <div className="h-full w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart
                                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                                onClick={(e) => {
                                    if (e && e.activePayload && e.activePayload[0]) {
                                        onSelectVector(e.activePayload[0].payload);
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis type="number" dataKey="x" name="Вимір X" stroke="#475569" tick={{ fontSize: 10 }} hide />
                                <YAxis type="number" dataKey="y" name="Вимір Y" stroke="#475569" tick={{ fontSize: 10 }} hide />
                                <ZAxis type="number" dataKey="z" range={[50, 600]} />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                />
                                <Scatter name="Vectors" data={vectorData} fill="#8884d8">
                                    {vectorData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.cluster.includes('GOV') ? '#3b82f6' : entry.cluster.includes('MED') ? '#ef4444' : entry.cluster.includes('BIZ') ? '#eab308' : '#22c55e'}
                                            className="drop-shadow-[0_0_8px_rgba(currentColor,0.5)] cursor-pointer hover:scale-125 transition-transform"
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </TacticalCard>
            </div>
            <div className="space-y-6">
                <TacticalCard variant="holographic" title="Інспектор Векторів" className="h-[500px] flex flex-col">
                    <AnimatePresence mode="wait">
                        {selectedVector ? (
                            <motion.div
                                key={selectedVector.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col pt-4"
                            >
                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Binary size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">ID Ембеддингу</div>
                                            <div className="text-sm font-mono font-black text-white">{selectedVector.id.substring(0, 12)}...</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-[8px] text-slate-600 uppercase font-black mb-1">Класстер</div>
                                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded inline-block">{selectedVector.cluster}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] text-slate-600 uppercase font-black mb-1">Розмірність</div>
                                            <div className="text-[10px] font-black text-slate-300 font-mono">1536 (OpenAI)</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-blue-400 leading-relaxed max-h-[180px] overflow-auto custom-scrollbar">
                                        {`"metadata": {\n  "source": "${selectedVector.cluster}_active",\n  "relevance": 0.984,\n  "checksum": "8f2e...9a4c",\n  "indexed_at": "2023-12-21T15:42"\n}`}
                                    </div>
                                </div>

                                <button
                                    onClick={() => onSelectVector(null)}
                                    className="mt-auto w-full py-3 bg-slate-950 border border-white/5 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em]"
                                >
                                    Close Inspector
                                </button>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <Scan size={48} className="text-slate-800 mb-6 animate-pulse" />
                                <p className="text-xs text-slate-600 uppercase font-black tracking-widest leading-relaxed">
                                    Оберіть вектор на радарі для активації детектору смислів
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </TacticalCard>
            </div>
        </motion.div>
    );
};
