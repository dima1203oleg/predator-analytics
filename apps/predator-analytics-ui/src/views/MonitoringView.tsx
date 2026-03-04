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
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { CyberOrb } from '../components/CyberOrb';
import { HoloContainer } from '../components/HoloContainer';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { Skeleton } from '../components/ui/Skeleton';
import { JobQueueMonitor } from '../components/monitoring/JobQueueMonitor';
import { LLMHealthMonitor } from '../components/monitoring/LLMHealthMonitor';
import { StorageAnalytics } from '../components/monitoring/StorageAnalytics';
import { ETLPipelineVisualizer } from '../components/monitoring/ETLPipelineVisualizer';
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

interface MonTarget {
    name: string;
    status: string;
    latency: number | string;
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

type MonTab = 'METRICS' | 'LOGS' | 'SAGA' | 'ANALYTICS' | 'JOBS' | 'LLM' | 'STORAGE' | 'NEURAL' | 'SIMULATION';

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
                    title="РЕЄСТР НЕЙРО-ТРЕЙСІВ"
                    className="min-h-[700px] panel-3d"
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
                                    <Badge variant={log.status === 'verified' ? 'success' : 'warning'}>
                                        {log.status}
                                    </Badge>
                                </div>
                                <p className="text-[9px] text-slate-500 line-clamp-2 italic mb-3">
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
                    className="min-h-[700px] panel-3d"
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
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-10">
                                    <div className="relative pl-10 border-l border-indigo-500/30 space-y-4">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 shadow-[0_0_10px_#6366f1]" />
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">GEMINI_COGNITIVE_PLAN</h4>
                                        <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-[11px] font-mono leading-relaxed text-slate-300">
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
                <TacticalCard variant="holographic" title="РЕЄСТР SAGA-ТРАНЗАКЦІЙ" className="min-h-[700px] panel-3d">
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
                <TacticalCard variant="holographic" title="ПОТІК ТРАНЗАКЦІЙ" className="min-h-[700px] panel-3d">
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
                                        <div className="flex-1 p-6 bg-slate-900/40 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all">
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
                {/* Background FX */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_70%)]" />
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-500/10 blur-[200px] rounded-full" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                </div>

                <div className="relative z-10 max-w-[1800px] mx-auto p-4 sm:p-8 space-y-8">
                    {/* Header Citdal */}
                    <ViewHeader
                        title="CYBERNETIC OVERSIGHT CITADEL"
                        icon={<Activity size={22} className="text-emerald-500 drop-shadow-lg" />}
                        breadcrumbs={['ЦИТАДЕЛЬ', 'МОНІТОРИНГ', 'v55.LIVE']}
                        stats={[
                            { label: 'System Health', value: 'OPTIMAL', color: 'success', icon: <ShieldCheck size={14} /> },
                            { label: 'Active Incidents', value: realAlerts.length.toString(), color: realAlerts.length > 0 ? 'warning' : 'primary', icon: <AlertTriangle size={14} /> },
                            { label: 'Sync Status', value: 'SYNCHRONIZED', color: 'indigo', icon: <RefreshCw size={14} /> }
                        ]}
                    />

