
import React, { useState, useEffect, useRef } from 'react';
import { ViewHeader } from '@/components/ViewHeader';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { CardSkeleton } from '@/components/Skeleton';
import {
  Rocket, RefreshCw, GitBranch, Terminal, FileText, Activity, LayoutGrid,
  MonitorPlay, GitCommit, Play, AlertOctagon, UploadCloud, Server, Database,
  Globe, ChevronRight, Zap, ShieldCheck
} from 'lucide-react';
import { LiveDeploymentColumn } from '@/components/deployment/LiveDeploymentColumn';
import { DeploymentTimeline } from '@/components/deployment/DeploymentTimeline';
import { EnvironmentCard } from '@/components/deployment/EnvironmentCard';
import { PipelineTable } from '@/components/deployment/PipelineTable';
import { PipelineDetailsModal } from '@/components/deployment/PipelineDetailsModal';
import { DeployLogModal } from '@/components/deployment/DeployLogModal';
import { api } from '@/services/api';
import { DeploymentEnvironment, PipelineRun } from '@/types';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

type DeployTab = 'OVERVIEW' | 'LIVE' | 'CICD';

const DeploymentView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<DeployTab>('OVERVIEW');
    const [envs, setEnvs] = useState<DeploymentEnvironment[]>([]);
    const [pipelines, setPipelines] = useState<PipelineRun[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

    const [selectedPipeline, setSelectedPipeline] = useState<PipelineRun | null>(null);
    const [logModalEnv, setLogModalEnv] = useState<string | null>(null);

    const toast = useToast();
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        loadData();
        const interval = setInterval(() => { if(isMounted.current) setLastUpdated(new Date().toLocaleTimeString()); }, 5000);
        return () => { isMounted.current = false; clearInterval(interval); };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [envData, pipeData] = await Promise.all([api.getEnvironments(), api.getPipelines()]);
            if (isMounted.current) { setEnvs(envData); setPipelines(pipeData); }
        } catch (e) { toast.error("Мережева помилка", "Не вдалося отримати статус деплою."); }
        finally { if (isMounted.current) setIsLoading(false); }
    };

    const handleSync = async (id: string) => {
        setEnvs(prev => prev.map(e => e.id === id ? { ...e, gitStatus: 'SYNCING' } : e));
        toast.info("GitOps Синхронізація", `Мобілізація оновлення для ${id}...`);
        try {
            await api.syncEnvironment(id);
            setTimeout(() => {
                if (isMounted.current) {
                    setEnvs(prev => prev.map(e => e.id === id ? { ...e, gitStatus: 'SYNCED', lastSync: 'Just now' } : e));
                     toast.success("Синхронізовано", `Кластер ${id} знаходиться у цільовому стані.`);
                }
            }, 2000);
        } catch (e) { toast.error("Помилка синхронізації", `Не вдалося стабілізувати ${id}.`); }
    };

    const handleRunPipeline = async () => {
        toast.info("Пайплайн Запущено", "Виконується багатоетапна послідовність збірки...");
        setEnvs(prev => prev.map(e => ({ ...e, gitStatus: 'SYNCING', progress: 10 })));
        await api.triggerPipeline('FULL');
        const newPipes = await api.getPipelines();
        if (isMounted.current) {
            setPipelines(newPipes);
            setTimeout(() => { if (isMounted.current) setEnvs(prev => prev.map(e => ({ ...e, gitStatus: 'SYNCED', progress: 100 }))); }, 3000);
        }
    };

    const handleSyncFromAI = () => {
        toast.success("AI Синхронізація Синтезу", "Синхронізація нейронних ваг з AI Studio...");
        setTimeout(() => handleRunPipeline(), 1000);
    };

    const tabConfig = [
        { id: 'OVERVIEW', label: 'Огляд Флоту', icon: LayoutGrid },
        { id: 'LIVE', label: 'Телеметричний Монітор', icon: MonitorPlay },
        { id: 'CICD', label: 'реєстр Пайплайнів', icon: GitCommit },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 w-full max-w-[1600px] mx-auto relative z-10">
            <PipelineDetailsModal run={selectedPipeline} onClose={() => setSelectedPipeline(null)} />
            <DeployLogModal isOpen={!!logModalEnv} environmentName={logModalEnv || ''} onClose={() => setLogModalEnv(null)} />

            <ViewHeader
                title="Командний Центр Деплою"
                icon={<Rocket size={20} className="icon-3d-blue"/>}
                breadcrumbs={['СИСТЕМА', 'ДЕПЛОЙ', 'КОНТ ОЛЬ']}
                stats={[
                    { label: 'Стан Флоту', value: 'ОПТИМАЛЬНО', icon: <ShieldCheck size={14}/>, color: 'success' },
                    { label: 'Версія', value: 'v45.0.0', icon: <GitBranch size={14}/>, color: 'primary' },
                    { label: 'Стратегія', value: 'GITOPS', icon: <Zap size={14}/>, color: 'success' },
                ]}
                actions={
                    <div className="flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.href = '#/evolution?tab=deployment'}
                            className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-3 transition-all"
                        >
                            <Rocket size={16} /> Автономний Деплой (AZR)
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handleSyncFromAI} className="px-5 py-2 bg-slate-900/50 border border-white/5 text-slate-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-3 transition-all"
                        >
                            <UploadCloud size={16} /> Нейронна Синхронізація
                        </motion.button>
                    </div>
                }
            />

            <div className="flex p-1 bg-slate-950/50 backdrop-blur-3xl border border-white/5 rounded-2xl overflow-x-auto scrollbar-hide">
                {tabConfig.map(tab => (
                    <button
                        key={tab.id} onClick={() => setActiveTab(tab.id as DeployTab)}
                        className={`
                            flex-1 min-w-[200px] py-4 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-4 relative overflow-hidden group
                            ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-2xl' : 'text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        <tab.icon size={16} />
                        <span className="uppercase tracking-[0.3em]">{tab.label}</span>
                        {activeTab === tab.id && <motion.div layoutId="deployTabGlow" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 blur-[1px]" />}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8"><CardSkeleton rows={4} /><CardSkeleton rows={4} /><CardSkeleton rows={4} /></div>
            ) : (
                <div className="min-h-[600px]">
                    <AnimatePresence mode="wait">
                    {activeTab === 'OVERVIEW' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key="overview" className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {envs.map((env, i) => (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.1 }} key={env.id}>
                                        <EnvironmentCard env={env} onSync={handleSync} onTest={(name) => setLogModalEnv(name)} />
                                    </motion.div>
                                ))}
                            </div>

                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <TacticalCard variant="holographic"  title="реєстр  елізів Ядра" className="glass-morphism panel-3d">
                                    <div className="flex items-center gap-8 p-4">
                                        <motion.div animate={{ rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="p-6 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-500 shadow-xl shadow-blue-500/5">
                                            <GitBranch size={48} />
                                        </motion.div>
                                        <div className="flex-1">
                                            <div className="text-4xl font-display font-bold text-white tracking-widest mb-1">v45.0.0</div>
                                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3 uppercase tracking-widest">
                                                <span className="text-emerald-500 font-bold">Стабільно</span>
                                                <ChevronRight size={10}/> Оптимізовано для ARM64-V45
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-8">
                                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-center">
                                            <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2 font-bold">Архітектура</div>
                                            <div className="text-xs font-bold text-blue-400 font-mono">ГІБ ИДНА К ОС-КОМПІЛЯЦІЯ</div>
                                        </div>
                                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-center">
                                            <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2 font-bold">Затримка</div>
                                            <div className="text-xs font-bold text-emerald-400 font-mono">1.2с ХОЛОДНИЙ СТА Т</div>
                                        </div>
                                    </div>
                                </TacticalCard>

                                <TacticalCard variant="holographic"  title="Узгодження GitOps" className="glass-morphism panel-3d" action={<span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase px-3 py-1 bg-emerald-500/10 rounded-lg">ЗДО ОВО</span>}>
                                    <div className="space-y-6 mt-4">
                                        {envs.map((e) => (
                                            <div key={e.id} className="group">
                                                <div className="flex justify-between items-center text-[10px] mb-3 px-1">
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest flex items-center gap-3">
                                                        {e.id === 'dev' ? <Terminal size={14} className="text-blue-500"/> : e.id === 'prod' ? <Globe size={14} className="text-emerald-500"/> : <Database size={14} className="text-amber-500"/>}
                                                        {e.name}
                                                    </span>
                                                    <span className={`font-mono font-bold tracking-widest ${e.gitStatus === 'SYNCED' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>{e.gitStatus}</span>
                                                </div>
                                                <div className="w-full bg-slate-900/50 h-1.5 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }} animate={{ width: `${e.gitStatus === 'SYNCED' ? 100 : 45}%` }}
                                                        className={`h-full transition-all duration-1000 ${e.gitStatus === 'SYNCED' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-amber-500'}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TacticalCard>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'LIVE' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} key="live" className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                                {envs.map((env, i) => (
                                    <div key={env.id} className="h-full flex flex-col">
                                        <div className="text-center mb-4 text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_lime]' : i === 0 ? 'bg-blue-500 shadow-[0_0_10px_blue]' : 'bg-amber-500 shadow-[0_0_10px_orange]'}`} />
                                            {env.name} Trace
                                        </div>
                                        <LiveDeploymentColumn env={env} color={i === 0 ? 'blue' : i === 1 ? 'green' : 'orange'} />
                                    </div>
                                ))}
                            </div>
                            <DeploymentTimeline />
                        </motion.div>
                    )}

                    {activeTab === 'CICD' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} key="cicd">
                            <PipelineTable pipelines={pipelines} onSelect={setSelectedPipeline} onRollback={() => {}} />
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default DeploymentView;
