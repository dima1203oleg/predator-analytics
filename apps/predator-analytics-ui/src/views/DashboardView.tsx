
/**
 * 🦁 Predator v45 | Neural Analytics: SMART DASHBOARD
 *
 * Адаптивний командний центр платформи.
 * Змінює контекст залежно від обраної стратегії: "EARN" (Бізнес) або "CONTROL" (Влада).
 */

import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { PageTransition } from '../components/layout/PageTransition';
import { AdvancedBackground } from '../components/AdvancedBackground';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Briefcase,
    DollarSign,
    FileText,
    Globe,
    Search,
    Shield,
    Target,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import { TacticalCard } from '../components/TacticalCard';
import { NeuralPulse } from '../components/ui/NeuralPulse';
import { api } from '../services/api';

import { useAppStore } from '../store/useAppStore';

type DashboardMode = 'PROFIT' | 'CONTROL';

const SmartDashboard: React.FC = () => {
    const { persona } = useAppStore();
    const [mode, setMode] = useState<DashboardMode>(persona === 'TITAN' ? 'PROFIT' : 'CONTROL');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.premium.getDashboardStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);
    const getChartOption = (mode: DashboardMode) => {
        const color = mode === 'PROFIT' ? '#10b981' : '#f43f5e';
        return {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                axisLine: { lineStyle: { color: '#64748b' } }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#64748b' } },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            series: [{
                name: mode === 'PROFIT' ? 'Net Revenue' : 'Detected Risks',
                type: 'line',
                stack: 'Total',
                smooth: true,
                lineStyle: { width: 3, color: color },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: color + '50' }, { offset: 1, color: color + '00' }]
                    }
                },
                data: mode === 'PROFIT'
                    ? [120, 132, 101, 134, 90, 230, 210]
                    : [5, 8, 2, 4, 12, 15, 3]
            }]
        };
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-transparent relative overflow-hidden pb-20">
                <AdvancedBackground />
                <div className="absolute inset-0 pointer-events-none z-0">
                    <NeuralPulse
                        color={mode === 'PROFIT' ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}
                        size={800}
                    />
                </div>

                <div className="max-w-7xl mx-auto px-6 pt-10 relative z-10">

                    {/* 🎛️ STRATEGY SWITCHER */}
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
                                Global_<span className={mode === 'PROFIT' ? "text-emerald-400" : "text-rose-500"}>Situation</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">
                                System Mode: {mode === 'PROFIT' ? "Commercial Intelligence" : "Enforcement & Control"}
                            </p>
                        </div>

                        <div className="bg-slate-900/50 p-1 rounded-xl border border-white/10 flex gap-1 backdrop-blur-md">
                            <button
                                onClick={() => setMode('PROFIT')}
                                className={`px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'PROFIT'
                                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                    : 'text-slate-500 hover:text-emerald-400 hover:bg-white/5'
                                    }`}
                            >
                                <TrendingUp size={16} /> Business
                            </button>
                            <button
                                onClick={() => setMode('CONTROL')}
                                className={`px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'CONTROL'
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                    : 'text-slate-500 hover:text-rose-400 hover:bg-white/5'
                                    }`}
                            >
                                <Shield size={16} /> Control
                            </button>
                        </div>
                    </div>

                    {/* 📊 DYNAMIC METRICS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-32 bg-slate-900/40 rounded-2xl animate-pulse border border-white/5" />
                            ))
                        ) : (
                            (mode === 'PROFIT' ? stats?.profit : stats?.control)?.map((s: any) => (
                                <MetricCard
                                    key={s.id}
                                    icon={s.label.includes('Revenue') ? <DollarSign /> : s.label.includes('Market') ? <Globe /> : s.label.includes('Competitors') ? <Briefcase /> : s.label.includes('Opportunities') ? <Zap /> : s.label.includes('Risks') ? <AlertTriangle /> : s.label.includes('Investigation') ? <Search /> : s.label.includes('Entities') ? <Users /> : <FileText />}
                                    label={s.label}
                                    value={s.value}
                                    trend={s.trend}
                                    color={s.color}
                                />
                            ))
                        )}
                    </div>

                    {/* 🧠 MAIN ANALYTICAL VIEW */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Main Chart */}
                        <div className="lg:col-span-2">
                            <TacticalCard
                                title={mode === 'PROFIT' ? "Market Dynamics" : "Anomaly Detection Timeline"}
                                subtitle={mode === 'PROFIT' ? "Real-time revenue projection vs Competitors" : "Frequency of suspicious transactions"}
                                variant="glass"
                            >
                                <div className="p-6 h-[400px]">
                                    <ReactECharts option={getChartOption(mode)} style={{ height: '100%', width: '100%' }} />
                                </div>
                            </TacticalCard>
                        </div>

                        {/* Side Intelligence Feed */}
                        <div className="space-y-6">
                            <TacticalCard
                                title={mode === 'PROFIT' ? "Competitor Moves" : "Red Flags Detected"}
                                className="h-full"
                            >
                                <div className="p-6 space-y-4">
                                    {loading ? (
                                        <div className="text-center py-10">
                                            <div className="animate-spin w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full mx-auto" />
                                        </div>
                                    ) : (
                                        (mode === 'PROFIT' ? stats?.feeds?.profit : stats?.feeds?.control)?.map((item: any, i: number) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className={`p-4 rounded-xl border-l-4 ${mode === 'PROFIT' ? 'border-emerald-500 bg-emerald-500/5' : 'border-rose-500 bg-rose-500/5'} border-t border-r border-b border-white/5`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-black uppercase text-slate-500">{item.time}</span>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded text-white ${mode === 'PROFIT' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{item.tag}</span>
                                                </div>
                                                <p className="text-sm font-bold text-white mb-1">{item.title}</p>
                                                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </TacticalCard>
                        </div>
                    </div>

                    {/* 📂 QUICK ACCESS (Common for both) */}
                    <div className="mt-8 grid grid-cols-3 gap-6">
                        <ActionButton icon={<Target />} label={mode === 'PROFIT' ? "Find New Clients" : "Start Inspection"} color={mode === 'PROFIT' ? 'emerald' : 'rose'} />
                        <ActionButton icon={<FileText />} label="Generate Report" color="slate" />
                        <ActionButton icon={<Activity />} label="View Live Pipelines" color="indigo" onClick={() => window.location.href = '/ingest'} />
                    </div>

                </div>
            </div>
        </PageTransition>
    );
};
const MetricCard: React.FC<{ icon: React.ReactElement, label: string, value: string, trend: string, color: string }> = ({ icon, label, value, trend, color }) => (
    <div className="relative overflow-hidden group p-6 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all backdrop-blur-md">
        <div className={`absolute top-0 right-0 p-4 opacity-10 text-${color}-500 group-hover:scale-110 transition-transform`}>
            {React.cloneElement(icon, { size: 48 })}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-${color}-500/10 text-${color}-400`}>
            {icon}
        </div>
        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-3">
            <h3 className="text-2xl font-black text-white">{value}</h3>
            <span className={`text-xs font-bold ${trend.includes('+') || trend === 'NEW' ? 'text-emerald-400' : 'text-rose-400'}`}>{trend}</span>
        </div>
    </div>
);


const ActionButton: React.FC<{ icon: any, label: string, color: string, onClick?: () => void }> = ({ icon, label, color, onClick }) => (
    <button onClick={onClick} className={`p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:scale-[1.02] transition-all bg-slate-900/60`}>
        <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400 group-hover:bg-${color}-500 group-hover:text-white transition-colors`}>
                {icon}
            </div>
            <span className="text-sm font-bold text-slate-300 group-hover:text-white">{label}</span>
        </div>
        <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center">
            <ArrowRight size={12} className="text-slate-500" />
        </div>
    </button>
);

// Feeds moved to API
export default SmartDashboard;
