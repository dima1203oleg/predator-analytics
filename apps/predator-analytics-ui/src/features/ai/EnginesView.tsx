/**
 * PREDATOR v56.1.4 | Cognitive Engines Matrix — ЦЕНТР АНАЛІТИЧНИХ ДВИГУНІВ
 * 
 * Потужний хаб моніторингу та керування 6 нейронними двигунами:
 * Behavioral, Institutional, Influence, Structural, Predictive, CERS.
 * - Глибока візуалізація метрик через ECharts
 * - Реальний час детекції аномалій та сигналів
 * - Преміальна кібернетична естетика з неоновими акцентами
 * 
 * © 2026 PREDATOR Analytics | High-Fidelity Intelligence
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactECharts from '@/components/ECharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Globe, Network, Layers, Waves, ShieldCheck,
    Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
    ArrowUpRight, ArrowDownRight, Cpu, Zap, Eye, RefreshCw,
    BarChart3, PieChart, Radio, Target, Clock, ChevronRight, Info,
    Database, Crosshair, Flame, Box, Boxes, ShieldAlert, ZapOff, Search
} from 'lucide-react';

import { cn } from '@/utils/cn';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/TacticalCard';
import { CyberOrb } from '@/components/CyberOrb';
import { CyberGrid } from '@/components/CyberGrid';
import { Badge } from '@/components/ui/badge';

// ========================
// Engine Definitions
// ========================

const ENGINES = [
    {
        id: 'behavioral', name: 'Поведінковий Двигун', shortName: 'BEH',
        icon: Brain, color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.3)',
        score: 87, confidence: 0.92, trend: +2.3,
        status: 'ACTIVE' as const,
        description: 'Аналіз поведінкових патернів суб\'єктів: транзакційна активність, часові відхилення, аномалії.',
        metrics: { processed: 48291, signals: 342, anomalies: 12, accuracy: 94.3 },
        subScores: [
            { label: 'Транзакції', value: 91 },
            { label: 'Часові патерни', value: 83 },
            { label: 'Мережа зв\'язків', value: 87 },
            { label: 'Соц. аналіз', value: 78 },
        ],
        recentSignals: [
            { msg: 'Аномальна активність: ТОВ "Альфа-Плюс"', severity: 'high', time: '2хв' },
            { msg: 'Незвичний час транзакцій: ФОП Петренко О.М.', severity: 'medium', time: '15хв' },
            { msg: 'Патерн дроблення: 5 суб\'єктів (Синтез)', severity: 'high', time: '32хв' },
        ],
    },
    {
        id: 'institutional', name: 'Інституційний Двигун', shortName: 'INST',
        icon: Globe, color: '#06b6d4', glowColor: 'rgba(6,182,212,0.3)',
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
            { msg: 'Нові санкції РНБО: +3 суб\'єкти (Керч)', severity: 'high', time: '1хв' },
            { msg: 'Зміна статуту: ТОВ "Грінвуд Логістик"', severity: 'low', time: '44хв' },
        ],
    },
    {
        id: 'influence', name: 'Двигун Впливу/Мережі', shortName: 'INF',
        icon: Network, color: '#f59e0b', glowColor: 'rgba(245,158,11,0.3)',
        score: 74, confidence: 0.81, trend: -1.2,
        status: 'ACTIVE' as const,
        description: 'Картографування мереж впливу: політичні зв\'язки, медіа-вплив, ПЕП (PEP).',
        metrics: { processed: 15820, signals: 201, anomalies: 31, accuracy: 82.7 },
        subScores: [
            { label: 'ПЕП зв\'язки', value: 79 },
            { label: 'Медіа вплив', value: 68 },
            { label: 'Полі. зв\'язки', value: 77 },
            { label: 'Соц. мережі', value: 71 },
        ],
        recentSignals: [
            { msg: 'Виявлено ПЕП-зв\'язок: 7 суб\'єктів (Клан А)', severity: 'high', time: '8хв' },
            { msg: 'Нова мережа впливу: 17 сутностей', severity: 'medium', time: '23хв' },
        ],
    },
    {
        id: 'structural', name: 'Структурний Двигун', shortName: 'STR',
        icon: Layers, color: '#10b981', glowColor: 'rgba(16,185,129,0.3)',
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
            { msg: 'Зміна UBO структури: ТОВ "Екотех-Сервіс"', severity: 'medium', time: '18хв' },
            { msg: 'Оптимальна структура підтверджена Ядром', severity: 'low', time: '1г' },
        ],
    },
    {
        id: 'predictive', name: 'Предиктивний Двигун', shortName: 'PRED',
        icon: Waves, color: '#ec4899', glowColor: 'rgba(236,72,153,0.3)',
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
            { msg: 'Прогноз: ріст ризику логістики +12% (Травень)', severity: 'medium', time: '5хв' },
            { msg: 'Тренд: зниження ринку мікроелектроніки', severity: 'low', time: '37хв' },
        ],
    },
    {
        id: 'cers', name: 'CERS Двигун Оцінки', shortName: 'CERS',
        icon: ShieldCheck, color: '#f97316', glowColor: 'rgba(249,115,22,0.3)',
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
            { msg: 'Калібрування моделі: 74.6% точність (Beta)', severity: 'medium', time: '12хв' },
            { msg: 'Розбіжність скорів: 3 суб\'єкти (Одеса)', severity: 'high', time: '45хв' },
        ],
    },
];

type SeverityType = 'high' | 'medium' | 'low';
const SEVERITY_CONFIG: Record<SeverityType, { color: string; bg: string; border: string; label: string }> = {
    high: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'CRITICAL' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'WARNING' },
    low: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', label: 'STABLE' },
};

// ========================
// Sub-components
// ========================

const EngineCardHeader: React.FC<{ engine: typeof ENGINES[0] }> = ({ engine }) => {
    const Icon = engine.icon;
    return (
        <div className="flex items-start gap-8">
            <div className="relative">
                <div className="absolute inset-0 blur-3xl opacity-20 animate-pulse" style={{ backgroundColor: engine.color }} />
                <div className="relative p-6 bg-slate-900 border border-white/10 rounded-[28px] panel-3d shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <Icon size={48} style={{ color: engine.color }} className="drop-shadow-[0_0_15px_currentColor]" />
                </div>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">{engine.name}</h2>
                    <Badge className={cn(
                        "font-black text-[10px] px-3 py-1 italic tracking-widest uppercase",
                        engine.status === 'ACTIVE' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                    )}>
                        {engine.status}
                    </Badge>
                </div>
                <p className="text-sm text-slate-400 font-bold italic leading-relaxed max-w-2xl">{engine.description}</p>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'ОБРОБЛЕНО', value: engine.metrics.processed.toLocaleString(), unit: 'OBJ', icon: Database, color: 'slate' },
                        { label: 'ТОЧНІСТЬ', value: `${engine.metrics.accuracy}%`, unit: 'ACC', icon: Target, color: 'emerald' },
                        { label: 'СИГНАЛИ', value: engine.metrics.signals, unit: 'RAD', icon: Radio, color: 'sky' },
                        { label: 'АНОМАЛІЇ', value: engine.metrics.anomalies, unit: 'ERR', icon: AlertTriangle, color: 'rose' },
                    ].map((m, i) => (
                        <div key={i} className="flex flex-col gap-1 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <m.icon size={10} /> {m.label}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-white tabular-nums tracking-tighter italic">{m.value}</span>
                                <span className="text-[8px] font-black text-slate-700 uppercase">{m.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const EngineListItem: React.FC<{ engine: typeof ENGINES[0]; isActive: boolean; onClick: () => void }> = ({ engine, isActive, onClick }) => {
    const Icon = engine.icon;
    return (
        <motion.button
            whileHover={{ x: 5 }}
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-4 p-5 rounded-[24px] border transition-all relative overflow-hidden group",
                isActive 
                    ? "bg-white/5 border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]" 
                    : "bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5"
            )}
        >
            <div className={cn(
                "p-3 rounded-xl border transition-all",
                isActive ? "bg-slate-900 border-white/10" : "bg-slate-900/50 border-white/5 group-hover:border-white/10"
            )} style={{ color: engine.color }}>
                <Icon size={20} className={cn(isActive && "animate-pulse")} />
            </div>
            <div className="flex-1 text-left">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{engine.shortName} ENGINE</span>
                    <span className="text-[9px] font-black tabular-nums" style={{ color: engine.color }}>{engine.score}%</span>
                </div>
                <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${engine.score}%` }}
                        className="h-full"
                        style={{ backgroundColor: engine.color }}
                    />
                </div>
            </div>
            {isActive && (
                <motion.div layoutId="activeIndicator" className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full" style={{ backgroundColor: engine.color }} />
            )}
        </motion.button>
    );
};

// ========================
// Main Component
// ========================

const EnginesView: React.FC = () => {
    const [selectedId, setSelectedId] = useState(ENGINES[0].id);
    const selectedEngine = useMemo(() => ENGINES.find(e => e.id === selectedId) || ENGINES[0], [selectedId]);
    const [animKey, setAnimKey] = useState(0);

    const handleSelect = (id: string) => {
        setSelectedId(id);
        setAnimKey(k => k + 1);
    };

    // ECharts Options
    const gaugeOption = useMemo(() => ({
        backgroundColor: 'transparent',
        series: [{
            type: 'gauge',
            startAngle: 210, endAngle: -30,
            min: 0, max: 100,
            splitNumber: 4,
            radius: '100%',
            center: ['50%', '55%'],
            axisLine: {
                lineStyle: {
                    width: 6,
                    color: [
                        [selectedEngine.score / 100, selectedEngine.color],
                        [1, 'rgba(255,255,255,0.05)']
                    ]
                }
            },
            pointer: { offsetCenter: [0, '-10%'], length: '60%', width: 2, itemStyle: { color: selectedEngine.color } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            detail: {
                valueAnimation: true,
                formatter: '{value}%',
                color: '#fff',
                fontSize: 24,
                fontWeight: '900',
                fontFamily: 'Orbitron, sans-serif',
                offsetCenter: [0, '40%'],
            },
            data: [{ value: selectedEngine.score }],
        }]
    }), [selectedEngine]);

    const historyOption = useMemo(() => {
        const data = Array.from({ length: 24 }, (_, i) => ({
            time: `${i}:00`,
            score: selectedEngine.score - 5 + Math.random() * 10,
        }));
        return {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#fff', fontSize: 10 } },
            grid: { left: '3%', right: '3%', bottom: '5%', top: '5%', containLabel: true },
            xAxis: { type: 'category', data: data.map(d => d.time), axisLabel: { color: '#475569', fontSize: 8 }, axisLine: { show: false }, axisTick: { show: false } },
            yAxis: { type: 'value', min: 0, max: 100, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.02)' } }, axisLabel: { show: false } },
            series: [{
                type: 'line', smooth: true,
                data: data.map(d => d.score.toFixed(1)),
                itemStyle: { color: selectedEngine.color },
                lineStyle: { width: 3, color: selectedEngine.color },
                areaStyle: {
                    opacity: 0.1,
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: selectedEngine.color }, { offset: 1, color: 'transparent' }]
                    }
                },
                symbol: 'none',
            }]
        };
    }, [selectedEngine]);

    const accuracyOption = useMemo(() => ({
        backgroundColor: 'transparent',
        series: [{
            type: 'pie',
            radius: ['60%', '80%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#0f172a', borderWidth: 2 },
            label: { show: false },
            data: [
                { value: selectedEngine.metrics.accuracy, itemStyle: { color: selectedEngine.color } },
                { value: 100 - selectedEngine.metrics.accuracy, itemStyle: { color: 'rgba(255,255,255,0.05)' } }
            ]
        }]
    }), [selectedEngine]);

    return (
        <div className="min-h-screen p-8 lg:p-12 relative overflow-hidden animate-in fade-in duration-1000">
            <AdvancedBackground />
            <CyberGrid color="rgba(139, 92, 246, 0.05)" />

            <div className="max-w-[1700px] mx-auto space-y-12 relative z-10 w-full">
                
                {/* View Header v56.1.4 */}
                <ViewHeader
                    title={
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full scale-150 opacity-20" />
                                <div className="relative p-5 bg-slate-900 border border-white/5 rounded-[28px] panel-3d shadow-2xl">
                                    <Cpu size={36} className="text-purple-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none italic skew-x-[-4deg]">
                                    Engines <span className="text-purple-400">Matrix</span>
                                </h1>
                                <p className="text-[11px] font-mono font-black text-slate-500 uppercase tracking-[0.4em] mt-2">
                                    COGNITIVE_KERNEL // МАРИЦЯ_АНАЛІТИЧНИХ_ДВИГУНІВ
                                </p>
                            </div>
                        </div>
                    }
                    breadcrumbs={['СИСТЕМА', 'ДВИГУНИ', selectedEngine.shortName]}
                    stats={[
                        { label: 'АКТИВНО', value: '6/6', icon: <Activity size={14} />, color: 'success' },
                        { label: 'АНОМАЛІЇ', value: ENGINES.reduce((s, e) => s + e.metrics.anomalies, 0).toString(), icon: <AlertTriangle size={14} />, color: 'danger', animate: true },
                        { label: 'ТОЧНІСТЬ', value: '94.8%', icon: <Target size={14} />, color: 'purple' },
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Panel: Engine Selection */}
                    <div className="lg:col-span-3 space-y-8">
                        <TacticalCard variant="holographic" title="СПИСОК ДВИГУНІВ" className="p-6 bg-slate-950/40 border-white/5 rounded-[40px] panel-3d">
                            <div className="space-y-3">
                                {ENGINES.map(engine => (
                                    <EngineListItem 
                                        key={engine.id} 
                                        engine={engine} 
                                        isActive={selectedId === engine.id} 
                                        onClick={() => handleSelect(engine.id)} 
                                    />
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">СИСТЕМНИЙ СТАТУС</p>
                                {[
                                    { label: 'ЛОГІЧНИХ ЯДЕР', value: '32', color: 'slate' },
                                    { label: 'GPU CLUSTER', value: 'A100-80G', color: 'emerald' },
                                    { label: 'LATENCY', value: '14ms', color: 'sky' },
                                ].map((s, i) => (
                                    <div key={i} className="flex justify-between items-center px-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
                                        <span className={cn("text-[10px] font-black italic", `text-${s.color}-400`)}>{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </TacticalCard>

                        <button className="w-full py-6 bg-purple-600/10 border border-purple-500/20 rounded-[32px] text-[10px] font-black text-purple-400 uppercase tracking-[0.5em] hover:bg-purple-600/20 hover:text-white transition-all italic flex items-center justify-center gap-4 group">
                            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-1000" />
                            RECALIBRATE_ALL_ENGINES
                        </button>
                    </div>

                    {/* Main Content: Engine Details */}
                    <div className="lg:col-span-9 space-y-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={animKey}
                                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.02, y: -20 }}
                                className="space-y-12"
                            >
                                {/* Header Info */}
                                <TacticalCard variant="holographic" className="p-12 overflow-hidden relative border-white/5 bg-slate-950/40 rounded-[60px] panel-3d">
                                    <div className="absolute top-0 right-0 p-20 opacity-5 group-hover:scale-110 transition-transform">
                                        <selectedEngine.icon size={300} style={{ color: selectedEngine.color }} />
                                    </div>
                                    <EngineCardHeader engine={selectedEngine} />
                                </TacticalCard>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                    {/* Score Gauge */}
                                    <TacticalCard variant="glass" title="ЕФЕКТИВНІСТЬ" className="p-8 h-[300px] rounded-[48px] overflow-hidden flex flex-col items-center">
                                        <div className="flex-1 w-full relative">
                                            <ReactECharts option={gaugeOption} style={{ height: '220px', width: '100%' }} />
                                        </div>
                                        <div className="flex items-center gap-3 mt-4">
                                            {selectedEngine.trend > 0 ? <ArrowUpRight className="text-emerald-400" size={18} /> : <ArrowDownRight className="text-rose-400" size={18} />}
                                            <span className={cn("text-sm font-black italic", selectedEngine.trend > 0 ? "text-emerald-400" : "text-rose-400")}>
                                                {selectedEngine.trend > 0 ? '+' : ''}{selectedEngine.trend}% (24г)
                                            </span>
                                        </div>
                                    </TacticalCard>

                                    {/* Accuracy Visualizer */}
                                    <TacticalCard variant="glass" title="ТОЧНІСТЬ ВАЛІДАЦІЇ" className="p-8 h-[300px] rounded-[48px] overflow-hidden flex flex-col items-center">
                                        <div className="flex-1 w-full relative flex items-center justify-center">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-3xl font-black text-white italic tracking-tighter">{selectedEngine.metrics.accuracy}%</div>
                                            </div>
                                            <ReactECharts option={accuracyOption} style={{ height: '200px', width: '200px' }} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">CONFIDENCE_INDEX: {selectedEngine.confidence}</p>
                                    </TacticalCard>

                                    {/* Sub-categories */}
                                    <TacticalCard variant="glass" title="ВЕКТОРНІ СУБ-СКОРИ" className="p-8 h-[300px] rounded-[48px] overflow-hidden">
                                        <div className="space-y-6 mt-4">
                                            {selectedEngine.subScores.map((sub, i) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-slate-400">{sub.label}</span>
                                                        <span className="text-white italic">{sub.value}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${sub.value}%` }} 
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: selectedEngine.color, opacity: 0.8 }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TacticalCard>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* 24h Activity */}
                                    <TacticalCard variant="holographic" title="ДИНАМІКА ПОТОКУ (24 ГОДИННИ)" className="p-10 rounded-[60px] bg-slate-950/40 border-white/5">
                                        <div className="h-[250px] w-full">
                                            <ReactECharts option={historyOption} style={{ height: '100%', width: '100%' }} />
                                        </div>
                                    </TacticalCard>

                                    {/* Signals Stream */}
                                    <TacticalCard variant="holographic" title="АКТИВНИЙ ПОТІК СИГНАЛІВ" className="p-10 rounded-[60px] bg-slate-950/40 border-white/5">
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                                            {selectedEngine.recentSignals.map((sig, i) => {
                                                const cfg = SEVERITY_CONFIG[sig.severity as SeverityType] || SEVERITY_CONFIG.low;
                                                return (
                                                    <motion.div 
                                                        key={i} 
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="p-5 bg-black/40 border border-white/5 rounded-[24px] group hover:border-white/10 transition-all flex items-start gap-5 relative overflow-hidden"
                                                    >
                                                        <div className="shrink-0 w-2 h-2 rounded-full mt-2 animate-pulse" style={{ backgroundColor: cfg.color }} />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <Badge className="font-black text-[8px] border-none italic" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                                                                    {cfg.label}
                                                                </Badge>
                                                                <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{sig.time} TOMY</span>
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-200 leading-relaxed italic">{sig.msg}</p>
                                                        </div>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </TacticalCard>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Hardware Info */}
                <div className="p-10 bg-slate-950/40 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full scale-110 animate-pulse" />
                                <div className="p-4 bg-slate-900 border border-white/10 rounded-2xl relative z-10">
                                    <Box size={32} className="text-purple-400" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1 italic">Cluster Health Monitor</h4>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Статус вузлів обробки та нейронних ваг.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                            {[
                                { label: 'SYNAPSE_LOAD', value: '42.8%', color: 'purple' },
                                { label: 'GPU_TEMP', value: '64°C', color: 'rose' },
                                { label: 'VRAM_USED', value: '18.2GB', color: 'sky' },
                                { label: 'IO_SPEED', value: '4.2GB/s', color: 'emerald' },
                            ].map((s, i) => (
                                <div key={i} className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">{s.label}</span>
                                    <span className={cn("text-sm font-black tabular-nums italic", `text-${s.color}-400`)}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                        <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-[28px] text-[10px] font-black text-white uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-4 group italic">
                            NODE_DIAGNOSTICS <Search size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(139, 92, 246, 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(139, 92, 246, 0.4);
                }
                .panel-3d {
                    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .panel-3d:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8);
                }
                .dynamic-color-pulse {
                    animation: color-pulse 4s infinite;
                }
                @keyframes color-pulse {
                    0%, 100% { color: #8b5cf6; text-shadow: 0 0 10px #8b5cf6; }
                    33% { color: #06b6d4; text-shadow: 0 0 10px #06b6d4; }
                    66% { color: #f59e0b; text-shadow: 0 0 10px #f59e0b; }
                }
            `}} />
        </div>
    );
};

export default EnginesView;
