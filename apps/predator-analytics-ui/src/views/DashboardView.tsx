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

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Shield, TrendingUp, AlertTriangle, Layers, Zap, Clock,
    ChevronRight, Globe, Database, Server, Cpu, ArrowUpRight, ArrowDownRight,
    Sparkles, Brain, Target, Eye, Network, BarChart3, Radio, Crosshair,
    RefreshCw, CheckCircle, XCircle, AlertCircle, Flame, Bot, Waves,
    TrendingDown, Lock, ShieldCheck, Radar, Satellite, Box, EyeOff,
    Minimize2, Maximize2, Terminal, Search
} from 'lucide-react';

import { useAppStore } from '../store/useAppStore';
import { useOmniscienceWS } from '../hooks/useOmniscienceWS';
import { api } from '../services/api';
import { cn } from '../utils/cn';
import { premiumLocales } from '../locales/uk/premium';

/** Components */
import { TacticalCard } from '../components/TacticalCard';
import { NeuralCore } from '../components/NeuralCore';
import { CyberOrb } from '../components/CyberOrb';
import { HoloContainer } from '../components/HoloContainer';
import { ViewHeader } from '../components/ViewHeader';

// === КОНСТАНТИ ТА ДАНІ ===

const ENGINES = [
    { id: 'behavioral', name: 'Поведінковий', icon: Brain, color: '#8b5cf6', score: 87, trend: '+2.3%', status: 'ACTIVE' },
    { id: 'institutional', name: 'Інституційний', icon: Globe, color: '#06b6d4', score: 92, trend: '+0.8%', status: 'ACTIVE' },
    { id: 'influence', name: 'Вплив/Мережа', icon: Network, color: '#f59e0b', score: 74, trend: '-1.2%', status: 'ACTIVE' },
    { id: 'structural', name: 'Структурний', icon: Layers, color: '#10b981', score: 96, trend: '+4.1%', status: 'ACTIVE' },
    { id: 'predictive', name: 'Предиктивний', icon: Waves, color: '#ec4899', score: 81, trend: '+1.7%', status: 'ACTIVE' },
    { id: 'cers', name: 'CERS Оцінка', icon: ShieldCheck, color: '#f43f5e', score: 69, trend: '-0.5%', status: 'CALIBRATING' },
];

const RISK_Sectors = [
    { label: 'Фін. Сектор', risk: 78, level: 'CRITICAL' },
    { label: 'Логістика', risk: 54, level: 'WARNING' },
    { label: 'Нерухомість', risk: 61, level: 'WARNING' },
    { label: 'Енергетика', risk: 32, level: 'STABLE' },
    { label: 'IT/Телеком', risk: 23, level: 'STABLE' },
    { label: 'Будівництво', risk: 83, level: 'CRITICAL' },
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
            <div className="text-[8px] font-black uppercase opacity-60 tracking-widest">Risk Index</div>
        </div>
    </div>
);

// === ГОЛОВНИЙ КОМПОНЕНТ ===

