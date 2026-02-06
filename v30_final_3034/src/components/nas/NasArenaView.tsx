
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Trophy, Sparkles, GitBranch, Activity, Zap, Layers, Brain } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { TacticalCard } from '../TacticalCard';
import { NasTournament, ModelCandidate } from '../../types';

interface NasArenaViewProps {
    tournaments: NasTournament[];
    candidatesData: any[];
    models: ModelCandidate[];
}

export const NasArenaView: React.FC<NasArenaViewProps> = ({ tournaments, candidatesData, models }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            <div className="lg:col-span-2 space-y-6">
                <TacticalCard variant="holographic"
                    title="Межа Парето (Точність vs Затримка)"
                    className="h-[430px] panel-3d border-slate-700/50 glass-morphism  relative"
                    icon={<TrendingUp size={16} />}
                >
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]"></div>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" dataKey="x" name="Затримка (ms)" unit="ms" stroke="#64748b" label={{ value: 'Затримка (мс)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                            <YAxis type="number" dataKey="y" name="Точність (%)" unit="%" stroke="#64748b" domain={[60, 100]} label={{ value: 'Точність (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} name="Params (M)" />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                            />
                            <Legend />
                            <Scatter name="Архітектури" data={candidatesData} fill="#3b82f6" shape="circle">
                                {candidatesData.map((entry, index) => (
                                    <motion.circle
                                        key={`dot-${index}`}
                                        initial={{ r: 0 }}
                                        animate={{ r: 4 }}
                                        className="fill-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </TacticalCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {tournaments.map((t, idx) => (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`
                                group relative  rounded-3xl border transition-all duration-500 p-6
                                ${t.topicId === 'GOD_MODE'
                                        ? 'bg-purple-600/10 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20'
                                        : 'bg-slate-900/40 border-white/5 hover:border-white/10 shadow-xl'}
                            `}
                            >
                                {t.topicId === 'GOD_MODE' && (
                                    <motion.div
                                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="absolute inset-0 bg-gradient-to-tr from-purple-600/5 via-transparent to-blue-600/5 pointer-events-none"
                                    />
                                )}

                                {t.status === 'RUNNING' && (
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-slate-800 ">
                                        <motion.div
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '100%' }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                            className={`w-1/2 h-full ${t.topicId === 'GOD_MODE' ? 'bg-purple-400 shadow-[0_0_15px_#a855f7]' : 'bg-blue-400 shadow-[0_0_10px_#3b82f6]'}`}
                                        />
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${t.topicId === 'GOD_MODE' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40' :
                                                t.status === 'RUNNING' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' :
                                                    'bg-slate-800 text-slate-500'
                                            }`}>
                                            {t.topicId === 'GOD_MODE' ? <Sparkles size={24} className="animate-pulse" /> : <Trophy size={24} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                                {t.name}
                                                {t.topicId === 'GOD_MODE' && <span className="text-[8px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full animate-pulse font-black">SUPERINTEL</span>}
                                            </div>
                                            <div className="text-[9px] text-slate-500 font-mono mt-1 flex items-center gap-2 uppercase font-bold tracking-widest">
                                                <GitBranch size={10} className="text-slate-700" /> {t.strategy}
                                                <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                                                Gen {t.currentGeneration}/{t.maxGenerations}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-[8px] font-black px-2.5 py-1 rounded-full border-2 uppercase tracking-widest ${t.status === 'RUNNING' ? 'border-blue-500/20 text-blue-400 bg-blue-500/5' : 'border-slate-800 text-slate-600'
                                        }`}>
                                        {t.status === 'RUNNING' ? 'Активний' : 'Завершено'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 relative z-10">
                                    <div className="p-3 bg-black/40 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                                        <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Найкращий результат</div>
                                        <div className={`text-sm font-black font-mono ${t.topicId === 'GOD_MODE' ? 'text-purple-400' : 'text-blue-400'}`}>
                                            {(t.bestScore * 100).toFixed(1)}<span className="text-[10px] ml-0.5">%</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                                        <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Кандидати</div>
                                        <div className="text-sm font-black text-white font-mono">{t.candidatesCount}</div>
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                                        <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Час</div>
                                        <div className="text-sm font-black text-slate-300 font-mono">{t.duration}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <div className="space-y-6">
                <TacticalCard variant="holographic" title="Потік Навчання НАЖИВО" className="h-[640px] flex flex-col panel-3d glass-morphism p-0 " noPadding>
                    <div className="bg-slate-900/80 p-3 border-b border-slate-800 flex justify-between items-center relative z-10">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={12} className="text-blue-400 animate-pulse" /> Кандидати в реальному часі
                        </span>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 relative">
                        <div className="absolute inset-0 bg-dot-matrix opacity-[0.03] pointer-events-none"></div>
                        <AnimatePresence initial={false}>
                            {models.map((m, idx) => (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, x: -20, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`p-4 border rounded-2xl flex items-center justify-between group transition-all backdrop-blur-md relative  ${m.status === 'TRAINING'
                                            ? 'bg-blue-500/5 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                                            : 'bg-black/40 border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    {m.status === 'TRAINING' && (
                                        <motion.div
                                            className="absolute bottom-0 left-0 h-[2px] bg-blue-500/50"
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 10, repeat: Infinity }}
                                        />
                                    )}
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${m.status === 'TRAINING' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-slate-900 border border-white/5 text-slate-500'
                                            }`}>
                                            <Brain size={20} className={m.status === 'TRAINING' ? 'animate-pulse' : ''} />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                                                {m.architecture}
                                                {m.metrics.accuracy > 0.92 && <Zap size={10} className="text-amber-400" />}
                                            </div>
                                            <div className="text-[9px] text-slate-500 font-mono mt-1 flex items-center gap-2 uppercase tracking-tighter">
                                                <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-[8px]"><Layers size={8} /> G{m.generation}</span>
                                                <span className="text-slate-800">::</span>
                                                <span className={`font-black ${m.provider === 'mistral' ? 'text-orange-500' :
                                                        m.provider === 'google' ? 'text-blue-500' :
                                                            'text-emerald-500'
                                                    }`}>
                                                    {m.provider}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right relative z-10">
                                        {m.status === 'TRAINING' ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] text-blue-400 font-black tracking-widest animate-pulse">НАВЧАННЯ</span>
                                                <span className="text-[7px] text-slate-600 font-mono mt-0.5 uppercase">Еволюція ваг...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                <div className="text-sm font-black text-emerald-400 font-mono leading-none">
                                                    {(m.metrics.accuracy * 100).toFixed(1)}<span className="text-[10px] ml-0.5">%</span>
                                                </div>
                                                <div className="text-[8px] text-slate-500 font-mono uppercase mt-1">
                                                    Затримка: {m.metrics.latency.toFixed(0)}<span className="lowercase">мс</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </TacticalCard>
            </div>
        </motion.div>
    );
};

const Cell = (props: any) => {
    const { cx, cy, fill, r, className } = props;
    return (
        <circle cx={cx} cy={cy} r={r} fill={fill} className={className} />
    );
};
