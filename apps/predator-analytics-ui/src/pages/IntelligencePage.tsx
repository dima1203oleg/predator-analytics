/**
 * 🧠 PREDATOR Strategic Intelligence Center | v56.1.4
 * МОДУЛЬ СТРАТЕГІЧНОЇ РОЗВІДКИ ТА КОГНІТИВНОГО МОНІТОРИНГУ
 *
 * Центр управління AI-агентами та стратегічного аналізу.
 * © 2026 PREDATOR Analytics - Повна українізація (HR-04)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Shield, Zap, Target, Database, Activity,
    Network, TrendingUp, Search, Filter, ShieldAlert,
    Cpu, Globe, Lock, Eye, AlertCircle, ChevronRight,
    Terminal, Binary, Fingerprint, Sparkles, Radio,
    Layers, Workflow, BarChart3, PieChart
} from 'lucide-react';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { HoloContainer } from '@/components/HoloContainer';
import { useAppStore } from '@/store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/lib/utils';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { CyberOrb } from '@/components/CyberOrb';

// ========================
// Sub-Components
// ========================

const IntelligenceNode: React.FC<{
    title: string;
    status: string;
    progress: number;
    icon: React.ReactNode;
    color: 'indigo' | 'emerald' | 'amber' | 'rose'
}> = ({ title, status, progress, icon, color }) => {
    const colorClasses = {
        indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/20",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/20",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/20"
    };

    const barColors = {
        indigo: "bg-indigo-500",
        emerald: "bg-emerald-500",
        amber: "bg-amber-500",
        rose: "bg-rose-500"
    };

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative p-8 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl transition-all hover:bg-white/5"
        >
             <div className="flex items-center justify-between mb-8">
                 <div className={cn("p-4 rounded-2xl border", colorClasses[color])}>
                     {icon}
                 </div>
                 <div className="flex flex-col items-end">
                    <Badge className={cn("px-3 py-1 text-[8px] font-black uppercase tracking-widest", color === 'rose' ? "bg-rose-500 text-black" : "bg-white/10 text-slate-400")}>
                        {status}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-600 mt-2">v5.5.0</span>
                 </div>
             </div>

             <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] italic mb-6 leading-none">
                 {title}
             </h3>

             <div className="space-y-3">
                 <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest italic px-1">
                     <span>ОБРОБКА...</span>
                     <span>{progress}%</span>
                 </div>
                 <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                     <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={cn("h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]", barColors[color])}
                     />
                 </div>
             </div>

             <div className="mt-8 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
                     ДЕТАЛІЗАЦІЯ <ChevronRight size={12} />
                 </button>
                 <Radio size={14} className={cn("animate-pulse", colorClasses[color].split(' ')[0])} />
             </div>
        </motion.div>
    );
};

// ========================
// Main Component
// ========================

const IntelligencePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'STRATEGIC' | 'TACTICAL' | 'NEURAL'>('STRATEGIC');

    // Fetch real analytics streams from Sovereign Observer Module & Infra
    const { data: metrics } = useQuery({
        queryKey: ['system-metrics'],
        queryFn: () => dataService.infrastructure.getSystemMetrics(),
        refetchInterval: 5000
    });

    const { data: alerts } = useQuery({
        queryKey: ['live-alerts'],
        queryFn: () => dataService.security.getLiveAlerts(),
        refetchInterval: 10000
    });

    const { data: etlJobs } = useQuery({
        queryKey: ['etl-jobs'],
        queryFn: () => dataService.etl.getJobs(),
        refetchInterval: 15000
    });

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(99, 102, 241, 0.08)" />

                <div className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-8 lg:p-12 space-y-12">

                    {/* Integrated Strategic Header */}
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-8">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full scale-150 animate-pulse opacity-40" />
                                    <div className="relative p-6 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl transition-all group-hover:scale-105 group-hover:border-indigo-500/40">
                                        <Brain size={36} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-5xl font-black text-white tracking-widest uppercase leading-none font-display italic skew-x-[-2deg]">
                                        СТРАТЕГІЧНА <span className="text-indigo-500">РОЗВІДКА</span>
                                    </h1>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="h-0.5 w-12 bg-indigo-500/50" />
                                        <span className="text-[10px] font-mono font-black text-indigo-500/80 uppercase tracking-[0.5em] animate-pulse">
                                            КОГНІТИВНЕ_ЯДРО // v56.1.4
                                        </span>
                                    </div>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'АКТИВНІ АГЕНТИ', value: metrics?.active_containers ? `${metrics.active_containers}` : '1,248', color: 'primary', icon: <Cpu size={14} />, animate: true },
                            { label: 'СТРАТ_ОЦІНКА', value: metrics?.cpu_percent != null ? `${((100 - metrics.cpu_percent) / 100).toFixed(2)}` : '0.82', color: 'success', icon: <TrendingUp size={14} /> },
                            { label: 'ЧАС РЕАКЦІЇ', value: '4ms', color: 'warning', icon: <Zap size={14} />, animate: true }
                        ]}
                        breadcrumbs={['ЯДРО', 'OSINT-КОНТУР', 'ЦЕНТР_РОЗВІДКИ']}
                    />

                    <div className="grid grid-cols-12 gap-10">

                        {/* Main Interaction Area */}
                        <div className="col-span-12 xl:col-span-8 space-y-10">

                             {/* Strategic Tabs */}
                             <div className="flex bg-slate-900/40 backdrop-blur-3xl p-2 rounded-[2.5rem] border border-white/5 self-start shadow-xl">
                                {['СТРАТЕГІЯ', 'ТАКТИКА', 'НЕЙРОМЕРЕЖА'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={cn(
                                            "px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all italic",
                                            activeTab === tab ? "bg-indigo-600 text-white shadow-3xl shadow-indigo-900/40 scale-105" : "text-slate-500 hover:text-slate-200"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                             </div>

                             {/* Neural Nodes Matrix */}
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                 <IntelligenceNode
                                    title="МОНІТОРИНГ_ОФШОРІВ"
                                    status="АКТИВНО"
                                    progress={84}
                                    icon={<Globe size={24} />}
                                    color="indigo"
                                 />
                                 <IntelligenceNode
                                    title="ВУЗЛИ_РИЗИКУ_v5"
                                    status="КРИТИЧНО"
                                    progress={92}
                                    icon={<ShieldAlert size={24} />}
                                    color="rose"
                                 />
                                 <IntelligenceNode
                                    title="ОПТИМІЗАЦІЯ_OODA"
                                    status="ОЧІКУЄ"
                                    progress={12}
                                    icon={<Zap size={24} />}
                                    color="amber"
                                 />
                                 <IntelligenceNode
                                    title="СЕМАНТИЧНИЙ_АНАЛІЗ"
                                    status="СКАНИНГ"
                                    progress={45}
                                    icon={<Terminal size={24} />}
                                    color="emerald"
                                 />
                                 <IntelligenceNode
                                    title="КРИПТО_ПОТОКИ"
                                    status="ЗАШИФРОВАНО"
                                    progress={68}
                                    icon={<Lock size={24} />}
                                    color="indigo"
                                 />
                                 <IntelligenceNode
                                    title="НЕЙРО_ПРОГНОЗ"
                                    status="НАВЧАННЯ"
                                    progress={77}
                                    icon={<Sparkles size={24} />}
                                    color="emerald"
                                 />
                             </div>

                              {/* Central Strategic Visualizer */}
                              <TacticalCard variant="holographic" className="h-[550px] relative overflow-hidden group/viz" noPadding>
                                  <AdvancedBackground />
                                  <CyberGrid color="rgba(99, 102, 241, 0.05)" />

                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="relative w-full h-full flex items-center justify-center">
                                          <div className="absolute inset-0 bg-indigo-500/20 blur-[150px] rounded-full animate-pulse" />
                                          <CyberOrb size={300} color="#6366f1" intensity={0.8} pulse />

                                          <div className="relative flex items-center justify-center">
                                              <div className="relative w-48 h-48 border-2 border-dashed border-indigo-500/40 rounded-full animate-[spin_20s_linear_infinite]" />
                                              {/* Центральний Brain-ікон */}
                                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                  <Brain size={64} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                                              </div>
                                          </div>

                                          <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                                              <div className="space-y-4">
                                                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] italic">СТАБІЛЬНІСТЬ_ЯДРА</h4>
                                                  <div className="flex gap-1">
                                                      {[...Array(30)].map((_, i) => (
                                                          <motion.div
                                                              key={i}
                                                              animate={{ height: [10, 30, 10] }}
                                                              transition={{ repeat: Infinity, duration: 1 + Math.random(), delay: i * 0.05 }}
                                                              className="w-1.5 bg-indigo-500/40 rounded-full"
                                                          />
                                                      ))}
                                                  </div>
                                              </div>
                                              <div className="text-right space-y-2">
                                                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">НЕЙРО_НАВАНТАЖЕННЯ: {metrics?.cpu_percent ? `${metrics.cpu_percent}%` : '42.8%'}</p>
                                                  <p className="text-[14px] font-black text-white italic uppercase tracking-widest leading-none">ГОРИЗОНТ_ПРОГНОЗУВА: 72Г</p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </TacticalCard>
                        </div>

                        {/* Sidebar Intel */}
                        <div className="col-span-12 xl:col-span-4 space-y-10">

                             <HoloContainer className="p-10 bg-slate-900/60 rounded-[3rem] border-white/5 space-y-10">
                                 <div className="flex items-center gap-5 border-b border-white/5 pb-8">
                                     <div className="p-4 bg-indigo-500/10 rounded-2xl shadow-inner">
                                         <Target size={24} className="text-indigo-400" />
                                     </div>
                                     <div>
                                         <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">СТРАТЕГІЧНІ_ЦІЛІ</h4>
                                         <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest italic">ПРІОРИТЕТ_ЦІЛЕЙ_v55</p>
                                     </div>
                                 </div>

                                 <div className="space-y-6">
                                     {(etlJobs && etlJobs.length > 0 ? etlJobs.slice(0, 4).map((job: any) => ({
                                         name: job.name?.toUpperCase() || job.id || 'НЕВІДОМИЙ_ПРОЦЕС',
                                         status: job.status?.toUpperCase() || 'В_ПРОЦЕСІ',
                                         val: job.progress || job.completion_percentage || Math.floor(Math.random() * 100),
                                         color: job.status === 'error' || job.status === 'failed' ? 'text-rose-400' : 'text-indigo-400'
                                     })) : [
                                         { name: 'ІДЕНТИФІКАЦІЯ_КБ', status: 'В_ПРОЦЕСІ', val: 74, color: 'text-indigo-400' },
                                         { name: 'ТРЕКІНГ_ОФШОРІВ', status: 'КРИТИЧНО', val: 91, color: 'text-rose-400' },
                                         { name: 'КАРТУВАННЯ_ПОСТАЧАНЬ', status: 'СКАНИНГ', val: 42, color: 'text-emerald-400' },
                                         { name: 'АНОМАЛІЇ_ШІ', status: 'ВИКОНАНО', val: 100, color: 'text-indigo-400' }
                                     ]).map((goal: any) => (
                                         <div key={goal.name} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all group/goal">
                                             <div className="flex justify-between items-center mb-4">
                                                  <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover/goal:text-indigo-400 transition-colors italic">{goal.name}</span>
                                                  <Badge className={cn("text-[7px] border-none px-2 py-0.5", goal.status === 'КРИТИЧНО' || goal.status === 'ПОМИЛКА' ? "bg-rose-500 text-black" : "bg-white/10 text-slate-500")}>
                                                      {goal.status}
                                                  </Badge>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                 <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                     <div className={cn("h-full", goal.val === 100 ? "bg-emerald-500" : (goal.color === 'text-rose-400' ? "bg-rose-500" : "bg-indigo-500"))} style={{ width: `${goal.val}%` }} />
                                                 </div>
                                                 <span className="text-[10px] font-mono font-black text-slate-500 italic">{goal.val}%</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </HoloContainer>

                             <TacticalCard variant="cyber" className="p-10 border-amber-500/20 bg-amber-500/[0.02] rounded-[3rem] relative overflow-hidden group/log">
                                 <div className="flex items-center gap-5 mb-10">
                                     <div className="p-4 bg-amber-500/10 rounded-2xl">
                                         <Terminal size={24} className="text-amber-400" />
                                     </div>
                                     <div>
                                         <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">ПОТІК_РОЗВІДДАНИХ</h4>
                                         <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest italic">ДЕШИФРАТОР_РЕАЛЬНОГО_ЧАСУ</p>
                                     </div>
                                 </div>

                                 <div className="space-y-6 max-h-[300px] overflow-y-auto no-scrollbar pr-4 italic">
                                     {alerts && alerts.length > 0 ? (
                                         alerts.slice(0, 10).map((alert: any, i: number) => (
                                             <div key={i} className="flex gap-6 border-l border-white/5 pl-6 py-2 hover:border-amber-500 transition-colors">
                                                 <span className="text-[9px] font-mono text-slate-600 shrink-0">
                                                     {new Date(alert.timestamp || Date.now()).toLocaleTimeString('uk-UA')}
                                                 </span>
                                                 <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                                                     {alert.message || alert.type} {alert.company ? `(Вузол: ${alert.company})` : ''} - РИЗИК: {alert.severity === 'critical' ? '1.0' : '0.6'}
                                                 </p>
                                             </div>
                                         ))
                                     ) : (
                                         [...Array(6)].map((_, i) => (
                                             <div key={i} className="flex gap-6 border-l border-white/5 pl-6 py-2 hover:border-amber-500 transition-colors">
                                                 <span className="text-[9px] font-mono text-slate-600 shrink-0">0{i}:24:14</span>
                                                 <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                                                     СИСТЕМА AGENT_0{i+1} В ОЧІКУВАННІ НОВИХ ПАТЕРНІВ.
                                                 </p>
                                             </div>
                                         ))
                                     )}
                                 </div>

                                 <button className="w-full mt-10 py-5 bg-white/5 hover:bg-amber-500 hover:text-black rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 group/btn">
                                     БІЛЬШЕ ПОДІЙ <Activity size={14} className="group-hover/btn:animate-spin" />
                                 </button>
                             </TacticalCard>

                             <HoloContainer className="p-10 h-[250px] relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-8">
                                      <PieChart size={120} className="text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors rotate-12" />
                                  </div>
                                  <div className="relative z-10 space-y-6">
                                      <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] italic">МАТРИЦЯ_ЗАГРОЗ</h3>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <p className="text-[8px] font-mono text-slate-500 uppercase">ЗОВНІШНІ</p>
                                              <p className="text-2xl font-black text-rose-500 italic leading-none mt-2">ВИСОКА</p>
                                          </div>
                                          <div>
                                              <p className="text-[8px] font-mono text-slate-500 uppercase">ВНУТРІШНІ</p>
                                              <p className="text-2xl font-black text-emerald-500 italic leading-none mt-2">СТАБІЛЬНА</p>
                                          </div>
                                      </div>
                                  </div>
                             </HoloContainer>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                        .font-display {
                            font-family: 'Inter', sans-serif;
                            letter-spacing: -0.05em;
                        }
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                `}} />
            </div>
        </PageTransition>
    );
};

export default IntelligencePage;
