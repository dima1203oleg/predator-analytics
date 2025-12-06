import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine } from 'recharts';
import {
    Activity, ShieldCheck, Zap, AlertOctagon, LayoutDashboard,
    Server, ShieldAlert, BrainCircuit, Thermometer, Hexagon, Crosshair,
    RotateCcw, Lock, Radio, Network, Wifi, Layers, Cpu, Terminal, AlertTriangle
} from 'lucide-react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { useAgents } from '../context/AgentContext';
import { useGlobalState } from '../context/GlobalContext';
import { useSuperIntelligence } from '../context/SuperIntelligenceContext';
import { api } from '../services/api';
import { useSoundFx } from '../hooks/useSoundFx';

interface DashboardMetrics {
    processed: number;
    activeAgents: number;
    threats: number;
    health: number;
}

const THREAT_RADAR_DATA = [
    { subject: 'DDoS', A: 65, fullMark: 100 },
    { subject: 'SQLi', A: 30, fullMark: 100 },
    { subject: 'Phishing', A: 80, fullMark: 100 },
    { subject: 'Malware', A: 45, fullMark: 100 },
    { subject: 'Zero-Day', A: 20, fullMark: 100 },
    { subject: 'Brute', A: 55, fullMark: 100 },
];

// AI Insights Rotation
const AI_INSIGHTS = [
    "Аналіз патернів трафіку: НОРМАЛЬНИЙ",
    "Прогнозування навантаження: пік о 18:00 (+15%)",
    "Оптимізація кешу Redis: завершено (економія 120ms)",
    "Моніторинг загроз: сканування підмережі 10.0.x.x",
    "Gemini 3: контекстне вікно оновлено",
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 border border-slate-500/50 p-3 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-1">
                    <Crosshair size={12} className="text-primary-400" />
                    <p className="text-[10px] text-primary-400 font-mono uppercase tracking-wider">{label}</p>
                </div>
                {payload.map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 text-xs font-bold justify-between">
                        <span className="text-slate-300 uppercase text-[9px]">{p.name}:</span>
                        <span className="font-mono text-white text-shadow-sm" style={{ color: p.color }}>{p.value.toFixed(1)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Holographic Container Wrapper - v20 Enhanced
const HoloContainer: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`relative ${className} group overflow-hidden border border-primary-500/20 rounded-lg bg-[#0a0f1c]/50`}>
        {/* Holographic grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(6,182,212,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_3px,3px_100%] pointer-events-none z-10 opacity-30"></div>

        {/* Scanning beam */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-400/50 to-transparent animate-scanline opacity-30 z-20 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>

        {/* Corner Accents (Cyberpunk Style) */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary-500 z-20 shadow-[0_0_8px_#06b6d4]"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary-500 z-20 shadow-[0_0_8px_#06b6d4]"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary-500 z-20 shadow-[0_0_8px_#06b6d4]"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary-500 z-20 shadow-[0_0_8px_#06b6d4]"></div>

        {children}
    </div>
);

const DashboardView: React.FC = () => {
    const metrics = useSystemMetrics();
    const { agents } = useAgents();
    const { state, setDefcon } = useGlobalState();
    const { isActive: isGodMode, stage: godStage } = useSuperIntelligence();
    const { play } = useSoundFx();

    const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
        processed: 124.5,
        activeAgents: 0,
        threats: 3,
        health: 98,
    });

    const [trafficData, setTrafficData] = useState(
        Array.from({ length: 40 }, (_, i) => ({
            time: `${10 + Math.floor(i / 60)}:${(30 + i) % 60}`,
            ingress: 20,
            egress: 10,
            latency: 15,
            errors: 0
        }))
    );

    const [overclock, setOverclock] = useState(0);
    const [chartMode, setChartMode] = useState<'TRAFFIC' | 'LATENCY' | 'ERRORS'>('TRAFFIC');
    const [currentInsight, setCurrentInsight] = useState(AI_INSIGHTS[0]);

    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;

        // Cycle AI Insights
        const insightInterval = setInterval(() => {
            setCurrentInsight(AI_INSIGHTS[Math.floor(Math.random() * AI_INSIGHTS.length)]);
        }, 4000);

        return () => {
            isMounted.current = false;
            clearInterval(insightInterval);
        };
    }, []);

    useEffect(() => {
        const activeCount = agents.filter(a => a.status === 'WORKING' || a.status === 'ACTIVE').length;
        setDashboardMetrics(prev => ({
            ...prev,
            activeAgents: activeCount,
            threats: state.activeThreats
        }));
    }, [agents, state.activeThreats]);

    // Sync Data
    useEffect(() => {
        setTrafficData(prev => {
            const newTime = new Date();
            const chaosFactor = isGodMode ? (Math.random() * 200) : 0;
            const ocFactor = overclock * 2;

            const newItem = {
                time: `${newTime.getHours()}:${newTime.getMinutes()}:${newTime.getSeconds()}`,
                ingress: metrics.network.ingress + (state.networkTraffic / 10) + chaosFactor + ocFactor + (Math.random() * 20),
                egress: metrics.network.egress + (state.networkTraffic / 5) + (chaosFactor * 0.8) + ocFactor + (Math.random() * 10),
                latency: 10 + (Math.random() * 20) + (overclock > 80 ? 50 : 0),
                errors: overclock > 90 ? Math.random() * 10 : 0
            };
            return [...prev.slice(1), newItem];
        });
    }, [metrics, state.networkTraffic, isGodMode, overclock]);

    const getDefconColor = (level: number) => {
        if (level === 1) return 'bg-red-600 shadow-[0_0_20px_red]';
        if (level === 2) return 'bg-orange-500 shadow-[0_0_15px_orange]';
        if (level === 3) return 'bg-yellow-500 shadow-[0_0_10px_yellow]';
        return 'bg-green-500 shadow-[0_0_10px_green]';
    };

    const mainColor = isGodMode ? '#a855f7' : chartMode === 'ERRORS' ? '#ef4444' : chartMode === 'LATENCY' ? '#eab308' : '#0ea5e9';
    const secondaryColor = isGodMode ? '#d946ef' : '#06b6d4';

    // Dynamic Styles for DEFCON 1
    const isCritical = state.defconLevel === 1;
    const criticalBorder = isCritical ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-slate-800';

    return (
        <div className={`space-y-6 animate-in fade-in duration-500 pb-24 md:pb-6 w-full max-w-[1600px] mx-auto ${isGodMode ? 'contrast-125 brightness-110' : ''}`}>

            {/* GLOBAL ALERT OVERLAY */}
            {isCritical && (
                <div className="fixed inset-0 pointer-events-none z-0 border-[4px] border-red-500/20 animate-pulse">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white font-bold px-6 py-2 rounded-b-xl shadow-2xl animate-bounce">
                        ⚠ DEFCON 1: БЛОКУВАННЯ АКТИВОВАНЕ ⚠
                    </div>
                </div>
            )}

            {/* GOD MODE STATUS BAR */}
            {isGodMode && (
                <div className="bg-purple-950/40 border-y border-purple-500/50 p-2 flex items-center justify-between animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.2)] backdrop-blur-md sticky top-14 z-20">
                    <div className="flex items-center gap-4 px-4">
                        <BrainCircuit size={18} className="text-purple-400 animate-spin-slow" />
                        <span className="text-xs font-display font-bold text-purple-200 tracking-[0.2em] uppercase">Super-Intelligence Override</span>
                    </div>
                    <div className="text-[10px] font-mono text-purple-300 px-4">
                        ФАЗА: {godStage.replace('_', ' ')}
                    </div>
                </div>
            )}

            <ViewHeader
                title="Ситуаційна Кімната (War Room)"
                icon={<LayoutDashboard size={20} className={isGodMode ? "text-purple-400 icon-3d-purple" : "icon-3d-blue"} />}
                breadcrumbs={['КОМАНДУВАННЯ', 'СИТУАЦІЙНИЙ ЦЕНТР', 'НАЖИВО']}
                stats={[
                    { label: 'DEFCON', value: `РІВЕНЬ ${state.defconLevel}`, icon: <ShieldAlert size={14} />, color: state.defconLevel <= 2 ? 'danger' : 'warning', animate: state.defconLevel <= 2 },
                    { label: 'Агенти', value: `${dashboardMetrics.activeAgents} АКТ`, icon: <Server size={14} />, color: 'primary' },
                    { label: 'CPU Load', value: `${metrics.cpu.toFixed(1)}%`, icon: <Activity size={14} />, color: metrics.cpu > 80 ? 'danger' : 'success' },
                ]}
            />

            {/* 1. TOP ROW: CRITICAL METRICS & CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* A. CLUSTER VISUAL TOPOLOGY (3 Cols) */}
                <div className="md:col-span-3">
                    <TacticalCard title="Топологія Кластера" className={`h-full panel-3d ${criticalBorder}`} noPadding>
                        <div className="p-4 h-full flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Grid Background */}
                            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

                            {/* Nodes */}
                            <div className="relative w-full h-full flex items-center justify-center min-h-[200px]">
                                {/* Master Node */}
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                                    <div className="w-10 h-10 bg-slate-900 border-2 border-blue-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_blue] animate-pulse">
                                        <Server size={20} className="text-blue-400" />
                                    </div>
                                    <span className="text-[9px] font-bold text-blue-400 mt-1 bg-black/50 px-1 rounded">MASTER</span>
                                </div>

                                {/* Connections */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <line x1="50%" y1="20%" x2="25%" y2="60%" stroke="#334155" strokeWidth="2" />
                                    <line x1="50%" y1="20%" x2="75%" y2="60%" stroke="#334155" strokeWidth="2" />
                                    {/* Moving Packets */}
                                    <circle r="3" fill="#3b82f6">
                                        <animateMotion dur="2s" repeatCount="indefinite" path="M 50% 20% L 25% 60%" />
                                    </circle>
                                    <circle r="3" fill="#a855f7">
                                        <animateMotion dur="3s" repeatCount="indefinite" path="M 75% 60% L 50% 20%" />
                                    </circle>
                                </svg>

                                {/* Worker 1 */}
                                <div className="absolute bottom-8 left-[15%] flex flex-col items-center z-10">
                                    <div className="w-8 h-8 bg-slate-900 border border-slate-600 rounded flex items-center justify-center">
                                        <Cpu size={16} className="text-slate-400" />
                                    </div>
                                    <span className="text-[9px] text-slate-500 mt-1">WORKER-1</span>
                                </div>

                                {/* GPU Node */}
                                <div className="absolute bottom-8 right-[15%] flex flex-col items-center z-10">
                                    <div className="w-8 h-8 bg-purple-900/20 border border-purple-500 rounded flex items-center justify-center shadow-[0_0_10px_purple]">
                                        <Zap size={16} className="text-purple-400" />
                                    </div>
                                    <span className="text-[9px] text-purple-400 mt-1 font-bold">GPU-A100</span>
                                </div>
                            </div>
                        </div>
                    </TacticalCard>
                </div>

                {/* B. AGENT SWARM GRID (5 Cols) */}
                <div className="md:col-span-6">
                    <TacticalCard title="Активний Рій Агентів (Hex-Grid)" className={`h-full panel-3d ${criticalBorder}`} noPadding>
                        <div className="p-4 h-full relative overflow-hidden min-h-[200px]">
                            <div className="absolute inset-0 flex flex-wrap gap-1 opacity-20 pointer-events-none p-2">
                                {Array.from({ length: 40 }).map((_, i) => (
                                    <Hexagon key={i} size={24} className="text-slate-700" strokeWidth={1} />
                                ))}
                            </div>

                            <div className="relative z-10 flex flex-wrap content-start gap-2 h-full">
                                {agents.map((agent, i) => (
                                    <div
                                        key={agent.id}
                                        className={`
                                    relative w-10 h-10 flex items-center justify-center transition-all duration-500
                                    ${agent.status === 'WORKING' ? 'scale-110' : 'scale-100 opacity-60'}
                                `}
                                        title={`${agent.name}: ${agent.lastAction}`}
                                    >
                                        <Hexagon
                                            size={40}
                                            className={`
                                        fill-slate-950 stroke-2 transition-colors duration-300
                                        ${agent.status === 'WORKING' ? 'stroke-yellow-500 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'stroke-slate-700 text-slate-700'}
                                    `}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Zap size={14} className={agent.status === 'WORKING' ? 'text-white animate-pulse' : 'text-slate-600'} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TacticalCard>
                </div>

                {/* C. OVERCLOCK CONTROL (3 Cols) */}
                <div className="md:col-span-3">
                    <TacticalCard title="Розгін Системи (Overdrive)" className={`h-full panel-3d bg-gradient-to-b from-slate-900 to-slate-950 ${criticalBorder}`} noPadding>
                        <div className="p-4 flex flex-col items-center justify-center h-full gap-4 min-h-[200px]">
                            <div className="relative w-full h-12 bg-slate-950 rounded-lg border border-slate-800 shadow-inner flex items-center px-2">
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-900/20 to-red-900/40 transition-all duration-100 rounded-lg"
                                    style={{ width: `${overclock}%` }}
                                ></div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={overclock}
                                    onChange={(e) => setOverclock(Number(e.target.value))}
                                    className="w-full h-full opacity-0 cursor-pointer absolute z-20"
                                />
                                <div className="w-full flex justify-between items-center relative z-10 px-2 pointer-events-none">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Idle</span>
                                    <span className={`text-lg font-display font-bold ${overclock > 80 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                                        {overclock}%
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Max</span>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full">
                                <button onClick={() => setOverclock(0)} className="flex-1 py-2 bg-slate-800 rounded border border-slate-700 text-[10px] font-bold text-slate-400 hover:text-white transition-colors">SAFE</button>
                                <button onClick={() => setOverclock(100)} className="flex-1 py-2 bg-red-900/20 rounded border border-red-900/50 text-[10px] font-bold text-red-500 hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1">
                                    <Zap size={10} /> BOOST
                                </button>
                            </div>
                        </div>
                    </TacticalCard>
                </div>
            </div>

            {/* 2. MAIN VISUALIZATION: TRAFFIC HUD + AI OVERLAY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TacticalCard
                        title={chartMode === 'TRAFFIC' ? "Глобальне Перехоплення (Трафік)" : chartMode === 'LATENCY' ? "Карта Затримок Мережі" : "Монітор Помилок"}
                        className={`h-[350px] panel-3d transition-colors duration-500 ${isCritical ? 'border-red-500/50' : chartMode === 'ERRORS' ? 'border-red-500/30' : 'border-primary-500/30'}`}
                        glow={isGodMode ? 'purple' : chartMode === 'ERRORS' ? 'red' : 'blue'}
                        action={
                            <div className="flex gap-1 bg-slate-900/50 p-1 rounded border border-slate-800">
                                <button onClick={() => { play('CLICK'); setChartMode('TRAFFIC'); }} className={`p-1.5 rounded transition-all ${chartMode === 'TRAFFIC' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Network size={14} /></button>
                                <button onClick={() => { play('CLICK'); setChartMode('LATENCY'); }} className={`p-1.5 rounded transition-all ${chartMode === 'LATENCY' ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Activity size={14} /></button>
                                <button onClick={() => { play('CLICK'); setChartMode('ERRORS'); }} className={`p-1.5 rounded transition-all ${chartMode === 'ERRORS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><ShieldAlert size={14} /></button>
                            </div>
                        }
                    >
                        <HoloContainer className="w-full h-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trafficData}>
                                    <defs>
                                        <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={mainColor} stopOpacity={0.6} />
                                            <stop offset="95%" stopColor={mainColor} stopOpacity={0} />
                                        </linearGradient>
                                        <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                        </pattern>
                                    </defs>
                                    <rect x="0" y="0" width="100%" height="100%" fill="url(#gridPattern)" />

                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: mainColor, strokeWidth: 1, strokeDasharray: '5 5' }} />

                                    <ReferenceLine y={chartMode === 'LATENCY' ? 50 : 100} stroke="rgba(239,68,68,0.5)" strokeDasharray="3 3" label={{ value: 'THRESHOLD', position: 'insideTopRight', fill: 'red', fontSize: 10 }} />

                                    {chartMode === 'TRAFFIC' && (
                                        <>
                                            <Area type="monotone" dataKey="ingress" stroke={mainColor} strokeWidth={2} fill="url(#colorMain)" isAnimationActive={false} />
                                            <Area type="monotone" dataKey="egress" stroke={secondaryColor} strokeWidth={2} fill="transparent" isAnimationActive={false} strokeDasharray="3 3" />
                                        </>
                                    )}

                                    {chartMode === 'LATENCY' && (
                                        <Area type="step" dataKey="latency" stroke="#eab308" strokeWidth={2} fill="url(#colorMain)" isAnimationActive={false} />
                                    )}

                                    {chartMode === 'ERRORS' && (
                                        <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} fill="url(#colorMain)" isAnimationActive={false} />
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>

                            {/* AI INSIGHT FEED OVERLAY */}
                            <div className="absolute top-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md border border-primary-500/30 rounded-lg p-2 flex items-center gap-3 animate-in slide-in-from-left-4 max-w-[200px] md:max-w-md">
                                <div className="w-8 h-8 rounded bg-primary-900/20 flex items-center justify-center text-primary-400 border border-primary-500/50">
                                    <Terminal size={16} />
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1">
                                        <BrainCircuit size={10} /> Протокол AI
                                    </div>
                                    <div className="text-xs text-slate-200 font-mono typing-effect truncate">
                                        {currentInsight}
                                    </div>
                                </div>
                            </div>

                            {/* HUD Info */}
                            <div className="absolute top-2 right-2 text-[10px] font-mono text-primary-400 flex flex-col items-end pointer-events-none">
                                <span>MODE: {chartMode}</span>
                                <span>ENC: AES-256</span>
                                <span>LAT: {trafficData[trafficData.length - 1].latency.toFixed(0)}ms</span>
                            </div>
                        </HoloContainer>
                    </TacticalCard>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {/* Threat Radar */}
                    <TacticalCard title="Векторний Аналіз (Radar)" className={`h-[250px] panel-3d relative ${criticalBorder}`} noPadding>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={THREAT_RADAR_DATA}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Threat Level" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                        {state.defconLevel === 1 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-red-500 font-bold text-2xl animate-pulse bg-black/50 px-4 py-2 rounded border border-red-500 rotate-12">
                                    UNDER ATTACK
                                </div>
                            </div>
                        )}
                    </TacticalCard>

                    {/* Action Grid */}
                    <TacticalCard title="Швидкі Протоколи" className={`flex-1 panel-3d ${criticalBorder}`} noPadding>
                        <div className="grid grid-cols-2 gap-2 p-3">
                            <button
                                onClick={() => { play('CLICK'); }}
                                className="flex flex-col items-center justify-center p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-all active:scale-95 group"
                            >
                                <RotateCcw size={16} className="text-blue-500 mb-1 group-hover:rotate-180 transition-transform duration-500" />
                                <span className="text-[9px] font-bold text-slate-300">ОЧИСТИТИ КЕШ</span>
                            </button>
                            <button
                                onClick={() => { play('CLICK'); }}
                                className="flex flex-col items-center justify-center p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-all active:scale-95 group"
                            >
                                <Wifi size={16} className="text-yellow-500 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-bold text-slate-300">СКАН МЕРЕЖІ</span>
                            </button>
                            <button
                                onClick={() => { play('ALERT'); setDefcon(1); }}
                                className={`flex flex-col items-center justify-center p-2 border rounded transition-all active:scale-95 group col-span-2 ${isCritical ? 'bg-red-600 text-white border-red-500 animate-pulse' : 'bg-red-900/20 hover:bg-red-900/40 border-red-900/50'
                                    }`}
                            >
                                <Lock size={16} className={`mb-1 ${isCritical ? 'text-white' : 'text-red-500'}`} />
                                <span className={`text-[9px] font-bold ${isCritical ? 'text-white' : 'text-red-400'}`}>
                                    {isCritical ? 'БЛОКУВАННЯ АКТИВНЕ - ЗНЯТИ' : 'ЗАПУСТИТИ БЛОКУВАННЯ'}
                                </span>
                            </button>
                        </div>
                    </TacticalCard>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;