import React, { useState, useEffect } from 'react';
import {
    api,
    v45Client
} from '../../services/api';
import { TacticalCard } from '../TacticalCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    ShieldAlert,
    Activity,
    Brain,
    Flame,
    CheckCircle2,
    RefreshCcw,
    Database,
    Cpu,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import { AutonomousLearningStack } from './AutonomousLearningStack';

const EvolutionDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [anomalies, setAnomalies] = useState<any>(null);
    const [chaosStatus, setChaosStatus] = useState<any>({ chaos_mode: false });
    const [recentExperience, setRecentExperience] = useState<any[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    const fetchData = async () => {
        try {
            const [statsRes, experienceRes, chaosRes, anomaliesRes] = await Promise.allSettled([
                v45Client.get('/evolution/metrics/current'),
                v45Client.get('/evolution/experience'),
                v45Client.get('/azr/status'),
                api.som.getAnomalies()
            ]);

            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            if (experienceRes.status === 'fulfilled') setRecentExperience(Array.isArray(experienceRes.value.data) ? experienceRes.value.data.slice(-10).reverse() : []);
            if (chaosRes.status === 'fulfilled') setChaosStatus(chaosRes.value.data || chaosRes.value);
            if (anomaliesRes.status === 'fulfilled') setAnomalies(anomaliesRes.value);
        } catch (e) {
            console.error("Evolution fetch failed", e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const triggerChaos = async () => {
        setIsThinking(true);
        try {
            await api.som.chaosSpike(15);
        } catch (e) {
            console.error("Chaos spike failed", e);
        } finally {
            setTimeout(() => setIsThinking(false), 2000);
            fetchData();
        }
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
            {/* Header / Central Vision */}
            <div className="col-span-12 flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-tighter">
                        AZR: УНІФІКОВАНА СУВЕРЕННІСТЬ
                    </h1>
                    <p className="text-white/40 text-xs font-mono">SOVEREIGN CORE V40.0 • АВТОНОМНА ЕВОЛЮЦІЯ АКТИВНА</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={triggerChaos}
                        disabled={isThinking}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                            chaosStatus?.chaos_mode ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/5 border-white/10 text-white/60 hover:border-red-500/50 hover:text-red-400'
                        }`}
                    >
                        <Flame className={`w-4 h-4 ${isThinking ? 'animate-bounce' : ''}`} />
                        <span className="text-xs font-bold uppercase tracking-widest">Тест Хаосу</span>
                    </button>
                    <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" />
                        <span className="text-[10px] font-mono text-blue-400 uppercase">Self-Healer Онлайн</span>
                    </div>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="col-span-12 md:col-span-4 space-y-4">
                <TacticalCard title="Приріст Еволюції" icon={<Brain className="w-4 h-4 text-purple-400" />}>
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                <motion.circle
                                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                    strokeDasharray={364}
                                    initial={{ strokeDashoffset: 364 }}
                                    animate={{ strokeDashoffset: 364 - (364 * (stats?.ai_performance?.success_rate || 0)) }}
                                    className="text-purple-500"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white">{Math.round((stats?.ai_performance?.success_rate || 0.98) * 100)}%</span>
                                <span className="text-[8px] text-white/40 uppercase">Інтелект</span>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                            <div className="text-center p-2 bg-white/5 rounded-xl">
                                <div className="text-xs text-white/40">Активні Агенти</div>
                                <div className="text-xl font-bold text-green-400">{stats?.ai_performance?.active_agents || 0}</div>
                            </div>
                            <div className="text-center p-2 bg-white/5 rounded-xl">
                                <div className="text-xs text-white/40">Оптимізації</div>
                                <div className="text-xl font-bold text-blue-400">{stats?.application?.documents_indexed || 0}</div>
                            </div>
                        </div>
                    </div>
                </TacticalCard>

                {/* Anomaly Prediction Sub-Panel */}
                <TacticalCard title="Двигун Прогнозування" icon={<AlertTriangle className="w-4 h-4 text-yellow-400" />}>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                             <div className="flex flex-col">
                                 <span className="text-[10px] text-white/40 uppercase tracking-widest">Наступний Прогноз</span>
                                 <span className="text-lg font-mono text-white flex items-center gap-2">
                                     {anomalies?.forecast?.next_predicted_value?.toFixed(1) || '---'}
                                     {anomalies?.forecast?.trend === 'degrading' ? <TrendingUp className="w-3 h-3 text-red-400" /> : <TrendingUp className="w-3 h-3 text-green-400 transform rotate-180" />}
                                 </span>
                             </div>
                             <div className="text-right">
                                 <span className="text-[10px] text-white/40 uppercase tracking-widest">Z-Score Аномалії</span>
                                 <div className={`text-lg font-bold ${anomalies?.anomalies_detected > 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                                     {anomalies?.anomalies_detected || 0}
                                 </div>
                             </div>
                        </div>

                        {anomalies?.anomalies?.length > 0 && (
                            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-200">
                                УВАГА: виявлено відхилення метрики {anomalies.anomalies[0].metric}!
                            </div>
                        )}
                     </div>
                </TacticalCard>
            </div>

            {/* Deep Experience Ledger */}
            <div className="col-span-12 md:col-span-4 flex flex-col">
                <TacticalCard title="Системна Телеметрія" icon={<Activity className="w-4 h-4 text-blue-400" />}>
                     <div className="grid grid-cols-2 gap-2 mb-4">
                         <div className="bg-white/5 p-2 rounded">
                             <div className="text-[10px] text-white/50">НАВАНТАЖЕННЯ ЦП</div>
                             <div className="text-xl font-mono text-white">{stats?.system?.cpu_percent || 0}%</div>
                             <div className="h-1 bg-white/10 mt-1 rounded ">
                                 <div className="h-full bg-blue-500" style={{ width: `${stats?.system?.cpu_percent || 0}%`}} />
                             </div>
                         </div>
                         <div className="bg-white/5 p-2 rounded">
                             <div className="text-[10px] text-white/50">ВИКОРИСТАННЯ ОЗП</div>
                             <div className="text-xl font-mono text-white">{stats?.system?.memory_percent || 0}%</div>
                             <div className="h-1 bg-white/10 mt-1 rounded ">
                                 <div className="h-full bg-purple-500" style={{ width: `${stats?.system?.memory_percent || 0}%`}} />
                             </div>
                         </div>
                     </div>
                    <div className="h-[300px] overflow-y-auto pr-2 space-y-2 font-mono scrollbar-hide">
                        <AnimatePresence mode="popLayout">
                            {recentExperience.map((exp: any, i: number) => (
                                <motion.div
                                    key={exp.timestamp || i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 bg-white/5 border-l-2 border-blue-500/50 rounded-r-xl flex items-start gap-4"
                                >
                                    <div className="mt-1">
                                        {exp.event?.includes('ai') ? <Brain className="w-4 h-4 text-purple-400" /> : <Cpu className="w-4 h-4 text-blue-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] text-white/30 uppercase">{exp.event || 'SYSTEM_EVENT'}</span>
                                            <span className="text-[9px] text-blue-400">{new Date(exp.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-xs text-white/80 leading-relaxed uppercase">
                                            {exp.data?.message || exp.data?.description || JSON.stringify(exp.data)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </TacticalCard>
            </div>

            {/* Autonomous Learning Stack */}
            <div className="col-span-12 md:col-span-4">
                <AutonomousLearningStack />
            </div>
        </div>
    );
};

export default EvolutionDashboard;
