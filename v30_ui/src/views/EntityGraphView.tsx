
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ZoomIn, ZoomOut, Maximize2, Share2,
    Download, RefreshCw, X, ShieldAlert, Network,
    Building, User, Database, Eye, EyeOff, Activity
} from 'lucide-react';
import { cn } from '../utils/cn';
import { premiumLocales } from '../locales/uk/premium';

interface GraphNode {
    id: string;
    type: 'PERSON' | 'ORGANIZATION' | 'ASSET' | 'TRANSACTION' | 'DECLARATION' | 'DEFAULT';
    label?: string;
    size?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    flagged?: boolean;
    metadata?: any;
}

interface GraphLink {
    source: string;
    target: string;
    type: 'OWNERSHIP' | 'TRANSACTION' | 'ASSOCIATION';
    label?: string;
    strength?: number;
}

const NODE_COLORS: Record<string, string> = {
    PERSON: '#3b82f6',
    ORGANIZATION: '#8b5cf6',
    ASSET: '#10b981',
    TRANSACTION: '#f59e0b',
    DECLARATION: '#22d3ee',
    DEFAULT: '#64748b'
};

const NODE_TYPES = [
  { id: 'PERSON', label: premiumLocales.entityGraph.filters.persons, color: '#3b82f6' },
  { id: 'ORGANIZATION', label: premiumLocales.entityGraph.filters.organizations, color: '#8b5cf6' },
  { id: 'DECLARATION', label: 'Декларації', color: '#22d3ee' },
  { id: 'ASSET', label: premiumLocales.entityGraph.filters.assets, color: '#10b981' },
  { id: 'TRANSACTION', label: premiumLocales.entityGraph.filters.transactions, color: '#f59e0b' }
];

import { useAppStore } from '../store/useAppStore';

