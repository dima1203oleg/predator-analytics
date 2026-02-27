import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Play, Sparkles, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TacticalCard } from '../TacticalCard';
import { premiumLocales } from '../../locales/uk/premium';
import { DSPyOptimization } from '../../types';

interface LLMDspyViewProps {
    dspyOptimizing: boolean;
    onDspyOptimizingChange: (val: boolean) => void;
    dspyData: any[];
    optimizations?: DSPyOptimization[];
}

export const LLMDspyView: React.FC<LLMDspyViewProps> = ({
    dspyOptimizing,
    onDspyOptimizingChange,
    dspyData,
    optimizations = []
}) => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TacticalCard variant="holographic" title={premiumLocales.llm.dspy.title} className="glass-morphism panel-3d" action={
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => onDspyOptimizingChange(!dspyOptimizing)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-bold flex items-center gap-3 border transition-all uppercase tracking-widest ${dspyOptimizing ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-500'}`}
                >
                    {dspyOptimizing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                    {dspyOptimizing ? premiumLocales.llm.dspy.status.running : premiumLocales.llm.dspy.status.mobilize}
                </motion.button>
            }>
                <div className="h-[280px] w-full mb-8 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dspyData}>
                            <defs>
                                <linearGradient id="dspyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="iter" stroke="#475569" fontSize={10} hide />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#ffffff10', borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="score" stroke="#a855f7" fill="url(#dspyGrad)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {optimizations.length > 0 ? (
                        optimizations.map(mod => (
                            <div key={mod.id} className="p-5 bg-slate-950/80 border border-white/5 rounded-3xl group hover:border-purple-500/30 transition-all cursor-default">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-100 uppercase tracking-widest">{mod.moduleName}</div>
                                            <div className="text-[10px] text-slate-600 font-mono">{premiumLocales.llm.dspy.metrics.target}: {mod.targetMetric}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-purple-400 font-mono">{mod.currentScore.toFixed(1)}%</div>
                                        <div className="text-[10px] text-emerald-500 font-bold tracking-widest">
                                            {mod.status === 'OPTIMIZING' ? premiumLocales.llm.dspy.metrics.optimizing : premiumLocales.llm.dspy.metrics.convergence} | {premiumLocales.llm.dspy.metrics.delta} {mod.lastImprovement}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 border-dashed text-[10px] font-mono text-slate-500 italic leading-relaxed">
                                    "{mod.bestPromptSnippet}"
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-center opacity-70">
                            <AlertCircle size={32} className="mb-3 opacity-50" />
                            <div className="text-[10px] font-black uppercase tracking-[0.2em]">{premiumLocales.llm.dspy.empty.title}</div>
                            <div className="text-[10px] opacity-60">{premiumLocales.llm.dspy.empty.subtitle}</div>
                        </div>
                    )}
                </div>
            </TacticalCard>

            <TacticalCard variant="holographic" title={premiumLocales.llm.dspy.logs.title} className="glass-morphism panel-3d">
                <div className="h-[600px] overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-3 p-4 bg-slate-950/30 rounded-3xl border border-white/5 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Sparkles size={120} /></div>
                    {dspyOptimizing && (
                        <div className="space-y-3">
                            <div className="text-purple-400 font-bold uppercase tracking-widest">&gt;&gt; {premiumLocales.llm.dspy.logs.bootstrapInit}</div>
                            <div className="text-slate-600">[v45.Compiler] {premiumLocales.llm.dspy.logs.compilerGen}</div>
                            <div className="text-slate-600">[v45.Evaluator] {premiumLocales.llm.dspy.logs.evaluatorTest}</div>
                            <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity }} className="text-emerald-500/80 font-bold">&gt;&gt; {premiumLocales.llm.dspy.logs.candidateAccepted.replace('{delta}', '+4.2%')}</motion.div>
                            <div className="text-slate-700 italic border-l border-white/10 pl-4 py-2 opacity-60">"{premiumLocales.llm.dspy.logs.disambiguation}"</div>
                        </div>
                    )}
                    {!dspyOptimizing && <div className="text-slate-800 text-center mt-32 font-bold uppercase tracking-[0.3em]">{premiumLocales.llm.dspy.logs.idle}</div>}
                </div>
            </TacticalCard>
        </motion.div>
    );
};
