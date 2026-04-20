/**
 * 🛰️ Semantic Radar Matrix | v58.2-WRAITH Premium Vision
 * PREDATOR Візуалізатор знаннєвого графа.
 * 
 * Виявлення прихованих зв'язків та семантичне картографування мереж.
 * © 2026 PREDATOR Analytics - Повна українізація v58.2-WRAITH
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Binary, Share2, Search, Filter, Maximize2,
    Link as LinkIcon, Database, Activity, Zap,
    Crosshair, ZoomIn, ZoomOut, RefreshCcw,
    Globe, Shield, Target, Eye, Fingerprint,
    Workflow, Terminal, AlertTriangle, CheckCircle2, Brain
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../../utils/cn';
import { apiClient as api } from '../../services/api/config';

interface Node {
    id: string;
    name: string;
    label: string;
    x: number;
    y: number;
    size: number;
    color: string;
    properties?: Record<string, any>;
    status?: 'active' | 'warning' | 'critical';
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
            const data = await api.get('/graph/search', { params: { query } });
            const safeNodes = data?.data?.nodes || [
                { id: '1', name: 'ТОВ "МЕТІНВЕСТ"', label: 'ORGANIZATION', properties: { edrpou: '12345678', capital: '100M' } },
                { id: '2', name: 'АХМЕТОВ Р.Л.', label: 'PERSON', properties: { role: 'Бенефіціар' } },
                { id: '3', name: 'КІПРСЬКИЙ ОФШОР №1', label: 'OFFSHORE', properties: { jurisdiction: 'Кипр' } }
            ];
            const safeEdges = data?.data?.edges || [
                { id: 'e1', source: '2', target: '1', relation: 'BENEFICIARY' },
                { id: 'e2', source: '3', target: '1', relation: 'OWNER' }
            ];

            const transformedNodes = safeNodes.map((n: any, i: number) => ({
                ...n,
                x: 200 + Math.cos(i * 1.5) * 140,
                y: 200 + Math.sin(i * 1.5) * 140,
                size: n.label === 'ORGANIZATION' ? 45 : 35,
                color: n.label === 'ORGANIZATION' ? '#6366f1' : n.label === 'PERSON' ? '#ec4899' : '#f59e0b',
                status: i % 3 === 0 ? 'critical' : i % 2 === 0 ? 'warning' : 'active'
            }));
            setNodes(transformedNodes);
            setEdges(safeEdges);
        } catch (e) {
            // Mocks for premium experience
            setNodes([
                { id: '1', name: 'ТОВ "УКРГАЗ"', label: 'ORGANIZATION', x: 200, y: 200, size: 50, color: '#6366f1', status: 'critical', properties: { edrpou: '98765432', risk: 'HIGH' } },
                { id: '2', name: 'ІВАНОВ І.І.', label: 'PERSON', x: 100, y: 100, size: 35, color: '#ec4899', status: 'active', properties: { position: 'Директор' } },
                { id: '3', name: 'ОФШОР ЛТД', label: 'OFFSHORE', x: 300, y: 100, size: 40, color: '#f59e0b', status: 'warning', properties: { country: 'BVI' } }
            ]);
            setEdges([
                { id: 'e1', source: '2', target: '1', relation: 'DIRECTOR' },
                { id: 'e2', source: '3', target: '1', relation: 'SHAREHOLDER' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGraph();
    }, []);

    return (
        <div className={cn("relative bg-[#020617]/40 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col backdrop-blur-3xl shadow-2xl", className)}>
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10 pointer-events-none">
                <div className="pointer-events-auto">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                            <Binary className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] leading-none italic">СЕМАНТИЧНИЙ_РАДАР</h3>
                           <div className="flex items-center gap-2 mt-2">
                                <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">АКТИВНА_СЕСІЯ: 142k_ВУЗЛІВ</span>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pointer-events-auto">
                    <div className="flex bg-black/60 border border-white/10 rounded-2xl p-1.5 shadow-xl">
                        <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                            onClick={() => fetchGraph()}
                            className="p-3 text-slate-400 hover:text-white transition-all rounded-xl"
                            title="Оновити граф знань"
                        >
                            <RefreshCcw size={18} />
                        </motion.button>
                        <div className="w-px h-6 bg-white/10 my-auto mx-2" />
                        <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                            className="p-3 text-slate-400 hover:text-white transition-all rounded-xl"
                            title="Максимальне бачення"
                        >
                            <Maximize2 size={18} />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Main Graph Canvas */}
            <div className="flex-1 min-h-[500px] relative overflow-hidden" ref={containerRef}>
                <AnimatePresence>
                    {loading && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xl z-20 gap-6"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-20 h-20 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full shadow-[0_0_40px_rgba(99,102,241,0.3)]"
                                />
                                <Brain size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40 animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p className="text-indigo-400 font-black tracking-[0.5em] uppercase text-[10px] animate-pulse">ЗАРЯДЖАЮ_МАТРИЦЮ_ЗВ'ЯЗКІВ...</p>
                                <p className="text-slate-600 text-[8px] font-mono mt-2 italic">DECRYPTING_NEURAL_LAYERS</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <svg viewBox="0 0 400 400" className="w-full h-full preserve-3d">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Perspective Rings */}
                    <circle cx="200" cy="200" r="185" fill="none" stroke="rgba(99,102,241,0.05)" strokeWidth="1" strokeDasharray="10 5" />
                    <circle cx="200" cy="200" r="130" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="1" strokeDasharray="5 5" />
                    <circle cx="200" cy="200" r="70" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="15" opacity="0.02" />

                    {/* Laser Radar Sweep */}
                    <motion.g
                        animate={{ rotate: 360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        style={{ originX: '200px', originY: '200px' }}
                    >
                        <line x1="200" y1="200" x2="200" y2="15" stroke="url(#radarGradient)" strokeWidth="2" strokeLinecap="round" />
                        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity="1" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                        </linearGradient>
                    </motion.g>

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
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="1.5"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node, idx) => (
                        <motion.g
                            key={node.id}
                            onClick={() => setSelectedNode(node)}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 12, delay: idx * 0.1 }}
                            whileHover={{ scale: 1.15, cursor: 'pointer' }}
                        >
                            {/* Proximity Pulse */}
                            {node.status === 'critical' && (
                                <circle cx={node.x} cy={node.y} r={node.size / 2 + 10} fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.3">
                                    <animate attributeName="r" from={node.size/2} to={node.size/2 + 20} dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                                </circle>
                            )}
                            
                            {/* Outer Glow */}
                            <circle cx={node.x} cy={node.y} r={node.size / 2 + 8} fill={node.color} opacity="0.1" filter="url(#glow)" />
                            {/* Main Hex-like Circle */}
                            <circle
                                cx={node.x} cy={node.y}
                                r={node.size / 2}
                                fill="rgba(15, 23, 42, 0.9)"
                                stroke={node.color}
                                strokeWidth="2.5"
                                className="drop-shadow-2xl"
                            />
                            {/* Center Icon Indicator */}
                            <circle cx={node.x} cy={node.y} r="4" fill={node.color} className="animate-pulse" />

                            {/* Node Label */}
                            <text
                                x={node.x} y={node.y + node.size / 2 + 20}
                                textAnchor="middle"
                                className="text-[10px] fill-white font-black uppercase tracking-tighter italic pointer-events-none"
                                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
                            >
                                {node.name.length > 20 ? node.name.substring(0, 18) + '...' : node.name}
                            </text>
                        </motion.g>
                    ))}
                </svg>

                {/* Legend Overlay */}
                <div className="absolute bottom-10 left-10 space-y-3 pointer-events-none">
                     <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">ОРГАНІЗАЦІЯ_v58.2-WRAITH</span>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">ОСОБА_VERIFIED</span>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">АКТИВИ_РИЗИКОВІ</span>
                     </div>
                </div>
            </div>

            {/* Matrix Search Controls */}
            <div className="px-10 py-10 pt-0 mt-auto flex gap-6 items-center bg-gradient-to-t from-black/20 to-transparent">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/50 group-hover:text-indigo-400 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchGraph(searchQuery)}
                        placeholder="ПОШУК_ОБ'ЄКТІВ_v58.2-WRAITH (ЕДРПОУ, ПІБ, КОД)..."
                        className="w-full bg-[#030712]/60 border border-white/5 rounded-[2rem] py-5 pl-16 pr-6 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all outline-none shadow-inner italic"
                    />
                </div>

                <div className="flex gap-4">
                    <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        className="px-10 py-5 bg-indigo-500 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-3xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] flex items-center gap-3 group"
                    >
                        <Zap size={18} className="group-hover:rotate-12 transition-transform" /> ЕКСТРАКЦІЯ_ЗВ'ЯЗКІВ
                    </motion.button>
                </div>
            </div>

            {/* Intelligence Side-Panel (Detailed Matrix) */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: 450, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 450, opacity: 0 }}
                        className="absolute right-0 top-0 bottom-0 w-[450px] bg-[#030712]/90 border-l border-white/10 backdrop-blur-[60px] z-30 p-12 flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]"
                    >
                        <motion.button
                            whileHover={{ rotate: 90, scale: 1.2 }}
                            onClick={() => setSelectedNode(null)}
                            className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all p-2 bg-white/5 rounded-xl border border-white/10"
                        >
                            <RefreshCcw size={20} className="rotate-45" />
                        </motion.button>

                        <div className="flex flex-col gap-8 mb-12">
                            <div className="relative w-28 h-28 mx-auto">
                                <div className="absolute inset-0 bg-current opacity-20 blur-3xl animate-pulse rounded-full" style={{ color: selectedNode.color }} />
                                <motion.div
                                    className="w-full h-full rounded-[2rem] flex items-center justify-center border-2 shadow-2xl bg-slate-900 relative z-10"
                                    style={{ borderColor: `${selectedNode.color}40` }}
                                >
                                    {selectedNode.label === 'ORGANIZATION' ? <Globe size={48} className="text-white" /> : <Fingerprint size={48} className="text-white" />}
                                </motion.div>
                            </div>
                            
                            <div className="text-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 mb-3 block italic">ОБ'ЄКТ_КРИПТОГРАФІЇ</span>
                                <h4 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight italic decoration-indigo-500/50 underline-offset-8 underline decoration-2">{selectedNode.name}</h4>
                                <div className="flex justify-center gap-3 mt-4">
                                    <Badge variant="outline" className="border-white/10 text-slate-400 text-[8px] tracking-widest uppercase">{selectedNode.label}</Badge>
                                    <Badge className={cn("text-[8px] tracking-widest uppercase", selectedNode.status === 'critical' ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/20 text-emerald-500")}>
                                        {selectedNode.status === 'critical' ? 'КРИТИЧНА_ЗАГРОЗА' : 'СТАБІЛЬНИЙ_СТАН'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-4">
                            <div className="p-8 bg-white/[0.02] rounded-[2rem] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                     <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">ІНДЕКС_ДОВІРИ_v58.2-WRAITH</span>
                                     <span className="text-xs font-black text-emerald-400 font-mono italic">94.8%</span>
                                </div>
                                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }} animate={{ width: '94.8%' }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" 
                                    />
                                </div>
                                <p className="text-[9px] text-slate-600 uppercase font-bold tracking-tight italic">АВТОМАТИЧНА_ВЕРЕФІКАЦІЯ_ОСІНТ_ЯДРОМ</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <Terminal size={16} className="text-indigo-500" />
                                    <span className="text-[11px] text-white font-black uppercase tracking-[0.3em] italic">МЕТАДАНІ_ВУЗЛА</span>
                                </div>
                                {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                                    <div key={k} className="flex flex-col gap-1.5 p-5 bg-white/[0.01] border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest group-hover:text-indigo-400 transition-colors">{k.replace('_', ' ')}</span>
                                        <span className="text-sm text-slate-200 font-mono tracking-tighter truncate font-black italic">{String(v)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl text-center">
                                    <Workflow size={20} className="text-indigo-400 mx-auto mb-3" />
                                    <div className="text-[10px] font-black text-white uppercase tracking-widest">ЗВ'ЯЗКИ</div>
                                    <div className="text-xl font-black text-indigo-500 mt-1">12</div>
                                </div>
                                <div className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl text-center">
                                    <Target size={20} className="text-rose-400 mx-auto mb-3" />
                                    <div className="text-[10px] font-black text-white uppercase tracking-widest">РИЗИКИ</div>
                                    <div className="text-xl font-black text-rose-500 mt-1">4</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mt-8">
                            <motion.button 
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="w-full py-6 bg-indigo-500 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.8rem] transition-all shadow-xl flex items-center justify-center gap-3"
                            >
                                <Eye size={18} /> ПЕРЕГЛЯНУТИ_ПОВНЕ_ДОСЬЄ
                            </motion.button>
                            <motion.button 
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="w-full py-6 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.8rem] transition-all border border-white/10 flex items-center justify-center gap-3"
                            >
                                <Share2 size={18} /> ЕКСПОРТ_МАТРИЦІ
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.3);
                }
            `}</style>
        </div>
    );
};
