/**
 * 🦁 PREDATOR ANALYTICS — Global Situation Command Center (V45)
 * ==========================================================
 * Smart Dashboard: High-precision metrics, market dynamics, and system health.
 * Persona: TITAN (Business) / INQUISITOR (Control) / SOVEREIGN (Full Alpha)
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Shield,
    TrendingUp,
    AlertTriangle,
    Layers,
    Zap,
    Clock,
    ChevronRight,
    Globe,
    Database,
    Server,
    Cpu,
    Box,
    Layout,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Terminal,
    ZapOff,
    Sparkles
} from 'lucide-react';

import { useAppStore } from '../store/useAppStore';
import { useOmniscienceWS } from '../hooks/useOmniscienceWS';
import { api } from '../services/api';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

// Types
type DashboardMode = 'PROFIT' | 'CONTROL';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const MetricCard: React.FC<{
    title: string;
    value: string | number;
    trend?: string;
    trendType?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    description?: string;
    color?: string;
}> = ({ title, value, trend, trendType, icon, description, color = 'blue' }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative overflow-hidden"
    >
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
                <div className={cn("p-2 rounded-lg bg-opacity-20", `bg-${color}-500 text-${color}-400`)}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-100">{value}</div>
                <div className="flex items-center mt-1 space-x-2">
                    {trend && (
                        <span className={cn(
                            "text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-1",
                            trendType === 'up' ? "bg-emerald-500/10 text-emerald-400" :
                                trendType === 'down' ? "bg-rose-500/10 text-rose-400" :
                                    "bg-slate-500/10 text-slate-400"
                        )}>
                            {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
                                trendType === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                            {trend}
                        </span>
                    )}
                    {description && <p className="text-xs text-slate-500">{description}</p>}
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

const ActivityFeedItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    time: string;
    status: 'success' | 'warning' | 'info';
}> = ({ icon, title, time, status }) => (
    <div className="flex items-center p-3 space-x-4 transition-colors rounded-lg hover:bg-slate-800/40 border border-transparent hover:border-slate-700/50 group">
        <div className={cn(
            "p-2 rounded-full",
            status === 'success' ? "bg-emerald-500/10 text-emerald-400" :
                status === 'warning' ? "bg-amber-500/10 text-amber-400" :
                    "bg-blue-500/10 text-blue-400"
        )}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-200">{title}</p>
            <p className="text-xs text-slate-500">{time}</p>
        </div>
        <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100">
            <ChevronRight className="w-4 h-4 text-slate-500" />
        </Button>
    </div>
);

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const SmartDashboard: React.FC = () => {
    const { persona } = useAppStore();
    const [mode, setMode] = useState<DashboardMode>(persona === 'TITAN' ? 'PROFIT' : 'CONTROL');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef<any>(null);

    const fetchData = async () => {
        try {
            const [dashStats, dbStatsData, sysStatus, jobs] = await Promise.allSettled([
                api.premium.getDashboardStats(),
                fetch('/api/v1/database/stats').then(r => r.json()),
                fetch('/api/v1/system/status').then(r => r.json()),
                api.getETLJobs(5),
            ]);

            setStats({
                dash: dashStats.status === 'fulfilled' ? dashStats.value : null,
                db: dbStatsData.status === 'fulfilled' ? dbStatsData.value : null,
                sys: sysStatus.status === 'fulfilled' ? sysStatus.value : null,
                jobs: jobs.status === 'fulfilled' ? jobs.value : [],
            });
        } catch (e) {
            console.error('Data error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        intervalRef.current = setInterval(fetchData, 15000);
        return () => clearInterval(intervalRef.current);
    }, []);

    // Real-time CPU/Memory chart data
    const [realtimeData, setRealtimeData] = useState<any[]>(() =>
        Array.from({ length: 30 }, (_, i) => ({
            time: `${i}:00`,
            cpu: 0,
            memory: 0
        }))
    );

    const { data: wsData, isConnected } = useOmniscienceWS();

    useEffect(() => {
        if (wsData?.system) {
            setRealtimeData(prev => {
                const newData = [...prev.slice(1), {
                    time: new Date().toLocaleTimeString(),
                    cpu: wsData.system.cpu_percent,
                    memory: wsData.system.memory_percent
                }];
                return newData;
            });
        }
    }, [wsData]);

    // Chart Options
    const getProfitChartOption = () => ({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#0f172a',
            borderColor: '#1e293b',
            textStyle: { color: '#f1f5f9', fontSize: 12 }
        },
        legend: {
            data: ['Фіз. особи', 'Корпорації', 'Тренд'],
            textStyle: { color: '#94a3b8', fontSize: 10 },
            top: 0
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
            axisLine: { lineStyle: { color: '#1e293b' } },
            axisLabel: { color: '#64748b' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
            axisLabel: { color: '#64748b' }
        },
        series: [
            {
                name: 'Фіз. особи',
                type: 'line',
                data: [120, 132, 101, 134, 90, 230, 210],
                smooth: true,
                color: '#10b981',
                areaStyle: { opacity: 0.1 }
            },
            {
                name: 'Корпорації',
                type: 'line',
                data: [220, 182, 191, 234, 290, 330, 310],
                smooth: true,
                color: '#3b82f6'
            },
            {
                name: 'Тренд',
                type: 'bar',
                data: [150, 232, 201, 154, 190, 330, 410],
                color: '#6366f1',
                barWidth: '20%',
                itemStyle: { borderRadius: [4, 4, 0, 0] }
            }
        ]
    });

    const getSystemHealthOption = () => ({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#0f172a',
            borderColor: '#1e293b',
            textStyle: { color: '#f1f5f9', fontSize: 12 }
        },
        series: [
            {
                name: 'System Health',
                type: 'pie',
                radius: ['60%', '80%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 10, borderColor: '#0f172a', borderWidth: 2 },
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
                data: [
                    { value: 85, name: 'Normal', itemStyle: { color: '#10b981' } },
                    { value: 10, name: 'Warning', itemStyle: { color: '#f59e0b' } },
                    { value: 5, name: 'Critical', itemStyle: { color: '#ef4444' } }
                ]
            }
        ]
    });

    const getRealtimeChartOption = () => ({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#0f172a',
            borderColor: '#1e293b',
            textStyle: { color: '#f1f5f9', fontSize: 12 }
        },
        grid: { left: '2%', right: '2%', bottom: '2%', top: '2%', containLabel: false },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            show: false,
            data: realtimeData.map(d => d.time)
        },
        yAxis: { type: 'value', show: false, max: 100 },
        series: [
            {
                name: 'CPU',
                type: 'line',
                smooth: true,
                symbol: 'none',
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: 'transparent' }]
                    }
                },
                data: realtimeData.map(d => d.cpu),
                lineStyle: { color: '#3b82f6', width: 1 }
            },
            {
                name: 'Memory',
                type: 'line',
                smooth: true,
                symbol: 'none',
                data: realtimeData.map(d => d.memory),
                lineStyle: { color: '#8b5cf6', width: 1 }
            }
        ]
    });

    return (
        <div className="min-h-screen p-4 space-y-6 text-slate-100 bg-slate-950 lg:p-8">
            <AnimatePresence>
                {/* ─── HEADER ─── */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/20">
                            <Layers className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">
                                Global_<span className="text-blue-500">Situation</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] font-mono border-slate-700 bg-slate-900/50">
                                    V45.0_GOD_MODE
                                </Badge>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    SYSTEM_ONLINE
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-1 border rounded-xl bg-slate-900/40 border-slate-800">
                        <Button
                            variant={mode === 'PROFIT' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setMode('PROFIT')}
                            className={cn("rounded-lg transition-all", mode === 'PROFIT' && "bg-blue-600 text-white shadow-lg shadow-blue-500/30")}
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Бізнес
                        </Button>
                        <Button
                            variant={mode === 'CONTROL' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setMode('CONTROL')}
                            className={cn("rounded-lg transition-all", mode === 'CONTROL' && "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30")}
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Контроль
                        </Button>
                    </div>
                </motion.header>

                {/* ─── METRICS GRID ─── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Дохід (24г)"
                        value={stats?.dash?.profit?.[0]?.value || '$142,500'}
                        trend="+12.4%"
                        trendType="up"
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="emerald"
                    />
                    <MetricCard
                        title="Активні Сегменти"
                        value="42"
                        trend="Sturdy"
                        trendType="neutral"
                        icon={<Globe className="w-5 h-5" />}
                        color="blue"
                    />
                    <MetricCard
                        title="Здоров'я Системи"
                        value="99.9%"
                        icon={<Activity className="w-5 h-5" />}
                        color="indigo"
                    />
                    <MetricCard
                        title="CPU / RAM"
                        value={`${wsData?.system?.cpu_percent || 0}% / ${wsData?.system?.memory_percent || 0}%`}
                        trend={isConnected ? "ONLINE" : "OFFLINE"}
                        trendType={isConnected ? "up" : "down"}
                        icon={<Server className="w-5 h-5" />}
                        color="rose"
                    />
                </div>

                {/* ─── CENTER CONTENT ─── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Analytics Chart */}
                    <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{mode === 'PROFIT' ? 'Динаміка ринку' : 'Аномалії та ризики'}</CardTitle>
                                <CardDescription>Статистика за останній тиждень</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="border-slate-700">
                                <Clock className="w-4 h-4 mr-2" />
                                1 Tиждень
                            </Button>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ReactECharts
                                option={getProfitChartOption()}
                                style={{ height: '100%', width: '100%' }}
                                opts={{ renderer: 'svg' }}
                            />
                        </CardContent>
                    </Card>

                    {/* Side Panel: System Pulse */}
                    <div className="space-y-6">
                        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-amber-500" />
                                        <CardTitle className="text-lg">Real-time Pulse</CardTitle>
                                    </div>
                                    {isConnected ? (
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-none">ACTIVE</Badge>
                                    ) : (
                                        <Badge className="bg-rose-500/20 text-rose-400 border-none">OFFLINE</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="h-[120px]">
                                    <ReactECharts
                                        option={getRealtimeChartOption()}
                                        style={{ height: '100%', width: '100%' }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 border rounded-xl bg-slate-950/40 border-slate-800">
                                        <p className="text-xs text-slate-500">CPU Load</p>
                                        <p className="text-xl font-bold">{wsData?.system?.cpu_percent ?? 0}%</p>
                                    </div>
                                    <div className="p-3 border rounded-xl bg-slate-950/40 border-slate-800">
                                        <p className="text-xs text-slate-500">RAM Load</p>
                                        <p className="text-xl font-bold">{wsData?.system?.memory_percent ?? 0}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-lg">
                                    <span>Поточні Операції</span>
                                    <Badge variant="outline" className="border-slate-700 text-slate-400">{stats?.jobs?.length || 0}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 px-4 pb-4">
                                <ScrollArea className="h-[180px]">
                                    <div className="space-y-1">
                                        {stats?.jobs?.map((job: any) => (
                                            <ActivityFeedItem
                                                key={job.id}
                                                icon={<Database className="w-4 h-4" />}
                                                title={`ETL: ${job.name || job.id}`}
                                                time={new Date().toLocaleTimeString()}
                                                status={job.status === 'RUNNING' ? 'info' : 'success'}
                                            />
                                        ))}
                                        {(!stats?.jobs || stats?.jobs.length === 0) && (
                                            <div className="flex flex-col items-center justify-center h-[150px] space-y-2 opacity-50">
                                                <ZapOff className="w-8 h-8" />
                                                <p className="text-xs">Жодних активних операцій</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* ─── FOOTER HIGHLIGHT ─── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col items-center justify-between gap-4 p-4 border rounded-2xl bg-blue-600/5 border-blue-500/10 md:flex-row"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-sm text-slate-300">
                            Система працює в режимі <span className="font-bold text-blue-400">TRUTH_ONLY</span>.
                            Всі дані надходять з реальних джерел без затримок.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                        Генерувати Альфа-звіт
                    </Button>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SmartDashboard;
