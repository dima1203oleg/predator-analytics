
import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Stethoscope, Briefcase, Leaf, RefreshCw, Play, ChevronRight, Microscope, LineChart as LineChartIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TacticalCard } from '../ui/TacticalCard';
import { premiumLocales } from '../../locales/uk/premium';

export type TrainingDomain = 'GOV' | 'MED' | 'SCI' | 'BIZ';

export const TRAINING_CONFIGS: Record<TrainingDomain, { label: string, icon: React.ReactNode, steps: string[] }> = {
    GOV: { label: premiumLocales.llm.training.domains.gov, icon: <Building2 size={16} />, steps: premiumLocales.llm.training.steps.gov },
    MED: { label: premiumLocales.llm.training.domains.med, icon: <Stethoscope size={16} />, steps: premiumLocales.llm.training.steps.med },
    BIZ: { label: premiumLocales.llm.training.domains.biz, icon: <Briefcase size={16} />, steps: premiumLocales.llm.training.steps.biz },
    SCI: { label: premiumLocales.llm.training.domains.sci, icon: <Leaf size={16} />, steps: premiumLocales.llm.training.steps.sci }
};



interface LLMTrainingViewProps {
    trainingDomain: TrainingDomain;
    onTrainingDomainChange: (dom: TrainingDomain) => void;
    trainingStatus: 'IDLE' | 'TRAINING' | 'COMPLETED';
    progress: number;
    trainingLogs: string[];
    onStartTraining: () => void;
    logsEndRef: React.RefObject<HTMLDivElement>;
}

export const LLMTrainingView: React.FC<LLMTrainingViewProps> = ({
    trainingDomain,
    onTrainingDomainChange,
    trainingStatus,
    progress,
    trainingLogs,
    onStartTraining,
    logsEndRef
}) => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TacticalCard variant="holographic" title={premiumLocales.llm.training.title} className="glass-morphism panel-3d">
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        {(Object.keys(TRAINING_CONFIGS) as TrainingDomain[]).map((dom) => (
                            <button
                                key={dom} onClick={() => onTrainingDomainChange(dom)}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 ${trainingDomain === dom
                                    ? 'bg-blue-600/10 border-blue-500 text-white shadow-blue-500/10 shadow-xl'
                                    : 'bg-slate-950/50 border-white/5 text-slate-700 hover:border-slate-800'
                                    }`}
                            >
                                <div className={`p-2 rounded-xl border ${trainingDomain === dom ? 'bg-blue-500 text-white' : 'bg-slate-900 border-white/5'}`}>{TRAINING_CONFIGS[dom].icon}</div>
                                <span className="text-[11px] font-bold uppercase tracking-widest">{dom}</span>
                            </button>
                        ))}
                    </div>

                    <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display font-bold text-slate-200 text-lg uppercase tracking-wider">{TRAINING_CONFIGS[trainingDomain].label}</h3>
                            <span className="text-[9px] font-extrabold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 uppercase tracking-[0.2em]">Вузол Адаптера v0.4</span>
                        </div>

                        {trainingStatus !== 'IDLE' && (
                            <div className="mb-8">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-1">
                                    <span>{premiumLocales.llm.training.progress}</span>
                                    <span className="text-blue-400 font-mono text-lg">{progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-900 rounded-full  border border-white/5 group">
                                    <motion.div
                                        initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 shadow-[0_0_15px_blue]"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="h-48 overflow-y-auto custom-scrollbar bg-black/40 p-4 rounded-2xl border border-white/5 font-mono text-[10px] space-y-3 relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Microscope size={64} /></div>
                            {trainingLogs.length === 0 ? (
                                <div className="text-slate-800 italic uppercase tracking-widest text-center mt-12 font-bold">{premiumLocales.llm.training.waiting}</div>
                            ) : (
                                trainingLogs.map((log, i) => (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="text-blue-400/60 flex items-center gap-4">
                                        <ChevronRight size={10} className="text-blue-800" /> {log}
                                    </motion.div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    <div className="flex justify-center gap-6">
                        <motion.button whileHover={{ scale: 1.02 }} className="px-10 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 text-[10px] uppercase tracking-widest flex items-center gap-3 disabled:opacity-20" onClick={onStartTraining} disabled={trainingStatus === 'TRAINING'}>
                            {trainingStatus === 'TRAINING' ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                            {premiumLocales.llm.training.initialize}
                        </motion.button>
                    </div>
                </div>
            </TacticalCard>

            <TacticalCard variant="holographic" title={premiumLocales.llm.training.matrix} className="glass-morphism panel-3d">
                <div className="space-y-4">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                <XAxis dataKey="epoch" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#ffffff10', borderRadius: '12px' }} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="loss" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 6 }} name="Втрати (Loss)" />
                                <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} name="Точність (Accuracy)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 mt-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-blue-500/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-slate-900 rounded-xl"><LineChartIcon size={16} className="text-slate-600" /></div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-200">{premiumLocales.llm.training.experiment} #{i}</div>
                                        <div className="text-[9px] text-slate-500 font-mono mt-1">{premiumLocales.llm.training.target}: <span className="text-blue-500">K-Forensics</span></div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-emerald-500/50 px-3 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10">{premiumLocales.llm.training.convergence}</div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full py-4 border border-dashed border-white/5 text-slate-700 hover:text-slate-200 hover:border-blue-500/50 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-bold transition-all mt-6">
                        {premiumLocales.llm.training.synthesize}
                    </button>
                </div>
            </TacticalCard>
        </motion.div>
    );
};
