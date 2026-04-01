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
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConstitutionalShield } from '@/components/shared/ConstitutionalShield';

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
                        'background-color': '#6366f1',
                        'label': 'data(label)',
                        'color': '#fff',
                        'font-size': '10px',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'width': 40,
                        'height': 40,
                        'border-width': 2,
                        'border-color': '#4338ca'
                    }
                },
                {
                    selector: 'node[type="company"]',
                    style: {
                        'background-color': '#10b981',
                        'border-color': '#059669',
                        'shape': 'round-rectangle'
                    }
                },
                {
                    selector: 'node[type="person"]',
                    style: {
                        'background-color': '#f59e0b',
                        'border-color': '#d97706',
                        'shape': 'ellipse'
                    }
                },
                {
                    selector: 'node[primary_risk="high"]',
                    style: {
                        'border-color': '#ef4444',
                        'border-width': 4
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#475569',
                        'target-arrow-color': '#475569',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(type)',
                        'font-size': '8px',
                        'color': '#94a3b8',
                        'text-rotation': 'autorotate'
                    }
                },
                {
                    selector: ':selected',
                    style: {
                        'border-color': '#fff',
                        'border-width': 4,
                        'line-color': '#fff'
                    }
                }
            ],
            layout: {
                name: 'cose',
                animate: true
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
            const firstNodeId = results.nodes[0].data.id;
            const node = cy?.getElementById(firstNodeId);
            if (node) {
                cy?.center(node);
                cy?.zoom(2);
                node.select();
                setSelectedNode(node.data());
            }
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Network className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight italic uppercase">Мережевий аналіз</h1>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Topology Visualization Engine v55</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Пошук вузлів (ЄДРПОУ, ПІБ)..."
                            className="bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            onClick={handleSearch}
                            aria-label="search"
                        >
                            <Search size={16} />
                        </button>
                    </div>
                    <button 
                        onClick={() => refetch()}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                {/* Cytoscape Container */}
                <div ref={cyRef} className="absolute inset-0" />

                {/* Controls */}
                <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
                    <button onClick={() => cy?.zoom(cy.zoom() * 1.2)} className="p-3 bg-slate-900/80 border border-slate-700 rounded-xl hover:bg-indigo-500/20 transition-all">
                        <ZoomIn size={20} />
                    </button>
                    <button onClick={() => cy?.zoom(cy.zoom() / 1.2)} className="p-3 bg-slate-900/80 border border-slate-700 rounded-xl hover:bg-indigo-500/20 transition-all">
                        <ZoomOut size={20} />
                    </button>
                    <button onClick={() => cy?.fit()} className="p-3 bg-slate-900/80 border border-slate-700 rounded-xl hover:bg-indigo-500/20 transition-all">
                        <Maximize size={20} />
                    </button>
                </div>

                {/* Legends */}
                <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl z-10">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Легенда</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                            <span className="text-[10px] uppercase font-bold">Компанія</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-500 rounded-full" />
                            <span className="text-[10px] uppercase font-bold">Особа</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-rose-500 rounded-sm" />
                            <span className="text-[10px] uppercase font-bold">Високий ризик</span>
                        </div>
                    </div>
                </div>

                {/* Info Panel */}
                <AnimatePresence>
                    {selectedNode && (
                        <motion.div 
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="absolute top-6 right-6 bottom-6 w-80 bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 z-20 shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <Info className="text-indigo-400" size={20} />
                                </div>
                                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
                                    <Maximize className="rotate-45" size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <h2 className="text-xl font-black italic uppercase mb-2">{selectedNode.label}</h2>
                                <div className="flex gap-2 mb-6">
                                    <span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded uppercase">{selectedNode.type}</span>
                                    {selectedNode.primary_risk === 'high' && (
                                        <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-1 rounded uppercase flex items-center gap-1">
                                            <ShieldAlert size={10} /> Ризик: Високий
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* Additional node properties */}
                                    {selectedNode.primary_risk === 'high' && (
                                        <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                                            <div className="flex items-center gap-2 text-rose-400 mb-1">
                                                <Shield size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-wider">OSINT Alert</span>
                                            </div>
                                            <p className="text-xs text-slate-300 leading-5">
                                                Вузол ідентифіковано як критичний елемент у ланцюгу ризику. Рекомендується перевірка через «Конституційний Щит».
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                                <Share2 size={14} /> Переглянути зв'язки
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ConstitutionalShield />
        </div>
    );
};

export default NetworkMapPage;
