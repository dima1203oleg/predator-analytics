/**
 * 🦁 PREDATOR ANALYTICS — Global Situation Command Center (V55+)
 * ==========================================================
 * МАКСИМАЛЬНО ПОКРАЩЕНА ВЕРСІЯ ДАШБОРДУ
 * Нові секції: Аналітичні двигуни, теплова карта ризиків, пайплайн, AI сигнали
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Shield, TrendingUp, AlertTriangle, Layers, Zap, Clock,
    ChevronRight, Globe, Database, Server, Cpu, ArrowUpRight, ArrowDownRight,
    Sparkles, Brain, Target, Eye, Network, BarChart3, Radio, Crosshair,
    RefreshCw, CheckCircle, XCircle, AlertCircle, Flame, Bot, Waves,
    TrendingDown, Lock, ShieldCheck, Radar
} from 'lucide-react';

import { useAppStore } from '../store/useAppStore';
import { useOmniscienceWS } from '../hooks/useOmniscienceWS';
import { api } from '../services/api';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { premiumLocales } from '../locales/uk/premium';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────
const ENGINES = [
    { id: 'behavioral', name: 'Поведінковий', icon: Brain, color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', score: 87, trend: +2.3, status: 'ACTIVE' },
    { id: 'institutional', name: 'Інституційний', icon: Globe, color: '#06b6d4', glow: 'rgba(6,182,212,0.3)', score: 92, trend: +0.8, status: 'ACTIVE' },
    { id: 'influence', name: 'Вплив/Мережа', icon: Network, color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', score: 74, trend: -1.2, status: 'ACTIVE' },
    { id: 'structural', name: 'Структурний', icon: Layers, color: '#10b981', glow: 'rgba(16,185,129,0.3)', score: 96, trend: +4.1, status: 'ACTIVE' },
    { id: 'predictive', name: 'Предиктивний', icon: Waves, color: '#ec4899', glow: 'rgba(236,72,153,0.3)', score: 81, trend: +1.7, status: 'ACTIVE' },
    { id: 'cers', name: 'CERS Оцінка', icon: ShieldCheck, color: '#f97316', glow: 'rgba(249,115,22,0.3)', score: 69, trend: -0.5, status: 'CALIBRATING' },
];

const SIGNAL_TYPES = [
    { type: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
    { type: 'WARNING', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    { type: 'INFO', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)' },
    { type: 'SUCCESS', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

/** Glowing KPI Card */
const GlowMetricCard: React.FC<{
    title: string; value: string | number; trend?: string;
    trendType?: 'up' | 'down' | 'neutral'; icon: React.ReactNode;
    description?: string; accentColor: string; glowColor: string;
}> = ({ title, value, trend, trendType, icon, description, accentColor, glowColor }) => (
    <motion.div
        whileHover={{ scale: 1.03, translateY: -6 }}
        className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/70 backdrop-blur-xl cursor-default group"
        style={{ boxShadow: `0 0 0 1px ${glowColor}` }}
    >
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: `radial-gradient(circle at 50% 0%, ${glowColor} 0%, transparent 70%)` }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

        <div className="relative p-5">
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl border" style={{ background: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}>
                    {icon}
                </div>
                {trend && (
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1",
                        trendType === 'up' ? "bg-emerald-500/15 text-emerald-400" :
                            trendType === 'down' ? "bg-rose-500/15 text-rose-400" :
                                "bg-slate-500/15 text-slate-400"
                    )}>
                        {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trendType === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                        {trend}
                    </span>
                )}
            </div>
            <div className="text-3xl font-black tracking-tighter text-white mb-1">{value}</div>
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>{title}</div>
            {description && <p className="text-[10px] text-slate-500 mt-1.5 uppercase tracking-wider">{description}</p>}
        </div>
    </motion.div>
);

