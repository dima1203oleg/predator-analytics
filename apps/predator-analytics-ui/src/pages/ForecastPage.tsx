import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
    BadgeCheck,
    Brain,
    Loader2,
    RefreshCw,
    Settings2,
    Target,
    TrendingUp,
    ArrowRight,
    Sparkles,
    Zap,
} from 'lucide-react';

type ForecastTab = 'demand' | 'models' | 'scenarios';

type ForecastFactor = {
    sourceKey: string;
    label: string;
    weight: number;
    note: string;
};

const tabs: Array<{ key: ForecastTab; label: string; icon: JSX.Element }> = [
  { key: 'demand', label: 'Прогноз попиту', icon: <TrendingUp size={18} /> },
    { key: 'models', label: 'Моделі прогнозування', icon: <Brain size={18} /> },
    { key: 'scenarios', label: 'Сценарії', icon: <Settings2 size={18} /> },
];

const defaultRequest: ForecastDemandRequest = {
    product_code: '84713000',
    months_ahead: 6,
    model: 'prophet',
};

const featureLabelMap: Record<string, string> = {
    seasonality: 'Сезонність',
    trend: 'Тренд',
    price: 'Ціна',
    volume: 'Обсяг',
    orders: 'Замовлення',
    imports: 'Імпорт',
    exports: 'Експорт',
    exchange_rate: 'Курс валют',
    lead_time: 'Час постачання',
    month: 'Місяць',
    quarter: 'Квартал',
    demand: 'Попит',
    stock: 'Запаси',
};

const formatFeatureLabel = (key: string): string => featureLabelMap[key.toLowerCase()] ?? 'Фактор моделі';

const forecastModelLabelMap: Record<string, string> = {
    prophet: 'Метод Prophet',
    arima: 'Метод ARIMA',
    lstm: 'Нейромережа LSTM',
};

const formatForecastModelLabel = (model?: string): string =>
    model ? forecastModelLabelMap[model.toLowerCase()] ?? 'Модель прогнозування' : 'Модель прогнозування';

