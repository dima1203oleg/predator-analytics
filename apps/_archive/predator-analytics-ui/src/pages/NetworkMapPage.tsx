import { Button } from '@/components/ui/button';
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { networkApi } from '@/features/network/api/network';
import { useQuery } from '@tanstack/react-query';
import { 
    Network, 
    Search, 
    Filter, 
    ZoomIn, 
    ZoomOut, 
    Maximize, 
    RefreshCw,
    Share2,
    ShieldAlert,
    Info,
    Shield,
    Target,
    Zap,
    Cpu,
    Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { HoloCard } from '@/components/ui/HoloCard';
import { CyberGrid } from '@/components/CyberGrid';
import { FinancialFlowPanel } from '@/components/graph/FinancialFlowPanel';
import { analyticsService } from '@/services/unified/analytics.service';
import { HoloContainer } from '@/components/HoloContainer';
import { useGraphStore } from '@/core/state/graph.store';
import { ObservatoryEntry } from '@/features/ObservatoryEntry';

const KnowledgeGraph3D = React.lazy(() => import('@/components/graph/KnowledgeGraph3D'));

const VramIndicator: React.FC = () => {
    const { data: vram } = useQuery({
        queryKey: ['vram-status'],
        queryFn: async () => {
            const resp = await fetch('/api/v1/antigravity/vram');
            return resp.json();
        },
        refetchInterval: 5000
    });

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'SOVEREIGN': return 'text-green-500';
            case 'HYBRID': return 'text-yellow-500';
            case 'CLOUD': return 'text-rose-500';
            default: return 'text-slate-500';
        }
    };

    return (
        <p className={cn("text-xs font-mono font-black uppercase", getModeColor(vram?.mode))}>
            {vram?.vram_usage_gb?.toFixed(1) || '0.0'}GB // {vram?.mode || 'IDLE'}
        </p>
    );
};