/** Engine Status Card */
const EngineCard: React.FC<{ engine: typeof ENGINES[0]; index: number }> = ({ engine, index }) => {
    const Icon = engine.icon;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            whileHover={{ scale: 1.02, translateY: -3 }}
            className="relative rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl overflow-hidden group cursor-pointer"
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 50% 100%, ${engine.glow} 0%, transparent 70%)` }} />
            <div className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${engine.color}, transparent)`, opacity: 0.6 }} />

            <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg" style={{ background: `${engine.color}15`, color: engine.color }}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-black text-slate-200 uppercase tracking-wider">{engine.name}</span>
                    </div>
                    <Badge className={cn("text-[8px] px-1.5 py-0.5 font-black",
                        engine.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                        {engine.status}
                    </Badge>
                </div>

                {/* Score bar */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${engine.score}%` }}
                            transition={{ duration: 1.2, delay: index * 0.1, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${engine.color}80, ${engine.color})` }}
                        />
                    </div>
                    <span className="text-sm font-black tabular-nums" style={{ color: engine.color }}>{engine.score}%</span>
                </div>

                <div className="flex items-center gap-1">
                    {engine.trend > 0
                        ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                        : <ArrowDownRight className="w-3 h-3 text-rose-400" />}
                    <span className={cn("text-[10px] font-bold", engine.trend > 0 ? 'text-emerald-400' : 'text-rose-400')}>
                        {engine.trend > 0 ? '+' : ''}{engine.trend}% за 24г
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

/** Risk Heatmap tile */
const RiskTile: React.FC<{ label: string; risk: number; count: number }> = ({ label, risk, count }) => {
    const color = risk > 70 ? '#ef4444' : risk > 40 ? '#f59e0b' : '#10b981';
    const bg = risk > 70 ? 'rgba(239,68,68,0.15)' : risk > 40 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.1)';
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative p-3 rounded-xl border cursor-pointer overflow-hidden"
            style={{ background: bg, borderColor: `${color}40` }}
        >
            <div className="absolute inset-0 opacity-30"
                style={{ background: `radial-gradient(circle at 50% 50%, ${color}20, transparent)` }} />
            <div className="relative">
                <div className="text-[9px] font-black uppercase tracking-widest mb-1 truncate" style={{ color }}>{label}</div>
                <div className="text-xl font-black tabular-nums" style={{ color }}>{risk}%</div>
                <div className="text-[9px] text-slate-500 font-mono">{count} об'єктів</div>
            </div>
        </motion.div>
    );
};

/** Pipeline stage */
const PipelineStage: React.FC<{ name: string; count: number; status: 'active' | 'idle' | 'error'; index: number }> = ({ name, count, status, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 group"
        >
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 transition-all",
                status === 'active' ? 'bg-emerald-500/10 border-emerald-500/30' :
                    status === 'error' ? 'bg-rose-500/10 border-rose-500/30' :
                        'bg-slate-900/60 border-slate-700/50'
            )}>
                <div className={cn("w-1.5 h-1.5 rounded-full",
                    status === 'active' ? 'bg-emerald-400 animate-pulse' :
                        status === 'error' ? 'bg-rose-400 animate-pulse' : 'bg-slate-600'
                )} />
                <span className="text-[11px] font-bold text-slate-300 flex-1">{name}</span>
                <span className={cn("text-[10px] font-black tabular-nums",
                    status === 'active' ? 'text-emerald-400' : status === 'error' ? 'text-rose-400' : 'text-slate-500'
                )}>{count.toLocaleString()}</span>
            </div>
            {index < 4 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
        </motion.div>
    );
};

/** Live signal feed item */
const SignalItem: React.FC<{ signal: any; index: number }> = ({ signal, index }) => {
    const config = SIGNAL_TYPES.find(s => s.type === signal.type) || SIGNAL_TYPES[2];
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl border transition-all hover:bg-white/5 group cursor-pointer"
            style={{ background: config.bg, borderColor: config.border }}
        >
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ background: config.color }} />
            <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-200 leading-tight truncate">{signal.message}</div>
                <div className="text-[9px] font-mono text-slate-500 mt-0.5">{signal.engine} • {signal.time}</div>
            </div>
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded shrink-0" style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}>
                {signal.type}
            </span>
        </motion.div>
    );
};

// ─── MOCK DATA GENERATORS ─────────────────────────────────────────────────────
const generateSignals = () => [
    { id: 1, type: 'CRITICAL', engine: 'Поведінковий', message: 'Аномальна транзакційна активність: ТОВ "АльфаТрейд"', time: '00:23' },
    { id: 2, type: 'WARNING', engine: 'Структурний', message: 'Зміна бенефіціарної структури: 3 компанії', time: '01:47' },
    { id: 3, type: 'INFO', engine: 'Предиктивний', message: 'Прогноз: ріст ризику в секторі логістики +12%', time: '03:15' },
    { id: 4, type: 'SUCCESS', engine: 'CERS', message: 'Калібрування завершено: точність моделі 94.3%', time: '05:02' },
    { id: 5, type: 'WARNING', engine: 'Вплив/Мережа', message: 'Виявлено нову мережу зв\'язків: 17 суб\'єктів', time: '07:33' },
    { id: 6, type: 'INFO', engine: 'Інституційний', message: 'Оновлення санкційних списків: +24 записи', time: '09:11' },
];

