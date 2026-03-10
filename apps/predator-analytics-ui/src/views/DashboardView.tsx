/**
 * 🛰️ Global Situation Command Center | v55 Sovereign Matrix
 * PREDATOR Dashboard - Центральна нервова система аналітики.
 * 
 * Включає:
 * - 💠 Суверенна Матриця (Sovereign Matrix)
 * - ⚡ Аналітичні Двигуни (Analytical Engines)
 * - 🎯 Теплова Карта Ризиків (Risk Heatmap)
 * - 🌀 Нейронна Активність (Neural Activity Feed)
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v55
 */

import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import {
    Activity, Globe, Database, Server, Cpu,
    Brain, Target, Network, Radio,
    RefreshCw, CheckCircle, XCircle, AlertCircle, Bot, Waves,
    Lock, ShieldCheck, Radar, Satellite,
    Terminal, Zap, Clock
} from 'lucide-react';

import { useAppStore } from '../store/useAppStore';
import { useOmniscienceWS } from '../hooks/useOmniscienceWS';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { cn } from '../utils/cn';

/** Components */
import { TacticalCard } from '../components/TacticalCard';
import { NeuralCore } from '../components/NeuralCore';
import { CyberOrb } from '../components/CyberOrb';
import { ViewHeader } from '../components/ViewHeader';
import { Cers5LayerGauge } from '../components/risk/Cers5LayerGauge';
import { Badge } from '../components/ui/badge';
import { PageTransition } from '../components/layout/PageTransition';

// === ЛОКАЛІЗАЦІЯ (v55) ===

const localLocales = {
    title: "Ситуаційний Командний Центр",
    subtitle: "Глобальна Суверенна Матриця",
    status: "SOVEREIGN_PROTOCOL_ACTIVE",
    gridSync: "Синхронізація Глобальної Мережі: OK",
    stats: {
        score: "Суверенний Бал",
        uptime: "Час Роботи",
        load: "Навантаження Мережі"
    },
    sections: {
        flux: "Потік Суверенної Матриці",
        fluxSub: "Розповсюдження в Реальному Часі та Історія",
        riskMap: "Регіональне Теплове Поле Ризику",
        pipeline: "Синхронізація Пайплайнів",
        neuralFeed: "Потік Нейронного Інтелекту",
        neuralSub: "Активна Реактивність Ядра",
        agentFleet: "Флот Суверенних AI Агентів",
        logs: "Нейронний Потік Логів"
    },
    engines: {
        behavioral: "Поведінковий",
        institutional: "Інституційний",
        influence: "Вплив/Мережа",
        structural: "Структурний",
        predictive: "Предиктивний",
        cers: "CERS Оцінка"
    },
    riskSectors: {
        finance: "Фін. Сектор",
        logistics: "Логістика",
        realEstate: "Нерухомість",
        energy: "Енергетика",
        it: "IT/Телеком",
        construction: "Будівництво"
    },
    steps: {
        ingestion: "Інджестинг Даних",
        vectorization: "Нейронна Векторизація",
        graph: "Оновлення Графу Знань",
        validation: "CERS Валідація"
    }
};

const ENGINES = [
    { id: 'behavioral', name: localLocales.engines.behavioral, icon: Brain, color: '#8b5cf6', score: 87, trend: '+2.3%', status: 'ACTIVE' },
    { id: 'institutional', name: localLocales.engines.institutional, icon: Globe, color: '#06b6d4', score: 92, trend: '+0.8%', status: 'ACTIVE' },
    { id: 'influence', name: localLocales.engines.influence, icon: Network, color: '#f59e0b', score: 74, trend: '-1.2%', status: 'ACTIVE' },
    { id: 'structural', name: localLocales.engines.structural, icon: Cpu, color: '#10b981', score: 96, trend: '+4.1%', status: 'ACTIVE' },
    { id: 'predictive', name: localLocales.engines.predictive, icon: Waves, color: '#ec4899', score: 81, trend: '+1.7%', status: 'ACTIVE' },
    { id: 'cers', name: localLocales.engines.cers, icon: ShieldCheck, color: '#f43f5e', score: 69, trend: '-0.5%', status: 'CALIBRATING' },
];

const RISK_Sectors = [
    { label: localLocales.riskSectors.finance, risk: 78, level: 'CRITICAL' },
    { label: localLocales.riskSectors.logistics, risk: 54, level: 'WARNING' },
    { label: localLocales.riskSectors.realEstate, risk: 61, level: 'WARNING' },
    { label: localLocales.riskSectors.energy, risk: 32, level: 'STABLE' },
    { label: localLocales.riskSectors.it, risk: 23, level: 'STABLE' },
    { label: localLocales.riskSectors.construction, risk: 83, level: 'CRITICAL' },
];

