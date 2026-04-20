
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Binary, Scan, Target, Cpu, Activity, Info, ChevronRight, Zap } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { TacticalCard } from '../TacticalCard';
import { cn } from '../../utils/cn';

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
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
            {/* Semantic Radar Section */}
            <div className="lg:col-span-2">
                <TacticalCard
                    variant="holographic"
                    title="QDRANT SEMANTIC RADAR v58.2-WRAITH"
                    className="h-[600px] panel-3d overflow-hidden group"
                >
                    <div className="absolute top-4 right-8 flex items-center gap-4 z-20">
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Live Scanner</span>
                        </div>
                    </div>

                    <div className="h-full w-full relative z-10 pt-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart
                                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                                onClick={(e) => {
                                    if (e && e.activePayload && e.activePayload[0]) {
                                        onSelectVector(e.activePayload[0].payload);
                                    }
                                }}
                            >
                                <XAxis type="number" dataKey="x" hide />
                                <YAxis type="number" dataKey="y" hide />
                                <ZAxis type="number" dataKey="z" range={[80, 450]} />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(59, 130, 246, 0.5)', strokeWidth: 1, strokeDasharray: '5 5' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cluster Class</div>
                                                    <div className="text-sm font-black text-white uppercase tracking-tighter mb-3">{data.cluster}</div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="text-[8px] text-slate-600 uppercase font-black">X-Coord</div>
                                                            <div className="text-[10px] font-mono font-bold text-blue-400">{data.x.toFixed(4)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[8px] text-slate-600 uppercase font-black">Y-Coord</div>
                                                            <div className="text-[10px] font-mono font-bold text-blue-400">{data.y.toFixed(4)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Vectors" data={vectorData}>
                                    {vectorData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.cluster.includes('GOV') ? '#3b82f6' : entry.cluster.includes('MED') ? '#f43f5e' : entry.cluster.includes('BIZ') ? '#eab308' : '#10b981'}
                                            className="cursor-pointer hover:brightness-150 transition-all duration-300 drop-shadow-[0_0_12px_rgba(currentColor,0.4)]"
                                            style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>

                        {/* Radar Overlays */}
                        <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[40px] m-10 overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5" />
                            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/5" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/5 rounded-full" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full" />
                        </div>
                    </div>
                </TacticalCard>
            </div>

            {/* Vector Inspector Section */}
            <div className="space-y-6">
                <TacticalCard variant="holographic" title="SEMANTIC INSPECTOR" className="h-[600px] flex flex-col group">
                    <AnimatePresence mode="wait">
                        {selectedVector ? (
                            <motion.div
                                key={selectedVector.id}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                className="flex-1 flex flex-col pt-6"
                            >
                                <div className="p-6 bg-slate-900/40 border border-white/5 rounded-[32px] mb-8 group-hover:border-blue-500/20 transition-all">
                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-lg">
                                            <Target size={28} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Target Embedding</div>
                                            <div className="text-lg font-mono font-black text-white tracking-tighter">
                                                {selectedVector.id.substring(0, 16).toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div className="bg-black/20 p-4 rounded-2xl">
                                            <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Domain</div>
                                            <div className="text-xs font-black text-blue-400 uppercase tracking-widest">{selectedVector.cluster}</div>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-2xl">
                                            <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Dimensions</div>
                                            <div className="text-xs font-black text-slate-300 font-mono">1536.f32</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Cpu size={14} className="text-slate-500" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Metadata Hash</span>
                                    </div>
                                    <div className="bg-slate-950/80 p-6 rounded-[24px] border border-white/5 font-mono text-[11px] text-emerald-400/80 leading-relaxed max-h-[220px] overflow-auto custom-scrollbar shadow-inner">
                                        <div className="flex gap-4 mb-2">
                                            <span className="text-slate-700">01</span>
                                            <span>{`"source": "OSINT_HARVESTER_X"`}</span>
                                        </div>
                                        <div className="flex gap-4 mb-2">
                                            <span className="text-slate-700">02</span>
                                            <span>{`"relevance_score": 0.9928`}</span>
                                        </div>
                                        <div className="flex gap-4 mb-2">
                                            <span className="text-slate-700">03</span>
                                            <span>{`"encryption": "AES_256_GCM"`}</span>
                                        </div>
                                        <div className="flex gap-4 mb-2">
                                            <span className="text-slate-700">04</span>
                                            <span>{`"ttl_expiry": "NEVER"`}</span>
                                        </div>
                                        <div className="flex gap-4 mb-2">
                                            <span className="text-slate-700">05</span>
                                            <span>{`"node_affinity": "UKRAINE_WEST"`}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onSelectVector(null)}
                                    className="mt-8 group/btn w-full py-4 bg-slate-900 border border-white/5 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white hover:border-blue-500/30 transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-2"
                                >
                                    Reset Selection <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 mt-10 space-y-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-[30px] rounded-full animate-pulse" />
                                    <Scan size={80} className="text-blue-500/40 relative z-10" />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                                        СЕНСОР ОЧІКУЄ <br /> <span className="text-blue-500/60">АКТИВАЦІЇ</span>
                                    </p>
                                    <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest max-w-[200px] mx-auto">
                                        Оберіть вузол на семантичному радарі для повного сканування ембеддингу
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-800 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </TacticalCard>
            </div>
        </motion.div>
    );
};