const RISK_MATRIX = [
    { label: 'Фін. Сектор', risk: 78, count: 342 },
    { label: 'Логістика', risk: 54, count: 1204 },
    { label: 'Нерухомість', risk: 61, count: 891 },
    { label: 'Енергетика', risk: 32, count: 567 },
    { label: 'IT/Телеком', risk: 23, count: 2341 },
    { label: 'Будівництво', risk: 83, count: 445 },
    { label: 'Медицина', risk: 19, count: 1123 },
    { label: 'АПК/Агро', risk: 41, count: 678 },
];

const PIPELINE_STAGES = [
    { name: 'Збір Даних', count: 48291, status: 'active' as const },
    { name: 'Нормалізація', count: 41820, status: 'active' as const },
    { name: 'Аналіз Двигунів', count: 38450, status: 'active' as const },
    { name: 'Векторизація', count: 31200, status: 'active' as const },
    { name: 'Індексація', count: 28940, status: 'active' as const },
];

// ─── MAIN CONTENT ──────────────────────────────────────────────────────────────
const DashboardCoreContent: React.FC<{ persona: string }> = ({ persona }) => {
    const [stats, setStats] = useState<any>(null);
    const [signals, setSignals] = useState(generateSignals());
    const intervalRef = useRef<any>(null);
    const [uptime, setUptime] = useState(0);

    const { data: wsData, isConnected } = useOmniscienceWS();

    useEffect(() => {
        const timer = setInterval(() => setUptime(p => p + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashStats, agentStats] = await Promise.allSettled([
                    api.premium.getDashboardStats(),
                    fetch('/api/v45/agents/status').then(r => r.json()),
                ]);
                setStats({
                    dash: dashStats.status === 'fulfilled' ? dashStats.value : null,
                    agents: agentStats.status === 'fulfilled' ? agentStats.value : [],
                });
            } catch (e) { /* silent */ }
        };
        fetchData();
        intervalRef.current = setInterval(fetchData, 20000);
        return () => clearInterval(intervalRef.current);
    }, []);

    // Real-time chart data
    const [chartData, setChartData] = useState(() =>
        Array.from({ length: 30 }, (_, i) => ({
            time: `${i}s`,
            score: 80 + Math.random() * 15,
            risk: 5 + Math.random() * 15,
            throughput: 35 + Math.random() * 20,
        }))
    );

    useEffect(() => {
        if (!wsData?.system) return;
        setChartData(prev => [...prev.slice(1), {
            time: new Date().toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            score: wsData.pulse?.score || 85 + Math.random() * 10,
            risk: 8 + Math.random() * 12,
            throughput: wsData.system.cpu_percent || 40 + Math.random() * 20,
        }]);
    }, [wsData]);

    const sovereigntyEChartOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: '#020617', borderColor: '#1e293b', textStyle: { color: '#f1f5f9' } },
        grid: { left: '2%', right: '2%', bottom: '2%', top: '8%', containLabel: true },
        xAxis: { type: 'category', data: chartData.map(d => d.time), axisLabel: { color: '#334155', fontSize: 9 }, axisLine: { show: false }, axisTick: { show: false } },
        yAxis: { type: 'value', min: 0, max: 100, splitLine: { lineStyle: { color: '#0f172a' } }, axisLabel: { color: '#334155', fontSize: 9 } },
        series: [
            {
                name: 'Суверенний Скор', type: 'line', smooth: true,
                data: chartData.map(d => d.score.toFixed(1)),
                itemStyle: { color: '#06b6d4' },
                lineStyle: { width: 2, color: '#06b6d4' },
                areaStyle: { opacity: 0.1, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: 'transparent' }] } },
                symbol: 'none',
            },
            {
                name: 'Ризик-Індекс', type: 'line', smooth: true,
                data: chartData.map(d => d.risk.toFixed(1)),
                itemStyle: { color: '#ec4899' },
                lineStyle: { width: 1.5, color: '#ec4899', type: 'dashed' },
                symbol: 'none',
            },
        ]
    }), [chartData]);

    const radarOption = useMemo(() => ({
        backgroundColor: 'transparent',
        radar: {
            indicator: ENGINES.map(e => ({ name: e.name, max: 100 })),
            center: ['50%', '50%'],
            radius: '70%',
            splitLine: { lineStyle: { color: '#1e293b' } },
            splitArea: { show: false },
            axisLine: { lineStyle: { color: '#1e293b' } },
            axisName: { color: '#64748b', fontSize: 9, fontWeight: 'bold' },
        },
        series: [{
            type: 'radar',
            data: [{
                value: ENGINES.map(e => e.score),
                name: 'Двигуни',
                areaStyle: { opacity: 0.2, color: 'rgba(6,182,212,0.3)' },
                lineStyle: { color: '#06b6d4', width: 2 },
                itemStyle: { color: '#06b6d4' },
            }],
        }],
        tooltip: { backgroundColor: '#020617', borderColor: '#1e293b', textStyle: { color: '#f1f5f9', fontSize: 11 } },
    }), []);

    const formatUptime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    return (
        <div className="space-y-8">
            {/* ─── TOP KPIs ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <GlowMetricCard
                    title="Суверенний Скор"
                    value={`${wsData?.pulse?.score ?? 94}%`}
                    icon={<Shield className="w-5 h-5" />}
                    accentColor="#06b6d4" glowColor="rgba(6,182,212,0.2)"
                    trend="+2.4%" trendType="up"
                    description="Рівень автономності ШІ"
                />
                <GlowMetricCard
                    title="Активних Двигунів"
                    value={`${ENGINES.filter(e => e.status === 'ACTIVE').length}/6`}
                    icon={<Brain className="w-5 h-5" />}
                    accentColor="#8b5cf6" glowColor="rgba(139,92,246,0.2)"
                    description="Аналітичні движки v55"
                />
                <GlowMetricCard
                    title="Сигналів за 24г"
                    value="1,847"
                    icon={<Radio className="w-5 h-5" />}
                    accentColor="#f59e0b" glowColor="rgba(245,158,11,0.2)"
                    trend="+18%" trendType="up"
                    description="Генерація & класифікація"
                />
                <GlowMetricCard
                    title="Аптайм системи"
                    value={formatUptime(uptime)}
                    icon={<Activity className="w-5 h-5" />}
                    accentColor="#10b981" glowColor="rgba(16,185,129,0.2)"
                    description="Безперервна робота"
                />
            </div>

            {/* ─── ANALYTICAL ENGINES GRID ─── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <Brain className="w-3.5 h-3.5 text-violet-400" />
                        </div>
                        <h2 className="text-base font-black text-white uppercase tracking-widest">Аналітичні Двигуни v55</h2>
                        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] font-black">LIVE</Badge>
                    </div>
                    <button className="text-[10px] font-black text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest flex items-center gap-1">
                        Детальніше <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {ENGINES.map((engine, i) => <EngineCard key={engine.id} engine={engine} index={i} />)}
                </div>
            </div>

            {/* ─── MAIN CHARTS ROW ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sovereignty Chart */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(6,182,212,0.05),transparent_50%)]" />
                    <div className="relative p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Суверенна Матриця</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Динаміка скору та індексу ризику</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                    <span className="text-[9px] text-slate-500 font-bold">Скор</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-pink-400" style={{ background: '#ec4899' }} />
                                    <span className="text-[9px] text-slate-500 font-bold">Ризик</span>
                                </div>
                                <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg",
                                    isConnected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
                                    <span className={cn("text-[8px] font-black uppercase", isConnected ? 'text-emerald-400' : 'text-red-400')}>
                                        {isConnected ? 'WS' : 'OFF'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <ReactECharts option={sovereigntyEChartOption} style={{ height: '250px', width: '100%' }} />
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent)]" />
                    <div className="relative p-5">
                        <div className="mb-3">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Двигуни / Радар</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Порівняльна оцінка</p>
                        </div>
                        <ReactECharts option={radarOption} style={{ height: '265px', width: '100%' }} />
                    </div>
                </div>
            </div>

            {/* ─── RISK HEATMAP + PIPELINE + SIGNALS ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Heatmap */}
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Radar className="w-4 h-4 text-rose-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Теплова Карта Ризиків</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {RISK_MATRIX.map((item, i) => <RiskTile key={i} {...item} />)}
                        </div>
                    </div>
                </div>

                {/* Pipeline Monitor */}
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Pipeline ETL</h3>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px]">ONLINE</Badge>
                        </div>

                        <div className="space-y-2 mb-5">
                            {PIPELINE_STAGES.map((stage, i) => <PipelineStage key={i} {...stage} index={i} />)}
                        </div>

                        {/* Throughput */}
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Загальна Пропускна</span>
                                <span className="text-sm font-black text-emerald-300 tabular-nums">42.8 GB/s</span>
                            </div>
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: ['65%', '80%', '72%', '85%', '70%'] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="h-full bg-emerald-400 rounded-full"
                                    style={{ boxShadow: '0 0 8px rgba(16,185,129,0.6)' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Signal Feed */}
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                    <div className="p-5 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Живі Сигнали</h3>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="text-[9px] font-black text-cyan-400 uppercase">LIVE</span>
                            </div>
                        </div>
                        <div className="space-y-2 flex-1 overflow-hidden">
                            <AnimatePresence>
                                {signals.map((sig, i) => <SignalItem key={sig.id} signal={sig} index={i} />)}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── AGENT STATUS ─── */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.06),transparent_50%)]" />
                <div className="relative p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Флот AI Агентів</h3>
                            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[8px]">v55 SOVEREIGN</Badge>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Автономний Режим</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { name: 'Architect-v55', role: 'Архітектор', status: 'active', cycles: 4820, color: '#06b6d4' },
                            { name: 'Guardian-v55', role: 'Охоронець', status: 'active', cycles: 2341, color: '#10b981' },
                            { name: 'Vibe-Master', role: 'Аналітик', status: 'active', cycles: 8102, color: '#8b5cf6' },
                            { name: 'Evolution-α', role: 'Еволюція', status: 'calibrating', cycles: 612, color: '#f59e0b' },
                        ].map((agent, i) => (
                            <motion.div
                                key={agent.name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.03 }}
                                className="p-4 rounded-xl border border-white/5 bg-slate-900/60 group hover:border-white/15 transition-all cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-2 h-2 rounded-full" style={{ background: agent.color, boxShadow: `0 0 6px ${agent.color}` }} />
                                    <span className="text-[8px] font-black text-slate-500 uppercase">
                                        {agent.status === 'active' ? '● ACTIVE' : '◌ CALIB'}
                                    </span>
                                </div>
                                <div className="text-[11px] font-black text-white mb-0.5">{agent.name}</div>
                                <div className="text-[9px] font-medium" style={{ color: agent.color }}>{agent.role}</div>
                                <div className="mt-3 text-[9px] font-mono text-slate-500">
                                    Цикли: <span className="text-slate-300 font-bold">{agent.cycles.toLocaleString()}</span>
                                </div>
                                <div className="mt-2 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: agent.color }}
                                        animate={{ width: agent.status === 'active' ? ['100%', '0%'] : '40%' }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── HEADER ───────────────────────────────────────────────────────────────────
const DashboardHeader: React.FC<{ persona: string }> = ({ persona }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-2.5 py-1 text-[9px] font-black tracking-widest uppercase">
                        v55.0 РЕЖИМ БОГА АКТИВОВАНО
                    </Badge>
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                    </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-1">
                    СИТУАЦІЙНИЙ <span className="text-cyan-400" style={{ textShadow: '0 0 20px rgba(34,211,238,0.5)' }}>КОМАНДНИЙ ЦЕНТР</span>
                </h1>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-500" />
                    Протокол Суверенітету активовано · {dateStr} · {timeStr}
                </p>
            </div>

            <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="bg-slate-900/40 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 uppercase text-[9px] font-black tracking-widest transition-all">
                    <Layers className="w-3 h-3 mr-1.5" /> Карта Системи
                </Button>
                <Button variant="outline" size="sm" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 uppercase text-[9px] font-black tracking-widest transition-all">
                    <RefreshCw className="w-3 h-3 mr-1.5" /> Синхронізація
                </Button>
                <Button variant="outline" size="sm" className="bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20 uppercase text-[9px] font-black tracking-widest transition-all">
                    <Target className="w-3 h-3 mr-1.5" /> Звіт
                </Button>
            </div>
        </div>
    );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const SmartDashboard: React.FC = () => {
    const { persona } = useAppStore();

    return (
        <div className="relative min-h-screen bg-black overflow-hidden selection:bg-cyan-500/30">
            {/* Layered backgrounds */}
            <div className="absolute inset-0 bg-cyber-grid bg-[length:50px_50px] opacity-[0.025] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(6,182,212,0.12),transparent_60%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_100%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 cyber-scanline animate-scanline-fast opacity-[0.015] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 p-5 lg:p-10 space-y-10 max-w-[1800px] mx-auto pb-24">
                <DashboardHeader persona={persona} />
                <DashboardCoreContent persona={persona} />
            </div>
        </div>
    );
};

export default SmartDashboard;
