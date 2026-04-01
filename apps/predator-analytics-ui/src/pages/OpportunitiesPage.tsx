import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { marketApi } from '@/features/market/api/market';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';
import {
    ArrowUpRight,
    BadgeCheck,
    Clock,
    ExternalLink,
    FileBarChart,
    Lightbulb,
    Loader2,
    ArrowRight,
    Sparkles,
    Star,
    ShieldCheck,
    Target,
    TrendingUp,
    Zap,
} from 'lucide-react';

type OpportunityTab = 'insights' | 'recommendations' | 'executive';

interface MarketInsightAction {
    label: string;
}

interface MarketInsight {
    id: string;
    type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'prediction' | string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low' | string;
    impact: string;
    confidence: number;
    created_at: string;
    actions?: MarketInsightAction[];
}

const tabs: Array<{ key: OpportunityTab; label: string; icon: JSX.Element }> = [
    { key: 'insights', label: 'Інсайти', icon: <Sparkles size={18} /> },
    { key: 'recommendations', label: 'Рекомендації', icon: <Star size={18} /> },
    { key: 'executive', label: 'Виконавчий огляд', icon: <FileBarChart size={18} /> },
];

const typeConfig: Record<
    string,
    { label: string; icon: JSX.Element; badge: string }
> = {
    opportunity: {
        label: 'Можливість',
        icon: <Lightbulb size={18} className="text-emerald-300" />,
        badge: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
    },
    risk: {
        label: 'Ризик',
        icon: <Zap size={18} className="text-rose-300" />,
        badge: 'border-rose-400/20 bg-rose-500/10 text-rose-200',
    },
    trend: {
        label: 'Тренд',
        icon: <TrendingUp size={18} className="text-cyan-300" />,
        badge: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
    },
    anomaly: {
        label: 'Аномалія',
        icon: <Zap size={18} className="text-amber-300" />,
        badge: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
    },
    prediction: {
        label: 'Прогноз',
        icon: <ArrowUpRight size={18} className="text-indigo-300" />,
        badge: 'border-indigo-400/20 bg-indigo-500/10 text-indigo-200',
    },
};

const priorityConfig: Record<
    string,
    { label: string; badge: string }
> = {
    critical: { label: 'Критично', badge: 'border-rose-400/20 bg-rose-500/10 text-rose-200' },
    high: { label: 'Високий', badge: 'border-orange-400/20 bg-orange-500/10 text-orange-200' },
    medium: { label: 'Середній', badge: 'border-amber-400/20 bg-amber-500/10 text-amber-200' },
    low: { label: 'Низький', badge: 'border-slate-400/20 bg-slate-500/10 text-slate-200' },
};

const formatTime = (value: string): string =>
    new Date(value).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

const extractMoneyValue = (value: string): number | null => {
    const normalized = value.replace(/\s+/g, '');
    const match = normalized.match(/\$?(\d+(?:[.,]\d+)?)([kKmM])?/);

    if (!match) {
        return null;
    }

    const amount = Number(match[1].replace(',', '.'));

    if (Number.isNaN(amount)) {
        return null;
    }

    if (match[2]?.toLowerCase() === 'm') {
        return amount * 1_000_000;
    }

    if (match[2]?.toLowerCase() === 'k') {
        return amount * 1_000;
    }

    return amount;
};

const formatMoney = (value: number): string => {
    if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(1)}M`;
    }

    if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(1)}K`;
    }

    return `$${value.toLocaleString('uk-UA')}`;
};

