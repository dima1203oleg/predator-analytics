import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Camera,
    CheckCircle,
    ChevronRight,
    Clock,
    Database,
    FileSpreadsheet,
    FileText,
    Globe,
    Loader2,
    MessageSquare,
    Radio,
    RefreshCw,
    Rss,
    Search,
    Upload,
    Video,
    XCircle,
    Zap,
    type LucideIcon,
} from 'lucide-react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { ingestionApi } from '@/services/api/ingestion';
import {
    normalizeActiveJobsPayload,
    summarizeActiveJobs,
    type ActiveJobStatus,
    type ActiveJobType,
    type ActiveJobViewModel,
} from './activeJobsPanel.utils';

interface ActiveJobsPanelProps {
    maxJobs?: number;
    className?: string;
    showHeader?: boolean;
    onJobClick?: (job: ActiveJobViewModel) => void;
}

const TYPE_CONFIG: Record<ActiveJobType, { icon: LucideIcon; panelClass: string; iconClass: string; progressClass: string }> = {
    customs: {
        icon: FileSpreadsheet,
        panelClass: 'border-emerald-500/20 bg-emerald-500/10',
        iconClass: 'text-emerald-300',
        progressClass: 'bg-emerald-500',
    },
    excel: {
        icon: FileSpreadsheet,
        panelClass: 'border-emerald-500/20 bg-emerald-500/10',
        iconClass: 'text-emerald-300',
        progressClass: 'bg-emerald-500',
    },
    csv: {
        icon: FileSpreadsheet,
        panelClass: 'border-lime-500/20 bg-lime-500/10',
        iconClass: 'text-lime-300',
        progressClass: 'bg-lime-500',
    },
    pdf: {
        icon: FileText,
        panelClass: 'border-rose-500/20 bg-rose-500/10',
        iconClass: 'text-rose-300',
        progressClass: 'bg-rose-500',
    },
    image: {
        icon: Camera,
        panelClass: 'border-amber-500/20 bg-amber-500/10',
        iconClass: 'text-amber-300',
        progressClass: 'bg-amber-500',
    },
    audio: {
        icon: Radio,
        panelClass: 'border-fuchsia-500/20 bg-fuchsia-500/10',
        iconClass: 'text-fuchsia-300',
        progressClass: 'bg-fuchsia-500',
    },
    video: {
        icon: Video,
        panelClass: 'border-orange-500/20 bg-orange-500/10',
        iconClass: 'text-orange-300',
        progressClass: 'bg-orange-500',
    },
    telegram: {
        icon: MessageSquare,
        panelClass: 'border-sky-500/20 bg-sky-500/10',
        iconClass: 'text-sky-300',
        progressClass: 'bg-sky-500',
    },
    website: {
        icon: Globe,
        panelClass: 'border-cyan-500/20 bg-cyan-500/10',
        iconClass: 'text-cyan-300',
        progressClass: 'bg-cyan-500',
    },
    api: {
        icon: Zap,
        panelClass: 'border-violet-500/20 bg-violet-500/10',
        iconClass: 'text-violet-300',
        progressClass: 'bg-violet-500',
    },
    rss: {
        icon: Rss,
        panelClass: 'border-yellow-500/20 bg-yellow-500/10',
        iconClass: 'text-yellow-300',
        progressClass: 'bg-yellow-500',
    },
    word: {
        icon: FileText,
        panelClass: 'border-indigo-500/20 bg-indigo-500/10',
        iconClass: 'text-indigo-300',
        progressClass: 'bg-indigo-500',
    },
    unknown: {
        icon: Upload,
        panelClass: 'border-white/10 bg-white/5',
        iconClass: 'text-slate-300',
        progressClass: 'bg-slate-500',
    },
};

const STATUS_CONFIG: Record<ActiveJobStatus, { label: string; icon: LucideIcon; badgeClass: string; iconClass: string }> = {
    pending: {
        label: 'Очікування',
        icon: Clock,
        badgeClass: 'border-slate-500/20 bg-slate-500/10 text-slate-200',
        iconClass: 'text-slate-300',
    },
    processing: {
        label: 'Обробка',
        icon: RefreshCw,
        badgeClass: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
        iconClass: 'text-blue-300',
    },
    indexing: {
        label: 'Індексація',
        icon: Search,
        badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
        iconClass: 'text-amber-300',
    },
    vectorizing: {
        label: 'Векторизація',
        icon: BarChart3,
        badgeClass: 'border-violet-500/20 bg-violet-500/10 text-violet-200',
        iconClass: 'text-violet-300',
    },
    completed: {
        label: 'Завершено',
        icon: CheckCircle,
        badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
        iconClass: 'text-emerald-300',
    },
    failed: {
        label: 'Помилка',
        icon: XCircle,
        badgeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
        iconClass: 'text-rose-300',
    },
};

