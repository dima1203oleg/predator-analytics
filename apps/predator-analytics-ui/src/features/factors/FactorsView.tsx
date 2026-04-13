/**
 * Операційний борд факторів.
 *
 * Використовує тільки підтверджені агрегати з:
 * - /api/v1/factory/stats
 * - /api/v1/dashboard/overview
 * - /api/v1/system/stats
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    AlertCircle,
    ChevronRight,
    Factory,
    Loader2,
    Radar,
    RefreshCw,
    Server,
    Shield,
    Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { dashboardApi, type DashboardOverview } from '@/services/api/dashboard';
import { factoryApi } from '@/services/api/factory';
import type { FactoryStats } from '@/features/factory/types';
import { systemApi, type SystemStatsResponse } from '@/services/api/system';
import { cn } from '@/lib/utils';
import { normalizeFactorsSnapshot, type FactorTone } from './factorsView.utils';

const toneClasses: Record<FactorTone, { icon: string; badge: string; border: string; glow: string }> = {
    indigo: {
        icon: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-300',
        badge: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200',
        border: 'border-indigo-500/15',
        glow: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
    },
    amber: {
        icon: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
        badge: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
        border: 'border-amber-500/15',
        glow: 'from-amber-500/20 via-amber-500/5 to-transparent',
    },
    rose: {
        icon: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
        badge: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
        border: 'border-rose-500/15',
        glow: 'from-rose-500/20 via-rose-500/5 to-transparent',
    },
    emerald: {
        icon: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
        badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
        border: 'border-emerald-500/15',
        glow: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    },
    cyan: {
        icon: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300',
        badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
        border: 'border-cyan-500/15',
        glow: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    },
    slate: {
        icon: 'border-slate-500/25 bg-slate-500/10 text-slate-300',
        badge: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
        border: 'border-slate-500/15',
        glow: 'from-slate-500/20 via-slate-500/5 to-transparent',
    },
};

const moduleIcons = {
    aml: Shield,
    factory: Factory,
    'risk-scoring': AlertCircle,
} as const;

const summaryIcons = {
    activeFactors: Factory,
    anomalyCount: Radar,
    systemLoad: Server,
} as const;

const EmptyPanel = ({ title, description }: { title: string; description: string }) => (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-black/30 px-8 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-amber-300" />
        <div className="text-lg font-black text-white">{title}</div>
        <div className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</div>
    </div>
);

export default function FactorsView() {
    const navigate = useNavigate();
    const backendStatus = useBackendStatus();
    const [factoryStats, setFactoryStats] = useState<FactoryStats | null>(null);
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [systemStats, setSystemStats] = useState<SystemStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async (silent: boolean = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [factoryResult, overviewResult, systemResult] = await Promise.allSettled([
                factoryApi.getStats(),
                dashboardApi.getOverview(),
                systemApi.getStats(),
            ]);

            const nextFactory = factoryResult.status === 'fulfilled' ? factoryResult.value : null;
            const nextOverview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;
            const nextSystem = systemResult.status === 'fulfilled' ? systemResult.value : null;

            setFactoryStats(nextFactory);
            setOverview(nextOverview);
            setSystemStats(nextSystem);

            if (!nextFactory && !nextOverview && !nextSystem) {
                setError('Борд факторів тимчасово не отримав підтверджених даних від бекенду.');
            } else {
                setError(null);
            }
        } catch (fetchError) {
            console.error('[FactorsView] Не вдалося оновити борд факторів:', fetchError);
            setError('Борд факторів тимчасово не отримав підтверджених даних від бекенду.');
        } finally {
            setLoading(false);
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
        () => normalizeFactorsSnapshot(factoryStats, overview, systemStats),
        [factoryStats, overview, systemStats],
    );

    return (
        <PageTransition>
            <div className="relative min-h-screen overflow-hidden bg-[#020617] pb-12">
                <AdvancedBackground />
                <CyberGrid opacity={0.08} />

                <div className="pointer-events-none fixed inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 mx-auto max-w-[1900px] p-4 sm:p-8 lg:p-12"
                >
                    <ViewHeader
                        title={(
                            <div className="flex items-center gap-8">
                                <div className="relative">
                                    <div className="absolute inset-0 scale-150 rounded-full bg-indigo-500/25 blur-[60px]" />
                                    <div className="relative flex h-16 w-16 items-center justify-center rounded-[28px] border border-indigo-500/25 bg-slate-950/90 shadow-2xl">
                                        <Factory size={32} className="text-indigo-300 drop-shadow-[0_0_14px_rgba(129,140,248,0.85)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black uppercase tracking-[0.14em] text-white sm:text-5xl">
                                        Центр <span className="text-indigo-400">факторів</span>
                                    </h1>
                                    <p className="mt-3 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.45em] text-indigo-300/75">
                                        <Activity size={12} className="animate-pulse" />
                                        Робочий контур факторних модулів без синтетичних метрик
                                    </p>
                                </div>
                            </div>
                        )}
                        icon={<Factory size={22} className="text-indigo-400" />}
                        breadcrumbs={['PREDATOR', 'Система', 'Борд факторів']}
                        stats={[
                            {
                                label: 'Активні фактори',
                                value: snapshot.summary.activeFactors,
                                color: 'primary',
                                icon: <summaryIcons.activeFactors size={14} />,
                                animate: refreshing,
                            },
                            {
                                label: 'Аномалії',
                                value: snapshot.summary.anomalyCount,
                                color: snapshot.summary.anomalyCount !== 'Н/д' && snapshot.summary.anomalyCount !== '0' ? 'warning' : 'success',
                                icon: <summaryIcons.anomalyCount size={14} />,
                            },
                            {
                                label: 'Навантаження',
                                value: snapshot.summary.systemLoad,
                                color: 'warning',
                                icon: <summaryIcons.systemLoad size={14} />,
                            },
                        ]}
                        actions={(
                            <button
                                type="button"
                                onClick={() => {
                                    void loadData(true);
                                }}
                                disabled={refreshing}
                                className="inline-flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10 disabled:opacity-60"
                            >
                                {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                Синхронізувати
                            </button>
                        )}
                    />

                    <section className="mt-10 overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(9,14,27,0.94))] p-6 shadow-[0_32px_90px_rgba(2,6,23,0.45)] sm:p-8">
                        <div className="pointer-events-none absolute" />
                        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge className={cn('border px-4 py-2 text-[11px] font-bold', backendStatus.isOffline ? toneClasses.rose.badge : toneClasses.cyan.badge)}>
                                        {backendStatus.statusLabel}
                                    </Badge>
                                    <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                                        Джерело: {backendStatus.sourceLabel}
                                    </Badge>
                                    <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                                        Оновлено: {snapshot.lastUpdatedLabel ?? 'Немає підтвердженої синхронізації'}
                                    </Badge>
                                </div>

                                <h2 className="mt-6 max-w-3xl text-3xl font-black tracking-tight text-white">
                                    Єдиний вхід у факторні модулі, де кожна картка показує лише підтверджені агрегати.
                                </h2>
                                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                                    Борд зводить ядро фабрики факторів, огляд ризиків та системні метрики в один зрозумілий контур.
                                    Якщо певний ендпоїнт нічого не повернув, значення залишається порожнім або позначається як <span className="font-bold text-white">Н/д</span>,
                                    без підміни випадковими числами.
                                </p>

                                {error && (
                                    <div className="mt-5 rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
                                        {error}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
                                {[
                                    {
                                        label: 'Активні фактори',
                                        value: snapshot.summary.activeFactors,
                                        tone: 'indigo' as const,
                                        icon: Factory,
                                    },
                                    {
                                        label: 'Сигнали',
                                        value: snapshot.summary.anomalyCount,
                                        tone: 'amber' as const,
                                        icon: Radar,
                                    },
                                    {
                                        label: 'Навантаження ЦП',
                                        value: snapshot.summary.systemLoad,
                                        tone: 'cyan' as const,
                                        icon: Server,
                                    },
                                ].map((item) => {
                                    const styles = toneClasses[item.tone];
                                    return (
                                        <div key={item.label} className={cn('rounded-[28px] border bg-black/25 p-5', styles.border)}>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border', styles.icon)}>
                                                    <item.icon size={20} />
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                                                    <div className="mt-2 text-3xl font-black tracking-tight text-white">{item.value}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {snapshot.quickStats.map((stat, index) => {
                            const styles = toneClasses[stat.tone];

                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                    className={cn('rounded-[28px] border bg-slate-950/60 p-5 shadow-[0_18px_45px_rgba(2,6,23,0.32)]', styles.border)}
                                >
                                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{stat.label}</div>
                                    <div className="mt-3 text-3xl font-black tracking-tight text-white">{stat.value}</div>
                                    <div className="mt-2 text-sm leading-6 text-slate-400">{stat.hint}</div>
                                </motion.div>
                            );
                        })}
                    </section>

                    <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {snapshot.modules.map((module, index) => {
                                const Icon = moduleIcons[module.id as keyof typeof moduleIcons] ?? Factory;
                                const styles = toneClasses[module.tone];

                                return (
                                    <motion.div
                                        key={module.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 + index * 0.08 }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => navigate(module.path)}
                                            className={cn(
                                                'group relative flex h-full w-full flex-col overflow-hidden rounded-[34px] border bg-slate-950/65 p-6 text-left shadow-[0_22px_60px_rgba(2,6,23,0.35)] transition hover:-translate-y-1 hover:border-white/15',
                                                styles.border,
                                            )}
                                        >
                                            <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80', styles.glow)} />
                                            <div className="relative z-10 space-y-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className={cn('flex h-14 w-14 items-center justify-center rounded-[20px] border', styles.icon)}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <Badge className={cn('border px-3 py-1 text-[10px] font-bold', styles.badge)}>
                                                        {module.statusLabel}
                                                    </Badge>
                                                </div>

                                                <div>
                                                    <h3 className="text-2xl font-black text-white">{module.label}</h3>
                                                    <p className="mt-3 text-sm leading-7 text-slate-300">{module.description}</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {module.metrics.map((metric) => (
                                                        <div key={metric.label} className="rounded-[20px] border border-white/5 bg-black/35 p-4">
                                                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{metric.label}</div>
                                                            <div className="mt-2 text-2xl font-black text-white">{metric.value}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                                                        Відкрити модуль
                                                    </span>
                                                    <span className={cn('inline-flex items-center gap-2 text-sm font-black', styles.badge)}>
                                                        Увійти
                                                        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <TacticalCard
                            title="Останні сигнали"
                            icon={<Zap size={18} className="text-emerald-300" />}
                            variant="holographic"
                            className="rounded-[34px] border border-emerald-500/15 bg-slate-950/60"
                        >
                            {snapshot.signals.length > 0 ? (
                                <div className="space-y-3">
                                    {snapshot.signals.map((signal) => {
                                        const styles = toneClasses[signal.tone];

                                        return (
                                            <div
                                                key={signal.id}
                                                className={cn('rounded-[22px] border bg-black/30 p-4', styles.border)}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <Badge className={cn('border px-3 py-1 text-[10px] font-bold', styles.badge)}>
                                                        {signal.severityLabel}
                                                    </Badge>
                                                    <span className="text-xs text-slate-500">{signal.timestampLabel}</span>
                                                </div>
                                                <div className="mt-3 text-sm font-bold leading-6 text-white">{signal.title}</div>
                                                <div className="mt-2 text-xs leading-5 text-slate-400">{signal.subtitle}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyPanel
                                    title={snapshot.hasAnyData ? 'Стрічка сигналів порожня' : 'Немає підтверджених сигналів'}
                                    description={
                                        snapshot.hasAnyData
                                            ? 'Агрегований огляд не повернув критичних або попереджувальних подій для цього борду.'
                                            : 'Спочатку борд має отримати дані з бекенду. Поки що жодні сигнали не домальовуються.'
                                    }
                                />
                            )}
                        </TacticalCard>
                    </section>

                    {loading && (
                        <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-white/5 bg-black/30 px-5 py-4 text-sm text-slate-400">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Отримую підтверджені агрегати факторного контуру…
                        </div>
                    )}
                </motion.div>
            </div>
        </PageTransition>
    );
}
