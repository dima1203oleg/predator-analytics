/**
 * 🔬 PREDATOR ANALYTICS — Центр Аналітичних Двигунів v55
 * =====================================================
 * Детальний моніторинг та управління 6 аналітичними двигунами:
 * Behavioral, Institutional, Influence, Structural, Predictive, CERS
 */

import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Globe, Network, Layers, Waves, ShieldCheck,
    Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
    ArrowUpRight, ArrowDownRight, Cpu, Zap, Eye, RefreshCw,
    BarChart3, PieChart, Radio, Target, Clock, ChevronRight, Info,
    Database, Crosshair, Flame
} from 'lucide-react';

import { motion as m } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Engine definitions ───────────────────────────────────────────────────────
const ENGINES = [
    {
        id: 'behavioral', name: 'Поведінковий Двигун', shortName: 'BEH',
        icon: Brain, color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.25)',
        score: 87, confidence: 0.92, trend: +2.3,
        status: 'ACTIVE' as const,
        description: 'Аналіз поведінкових паттернів суб\'єктів: транзакційна активність, часові відхилення, аномалії.',
        metrics: { processed: 48291, signals: 342, anomalies: 12, accuracy: 94.3 },
        subScores: [
            { label: 'Транзакції', value: 91 },
            { label: 'Часові патерни', value: 83 },
            { label: 'Мережа зв\'язків', value: 87 },
            { label: 'Соц. аналіз', value: 78 },
        ],
        recentSignals: [
            { msg: 'Аномальна активність: ТОВ "Альфа"', severity: 'high', time: '2хв' },
            { msg: 'Незвичний час транзакцій: ФОП Петренко', severity: 'medium', time: '15хв' },
            { msg: 'Патерн дроблення: 5 суб\'єктів', severity: 'high', time: '32хв' },
        ],
    },
    {
        id: 'institutional', name: 'Інституційний Двигун', shortName: 'INST',
        icon: Globe, color: '#06b6d4', glowColor: 'rgba(6,182,212,0.25)',
        score: 92, confidence: 0.96, trend: +0.8,
        status: 'ACTIVE' as const,
        description: 'Аналіз інституційних зв\'язків: корпоративні структури, регуляторні ризики, комплаєнс.',
        metrics: { processed: 21450, signals: 89, anomalies: 4, accuracy: 97.1 },
        subScores: [
            { label: 'Корп. структури', value: 95 },
            { label: 'Комплаєнс', value: 91 },
            { label: 'Регуляторні', value: 88 },
            { label: 'Санкційний скан', value: 99 },
        ],
        recentSignals: [
            { msg: 'Нові санкції РНБО: +3 суб\'єкти', severity: 'high', time: '1хв' },
            { msg: 'Зміна статуту: ТОВ "Грінвуд"', severity: 'low', time: '44хв' },
        ],
    },
    {
        id: 'influence', name: 'Двигун Впливу/Мережі', shortName: 'INF',
        icon: Network, color: '#f59e0b', glowColor: 'rgba(245,158,11,0.25)',
        score: 74, confidence: 0.81, trend: -1.2,
        status: 'ACTIVE' as const,
        description: 'Картографування мереж впливу: політичні зв\'язки, медіа-вплив, ПЕП.',
        metrics: { processed: 15820, signals: 201, anomalies: 31, accuracy: 82.7 },
        subScores: [
            { label: 'ПЕП зв\'язки', value: 79 },
            { label: 'Медіа вплив', value: 68 },
            { label: 'Полі. зв\'язки', value: 77 },
            { label: 'Соц. мережі', value: 71 },
        ],
        recentSignals: [
            { msg: 'Виявлено ПЕП-зв\'язок: 7 суб\'єктів', severity: 'high', time: '8хв' },
            { msg: 'Нова мережа впливу: 17 сутностей', severity: 'medium', time: '23хв' },
            { msg: 'Зміна медіа-ландшафту: 3 ЗМІ', severity: 'low', time: '1г' },
        ],
    },
    {
        id: 'structural', name: 'Структурний Двигун', shortName: 'STR',
        icon: Layers, color: '#10b981', glowColor: 'rgba(16,185,129,0.25)',
        score: 96, confidence: 0.98, trend: +4.1,
        status: 'ACTIVE' as const,
        description: 'Аналіз структурної цілісності: власність, управління, ланцюги постачання.',
        metrics: { processed: 67840, signals: 156, anomalies: 6, accuracy: 98.4 },
        subScores: [
            { label: 'Власність (UBO)', value: 98 },
            { label: 'Управління', value: 95 },
            { label: 'Ланцюги пост.', value: 94 },
            { label: 'Фін. потоки', value: 97 },
        ],
        recentSignals: [
            { msg: 'Зміна UBO структури: ТОВ "Екотех"', severity: 'medium', time: '18хв' },
            { msg: 'Оптимальна структура підтверджена', severity: 'low', time: '1г' },
        ],
    },
    {
        id: 'predictive', name: 'Предиктивний Двигун', shortName: 'PRED',
        icon: Waves, color: '#ec4899', glowColor: 'rgba(236,72,153,0.25)',
        score: 81, confidence: 0.87, trend: +1.7,
        status: 'ACTIVE' as const,
        description: 'Прогностичний аналіз: ринкові тренди, ризикові сценарії, AI-прогнози.',
        metrics: { processed: 33120, signals: 441, anomalies: 18, accuracy: 88.2 },
        subScores: [
            { label: 'Ринкові прогнози', value: 84 },
            { label: 'Ризик-сценарії', value: 79 },
            { label: 'Часові ряди', value: 88 },
            { label: 'NAS точність', value: 82 },
        ],
        recentSignals: [
            { msg: 'Прогноз: ріст ризику логістики +12%', severity: 'medium', time: '5хв' },
            { msg: 'Тренд: зниження ринку електроніки', severity: 'low', time: '37хв' },
            { msg: 'Аномалія Q4 прогнозу виявлена', severity: 'high', time: '2г' },
        ],
    },
    {
        id: 'cers', name: 'CERS Двигун Оцінки', shortName: 'CERS',
        icon: ShieldCheck, color: '#f97316', glowColor: 'rgba(249,115,22,0.25)',
        score: 69, confidence: 0.73, trend: -0.5,
        status: 'CALIBRATING' as const,
        description: 'Комплексна оцінка ризиків суб\'єктів: синтез всіх двигунів у єдиний скор.',
        metrics: { processed: 8940, signals: 78, anomalies: 22, accuracy: 74.6 },
        subScores: [
            { label: 'Синтез скорів', value: 72 },
            { label: 'Калібрування', value: 61 },
            { label: 'Нормалізація', value: 74 },
            { label: 'Точність', value: 70 },
        ],
        recentSignals: [
            { msg: 'Калібрування моделі: 74.6% точність', severity: 'medium', time: '12хв' },
            { msg: 'Розбіжність скорів: 3 суб\'єкти', severity: 'high', time: '45хв' },
        ],
    },
];

