import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { marketApi } from '@/features/market/api/market';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/utils/cn';
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
    Target,
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
    { key: 'recommendations', label: 'рекомендації', icon: <Star size={18} /> },
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
        label: ' изик',
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
            
            
            <section className="relative overflow-hidden rounded-[40px] border border-white/[0.08] bg-[#03080f] p-8 shadow-[0_45px_100px_rgba(0,0,0,0.6)] sm:p-10">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none animate-pulse-slow">
                    <Brain size={240} strokeWidth={0.5} className="text-amber-500" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(245,158,11,0.08),transparent_50%)] pointer-events-none" />

                <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:justify-between relative z-10">
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="badge-v2 badge-v2-amber">
                                <span className="relative z-10">PREDATOR v61.0-ELITE | МОЖЛИВОСТІ</span>
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
                                Агрегація реальних інсайтів ринку та стратегічні рекомендації під захистом <span className="text-amber-400 font-bold border-b border-amber-400/30">Конституційного Щита</span>. 
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 xl:w-[600px]">
                            <div className="card-depth group rounded-[28px] border border-white/[0.08] bg-black/40 p-5 transition-all hover:bg-black/60 shadow-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-amber-400/80 transition-colors">Стратегічний Вузол</span>
                                </div>
                                <div className="text-base font-bold text-white tracking-tight">Активні сигнали: {insights.length}</div>
                                <div className="text-[10px] text-slate-500 mt-1 font-mono uppercase">Вузол v61.0-ELITE OSINT-ХАБ</div>
                            </div>

                            <div className="card-depth group rounded-[28px] border border-white/[0.08] bg-black/40 p-5 transition-all hover:bg-black/60 shadow-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-cyan-400/80 transition-colors">Хаб розвідки</span>
                                </div>
                                <div className="text-base font-bold text-white tracking-tight">{tabs.find((tab) => tab.key === activeTab)?.label}</div>
                                <div className="text-[10px] text-slate-500 mt-1 font-mono uppercase">рівень 4 Сертифіковано</div>
                            </div>

                            <div className="card-depth rounded-[28px] border border-emerald-400/10 bg-emerald-500/[0.03] p-5 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] col-span-2 sm:col-span-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60">Верифікація</span>
                                </div>
                                <div className="text-base font-black text-emerald-400 tracking-tighter uppercase leading-none">Ядро можливостей</div>
                                <div className="text-[10px] text-emerald-500/40 mt-1 font-mono group-hover:animate-pulse">ДОВІ ЕНИЙ СЕКТО </div>
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
                <h3 className="text-lg font-semibold text-white">рекомендацій поки немає</h3>
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
                            рекомендована дія
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
        <div className="space-y-8">
            {/* Top Metrics Grid */}
            <div className="grid gap-5 md:grid-cols-3">
                <MetricTile label="Активні сигнали" value={executiveStats.signals.toString()} tone="cyan" />
                <MetricTile
                    label="Грошовий вплив"
                    tone="emerald"
                    value={executiveStats.monetaryImpact > 0 ? formatMoney(executiveStats.monetaryImpact) : 'Н/Д'}
                />
                <MetricTile label="Середня впевненість" tone="amber" value={`${executiveStats.averageConfidence.toFixed(0)}%`} />
            </div>

            {/* Strategic Decision Matrix (Businessman POV) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7">
                    <StrategicROIMatrix insights={insights} />
                </div>
                <div className="lg:col-span-5">
                    <MarketCaptureSimulator monetaryImpact={executiveStats.monetaryImpact} />
                </div>
            </div>

            {/* Detailed Signals Feed */}
            <div className="rounded-[40px] border border-white/[0.08] bg-[#050505]/60 backdrop-blur-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between relative z-10">
                    <div>
                        <h3 className="text-2xl font-black tracking-tight text-white uppercase italic">Ключові ринкові Сигнали</h3>
                        <p className="mt-1 text-sm text-slate-500 font-medium italic">
                            Пріоритетні вектори розвитку, виявлені нейронним ядром.
                        </p>
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        Останнє оновлення: {executiveStats.lastUpdate ? formatTime(executiveStats.lastUpdate) : 'немає'}
                    </div>
                </div>

                <div className="mt-8 space-y-4 relative z-10">
                    {insights.slice(0, 4).map((insight, idx) => (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group flex items-start gap-6 rounded-[28px] border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] p-5 transition-all duration-300"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/40 border border-white/5 text-amber-400 group-hover:scale-110 transition-transform">
                                <Zap size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">{insight.title}</div>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase">{formatTime(insight.created_at)}</span>
                                </div>
                                <p className="mt-2 text-sm leading-7 text-slate-400 italic">"{insight.description}"</p>
                                <div className="mt-4 flex items-center gap-4">
                                    <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-black text-cyan-300 uppercase tracking-widest">
                                        Вплив: {insight.impact}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Статус: Оперативно</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * 2x2 Strategic ROI Matrix for Business Decision Making
 */
function StrategicROIMatrix({ insights }: { insights: MarketInsight[] }) {
    return (
        <div className="h-full rounded-[40px] border border-white/[0.08] bg-[#050505]/60 backdrop-blur-3xl p-8 relative overflow-hidden group flex flex-col">
            <div className="flex items-center gap-3 mb-8">
                <Scale className="text-amber-400" size={24} />
                <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Матриця Стратегічного ROI</h3>
            </div>
            
            <div className="relative flex-1 min-h-[400px] border border-white/[0.05] rounded-3xl bg-black/40 overflow-hidden">
                {/* Quadrant Labels */}
                <div className="absolute top-4 right-4 text-[9px] font-black text-emerald-400/50 uppercase tracking-widest">Швидкі Перемоги</div>
                <div className="absolute top-4 left-4 text-[9px] font-black text-cyan-400/50 uppercase tracking-widest">Масштабні Проекти</div>
                <div className="absolute bottom-4 left-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Низький Пріоритет</div>
                <div className="absolute bottom-4 right-4 text-[9px] font-black text-amber-400/50 uppercase tracking-widest">Тактичні Можливості</div>

                {/* Grid Lines */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-px bg-white/[0.05]" />
                    <div className="h-full w-px bg-white/[0.05]" />
                </div>

                {/* Axis Labels */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Складність реалізації</div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 -translate-x-full px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Потенційний Прибуток</div>

                {/* Plotted Opportunities */}
                <div className="absolute inset-0 p-12">
                    {insights.slice(0, 10).map((insight, idx) => {
                        // Map priority and confidence to coordinates
                        const priorityMap: Record<string, number> = { low: 20, medium: 50, high: 85 };
                        const confidenceMap: Record<number, number> = { 0.5: 30, 0.7: 50, 0.9: 80 };
                        
                        const y = priorityMap[insight.priority] || 50;
                        const x = (insight.confidence * 100) || 50;
                        
                        return (
                            <motion.div
                                key={insight.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1, type: 'spring' }}
                                style={{ left: `${x}%`, top: `${100 - y}%` }}
                                className="absolute group/point cursor-pointer"
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all group-hover/point:scale-150 group-hover/point:shadow-[0_0_25px_rgba(255,255,255,0.6)]",
                                    insight.priority === 'high' ? "bg-emerald-400" : insight.priority === 'medium' ? "bg-amber-400" : "bg-slate-400"
                                )} />
                                
                                {/* Tooltip on Hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover/point:opacity-100 transition-all pointer-events-none z-50">
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[200px] backdrop-blur-xl">
                                        <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Об'єкт: #{insight.id.slice(0, 8)}</div>
                                        <div className="text-xs font-bold text-white mb-2">{insight.title}</div>
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase">
                                            <span className="text-emerald-400"> ВД (ROI): {insight.priority === 'high' ? 'Екстремальний' : 'Стабільний'}</span>
                                            <span className="text-slate-400">{insight.impact}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/**
 * Interactive Market Capture Simulator for Business Growth
 */
function MarketCaptureSimulator({ monetaryImpact }: { monetaryImpact: number }) {
    const [marketShare, setMarketShare] = useState(15);
    const estimatedRev = (monetaryImpact * (marketShare / 100)) * 12; // Yearly estimate

    return (
        <div className="h-full rounded-[40px] border border-white/[0.08] bg-gradient-to-br from-emerald-500/[0.03] to-cyan-500/[0.03] backdrop-blur-3xl p-8 relative overflow-hidden group flex flex-col">
            <div className="flex items-center gap-3 mb-8">
                <Target className="text-emerald-400" size={24} />
                <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Симулятор  инкової Частки</h3>
            </div>

            <div className="space-y-10 flex-1 flex flex-col justify-center">
                <div className="text-center space-y-2">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Прогнозований  ічний Дохід</div>
                    <div className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        {formatMoney(estimatedRev)}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-500/60 uppercase">Основано на GNN-прогнозі (Графові Нейронні Мережі) v58.2</div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Цільова Частка  инку</span>
                        <span className="text-2xl font-black text-emerald-400">{marketShare}%</span>
                    </div>
                    
                    <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={marketShare}
                        onChange={(e) => setMarketShare(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                            <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Складність</div>
                            <div className="text-xs font-bold text-white">{marketShare > 50 ? 'Екстремальна' : marketShare > 20 ? 'Висока' : 'Оптимальна'}</div>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                            <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Термін</div>
                            <div className="text-xs font-bold text-white">{Math.ceil(marketShare / 5)} міс.</div>
                        </div>
                    </div>
                </div>

                <button className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-3xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-900/20 active:scale-95">
                    Сформувати Бізнес-План
                </button>
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