const formatDateTime = (value: string | null): string => {
    if (!value) {
        return 'Н/д';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Н/д';
    }

    return parsed.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatNumber = (value: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : Math.round(value).toLocaleString('uk-UA');

const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
        <Database className="mb-4 h-10 w-10 text-slate-600" />
        <div className="text-sm font-black uppercase tracking-[0.22em] text-slate-300">{title}</div>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
    </div>
);

export const ActiveJobsPanel: React.FC<ActiveJobsPanelProps> = ({
    maxJobs = 10,
    className = '',
    showHeader = true,
    onJobClick,
}) => {
    const backendStatus = useBackendStatus();
    const [jobs, setJobs] = useState<ActiveJobViewModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

    const fetchJobs = useCallback(async (silent: boolean = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await ingestionApi.getJobs(maxJobs);
            setJobs(normalizeActiveJobsPayload(response));
            setError(null);
            setLastSyncedAt(new Date().toISOString());
        } catch (fetchError) {
            console.error('Failed to fetch active ingestion jobs:', fetchError);
            setJobs([]);
            setError('Ендпоїнт /ingestion/jobs тимчасово недоступний. Панель не підставляє demo-завдання.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [maxJobs]);

    useEffect(() => {
        void fetchJobs();

        const interval = window.setInterval(() => {
            void fetchJobs(true);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [fetchJobs]);

    const summary = useMemo(() => summarizeActiveJobs(jobs), [jobs]);

    return (
        <div className={`overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-xl ${className}`}>
            {showHeader ? (
                <div className="border-b border-slate-800/50 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-500/10 p-2">
                                    <Activity className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">
                                        Активні процеси
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Підтверджені ingestion jobs з /ingestion/jobs без локальних підстановок.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                    Активних: {summary.activeCount}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                    Підтверджено: {jobs.length}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                    Бекенд: {backendStatus.statusLabel}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                <span>Джерело: /ingestion/jobs</span>
                                <span>API: {backendStatus.sourceLabel}</span>
                                <span>Синхронізація: {formatDateTime(lastSyncedAt)}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => void fetchJobs(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Оновити активні процеси"
                            disabled={loading || refreshing}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
                            Оновити
                        </button>
                    </div>

                    {error ? (
                        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-100">
                            {error}
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div className="max-h-[440px] overflow-y-auto">
                {loading ? (
                    <div className="flex min-h-[260px] items-center justify-center gap-3 text-sm text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Синхронізую підтверджені ingestion jobs...
                    </div>
                ) : jobs.length === 0 ? (
                    <EmptyState
                        title="Немає підтверджених ingestion jobs"
                        description={
                            error
                                ? 'Панель дочекається відновлення каналу і не покаже штучні demo-процеси.'
                                : 'Ендпоїнт /ingestion/jobs повернув порожній список. До появи реальних jobs тут лишається чесний порожній стан.'
                        }
                    />
                ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                        {jobs.map((job, index) => {
                            const typeConfig = TYPE_CONFIG[job.type];
                            const statusConfig = STATUS_CONFIG[job.status];
                            const TypeIcon = typeConfig.icon;
                            const StatusIcon = statusConfig.icon;
                            const progressValue = job.progressPct ?? 0;

                            return (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 16 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={() => onJobClick?.(job)}
                                    className={`border-b border-slate-800/30 p-4 transition-colors hover:bg-slate-800/30 ${onJobClick ? 'cursor-pointer' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`rounded-xl border p-2 ${typeConfig.panelClass}`}>
                                            <TypeIcon className={`h-4 w-4 ${typeConfig.iconClass}`} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="mb-2 flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h4 className="truncate text-sm font-black text-white">
                                                        {job.name}
                                                    </h4>
                                                    <div className="mt-1 text-[11px] text-slate-500">
                                                        ID: <span className="font-mono text-slate-400">{job.id}</span>
                                                    </div>
                                                </div>

                                                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusConfig.badgeClass}`}>
                                                    <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.iconClass} ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                                                    {statusConfig.label}
                                                </div>
                                            </div>

                                            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressValue}%` }}
                                                    className={`h-full rounded-full ${typeConfig.progressClass}`}
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-400">
                                                <span className="font-mono">
                                                    Прогрес: {job.progressPct == null ? 'Н/д' : `${job.progressPct}%`}
                                                </span>
                                                <span>{job.stageLabel}</span>
                                                {job.itemsProcessed != null && job.itemsTotal != null ? (
                                                    <span className="font-mono">
                                                        {formatNumber(job.itemsProcessed)} / {formatNumber(job.itemsTotal)}
                                                    </span>
                                                ) : null}
                                                <span>Старт: {formatDateTime(job.startedAt)}</span>
                                                {job.completedAt ? (
                                                    <span>Завершено: {formatDateTime(job.completedAt)}</span>
                                                ) : null}
                                            </div>

                                            {job.error ? (
                                                <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-200">
                                                    {job.error}
                                                </div>
                                            ) : null}
                                        </div>

                                        {onJobClick ? (
                                            <ChevronRight className="mt-1 h-4 w-4 text-slate-600" />
                                        ) : null}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-800/50 bg-slate-950/50 p-3 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <span>Статус каналу: {backendStatus.statusLabel}</span>
                    <span>Остання синхронізація: {formatDateTime(lastSyncedAt)}</span>
                    <span>Оновлення: кожні 5 сек</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <span>Завершено: {summary.completedCount}</span>
                    <span>Помилки: {summary.failedCount}</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                        {backendStatus.isOffline ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                        ) : (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
                        )}
                        {backendStatus.modeLabel}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ActiveJobsPanel;
