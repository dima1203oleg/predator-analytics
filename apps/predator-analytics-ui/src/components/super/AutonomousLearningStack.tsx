import React, { useState, useEffect } from 'react';
import { api, v45Client } from '../../services/api';
import { TacticalCard } from '../TacticalCard';
import { motion } from 'framer-motion';
import {
    Zap,
    Database,
    TrendingUp,
    RefreshCcw,
    Search,
    MessageSquare,
    Play
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
            await fetchTrainingData(); // Refresh immediately after trigger
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <TacticalCard
            title={premiumLocales.evolution.learningStack.title}
            icon={<Database className="w-4 h-4 text-orange-400" />}
        >
            <div className="space-y-4">
                {/* Current Status */}
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-white/40 uppercase font-mono">{premiumLocales.evolution.learningStack.engineStatus}</span>
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                            trainingStatus?.status === 'running' ? 'bg-orange-500/20 text-orange-400 animate-pulse' : 'bg-green-500/20 text-green-400'
                        }`}>
                            {trainingStatus?.status || premiumLocales.evolution.learningStack.idle}
                        </div>
                    </div>
                    <p className="text-xs text-white/80 font-mono mb-2">
                        {trainingStatus?.message || premiumLocales.evolution.learningStack.waitingPatterns}
                    </p>
                    {trainingStatus?.status === 'running' && (
                        <div className="w-full bg-white/10 h-1 rounded-full ">
                            <motion.div
                                className="bg-orange-500 h-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${trainingStatus.progress}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                    )}
                </div>

                {/* Training Actions */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={triggerManualTraining}
                        disabled={isThinking || trainingStatus?.status === 'running'}
                        className="flex items-center justify-center gap-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg hover:bg-orange-500/20 transition-all group"
                    >
                        <Zap className={`w-3 h-3 text-orange-400 ${isThinking ? 'animate-spin' : 'group-hover:scale-110'}`} />
                        <span className="text-[10px] font-bold text-orange-400 uppercase">{premiumLocales.evolution.learningStack.startTraining}</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all opacity-50 cursor-not-allowed">
                        <Search className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase">{premiumLocales.evolution.learningStack.tuneHyper}</span>
                    </button>
                </div>

                {/* Mini Benchmark */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/40 uppercase font-mono">{premiumLocales.evolution.learningStack.accuracyDelta}</span>
                        <TrendingUp className="w-3 h-3 text-green-400" />
                    </div>
                    {Array.isArray(history) && history.slice(0, 3).map((job, i) => (
                        <div key={job.id || i} className="flex items-center justify-between text-[10px] p-1.5 hover:bg-white/5 rounded transition-colors border-b border-white/5">
                            <span className="text-white/60 truncate max-w-[100px]">{job.name}</span>
                            <div className="flex gap-2 font-mono">
                                <span className="text-green-400">+{job.metrics?.accuracy ? (job.metrics.accuracy * 100).toFixed(1) : "0.0"}%</span>
                                <span className="text-white/20">|</span>
                                <span className="text-blue-400">{job.status === 'succeeded' ? 'PROM' : 'RUN'}</span>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="text-[10px] text-white/20 text-center py-2 italic font-mono uppercase">
                            {premiumLocales.evolution.learningStack.noBenchmarks}
                        </div>
                    )}
                </div>
            </div>
        </TacticalCard>
    );
};
