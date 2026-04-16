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
import { TacticalCard } from '@/components/TacticalCard';
import { CyberGrid } from '@/components/CyberGrid';


const NetworkMapPage: React.FC = () => {
    const cyRef = useRef<HTMLDivElement>(null);
    const [cy, setCy] = useState<cytoscape.Core | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState<any>(null);

    const { data: graphData, isLoading, refetch } = useQuery({
        queryKey: ['network-graph'],
        queryFn: () => networkApi.getGraph()
    });

    useEffect(() => {
        if (!cyRef.current || !graphData) return;

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
                        'border-color': '#10b981',
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
                        'border-color': '#f59e0b',
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
    }, [graphData]);

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
        <div className="flex flex-col h-screen bg-[#02040a] text-white overflow-hidden relative">
            <CyberGrid color="rgba(245, 158, 11, 0.03)" />
            
            {/* Header HUD */}
            <div className="p-8 border-b border-white/[0.03] bg-black/40 backdrop-blur-3xl flex items-center justify-between z-30">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-full scale-150 animate-pulse" />
                        <div className="relative p-5 bg-black border border-amber-900/30 rounded-2xl shadow-2xl">
                            <Network className="text-amber-500" size={28} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.4em] italic">TOPOLOGY_VISUALIZER // v56.5-ELITE.4</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter italic uppercase text-white skew-x-[-4deg]">МЕРЕЖЕВИЙ <span className="text-amber-500">АНАЛІЗ_ЗВʼЯЗКІВ</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-6 py-2 bg-black/40 border border-white/5 rounded-2xl">
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ВУЗЛІВ_В_ПАМʼЯТІ</p>
                            <p className="text-xs font-mono font-black text-emerald-500">{(graphData?.nodes?.length || 0) + (graphData?.edges?.length || 0)}</p>
                        </div>
                        <div className="w-px h-8 bg-white/5 mx-2" />
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">СТАТУС_КЛАСТЕРА</p>
                            <p className="text-xs font-mono font-black text-amber-500 uppercase">READY</p>
                        </div>
                    </div>

                    <div className="relative group/search">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/search:text-amber-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="ВВЕДІТЬ_ЄДРПОУ_АБО_ПІБ"
                            className="bg-black border-2 border-white/5 rounded-[2rem] pl-16 pr-8 py-5 text-sm w-96 focus:outline-none focus:border-amber-500/40 focus:bg-amber-500/5 transition-all font-mono italic uppercase tracking-widest placeholder:text-slate-800"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    
                    <button 
                        onClick={() => refetch()}
                        className="p-5 bg-black border border-white/5 rounded-2xl hover:border-amber-500/40 transition-all text-slate-500 hover:text-amber-500 group"
                    >
                        <RefreshCw size={24} className={cn("transition-transform duration-1000", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                {/* Cytoscape Container */}
                <div ref={cyRef} className="absolute inset-0" />

                {/* HUD Overlay Elements */}
                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 z-10 border-double opacity-20" />
                <div className="absolute top-1/2 left-10 -translate-y-1/2 w-px h-64 bg-gradient-to-b from-transparent via-amber-500/40 to-transparent z-20" />
                <div className="absolute top-1/2 right-10 -translate-y-1/2 w-px h-64 bg-gradient-to-b from-transparent via-amber-500/40 to-transparent z-20" />

                {/* Controls HUD */}
                <div className="absolute bottom-10 left-10 flex items-center gap-4 z-30">
                    <div className="flex flex-col bg-black/60 border border-white/5 p-2 rounded-2xl backdrop-blur-xl">
                        <button onClick={() => cy?.zoom(cy.zoom() * 1.2)} className="p-4 text-slate-500 hover:text-amber-500 hover:bg-white/5 rounded-xl transition-all">
                            <ZoomIn size={24} />
                        </button>
                        <button onClick={() => cy?.zoom(cy.zoom() / 1.2)} className="p-4 text-slate-500 hover:text-amber-500 hover:bg-white/5 rounded-xl transition-all">
                            <ZoomOut size={24} />
                        </button>
                    </div>
                    <button onClick={() => cy?.fit()} className="p-6 bg-black/60 border border-white/5 rounded-[2rem] text-slate-500 hover:text-amber-500 backdrop-blur-xl transition-all shadow-2xl">
                        <Maximize size={28} />
                    </button>
                    <div className="ml-10 space-y-2">
                        <div className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/5 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ОРГАНІЗАЦІЇ</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/5 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
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
                            <TacticalCard 
                                variant="cyber" 
                                className="h-full bg-black/90 border-amber-500/30 shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden"
                                noPadding
                            >
                                <div className="p-10 space-y-10 h-full flex flex-col">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 bg-amber-500/10 rounded-2xl">
                                                <Target size={24} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] italic leading-none">TARGET_SCAN</h4>
                                                <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest italic">ID: {selectedNode.id}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedNode(null)} className="p-4 text-slate-700 hover:text-white transition-colors">
                                            <Maximize className="rotate-45" size={24} />
                                        </button>
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
                                                    <span className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 animate-pulse flex items-center gap-3">
                                                        <ShieldAlert size={14} /> КРИТИЧНИЙ_РИЗИК
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-6">
                                            <div className="flex items-center gap-4 text-emerald-500">
                                                <Zap size={20} />
                                                <span className="text-xs font-black uppercase tracking-[0.3em] italic">НЕЙРО-ВИСНОВОК v4</span>
                                            </div>
                                            <p className="text-sm font-black text-slate-300 leading-relaxed italic opacity-80">
                                                Об'єкт ідентифіковано як {selectedNode.type === 'company' ? "центральний вузол холдингової структури" : "пов'язану особу з правом вирішального впливу"}.
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
                                                <p className="text-3xl font-black text-amber-500 italic font-mono">{selectedNode.primary_risk === 'high' ? 'CRIT' : 'STBL'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 mt-auto pt-10 border-t border-white/5">
                                        <button className="w-full py-6 bg-amber-500 hover:bg-white text-black font-black rounded-3xl uppercase tracking-[0.4em] text-[10px] transition-all flex items-center justify-center gap-5 shadow-2xl">
                                            <Share2 size={20} /> ВІДКРИТИ_CERS_ДОСЬЄ
                                        </button>
                                        <button className="w-full py-6 bg-white/5 hover:bg-white/10 text-slate-500 font-black rounded-3xl uppercase tracking-[0.4em] text-[10px] transition-all flex items-center justify-center gap-5">
                                            <Radio size={20} /> МОНІТОРИНГ_ЗВʼЯЗКІВ
                                        </button>
                                    </div>
                                </div>
                            </TacticalCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NetworkMapPage;
