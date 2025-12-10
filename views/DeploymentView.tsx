
import React, { useState, useEffect, useRef } from 'react';
import { ViewHeader } from '../components/ViewHeader';
import { Rocket, RefreshCw, GitBranch, Terminal, FileText, Activity, LayoutGrid, MonitorPlay, GitCommit, Play, AlertOctagon, Upload } from 'lucide-react';
import { LiveDeploymentColumn } from '../components/deployment/LiveDeploymentColumn';
import { DeploymentTimeline } from '../components/deployment/DeploymentTimeline';
import { EnvironmentCard } from '../components/deployment/EnvironmentCard';
import { PipelineTable } from '../components/deployment/PipelineTable';
import { PipelineDetailsModal } from '../components/deployment/PipelineDetailsModal';
import { DeployLogModal } from '../components/deployment/DeployLogModal';
import { api } from '../services/api';
import { DeploymentEnvironment, PipelineRun } from '../types';
import { useToast } from '../context/ToastContext'; // Import Toast

type DeployTab = 'OVERVIEW' | 'LIVE' | 'CICD';

const DeploymentView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<DeployTab>('OVERVIEW');
    const [envs, setEnvs] = useState<DeploymentEnvironment[]>([]);
    const [pipelines, setPipelines] = useState<PipelineRun[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

    // Modals
    const [selectedPipeline, setSelectedPipeline] = useState<PipelineRun | null>(null);
    const [logModalEnv, setLogModalEnv] = useState<string | null>(null);

    const toast = useToast(); // Use Toast
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        loadData();

        const interval = setInterval(() => {
            if (isMounted.current) {
                setLastUpdated(new Date().toLocaleTimeString());
                // In a real app, delta updates would happen here
            }
        }, 5000);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [envData, pipeData] = await Promise.all([
                api.getEnvironments(),
                api.getPipelines()
            ]);
            if (isMounted.current) {
                setEnvs(envData);
                setPipelines(pipeData);
            }
        } catch (e) {
            console.error(e);
            toast.error("Помилка Мережі", "Не вдалося завантажити статус розгортання.");
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    };

    const handleSync = async (id: string) => {
        // Optimistic update
        setEnvs(prev => prev.map(e => e.id === id ? { ...e, gitStatus: 'SYNCING' } : e));
        toast.info("Синхронізація", `Запуск ArgoCD для середовища ${id}...`);

        try {
            await api.syncEnvironment(id);
            setTimeout(() => {
                if (isMounted.current) {
                    setEnvs(prev => prev.map(e => e.id === id ? { ...e, gitStatus: 'SYNCED', lastSync: 'Щойно' } : e));
                    toast.success("Успіх", `Середовище ${id} синхронізовано.`);
                }
            }, 2000);
        } catch (e) {
            toast.error("Помилка", `Не вдалося синхронізувати ${id}.`);
        }
    };

    const handleRunPipeline = async () => {
        toast.info("Пайплайн Запущено", "Запуск повного multi-arch пайплайну збірки...");

        // Optimistic: Set all envs to Syncing to show the flow
        // Specifically identify the Oracle env to show slower syncing if needed
        setEnvs(prev => prev.map(e => ({ ...e, gitStatus: 'SYNCING', progress: 10 })));

        await api.triggerPipeline('FULL');

        // Refresh pipelines
        const newPipes = await api.getPipelines();
        if (isMounted.current) {
            setPipelines(newPipes);
            // Simulate progression
            setTimeout(() => {
                setEnvs(prev => prev.map(e => ({ ...e, gitStatus: 'SYNCED', progress: 100 })));
            }, 3000);
        }
    };

    const handleRollback = (id: string) => {
        toast.warning("Відкат Версії", `Ініційовано відкат до pipeline ${id}.`);
    };

    const handleSyncFromAI = () => {
        toast.success("AI Studio Sync", "Запущено скрипт синхронізації з AI Studio...");
        setTimeout(() => {
            handleRunPipeline();
        }, 1000);
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 w-full max-w-[1600px] mx-auto">

            <PipelineDetailsModal
                run={selectedPipeline}
                onClose={() => setSelectedPipeline(null)}
            />

            <DeployLogModal
                isOpen={!!logModalEnv}
                environmentName={logModalEnv || ''}
                onClose={() => setLogModalEnv(null)}
            />

            <ViewHeader
                title="Центр Розгортання (Deployment Hub)"
                icon={<Rocket size={20} className="icon-3d-blue" />}
                breadcrumbs={['СИСТЕМА', 'РОЗГОРТАННЯ', activeTab]}
                stats={[
                    { label: 'Статус Кластера', value: 'ГІБРИД', icon: <Activity size={14} />, color: 'success', animate: true },
                    { label: 'Реліз', value: 'v18.6.2', icon: <GitBranch size={14} />, color: 'primary' },
                    { label: 'Стан Синхронізації', value: 'GITOPS', icon: <RefreshCw size={14} />, color: 'default' },
                ]}
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={handleSyncFromAI}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold flex items-center gap-2 transition-all border border-slate-700 btn-3d"
                            title="Run sync_from_ai_studio.sh"
                        >
                            <CloudUpload size={14} /> Синхронізація з AI Studio
                        </button>
                        <button
                            onClick={handleRunPipeline}
                            className="px-4 py-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white rounded text-xs font-bold flex items-center gap-2 transition-all shadow-lg btn-3d btn-3d-blue"
                        >
                            <Play size={14} /> Запустити Пайплайн (Multi-Arch)
                        </button>
                    </div>
                }
            />

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/30 rounded-t overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'OVERVIEW' ? 'border-primary-500 text-primary-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <LayoutGrid size={16} /> Огляд (Overview)
                </button>
                <button
                    onClick={() => setActiveTab('LIVE')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'LIVE' ? 'border-green-500 text-green-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <MonitorPlay size={16} /> Живий Монітор
                </button>
                <button
                    onClick={() => setActiveTab('CICD')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'CICD' ? 'border-orange-500 text-orange-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <GitCommit size={16} /> GitHub Actions
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-96">
                    <RefreshCw size={32} className="animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="min-h-[500px]">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'OVERVIEW' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[300px]">
                                {envs.map(env => (
                                    <EnvironmentCard
                                        key={env.id}
                                        env={env}
                                        onSync={handleSync}
                                        onTest={(name) => setLogModalEnv(name)}
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 panel-3d">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-200 text-sm">Останній Реліз</h3>
                                        <span className="text-[10px] text-slate-500 font-mono">GHCR.IO/PREDATOR</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-900/20 rounded border border-blue-900/50 text-blue-400">
                                            <GitBranch size={24} />
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-white">v18.6.2</div>
                                            <div className="text-xs text-slate-400">fix: oracle arm64 build support (#445)</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <div className="flex-1 bg-slate-950 rounded p-2 text-center border border-slate-800">
                                            <div className="text-[10px] text-slate-500">Architecture</div>
                                            <div className="text-sm font-bold text-green-500">AMD64 + ARM64</div>
                                        </div>
                                        <div className="flex-1 bg-slate-950 rounded p-2 text-center border border-slate-800">
                                            <div className="text-[10px] text-slate-500">Build Time</div>
                                            <div className="text-sm font-bold text-blue-500">1m 20s</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 panel-3d">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-200 text-sm">GitOps Статус (ArgoCD)</h3>
                                        <span className="text-[10px] text-green-500 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/50">HEALTHY</span>
                                    </div>
                                    <div className="space-y-3">
                                        {envs.map((e) => (
                                            <div key={e.id} className="group">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400">{e.name}</span>
                                                    <span className={`font-bold ${e.gitStatus === 'SYNCED' ? 'text-green-500' : 'text-yellow-500 animate-pulse'}`}>{e.gitStatus}</span>
                                                </div>
                                                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
                                                    <div className={`h-full ${e.gitStatus === 'SYNCED' ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${e.gitStatus === 'SYNCED' ? 100 : 60}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LIVE TAB */}
                    {activeTab === 'LIVE' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                                {envs[0] && (
                                    <div className="h-full flex flex-col">
                                        <div className="text-center mb-2 text-blue-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_blue]"></span> Dev (Mac M3)
                                        </div>
                                        <LiveDeploymentColumn env={envs[0]} color="blue" />
                                    </div>
                                )}
                                {envs[1] && (
                                    <div className="h-full flex flex-col">
                                        <div className="text-center mb-2 text-green-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_lime] animate-pulse"></span> Prod (NVIDIA)
                                        </div>
                                        <LiveDeploymentColumn env={envs[1]} color="green" />
                                    </div>
                                )}
                                {envs[2] && (
                                    <div className="h-full flex flex-col">
                                        <div className="text-center mb-2 text-orange-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_5px_orange]"></span> Cloud (Oracle)
                                        </div>
                                        <LiveDeploymentColumn env={envs[2]} color="orange" />
                                    </div>
                                )}
                            </div>
                            <DeploymentTimeline />
                        </div>
                    )}

                    {/* CI/CD TAB */}
                    {activeTab === 'CICD' && (
                        <div className="animate-in fade-in duration-300">
                            <PipelineTable
                                pipelines={pipelines}
                                onSelect={setSelectedPipeline}
                                onRollback={handleRollback}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeploymentView;
