import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Activity, Cpu, Zap, Plus, Server } from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { NasTournament, ModelCandidate } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useSuperIntelligence } from '@/hooks/useSuperIntelligence';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { api } from '@/services/api';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// Extracted Sub-views
import { NasArenaView } from '@/components/nas/NasArenaView';
import { NasProvidersView } from '@/components/nas/NasProvidersView';
import { NasLeaderboardView } from '@/components/nas/NasLeaderboardView';
import { NasCreateTournamentModal } from '@/components/nas/NasCreateTournamentModal';

const NasView: React.FC = () => {
    const { isOffline, nodeSource } = useBackendStatus();
    const toast = useToast();
    const { isActive: isGodMode, stage: godStage, currentScenario } = useSuperIntelligence();

    useEffect(() => {
        if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'NAS_Orchestrator',
                    message: 'ГЕНЕТИЧНИЙ АЛГО ИТМ ПЕ ЕКЛЮЧЕНО НА ЛОКАЛЬНИЙ ЕМУЛЯТО  (NAS_OFFLINE). Траєкторії еволюції можуть бути неточними.',
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'NAS_OFFLINE'
                }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'NAS_Orchestrator',
                    message: 'СИНХРОНІЗАЦІЯ З ЕВОЛЮЦІЙНИМ Г ІДОМ УСПІШНА (NAS_SUCCESS). Моделі SOTA доступні.',
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'NAS_SUCCESS'
                }
            }));
        }
    }, [isOffline]);

    const [activeTab, setActiveTab] = useState<'ARENA' | 'LEADERBOARD' | 'PROVIDERS'>('ARENA');
    const [tournaments, setTournaments] = useState<NasTournament[]>([]);
    const [providers, setProviders] = useState<any[]>([]);
    const [models, setModels] = useState<ModelCandidate[]>([]);
    const [dataCatalog, setDataCatalog] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [candidatesData, setCandidatesData] = useState<any[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tData, pData, mData, cData] = await Promise.all([
                api.getNasTournaments(),
                api.getNasProviders(),
                api.getNasModels(),
                api.getDataCatalog()
            ]);

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

    const handleCreateTournament = async (name: string, dataset: string, strategy: string) => {
        setIsCreateOpen(false);
        try {
            const result = await api.startEvolutionCycle({
                name,
                dataset_id: dataset,
                strategy
            });
            toast.success('Турнір Створено', `NAS запущено. ID: ${result.tournament_id}`);
            fetchData();
        } catch (e) {
            console.error("Failed to start NAS", e);
            toast.error("Помилка", "Не вдалося запустити NAS цикл");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto relative z-10 min-h-screen">
            <AdvancedBackground />

            <NasCreateTournamentModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onConfirm={handleCreateTournament}
                dataCatalog={dataCatalog}
            />

            <ViewHeader
                title="Оркестратор NAS та AutoML"
                icon={<Trophy size={20} className="icon-3d-amber" />}
                breadcrumbs={['ІНТЕЛЕКТ', 'NAS ТУ НІ ']}
                stats={[
                    { label: 'SOURCE', value: nodeSource, icon: <Server size={14} />, color: isOffline ? 'warning' : 'gold' },
                    { label: 'АКТИВНА А ЕНА', value: String(tournaments.filter(t => t.status === 'RUNNING').length), icon: <Activity size={14} />, color: 'success', animate: true },
                    { label: 'AI ВАЖІЛЬ', value: '88%', icon: <Zap size={14} />, color: 'success' },
                ]}
                actions={
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-rose-500/20 transition-all btn-3d"
                    >
                        <Plus size={18} /> Новий Турнір
                    </button>
                }
            />

            <div className="flex p-1.5 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-x-auto scrollbar-hide relative">
                {[
                    { id: 'ARENA', label: 'Активна Арена', icon: <Trophy size={16} />, color: 'blue' },
                    { id: 'LEADERBOARD', label: 'Таблиця Лідерів', icon: <Activity size={16} />, color: 'amber' }, // Replaced BarChart3 with Activity as it was missing from imports but used for color logic
                    { id: 'PROVIDERS', label: 'Провайдери', icon: <Cpu size={16} />, color: 'emerald' }, // Replaced Cloud with Cpu
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
                            size: 16,
                            className: activeTab === tab.id ?
                                (tab.color === 'blue' ? 'text-blue-400' : tab.color === 'amber' ? 'text-rose-400' : 'text-emerald-400')
                                : 'text-slate-600'
                        })}
                        <span className="uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabGlow"
                                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full blur-[2px] ${tab.color === 'blue' ? 'bg-blue-500' : tab.color === 'amber' ? 'bg-rose-500' : 'bg-emerald-500'
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
                        {activeTab === 'ARENA' && <NasArenaView tournaments={tournaments} candidatesData={candidatesData} models={models} />}
                        {activeTab === 'PROVIDERS' && <NasProvidersView providers={providers} />}
                        {activeTab === 'LEADERBOARD' && <NasLeaderboardView models={models} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NasView;
