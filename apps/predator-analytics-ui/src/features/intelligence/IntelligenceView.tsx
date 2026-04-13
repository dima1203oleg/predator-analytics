/**
 * 🧠 SOVEREIGN INTELLIGENCE NEXUS | v56.2-TITAN
 * PREDATOR СТРАТЕГІЧНИЙ ОСІНТ-ХАБ (INTEL NEXUS)
 * 
 * Центральна точка розвідувального циклу:
 * Глобальний аналіз ринків, стратегічні пріоритети,
 * шанси для експансії та виявлення прихованих загроз.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect } from 'react';
import {
    Activity, Brain, Radio, Shield, Sparkles, Zap, Network, Target,
    ShieldCheck, Cpu, Database, Binary, Search, Globe, RadioTower, Eye, Crosshair,
    ChevronRight, Info, Layers, Workflow, Terminal, Boxes, Fingerprint,
    TrendingUp, AlertCircle, RefreshCw, Lock, Orbit, BarChart3, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewHeader } from '@/components/ViewHeader';
import { SemanticRadar } from '@/components/graph/SemanticRadar';
import { PageTransition } from '@/components/layout/PageTransition';
import { DatabasePipelineMonitor } from '@/components/pipeline/DatabasePipelineMonitor';
import { Badge } from '@/components/ui/badge';
import AIInsightsHub from '@/features/ai/AIInsightsHub';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/lib/utils';
import { SearchWidget } from '@/components/search/SearchWidget';
import { SovereignReportWidget } from '@/components/intelligence/SovereignReportWidget';

const IntelligenceView: React.FC = () => {
    const [selectedUeid, setSelectedUeid] = useState<string | null>('12345678');
    const [isThinking, setIsThinking] = useState(false);
    const [activeLayer, setActiveLayer] = useState<'graph' | 'radar'>('graph');

    const triggerCognitiveRefresh = () => {
        setIsThinking(true);
        setTimeout(() => setIsThinking(false), 2000);
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(220, 38, 38, 0.04)" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(220,38,38,0.06),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 max-w-[1750px] mx-auto p-4 sm:p-12 space-y-16">
                    
                    {/* Tactical Search Entry */}
                    <div className="max-w-4xl mx-auto mb-16">
                        <SearchWidget className="scale-105 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]" />
                    </div>

                    <ViewHeader
                        title={
                            <div className="flex items-center gap-10">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                    <div className="relative p-7 bg-black border border-red-900/40 rounded-[2.5rem] shadow-2xl">
                                        <Brain size={42} className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                       <span className="badge-v2 bg-red-600/10 border border-red-600/20 text-red-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                         INTEL_NEXUS // GLOBAL_RECON
                                       </span>
                                       <div className="h-px w-10 bg-red-600/20" />
                                       <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v56.2 TITAN</span>
                                    </div>
                                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
                                        ЦЕНТР <span className="text-red-600 underline decoration-red-600/20 decoration-8">РОЗВІДКИ</span>
                                    </h1>
                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                                        Аналіз Ринку • Оперативні Шанси • Пріоритети Суверенітету
                                    </p>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'COGNITIVE_LOAD', value: '72%', color: 'danger', icon: <Activity size={14} />, animate: true },
                            { label: 'GRAPH_DEPTH', value: 'L15', color: 'primary', icon: <Network size={14} /> },
                            { label: 'REACTION_TIME', value: '6ms', color: 'success', icon: <Zap size={14} />, animate: true }
                        ]}
                        breadcrumbs={['STRATEGY', 'NEXUS', 'RECON_HUB']}
                        actions={
                            <div className="flex gap-4">
                                <button
                                    onClick={triggerCognitiveRefresh}
                                    className="px-10 py-5 bg-red-700 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-red-600 transition-all flex items-center gap-4 italic group"
                                >
                                    {isThinking ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                    ОПТИМІЗУВАТИ_ЯДРО
                                </button>
                                <button className="p-5 bg-black/60 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                                    <RadioTower size={22} className="animate-pulse text-red-600" />
                                </button>
                            </div>
                        }
                    />

                    <div className="grid grid-cols-12 gap-12">
                        
                        {/* MAIN OPERATIONAL AREA */}
                        <div className="col-span-12 xl:col-span-8 space-y-12">
                            
                            {/* Semantic Matrix HUD */}
                            <section className="relative rounded-[3rem] bg-black border-2 border-white/[0.04] p-10 shadow-3xl overflow-hidden group">
                                <div className="absolute inset-0 bg-red-600/[0.01] pointer-events-none" />
                                <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/[0.04] relative z-20">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 rounded-2xl bg-red-600/10 text-red-600 border border-red-600/20">
                                            <Layers size={24} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">СЕМАНТИЧНА ТА СТРАТЕГІЧНА МАТРИЦЯ</h3>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">VISUAL_INTELLIGENCE // TOPOLOGY_v56.2</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-white/[0.02] rounded-xl p-1.5 border border-white/5 backdrop-blur-3xl">
                                        <button 
                                            onClick={() => setActiveLayer('graph')}
                                            className={cn("px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all italic", activeLayer === 'graph' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-300')}
                                        >GRAPH_SCAN</button>
                                        <button 
                                            onClick={() => setActiveLayer('radar')}
                                            className={cn("px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all italic", activeLayer === 'radar' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-300')}
                                        >RADAR_OSINT</button>
                                    </div>
                                </div>

                                <div className="h-[550px] relative z-10">
                                    <SemanticRadar className="h-full w-full opacity-90 scale-105" />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-12 pt-10 border-t border-white/[0.04]">
                                    {[
                                        { label: 'SYNAPSE_DELAY', value: '6.2ms', sub: 'OPTIMIZED', c: 'text-red-500' },
                                        { label: 'ENTROPY_IDX', value: '0.084', sub: 'STABLE', c: 'text-amber-500' },
                                        { label: 'INTEL_RELIANCE', value: 'SURPLUS', sub: 'TITAN-01', c: 'text-emerald-500' },
                                        { label: 'ACTIVE_AGENTS', value: '14/14', sub: 'DEPLOYED', c: 'text-sky-500' },
                                    ].map((s, i) => (
                                        <div key={i} className="text-left font-black italic">
                                            <p className="text-[9px] text-slate-700 uppercase tracking-widest mb-1">{s.label}</p>
                                            <p className={cn("text-2xl font-mono tracking-tighter leading-none", s.c)}>{s.val || s.value}</p>
                                            <p className="text-[8px] text-slate-800 uppercase tracking-[0.2em] mt-1">{s.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Secondary Hubs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <section className="p-10 rounded-[3rem] bg-black/60 border border-white/[0.05] shadow-2xl relative overflow-hidden group">
                                     <div className="flex items-center justify-between mb-8 border-b border-white/[0.04] pb-6">
                                        <div className="flex items-center gap-5">
                                           <Database size={24} className="text-emerald-500" />
                                           <h4 className="text-[14px] font-black text-white italic uppercase tracking-widest">ПОТОКИ ІНГЕСТІЇ</h4>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                     </div>
                                     <div className="h-[300px] overflow-y-auto no-scrollbar">
                                        <DatabasePipelineMonitor />
                                     </div>
                                </section>

                                <section className="p-10 rounded-[3rem] bg-black border-2 border-red-900/10 shadow-2xl relative overflow-hidden group">
                                     <div className="flex items-center justify-between mb-8 border-b border-white/[0.04] pb-6">
                                        <div className="flex items-center gap-5">
                                           <Terminal size={24} className="text-red-600" />
                                           <h4 className="text-[14px] font-black text-white italic uppercase tracking-widest">КОГНІТИВНІ ОПЕРАЦІЇ</h4>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                     </div>
                                     <div className="space-y-6">
                                        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-4">
                                            <p className="text-[13px] font-black text-slate-300 italic leading-snug">Ядро AZR-V56.GEN завершило 14.2M циклів дедукції.</p>
                                            <div className="flex items-center gap-3">
                                               <Info size={12} className="text-red-500" />
                                               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">32 НОВІ САНКЦІЙНІ ПАТТЕРНИ</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-black border border-white/5">
                                               <p className="text-[8px] font-black text-slate-700 uppercase mb-1">TRUST_INDEX</p>
                                               <p className="text-xl font-black text-red-500 font-mono italic">0.9999</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-black border border-white/5">
                                               <p className="text-[8px] font-black text-slate-700 uppercase mb-1">REACTION</p>
                                               <p className="text-xl font-black text-red-400 font-mono italic">4ms</p>
                                            </div>
                                        </div>
                                     </div>
                                </section>
                            </div>
                        </div>

                        {/* SIDEBAR INTELLIGENCE */}
                        <div className="col-span-12 xl:col-span-4 space-y-12">
                            
                            {/* Neural Pulse Area */}
                            <div className="rounded-[3rem] bg-black/60 border border-white/[0.05] overflow-hidden shadow-3xl h-[650px] relative">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.05),transparent_70%)] pointer-events-none" />
                                <AIInsightsHub isWidgetMode={true} />
                            </div>

                            {/* Tactical Focus Dashboard */}
                            <div className="rounded-[3rem] bg-black border-2 border-white/[0.04] p-10 shadow-3xl space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                                   <Orbit size={240} className="text-red-500" />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-8 flex items-center gap-4">
                                   <Target size={16} className="text-red-600" /> ТАКТИЧНИЙ ФОКУС
                                </h3>
                                <div className="space-y-4 relative z-10">
                                   {[
                                      { l: 'ШАНСИ РИНКУ', v: '12 АКТИВНИХ', c: 'text-emerald-500', icon: BarChart3 },
                                      { l: 'ПРИХОВАНІ РИЗИКИ', v: '04 ВИЯВЛЕНО', c: 'text-red-500', icon: AlertCircle },
                                      { l: 'ПРІОРИТЕТИ_CEO', v: '03 КРИТИЧНІ', c: 'text-white', icon: Star },
                                   ].map((m, i) => (
                                      <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:border-white/10 transition-all cursor-pointer group">
                                         <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl group-hover:bg-red-600/10 group-hover:text-red-500 transition-all">
                                               <m.icon size={18} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-slate-300 transition-colors">{m.l}</span>
                                         </div>
                                         <p className={cn("text-lg font-black italic tracking-tighter leading-none", m.c)}>{m.v}</p>
                                      </div>
                                   ))}
                                </div>
                                <button className="w-full py-5 bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all shadow-xl italic mt-6">
                                   ПОВНИЙ СИСТЕМНИЙ АУДИТ
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
                `}} />
            </div>
        </PageTransition>
    );
};

export default IntelligenceView;