export default function OpportunitiesPage() {
    const backendStatus = useBackendStatus();
    const [activeTab, setActiveTab] = useState<OpportunityTab>('insights');

    const { data, isLoading } = useQuery({
        queryKey: ['market-insights'],
        queryFn: marketApi.getInsights,
        refetchInterval: 60_000,
    });

    const insights = (data?.insights ?? []) as MarketInsight[];

    const insightSummary = useMemo(() => {
        const actionable = insights.filter((insight) => (insight.actions?.length ?? 0) > 0).length;
        const critical = insights.filter((insight) => insight.priority === 'critical').length;
        const averageConfidence =
            insights.length > 0
                ? insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length
                : 0;

        return {
            actionable,
            averageConfidence,
            critical,
        };
    }, [insights]);

    const topRecommendations = useMemo(
        () =>
            insights
                .filter((insight) => insight.type === 'opportunity' || insight.type === 'prediction' || (insight.actions?.length ?? 0) > 0)
                .sort((left, right) => right.confidence - left.confidence),
        [insights],
    );
    const topRecommendation = topRecommendations[0] ?? null;

    const executiveStats = useMemo(() => {
        const monetaryImpact = insights.reduce((sum, insight) => sum + (extractMoneyValue(insight.impact) ?? 0), 0);

        return {
            signals: insights.length,
            monetaryImpact,
            averageConfidence: insightSummary.averageConfidence,
            lastUpdate:
                insights.length > 0
                    ? [...insights].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0].created_at
                    : null,
        };
    }, [insightSummary.averageConfidence, insights]);
    const actionableRatio = insights.length > 0 ? Math.round((insightSummary.actionable / insights.length) * 100) : 0;

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(3,12,21,0.98),rgba(11,18,31,0.95))] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)] sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_28%)]" />
                <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] xl:items-stretch">
                    <div className="max-w-3xl">
                        <div className="mb-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
                                Ринкові сигнали
                            </span>
                            <span
                                className={cn(
                                    'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]',
                                    backendStatus.isOffline
                                        ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                                        : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
                                )}
                            >
                                {backendStatus.statusLabel}
                            </span>
                            <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">
                                {actionableRatio}% дійсних сигналів
                            </span>
                        </div>
                        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                            <Lightbulb className="text-amber-300" size={30} />
                            Можливості
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                            Сторінка агрегує реальні інсайти ринку, а вкладки рекомендацій та виконавчого
                            огляду формуються з цього самого потоку без статичних демо-блоків.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveTab('recommendations')}
                                className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 transition-all hover:bg-amber-500/16"
                            >
                                <ArrowRight size={16} />
                                До рекомендацій
                            </button>
                            <Link
                                to="/procurement-optimizer"
                                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition-all hover:bg-emerald-500/16"
                            >
                                <BadgeCheck size={16} />
                                Закупівельний сценарій
                            </Link>
                            <Link
                                to="/scenario-progress"
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.08]"
                            >
                                <Target size={16} />
                                Центр виконання
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <MetricTile label="Сигнали" value={insights.length.toString()} />
                            <MetricTile label="Критичні" value={insightSummary.critical.toString()} />
                            <MetricTile label="Дії" value={insightSummary.actionable.toString()} />
                            <MetricTile label="Впевненість" value={`${insightSummary.averageConfidence.toFixed(0)}%`} />
                        </div>

                        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.24)]">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                        Найсильніша можливість
                                    </div>
                                    <div className="mt-1 text-lg font-black text-white">
                                        {topRecommendation?.title ?? 'Ще не визначено'}
                                    </div>
                                </div>
                                <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
                                    {backendStatus.sourceLabel}
                                </div>
                            </div>
                            <div className="mt-4 rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
                                    Наступна дія
                                </div>
                                <div className="mt-2 text-sm leading-7 text-slate-300">
                                    {topRecommendation
                                        ? topRecommendation.description
                                        : 'Система ще збирає сигнали для пріоритетного рішення.'}
                                </div>
                                {topRecommendation ? (
                                    <div className="mt-3 text-sm font-semibold text-cyan-200">
                                        {topRecommendation.impact}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-2">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all',
                                activeTab === tab.key
                                    ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                                    : 'border-transparent text-slate-300 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white',
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'insights' && <InsightsTab insights={insights} isLoading={isLoading} />}
                    {activeTab === 'recommendations' && (
                        <RecommendationsTab recommendations={topRecommendations} isLoading={isLoading} />
                    )}
                    {activeTab === 'executive' && (
                        <ExecutiveTab executiveStats={executiveStats} insights={insights} isLoading={isLoading} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function InsightsTab({
    insights,
    isLoading,
}: {
    insights: MarketInsight[];
    isLoading: boolean;
}) {
    if (isLoading && insights.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-amber-300" />
                <p>Аналізуємо ринок і формуємо поточні інсайти...</p>
            </div>
        );
    }

    if (insights.length === 0) {
        return (
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-12 text-center">
                <Sparkles size={48} className="mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-semibold text-white">Інсайти поки не сформовано</h3>
                <p className="mt-2 text-sm text-slate-500">
                    Система не отримала достатньо підтверджених ринкових сигналів для цього блоку.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {insights.map((insight, index) => {
                const type = typeConfig[insight.type] ?? typeConfig.opportunity;
                const priority = priorityConfig[insight.priority] ?? priorityConfig.medium;

                return (
                    <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 transition-all hover:border-amber-400/16 hover:bg-white/[0.04]"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/20">
                                {type.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', type.badge)}>
                                        {type.label}
                                    </span>
                                    <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', priority.badge)}>
                                        Пріоритет: {priority.label}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                        <Clock size={12} />
                                        {formatTime(insight.created_at)}
                                    </span>
                                </div>
                                <h4 className="mt-3 text-lg font-black text-white">{insight.title}</h4>
                                <p className="mt-2 text-sm leading-7 text-slate-400">{insight.description}</p>
                                <div className="mt-3 text-sm font-semibold text-cyan-200">
                                    Вплив: {insight.impact}
                                </div>
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span>Впевненість:</span>
                                        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/[0.08]">
                                            <div
                                                className="h-full rounded-full bg-amber-300"
                                                style={{ width: `${Math.max(0, Math.min(100, insight.confidence))}%` }}
                                            />
                                        </div>
                                        <span className="font-semibold text-slate-200">{insight.confidence.toFixed(1)}%</span>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {insight.actions?.map((action, actionIndex) => (
                                            <button
                                                key={actionIndex}
                                                className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-500/16"
                                            >
                                                {action.label}
                                                <ExternalLink size={12} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

function RecommendationsTab({
    recommendations,
    isLoading,
}: {
    recommendations: MarketInsight[];
    isLoading: boolean;
}) {
    if (isLoading && recommendations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-amber-300" />
                <p>Підбираємо релевантні рекомендації з поточних сигналів...</p>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-12 text-center">
                <Star size={48} className="mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-semibold text-white">Рекомендацій поки немає</h3>
                <p className="mt-2 text-sm text-slate-500">
                    Поточний потік інсайтів не містить дій, які можна впевнено винести в рекомендації.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                {recommendations.map((recommendation) => (
                    <div
                        key={recommendation.id}
                        className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                Рекомендована дія
                            </div>
                            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                                {recommendation.confidence.toFixed(0)}% впевненості
                            </span>
                        </div>
                        <h3 className="mt-4 text-lg font-black text-white">{recommendation.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-400">{recommendation.description}</p>
                        <div className="mt-4 rounded-[22px] border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-slate-300">
                            Очікуваний вплив: {recommendation.impact}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {(recommendation.actions?.length ? recommendation.actions : [{ label: 'Відкрити картку сигналу' }]).map((action, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-500/16"
                                >
                                    {action.label}
                                    <ExternalLink size={12} />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-[28px] border border-emerald-400/14 bg-emerald-500/8 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                            Готовий сценарій
                        </div>
                        <div className="mt-2 text-lg font-black text-white">
                            Перевести найсильнішу рекомендацію в закупівельний сценарій
                        </div>
                    </div>
                    <Link
                        to="/procurement-optimizer"
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition-all hover:bg-emerald-500/16"
                    >
                        <BadgeCheck size={16} />
                        Відкрити оптимізацію
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ExecutiveTab({
    executiveStats,
    insights,
    isLoading,
}: {
    executiveStats: {
        signals: number;
        monetaryImpact: number;
        averageConfidence: number;
        lastUpdate: string | null;
    };
    insights: MarketInsight[];
    isLoading: boolean;
}) {
    if (isLoading && insights.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-cyan-300" />
                <p>Готуємо виконавчий огляд із поточного потоку інсайтів...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <MetricTile label="Активні сигнали" value={executiveStats.signals.toString()} />
                <MetricTile
                    label="Оцінений грошовий вплив"
                    value={executiveStats.monetaryImpact > 0 ? formatMoney(executiveStats.monetaryImpact) : 'Н/Д'}
                />
                <MetricTile label="Середня впевненість" value={`${executiveStats.averageConfidence.toFixed(0)}%`} />
            </div>

            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6">
                <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h3 className="text-lg font-black tracking-tight text-white">Короткий виконавчий огляд</h3>
                        <p className="mt-1 text-sm text-slate-400">
                            Блок зібрано з реальних інсайтів, які вже є на сторінці.
                        </p>
                    </div>
                    <div className="text-xs text-slate-500">
                        Останнє оновлення: {executiveStats.lastUpdate ? formatTime(executiveStats.lastUpdate) : 'немає'}
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    {insights.slice(0, 3).map((insight) => (
                        <div
                            key={insight.id}
                            className="rounded-[24px] border border-white/[0.08] bg-black/20 px-4 py-4"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="font-semibold text-white">{insight.title}</div>
                                <span className="text-xs text-slate-500">{formatTime(insight.created_at)}</span>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-slate-400">{insight.description}</p>
                            <div className="mt-3 text-sm font-semibold text-cyan-200">{insight.impact}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MetricTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-white">{value}</div>
        </div>
    );
}
