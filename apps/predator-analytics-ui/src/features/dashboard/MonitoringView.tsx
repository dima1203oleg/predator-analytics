/**
 * 🦅 PREDATOR v58.2 — ЯДРО МОНІТОРИНГУ (WRAITH CORE)
 * Розділ I.6 — Операційний моніторинг платформи.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    Boxes,
    CheckCircle2,
    Clock3,
    Database,
    Layers3,
    Loader2,
    Network,
    Pause,
    Play,
    RefreshCw,
    Search,
    Server,
    Terminal,
    Shield,
    Cpu,
    Zap,
    ArrowUpRight,
    AlertOctagon,
    Box
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import { PageTransition } from '@/components/layout/PageTransition';

import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { ingestionApi, type JobStatusResponse } from '@/services/api/ingestion';
import { systemApi, type SystemStatsResponse, type SystemStatusResponse } from '@/services/api/system';
import { cn } from '@/utils/cn';
import {
    appendMetricPoint,
    formatBytes,
    formatCount,
    formatDateTime,
    formatLatency,
    formatPercent,
    getStatusMeta,
    hasVisibleClusterData,
    normalizeClusterSnapshot,
    normalizeJobStatusResponse,
    normalizeSystemLogs,
    type ClusterSnapshot,
    type MetricPoint,
    type MonitoringLogRecord,
    type PipelineJobRecord,
    type StatusTone,
} from './monitoringView.utils';

type Tab = 'metrics' | 'logs' | 'pipelines' | 'nodes';

const tabs: Array<{ key: Tab; label: string; icon: JSX.Element }> = [
    { key: 'metrics', label: 'МЕТРИКИ', icon: <Activity size={16} /> },
    { key: 'logs', label: 'ЛОГИ СИСТЕМИ', icon: <Terminal size={16} /> },
    { key: 'pipelines', label: 'ПАЙПЛАЙНИ', icon: <Layers3 size={16} /> },
    { key: 'nodes', label: 'ВУЗЛИ КЛАСТЕРА', icon: <Server size={16} /> },
];

const toneClasses: Record<StatusTone, { badge: string; icon: string; border: string; glow: string }> = {
    emerald: {
        badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        icon: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
        border: 'border-emerald-500/15',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    },
    amber: {
        badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        icon: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
        border: 'border-amber-500/15',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    },
    rose: {
        badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        icon: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
        border: 'border-amber-500/15',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    },
    sky: {
        badge: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
        icon: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
        border: 'border-sky-500/15',
        glow: 'shadow-[0_0_15px_rgba(14,165,233,0.3)]',
    },
    slate: {
        badge: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
        icon: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
        border: 'border-slate-500/15',
        glow: 'shadow-[0_0_15px_rgba(71,85,105,0.3)]',
    },
};

const buildChartOption = (cpuHistory: MetricPoint[], memoryHistory: MetricPoint[]) => {
    const labels = cpuHistory.length >= memoryHistory.length
        ? cpuHistory.map((point) => point.label)
        : memoryHistory.map((point) => point.label);

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(5, 10, 20, 0.95)',
            borderColor: 'rgba(56, 189, 248, 0.2)',
            textStyle: { color: '#fff', fontSize: 11, fontFamily: 'monospace' },
            borderWidth: 1,
            padding: 10,
        },
        legend: {
            top: 10,
            right: 10,
            data: ['ЦП', 'ОЗП'],
            textStyle: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },
        },
        grid: { top: 60, left: 50, right: 30, bottom: 40 },
        xAxis: {
            type: 'category',
            data: labels,
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            axisLabel: { color: '#475569', fontSize: 9, fontWeight: 'bold' },
            splitLine: { show: false },
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLabel: { color: '#475569', fontSize: 9, fontWeight: 'bold' },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)', type: 'dashed' } },
        },
        series: [
            {
                name: 'ЦП',
                type: 'line',
                smooth: true,
                symbol: 'none',
                data: cpuHistory.map((point) => point.value),
                lineStyle: { width: 3, color: '#0ea5e9' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(14, 165, 233, 0.2)' },
                            { offset: 1, color: 'rgba(14, 165, 233, 0)' },
                        ],
                    },
                },
            },
            {
                name: 'ОЗП',
                type: 'line',
                smooth: true,
                symbol: 'none',
                data: memoryHistory.map((point) => point.value),
                lineStyle: { width: 3, color: '#f59e0b' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(245, 158, 11, 0.15)' },
                            { offset: 1, color: 'rgba(245, 158, 11, 0)' },
                        ],
                    },
                },
            },
        ],
    };
};

const ResourceBar = ({ label, value, detail, tone }: { label: string; value: number | null; detail: string; tone: StatusTone }) => {
    const styles = toneClasses[tone];
    return (
        <div className="space-y-3 p-6 rounded-[2rem] bg-black/40 border border-white/[0.05] hover:border-white/[0.1] transition-all">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">{label}</span>
                <span className={cn("text-xl font-black font-mono tracking-tighter italic", styles.icon.split(' ')[2])}>{formatPercent(value)}</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/[0.03]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value || 0}%` }}
                    className={cn('h-full transition-all duration-1000', styles.icon.split(' ')[1])}
                />
            </div>
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{detail}</div>
        </div>
    );
};

const MetricTile = ({ label, value, hint, icon, tone }: { label: string; value: string; hint: string; icon: JSX.Element; tone: StatusTone }) => {
    const styles = toneClasses[tone];
    return (
        <div className={cn('p-6 rounded-[2.5rem] bg-black/40 border border-white/[0.05] hover:border-white/[0.1] transition-all relative overflow-hidden group', styles.glow)}>
            <div className="flex items-center justify-between">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border transition-all group-hover:scale-110', styles.icon)}>
                    {icon}
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 italic leading-none mb-2">{label}</div>
                    <div className="text-2xl font-black font-mono tracking-tighter text-white italic leading-none">{value}</div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.03] text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none">{hint}</div>
        </div>
    );
};

const EmptyPanel = ({ title, description }: { title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center p-12 rounded-[3rem] border-2 border-dashed border-white/[0.05] bg-black/30 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500/50" />
        <div className="text-xl font-black text-white italic uppercase tracking-tighter">{title}</div>
        <div className="max-w-md text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{description}</div>
    </div>
);

const MonitoringView: React.FC = () => {
    const backendStatus = useBackendStatus();
    const [activeTab, setActiveTab] = useState<Tab>('metrics');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [logsLoading, setLogsLoading] = useState(true);
    const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
    const [systemStats, setSystemStats] = useState<SystemStatsResponse | null>(null);
    const [cluster, setCluster] = useState<ClusterSnapshot>(normalizeClusterSnapshot(null));
    const [pipelineJobs, setPipelineJobs] = useState<PipelineJobRecord[]>([]);
    const [logs, setLogs] = useState<MonitoringLogRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [pauseStream, setPauseStream] = useState(false);
    const [cpuHistory, setCpuHistory] = useState<MetricPoint[]>([]);
    const [memoryHistory, setMemoryHistory] = useState<MetricPoint[]>([]);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

    const loadSnapshot = useCallback(async (silent: boolean = false) => {
        if (silent) setRefreshing(true); else setLoading(true);
        try {
            const [statusResponse, statsResponse, clusterResponse, jobsResponse] = await Promise.all([
                systemApi.getStatus().catch(() => null),
                systemApi.getStats().catch(() => null),
                systemApi.getCluster().catch(() => null),
                ingestionApi.getJobs(10).catch(() => [] as JobStatusResponse[]),
            ]);
            setSystemStatus(statusResponse);
            setSystemStats(statsResponse);
            setCluster(normalizeClusterSnapshot(clusterResponse));
            setPipelineJobs(normalizeJobStatusResponse(jobsResponse));
            if (statsResponse) {
                setCpuHistory((prev) => appendMetricPoint(prev, statsResponse.cpu_percent, statsResponse.timestamp));
                setMemoryHistory((prev) => appendMetricPoint(prev, statsResponse.memory_percent, statsResponse.timestamp));
            }
            if (statusResponse || statsResponse || clusterResponse || jobsResponse.length > 0) {
                setLastSyncedAt(statsResponse?.timestamp ?? statusResponse?.timestamp ?? new Date().toISOString());
            }
        } catch (e) {
            console.error('[Моніторинг] Помилка:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadLogs = useCallback(async (showLoader: boolean = false) => {
        if (showLoader) setLogsLoading(true);
        try {
            const response = await systemApi.getLogs(150).catch(() => []);
            setLogs(normalizeSystemLogs(response));
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSnapshot();
        void loadLogs(true);
        const interval = window.setInterval(() => void loadSnapshot(true), 12000);
        return () => window.clearInterval(interval);
    }, [loadSnapshot, loadLogs]);

    // Diagnostic reporting via predator-error protocol
    useEffect(() => {
        if (backendStatus.isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'MonitoringCore',
                    message: `АВТОНОМНИЙ МОНІТОРИНГ [${backendStatus.nodeSource}]: Зв'язок з NVIDIA Master втрачено. Використовується резервний вузол MIRROR.`,
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'MONITORING_OFFLINE'
                }
            }));
        } else if (!loading) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'MonitoringCore',
                    message: `ЯДРО МОНІТОРИНГУ [${backendStatus.nodeSource}]: Синхронізація з кластером активна. Телеметрія стабільна.`,
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'MONITORING_SUCCESS'
                }
            }));
        }
    }, [backendStatus.isOffline, backendStatus.nodeSource, loading]);

    useEffect(() => {
        if (pauseStream) return undefined;
        const interval = window.setInterval(() => void loadLogs(), 4000);
        return () => window.clearInterval(interval);
    }, [pauseStream, loadLogs]);

    const handleManualRefresh = useCallback(async () => {
        await Promise.all([loadSnapshot(true), loadLogs(true)]);
    }, [loadSnapshot, loadLogs]);

    const overallStatusMeta = getStatusMeta(
        backendStatus.isOffline ? 'offline' : (systemStatus?.overall_status ?? systemStatus?.status ?? null)
    );
    const averageLatency = systemStats?.avg_latency ?? (systemStatus as any)?.metrics?.avg_latency;
    const uptimeLabel = systemStatus?.uptime ?? systemStats?.uptime ?? 'Н/д';
    const services = systemStatus?.services ?? [];
    const serviceSummary = systemStatus?.summary ?? {
        total: services.length,
        healthy: services.filter(s => getStatusMeta(s.status).tone === 'emerald').length,
        degraded: services.filter(s => getStatusMeta(s.status).tone === 'amber').length,
        failed: services.filter(s => getStatusMeta(s.status).tone === 'amber').length,
    };

    const filteredLogs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return logs;
        return logs.filter(log => `${log.service} ${log.level} ${log.message}`.toLowerCase().includes(query));
    }, [logs, searchQuery]);

    const chartOption = useMemo(() => buildChartOption(cpuHistory, memoryHistory), [cpuHistory, memoryHistory]);

    return (
        <PageTransition>
            <div className="relative min-h-screen overflow-hidden bg-[#020617] pb-24 text-slate-200">
                <CyberGrid color="rgba(56, 189, 248, 0.03)" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(14,165,233,0.08),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 mx-auto max-w-[1750px] space-y-10 p-6 lg:p-12">
                    
                    {/* Header Contour */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 py-6 border-b border-white/[0.04]">
                        <div className="flex items-center gap-8">
                             <div className="relative group">
                                <div className="absolute inset-0 bg-sky-600/20 blur-3xl rounded-full" />
                                <div className="relative p-6 bg-black border border-sky-900/40 rounded-[2rem] shadow-2xl">
                                   <Activity size={42} className="text-sky-500 animate-pulse" />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                   <span className="badge-v2 bg-sky-600/10 border border-sky-600/20 text-sky-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                     ЯДРО_СИСТЕМИ // ОПЕРАЦІЙНЕ_КОМАНДУВАННЯ
                                   </span>
                                   <div className="h-px w-12 bg-sky-600/20" />
                                   <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v58.2-WRAITH</span>
                                </div>
                                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                                  ОПЕРАЦІЙНИЙ <span className="text-sky-500">МОНІТОРИНГ</span>
                                </h1>
                                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                                  Метрики Ядра • Потік Подій • Шлюзи Інгвестії • Архітектура Вузлів
                                </p>
                             </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-black/40 p-5 rounded-[2.5rem] border border-white/[0.05] shadow-2xl">
                               <div className="text-center px-4">
                                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">СТАН</p>
                                  <p className={cn("text-lg font-black italic", overallStatusMeta.tone === 'emerald' ? 'text-emerald-500' : 'text-amber-500')}>{overallStatusMeta.label}</p>
                               </div>
                               <div className="text-center px-4 border-l border-white/5">
                                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">СЕРВІСИ</p>
                                  <p className="text-lg font-black text-white italic">{serviceSummary.healthy}/{serviceSummary.total}</p>
                               </div>
                               <div className="text-center px-4 border-l border-white/5">
                                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">ЗАТРИМКА_API</p>
                                  <p className="text-lg font-black text-sky-400 italic font-mono">{formatLatency(averageLatency)}</p>
                               </div>
                               <div className="text-center px-4 border-l border-white/5">
                                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">ЧАС_РОБОТИ (UPTIME)</p>
                                  <p className="text-lg font-black text-white italic font-mono uppercase">{uptimeLabel}</p>
                               </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleManualRefresh}
                                className="px-10 py-5 bg-sky-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-sky-600 transition-all border border-sky-500/40 flex items-center gap-4 shadow-xl italic group"
                            >
                                {refreshing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />}
                                ОНОВИТИ_ДАНІ
                            </button>
                        </div>
                    </div>

                    {/* Tabs HUD */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-4 bg-black/40 rounded-[2.5rem] border border-white/[0.05] shadow-2xl">
                        <div className="flex flex-wrap gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        'px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-4 italic',
                                        activeTab === tab.key
                                            ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                                            : 'bg-white/[0.02] text-slate-500 border border-white/[0.03] hover:text-slate-300 hover:bg-white/[0.05]'
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-6 px-4">
                            <div className="flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">ДЖЕРЕЛО: {backendStatus.sourceLabel}</span>
                            </div>
                            <div className="h-10 w-px bg-white/5" />
                            <div className="text-right">
                               <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none mb-1">ОСТАННЯ СИНХРОНІЗАЦІЯ ЯДРА</p>
                               <p className="text-[11px] font-bold text-slate-400 font-mono italic uppercase tracking-tighter">{formatDateTime(lastSyncedAt) || 'ОЧІКУВАННЯ_ПОТОКУ'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-10">
                        <div className="col-span-12 xl:col-span-9 space-y-10">
                            <AnimatePresence mode="wait">
                                {activeTab === 'metrics' && (
                                    <motion.div key="metrics" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                                        
                                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                            {/* Advanced Chart HUD */}
                                            <section className="xl:col-span-8 p-8 rounded-[3rem] bg-black/60 border-2 border-white/[0.04] shadow-3xl group">
                                                <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/[0.04]">
                                                    <div className="flex items-center gap-6">
                                                        <div className="p-4 rounded-[1.25rem] bg-sky-600/10 text-sky-500 border border-sky-600/20">
                                                           <Cpu size={22} className="animate-pulse" />
                                                        </div>
                                                        <div>
                                                           <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">СИНТЕТИЧНА ДИНАМІКА РЕСУРСІВ</h3>
                                                           <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] leading-none">НАВАНТАЖЕННЯ: {systemStats?.cpu_percent || 0}% РЕАЛЬНИЙ ЧАС</p>
                                                        </div>
                                                    </div>
                                                    {refreshing && <Loader2 className="h-6 w-6 animate-spin text-sky-400" />}
                                                </div>

                                                {cpuHistory.length > 0 || memoryHistory.length > 0 ? (
                                                    <div className="h-[400px] w-full">
                                                       <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                                                    </div>
                                                ) : (
                                                    <EmptyPanel title="ЧЕКАЮ НА ТЕЛЕМЕТРІЮ" description="Дані з /system/stats ще не надійшли. Система знаходиться у фазі очікування потоку." />
                                                )}
                                            </section>

                                            {/* Sidebar Tech Specs */}
                                            <section className="xl:col-span-4 space-y-6">
                                                <ResourceBar
                                                    label="ЗАВАНТАЖЕННЯ ЦП"
                                                    value={systemStats?.cpu_percent ?? null}
                                                    detail={`${systemStats?.cpu_count || 0} ЛОГІЧНИХ ЯДЕР // ${systemStats?.active_tasks || 0} ПОТОКІВ`}
                                                    tone="sky"
                                                />
                                                <ResourceBar
                                                    label="ПАМ'ЯТЬ ЯДРА"
                                                    value={systemStats?.memory_percent ?? null}
                                                    detail={`${formatBytes(systemStats?.memory_used)} / ${formatBytes(systemStats?.memory_total)}`}
                                                    tone="amber"
                                                />
                                                <ResourceBar
                                                    label="ДИСКОВИЙ ПРОСТІР"
                                                    value={systemStats?.disk_percent ?? null}
                                                    detail={`${formatBytes(systemStats?.disk_used)} / ${formatBytes(systemStats?.disk_total)}`}
                                                    tone={systemStats?.disk_percent != null && systemStats.disk_percent >= 85 ? 'amber' : 'emerald'}
                                                />
                                            </section>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                             <MetricTile label="ЗАТРИМКА_API" value={formatLatency(averageLatency)} hint="ЗАПИТ ЧЕРЕЗ /SYSTEM/STATS" icon={<Clock3 size={20} />} tone={averageLatency > 800 ? 'amber' : 'sky'} />
                                             <MetricTile label="МЕРЕЖЕВІ СЕСІЇ" value={formatCount(systemStats?.active_connections)} hint="АКТИВНІ З'ЄДНАННЯ TCP/IP" icon={<Network size={20} />} tone="sky" />
                                             <MetricTile label="ОБ'ЄМ_БД" value={formatCount(systemStats?.documents_total)} hint="ПІДТВЕРДЖЕНО В ШАРІ ЗБЕРЕЖЕННЯ" icon={<Database size={20} />} tone="emerald" />
                                            <MetricTile label="ІНДЕКС_MAP" value={formatCount(systemStats?.total_indices)} hint="КІЛЬКІСТЬ ПОШУКОВИХ ШАРІВ" icon={<Layers3 size={20} />} tone="amber" />
                                            <MetricTile label="МЕРЕЖА_ВХІД" value={formatBytes(systemStats?.network_bytes_recv)} hint="ВХІДНИЙ ТРАФІК TITAN" icon={<Zap size={20} />} tone="sky" />
                                            <MetricTile label="МЕРЕЖА_ВИХІД" value={formatBytes(systemStats?.network_bytes_sent)} hint="ВИХІДНИЙ ТРАФІК TITAN" icon={<Boxes size={20} />} tone="slate" />
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'logs' && (
                                    <motion.div key="logs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                                        <div className="flex flex-col xl:flex-row gap-6 p-6 bg-black/40 rounded-[2.5rem] border border-white/[0.05] shadow-2xl items-center">
                                            <div className="relative flex-1 group">
                                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-hover:text-sky-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    placeholder="ФІЛЬТРАЦІЯ ЛОГІВ ЗА СЕРВІСОМ, РІВНЕМ АБО ТЕКСТОМ..."
                                                    className="w-full h-16 bg-black/60 rounded-2xl border-2 border-white/[0.05] pl-16 pr-8 text-sm font-black italic tracking-tight text-white focus:border-sky-500/40 focus:outline-none transition-all placeholder:text-slate-700"
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                               <button onClick={() => setPauseStream(!pauseStream)} className={cn("px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic border transition-all flex items-center gap-4", pauseStream ? "bg-amber-600/10 border-amber-500/30 text-amber-500" : "bg-sky-600/10 border-sky-500/30 text-sky-500")}>
                                                  {pauseStream ? <Play size={18} /> : <Pause size={18} />}
                                                  {pauseStream ? 'ВІДНОВИТИ' : 'ПАУЗА_ПОТОКУ'}
                                               </button>
                                               <button onClick={() => setLogs([])} className="px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic border border-white/[0.05] text-slate-500 hover:text-white transition-all">
                                                  ОЧИСТИТИ [LOCAL]
                                               </button>
                                            </div>
                                        </div>

                                        <section className="rounded-[3rem] bg-black border border-white/[0.05] shadow-3xl overflow-hidden">
                                            <div className="h-[700px] overflow-y-auto p-10 font-mono text-[13px] relative">
                                                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-black to-transparent z-10" />
                                                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black to-transparent z-10" />
                                                
                                                {logsLoading ? (
                                                    <div className="flex flex-col items-center justify-center h-full gap-6 opacity-40">
                                                       <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
                                                       <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">ПІДКЛЮЧЕННЯ ДО ПОТОКУ...</p>
                                                    </div>
                                                ) : filteredLogs.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {filteredLogs.map(log => {
                                                            const meta = getStatusMeta(log.level);
                                                            return (
                                                                <div key={log.id} className="group p-6 rounded-3xl border border-white/[0.03] bg-white/[0.01] hover:border-white/[0.08] hover:bg-white/[0.02] transition-all relative overflow-hidden">
                                                                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-40 group-hover:opacity-100 transition-opacity", meta.tone === 'amber' ? 'bg-red-600' : 'bg-sky-600')} />
                                                                    <div className="flex items-center gap-6 mb-4">
                                                                       <span className={cn("text-[9px] font-black px-4 py-1 rounded-lg uppercase tracking-widest border", toneClasses[meta.tone].badge)}>
                                                                          {log.level}
                                                                       </span>
                                                                       <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em] italic">{log.service || 'ЯДРО'}</span>
                                                                       <span className="ml-auto text-[10px] text-slate-700 font-bold tabular-nums italic uppercase">{log.timestampLabel}</span>
                                                                    </div>
                                                                    <p className="text-slate-300 font-bold leading-relaxed tracking-tight group-hover:text-white transition-colors">{log.message}</p>
                                                                    {log.latencyLabel && (
                                                                        <div className="mt-4 flex items-center gap-2">
                                                                           <Clock3 size={12} className="text-slate-700" />
                                                                           <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">ЗАТРИМКА: {log.latencyLabel}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <EmptyPanel title="ПОДІЇ НЕ ВИЯВЛЕНІ" description="Ядро системи не транслює подій у цьому диапазоні. Перевірте статус Kafka-інгестії." />
                                                )}
                                            </div>
                                        </section>
                                    </motion.div>
                                )}

                                {activeTab === 'pipelines' && (
                                    <motion.div key="pipelines" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <MetricTile label="АКТИВНІ_ЗАВДАННЯ" value={formatCount(pipelineJobs.filter(j => j.isActive).length)} hint="ЖИВІ ПРОЦЕСИ ІНГЕСТІЇ" icon={<Activity size={20} />} tone="sky" />
                                            <MetricTile label="УСПІШНО" value={formatCount(pipelineJobs.filter(j => j.tone === 'emerald').length)} hint="ЗАВЕРШЕНІ СЬОГОДНІ" icon={<CheckCircle2 size={20} />} tone="emerald" />
                                            <MetricTile label="КРИТИЧНО" value={formatCount(pipelineJobs.filter(j => j.tone === 'amber').length)} hint="ПОТРЕБУЮТЬ УВАГИ" icon={<AlertOctagon size={20} />} tone="amber" />
                                         </div>

                                         <section className="rounded-[3rem] bg-black border-2 border-white/[0.04] p-10 shadow-3xl">
                                             <div className="flex items-center gap-6 mb-10 pb-8 border-b border-white/[0.04]">
                                                 <div className="p-4 rounded-2xl bg-yellow-600/10 text-yellow-500 border border-yellow-600/20">
                                                    <Layers3 size={24} />
                                                 </div>
                                                 <div>
                                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">ДИСПЕТЧЕР ПАЙПЛАЙНІВ</h3>
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] leading-none">РЕЄСТР ЗАВДАНЬ ІНГЕСТІЇ ТА ОБРОБКИ</p>
                                                 </div>
                                             </div>

                                             <div className="space-y-6">
                                                 {pipelineJobs.length > 0 ? pipelineJobs.map(job => (
                                                     <div key={job.id} className={cn("p-8 rounded-[2.5rem] border-2 bg-black/40 hover:bg-black/80 transition-all group/job relative overflow-hidden", toneClasses[job.tone].border)}>
                                                         <div className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-50 group-hover/job:opacity-100 transition-opacity", toneClasses[job.tone].icon.split(' ')[2])} />
                                                         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                                                            <div className="space-y-4">
                                                               <div className="flex items-center gap-4">
                                                                  <span className={cn("px-4 py-1 rounded-lg text-[9px] font-black italic tracking-widest uppercase border", toneClasses[job.tone].badge)}>
                                                                     {job.statusLabel}
                                                                  </span>
                                                                  <span className="text-[10px] font-mono font-black text-slate-700 tracking-widest">{job.id}</span>
                                                               </div>
                                                               <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none group-hover/job:text-sky-400 transition-colors">{job.title}</h4>
                                                               <div className="flex items-center gap-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                                                                  <span>ЕТАП: {job.stageLabel}</span>
                                                                  <div className="h-1 w-1 bg-slate-800 rounded-full" />
                                                                  <span>ПУСК: {job.startedAtLabel}</span>
                                                               </div>
                                                            </div>

                                                            <div className="w-full xl:w-96 space-y-4">
                                                               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest italic leading-none">
                                                                  <span className="text-slate-500">ПРОГРЕС ІНГЕСТІЇ</span>
                                                                  <span className="text-white">{job.progressLabel}</span>
                                                               </div>
                                                               <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/[0.03] shadow-inner">
                                                                  <motion.div 
                                                                    initial={{ width: 0 }} 
                                                                    animate={{ width: job.progressLabel }} 
                                                                    className={cn("h-full transition-all duration-1000", toneClasses[job.tone].icon.split(' ')[1])} 
                                                                  />
                                                               </div>
                                                            </div>
                                                         </div>
                                                     </div>
                                                 )) : (
                                                     <EmptyPanel title="ЧЕРГА ЗАВДАНЬ ПОРОЖНЯ" description="Наразі в системі немає активних або чергових процесів інгвестії." />
                                                 )}
                                             </div>
                                         </section>
                                    </motion.div>
                                )}

                                {activeTab === 'nodes' && (
                                    <motion.div key="nodes" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                                       <div className="rounded-[3rem] bg-black border-2 border-white/[0.04] p-12 text-center space-y-10">
                                          <div className="flex flex-col items-center gap-6">
                                             <div className="p-8 rounded-[2.5rem] bg-sky-600/10 border border-sky-600/20">
                                                <Server size={64} className="text-sky-500 animate-pulse" />
                                             </div>
                                             <div className="space-y-2">
                                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">СУВЕРЕННИЙ КЛАСТЕР ВУЗЛІВ</h2>
                                                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.4em] italic mb-10">КАРТОГРАФУВАННЯ ТА ЛОГІКА РОЗПОДІЛУ</p>
                                             </div>
                                          </div>
                                          
                                          {cluster.nodes.length > 0 ? (
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {cluster.nodes.map(node => (
                                                   <div key={node.id} className="p-8 rounded-[2rem] border-2 border-white/[0.04] bg-white/[0.01] text-left group">
                                                      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.04]">
                                                         <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-sky-600/10 flex items-center justify-center text-sky-500">
                                                               <Box size={20} />
                                                            </div>
                                                            <p className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{node.id}</p>
                                                         </div>
                                                         <span className="px-3 py-1 rounded-lg bg-emerald-600/10 border border-emerald-600/20 text-emerald-500 text-[10px] font-black italic tracking-widest uppercase">АКТИВНИЙ</span>
                                                      </div>
                                                      <div className="grid grid-cols-3 gap-6">
                                                         <div>
                                                            <p className="text-[9px] font-black text-slate-700 uppercase leading-none mb-2 italic">ЦП</p>
                                                            <p className="text-2xl font-black text-white font-mono italic">{node.cpu_percent}%</p>
                                                         </div>
                                                         <div>
                                                            <p className="text-[9px] font-black text-slate-700 uppercase leading-none mb-2 italic">ОЗП</p>
                                                            <p className="text-2xl font-black text-white font-mono italic">{node.memory_percent}%</p>
                                                         </div>
                                                         <div>
                                                            <p className="text-[9px] font-black text-slate-700 uppercase leading-none mb-2 italic">ЗАВДАННЯ</p>
                                                            <p className="text-2xl font-black text-sky-500 font-mono italic">0</p>
                                                         </div>
                                                      </div>
                                                   </div>
                                                ))}
                                             </div>
                                          ) : (
                                             <EmptyPanel title="КЛАСТЕР НЕ ІНІЦІЙОВАНО" description="Вузли системи не зареєстровані в Kernel Control Plane. Очікування heartbeat-сигналу." />
                                          )}
                                       </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* RIGHT ACTION BAR TRACKER (3/12) */}
                        <div className="col-span-12 xl:col-span-3 space-y-8">
                            
                             <div className="rounded-[2.5rem] bg-black border-2 border-white/[0.04] p-8 shadow-3xl space-y-8">
                                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">ТЕХНІЧНА ВЕРИФІКАЦІЯ</h3>
                                <div className="space-y-4">
                                   {[
                                      { l: 'DB_З\'ЄДНАННЯ', v: 'ВСТАНОВЛЕНО', c: 'text-emerald-500' },
                                      { l: 'KAFKA_БРОКЕР', v: 'СИНХРОНІЗОВАНО', c: 'text-emerald-500' },
                                      { l: 'ELASTIC_КЛАСТЕР', v: 'ЗДОРОВИЙ', c: 'text-emerald-500' },
                                      { l: 'NEO4J_ГРАФ', v: 'ОПТИМІЗОВАНО', c: 'text-emerald-500' },
                                      { l: 'QDRANT_ВЕКТОР', v: 'ОЧІКУВАННЯ', c: 'text-sky-500' },
                                      { l: 'REDIS_КЕШ', v: 'ЕФЕКТИВНІСТЬ_92%', c: 'text-emerald-500' },
                                   ].map((m, i) => (
                                      <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/[0.03] bg-white/[0.01]">
                                         <span className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest">{m.l}</span>
                                         <span className={cn("text-[9px] font-black italic tracking-widest uppercase", m.c)}>{m.v}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>

                             <div className="rounded-[2.5rem] bg-black/40 border border-white/[0.05] p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-red-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-6 mb-8 group-hover:scale-105 transition-transform">
                                   <div className="p-4 rounded-xl bg-red-600/10 text-red-600 border border-red-600/20 animate-pulse">
                                      <Shield size={22} />
                                   </div>
                                   <div>
                                      <h3 className="text-[14px] font-black text-white italic uppercase tracking-tighter leading-none mb-1">СИСТЕМА БЕЗПЕКИ</h3>
                                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none">РЕЖИМ_ВАРТОВОГО: АКТИВНО</p>
                                   </div>
                                </div>
                                <div className="space-y-4">
                                   <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">ОСТАННЯ ВЕРИФІКАЦІЯ</p>
                                      <p className="text-[12px] font-bold text-slate-300 italic tracking-tight">ЦІЛІСНІСТЬ ЯДРА ПІДТВЕРДЖЕНО 100%</p>
                                   </div>
                                   <button className="w-full py-4 bg-slate-900 border border-white/[0.05] rounded-xl text-[9px] font-black uppercase tracking-[0.3em] italic text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                                      ЗАПУСТИТИ АУДИТ
                                   </button>
                                </div>
                             </div>

                        </div>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
              .badge-v2 { display: inline-flex; align-items: center; border-radius: 8px; }
              .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            `}} />
        </PageTransition>
    );
};

export default MonitoringView;
