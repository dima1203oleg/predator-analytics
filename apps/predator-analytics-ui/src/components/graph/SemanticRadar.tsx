import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Binary, Share2, Search, Filter, Maximize2,
    Link as LinkIcon, Database, Activity, Zap,
    Crosshair, ZoomIn, ZoomOut, RefreshCcw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { api } from '../../services/api';
import { premiumLocales } from '../../locales/uk/premium';

interface Node {
    id: string;
    name: string;
    label: string;
    x: number;
    y: number;
    size: number;
    color: string;
    properties?: Record<string, any>;
}

interface Edge {
    id: string;
    source: string;
    target: string;
    relation: string;
}

export const SemanticRadar: React.FC<{ className?: string }> = ({ className }) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchGraph = async (query: string = "ТОВ") => {
        setLoading(true);
        try {
            const data = await api.graph.search(query);
            // Transform data for SVG positions (simulated force-layout)
            const safeNodes = data?.nodes || [];
            const safeEdges = data?.edges || [];
            const transformedNodes = safeNodes.map((n: any, i: number) => ({
                ...n,
                x: 200 + Math.cos(i * 1.5) * 150,
                y: 200 + Math.sin(i * 1.5) * 150,
                size: n.label === 'ORGANIZATION' ? 40 : 30,
                color: n.label === 'ORGANIZATION' ? '#8b5cf6' : n.label === 'PERSON' ? '#ec4899' : '#0ea5e9'
            }));
            setNodes(transformedNodes);
            setEdges(safeEdges);
        } catch (e) {
            console.error("Failed to fetch graph", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGraph();
    }, []);

    return (
        <div className={cn("relative bg-slate-950/60 border border-white/5 rounded-3xl overflow-hidden flex flex-col backdrop-blur-xl", className)}>
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
                <div className="pointer-events-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                            <Binary className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-widest leading-none">Semantic Radar</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        ACTIVE GRAPH SESSION: 142k NODES
                    </p>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                        <button
                            onClick={() => fetchGraph()}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Refresh Knowledge Graph"
                        >
                            <RefreshCcw size={16} />
                        </button>
                        <div className="w-px h-4 bg-white/10 my-auto mx-1" />
                        <button
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Maximize Vision"
                        >
                            <Maximize2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Graph Canvas (Simulated with SVG) */}
            <div className="flex-1 min-h-[400px] relative overflow-hidden" ref={containerRef}>
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full"
                        />
                    </div>
                )}

                <svg viewBox="0 0 400 400" className="w-full h-full">
                    {/* Perspective Rings */}
                    <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Laser Scan Line */}
                    <motion.line
                        x1="200" y1="200"
                        x2="400" y2="200"
                        stroke="rgba(99, 102, 241, 0.2)"
                        strokeWidth="2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        initial={{ originX: '200px', originY: '200px' }}
                    />

                    {/* Edges */}
                    {edges.map((edge) => {
                        const source = nodes.find(n => n.id === edge.source);
                        const target = nodes.find(n => n.id === edge.target);
                        if (!source || !target) return null;
                        return (
                            <motion.line
                                key={edge.id}
                                x1={source.x} y1={source.y}
                                x2={target.x} y2={target.y}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node) => (
                        <motion.g
                            key={node.id}
                            onClick={() => setSelectedNode(node)}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.2, cursor: 'pointer' }}
                        >
                            {/* Outer Glow */}
                            <circle cx={node.x} cy={node.y} r={node.size / 2 + 5} fill={node.color} fillOpacity="0.05" />
                            {/* Main Circle */}
                            <circle
                                cx={node.x} cy={node.y}
                                r={node.size / 2}
                                fill={node.color}
                                fillOpacity="0.15"
                                stroke={node.color}
                                strokeWidth="2"
                            />
                            {/* Inner Dot */}
                            <circle cx={node.x} cy={node.y} r="3" fill={node.color} />

                            {/* Label */}
                            <text
                                x={node.x} y={node.y + node.size / 2 + 15}
                                textAnchor="middle"
                                className="text-[8px] fill-slate-400 font-bold uppercase tracking-tighter"
                            >
                                {node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name}
                            </text>
                        </motion.g>
                    ))}
                </svg>
            </div>

            {/* Bottom Controls Overlay */}
            <div className="p-6 pt-0 mt-auto flex gap-4 items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search entities (Companies, Persons, Vessles)..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:border-indigo-500/50 transition-all outline-none"
                    />
                </div>

                <div className="flex gap-2">
                    <button className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                        <Zap size={14} /> EXTRACT
                    </button>
                </div>
            </div>

            {/* Node Quick Info Side-Panel overlay */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900/90 border-l border-white/10 backdrop-blur-2xl z-30 p-6 flex flex-col shadow-2xl"
                    >
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                            title="Close intelligence details"
                        >
                            <RefreshCcw size={16} className="rotate-45" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <motion.div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                                animate={{
                                    backgroundColor: `${selectedNode.color}20`,
                                    borderColor: `${selectedNode.color}40`
                                }}
                            >
                                {selectedNode.label === 'ORGANIZATION' ? <Database className="text-white" /> : <Crosshair className="text-white" />}
                            </motion.div>
                            <div>
                                <h4 className="font-black text-white tracking-widest uppercase text-sm leading-tight">{selectedNode.name}</h4>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded-md text-slate-400 border border-white/5 mt-1 inline-block">
                                    {selectedNode.label}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                <span className="text-[10px] text-slate-500 block mb-1">RELIABILITY INDEX</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[94%]" />
                                    </div>
                                    <span className="text-xs font-mono text-emerald-400">94%</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Properties</span>
                                {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-[10px] text-slate-400 uppercase">{k}</span>
                                        <span className="text-xs text-white font-mono">{String(v)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="w-full py-4 mt-6 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-2xl transition-all border border-white/10">
                            View Full Dossier
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
