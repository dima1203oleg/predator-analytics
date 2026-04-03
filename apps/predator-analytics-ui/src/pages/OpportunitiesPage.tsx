import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { marketApi } from '@/features/market/api/market';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';
import {
    ArrowUpRight,
    Clock,
    ExternalLink,
    FileBarChart,
    Lightbulb,
    Loader2,
    Sparkles,
    Star,
    TrendingUp,
    Zap,
    ShieldCheck,
    Scale,
    ShieldAlert,
    Brain,
} from 'lucide-react';
import { ConstitutionalShield } from '@/components/shared/ConstitutionalShield';

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

    return (
        <div className="space-y-6">
            <ConstitutionalShield />
            
            <section className="relative overflow-hidden rounded-[40px] border border-white/[0.08] bg-[#03080f] p-8 shadow-[0_45px_100px_rgba(0,0,0,0.6)] sm:p-10">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none animate-pulse-slow">
                    <Brain size={240} strokeWidth={0.5} className="text-amber-500" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(245,158,11,0.08),transparent_50%)] pointer-events-none" />

                <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:justify-between relative z-10">
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="badge-v2 badge-v2-amber">
                                <span className="relative z-10">PREDATOR v56.1.4 | OPPORTUNITIES</span>
                                <div className="badge-v2-glimmer" />
                            </div>
                            <div className={cn(
                                "badge-v2 px-4 font-black uppercase tracking-[0.15em]",
                                backendStatus.isOffline ? "badge-v2-rose" : "badge-v2-emerald"
                            )}>
                                {backendStatus.statusLabel}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="flex items-center gap-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                                <div className="relative">
                                    <Lightbulb className="text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" size={52} />
                                    <div className="absolute -inset-2 bg-amber-400/20 blur-xl rounded-full animate-pulse" />
                                </div>
                                <span>Можливості</span>
                            </h1>
                            <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-400/90 [text-wrap:balance]">
                                Агрегація реальних інсайтів ринку та стратегічні рекомендації під захистом <span className="text-amber-400 font-bold border-b border-amber-400/30">Constitutional Shield</span>. 
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 xl:w-[600px]">
                        <div className="card-depth group rounded-[28px] border border-white/[0.08] bg-black/40 p-5 transition-all hover:bg-black/60 shadow-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-amber-400/80 transition-colors">Strategic Node</span>
                            </div>
                            <div className="text-base font-bold text-white tracking-tight">Active Signals: {insights.length}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-mono uppercase">Node v56.1.4 OSINT-HUB</div>
                        </div>

                        <div className="card-depth group rounded-[28px] border border-white/[0.08] bg-black/40 p-5 transition-all hover:bg-black/60 shadow-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-cyan-400/80 transition-colors">Intelligence Hub</span>
                            </div>
                            <div className="text-base font-bold text-white tracking-tight">{tabs.find((tab) => tab.key === activeTab)?.label}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-mono uppercase">Level 4 Certified</div>
                        </div>

                        <div className="card-depth rounded-[28px] border border-emerald-400/10 bg-emerald-500/[0.03] p-5 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60">Verification</span>
                            </div>
                            <div className="text-base font-black text-emerald-400 tracking-tighter uppercase leading-none">Opportunity Core</div>
                            <div className="text-[10px] text-emerald-500/40 mt-1 font-mono group-hover:animate-pulse">TRUSTED SECTOR</div>
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

            <ConstitutionalShield />
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
            <div className="grid gap-5 md:grid-cols-3">
                <MetricTile label="Активні сигнали" value={executiveStats.signals.toString()} tone="cyan" />
                <MetricTile
                    label="Грошовий вплив"
                    tone="emerald"
                    value={executiveStats.monetaryImpact > 0 ? formatMoney(executiveStats.monetaryImpact) : 'Н/Д'}
                />
                <MetricTile label="Середня впевненість" tone="amber" value={`${executiveStats.averageConfidence.toFixed(0)}%`} />
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

function MetricTile({ label, value, tone }: { label: string; value: string; tone?: 'cyan' | 'emerald' | 'amber' }) {
    const isEmerald = tone === 'emerald';
    const isCyan = tone === 'cyan';
    const isAmber = tone === 'amber';

    return (
        <div className="stat-card-v2 group relative overflow-hidden rounded-[32px] border border-white/[0.06] bg-black/20 p-6 shadow-2xl transition-all duration-500 hover:border-white/20">
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                isEmerald && "bg-gradient-to-br from-emerald-500/[0.03] to-transparent",
                isCyan && "bg-gradient-to-br from-cyan-500/[0.03] to-transparent",
                isAmber && "bg-gradient-to-br from-amber-500/[0.03] to-transparent"
            )} />
            
            <div className="relative z-10 space-y-4">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 group-hover:text-white/60 transition-colors duration-300">
                    {label}
                </div>
                <div className={cn(
                    "text-4xl font-black tracking-tight drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-500 origin-left",
                    isCyan && "text-cyan-400 group-hover:text-cyan-50",
                    isEmerald && "text-emerald-400 group-hover:text-emerald-50",
                    isAmber && "text-amber-400 group-hover:text-amber-50",
                    !tone && "text-white"
                )}>
                    {value}
                </div>
            </div>
            
            <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                isEmerald && "bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent",
                isCyan && "bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent",
                isAmber && "bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"
            )} />
        </div>
    );
}
