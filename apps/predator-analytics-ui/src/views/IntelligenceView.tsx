import { Activity, Brain, Radio, Share2, Shield, Sparkles, Zap } from 'lucide-react';
import React from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { SemanticRadar } from '../components/graph/SemanticRadar';
import { PageTransition } from '../components/layout/PageTransition';
import { DatabasePipelineMonitor } from '../components/pipeline/DatabasePipelineMonitor';
import { NeuralPulse } from '../components/ui/NeuralPulse';
import { Badge } from '../components/ui/badge';
import AIInsightsHub from './AIInsightsHub';

const IntelligenceView: React.FC = () => {
    return (
        <PageTransition>
            <div className="space-y-8 pb-24 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none z-0">
                    <NeuralPulse color="rgba(79, 70, 229, 0.15)" size={1200} />
                </div>

                <div className="relative z-10">
                    <ViewHeader
                        title="Sovereign Intelligence"
                        icon={<Brain className="text-indigo-400" />}
                        breadcrumbs={['System', 'Intelligence', 'v40.1']}
                        stats={[
                            { label: 'Neural Load', value: '64%', color: 'primary', icon: <Activity size={14} /> },
                            { label: 'Graph Depth', value: '12 Layers', color: 'success', icon: <Share2 size={14} /> },
                            { label: 'Security', value: 'EXECUTIVE_LEVEL_5', color: 'cyan', icon: <Shield size={14} /> }
                        ]}
                        actions={
                            <div className="flex gap-4">
                                <button className="px-6 py-2.5 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600/25 transition-all flex items-center gap-2 group shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" /> Optimize_Neural_Core
                                </button>
                                <button className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500/25 transition-all flex items-center gap-2 group shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                    <Radio size={14} className="animate-pulse" /> Live_Telemetry
                                </button>
                            </div>
                        }
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                    {/* Main Graph Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="holographic-card rounded-2xl shadow-2xl p-1 relative group">
                            <div className="holographic-scanline" />
                            <SemanticRadar className="h-[600px] rounded-xl overflow-hidden" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <DatabasePipelineMonitor />

                            <TacticalCard
                                variant="holographic"
                                title="Sovereign Operations Center"
                                icon={<Zap className="text-amber-400" />}
                                className="h-full border-blue-500/20 data-capsule"
                            >
                                <div className="space-y-6">
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                        Ядро <span className="text-blue-400 font-black tracking-tight">AZR-V40.1</span> опрацьовує <span className="text-emerald-400">99.82%</span> тактичних рішень в автономному режимі.
                                        Система ідентифікувала 14 нових критичних вузлів впливу.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                                            <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Trust_Index</div>
                                            <div className="text-lg font-mono font-bold text-blue-400">0.9982</div>
                                        </div>
                                        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                                            <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest">OODA_Cycle</div>
                                            <div className="text-lg font-mono font-bold text-emerald-400">12ms</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Badge className="bg-blue-500/10 border-blue-500/20 text-blue-500 text-[8px] font-black tracking-widest uppercase">Autonomous</Badge>
                                        <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-[8px] font-black tracking-widest uppercase">Verified</Badge>
                                    </div>
                                </div>
                            </TacticalCard>
                        </div>
                    </div>

                    {/* Right Insights Column */}
                    <div className="lg:col-span-1">
                        <div className="holographic-card rounded-2xl shadow-xl h-full p-0.5 border-white/5 data-capsule">
                            <div className="holographic-scanline" />
                            <AIInsightsHub isWidgetMode={true} />
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default IntelligenceView;
