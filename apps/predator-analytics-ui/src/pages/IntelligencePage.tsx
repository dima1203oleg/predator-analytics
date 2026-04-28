/**
 *   PREDATOR Strategic Intelligence Center | v62.7-ELITE
 * Sovereign Elite Edition — МOДУЛЬ СТ АТЕГІЧНОЇ  ОЗВІДКИ ТА КОГНІТИВНОГО МОНІТО ИНГУ
 *
 * Центр управління AI-агентами та стратегічного аналізу.
 * © 2026 PREDATOR Analytics - Повна українізація (HR-04)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Brain, Zap, Target, Activity,
    TrendingUp, ShieldAlert,
    Cpu, Globe, Lock, ChevronRight,
    Terminal, Sparkles, Radio,
    PieChart, Atom, Fingerprint
} from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { HoloContainer } from '@/components/HoloContainer';
import { useAppStore } from '@/store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';
import { CyberOrb } from '@/components/CyberOrb';
import { VramSentinel } from '@/components/intelligence/VramSentinel';
import AntigravityOperationsHUD from '@/components/intel/AntigravityOperationsHUD';

// ========================
// Sub-Components
// ========================

const IntelligenceNode: React.FC<{
    title: string;
    status: string;
    progress: number;
    icon: React.ReactNode;
    color: 'rose' | 'crimson' | 'slate'
}> = ({ title, status, progress, icon, color }) => {
    const colorClasses = {
        rose: "text-red-500 bg-red-500/10 border-red-500/20 shadow-red-500/20",
        crimson: "text-red-600 bg-red-600/10 border-red-600/20 shadow-red-600/20",
        slate: "text-slate-400 bg-white/5 border-white/10 shadow-black/40"
    };

    const barColors = {
        rose: "bg-red-500",
        crimson: "bg-red-600",
        slate: "bg-slate-500"
    };

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative p-8 bg-[#0a0a0a]/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl transition-all hover:bg-white/5 hover:border-red-600/20"
        >
             <div className="flex items-center justify-between mb-8">
                 <div className={cn("p-4 rounded-2xl border", colorClasses[color])}>
                     {icon}
                 </div>
                  <div className="flex flex-col items-end">
                    <Badge className={cn("px-3 py-1 text-[8px] font-black uppercase tracking-widest border-none text-white shadow-lg", color === 'crimson' ? "bg-red-700 shadow-red-900/40" : "bg-red-600 shadow-red-800/40")}>
                        {status}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-600 mt-2 uppercase">NODE_v62.7</span>
                 </div>
             </div>

             <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] italic mb-6 leading-none">
                 {title}
             </h3>

             <div className="space-y-3">
                 <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest italic px-1">
                     <span>ОБ ОБКА...</span>
                     <span>{progress}%</span>
                 </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <motion.div
                         initial={{ width: 0 }}
                         animate={{ width: `${progress}%` }}
                         className={cn("h-full rounded-full shadow-[0_0_15px_rgba(220,38,38,0.3)]", barColors[color === 'slate' ? 'slate' : color])}
                      />
                  </div>
             </div>

              <div className="mt-8 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
                      ДЕТАЛІЗАЦІЯ <ChevronRight size={12} />
                  </button>
                  <Radio size={14} className={cn("animate-pulse", color === 'crimson' ? "text-red-700" : "text-red-500")} />
              </div>
        </motion.div>
    );
};

// ========================
// Main Component
// ========================

const IntelligencePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'СТ АТЕГІЯ' | 'ТАКТИКА' | 'НЕЙ ОМЕ ЕЖА' | 'АВТОНОМІЯ'>('СТ АТЕГІЯ');

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
            <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(220, 38, 38, 0.05)" />

                <div className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-8 lg:p-12 space-y-12">

                    {/* Integrated Strategic Header */}
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-8">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full scale-150 animate-pulse opacity-40" />
                                    <div className="relative p-6 bg-[#0a0a0a] border border-red-600/20 rounded-[2rem] shadow-2xl transition-all group-hover:scale-105 group-hover:border-red-600/40">
                                        <Brain size={36} className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-5xl font-black text-white tracking-widest uppercase leading-none font-display italic skew-x-[-2deg]">
                                        СТ АТЕГІЧНА <span className="text-red-600">РОЗВІДКА</span>
                                    </h1>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="h-0.5 w-12 bg-red-600/50" />
                                        <span className="text-[10px] font-mono font-black text-red-500/80 uppercase tracking-[0.5em] animate-pulse">
                                            КОГНІТИВНЕ_ЯДРО // v62.7-ELITE
                                        </span>
                                    </div>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'АКТИВНІ АГЕНТИ', value: metrics?.active_containers ? `${metrics.active_containers}` : '1,248', color: 'rose', icon: <Cpu size={14} />, animate: true },
                            { label: 'СТ АТ_ОЦІНКА', value: metrics?.cpu_percent != null ? `${((100 - metrics.cpu_percent) / 100).toFixed(2)}` : '0.82', color: 'success', icon: <TrendingUp size={14} /> },
                            { label: 'ЧАС  ЕАКЦІЇ', value: '4ms', color: 'warning', icon: <Zap size={14} />, animate: true }
                        ]}
                        breadcrumbs={['ЯДРО', 'OSINT-КОНТУ ', 'ЦЕНТ _ ОЗВІДКИ']}
                    />

                    <div className="grid grid-cols-12 gap-10">

                        {/* Main Interaction Area */}
                        <div className="col-span-12 xl:col-span-8 space-y-10">

                             {/* Strategic Tabs */}
                             <div className="flex bg-[#050505]/60 backdrop-blur-3xl p-2 rounded-[2.5rem] border border-white/5 self-start shadow-xl">
                                {['СТ АТЕГІЯ', 'ТАКТИКА', 'НЕЙ ОМЕ ЕЖА', 'АВТОНОМІЯ'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={cn(
                                            "px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all italic",
                                            activeTab === tab ? "bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] scale-105" : "text-slate-500 hover:text-slate-200"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                             </div>

                             {/* Neural Nodes Matrix */}
                             {activeTab !== 'АВТОНОМІЯ' ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                     <IntelligenceNode
                                        title="СТРАТЕГІЧНИЙ_КАПІТАЛ"
                                        status="АНАЛІЗ"
                                        progress={88}
                                        icon={<Globe size={24} />}
                                        color="rose"
                                     />
                                     <IntelligenceNode
                                        title="ROI_ ОЗВІДКИ (x6.2)"
                                        status="МАКСИМУМ"
                                        progress={95}
                                        icon={<TrendingUp size={24} />}
                                        color="crimson"
                                     />
                                     <IntelligenceNode
                                        title="КОНКУ ЕНТНИЙ_ПУЛЬС"
                                        status="К ИТИЧНО"
                                        progress={92}
                                        icon={<ShieldAlert size={24} />}
                                        color="crimson"
                                     />
                                     <IntelligenceNode
                                        title="ОПТИМІЗАЦІЯ_OODA"
                                        status="ОЧІКУЄ"
                                        progress={12}
                                        icon={<Zap size={24} />}
                                        color="rose"
                                     />
                                     <IntelligenceNode
                                        title="К ИПТО_ПОТОКИ_SWIFT"
                                        status="МОНІТО ИНГ"
                                        progress={68}
                                        icon={<Lock size={24} />}
                                        color="rose"
                                     />
                                     <IntelligenceNode
                                        title="НЕЙ О_П ОГНОЗ_ ИНКУ"
                                        status="НАВЧАННЯ"
                                        progress={77}
                                        icon={<Sparkles size={24} />}
                                        color="rose"
                                     />
                                 </div>
                             ) : (
                                 <AntigravityOperationsHUD />
                             )}

                               {/* Central Strategic Visualizer & VRAM Guard */}
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                   <TacticalCard variant="holographic" className="h-[450px] relative overflow-hidden group/viz" noPadding>
                                       <AdvancedBackground />
                                       <CyberGrid color="rgba(220, 38, 38, 0.05)" />

                                       <div className="absolute inset-0 flex items-center justify-center">
                                           <div className="relative w-full h-full flex items-center justify-center">
                                               <div className="absolute inset-0 bg-red-600/10 blur-[150px] rounded-full animate-pulse" />
                                               <CyberOrb size={250} color="#DC2626" intensity={0.4} pulse />

                                               <div className="relative flex items-center justify-center">
                                                   <div className="relative w-32 h-32 border-2 border-dashed border-red-600/20 rounded-full animate-[spin_20s_linear_infinite]" />
                                                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                       <Brain size={48} className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]" />
                                                   </div>
                                               </div>

                                               <div className="absolute bottom-6 left-10 right-10 flex justify-between items-end">
                                                   <div className="space-y-4">
                                                       <h4 className="text-[9px] font-black text-red-600 uppercase tracking-[0.4em] italic leading-none">СТАБІЛЬНІСТЬ_ЯД А</h4>
                                                       <div className="flex gap-1">
                                                           {[...Array(20)].map((_, i) => (
                                                               <motion.div
                                                                   key={i}
                                                                   animate={{ height: [8, 24, 8] }}
                                                                   transition={{ repeat: Infinity, duration: 1 + Math.random(), delay: i * 0.05 }}
                                                                   className="w-1.5 bg-red-600/30 rounded-full"
                                                               />
                                                           ))}
                                                       </div>
                                                   </div>
                                                   <div className="text-right space-y-2">
                                                       <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none">НЕЙ О_НАВАНТАЖЕННЯ: {metrics?.cpu_percent ? `${metrics.cpu_percent}%` : '42.8%'}</p>
                                                       <p className="text-[12px] font-black text-white italic uppercase tracking-widest leading-none">ГО ИЗОНТ: 72Г</p>
                                                   </div>
                                               </div>
                                           </div>
                                       </div>
                                   </TacticalCard>

                                   <div className="space-y-10">
                                       <VramSentinel />
                                       <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                           <div className="flex items-center justify-between mb-6">
                                               <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] italic">ГЕОП ОСТО ОВИЙ_СКАНЕ </h4>
                                               <Globe size={18} className="text-red-600/40 animate-[spin_10s_linear_infinite]" />
                                           </div>
                                           <div className="aspect-video bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
                                               <div className="absolute inset-0 opacity-20 bg-[url('https://grain-size.com/wp-content/uploads/2021/04/map-grid.png')] bg-center bg-cover" />
                                               <div className="absolute inset-0 flex items-center justify-center">
                                                   <div className="relative">
                                                       <div className="w-16 h-16 border-2 border-red-600/40 rounded-full animate-ping" />
                                                       <Target size={24} className="absolute inset-0 m-auto text-red-500" />
                                                   </div>
                                               </div>
                                               <div className="absolute top-4 right-4 text-[8px] font-mono text-red-500 bg-black/80 px-2 py-1 rounded border border-red-600/20 uppercase">
                                                   ЛОК: 50.4501, 30.5234
                                               </div>
                                           </div>
                                       </div>
                                   </div>
                               </div>

                               {/* Live Activity Stream */}
                               <div className="h-[400px]">
                                   {/* Термінал активовано в глобальному просторі */}
                               </div>
                        </div>

                        {/* Sidebar Intel */}
                        <div className="col-span-12 xl:col-span-4 space-y-10">

                             <HoloContainer className="p-10 bg-[#0a0a0a]/60 rounded-[3rem] border-white/5 space-y-10">
                                 <div className="flex items-center gap-5 border-b border-white/5 pb-8">
                                     <div className="p-4 bg-red-600/10 rounded-2xl shadow-inner">
                                         <Target size={24} className="text-red-600" />
                                     </div>
                                     <div>
                                         <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">СТ АТЕГІЧНІ_ЦІЛІ</h4>
                                         <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest italic">П ІО ИТЕТ_ЦІЛЕЙ_v62.7</p>
                                     </div>
                                 </div>

                                 <div className="space-y-6">
                                     {(etlJobs && etlJobs.length > 0 ? etlJobs.slice(0, 4).map((job: any) => ({
                                         name: job.name?.toUpperCase() || job.id || 'НЕВІДОМИЙ_П ОЦЕС',
                                         status: job.status?.toUpperCase() || 'В_П ОЦЕСІ',
                                         val: job.progress || job.completion_percentage || Math.floor(Math.random() * 100),
                                         color: job.status === 'error' || job.status === 'failed' ? 'crimson' : 'rose'
                                     })) : [
                                         { name: 'ІДЕНТИФІКАЦІЯ_КБ', status: 'В_П ОЦЕСІ', val: 74, color: 'rose' },
                                         { name: 'Т ЕКІНГ_ОФШО ІВ', status: 'К ИТИЧНО', val: 91, color: 'crimson' },
                                         { name: 'КА ТУВАННЯ_ПОСТАЧАНЬ', status: 'СКАНИНГ', val: 42, color: 'rose' },
                                         { name: 'АНОМАЛІЇ_ШІ', status: 'ВИКОНАНО', val: 100, color: 'rose' }
                                     ]).map((goal: any) => (
                                         <div key={goal.name} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all group/goal">
                                             <div className="flex justify-between items-center mb-4">
                                                  <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover/goal:text-red-600 transition-colors italic">{goal.name}</span>
                                                  <Badge className={cn("text-[7px] border-none px-2 py-0.5 text-white shadow-sm", goal.status === 'К ИТИЧНО' || goal.color === 'crimson' ? "bg-red-700" : "bg-red-600")}>
                                                      {goal.status}
                                                  </Badge>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                 <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                     <div className={cn("h-full", goal.val === 100 ? "bg-emerald-500" : (goal.color === 'crimson' ? "bg-[#E11D48]" : "bg-rose-600"))} style={{ width: `${goal.val}%` }} />
                                                 </div>
                                                 <span className="text-[10px] font-mono font-black text-slate-500 italic">{goal.val}%</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </HoloContainer>

                             <TacticalCard variant="cyber" className="p-10 border-red-600/20 bg-[#0a0a0a]/40 rounded-[3rem] relative overflow-hidden group/log">
                                 <div className="flex items-center gap-5 mb-10">
                                     <div className="p-4 bg-red-600/10 rounded-2xl">
                                         <Terminal size={24} className="text-red-600" />
                                     </div>
                                     <div>
                                         <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">ПОТІК_ ОЗВІДДАНИХ</h4>
                                         <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest italic">ДЕШИФ АТО _ ЕАЛЬНОГО_ЧАСУ</p>
                                     </div>
                                 </div>

                                 <div className="space-y-6 max-h-[450px] overflow-y-auto no-scrollbar pr-4 italic">
                                     {alerts && alerts.length > 0 ? (
                                         alerts.slice(0, 15).map((alert: any, i: number) => (
                                             <div key={i} className="flex gap-6 border-l border-red-600/30 pl-6 py-3 hover:bg-white/[0.02] transition-all rounded-r-2xl group/item">
                                                 <span className="text-[9px] font-mono text-red-600/60 shrink-0 mt-1">
                                                     {new Date(alert.timestamp || Date.now()).toLocaleTimeString('uk-UA')}
                                                 </span>
                                                 <div>
                                                     <p className="text-[10px] font-black text-slate-200 leading-relaxed uppercase tracking-widest group-hover/item:text-white transition-colors">
                                                         {alert.message || alert.type} 
                                                         {alert.company && <span className="text-red-500 ml-2">[{alert.company}]</span>}
                                                     </p>
                                                     <div className="flex items-center gap-3 mt-2">
                                                         <span className={cn(
                                                             "text-[8px] font-mono px-2 py-0.5 rounded border uppercase",
                                                             alert.severity === 'critical' ? "text-red-500 border-red-500/20 bg-red-500/5" : "text-slate-500 border-white/5 bg-white/5"
                                                         )}>
                                                             РИЗИК_{alert.severity === 'critical' ? '1.0' : '0.4'}
                                                         </span>
                                                         <span className="text-[8px] font-mono text-slate-700 uppercase">ВЕ ИФІКОВАНО_AI</span>
                                                     </div>
                                                 </div>
                                             </div>
                                         ))
                                     ) : (
                                         [...Array(8)].map((_, i) => (
                                             <div key={i} className="flex gap-6 border-l border-white/5 pl-6 py-4 opacity-40">
                                                 <span className="text-[9px] font-mono text-slate-600 shrink-0">0{i}:24:14</span>
                                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                     СИНХ ОНІЗАЦІЯ ПОТОКУ... ВУЗОЛ_0{i+1}
                                                 </p>
                                             </div>
                                         ))
                                     )}
                                 </div>

                                 <button className="w-full mt-10 py-5 bg-white/5 hover:bg-red-600 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 group/btn">
                                     БІЛЬШЕ ПОДІЙ <Activity size={14} className="group-hover/btn:animate-spin" />
                                 </button>
                             </TacticalCard>

                             <HoloContainer className="p-10 h-[250px] relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-8">
                                      <PieChart size={120} className="text-[#f43f5e]/5 group-hover:text-[#f43f5e]/10 transition-colors rotate-12" />
                                  </div>
                                  <div className="relative z-10 space-y-6">
                                      <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] italic">МАТ ИЦЯ_ЗАГ ОЗ</h3>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <p className="text-[8px] font-mono text-slate-500 uppercase">ЗОВНІШНІ</p>
                                              <p className="text-2xl font-black text-[#E11D48] italic leading-none mt-2">ВИСОКА</p>
                                          </div>
                                          <div>
                                              <p className="text-[8px] font-mono text-slate-500 uppercase">ВНУТ ІШНІ</p>
                                              <p className="text-2xl font-black text-[#f43f5e] italic leading-none mt-2">СТАБІЛЬНА</p>
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