const buildForecastFactors = (forecast: ForecastResponse | null): ForecastFactor[] => {
    const entries = Object.entries(forecast?.feature_importance ?? {});

    if (entries.length === 0) {
        return [];
    }

    const sorted = entries
        .map(([key, value]) => ({
            sourceKey: key,
            label: formatFeatureLabel(key),
            rawValue: Math.abs(value),
        }))
        .sort((left, right) => right.rawValue - left.rawValue)
        .slice(0, 3);

    const maxValue = sorted[0]?.rawValue ?? 0;

    return sorted.map((item, index) => ({
        sourceKey: item.sourceKey,
        label: item.label,
        weight: maxValue > 0 ? Math.round((item.rawValue / maxValue) * 100) : 0,
        note: index === 0 ? 'Найсильніший сигнал' : 'У трійці драйверів',
    }));
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
    const forecastFactors = useMemo(() => buildForecastFactors(forecast), [forecast]);

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
            <section className="relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(3,12,21,0.98),rgba(10,18,31,0.95))] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)] sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_28%)]" />
                <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] xl:items-stretch">
                    <div className="max-w-3xl">
                        <div className="mb-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200">
                                ШІ-аналітика
                            </span>
                            <span
                                className={cn(
                                    'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]',
                                    backendStatus.isOffline
                                        ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                                        : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
                                )}
                            >
                                {backendStatus.statusLabel}
                            </span>
                            <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">
                                {forecast?.product_name ?? 'Керування попитом'}
                            </span>
                        </div>
                        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                            <TrendingUp className="text-emerald-300" size={30} />
                            Прогнозування
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                            Керуйте товарним кодом, горизонтом і сценаріями, а блок пояснюваності показує, які
                            фактори штовхають прогноз угору або вниз.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveTab('scenarios')}
                                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition-all hover:bg-emerald-500/16"
                            >
                                <Sparkles size={16} />
                                Показати сценарії
                            </button>
                            <Link
                                to="/procurement-optimizer"
                                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition-all hover:bg-cyan-500/16"
                            >
                                <BadgeCheck size={16} />
                                До закупівель
                            </Link>
                            <Link
                                to="/scenario-progress"
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.08]"
                            >
                                <ArrowRight size={16} />
                                Центр виконання
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.24)]">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                        Поточний прогноз
                                    </div>
                                    <div className="mt-1 text-lg font-black text-white">
                                        {forecast?.product_name ?? 'Очікуємо перший розрахунок'}
                                    </div>
                                </div>
                                <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                                    {backendStatus.sourceLabel}
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {[
                                    {
                                        label: 'Довіра',
                                        value: forecast ? `${Math.round(forecast.confidence_score * 100)}%` : '—',
                                    },
                                    {
                                        label: 'Похибка',
                                        value: forecast ? `${(forecast.mape * 100).toFixed(1)}%` : '—',
                                    },
                                    {
                                        label: 'Точок даних',
                                        value: forecast ? forecast.data_points_used.toLocaleString('uk-UA') : '—',
                                    },
                                    {
                                        label: 'Горизонт',
                                        value: `${request.months_ahead} міс.`,
                                    },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-[22px] border border-white/[0.08] bg-black/20 px-4 py-3">
                                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                            {item.label}
                                        </div>
                                        <div className="mt-2 text-xl font-black text-white">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.22)]">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                <Target className="h-3.5 w-3.5 text-cyan-200" />
                                Пояснюваність моделі
                            </div>
                            <div className="mt-4 space-y-3">
                                {forecastFactors.length > 0 ? (
                                    forecastFactors.map((factor) => (
                                        <div key={factor.sourceKey} className="rounded-[22px] border border-white/[0.08] bg-black/20 p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-sm font-semibold text-white">{factor.label}</div>
                                                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                    {factor.note}
                                                </div>
                                            </div>
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                                                <div className="h-full rounded-full bg-cyan-300" style={{ width: `${factor.weight}%` }} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-[22px] border border-white/[0.08] bg-black/20 px-4 py-3 text-sm leading-6 text-slate-300">
                                        Пояснюваність з’явиться після отримання даних для прогнозу.
                                    </div>
                                )}
                            </div>
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
                            <option value="prophet">Метод Prophet</option>
                            <option value="arima">Метод ARIMA</option>
                            <option value="lstm">Нейромережа LSTM</option>
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
                            forecastFactors={forecastFactors}
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
        </div>
    );
}

function DemandForecastTab({
    chartOption,
    forecast,
    growth,
    forecastFactors,
    loading,
    error,
}: {
    chartOption: Record<string, unknown> | null;
    forecast: ForecastResponse | null;
    growth: number;
    forecastFactors: ForecastFactor[];
    loading: boolean;
    error: string | null;
}) {
    if (loading) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <p className="animate-pulse">Розрахунок прогнозу...</p>
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
                            {formatForecastModelLabel(forecast.model_used)}
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
                        <h4 className="text-lg font-black text-white">ШІ-інтерпретація</h4>
                        <p className="mt-2 text-sm leading-7 text-slate-300">{forecast.interpretation_uk}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                    Топ фактори прогнозу
                </div>
                {forecastFactors.length > 0 ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {forecastFactors.map((factor) => (
                            <div key={factor.sourceKey} className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
                                <div className="text-sm font-semibold text-white">{factor.label}</div>
                                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                    {factor.note}
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                                    <div className="h-full rounded-full bg-cyan-300" style={{ width: `${factor.weight}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                        Фактори моделі з’являться після того, як бекенд поверне деталізацію важливості ознак.
                    </p>
                )}
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
    return (
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border', tone)}>
                {icon}
            </div>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-white">{value}</div>
        </div>
    );
}
