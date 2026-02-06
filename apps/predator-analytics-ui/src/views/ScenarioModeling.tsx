
/**
 * 🔮 Scenario Modeling & What-If Analysis
 *
 * Преміальний інструмент для бізнес-планування та прогнозування.
 * Дозволяє моделювати вплив зовнішніх та внутрішніх факторів на ринок.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, RefreshCw, Save,
    Play, Info, AlertTriangle, Shield, Zap,
    DollarSign, Globe, PieChart, BarChart3,
    ArrowRight, Settings2, Sparkles, Target, Layers
} from 'lucide-react';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { TacticalCard } from '../components/TacticalCard';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../store/useAppStore';

const ScenarioModeling: React.FC = () => {
    const { persona } = useAppStore();
    const [isSimulating, setIsSimulating] = useState(false);

    // Simulation Parameters
    const [params, setParams] = useState({
        importDuty: 10,
        currencyRate: 41.5,
        globalDemand: 100,
        competitorActivity: 50,
        marketRegulation: 30
    });

    const handleParamChange = (name: keyof typeof params, val: number) => {
        setParams(prev => ({ ...prev, [name]: val }));
    };

    const runSimulation = () => {
        setIsSimulating(true);
        setTimeout(() => setIsSimulating(false), 2500);
    };

    const getChartOption = () => {
        // Dynamic data based on params
        const baseData = [120, 132, 101, 134, 90, 230, 210];
        const multiplier = (params.globalDemand / 100) * (1 - params.importDuty / 100) * (40 / params.currencyRate);
        const simData = baseData.map(v => Math.round(v * multiplier));

        return {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#0f172a', borderColor: '#1e293b', textStyle: { color: '#fff' } },
            legend: { textStyle: { color: '#64748b' }, data: ['Факт', 'Прогноз'], top: 10 },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: ['Кв1', 'Кв2', 'Кв3', 'Кв4', 'Прог1', 'Прог2', 'Прог3'],
                axisLine: { lineStyle: { color: '#334155' } }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            series: [
                {
                    name: 'Факт',
                    type: 'line',
                    smooth: true,
                    lineStyle: { width: 3, color: '#64748b' },
                    data: baseData
                },
                {
                    name: 'Прогноз',
                    type: 'line',
                    smooth: true,
                    lineStyle: { width: 4, type: 'dashed', color: '#10b981' },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [{ offset: 0, color: '#10b98130' }, { offset: 1, color: '#10b98100' }]
                        }
                    },
                    data: simData
                }
            ]
        };
    };

    return (
        <div className="min-h-screen bg-transparent relative overflow-hidden pb-20">
            <AdvancedBackground />

            <div className="max-w-7xl mx-auto px-6 pt-10 relative z-10">

                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                                <Sparkles className="text-white" size={20} />
                            </div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">PRO Predictive Analytics</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            What-If_<span className="text-indigo-400">Modeling</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 max-w-lg">
                            Аналізуйте вплив макроекономічних факторів на ваші торгові потоки за допомогою нейронних симуляцій PREDATOR.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all flex items-center gap-2">
                            <Save size={18} /> Зберегти сценарій
                        </button>
                        <button
                            onClick={runSimulation}
                            disabled={isSimulating}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/30 transition-all flex items-center gap-2"
                        >
                            {isSimulating ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
                            Запустити симуляцію
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Simulation Parameters Sidebar */}
                    <div className="space-y-6">
                        <TacticalCard title="Параметри Сценарію" subtitle="Встановіть фактори впливу" variant="glass">
                            <div className="p-6 space-y-8">

                                <SimSlider
                                    label="Мило на імпорт (%)"
                                    value={params.importDuty}
                                    min={0} max={50}
                                    onChange={(v) => handleParamChange('importDuty', v)}
                                    color="indigo"
                                />

                                <SimSlider
                                    label="Курс USD/UAH"
                                    value={params.currencyRate}
                                    min={35} max={55}
                                    step={0.5}
                                    onChange={(v) => handleParamChange('currencyRate', v)}
                                    color="emerald"
                                />

                                <SimSlider
                                    label="Глобальний попит (%)"
                                    value={params.globalDemand}
                                    min={50} max={150}
                                    onChange={(v) => handleParamChange('globalDemand', v)}
                                    color="blue"
                                />

                                <SimSlider
                                    label="Активність конкурентів"
                                    value={params.competitorActivity}
                                    min={0} max={100}
                                    onChange={(v) => handleParamChange('competitorActivity', v)}
                                    color="rose"
                                />

                                <div className="pt-4 border-t border-white/5 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Обрана Модель ШІ</h4>
                                    <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-white/5 shadow-inner">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">NeuralPredict-v5</p>
                                            <p className="text-[10px] text-slate-500 font-mono italic">Confidence: 94.2%</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </TacticalCard>

                        {/* Quick Insights Result */}
                        <div className="p-6 bg-slate-900/60 border border-white/5 rounded-3xl backdrop-blur-xl">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Zap size={14} className="text-amber-400" /> Миттєвий Вердикт ШІ
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                        <TrendingUp size={16} />
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        При поточному курсі валют та зниженні мит на 2%, маржинальність зросте на <span className="text-emerald-400 font-bold">14.5%</span>.
                                    </p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Зростання активності конкурентів може нівелювати перевагу протягом <span className="text-rose-400 font-bold">45 днів</span>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Simulation View */}
                    <div className="lg:col-span-2 space-y-6">
                        <TacticalCard title="Симуляція Результатів" subtitle="Прогнозована динаміка прибутку та обсягів" variant="holographic">
                            <div className="p-6 h-[450px]">
                                <ReactECharts option={getChartOption()} style={{ height: '100%', width: '100%' }} />
                            </div>

                            <div className="px-6 pb-6 grid grid-cols-3 gap-4">
                                <ResultMetric label="Дохід" value="+18.2%" trend="up" />
                                <ResultMetric label="Ризики" value="-5.4%" trend="down" />
                                <ResultMetric label="ROI" value="x2.4" trend="up" />
                            </div>
                        </TacticalCard>

                        {/* Evidence Feed */}
                        <div className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl">
                             <div className="flex items-center justify-between mb-6">
                                 <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                     <Target size={14} className="text-indigo-400" /> Обґрунтування Прогнозу
                                 </h3>
                                 <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded uppercase font-bold">Based on 1.2M Records</span>
                             </div>

                             <div className="space-y-3">
                                 {[
                                     { id: 'AN-01', title: 'Історична кореляція', desc: 'Схожа ситуація спостерігалась у 2024 році (R=0.88).', importance: 'HIGH' },
                                     { id: 'AN-02', title: 'Аналіз еластичності', desc: 'Попит на товари даної групи має низьку цінову еластичність.', importance: 'MED' },
                                     { id: 'AN-03', title: 'Зовнішні джерела', desc: 'Прогнози Bloomberg та IMF підтверджують тренд.', importance: 'LOW' }
                                 ].map(item => (
                                     <div key={item.id} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/[0.08] transition-all">
                                         <div className="text-[10px] font-mono text-indigo-400 font-bold pt-0.5">{item.id}</div>
                                         <div className="flex-1">
                                             <div className="flex justify-between items-center mb-1">
                                                 <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{item.title}</span>
                                                 <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                                     item.importance === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                                                     item.importance === 'MED' ? 'bg-amber-500/20 text-amber-400' :
                                                     'bg-slate-700 text-slate-400'
                                                 }`}>{item.importance}</span>
                                             </div>
                                             <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- SUBCOMPONENTS ---

const SimSlider: React.FC<{
    label: string,
    value: number,
    min: number,
    max: number,
    step?: number,
    color: string,
    onChange: (v: number) => void
}> = ({ label, value, min, max, step = 1, color, onChange }) => (
    <div className="space-y-4">
        <div className="flex justify-between items-end">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
            <span className={`font-mono text-sm font-black text-${color}-400`}>{value}</span>
        </div>
        <div className="relative group">
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                title={label}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-${color}-500 group-hover:accent-${color}-400 transition-all`}
            />
            <div className="absolute -bottom-4 left-0 w-full flex justify-between px-0.5 pointer-events-none">
                <span className="text-[8px] text-slate-600 font-mono">{min}</span>
                <span className="text-[8px] text-slate-600 font-mono">{max}</span>
            </div>
        </div>
    </div>
);

const ResultMetric: React.FC<{ label: string, value: string, trend: 'up'|'down' }> = ({ label, value, trend }) => (
    <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl flex flex-col items-center">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <div className="flex items-center gap-2">
            <span className={`text-lg font-black ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>{value}</span>
            {trend === 'up' ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
        </div>
    </div>
);

export default ScenarioModeling;
