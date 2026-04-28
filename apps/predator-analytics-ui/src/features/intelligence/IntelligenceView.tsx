/**
 *   SOVEREIGN INTELLIGENCE NEXUS | v61.0-ELITE
 * PREDATOR СТРАТЕГІЧНИЙ ОСІНТ-ХАБ (INTEL NEXUS)
 * 
 * Центральна точка розвідувального циклу:
 * Глобальний аналіз ринків, стратегічні пріоритети,
 * шанси для експансії та виявлення прихованих загроз.
 * Sovereign Power Design · Classified · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect } from 'react';
import {
    Activity, Brain, Radio, Shield, Sparkles, Zap, Network, Target,
    ShieldCheck, Cpu, Database, Binary, Search, Globe, RadioTower, Eye, Crosshair,
    ChevronRight, Info, Layers, Workflow, Terminal, Boxes, Fingerprint,
    TrendingUp, AlertCircle, RefreshCw, Lock, Orbit, BarChart3, TrendingDown, Star, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewHeader } from '@/components/ViewHeader';
import { SemanticRadar } from '@/components/graph/SemanticRadar';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import AIInsightsHub from '@/features/ai/AIInsightsHub';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';
import { SearchWidget } from '@/components/search/SearchWidget';
import { SovereignReportWidget } from '@/components/intelligence/SovereignReportWidget';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { DatabasePipelineMonitor } from '@/components/pipeline/DatabasePipelineMonitor';

const IntelligenceView: React.FC = () => {
    const [selectedUeid, setSelectedUeid] = useState<string | null>('12345678');
    const [isThinking, setIsThinking] = useState(false);
    const [activeLayer, setActiveLayer] = useState<'graph' | 'radar'>('graph');
    const { isOffline, activeFailover, nodeSource, healingProgress } = useBackendStatus();

    useEffect(() => {
        if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'IntelligenceNexus',
                    message: `АВА ІЙНА СИНХ ОНІЗАЦІЯ [${nodeSource}]:  обота через MIRROR_VAULT. Деякі когнітивні шари можуть бути обмежені.`,
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'INTEL_OFFLINE'
                }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'IntelligenceNexus',
                    message: `ІНТЕЛ_ХАБ [${nodeSource}]: Матрицю NEXUS активовано. Стратегічний ОСІНТ-цикл стабільний.`,
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'INTEL_SUCCESS'
                }
            }));
        }
    }, [isOffline, nodeSource]);

    const triggerCognitiveRefresh = () => {
        setIsThinking(true);
        
        window.dispatchEvent(new CustomEvent('predator-error', {
            detail: {
                service: 'NeuralCore',
                message: 'Ініціалізовано запит на когнітивну оптимізацію шарів.',
                severity: 'info',
                timestamp: new Date().toISOString(),
                code: 'COG_RECOVERY'
            }
        }));

        setTimeout(() => {
            setIsThinking(false);
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'NeuralCore',
                    message: 'Когнітивна матриця синхронізована.',
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'COG_STABLE'
                }
            }));
        }, 2000);
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(212, 175, 55, 0.05)" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 max-w-[1750px] mx-auto p-4 sm:p-12 space-y-16">
                    
                    {/* Tactical Search Entry */}
                    <div className="max-w-4xl mx-auto mb-16">
                        <SearchWidget className="scale-105 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border-[#D4AF37]/20" />
                    </div>

                    <ViewHeader
                        title={
                            <div className="flex items-center gap-10">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                    <div className="relative p-7 bg-[#0a0a0a] border border-[#D4AF37]/40 rounded-[2.5rem] shadow-2xl">
                                        <Brain size={42} className="text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                       <span className={cn(
                                         "badge-v2 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic border",
                                         isOffline ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]"
                                       )}>
                                         {isOffline ? 'MIRROR_NEXUS' : 'INTEL_NEXUS'} // GLOBAL_RECON
                                       </span>
                                       <div className="h-px w-10 bg-[#D4AF37]/20" />
                                       <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic font-bold">v61.0-ELITE</span>
                                    </div>
                                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
                                        ЦЕНТ  <span className="text-[#D4AF37] underline decoration-[#D4AF37]/20 decoration-8"> ОЗВІДКИ</span>
                                    </h1>
                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                                        Аналіз  инку • Оперативні Шанси • Пріоритети Суверенітету
                                    </p>
                                </div>
                            </div>
                        }
                        badges={[
                            { label: 'CLASSIFIED_T1', color: 'amber', icon: <Lock size={10} /> },
                            { label: nodeSource, color: isOffline ? 'warning' : 'primary', icon: <Globe size={10} /> },
                            { label: 'SOVEREIGN_FORCE', color: 'danger', icon: <Shield size={10} /> }
                        ]}
                        stats={[
                            { label: 'КОГНІТИВНЕ НАВАНТАЖЕННЯ', value: '72%', color: 'primary', icon: <Activity size={14} />, animate: true },
                            { 
                                label: isOffline ? 'MIRROR_RECOVERY' : 'NODE_SOURCE', 
                                value: isOffline ? `${Math.floor(healingProgress)}%` : nodeSource, 
                                color: isOffline ? 'warning' : 'primary', 
                                icon: isOffline ? <Activity size={14} /> : <Cpu size={14} />,
                                animate: isOffline
                            },
                            { label: 'OODA ЦИКЛ', value: '8ms', color: 'success', icon: <Zap size={14} /> }
                        ]}
                        breadcrumbs={['STRATEGY', 'NEXUS', 'RECON_HUB']}
                        actions={
                            <div className="flex gap-4">
                                <button
                                    onClick={triggerCognitiveRefresh}
                                    className="px-10 py-5 bg-[#D4AF37] text-black font-black rounded-2xl text-[11px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 transition-all flex items-center gap-4 italic group"
                                >
                                    {isThinking ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                    ОПТИМІЗУВАТИ_ЯДРО
                                </button>
                                <button className="p-5 bg-black/60 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                                    <RadioTower size={22} className="animate-pulse text-[#D4AF37]" />
                                </button>
                            </div>
                        }
                    />

                    <div className="grid grid-cols-12 gap-12">
                        
                        {/* MAIN OPERATIONAL AREA */}
                        <div className="col-span-12 xl:col-span-8 space-y-12">
                            
                            {/* Sovereign Intelligence Dashboard */}
                            <SovereignReportWidget 
                                ueid={selectedUeid || '12345678'} 
                                className="shadow-3xl"
                            />

                            {/* Strategic Premium Modules */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <section 
                                    onClick={() => window.location.href = '/cargo-manifest'}
                                    className="p-10 rounded-[3rem] bg-[#0a0a0a] border-2 border-[#D97706]/10 shadow-2xl relative overflow-hidden group cursor-pointer hover:border-[#D97706]/30 transition-all"
                                >
                                     <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform"><Fingerprint size={120} className="text-[#D97706]" /></div>
                                     <div className="flex items-center justify-between mb-8 border-b border-white/[0.04] pb-6">
                                        <div className="flex items-center gap-5">
                                           <div className="p-3 bg-[#D97706]/10 border border-[#D97706]/20 rounded-xl text-[#D97706]">
                                              <Box size={20} />
                                           </div>
                                           <h4 className="text-[14px] font-black text-white italic uppercase tracking-widest">МИТНА ФО ЕНЗИКА</h4>
                                        </div>
                                        <Badge variant="outline" className="border-[#D97706]/30 text-[#D97706]">PREMIUM</Badge>
                                     </div>
                                     <p className="text-sm font-black text-slate-400 italic leading-relaxed mb-6">Детекція схем підміни кодів УКТЗЕД та заниження митної вартості на основі маніфестів.</p>
                                     <div className="flex items-center gap-3 text-[#D97706] font-black text-[10px] uppercase tracking-widest italic">
                                        ПЕ ЕЙТИ_ДО_АНАЛІЗУ <ChevronRight size={14} />
                                     </div>
                                </section>

                                <section 
                                    onClick={() => window.location.href = '/suppliers'}
                                    className="p-10 rounded-[3rem] bg-[#0a0a0a] border-2 border-[#D4AF37]/10 shadow-2xl relative overflow-hidden group cursor-pointer hover:border-[#D4AF37]/30 transition-all"
                                >
                                     <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform"><Target size={120} className="text-[#D4AF37]" /></div>
                                     <div className="flex items-center justify-between mb-8 border-b border-white/[0.04] pb-6">
                                        <div className="flex items-center gap-5">
                                           <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-[#D4AF37]">
                                              <Search size={20} />
                                           </div>
                                           <h4 className="text-[14px] font-black text-white italic uppercase tracking-widest">ПОШУК ПОСТАЧАЛЬНИКІВ</h4>
                                        </div>
                                        <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37]">PREMIUM</Badge>
                                     </div>
                                     <p className="text-sm font-black text-slate-400 italic leading-relaxed mb-6">Виявлення нових глобальних джерел постачання та аналіз цінової конкурентності.</p>
                                     <div className="flex items-center gap-3 text-[#D4AF37] font-black text-[10px] uppercase tracking-widest italic">
                                        ВІДК ИТИ_SOURCING <ChevronRight size={14} />
                                     </div>
                                </section>
                            </div>

                            <section className="relative rounded-[3rem] bg-[#0a0a0a] border-2 border-white/[0.04] p-10 shadow-3xl overflow-hidden group">
                                <div className="absolute inset-0 bg-[#D4AF37]/[0.01] pointer-events-none" />
                                <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/[0.04] relative z-20">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                                            <Layers size={24} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">СЕМАНТИЧНА ТА СТ АТЕГІЧНА МАТ ИЦЯ</h3>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">VISUAL_INTELLIGENCE // TOPOLOGY_v58.2</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-white/[0.02] rounded-xl p-1.5 border border-white/5 backdrop-blur-3xl">
                                        <button 
                                            onClick={() => setActiveLayer('graph')}
                                            className={cn("px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all italic", activeLayer === 'graph' ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-slate-500 hover:text-slate-300')}
                                        >GRAPH_SCAN</button>
                                        <button 
                                            onClick={() => setActiveLayer('radar')}
                                            className={cn("px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all italic", activeLayer === 'radar' ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-slate-500 hover:text-slate-300')}
                                        >RADAR_OSINT</button>
                                    </div>
                                </div>

                                <div className="h-[550px] relative z-10">
                                    <SemanticRadar className="h-full w-full opacity-90 scale-105" />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-12 pt-10 border-t border-white/[0.04]">
                                    {[
                                        { label: 'ЗАТ ИМКА_СИНАПСІВ', value: '4.2ms', sub: 'ОПТИМІЗОВАНО', c: 'text-[#D4AF37]' },
                                        { label: 'ІНДЕКС_ЕНТ ОПІЇ', value: '0.084', sub: 'СТАБІЛЬНО', c: 'text-[#D4AF37]' },
                                        { label: 'ДОВІ А_ ОЗВІДКИ', value: 'SURPLUS', sub: 'ELITE-01', c: 'text-[#D4AF37]' },
                                        { label: 'АКТИВНІ_АГЕНТИ', value: '14/14', sub: 'РОЗГОРНУТО', c: 'text-[#D4AF37]' },
                                    ].map((s, i) => (
                                        <div key={i} className="text-left font-black italic">
                                            <p className="text-[9px] text-slate-700 uppercase tracking-widest mb-1">{s.label}</p>
                                            <p className={cn("text-2xl font-mono tracking-tighter leading-none", s.c)}>{s.value}</p>
                                            <p className="text-[8px] text-slate-800 uppercase tracking-[0.2em] mt-1">{s.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Secondary Hubs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <section className="p-10 rounded-[3rem] bg-[#050505] border border-white/[0.05] shadow-2xl relative overflow-hidden group">
                                     <div className="flex items-center justify-between mb-8 border-b border-white/[0.04] pb-6">
                                        <div className="flex items-center gap-5">
                                           <Database size={24} className="text-[#D4AF37]" />
                                           <h4 className="text-[14px] font-black text-white italic uppercase tracking-widest">ПОТОКИ ІНГЕСТІЇ</h4>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                                     </div>
                                     <div className="h-[300px] overflow-y-auto no-scrollbar">
                                        <DatabasePipelineMonitor />
                                     </div>
                                </section>

                                <section className="p-10 rounded-[3rem] bg-[#0a0a0a] border-2 border-[#D4AF37]/10 shadow-2xl relative overflow-hidden group">
                                     <div className="flex items-center justify-between mb-8 border-b border-white/[0.04] pb-6">
                                        <div className="flex items-center gap-5">
                                           <Terminal size={24} className="text-[#D4AF37]" />
                                           <h4 className="text-[14px] font-black text-white italic uppercase tracking-widest">КОГНІТИВНІ ОПЕ АЦІЇ</h4>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                                     </div>
                                     <div className="space-y-6">
                                        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-4">
                                            <p className="text-[13px] font-black text-slate-300 italic leading-snug">Ядро AZR-V56.GEN завершило 14.2M циклів дедукції.</p>
                                            <div className="flex items-center gap-3">
                                               <Info size={12} className="text-[#D4AF37]" />
                                               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">32 НОВІ САНКЦІЙНІ ПАТТЕ НИ</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-black border border-white/5">
                                               <p className="text-[8px] font-black text-slate-700 uppercase mb-1">TRUST_INDEX</p>
                                               <p className="text-xl font-black text-[#D4AF37] font-mono italic">0.9999</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-black border border-white/5">
                                               <p className="text-[8px] font-black text-slate-700 uppercase mb-1">REACTION</p>
                                               <p className="text-xl font-black text-[#D4AF37] font-mono italic">4ms</p>
                                            </div>
                                        </div>
                                     </div>
                                </section>
                            </div>
                        </div>

                        {/* SIDEBAR INTELLIGENCE */}
                        <div className="col-span-12 xl:col-span-4 space-y-12">
                            
                            {/* Neural Pulse Area */}
                            <div className="rounded-[3rem] bg-[#0a0a0a]/60 border border-white/[0.05] overflow-hidden shadow-3xl h-[650px] relative">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.05),transparent_70%)] pointer-events-none" />
                                <AIInsightsHub isWidgetMode={true} />
                            </div>

                            {/* Tactical Focus Dashboard */}
                            <div className="rounded-[3rem] bg-[#0a0a0a] border-2 border-white/[0.04] p-10 shadow-3xl space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                                   <Orbit size={240} className="text-[#D4AF37]" />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-8 flex items-center gap-4">
                                   <Target size={16} className="text-[#D4AF37]" /> ТАКТИЧНИЙ ФОКУС
                                </h3>
                                <div className="space-y-4 relative z-10">
                                   {[
                                      { l: 'ШАНСИ  ИНКУ', v: '12 АКТИВНИХ', c: 'text-[#D4AF37]', icon: BarChart3 },
                                      { l: 'П ИХОВАНІ РИЗИКИ', v: '04 ВИЯВЛЕНО', c: 'text-[#D97706]', icon: AlertCircle },
                                      { l: 'ПРІОРИТЕТИ_CEO', v: '03 К ИТИЧНІ', c: 'text-white', icon: Star },
                                   ].map((m, i) => (
                                      <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:border-[#D4AF37]/20 transition-all cursor-pointer group">
                                         <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] transition-all">
                                               <m.icon size={18} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-slate-300 transition-colors uppercase">{m.l}</span>
                                         </div>
                                         <p className={cn("text-lg font-black italic tracking-tighter leading-none", m.c)}>{m.v}</p>
                                      </div>
                                   ))}
                                </div>
                                <button className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:brightness-110 transition-all shadow-xl italic mt-6">
                                   ПОВНИЙ СИСТЕМНИЙ АУДИТ
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
                <DiagnosticsTerminal />
                <style dangerouslySetInnerHTML={{ __html: `
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
                `}} />
            </div>
        </PageTransition>
    );
};

export default IntelligenceView;
