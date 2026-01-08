
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { Activity, BarChart3, Eye, CheckCircle2, XCircle, Search, GitCommit, Server, HardDrive, Cpu, Bot, Target, Network, Play, Pause, RefreshCw, Layers, ArrowRight, RotateCcw, Clock, Database, Brain, Zap, Code, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { StatusIndicator, Skeleton, CyberOrb, JobQueueMonitor, LLMHealthMonitor, StorageAnalytics, ETLPipelineVisualizer } from '../components';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { api } from '../services/api';
import { SagaTransaction } from '../types';
import { useUser, UserRole } from '../context/UserContext';
import { useShell, UIShell } from '../context/ShellContext';
import { useOmniscienceWS } from '../hooks/useOmniscienceWS';
import { NeutralizedContent } from '../components/NeutralizedContent';
import OpenSearchDashboardsEmbed from '../components/OpenSearchDashboardsEmbed';

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

const mockAlerts = [
    { severity: 'critical', name: 'ВисокеВикористанняПам\'яті', summary: 'Вузол k3s-master-01 пам\'ять > 90%', activeAt: '10хв тому' },
    { severity: 'warning', name: 'ЗатримкаКонектора', summary: 'Затримка Митниці UA > 500мс', activeAt: '2хв тому' },
];

const INITIAL_LOGS = [
    { ts: '10:45:22', service: 'ua-sources', level: 'INFO', msg: 'Успішно завантажено 1400 записів з API Митниці' },
    { ts: '10:45:21', service: 'ua-sources', level: 'WARN', msg: 'Наближення ліміту запитів OpenDataBot (80%)' },
    { ts: '10:45:15', service: 'predator-backend', level: 'INFO', msg: 'Оновлення JWT токена для користувача admin' },
    { ts: '10:45:10', service: 'customs-connector', level: 'ERROR', msg: 'Таймаут з\'єднання: open-api.customs.gov.ua (5000ms)' },
    { ts: '10:45:05', service: 'redis', level: 'INFO', msg: 'DB 0: 15 ключів видалено (TTL)' },
];

const MOCK_SAGAS: SagaTransaction[] = [
    {
        id: 'SAGA-1001',
        traceId: 'trc-a1b2c3d4',
        name: 'Імпорт Митної Декларації',
        status: 'COMPLETED',
        startTime: '10:42:00',
        steps: [
            { id: '1', service: 'ua-sources', action: 'Отримати API', status: 'COMPLETED', logs: 'Отримано 1 запис' },
            { id: '2', service: 'predator-db', action: 'Зберегти Raw', status: 'COMPLETED', logs: 'Вставлено ID 9921' },
            { id: '3', service: 'predator-vector', action: 'Створити Embedding', status: 'COMPLETED', logs: 'Вектор створено' },
            { id: '4', service: 'predator-graph', action: 'Оновити Граф', status: 'COMPLETED', logs: 'Вузол прив\'язано' }
        ]
    },
    {
        id: 'SAGA-1002',
        traceId: 'trc-x9y8z7',
        name: 'Аналіз Профілю Ризику',
        status: 'COMPENSATED',
        startTime: '10:44:15',
        steps: [
            { id: '1', service: 'med-gateway', action: 'Отримати Історію', status: 'COMPLETED', logs: 'Отримано 5 записів' },
            { id: '2', service: 'predator-ai', action: 'Запуск Моделі', status: 'FAILED', logs: 'Таймаут (30с)', compensatingAction: 'Очистити Кеш' },
            { id: '3', service: 'med-gateway', action: 'Компенсація Аудиту', status: 'COMPENSATED', logs: 'Аудит скасовано' }
        ]
    }
];

type MonTab = 'METRICS' | 'LOGS' | 'SAGA' | 'ANALYTICS' | 'JOBS' | 'LLM' | 'STORAGE' | 'NEURAL';

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
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [targets, setTargets] = useState<MonTarget[]>([]);
    const [graphData, setGraphData] = useState<{ nodes: GraphDataNode[], links: GraphDataLink[] }>({ nodes: [], links: [] });
    const [anomalyScore, setAnomalyScore] = useState(0.02);
    const [isLiveTail, setIsLiveTail] = useState(true);
    const [loading, setLoading] = useState(true);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(false);
    const [resourceData, setResourceData] = useState(
        Array.from({ length: 20 }, (_, i) => ({
            time: `${10 + Math.floor(i / 60)}:${(30 + i) % 60}`,
            cpu: Math.floor(Math.random() * 40) + 10,
            memory: Math.floor(Math.random() * 20) + 30,
            logs: Math.floor(Math.random() * 100),
        }))
    );
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
                        logs: Math.floor(Math.random() * 20) // Simulated log rate
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
                    const alerts = await api.v25.getLiveAlerts();
                    if (isMounted.current) setRealAlerts(alerts);
                } catch (e) {
                    console.warn("Failed to fetch alerts", e);
                }

                // Fetch Cluster Status for Graph
                const clusterResponse = await api.getClusterStatus();
                // Handle both array (legacy mock) and object (v25 real)
                const cluster: MonClusterStatus = Array.isArray(clusterResponse)
                    ? { status: 'Здоровий', nodes: clusterResponse as any as MonClusterNode[], pods: [] }
                    : clusterResponse as any as MonClusterStatus;

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

                         // Add Pods for this node (if available in cluster data, otherwise mock based on targets)
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

                     // If no pods found in cluster data (mock mode might not have them nested), use targets/services
                     if (nodes.length < 5) {
                         // Add mocked services/targets as nodes if cluster data is sparse
                        const data = await api.getMonitoringTargets();
                        if (isMounted.current) setTargets(data);

                        data.forEach((t: MonTarget) => {
                              nodes.push({
                                  name: t.name,
                                  category: 2, // SERVICE
                                  symbolSize: 30,
                                  itemStyle: { color: '#a855f7' },
                                  data: { category: 'СЕРВІС', status: t.status, latency: t.latency }
                              });
                              // Link to first node as parent (mock)
                              if (nodes[0]) links.push({ source: nodes[0].name, target: t.name });
                         });
                      }

                     setGraphData({ nodes, links });
                } else {
                     // Fallback if cluster status fails or is empty - construct from targets
                     const data = await api.getMonitoringTargets();
                     if (isMounted.current) {
                        setTargets(data);
                          const nodes: GraphDataNode[] = [
                            { name: 'Шлюз Кластера', category: 0, symbolSize: 50, itemStyle: { color: '#0ea5e9' }, data: { category: 'ШЛЮЗ', status: 'Онлайн' } }
                        ];
                        const links: GraphDataLink[] = [];
                        data.forEach((t: MonTarget) => {
                            nodes.push({
                                name: t.name,
                                category: 2, // SERVICE
                                symbolSize: 30,
                                itemStyle: { color: '#a855f7' },
                                data: { category: 'СЕРВІС', status: t.status, latency: t.latency }
                            });
                            links.push({ source: 'Шлюз Кластера', target: t.name });
                        });
                        setGraphData({ nodes, links });
                     }
                }

                // Fetch real V25 data
                const qData = await api.v25.getLiveQueues();
                if (isMounted.current) setQueues(qData);

                const hData = await api.v25.getLiveHealth();
                if (isMounted.current) {
                    setRealMetrics(hData);
                    // Use backend anomaly score if available, else derive
                    const score = hData.anomaly_score !== undefined
                        ? hData.anomaly_score
                        : (hData.cpu_load / 100 * 0.4) + (hData.memory_usage / 100 * 0.4) + (Math.random() * 0.2);
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
                logs: Math.floor(Math.random() * 100),
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-1 space-y-6">
                <TacticalCard variant="holographic" title="РЕЄСТР НЕЙРО-КОМАНД" className="min-h-[600px] border-white/5 bg-slate-950/40">
                    <div className="space-y-4">
                        {auditLogs.map(log => (
                            <motion.div
                                whileHover={{ scale: 1.02, x: 5 }}
                                key={log.id}
                                onClick={() => setSelectedAudit(log)}
                                className={`p-6 rounded-[24px] cursor-pointer transition-all duration-500 border relative overflow-hidden group ${selectedAudit?.id === log.id ? 'bg-purple-600/10 border-purple-500/50 shadow-[0_0_20px_purple]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{log.intent || 'DYNAMIC_INTENT'}</h4>
                                    <div className={`px-2 py-0.5 rounded text-[8px] font-bold ${log.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {log.status.toUpperCase()}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 italic mb-3">"{log.request_text}"</p>
                                <div className="flex justify-between text-[8px] font-mono text-slate-500">
                                    <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                                    <span>RISK: {log.risk_level}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </TacticalCard>
            </div>
            <div className="lg:col-span-2">
                <TacticalCard variant="holographic" title="NEURAL REASONING TRACE" className="min-h-[600px] border-white/5 bg-slate-950/40 flex flex-col">
                    {selectedAudit ? (
                        <div className="p-8 space-y-10">
                             <div className="flex items-center gap-6 p-6 bg-purple-600/5 rounded-3xl border border-purple-500/20">
                                <div className="p-4 bg-purple-600/20 rounded-2xl text-purple-400">
                                    <Brain size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase">{selectedAudit.intent}</h3>
                                    <p className="text-sm text-slate-400 font-mono mt-1">{selectedAudit.id}</p>
                                </div>
                             </div>

                             <div className="relative pl-12">
                                <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500 to-transparent" />
                                <div className="absolute left-0 top-2 w-8 h-8 rounded-full bg-slate-950 border-2 border-purple-500 flex items-center justify-center text-purple-400 z-10">
                                    <Target size={14} />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-purple-400 uppercase tracking-[0.2em]">Strategist Plan (Gemini)</h4>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed shadow-lg">
                                        {Array.isArray(selectedAudit.gemini_plan?.steps)
                                            ? selectedAudit.gemini_plan.steps.map((s: string, i: number) => <div key={i} className="mb-1">[{i+1}] {s}</div>)
                                            : (selectedAudit.gemini_plan || "No plan details available.")}
                                    </div>
                                </div>
                             </div>

                             {selectedAudit.thinking_process && (
                                <div className="relative pl-12 mt-12">
                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500 to-transparent" />
                                    <div className="absolute left-0 top-2 w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-500 flex items-center justify-center text-amber-400 z-10">
                                        <Zap size={14} />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em]">Inner Monologue (v25 Neuron)</h4>
                                        <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-xs text-amber-100/80 font-mono leading-relaxed italic">
                                            {selectedAudit.thinking_process}
                                        </div>
                                    </div>
                                </div>
                             )}

                             {selectedAudit.mistral_output && (
                                <div className="relative pl-12 mt-12">
                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 to-transparent" />
                                    <div className="absolute left-0 top-2 w-8 h-8 rounded-full bg-slate-950 border-2 border-blue-500 flex items-center justify-center text-blue-400 z-10">
                                        <Code size={14} />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Coder Output (Mistral/Groq)</h4>
                                        <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-[11px] text-blue-100/90 font-mono whitespace-pre-wrap overflow-x-auto">
                                            {selectedAudit.mistral_output}
                                        </div>
                                    </div>
                                </div>
                             )}

                             <div className="relative pl-12 mt-12">
                                <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500 to-transparent" />
                                <div className="absolute left-0 top-2 w-8 h-8 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 z-10">
                                    <CheckCircle2 size={14} />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">Security Audit (Aider/Copilot)</h4>
                                    <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-sm text-emerald-100/80 font-mono italic leading-relaxed shadow-inner">
                                        {typeof selectedAudit.copilot_audit === 'object' ? JSON.stringify(selectedAudit.copilot_audit, null, 2) : (selectedAudit.copilot_audit || "Audit summary not recorded.")}
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="px-4 py-2 bg-slate-950 rounded-xl border border-white/5 text-[9px] font-mono text-slate-400 uppercase">
                                            Execution: <span className="text-emerald-400">{selectedAudit.execution_time_ms}ms</span>
                                        </div>
                                        <div className="px-4 py-2 bg-slate-950 rounded-xl border border-white/5 text-[9px] font-mono text-slate-400 uppercase">
                                            Risk Score: <span className={selectedAudit.risk_level === 'high' ? 'text-rose-400' : 'text-emerald-400'}>{selectedAudit.risk_level.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-40">
                            <Brain size={100} />
                            <p className="mt-8 text-xs font-black uppercase tracking-widest">Select Trace to visualize reasoning</p>
                        </div>
                    )}
                </TacticalCard>
            </div>
        </div>
    );

    const renderSagaViz = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Saga List */}
            <div className="lg:col-span-1 space-y-6">
                <TacticalCard variant="holographic" title="РЕЄСТР SAGA ТРАНЗАКЦІЙ" className="min-h-[600px] border-white/5 bg-slate-950/40">
                    <div className="space-y-4">
                        {(realSagas.length > 0 ? realSagas : MOCK_SAGAS).map(saga => (
                            <motion.div
                                whileHover={{ scale: 1.02, x: 5 }}
                                whileTap={{ scale: 0.98 }}
                                key={saga.id}
                                onClick={() => setSelectedSaga(saga)}
                                className={`p-6 rounded-[24px] cursor-pointer transition-all duration-500 border relative overflow-hidden group ${selectedSaga?.id === saga.id ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.15)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl ${selectedSaga?.id === saga.id ? 'bg-blue-600 text-white shadow-[0_0_15px_#3b82f6]' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'} transition-colors`}>
                                            <Layers size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest leading-none">{saga.name}</h4>
                                            <p className="text-[9px] text-slate-500 font-mono mt-1.5">{saga.id}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${saga.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {saga.status === 'COMPLETED' ? 'ЗАВЕРШЕНО' : 'ВІДКОЧЕНО'}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-mono border-t border-white/5 pt-3">
                                    <div className="text-slate-500">INIT: <span className="text-slate-300">{saga.startTime}</span></div>
                                    <div className="text-slate-500 tracking-tighter">TRACE_ID: {saga.traceId.substring(0, 8)}...</div>
                                </div>
                                {selectedSaga?.id === saga.id && (
                                    <motion.div layoutId="sagaActive" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </TacticalCard>
            </div>

            {/* Saga Flow Visualization */}
            <div className="lg:col-span-2">
                <TacticalCard variant="holographic" title="ВІЗУАЛІЗАЦІЯ РОЗПОДІЛЕНОГО ТРЕЙСУ" className="min-h-[600px] border-white/5 bg-slate-950/40 flex flex-col">
                    {selectedSaga ? (
                        <div className="h-full flex flex-col">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-8 mb-12 p-8 bg-black/40 border border-white/5 rounded-[32px] backdrop-blur-md relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
                                <div className="p-5 bg-blue-600/20 rounded-2xl border border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                    <Layers size={36} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedSaga.name}</h3>
                                        <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-blue-500/20">v25_CORE</span>
                                    </div>
                                    <div className="mt-3 text-[10px] text-slate-500 font-mono flex items-center gap-6 uppercase tracking-widest">
                                        <span>TRACE: <span className="text-blue-400 font-bold">{selectedSaga.traceId}</span></span>
                                        <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                                        <span>STATUS: <span className="text-emerald-400 font-bold">СИНХРОНІЗОВАНО</span></span>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="relative pl-16 space-y-10 flex-1">
                                <div className="absolute left-7 top-4 bottom-4 w-[2px] bg-slate-800/50 rounded-full overflow-hidden">
                                     <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: '100%' }}
                                        transition={{ duration: 1.5, ease: "easeInOut" }}
                                        className="w-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_15px_#3b82f6]"
                                     />
                                </div>

                                {selectedSaga.steps.map((step, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={step.id}
                                        className="relative flex items-center gap-8 group"
                                    >
                                        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center bg-slate-950 z-10 transition-all duration-500 shadow-2xl ${
                                            step.status === 'COMPLETED' ? 'border-emerald-500 text-emerald-400 shadow-emerald-500/20' :
                                            step.status === 'FAILED' ? 'border-rose-500 text-rose-400 shadow-rose-500/20' :
                                            step.status === 'COMPENSATED' ? 'border-amber-500 text-amber-400 shadow-amber-500/20' :
                                            'border-slate-800 text-slate-600'
                                        } group-hover:scale-110`}>
                                            {step.status === 'COMPLETED' && <CheckCircle2 size={24} />}
                                            {step.status === 'FAILED' && <XCircle size={24} />}
                                            {step.status === 'COMPENSATED' && <RotateCcw size={24} />}
                                            {!['COMPLETED', 'FAILED', 'COMPENSATED'].includes(step.status) && <Clock size={24} />}
                                        </div>

                                        <div className={`flex-1 p-6 rounded-[32px] border backdrop-blur-md transition-all duration-500 group-hover:border-white/20 group-hover:bg-white/5 ${
                                            step.status === 'FAILED' ? 'bg-rose-500/5 border-rose-500/20' :
                                            step.status === 'COMPENSATED' ? 'bg-amber-500/5 border-amber-500/20' :
                                            'bg-slate-900/40 border-white/5 shadow-xl'
                                        }`}>
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 text-blue-400">
                                                        <Server size={16} />
                                                    </div>
                                                    <span className="text-[11px] font-black text-white uppercase tracking-widest">{step.service}</span>
                                                </div>
                                                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                                    {step.logs || '0.0ms'}
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-400 uppercase font-black tracking-tight leading-none">
                                                Виконання: <span className="text-slate-200 ml-1">{step.action}</span>
                                            </div>
                                            {step.status === 'COMPENSATED' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-4 pt-4 border-t border-amber-500/20 flex items-center gap-4"
                                                >
                                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                                        <RotateCcw size={14} />
                                                    </div>
                                                    <div className="text-[10px] text-amber-400 font-black uppercase tracking-widest">
                                                       Компенсуюча Дія: {step.compensatingAction}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-800 min-h-[500px]">
                            <Layers size={64} className="opacity-10 mb-8" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center opacity-30">
                                Оберіть транзакцію для аналізу
                            </p>
                        </div>
                    )}
                </TacticalCard>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 w-full max-w-[1700px] mx-auto relative z-10 min-h-screen">
            <AdvancedBackground showStars={true} />
            <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay z-[100]" />

            <ViewHeader
                title={isCommanderShell ? 'МОНІТОР НЕЙРОННОГО КОРТЕКСУ' : isOperatorShell ? 'ТАКТИЧНА СПОСТЕРЕЖНІСТЬ' : 'ЗДОРОВ\'Я СИСТЕМИ'}
                icon={<Activity size={20} className={isCommanderShell ? 'text-amber-400' : isOperatorShell ? 'text-emerald-400' : 'text-blue-400'} />}
                breadcrumbs={['СИНАПСИС', 'СИСТЕМА', 'МОНІТОРИНГ']}
                stats={[
                    { label: 'Prometheus', value: realMetrics?.status === 'online' ? 'СИНХРОНІЗОВАНО' : 'ОФЛАЙН', icon: <Eye size={14} />, color: realMetrics?.status === 'online' ? 'success' : 'danger' },
                    { label: 'Ядро Saga', value: 'АКТИВНЕ', icon: <Layers size={14} />, color: 'primary' },
                    { label: 'Інциденти', value: String(realAlerts.length || 0), icon: <Activity size={14} />, color: realAlerts.some(a => a.severity === 'critical') ? 'danger' : 'warning' },
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

                            {tab === 'METRICS' ? 'Метрики' :
                             tab === 'LOGS' ? 'Логи' :
                             tab === 'JOBS' ? 'Задачі' :
                             tab === 'LLM' ? 'AI_Core' :
                             tab === 'STORAGE' ? 'Сховище' :
                             tab === 'ANALYTICS' ? 'Dashboards' :
                             tab === 'NEURAL' ? 'Neural Trace' : 'Saga'}

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
                                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Здоров'я Ядра</h3>
                                            <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">K3S_CONTROL_PLANE</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        {loading ? (
                                            <Skeleton width={80} height={24} />
                                        ) : (
                                            <StatusIndicator
                                                status={realMetrics?.status === 'online' ? 'success' : 'error'}
                                                label={realMetrics?.status === 'online' ? 'АКТИВНЕ' : 'ОФЛАЙН'}
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
                                {wsData?.pulse && (
                                    <TacticalCard
                                        variant="holographic"
                                        title="SYSTEM PULSE AGGREGATOR"
                                        className="panel-3d glass-ultra rounded-[32px] border-white/5 overflow-hidden shadow-2xl relative"
                                    >
                                        <div className="absolute top-2 right-4 text-[10px] font-black text-slate-500 uppercase">v25_CORE</div>
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
                                                        <span className="text-[11px] font-black text-emerald-100 uppercase tracking-widest">ОПТИМАЛЬНИЙ РЕЖИМ</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TacticalCard>
                                )}

                                 <TacticalCard
                                    variant="holographic"
                                    title={isCommanderShell ? 'NEURAL_TOPOLOGY' : 'МАТРИЦЯ СЕРВІСІВ'}
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
                                    title={isCommanderShell ? 'AI_ANOMALY_VECTOR' : 'Аналіз Коефіцієнта Загрози'}
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
                                            Array.from({length: 4}).map((_, i) => (
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
                                                    <div className="text-xs font-black text-blue-400 font-mono">{q.messages} MSG</div>
                                                    <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{q.consumers} WORKERS</div>
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
                                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] text-blue-400 font-mono">TRACE_ID: {MOCK_SAGAS[0].traceId}</div>
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
                            <TacticalCard variant="holographic" title="OPENSEARCH DASHBOARDS ANALYTICS" className="panel-3d glass-ultra rounded-[32px] shadow-2xl">
                                <div className="p-4">
                                    <OpenSearchDashboardsEmbed
                                        dashboardId="search-analytics"
                                        height={650}
                                        title="Аналітика Пошукових Запитів"
                                        showHeader={true}
                                    />
                                </div>
                            </TacticalCard>

                            {/* Quick Stats from OpenSearch */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="glass-ultra p-6 rounded-2xl border border-orange-500/20 flex flex-col items-center justify-center">
                                    <div className="text-3xl font-black text-orange-400 font-mono">12,458</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">Запитів Сьогодні</div>
                                </div>
                                <div className="glass-ultra p-6 rounded-2xl border border-emerald-500/20 flex flex-col items-center justify-center">
                                    <div className="text-3xl font-black text-emerald-400 font-mono">45ms</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">Середня Латенсі</div>
                                </div>
                                <div className="glass-ultra p-6 rounded-2xl border border-blue-500/20 flex flex-col items-center justify-center">
                                    <div className="text-3xl font-black text-blue-400 font-mono">99.8%</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">Успішність</div>
                                </div>
                                <div className="glass-ultra p-6 rounded-2xl border border-purple-500/20 flex flex-col items-center justify-center">
                                    <div className="text-3xl font-black text-purple-400 font-mono">2.1M</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">Документів Індексовано</div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default MonitoringView;
