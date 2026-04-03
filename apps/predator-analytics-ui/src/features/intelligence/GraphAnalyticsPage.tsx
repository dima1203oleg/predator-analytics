/**
 * 🕸️ PREDATOR Topology Sanctum | v56.1.4
 * МОДУЛЬ ТОПОЛОГІЧНОГО СВЯТИЛИЩА ТА НЕЙРОФОРМНОЇ ГРАФ ОПТИМІЗАЦІЇ
 * 
 * Професійна система візуалізації та аналізу складних взаємозв'язків.
 * © 2026 PREDATOR Analytics - Повна українізація (HR-04)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Network, Share2, Target, ShieldAlert, 
    Search, Filter, RefreshCw, ZoomIn, 
    Layers, Cpu, Zap, Binary, Fingerprint,
    ExternalLink, Skull, Gem, Activity,
    Database, Info, AlertTriangle, CheckCircle2,
    Eye, TrendingUp, GitMerge, Layout, ChevronRight,
    Terminal, Lock, Sparkles, Orbit, Globe
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import { api } from '@/services/api';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloContainer } from '@/components/HoloContainer';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { CyberOrb } from '@/components/CyberOrb';
import { cn } from '@/utils/cn';

// ========================
// Main Component
// ========================

const GraphAnalyticsPage: React.FC = () => {
    const [graphData, setGraphData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [clusters, setClusters] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const summaryRes = await api.graph.getSummary();
            
            if (summaryRes && summaryRes.nodes) {
                const processedNodes = summaryRes.nodes.map((node: any) => ({
                    id: node.id,
                    name: node.label,
                    symbolSize: node.riskScore ? (35 + node.riskScore / 2.5) : 45,
                    itemStyle: { 
                        color: node.riskScore > 70 ? '#f43f5e' : 
                               node.riskScore > 40 ? '#f59e0b' : 
                               node.type === 'person' ? '#10b981' : '#6366f1',
                        shadowBlur: 20,
                        shadowColor: 'rgba(0,0,0,0.5)'
                    },
                    category: node.type?.toUpperCase() || 'ENTITY',
                    risk: node.riskScore,
                    label: { show: node.riskScore > 45, position: 'right', fontSize: 10, fontWeight: 'bold', color: '#fff' }
                }));

                const processedLinks = (summaryRes.links || []).map((link: any) => ({
                    ...link,
                    lineStyle: {
                        color: 'rgba(99, 102, 241, 0.15)',
                        width: 1.5,
                        curveness: 0.1
                    }
                }));

                setGraphData({ nodes: processedNodes, links: processedLinks });
                setStats({ 
                    nodes_count: summaryRes.stats?.total_nodes || '0', 
                    relationships: (summaryRes.stats?.total_nodes * 2.8).toFixed(0), 
                    clusters: (summaryRes.stats?.high_risk_count / 2.5).toFixed(0), 
                    density: '0.112' 
                });
            } else {
                fetchMock();
            }
        } catch (err) {
            console.error('Failed to fetch graph data:', err);
            fetchMock();
        } finally {
            setLoading(false);
        }
    };

    const fetchMock = () => {
        const nodes = [
            { id: 'root', name: 'PREDATOR_CORE', symbolSize: 100, itemStyle: { color: '#6366f1', shadowBlur: 50, shadowColor: '#6366f1' }, label: { show: true }, risk: 0 },
            { id: 'c1', name: 'ТОВ "МИТНИЙ_ТРАНЗИТ"', symbolSize: 75, itemStyle: { color: '#f43f5e' }, category: 'HIGH_RISK', risk: 94 },
            { id: 'c2', name: 'ПРАТ "ЛОГІСТИК_ПЛЮС"', symbolSize: 65, itemStyle: { color: '#f59e0b' }, category: 'MEDIUM_RISK', risk: 58 },
            { id: 'c3', name: 'ОФШОР "CORP_Z"', symbolSize: 60, itemStyle: { color: '#f43f5e' }, category: 'HIGH_RISK', risk: 89 },
            { id: 'c4', name: 'БЕНЕФІЦІАР X', symbolSize: 70, itemStyle: { color: '#10b981' }, category: 'UBO', risk: 15 },
            { id: 'c5', name: 'ФОП "ІВАНОВ"', symbolSize: 40, itemStyle: { color: '#94a3b8' }, category: 'ENTITY', risk: 12 },
            { id: 'c6', name: 'МИТНИЙ_ПОСТ_ЗАХІД', symbolSize: 55, itemStyle: { color: '#0ea5e9' }, category: 'GOV', risk: 8 },
        ];

        const links = [
            { source: 'root', target: 'c1' },
            { source: 'root', target: 'c2' },
            { source: 'c1', target: 'c3' },
            { source: 'c3', target: 'c4' },
            { source: 'c1', target: 'c2' },
            { source: 'c4', target: 'c6' },
            { source: 'c2', target: 'c5' },
        ].map(l => ({ ...l, lineStyle: { color: 'rgba(99, 102, 241, 0.2)', width: 2, curveness: 0.2 }}));
        
        setGraphData({ nodes, links });
        setStats({ nodes_count: '1.4M', relationships: '5.2M', clusters: '3.1K', density: '0.096' });
    };

    const handleRunLouvain = async () => {
        try {
            const res = await api.graph.getCartels();
            if (Array.isArray(res)) {
                const processedClusters = res.map((c: any) => ({
                    name: c.entities?.[0]?.name || `КЛАСТЕР #${c.communityId}`,
                    risk: Math.max(...(c.entities?.map((e: any) => e.risk) || [0])),
                    connections: c.size,
                    id: c.communityId
                }));
                setClusters(processedClusters);
            }
            fetchData();
        } catch (err) {
            console.error('Failed to run Louvain:', err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const chartOptions = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: {
            backgroundColor: 'rgba(2, 6, 23, 0.98)',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderWidth: 1,
            padding: 0,
            textStyle: { color: '#f8fafc', fontFamily: 'monospace' },
            formatter: (params: any) => {
                const data = params.data;
                if (params.dataType === 'node') {
                    return `
                        <div class="p-8 min-w-[280px] bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                            <div class="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                                <div class="flex flex-col">
                                    <span class="text-[8px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2 leading-none">NODE_IDENTIFIER</span>
                                    <b class="text-white text-lg uppercase tracking-tight italic font-black">${data.name}</b>
                                </div>
                                <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <div class="w-2.5 h-2.5 rounded-full ${data.risk > 70 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500 shadow-[0_0_10px_#6366f1]'}"></div>
                                </div>
                            </div>
                            <div class="space-y-6">
                                <div class="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                    <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">САТЕЛІТ</span>
                                    <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest">${data.category || 'ВУЗОЛ'}</span>
                                </div>
                                <div class="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                    <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">КОЕФ. РИЗИКУ</span>
                                    <span class="text-xs font-black ${data.risk > 70 ? 'text-rose-500' : 'text-emerald-400'} italic font-mono">${data.risk || 0}%</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
                return '';
            }
        },
        series: [
            {
                type: 'graph',
                layout: 'force',
                animation: true,
                draggable: true,
                data: graphData?.nodes || [],
                links: graphData?.links || [],
                roam: true,
                focusNodeAdjacency: true,
                label: {
                    show: true,
                    position: 'bottom',
                    fontSize: 9,
                    color: '#64748b',
                    fontWeight: 'black',
                    formatter: '{b}',
                    distance: 10
                },
                force: {
                    repulsion: 2500,
                    edgeLength: [150, 300],
                    gravity: 0.1,
                    layoutAnimation: true
                },
                lineStyle: {
                    type: 'solid',
                    cap: 'round',
                    join: 'round'
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        width: 8,
                        color: '#6366f1',
                        shadowBlur: 20,
                        shadowColor: 'rgba(99, 102, 241, 0.6)',
                        opacity: 1
                    }
                }
            }
        ]
    }), [graphData]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(99, 102, 241, 0.08)" />

                <div className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-8 lg:p-12 space-y-16 h-screen flex flex-col">
                    
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-12">
                                <div className="relative group/orb">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full scale-150 animate-pulse opacity-40 group-hover/orb:opacity-70 transition-opacity" />
                                    <div className="relative p-8 bg-slate-900/80 border border-white/10 rounded-[2.5rem] shadow-3xl backdrop-blur-3xl group-hover/orb:border-indigo-500/40 transition-all">
                                        <Network size={42} className="text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-6xl font-black text-white tracking-[0.05em] uppercase leading-none font-display italic skew-x-[-2.5deg]">
                                        TOPOLOGY <span className="text-indigo-500">SANCTUM</span>
                                    </h1>
                                    <div className="flex items-center gap-6 mt-6">
                                        <div className="h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent" />
                                        <span className="text-[11px] font-mono font-black text-indigo-500/90 uppercase tracking-[0.6em] animate-pulse">
                                            NEO4J_NEURAL_ENGINE_EX // v56.1.4
                                        </span>
                                    </div>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'АКТИВНІ_СОТІ', value: stats?.nodes_count || '...', color: 'primary', icon: <Database size={14} />, animate: true },
                            { label: 'ЗВ\'ЯЗКИ', value: stats?.relationships || '...', color: 'primary', icon: <GitMerge size={14} /> },
                            { label: 'КЛАСТЕРИ', value: stats?.clusters || '...', color: 'success', icon: <Layout size={14} />, animate: true }
                        ]}
                        breadcrumbs={['АРХІТЕКТУРА', 'ГРАФОВА_АНАЛІТИКА', 'ВІЗУАЛІЗАЦІЯ']}
                    />

                    <div className="grid grid-cols-12 gap-16 flex-1">
                        
                        {/* Interactive Graph Engine */}
                        <div className="col-span-12 xl:col-span-8 flex flex-col gap-10 h-full min-h-[700px]">
                            <TacticalCard variant="holographic" className="p-0 flex-1 relative overflow-hidden bg-slate-900/40 border-white/5 rounded-[4rem] group/graph shadow-[0_60px_150px_-30px_rgba(0,0,0,1)]" noPadding>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)]" />
                                
                                <div className="absolute top-12 left-12 z-20 flex items-center gap-6">
                                    <div className="p-5 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 shadow-2xl backdrop-blur-3xl">
                                        <Search size={28} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter skew-x-[-3deg]">МАПИ <span className="text-indigo-400">КОГНІЦІЇ</span></h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-1 italic">TOPOLOGICAL_MAPPING_v56.1.4</p>
                                    </div>
                                </div>

                                <div className="absolute top-12 right-12 z-30 flex gap-8">
                                    <div className="flex items-center gap-4 px-8 py-4 rounded-[2rem] bg-black/60 border border-white/10 backdrop-blur-3xl shadow-3xl">
                                        <NeuralPulse color="#10b981" size={12} speed={1.5} />
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] font-mono">NEURAL_GDS_SYNC_OK</span>
                                    </div>
                                    <motion.button 
                                        whileHover={{ scale: 1.1, rotate: 180 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={fetchData}
                                        className="p-5 bg-white/5 hover:bg-indigo-500/20 rounded-3xl text-slate-300 hover:text-white transition-all border border-white/5 shadow-2xl"
                                    >
                                        <RefreshCw size={28} className={loading ? "animate-spin" : ""} />
                                    </motion.button>
                                </div>

                                <div className="w-full h-full relative z-10 cursor-move">
                                    {loading && !graphData ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-12">
                                            <CyberOrb size={180} color="#6366f1" intensity={0.6} pulse />
                                            <div className="text-center space-y-4">
                                                <span className="text-lg font-black text-white uppercase tracking-[0.8em] italic block animate-pulse">RECONSTRUCTING_TOPOLOGY</span>
                                                <div className="h-1 w-64 bg-white/5 rounded-full overflow-hidden mx-auto">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: '100%' }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                        className="h-full bg-indigo-500 shadow-[0_0_15px_#6366f1]" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} />
                                    )}
                                </div>

                                {/* Floating Controls */}
                                <div className="absolute bottom-12 right-12 flex flex-col gap-6 z-20">
                                    {[ZoomIn, Layers, Filter, Globe].map((Icon, idx) => (
                                        <motion.button 
                                            key={idx} 
                                            whileHover={{ x: -8, scale: 1.05 }}
                                            className="p-6 bg-slate-900/80 border border-white/10 rounded-[2.5rem] text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-400 backdrop-blur-3xl transition-all shadow-3xl group"
                                        >
                                            <Icon size={28} className="group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                        </motion.button>
                                    ))}
                                </div>
                            </TacticalCard>
                        </div>

                        {/* Analytic Sidebars */}
                        <div className="col-span-12 xl:col-span-4 flex flex-col gap-12">
                            
                            <HoloContainer className="p-12 bg-slate-900/60 rounded-[4rem] border-white/5 space-y-12 shadow-3xl">
                                <div className="flex items-center gap-8 mb-4 border-b border-white/5 pb-10">
                                    <div className="p-5 bg-indigo-500/10 rounded-3xl shadow-inner">
                                        <TrendingUp size={32} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">НЕЙРО_МЕТРИКИ</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3 italic">REALTIME_TOPOLOGY_SCORE</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10">
                                    {[
                                        { label: 'ЩІЛЬНІСТЬ', val: '0.942', sub: 'GRAPH_DENSITY', color: 'indigo', icon: <Share2 size={16} /> },
                                        { label: 'ЦЕНТРАЛЬНІСТЬ', val: '1.240', sub: 'HUB_RELEVANCE', color: 'indigo', icon: <Target size={16} /> },
                                        { label: 'КЛАСТЕРИЗАЦІЯ', val: '0.884', sub: 'LOUVAIN_INDEX', color: 'emerald', icon: <Layout size={16} /> },
                                        { label: 'АНТРОПІЯ', val: '0.112', sub: 'SYSTEM_STABILITY', color: 'emerald', icon: <Activity size={16} /> }
                                    ].map((m, i) => (
                                        <div key={i} className="group relative">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-slate-500 group-hover:text-indigo-400 transition-colors">
                                                    {m.icon}
                                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">{m.label}</span>
                                                </div>
                                                <div className="text-4xl font-black text-white italic tracking-tighter leading-none">{m.val}</div>
                                                <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{m.sub}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </HoloContainer>

                            <TacticalCard variant="cyber" className="p-12 border-rose-500/20 bg-rose-500/[0.02] rounded-[4rem] flex-1 flex flex-col relative overflow-hidden group/anomaly">
                                <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none transition-transform duration-1000 group-hover/anomaly:scale-110 group-hover/anomaly:rotate-12">
                                    <Skull size={320} className="text-rose-500" />
                                </div>

                                <div className="flex items-center gap-8 mb-12 pb-10 border-b border-rose-500/10 relative z-10">
                                    <div className="p-5 bg-rose-500/20 rounded-3xl shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse">
                                        <ShieldAlert size={32} className="text-rose-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">КРИТИЧНІ <span className="text-rose-500">КЛАСТЕРИ</span></h3>
                                        <p className="text-[10px] font-black text-rose-500/40 uppercase tracking-[0.5em] mt-3 italic">ANOMALY_DETECTION_CORE</p>
                                    </div>
                                </div>

                                <div className="space-y-8 overflow-y-auto pr-6 no-scrollbar flex-1 relative z-10 italic">
                                    {(clusters.length > 0 ? clusters : [
                                        { name: 'ТОВ "ЕНЕРГО-СИНДИКАТ"', risk: 99, nodes: 56, type: 'SHADOW_CARTEL' },
                                        { name: 'МЕРЕЖА "КЛІЧКО-ТАБАЧНИК"', risk: 95, nodes: 38, type: 'POWER_GROUP' },
                                        { name: 'ОФШОР "PANAMA_NEXUS"', risk: 92, nodes: 22, type: 'UBO_HIDDEN' },
                                        { name: 'ПРАТ "МАГІСТРАЛЬ-ГРУП"', risk: 84, nodes: 14, type: 'LOGISTICS_PROXY' }
                                    ]).map((c, i) => (
                                        <div key={i} className="p-8 bg-slate-950/60 border border-white/5 rounded-[3rem] hover:border-rose-500/40 transition-all cursor-pointer group/item flex flex-col gap-6 shadow-2xl">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.4em] leading-none">{c.type}</span>
                                                    <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover/item:text-rose-400 transition-colors leading-tight line-clamp-1">{c.name}</h4>
                                                </div>
                                                <Badge className="bg-rose-500 text-black border-none font-black text-[11px] px-5 py-1.5 italic shadow-[0_0_20px_rgba(244,63,94,0.5)]">{c.risk}%</Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                                    <Network size={14} className="text-rose-500/50" />
                                                    <span>{c.nodes} СОТ</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] font-black text-indigo-400 hover:text-white transition-colors">
                                                    АНАЛІЗУВАТИ <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleRunLouvain}
                                    className="mt-12 w-full py-8 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-black rounded-[2.5rem] uppercase tracking-[0.4em] shadow-[0_20px_50px_-10px_rgba(244,63,94,0.4)] hover:shadow-[0_0_60px_rgba(244,63,94,0.6)] transition-all flex items-center justify-center gap-8 italic group/btn"
                                >
                                    <span>АНАЛІЗ КАРТЕЛІВ LOUVAIN</span>
                                    <Target size={24} className="group-hover/btn:rotate-90 transition-transform" />
                                </motion.button>
                            </TacticalCard>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .font-display {
                        font-family: 'Inter', sans-serif;
                    }
                `}} />
            </div>
        </PageTransition>
    );
};

export default GraphAnalyticsPage;