export const EntityGraphView: React.FC = () => {
    const { userRole } = useAppStore();
    const isPremium = userRole === 'premium' || userRole === 'admin';
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLabels, setShowLabels] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    // Initial Data Load - REAL API
    useEffect(() => {
        const loadGraph = async () => {
            setIsLoading(true);
            try {
                // Спроба отримати реальні дані з Knowledge Graph API
                const response = await fetch('/api/v1/graph/summary');
                if (response.ok) {
                    const data = await response.json();

                    // Трансформуємо дані API в формат графу
                    if (data.nodes && data.nodes.length > 0) {
                        const graphNodes: GraphNode[] = data.nodes.map((n: any, i: number) => ({
                            id: n.id || `node-${i}`,
                            type: (n.type?.toUpperCase() || 'DEFAULT') as GraphNode['type'],
                            label: n.label || n.name || n.id,
                            size: n.connections ? Math.min(60, 25 + n.connections * 5) : 35,
                            x: (Math.random() - 0.5) * 300,
                            y: (Math.random() - 0.5) * 300,
                            flagged: n.flagged || n.risk_score > 0.7,
                            metadata: n
                        }));

                        const graphLinks: GraphLink[] = (data.edges || data.links || []).map((e: any) => ({
                            source: e.source || e.from,
                            target: e.target || e.to,
                            type: (e.type?.toUpperCase() || 'ASSOCIATION') as GraphLink['type'],
                            label: e.label || e.relationship,
                            strength: e.weight || e.strength || 1
                        }));

                        setNodes(graphNodes);
                        setLinks(graphLinks);
                    } else {
                        // Порожній граф - це нормально, показуємо empty state
                        setNodes([]);
                        setLinks([]);
                    }
                } else {
                    // API не доступний - показуємо empty state
                    console.warn("Graph API returned:", response.status);
                    setNodes([]);
                    setLinks([]);
                }
            } catch (err) {
                console.error("Failed to load graph:", err);
                // При помилці - порожній граф замість mock
                setNodes([]);
                setLinks([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadGraph();
    }, []);

    // Simple Physics Simulation Loop
    useEffect(() => {
        if (nodes.length === 0) return;

        const interval = setInterval(() => {
            if (isDragging) return;

            setNodes(prev => prev.map(node => {
                const ax = -node.x! * 0.01;
                const ay = -node.y! * 0.01;
                const vx = (node.vx || 0) + ax;
                const vy = (node.vy || 0) + ay;

                return {
                    ...node,
                    x: node.x! + vx * 0.1,
                    y: node.y! + vy * 0.1,
                    vx: vx * 0.95,
                    vy: vy * 0.95
                };
            }));
        }, 33);

        return () => clearInterval(interval);
    }, [nodes.length, isDragging]);

    const toggleFilter = (type: string) => {
        setActiveFilters(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    if (!isPremium) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-950/20 backdrop-blur-xl rounded-[48px] border border-white/5">
                <ShieldAlert size={64} className="text-amber-500 mb-6 opacity-50" />
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{premiumLocales.entityGraph.hud.accessRestricted}</h2>
                <p className="text-slate-400 max-w-md mb-8 leading-relaxed">{premiumLocales.entityGraph.hud.accessRestrictedDesc}</p>
                <button className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-xs">{premiumLocales.entityGraph.hud.upgradeButton}</button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-slate-950/40 rounded-[48px] border border-white/5">
            {/* TOP ACTIONS BAR */}
            <div className="absolute top-8 left-8 right-8 z-50 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-4 pointer-events-auto">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-4 bg-black/60 border border-white/10 rounded-2xl px-6 py-3 backdrop-blur-3xl shadow-2xl">
                            <Search size={18} className="text-slate-500" />
                            <input
                                type="text" placeholder={premiumLocales.entityGraph.search.placeholder}
                                className="bg-transparent border-none outline-none text-sm text-white w-64 font-medium placeholder-slate-600"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {NODE_TYPES.map(type => (
                            <button
                                key={type.id}
                                onClick={() => toggleFilter(type.id)}
                                title={`${premiumLocales.entityGraph.filters.filterBy} ${type.label}`}
                                className={cn(
                                    "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-xl flex items-center gap-2 shadow-lg",
                                    activeFilters.includes(type.id)
                                        ? "bg-white/10 border-white/20 text-white shadow-white/5"
                                        : "bg-black/40 border-white/5 text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <div
                                    className={cn("w-1.5 h-1.5 rounded-full accent-pulse-dynamic", `accent-${type.id}`)}
                                />
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pointer-events-auto">
                    {[
                        { icon: showLabels ? EyeOff : Eye, title: showLabels ? premiumLocales.entityGraph.actions.hideLabels : premiumLocales.entityGraph.actions.showLabels, onClick: () => setShowLabels(!showLabels), active: !showLabels },
                        { icon: Maximize2, title: premiumLocales.common.viewDetails },
                        { icon: RefreshCw, title: premiumLocales.entityGraph.actions.resetSimulation },
                        { icon: Share2, title: premiumLocales.executiveBrief.sidebar.shareBrief }
                    ].map((btn, i) => (
                        <button
                            key={i}
                            onClick={btn.onClick}
                            title={btn.title}
                            className={cn(
                                "p-3 rounded-xl border transition-all shadow-xl backdrop-blur-xl",
                                btn.active
                                    ? "bg-purple-500/20 border-purple-500/40 text-purple-400"
                                    : "bg-black/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                            )}
                        >
                            <btn.icon size={18} />
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN GRAPH CANVAS */}
            <motion.div
                className="flex-1 relative overflow-hidden"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
                <div className="absolute inset-0 combat-hud-grid opacity-20 pointer-events-none" />

                <svg className="w-full h-full">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Links */}
                    {links.map((edge, i) => {
                        const s = nodes.find(n => n.id === edge.source);
                        const t = nodes.find(n => n.id === edge.target);
                        if (!s || !t) return null;
                        if (activeFilters.length > 0 && (!activeFilters.includes(s.type) || !activeFilters.includes(t.type))) return null;

                        const color = NODE_COLORS[s.type] || NODE_COLORS.DEFAULT;
                        const isHovered = hoveredNode === s.id || hoveredNode === t.id;

                        return (
                            <g key={i}>
                                <line
                                    x1={window.innerWidth / 2 + s.x!}
                                    y1={window.innerHeight / 2 + s.y!}
                                    x2={window.innerWidth / 2 + t.x!}
                                    y2={window.innerHeight / 2 + t.y!}
                                    stroke={color}
                                    strokeWidth={isHovered ? 3 : 1.5}
                                    className="opacity-30 transition-all duration-300"
                                />
                            </g>
                        );
                    })}

                    {/* Nodes Group */}
                    <g>
                        {nodes.map(node => {
                            if (activeFilters.length > 0 && !activeFilters.includes(node.type)) return null;
                            const color = NODE_COLORS[node.type] || NODE_COLORS.DEFAULT;
                            const isSelected = selectedNode?.id === node.id;
                            const isHovered = hoveredNode === node.id;
                            const x = window.innerWidth / 2 + node.x!;
                            const y = window.innerHeight / 2 + node.y!;

                            return (
                                <motion.g
                                    key={node.id}
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.1 }}
                                    onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                                    onMouseEnter={() => setHoveredNode(node.id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    className="cursor-pointer"
                                >
                                    <circle
                                        cx={x} cy={y} r={node.size! * 0.7}
                                        fill={`${color}15`} stroke={color}
                                        strokeWidth={isSelected ? 3 : 1}
                                        className={cn("transition-all duration-300", isSelected ? "opacity-100" : "opacity-40")}
                                    />

                                    <circle
                                        cx={x} cy={y} r={node.size! * 0.4}
                                        fill={color}
                                        filter={isSelected ? "url(#glow)" : ""}
                                    />

                                    <foreignObject x={x - 10} y={y - 10} width={20} height={20} className="pointer-events-none">
                                        <div className="w-full h-full flex items-center justify-center text-white/90">
                                            {node.type === 'PERSON' ? <User size={12} /> :
                                             node.type === 'ORGANIZATION' ? <Building size={12} /> :
                                             node.type === 'DECLARATION' ? <FileText size={12} /> :
                                             node.type === 'TRANSACTION' ? <Activity size={12} /> : <Database size={12} />}
                                        </div>
                                    </foreignObject>

                                    {showLabels && (
                                        <g className="select-none pointer-events-none">
                                            <text
                                                x={x} y={y + node.size! * 0.7 + 12}
                                                fill="white" fontSize="9" fontWeight="800" textAnchor="middle"
                                                className="uppercase tracking-widest leading-none"
                                            >
                                                {node.label || node.id}
                                            </text>
                                        </g>
                                    )}
                                </motion.g>
                            );
                        })}
                    </g>
                </svg>
            </motion.div>

            {/* SIDE PANEL */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: 450 }} animate={{ x: 0 }} exit={{ x: 450 }}
                        className="absolute top-8 right-8 bottom-8 w-96 bg-black/80 border border-white/10 rounded-[32px] backdrop-blur-3xl z-[100] p-8 flex flex-col shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
                                <Network size={20} className="text-blue-400" />
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                title={premiumLocales.entityGraph.hud.closePanel}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center text-center mb-8">
                            <div
                                 className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2 shadow-xl entity-node-glow", `accent-${selectedNode.type}`)}
                             >
                                 {selectedNode.type === 'PERSON' ? <User size={40} className="text-blue-400" /> : <Building size={40} className="text-purple-400" />}
                             </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">{selectedNode.label}</h2>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EntityGraphView;
