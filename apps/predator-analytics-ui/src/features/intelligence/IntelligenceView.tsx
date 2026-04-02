/**
 * 🧠 SOVEREIGN INTELLIGENCE NEXUS | v55.6
 * PREDATOR КОГНІТИВНЕ СВЯТИЛИЩЕ v55.6 (PREMIUM MATRIX)
 * 
 * Централізація семантичного графу, нейро-інсайтів та глибинної аналітики.
 * © 2026 PREDATOR Analytics - Повна українізація (HR-04)
 */

import React, { useState, useEffect } from 'react';
import {
    Activity, Brain, Radio, Share2, Shield, Sparkles, Zap, Network, Target,
    ShieldCheck, Cpu, Database, Binary, Search, Globe, RadioTower, Eye, Crosshair,
    ChevronRight, Info, Layers, Workflow, Terminal, Boxes, Fingerprint,
    TrendingUp, AlertCircle, RefreshCw, Lock, Orbit, Activity as ActivityIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { SemanticRadar } from '@/components/graph/SemanticRadar';
import { PageTransition } from '@/components/layout/PageTransition';
import { DatabasePipelineMonitor } from '@/components/pipeline/DatabasePipelineMonitor';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { Badge } from '@/components/ui/badge';
import AIInsightsHub from '@/features/ai/AIInsightsHub';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberOrb } from '@/components/CyberOrb';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';
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
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(99, 102, 241, 0.08)" />
                <NeuralPulse color="rgba(99, 102, 241, 0.05)" size={1500} />
                <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-indigo-600 to-transparent z-50 opacity-30 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />

                <div className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-12 space-y-16">
                    <SearchWidget className="mb-16 scale-105" />
                    {/* View Header with more premium touch */}
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-10">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-indigo-500/30 blur-[80px] rounded-full scale-150 opacity-40 animate-pulse group-hover:opacity-70 transition-opacity" />
                                    <div className="relative p-8 bg-slate-900/80 border border-indigo-500/30 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] backdrop-blur-3xl group-hover:border-indigo-400 transition-all">
                                        <Brain size={48} className="text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-6xl font-black text-white tracking-[0.05em] uppercase leading-none font-display italic skew-x-[-2.5deg]">
                                        СВЯТИЛИЩЕ <span className="text-indigo-500">РОЗВІДКИ</span>
                                    </h1>
                                    <div className="flex items-center gap-6 mt-6">
                                        <div className="h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent" />
                                        <span className="text-[11px] font-mono font-black text-indigo-500/90 uppercase tracking-[0.6em] animate-pulse">
                                            СУВЕРЕННЕ_КОГНІТИВНЕ_ЯДРО // v55.6
                                        </span>
                                        <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 text-[9px] tracking-[0.3em] bg-indigo-500/5 py-1 px-4 font-black">PREMIUM_MATRIX</Badge>
                                    </div>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'НЕЙРО_НАВАНТАЖЕННЯ', value: '72%', color: 'success', icon: <Activity size={14} />, animate: true },
                            { label: 'РІВЕНЬ_ГРАФА', value: 'L15', color: 'primary', icon: <Network size={14} /> },
                            { label: 'OODA_ЦИКЛ', value: '6ms', color: 'success', icon: <Zap size={14} />, animate: true }
                        ]}
                        breadcrumbs={['АРХІТЕКТУРА', 'РОЗВІДКА', 'КОГНІТИВНЕ_ЯДРО']}
                        actions={
                            <div className="flex gap-6">
                                <motion.button 
                                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(99, 102, 241, 0.4)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={triggerCognitiveRefresh}
                                    className="px-10 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:bg-indigo-500 transition-all flex items-center gap-4 italic group"
                                >
                                    {isThinking ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
                                    ОПТИМІЗУВАТИ_ЯДРО
                                </motion.button>
                                <button className="p-5 bg-slate-900/80 border border-white/10 rounded-3xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-2xl">
                                    <RadioTower size={24} className="animate-pulse text-indigo-400" />
                                </button>
                            </div>
                        }
                    />

                    <div className="grid grid-cols-12 gap-16 relative z-10">
                        {/* Main Interaction Cluster */}
                        <div className="col-span-12 xl:col-span-8 flex flex-col gap-12">
                            {/* Semantic Radar Matrix - The Grand Visualization */}
                            <TacticalCard variant="holographic" className="overflow-hidden min-h-[750px] bg-slate-900/40 relative group/radar rounded-[4rem] border-white/5 shadow-[0_60px_150px_-30px_rgba(0,0,0,1)]" noPadding>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)]" />
                                
                                <div className="absolute top-12 left-12 z-20 flex items-center gap-10">
                                    <div className="p-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 text-indigo-400 shadow-3xl backdrop-blur-3xl group-hover/radar:border-indigo-400/40 transition-all">
                                        <Layers size={32} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic skew-x-[-3deg]">СЕМАНТИЧНА <span className="text-indigo-400">МАТРИЦЯ</span></h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-2 italic border-l-2 border-indigo-500/40 pl-4">VISUAL_TOPOLOGY_v55.6</p>
                                    </div>
                                </div>

                                <div className="absolute top-12 right-12 z-30 flex gap-6">
                                     <div className="flex bg-black/60 rounded-[2rem] p-2 border border-white/10 backdrop-blur-3xl shadow-3xl">
                                         <button 
                                            onClick={() => setActiveLayer('graph')}
                                            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic", activeLayer === 'graph' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'text-slate-500 hover:text-slate-300')}
                                         >ГРАФ_PRO</button>
                                         <button 
                                            onClick={() => setActiveLayer('radar')}
                                            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic", activeLayer === 'radar' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'text-slate-500 hover:text-slate-300')}
                                         >РАДАР_X</button>
                                     </div>
                                </div>

                                <div className="absolute inset-0 z-0 opacity-40">
                                    <CyberGrid color="rgba(99, 102, 241, 0.15)" />
                                </div>

                                <div className="flex-1 h-full pt-48 pb-16 px-12">
                                    <SemanticRadar className="h-full w-full opacity-90 transition-opacity duration-1000 scale-105" />
                                </div>

                                <div className="absolute bottom-12 left-12 z-20">
                                    <div className="flex items-center gap-16 bg-black/60 p-10 rounded-[3rem] border border-white/5 backdrop-blur-3xl shadow-3xl">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">ЗАТРИМКА_v55</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                                                <span className="text-3xl font-black text-white font-mono italic tracking-tighter">6.2ms</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-16 bg-white/10" />
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">ІНДЕКС_ЕНТРОПІЇ</span>
                                            <span className="text-3xl font-black text-amber-500 font-mono italic tracking-tighter">0.084</span>
                                        </div>
                                        <div className="w-px h-16 bg-white/10" />
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">ГЛИБИНА_АНАЛІЗУ</span>
                                            <span className="text-3xl font-black text-indigo-400 font-mono italic tracking-tighter">ULTRA</span>
                                        </div>
                                    </div>
                                </div>
                            </TacticalCard>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <HoloContainer className="p-12 min-h-[500px] flex flex-col relative overflow-hidden group/pipe bg-slate-900/60 rounded-[4rem] border-white/5 shadow-3xl">
                                    <div className="flex items-center justify-between mb-10 relative z-10 border-b border-white/5 pb-8">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-emerald-500/10 rounded-2xl shadow-inner">
                                                <Database size={28} className="text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic italic">ПАЙПЛАЙНИ <span className="text-emerald-400">ДИНАМІКИ</span></h3>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">SYNC_ACTIVE_PROTOCOL</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400 uppercase tracking-[0.2em] font-black py-1.5 px-4 rounded-xl">LIVE</Badge>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-6 no-scrollbar relative z-10">
                                        <DatabasePipelineMonitor />
                                    </div>
                                    <div className="absolute -bottom-24 -right-24 opacity-[0.03] group-hover/pipe:opacity-[0.08] transition-all duration-1000 transform group-hover/pipe:rotate-12 group-hover/pipe:scale-110">
                                        <Workflow size={350} className="text-emerald-500" />
                                    </div>
                                </HoloContainer>

                                <TacticalCard
                                    variant="cyber"
                                    className="p-12 min-h-[500px] border-indigo-500/20 bg-indigo-500/[0.02] relative overflow-hidden rounded-[4rem] group/ops shadow-3xl"
                                >
                                    <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-indigo-500/20 rounded-2xl shadow-2xl">
                                                <Terminal size={28} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">КОГНІТИВНІ <span className="text-indigo-500">ОПЕРАЦІЇ</span></h3>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">SOVEREIGN_NODE_v55.6</p>
                                            </div>
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                                    </div>

                                    <div className="space-y-10 flex-1 overflow-y-auto no-scrollbar pr-4 italic">
                                        <div className="p-10 bg-black/60 border border-white/5 rounded-[3rem] relative group/sub overflow-hidden hover:border-indigo-500/40 transition-all shadow-2xl">
                                            <div className="absolute inset-0 bg-indigo-500/5 blur-3xl opacity-0 group-hover/sub:opacity-100 transition-opacity" />
                                            <p className="text-[15px] text-slate-300 leading-relaxed font-black relative z-10">
                                                Ядро <span className="text-indigo-400 text-xl font-display">AZR-V55.GEN</span> успішно завершило <span className="text-emerald-400">14.2M</span> циклів дедукції.
                                            </p>
                                            <div className="flex items-center gap-4 mt-8 relative z-10 opacity-60">
                                                <Info size={16} className="text-indigo-400" />
                                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Виявлено 32 нові паттерни офшорного транзиту.</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] hover:border-indigo-500/30 transition-all shadow-xl group/stat">
                                                <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mb-4 group-hover/stat:text-indigo-400 transition-colors">ІНДЕКС_ДОВІРИ</div>
                                                <div className="text-4xl font-mono font-black text-indigo-400 tracking-tighter italic">0.9999</div>
                                            </div>
                                            <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] hover:border-emerald-500/30 transition-all shadow-xl group/stat">
                                                <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mb-4 group-hover/stat:text-emerald-400 transition-colors">ПІК_ОПЕРАЦІЙ</div>
                                                <div className="text-4xl font-mono font-black text-emerald-400 tracking-tighter italic">4ms</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-6">
                                            {['СУВЕРЕННИЙ', 'НЕЙРО-v55', 'ДЕТЕРМІНІСТИЧНИЙ', 'АВТОНОМНИЙ', 'ГЛОБАЛЬНИЙ'].map(tag => (
                                                <span key={tag} className="px-6 py-3 bg-black/80 border border-white/10 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-indigo-300 hover:border-indigo-500/50 transition-all cursor-crosshair hover:bg-slate-900">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="absolute -right-16 -bottom-16 opacity-[0.02] group-hover/ops:opacity-[0.06] transition-all duration-1000 transform group-hover/ops:rotate-[-10deg] group-hover/ops:scale-110">
                                        <Cpu size={380} className="text-indigo-400" />
                                    </div>
                                </TacticalCard>
                            </div>
                        </div>

                        {/* Intelligence & Insights Sidebar */}
                        <div className="col-span-12 xl:col-span-4 flex flex-col gap-12">
                            {/* Neural Insights Panel */}
                            <div className="relative group/insights h-[650px]">
                                <div className="absolute -inset-2 bg-gradient-to-b from-indigo-500/40 to-transparent blur-[100px] opacity-20 group-hover/insights:opacity-40 transition-opacity" />
                                <div className="relative h-full bg-[#030712]/90 backdrop-blur-3xl border border-white/10 rounded-[4rem] overflow-hidden shadow-[0_60px_120px_-20px_rgba(0,0,0,1)]">
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                                    <AIInsightsHub isWidgetMode={true} />
                                </div>
                            </div>

                            {/* Sovereign Report Matrix */}
                            {selectedUeid && (
                                <SovereignReportWidget
                                    ueid={selectedUeid}
                                    className="min-h-[550px] border-indigo-500/20 bg-slate-900/60 rounded-[4rem] shadow-3xl"
                                />
                            )}

                            {/* Diagnostics Cluster */}
                            <TacticalCard variant="glass" className="p-12 bg-slate-950/80 border border-white/5 rounded-[4rem] group hover:border-indigo-500/40 transition-all shadow-3xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                    <Orbit size={240} className="text-indigo-400" />
                                </div>
                                <div className="flex items-center gap-6 mb-12 relative z-10 border-b border-white/5 pb-8">
                                    <div className="p-5 bg-indigo-500/10 rounded-3xl shadow-2xl">
                                        <Boxes size={28} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-[0.4em] italic leading-none">ЗГІДНІСТЬ_ЯДРА</h4>
                                        <p className="text-[10px] font-mono text-slate-600 mt-3 uppercase tracking-widest italic">DIAGNOSTIC_PROTOCOL_v55</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-8 relative z-10">
                                    {[
                                        { label: 'АСИНХРОННИЙ_ІНДЕКС', val: '99.99%', sub: 'ОПТИМАЛЬНО', icon: ShieldCheck, color: 'text-emerald-400' },
                                        { label: 'ВЕКТОРНИЙ_ДРЕЙФ', val: '0.002', sub: 'МІНІМАЛЬНИЙ', icon: TrendingUp, color: 'text-blue-400' },
                                        { label: 'СИГНАЛЬНИЙ_ШУМ', val: '0.09dB', sub: 'ІЗОЛЬОВАНО', icon: Radio, color: 'text-amber-400' }
                                    ].map(stat => (
                                        <div key={stat.label} className="flex items-center justify-between p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] hover:bg-white/5 transition-all group/it shadow-xl">
                                            <div className="flex items-center gap-6">
                                                <stat.icon size={22} className={cn("transition-transform group-hover/it:scale-125 group-hover/it:rotate-6", stat.color)} />
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">{stat.label}</p>
                                                    <p className={cn("text-[9px] font-black uppercase tracking-tighter opacity-60 italic", stat.color)}>{stat.sub}</p>
                                                </div>
                                            </div>
                                            <span className="text-3xl font-black text-white font-mono italic tracking-tighter">{stat.val}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full mt-12 py-8 bg-indigo-500/5 border border-indigo-500/30 rounded-[2.5rem] text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] hover:text-white hover:bg-indigo-600 hover:border-indigo-400 transition-all flex items-center justify-center gap-6 shadow-2xl group italic"
                                >
                                     <Fingerprint size={20} className="group-hover:rotate-12 transition-transform" /> ПЕРЕВІРИТИ_ЦІЛІСНІСТЬ
                                </motion.button>
                            </TacticalCard>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .font-display {
                            font-family: 'Inter', sans-serif;
                        }
                    `
                }} />
            </div>
        </PageTransition>
    );
};

export default IntelligenceView;
