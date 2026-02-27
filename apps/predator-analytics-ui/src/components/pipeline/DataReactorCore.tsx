import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database,
    Share2,
    Search,
    Target, // As Qdrant
    Server, // As Minio/Redis
    Cpu,
    Activity,
    AlertTriangle,
    Radio, // For vectors
    Box
} from 'lucide-react';

interface ComponentStatus {
    state: 'idle' | 'active' | 'error';
    count: number;
}

interface ReactorProps {
    isActive: boolean;
    hasError?: boolean;
    stats?: {
        postgres: ComponentStatus;
        graph: ComponentStatus;
        opensearch: ComponentStatus;
        qdrant: ComponentStatus;
        redis: ComponentStatus;
    };
}

export const DataReactorCore: React.FC<ReactorProps> = ({
    isActive,
    hasError = false,
    stats = {
        postgres: { state: 'idle', count: 0 },
        graph: { state: 'idle', count: 0 },
        opensearch: { state: 'idle', count: 0 },
        qdrant: { state: 'idle', count: 0 },
        redis: { state: 'idle', count: 0 }
    }
}) => {
    // Particles for animation
    const [particles, setParticles] = useState<{ id: number; target: string }[]>([]);

    useEffect(() => {
        if (!isActive || hasError) return;

        // Target DBs to shoot particles towards
        const targets = ['postgres', 'graph', 'opensearch', 'qdrant'];

        // Spawn particles when active
        const interval = setInterval(() => {
            const target = targets[Math.floor(Math.random() * targets.length)];
            setParticles(prev => [
                ...prev.slice(-30), // keep max 30 particles
                { id: Date.now() + Math.random(), target }
            ]);
        }, 150); // fast fire rate

        return () => clearInterval(interval);
    }, [isActive, hasError]);

    // Database Nodes Mapping
    const nodes = [
        { id: 'postgres', title: 'PostgreSQL', subtitle: 'Facts', icon: Database, color: 'text-yellow-400', glow: 'shadow-yellow-500/50', border: 'border-yellow-500/30', bg: 'bg-yellow-900/20', position: 'top-0 right-0 translate-x-[120%] -translate-y-[40%]', stat: stats.postgres },
        { id: 'graph', title: 'Graph DB', subtitle: 'Relations', icon: Share2, color: 'text-purple-400', glow: 'shadow-purple-500/50', border: 'border-purple-500/30', bg: 'bg-purple-900/20', position: 'bottom-0 right-0 translate-x-[120%] translate-y-[40%]', stat: stats.graph },
        { id: 'opensearch', title: 'OpenSearch', subtitle: 'Search Index', icon: Search, color: 'text-cyan-400', glow: 'shadow-cyan-500/50', border: 'border-cyan-500/30', bg: 'bg-cyan-900/20', position: 'top-0 left-0 -translate-x-[120%] -translate-y-[40%]', stat: stats.opensearch },
        { id: 'qdrant', title: 'Qdrant', subtitle: 'Vector Space', icon: Radio, color: 'text-emerald-400', glow: 'shadow-emerald-500/50', border: 'border-emerald-500/30', bg: 'bg-emerald-900/20', position: 'bottom-0 left-0 -translate-x-[120%] translate-y-[40%]', stat: stats.qdrant },
    ];

    const reactorColor = hasError ? 'text-red-500' : isActive ? 'text-blue-500' : 'text-slate-500';
    const reactorGlow = hasError ? 'shadow-[0_0_50px_rgba(239,68,68,0.5)]' : isActive ? 'shadow-[0_0_50px_rgba(59,130,246,0.6)]' : 'shadow-none';

    return (
        <div className="relative w-full py-20 flex justify-center items-center overflow-hidden bg-[#0A0E17] rounded-xl border border-white/5">

            {/* Background Pulse indicating activity */}
            {isActive && !hasError && (
                <motion.div
                    animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)] pointer-events-none"
                />
            )}

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />

            {/* Main Assembly */}
            <div className="relative z-10">

                {/* Connection Lines (SVGs behind) */}
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0" style={{ transform: 'scale(1.5)' }}>
                    <defs>
                        <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                        {/* Simple styling for SVG lines can be done by mapping through paths */}
                    </defs>

                    {nodes.map(node => {
                        // Very simplified static path logic for visual connections
                        const isLeft = node.position.includes('left-0');
                        const isTop = node.position.includes('top-0');

                        // X and Y coords radiating from center (50%, 50%)
                        const x2 = isLeft ? -100 : 200;
                        const y2 = isTop ? -50 : 150;

                        const isAnimating = isActive && !hasError;

                        return (
                            <g key={`line - to - ${node.id} `}>
                                <motion.path
                                    d={`M 50 50 C ${isLeft ? 0 : 100} 50, ${x2} ${y2}, ${x2} ${y2} `}
                                    fill="none"
                                    stroke={isAnimating ? "#3b82f6" : "#334155"}
                                    strokeWidth="2"
                                    strokeDasharray={isAnimating ? "6 6" : "none"}
                                    animate={isAnimating ? { strokeDashoffset: [24, 0] } : {}}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    strokeOpacity={isAnimating ? 0.4 : 0.2}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Central Router Engine */}
                <div className="relative z-20 mx-auto">
                    <motion.div
                        className={`w - 32 h - 32 rounded - full border - 2 bg - [#0F172A] flex items - center justify - center relative ${hasError ? 'border-red-500' : isActive ? 'border-blue-500' : 'border-slate-600'
                            } `}
                        animate={{
                            boxShadow: hasError
                                ? ['0 0 20px rgba(239,68,68,0.2)', '0 0 40px rgba(239,68,68,0.4)', '0 0 20px rgba(239,68,68,0.2)']
                                : isActive
                                    ? ['0 0 20px rgba(59,130,246,0.3)', '0 0 50px rgba(59,130,246,0.6)', '0 0 20px rgba(59,130,246,0.3)']
                                    : '0 0 0px rgba(0,0,0,0)'
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        {/* Inner Ring */}
                        <motion.div
                            animate={isActive ? { rotate: 360 } : { rotate: 0 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className={`absolute inset - 2 rounded - full border border - dashed opacity - 50 ${hasError ? 'border-red-400' : isActive ? 'border-blue-400' : 'border-slate-500'} `}
                        />

                        {/* Core Icon */}
                        <div className={`relative z - 10 ${reactorColor} `}>
                            {hasError ? <AlertTriangle size={48} /> : isActive ? <Activity size={48} /> : <Cpu size={48} />}
                        </div>

                        {/* Title */}
                        <div className="absolute -bottom-8 whitespace-nowrap text-center left-1/2 -translate-x-1/2">
                            <span className={`text - sm font - bold tracking - widest ${hasError ? 'text-red-400' : isActive ? 'text-blue-400' : 'text-slate-400'} `}>
                                ROUTER ENGINE
                            </span>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Canonical Event Splitter</div>
                        </div>
                    </motion.div>

                    {/* Incoming Data Stream */}
                    {isActive && (
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-1 h-24 overflow-hidden mt-6">
                            <motion.div
                                className="w-full h-full bg-gradient-to-b from-transparent via-blue-400 to-blue-500"
                                animate={{ y: ['-100%', '100%'] }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    )}

                    <div className="absolute -top-36 left-1/2 -translate-x-1/2 text-center">
                        {isActive && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs font-mono text-slate-300 bg-slate-800/80 px-2 py-1 flex items-center gap-2 rounded border border-slate-700 backdrop-blur-sm"
                            >
                                <Box size={12} className="text-blue-400" /> RAW_PAYLOAD
                            </motion.div>
                        )}
                    </div>

                </div>

                {/* Database Nodes */}
                {nodes.map((node) => {
                    const isNodeActive = isActive && node.stat.state === 'active';

                    return (
                        <div key={node.id} className={`absolute w - 44 ${node.position} z - 10 transition - all duration - 300`}>
                            <motion.div
                                className={`flex items - start gap - 4 p - 3 rounded - lg border backdrop - blur - xl ${node.bg} ${node.border} ${isNodeActive ? `shadow-[0_0_20px_var(--glow)]` : ''} `}
                                style={{ '--glow': node.color.replace('text-', '').replace('-400', '') } as any}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className={`p - 2 rounded - full bg - [#0A0E17] border ${node.border} ${node.color} relative`}>
                                    <node.icon size={20} />
                                    {isNodeActive && (
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-current opacity-20"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className={`text - sm font - bold truncate ${node.color} `}>{node.title}</h4>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{node.subtitle}</p>

                                    {/* Metric Counter */}
                                    <div className="mt-1 flex items-center justify-between border-t border-white/5 pt-1">
                                        <span className="text-[10px] text-slate-500">Events</span>
                                        <span className="text-xs font-mono font-bold text-white">
                                            {node.stat.count.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}

                {/* Floating Particles mimicking payload split */}
                <AnimatePresence>
                    {particles.map(p => {
                        // Simple mapping to target nodes for particle end positions
                        const targetNode = nodes.find(n => n.id === p.target);
                        if (!targetNode) return null;

                        const isLeft = targetNode.position.includes('left-0');
                        const isTop = targetNode.position.includes('top-0');

                        const x = isLeft ? -180 : 180;
                        const y = isTop ? -80 : 80;

                        // Color logic
                        const colorClass = targetNode.color.replace('text-', 'bg-');

                        return (
                            <motion.div
                                key={p.id}
                                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                                animate={{ x, y, scale: 1, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`absolute left - 1 / 2 top - 1 / 2 w - 2 h - 2 rounded - full - ml - 1 - mt - 1 ${colorClass} shadow - [0_0_10px_currentColor] z - 30 pointer - events - none`}
                            />
                        );
                    })}
                </AnimatePresence>

            </div>

            {/* Footer Info / Redis State */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0A0E17]/80 border border-green-500/20 text-green-400 backdrop-blur-md">
                    <Server size={14} />
                    <span className="text-xs font-mono">Redis System State:
                        <span className="ml-2 font-bold text-white">
                            {isActive ? 'SYNCHRONIZING' : 'IDLE'}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DataReactorCore;
