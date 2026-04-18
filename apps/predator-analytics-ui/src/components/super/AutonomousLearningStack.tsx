import React, { useState, useEffect } from 'react';
import { api, v45Client } from '../../services/api';
import { TacticalCard } from '../TacticalCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    Database,
    TrendingUp,
    RefreshCcw,
    Search,
    MessageSquare,
    Play,
    Cpu,
    Target,
    Activity,
    Lock
} from 'lucide-react';
import { premiumLocales } from '../../locales/uk/premium';

export const AutonomousLearningStack: React.FC = () => {
    const [trainingStatus, setTrainingStatus] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    const fetchTrainingData = async () => {
        try {
            const [status, hist] = await Promise.all([
                v45Client.get('/training/status'),
                v45Client.get('/ml/jobs')
            ]);
            setTrainingStatus(status.data);
            setHistory(hist.data || []);
        } catch (e) {
            console.error("Failed to fetch training data", e);
        }
    };

    useEffect(() => {
        fetchTrainingData();
        const interval = setInterval(fetchTrainingData, 5000);
        return () => clearInterval(interval);
    }, []);

    const triggerManualTraining = async () => {
        setIsThinking(true);
        try {
            await v45Client.post('/training/trigger');
            await fetchTrainingData(); 
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="p-8 bg-slate-950/80 backdrop-blur-3xl border border-rose-500/10 rounded-[40px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-rose-500/20 rounded-2xl border border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
                        <Database className="w-6 h-6 text-rose-400 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-widest uppercase italic">{premiumLocales.evolution.learningStack.title}</h2>
                        <p className="text-[10px] text-rose-600/60 font-black uppercase tracking-[0.3em] font-mono">NEURAL_DEEP_LEARNING_v5.6</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-full border border-rose-500/20">
                    <Activity className="w-3 h-3 text-rose-400" />
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest tabular-nums">1.4B PARAM</span>
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                {/* Current Status */}
                <div className="bg-black/60 p-6 rounded-3xl border border-white/5 group-hover:border-rose-500/30 transition-all duration-500 shadow-inner">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[11px] text-slate-400 uppercase font-black tracking-widest">{premiumLocales.evolution.learningStack.engineStatus}</span>
                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 ${
                            trainingStatus?.status === 'running' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                            {trainingStatus?.status === 'running' ? 'АКТИВНЕ НАВЧАННЯ' : premiumLocales.evolution.learningStack.idle}
                        </div>
                    </div>
                    <p className="text-xs text-white font-black italic mb-4 leading-relaxed">
                        {trainingStatus?.message || premiumLocales.evolution.learningStack.waitingPatterns}
                    </p>
                    {trainingStatus?.status === 'running' && (
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                className="bg-gradient-to-r from-rose-600 to-yellow-500 h-full relative"
                                initial={{ width: 0 }}
                                animate={{ width: `${trainingStatus.progress}%` }}
                                transition={{ duration: 1 }}
                            >
                                <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 bg-white/40" />
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Training Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={triggerManualTraining}
                        disabled={isThinking || trainingStatus?.status === 'running'}
                        className="flex items-center justify-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl hover:bg-rose-500/20 transition-all group/btn disabled:opacity-30 shadow-lg"
                    >
                        <Zap className={`w-4 h-4 text-rose-400 ${isThinking ? 'animate-spin' : 'group-hover/btn:scale-125 transition-transform'}`} />
                        <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">{premiumLocales.evolution.learningStack.startTraining}</span>
                    </motion.button>
                    <button className="flex items-center justify-center gap-3 p-4 bg-slate-900/60 border border-white/5 rounded-2xl opacity-40 cursor-not-allowed group/btn2">
                        <Lock className="w-4 h-4 text-slate-500 group-hover/btn2:text-slate-200 transition-colors" />
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">HYPER_TUNE</span>
                    </button>
                </div>

                {/* Benchmarks Section */}
                <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5 space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">{premiumLocales.evolution.learningStack.accuracyDelta}</span>
                        <div className="flex items-center gap-2">
                             <TrendingUp className="w-3 h-3 text-emerald-400" />
                             <span className="text-[10px] text-emerald-400 font-black">+4.2%</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {Array.isArray(history) && history.slice(0, 3).map((job, i) => (
                            <div key={job.id || i} className="flex items-center justify-between text-[11px] p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group/row">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.5)]" />
                                    <span className="text-slate-200 font-black italic truncate max-w-[120px]">{job.name}</span>
                                </div>
                                <div className="flex gap-3 font-mono items-center">
                                    <span className="text-emerald-400 font-black">+{job.metrics?.accuracy ? (job.metrics.accuracy * 100).toFixed(1) : "0.0"}%</span>
                                    <div className="w-[1px] h-3 bg-slate-800" />
                                    <span className="text-rose-500/60 font-black tracking-tighter uppercase text-[9px]">{job.status === 'succeeded' ? 'WRAITH' : 'SYNC'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
