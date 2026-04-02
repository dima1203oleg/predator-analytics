/**
 * 🧠 PREDATOR Strategic Intelligence Center | v55.5
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
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';
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
                                        STRATEGIC <span className="text-indigo-500">INTEL</span>
                                    </h1>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="h-0.5 w-12 bg-indigo-500/50" />
                                        <span className="text-[10px] font-mono font-black text-indigo-500/80 uppercase tracking-[0.5em] animate-pulse">
                                            COGNITIVE_WARFARE_SUITE // v55.5
                                        </span>
                                    </div>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'АКТИВНІ АГЕНТИ', value: '1,248', color: 'primary', icon: <Cpu size={14} />, animate: true },
                            { label: 'STRAT_SCORE', value: '0.82', color: 'success', icon: <TrendingUp size={14} /> },
                            { label: 'ЧАС РЕАКЦІЇ', value: '4ms', color: 'warning', icon: <Zap size={14} />, animate: true }
                        ]}
                        breadcrumbs={['ЯДРО', 'СТРАТЕГІЧНИЙ_ЦЕНТР', 'МОНІТОРИНГ']}
                    />

                    <div className="grid grid-cols-12 gap-10">
                        
                        {/* Main Interaction Area */}
                        <div className="col-span-12 xl:col-span-8 space-y-10">
                             
                             {/* Strategic Tabs */}
                             <div className="flex bg-slate-900/40 backdrop-blur-3xl p-2 rounded-[2.5rem] border border-white/5 self-start shadow-xl">
                                {['STRATEGIC', 'TACTICAL', 'NEURAL'].map(tab => (
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
                                    status="ACTIVE" 
                                    progress={84} 
                                    icon={<Globe size={24} />} 
                                    color="indigo" 
                                 />
                                 <IntelligenceNode 
                                    title="ВУЗЛИ_РИЗИКУ_v5" 
                                    status="CRITICAL" 
                                    progress={92} 
                                    icon={<ShieldAlert size={24} />} 
                                    color="rose" 
                                 />
                                 <IntelligenceNode 
                                    title="ОПТИМІЗАЦІЯ_OODA" 
                                    status="IDLE" 
                                    progress={12} 
                                    icon={<Zap size={24} />} 
                                    color="amber" 
                                 />
                                 <IntelligenceNode 
                                    title="СЕМАНТИЧНИЙ_АНАЛІЗ" 
                                    status="SCANNING" 
                                    progress={45} 
                                    icon={<Terminal size={24} />} 
                                    color="emerald" 
                                 />
                                 <IntelligenceNode 
                                    title="КРИПТО_ПОТОКИ" 
                                    status="ENCRYPTED" 
                                    progress={68} 
                                    icon={<Lock size={24} />} 
                                    color="indigo" 
                                 />
                                 <IntelligenceNode 
                                    title="НЕЙРО_ПРОГНОЗ" 
                                    status="LEARNING" 
                                    progress={77} 
                                    icon={<Sparkles size={24} />} 
                                    color="emerald" 
                                 />
                             </div>

                             {/* Central Strategic Visualizer */}
                             <TacticalCard variant="holographic" className="h-[550px] relative overflow-hidden group/viz" noPadding>
                                 <AdvancedBackground className="opacity-30" />
                                 <CyberGrid color="rgba(99, 102, 241, 0.05)" />
                                 
                                 <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="relative">
                                          <div className="absolute inset-0 bg-indigo-500/20 blur-[150px] rounded-full animate-pulse" />
                                          <CyberOrb size={300} color="#6366f1" intensity={0.8} pulse />
                                          <div className="absolute inset-0 flex items-center justify-center">
                                              <div className="relative w-48 h-48 border-2 border-dashed border-indigo-500/40 rounded-full animate-[spin_20s_linear_infinite]" />
                                              <div className="absolute inset-0 flex items-center justify-center">
                                                  <Brain size={80} className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                                              </div>
                                          </div>
                                      </div>
                                 </div>

                                 <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                                      <div className="space-y-4">
                                          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] italic">CORE_STABILITY</h4>
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
                                          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">NEURAL_LOAD: 42.8%</p>
                                          <p className="text-[14px] font-black text-white italic uppercase tracking-widest leading-none">PREDICTIVE_HORIZON: 72H</p>
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
                                         <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest italic">TARGET_PRIORITY_v55</p>
                                     </div>
                                 </div>

                                 <div className="space-y-6">
                                     {[
                                         { name: 'IDENTIFY_UBO_CHORUS', status: 'IN_PROGRESS', val: 74, color: 'text-indigo-400' },
                                         { name: 'TRACE_OFFSHORE_NEXUS', status: 'CRITICAL', val: 91, color: 'text-rose-400' },
                                         { name: 'MAP_SUPPLY_CHAINS', status: 'SCANNING', val: 42, color: 'text-emerald-400' },
                                         { name: 'AI_ANOMALY_DETECTION', status: 'DONE', val: 100, color: 'text-indigo-400' }
                                     ].map(goal => (
                                         <div key={goal.name} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all group/goal">
                                             <div className="flex justify-between items-center mb-4">
                                                  <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover/goal:text-indigo-400 transition-colors italic">{goal.name}</span>
                                                  <Badge className={cn("text-[7px] border-none px-2 py-0.5", goal.status === 'CRITICAL' ? "bg-rose-500 text-black" : "bg-white/10 text-slate-500")}>
                                                      {goal.status}
                                                  </Badge>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                 <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                     <div className={cn("h-full", goal.val === 100 ? "bg-emerald-500" : "bg-indigo-500")} style={{ width: `${goal.val}%` }} />
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
                                         <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">INTEL_FEED</h4>
                                         <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest italic">REALTIME_DECRYPTOR</p>
                                     </div>
                                 </div>

                                 <div className="space-y-6 max-h-[300px] overflow-y-auto no-scrollbar pr-4 italic">
                                     {[...Array(6)].map((_, i) => (
                                         <div key={i} className="flex gap-6 border-l border-white/5 pl-6 py-2 hover:border-amber-500 transition-colors">
                                             <span className="text-[9px] font-mono text-slate-600 shrink-0">0{i}:24:14</span>
                                             <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                                                 СИСТЕМА $\{`AGENT_0${i+1}`\} ВИЯВИЛА НОВИЙ ПАТЕРН ПЕРЕМІЩЕННЯ АКТИВІВ У СЕКТОРІ B-12. СКОР РИЗИКУ: 0.88.
                                             </p>
                                         </div>
                                     ))}
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
                                      <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] italic">МАТРИЦЯ_ПОГРОЗ</h3>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <p className="text-[8px] font-mono text-slate-500 uppercase">EXTERNAL</p>
                                              <p className="text-2xl font-black text-rose-500 italic leading-none mt-2">HIGH</p>
                                          </div>
                                          <div>
                                              <p className="text-[8px] font-mono text-slate-500 uppercase">INTERNAL</p>
                                              <p className="text-2xl font-black text-emerald-500 italic leading-none mt-2">STABLE</p>
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
