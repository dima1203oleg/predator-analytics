/**
 * 🦁 PREDATOR v45 | КОМАНДНИЙ ЦЕНТР — Розумний Дашборд
 *
 * Повністю перероблений із:
 * - Реальними даними з бекенду (mock API на 9080)
 * - WebSocket метриками в реальному часі
 * - Живими індикаторами БД, ETL, та агентів
 * - Преміум дизайном із glassmorphism, анімаціями та мікро-ефектами
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Briefcase,
    Clock,
    Cpu,
    Database,
    DollarSign,
    FileText,
    Globe,
    HardDrive,
    Layers,
    Network,
    RefreshCw,
    Search,
    Server,
    Shield,
    Sparkles,
    Target,
    TrendingUp,
    Users,
    Wifi,
    WifiOff,
    Zap
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { useOmniscienceWS } from '../hooks/useOmniscienceWS';

type DashboardMode = 'PROFIT' | 'CONTROL';

// ─── LIVE STATUS BADGE ───────────────────────────────────────────────────────
const LiveBadge: React.FC<{ connected: boolean }> = ({ connected }) => (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${connected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
        {connected ? 'ONLINE' : 'OFFLINE'}
    </div>
);

// ─── KPI METRIC CARD ─────────────────────────────────────────────────────────
const MetricCard: React.FC<{
    icon: React.ReactElement;
    label: string;
    value: string;
    trend: string;
    color: string;
    sub?: string;
}> = ({ icon, label, value, trend, color, sub }) => {
    const isPositive = trend.includes('+') || trend === 'NEW';
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative overflow-hidden group p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all backdrop-blur-md cursor-default"
        >
            {/* Ambient glow */}
            <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10 group-hover:opacity-20 blur-2xl transition-all bg-${color}-500`} />

            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                {React.cloneElement(icon, { size: 18 } as any)}
            </div>

            <p className="text-[9px] uppercase font-black text-slate-500 tracking-[0.3em] mb-1">{label}</p>
            <div className="flex items-end gap-2 mb-1">
                <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
                <span className={`text-xs font-bold pb-0.5 flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trend}
                </span>
            </div>
            {sub && <p className="text-[10px] text-slate-500 font-medium">{sub}</p>}

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-${color}-600/0 via-${color}-500/60 to-${color}-600/0 opacity-0 group-hover:opacity-100 transition-opacity`} />
        </motion.div>
    );
};

// ─── DB STATUS ROW ────────────────────────────────────────────────────────────
const DbStatusRow: React.FC<{
    name: string;
    icon: React.ReactElement;
    count: number;
    color: string;
    unit?: string;
}> = ({ name, icon, count, color, unit = 'records' }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group hover:bg-white/2 px-2 -mx-2 rounded-lg transition-colors">
        <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg bg-${color}-500/10 text-${color}-400`}>
                {React.cloneElement(icon, { size: 14 } as any)}
            </div>
            <span className="text-xs font-bold text-slate-300">{name}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-sm font-black font-mono text-${color}-400`}>{count.toLocaleString()}</span>
            <span className="text-[9px] text-slate-600 uppercase">{unit}</span>
        </div>
    </div>
);

// ─── PIPELINE EVENT ITEM ──────────────────────────────────────────────────────
const EventItem: React.FC<{ event: any; index: number }> = ({ event, index }) => {
    const isError = event.event?.includes('FAIL') || event.level === 'error';
    const isSuccess = event.event?.includes('COMPLETE') || event.event?.includes('READY') || event.level === 'success';
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 py-2"
        >
            <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isError ? 'bg-rose-400' : isSuccess ? 'bg-emerald-400' : 'bg-blue-400'
                }`} />
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-300 leading-snug truncate">
                    {event.details || event.message || event.msg}
                </p>
                <p className="text-[9px] text-slate-600 mt-0.5">
                    {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '--:--:--'}
                </p>
            </div>
        </motion.div>
    );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const SmartDashboard: React.FC = () => {
    const { persona } = useAppStore();
    const [mode, setMode] = useState<DashboardMode>(persona === 'TITAN' ? 'PROFIT' : 'CONTROL');
    const [stats, setStats] = useState<any>(null);
    const [dbStats, setDbStats] = useState<any>(null);
    const [systemStatus, setSystemStatus] = useState<any>(null);
    const [etlJobs, setEtlJobs] = useState<any[]>([]);
    const [pipelineEvents, setPipelineEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const intervalRef = useRef<any>(null);

    // WebSocket real-time metrics
    const { data: wsData, isConnected } = useOmniscienceWS();

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const [dashStats, dbStatsData, sysStatus, jobs] = await Promise.allSettled([
                api.premium.getDashboardStats(),
                fetch('/api/v1/database/stats').then(r => r.json()),
                fetch('/api/v1/system/status').then(r => r.json()),
                api.getETLJobs(5),
            ]);

            if (dashStats.status === 'fulfilled') setStats(dashStats.value);
            if (dbStatsData.status === 'fulfilled') setDbStats(dbStatsData.value);
            if (sysStatus.status === 'fulfilled') setSystemStatus(sysStatus.value);
            if (jobs.status === 'fulfilled') setEtlJobs(Array.isArray(jobs.value) ? jobs.value : jobs.value?.jobs || []);

            // Fetch pipeline events from monitoring logs
            try {
                const logs = await fetch('/api/v1/monitoring/logs?limit=8').then(r => r.json());
                if (Array.isArray(logs)) setPipelineEvents(logs);
            } catch { }

            setLastRefresh(new Date());
        } catch (err) {
            console.error("Dashboard fetch failed", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        intervalRef.current = setInterval(fetchData, 15000);
        return () => clearInterval(intervalRef.current);
    }, []);

    // Real-time CPU/Memory chart data
    const [realtimeData, setRealtimeData] = useState<any[]>(() =>
        Array(20).fill(null).map((_, i) => ({
            time: `T-${20 - i}`,
            cpu: 20 + Math.random() * 30,
            memory: 40 + Math.random() * 25,
        }))
    );

    useEffect(() => {
        if (wsData?.system) {
            setRealtimeData(prev => [
                ...prev.slice(1),
                {
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    cpu: wsData.system.cpu_percent ?? prev[prev.length - 1].cpu,
                    memory: wsData.system.memory_percent ?? prev[prev.length - 1].memory,
                }
            ]);
        }
    }, [wsData]);

    const getChartOption = (mode: DashboardMode) => {
        const color = mode === 'PROFIT' ? '#10b981' : '#f43f5e';
        const color2 = mode === 'PROFIT' ? '#06b6d4' : '#f97316';
        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(2,6,23,0.95)',
                borderColor: 'rgba(255,255,255,0.08)',
                textStyle: { color: '#e2e8f0', fontSize: 11 }
            },
            legend: {
                data: [mode === 'PROFIT' ? 'Доходи' : 'Ризики', mode === 'PROFIT' ? 'Витрати' : 'Виявлено'],
                textStyle: { color: '#64748b', fontSize: 10 },
                top: 0
            },
            grid: { left: '3%', right: '4%', bottom: '8%', top: '12%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
                axisLine: { lineStyle: { color: '#1e293b' } },
                axisLabel: { color: '#475569', fontSize: 10 }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' } },
                axisLabel: { color: '#475569', fontSize: 10 }
            },
            series: [
                {
                    name: mode === 'PROFIT' ? 'Доходи' : 'Ризики',
                    type: 'line',
                    smooth: true,
                    lineStyle: { width: 2.5, color },
                    symbol: 'circle', symbolSize: 6,
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [{ offset: 0, color: color + '30' }, { offset: 1, color: color + '00' }]
                        }
                    },
                    data: mode === 'PROFIT' ? [120, 132, 101, 134, 90, 230, 210] : [5, 8, 2, 4, 12, 15, 3]
                },
                {
                    name: mode === 'PROFIT' ? 'Витрати' : 'Виявлено',
                    type: 'line',
                    smooth: true,
                    lineStyle: { width: 2, color: color2, type: 'dashed' },
                    symbol: 'circle', symbolSize: 5,
                    data: mode === 'PROFIT' ? [80, 95, 72, 88, 60, 120, 145] : [2, 5, 1, 2, 7, 9, 1]
                }
            ]
        };
    };

    const getRealtimeChartOption = () => ({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(2,6,23,0.95)',
            borderColor: 'rgba(255,255,255,0.08)',
            textStyle: { color: '#e2e8f0', fontSize: 11 }
        },
        grid: { left: '2%', right: '2%', bottom: '5%', top: '5%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: realtimeData.map(d => d.time),
            axisLine: { show: false },
            axisLabel: { show: false },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            min: 0, max: 100,
            axisLine: { show: false },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } },
            axisLabel: { color: '#475569', fontSize: 9 }
        },
        series: [
            {
                name: 'CPU %',
                type: 'line',
                smooth: true,
                lineStyle: { width: 1.5, color: '#22d3ee' },
                symbol: 'none',
                areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#22d3ee20' }, { offset: 1, color: '#22d3ee00' }] } },
                data: realtimeData.map(d => d.cpu.toFixed(1))
            },
            {
                name: 'RAM %',
                type: 'line',
                smooth: true,
                lineStyle: { width: 1.5, color: '#a78bfa' },
                symbol: 'none',
                areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#a78bfa20' }, { offset: 1, color: '#a78bfa00' }] } },
                data: realtimeData.map(d => d.memory.toFixed(1))
            }
        ]
    });

    const getDoughnutOption = () => {
        const dbData = dbStats ? [
            { value: dbStats.postgresql?.records || 0, name: 'PostgreSQL', itemStyle: { color: '#3b82f6' } },
            { value: dbStats.opensearch?.documents || 0, name: 'OpenSearch', itemStyle: { color: '#10b981' } },
            { value: dbStats.qdrant?.vectors || 0, name: 'Qdrant', itemStyle: { color: '#a78bfa' } },
        ] : [
            { value: 100, name: 'PostgreSQL', itemStyle: { color: '#3b82f6' } },
            { value: 100, name: 'OpenSearch', itemStyle: { color: '#10b981' } },
            { value: 0, name: 'Qdrant', itemStyle: { color: '#a78bfa' } },
        ];
        return {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item', backgroundColor: 'rgba(2,6,23,0.95)', borderColor: 'rgba(255,255,255,0.08)', textStyle: { color: '#e2e8f0', fontSize: 11 } },
            series: [{
                type: 'pie',
                radius: ['50%', '80%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: false,
                label: { show: false },
                emphasis: { label: { show: false } },
                data: dbData
            }]
        };
    };

    const cpu = wsData?.system?.cpu_percent;
    const memory = wsData?.system?.memory_percent;
    const dbRecords = dbStats?.postgresql?.records || 0;
    const totalVectors = dbStats?.qdrant?.vectors || 0;
    const totalDocs = dbStats?.opensearch?.documents || 0;
    const graphNodes = dbStats?.graph?.nodes || 0;

    return (
        <div className="min-h-screen relative pb-24 overflow-x-hidden">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className={`absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[180px] opacity-5 ${mode === 'PROFIT' ? 'bg-emerald-500' : 'bg-rose-600'} transition-colors duration-1000`} />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-4 bg-indigo-500" />
            </div>

            <div className="max-w-8xl mx-auto px-6 pt-8 relative z-10">

                {/* ═══ HEADER ═══════════════════════════════════════════════════ */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1.5">
                                {isConnected
                                    ? <Wifi size={12} className="text-emerald-400" />
                                    : <WifiOff size={12} className="text-rose-400" />
                                }
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                    {isConnected ? 'WS Connected · live' : 'WS Offline'}
                                </span>
                            </div>
                            <span className="text-slate-700">·</span>
                            <span className="text-[10px] font-mono text-slate-600">
                                Оновлено: {lastRefresh.toLocaleTimeString()}
                            </span>
                        </div>

                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                            Global_<span className={mode === 'PROFIT' ? 'text-emerald-400' : 'text-rose-500'}>
                                Situation
                            </span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">
                            Predator Analytics v45 · {systemStatus?.status || 'OPERATIONAL'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Live status */}
                        <LiveBadge connected={isConnected} />

                        {/* Refresh */}
                        <button
                            onClick={fetchData}
                            disabled={refreshing}
                            className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
                        >
                            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        </button>

                        {/* Mode switcher */}
                        <div className="bg-slate-900/50 p-1 rounded-xl border border-white/10 flex gap-1 backdrop-blur-md">
                            <button
                                onClick={() => setMode('PROFIT')}
                                className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'PROFIT'
                                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                    : 'text-slate-500 hover:text-emerald-400 hover:bg-white/5'
                                    }`}
                            >
                                <TrendingUp size={14} /> Бізнес
                            </button>
                            <button
                                onClick={() => setMode('CONTROL')}
                                className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'CONTROL'
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                    : 'text-slate-500 hover:text-rose-400 hover:bg-white/5'
                                    }`}
                            >
                                <Shield size={14} /> Контроль
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══ KPI METRICS ROW ══════════════════════════════════════════ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-32 bg-slate-900/40 rounded-2xl animate-pulse border border-white/5" />
                        ))
                    ) : (
                        (mode === 'PROFIT' ? stats?.profit : stats?.control)?.map((s: any, i: number) => (
                            <MetricCard
                                key={s.id}
                                icon={i === 0 ? <DollarSign /> : i === 1 ? <Globe /> : i === 2 ? <Briefcase /> : <Zap />}
                                label={s.label}
                                value={s.value}
                                trend={s.trend}
                                color={s.color}
                            />
                        )) || (
                            <>
                                <MetricCard icon={<Database />} label="Записів у БД" value={dbRecords.toLocaleString()} trend="+100%" color="blue" sub="PostgreSQL факти" />
                                <MetricCard icon={<Search />} label="Індекс пошуку" value={totalDocs.toLocaleString()} trend="+100%" color="emerald" sub="OpenSearch docs" />
                                <MetricCard icon={<Cpu />} label="CPU" value={`${(cpu ?? 0).toFixed(1)}%`} trend={cpu > 80 ? '+HIGH' : '+OK'} color={cpu > 80 ? 'rose' : 'cyan'} sub="Поточне навантаження" />
                                <MetricCard icon={<HardDrive />} label="RAM" value={`${(memory ?? 0).toFixed(1)}%`} trend={memory > 80 ? '+HIGH' : '+OK'} color={memory > 80 ? 'amber' : 'purple'} sub="Використання пам'яті" />
                            </>
                        )
                    )}
                </div>

                {/* ═══ MAIN GRID ════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

                    {/* ── Main Chart (7 cols) ── */}
                    <div className="lg:col-span-7">
                        <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                        {mode === 'PROFIT' ? 'Динаміка ринку' : 'Аномалії та ризики'}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        {mode === 'PROFIT' ? 'Проекція доходів vs витрат' : 'Частота підозрілих транзакцій'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    LIVE
                                </div>
                            </div>
                            <ReactECharts
                                option={getChartOption(mode)}
                                style={{ height: '280px', width: '100%' }}
                                opts={{ renderer: 'canvas' }}
                            />
                        </div>
                    </div>

                    {/* ── Intelligence Feed (5 cols) ── */}
                    <div className="lg:col-span-5">
                        <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                    {mode === 'PROFIT' ? 'Рухи Конкурентів' : 'Виявлені Загрози'}
                                </h3>
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-widest">
                                    INTELLIGENCE
                                </span>
                            </div>

                            <div className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
                                <AnimatePresence>
                                    {loading ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
                                        ))
                                    ) : (
                                        (mode === 'PROFIT' ? stats?.feeds?.profit : stats?.feeds?.control)?.map((item: any, i: number) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className={`p-4 rounded-xl border-l-4 ${mode === 'PROFIT'
                                                        ? 'border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/8'
                                                        : 'border-rose-500 bg-rose-500/5 hover:bg-rose-500/8'
                                                    } border-t border-r border-b border-white/5 transition-colors cursor-pointer`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] font-black uppercase text-slate-500">{item.time}</span>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded text-white ${mode === 'PROFIT' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                        {item.tag}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-white mb-1">{item.title}</p>
                                                <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ BOTTOM ROW: DB Stats | Real-time | ETL Jobs | Log Feed ══ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

                    {/* ── Database Status (3 cols) ── */}
                    <div className="lg:col-span-3 p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Database size={14} className="text-blue-400" />
                                Бази даних
                            </h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>

                        {/* Doughnut */}
                        <div className="h-[120px] mb-3">
                            <ReactECharts
                                option={getDoughnutOption()}
                                style={{ height: '100%', width: '100%' }}
                                opts={{ renderer: 'canvas' }}
                            />
                        </div>

                        <DbStatusRow name="PostgreSQL" icon={<Database />} count={dbRecords} color="blue" />
                        <DbStatusRow name="OpenSearch" icon={<Search />} count={totalDocs} color="emerald" unit="docs" />
                        <DbStatusRow name="Qdrant (Вектори)" icon={<Layers />} count={totalVectors} color="purple" unit="vectors" />
                        <DbStatusRow name="GraphDB" icon={<Network />} count={graphNodes} color="amber" unit="nodes" />
                    </div>

                    {/* ── Real-time CPU/RAM (4 cols) ── */}
                    <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Activity size={14} className="text-cyan-400" />
                                Ресурси в реальному часі
                            </h3>
                            <div className="flex items-center gap-3 text-[10px] font-mono">
                                <span className="flex items-center gap-1 text-cyan-400"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> CPU</span>
                                <span className="flex items-center gap-1 text-violet-400"><div className="w-1.5 h-1.5 rounded-full bg-violet-400" /> RAM</span>
                            </div>
                        </div>

                        <ReactECharts
                            option={getRealtimeChartOption()}
                            style={{ height: '160px', width: '100%' }}
                            opts={{ renderer: 'canvas' }}
                        />

                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center">
                                <div className="text-xl font-black text-cyan-400 font-mono">{(cpu ?? 0).toFixed(0)}%</div>
                                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">CPU</div>
                            </div>
                            <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 text-center">
                                <div className="text-xl font-black text-violet-400 font-mono">{(memory ?? 0).toFixed(0)}%</div>
                                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">RAM</div>
                            </div>
                        </div>
                    </div>

                    {/* ── ETL Jobs (3 cols) ── */}
                    <div className="lg:col-span-3 p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Zap size={14} className="text-amber-400" />
                                ETL Завдання
                            </h3>
                            <span className="text-[9px] text-slate-500 font-mono">{etlJobs.length} задач</span>
                        </div>

                        <div className="space-y-2 overflow-y-auto max-h-[220px] custom-scrollbar">
                            {etlJobs.length === 0 ? (
                                <div className="text-center py-8 text-slate-600">
                                    <Layers size={24} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">Немає активних задач</p>
                                </div>
                            ) : (
                                etlJobs.map((job: any, i: number) => (
                                    <motion.div
                                        key={job.job_id || job.id || i}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-white truncate max-w-[120px]">
                                                {job.source_file || job.job_id?.slice(0, 12) || 'Job'}
                                            </span>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${job.state === 'READY' || job.state === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    job.state === 'FAILED' ? 'bg-rose-500/10 text-rose-400' :
                                                        'bg-amber-500/10 text-amber-400'
                                                }`}>
                                                {job.state || 'INIT'}
                                            </span>
                                        </div>
                                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${job.progress?.percent || 0}%` }}
                                                className={`h-full rounded-full ${job.state === 'READY' || job.state === 'COMPLETED' ? 'bg-emerald-500' :
                                                        job.state === 'FAILED' ? 'bg-rose-500' : 'bg-amber-500'
                                                    }`}
                                            />
                                        </div>
                                        <div className="text-[9px] text-slate-600 mt-1 font-mono truncate">
                                            {job.progress?.details || job.progress?.stage || '—'}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Pipeline Events (2 cols) ── */}
                    <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <FileText size={14} className="text-indigo-400" />
                                Лог системи
                            </h3>
                        </div>
                        <div className="space-y-1 overflow-y-auto max-h-[220px] custom-scrollbar">
                            {pipelineEvents.length === 0 ? (
                                <div className="text-center py-6 text-slate-600">
                                    <Clock size={20} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Очікуємо події...</p>
                                </div>
                            ) : (
                                pipelineEvents.map((event, i) => (
                                    <EventItem key={i} event={event} index={i} />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ QUICK ACTIONS ════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            icon: <Target />,
                            label: mode === 'PROFIT' ? 'Знайти нових клієнтів' : 'Розпочати інспекцію',
                            color: mode === 'PROFIT' ? 'emerald' : 'rose',
                            href: mode === 'PROFIT' ? '/suppliers' : '/risk-scoring'
                        },
                        { icon: <FileText />, label: 'Генерувати звіт', color: 'slate', href: '/reports' },
                        { icon: <Activity />, label: 'Переглянути пайплайни', color: 'indigo', href: '/data-hub' },
                    ].map((action, i) => (
                        <motion.a
                            key={i}
                            href={action.href}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-${action.color}-500/20 hover:bg-${action.color}-500/5 transition-all bg-slate-900/40 backdrop-blur-md cursor-pointer`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl bg-${action.color}-500/10 text-${action.color}-400 group-hover:bg-${action.color}-500 group-hover:text-white transition-colors border border-${action.color}-500/20`}>
                                    {React.cloneElement(action.icon, { size: 16 } as any)}
                                </div>
                                <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
                            </div>
                            <ArrowRight size={14} className={`text-slate-600 group-hover:text-${action.color}-400 group-hover:translate-x-1 transition-all`} />
                        </motion.a>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default SmartDashboard;