const AGENTS = [
    { name: 'Architect-v55', role: 'Системний Архітектор', state: 'Optimal', load: 42 },
    { name: 'Hunter-v55', role: 'Пошуковець Ризиків', state: 'Hunting', load: 88 },
    { name: 'Vibe-Coder', role: 'Interface Flux', state: 'Evolving', load: 12 },
    { name: 'Truth-Keeper', role: 'Ledger Audit', state: 'Stable', load: 35 },
];

const SYSTEM_LOGS = [
    '>>> СИНХРОНІЗАЦІЯ_ГЛОБАЛЬНИХ_НОД_ТАКСОНОМІЇ...',
    '>>> ВАЛІДАЦІЯ_КОЕФІЦІЄНТІВ_CERS: OK',
    '>>> РЕВОЛЮЦІЯ_AZ: ВІКНО_ОПТИМІЗАЦІЇ_ЗНАЙДЕНО',
    '>>> УВАГА: ВІДХИЛЕННЯ_ПОТОКУ_ТРАНЗИТУ_7%',
    '>>> БОТ_HUNTER-v55: ВИЯВЛЕНО_НОВУ_АНОМАЛІЮ_ID_882',
    '>>> CORE_MATRIX: БАЛАНСУВАННЯ_НАВАНТАЖЕННЯ_ЗАВЕРШЕНО',
    '>>> СИС: ОРБІТАЛЬНИЙ_ЗВЯЗОК_ВСТАНОВЛЕНО_ЧЕРЕЗ_M3_STATION',
];

// === ДОПОМІЖНІ КОМПОНЕНТИ ===