const NetworkMapPage: React.FC = () => {
    const cyRef = useRef<HTMLDivElement>(null);
    const [cy, setCy] = useState<cytoscape.Core | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
    
    const setGraphDataStore = useGraphStore(state => state.setGraphData);

    const { data: graphData, isLoading, refetch } = useQuery({
        queryKey: ['network-graph'],
        queryFn: () => networkApi.getGraph()
    });

    // Sync data to the new 3D Observatory store regardless of 2D/3D view mode
    useEffect(() => {
        if (graphData) {
            setGraphDataStore(graphData.nodes, graphData.edges);
        }
    }, [graphData, setGraphDataStore]);

    useEffect(() => {
        if (!cyRef.current || !graphData || viewMode !== '2d') return;

        const cyInstance = cytoscape({
            container: cyRef.current,
            elements: [...graphData.nodes, ...graphData.edges],
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#1e293b',
                        'label': 'data(label)',
                        'color': '#94a3b8',
                        'font-size': '9px',
                        'font-family': 'Inter, sans-serif',
                        'font-weight': 'bold',
                        'text-valign': 'bottom',
                        'text-halign': 'center',
                        'text-margin-y': 5,
                        'width': 35,
                        'height': 35,
                        'border-width': 2,
                        'border-color': 'rgba(255,255,255,0.05)',
                        'text-outline-color': '#000',
                        'text-outline-width': 2
                    }
                },
                {
                    selector: 'node[type="company"]',
                    style: {
                        'background-color': '#020617',
                        'border-color': '#e11d48',
                        'border-opacity': 0.4,
                        'shape': 'round-rectangle',
                        'width': 45,
                        'height': 45
                    }
                },
                {
                    selector: 'node[type="person"]',
                    style: {
                        'background-color': '#020617',
                        'border-color': '#fb7185',
                        'border-opacity': 0.4,
                        'shape': 'ellipse'
                    }
                },
                {
                    selector: 'node[primary_risk="high"]',
                    style: {
                        'border-color': '#ef4444',
                        'border-width': 4,
                        'border-opacity': 1,
                        'overlay-color': '#ef4444',
                        'overlay-opacity': 0.1,
                        'overlay-padding': 10
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 1.5,
                        'line-color': 'rgba(255,255,255,0.05)',
                        'target-arrow-color': 'rgba(255,255,255,0.1)',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(type)',
                        'font-size': '7px',
                        'font-weight': 'bold',
                        'font-family': 'monospace',
                        'color': '#475569',
                        'text-rotation': 'autorotate',
                        'text-background-color': '#000',
                        'text-background-opacity': 0.8,
                        'text-background-padding': '2px'
                    }
                },
                {
                    selector: ':selected',
                    style: {
                        'border-color': '#fff',
                        'border-width': 4,
                        'line-color': 'rgba(255,255,255,0.3)',
                        'background-color': '#fff',
                        'color': '#fff'
                    }
                }
            ],
            layout: {
                name: 'cose',
                animate: true,
                randomize: false,
                idealEdgeLength: (edge: any) => 100,
                nodeOverlap: 20
            }
        });

        cyInstance.on('tap', 'node', (evt) => {
            setSelectedNode(evt.target.data());
        });

        cyInstance.on('tap', (evt) => {
            if (evt.target === cyInstance) {
                setSelectedNode(null);
            }
        });

        setCy(cyInstance);

        return () => {
            cyInstance.destroy();
        };
    }, [graphData, viewMode]);

    const handleSearch = async () => {
        if (!searchQuery) return;
        const results = await networkApi.searchNodes(searchQuery);
        if (results.nodes && results.nodes.length > 0) {
            const firstNodeId = (results as any).nodes[0].data.id;
            const node = cy?.getElementById(firstNodeId);
            if (node) {
                cy?.center(node);
                cy?.zoom(1.5);
                node.select();
                setSelectedNode(node.data());
            }
        }
    };

    return (
        <div className="flex flex-col h-screen bg-transparent text-white overflow-hidden relative">
            <CyberGrid color="rgba(225, 29, 72, 0.03)" />
            
            {/* Header HUD (Only in 2D mode) */}
            {viewMode === '2d' && (
            <div className="p-8 border-b border-white/[0.03] bg-black/40  flex items-center justify-between z-30">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-rose-500/10 blur-2xl rounded-full scale-150 " />
                        <div className="relative p-5 bg-black border border-rose-900/30 rounded-2xl shadow-2xl">
                            <Network className="text-rose-500" size={28} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.4em] italic">TOPOLOGY_VISUALIZER // v61.0-ELITE-ELITE</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 " />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter italic uppercase text-white skew-x-[-4deg]">МЕ ЕЖЕВИЙ <span className="text-rose-500">АНАЛІЗ_ЗВʼЯЗКІВ</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-6 py-2 bg-black/40 border border-white/5 rounded-2xl">
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ВУЗЛІВ_В_ПАМʼЯТІ</p>
                            <p className="text-xs font-mono font-black text-rose-500">{(graphData?.nodes?.length || 0) + (graphData?.edges?.length || 0)}</p>
                        </div>
                        <div className="w-px h-8 bg-white/5 mx-2" />
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">VRAM_STATUS</p>
                            <VramIndicator />
                        </div>
                        <div className="w-px h-8 bg-white/5 mx-2" />
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">СТАТУС_КЛАСТЕРА</p>
                            <p className="text-xs font-mono font-black text-rose-500 uppercase">READY</p>
                        </div>
                    </div>

                    <div className="relative group/search">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/search:text-rose-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="ВВЕДІТЬ_ЄДРПОУ_АБО_ПІБ"
                            className="bg-black border-2 border-white/5 rounded-[2rem] pl-16 pr-8 py-5 text-sm w-96 focus:outline-none focus:border-rose-500/40 focus:bg-rose-500/5 transition-all font-mono italic uppercase tracking-widest placeholder:text-slate-800"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    
                    <div className="flex bg-black border border-white/5 p-1 rounded-2xl">
                        <Button variant={viewMode === '2d' ? 'sovereign' : 'ghost'}
                            onClick={() => setViewMode('2d')}
                            className="rounded-xl w-16"
                        >
                            2D
                        </Button>
                        <Button variant={(viewMode as string) === '3d' ? 'sovereign' : 'ghost'}
                            onClick={() => setViewMode('3d')}
                            className="rounded-xl w-16"
                        >
                            3D
                        </Button>
                    </div>

                    <Button variant="cyber" size="icon"
                        onClick={() => refetch()}
                        className="rounded-2xl"
                    >
                        <RefreshCw size={24} className={cn("transition-transform duration-1000", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>
            )}

            {/* Floating Toggle for 3D Mode */}
            {viewMode === '3d' && (
                <div className="absolute top-6 right-6 z-[100]">
                    <Button variant="sovereign" size="lg"
                        onClick={() => setViewMode('2d')}
                    >
                        ПОВЕРНУТИСЯ ДО 2D
                    </Button>
                </div>
            )}

            <div className="flex-1 relative">
                {/* Graph Container */}
                {viewMode === '2d' ? (
                    <div ref={cyRef} className="absolute inset-0" />
                ) : (
                    <div className="absolute inset-0">
                        <React.Suspense fallback={<div className="flex items-center justify-center h-full w-full bg-[#020617] text-slate-400 font-mono text-sm tracking-widest">ІНІЦІАЛІЗАЦІЯ ОБСЕРВАТОРІЇ...</div>}>
                            {/* Rendering the new Enterprise Observatory 3D Workspace */}
                            <ObservatoryEntry />
                        </React.Suspense>
                    </div>
                )}

                {viewMode === '2d' && (
                    <>
                        {/* HUD Overlay Elements */}
                        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 z-10 border-double opacity-20" />
                <div className="absolute top-1/2 left-10 -translate-y-1/2 w-px h-64 bg-gradient-to-b from-transparent via-rose-500/40 to-transparent z-20" />
                <div className="absolute top-1/2 right-10 -translate-y-1/2 w-px h-64 bg-gradient-to-b from-transparent via-rose-500/40 to-transparent z-20" />

                {/* Controls HUD */}
                <div className="absolute bottom-10 left-10 flex items-center gap-4 z-30">
                    <div className="flex flex-col bg-black/60 border border-white/5 p-2 rounded-2xl gap-2">
                        <Button variant="holographic" size="icon" onClick={() => cy?.zoom(cy.zoom() * 1.2)} className="rounded-xl w-12 h-12">
                            <ZoomIn size={24} />
                        </Button>
                        <Button variant="holographic" size="icon" onClick={() => cy?.zoom(cy.zoom() / 1.2)} className="rounded-xl w-12 h-12">
                            <ZoomOut size={24} />
                        </Button>
                    </div>
                    <Button variant="cyber" size="icon" onClick={() => cy?.fit()} className="w-16 h-16 rounded-[2rem]">
                        <Maximize size={28} />
                    </Button>
                    <div className="ml-10 space-y-2">
                        <div className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/5 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">О ГАНІЗАЦІЇ</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/5 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-rose-400" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ФІЗИЧНІ_ОСОБИ</span>
                        </div>
                    </div>
                </div>

                {/* Info & Intelligence HUD Panel */}
                <AnimatePresence>
                    {selectedNode && (
                        <motion.div 
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className="absolute top-10 right-10 bottom-10 w-[450px] z-40"
                        >
                            <HoloCard 
                                variant="cyber" 
                                className="h-full bg-black/90 border-rose-500/30 shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden"
                                noPadding
                            >
                                <div className="p-10 space-y-10 h-full flex flex-col">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 bg-rose-500/10 rounded-2xl">
                                                <Target size={24} className="text-rose-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] italic leading-none">TARGET_SCAN</h4>
                                                <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest italic">ID: {selectedNode.id}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)} className="rounded-2xl text-slate-500">
                                            <Maximize className="rotate-45" size={24} />
                                        </Button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-10">
                                        <div className="space-y-4">
                                            <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-tight drop-shadow-2xl">
                                                {selectedNode.label}
                                            </h2>
                                            <div className="flex flex-wrap gap-4">
                                                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    ENTITY://{selectedNode.type?.toUpperCase()}
                                                </span>
                                                {selectedNode.primary_risk === 'high' && (
                                                    <span className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500  flex items-center gap-3">
                                                        <ShieldAlert size={14} /> КРИТИЧНИЙ_РИЗИК
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-6">
                                            <div className="flex items-center gap-4 text-rose-500">
                                                <Zap size={20} />
                                                <span className="text-xs font-black uppercase tracking-[0.3em] italic">НЕЙ О-ВИСНОВОК v5</span>
                                            </div>
                                            <p className="text-sm font-black text-slate-300 leading-relaxed italic opacity-80">
                                                Об'єкт ідентифіковано як {selectedNode.type === 'company' ? "центральний вузол холдингової структури" : "пов'язану особу зправом вирішального впливу"}.
                                                Мережевий аналіз вказує на непрямий зв'язок з {selectedNode.primary_risk === 'high' ? "санкційними списками" : "прозорими капіталами"}.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-6 bg-black border border-white/5 rounded-2xl space-y-2">
                                                <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">DEGREE_CENTRALITY</p>
                                                <p className="text-3xl font-black text-white italic font-mono">0.842</p>
                                            </div>
                                            <div className="p-6 bg-black border border-white/5 rounded-2xl space-y-2">
                                                <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">RELIANCE_INDEX</p>
                                                <p className="text-3xl font-black text-rose-500 italic font-mono">{selectedNode.primary_risk === 'high' ? 'CRIT' : 'STBL'}</p>
                                            </div>
                                        </div>

                                        {/* Financial Flows Integration */}
                                        <HoloContainer className="p-8 bg-black/40 rounded-[2.5rem] border-white/5">
                                            <FinancialFlowPanel 
                                               flows={[
                                                   { source: selectedNode.label, target: 'CYPRUS_HOLDING', value: 12500000 },
                                                   { source: 'EXT_SOURCE_PANAMA', target: selectedNode.label, value: 480000 },
                                                   { source: selectedNode.label, target: 'LOCAL_VENDOR_X', value: 2100000 },
                                               ]} 
                                            />
                                        </HoloContainer>
                                    </div>

                                    <div className="flex flex-col gap-4 mt-auto pt-10 border-t border-white/5">
                                        <Button variant="sovereign" size="lg" className="w-full flex items-center justify-center gap-5">
                                            <Share2 size={20} /> ВІДКрИТИ CERS ДОСЬЄ
                                        </Button>
                                        <Button variant="holographic" size="lg" className="w-full flex items-center justify-center gap-5">
                                            <Radio size={20} /> МОНІТОРИНГ ЗВʼЯЗКІВ
                                        </Button>
                                    </div>
                                </div>
                            </HoloCard>
                        </motion.div>
                    )}
                </AnimatePresence>
                </>
            )}
            </div>
        </div>
    );
};

export default NetworkMapPage;
