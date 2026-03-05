/**
 * Predator v55 | Cybernetic Oversight Citadel — Моніторинг Систем
 * Єдиний центр оперативного управління, телеметрії та діагностики.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Activity,
    BarChart3,
    Eye,
    CheckCircle2,
    XCircle,
    Search,
    GitCommit,
    Server,
    HardDrive,
    Cpu,
    Bot,
    Target,
    Network,
    Play,
    Pause,
    RefreshCw,
    Layers,
    ArrowRight,
    RotateCcw,
    Clock,
    Database,
    Brain,
    Zap,
    Code,
    AlertTriangle,
    ShieldCheck,
    Flame,
    Terminal,
    Monitor,
    Radio,
    Shield,
    ChevronRight,
    SearchCode,
    LayoutDashboard,
    Gauge,
    Boxes,
    Globe,
    LineChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { CyberOrb } from '../components/CyberOrb';
import { HoloContainer } from '../components/HoloContainer';
import { StatusIndicator } from '../components/StatusIndicator';
import { Skeleton } from '../components/ui/Skeleton';
import { JobQueueMonitor } from '../components/JobQueueMonitor';
import { LLMHealthMonitor } from '../components/LLMHealthMonitor';
import { StorageAnalytics } from '../components/StorageAnalytics';
import { ETLPipelineVisualizer } from '../components/ETLPipelineVisualizer';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { api } from '../services/api';
import { SagaTransaction } from '../types';
import { useUser } from '../context/UserContext';
import { useShell, UIShell } from '../context/ShellContext';
import { useOmniscienceWS } from '../hooks/useOmniscienceWS';
import { PageTransition } from '../components/layout/PageTransition';
import { premiumLocales } from '../locales/uk/premium';
import { AnalyticsDashboard } from '../components/premium/AnalyticsDashboard';

// --- LOCALES ---
const localLocales = {
    title: 'ЦИТАДЕЛЬ КІБЕРНЕТИЧНОГО НАГЛЯДУ',
    subtitle: 'Пряма телеметрія Sovereign Core V55 // Оперативне управління',
    stats: {
        health: 'Статус Платформи',
        incidents: 'Активні Інциденти',
        sync: 'Синхронізація Шини',
        latency: 'Мережева Затримка',
    },
    tabs: {
        metrics: 'ТЕЛЕМЕТРІЯ',
        logs: 'ТЕРМІНАЛ ЛОГІВ',
        saga: 'SAGA ТРАНЗАКЦІЇ',
        jobs: 'ЧЕРГА ETL',
        neural: 'НЕЙРОННІ ТРЕЙСИ',
        llm: 'AI HEALTH',
        storage: 'АНАЛІТИКА СХОВИЩ',
        analytics: 'БІЗНЕС АНАЛІТИКА'
    },
    sections: {
        telemetry: 'ОСНОВНА ТЕЛЕМЕТРІЯ ВУЗЛІВ',
        anomaly: 'ВЕКТОРНИЙ АНАЛІЗ АНОМАЛІЙ',
        heartbeat: 'ПУЛЬС СИСТЕМИ PREDATOR',
        network: 'ЧЕРГИ МЕРЕЖЕВОЇ ШИНИ',
        topology: 'ТОПОЛОГІЯ K3S КЛАСТЕРА',
        terminal: 'ТЕРМІНАЛ ЛОГІВ LOKI',
        traces: 'ВІЗУАЛІЗАЦІЯ НЕЙРОННОГО ШЛЯХУ',
        sagas: 'РЕЄСТР SAGA-ТРАНЗАКЦІЙ'
    },
    status: {
        optimal: 'ОПТИМАЛЬНО',
        warning: 'УВАГА',
        critical: 'КРИТИЧНО',
        active: 'АКТИВНО',
        paused: 'ПАУЗА',
        sync: 'СИНХРОНІЗОВАНО'
    }
};

interface MonClusterPod {
    name: string;
    status: string;
    cpu: number | string;
}

interface MonClusterNode {
    name: string;
    status: string;
    cpuUsage?: number | string;
    pods?: MonClusterPod[];
}

interface MonClusterStatus {
    status: string;
    nodes: MonClusterNode[];
    pods: MonClusterPod[];
}

interface GraphDataNode {
    name: string;
    category: number;
    symbolSize: number;
    itemStyle: { color: string; shadowBlur?: number; shadowColor?: string };
    data: { category: string; status: string; cpu?: string; latency?: number | string };
}

interface GraphDataLink {
    source: string;
    target: string;
}

type MonTab = 'METRICS' | 'LOGS' | 'SAGA' | 'ANALYTICS' | 'JOBS' | 'LLM' | 'STORAGE' | 'NEURAL';

const MonitoringView: React.FC = () => {
    const { user } = useUser();
    const { currentShell } = useShell();
    const metrics = useSystemMetrics();
    const [activeTab, setActiveTab] = useState<MonTab>('METRICS');

    const isCommanderShell = currentShell === UIShell.COMMANDER;
    const isOperatorShell = currentShell === UIShell.OPERATOR;

    const themeColor = isCommanderShell ? '#f59e0b' : isOperatorShell ? '#10b981' : '#3b82f6';
    const [logSearch, setLogSearch] = useState('');
    const [logs, setLogs] = useState<any[]>([]);
    const [graphData, setGraphData] = useState<{ nodes: GraphDataNode[], links: GraphDataLink[] }>({ nodes: [], links: [] });
    const [anomalyScore, setAnomalyScore] = useState(0.02);
    const [isLiveTail, setIsLiveTail] = useState(true);
    const [loading, setLoading] = useState(true);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(false);
    const [resourceData, setResourceData] = useState<any[]>([]);
    const [queues, setQueues] = useState<any[]>([]);
    const [realMetrics, setRealMetrics] = useState<any>(null);
    const [realAlerts, setRealAlerts] = useState<any[]>([]);

    // Saga State
    const [realSagas, setRealSagas] = useState<SagaTransaction[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [selectedAudit, setSelectedAudit] = useState<any>(null);
    const [selectedSaga, setSelectedSaga] = useState<SagaTransaction | null>(null);

    const { data: wsData, isConnected: isWSConnected } = useOmniscienceWS();

    useEffect(() => {
        if (wsData) {
            setLoading(false);
            if (wsData.sagas && wsData.sagas.length > 0) {
                setRealSagas(wsData.sagas);
                if (!selectedSaga) setSelectedSaga(wsData.sagas[0]);
            }
            if (wsData.audit_logs && wsData.audit_logs.length > 0) {
                setAuditLogs(wsData.audit_logs);
                if (!selectedAudit) setSelectedAudit(wsData.audit_logs[0]);
            }
            if (wsData.pulse) {
                setAnomalyScore(1 - (wsData.pulse.score / 100));
                if (wsData.pulse.alerts && wsData.pulse.alerts.length > 0) {
                    setRealAlerts(wsData.pulse.alerts);
                }
            }
            if (wsData.system) {
                setRealMetrics(wsData.system);
                setResourceData(prev => [
                    ...prev.slice(1),
                    {
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        cpu: wsData.system.cpu_percent,
                        memory: wsData.system.memory_percent,
                    }
                ]);
            }
        }
    }, [wsData]);

    useEffect(() => {
        isMounted.current = true;
        const fetchInitialData = async () => {
            try {
                if (!realMetrics) setLoading(true);

                // Alerts & Cluster
                const [alerts, clusterResponse, qData, hData] = await Promise.all([
                    api.v45.getLiveAlerts().catch(() => []),
                    api.getClusterStatus(),
                    api.v45.getLiveQueues().catch(() => []),
                    api.v45.getLiveHealth().catch(() => null)
                ]);

                if (!isMounted.current) return;

                setRealAlerts(alerts);
                setQueues(qData);
                if (hData) {
                    setRealMetrics(hData);
                    const score = hData.anomaly_score !== undefined
                        ? hData.anomaly_score
                        : (hData.cpu_load / 100 * 0.4) + (hData.memory_usage / 100 * 0.4);
                    setAnomalyScore(Math.min(score, 1.0));
                }

                const cluster: MonClusterStatus = clusterResponse as any;
                if (cluster?.nodes?.length > 0) {
                    const nodes: GraphDataNode[] = [];
                    const links: GraphDataLink[] = [];

                    cluster.nodes.forEach((node) => {
                        nodes.push({
                            name: node.name,
                            category: 0,
                            symbolSize: 40,
                            itemStyle: { color: themeColor, shadowBlur: 15, shadowColor: `${themeColor}66` },
                            data: { category: 'ВУЗОЛ', status: node.status, cpu: node.cpuUsage?.toString() }
                        });

                        if (node.pods) {
                            node.pods.forEach((pod) => {
                                nodes.push({
                                    name: pod.name,
                                    category: 1,
                                    symbolSize: 20,
                                    itemStyle: { color: '#10b981' },
                                    data: { category: 'ПОД', status: pod.status, cpu: pod.cpu?.toString() }
                                });
                                links.push({ source: node.name, target: pod.name });
                            });
                        }
                    });
                    setGraphData({ nodes, links });
                }
            } catch (e) {
                console.error("Failed to load metrics", e);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        fetchInitialData();
        const interval = setInterval(fetchInitialData, 10000);
        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, [themeColor]);

    useEffect(() => {
        let interval: any;
        if (isLiveTail && activeTab === 'LOGS') {
            const fetchLogs = async () => {
                try {
                    const newLogs = await api.streamSystemLogs();
                    if (isMounted.current) {
                        setLogs(prev => [...newLogs, ...prev.slice(0, 49)]);
                    }
                } catch (e) { /* ignore */ }
            };
            interval = setInterval(fetchLogs, 2000);
        }
        return () => clearInterval(interval);
    }, [isLiveTail, activeTab]);

    const renderNeuralTrace = () => (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-v55-in">
            <div className="lg:col-span-1 space-y-6">
                <TacticalCard
                    variant="holographic"
                    title={localLocales.sections.traces}
                    icon={<Brain className="text-indigo-400" />}
                    className="min-h-[700px] bg-slate-950/40"
                >
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {auditLogs.length > 0 ? auditLogs.map((log, idx) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={log.id}
                                onClick={() => setSelectedAudit(log)}
                                className={cn(
                                    "p-5 rounded-[24px] cursor-pointer transition-all duration-300 border relative overflow-hidden group mb-3",
                                    selectedAudit?.id === log.id
                                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.15)]'
                                        : 'bg-black/40 border-white/5 hover:border-white/20'
                                )}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest truncate">
                                        {log.intent || "CORE_INTENT"}
                                    </h4>
                                    <StatusIndicator status={log.status === 'verified' ? 'success' : 'warning'} label={log.status} size="sm" />
                                </div>
                                <p className="text-[9px] text-slate-500 line-clamp-2 italic mb-3 font-mono">
                                    "{log.request_text}"
                                </p>
                                <div className="flex justify-between items-center text-[7px] font-black font-mono text-slate-600 uppercase tracking-widest pt-3 border-t border-white/5">
                                    <span className="flex items-center gap-1.5"><Clock size={10} /> {new Date(log.created_at).toLocaleTimeString()}</span>
                                    <span className={cn(log.risk_level === 'high' ? 'text-rose-500' : 'text-slate-400')}>RISK: {log.risk_level}</span>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <Brain size={48} className="text-indigo-500" />
                                <p className="mt-4 text-[9px] font-black uppercase tracking-widest">No Neural Activity</p>
                            </div>
                        )}
                    </div>
                </TacticalCard>
            </div>

            <div className="lg:col-span-3">
                <TacticalCard
                    variant="holographic"
                    title="ВІЗУАЛІЗАЦІЯ НЕЙРОННОГО ШЛЯХУ"
                    glow="blue"
                    className="min-h-[700px] bg-slate-950/20"
                >
                    {selectedAudit ? (
                        <div className="h-full flex flex-col p-8 space-y-10">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-8 p-6 bg-indigo-600/5 rounded-[32px] border border-indigo-500/20 relative overflow-hidden"
                            >
                                <div className="p-5 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
                                    <Brain size={40} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">{selectedAudit.intent}</h3>
                                    <div className="flex items-center gap-6">
                                        <p className="text-[10px] text-slate-500 font-mono">UUID: <span className="text-indigo-400">{selectedAudit.id}</span></p>
                                        <p className="text-[10px] text-slate-500 font-mono">LATENCY: <span className="text-emerald-400 font-black">{selectedAudit.execution_time_ms}ms</span></p>
                                    </div>
                                </div>
                                <CyberOrb size={60} color="indigo" intensity="medium" />
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-10">
                                    <div className="relative pl-10 border-l border-indigo-500/30 space-y-4">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 shadow-[0_0_10px_#6366f1]" />
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">GEMINI_COGNITIVE_PLAN</h4>
                                        <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-[11px] font-mono leading-relaxed text-slate-300 shadow-inner">
                                            {Array.isArray(selectedAudit.gemini_plan?.steps)
                                                ? selectedAudit.gemini_plan.steps.map((s: string, i: number) => (
                                                    <div key={i} className="mb-2 flex gap-3">
                                                        <span className="text-indigo-500">[{i + 1}]</span> {s}
                                                    </div>
                                                ))
                                                : selectedAudit.gemini_plan || "No steps extracted."
                                            }
                                        </div>
                                    </div>

                                    {selectedAudit.thinking_process && (
                                        <div className="relative pl-10 border-l border-amber-500/30 space-y-4">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-amber-500 shadow-[0_0_10px_#f59e0b]" />
                                            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">INNER_MONOLOGUE</h4>
                                            <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 italic text-[11px] text-amber-200/80 font-mono whitespace-pre-wrap">
                                                {selectedAudit.thinking_process}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-10">
                                    <div className="relative pl-10 border-l border-cyan-500/30 space-y-4">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">MISTRAL_SYNTHESIS_OUTPUT</h4>
                                        <div className="p-6 bg-cyan-900/10 rounded-2xl border border-cyan-500/10 font-mono text-[10px] text-cyan-100/90 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                            {selectedAudit.mistral_output || "No output generated."}
                                        </div>
                                    </div>

                                    <div className="relative pl-10 border-l border-emerald-500/30 space-y-4">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-emerald-500 shadow-[0_0_10px_#10b981]" />
                                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">SECURITY_CITADEL_AUDIT</h4>
                                        <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center justify-between">
                                            <p className="text-[10px] text-emerald-100/80 italic">Verified by Guardian-V55</p>
                                            <ShieldCheck className="text-emerald-400" size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Brain size={120} className="mb-6 animate-pulse text-indigo-500/40" />
                            <p className="text-[11px] font-black uppercase tracking-[0.4em]">Select Neural Trace to Visualize</p>
                        </div>
                    )}
                </TacticalCard>
            </div>
        </div>
    );

    const renderSagaViz = () => (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-v55-in">
            <div className="lg:col-span-1 space-y-6">
                <TacticalCard variant="holographic" title={localLocales.sections.sagas} icon={<Layers className="text-blue-400" />} className="min-h-[700px] bg-slate-950/40">
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {realSagas.length > 0 ? realSagas.map((saga) => (
                            <motion.div
                                whileHover={{ x: 8 }}
                                key={saga.id}
                                onClick={() => setSelectedSaga(saga)}
                                className={cn(
                                    "p-5 rounded-[24px] cursor-pointer transition-all border group mb-3",
                                    selectedSaga?.id === saga.id
                                        ? 'bg-blue-600/10 border-blue-500/50 shadow-lg'
                                        : 'bg-black/40 border-white/5 hover:border-white/20'
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{saga.name}</h4>
                                        <p className="text-[8px] text-slate-500 mt-1 font-mono">ID: {saga.id.substring(0, 12)}</p>
                                    </div>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest",
                                        saga.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                    )}>
                                        {saga.status}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[7px] font-black font-mono text-slate-600 border-t border-white/5 pt-3">
                                    <span className="flex items-center gap-1.5"><Clock size={10} /> {saga.startTime}</span>
                                    <span>V45.SAGA</span>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <Layers size={48} className="text-blue-500" />
                                <p className="mt-4 text-[9px] font-black uppercase tracking-widest">No Saga Activity</p>
                            </div>
                        )}
                    </div>
                </TacticalCard>
            </div>

            <div className="lg:col-span-3">
                <TacticalCard variant="holographic" title="ПОТІК ТРАНЗАКЦІЙ" glow="cyan" className="min-h-[700px] bg-slate-950/20">
                    {selectedSaga ? (
                        <div className="p-8 h-full flex flex-col">
                            <div className="flex items-center gap-6 mb-12 p-6 bg-blue-600/5 rounded-3xl border border-blue-500/20">
                                <div className="p-4 bg-blue-600/20 rounded-2xl text-blue-400">
                                    <Layers size={32} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{selectedSaga.name}</h3>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-widest">TRACE_ID: {selectedSaga.traceId}</p>
                                </div>
                                <StatusIndicator status="success" label="SYNCHRONIZED" size="sm" />
                            </div>

                            <div className="relative pl-16 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-slate-800" />
                                {selectedSaga.steps.map((step, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={step.id}
                                        className="relative flex gap-8 items-center group"
                                    >
                                        <div className={cn(
                                            "w-14 h-14 rounded-full border-2 flex items-center justify-center bg-slate-950 z-10 transition-all",
                                            step.status === 'COMPLETED' ? 'border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                                                step.status === 'FAILED' ? 'border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' :
                                                    'border-slate-800 text-slate-600'
                                        )}>
                                            {step.status === 'COMPLETED' ? <CheckCircle2 size={24} /> :
                                                step.status === 'FAILED' ? <XCircle size={24} /> : <Clock size={24} />}
                                        </div>
                                        <div className="flex-1 p-6 bg-slate-900/40 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all shadow-inner">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{step.service}</span>
                                                <span className="text-[9px] font-mono text-slate-500">{step.logs || '12.4ms'}</span>
                                            </div>
                                            <div className="text-[11px] text-white/90 font-mono">
                                                ACTION: {step.action}
                                            </div>
                                            {step.status === 'COMPENSATED' && (
                                                <div className="mt-4 pt-4 border-t border-amber-500/20 text-[9px] text-amber-500 font-black uppercase">
                                                    COMPENSATED: {step.compensatingAction}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Layers size={100} className="mb-6 text-blue-500/40" />
                            <p className="text-[11px] font-black uppercase tracking-[0.4em]">Select Distributed Transaction</p>
                        </div>
                    )}
                </TacticalCard>
            </div>
        </div>
    );

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-32">
                {/* Background FX Citdal */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)]" />
                    <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/5 blur-[200px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-blue-500/5 blur-[250px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-8 space-y-8">
                    {/* Header Citdal */}
                    <ViewHeader
                        title={localLocales.title}
                        icon={<ShieldCheck size={28} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />}
                        breadcrumbs={['ЦИТАДЕЛЬ', 'МОНІТОРИНГ', 'ТЕЛЕМЕТРІЯ']}
                        stats={[
                            { label: localLocales.stats.health, value: localLocales.status.optimal, color: 'success', icon: <Activity size={14} />, animate: true },
                            { label: localLocales.stats.incidents, value: realAlerts.length.toString(), color: realAlerts.length > 0 ? 'warning' : 'primary', icon: <AlertTriangle size={14} /> },
                            { label: localLocales.stats.sync, value: localLocales.status.sync, color: 'cyan', icon: <RefreshCw size={14} /> }
                        ]}
                    />

                    {/* V55 Tab Switcher */}
                    <div className="flex gap-2 p-2 bg-slate-900/40 rounded-[32px] border border-white/5 backdrop-blur-3xl max-w-fit overflow-x-auto scrollbar-hide shadow-xl">
                        {(['METRICS', 'LOGS', 'SAGA', 'JOBS', 'NEURAL', 'LLM', 'STORAGE', 'ANALYTICS'] as MonTab[]).map((tab) => {
                            if (!isOperatorShell && !isCommanderShell && tab !== 'METRICS') return null;
                            const isActive = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-6 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-3 whitespace-nowrap",
                                        isActive ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)]" : "text-slate-500 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {tab === 'METRICS' && <Gauge size={14} />}
                                    {tab === 'LOGS' && <Terminal size={14} />}
                                    {tab === 'SAGA' && <Layers size={14} />}
                                    {tab === 'JOBS' && <Zap size={14} />}
                                    {tab === 'NEURAL' && <Brain size={14} />}
                                    {tab === 'LLM' && <Bot size={14} />}
                                    {tab === 'STORAGE' && <Database size={14} />}
                                    {tab === 'ANALYTICS' && <LineChart size={14} />}
                                    {localLocales.tabs[tab.toLowerCase() as keyof typeof localLocales.tabs]}
                                    {isActive && <motion.div layoutId="tabMarker" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full" />}
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, scale: 0.98, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -15 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {activeTab === 'METRICS' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-1 space-y-8">
                                        <TacticalCard variant="holographic" title={localLocales.sections.telemetry} icon={<Server />} className="bg-slate-950/40" noPadding>
                                            <div className="p-8 space-y-8">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-[28px] shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                                                            <Boxes size={36} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-black text-sm uppercase tracking-widest">K3S_CONTROL_PLANE</h4>
                                                            <p className="text-[10px] text-emerald-500 font-mono italic flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> SYSTEM_ONLINE
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/5 group hover:border-blue-500/30 transition-all shadow-inner">
                                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">CPU_LOAD</div>
                                                        <div className="text-4xl font-mono font-black text-blue-400 tracking-tighter">{realMetrics?.cpu_load?.toFixed(1) || '0.0'}%</div>
                                                        <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-blue-500"
                                                                animate={{ width: `${realMetrics?.cpu_load || 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/5 group hover:border-emerald-500/30 transition-all shadow-inner">
                                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">MEM_USED</div>
                                                        <div className="text-4xl font-mono font-black text-emerald-400 tracking-tighter">{realMetrics?.memory_usage?.toFixed(1) || '0.0'}%</div>
                                                        <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-emerald-500"
                                                                animate={{ width: `${realMetrics?.memory_usage || 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TacticalCard>

                                        <TacticalCard variant="holographic" title={localLocales.sections.anomaly} className="flex flex-col items-center justify-center p-10 bg-black/40 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
                                            <CyberOrb
                                                size={200}
                                                color={anomalyScore > 0.6 ? "#ef4444" : "#3b82f6"}
                                                intensity="high"
                                                pulse
                                            />
                                            <div className="absolute text-center mt-4 z-10">
                                                <div className={`text-6xl font-black font-mono tracking-tighter ${anomalyScore > 0.6 ? 'text-rose-500' : 'text-blue-400'} drop-shadow-2xl`}>
                                                    {(anomalyScore * 100).toFixed(1)}%
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 leading-none">ANOMALY_INDEX</div>
                                            </div>
                                        </TacticalCard>

                                        <TacticalCard variant="holographic" title={localLocales.sections.heartbeat} icon={<Zap />} glow="emerald">
                                            <div className="space-y-4 p-2">
                                                {wsData?.pulse?.reasons.map((r: string, i: number) => (
                                                    <div key={i} className="flex gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl animate-pulse">
                                                        <AlertTriangle size={18} className="text-rose-400" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest">{r}</span>
                                                            <span className="text-[8px] text-rose-500/60 font-mono">CODE: ERR_ANOMALY_V55</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!wsData?.pulse || wsData.pulse.reasons.length === 0) && (
                                                    <div className="flex gap-4 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl group hover:border-emerald-500/30 transition-all">
                                                        <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
                                                            <CheckCircle2 size={24} />
                                                        </div>
                                                        <div className="flex flex-col justify-center">
                                                            <span className="text-[11px] font-black text-emerald-100 uppercase tracking-widest">SYSTEM_PULSE_STABLE</span>
                                                            <span className="text-[9px] text-emerald-500/60 font-mono uppercase">All Core Processes Synchronized</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TacticalCard>
                                    </div>

                                    <div className="lg:col-span-2 space-y-8">
                                        <HoloContainer className="h-[550px] p-8">
                                            <div className="flex justify-between items-center mb-8">
                                                <div className="flex items-center gap-4">
                                                    <Activity className="text-primary-500" />
                                                    <h3 className="text-xl font-black text-white uppercase tracking-widest">LIVE_CORE_TELEMETRY_STREAM</h3>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CPU</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">MEM</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-[400px] w-full">
                                                <ReactECharts
                                                    option={{
                                                        backgroundColor: 'transparent',
                                                        grid: { left: '3%', right: '3%', bottom: '10%', top: '5%', containLabel: true },
                                                        xAxis: {
                                                            type: 'category',
                                                            data: resourceData.map(d => d.time),
                                                            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                                                            axisLabel: { color: '#475569', fontSize: 10, fontStyle: 'italic' }
                                                        },
                                                        yAxis: {
                                                            type: 'value',
                                                            max: 100,
                                                            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } },
                                                            axisLabel: { color: '#475569', fontSize: 10 }
                                                        },
                                                        series: [
                                                            {
                                                                name: 'CPU',
                                                                type: 'line',
                                                                smooth: 0.4,
                                                                showSymbol: false,
                                                                data: resourceData.map(d => d.cpu),
                                                                lineStyle: { width: 3, color: '#3b82f6' },
                                                                areaStyle: {
                                                                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                                                        { offset: 0, color: 'rgba(59, 130, 246, 0.15)' },
                                                                        { offset: 1, color: 'rgba(59, 130, 246, 0)' }
                                                                    ])
                                                                }
                                                            },
                                                            {
                                                                name: 'MEM',
                                                                type: 'line',
                                                                smooth: 0.4,
                                                                showSymbol: false,
                                                                data: resourceData.map(d => d.memory),
                                                                lineStyle: { width: 3, color: '#10b981' },
                                                                areaStyle: {
                                                                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                                                        { offset: 0, color: 'rgba(16, 185, 129, 0.15)' },
                                                                        { offset: 1, color: 'rgba(16, 185, 129, 0)' }
                                                                    ])
                                                                }
                                                            }
                                                        ]
                                                    }}
                                                    style={{ height: '100%', width: '100%' }}
                                                    theme="dark"
                                                />
                                            </div>
                                        </HoloContainer>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <TacticalCard variant="holographic" title={localLocales.sections.network} icon={<Network />} glow="blue">
                                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {queues.length > 0 ? queues.map((q, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-5 bg-slate-900/40 rounded-2xl border border-white/5 group hover:border-primary-500/30 transition-all shadow-inner">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "w-2.5 h-2.5 rounded-full shadow-[0_0_12px_currentColor]",
                                                                    q.messages > 100 ? 'text-amber-500 bg-amber-500' : 'text-emerald-500 bg-emerald-500'
                                                                )} />
                                                                <div>
                                                                    <div className="text-[11px] font-black text-white uppercase tracking-widest">{q.name}</div>
                                                                    <div className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">Consumers: {q.consumers} // V55_BUS</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xl font-black text-primary-400 font-mono leading-none">{q.messages}</div>
                                                                <div className="text-[7px] text-slate-600 font-black uppercase mt-1">Messages</div>
                                                            </div>
                                                        </div>
                                                    )) : <p className="text-center text-[10px] text-slate-600 py-10 uppercase font-black">Scanning Network Bus...</p>}
                                                </div>
                                            </TacticalCard>

                                            <TacticalCard variant="holographic" title={localLocales.sections.topology} icon={<Globe />} glow="emerald">
                                                <div className="h-[300px] w-full relative">
                                                    <ReactECharts
                                                        option={{
                                                            backgroundColor: 'transparent',
                                                            series: [{
                                                                type: 'graph',
                                                                layout: 'force',
                                                                force: { repulsion: 250, edgeLength: 70 },
                                                                data: graphData.nodes,
                                                                links: graphData.links,
                                                                label: { show: true, position: 'bottom', color: '#64748b', fontSize: 8, fontWeight: 'bold' },
                                                                lineStyle: { opacity: 0.15, curveness: 0.15, color: '#10b981' },
                                                                emphasis: { focus: 'adjacency', lineStyle: { width: 3, opacity: 1 } }
                                                            }]
                                                        }}
                                                        style={{ height: '100%', width: '100%' }}
                                                    />
                                                </div>
                                            </TacticalCard>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'LOGS' && (
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-v55-in">
                                    <div className="lg:col-span-3">
                                        <TacticalCard variant="holographic" title={localLocales.sections.terminal} icon={<Terminal />} className="h-[750px]" noPadding>
                                            <div className="flex flex-col h-full bg-slate-950/80">
                                                <div className="p-5 border-b border-white/5 bg-slate-900/40 flex items-center justify-between gap-6">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                                        <input
                                                            value={logSearch}
                                                            onChange={(e) => setLogSearch(e.target.value)}
                                                            placeholder='Loki filter: {container="predator-api"} |= "error"'
                                                            className="w-full bg-black/60 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[11px] font-mono text-slate-300 focus:border-primary-500/40 outline-none transition-all shadow-inner"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => setIsLiveTail(!isLiveTail)}
                                                            className={cn(
                                                                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3",
                                                                isLiveTail ? "bg-emerald-600 border-emerald-500 text-white shadow-[0_5px_15px_rgba(16,185,129,0.3)]" : "bg-slate-800 border-white/10 text-slate-500"
                                                            )}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${isLiveTail ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                                                            {isLiveTail ? localLocales.status.active : localLocales.status.paused}
                                                        </button>
                                                        <button className="p-3 bg-slate-800 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                                                            <RefreshCw size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2 bg-black/40">
                                                    {logs.map((log, idx) => (
                                                        <div key={idx} className="flex gap-6 hover:bg-white/5 p-2 rounded-xl transition-colors group">
                                                            <span className="text-slate-600 shrink-0 w-16">{log.ts}</span>
                                                            <span className={cn(
                                                                "shrink-0 w-12 text-center font-black rounded-lg px-2 py-0.5",
                                                                log.level === 'ERROR' ? 'bg-rose-500/20 text-rose-500' : log.level === 'WARN' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'
                                                            )}>{log.level}</span>
                                                            <span className="text-slate-500 shrink-0 w-40 truncate font-bold text-[9px] uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">[{log.service}]</span>
                                                            <span className="text-slate-300 flex-1 whitespace-pre-wrap leading-relaxed">{log.msg}</span>
                                                        </div>
                                                    ))}
                                                    <div ref={logsEndRef} />
                                                </div>
                                                <div className="p-4 bg-slate-900/40 border-t border-white/5 flex justify-between items-center px-8">
                                                    <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                        <Activity size={12} className="text-emerald-500" />
                                                        <span>Stream Status: Optimized</span>
                                                    </div>
                                                    <div className="text-[9px] font-mono text-slate-600">PREDATOR_CITADEL_TERMINAL_V55.4</div>
                                                </div>
                                            </div>
                                        </TacticalCard>
                                    </div>
                                    <div className="lg:col-span-2 space-y-8">
                                        <HoloContainer title="TEMPO_TRACE_ANALYSIS" className="h-[350px] p-8">
                                            <div className="space-y-6 h-full flex flex-col justify-center">
                                                {[
                                                    { name: 'Traefik_Ingress_v55', color: '#3b82f6', w: '25%', s: '0%' },
                                                    { name: 'Sovereign_API_v55', color: '#10b981', w: '55%', s: '20%' },
                                                    { name: 'Cognitive_Index_Search', color: '#a855f7', w: '35%', s: '45%' },
                                                    { name: 'Postgres_Sovereign_DB', color: '#f59e0b', w: '15%', s: '75%' }
                                                ].map((t, i) => (
                                                    <div key={i} className="relative">
                                                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2 px-1 tracking-widest">
                                                            <span>{t.name}</span>
                                                            <span className="font-mono text-emerald-400">{Math.floor(Math.random() * 150) + 50}ms</span>
                                                        </div>
                                                        <div className="h-2.5 bg-black/40 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: t.w, left: t.s }}
                                                                className="absolute h-full rounded-full shadow-[0_0_15px_currentColor]"
                                                                style={{ backgroundColor: t.color, color: t.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </HoloContainer>

                                        <TacticalCard variant="holographic" title="INCIDENT_ALERT_PROTOCOL" icon={<Shield />} glow="red" className="flex-1 min-h-[300px]">
                                            <div className="space-y-4">
                                                {realAlerts.length > 0 ? realAlerts.map((a, i) => (
                                                    <div key={i} className={cn(
                                                        "p-5 rounded-3xl border flex items-center justify-between transition-all hover:scale-[1.02]",
                                                        a.severity === 'critical' ? 'bg-rose-600/10 border-rose-500/30 text-rose-400' : 'bg-amber-600/10 border-amber-500/30 text-amber-400'
                                                    )}>
                                                        <div className="flex items-center gap-5">
                                                            <div className={cn("p-3 rounded-2xl", a.severity === 'critical' ? 'bg-rose-500/20' : 'bg-amber-500/20')}>
                                                                <AlertTriangle size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[11px] font-black uppercase tracking-wider">{a.message || "Priority Incident Detected"}</div>
                                                                <div className="text-[9px] font-mono opacity-60 mt-0.5 uppercase tracking-tighter">SOURCE: {a.source || "SYSTEM"} // ID: {a.id?.substring(0, 10) || "N/A"}</div>
                                                            </div>
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ rotate: 180 }}
                                                            className="p-2 border border-current rounded-xl opacity-40 hover:opacity-100 transition-opacity"
                                                        >
                                                            <RefreshCw size={14} />
                                                        </motion.button>
                                                    </div>
                                                )) : (
                                                    <div className="flex flex-col items-center justify-center py-16 opacity-20">
                                                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-500 flex items-center justify-center mb-6">
                                                            <ShieldCheck size={32} className="text-emerald-500" />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">All Protocols Secure</p>
                                                    </div>
                                                )}
                                            </div>
                                        </TacticalCard>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'SAGA' && renderSagaViz()}
                            {activeTab === 'NEURAL' && renderNeuralTrace()}

                            {activeTab === 'JOBS' && (
                                <div className="space-y-8 animate-v55-in">
                                    <JobQueueMonitor />
                                    <TacticalCard variant="holographic" title="ETL_PIPELINE_ORCHESTRATOR" icon={<RotateCcw />} glow="indigo" className="panel-3d">
                                        <ETLPipelineVisualizer />
                                    </TacticalCard>
                                </div>
                            )}

                            {activeTab === 'LLM' && (
                                <div className="animate-v55-in">
                                    <TacticalCard variant="holographic" title="LLM_INFRASTRUCTURE_HEALTH" icon={<Bot />} glow="blue">
                                        <LLMHealthMonitor />
                                    </TacticalCard>
                                </div>
                            )}

                            {activeTab === 'STORAGE' && (
                                <div className="animate-v55-in">
                                    <TacticalCard variant="holographic" title="STORAGE_CLUSTER_ANALYTICS" icon={<HardDrive />} glow="amber">
                                        <StorageAnalytics />
                                    </TacticalCard>
                                </div>
                            )}

                            {activeTab === 'ANALYTICS' && (
                                <div className="space-y-8 animate-v55-in">
                                    <AnalyticsDashboard />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes shimmer {
                        100% { transform: translateX(100%); }
                    }
                    .animate-shimmer {
                        animation: shimmer 2s infinite;
                    }
                    .panel-3d {
                        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .panel-3d:hover {
                        transform: translateY(-8px) scale(1.005);
                        box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.1);
                    }
                    .animate-v55-in {
                        animation: v55-in 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    @keyframes v55-in {
                        from { opacity: 0; transform: translateY(30px) scale(0.99); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 20px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.3); }
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                `}} />
            </div>
        </PageTransition>
    );
};

export default MonitoringView;
