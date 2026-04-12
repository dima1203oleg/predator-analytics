/**
 * Операційний моніторинг платформи.
 *
 * Показує тільки підтверджені дані з:
 * - /api/v1/system/status
 * - /api/v1/system/stats
 * - /api/v1/system/logs/stream
 * - /api/v1/ingestion/jobs
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
    { key: 'metrics', label: 'Метрики', icon: <Activity size={16} /> },
    { key: 'logs', label: 'Логи', icon: <Terminal size={16} /> },
    { key: 'pipelines', label: 'Пайплайни', icon: <Layers3 size={16} /> },
    { key: 'nodes', label: 'Вузли', icon: <Server size={16} /> },
];

const toneClasses: Record<StatusTone, { badge: string; icon: string; border: string }> = {
    emerald: {
        badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        icon: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
        border: 'border-emerald-500/15',
    },
    amber: {
        badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        icon: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
        border: 'border-amber-500/15',
    },
    rose: {
        badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
        icon: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
        border: 'border-rose-500/15',
    },
    sky: {
        badge: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
        icon: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
        border: 'border-sky-500/15',
    },
    slate: {
        badge: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
        icon: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
        border: 'border-slate-500/15',
    },
};

const toMetricNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
};

const buildChartOption = (cpuHistory: MetricPoint[], memoryHistory: MetricPoint[]) => {
    const labels = cpuHistory.length >= memoryHistory.length
        ? cpuHistory.map((point) => point.label)
        : memoryHistory.map((point) => point.label);

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(7, 15, 28, 0.96)',
            borderColor: 'rgba(56, 189, 248, 0.25)',
            textStyle: { color: '#fff', fontSize: 12 },
        },
        legend: {
            top: 16,
            data: ['ЦП', 'ОЗП'],
            textStyle: { color: '#94a3b8', fontSize: 11 },
        },
        grid: { top: 56, left: 48, right: 24, bottom: 36 },
        xAxis: {
            type: 'category',
            data: labels,
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
            axisLabel: { color: '#64748b', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLabel: { color: '#64748b', fontSize: 11 },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
        },
        series: [
            {
                name: 'ЦП',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 7,
                data: cpuHistory.map((point) => point.value),
                lineStyle: {
                    width: 3,
                    color: '#38bdf8',
                    shadowBlur: 12,
                    shadowColor: 'rgba(56, 189, 248, 0.35)',
                },
                itemStyle: { color: '#38bdf8' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(56, 189, 248, 0.24)' },
                            { offset: 1, color: 'rgba(56, 189, 248, 0)' },
                        ],
                    },
                },
            },
            {
                name: 'ОЗП',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 7,
                data: memoryHistory.map((point) => point.value),
                lineStyle: {
                    width: 3,
                    color: '#f59e0b',
                    shadowBlur: 12,
                    shadowColor: 'rgba(245, 158, 11, 0.35)',
                },
                itemStyle: { color: '#f59e0b' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(245, 158, 11, 0.2)' },
                            { offset: 1, color: 'rgba(245, 158, 11, 0)' },
                        ],
                    },
                },
            },
        ],
    };
};

const ResourceBar = ({
    label,
    value,
    detail,
    tone,
}: {
    label: string;
    value: number | null;
    detail: string;
    tone: StatusTone;
}) => {
    const styles = toneClasses[tone];

    return (
        <div className="space-y-2 rounded-[28px] border border-white/5 bg-black/30 p-5">
            <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
                <span className="text-lg font-black text-white">{formatPercent(value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full border border-white/5 bg-slate-950">
                <div
                    className={cn('h-full rounded-full transition-[width] duration-500', styles.icon)}
                    style={{ width: value == null ? '0%' : `${Math.max(0, Math.min(100, value))}%` }}
                />
            </div>
            <div className="text-xs text-slate-500">{detail}</div>
        </div>
    );
};

const MetricTile = ({
    label,
    value,
    hint,
    icon,
    tone,
}: {
    label: string;
    value: string;
    hint: string;
    icon: JSX.Element;
    tone: StatusTone;
}) => {
    const styles = toneClasses[tone];

    return (
        <div className={cn('rounded-[28px] border bg-slate-950/40 p-5 shadow-[0_18px_45px_rgba(2,6,23,0.35)]', styles.border)}>
            <div className="flex items-center justify-between gap-4">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border', styles.icon)}>
                    {icon}
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</div>
                    <div className="mt-1 text-2xl font-black tracking-tight text-white">{value}</div>
                </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">{hint}</div>
        </div>
    );
};

const EmptyPanel = ({ title, description }: { title: string; description: string }) => (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-black/30 px-8 text-center">
        <AlertTriangle className="mb-4 h-10 w-10 text-amber-300" />
        <div className="text-lg font-black text-white">{title}</div>
        <div className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</div>
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
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [statusResponse, statsResponse, clusterResponse, jobsResponse] = await Promise.all([
                systemApi.getStatus().catch(() => null),
                systemApi.getStats().catch(() => null),
                systemApi.getCluster().catch(() => null),
                ingestionApi.getJobs(8).catch(() => [] as JobStatusResponse[]),
            ]);

            setSystemStatus(statusResponse);
            setSystemStats(statsResponse);
            setCluster(normalizeClusterSnapshot(clusterResponse));
            setPipelineJobs(normalizeJobStatusResponse(jobsResponse));

            if (statsResponse) {
                setCpuHistory((previous) => appendMetricPoint(previous, statsResponse.cpu_percent, statsResponse.timestamp));
                setMemoryHistory((previous) => appendMetricPoint(previous, statsResponse.memory_percent, statsResponse.timestamp));
            }

            if (statusResponse || statsResponse || clusterResponse || jobsResponse.length > 0) {
                setLastSyncedAt(statsResponse?.timestamp ?? statusResponse?.timestamp ?? new Date().toISOString());
            }
        } catch (error) {
            console.error('[MonitoringView] Не вдалося оновити знімок моніторингу:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadLogs = useCallback(async (showLoader: boolean = false) => {
        if (showLoader) {
            setLogsLoading(true);
        }

        try {
            const response = await systemApi.getLogs(100).catch(() => []);
            setLogs(normalizeSystemLogs(response));
        } catch (error) {
            console.error('[MonitoringView] Не вдалося отримати системні логи:', error);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSnapshot();
        void loadLogs(true);

        const interval = window.setInterval(() => {
            void loadSnapshot(true);
        }, 15000);

        return () => window.clearInterval(interval);
    }, [loadSnapshot, loadLogs]);

    useEffect(() => {
        if (pauseStream) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            void loadLogs();
        }, 5000);

        return () => window.clearInterval(interval);
    }, [pauseStream, loadLogs]);

    const handleManualRefresh = useCallback(async () => {
        await Promise.all([loadSnapshot(true), loadLogs(true)]);
    }, [loadSnapshot, loadLogs]);

    const overallStatusMeta = getStatusMeta(
        backendStatus.isOffline
            ? 'offline'
            : systemStatus?.overall_status ?? systemStatus?.status ?? null,
    );
    const averageLatency = systemStats?.avg_latency ?? toMetricNumber(systemStatus?.metrics?.avg_latency);
    const uptimeLabel = systemStatus?.uptime ?? systemStats?.uptime ?? 'Н/д';
    const services = systemStatus?.services ?? [];
    const serviceSummary = systemStatus?.summary ?? {
        total: services.length,
        healthy: services.filter((service) => getStatusMeta(service.status).tone === 'emerald').length,
        degraded: services.filter((service) => getStatusMeta(service.status).tone === 'amber').length,
        failed: services.filter((service) => getStatusMeta(service.status).tone === 'rose').length,
    };
    const activeJobsCount = pipelineJobs.filter((job) => job.isActive).length;
    const failedJobsCount = pipelineJobs.filter((job) => job.tone === 'rose').length;
    const completedJobsCount = pipelineJobs.filter((job) => job.tone === 'emerald' && !job.isActive).length;
    const filteredLogs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return logs;
        }

        return logs.filter((log) =>
            `${log.service} ${log.level} ${log.message}`.toLowerCase().includes(query),
        );
    }, [logs, searchQuery]);

    const chartOption = useMemo(
        () => buildChartOption(cpuHistory, memoryHistory),
        [cpuHistory, memoryHistory],
    );

    const metricTiles = [
        {
            label: 'Середня затримка',
            value: formatLatency(averageLatency),
            hint: 'Підтверджено `/system/stats.avg_latency`.',
            icon: <Clock3 size={20} />,
            tone: averageLatency != null && averageLatency > 1000 ? 'rose' : 'sky',
        },
        {
            label: 'Активні зʼєднання',
            value: formatCount(systemStats?.active_connections),
            hint: 'Поточні мережеві сесії сервісів.',
            icon: <Network size={20} />,
            tone: 'sky',
        },
        {
            label: 'Документів',
            value: formatCount(systemStats?.documents_total),
            hint: 'Підтверджений обсяг у системному сховищі.',
            icon: <Database size={20} />,
            tone: 'emerald',
        },
        {
            label: 'Індексів',
            value: formatCount(systemStats?.total_indices),
            hint: 'Кількість доступних індексів пошуку.',
            icon: <Layers3 size={20} />,
            tone: 'amber',
        },
        {
            label: 'Отримано мережею',
            value: formatBytes(systemStats?.network_bytes_recv),
            hint: 'Накопичений вхідний трафік.',
            icon: <Network size={20} />,
            tone: 'sky',
        },
        {
            label: 'Надіслано мережею',
            value: formatBytes(systemStats?.network_bytes_sent),
            hint: 'Накопичений вихідний трафік.',
            icon: <Boxes size={20} />,
            tone: 'slate',
        },
    ] as const;

    const servicesBySeverity = [...(systemStatus?.services ?? [])].sort((left, right) => {
        const weights: Record<StatusTone, number> = {
            rose: 0,
            amber: 1,
            sky: 2,
            slate: 3,
            emerald: 4,
        };

        return weights[getStatusMeta(left.status).tone] - weights[getStatusMeta(right.status).tone];
    });

    return (
        <PageTransition>
            <div className="relative min-h-screen overflow-hidden bg-[#02040a] pb-24 text-slate-200">
                <AdvancedBackground />
                <CyberGrid color="rgba(56, 189, 248, 0.05)" />

                <div className="relative z-10 mx-auto max-w-[1800px] space-y-10 p-4 sm:p-8 lg:p-12">
                    <ViewHeader
                        title="Операційний моніторинг"
                        subtitle="Єдиний контур для перевірених системних метрик, логів, ingestion-пайплайнів і стану вузлів без синтетичних підстановок."
                        icon={<Activity size={22} className="text-sky-400" />}
                        breadcrumbs={['Система', 'Моніторинг', 'Операційний контур']}
                        stats={[
                            {
                                label: 'Стан системи',
                                value: overallStatusMeta.label,
                                color:
                                    overallStatusMeta.tone === 'rose'
                                        ? 'danger'
                                        : overallStatusMeta.tone === 'amber'
                                            ? 'warning'
                                            : 'success',
                                icon:
                                    overallStatusMeta.tone === 'rose'
                                        ? <AlertTriangle size={14} />
                                        : <CheckCircle2 size={14} />,
                            },
                            {
                                label: 'Сервіси',
                                value: serviceSummary.total > 0 ? `${serviceSummary.healthy}/${serviceSummary.total}` : 'Н/д',
                                color: serviceSummary.failed > 0 ? 'danger' : serviceSummary.degraded > 0 ? 'warning' : 'success',
                                icon: <Server size={14} />,
                            },
                            {
                                label: 'API',
                                value: formatLatency(averageLatency),
                                color: averageLatency != null && averageLatency > 1000 ? 'warning' : 'primary',
                                icon: <Clock3 size={14} />,
                            },
                            {
                                label: 'Аптайм',
                                value: uptimeLabel,
                                color: 'cyan',
                                icon: <Activity size={14} />,
                            },
                        ]}
                        actions={(
                            <button
                                type="button"
                                onClick={() => {
                                    void handleManualRefresh();
                                }}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-200 transition hover:border-sky-400/35 hover:bg-sky-500/15 sm:w-auto"
                            >
                                {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                Оновити знімок
                            </button>
                        )}
                    />

                    <div className="flex flex-col gap-6 rounded-[32px] border border-white/5 bg-slate-950/40 p-5 backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-3">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        'inline-flex items-center gap-3 rounded-[20px] border px-5 py-3 text-sm font-black uppercase tracking-[0.16em] transition',
                                        activeTab === tab.key
                                            ? 'border-sky-500/25 bg-sky-500/15 text-sky-100'
                                            : 'border-white/5 bg-black/20 text-slate-400 hover:border-white/10 hover:text-white',
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className={cn('border px-4 py-2 text-[11px] font-bold', toneClasses[overallStatusMeta.tone].badge)}>
                                {backendStatus.statusLabel}
                            </Badge>
                            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                                Джерело: {backendStatus.sourceLabel}
                            </Badge>
                            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                                Оновлено: {formatDateTime(lastSyncedAt) ?? 'Немає підтвердженої синхронізації'}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                        <div className="space-y-10 lg:col-span-8 xl:col-span-9">
                            <AnimatePresence mode="wait">
                                {activeTab === 'metrics' && (
                                    <motion.div
                                        key="metrics"
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -18 }}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.6fr_1fr]">
                                            <section className="page-section section-cyan shadow-xl">
                                                <div className="section-header">
                                                    <div className="section-dot-cyan" />
                                                    <div>
                                                        <h2 className="section-title">ЦП / ОЗП</h2>
                                                        <p className="section-subtitle">Жива динаміка ресурсів</p>
                                                    </div>
                                                </div>
                                                <div className="mb-6 flex justify-end">
                                                    {refreshing && <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />}
                                                </div>

                                                {cpuHistory.length > 0 || memoryHistory.length > 0 ? (
                                                    <ReactECharts option={chartOption} style={{ height: '360px', width: '100%' }} />
                                                ) : (
                                                    <EmptyPanel
                                                        title="Ще немає підтверджених точок для графіка"
                                                        description="Після появи даних із `/system/stats` тут буде відображено історію навантаження ЦП та памʼяті."
                                                    />
                                                )}
                                            </section>

                                            <section className="page-section section-amber shadow-xl">
                                                <div className="section-header">
                                                    <div className="section-dot-amber" />
                                                    <div>
                                                        <h2 className="section-title">Ресурси</h2>
                                                        <p className="section-subtitle">Поточне навантаження</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-5 mt-4">
                                                    <ResourceBar
                                                        label="ЦП"
                                                        value={systemStats?.cpu_percent ?? null}
                                                        detail={`${formatCount(systemStats?.cpu_count)} ядер, активних задач: ${formatCount(systemStats?.active_tasks)}`}
                                                        tone="sky"
                                                    />
                                                    <ResourceBar
                                                        label="ОЗП"
                                                        value={systemStats?.memory_percent ?? null}
                                                        detail={`${formatBytes(systemStats?.memory_used)} з ${formatBytes(systemStats?.memory_total)}`}
                                                        tone="amber"
                                                    />
                                                    <ResourceBar
                                                        label="Диск"
                                                        value={systemStats?.disk_percent ?? null}
                                                        detail={`${formatBytes(systemStats?.disk_used)} з ${formatBytes(systemStats?.disk_total)}`}
                                                        tone={systemStats?.disk_percent != null && systemStats.disk_percent >= 85 ? 'rose' : 'emerald'}
                                                    />
                                                </div>
                                            </section>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                            {metricTiles.map((tile) => (
                                                <MetricTile
                                                    key={tile.label}
                                                    label={tile.label}
                                                    value={tile.value}
                                                    hint={tile.hint}
                                                    icon={tile.icon}
                                                    tone={tile.tone}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'logs' && (
                                    <motion.div
                                        key="logs"
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -18 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex flex-col gap-4 rounded-[32px] border border-white/5 bg-slate-950/40 p-5 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="relative w-full lg:max-w-xl">
                                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(event) => setSearchQuery(event.target.value)}
                                                    placeholder="Пошук за сервісом, рівнем або текстом події"
                                                    className="w-full rounded-[20px] border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/35 focus:outline-none"
                                                />
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setPauseStream((previous) => !previous)}
                                                    className={cn(
                                                        'inline-flex items-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-bold transition',
                                                        pauseStream
                                                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
                                                            : 'border-sky-500/20 bg-sky-500/10 text-sky-200',
                                                    )}
                                                >
                                                    {pauseStream ? <Play size={16} /> : <Pause size={16} />}
                                                    {pauseStream ? 'Відновити потік' : 'Пауза потоку'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLogs([])}
                                                    className="inline-flex items-center gap-2 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-white/20"
                                                >
                                                    Очистити локальний список
                                                </button>
                                            </div>
                                        </div>

                                        <section className="page-section section-slate shadow-xl !p-0">
                                            <div className="border-b border-white/5 bg-black/20 px-6 py-4 text-sm text-slate-400">
                                                Логи завантажуються з `/system/logs/stream`. Якщо бекенд не повертає події, інтерфейс не домальовує жодних рядків.
                                            </div>
                                            <div className="max-h-[720px] overflow-y-auto p-6">
                                                {logsLoading ? (
                                                    <div className="flex items-center gap-3 py-10 text-sm text-slate-400">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        Отримую підтверджені журнали подій…
                                                    </div>
                                                ) : filteredLogs.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {filteredLogs.map((log) => {
                                                            const levelMeta = getStatusMeta(log.level);
                                                            return (
                                                                <div
                                                                    key={log.id}
                                                                    className="rounded-[24px] border border-white/5 bg-slate-950/60 p-4 transition hover:border-white/10"
                                                                >
                                                                    <div className="flex flex-wrap items-start gap-3">
                                                                        <Badge className={cn('border px-3 py-1 text-[10px] font-bold', toneClasses[levelMeta.tone].badge)}>
                                                                            {log.level}
                                                                        </Badge>
                                                                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300">
                                                                            {log.service}
                                                                        </span>
                                                                        <span className="ml-auto text-xs text-slate-500">{log.timestampLabel}</span>
                                                                    </div>
                                                                    <div className="mt-3 text-sm leading-7 text-slate-200">{log.message}</div>
                                                                    {log.latencyLabel && (
                                                                        <div className="mt-3 text-xs text-slate-500">Тривалість: {log.latencyLabel}</div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <EmptyPanel
                                                        title="Логи не повернуті бекендом"
                                                        description="Перевірте звʼязок із ядром API або змініть фільтр пошуку. Інтерфейс не показує декоративні записи замість реальних."
                                                    />
                                                )}
                                            </div>
                                        </section>
                                    </motion.div>
                                )}

                                {activeTab === 'pipelines' && (
                                    <motion.div
                                        key="pipelines"
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -18 }}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                            <MetricTile
                                                label="Активні пайплайни"
                                                value={formatCount(activeJobsCount)}
                                                hint="Визначено за статусами ingestion jobs."
                                                icon={<Activity size={20} />}
                                                tone={activeJobsCount > 0 ? 'sky' : 'slate'}
                                            />
                                            <MetricTile
                                                label="Завершені"
                                                value={formatCount(completedJobsCount)}
                                                hint="Успішно завершені останні завдання."
                                                icon={<CheckCircle2 size={20} />}
                                                tone="emerald"
                                            />
                                            <MetricTile
                                                label="Помилки"
                                                value={formatCount(failedJobsCount)}
                                                hint="Останні jobs зі статусом помилки."
                                                icon={<AlertTriangle size={20} />}
                                                tone={failedJobsCount > 0 ? 'rose' : 'slate'}
                                            />
                                        </div>

                                            <section className="page-section section-indigo shadow-xl">
                                                <div className="section-header">
                                                    <div className="section-dot-indigo" />
                                                    <div>
                                                        <h2 className="section-title">ПОТОКИ_ІНГЕСТУ</h2>
                                                        <p className="section-subtitle">Останні етапи обробки</p>
                                                    </div>
                                                </div>

                                            {pipelineJobs.length > 0 ? (
                                                <div className="space-y-4 mt-4">
                                                    {pipelineJobs.map((job) => (
                                                        <div
                                                            key={job.id}
                                                            className={cn(
                                                                'rounded-[28px] border bg-slate-950/45 p-5',
                                                                toneClasses[job.tone].border,
                                                            )}
                                                        >
                                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                                <div className="min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-3">
                                                                        <Badge className={cn('border px-3 py-1 text-[10px] font-bold', toneClasses[job.tone].badge)}>
                                                                            {job.statusLabel}
                                                                        </Badge>
                                                                        <span className="text-lg font-black text-white">{job.title}</span>
                                                                    </div>
                                                                    <div className="mt-2 text-sm text-slate-400">
                                                                        Етап: {job.stageLabel}
                                                                        {' • '}
                                                                        Створено: {job.startedAtLabel}
                                                                    </div>
                                                                    {job.processedLabel && (
                                                                        <div className="mt-2 text-sm text-slate-500">{job.processedLabel}</div>
                                                                    )}
                                                                </div>

                                                                <div className="w-full max-w-xs space-y-2">
                                                                    <div className="flex items-center justify-between text-sm">
                                                                        <span className="text-slate-500">Прогрес</span>
                                                                        <span className="font-black text-white">{job.progressLabel}</span>
                                                                    </div>
                                                                    <div className="h-2 overflow-hidden rounded-full border border-white/5 bg-slate-950">
                                                                        <div
                                                                            className={cn('h-full rounded-full transition-[width] duration-500', toneClasses[job.tone].icon)}
                                                                            style={{ width: `${job.progress ?? 0}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <EmptyPanel
                                                    title="Пайплайни не повернуті"
                                                    description="Ендпоїнт `/ingestion/jobs` не надав підтверджених завдань. Якщо jobs відсутні, список залишається порожнім."
                                                />
                                            )}
                                        </section>
                                    </motion.div>
                                )}

                                {activeTab === 'nodes' && (
                                    <motion.div
                                        key="nodes"
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -18 }}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
                                            <section className="page-section section-emerald shadow-xl">
                                                <div className="section-header">
                                                    <div className="section-dot-emerald" />
                                                    <div>
                                                        <h2 className="section-title">Сервіси</h2>
                                                        <p className="section-subtitle">Стан компонентів платформи</p>
                                                    </div>
                                                </div>

                                                {servicesBySeverity.length > 0 ? (
                                                    <div className="space-y-4 mt-4">
                                                        {servicesBySeverity.map((service) => {
                                                            const meta = getStatusMeta(service.status);
                                                            return (
                                                                <div
                                                                    key={`${service.name}-${service.label}`}
                                                                    className={cn('rounded-[28px] border bg-black/30 p-5', toneClasses[meta.tone].border)}
                                                                >
                                                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                                        <div>
                                                                            <div className="flex flex-wrap items-center gap-3">
                                                                                <Badge className={cn('border px-3 py-1 text-[10px] font-bold', toneClasses[meta.tone].badge)}>
                                                                                    {meta.label}
                                                                                </Badge>
                                                                                <span className="text-lg font-black text-white">{service.label || service.name}</span>
                                                                            </div>
                                                                            <div className="mt-2 text-sm text-slate-400">Ідентифікатор: {service.name}</div>
                                                                            {service.error && (
                                                                                <div className="mt-2 text-sm text-rose-300">{service.error}</div>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm text-slate-400">
                                                                            Затримка: {formatLatency(service.latency_ms)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <EmptyPanel
                                                        title="Статус сервісів не підтверджено"
                                                        description="`/system/status` не повернув список сервісів. Коли відповідь зʼявиться, тут буде деталізація по кожному компоненту."
                                                    />
                                                )}
                                            </section>

                                            <section className="page-section section-cyan shadow-xl">
                                                <div className="section-header">
                                                    <div className="section-dot-cyan" />
                                                    <div>
                                                        <h2 className="section-title">Кластер</h2>
                                                        <p className="section-subtitle">Вузли та поди</p>
                                                    </div>
                                                </div>

                                                {hasVisibleClusterData(cluster) ? (
                                                    <div className="space-y-6 mt-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <MetricTile
                                                                label="Вузли"
                                                                value={cluster.nodeCount == null ? 'Н/д' : formatCount(cluster.nodeCount)}
                                                                hint={`Статус кластера: ${cluster.statusLabel}`}
                                                                icon={<Server size={20} />}
                                                                tone="sky"
                                                            />
                                                            <MetricTile
                                                                label="Поди"
                                                                value={cluster.podCount == null ? 'Н/д' : formatCount(cluster.podCount)}
                                                                hint="Кількість pod-обʼєктів із `/system/cluster`."
                                                                icon={<Boxes size={20} />}
                                                                tone="amber"
                                                            />
                                                        </div>

                                                        {cluster.nodes.length > 0 && (
                                                            <div className="space-y-3">
                                                                <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Вузли</div>
                                                                {cluster.nodes.map((node) => (
                                                                    <div key={node.id} className="rounded-[24px] border border-white/5 bg-black/30 p-4">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <span className="font-black text-white">{node.name}</span>
                                                                            <Badge className={cn('border px-3 py-1 text-[10px] font-bold', toneClasses[node.tone].badge)}>
                                                                                {node.statusLabel}
                                                                            </Badge>
                                                                        </div>
                                                                        {node.detail && <div className="mt-2 text-sm text-slate-500">{node.detail}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {cluster.pods.length > 0 && (
                                                            <div className="space-y-3">
                                                                <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Поди</div>
                                                                {cluster.pods.map((pod) => (
                                                                    <div key={pod.id} className="rounded-[24px] border border-white/5 bg-black/30 p-4">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <span className="font-black text-white">{pod.name}</span>
                                                                            <Badge className={cn('border px-3 py-1 text-[10px] font-bold', toneClasses[pod.tone].badge)}>
                                                                                {pod.statusLabel}
                                                                            </Badge>
                                                                        </div>
                                                                        {pod.detail && <div className="mt-2 text-sm text-slate-500">{pod.detail}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <EmptyPanel
                                                        title="Кластерні дані не надано"
                                                        description="Ендпоїнт `/system/cluster` не повернув вузли або поди. Блок залишається чесно порожнім, доки бекенд не надасть структуру."
                                                    />
                                                )}
                                            </section>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-8 lg:col-span-4 xl:col-span-3">
                            <section className="page-section section-slate shadow-xl mb-8">
                                <div className="section-header">
                                    <div className="section-dot-slate" />
                                    <div>
                                        <h2 className="section-title">Контур даних</h2>
                                        <p className="section-subtitle">Джерело і режим</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm text-slate-300 mt-4">
                                    <div className="rounded-[24px] border border-white/5 bg-black/30 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Статус підключення</div>
                                        <div className="mt-2 text-base font-black text-white">{backendStatus.statusLabel}</div>
                                    </div>
                                    <div className="rounded-[24px] border border-white/5 bg-black/30 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Режим</div>
                                        <div className="mt-2 text-base font-black text-white">{backendStatus.modeLabel}</div>
                                    </div>
                                    <div className="rounded-[24px] border border-white/5 bg-black/30 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Джерело</div>
                                        <div className="mt-2 break-all text-base font-black text-white">{backendStatus.sourceLabel}</div>
                                    </div>
                                    <div className="rounded-[24px] border border-white/5 bg-black/30 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Останнє оновлення</div>
                                        <div className="mt-2 text-base font-black text-white">
                                            {formatDateTime(lastSyncedAt) ?? 'Немає підтвердженої синхронізації'}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="page-section section-rose shadow-xl mb-8">
                                <div className="section-header">
                                    <div className="section-dot-rose" />
                                    <div>
                                        <h2 className="section-title">Огляд стану</h2>
                                        <p className="section-subtitle">Підсумок сервісів</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <MetricTile
                                        label="Справні"
                                        value={formatCount(serviceSummary.healthy)}
                                        hint="Компоненти у зеленому стані."
                                        icon={<CheckCircle2 size={20} />}
                                        tone="emerald"
                                    />
                                    <MetricTile
                                        label="Деградовані"
                                        value={formatCount(serviceSummary.degraded)}
                                        hint="Сервіси з попередженням."
                                        icon={<AlertTriangle size={20} />}
                                        tone={serviceSummary.degraded > 0 ? 'amber' : 'slate'}
                                    />
                                    <MetricTile
                                        label="Помилки"
                                        value={formatCount(serviceSummary.failed)}
                                        hint="Компоненти, що потребують уваги."
                                        icon={<AlertTriangle size={20} />}
                                        tone={serviceSummary.failed > 0 ? 'rose' : 'slate'}
                                    />
                                    <MetricTile
                                        label="Пайплайни"
                                        value={formatCount(activeJobsCount)}
                                        hint="Завдання, що залишаються активними."
                                        icon={<Layers3 size={20} />}
                                        tone={activeJobsCount > 0 ? 'sky' : 'slate'}
                                    />
                                </div>
                            </section>

                            <section className="page-section section-slate shadow-xl mb-8">
                                <div className="section-header">
                                    <div className="section-dot-slate" />
                                    <div>
                                        <h2 className="section-title">Інвентар</h2>
                                        <p className="section-subtitle">Версія середовища</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mt-4">
                                    <div className="rounded-[24px] border border-white/5 bg-black/30 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Версія</div>
                                        <div className="mt-2 text-base font-black text-white">{systemStatus?.version ?? 'Н/д'}</div>
                                    </div>
                                    <div className="rounded-[24px] border border-white/5 bg-black/30 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Середовище</div>
                                        <div className="mt-2 text-base font-black text-white">{systemStatus?.environment ?? 'Н/д'}</div>
                                    </div>
                                    <div className="rounded-[24px] border border-white/5 bg-black/30 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Загальне сховище</div>
                                        <div className="mt-2 text-base font-black text-white">
                                            {systemStats?.storage_gb != null ? `${formatCount(systemStats.storage_gb)} ГБ` : 'Н/д'}
                                        </div>
                                    </div>
                                    <div className="rounded-[24px] border border-white/5 bg-black/30 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Живі журнали</div>
                                        <div className="mt-2 text-base font-black text-white">{formatCount(logs.length)}</div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {loading && (
                        <div className="flex items-center gap-3 rounded-[24px] border border-white/5 bg-black/30 px-5 py-4 text-sm text-slate-400">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Отримую первинний знімок системного стану…
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default MonitoringView;
