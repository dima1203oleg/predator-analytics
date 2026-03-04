
import React from 'react';
import { motion } from 'framer-motion';
import { Play, Share2, Activity, Database, Zap, Cpu, Terminal, ShieldAlert, Network, Box } from 'lucide-react';
import { TacticalCard } from '../TacticalCard';
import { cn } from '../../utils/cn';

interface GraphDBViewProps {
    cypherQuery: string;
    onCypherQueryChange: (query: string) => void;
    onExecuteCypher: () => void;
}

export const GraphDBView: React.FC<GraphDBViewProps> = ({ cypherQuery, onCypherQueryChange, onExecuteCypher }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
            {/* Graph Visualizer Section */}
            <div className="lg:col-span-2">
                <TacticalCard
                    variant="holographic"
                    title="NEO4J KNOWLEDGE TOPOLOGY v55"
                    className="h-[600px] panel-3d overflow-hidden group"
                    action={
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" />
                                <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">GDBMS ACTIVE</span>
                            </div>
                        </div>
                    }
                >
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />

                    <div className="relative h-full w-full flex items-center justify-center p-10 overflow-hidden">
                        {/* Complex SVG Graph Visualization */}
                        <svg width="100%" height="100%" viewBox="0 0 800 500" className="relative z-10 filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                                </linearGradient>
                            </defs>

                            {/* Connecting Lines with Pulsing Effect */}
                            {[
                                { x1: 400, y1: 250, x2: 200, y2: 150, color: "#4f46e5" },
                                { x1: 400, y1: 250, x2: 600, y2: 150, color: "#a855f7" },
                                { x1: 400, y1: 250, x2: 400, y2: 420, color: "#ec4899" },
                                { x1: 200, y1: 150, x2: 100, y2: 250, color: "#3b82f6" },
                                { x1: 600, y1: 150, x2: 700, y2: 250, color: "#eab308" },
                            ].map((link, i) => (
                                <g key={i}>
                                    <line
                                        x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2}
                                        stroke={link.color} strokeWidth="1" strokeOpacity="0.3"
                                    />
                                    <motion.circle
                                        r="2" fill={link.color}
                                        animate={{
                                            cx: [link.x1, link.x2],
                                            cy: [link.y1, link.y2],
                                            opacity: [0, 1, 0]
                                        }}
                                        transition={{
                                            duration: 2 + Math.random(),
                                            repeat: Infinity,
                                            ease: "linear",
                                            delay: i * 0.5
                                        }}
                                    />
                                </g>
                            ))}

                            {/* Nodes */}
                            <g className="nodes">
                                {/* Central Hub */}
                                <g className="cursor-pointer group/node" transform="translate(400, 250)">
                                    <circle r="45" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="2" strokeDasharray="5 5" className="animate-[spin_10s_linear_infinite]" />
                                    <circle r="35" fill="url(#linkGrad)" fillOpacity="0.1" stroke="#a855f7" strokeWidth="2" filter="url(#glow)" />
                                    <motion.text
                                        animate={{ opacity: [0.6, 1, 0.6] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        textAnchor="middle" y="5" className="text-[10px] font-black fill-white uppercase tracking-widest"
                                    >CORE_ENTITY</motion.text>
                                    <text textAnchor="middle" y="20" className="text-[7px] fill-purple-400 font-mono tracking-widest uppercase">ТОВ "МегаБуд"</text>
                                </g>

                                {/* Satellite Nodes */}
                                {[
                                    { x: 200, y: 150, color: "#3b82f6", label: "DIRECTOR", sub: "Олегченко П.В.", icon: ShieldAlert },
                                    { x: 600, y: 150, color: "#eab308", label: "TENDER_WON", sub: "#44021-X", icon: Zap },
                                    { x: 400, y: 420, color: "#ec4899", label: "LOCATION", sub: "м. Київ", icon: Database },
                                    { x: 100, y: 250, color: "#3b82f6", label: "PARTNER", sub: "ТОВ Крос", icon: Network },
                                    { x: 700, y: 250, color: "#eab308", label: "FINANCE", sub: "Банк А", icon: Box },
                                ].map((node, i) => (
                                    <motion.g
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
                                        className="cursor-pointer"
                                        transform={`translate(${node.x}, ${node.y})`}
                                    >
                                        <circle r="25" fill="#0f172a" stroke={node.color} strokeWidth="2" className="hover:r-30 transition-all duration-300" />
                                        <text textAnchor="middle" y="4" className="text-[8px] font-black fill-white uppercase tracking-tighter">{node.label}</text>
                                        <text textAnchor="middle" y="15" className="text-[6px] fill-slate-500 font-mono italic">{node.sub}</text>
                                    </motion.g>
                                ))}
                            </g>
                        </svg>

                        {/* Topology Overlay Metrics */}
                        <div className="absolute top-10 left-10 p-6 bg-slate-900/40 rounded-[24px] border border-white/5 backdrop-blur-xl">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Graph Density</div>
                                    <div className="text-xl font-black text-white font-mono">0.824 <span className="text-[8px] text-purple-400">INDEXED</span></div>
                                </div>
                                <div className="h-[1px] w-full bg-white/5" />
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-[8px] text-slate-600 font-black uppercase mb-1">Nodes</div>
                                        <div className="text-sm font-black text-slate-300 font-mono">1.42M</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] text-slate-600 font-black uppercase mb-1">Edges</div>
                                        <div className="text-sm font-black text-slate-300 font-mono">5.20M</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive UI Tools Overlay */}
                        <div className="absolute bottom-10 inset-x-10 flex justify-between items-end pointer-events-none">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 pointer-events-auto">
                                <div className="flex gap-4">
                                    <button className="text-slate-500 hover:text-purple-400 transition-colors"><Cpu size={16} /></button>
                                    <button className="text-slate-500 hover:text-purple-400 transition-colors"><Share2 size={16} /></button>
                                    <button className="text-slate-500 hover:text-purple-400 transition-colors"><Activity size={16} /></button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-mono uppercase">Render Engine: Canvas_v5.2</p>
                                <p className="text-[8px] text-purple-500 font-black uppercase tracking-[0.3em]">Holographic Overlay v1.4</p>
                            </div>
                        </div>
                    </div>
                </TacticalCard>
            </div>

            {/* Cypher Console Section */}
            <div className="space-y-6">
                <TacticalCard
                    variant="holographic"
                    title="CYPHER GRAPH CONSOLE"
                    className="h-[600px] flex flex-col group"
                >
                    <div className="flex-1 flex flex-col pt-6">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <Terminal size={14} className="text-purple-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Query Buffer // ROM_0X44</span>
                        </div>

                        <div className="relative group/editor flex-1 mb-8">
                            <div className="absolute inset-0 bg-purple-500/5 blur-[40px] rounded-full opacity-0 group-hover/editor:opacity-100 transition-opacity" />
                            <textarea
                                value={cypherQuery}
                                onChange={(e) => onCypherQueryChange(e.target.value)}
                                className="w-full h-full bg-slate-950/80 border border-white/10 rounded-[32px] p-8 text-sm font-mono text-purple-300 focus:border-purple-500/50 outline-none resize-none shadow-inner custom-scrollbar relative z-10"
                                placeholder="MATCH (n) RETURN n..."
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-start gap-4">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Optimizer v4</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Automatic index recommendation active. Cost: 0.24ms / retrieval.</p>
                                </div>
                            </div>

                            <button
                                onClick={onExecuteCypher}
                                className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-purple-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 group/btn"
                            >
                                <Play size={16} className="fill-current group-hover/btn:scale-125 transition-transform" />
                                Run Graph Discovery
                            </button>
                        </div>
                    </div>
                </TacticalCard>
            </div>
        </motion.div>
    );
};