type SeverityType = 'high' | 'medium' | 'low';
const SEVERITY_CONFIG: Record<SeverityType, { color: string; bg: string; border: string; label: string }> = {
    high: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'ВИСОК' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'СЕРЕД' },
    low: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', label: 'НИЗЬК' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const EngineListItem: React.FC<{ engine: typeof ENGINES[0]; isActive: boolean; onClick: () => void }> = ({ engine, isActive, onClick }) => {
    const Icon = engine.icon;
    return (
        <motion.button
            whileHover={{ x: 2 }}
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                isActive
                    ? "border-white/15 bg-white/5"
                    : "border-transparent hover:border-white/8 hover:bg-white/3"
            )}
        >
            <div className="p-2 rounded-lg shrink-0" style={{ background: `${engine.color}15`, color: engine.color }}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-white uppercase tracking-wide truncate">{engine.shortName}</span>
                    <Badge className={cn("text-[7px] px-1 py-0 font-black", engine.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')}>
                        {engine.status === 'ACTIVE' ? 'ACT' : 'CAL'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${engine.score}%`, background: engine.color }} />
                    </div>
                    <span className="text-[10px] font-black tabular-nums shrink-0" style={{ color: engine.color }}>{engine.score}%</span>
                </div>
            </div>
            {isActive && <div className="w-1 h-6 rounded-full shrink-0" style={{ background: engine.color }} />}
        </motion.button>
    );
};

const SubScoreBar: React.FC<{ label: string; value: number; color: string; delay: number }> = ({ label, value, color, delay }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <span className="text-[11px] font-black tabular-nums" style={{ color }}>{value}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1.2, delay, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
            />
        </div>
    </div>
);

const SignalRow: React.FC<{ signal: { msg: string; severity: string; time: string } }> = ({ signal }) => {
    const cfg = SEVERITY_CONFIG[signal.severity as SeverityType] || SEVERITY_CONFIG.low;
    return (
        <div className="flex items-start gap-2 p-2.5 rounded-lg border transition-colors hover:bg-white/5"
            style={{ background: cfg.bg, borderColor: cfg.border }}>
            <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0 animate-pulse" style={{ background: cfg.color }} />
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-200 font-medium leading-tight">{signal.msg}</p>
                <p className="text-[9px] font-mono text-slate-500 mt-0.5">{signal.time} тому</p>
            </div>
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded shrink-0" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                {cfg.label}
            </span>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EnginesView: React.FC = () => {
    const [selectedEngine, setSelectedEngine] = useState(ENGINES[0]);
    const [animKey, setAnimKey] = useState(0);

    const handleSelect = (engine: typeof ENGINES[0]) => {
        setSelectedEngine(engine);
        setAnimKey(k => k + 1);
    };

    const gaugeOption = useMemo(() => ({
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge',
            startAngle: 200, endAngle: -20,
            min: 0, max: 100,
            splitNumber: 5,
            radius: '90%',
            center: ['50%', '60%'],
            axisLine: {
                lineStyle: {
                    width: 12,
                    color: [
                        [selectedEngine.score / 100, selectedEngine.color],
                        [1, '#1e293b']
                    ]
                }
            },
            pointer: { offsetCenter: [0, '-15%'], length: '60%', width: 4, itemStyle: { color: selectedEngine.color } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            detail: {
                valueAnimation: true,
                formatter: '{value}%',
                color: selectedEngine.color,
                fontSize: 22,
                fontWeight: 'bolder',
                offsetCenter: [0, '30%'],
            },
            data: [{ value: selectedEngine.score }],
        }]
    }), [selectedEngine]);

    const confidenceOption = useMemo(() => ({
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge',
            startAngle: 180, endAngle: 0,
            min: 0, max: 1,
            radius: '90%',
            center: ['50%', '80%'],
            splitNumber: 4,
            axisLine: {
                lineStyle: {
                    width: 8,
                    color: [
                        [selectedEngine.confidence, '#06b6d4'],
                        [1, '#1e293b']
                    ]
                }
            },
            pointer: { length: '50%', width: 3, itemStyle: { color: '#06b6d4' } },
            axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
            detail: {
                formatter: (v: number) => `${(v * 100).toFixed(0)}%`,
                color: '#06b6d4', fontSize: 14, fontWeight: 'bolder', offsetCenter: [0, '-15%'],
            },
            data: [{ value: selectedEngine.confidence }],
        }]
    }), [selectedEngine]);

    const historyOption = useMemo(() => {
        const data = Array.from({ length: 24 }, (_, i) => ({
            time: `${i}:00`,
            score: selectedEngine.score - 10 + Math.random() * 20,
        }));
        return {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#020617', borderColor: '#1e293b', textStyle: { color: '#f1f5f9', fontSize: 10 } },
            grid: { left: '2%', right: '2%', bottom: '5%', top: '5%', containLabel: true },
            xAxis: { type: 'category', data: data.map(d => d.time), axisLabel: { color: '#334155', fontSize: 8 }, axisLine: { show: false }, axisTick: { show: false } },
            yAxis: { type: 'value', min: 0, max: 100, splitLine: { lineStyle: { color: '#0f172a' } }, axisLabel: { color: '#334155', fontSize: 8 } },
            series: [{
                name: 'Скор', type: 'line', smooth: true,
                data: data.map(d => d.score.toFixed(1)),
                itemStyle: { color: selectedEngine.color },
                lineStyle: { width: 2, color: selectedEngine.color },
                areaStyle: {
                    opacity: 0.15,
                    color: selectedEngine.color,
                },
                symbol: 'none',
            }]
        };
    }, [selectedEngine]);

    const Icon = selectedEngine.icon;

    return (
        <div className="min-h-screen bg-black relative overflow-hidden pb-24">
            {/* Background */}
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.025] pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 70% 20%, ${selectedEngine.glowColor} 0%, transparent 50%)` }} />

            <div className="relative z-10 p-6 lg:p-10 max-w-[1800px] mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${selectedEngine.color}20` }}>
                                <Brain className="w-4 h-4" style={{ color: selectedEngine.color }} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: selectedEngine.color }}>PREDATOR · АНАЛІТИЧНІ ДВИГУНИ</span>
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                            Центр <span style={{ color: selectedEngine.color, textShadow: `0 0 20px ${selectedEngine.color}50` }}>Двигунів v55</span>
                        </h1>
                        <p className="text-slate-500 text-xs mt-1.5 uppercase tracking-widest">6 аналітичних двигунів · Синтез · Калібрування</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-slate-400 hover:text-white uppercase text-[9px] font-black tracking-widest">
                            <RefreshCw className="w-3 h-3 mr-1.5" /> Оновити
                        </Button>
                        <Button size="sm" className="text-[9px] font-black tracking-widest uppercase" style={{ background: selectedEngine.color }}>
                            <Zap className="w-3 h-3 mr-1.5" /> Калібрувати
                        </Button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Engine List */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl p-4">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Двигуни</h3>
                            <div className="space-y-1">
                                {ENGINES.map(engine => (
                                    <EngineListItem
                                        key={engine.id}
                                        engine={engine}
                                        isActive={selectedEngine.id === engine.id}
                                        onClick={() => handleSelect(engine)}
                                    />
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="mt-5 pt-4 border-t border-white/5 space-y-2">
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Зведення</div>
                                {[
                                    { label: 'Активних', value: ENGINES.filter(e => e.status === 'ACTIVE').length, color: '#10b981' },
                                    { label: 'Калібрується', value: ENGINES.filter(e => e.status === 'CALIBRATING').length, color: '#f59e0b' },
                                    { label: 'Сигналів/г', value: ENGINES.reduce((s, e) => s + e.metrics.signals, 0), color: '#06b6d4' },
                                    { label: 'Аномалій', value: ENGINES.reduce((s, e) => s + e.metrics.anomalies, 0), color: '#ef4444' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500 font-bold">{item.label}</span>
                                        <span className="text-[11px] font-black tabular-nums" style={{ color: item.color }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Detail Panel */}
                    <div className="lg:col-span-3 space-y-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={animKey}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                            >
                                {/* Engine Header Card */}
                                <div className="rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl overflow-hidden relative">
                                    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 100% 0%, ${selectedEngine.glowColor} 0%, transparent 50%)` }} />
                                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${selectedEngine.color}, transparent)` }} />
                                    <div className="relative p-5">
                                        <div className="flex items-start gap-5">
                                            <div className="p-4 rounded-2xl border" style={{ background: `${selectedEngine.color}15`, borderColor: `${selectedEngine.color}30`, color: selectedEngine.color }}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{selectedEngine.name}</h2>
                                                    <Badge className={cn("text-[9px] font-black px-2",
                                                        selectedEngine.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    )}>
                                                        {selectedEngine.status}
                                                    </Badge>
                                                    <span className="text-[9px] font-mono text-slate-500">{selectedEngine.shortName}_ENGINE_v55</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mb-4 max-w-xl">{selectedEngine.description}</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {[
                                                        { label: 'Оброблено', value: selectedEngine.metrics.processed.toLocaleString(), icon: <Database className="w-3 h-3" /> },
                                                        { label: 'Сигналів', value: selectedEngine.metrics.signals, icon: <Radio className="w-3 h-3" /> },
                                                        { label: 'Аномалій', value: selectedEngine.metrics.anomalies, icon: <AlertTriangle className="w-3 h-3" /> },
                                                        { label: 'Точність', value: `${selectedEngine.metrics.accuracy}%`, icon: <Target className="w-3 h-3" /> },
                                                    ].map(item => (
                                                        <div key={item.label} className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                            <div className="flex items-center gap-1.5 mb-1" style={{ color: selectedEngine.color }}>
                                                                {item.icon}
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                                                            </div>
                                                            <div className="text-sm font-black text-white tabular-nums">{item.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* Score Gauge */}
                                    <div className="rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl p-4">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Загальний Скор</div>
                                        <ReactECharts option={gaugeOption} style={{ height: '140px' }} />
                                        <div className="flex items-center justify-center gap-2 mt-1">
                                            {selectedEngine.trend > 0
                                                ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                                                : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />}
                                            <span className={cn("text-[11px] font-black", selectedEngine.trend > 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                                {selectedEngine.trend > 0 ? '+' : ''}{selectedEngine.trend}% за 24г
                                            </span>
                                        </div>
                                    </div>

                                    {/* Confidence Gauge */}
                                    <div className="rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl p-4">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Рівень Впевненості</div>
                                        <ReactECharts option={confidenceOption} style={{ height: '140px' }} />
                                        <div className="text-center mt-1">
                                            <span className="text-[10px] text-slate-500 font-mono uppercase">Confidence Score</span>
                                        </div>
                                    </div>

                                    {/* Sub-scores */}
                                    <div className="rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl p-4">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Підкатегорії</div>
                                        <div className="space-y-3">
                                            {selectedEngine.subScores.map((sub, i) => (
                                                <SubScoreBar
                                                    key={sub.label}
                                                    label={sub.label}
                                                    value={sub.value}
                                                    color={selectedEngine.color}
                                                    delay={i * 0.1}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* History Chart + Signals */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* 24h History */}
                                    <div className="rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Динаміка 24 Год</div>
                                            <div className="w-2 h-2 rounded-full" style={{ background: selectedEngine.color, boxShadow: `0 0 6px ${selectedEngine.color}` }} />
                                        </div>
                                        <ReactECharts option={historyOption} style={{ height: '150px' }} />
                                    </div>

                                    {/* Recent Signals */}
                                    <div className="rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Radio className="w-3.5 h-3.5" style={{ color: selectedEngine.color }} />
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Нещодавні Сигнали</div>
                                        </div>
                                        <div className="space-y-2">
                                            {selectedEngine.recentSignals.map((sig, i) => (
                                                <SignalRow key={i} signal={sig} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnginesView;
