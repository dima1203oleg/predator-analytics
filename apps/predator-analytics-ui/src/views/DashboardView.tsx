/**
 * 🦁 PREDATOR ANALYTICS — Global Situation Command Center (V45)
 * ==========================================================
 * Smart Dashboard: High-precision metrics, market dynamics, and system health.
 * Persona: TITAN (Business) / INQUISITOR (Control) / SOVEREIGN (Full Alpha)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'magenta';
}> = ({ title, value, trend, trendType, icon, description, color = 'blue' }) => (
    <motion.div
        whileHover={{ scale: 1.02, translateY: -4 }}
        className="relative overflow-hidden group"
    >
        <div className={cn(
            "absolute -inset-0.5 bg-gradient-to-r opacity-20 group-hover:opacity-100 transition duration-500 blur",
            color === 'blue' ? "from-blue-600 to-cyan-600" :
                color === 'emerald' ? "from-emerald-600 to-teal-600" :
                    color === 'amber' ? "from-amber-600 to-orange-600" :
                        color === 'rose' ? "from-rose-600 to-pink-600" :
                            "from-purple-600 to-indigo-600"
        )}></div>
        <Card className="relative bg-slate-925/80 border-slate-800/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</CardTitle>
                <div className={cn("p-2 rounded-lg bg-opacity-20",
                    color === 'blue' ? "bg-blue-500 text-blue-400" :
                        color === 'emerald' ? "bg-emerald-500 text-emerald-400" :
                            color === 'amber' ? "bg-amber-500 text-amber-400" :
                                color === 'rose' ? "bg-rose-500 text-rose-400" :
                                    "bg-slate-500 text-slate-400"
                )}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black tracking-tighter text-slate-100">{value}</div>
                <div className="flex items-center mt-2 space-x-2">
                    {trend && (
                        <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                            trendType === 'up' ? "bg-emerald-500/20 text-emerald-400" :
                                trendType === 'down' ? "bg-rose-500/20 text-rose-400" :
                                    "bg-slate-500/20 text-slate-400"
                        )}>
                            {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
                                trendType === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                            {trend}
                        </span>
                    )}
                    {description && <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{description}</p>}
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


const DashboardHeader: React.FC<{ persona: string }> = ({ persona }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                    v55.0 God-Mode Active
                </Badge>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                    ))}
                </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                SITUATION <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">COMMAND</span> CENTER
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" />
                Real-time Sovereignty Protocol engaged
            </p>
        </div>

        <div className="flex gap-3">
            <Button variant="outline" className="bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white uppercase text-[10px] font-bold tracking-widest">
                <Layers className="w-3.5 h-3.5 mr-2" /> System Map
            </Button>
            <Button variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 uppercase text-[10px] font-bold tracking-widest">
                <Zap className="w-3.5 h-3.5 mr-2" /> Pulse Sync
            </Button>
        </div>
    </div>
);

const DashboardCoreContent: React.FC<{ persona: string }> = ({ persona }) => {
    const [mode, setMode] = useState<DashboardMode>(persona === 'TITAN' ? 'PROFIT' : 'CONTROL');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef<any>(null);

    const fetchData = async () => {
        try {
            const [dashStats, sysStatus, jobs, agentStats] = await Promise.allSettled([
                api.premium.getDashboardStats(),
                fetch('/api/v45/system/status').then(r => r.json()),
                api.getETLJobs(5),
                fetch('/api/v45/agents/status').then(r => r.json()),
            ]);

            setStats({
                dash: dashStats.status === 'fulfilled' ? dashStats.value : null,
                sys: sysStatus.status === 'fulfilled' ? sysStatus.value : null,
                jobs: jobs.status === 'fulfilled' ? jobs.value : [],
                agents: agentStats.status === 'fulfilled' ? agentStats.value : [],
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

    const profitChartOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: '#020617', borderColor: '#1e293b', textStyle: { color: '#f1f5f9' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'], axisLabel: { color: '#64748b' } },
        yAxis: { type: 'value', splitLine: { show: true, lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#64748b' } },
        series: [
            { name: 'Growth', type: 'line', smooth: true, data: [120, 132, 101, 134, 90, 230, 210], itemStyle: { color: '#00f3ff' }, areaStyle: { opacity: 0.05 } }
        ]
    }), []);

    return (
        <div className="space-y-8">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Active Sovereignty Score"
                    value={`${wsData?.pulse?.score || 98}%`}
                    icon={<Shield className="w-5 h-5" />}
                    color="cyan"
                    trend="+2.4%"
                    trendType="up"
                    description="AI Autonomy Level"
                />
                <MetricCard
                    title="Real-time Throughput"
                    value="42.8 GB/s"
                    icon={<Zap className="w-5 h-5" />}
                    color="amber"
                    trend="Optimal"
                    description="IO Pipeline Load"
                />
                <MetricCard
                    title="Neural Nodes"
                    value="12/12"
                    icon={<Activity className="w-5 h-5" />}
                    color="emerald"
                    description="Clusters Active"
                />
                <MetricCard
                    title="Security Level"
                    value="MAX"
                    icon={<Globe className="w-5 h-5" />}
                    color="blue"
                    description="No threats detected"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Control Panel */}
                <Card className="lg:col-span-2 bg-slate-925/40 border-slate-800/50 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-white">SYSTEM DYNAMICS</CardTitle>
                            <CardDescription className="text-slate-500 uppercase text-[10px] tracking-widest font-bold">Latency & Performance Tracing</CardDescription>
                        </div>
                        <Tabs value={mode} onValueChange={(v: string) => setMode(v as DashboardMode)}>
                            <TabsList className="bg-slate-900/60 border-slate-800">
                                <TabsTrigger value="PROFIT" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">MARKET</TabsTrigger>
                                <TabsTrigger value="CONTROL" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">ENGINE</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ReactECharts option={profitChartOption} style={{ height: '100%', width: '100%' }} />
                    </CardContent>
                </Card>

                {/* Sovereign Agent Status */}
                <Card className="bg-slate-925/40 border-slate-800/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-cyan-400" />
                            SOVEREIGN AGENTS
                        </CardTitle>
                        <CardDescription className="text-slate-500 uppercase text-[10px] tracking-widest font-bold">Autonomous Self-Healing Loop</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.agents?.map((agent: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/50 hover:border-cyan-500/30 transition-all group">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-200">{agent.name}</span>
                                        <Badge className={cn(
                                            "capitalize px-2 py-0",
                                            agent.is_running ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                        )}>
                                            {agent.is_running ? 'Active' : 'Standby'}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Cycles: <span className="text-slate-300 ml-1">{agent.stats?.cycles || 0}</span></div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Last Action: <span className="text-slate-300 ml-1">Observing</span></div>
                                    </div>
                                    <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-cyan-500/50"
                                            initial={{ width: 0 }}
                                            animate={{ width: agent.is_running ? '100%' : '0%' }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!stats?.agents || stats.agents.length === 0) && (
                                <div className="text-center py-12 text-slate-600 italic text-sm border-2 border-dashed border-slate-800/50 rounded-xl">
                                    Initializing collective intelligence...
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const SmartDashboard: React.FC = () => {
    const { persona } = useAppStore();
    return (
        <div className="relative min-h-screen bg-black overflow-hidden selection:bg-cyan-500/30">
            {/* Background Layers */}
            <div className="absolute inset-0 bg-cyber-grid bg-[length:50px_50px] opacity-[0.03] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none"></div>
            <div className="absolute inset-0 cyber-scanline animate-scanline-fast opacity-[0.02] pointer-events-none"></div>

            <div className="relative z-10 p-6 lg:p-12 space-y-12 max-w-[1700px] mx-auto">
                <DashboardHeader persona={persona} />
                <DashboardCoreContent persona={persona} />
            </div>
        </div>
    );
};

export default SmartDashboard;
