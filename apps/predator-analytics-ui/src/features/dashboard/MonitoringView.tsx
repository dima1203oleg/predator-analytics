/**
 * PREDATOR v55.5 | Telemetry Sanctum — Система Глобального Моніторингу
 * 
 * Центр технічного контролю та телеметрії інфраструктури.
 * - Прямі потоки метрик з Kubernetes та NVIDIA сервісів
 * - Візуалізація нейронного навантаження (CPU/GPU/RAM)
 * - Живий потік системних подій та логів AZR
 * - Аналіз SAGA-транзакцій в реальному часі
 * 
 * © 2026 PREDATOR Analytics | Mission Critical Stability
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Cpu, HardDrive, Database, Network, 
    AlertTriangle, CheckCircle, Terminal, RefreshCw,
    Search, Filter, Play, Pause, Trash2, 
    Layers, Zap, ShieldAlert, Binary, Server, Cloud, Globe,
    ChevronRight, ZapOff, Info, Settings, Share2, Eye
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { api } from '@/services/api';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { useAppStore } from '@/store/useAppStore';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';

// ========================
// Types & Interfaces
// ========================

type Tab = 'METRICS' | 'LOGS' | 'SAGA' | 'NODES';

// ========================
// Main Component
// ========================

const MonitoringView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('METRICS');
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [pauseStream, setPauseStream] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            // Simulated deep telemetry fetch
            // In production: const res = await api.get('/system/monitoring/summary');
            setMetrics({
                cpu: { usage: [34, 45, 32, 56, 41, 38, 42, 45, 48, 41, 39, 43], labels: ['T-110', 'T-100', 'T-90', 'T-80', 'T-70', 'T-60', 'T-50', 'T-40', 'T-30', 'T-20', 'T-10', 'LIVE'] },
                gpu: { usage: [88, 92, 85, 94, 91, 89, 93], temp: '72°C' },
                memory: { usage: [72, 74, 73, 75, 74, 76, 75], total: '128GB', shared: '32GB' },
                network: { in: 1450, out: 820 },
                storage: { usage: 68, total: '12TB' },
                kafka: { lag: 12, throughput: 14520 }
            });
        } catch (err) {
            console.error('Monitoring fetch error:', err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    // Optimized Log Stream
    useEffect(() => {
        if (pauseStream) return;
        const interval = setInterval(() => {
            const services = ['CORE-API', 'INGESTION', 'GRAPH-SRV', 'ML-ENGINE', 'AUTH-SRV', 'KAFKA-CLUSTER', 'NEO4J-SANC'];
            const levels = ['INFO', 'DEBUG', 'WARN', 'ERROR', 'CRITICAL'];
            const messages = [
                "Connection accepted from node 0x12..",
                "Graph traversal optimized for UEID=12932",
                "Kafka consumer offset committed: partition 0",
                "Neural inference completed in 42ms",
                "SAGA transaction #8213 initialized",
                "PostgreSQL connection pool healthy",
                "Redis cache invalidated for keys: maritime:*",
                "Vector search index synchronized [QDRANT]",
                "Security handshake v5.5 established via mTLS"
            ];
            
            const newLog = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toLocaleTimeString(),
                service: services[Math.floor(Math.random() * services.length)],
                level: levels[Math.floor(Math.random() * levels.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                latency: `${Math.floor(Math.random() * 50)}ms`
            };

            setLogs(prev => [newLog, ...prev].slice(0, 200));
        }, 800);
        return () => clearInterval(interval);
    }, [pauseStream]);

    const cpuChartOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: { 
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderColor: 'rgba(56, 189, 248, 0.2)',
            textStyle: { color: '#fff', fontFamily: 'monospace' }
        },
        grid: { top: 40, left: 50, right: 30, bottom: 50 },
        xAxis: {
            type: 'category',
            data: metrics?.cpu?.labels || [],
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            axisLabel: { color: '#475569', fontSize: 10, fontWeight: 'bold' }
        },
        yAxis: {
            type: 'value',
            max: 100,
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
            axisLabel: { color: '#475569', fontSize: 10, fontWeight: 'bold' }
        },
        series: [{
            data: metrics?.cpu?.usage || [],
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: '#0ea5e9' },
            lineStyle: { 
                width: 4,
                shadowBlur: 15,
                shadowColor: 'rgba(14, 165, 233, 0.5)'
            },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(14, 165, 233, 0.3)' }, 
                        { offset: 1, color: 'rgba(14, 165, 233, 0)' }
                    ]
                }
            }
        }]
    }), [metrics]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />
                <CyberGrid color="rgba(14, 165, 233, 0.05)" />

                <div className="relative z-10 max-w-[1800px] mx-auto p-4 sm:p-8 lg:p-12 space-y-12">
                    
                    {/* View Header v55.5 */}
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-sky-500/20 blur-[50px] rounded-full scale-150 animate-pulse" />
                                    <div className="relative w-16 h-16 bg-slate-900 border border-sky-500/20 rounded-2xl flex items-center justify-center panel-3d shadow-2xl">
                                        <Activity size={32} className="text-sky-400 drop-shadow-[0_0_15px_rgba(14, 165, 233, 0.8)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-white tracking-widest uppercase leading-none italic skew-x-[-4deg]">
                                        TELEMETRY <span className="text-sky-400">SANCTUM</span>
                                    </h1>
                                    <p className="text-[10px] font-mono font-black text-sky-500/70 uppercase tracking-[0.6em] mt-3 flex items-center gap-3">
                                        <Server size={12} className="animate-spin-slow" /> 
                                        SYSTEM_OS_KERNEL_v55.5
                                    </p>
                                </div>
                            </div>
                        }
                        icon={<ShieldAlert size={22} className="text-sky-400" />}
                        breadcrumbs={['СИСТЕМА', 'МОНІТОР', 'ТЕЛЕМЕТРІЯ']}
                        stats={[
                            { label: 'СТАТУС_КЛАСТЕРА', value: 'HEALTHY', color: 'success', icon: <CheckCircle size={14} /> },
                            { label: 'ВІДГУК_API', value: '12ms', color: 'primary', icon: <Zap size={14} />, animate: true },
                            { label: 'Uptime', value: '99.99%', color: 'success', icon: <Activity size={14} /> }
                        ]}
                    />

                    {/* Navigation Tabs v55.5 */}
                    <div className="flex flex-wrap justify-between items-center gap-8 bg-slate-900/40 border border-white/5 p-6 rounded-[40px] backdrop-blur-3xl shadow-2xl">
                        <div className="flex bg-black/60 p-2 rounded-[30px] border border-white/5 shadow-inner">
                            {(['METRICS', 'LOGS', 'SAGA', 'NODES'] as Tab[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-10 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center gap-3",
                                        activeTab === tab 
                                            ? "bg-sky-500 text-black shadow-2xl scale-105" 
                                            : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                    )}
                                >
                                    {tab === 'METRICS' && <Activity size={14} />}
                                    {tab === 'LOGS' && <Terminal size={14} />}
                                    {tab === 'SAGA' && <Layers size={14} />}
                                    {tab === 'NODES' && <Network size={14} />}
                                    
                                    <span>
                                        {tab === 'METRICS' ? 'МЕТРИКИ' :
                                         tab === 'LOGS' ? 'ЛОГИ' :
                                         tab === 'SAGA' ? 'SAGA_СИС' : 'ВУЗЛИ_ШІ'}
                                    </span>
                                    {activeTab === tab && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-black rounded-full" />}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-6">
                            <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 font-black text-[10px] px-6 py-2.5 rounded-full italic tracking-widest animate-pulse">
                                LIVE_TELEMETRY_ON
                            </Badge>
                            <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        
                        {/* Main Stream Area */}
                        <div className="lg:col-span-9 space-y-12">
                            <AnimatePresence mode="wait">
                                {activeTab === 'METRICS' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -30 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-10"
                                    >
                                        <TacticalCard variant="holographic" className="p-10 bg-sky-500/[0.02] border-sky-500/20 rounded-[60px] h-[500px] flex flex-col group overflow-hidden">
                                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Cpu size={200} className="text-sky-500" />
                                            </div>
                                            <div className="flex items-center justify-between mb-10 relative z-10 px-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <Cpu size={24} className="text-sky-400 animate-pulse" />
                                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">НАВАНТАЖЕННЯ <span className="text-sky-400">ЦП</span></h3>
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">REAL_TIME_LOAD_SUMMARY_v55</p>
                                                </div>
                                                <Badge variant="outline" className="border-sky-500/30 text-sky-400 font-mono text-[10px] px-4">64_CORES_ACTIVE</Badge>
                                            </div>
                                            <div className="flex-1 relative z-10">
                                                <ReactECharts option={cpuChartOption} style={{ height: '100%', width: '100%' }} />
                                            </div>
                                        </TacticalCard>

                                        <TacticalCard variant="holographic" className="p-10 bg-amber-500/[0.02] border-amber-500/20 rounded-[60px] h-[500px] flex flex-col group overflow-hidden">
                                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <HardDrive size={200} className="text-amber-500" />
                                            </div>
                                            <div className="flex items-center justify-between mb-10 relative z-10 px-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <HardDrive size={24} className="text-amber-400" />
                                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">ОБ'ЄМ <span className="text-amber-400">RAM</span></h3>
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">MEM_VIRTUALIZATION_AZR</p>
                                                </div>
                                                <Badge variant="outline" className="border-amber-500/30 text-amber-400 font-mono text-[10px] px-4">DDR5_SYNCHRONIZED</Badge>
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col items-center justify-center gap-12 relative z-10">
                                                <div className="relative w-56 h-56 flex items-center justify-center group/gauge">
                                                    <div className="absolute inset-0 bg-amber-500/5 blur-[60px] rounded-full scale-150 group-hover/gauge:scale-175 transition-transform" />
                                                    <svg className="w-full h-full -rotate-90">
                                                        <circle cx="112" cy="112" r="95" stroke="rgba(255,255,255,0.03)" strokeWidth="16" fill="none" />
                                                        <motion.circle 
                                                            cx="112" cy="112" r="95" 
                                                            stroke="currentColor" strokeWidth="16" 
                                                            fill="none" strokeDasharray="596" 
                                                            initial={{ strokeDashoffset: 596 }}
                                                            animate={{ strokeDashoffset: 596 - (596 * (metrics?.memory?.usage[6] || 0)) / 100 }}
                                                            className="text-amber-500/80 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                        <span className="text-5xl font-black text-white tracking-tighter italic">{metrics?.memory?.usage[6]}%</span>
                                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2 border-t border-amber-500/20 pt-2">ВИКОРИСТАНО</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-10 w-full max-w-sm">
                                                    <div className="text-center p-4 bg-white/5 rounded-3xl border border-white/5 px-8">
                                                        <p className="text-[9px] font-black text-slate-500 uppercase mb-2">ЗАГАЛЬНО</p>
                                                        <p className="text-2xl font-black text-white">{metrics?.memory?.total}</p>
                                                    </div>
                                                    <div className="text-center p-4 bg-white/5 rounded-3xl border border-white/5 px-8">
                                                        <p className="text-[9px] font-black text-slate-500 uppercase mb-2">SHARED_GPU</p>
                                                        <p className="text-2xl font-black text-white">{metrics?.memory?.shared}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </TacticalCard>

                                        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-8">
                                            {[
                                                { label: 'KAFKA_ПОТІК', val: '14.5k', unit: 'msg/s', icon: Layers, color: 'sky' },
                                                { label: 'ЧЕРГА_ЗАВДАНЬ', val: '82', unit: 'jobs', icon: Database, color: 'indigo' },
                                                { label: 'ЛАТЕНТНІСТЬ', val: '12', unit: 'ms', icon: Zap, color: 'emerald' },
                                                { label: 'ALERTS_SYSTEM', val: '0', unit: 'warn', icon: ShieldAlert, color: 'rose' }
                                            ].map((item, i) => (
                                                <div key={i} className="p-8 bg-slate-900/40 border border-white/5 rounded-[48px] panel-3d hover:bg-white/[0.02] flex flex-col gap-6 cursor-pointer group">
                                                    <div className={cn(`w-14 h-14 rounded-2xl flex items-center justify-center bg-${item.color}-500/10 border border-${item.color}-500/20 group-hover:scale-110 transition-transform shadow-xl`)}>
                                                        <item.icon className={cn(`text-${item.color}-400`)} size={28} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.label}</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <h4 className="text-3xl font-black text-white italic">{item.val}</h4>
                                                            <span className="text-[10px] font-mono text-slate-500 uppercase">{item.unit}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'LOGS' && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        className="h-[750px] flex flex-col gap-8"
                                    >
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 bg-black/40 p-6 rounded-[40px] border border-white/5">
                                            <div className="relative flex-1 w-full">
                                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                                                <input 
                                                    type="text" 
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="ФІЛЬТРУВАТИ ЛОГИ: grep --color=auto..." 
                                                    className="w-full bg-black/40 border border-white/5 rounded-[28px] py-6 pl-16 pr-8 text-sm font-mono text-sky-400 placeholder:text-slate-800 focus:outline-none focus:border-sky-500/30 transition-all uppercase tracking-wider"
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => setPauseStream(!pauseStream)}
                                                    className={cn(
                                                        "p-6 rounded-[28px] border transition-all shadow-2xl group",
                                                        pauseStream ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-sky-500/10 border-sky-500/20 text-sky-400"
                                                    )}
                                                >
                                                    {pauseStream ? <Play size={24} className="fill-amber-400" /> : <Pause size={24} className="fill-sky-400" />}
                                                </button>
                                                <button 
                                                    onClick={() => setLogs([])}
                                                    className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-[28px] hover:bg-rose-500 hover:text-white transition-all shadow-2xl"
                                                >
                                                    <Trash2 size={24} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-black/80 border border-white/10 rounded-[60px] overflow-hidden relative shadow-[inset_0_0_50px_rgba(0,0,0,1)] group">
                                            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
                                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
                                            
                                            <div className="h-full overflow-y-auto p-12 font-mono text-[13px] leading-relaxed custom-scrollbar no-scrollbar italic">
                                                {logs.filter(l => l.message.toLowerCase().includes(searchQuery.toLowerCase())).map((log) => (
                                                    <div 
                                                        key={log.id} 
                                                        className="flex flex-wrap gap-x-6 gap-y-2 mb-4 group/log hover:bg-white/[0.03] px-6 py-3 rounded-2xl transition-all border border-transparent hover:border-white/5"
                                                    >
                                                        <span className="text-slate-600 shrink-0 font-bold tabular-nums">[{log.timestamp}]</span>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn(
                                                                "shrink-0 font-black tracking-widest text-[9px] px-3 py-1 scale-90",
                                                                log.level === 'CRITICAL' ? 'bg-rose-500 text-black border-none' :
                                                                log.level === 'ERROR' ? 'text-rose-500 border-rose-500/40' :
                                                                log.level === 'WARN' ? 'text-amber-500 border-amber-500/40' :
                                                                'text-sky-500 border-sky-500/40'
                                                            )}
                                                        >
                                                            {log.level}
                                                        </Badge>
                                                        <span className="text-indigo-400 font-black shrink-0 uppercase tracking-tighter">[{log.service}]</span>
                                                        <span className="text-slate-300 flex-1 min-w-[300px]">{log.message}</span>
                                                        <span className="text-slate-700 text-[10px] ml-auto font-black">{log.latency}</span>
                                                    </div>
                                                ))}
                                                
                                                <div className="flex items-center gap-6 mt-12 text-sky-500/40">
                                                    <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                                                    <span className="text-[10px] uppercase font-black tracking-[0.5em]">SYSTEM_BUS_IDLE_WAITING_FOR_DATA_PACKETS_AZR_v5.5</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Right Tactical Sidebar */}
                        <div className="lg:col-span-3 space-y-10">
                            <TacticalCard variant="holographic" className="p-10 bg-white/5 border-white/10 rounded-[60px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                                    <Server size={150} className="text-sky-400" />
                                </div>
                                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5 relative z-10">
                                    <Server size={20} className="text-sky-400" />
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] italic">ОТОЧЕННЯ <span className="text-white">DEPLOY</span></h3>
                                </div>
                                <div className="space-y-6 relative z-10">
                                    {[
                                        { label: 'V0.55.5_PRODUCTION', status: 'ONLINE', color: 'emerald', icon: Globe },
                                        { label: 'K8S_K3S_CLUSTER', status: 'HEALTHY', color: 'emerald', icon: Cloud },
                                        { label: 'POSTGRES_MASTER', status: 'STABLE', color: 'sky', icon: Database },
                                        { label: 'NEO4J_GRAPH_INDEX', status: 'WORM_MODE', color: 'amber', icon: Activity }
                                    ].map((env, i) => (
                                        <div key={i} className="p-6 bg-black/60 border border-white/5 rounded-[32px] flex items-center justify-between group/item hover:border-white/10 transition-all panel-3d">
                                            <div className="flex items-center gap-4">
                                                <env.icon size={16} className={cn(`text-${env.color}-400`)} />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{env.label}</span>
                                            </div>
                                            <Badge className={cn(`bg-${env.color}-500/10 text-${env.color}-400 border-none font-black text-[8px] px-3`)}>
                                                {env.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-10 py-5 bg-white/5 hover:bg-white/10 rounded-[28px] text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all italic border border-white/5">
                                    МЕНЕДЖЕР ВУЗЛІВ <ChevronRight size={14} className="inline ml-2" />
                                </button>
                            </TacticalCard>

                            <TacticalCard variant="glass" className="p-10 bg-sky-500/[0.03] border-sky-500/10 rounded-[60px] relative overflow-hidden group shadow-2xl">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.1),transparent_70%)]" />
                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20">
                                        <Network size={22} className="text-sky-400" />
                                    </div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] italic">ГЛОБАЛЬНИЙ <span className="text-sky-400">ТРАФІК</span></h3>
                                </div>
                                
                                <div className="space-y-12 relative z-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ВХІДНИЙ_HTTPS</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-white italic">1.2</span>
                                                <span className="text-[10px] font-mono text-slate-600 uppercase">Gbps</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5 p-[1px]">
                                            <motion.div 
                                                animate={{ width: ['40%', '75%', '55%', '90%', '65%'] }} 
                                                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} 
                                                className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.5)]" 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ВИХІДНИЙ_GPRC</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-white italic">0.8</span>
                                                <span className="text-[10px] font-mono text-slate-600 uppercase">Gbps</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5 p-[1px]">
                                            <motion.div 
                                                animate={{ width: ['20%', '55%', '35%', '80%', '45%'] }} 
                                                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} 
                                                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex flex-col gap-4">
                                    <button className="w-full py-5 bg-sky-500 text-black font-black rounded-[32px] uppercase tracking-[0.2em] shadow-2xl shadow-sky-900/40 hover:scale-95 transition-all text-[10px] flex items-center justify-center gap-3 italic">
                                        <Info size={16} /> ЕКСПОРТУВАТИ ТЕЛЕМЕТРІЮ
                                    </button>
                                    <button className="w-full py-5 bg-white/5 hover:bg-white/10 text-[9px] font-black text-sky-400/60 uppercase tracking-widest transition-all rounded-[32px] flex items-center justify-center gap-3">
                                        <Share2 size={14} /> ВІДКРИТИ GRAFANA_LINK
                                    </button>
                                </div>
                            </TacticalCard>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                        height: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(0,0,0,0.4);
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(14, 165, 233, 0.2);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(14, 165, 233, 0.4);
                    }
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .panel-3d {
                        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .panel-3d:hover {
                        transform: translateY(-8px) rotateX(1deg) rotateY(-1deg);
                        box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 40px rgba(14, 165, 233, 0.05);
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

export default MonitoringView;