const EngineMetric: React.FC<{ engine: typeof ENGINES[0], index: number }> = ({ engine, index }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="p-5 bg-slate-900/60 border border-white/5 rounded-[24px] group hover:border-white/10 transition-all panel-3d"
    >
        <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl shadow-inner group-hover:scale-110 transition-transform" style={{ color: engine.color }}>
                <engine.icon size={18} className="drop-shadow-[0_0_8px_currentColor]" />
            </div>
            <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-lg border",
                engine.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            )}>
                {engine.status}
            </span>
        </div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{engine.name}</div>
        <div className="flex items-end gap-3">
            <div className="text-2xl font-black text-white font-display tracking-tighter">{engine.score}%</div>
            <div className={cn("text-[10px] font-bold mb-1", engine.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400')}>
                {engine.trend}
            </div>
        </div>
        <div className="mt-4 h-1 w-full bg-slate-950 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }} animate={{ width: `${engine.score}%` }}
                className="h-full shadow-[0_0_10px_currentColor]"
                style={{ backgroundColor: engine.color, color: engine.color }}
            />
        </div>
    </motion.div>
);

const RiskTile: React.FC<{ data: typeof RISK_Sectors[0] }> = ({ data }) => (
    <div className={cn(
        "p-4 rounded-2xl border flex flex-col justify-between h-28 panel-3d transition-all group cursor-pointer",
        data.level === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40 text-rose-400' :
            data.level === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40 text-amber-400' :
                'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400'
    )}>
        <div className="text-[9px] font-black uppercase tracking-[0.2em]">{data.label}</div>
        <div>
            <div className="text-2xl font-black font-display tracking-tighter">{data.risk}%</div>
            <div className="text-[8px] font-black uppercase opacity-60 tracking-widest">Індекс Ризику</div>
        </div>
    </div>
);

// === ГОЛОВНИЙ КОМПОНЕНТ ===

const DashboardView: React.FC = () => {
    const { isConnected } = useOmniscienceWS();
    const systemMetrics = useSystemMetrics();
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setUptime(p => p + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatUptime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    // ECharts Options 
    const historyOption = useMemo(() => ({
        backgroundColor: 'transparent',
        grid: { left: '3%', right: '3%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'NOW'], axisLabel: { color: '#475569', fontSize: 10 }, axisLine: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } }, axisLabel: { color: '#475569', fontSize: 10 } },
        series: [
            {
                name: 'Sovereign Score', type: 'line', smooth: true, data: [88, 91, 89, 94, 92, 95, 94],
                lineStyle: { width: 3, color: '#06b6d4' }, itemStyle: { color: '#06b6d4' },
                areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.2)' }, { offset: 1, color: 'transparent' }] } },
                symbol: 'none'
            },
            {
                name: 'Risk Level', type: 'line', smooth: true, data: [12, 15, 11, 8, 14, 10, 9],
                lineStyle: { width: 2, color: '#f43f5e', type: 'dashed' }, itemStyle: { color: '#f43f5e' },
                symbol: 'none'
            }
        ]
    }), []);

    return (
        <PageTransition>
            <div className="p-10 space-y-10 animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden pb-40">

                {/* Background Decor */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-600/5 blur-[150px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-600/5 blur-[150px] rounded-full" />
                </div>

                {/* Header Section */}
                <ViewHeader
                    title={
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full scale-125" />
                                <div className="relative w-14 h-14 bg-slate-900 border border-white/5 rounded-[22px] flex items-center justify-center panel-3d shadow-2xl">
                                    <SatelliteIcon size={32} className="text-indigo-400 drop-shadow-[0_0_10px_rgba(79,70,229,0.8)]" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none font-display">
                                    {localLocales.title.split(' ')[0]} <span className="text-indigo-400">{localLocales.title.split(' ').slice(1).join(' ')}</span>
                                </h1>
                                <div className="flex items-center gap-3 mt-3">
                                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] font-black tracking-widest px-3 py-1 uppercase rounded-full">
                                        v55.0 {localLocales.status}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isConnected ? "bg-emerald-500" : "bg-rose-500")} />
                                        <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">{localLocales.gridSync}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                    icon={<Satellite size={22} className="text-indigo-400" />}
                    breadcrumbs={['ЦИТАДЕЛЬ', 'ГОЛОВНИЙ ЕКРАН', 'v55.GEN']}
                    stats={[
                        { label: localLocales.stats.score, value: '94%', icon: <ShieldCheck size={14} />, color: 'primary' },
                        { label: localLocales.stats.uptime, value: formatUptime(uptime), icon: <Clock size={14} />, color: 'success' },
                        { label: localLocales.stats.load, value: `${systemMetrics.network?.ingress || '42.8'} GB/s`, icon: <Activity size={14} />, color: 'purple' },
                    ]}
                />

                {/* Main KPI Matrix */}
                <div className="grid grid-cols-12 gap-10 relative z-10">

                    {/* Left Columns: Engines & Charts */}
                    <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">

                        {/* Analytical Engines Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
                            {ENGINES.map((eng, i) => <EngineMetric key={eng.id} engine={eng} index={i} />)}
                        </div>

                        {/* Global CERS 5-Layer Visualization */}
                        <Cers5LayerGauge
                            factors={{
                                behavioral: (ENGINES.find(e => e.id === 'behavioral')?.score || 0) / 100,
                                institutional: (ENGINES.find(e => e.id === 'institutional')?.score || 0) / 100,
                                influence: (ENGINES.find(e => e.id === 'influence')?.score || 0) / 100,
                                structural: (ENGINES.find(e => e.id === 'structural')?.score || 0) / 100,
                                predictive: (ENGINES.find(e => e.id === 'predictive')?.score || 0) / 100,
                            }}
                            totalScore={0.94}
                            className="bg-slate-900/20 p-8 rounded-[40px] border border-white/5"
                        />

                        {/* Central Intelligence Matrix (Chart) */}
                        <TacticalCard variant="holographic" className="p-10 h-[500px] flex flex-col relative overflow-hidden group/chart border-indigo-500/10">
                            <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{localLocales.sections.flux}</h3>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">{localLocales.sections.fluxSub}</p>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ПОТОК_БАЛ</span>
                                        <span className="text-xl font-black text-indigo-400 font-mono">94.2</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">РИЗИК_ОРІЄНТОВАНИЙ</span>
                                        <span className="text-xl font-black text-rose-400 font-mono">0.084</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 relative z-10">
                                <ReactECharts option={historyOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                            <div className="absolute bottom-10 left-10 right-10 flex gap-4 z-10">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                            </div>
                        </TacticalCard>

                        {/* Bottom Row: Pipeline & Heatmap */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <TacticalCard variant="glass" className="p-8 group overflow-hidden border-rose-500/10 hover:border-rose-500/20">
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                                    <Radar size={18} className="text-rose-400 animate-spin-slow" /> {localLocales.sections.riskMap}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {RISK_Sectors.map((sector, i) => <RiskTile key={i} data={sector} />)}
                                </div>
                            </TacticalCard>

                            <TacticalCard variant="glass" className="p-8 group overflow-hidden border-emerald-500/10 hover:border-emerald-500/20">
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                                    <RefreshCw size={18} className="text-emerald-400 h-animation-pulse" /> {localLocales.sections.pipeline}
                                </h3>
                                <div className="space-y-6">
                                    {[
                                        { step: localLocales.steps.ingestion, progress: 100, status: 'ГОТОВО', color: '#10b981' },
                                        { step: localLocales.steps.vectorization, progress: 84, status: 'ОБРОБКА', color: '#06b6d4' },
                                        { step: localLocales.steps.graph, progress: 62, status: 'СИНХРОН', color: '#8b5cf6' },
                                        { step: localLocales.steps.validation, progress: 12, status: 'ЧЕРГА', color: '#f59e0b' },
                                    ].map((p, i) => (
                                        <div key={i} className="p-5 bg-black/40 border border-white/5 rounded-2xl group/p hover:bg-black/60 transition-all">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] font-black text-slate-300 uppercase">{p.step}</span>
                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-lg border" style={{ color: p.color, borderColor: `${p.color}30`, background: `${p.color}10` }}>{p.status}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }} animate={{ width: `${p.progress}%` }}
                                                    className="h-full shadow-[0_0_10px_currentColor]"
                                                    style={{ backgroundColor: p.color, color: p.color }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TacticalCard>
                        </div>
                    </div>

                    {/* Right Column: Neural Core & Feed */}
                    <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">

                        {/* Neural Core Centerpiece */}
                        <TacticalCard variant="holographic" className="p-0 h-[600px] bg-slate-950/60 overflow-hidden relative border-indigo-500/20">
                            <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
                            <div className="absolute top-8 left-8 z-20">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{localLocales.sections.neuralFeed}</h3>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{localLocales.sections.neuralSub}</p>
                            </div>
                            <div className="relative h-full w-full z-10">
                                <NeuralCore data={{
                                    categories: [
                                        { label: 'Сутності', count: 124000, color: '#3b82f6' },
                                        { label: 'Ризики', count: 840, color: '#f43f5e' },
                                        { label: 'Аномалії', count: 12, color: '#f59e0b' }
                                    ]
                                }} />
                            </div>
                            <div className="absolute bottom-10 left-10 z-20">
                                <CyberOrb size={80} color="#6366f1" />
                            </div>
                        </TacticalCard>

                        {/* AI Agents Fleet */}
                        <TacticalCard variant="glass" className="p-8 h-full flex flex-col border-indigo-500/10">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                                <Bot size={18} className="text-indigo-400" /> {localLocales.sections.agentFleet}
                            </h3>
                            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {AGENTS.map((agent, i) => (
                                    <div key={i} className="p-5 bg-slate-900/60 border border-white/5 rounded-[24px] panel-3d group/a hover:border-indigo-500/30 transition-all flex items-center gap-6">
                                        <div className="w-14 h-14 bg-black border border-white/5 rounded-2xl flex items-center justify-center relative shadow-inner">
                                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-0 group-hover/a:opacity-100 transition-opacity" />
                                            <Cpu size={24} className="text-slate-500 group-hover/a:text-indigo-400 transition-all" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[11px] font-black text-white uppercase">{agent.name}</span>
                                                <span className="text-[8px] font-black text-indigo-400 font-mono italic">#{agent.state}</span>
                                            </div>
                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">{agent.role}</div>
                                            <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${agent.load}%` }} className="h-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* System Messages Feed */}
                            <div className="mt-8 p-6 bg-black/40 border border-white/5 rounded-[32px] font-mono text-[9px] text-slate-500 space-y-3 h-[250px] overflow-y-auto custom-scrollbar shadow-inner">
                                <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Terminal size={12} /> {localLocales.sections.logs}
                                </h4>
                                {SYSTEM_LOGS.map((log, i) => (
                                    <div key={i} className="flex gap-3 h-fit group/log">
                                        <span className="text-indigo-500/50 group-hover/log:text-indigo-400 transition-colors">{'>>>'}</span>
                                        <span className="group-hover/log:text-slate-300 transition-colors">{log.split('>>> ')[1]}</span>
                                    </div>
                                ))}
                                <div className="text-indigo-500 animate-pulse">_</div>
                            </div>
                        </TacticalCard>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .panel-3d {
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .panel-3d:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 40px 80px -15px rgba(0, 0, 0, 0.7);
                    }
                    .h-animation-pulse {
                        animation: h-pulse 2s infinite ease-in-out;
                    }
                    @keyframes h-pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.6; transform: scale(0.95); }
                    }
                    .animate-spin-slow {
                        animation: spin 8s linear infinite;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}} />
            </div>
        </PageTransition>
    );
};

// Internal icons
const SatelliteIcon = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 7 9 3 5 7l4 4Z" />
        <path d="m17 11 4 4-4 4-4-4Z" />
        <path d="m4.5 15.5 2 2" />
        <path d="m8.5 19.5 2 2" />
        <path d="M2 8A7.4 7.4 0 0 1 9 1" />
        <path d="M11 23a7.4 7.4 0 0 1 7-7" />
    </svg>
);

export default DashboardView;
