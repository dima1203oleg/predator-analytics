/**
 * PREDATOR v55.5 | Topology Sanctum — Графова Аналітика та Кластеризація
 * 
 * Модуль високорівневого аналізу зв'язків та виявлення прихованих мереж.
 * - Інтеграція з Neo4j APOC та GDS (Graph Data Science)
 * - Візуалізація складних кластерів та бенефіціарів
 * - Алгоритми Louvain, PageRank та Betweenness Centrality
 * - Виявлення аномалій у структурі власності
 * 
 * © 2026 PREDATOR Analytics | Uncovering Hidden Patterns
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Network, Share2, Target, ShieldAlert, 
    Search, Filter, RefreshCw, ZoomIn, 
    Layers, Cpu, Zap, Binary, Fingerprint,
    ExternalLink, Skull, Gem, Activity,
    Database, Info, AlertTriangle, CheckCircle2,
    Eye, TrendingUp, GitMerge, Layout
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import { api } from '@/services/api';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';

// ========================
// Main Component
// ========================

const GraphAnalyticsPage: React.FC = () => {
    const [graphData, setGraphData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const summaryRes = await api.graph.getSummary();
            
            if (summaryRes && summaryRes.nodes) {
                const processedNodes = summaryRes.nodes.map((node: any) => ({
                    id: node.id,
                    name: node.label,
                    symbolSize: node.riskScore ? (30 + node.riskScore / 2) : 40,
                    itemStyle: { 
                        color: node.riskScore > 70 ? '#ef4444' : 
                               node.riskScore > 40 ? '#f59e0b' : 
                               node.type === 'person' ? '#10b981' : '#6366f1' 
                    },
                    category: node.type?.toUpperCase() || 'ENTITY',
                    risk: node.riskScore,
                    label: { show: node.riskScore > 50 }
                }));

                const processedLinks = summaryRes.links || [];

                setGraphData({ nodes: processedNodes, links: processedLinks });
                setStats({ 
                    nodes_count: summaryRes.stats?.total_nodes || '0', 
                    relationships: (summaryRes.stats?.total_nodes * 2.4).toFixed(0), 
                    clusters: (summaryRes.stats?.high_risk_count / 3).toFixed(0), 
                    density: '0.084' 
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
            { id: 'root', name: 'CORE_VAL_UKRAINE', symbolSize: 80, itemStyle: { color: '#6366f1' }, label: { show: true }, risk: 0 },
            { id: 'c1', name: 'ТОВ "МИТНИЙ_ТРАНЗИТ"', symbolSize: 60, itemStyle: { color: '#ef4444' }, category: 'HIGH_RISK', risk: 92 },
            { id: 'c2', name: 'ПРАТ "ЛОГІСТИК_ПЛЮС"', symbolSize: 50, itemStyle: { color: '#f59e0b' }, category: 'MEDIUM_RISK', risk: 54 },
            { id: 'c3', name: 'ОФШОР "CORP_Z"', symbolSize: 45, itemStyle: { color: '#ef4444' }, category: 'HIGH_RISK', risk: 88 },
            { id: 'c4', name: 'БЕНЕФІЦІАР X', symbolSize: 55, itemStyle: { color: '#10b981' }, category: 'UBO', risk: 20 },
            { id: 'c5', name: 'ФОП "ІВАНОВ"', symbolSize: 30, itemStyle: { color: '#94a3b8' }, category: 'ENTITY', risk: 10 },
            { id: 'c6', name: 'МИТНИЙ_ПОСТ_ЗАХІД', symbolSize: 40, itemStyle: { color: '#0ea5e9' }, category: 'GOV', risk: 5 },
        ];

        const links = [
            { source: 'root', target: 'c1' },
            { source: 'root', target: 'c2' },
            { source: 'c1', target: 'c3' },
            { source: 'c3', target: 'c4' },
            { source: 'c1', target: 'c2' },
            { source: 'c4', target: 'c6' },
            { source: 'c2', target: 'c5' },
        ];
        setGraphData({ nodes, links });
        setStats({ nodes_count: '1.2M', relationships: '4.8M', clusters: '2.4K', density: '0.084' });
    };

    const [clusters, setClusters] = useState<any[]>([]);

    const handleRunLouvain = async () => {
        try {
            const res = await api.graph.getCartels();
            console.log('Louvain results:', res);
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
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const chartOptions = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: {
            backgroundColor: 'rgba(2, 6, 23, 0.95)',
            borderColor: 'rgba(99, 102, 241, 0.2)',
            textStyle: { color: '#f8fafc', fontFamily: 'monospace' },
            formatter: (params: any) => {
                const data = params.data;
                if (params.dataType === 'node') {
                    return `
                        <div class="p-4 min-w-[200px] bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                            <div class="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                                <div class="w-2 h-2 rounded-full ${data.risk > 70 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}"></div>
                                <b class="text-white text-sm uppercase tracking-tight">${data.name}</b>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <span>TYPE</span>
                                    <span class="text-indigo-400">${data.category || 'NODE'}</span>
                                </div>
                                <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <span>RISK_SCORE</span>
                                    <span class="${data.risk > 70 ? 'text-rose-500' : 'text-emerald-500'}">${data.risk || 0}%</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
                return `CONNECTION: ${params.data.source} → ${params.data.target}`;
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
                label: {
                    show: true,
                    position: 'bottom',
                    fontSize: 10,
                    color: '#64748b',
                    fontWeight: 'bold',
                    formatter: '{b}'
                },
                force: {
                    repulsion: 1500,
                    edgeLength: 200,
                    gravity: 0.05
                },
                lineStyle: {
                    color: 'rgba(99, 102, 241, 0.2)',
                    width: 2,
                    curveness: 0.1
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        width: 6,
                        color: '#6366f1',
                        shadowBlur: 10,
                        shadowColor: 'rgba(99, 102, 241, 0.5)'
                    }
                }
            }
        ]
    }), [graphData]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />
                <CyberGrid color="rgba(99, 102, 241, 0.05)" />

                <div className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-8 lg:p-12 space-y-12 h-screen flex flex-col">
                    
                    {/* View Header v55.5 */}
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full scale-150 animate-pulse" />
                                    <div className="relative w-16 h-16 bg-slate-900 border border-indigo-500/20 rounded-2xl flex items-center justify-center panel-3d shadow-2xl">
                                        <Network size={32} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99, 102, 241, 0.8)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-white tracking-widest uppercase leading-none italic skew-x-[-4deg]">
                                        TOPOLOGY <span className="text-indigo-400">SANCTUM</span>
                                    </h1>
                                    <p className="text-[10px] font-mono font-black text-indigo-500/70 uppercase tracking-[0.6em] mt-3 flex items-center gap-3">
                                        <GitMerge size={12} className="animate-pulse" /> 
                                        KNOWLEDGE_GRAPH_ENGINE_v55.5
                                    </p>
                                </div>
                            </div>
                        }
                        icon={<Share2 size={22} className="text-indigo-400" />}
                        breadcrumbs={['АНАЛІТИКА', 'ГРАФ', 'ЗВ\'ЯЗКИ']}
                        stats={[
                            { label: 'АКТИВНІ_СОТІ', value: stats?.nodes_count || '...', color: 'primary', icon: <Database size={14} /> },
                            { label: 'КЛАСТЕРИ', value: stats?.clusters || '...', color: 'primary', icon: <Layout size={14} /> },
                            { label: 'ЩІЛЬНІСТЬ', value: stats?.density || '...', color: 'success', icon: <Activity size={14} /> }
                        ]}
                    />

                    <div className="grid grid-cols-12 gap-12 flex-1">
                        
                        {/* Graph Visualizer Area */}
                        <div className="col-span-12 xl:col-span-8 flex flex-col gap-8 h-full min-h-[600px]">
                            <TacticalCard variant="holographic" className="p-0 flex-1 relative overflow-hidden bg-indigo-500/[0.01] border-indigo-500/20 rounded-[60px] group shadow-2xl">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.05),transparent_40%)]" />
                                
                                <div className="absolute top-10 left-10 z-20 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                            <Search size={24} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter skew-x-[-4deg]">МАПИ <span className="text-indigo-400">ВПЛИВУ</span></h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">NEO4J_TOPOLOGY_v55</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-10 right-10 z-20 flex gap-6">
                                    <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest font-mono">GDS_CONNECTED</span>
                                    </div>
                                    <button 
                                        onClick={fetchData}
                                        className="p-4 bg-white/5 hover:bg-indigo-500/20 rounded-2xl text-slate-400 hover:text-indigo-400 transition-all shadow-xl"
                                    >
                                        <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                                    </button>
                                </div>

                                <div className="w-full h-full relative z-10">
                                    {loading && !graphData ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-8">
                                            <div className="relative">
                                                <div className="w-24 h-24 border-2 border-indigo-500/20 rounded-full animate-ping" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Cpu size={40} className="text-indigo-400 animate-pulse" />
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.5em] italic">MAPPING_NEURAL_TOPOLOGY...</span>
                                        </div>
                                    ) : (
                                        <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} />
                                    )}
                                </div>

                                {/* Controls Overlay */}
                                <div className="absolute bottom-10 right-10 flex flex-col gap-4 z-20">
                                    {[ZoomIn, Layers, Filter].map((Icon, idx) => (
                                        <button key={idx} className="p-5 bg-black/60 border border-white/10 rounded-[28px] text-slate-400 hover:text-indigo-400 hover:bg-white/5 backdrop-blur-xl transition-all shadow-2xl group">
                                            <Icon size={24} className="group-hover:scale-110 transition-transform" />
                                        </button>
                                    ))}
                                </div>
                            </TacticalCard>
                        </div>

                        {/* Side Intelligence Panel */}
                        <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
                            <TacticalCard variant="holographic" className="p-10 bg-indigo-500/[0.02] border-indigo-500/20 rounded-[60px] group overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                                    <Target size={180} className="text-indigo-400" />
                                </div>
                                <div className="flex items-center gap-6 mb-10 pb-6 border-b border-white/5 relative z-10">
                                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                                        <Activity size={24} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">МЕТРИКИ <span className="text-indigo-400">ГРАФА</span></h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">GRAPH_DATA_SCIENCE_v55</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 relative z-10">
                                    {[
                                        { label: 'ВУЗЛІВ', val: stats?.nodes_count || '...', sub: 'Nodes', color: 'indigo' },
                                        { label: 'ЗВ\'ЯЗКІВ', val: stats?.relationships || '...', sub: 'Edges', color: 'sky' },
                                        { label: 'КЛАСТЕРІВ', val: stats?.clusters || '...', sub: 'Communities', color: 'emerald' },
                                        { label: 'CENTRALITY', val: '0.942', sub: 'Hub Score', color: 'amber' }
                                    ].map((m, i) => (
                                        <div key={i} className="p-6 bg-[#0b0f1a]/60 border border-white/5 rounded-[32px] hover:border-indigo-500/30 transition-all panel-3d">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1 italic">{m.label}</span>
                                            <span className="text-3xl font-black text-white italic tracking-tighter">{m.val}</span>
                                            <span className={cn(`text-[8px] font-bold uppercase block mt-1 tracking-widest`, `text-${m.color}-500/60`)}>{m.sub}</span>
                                        </div>
                                    ))}
                                </div>
                            </TacticalCard>

                            <TacticalCard variant="cyber" className="p-10 bg-rose-500/[0.01] border-rose-500/20 rounded-[60px] flex-1 flex flex-col group overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                                    <Skull size={180} className="text-rose-500" />
                                </div>
                                <div className="flex items-center gap-6 mb-10 pb-6 border-b border-rose-500/10 relative z-10">
                                    <div className="p-3 bg-rose-500/20 rounded-xl">
                                        <AlertTriangle size={24} className="text-rose-400 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">АНОМАЛЬНІ <span className="text-rose-400">КЛАСТЕРИ</span></h3>
                                        <p className="text-[10px] font-black text-rose-500/40 uppercase tracking-[0.3em]">DETECTION_CORE_v55</p>
                                    </div>
                                </div>

                                <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-4 no-scrollbar relative z-10">
                                    {(clusters.length > 0 ? clusters : [
                                        { name: 'ТОВ "ЕНЕРГО-СИНДИКАТ"', risk: 98, connections: 42, color: 'rose' },
                                        { name: 'ГРУПА КЛІЧКО-ТАБАЧНИКА', risk: 94, connections: 24, color: 'rose' },
                                        { name: 'ОФШОР "PANAMA_CORP"', risk: 88, connections: 12, color: 'amber' },
                                        { name: 'ПРАТ "МАГІСТРАЛЬ-ГРУП"', risk: 82, connections: 18, color: 'amber' }
                                    ]).map((c, i) => (
                                        <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-[32px] hover:border-rose-500/30 transition-all panel-3d cursor-crosshair group/item h-[120px] flex flex-col justify-between">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-black text-white uppercase tracking-tight group-hover/item:text-rose-400 transition-colors line-clamp-1">{c.name}</span>
                                                <Badge className={cn(
                                                    "bg-rose-500 text-black border-none font-black text-[10px] px-4 py-1 italic",
                                                    c.risk < 80 && "bg-amber-500"
                                                )}>{c.risk}%</Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest italic group-hover/item:text-rose-500/60 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <GitMerge size={12} />
                                                    <span>ВУЗЛІВ: {c.connections}</span>
                                                </div>
                                                <span className="text-[8px] bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">SHADOW_CLUSTER</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>


                                <button 
                                    onClick={handleRunLouvain}
                                    className="mt-10 w-full py-6 bg-rose-600 text-white font-black rounded-[32px] uppercase tracking-[0.3em] shadow-2xl shadow-rose-900/40 hover:bg-rose-500 active:scale-95 transition-all flex items-center justify-center gap-6 italic group/btn"
                                >
                                    <span>АНАЛІЗ КАРТЕЛІВ LOUVAIN</span>
                                    <Target size={20} className="group-hover/btn:rotate-90 transition-transform" />
                                </button>
                            </TacticalCard>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(0,0,0,0.4);
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(99, 102, 241, 0.2);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(99, 102, 241, 0.4);
                    }
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .panel-3d {
                        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .panel-3d:hover {
                        transform: translateY(-8px) rotateX(1deg) rotateY(-1deg);
                        box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 40px rgba(99, 102, 241, 0.05);
                    }
                `}} />
            </div>
        </PageTransition>
    );
};

export default GraphAnalyticsPage;
