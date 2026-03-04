/**
 * Predator v55 | Sovereign Intelligence Sanctum — Когнітивне Ядро
 * Центральний центр управління семантичним графом та нейронними інсайтами.
 */

import React from 'react';
import {
    Activity,
    Brain,
    Radio,
    Share2,
    Shield,
    Sparkles,
    Zap,
    Network,
    Target,
    ShieldCheck,
    Cpu,
    Database,
    Binary,
    Search,
    Globe
} from 'lucide-react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { SemanticRadar } from '../components/graph/SemanticRadar';
import { PageTransition } from '../components/layout/PageTransition';
import { DatabasePipelineMonitor } from '../components/pipeline/DatabasePipelineMonitor';
import { NeuralPulse } from '../components/ui/NeuralPulse';
import { Badge } from '../components/ui/badge';
import AIInsightsHub from './AIInsightsHub';
import { HoloContainer } from '../components/HoloContainer';
import { CyberOrb } from '../components/CyberOrb';

const IntelligenceView: React.FC = () => {
    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-32">
                {/* V55 Background Matrix */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.08),transparent_70%)]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-500/10 blur-[150px] rounded-full" />
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                </div>

                <div className="relative z-10 max-w-[1800px] mx-auto p-4 sm:p-8 space-y-8">
                    {/* Header Section */}
                    <ViewHeader
                        title="SOVEREIGN INTELLIGENCE SANCTUM"
                        icon={<Brain size={22} className="text-indigo-500 drop-shadow-[0_0_10px_rgba(79,70,229,0.6)]" />}
                        breadcrumbs={['ЦИТАДЕЛЬ', 'КОГНІТИВНЕ ЯДРО', 'v55.GEN']}
                        stats={[
                            { label: 'Neural Load', value: '64%', color: 'primary', icon: <Activity size={14} /> },
                            { label: 'Graph Depth', value: '12 Layers', color: 'indigo', icon: <Share2 size={14} /> },
                            { label: 'Security', value: 'EXEC_LEVEL_5', color: 'success', icon: <ShieldCheck size={14} /> }
                        ]}
                        actions={
                            <div className="flex gap-4">
                                <button className="px-6 py-2.5 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600/25 transition-all flex items-center gap-2 group shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" /> OPTIMIZE_NEURAL_CORE
                                </button>
                                <button className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500/25 transition-all flex items-center gap-2 group shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                    <Radio size={14} className="animate-pulse" /> LIVE_TELEMETRY
                                </button>
                            </div>
                        }
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                        {/* Main Analysis Section */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Semantic Radar Matrix */}
                            <TacticalCard variant="holographic" className="panel-3d overflow-hidden" noPadding>
                                <div className="absolute top-4 right-6 z-20 flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">SCAN_ACTIVE</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-slate-400">
                                        <span className="text-[9px] font-black uppercase tracking-widest font-mono">NODES: 14,284</span>
                                    </div>
                                </div>
                                <SemanticRadar className="h-[600px] rounded-xl overflow-hidden" />
                            </TacticalCard>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <TacticalCard variant="holographic" title="ПРОТОКОЛИ ПАЙПЛАЙНІВ" className="panel-3d">
                                    <DatabasePipelineMonitor />
                                </TacticalCard>

                                <TacticalCard
                                    variant="holographic"
                                    title="SOVEREIGN OPERATIONS CENTER"
                                    icon={<Zap className="text-amber-400" />}
                                    className="h-full border-blue-500/20 panel-3d"
                                >
                                    <div className="space-y-6">
                                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                                Ядро <span className="text-indigo-400 font-black tracking-tight uppercase">AZR-V55.GEN</span> опрацьовує <span className="text-emerald-400 font-bold">99.96%</span> когнітивних навантажень в автономному режимі.
                                                Виявлено 24 нові паттерни в секторі фінансового арбітражу.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                                <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 group-hover:text-indigo-400">Trust_Index</div>
                                                <div className="text-2xl font-mono font-black text-indigo-400 tracking-tighter text-shadow-lg">0.9998</div>
                                            </div>
                                            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-emerald-500/30 transition-all">
                                                <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 group-hover:text-emerald-400">OODA_Cycle</div>
                                                <div className="text-2xl font-mono font-black text-emerald-400 tracking-tighter text-shadow-lg">8ms</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {['Sovereign', 'Neural-v55', 'Encrypted', 'Deterministic'].map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-500/40 hover:text-indigo-300 transition-all cursor-default">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </TacticalCard>
                            </div>
                        </div>

                        {/* Right Insights Column */}
                        <div className="lg:col-span-1 flex flex-col gap-8">
                            <div className="relative h-full">
                                <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/20 to-transparent blur-xl rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="relative h-full bg-[#030712] border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/10">
                                    <AIInsightsHub isWidgetMode={true} />
                                </div>
                            </div>

                            <TacticalCard variant="holographic" className="flex items-center justify-center p-8 bg-black/60 relative overflow-hidden h-[300px]">
                                <CyberOrb size={180} color="#6366f1" intensity={0.4} pulse={true} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">Neural Core</div>
                                    <div className="text-lg font-black text-white font-mono opacity-60 italic underline decoration-indigo-500/40">SYNAPSE_v55</div>
                                </div>
                            </TacticalCard>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .panel-3d {
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .panel-3d:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 40px 80px -15px rgba(0, 0, 0, 0.7);
                    }
                `}} />
            </div>
        </PageTransition>
    );
};

export default IntelligenceView;
