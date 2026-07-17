import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    Brain,
    Target,
    Calendar,
    AlertCircle,
    ChevronRight,
    Zap,
    BarChart3,
    LineChart as LineChartIcon,
    RefreshCw,
    Search,
    Box,
    Cpu,
    Settings
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { forecastApi } from '@/features/forecast';
import { ForecastResponse, ForecastPoint } from '@/features/forecast/types';
import { HoloCard } from '@/components/ui/HoloCard';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberOrb } from '@/components/CyberOrb';
import { ViewHeader } from '@/components/ViewHeader';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/utils/cn';
import { Activity, Server } from 'lucide-react';

const ForecastView: React.FC = () => {
    const { isOffline, nodeSource } = useBackendStatus();
    const [productCode, setProductCode] = useState('8517130000');
    const [forecast, setForecast] = useState<ForecastResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [monthsAhead, setMonthsAhead] = useState(6);

    // Нав'язливі toast-повідомлення видалено (HR-04 compliant)

    const fetchForecast = async () => {
        try {
            setLoading(true);
            const res = await forecastApi.getDemandForecast({
                product_code: productCode,
                months_ahead: monthsAhead,
                model: 'prophet_v4'
            });
            setForecast(res);
        } catch (err) {
            console.error("Помилка прогнозування", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, []);

    const chartData = useMemo(() => {
        if (!forecast || !forecast.forecast) return [];
        return forecast.forecast.map(p => ({
            name: p.date,
            value: p.predicted_volume,
            lower: p.confidence_lower,
            upper: p.confidence_upper
        }));
    }, [forecast]);

    return (
        <div className="min-h-screen bg-slate-950 p-10 relative overflow-hidden">
            {/* Background FX */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] " />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px] " />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto">
                {/* Header */}
                <ViewHeader
                    title="ML Прогнозування Попиту"
                    icon={<Brain className="text-purple-400" size={20} />}
                    breadcrumbs={['ШІ', 'ПРОГНОЗУВАННЯ', productCode]}
                    stats={[
                        { label: 'SOURCE', value: nodeSource, icon: <Server size={14} />, color: isOffline ? 'warning' : 'gold' },
                        { label: 'МОДЕЛЬ', value: forecast?.model_used || 'prophet_v4', icon: <Cpu size={14} />, color: 'primary' },
                        { label: 'ТОЧНІСТЬ', value: `${(forecast?.confidence_score || 0 * 100).toFixed(1)}%`, icon: <Target size={14} />, color: 'success' },
                    ]}
                    actions={[
                        <div key="search" className="flex items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={productCode}
                                    onChange={(e) => setProductCode(e.target.value)}
                                    className="bg-slate-950/60 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white text-sm focus:outline-none focus:border-purple-500/50 w-64 transition-all"
                                    placeholder="Код УКТЗЕД..."
                                />
                            </div>
                            <Button variant="cyber"
                                onClick={fetchForecast}
                                disabled={loading}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 disabled:opacity-50 shadow-2xl"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                                АНАЛІЗ
                            </Button>
                        </div>
                    ]}
                />

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* Main Chart Section */}
                    <div className="xl:col-span-8 space-y-8">
                        <HoloContainer className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Траєкторія Попиту</h2>
                                    <p className="text-xs text-slate-500 mt-1">Прогноз на {monthsAhead} місяців вперед (Протокол: {forecast?.model_used || '...'})</p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                    <Target size={16} className="text-purple-400" />
                                    <span className="text-xs font-bold text-purple-300">Точність ML: {(forecast?.confidence_score || 0 * 100).toFixed(1)}%</span>
                                </div>
                            </div>

                            <div className="h-[450px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#475569"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#475569"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => `${val}т`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                            itemStyle={{ color: '#a855f7' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#a855f7"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                        />
                                        {/* Confidence Intervals */}
                                        <Line type="monotone" dataKey="upper" stroke="#a855f740" strokeDasharray="5 5" dot={false} />
                                        <Line type="monotone" dataKey="lower" stroke="#a855f740" strokeDasharray="5 5" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </HoloContainer>

                        {/* Bottom Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <HoloCard className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Box size={18} className="text-purple-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Оцінка ринку</h4>
                                </div>
                                <div className="text-2xl font-black text-white">{(forecast?.mape || 0).toFixed(2)}%</div>
                                <div className="text-[10px] text-slate-500 mt-1">MAPE</div>
                            </HoloCard>
                            <HoloCard className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Cpu size={18} className="text-yellow-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Дані для навчання</h4>
                                </div>
                                <div className="text-2xl font-black text-white">{forecast?.data_points_used || 0}</div>
                                <div className="text-[10px] text-slate-500 mt-1">Точок</div>
                            </HoloCard>
                            <HoloCard className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <RefreshCw size={18} className="text-emerald-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Статус Моделі</h4>
                                </div>
                                <div className="text-2xl font-black text-white">Dynamic</div>
                                <div className="text-[10px] text-slate-500 mt-1">Health</div>
                            </HoloCard>
                        </div>
                    </div>

                    {/* AI Insights & Controls */}
                    <div className="xl:col-span-4 space-y-8">
                        <HoloCard className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <CyberOrb size="sm" status="active" />
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">AI Інтерпретація</h4>
                            </div>
                            <div className="space-y-6">
                                <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                                    <p className="text-sm leading-relaxed text-slate-300 italic">
                                        {forecast?.interpretation_uk || "Очікування розрахунку AI..."}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp size={16} className="text-purple-400" />
                                        Важливість факторів
                                    </h3>
                                    {forecast?.feature_importance && Object.entries(forecast.feature_importance).map(([key, val]) => (
                                        <div key={key} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500">
                                                <span>{key}</span>
                                                <span>{(val * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${val * 100}%` }}
                                                    className="h-full bg-purple-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button variant="cyber" className="w-full py-4 bg-slate-800/50 hover:bg-slate-700 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all">
                                    Сформувати повний звіт
                                </Button>
                            </div>
                        </HoloCard>

                        <HoloCard className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Settings size={18} className="text-[#c9a227]" />
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">Параметри Симуляції</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Горизонт прогнозу</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[3, 6, 12].map(m => (
                                            <Button variant="cyber"
                                                key={m}
                                                onClick={() => setMonthsAhead(m)}
                                                className={cn(
                                                    "py-2 rounded-xl border text-[10px] font-bold transition-all",
                                                    monthsAhead === m ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-slate-900/40 border-white/5 text-slate-500"
                                                )}
                                            >
                                                {m} МІС.
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="text-cyan-500 shrink-0" size={16} />
                                    <p className="text-[10px] text-rose-200/70 leading-relaxed">
                                        УВАГА: результати базуються на імовірнісних моделях. Висока волатильність митних даних може впливати на точність.
                                    </p>
                                </div>
                            </div>
                        </HoloCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForecastView;
