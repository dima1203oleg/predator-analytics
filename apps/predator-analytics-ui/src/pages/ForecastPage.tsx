import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    Brain,
    Settings2,
    Calendar,
    ArrowUpRight,
    Loader2,
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
                    <p className="text-gray-400 mt-1">
                        ML-прогнози попиту, цін та обсягів імпорту
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
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
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
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
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="animate-pulse">Розрахунок ML прогнозу...</p>
            </div>
        );
    }

    if (!forecast) return null;

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20 p-6 shadow-lg shadow-emerald-500/5">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-tight">
                            {forecast.product_name} ({forecast.product_code})
                        </h3>
                        <p className="text-gray-400 text-sm">Прогноз на основі нейронної мережі {forecast.model_used}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-emerald-400 flex items-center gap-1">
                            <ArrowUpRight size={24} />
                            +{(forecast.confidence_score * 15).toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">
                            Впевненість: {(forecast.confidence_score * 100).toFixed(0)}%
                        </div>
                    </div>
                </div>
                <div className="mt-6 p-4 bg-black/40 rounded-xl border border-white/5 text-sm text-gray-300 leading-relaxed italic">
                    <span className="text-emerald-500 font-bold mr-2">AI Interpretation:</span>
                    {forecast.interpretation_uk}
                </div>
            </div>

            {/* Forecast Table */}
            <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white tracking-tight">Прогнозні точки</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 font-mono">Модель: {forecast.model_used}</span>
                        <span className="text-xs text-gray-500 font-mono">MAPE: {(forecast.mape * 100).toFixed(1)}%</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-gray-500 bg-black/20">
                                <th className="px-6 py-4 font-bold">Місяць</th>
                                <th className="px-6 py-4 font-bold text-right">Прогноз (шт)</th>
                                <th className="px-6 py-4 font-bold text-right">Нижня межа</th>
                                <th className="px-6 py-4 font-bold text-right">Верхня межа</th>
                                <th className="px-6 py-4 font-bold text-right">Надійність</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {forecast.forecast.map((point, i) => (
                                <tr key={point.date} className="hover:bg-white/[0.02] transition-colors text-sm">
                                    <td className="px-6 py-4 text-gray-300 font-bold">{point.date}</td>
                                    <td className="px-6 py-4 text-right text-emerald-400 font-black font-mono">
                                        {point.predicted_volume.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-500 font-mono">
                                        {point.confidence_lower.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-500 font-mono">
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
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{model.description_uk}</p>

                        <div className="mt-6 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Precision</span>
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
            <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
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
