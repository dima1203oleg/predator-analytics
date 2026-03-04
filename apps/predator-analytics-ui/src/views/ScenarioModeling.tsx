/**
 * 🔮 PREDATOR ANALYTICS v55 — Scenario Modeling (What-If Analysis)
 * ===============================================================
 * Ультрапреміальний інструмент бізнес-прогнозування з 3D HUD та голографічними графіками
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, RefreshCw, Save,
    Play, Activity, Shield, Zap, Target, Layers,
    Globe, Crosshair, BarChart3, ArrowUpRight, Flame
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { cn } from '../utils/cn';
import { useAppStore } from '../store/useAppStore';

// --- CONFIG ---

const SLIDER_CONFIG = [
    { id: 'importDuty', label: 'Мито на імпорт', min: 0, max: 40, step: 0.5, suffix: '%', color: '#8b5cf6', icon: Shield },
    { id: 'currencyRate', label: 'Курс USD/UAH', min: 38, max: 48, step: 0.1, suffix: ' ₴', color: '#10b981', icon: DollarSign2 },
    { id: 'globalDemand', label: 'Глобальний Попит', min: 60, max: 140, step: 1, suffix: '%', color: '#06b6d4', icon: Globe },
    { id: 'competitorActivity', label: 'Активність Конкурентів', min: 0, max: 100, step: 5, suffix: ' індекс', color: '#ef4444', icon: Flame },
];

function DollarSign2(props: any) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}

// --- MAIN COMPONENT ---

const ScenarioModeling: React.FC = () => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [params, setParams] = useState<Record<string, number>>({
        importDuty: 10,
        currencyRate: 41.5,
        globalDemand: 100,
        competitorActivity: 50,
    });
    const [scanProgress, setScanProgress] = useState(0);

    const handleParamChange = (name: string, val: number) => {
        setParams(prev => ({ ...prev, [name]: val }));
    };

    const runSimulation = () => {
        setIsSimulating(true);
        setScanProgress(0);
        const interval = setInterval(() => {
            setScanProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setIsSimulating(false), 200);
                    return 100;
                }
                return p + 2.5;
            });
        }, 40);
    };

    const getChartOption = () => {
        const baseData = [120, 132, 121, 134, 150, 140, 160, 155, 170, 165, 180, 190];
        const xAxis = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Complex mock calculation
        const multiplier =
            (params.globalDemand / 100) *
            (1 - (params.importDuty / 100) * 0.4) *
            (40 / params.currencyRate) *
            (1 - (params.competitorActivity / 100) * 0.2);

        const simData = baseData.map((v, i) => i > 5 ? Math.round(v * multiplier) + Math.sin(i) * 10 : v);

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                borderColor: 'rgba(139, 92, 246, 0.3)',
                borderWidth: 1,
                textStyle: { color: '#fff', fontFamily: 'monospace' },
                axisPointer: { type: 'cross', label: { backgroundColor: '#8b5cf6' } }
            },
            legend: {
                data: ['Історичний Факт', 'ШІ Прогноз (V55)'],
                textStyle: { color: '#64748b', fontFamily: 'Inter', fontWeight: 700 },
                top: 0
            },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xAxis,
                axisLabel: { color: '#64748b', fontFamily: 'monospace' },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.02)' } }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: '#64748b', fontFamily: 'monospace' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
            },
            series: [
                {
                    name: 'Історичний Факт',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { width: 3, color: '#475569' },
                    data: baseData.map((v, i) => i <= 5 ? v : null)
                },
                {
                    name: 'ШІ Прогноз (V55)',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    itemStyle: { color: '#8b5cf6', borderColor: '#000', borderWidth: 2 },
                    lineStyle: { width: 4, color: '#8b5cf6', shadowColor: 'rgba(139,92,246,0.5)', shadowBlur: 10 },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(139,92,246,0.3)' },
                                { offset: 1, color: 'rgba(139,92,246,0)' }
                            ]
                        }
                    },
                    data: simData.map((v, i) => i >= 5 ? v : null)
                }
            ]
        };
    };

    const marginChange = ((params.globalDemand / 100) * (40 / params.currencyRate) - 1) * 100 - (params.importDuty / 2);

    return (
        <div className="min-h-screen bg-slate-950 relative pb-24 overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(139,92,246,0.15),transparent_40%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(6,182,212,0.1),transparent_40%)] pointer-events-none" />
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />

            <div className="relative z-10 max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8 mt-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-white/5 pb-8 relative">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-black tracking-widest uppercase rounded">
                                SIMULATION CORE v55
                            </div>
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-black/40 border border-white/10 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase font-mono">NEURAL_NET: READY</span>
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase italic">
                            WHAT-IF <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">MODELING</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-3 uppercase tracking-widest max-w-2xl leading-relaxed">
                            Моделюйте вплив макроекономічних шоків, регуляторних змін та активності конкурентів на ваші фінансові та операційні показники за допомогою NAS предикторів.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button className="px-5 py-3 rounded-xl bg-slate-900 border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save Preset
                        </button>
                        <button
                            onClick={runSimulation}
                            disabled={isSimulating}
                            className={cn(
                                "relative group px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all overflow-hidden border",
                                isSimulating
                                    ? "bg-slate-800 border-violet-500/50 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                                    : "bg-emerald-600 hover:bg-emerald-500 border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105"
                            )}
                        >
                            {/* Embedded Progress Bar */}
                            {isSimulating && (
                                <div className="absolute inset-0 bg-violet-600/20" style={{ width: `${scanProgress}%` }} />
                            )}

                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {isSimulating ? <Activity className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                                {isSimulating ? `Calculating... ${Math.round(scanProgress)}%` : 'Run Simulation'}
                            </div>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Panel: Controls (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="p-6 md:p-8 rounded-[32px] bg-slate-900/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                    <SettingsIcon className="w-5 h-5 text-violet-400 animate-[spin_10s_linear_infinite]" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase tracking-widest">Параметри Сценарію</h3>
                                    <p className="text-[10px] uppercase text-slate-500 tracking-[0.2em] font-mono">Input Variables</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {SLIDER_CONFIG.map((cfg, idx) => (
                                    <div key={cfg.id} className="relative">
                                        <div className="flex justify-between items-end mb-3">
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest">
                                                <cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                                {cfg.label}
                                            </label>
                                            <div className="px-2 py-1 bg-black/50 border border-white/10 rounded text-sm font-black font-mono" style={{ color: cfg.color }}>
                                                {params[cfg.id]} {cfg.suffix}
                                            </div>
                                        </div>

                                        {/* V55 Custom Slider */}
                                        <div className="relative group/slider">
                                            <div className="absolute inset-y-0 left-0 w-full h-[6px] bg-slate-950 rounded-full border border-white/5 shadow-inner top-1/2 -translate-y-1/2" />
                                            <div
                                                className="absolute inset-y-0 left-0 h-[6px] rounded-full top-1/2 -translate-y-1/2 transition-all duration-75"
                                                style={{
                                                    width: `${((params[cfg.id] - cfg.min) / (cfg.max - cfg.min)) * 100}%`,
                                                    background: `linear-gradient(90deg, ${cfg.color}40, ${cfg.color})`,
                                                    boxShadow: `0 0 10px ${cfg.color}80`
                                                }}
                                            />
                                            <input
                                                type="range"
                                                min={cfg.min} max={cfg.max} step={cfg.step}
                                                value={params[cfg.id]}
                                                onChange={(e) => handleParamChange(cfg.id, parseFloat(e.target.value))}
                                                className="w-full absolute inset-y-0 top-1/2 -translate-y-1/2 opacity-0 cursor-ew-resize z-20"
                                            />
                                            <div
                                                className="w-4 h-4 rounded-full bg-white border-2 absolute top-1/2 -translate-y-1/2 z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-transform group-hover/slider:scale-125"
                                                style={{
                                                    borderColor: cfg.color,
                                                    left: `calc(${((params[cfg.id] - cfg.min) / (cfg.max - cfg.min)) * 100}% - 8px)`
                                                }}
                                            />
                                        </div>

                                        <div className="flex justify-between mt-2 text-[9px] font-mono text-slate-600">
                                            <span>{cfg.min}</span>
                                            <span>{cfg.max}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Applied Model Info */}
                            <div className="mt-8 pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden group/model">
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent translate-x-[-100%] group-hover/model:translate-x-[100%] transition-transform duration-1000" />
                                    <Brain className="text-violet-400 w-8 h-8 shrink-0 relative z-10" />
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active AI Model</p>
                                        <p className="text-sm font-black text-white font-mono flex items-center gap-2">
                                            N5.PREDICTIVE-CORE
                                            <span className="text-emerald-400 text-[9px] px-1.5 py-0.5 border border-emerald-500/20 bg-emerald-500/10 rounded">94.8% ACC</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Charts and KPIs (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* KPI Cards row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Forecasted Revenue', value: '$12.4M', diff: '+14.2%', up: true, color: '#10b981' },
                                { label: 'Margin Variance', value: `${marginChange > 0 ? '+' : ''}${marginChange.toFixed(1)}%`, diff: 'vs Base', up: marginChange >= 0, color: marginChange >= 0 ? '#10b981' : '#ef4444' },
                                { label: 'Scenario Risk Score', value: '42/100', diff: '-5.1 v.s. Avg', up: true, color: '#06b6d4' } // true because lower risk is better
                            ].map((kpi, i) => (
                                <div key={i} className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-xl relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{kpi.label}</p>
                                    <div className="text-3xl font-black text-white tracking-tighter mb-2">{kpi.value}</div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: kpi.color }}>
                                        {kpi.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                        {kpi.diff}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Main Graph */}
                        <div className="p-6 md:p-8 rounded-[32px] bg-slate-900/40 border border-white/5 backdrop-blur-xl relative">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-black text-white text-lg uppercase tracking-widest flex items-center gap-2">
                                        <BarChart3 className="text-violet-400" />
                                        Forecast Trajectory
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono mt-1 1">Time horizon: +6 Months</p>
                                </div>

                                <div className="flex gap-2">
                                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
                                        <button key={q} className={cn("px-3 py-1 rounded text-xs font-black uppercase tracking-widest transition-colors", i === 2 ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "bg-black/40 text-slate-500 border border-transparent hover:bg-white/5 hover:text-white")}>
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[400px] relative">
                                {/* Blurry glow behind chart */}
                                <div className="absolute inset-0 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

                                {isSimulating ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20 rounded-2xl border border-violet-500/20">
                                        <div className="relative w-20 h-20 mb-4">
                                            <div className="absolute inset-0 border-t-2 border-violet-500 rounded-full animate-spin" />
                                            <div className="absolute inset-2 border-r-2 border-cyan-400 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
                                            <Crosshair className="w-6 h-6 text-violet-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                        </div>
                                        <p className="text-sm font-black text-violet-400 uppercase tracking-[0.3em] animate-pulse">Running Monte Carlo...</p>
                                        <p className="text-[10px] text-slate-500 font-mono mt-2">Computing 10,000 futures</p>
                                    </div>
                                ) : (
                                    <ReactECharts option={getChartOption()} style={{ height: '100%', width: '100%' }} theme="dark" />
                                )}
                            </div>
                        </div>

                        {/* AI Insights Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 relative">
                                <Target className="absolute top-5 right-5 w-16 h-16 text-emerald-500/10" />
                                <h4 className="text-[10px] font-black shrink-0 text-emerald-400 tracking-[0.2em] mb-2 uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> AI Opportunity
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                    Падіння <span className="text-white font-black">Курсу USD</span> при зниженні мит створює вікно в <span className="text-emerald-400 font-black">45 днів</span> для агресивної закупівлі електроніки. ROI +22% вище норми.
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 relative">
                                <Shield className="absolute top-5 right-5 w-16 h-16 text-rose-500/10" />
                                <h4 className="text-[10px] font-black shrink-0 text-rose-400 tracking-[0.2em] mb-2 uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 bg-rose-500 rounded-full" /> Threat Vector
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                    Зростання активності конкурентів до <span className="text-white font-black">{params.competitorActivity}</span> вимагає збільшення маркетинг-бюджету на <span className="text-rose-400 font-black">~15%</span> для утримання долі ринку в Q3.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default ScenarioModeling;

function SettingsIcon(props: any) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