const SmartDashboard: React.FC = () => {
    const { persona } = useAppStore();
    const { data: wsData, isConnected } = useOmniscienceWS();
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
        <div className="p-10 space-y-10 animate-in fade-in zoom-in-95 duration-700">

            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-600/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-600/5 blur-[150px] rounded-full" />
            </div>

            {/* Header Section */}
            <ViewHeader
                title={
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-full scale-125" />
                            <div className="relative w-14 h-14 bg-slate-900 border border-white/5 rounded-[22px] flex items-center justify-center panel-3d shadow-2xl">
                                <Satellite size={32} className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none font-display">
                                Situation <span className="text-blue-400">Command Center</span>
                            </h1>
                            <div className="flex items-center gap-3 mt-3">
                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] font-black tracking-widest px-3 py-1 uppercase">
                                    v55.0 SOVEREIGN_PROTOCOL_ACTIVE
                                </Badge>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">Global_Grid_Sync: OK</span>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                stats={[
                    { label: 'Sovereign Score', value: '94%', icon: <ShieldCheck size={14} />, color: 'primary' },
                    { label: 'Uptime', value: formatUptime(uptime), icon: <Clock size={14} />, color: 'success' },
                    { label: 'Network Load', value: '42.8 GB/s', icon: <Activity size={14} />, color: 'purple' },
                ]}
            />

            {/* Main KPI Matrix */}
            <div className="grid grid-cols-12 gap-10">

                {/* Left Columns: Engines & Charts */}
                <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">

                    {/* Analytical Engines Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
                        {ENGINES.map((eng, i) => <EngineMetric key={eng.id} engine={eng} index={i} />)}
                    </div>

                    {/* Central Intelligence Matrix (Chart) */}
                    <TacticalCard variant="holographic" className="p-10 h-[500px] flex flex-col relative overflow-hidden group/chart">
                        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Sovereign Matrix Flux</h3>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Realtime_Historical_Propagation</p>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">CURRENT_SCORE</span>
                                    <span className="text-xl font-black text-blue-400 font-mono">94.2</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">RISK_ADJUSTED</span>
                                    <span className="text-xl font-black text-rose-400 font-mono">0.084</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative z-10">
                            <ReactECharts option={historyOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                        <div className="absolute bottom-10 left-10 right-10 flex gap-4 z-10">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                        </div>
                    </TacticalCard>

                    {/* Bottom Row: Pipeline & Heatmap */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <TacticalCard variant="glass" className="p-8 group overflow-hidden">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                                <Radar size={18} className="text-rose-400" /> Regional Risk Heatmap
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {RISK_Sectors.map((sector, i) => <RiskTile key={i} data={sector} />)}
                            </div>
                        </TacticalCard>

                        <TacticalCard variant="glass" className="p-8 group overflow-hidden">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                                <RefreshCw size={18} className="text-emerald-400" /> Pipeline Synchronization
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { step: 'Data Ingestion', progress: 100, status: 'DONE', color: '#10b981' },
                                    { step: 'Neural Vectorization', progress: 84, status: 'PROCESSING', color: '#06b6d4' },
                                    { step: 'Knowledge Graph Updates', progress: 62, status: 'SYNCING', color: '#8b5cf6' },
                                    { step: 'CERS Validation', progress: 12, status: 'QUEUE', color: '#f59e0b' },
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
                    <TacticalCard variant="holographic" className="p-0 h-[600px] bg-slate-950/60 overflow-hidden relative">
                        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
                        <div className="absolute top-8 left-8 z-20">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Neural Intelligence Feed</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">ACTIVE_CORE_PROPAGATION</p>
                        </div>
                        <div className="relative h-full w-full z-10">
                            <NeuralCore data={{
                                categories: [
                                    { label: 'Entities', count: 124000, color: '#3b82f6' },
                                    { label: 'Risks', count: 840, color: '#f43f5e' },
                                    { label: 'Anomalies', count: 12, color: '#f59e0b' }
                                ]
                            }} />
                        </div>
                        <div className="absolute bottom-10 left-10 z-20">
                            <CyberOrb size={80} color="#06b6d4" />
                        </div>
                    </TacticalCard>

                    {/* AI Agents Fleet */}
                    <TacticalCard variant="glass" className="p-8 h-full flex flex-col">
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                            <Bot size={18} className="text-indigo-400" /> Sovereign AI Fleet
                        </h3>
                        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {[
                                { name: 'Architect-v55', role: 'System Architect', state: 'Optimal', load: 42 },
                                { name: 'Hunter-v55', role: 'Risk Seeker', state: 'Hunting', load: 88 },
                                { name: 'Vibe-Coder', role: 'Interface Flux', state: 'Evolving', load: 12 },
                                { name: 'Truth-Keeper', role: 'Ledger Audit', state: 'Stable', load: 35 },
                            ].map((agent, i) => (
                                <div key={i} className="p-5 bg-slate-900/60 border border-white/5 rounded-[24px] panel-3d group/a hover:border-blue-500/30 transition-all flex items-center gap-6">
                                    <div className="w-14 h-14 bg-black border border-white/5 rounded-2xl flex items-center justify-center relative shadow-inner">
                                        <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover/a:opacity-100 transition-opacity" />
                                        <Cpu size={24} className="text-slate-500 group-hover/a:text-blue-400 transition-all" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-black text-white uppercase">{agent.name}</span>
                                            <span className="text-[8px] font-black text-blue-400 font-mono italic">#{agent.state}</span>
                                        </div>
                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">{agent.role}</div>
                                        <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${agent.load}%` }} className="h-full bg-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* System Messages Feed */}
                        <div className="mt-8 p-6 bg-black/40 border border-white/5 rounded-[32px] font-mono text-[9px] text-slate-500 space-y-3 h-[250px] overflow-y-auto custom-scrollbar">
                            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Terminal size={12} /> Neural Stream Logs
                            </h4>
                            {[
                                '>>> SYNCING_GLOBAL_TAXONOMY_NODES...',
                                '>>> VALIDATING_CERS_COEFFICIENTS: OK',
                                '>>> AZ_REVOLUTION: OPTIMIZATION_WINDOW_FOUND',
                                '>>> WARNING: DEVIATION_IN_TRANSIT_FLUX_7%',
                                '>>> BOT_HUNTER-v55: NEW_ANOMALY_TRACKED_ID_882',
                                '>>> CORE_MATRIX: LOAD_BALANCING_COMPLETE',
                                '>>> SYS: ORBITAL_LINK_ESTABLISHED_THROUGH_M3_STATION',
                            ].map((log, i) => (
                                <div key={i} className="flex gap-3 h-fit group/log">
                                    <span className="text-blue-500/50 group-hover/log:text-blue-400 transition-colors">>>></span>
                                    <span className="group-hover/log:text-slate-300 transition-colors">{log.split('>>> ')[1]}</span>
                                </div>
                            ))}
                            <div className="text-blue-500 animate-pulse">_</div>
                        </div>
                    </TacticalCard>
                </div>
            </div>
        </div>
    );
};

export default SmartDashboard;
