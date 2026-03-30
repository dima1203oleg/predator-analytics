/**
 * Робочий центр навчання моделей.
 *
 * Екран не симулює тренування локально:
 * - /api/v45/ml/training/status
 * - /api/v45/ml/training/history
 * - /api/v45/ml/jobs
 * - /api/v1/system/stats
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    AlertCircle,
    BarChart3,
    Brain,
    CheckCircle2,
    Cpu,
    Gauge,
    HardDrive,
    Loader2,
    Play,
    RefreshCw,
    ScrollText,
    Terminal,
    Timer,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { trainingApi } from '@/services/api/ml';
import { systemApi, type SystemStatsResponse } from '@/services/api/system';
import { cn } from '@/utils/cn';
import { normalizeModelTrainingSnapshot, type TrainingRunRecord, type TrainingTone } from './modelTrainingView.utils';

const toneClasses: Record<TrainingTone, { badge: string; panel: string; accent: string }> = {
    emerald: {
        badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
        panel: 'border-emerald-500/20 bg-emerald-500/10',
        accent: 'text-emerald-300',
    },
    amber: {
        badge: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
        panel: 'border-amber-500/20 bg-amber-500/10',
        accent: 'text-amber-300',
    },
    rose: {
        badge: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
        panel: 'border-rose-500/20 bg-rose-500/10',
        accent: 'text-rose-300',
    },
    slate: {
        badge: 'border-slate-500/30 bg-slate-500/10 text-slate-100',
        panel: 'border-slate-500/20 bg-slate-500/10',
        accent: 'text-slate-300',
    },
    sky: {
        badge: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
        panel: 'border-sky-500/20 bg-sky-500/10',
        accent: 'text-sky-300',
    },
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/20 px-8 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-amber-300" />
        <div className="text-lg font-black text-white">{title}</div>
        <div className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</div>
    </div>
);

const RunCard = ({ run }: { run: TrainingRunRecord }) => {
    const tone = toneClasses[run.tone];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-[28px] border p-5 shadow-[0_16px_40px_rgba(2,6,23,0.18)]', tone.panel)}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-sm font-black uppercase tracking-wide text-white">{run.title}</div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        {run.timestampLabel}
                    </div>
                </div>
                <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase tracking-widest', tone.badge)}>
                    {run.statusLabel}
                </Badge>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                    { label: 'Прогрес', value: run.progressLabel },
                    { label: 'Точність', value: run.accuracyLabel },
                    { label: 'Loss', value: run.lossLabel },
                ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</div>
                        <div className={cn('mt-1 text-lg font-black', tone.accent)}>{item.value}</div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default function ModelTrainingView() {
    const backendStatus = useBackendStatus();
    const [trainingStatus, setTrainingStatus] = useState<unknown>(null);
    const [trainingHistory, setTrainingHistory] = useState<unknown>([]);
    const [trainingJobs, setTrainingJobs] = useState<unknown>([]);
    const [systemStats, setSystemStats] = useState<SystemStatsResponse | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [starting, setStarting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [feedbackTone, setFeedbackTone] = useState<'rose' | 'emerald'>('emerald');
    const logsEndRef = useRef<HTMLDivElement | null>(null);

    const loadData = useCallback(async (silent: boolean = false) => {
        if (silent) {
            setRefreshing(true);
        }

        try {
            const [statusResult, historyResult, jobsResult, systemResult] = await Promise.allSettled([
                trainingApi.getStatus(),
                trainingApi.getHistory(),
                trainingApi.getMLJobs(),
                systemApi.getStats(),
            ]);

            setTrainingStatus(statusResult.status === 'fulfilled' ? statusResult.value : null);
            setTrainingHistory(historyResult.status === 'fulfilled' ? historyResult.value : []);
            setTrainingJobs(jobsResult.status === 'fulfilled' ? jobsResult.value : []);
            setSystemStats(systemResult.status === 'fulfilled' ? systemResult.value : null);

            if (
                statusResult.status === 'rejected' &&
                historyResult.status === 'rejected' &&
                jobsResult.status === 'rejected' &&
                systemResult.status === 'rejected'
            ) {
                setFeedbackTone('rose');
                setFeedbackMessage('Центр навчання тимчасово не отримав підтверджених даних від бекенду.');
            } else if (!silent) {
                setFeedbackMessage(null);
            }
        } catch (error) {
            console.error('[ModelTrainingView] Не вдалося оновити дані:', error);
            setFeedbackTone('rose');
            setFeedbackMessage('Центр навчання тимчасово не отримав підтверджених даних від бекенду.');
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadData();

        const interval = window.setInterval(() => {
            void loadData(true);
        }, 30000);

        return () => window.clearInterval(interval);
    }, [loadData]);

    const snapshot = useMemo(
        () => normalizeModelTrainingSnapshot(trainingStatus, trainingHistory, trainingJobs, systemStats),
        [trainingStatus, trainingHistory, trainingJobs, systemStats],
    );

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [snapshot.logs]);

    const handleStartTraining = useCallback(async () => {
        setStarting(true);
        setFeedbackMessage(null);

        try {
            await trainingApi.trigger({ domain: 'ml' });
            setFeedbackTone('emerald');
            setFeedbackMessage('Запит на запуск навчання передано бекенду. Стан буде оновлено після підтвердження.');
            await loadData(true);
        } catch (error) {
            console.error('[ModelTrainingView] Не вдалося запустити навчання:', error);
            setFeedbackTone('rose');
            setFeedbackMessage('Бекенд не підтвердив запуск навчання. Інтерфейс не симулює сесію локально.');
        } finally {
            setStarting(false);
        }
    }, [loadData]);

    const statusTone = toneClasses[snapshot.session.tone];

    return (
        <PageTransition>
            <div className="relative min-h-screen overflow-hidden bg-[#020617] px-4 pb-16 pt-8 sm:px-8 lg:px-12">
                <AdvancedBackground />
                <CyberGrid opacity={0.08} />

                <div className="relative z-10 mx-auto max-w-[1820px] space-y-8">
                    <ViewHeader
                        title={(
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="absolute inset-0 scale-150 rounded-full bg-sky-500/20 blur-[60px]" />
                                    <div className="relative flex h-16 w-16 items-center justify-center rounded-[28px] border border-sky-500/20 bg-slate-950/90 shadow-2xl">
                                        <Brain size={30} className="text-sky-300 drop-shadow-[0_0_14px_rgba(56,189,248,0.75)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black uppercase tracking-[0.12em] text-white sm:text-5xl">
                                        Центр <span className="text-sky-400">навчання</span> моделей
                                    </h1>
                                    <p className="mt-3 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.36em] text-sky-300/75">
                                        <Activity size={12} className="animate-pulse" />
                                        Робочий контур без симуляції метрик і логів
                                    </p>
                                </div>
                            </div>
                        )}
                        icon={<Brain size={20} className="text-sky-400" />}
                        breadcrumbs={['PREDATOR', 'ШІ', 'Навчання моделей']}
                        stats={[
                            {
                                label: 'Статус',
                                value: snapshot.statusHeadline,
                                icon: <Activity size={14} />,
                                color: snapshot.session.statusKey === 'ERROR' ? 'danger' : snapshot.session.statusKey === 'TRAINING' ? 'warning' : 'success',
                                animate: snapshot.session.isRunning,
                            },
                            {
                                label: 'Точність',
                                value: snapshot.accuracyHeadline,
                                icon: <BarChart3 size={14} />,
                                color: 'primary',
                            },
                            {
                                label: 'Прогрес',
                                value: snapshot.session.progressLabel,
                                icon: <Gauge size={14} />,
                                color: 'warning',
                            },
                        ]}
                    />

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge className={cn('border px-4 py-2 text-[11px] font-bold', backendStatus.isOffline ? toneClasses.rose.badge : toneClasses.sky.badge)}>
                            {backendStatus.statusLabel}
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                            Джерела: /ml/training/status, /ml/training/history, /ml/jobs, /system/stats
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                            Оновлено: {snapshot.lastUpdatedLabel ?? 'Немає підтвердженої синхронізації'}
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                            Джерело бекенду: {backendStatus.sourceLabel}
                        </Badge>
                    </div>

                    {feedbackMessage && (
                        <div className={cn(
                            'rounded-[24px] border px-5 py-4 text-sm leading-6',
                            feedbackTone === 'rose'
                                ? 'border-rose-500/20 bg-rose-500/10 text-rose-100'
                                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
                        )}>
                            {feedbackMessage}
                        </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-[1.08fr_1.2fr_0.92fr]">
                        <div className="space-y-6">
                            <TacticalCard variant="holographic" title="Поточна сесія" className="overflow-hidden rounded-[36px] border-white/10 bg-slate-950/50">
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between gap-4 rounded-[28px] border border-white/10 bg-black/20 p-5">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Стан сесії</div>
                                            <div className="mt-2 text-2xl font-black text-white">{snapshot.session.modelLabel}</div>
                                            <div className="mt-2 max-w-md text-sm leading-6 text-slate-300">{snapshot.session.message}</div>
                                        </div>
                                        <Badge className={cn('border px-3 py-2 text-[10px] font-black uppercase tracking-widest', statusTone.badge)}>
                                            {snapshot.session.statusLabel}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                                            <span>Прогрес</span>
                                            <span className={statusTone.accent}>{snapshot.session.progressLabel}</span>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/30 p-1">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${snapshot.session.progress ?? 0}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 shadow-[0_0_18px_rgba(56,189,248,0.45)]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {[
                                            { label: 'Епохи', value: snapshot.session.epochLabel, icon: <Timer size={16} className="text-sky-300" /> },
                                            { label: 'Loss', value: snapshot.session.lossLabel, icon: <BarChart3 size={16} className="text-rose-300" /> },
                                            { label: 'Черга', value: snapshot.session.queueLabel, icon: <ScrollText size={16} className="text-amber-300" /> },
                                            { label: 'Старт', value: snapshot.session.startedAtLabel, icon: <Activity size={16} className="text-emerald-300" /> },
                                        ].map((item) => (
                                            <div key={item.label} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2">{item.icon}</div>
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                                                        <div className="mt-1 text-lg font-black text-white">{item.value}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TacticalCard>

                            <TacticalCard variant="glass" title="Системні ресурси" className="rounded-[36px] border-white/10 bg-slate-950/50">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {[
                                        { label: 'ЦП', value: snapshot.resources.cpuLabel, icon: <Cpu size={16} className="text-sky-300" /> },
                                        { label: 'Памʼять', value: snapshot.resources.memoryLabel, icon: <HardDrive size={16} className="text-indigo-300" /> },
                                        { label: 'Активні задачі', value: snapshot.resources.taskLabel, icon: <Activity size={16} className="text-emerald-300" /> },
                                        { label: 'Затримка API', value: snapshot.resources.latencyLabel, icon: <Gauge size={16} className="text-amber-300" /> },
                                    ].map((item) => (
                                        <div key={item.label} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-2xl border border-white/10 bg-white/5 p-2">{item.icon}</div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                                                    <div className="mt-1 text-xl font-black text-white">{item.value}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TacticalCard>
                        </div>

                        <div className="space-y-6">
                            <TacticalCard variant="holographic" title="Метрики навчання" className="rounded-[36px] border-white/10 bg-slate-950/50">
                                {snapshot.metrics.length > 0 ? (
                                    <div className="h-[360px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={snapshot.metrics}>
                                                <defs>
                                                    <linearGradient id="trainingAccuracy" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.28} />
                                                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="trainingLoss" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#fb7185" stopOpacity={0.22} />
                                                        <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="label" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                                <YAxis yAxisId="accuracy" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                                                <YAxis yAxisId="loss" orientation="right" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(2, 6, 23, 0.95)',
                                                        borderColor: 'rgba(56, 189, 248, 0.2)',
                                                        borderRadius: '18px',
                                                        color: '#fff',
                                                    }}
                                                    formatter={(value: number | null, name: string) => {
                                                        if (value == null) {
                                                            return ['Н/д', name];
                                                        }

                                                        return [
                                                            name === 'Точність' ? `${Math.round(value)}%` : value.toFixed(value < 1 ? 4 : 2),
                                                            name,
                                                        ];
                                                    }}
                                                />
                                                <Area yAxisId="accuracy" type="monotone" dataKey="accuracy" stroke="#38bdf8" fill="url(#trainingAccuracy)" strokeWidth={3} name="Точність" connectNulls />
                                                <Area yAxisId="loss" type="monotone" dataKey="loss" stroke="#fb7185" fill="url(#trainingLoss)" strokeWidth={2} name="Loss" connectNulls />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="Метрики епох не повернуті"
                                        description="Бекенд не надав підтвердженого ряду accuracy/loss. Графік не малює синтетичні точки замість реальних метрик."
                                    />
                                )}
                            </TacticalCard>

                            <TacticalCard variant="glass" title="Журнал навчання" className="overflow-hidden rounded-[36px] border-white/10 bg-slate-950/50">
                                <div className="flex items-center gap-3 border-b border-white/10 bg-black/20 px-6 py-4">
                                    <Terminal size={16} className="text-sky-300" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Потік підтверджених повідомлень</span>
                                </div>
                                <div className="max-h-[360px] overflow-y-auto px-6 py-5">
                                    {snapshot.logs.length > 0 ? (
                                        <div className="space-y-3 font-mono text-[11px]">
                                            {snapshot.logs.map((log, index) => (
                                                <motion.div
                                                    key={`${index}-${log}`}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3"
                                                >
                                                    <span className="shrink-0 text-slate-600">{String(index + 1).padStart(2, '0')}</span>
                                                    <span className="leading-6 text-slate-200">{log}</span>
                                                </motion.div>
                                            ))}
                                            <div ref={logsEndRef} />
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                                            <Terminal className="mb-4 h-10 w-10 text-slate-600" />
                                            <div className="text-base font-black text-white">Бекенд не повернув журнал навчання</div>
                                            <div className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                                                Консоль не створює локальні рядки і не симулює вивід епох без реальних повідомлень від training API.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TacticalCard>
                        </div>

                        <div className="space-y-6">
                            <TacticalCard variant="holographic" title="Керування" className="rounded-[36px] border-white/10 bg-slate-950/50">
                                <div className="space-y-5">
                                    <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                                        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Контур запуску</div>
                                        <div className="mt-2 text-lg font-black text-white">Навчання запускається лише через бекенд</div>
                                        <div className="mt-3 text-sm leading-6 text-slate-300">
                                            Інтерфейс відправляє реальний запит у `POST /ml/training/start`. Локальна імітація тренування вимкнена.
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            void handleStartTraining();
                                        }}
                                        disabled={starting || snapshot.session.isRunning}
                                        className="inline-flex w-full items-center justify-center gap-3 rounded-[28px] border border-sky-400/20 bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-4 text-[11px] font-black uppercase tracking-[0.28em] text-slate-950 transition hover:shadow-[0_24px_50px_rgba(14,165,233,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {starting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} className="fill-current" />}
                                        Запустити навчання
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            void loadData(true);
                                        }}
                                        disabled={refreshing}
                                        className="inline-flex w-full items-center justify-center gap-3 rounded-[28px] border border-white/10 bg-white/5 px-6 py-4 text-[11px] font-black uppercase tracking-[0.28em] text-white transition hover:bg-white/10 disabled:opacity-60"
                                    >
                                        {refreshing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                        Оновити стан
                                    </button>
                                </div>
                            </TacticalCard>

                            <TacticalCard variant="glass" title="Останні запуски" className="rounded-[36px] border-white/10 bg-slate-950/50">
                                {snapshot.runs.length > 0 ? (
                                    <div className="space-y-4">
                                        {snapshot.runs.map((run) => (
                                            <RunCard key={run.id} run={run} />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="Історія запусків порожня"
                                        description="Бекенд не повернув завершені або активні ML jobs. Картки не заповнюються демо-результатами."
                                    />
                                )}
                            </TacticalCard>

                            <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(14,116,144,0.18),rgba(15,23,42,0.92))] p-6 shadow-[0_22px_60px_rgba(8,47,73,0.35)]">
                                <div className="flex items-start gap-4">
                                    <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-300">
                                        {snapshot.session.statusKey === 'ERROR' ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Аналітичний висновок</div>
                                        <div className="mt-2 text-lg font-black text-white">
                                            {snapshot.session.isRunning
                                                ? 'Сесія активна і керується бекендом.'
                                                : snapshot.session.statusKey === 'COMPLETED'
                                                    ? 'Останній підтверджений запуск завершився.'
                                                    : snapshot.session.statusKey === 'ERROR'
                                                        ? 'Останній підтверджений стан містить помилку.'
                                                        : 'Активна сесія не підтверджена.'}
                                        </div>
                                        <div className="mt-3 text-sm leading-6 text-slate-300">
                                            Екран показує лише реальні дані з training API. Якщо бракує епох, логів або ресурсних метрик, інтерфейс залишає відповідний блок порожнім замість домальовування.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
