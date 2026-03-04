
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { Activity, BarChart3, Eye, CheckCircle2, XCircle, Search, GitCommit, Server, HardDrive, Cpu, Bot, Target, Network, Play, Pause, RefreshCw, Layers, ArrowRight, RotateCcw, Clock, Database, Brain, Zap, Code, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { StatusIndicator, Skeleton, CyberOrb, JobQueueMonitor, LLMHealthMonitor, StorageAnalytics, ETLPipelineVisualizer } from '../components';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { api } from '../services/api';
import { SagaTransaction } from '../types';
import { useUser } from '../context/UserContext';
import { UserRole } from '../config/roles';
import { useShell, UIShell } from '../context/ShellContext';
import { useOmniscienceWS } from '../hooks/useOmniscienceWS';
import { NeutralizedContent } from '../components/NeutralizedContent';
import OpenSearchDashboardsEmbed from '../components/OpenSearchDashboardsEmbed';
import { AnalyticsDashboard } from '../components/premium/AnalyticsDashboard';
import { premiumLocales } from '../locales/uk/premium';

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
    const isExplorerShell = currentShell === UIShell.EXPLORER;

    const themeColor = isCommanderShell ? '#f59e0b' : isOperatorShell ? '#10b981' : '#3b82f6';
    const themeGlow = isCommanderShell ? 'rgba(245, 158, 11, 0.2)' : isOperatorShell ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)';
    const [logSearch, setLogSearch] = useState('');
    const [logs, setLogs] = useState<any[]>([]);
    const [targets, setTargets] = useState<MonTarget[]>([]);
    const [graphData, setGraphData] = useState<{ nodes: GraphDataNode[], links: GraphDataLink[] }>({ nodes: [], links: [] });
    const [anomalyScore, setAnomalyScore] = useState(0.02);
    const [isLiveTail, setIsLiveTail] = useState(true);
    const [loading, setLoading] = useState(true);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(false);
    const [resourceData, setResourceData] = useState<any[]>([]);
    const [queues, setQueues] = useState<any[]>([]);
    const [realMetrics, setRealMetrics] = useState<any>(null);

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
                // Update chart data
                setResourceData(prev => [
                    ...prev.slice(1),
                    {
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        cpu: wsData.system.cpu_percent,
                        memory: wsData.system.memory_percent,
                        logs: 0
                    }
                ]);
            }
        }
    }, [wsData]);

    const [realAlerts, setRealAlerts] = useState<any[]>([]);

    useEffect(() => {
        isMounted.current = true;
        const fetchTargets = async () => {
            try {
                if (!realMetrics) setLoading(true); // Initial load only

                // Fetch real alerts
                try {
                    const alerts = await api.v45.getLiveAlerts();
                    if (isMounted.current) setRealAlerts(alerts);
                } catch (e) {
                    console.warn("Failed to fetch alerts", e);
                }

                // Fetch Cluster Status for Graph
                const clusterResponse = await api.getClusterStatus();
                const cluster: MonClusterStatus = clusterResponse as any as MonClusterStatus;

                if (isMounted.current && cluster.nodes && cluster.nodes.length > 0) {
                    const nodes: GraphDataNode[] = [];
                    const links: GraphDataLink[] = [];

                    // Add Nodes
                    cluster.nodes.forEach((node: MonClusterNode) => {
                        nodes.push({
                            name: node.name,
                            category: 0, // NODE
                            symbolSize: 40,
                            itemStyle: { color: '#3b82f6', shadowBlur: 15, shadowColor: '#3b82f666' },
                            data: { category: 'ВУЗОЛ', status: node.status, cpu: node.cpuUsage?.toString() }
                        });

                        // Add Pods for this node (if available in cluster data)
                        if (node.pods) {
                            node.pods.forEach((pod: MonClusterPod) => {
                                nodes.push({
                                    name: pod.name,
                                    category: 1, // POD
                                    symbolSize: 20,
                                    itemStyle: { color: '#10b981' },
                                    data: { category: 'ПОД', status: pod.status, cpu: pod.cpu?.toString() }
                                });
                                links.push({ source: node.name, target: pod.name });
                            });
                        }
                    });

                    setGraphData({ nodes, links });
                } else {
                    // Truth-only: do not synthesize graph/targets. Keep empty state.
                    if (isMounted.current) {
                        setTargets([]);
                        setGraphData({ nodes: [], links: [] });
                    }
                }

                // Fetch real V45 data
                const qData = await api.v45.getLiveQueues();
                if (isMounted.current) setQueues(qData);

                const hData = await api.v45.getLiveHealth();
                if (isMounted.current) {
                    setRealMetrics(hData);
                    // Use backend anomaly score if available, else derive
                    const score = hData.anomaly_score !== undefined
                        ? hData.anomaly_score
                        : (hData.cpu_load / 100 * 0.4) + (hData.memory_usage / 100 * 0.4);
                    setAnomalyScore(Math.min(score, 1.0));
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };
        fetchTargets();

        const interval = setInterval(fetchTargets, 10000);
        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        setResourceData(prev => {
            if (!isMounted.current) return prev;

            const newTime = new Date();
            const newItem = {
                time: `${newTime.getHours()}:${newTime.getMinutes()}:${newTime.getSeconds()}`,
                cpu: metrics.cpu,
                memory: metrics.memory,
                logs: 0,
            };
            return [...prev.slice(1), newItem];
        });
    }, [metrics]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isLiveTail && activeTab === 'LOGS') {
            const fetchLiveLogs = async () => {
                if (!isMounted.current) return;
                try {
                    const newLogs = await api.streamSystemLogs();
                    if (isMounted.current) {
                        setLogs(prev => [...newLogs, ...prev.slice(0, 49)]);
                    }
                } catch (e) {
                    console.error("Failed to stream logs", e);
                }
            };

            interval = setInterval(fetchLiveLogs, 2000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLiveTail, activeTab]);

    const renderNeuralTrace = () => (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Audit Log Registry */}
            <div className="lg:col-span-1 space-y-6">
                <TacticalCard
                    variant="holographic"
                    title={premiumLocales.monitoring.neuralTraceView.registryTitle}
                    className="min-h-[700px] border-white/5 bg-slate-950/40 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {auditLogs.length > 0 ? auditLogs.map((log, idx) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.02, x: 8 }}
                                key={log.id}
                                onClick={() => setSelectedAudit(log)}
                                className={cn(
                                    "p-5 rounded-[28px] cursor-pointer transition-all duration-500 border relative overflow-hidden group",
                                    selectedAudit?.id === log.id
                                        ? 'bg-purple-600/10 border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.15)]'
                                        : 'bg-black/40 border-white/5 hover:border-white/20'
                                )}
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">
                                        {log.intent || premiumLocales.monitoring.neuralTraceView.intent}
                                    </h4>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter",
                                        log.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    )}>
                                        {log.status}
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-500 line-clamp-2 font-medium leading-relaxed italic mb-3 opacity-60 group-hover:opacity-1 transition-opacity">
                                    "{log.request_text}"
                                </p>
                                <div className="flex justify-between items-center text-[7px] font-black font-mono text-slate-600 uppercase tracking-widest pt-3 border-t border-white/5">
                                    <span className="flex items-center gap-1.5"><Clock size={10} /> {new Date(log.created_at).toLocaleTimeString()}</span>
                                    <span className={cn(log.risk_level === 'high' ? 'text-rose-500' : 'text-slate-400')}>RISK: {log.risk_level}</span>
                                </div>
                                {selectedAudit?.id === log.id && (
                                    <motion.div layoutId="auditActive" className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500 shadow-[0_0_15px_#a855f7]" />
                                )}
                            </motion.div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <Brain size={48} className="animate-pulse" />
                                <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em]">No Neural Activity</p>
                            </div>
                        )}
                    </div>
                </TacticalCard>
            </div>

            {/* Trace Visualization Details */}
            <div className="lg:col-span-3">
                <TacticalCard
                    variant="holographic"
                    title={premiumLocales.monitoring.neuralTraceView.visualizeTitle}
                    className="min-h-[700px] border-white/5 bg-slate-950/40 flex flex-col relative"
                >
                    {selectedAudit ? (
                        <div className="h-full flex flex-col p-10 space-y-12">
                            {/* Header Section */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-10 p-8 bg-purple-600/5 rounded-[40px] border border-purple-500/20 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(168,85,247,0.1),transparent_50%)]" />
                                <div className="relative z-10 p-6 bg-purple-600/20 rounded-3xl border border-purple-500/30 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                    <Brain size={48} />
                                </div>
                                <div className="relative z-10 flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{selectedAudit.intent}</h3>
                                        <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-widest">GEMINI_ENGINE</div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-4">
                                        <p className="text-[11px] text-slate-500 font-mono tracking-wider uppercase">UUID: <span className="text-purple-400/80">{selectedAudit.id}</span></p>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                        <p className="text-[11px] text-slate-500 font-mono tracking-wider uppercase">LATENCY: <span className="text-emerald-400 font-black">{selectedAudit.execution_time_ms}ms</span></p>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Left Column: Plan & Monologue */}
                                <div className="space-y-12">
                                    <div className="relative pl-12">
                                        <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent" />
                                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-slate-950 border-2 border-purple-500 flex items-center justify-center text-purple-400 shadow-[0_0_15px_#a855f7] z-10">
                                            <Target size={16} />
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-[0.3em]">{premiumLocales.monitoring.neuralTraceView.planTitle}</h4>
                                            <div className="p-6 bg-slate-900/60 rounded-[28px] border border-white/5 text-xs text-slate-300 font-mono leading-relaxed space-y-3">
                                                {Array.isArray(selectedAudit.gemini_plan?.steps)
                                                    ? selectedAudit.gemini_plan.steps.map((s: string, i: number) => (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            key={i}
                                                            className="flex gap-4 p-2 rounded-xl group hover:bg-white/5 transition-colors"
                                                        >
                                                            <span className="text-purple-500 font-black">[{i + 1}]</span>
                                                            <span className="flex-1 opacity-80 group-hover:opacity-100">{s}</span>
                                                        </motion.div>
                                                    ))
                                                    : <div className="italic text-slate-500">{selectedAudit.gemini_plan || "No neural roadmap extracted."}</div>
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {selectedAudit.thinking_process && (
                                        <div className="relative pl-12">
                                            <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent" />
                                            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-[0_0_15px_#f59e0b] z-10">
                                                <Zap size={16} />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-[0.3em] font-display">{premiumLocales.monitoring.neuralTraceView.innerMonologue}</h4>
                                                <div className="p-8 bg-amber-500/5 rounded-[32px] border border-amber-500/10 relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03] pointer-events-none" />
                                                    <div className="text-[11px] text-amber-200/90 font-mono leading-relaxed italic whitespace-pre-wrap relative z-10">
                                                        {selectedAudit.thinking_process}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Output & Audit */}
                                <div className="space-y-12">
                                    {selectedAudit.mistral_output && (
                                        <div className="relative pl-12">
                                            <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/50 via-blue-500/20 to-transparent" />
                                            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-slate-950 border-2 border-blue-500 flex items-center justify-center text-blue-400 shadow-[0_0_15px_#3b82f6] z-10">
                                                <Code size={16} />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] font-display">{premiumLocales.monitoring.neuralTraceView.coderOutput}</h4>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">MISTRAL_7B_V2</span>
                                                </div>
                                                <div className="p-8 bg-blue-500/5 rounded-[32px] border border-blue-500/10 min-h-[150px] relative">
                                                    <div className="text-[10px] text-blue-100/80 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-[300px] custom-scrollbar">
                                                        {selectedAudit.mistral_output}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative pl-12">
                                        <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent" />
                                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_#10b981] z-10">
                                            <ShieldCheck size={16} />
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] font-display">{premiumLocales.monitoring.neuralTraceView.securityAudit}</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-6 bg-emerald-500/5 rounded-[28px] border border-emerald-500/10">
                                                    <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-3">Audit Summary</div>
                                                    <p className="text-[10px] text-emerald-100/70 font-mono leading-relaxed italic">
                                                        {typeof selectedAudit.copilot_audit === 'object' ? 'Structured Validation Success' : (selectedAudit.copilot_audit || "No critical issues detected by security core.")}
                                                    </p>
                                                </div>
                                                <div className="p-6 bg-slate-900 rounded-[28px] border border-white/5 flex flex-col justify-center items-center gap-3">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-full flex items-center justify-center border-2",
                                                        selectedAudit.risk_level === 'high' ? "border-rose-500 text-rose-500 shadow-[0_0_15px_#f43f5e]" : "border-emerald-500 text-emerald-500 shadow-[0_0_15px_#10b981]"
                                                    )}>
                                                        {selectedAudit.risk_level === 'high' ? <Flame size={24} /> : <ShieldCheck size={24} />}
                                                    </div>
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Safe_Execution</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-40 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full scale-150 group-hover:bg-purple-500/40 transition-all duration-1000" />
                                <Brain size={120} className="text-slate-800 relative z-10 group-hover:text-purple-400/30 transition-colors duration-1000" />
                            </div>
                            <p className="mt-12 text-[11px] font-black uppercase tracking-[0.5em] text-slate-700 group-hover:text-slate-500 transition-colors">
                                {premiumLocales.monitoring.neuralTraceView.selectTrace}
                            </p>
                            <div className="mt-6 flex gap-2">
                                {[1, 2, 3].map(i => <motion.div key={i} animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }} className="w-1.5 h-1.5 rounded-full bg-purple-500" />)}
                            </div>
                        </div>
                    )}
                </TacticalCard>
            </div>
        </div>
    );

    const renderSagaViz = () => (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Saga Registry */}
            <div className="lg:col-span-1 space-y-6">
                <TacticalCard
                    variant="holographic"
                    title={premiumLocales.monitoring.sagaView.registryTitle}
                    className="min-h-[700px] border-white/5 bg-slate-950/40 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {realSagas.length > 0 ? realSagas.map((saga, idx) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.02, x: 8 }}
                                key={saga.id}
                                onClick={() => setSelectedSaga(saga)}
                                className={cn(
                                    "p-6 rounded-[30px] cursor-pointer transition-all duration-500 border relative overflow-hidden group",
                                    selectedSaga?.id === saga.id
                                        ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.15)]'
                                        : 'bg-black/40 border-white/5 hover:border-white/20'
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "p-3 rounded-2xl transition-all duration-500",
                                            selectedSaga?.id === saga.id ? 'bg-blue-600 text-white shadow-[0_0_20px_#3b82f6]' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'
                                        )}>
                                            <Layers size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest leading-none">{saga.name}</h4>
                                            <p className="text-[9px] text-slate-500 font-mono mt-2 opacity-60">ID: {saga.id.substring(0, 12)}...</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                        saga.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    )}>
                                        {saga.status}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[8px] font-black font-mono text-slate-600 uppercase tracking-widest pt-4 border-t border-white/5">
                                    <span className="flex items-center gap-2"><Clock size={10} /> {saga.startTime}</span>
                                    <span className="opacity-50">v45.core</span>
                                </div>
                                {selectedSaga?.id === saga.id && (
                                    <motion.div layoutId="sagaActive" className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_20px_#3b82f6]" />
                                )}
                            </motion.div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <Layers size={48} className="animate-pulse" />
                                <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em]">No Saga Transactions</p>
                            </div>
                        )}
                    </div>
                </TacticalCard>
            </div>

            {/* Saga Flow Visualization */}
            <div className="lg:col-span-3">
                <TacticalCard
                    variant="holographic"
                    title={premiumLocales.monitoring.sagaView.visualizeTitle}
                    className="min-h-[700px] border-white/5 bg-slate-950/40 flex flex-col relative"
                >
                    {selectedSaga ? (
                        <div className="h-full flex flex-col p-10">
                            {/* Saga Header */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-10 mb-12 p-8 bg-blue-600/5 rounded-[40px] border border-blue-500/20 shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-cyber-scanline opacity-[0.02] pointer-events-none" />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
                                <div className="relative z-10 p-6 bg-blue-600/20 rounded-3xl border border-blue-500/30 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                    <Layers size={48} />
                                </div>
                                <div className="relative z-10 flex-1">
                                    <div className="flex items-center gap-6">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{selectedSaga.name}</h3>
                                        <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                            STABLE_STATE
                                        </div>
                                    </div>
                                    <div className="mt-5 text-[10px] text-slate-500 font-mono flex items-center gap-8 uppercase tracking-widest">
                                        <span className="flex items-center gap-2">TRACE: <span className="text-blue-400 font-black">{selectedSaga.traceId}</span></span>
                                        <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                                        <span className="flex items-center gap-2">STATUS: <span className="text-emerald-400 font-black">{premiumLocales.monitoring.sagaView.synchronized}</span></span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Saga Steps Timeline */}
                            <div className="relative pl-24 pr-10 space-y-12 flex-1 scrollbar-hide overflow-y-auto pb-10">
                                <div className="absolute left-11 top-4 bottom-4 w-[2px] bg-slate-800/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: '100%' }}
                                        transition={{ duration: 2, ease: "easeInOut" }}
                                        className="w-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_20px_#3b82f6]"
                                    />
                                </div>

                                {selectedSaga.steps.map((step, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.15 }}
                                        key={step.id}
                                        className="relative flex items-center gap-10 group"
                                    >
                                        {/* Step Node Icon */}
                                        <div className={cn(
                                            "w-16 h-16 rounded-full border-2 flex items-center justify-center bg-slate-950 z-20 transition-all duration-500 shadow-2xl relative",
                                            step.status === 'COMPLETED' ? 'border-emerald-500 text-emerald-400 shadow-emerald-500/30' :
                                                step.status === 'FAILED' ? 'border-rose-500 text-rose-400 shadow-rose-500/30' :
                                                    step.status === 'COMPENSATED' ? 'border-amber-500 text-amber-400 shadow-amber-500/30' :
                                                        'border-slate-800 text-slate-600'
                                        )}>
                                            <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 rounded-full transition-opacity duration-500" />
                                            {step.status === 'COMPLETED' && <CheckCircle2 size={28} />}
                                            {step.status === 'FAILED' && <XCircle size={28} />}
                                            {step.status === 'COMPENSATED' && <RotateCcw size={28} />}
                                            {!['COMPLETED', 'FAILED', 'COMPENSATED'].includes(step.status) && <Clock size={28} />}
                                        </div>

                                        {/* Step Data Card */}
                                        <div className={cn(
                                            "flex-1 p-8 rounded-[40px] border backdrop-blur-xl transition-all duration-700 relative overflow-hidden group-hover:-translate-y-1 shadow-2xl",
                                            step.status === 'FAILED' ? 'bg-rose-500/5 border-rose-500/20' :
                                                step.status === 'COMPENSATED' ? 'bg-amber-500/5 border-amber-500/20' :
                                                    'bg-slate-900/40 border-white/5'
                                        )}>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.02] -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />

                                            <div className="flex justify-between items-center mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 text-blue-400 shadow-lg">
                                                        <Server size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{step.service}</span>
                                                        <div className="text-[8px] text-slate-600 font-black uppercase mt-1 tracking-widest">SRV_INSTANCE_02</div>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-2 bg-slate-950/80 rounded-xl border border-white/5 text-[10px] font-black font-mono text-cyan-400 uppercase tracking-widest shadow-inner">
                                                    {step.logs || ' latency: 12.4ms'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                <div className="text-[11px] text-slate-400 uppercase font-black tracking-widest leading-none">
                                                    EXECUTE: <span className="text-slate-100 ml-1 font-mono">{step.action}</span>
                                                </div>
                                            </div>

                                            {step.status === 'COMPENSATED' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-6 pt-6 border-t border-amber-500/20 flex items-center gap-5"
                                                >
                                                    <div className="p-2.5 bg-amber-500/15 rounded-xl text-amber-500 shadow-lg">
                                                        <RotateCcw size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[8px] text-amber-500 font-black uppercase tracking-widest mb-1 opacity-60">Automatic Compensation Triggered</div>
                                                        <div className="text-[10px] text-amber-400 font-black uppercase tracking-widest font-mono">
                                                            ACTION: {step.compensatingAction}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-40 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full scale-150 group-hover:bg-blue-500/40 transition-all duration-1000" />
                                <Layers size={120} className="text-slate-800 relative z-10 group-hover:text-blue-400/30 transition-colors duration-1000" />
                            </div>
                            <p className="mt-12 text-[11px] font-black uppercase tracking-[0.5em] text-slate-700 group-hover:text-slate-500 transition-colors">
                                {premiumLocales.monitoring.sagaView.selectSaga}
                            </p>
                            <div className="mt-6 flex gap-2">
                                {[1, 2, 3].map(i => <motion.div key={i} animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }} className="w-1.5 h-1.5 rounded-full bg-blue-500" />)}
                            </div>
                        </div>
                    )}
                </TacticalCard>
            </div>
        </div>
    );
    const renderSimulationView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Simulation Control Center */}
            <TacticalCard
                variant="holographic"
                title={premiumLocales.monitoring.simulation.title}
                className="min-h-[600px] border-white/5 bg-slate-950/40 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-blue-500/10" />
                <div className="p-10 space-y-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => api.v45.triggerSimulation('backend', 0.8)}
                            className="group p-8 bg-blue-600/5 border border-blue-500/20 rounded-[40px] hover:border-blue-500/50 transition-all text-left relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-5 mb-6">
                                <div className="p-4 bg-blue-600/20 rounded-2xl text-blue-400 group-hover:shadow-[0_0_20px_#3b82f6] transition-all">
                                    <Zap size={28} />
                                </div>
                                <h4 className="text-base font-black text-white uppercase tracking-tighter">{premiumLocales.monitoring.simulation.stressTest.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-8">{premiumLocales.monitoring.simulation.stressTest.desc}</p>
                            <div className="flex justify-between items-center text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] pt-6 border-t border-white/5">
                                <span>{premiumLocales.monitoring.simulation.activate}</span>
                                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => api.v45.triggerSimulation('customs_dataset', 0.5)}
                            className="group p-8 bg-rose-600/5 border border-rose-500/20 rounded-[40px] hover:border-rose-500/50 transition-all text-left relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-5 mb-6">
                                <div className="p-4 bg-rose-600/20 rounded-2xl text-rose-400 group-hover:shadow-[0_0_20px_#f43f5e] transition-all">
                                    <AlertTriangle size={28} />
                                </div>
                                <h4 className="text-base font-black text-white uppercase tracking-tighter">{premiumLocales.monitoring.simulation.dataPoisoning.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-8">{premiumLocales.monitoring.simulation.dataPoisoning.desc}</p>
                            <div className="flex justify-between items-center text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] pt-6 border-t border-white/5">
                                <span>{premiumLocales.monitoring.simulation.activate}</span>
                                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </motion.button>
                    </div>

                    {/* Resilience Dashboard */}
                    <div className="p-10 bg-slate-900/60 rounded-[48px] border border-white/5 shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03] pointer-events-none" />
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Bot size={24} className="text-blue-400" />
                                <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">{premiumLocales.monitoring.simulation.statsTitle}</h4>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />)}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{premiumLocales.monitoring.simulation.resilienceIndex}</div>
                                    <div className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">94%</div>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '94%' }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_#10b981]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{premiumLocales.monitoring.simulation.recoveryTime}</div>
                                    <div className="text-3xl font-black text-blue-400 font-mono tracking-tighter">1.2<span className="text-sm ml-1 opacity-60">s</span></div>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '85%' }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_#3b82f6]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TacticalCard>

            {/* Maintenance & Optimization */}
            <TacticalCard
                variant="holographic"
                title={premiumLocales.monitoring.maintenance.title}
                className="min-h-[600px] border-white/5 bg-slate-950/40 relative overflow-hidden group"
            >
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -ml-32 -mb-32 transition-all duration-1000 group-hover:bg-emerald-500/10" />
                <div className="p-10 space-y-10 relative z-10">
                    <div className="flex flex-col gap-6">
                        {[
                            { id: 'v_db', icon: <Database />, color: 'emerald', title: premiumLocales.monitoring.maintenance.vacuum.title, desc: premiumLocales.monitoring.maintenance.vacuum.desc, action: 'vacuum_db' },
                            { id: 'v_idx', icon: <Network />, color: 'cyan', title: premiumLocales.monitoring.maintenance.reclaim.title, desc: premiumLocales.monitoring.maintenance.reclaim.desc, action: 'reclaim_vectors' },
                            { id: 'v_cache', icon: <RefreshCw />, color: 'purple', title: 'Clear Metadata Cache', desc: 'Flush transient objects and reclaim L3 memory space.', action: 'clear_cache' }
                        ].map((m) => (
                            <motion.div
                                whileHover={{ x: 10 }}
                                key={m.id}
                                className="p-8 bg-black/40 border border-white/5 rounded-[40px] flex items-center justify-between group transition-all duration-500 hover:bg-slate-900/40 shadow-xl"
                            >
                                <div className="flex items-center gap-8">
                                    <div className={cn(
                                        "p-5 rounded-3xl transition-all duration-700 relative overflow-hidden group-hover:scale-110 shadow-2xl",
                                        m.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            m.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                                'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    )}>
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                                        {m.icon}
                                    </div>
                                    <div className="max-w-[320px]">
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-3">{m.title}</h4>
                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{m.desc}</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => api.v45.triggerMaintenance(m.action)}
                                    className={cn(
                                        "px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 border",
                                        m.color === 'emerald' ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white' :
                                            m.color === 'cyan' ? 'bg-cyan-600/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-600 hover:text-white' :
                                                'bg-purple-600/10 border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white'
                                    )}
                                >
                                    {premiumLocales.monitoring.maintenance.run}
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>

                    {/* Maintenance Health Summary */}
                    <div className="mt-8 p-8 border-t border-white/5 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">All systems optimized. Last run: {new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="text-[10px] font-black text-slate-600 flex items-center gap-4">
                            <span>DB_HEALTH: 99.8%</span>
                            <div className="w-1 h-3 bg-slate-800" />
                            <span>VECTOR_INTEGRITY: 100%</span>
                        </div>
                    </div>
                </div>
            </TacticalCard>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 w-full max-w-[1700px] mx-auto relative z-10 min-h-screen">
            <AdvancedBackground showStars={true} />
            <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay z-[100]" />

            <ViewHeader
                title={isCommanderShell ? premiumLocales.monitoring.titles.commander : isOperatorShell ? premiumLocales.monitoring.titles.operator : premiumLocales.monitoring.titles.explorer}
                icon={<Activity size={20} className={isCommanderShell ? 'text-amber-400' : isOperatorShell ? 'text-emerald-400' : 'text-blue-400'} />}
                breadcrumbs={premiumLocales.monitoring.breadcrumbs}
                stats={[
                    { label: 'Prometheus', value: realMetrics?.status === 'online' ? premiumLocales.monitoring.sagaView.synchronized : premiumLocales.monitoring.coreHealth.offline, icon: <Eye size={14} />, color: realMetrics?.status === 'online' ? 'success' : 'danger' },
                    { label: premiumLocales.monitoring.tabs.saga + ' Core', value: premiumLocales.monitoring.coreHealth.status, icon: <Layers size={14} />, color: 'primary' },
                    { label: 'Інциденти', value: String(realAlerts.length || 0), icon: <Activity size={14} />, color: (Array.isArray(realAlerts) && realAlerts.some(a => a.severity === 'critical')) ? 'danger' : 'warning' },
                ]}
            />

            {/* Premium Tabs */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 p-1 bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-2xl mb-10 overflow-x-auto scrollbar-hide max-w-5xl px-2"
            >
                {(['METRICS', 'LOGS', 'SAGA', 'JOBS', 'NEURAL', 'LLM', 'STORAGE', 'ANALYTICS'] as MonTab[]).map((tab) => {
                    // Hide SAGA/LOGS/ANALYTICS for regular users unless they are in Explorer Shell but have permissions
                    const canSeeExtra = isOperatorShell || isCommanderShell;
                    if (!canSeeExtra && (tab !== 'METRICS')) return null;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden whitespace-nowrap ${activeTab === tab ? (
                                tab === 'METRICS' ? `${isCommanderShell ? 'bg-amber-600' : isOperatorShell ? 'bg-emerald-600' : 'bg-blue-600'} text-white shadow-lg border border-white/20` :
                                    tab === 'LOGS' ? 'bg-amber-600 text-white shadow-lg border border-white/20' :
                                        tab === 'JOBS' ? 'bg-cyan-600 text-white shadow-lg border border-white/20' :
                                            tab === 'LLM' ? 'bg-purple-600 text-white shadow-lg border border-white/20' :
                                                tab === 'STORAGE' ? 'bg-indigo-600 text-white shadow-lg border border-white/20' :
                                                    tab === 'ANALYTICS' ? 'bg-orange-600 text-white shadow-lg border border-white/20' :
                                                        tab === 'SIMULATION' ? 'bg-rose-600 text-white shadow-lg border border-white/20' :
                                                            'bg-purple-600 text-white shadow-lg border border-white/20'
                            ) : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            {tab === 'METRICS' && <BarChart3 size={16} />}
                            {tab === 'LOGS' && <Search size={16} />}
                            {tab === 'SAGA' && <Layers size={16} />}
                            {tab === 'JOBS' && <Zap size={16} />}
                            {tab === 'LLM' && <Brain size={16} />}
                            {tab === 'STORAGE' && <Database size={16} />}
                            {tab === 'ANALYTICS' && <Eye size={16} />}
                            {tab === 'NEURAL' && <Brain size={16} className="text-purple-400" />}
                            {tab === 'SIMULATION' && <Target size={16} />}

                            {tab === 'METRICS' ? premiumLocales.monitoring.tabs.metrics :
                                tab === 'LOGS' ? premiumLocales.monitoring.tabs.logs :
                                    tab === 'JOBS' ? premiumLocales.monitoring.tabs.tasks :
                                        tab === 'LLM' ? premiumLocales.monitoring.tabs.aiCore :
                                            tab === 'STORAGE' ? premiumLocales.monitoring.tabs.storage :
                                                tab === 'ANALYTICS' ? premiumLocales.monitoring.tabs.dashboards :
                                                    tab === 'NEURAL' ? premiumLocales.monitoring.tabs.neuralTrace :
                                                        tab === 'SIMULATION' ? premiumLocales.monitoring.tabs.digitalTwin : premiumLocales.monitoring.tabs.saga}

                            {activeTab === tab && <motion.div layoutId="tabGlow" className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />}
                        </button>
                    );
                })}
            </motion.div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'METRICS' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 space-y-8">
                                <div className="glass-ultra p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-emerald-500/30 transition-all duration-500 shadow-2xl panel-3d">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500 icon-3d-green group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                            <Server size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-wider">{premiumLocales.monitoring.coreHealth.title}</h3>
                                            <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">K3S_CONTROL_PLANE</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        {loading ? (
                                            <Skeleton width={80} height={24} />
                                        ) : (
                                            <StatusIndicator
                                                status={realMetrics?.status === 'online' ? 'success' : 'error'}
                                                label={realMetrics?.status === 'online' ? premiumLocales.monitoring.coreHealth.status : premiumLocales.monitoring.coreHealth.offline}
                                                size="sm"
                                            />
                                        )}
                                        {!loading && (
                                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                                CPU: <span className="text-emerald-400">{realMetrics?.cpu_load?.toFixed(1) || '0.0'}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <TacticalCard variant="holographic" title="DEV.OPS // GITOPS CORE" className="panel-3d glass-ultra rounded-[32px] border-white/5 overflow-hidden shadow-2xl">
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <GitCommit size={18} className="text-purple-400" />
                                                <span className="text-[11px] font-black text-white uppercase tracking-widest">ArgoCD Controller</span>
                                            </div>
                                            <StatusIndicator status="success" label="SYNCED" size="sm" />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-all">
                                                <span className="text-[10px] text-slate-400 font-mono">APP: predator-ui</span>
                                                <span className="text-[9px] text-emerald-400 font-black tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">HEALTHY</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-all">
                                                <span className="text-[10px] text-slate-400 font-mono">APP: predator-core</span>
                                                <span className="text-[9px] text-emerald-400 font-black tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">HEALTHY</span>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/5" />

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Bot size={18} className="text-blue-400" />
                                                <span className="text-[11px] font-black text-white uppercase tracking-widest">Sovereign Agents</span>
                                            </div>
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-black animate-pulse" />)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {['Architect', 'Guardian', 'Vibe-Master', 'Evolution'].map(agent => (
                                                <div key={agent} className="p-2 border border-blue-500/10 rounded-lg text-center bg-blue-500/5">
                                                    <div className="text-[9px] text-blue-300 font-black uppercase tracking-tight">{agent}</div>
                                                    <div className="text-[8px] text-emerald-500 mt-1 font-mono">ONLINE</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TacticalCard>
                                {wsData?.pulse && (
                                    <TacticalCard
                                        variant="holographic"
                                        title={premiumLocales.monitoring.pulse.title}
                                        className="panel-3d glass-ultra rounded-[32px] border-white/5 overflow-hidden shadow-2xl relative"
                                    >
                                        <div className="absolute top-2 right-4 text-[10px] font-black text-slate-500 uppercase">v45_CORE</div>
                                        <div className="p-6 flex flex-col items-center">
                                            <div className="relative mb-8">
                                                <CyberOrb size={160} color={wsData.pulse.score < 40 ? "#ef4444" : wsData.pulse.score < 80 ? "#f59e0b" : "#3b82f6"} className="opacity-80" />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className={`text-5xl font-black font-display tracking-tighter ${wsData.pulse.score < 40 ? 'text-rose-500' : wsData.pulse.score < 80 ? 'text-amber-500' : 'text-blue-400'}`}>
                                                        {wsData.pulse.score}%
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">{wsData.pulse.status}</span>
                                                </div>
                                            </div>

                                            <div className="w-full space-y-3">
                                                {wsData.pulse.reasons.map((reason: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl group hover:bg-rose-500/10 transition-colors">
                                                        <AlertTriangle size={18} className="text-rose-400 animate-pulse" />
                                                        <span className="text-[11px] font-black text-rose-100 uppercase tracking-widest">{reason}</span>
                                                    </div>
                                                ))}
                                                {wsData.pulse.reasons.length === 0 && (
                                                    <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                                        <CheckCircle2 size={18} className="text-emerald-400" />
                                                        <span className="text-[11px] font-black text-emerald-100 uppercase tracking-widest">{premiumLocales.monitoring.pulse.optimal}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TacticalCard>
                                )}

                                <TacticalCard
                                    variant="holographic"
                                    title={isCommanderShell ? premiumLocales.monitoring.topology.neural : premiumLocales.monitoring.topology.services}
                                    className={`panel-3d glass-ultra rounded-[32px] border-white/5 overflow-hidden shadow-2xl ${isCommanderShell ? 'border-amber-500/20' : isOperatorShell ? 'border-emerald-500/20' : ''}`}
                                >
                                    <div className="h-[350px] w-full relative group">
                                        <div className="absolute top-4 left-4 z-10 opacity-40">
                                            <div className="text-[8px] font-mono text-blue-400">CLUSTER_ID: P21_PROD_02</div>
                                        </div>
                                        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,${themeGlow}_0%,transparent_70%)] pointer-events-none transition-all duration-700 group-hover:scale-150`}></div>
                                        <ReactECharts
                                            option={{
                                                backgroundColor: 'transparent',
                                                tooltip: {
                                                    trigger: 'item',
                                                    backgroundColor: 'rgba(2, 6, 23, 0.95)',
                                                    borderColor: themeColor,
                                                    borderWidth: 1,
                                                    padding: 10,
                                                    textStyle: { color: '#e2e8f0', fontFamily: 'monospace', fontSize: 10 },
                                                    formatter: (params: any) => {
                                                        if (params.dataType === 'node') {
                                                            const statusColor = params.data.status === 'Running' || params.data.status === 'Ready' || params.data.status === 'Healthy' || params.data.status === 'Онлайн' || params.data.status === 'В НОРМІ' ? 'text-green-400' : 'text-red-400';
                                                            return `<div class="font-bold text-xs text-primary-400 mb-1">${params.name}</div>
                                                                    <div class="text-[10px] text-slate-400">ТИП: ${params.data.category}</div>
                                                                    <div class="text-[10px] ${statusColor}">СТАТУС: ${params.data.status}</div>`;
                                                        }
                                                        return `<div class="text-[9px] text-slate-500">${params.data.source} → ${params.data.target}</div>`;
                                                    }
                                                },
                                                series: [{
                                                    type: 'graph',
                                                    layout: 'force',
                                                    force: { repulsion: 250, edgeLength: 80, gravity: 0.05 },
                                                    roam: true,
                                                    label: { show: true, position: 'bottom', color: '#64748b', fontSize: 9, fontFamily: 'monospace' },
                                                    edgeSymbol: ['none', 'arrow'],
                                                    edgeSymbolSize: [4, 8],
                                                    data: graphData.nodes,
                                                    links: graphData.links,
                                                    categories: [
                                                        { name: 'ВУЗОЛ', itemStyle: { color: isCommanderShell ? '#f59e0b' : '#3b82f6' } },
                                                        { name: 'ПОД', itemStyle: { color: isCommanderShell ? '#fbbf24' : '#10b981' } },
                                                        { name: 'СЕРВІС', itemStyle: { color: '#a855f7' } }
                                                    ],
                                                    lineStyle: { opacity: 0.3, curveness: 0.2, width: 1 },
                                                    emphasis: { focus: 'adjacency', lineStyle: { width: 3, opacity: 1, color: themeColor } }
                                                }]
                                            }}
                                            style={{ height: '100%', width: '100%' }}
                                            theme="dark"
                                        />
                                    </div>
                                </TacticalCard>

                                <TacticalCard
                                    variant="holographic"
                                    title={isCommanderShell ? 'ВЕКТОР АНОМАЛІЙ ШІ' : 'Аналіз Коефіцієнта Загрози'}
                                    className={`panel-3d overflow-hidden glass-ultra rounded-[32px] shadow-2xl ${isCommanderShell ? 'border-amber-500/20' : ''}`}
                                >
                                    <div className="relative h-44 flex flex-col items-center justify-center">
                                        <CyberOrb size={140} color={anomalyScore > 0.6 ? "#ef4444" : themeColor} className="opacity-60" />
                                        <div className="absolute text-center z-10 transition-transform duration-500 scale-110">
                                            <div className={`text-4xl font-display font-black tracking-tighter ${anomalyScore > 0.6 ? 'text-rose-500' : isCommanderShell ? 'text-amber-400' : 'text-blue-400'}`}>
                                                {(anomalyScore * 100).toFixed(1)}%
                                            </div>
                                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Коефіцієнт_Загрози</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2 px-4 pb-4">
                                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${anomalyScore * 100}%` }}
                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                className={`h-full ${anomalyScore > 0.6 ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : isCommanderShell ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b]' : 'bg-blue-500 shadow-[0_0_15px_#3b82f6]'}`}
                                            />
                                        </div>
                                    </div>
                                </TacticalCard>

                                <TacticalCard variant="holographic" title="Черги Повідомлень (Bus)" className="panel-3d glass-ultra rounded-[32px] shadow-2xl">
                                    <div className="space-y-4">
                                        {loading && queues.length === 0 ? (
                                            Array.from({ length: 4 }).map((_, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                                                    <Skeleton width={120} height={20} />
                                                    <Skeleton width={80} height={20} />
                                                </div>
                                            ))
                                        ) : queues.length > 0 ? queues.map((q, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5 group hover:border-blue-500/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <StatusIndicator
                                                        status={q.messages > 100 ? 'warning' : 'success'}
                                                        size="sm"
                                                        className="bg-transparent border-none p-0"
                                                        showPulse={q.messages > 100}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-white uppercase tracking-wider">{q.name}</span>
                                                        <span className="text-[8px] text-slate-500 font-mono">CHANNEL_V1.2</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-blue-400 font-mono">{q.messages} ПОВ</div>
                                                    <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{q.consumers} ОБРОБНИКІВ</div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-6 text-[10px] text-slate-600 font-black uppercase tracking-widest">Відсутні Активні Пайплайни</div>
                                        )}
                                    </div>
                                </TacticalCard>
                            </div>

                            <div className="lg:col-span-2 space-y-8">
                                <TacticalCard variant="holographic" title="Споживання Ресурсів Системи" className="panel-3d glass-ultra rounded-[32px] shadow-2xl min-h-[400px]">
                                    <div className="h-[320px] w-full group">
                                        <div className="absolute top-4 right-8 z-10 flex gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPU_CORE</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MEM_ALLOC</span>
                                            </div>
                                        </div>
                                        <ReactECharts
                                            option={{
                                                tooltip: { trigger: 'axis' },
                                                backgroundColor: 'transparent',
                                                grid: { left: 20, right: 20, top: 20, bottom: 40, containLabel: true },
                                                xAxis: {
                                                    type: 'category',
                                                    data: resourceData.map(d => d.time),
                                                    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                                                    axisLabel: { color: '#64748b', fontSize: 9 }
                                                },
                                                yAxis: {
                                                    type: 'value',
                                                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                                                    axisLabel: { color: '#64748b', fontSize: 9 }
                                                },
                                                series: [
                                                    {
                                                        name: 'ЦП (%)',
                                                        type: 'line',
                                                        smooth: true,
                                                        showSymbol: false,
                                                        data: resourceData.map(d => d.cpu),
                                                        lineStyle: { color: '#3b82f6', width: 3 },
                                                        areaStyle: {
                                                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                                                { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
                                                                { offset: 1, color: 'rgba(59, 130, 246, 0)' }
                                                            ])
                                                        }
                                                    },
                                                    {
                                                        name: 'Пам\'ять (%)',
                                                        type: 'line',
                                                        smooth: true,
                                                        showSymbol: false,
                                                        data: resourceData.map(d => d.memory),
                                                        lineStyle: { color: '#10b981', width: 3 },
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
                            </div>
                        </div>
                    )}

                    {activeTab === 'LOGS' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <TacticalCard variant="holographic" title="Loki: Аналізатор Логів" className="panel-3d glass-ultra rounded-[32px] overflow-hidden shadow-2xl">
                                <div className="space-y-4">
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                            <input
                                                value={logSearch}
                                                onChange={(e) => setLogSearch(e.target.value)}
                                                placeholder='{service="ua-sources"} |= "error"'
                                                className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-10 text-xs font-mono text-slate-300 focus:border-amber-500/50 outline-none transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setIsLiveTail(!isLiveTail)}
                                            className={`px-4 py-2 rounded-xl text-[10px] text-white font-black uppercase tracking-widest border flex items-center gap-2 btn-3d transition-all ${isLiveTail ? 'bg-emerald-600 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-800 border-slate-700'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${isLiveTail ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                                            {isLiveTail ? 'НАЖИВО' : 'ПАУЗА'}
                                        </button>
                                    </div>

                                    <div className="bg-black/60 rounded-2xl border border-white/5 p-4 h-[450px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1 relative">
                                        <div className="min-w-[600px]">
                                            {logs.map((log, idx) => (
                                                <div key={idx} className="flex gap-4 hover:bg-white/5 p-1 rounded-lg items-start animate-in slide-in-from-top-1 duration-200">
                                                    <span className="text-slate-500 shrink-0 w-12">{log.ts}</span>
                                                    <span className={`shrink-0 w-10 text-center font-black ${log.level === 'ERROR' ? 'text-rose-500' : log.level === 'WARN' ? 'text-amber-500' : 'text-blue-400'}`}>{log.level}</span>
                                                    <span className="text-slate-400 shrink-0 w-32 truncate opacity-60">[{log.service}]</span>
                                                    <span className="text-slate-200 whitespace-pre-wrap flex-1">{log.msg}</span>
                                                </div>
                                            ))}
                                            <div ref={logsEndRef}></div>
                                        </div>
                                    </div>
                                </div>
                            </TacticalCard>

                            <TacticalCard variant="holographic" title="Tempo: Розподілений Трейсинг" className="panel-3d glass-ultra rounded-[32px] overflow-hidden shadow-2xl">
                                <div className="relative h-full min-h-[500px] bg-black/40 border border-white/5 rounded-2xl p-6 overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex gap-4">
                                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] text-blue-400 font-mono">TRACE_ID: {selectedSaga?.traceId || 'N/A'}</div>
                                            <div className="px-3 py-1 bg-slate-500/10 border border-slate-500/20 rounded-lg text-[10px] text-slate-500 font-mono">245ms</div>
                                        </div>
                                        <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" /> СТАТУС: OK
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 relative">
                                        {[
                                            { name: 'Шлюз (Traefik)', color: 'blue', start: '0%', width: '10%' },
                                            { name: 'Бекенд API', color: 'emerald', start: '10%', width: '70%' },
                                            { name: 'Векторний Пошук', color: 'purple', start: '30%', width: '40%' },
                                            { name: 'Графова БД', color: 'amber', start: '60%', width: '25%' }
                                        ].map((trace, i) => (
                                            <div key={i} className="relative group">
                                                <div className="flex justify-between items-center mb-1 px-2">
                                                    <span className="text-[10px] text-slate-300 font-black uppercase tracking-wider">{trace.name}</span>
                                                    <span className="text-[9px] text-slate-500 font-mono">{i === 1 ? '172ms' : '12ms'}</span>
                                                </div>
                                                <div className="h-3 bg-slate-900/50 rounded-full overflow-hidden border border-white/5 relative">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: trace.width, left: trace.start }}
                                                        className={`absolute h-full bg-${trace.color}-500 shadow-[0_0_10px_currentColor] rounded-full`}
                                                        style={{ color: trace.color === 'emerald' ? '#10b981' : trace.color === 'blue' ? '#3b82f6' : trace.color === 'purple' ? '#a855f7' : '#f59e0b' }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-white/5">
                                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Метадані Трейсу</div>
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="text-[10px] font-mono text-slate-400">span.kind: internal</div>
                                            <div className="text-[10px] font-mono text-slate-400">http.status: 200</div>
                                        </div>
                                    </div>
                                </div>
                            </TacticalCard>
                        </div>
                    )}

                    {activeTab === 'SAGA' && renderSagaViz()}

                    {activeTab === 'JOBS' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Job Queue Monitor */}
                            <div className="lg:col-span-1">
                                <JobQueueMonitor />
                            </div>

                            {/* ETL Pipeline Viz */}
                            <div className="glass-ultra p-1 rounded-[32px] border border-white/5 shadow-2xl">
                                <div className="p-6">
                                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                                        <Layers className="text-blue-400" />
                                        Активні ETL Пайплайни
                                    </h3>
                                    <ETLPipelineVisualizer />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'LLM' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <LLMHealthMonitor />
                        </div>
                    )}

                    {activeTab === 'STORAGE' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <StorageAnalytics />
                        </div>
                    )}

                    {activeTab === 'NEURAL' && renderNeuralTrace()}
                    {activeTab === 'ANALYTICS' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Інтегрований Аналітичний Дашборд */}
                            <AnalyticsDashboard />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default MonitoringView;
