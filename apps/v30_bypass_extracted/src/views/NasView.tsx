
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import {
    Trophy, Activity, Zap, Server, Settings, Play, Database,
    GitBranch, RefreshCw, BarChart3, Box, TrendingUp, CheckCircle2,
    AlertTriangle, DollarSign, Cloud, Cpu, Plus, X, MonitorPlay, Sparkles,
    Search, Filter, ChevronRight, Layers, Brain
} from 'lucide-react';
import { CyberGrid } from '../components/CyberGrid';
import { NasTournament, ProviderQuota, ModelCandidate } from '../types';
import {
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis,
    Tooltip, Legend, CartesianGrid, AreaChart, Area
} from 'recharts';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useSuperIntelligence } from '../context/SuperIntelligenceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { api } from '../services/api';

const NasView: React.FC = () => {
    const toast = useToast();
    const { isActive: isGodMode, stage: godStage, currentScenario } = useSuperIntelligence();

    const [activeTab, setActiveTab] = useState<'ARENA' | 'LEADERBOARD' | 'DATASETS' | 'PROVIDERS'>('ARENA');
    const [tournaments, setTournaments] = useState<NasTournament[]>([]);
    const [providers, setProviders] = useState<any[]>([]);
    const [models, setModels] = useState<ModelCandidate[]>([]);
    const [dataCatalog, setDataCatalog] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [candidatesData, setCandidatesData] = useState<any[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tData, pData, mData, cData] = await Promise.all([
                api.getNasTournaments(),
                api.getNasProviders(),
                api.getNasModels(),
                api.getDataCatalog()
            ]);

            // Handle backend snake_case to frontend camelCase if needed
            const mappedTournaments = tData.map((t: any) => ({
                ...t,
                currentGeneration: t.current_generation || t.currentGeneration,
                maxGenerations: t.max_generations || t.maxGenerations,
                candidatesCount: t.candidates_count || t.candidatesCount,
                bestScore: t.best_score || t.bestScore,
                startTime: t.start_time || t.startTime
            }));

            const mappedModels = mData.map((m: any) => ({
                ...m,
                tournamentId: m.tournament_id || m.tournamentId
            }));

            setTournaments(mappedTournaments);
            setProviders(pData);
            setModels(mappedModels);
            setDataCatalog(cData);

            setCandidatesData(mappedModels.filter((m: any) => m.status === 'COMPLETED').map((m: any) => ({
                x: m.metrics.latency,
                y: m.metrics.accuracy * 100,
                z: m.metrics.params / 1000000,
                name: m.architecture,
                generation: m.generation
            })));

        } catch (e) {
            console.error("Failed to fetch NAS data", e);
            toast.error("Помилка", "Не вдалося отримати дані NAS");
        } finally {
            setIsLoading(false);
        }
    };

    // Create Tournament Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTournament, setNewTournament] = useState({ name: '', dataset: '', strategy: 'EVOLUTIONARY' });

    const isMounted = useRef(false);

    // --- SYNC WITH GOD MODE ---
    useEffect(() => {
        if (isGodMode && godStage === 'NAS_IMPLEMENTATION' && currentScenario) {
            const godId = `god-${currentScenario.id}`;
            setTournaments(prev => {
                if (prev.some(t => t.id === godId)) return prev;

                const godTournament: NasTournament = {
                    id: godId,
                    topicId: 'GOD_MODE',
                    name: `⚡ ${currentScenario.name} (Auto-Fix)`,
                    datasetId: 'live_system_metrics',
                    strategy: 'DARTS',
                    status: 'RUNNING',
                    currentGeneration: 1,
                    maxGenerations: 5,
                    candidatesCount: 0,
                    bestScore: 0,
                    startTime: 'NOW',
                    duration: 'Running...'
                };
                return [godTournament, ...prev];
            });
        }
    }, [isGodMode, godStage, currentScenario]);

    useEffect(() => {
        isMounted.current = true;
        fetchData();

        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleCreate = async () => {
        setIsCreateOpen(false);
        try {
            const result = await api.startEvolutionCycle({
                name: newTournament.name,
                dataset_id: newTournament.dataset,
                strategy: newTournament.strategy
            });
            toast.success('Турнір Створено', `NAS запущено. ID: ${result.tournament_id}`);

            // Refresh list
            fetchData();
        } catch (e) {
            console.error("Failed to start NAS", e);
            toast.error("Помилка", "Не вдалося запустити NAS цикл");
        }
    };

    const renderArena = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            <div className="lg:col-span-2 space-y-6">
                <TacticalCard variant="holographic"
                    title="Межа Парето (Точність vs Затримка)"
                    className="h-[430px] panel-3d border-slate-700/50 glass-morphism overflow-hidden relative"
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
                                group relative overflow-hidden rounded-3xl border transition-all duration-500 p-6
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
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-slate-800 overflow-hidden">
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
                <TacticalCard variant="holographic" title="Потік Навчання НАЖИВО" className="h-[640px] flex flex-col panel-3d glass-morphism p-0 overflow-hidden" noPadding>
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
                                    className={`p-4 border rounded-2xl flex items-center justify-between group transition-all backdrop-blur-md relative overflow-hidden ${m.status === 'TRAINING'
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

    const renderProviders = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 gap-6"
        >
            <TacticalCard variant="holographic" title="Роутер AI Провайдерів (Квоти Ресурсів)" className="panel-3d glass-morphism" icon={<Cloud size={16} />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {providers.map(p => {
                        const usagePercent = p.currentLoad ?? 0;
                        const isEnabled = p.enabled !== false;

                        return (
                            <motion.div
                                key={p.id}
                                whileHover={{ y: -5 }}
                                className={`p-5 rounded-xl border relative overflow-hidden group transition-all duration-300 ${!isEnabled ? 'grayscale opacity-50 bg-slate-900/20 border-slate-800' :
                                        usagePercent > 85 ? 'bg-yellow-900/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' :
                                            'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-5 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl group-hover:border-slate-600 transition-colors">
                                            {p.id === 'google' || p.id === 'gemini' ? <span className="font-bold text-lg text-blue-500">G</span> :
                                                p.id === 'openai' ? <span className="font-bold text-lg text-emerald-500">O</span> :
                                                    p.id === 'groq' ? <span className="font-bold text-lg text-orange-500">Q</span> :
                                                        p.id === 'anthropic' ? <span className="font-bold text-lg text-amber-600">A</span> :
                                                            <span className="font-bold text-lg text-slate-400">{p.name?.[0] || '?'}</span>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-100 group-hover:text-white transition-colors">{p.name || 'Unknown'}</h4>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{p.model || 'Default Model'}</div>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-tighter ${isEnabled ? 'bg-emerald-900/20 text-emerald-500 border-emerald-900/50' :
                                            'bg-slate-800 text-slate-500 border-slate-700'
                                        }`}>{isEnabled ? (p.free ? 'FREE' : 'SECURE') : 'DISABLED'}</span>
                                </div>

                                <div className="space-y-5 relative z-10">
                                    <div>
                                        <div className="flex justify-between text-[11px] text-slate-400 mb-2 font-mono">
                                            <span>Поточне навантаження</span>
                                            <span className="text-white">{usagePercent}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${usagePercent}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                className={`h-full relative ${usagePercent > 85 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                                        usagePercent > 60 ? 'bg-amber-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                                                            'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                                    }`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-slate-800/50 font-mono text-[10px]">
                                        <div className="flex flex-col">
                                            <span className="text-slate-600 uppercase mb-0.5">Доступні ключі</span>
                                            <span className="text-slate-300 font-bold">{p.api_keys?.length || (p.enabled ? 1 : 0)}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-slate-600 uppercase mb-0.5">Статус Ендпоінту</span>
                                            <span className={`font-bold ${isEnabled ? 'text-emerald-500' : 'text-red-500'}`}>{isEnabled ? 'ONLINE' : 'OFFLINE'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                                    <Zap size={80} className="text-white" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </TacticalCard>
        </motion.div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto relative z-10 min-h-screen">
            <AdvancedBackground />

            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Новий NAS Турнір"
                icon={<Trophy size={20} className="text-yellow-500 icon-3d-amber" />}
            >
                <div className="p-8 space-y-6 glass-morphism">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block pl-1">Назва Турніру</label>
                        <input
                            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                            value={newTournament.name}
                            onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                            placeholder="e.g. Sales Forecast Q4"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block pl-1">Датасет</label>
                        <select
                            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                            value={newTournament.dataset}
                            onChange={(e) => setNewTournament({ ...newTournament, dataset: e.target.value })}
                        >
                            <option value="">Оберіть датасет...</option>
                            {dataCatalog.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.classification?.sector || 'RAW'})</option>
                            ))}
                            {dataCatalog.length === 0 && (
                                <>
                                    <option value="swift_transactions">SWIFT Transactions (Clean)</option>
                                    <option value="prozorro_tenders">Prozorro Tenders 2023</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block pl-1 mb-1">Стратегія Пошуку</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['EVOLUTIONARY', 'REINFORCEMENT', 'DARTS', 'GRID_SEARCH'].map(s => (
                                <motion.button
                                    key={s}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setNewTournament({ ...newTournament, strategy: s })}
                                    className={`p-3 rounded-xl border text-[10px] font-bold transition-all uppercase tracking-wider ${newTournament.strategy === s
                                            ? 'bg-blue-900/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                        }`}
                                >
                                    {s.replace('_', ' ')}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t border-slate-800">
                        <button
                            onClick={handleCreate}
                            disabled={!newTournament.name || !newTournament.dataset}
                            className={`
                                px-8 py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all btn-3d
                                ${!newTournament.name || !newTournament.dataset
                                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-500/20'}
                            `}
                        >
                            Запустити NAS
                        </button>
                    </div>
                </div>
            </Modal>

            <ViewHeader
                title="Оркестратор NAS та AutoML"
                icon={<Trophy size={20} className="icon-3d-amber" />}
                breadcrumbs={['ІНТЕЛЕКТ', 'NAS ТУРНІР']}
                stats={[
                    { label: 'Активна Арена', value: String(tournaments.filter(t => t.status === 'RUNNING').length), icon: <Activity size={14} />, color: 'success', animate: true },
                    { label: 'Години GPU', value: '1,420h', icon: <Cpu size={14} />, color: 'primary' },
                    { label: 'AI Важіль', value: '88%', icon: <Zap size={14} />, color: 'success' },
                ]}
                actions={
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all btn-3d"
                    >
                        <Plus size={18} /> Новий Турнір
                    </button>
                }
            />

            {/* Tabs Navigation */}
            <div className="flex p-1.5 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-x-auto scrollbar-hide relative">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-20"></div>

                {[
                    { id: 'ARENA', label: 'Активна Арена', icon: <Trophy size={16} />, color: 'blue' },
                    { id: 'LEADERBOARD', label: 'Таблиця Лідерів', icon: <BarChart3 size={16} />, color: 'amber' },
                    { id: 'PROVIDERS', label: 'Провайдери', icon: <Cloud size={16} />, color: 'emerald' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex-1 min-w-[140px] py-3 px-4 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2.5 relative z-10
                            ${activeTab === tab.id
                                ? 'bg-slate-800 text-white shadow-lg border border-white/5'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}
                        `}
                    >
                        {React.cloneElement(tab.icon as React.ReactElement, {
                            className: activeTab === tab.id ?
                                (tab.color === 'blue' ? 'text-blue-400' : tab.color === 'amber' ? 'text-amber-400' : 'text-emerald-400')
                                : 'text-slate-600'
                        })}
                        <span className="uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabGlow"
                                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full blur-[2px] ${tab.color === 'blue' ? 'bg-blue-500' : tab.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        {activeTab === 'ARENA' && renderArena()}
                        {activeTab === 'PROVIDERS' && renderProviders()}
                        {activeTab === 'LEADERBOARD' && (
                            <div className="space-y-6">
                                <ViewHeader
                                    title="Реєстр Чемпіонів SOTA"
                                    icon={<Trophy size={20} className="icon-3d-amber" />}
                                    breadcrumbs={['ІНТЕЛЕКТ', 'NAS', 'РЕЄСТР SOTA']}
                                    stats={[
                                        { label: 'Підтверджено SOTA', value: '12', color: 'primary' },
                                        { label: 'Середня Точність', value: '94.2%', color: 'success' }
                                    ]}
                                />
                                <TacticalCard variant="holographic" title="Архитектурна Еліта (Зала Слави)" className="bg-slate-900/40 border-white/5">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-separate border-spacing-y-3">
                                            <thead>
                                                <tr className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
                                                    <th className="px-6 py-2">Ранг</th>
                                                    <th className="px-6 py-2">Архітектура</th>
                                                    <th className="px-6 py-2">Точність</th>
                                                    <th className="px-6 py-2">Затримка</th>
                                                    <th className="px-6 py-2">Сектор</th>
                                                    <th className="px-6 py-2">Статус</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {models
                                                    .sort((a, b) => b.metrics.accuracy - a.metrics.accuracy)
                                                    .slice(0, 10)
                                                    .map((m, idx) => (
                                                        <tr key={m.id} className="bg-black/40 hover:bg-white/5 transition-colors group">
                                                            <td className="px-6 py-4 rounded-l-2xl border-l border-t border-b border-white/5">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-500 text-white shadow-[0_0_10px_#f59e0b]' : 'bg-slate-800 text-slate-400'
                                                                    }`}>
                                                                    {idx + 1}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 border-t border-b border-white/5">
                                                                <div className="text-xs font-black text-white uppercase tracking-wider">{m.architecture}</div>
                                                                <div className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-tighter">Перевірено на {m.provider}</div>
                                                            </td>
                                                            <td className="px-6 py-4 border-t border-b border-white/5">
                                                                <span className="text-sm font-black text-emerald-400 font-mono">{(m.metrics.accuracy * 100).toFixed(1)}%</span>
                                                            </td>
                                                            <td className="px-6 py-4 border-t border-b border-white/5 text-slate-400 font-mono text-xs">
                                                                {m.metrics.latency.toFixed(0)}ms
                                                            </td>
                                                            <td className="px-6 py-4 border-t border-b border-white/5">
                                                                <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-black border border-blue-500/20">NAS</span>
                                                            </td>
                                                            <td className="px-6 py-4 rounded-r-2xl border-r border-t border-b border-white/5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'DEPLOYED' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{m.status}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {models.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-xs font-mono">
                                                            Реєстр порожній. Розпочніть турнір для генерації SOTA кандидатів.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TacticalCard>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NasView;
