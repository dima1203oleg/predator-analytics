/**
 * 🧠 Sovereign Intelligence Nexus | v11.5 Premium Matrix
 * PREDATOR Когнітивне Святилище
 * 
 * Централізація семантичного графу, нейро-інсайтів та глибинної аналітики.
 * © 2026 PREDATOR Analytics - Повна українізація v11.5 OSINT-HUB
 */

import React, { useState, useEffect } from 'react';
import {
    Activity, Brain, Radio, Share2, Shield, Sparkles, Zap, Network, Target,
    ShieldCheck, Cpu, Database, Binary, Search, Globe, RadioTower, Eye, Crosshair,
    ChevronRight, Info, Layers, Workflow, Terminal, Boxes, Fingerprint,
    TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';
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
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />

                <div className="relative z-10 max-w-[1900px] mx-auto p-6 sm:p-12 space-y-12">
                    {/* Integrated Strategic Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-8">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full scale-150 opacity-30 animate-pulse" />
                                <div className="relative p-7 bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] shadow-2xl transition-all group-hover:scale-105 group-hover:border-indigo-400">
                                    <Brain size={44} className="text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none font-display italic">
                                    СВЯТИЛИЩЕ <span className="text-indigo-400">РОЗВІДКИ</span>
                                </h1>
                                <div className="flex items-center gap-3 mt-4">
                                    <span className="text-[10px] font-mono font-black text-indigo-500/80 uppercase tracking-[0.5em] animate-pulse">
                                        СУВЕРЕННЕ_КОГНІТИВНЕ_ЯДРО // v11.5
                                    </span>
                                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-[8px] tracking-widest bg-indigo-500/5">OSINT_HUB_v11.5_CERTIFIED</Badge>
                                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[8px] tracking-widest bg-emerald-500/5">CONSTITUTIONAL_SHIELD_ACTIVE</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-10">
                             <div className="flex bg-black/40 p-2 rounded-[2rem] border border-white/5 shadow-inner">
                                <div className="px-6 py-3 border-r border-white/5 text-right">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">НЕЙРО_НАВАНТАЖЕННЯ</div>
                                    <div className="text-xl font-black text-emerald-400 font-mono italic">64%</div>
                                </div>
                                <div className="px-6 py-3 text-right">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">РІВЕНЬ_ГРАФА</div>
                                    <div className="text-xl font-black text-indigo-400 font-mono italic">L14</div>
                                </div>
                             </div>
                             
                             <div className="flex gap-4">
                                <button 
                                    onClick={triggerCognitiveRefresh}
                                    className="px-8 py-5 bg-indigo-500 text-black font-black rounded-3xl text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:bg-indigo-400 transition-all flex items-center gap-3 group active:scale-95"
                                >
                                    {isThinking ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                    ОПТИМІЗУВАТИ_ЯДРО
                                </button>
                                <button className="p-5 bg-slate-900 border border-white/10 rounded-3xl text-slate-400 hover:text-white hover:border-emerald-500/30 transition-all">
                                    <RadioTower size={20} className="animate-pulse" />
                                </button>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-10 relative z-10">
                        {/* Main Interaction Cluster */}
                        <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">
                            {/* Semantic Radar Matrix - The Grand Visualization */}
                            <TacticalCard variant="holographic" className="overflow-hidden min-h-[700px] bg-slate-950/40 relative group" noPadding>
                                <div className="absolute top-10 left-10 z-20 flex items-center gap-8">
                                    <div className="p-5 bg-indigo-500/20 rounded-[1.5rem] border border-indigo-500/30 text-indigo-400 shadow-2xl group-hover:scale-110 transition-transform">
                                        <Layers size={28} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">СЕМАНТИЧНА РАДАРНА МАТРИЦЯ</h3>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mt-1 border-l-2 border-indigo-500/40 pl-3">ВІЗУАЛІЗАЦІЯ_ГРАФА_ЗВ'ЯЗКІВ_v55</p>
                                    </div>
                                </div>

                                <div className="absolute top-10 right-10 z-20 flex gap-4">
                                     <div className="flex bg-black/60 rounded-[1.5rem] p-1.5 border border-white/5 backdrop-blur-3xl shadow-2xl">
                                         <button 
                                            onClick={() => setActiveLayer('graph')}
                                            className={cn("px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", activeLayer === 'graph' ? 'bg-indigo-500 text-black shadow-lg' : 'text-slate-500 hover:text-slate-300')}
                                         >ГРАФ_v5</button>
                                         <button 
                                            onClick={() => setActiveLayer('radar')}
                                            className={cn("px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", activeLayer === 'radar' ? 'bg-indigo-500 text-black shadow-lg' : 'text-slate-500 hover:text-slate-300')}
                                         >РАДАР_X</button>
                                     </div>
                                </div>

                                <div className="absolute inset-x-0 bottom-0 py-20 px-10 pointer-events-none bg-gradient-to-t from-black/80 to-transparent" />

                                <div className="absolute inset-0 z-0">
                                    <CyberGrid color="rgba(79,70,229,0.1)" />
                                </div>

                                <div className="flex-1 h-full pt-32 pb-10">
                                    <SemanticRadar className="h-full w-full opacity-90 transition-opacity duration-1000" />
                                </div>

                                <div className="absolute bottom-10 left-10 z-20">
                                    <div className="flex items-center gap-12 bg-black/60 p-8 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">ЗАТРИМКА_v55</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-2xl font-black text-white font-mono italic">8.4ms</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-12 bg-white/10" />
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">ІНДЕКС_ЕНТРОПІЇ</span>
                                            <span className="text-2xl font-black text-amber-500 font-mono italic">0.122</span>
                                        </div>
                                        <div className="w-px h-12 bg-white/10" />
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">ГЛИБИНА_АНАЛІЗУ</span>
                                            <span className="text-2xl font-black text-indigo-400 font-mono italic">MAX</span>
                                        </div>
                                    </div>
                                </div>
                            </TacticalCard>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <HoloContainer className="p-10 h-[450px] flex flex-col relative overflow-hidden group">
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                                <Database size={20} className="text-emerald-400" />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] italic">ПРОТОКОЛИ_ПАЙПЛАЙНІВ</h3>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] bg-emerald-500/5 border-emerald-500/20 text-emerald-400 uppercase tracking-widest">SYNC_ACTIVE</Badge>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-4">
                                        <DatabasePipelineMonitor />
                                    </div>
                                    <div className="absolute -bottom-20 -right-20 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                        <Workflow size={240} className="text-emerald-500" />
                                    </div>
                                </HoloContainer>

                                <TacticalCard
                                    variant="cyber"
                                    className="p-10 h-[450px] border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden group/ops"
                                >
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-500/20 rounded-xl">
                                                <Terminal size={20} className="text-indigo-400" />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] italic">ЦЕНТР_СУВЕРЕННИХ_ОПЕРАЦІЙ</h3>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                    </div>

                                    <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-4">
                                        <div className="p-8 bg-black/60 border border-white/5 rounded-[2.5rem] relative group/sub overflow-hidden hover:border-indigo-500/30 transition-all">
                                            <div className="absolute inset-0 bg-indigo-400/5 blur-3xl opacity-0 group-hover/sub:opacity-100 transition-opacity" />
                                            <p className="text-[13px] text-slate-300 leading-relaxed font-black relative z-10 italic">
                                                Ядро <span className="text-indigo-400 text-lg">AZR-V55.GEN</span> опрацьовує <span className="text-emerald-400">99.96%</span> когнітивних навантажень сектору.
                                            </p>
                                            <div className="flex items-center gap-3 mt-6 relative z-10 opacity-60">
                                                <Info size={14} className="text-indigo-400" />
                                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Виявлено 24 нові паттерни арбітражу.</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-6 bg-black/40 border border-white/5 rounded-[2rem] hover:border-indigo-500/20 transition-all">
                                                <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-3 italic">ІНДЕКС_ДОВІРИ</div>
                                                <div className="text-3xl font-mono font-black text-indigo-400 tracking-tighter italic">0.9998</div>
                                            </div>
                                            <div className="p-6 bg-black/40 border border-white/5 rounded-[2rem] hover:border-emerald-500/20 transition-all">
                                                <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-3 italic">ЦИКЛ_OODA</div>
                                                <div className="text-3xl font-mono font-black text-emerald-400 tracking-tighter italic">8ms</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-4">
                                            {['СУВЕРЕННИЙ', 'НЕЙРО-v55', 'ДЕТЕРМІНІСТИЧНИЙ', 'АВТОНОМНИЙ'].map(tag => (
                                                <span key={tag} className="px-5 py-2.5 bg-black/80 border border-white/10 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-indigo-300 hover:border-indigo-500/40 transition-all cursor-crosshair">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="absolute -right-10 -bottom-10 opacity-[0.02] group-hover/ops:opacity-[0.05] transition-opacity">
                                        <Cpu size={280} className="text-indigo-400" />
                                    </div>
                                </TacticalCard>
                            </div>
                        </div>

                        {/* Intelligence & Insights Sidebar */}
                        <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
                            {/* Neural Insights Panel */}
                            <div className="relative group/insights h-[600px]">
                                <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/30 to-transparent blur-3xl opacity-20 group-hover/insights:opacity-40 transition-opacity" />
                                <div className="relative h-full bg-[#030712]/80 backdrop-blur-3xl border border-white/10 rounded-[4rem] overflow-hidden shadow-3xl">
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30" />
                                    <AIInsightsHub isWidgetMode={true} />
                                </div>
                            </div>

                            {/* Sovereign Report Matrix */}
                            {selectedUeid && (
                                <SovereignReportWidget
                                    ueid={selectedUeid}
                                    className="min-h-[500px] border-indigo-500/20"
                                />
                            )}

                            {/* Diagnostics Cluster */}
                            <TacticalCard variant="glass" className="p-10 bg-black/60 border border-white/5 rounded-[3rem] group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-5 mb-10">
                                    <div className="p-4 bg-indigo-500/20 rounded-[1.5rem] shadow-xl">
                                        <Boxes size={24} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">ЗГІДНІСТЬ_ВУЗЛІВ</h4>
                                        <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest">DIAGNOSTIC_PROTOCOL_v6.1</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-8">
                                    {[
                                        { label: 'АСИНХРОННИЙ_ІНДЕКС', val: '99.99%', sub: 'ОПТИМАЛЬНО', icon: ShieldCheck, color: 'text-emerald-400' },
                                        { label: 'ВЕКТОРНИЙ_ДРЕЙФ', val: '0.002', sub: 'МІНІМАЛЬНИЙ', icon: TrendingUp, color: 'text-blue-400' },
                                        { label: 'СИГНАЛЬНИЙ_ШУМ', val: '0.12dB', sub: 'ІЗОЛЬОВАНО', icon: Radio, color: 'text-amber-400' }
                                    ].map(stat => (
                                        <div key={stat.label} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all group/it">
                                            <div className="flex items-center gap-4">
                                                <stat.icon size={16} className={cn("transition-transform group-hover/it:scale-125", stat.color)} />
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                                    <p className={cn("text-[8px] font-black uppercase tracking-tighter opacity-60", stat.color)}>{stat.sub}</p>
                                                </div>
                                            </div>
                                            <span className="text-2xl font-black text-white font-mono italic tracking-tighter">{stat.val}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <button className="w-full mt-10 py-6 border border-white/10 rounded-[2rem] text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-4 active:scale-95 group">
                                     <Fingerprint size={16} className="group-hover:text-indigo-400" /> ПЕРЕВІРИТИ_ЦІЛІСНІСТЬ
                                </button>
                            </TacticalCard>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                        .panel-3d {
                            transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
                        }
                        .panel-3d:hover {
                            transform: translateY(-10px) scale(1.01);
                            box-shadow: 0 60px 120px -30px rgba(0, 0, 0, 0.9), 0 0 40px rgba(79, 70, 229, 0.15);
                        }
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: rgba(99, 102, 241, 0.15);
                            border-radius: 20px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: rgba(99, 102, 241, 0.3);
                        }
                        .font-display {
                            font-family: 'Inter', sans-serif;
                            letter-spacing: -0.05em;
                        }
                    `
                }} />
            </div>
        </PageTransition>
    );
};

export default IntelligenceView;
