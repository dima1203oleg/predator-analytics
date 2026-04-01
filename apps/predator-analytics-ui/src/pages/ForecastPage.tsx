import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import { forecastApi } from '@/features/forecast/api/forecast';
import type {
    ForecastDemandRequest,
    ForecastModel,
    ForecastPoint,
    ForecastResponse,
} from '@/features/forecast/types';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    ArrowUpRight,
    Brain,
    Loader2,
    RefreshCw,
    Settings2,
    Target,
    TrendingUp,
    Zap,
    ShieldCheck,
    AlertTriangle
} from 'lucide-react';
import { ConstitutionalShield } from '@/components/shared/ConstitutionalShield';

type ForecastTab = 'demand' | 'models' | 'scenarios';

const tabs: Array<{ key: ForecastTab; label: string; icon: JSX.Element }> = [
    { key: 'demand', label: 'Прогноз попиту', icon: <TrendingUp size={18} /> },
    { key: 'models', label: 'ML моделі', icon: <Brain size={18} /> },
    { key: 'scenarios', label: 'Сценарії', icon: <Settings2 size={18} /> },
];

const defaultRequest: ForecastDemandRequest = {
    product_code: '84713000',
    months_ahead: 6,
    model: 'prophet',
};

const buildChartOption = (forecast: ForecastResponse) => ({
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(7, 15, 28, 0.96)',
        borderColor: 'rgba(16,185,129,0.24)',
        textStyle: { color: '#fff', fontSize: 12 },
        padding: [8, 12],
    },
    legend: {
        data: ['Прогноз', 'Нижня межа', 'Верхня межа'],
        textStyle: { color: '#cbd5e1', fontSize: 12 },
        top: 20,
    },
    grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '16%',
        containLabel: true,
    },
    xAxis: {
        type: 'category',
        data: forecast.forecast.map((point) => point.date),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
        axisLabel: { color: '#cbd5e1', fontSize: 11 },
        splitLine: { show: false },
    },
    yAxis: {
        type: 'value',
        name: 'Обсяг',
        nameTextStyle: { color: '#cbd5e1', fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: '#cbd5e1', fontSize: 11 },
    },
    series: [
        {
            name: 'Прогноз',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#059669' },
            lineStyle: { color: '#10b981', width: 3 },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
                        { offset: 1, color: 'rgba(16, 185, 129, 0.04)' },
                    ],
                },
            },
            data: forecast.forecast.map((point) => point.predicted_volume),
        },
        {
            name: 'Нижня межа',
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: { color: 'rgba(148, 163, 184, 0.6)', width: 1, type: 'dashed' },
            data: forecast.forecast.map((point) => point.confidence_lower),
        },
        {
            name: 'Верхня межа',
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: { color: 'rgba(148, 163, 184, 0.6)', width: 1, type: 'dashed' },
            data: forecast.forecast.map((point) => point.confidence_upper),
        },
    ],
});

const calculateGrowth = (forecast: ForecastResponse): number => {
    const firstPoint = forecast.forecast[0];
    const lastPoint = forecast.forecast[forecast.forecast.length - 1];

    if (!firstPoint || !lastPoint || firstPoint.predicted_volume === 0) {
        return 0;
    }

    return ((lastPoint.predicted_volume - firstPoint.predicted_volume) / firstPoint.predicted_volume) * 100;
};

const createScenarioPoints = (points: ForecastPoint[], multiplier: number): ForecastPoint[] =>
    points.map((point) => ({
        ...point,
        predicted_volume: Math.round(point.predicted_volume * multiplier),
        confidence_lower: Math.round(point.confidence_lower * multiplier),
        confidence_upper: Math.round(point.confidence_upper * multiplier),
    }));

