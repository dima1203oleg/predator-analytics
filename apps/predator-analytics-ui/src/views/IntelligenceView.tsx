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
    Globe,
    RadioTower,
    Eye,
    Crosshair
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
import { AdvancedBackground } from '../components/AdvancedBackground';
import { CyberGrid } from '../components/CyberGrid';
import { cn } from '../utils/cn';
import { SovereignReportWidget } from '../components/intelligence/SovereignReportWidget';

const IntelligenceView: React.FC = () => {
    const [selectedUeid, setSelectedUeid] = React.useState<string | null>('12345678');

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />

                <div className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-10 space-y-12">
                    {/* Header Section */}
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full scale-150 opacity-20" />
                                    <div className="relative p-5 bg-slate-900 border border-white/5 rounded-[28px] panel-3d shadow-2xl transition-transform group-hover:scale-105">
                                        <Brain size={36} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none font-display">
                                        СВЯТИЛИЩЕ РОЗВІДКИ
                                    </h1>
                                    <p className="text-[11px] font-mono font-black text-indigo-500/60 uppercase tracking-[0.4em] mt-2">
                                        СУВЕРЕННЕ_КОГНІТИВНЕ_ЯДРО // СИНАПСИС_v55
                                    </p>
                                </div>
                            </div>
                        }
                        icon={<Brain size={22} className="text-indigo-400" />}
                        breadcrumbs={['PREDATOR', 'INTELLIGENCE', 'SYNERGY_X']}
                        stats={[
                            { label: 'НЕЙРО_НАВАНТАЖЕННЯ', value: '64%', color: 'primary', icon: <Activity size={14} /> },
                            { label: 'ГЛИБИНА_ГРАФА', value: '12 Рівнів', color: 'purple', icon: <Share2 size={14} /> },
                            { label: 'ГЛОБАЛЬНИЙ_СКОР', value: '99.4', color: 'success', icon: <Target size={14} /> }
                        ]}
                        actions={
                            <div className="flex gap-4">
                                <button className="px-8 py-3 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600/25 transition-all flex items-center gap-3 group shadow-2xl">
                                    <Sparkles size={16} className="group-hover:rotate-12 transition-transform" /> ОПТИМІЗУВАТИ_ЯДРО
                                </button>
                                <button className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500/25 transition-all flex items-center gap-3 group shadow-2xl">
                                    <Radio size={16} className="animate-pulse" /> ТЕЛЕМЕТРІЯ_LIVE
                                </button>
                            </div>
                        }
                    />

                    <div className="grid grid-cols-12 gap-10 relative z-10">
                        {/* Main Visualizer & Pipeline Section */}
                        <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">
                            {/* Semantic Radar Matrix */}
                            <TacticalCard variant="holographic" className="panel-3d overflow-hidden h-[650px] bg-slate-950/40 relative" noPadding>
                                <div className="absolute top-8 left-8 z-20 flex items-center gap-6">
                                    <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
                                        <Eye size={24} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">СЕМАНТИЧНА РАДАРНА МАТРИЦЯ</h3>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">ВІЗУАЛІЗАЦІЯ_ГРАФА_ЗВ\'ЯЗКІВ_v4.5</p>
                                    </div>
                                </div>

                                <div className="absolute top-8 right-8 z-20 flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse outline outline-4 outline-emerald-500/20" />
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">СКАНУВАННЯ_АКТИВНЕ</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-slate-400">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-mono">ВУЗЛІВ: 14,284</span>
                                    </div>
                                </div>

                                <div className="absolute inset-0 z-0">
                                    <CyberGrid color="rgba(79,70,229,0.15)" />
                                </div>

                                <div className="flex-1 h-full pt-20">
                                    <SemanticRadar className="h-full w-full opacity-90" />
                                </div>

                                <div className="absolute bottom-8 left-8 p-6 bg-black/60 border border-white/5 rounded-3xl backdrop-blur-2xl z-20 flex items-center gap-10 shadow-3xl">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">ЛАТЕНТНІСТЬ</span>
                                        <span className="text-lg font-black text-white font-mono">8ms</span>
                                    </div>
                                    <div className="w-px h-10 bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">ІНДЕКС_ЕНТРОПІЇ</span>
                                        <span className="text-lg font-black text-amber-500 font-mono">0.122</span>
                                    </div>
                                    <div className="w-px h-10 bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">ВІРТУАЛЬНІ_ВУЗЛИ</span>
                                        <span className="text-lg font-black text-indigo-400 font-mono">АКТИВНО</span>
                                    </div>
                                </div>
                            </TacticalCard>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <TacticalCard variant="holographic" className="panel-3d bg-slate-900/40 p-10 h-[400px]">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                                            <Database size={18} className="text-emerald-500" /> ПРОТОКОЛИ ПАЙПЛАЙНІВ
                                        </h3>
                                        <Badge variant="outline" className="text-[8px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400">СИНХРО_OK</Badge>
                                    </div>
                                    <div className="overflow-y-auto custom-scrollbar flex-1 pr-4">
                                        <DatabasePipelineMonitor />
                                    </div>
                                </TacticalCard>

                                <TacticalCard
                                    variant="holographic"
                                    className="panel-3d bg-slate-900/40 p-10 h-[400px] border-indigo-500/20 overflow-hidden relative"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                                            <Zap size={18} className="text-amber-400" /> ЦЕНТР СУВЕРЕННИХ ОПЕРАЦІЙ
                                        </h3>
                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                            <Crosshair size={14} className="text-indigo-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-8 h-full overflow-y-auto custom-scrollbar pr-4">
                                        <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-[28px] relative group overflow-hidden">
                                            <div className="absolute inset-0 bg-indigo-400/5 blur-xl group-hover:scale-110 transition-transform" />
                                            <p className="text-[13px] text-slate-300 leading-relaxed font-medium relative z-10">
                                                Ядро <span className="text-indigo-400 font-black tracking-tight uppercase">AZR-V55.GEN</span> опрацьовує <span className="text-emerald-400 font-bold">99.96%</span> когнітивних навантажень.
                                                <br />
                                                <span className="text-[10px] text-slate-500 italic mt-2 block">Виявлено 24 нові паттерни в секторі фінансового арбітражу.</span>
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-6 bg-black/40 border border-white/5 rounded-[24px] group hover:border-indigo-500/30 transition-all shadow-xl">
                                                <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-1 group-hover:text-indigo-400">Trust_Index</div>
                                                <div className="text-3xl font-mono font-black text-indigo-400 tracking-tighter">0.9998</div>
                                            </div>
                                            <div className="p-6 bg-black/40 border border-white/5 rounded-[24px] group hover:border-emerald-500/30 transition-all shadow-xl">
                                                <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-1 group-hover:text-emerald-400">OODA_Cycle</div>
                                                <div className="text-3xl font-mono font-black text-emerald-400 tracking-tighter">8ms</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 pt-2">
                                            {['СУВЕРЕННИЙ', 'НЕЙРО-v55', 'ШИФРОВАНИЙ', 'ДЕТЕРМІНІСТИЧНИЙ', 'АВТОНОМНИЙ'].map(tag => (
                                                <span key={tag} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:border-indigo-500/50 hover:text-indigo-300 transition-all cursor-crosshair">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </TacticalCard>
                            </div>
                        </div>

                        {/* Right Insights Column */}
                        <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
                            <div className="relative flex-1 min-h-[500px]">
                                <div className="absolute -inset-0.5 bg-gradient-to-b from-indigo-500/40 via-transparent to-transparent blur-[40px] rounded-[48px] opacity-30" />
                                <div className="relative h-full bg-[#030712]/60 backdrop-blur-3xl border border-white/10 rounded-[48px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
                                    <AIInsightsHub isWidgetMode={true} />
                                </div>
                            </div>

                            {selectedUeid && (
                                <SovereignReportWidget
                                    ueid={selectedUeid}
                                    className="flex-1 min-h-[500px] border-indigo-500/20"
                                />
                            )}

                            <TacticalCard variant="glass" className="p-8 bg-black/40 border border-white/5 rounded-[40px] group hover:border-indigo-500/20 transition-all">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                                        <Network size={20} className="text-indigo-400" />
                                    </div>
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">ЗГІДНІСТЬ_ВУЗЛІВ</h4>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Асинхронний Індекс', val: '99.99%', sub: 'ЗДОРОВО' },
                                        { label: 'Векторний Дрейф', val: '0.002', sub: 'МІНІМАЛЬНИЙ' }
                                    ].map(stat => (
                                        <div key={stat.label} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">{stat.label}</p>
                                                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">{stat.sub}</p>
                                            </div>
                                            <span className="text-xl font-black text-white font-mono">{stat.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </TacticalCard>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
          .panel-3d {
            transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
          }
          .panel-3d:hover {
            transform: translateY(-8px) scale(1.005);
            box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.8), 0 0 30px rgba(79, 70, 229, 0.1);
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.2);
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.4);
          }
        `}} />
            </div>
        </PageTransition>
    );
};

export default IntelligenceView;