                    {/* V55 Tab Switcher */}
                    <div className="flex gap-2 p-1.5 bg-black/60 rounded-[28px] border border-white/5 backdrop-blur-2xl max-w-fit overflow-x-auto scrollbar-hide">
                        {(['METRICS', 'LOGS', 'SAGA', 'JOBS', 'NEURAL', 'LLM', 'STORAGE', 'ANALYTICS'] as MonTab[]).map((tab) => {
                            if (!isOperatorShell && !isCommanderShell && tab !== 'METRICS') return null;
                            const isActive = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center gap-3",
                                        isActive ? "bg-white text-black shadow-2xl" : "text-slate-500 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {tab === 'METRICS' && <BarChart3 size={14} />}
                                    {tab === 'LOGS' && <Terminal size={14} />}
                                    {tab === 'SAGA' && <Layers size={14} />}
                                    {tab === 'JOBS' && <Zap size={14} />}
                                    {tab === 'NEURAL' && <Brain size={14} />}
                                    {tab === 'LLM' && <Bot size={14} />}
                                    {tab === 'STORAGE' && <Database size={14} />}
                                    {tab === 'ANALYTICS' && <Monitor size={14} />}
                                    {premiumLocales.monitoring.tabs[tab.toLowerCase() as keyof typeof premiumLocales.monitoring.tabs] || tab}
                                    {isActive && <motion.div layoutId="tabMarker" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_#fff]" />}
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {activeTab === 'METRICS' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-1 space-y-8">
                                        <TacticalCard variant="holographic" title="CORE_NODE_TELEMETRY" className="panel-3d" noPadding>
                                            <div className="p-8 space-y-8">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                                            <Server size={32} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-black text-sm uppercase tracking-widest">K3S_CONTROL_PLANE</h4>
                                                            <p className="text-[10px] text-slate-500 font-mono italic">Status: System Online</p>
                                                        </div>
                                                    </div>
                                                    <StatusIndicator status="success" label="ACTIVE" pulse />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-5 bg-black/40 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">CPU_LOAD</div>
                                                        <div className="text-3xl font-mono font-black text-blue-400 tracking-tighter">{realMetrics?.cpu_load?.toFixed(1) || '0.0'}%</div>
                                                    </div>
                                                    <div className="p-5 bg-black/40 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">MEM_USED</div>
                                                        <div className="text-3xl font-mono font-black text-emerald-400 tracking-tighter">{realMetrics?.memory_usage?.toFixed(1) || '0.0'}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TacticalCard>

                                        <TacticalCard variant="holographic" title="THREAT_VECTOR_ANALYSIS" className="panel-3d flex flex-col items-center justify-center p-8 bg-black/40">
                                            <CyberOrb
                                                size={180}
                                                color={anomalyScore > 0.6 ? "#ef4444" : themeColor}
                                                intensity={0.5}
                                                pulse
                                            />
                                            <div className="absolute text-center mt-2 group-hover:scale-110 transition-transform">
                                                <div className={`text-5xl font-black font-mono tracking-tighter ${anomalyScore > 0.6 ? 'text-rose-500' : 'text-blue-400'}`}>
                                                    {(anomalyScore * 100).toFixed(1)}%
                                                </div>
                                                <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 leading-none">ANOMALY_INDEX</div>
                                            </div>
                                        </TacticalCard>

                                        <TacticalCard variant="holographic" title="V45_PULSE_HEARTBEAT" className="panel-3d">
                                            <div className="space-y-6 p-4">
                                                {wsData?.pulse?.reasons.map((r: string, i: number) => (
                                                    <div key={i} className="flex gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl animate-pulse">
                                                        <AlertTriangle size={18} className="text-rose-400" />
                                                        <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest">{r}</span>
                                                    </div>
                                                ))}
                                                {(!wsData?.pulse || wsData.pulse.reasons.length === 0) && (
                                                    <div className="flex gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                                        <CheckCircle2 size={18} className="text-emerald-400" />
                                                        <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">SYSTEM_PULSE_STABLE</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TacticalCard>
                                    </div>

                                    <div className="lg:col-span-2 space-y-8">
                                        <TacticalCard variant="holographic" title="LIVE_RESOURCES_TELEMETRY" className="panel-3d h-[500px]" noPadding>
                                            <div className="h-full w-full p-4">
                                                <ReactECharts
                                                    option={{
                                                        backgroundColor: 'transparent',
                                                        grid: { left: '5%', right: '5%', bottom: '15%', top: '10%' },
                                                        xAxis: {
                                                            type: 'category',
                                                            data: resourceData.map(d => d.time),
                                                            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                                                            axisLabel: { color: '#64748b', fontSize: 9, fontStyle: 'italic' }
                                                        },
                                                        yAxis: {
                                                            type: 'value',
                                                            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                                                            axisLabel: { color: '#64748b', fontSize: 9 }
                                                        },
                                                        series: [
                                                            {
                                                                name: 'CPU',
                                                                type: 'line',
                                                                smooth: true,
                                                                showSymbol: false,
                                                                data: resourceData.map(d => d.cpu),
                                                                lineStyle: { width: 4, color: '#3b82f6', shadowBlur: 10, shadowColor: '#3b82f688' },
                                                                areaStyle: {
                                                                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                                                        { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
                                                                        { offset: 1, color: 'rgba(59, 130, 246, 0)' }
                                                                    ])
                                                                }
                                                            },
                                                            {
                                                                name: 'MEM',
                                                                type: 'line',
                                                                smooth: true,
                                                                showSymbol: false,
                                                                data: resourceData.map(d => d.memory),
                                                                lineStyle: { width: 4, color: '#10b981', shadowBlur: 10, shadowColor: '#10b98188' },
                                                                areaStyle: {
                                                                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                                                        { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
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
                                        </TacticalCard>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <TacticalCard variant="holographic" title="NETWORK_BUS_QUEUES" className="panel-3d">
                                                <div className="space-y-4">
                                                    {queues.length > 0 ? queues.map((q, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-2 h-2 rounded-full ${q.messages > 100 ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_8px_currentColor]`} />
                                                                <div>
                                                                    <div className="text-[11px] font-black text-white uppercase tracking-wider">{q.name}</div>
                                                                    <div className="text-[8px] text-slate-600 font-bold">CONSUMERS: {q.consumers}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-black text-blue-400 font-mono">{q.messages} MSG</div>
                                                            </div>
                                                        </div>
                                                    )) : <p className="text-center text-[10px] text-slate-600 py-10 uppercase font-black">Scanning Bus...</p>}
                                                </div>
                                            </TacticalCard>

                                            <TacticalCard variant="holographic" title="K3S_CLUSTER_TOPOLOGY" className="panel-3d">
                                                <div className="h-[300px] w-full relative">
                                                    <ReactECharts
                                                        option={{
                                                            backgroundColor: 'transparent',
                                                            series: [{
                                                                type: 'graph',
                                                                layout: 'force',
                                                                force: { repulsion: 200, edgeLength: 60 },
                                                                data: graphData.nodes,
                                                                links: graphData.links,
                                                                label: { show: true, position: 'bottom', color: '#64748b', fontSize: 8 },
                                                                lineStyle: { opacity: 0.2, curveness: 0.1, color: '#3b82f6' },
                                                                emphasis: { focus: 'adjacency', lineStyle: { width: 2, opacity: 1 } }
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
                                        <TacticalCard variant="holographic" title="LOKI_TERMINAL_TRUTH" className="h-[700px] panel-3d" noPadding>
                                            <div className="flex flex-col h-full">
                                                <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
                                                    <div className="relative flex-1 max-w-md">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                                        <input
                                                            value={logSearch}
                                                            onChange={(e) => setLogSearch(e.target.value)}
                                                            placeholder='Filter logs: {service="core"} |= "error"'
                                                            className="w-full bg-black/60 border border-white/10 rounded-xl py-2 pl-10 text-[10px] font-mono text-slate-300 focus:border-amber-500/50 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => setIsLiveTail(!isLiveTail)}
                                                        className={cn(
                                                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                                                            isLiveTail ? "bg-emerald-600 border-emerald-500 text-white" : "bg-slate-800 border-white/10 text-slate-500"
                                                        )}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${isLiveTail ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                                                        {isLiveTail ? 'LIVE_TAIL' : 'PAUSED'}
                                                    </button>
                                                </div>
                                                <div className="flex-1 bg-black/60 p-6 overflow-y-auto custom-scrollbar font-mono text-[9px] space-y-1">
                                                    {logs.map((log, idx) => (
                                                        <div key={idx} className="flex gap-4 hover:bg-white/5 p-1 rounded-lg transition-colors group">
                                                            <span className="text-slate-600 shrink-0 w-12">{log.ts}</span>
                                                            <span className={cn(
                                                                "shrink-0 w-10 text-center font-black",
                                                                log.level === 'ERROR' ? 'text-rose-500' : log.level === 'WARN' ? 'text-amber-500' : 'text-blue-500'
                                                            )}>{log.level}</span>
                                                            <span className="text-slate-500 shrink-0 w-32 truncate opacity-40 group-hover:opacity-100 transition-opacity">[{log.service}]</span>
                                                            <span className="text-slate-300 flex-1 whitespace-pre-wrap">{log.msg}</span>
                                                        </div>
                                                    ))}
                                                    <div ref={logsEndRef} />
                                                </div>
                                            </div>
                                        </TacticalCard>
                                    </div>
                                    <div className="lg:col-span-2 space-y-8">
                                        <TacticalCard variant="holographic" title="TEMPO_TRACE_VISUALIZER" className="panel-3d h-[350px]">
                                            <div className="space-y-6 h-full flex flex-col justify-center">
                                                {[
                                                    { name: 'Traefik_Gateway', color: '#3b82f6', w: '20%', s: '0%' },
                                                    { name: 'Core_API_v55', color: '#10b981', w: '60%', s: '15%' },
                                                    { name: 'Vector_Search_Index', color: '#a855f7', w: '30%', s: '40%' },
                                                    { name: 'Postgres_Relational', color: '#f59e0b', w: '20%', s: '70%' }
                                                ].map((t, i) => (
                                                    <div key={i} className="relative">
                                                        <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mb-1 px-1">
                                                            <span>{t.name}</span>
                                                            <span>{Math.floor(Math.random() * 200)}ms</span>
                                                        </div>
                                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: t.w, left: t.s }}
                                                                className="absolute h-full rounded-full shadow-[0_0_10px_currentColor]"
                                                                style={{ backgroundColor: t.color, color: t.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </TacticalCard>
                                        <TacticalCard variant="holographic" title="SYSTEM_ALERT_PROTOCOL" className="panel-3d flex-1">
                                            <div className="space-y-4">
                                                {realAlerts.length > 0 ? realAlerts.map((a, i) => (
                                                    <div key={i} className={cn(
                                                        "p-4 rounded-2xl border flex items-center justify-between",
                                                        a.severity === 'critical' ? 'bg-rose-600/10 border-rose-500/30 text-rose-400' : 'bg-amber-600/10 border-amber-500/30 text-amber-400'
                                                    )}>
                                                        <div className="flex items-center gap-4">
                                                            <AlertTriangle size={18} />
                                                            <div>
                                                                <div className="text-[10px] font-black uppercase tracking-wider">{a.message || "Unknown Alert"}</div>
                                                                <div className="text-[8px] font-mono opacity-60">ID: {a.id?.substring(0, 8) || "N/A"}</div>
                                                            </div>
                                                        </div>
                                                        <RefreshCw size={14} className="animate-spin-slow opacity-40" />
                                                    </div>
                                                )) : (
                                                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                                                        <ShieldCheck size={48} className="text-emerald-500" />
                                                        <p className="mt-3 text-[9px] font-black uppercase tracking-widest">No Alerts Active</p>
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
                                    <TacticalCard variant="holographic" title="ETL_PIPELINE_ORCHESTRATOR" className="panel-3d">
                                        <ETLPipelineVisualizer />
                                    </TacticalCard>
                                </div>
                            )}

                            {activeTab === 'LLM' && <div className="animate-v55-in"><LLMHealthMonitor /></div>}
                            {activeTab === 'STORAGE' && <div className="animate-v55-in"><StorageAnalytics /></div>}
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
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .panel-3d:hover {
                        transform: translateY(-5px) scale(1.01);
                        box-shadow: 0 40px 80px -15px rgba(0, 0, 0, 0.8), 0 0 20px rgba(16, 185, 129, 0.1);
                    }
                    .animate-v55-in {
                        animation: v55-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    @keyframes v55-in {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                `}} />
            </div>
        </PageTransition>
    );
};

export default MonitoringView;