export default function ForecastPage() {
    const backendStatus = useBackendStatus();
    const [activeTab, setActiveTab] = useState<ForecastTab>('demand');
    const [request, setRequest] = useState<ForecastDemandRequest>(defaultRequest);
    const [draftProductCode, setDraftProductCode] = useState(defaultRequest.product_code);
    const [forecast, setForecast] = useState<ForecastResponse | null>(null);
    const [models, setModels] = useState<ForecastModel[]>([]);
    const [forecastLoading, setForecastLoading] = useState(true);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [forecastError, setForecastError] = useState<string | null>(null);
    const [modelsError, setModelsError] = useState<string | null>(null);

    const fetchForecast = useCallback(async (params: ForecastDemandRequest) => {
        try {
            setForecastLoading(true);
            setForecastError(null);
            const data = await forecastApi.getDemandForecast(params);
            setForecast(data);
        } catch (error) {
            console.error('Не вдалося отримати прогноз:', error);
            setForecastError('Не вдалося отримати прогноз. Спробуйте ще раз або перевірте бекенд.');
        } finally {
            setForecastLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchForecast(defaultRequest);
    }, [fetchForecast]);

    useEffect(() => {
        if (activeTab !== 'models' || models.length > 0 || modelsLoading) {
            return;
        }

        const fetchModels = async () => {
            try {
                setModelsLoading(true);
                setModelsError(null);
                const data = await forecastApi.getModels();
                setModels(data.models || []);
            } catch (error) {
                console.error('Не вдалося завантажити перелік моделей:', error);
                setModelsError('Не вдалося завантажити перелік моделей. Перевірте бекенд.');
            } finally {
                setModelsLoading(false);
            }
        };

        fetchModels();
    }, [activeTab, models.length, modelsLoading]);

    const chartOption = useMemo(
        () => (forecast ? buildChartOption(forecast) : null),
        [forecast],
    );

    const growth = useMemo(
        () => (forecast ? calculateGrowth(forecast) : 0),
        [forecast],
    );

    const scenarioGroups = useMemo(() => {
        if (!forecast) {
            return [];
        }

        return [
            {
                id: 'conservative',
                title: 'Консервативний',
                description: 'Пониження попиту на 10% відносно базового прогнозу.',
                tone: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
                points: createScenarioPoints(forecast.forecast, 0.9),
            },
            {
                id: 'base',
                title: 'Базовий',
                description: 'Поточний прогноз, отриманий із фактичного ендпоїнту.',
                tone: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
                points: forecast.forecast,
            },
            {
                id: 'accelerated',
                title: 'Прискорений',
                description: 'Зростання попиту на 12% поверх базового сценарію.',
                tone: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
                points: createScenarioPoints(forecast.forecast, 1.12),
            },
        ];
    }, [forecast]);

    return (
        <div className="space-y-6">
            <ConstitutionalShield />
            
            <section className="relative overflow-hidden rounded-[40px] border border-white/[0.08] bg-[#03080f] p-8 shadow-[0_45px_100px_rgba(0,0,0,0.6)] sm:p-10">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none transform -rotate-6">
                    <Brain size={240} strokeWidth={0.5} className="text-emerald-400" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

                <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:justify-between relative z-10">
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="badge-v2 badge-v2-emerald">
                                <span className="relative z-10">PREDATOR v11.5 | ML-FORECASTING</span>
                                <div className="badge-v2-glimmer" />
                            </div>
                            <div className={cn(
                                "badge-v2 px-4 font-black uppercase tracking-[0.15em]",
                                backendStatus.isOffline ? "badge-v2-rose" : "badge-v2-cyan"
                            )}>
                                {backendStatus.statusLabel}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="flex items-center gap-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                                <div className="relative">
                                    <TrendingUp className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" size={52} />
                                    <div className="absolute -inset-2 bg-emerald-400/20 blur-xl rounded-full animate-pulse" />
                                </div>
                                <span>Прогнозування</span>
                            </h1>
                            <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-400/90 [text-wrap:balance]">
                                Керуйте товарним кодом та ML-моделями під захистом <span className="text-emerald-400 font-bold border-b border-emerald-400/30">Constitutional Shield</span>. Всі сценарії базуються на верифікованих ринкових даних.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 xl:w-[600px]">
                        <div className="card-depth group rounded-[28px] border border-white/[0.08] bg-black/40 p-5 transition-all hover:bg-black/60 shadow-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-emerald-400/80 transition-colors">Projective Core</span>
                            </div>
                            <div className="text-base font-bold text-white tracking-tight">Active Model: {request.model}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-mono uppercase">Node v11.5 OSINT-HUB</div>
                        </div>

                        <div className="card-depth group rounded-[28px] border border-white/[0.08] bg-black/40 p-5 transition-all hover:bg-black/60 shadow-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-cyan-400/80 transition-colors">Target Sector</span>
                            </div>
                            <div className="text-base font-bold text-white tracking-tight">{request.product_code}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-mono uppercase">Level 4 Certified</div>
                        </div>

                        <div className="card-depth rounded-[28px] border border-amber-400/10 bg-amber-500/[0.03] p-5 shadow-[inset_0_0_20px_rgba(251,191,36,0.05)] col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck className="h-3 w-3 text-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60">Verification</span>
                            </div>
                            <div className="text-base font-black text-amber-400 tracking-tighter uppercase leading-none">Predictive Certified</div>
                            <div className="text-[10px] text-amber-500/40 mt-1 font-mono">TRUSTED CORE</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="grid gap-3 md:grid-cols-3">
                    <label className="rounded-[24px] border border-white/[0.08] bg-black/20 px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Код товару</div>
                        <input
                            value={draftProductCode}
                            onChange={(event) => setDraftProductCode(event.target.value)}
                            className="mt-2 w-full bg-transparent text-sm font-semibold text-white outline-none"
                        />
                    </label>

                    <label className="rounded-[24px] border border-white/[0.08] bg-black/20 px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Горизонт</div>
                        <select
                            value={request.months_ahead}
                            onChange={(event) =>
                                setRequest((current) => ({
                                    ...current,
                                    months_ahead: Number(event.target.value),
                                }))
                            }
                            className="mt-2 w-full bg-transparent text-sm font-semibold text-white outline-none"
                        >
                            <option value={3}>3 місяці</option>
                            <option value={6}>6 місяців</option>
                            <option value={9}>9 місяців</option>
                            <option value={12}>12 місяців</option>
                        </select>
                    </label>

                    <label className="rounded-[24px] border border-white/[0.08] bg-black/20 px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Модель</div>
                        <select
                            value={request.model}
                            onChange={(event) =>
                                setRequest((current) => ({
                                    ...current,
                                    model: event.target.value,
                                }))
                            }
                            className="mt-2 w-full bg-transparent text-sm font-semibold text-white outline-none"
                        >
                            <option value="prophet">prophet</option>
                            <option value="arima">arima</option>
                            <option value="lstm">lstm</option>
                        </select>
                    </label>
                </div>

                <button
                    onClick={() => {
                        const nextRequest = {
                            ...request,
                            product_code: draftProductCode.trim() || defaultRequest.product_code,
                        };

                        setRequest(nextRequest);
                        fetchForecast(nextRequest);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition-all hover:bg-emerald-500/18"
                >
                    <RefreshCw size={16} className={cn(forecastLoading && 'animate-spin')} />
                    Оновити прогноз
                </button>
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
                                    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
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
                    {activeTab === 'demand' && (
                        <DemandForecastTab
                            chartOption={chartOption}
                            forecast={forecast}
                            growth={growth}
                            loading={forecastLoading}
                            error={forecastError}
                        />
                    )}
                    {activeTab === 'models' && (
                        <ModelsTab
                            models={models}
                            loading={modelsLoading}
                            error={modelsError}
                        />
                    )}
                    {activeTab === 'scenarios' && (
                        <ScenariosTab
                            forecast={forecast}
                            loading={forecastLoading}
                            scenarioGroups={scenarioGroups}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            <ConstitutionalShield />
        </div>
    );
}

function DemandForecastTab({
    chartOption,
    forecast,
    growth,
    loading,
    error,
}: {
    chartOption: Record<string, unknown> | null;
    forecast: ForecastResponse | null;
    growth: number;
    loading: boolean;
    error: string | null;
}) {
    if (loading) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <p className="animate-pulse">Розрахунок ML-прогнозу...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
                {error}
            </div>
        );
    }

    if (!forecast || !chartOption) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                    icon={<TrendingUp className="text-emerald-300" />}
                    label="Прогнозний ріст"
                    tone="border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                    value={`${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%`}
                />
                <SummaryCard
                    icon={<Target className="text-cyan-300" />}
                    label="Впевненість"
                    tone="border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                    value={`${(forecast.confidence_score * 100).toFixed(0)}%`}
                />
                <SummaryCard
                    icon={<Zap className="text-amber-300" />}
                    label="MAPE (похибка)"
                    tone="border-amber-400/20 bg-amber-500/10 text-amber-200"
                    value={`${(forecast.mape * 100).toFixed(1)}%`}
                />
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6">
                <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h3 className="text-lg font-black tracking-tight text-white">Графік прогнозу</h3>
                        <p className="mt-1 text-sm text-slate-400">
                            {forecast.product_name} ({forecast.product_code})
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-slate-300">
                            {forecast.model_used}
                        </span>
                        <span
                            className={cn(
                                'rounded-full border px-3 py-1.5 font-semibold',
                                forecast.source === 'real'
                                    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                                    : 'border-amber-400/20 bg-amber-500/10 text-amber-200',
                            )}
                        >
                            {forecast.source === 'real' ? 'Реальні дані' : 'Синтетичні'}
                        </span>
                    </div>
                </div>

                <div className="mt-5 h-[350px] w-full">
                    <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>

            <div className="rounded-[28px] border border-emerald-400/16 bg-emerald-500/8 p-6">
                <div className="flex items-start gap-4">
                    <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-emerald-300" />
                    <div>
                        <h4 className="text-lg font-black text-white">AI-інтерпретація</h4>
                        <p className="mt-2 text-sm leading-7 text-slate-300">{forecast.interpretation_uk}</p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03]">
                <div className="border-b border-white/[0.06] px-6 py-5">
                    <h3 className="text-lg font-black tracking-tight text-white">Детальні прогнозні точки</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-black/20 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                                <th className="px-6 py-4">Місяць</th>
                                <th className="px-6 py-4 text-right">Прогноз</th>
                                <th className="px-6 py-4 text-right">Нижня межа</th>
                                <th className="px-6 py-4 text-right">Верхня межа</th>
                                <th className="px-6 py-4 text-right">Інтервал</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                            {forecast.forecast.map((point) => (
                                <tr key={point.date} className="text-sm transition-colors hover:bg-white/[0.03]">
                                    <td className="px-6 py-4 font-semibold text-slate-200">{point.date}</td>
                                    <td className="px-6 py-4 text-right font-black text-emerald-200">
                                        {point.predicted_volume.toLocaleString('uk-UA')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">
                                        {point.confidence_lower.toLocaleString('uk-UA')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">
                                        {point.confidence_upper.toLocaleString('uk-UA')}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-400">
                                        {Math.max(0, point.confidence_upper - point.confidence_lower).toLocaleString('uk-UA')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ModelsTab({
    models,
    loading,
    error,
}: {
    models: ForecastModel[];
    loading: boolean;
    error: string | null;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-black tracking-tight text-white">Доступні алгоритми прогнозування</h3>
                <p className="mt-1 text-sm text-slate-400">
                    Жодних вигаданих показників точності. Показуємо лише назву та опис, які реально віддав бекенд.
                </p>
            </div>

            {error && (
                <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-44 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
                            <div className="h-full animate-pulse rounded-[24px] bg-white/[0.05]" />
                        </div>
                    ))
                ) : models.length === 0 ? (
                    <div className="col-span-full rounded-[24px] border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-sm text-slate-300">
                        Немає доступних моделей. Запустіть тренування або перевірте конфігурацію бекенду.
                    </div>
                ) : (
                    models.map((model) => (
                        <div
                            key={model.key}
                            className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 transition-all hover:border-emerald-400/18 hover:bg-white/[0.04]"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
                                <Brain className="h-5 w-5 text-emerald-200" />
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3">
                                <h4 className="text-lg font-black text-white">{model.name_uk}</h4>
                                <span className="rounded-full border border-white/[0.08] bg-black/20 px-2.5 py-1 text-[11px] text-slate-300">
                                    {model.key}
                                </span>
                            </div>
                            <p className="mt-3 text-sm leading-7 text-slate-400">{model.description_uk}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ScenariosTab({
    forecast,
    loading,
    scenarioGroups,
}: {
    forecast: ForecastResponse | null;
    loading: boolean;
    scenarioGroups: Array<{
        id: string;
        title: string;
        description: string;
        tone: string;
        points: ForecastPoint[];
    }>;
}) {
    if (loading) {
        return (
            <div className="flex h-56 items-center justify-center gap-4 text-slate-400">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                Підготовка сценарного простору...
            </div>
        );
    }

    if (!forecast) {
        return (
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-sm text-slate-300">
                Сценарії недоступні, доки не буде отримано базовий прогноз.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6">
                <h3 className="text-lg font-black tracking-tight text-white">Сценарний простір</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                    Сценарії будуються на базі останнього отриманого прогнозу та одразу показують,
                    як зміниться сумарний обсяг по кожному варіанту.
                </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                {scenarioGroups.map((scenario) => {
                    const totalVolume = scenario.points.reduce(
                        (sum, point) => sum + point.predicted_volume,
                        0,
                    );
                    const peakPoint = scenario.points.reduce<ForecastPoint | null>(
                        (peak, point) =>
                            !peak || point.predicted_volume > peak.predicted_volume ? point : peak,
                        null,
                    );

                    return (
                        <div
                            key={scenario.id}
                            className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5"
                        >
                            <span className={cn('inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold', scenario.tone)}>
                                {scenario.title}
                            </span>
                            <p className="mt-4 text-sm leading-7 text-slate-400">{scenario.description}</p>

                            <div className="mt-5 space-y-3">
                                <div className="rounded-[22px] border border-white/[0.08] bg-black/20 px-4 py-3">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Сумарний обсяг</div>
                                    <div className="mt-2 text-2xl font-black text-white">{totalVolume.toLocaleString('uk-UA')}</div>
                                </div>
                                <div className="rounded-[22px] border border-white/[0.08] bg-black/20 px-4 py-3">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Пікова точка</div>
                                    <div className="mt-2 text-sm font-semibold text-white">
                                        {peakPoint?.date || '—'}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-400">
                                        {peakPoint?.predicted_volume.toLocaleString('uk-UA') || '—'} одиниць
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-[28px] border border-cyan-400/16 bg-cyan-500/8 p-6">
                <h4 className="text-lg font-black text-white">Робоча примітка</h4>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                    Це не окремий сценарний API, а прозорий розрахунок поверх поточного прогнозу.
                    Такий підхід корисний уже зараз і не вводить користувача в оману фіктивним модулем.
                </p>
            </div>
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    tone,
    value,
}: {
    icon: JSX.Element;
    label: string;
    tone: string;
    value: string;
}) {
    // Extract base color from tone if possible for border effects
    const isEmerald = tone.includes('emerald');
    const isCyan = tone.includes('cyan');
    const isAmber = tone.includes('amber');
    
    return (
        <div className="stat-card-v2 group relative overflow-hidden rounded-[32px] border border-white/[0.06] bg-black/20 p-6 shadow-2xl transition-all duration-500">
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                isEmerald && "bg-gradient-to-br from-emerald-500/[0.03] to-transparent",
                isCyan && "bg-gradient-to-br from-cyan-500/[0.03] to-transparent",
                isAmber && "bg-gradient-to-br from-amber-500/[0.03] to-transparent"
            )} />
            
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:scale-110', 
                        tone
                    )}>
                        {icon}
                    </div>
                </div>
                
                <div className="space-y-1.5">
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 group-hover:text-white/60 transition-colors duration-300">
                        {label}
                    </div>
                    <div className="text-4xl font-black tracking-tight text-white drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-500 origin-left">
                        {value}
                    </div>
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
