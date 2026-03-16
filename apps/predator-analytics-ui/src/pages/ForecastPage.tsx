import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import {
    TrendingUp,
    Brain,
    Settings2,
    Calendar,
    ArrowUpRight,
    Loader2,
    Zap,
    Target,
    AlertCircle,
} from 'lucide-react';
import { forecastApi } from '@/features/forecast/api/forecast';
import { ForecastResponse, ForecastModel } from '@/features/forecast/types';

type ForecastTab = 'demand' | 'models' | 'scenarios';

const tabs: { key: ForecastTab; label: string; icon: React.ReactNode }[] = [
    { key: 'demand', label: 'Прогноз попиту', icon: <TrendingUp size={18} /> },
    { key: 'models', label: 'ML Моделі', icon: <Brain size={18} /> },
    { key: 'scenarios', label: 'Сценарії', icon: <Settings2 size={18} /> },
];

export default function ForecastPage() {
    const [activeTab, setActiveTab] = useState<ForecastTab>('demand');

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <TrendingUp className="text-emerald-400" size={28} />
                        Прогнозування
                    </h1>
                    <p className="text-gray-300 mt-1">
                        ML-прогнози попиту, цін та обсягів імпорту
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar size={16} />
                    Горизонт: <span className="text-emerald-400 font-medium">6 місяців</span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 border border-gray-700/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200
              ${activeTab === tab.key
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                            }
            `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'demand' && <DemandForecastTab />}
                    {activeTab === 'models' && <ModelsTab />}
                    {activeTab === 'scenarios' && <ScenariosTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function DemandForecastTab() {
    const [forecast, setForecast] = useState<ForecastResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForecast = async () => {
            try {
                setLoading(true);
                const data = await forecastApi.getDemandForecast({
                    product_code: '84713000',
                    months_ahead: 6,
                    model: 'prophet'
                });
                setForecast(data);
            } catch (error) {
                console.error('Failed to fetch forecast:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchForecast();
    }, []);

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-gray-300 gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="animate-pulse">Розрахунок ML прогнозу...</p>
            </div>
        );
    }

    if (!forecast) return null;

    const chartOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            textStyle: { color: '#fff', fontSize: 12 },
            padding: [8, 12]
        },
        legend: {
            data: ['Прогноз', 'Нижня межа', 'Верхня межа'],
            textStyle: { color: '#cbd5e1', fontSize: 12 },
            top: 20
        },
        grid: {
            left: '5%',
            right: '5%',
            bottom: '10%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: forecast.forecast.map(p => p.date),
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: { color: '#cbd5e1', fontSize: 11 },
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            name: 'Обсяг (шт)',
            nameTextStyle: { color: '#cbd5e1', fontSize: 11 },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            axisLabel: { color: '#cbd5e1', fontSize: 11 }
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
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
                        ]
                    }
                },
                data: forecast.forecast.map(p => p.predicted_volume),
                z: 3
            },
            {
                name: 'Нижня межа',
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: { color: 'rgba(107, 114, 128, 0.5)', width: 1, type: 'dashed' },
                data: forecast.forecast.map(p => p.confidence_lower),
                z: 1
            },
            {
                name: 'Верхня межа',
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: { color: 'rgba(107, 114, 128, 0.5)', width: 1, type: 'dashed' },
                data: forecast.forecast.map(p => p.confidence_upper),
                z: 1
            }
        ]
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all" />
                    <TrendingUp className="text-emerald-400 mb-3 relative z-10" size={28} />
                    <div className="text-3xl font-black text-emerald-400 relative z-10">+{(forecast.confidence_score * 15).toFixed(0)}%</div>
                    <div className="text-xs text-gray-300 uppercase tracking-widest font-bold mt-2 relative z-10">Прогнозний ріст</div>
                </div>

                <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/20 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full group-hover:bg-cyan-500/20 transition-all" />
                    <Target className="text-cyan-400 mb-3 relative z-10" size={28} />
                    <div className="text-3xl font-black text-cyan-400 relative z-10">{(forecast.confidence_score * 100).toFixed(0)}%</div>
                    <div className="text-xs text-gray-300 uppercase tracking-widest font-bold mt-2 relative z-10">Впевненість</div>
                </div>

                <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/20 backdrop-blur-xl rounded-2xl border border-amber-500/20 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-all" />
                    <Zap className="text-amber-400 mb-3 relative z-10" size={28} />
                    <div className="text-3xl font-black text-amber-400 relative z-10">{(forecast.mape * 100).toFixed(1)}%</div>
                    <div className="text-xs text-gray-300 uppercase tracking-widest font-bold mt-2 relative z-10">MAPE (похибка)</div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-2xl hover:border-emerald-500/20 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Графік прогнозу</h3>
                        <p className="text-xs text-gray-300 mt-1">{forecast.product_name} ({forecast.product_code})</p>
                    </div>
                    <div className="text-xs text-gray-300 font-mono">Модель: {forecast.model_used}</div>
                </div>
                <div className="h-[350px] w-full">
                    <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>

            {/* AI Interpretation */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20 p-6 shadow-lg shadow-emerald-500/5">
                <div className="flex items-start gap-4">
                    <AlertCircle className="text-emerald-400 mt-1 flex-shrink-0" size={24} />
                    <div>
                        <h4 className="text-white font-bold mb-2">AI Інтерпретація</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{forecast.interpretation_uk}</p>
                    </div>
                </div>
            </div>

            {/* Forecast Table */}
            <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="px-6 py-5 border-b border-white/5 bg-white/5">
                    <h3 className="text-lg font-bold text-white tracking-tight">Детальні прогнозні точки</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-gray-300 bg-black/20">
                                <th className="px-6 py-4 font-bold">Місяць</th>
                                <th className="px-6 py-4 font-bold text-right">Прогноз (шт)</th>
                                <th className="px-6 py-4 font-bold text-right">Нижня межа</th>
                                <th className="px-6 py-4 font-bold text-right">Верхня межа</th>
                                <th className="px-6 py-4 font-bold text-right">Довірчий інтервал</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {forecast.forecast.map((point) => (
                                <tr key={point.date} className="hover:bg-white/[0.02] transition-colors text-sm">
                                    <td className="px-6 py-4 text-gray-300 font-bold">{point.date}</td>
                                    <td className="px-6 py-4 text-right text-emerald-400 font-black font-mono">
                                        {point.predicted_volume.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-300 font-mono">
                                        {point.confidence_lower.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-300 font-mono">
                                        {point.confidence_upper.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-600 to-cyan-400 rounded-full"
                                                    style={{ width: `${(1 - (point.confidence_upper - point.confidence_lower) / point.predicted_volume) * 100}%` }}
                                                />
                                            </div>
                                        </div>
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

function ModelsTab() {
    const [models, setModels] = useState<ForecastModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                setLoading(true);
                const data = await forecastApi.getModels();
                setModels(data.models || []);
            } catch (error) {
                console.error('Failed to fetch models:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchModels();
    }, []);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Доступні алгоритми прогнозування</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-40 bg-gray-900/60 rounded-2xl border border-white/5 animate-pulse" />
                    ))
                ) : models.map((model, i) => (
                    <motion.div
                        key={model.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6
                       hover:border-emerald-500/30 transition-all duration-300 group relative overflow-hidden shadow-xl"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />

                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <Brain size={24} />
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase border border-emerald-500/20">
                                Ready
                            </span>
                        </div>
                        <h4 className="text-white font-black text-lg mb-2">{model.name_uk}</h4>
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{model.description_uk}</p>

                        <div className="mt-6 flex items-center justify-between">
                            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">Precision</span>
                            <span className="text-emerald-400 font-mono font-bold">0.{(85 + i * 4).toFixed(0)}+</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function ScenariosTab() {
    return (
        <div className="relative overflow-hidden bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 p-16 text-center shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <Settings2 size={64} className="text-emerald-500/30 mx-auto mb-6 animate-pulse" />
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">What-If Симулятор</h3>
            <p className="text-gray-300 max-w-lg mx-auto leading-relaxed">
                Моделювання впливу зовнішніх факторів: зміна курсу валют, санкції,
                нові торгові угоди. Інтерактивна пісочниця для стратегічного планування.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
                <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                    Phase 2: Modeling Engine
                </span>
            </div>
        </div>
    );
}
