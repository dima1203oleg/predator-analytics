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
    Box,
    Glasses,
    TerminalSquare,
    Network,
    Archive
} from 'lucide-react';

interface ComponentStatus {
    state: 'idle' | 'active' | 'error';
    count: number;
    details?: {
        throughput: string;
        latency: string;
    };
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
        postgres: { state: 'idle', count: 0, details: { throughput: '0.0 MB/s', latency: '0ms' } },
        graph: { state: 'idle', count: 0, details: { throughput: '0 ed/s', latency: '0ms' } },
        opensearch: { state: 'idle', count: 0, details: { throughput: '0 docs/s', latency: '0ms' } },
        qdrant: { state: 'idle', count: 0, details: { throughput: '0 vec/s', latency: '0ms' } },
        redis: { state: 'idle', count: 0 }
    }
}) => {
    // State for X-Ray Mode
    const [xrayMode, setXrayMode] = useState(false);
    const [particles, setParticles] = useState<{ id: number; target: string; type: string }[]>([]);

    useEffect(() => {
        if (!isActive || hasError) return;

        const targets = ['postgres', 'graph', 'opensearch', 'qdrant'];
        const types = ['fact', 'edge', 'text', 'vector'];

        const interval = setInterval(() => {
            const rIndex = Math.floor(Math.random() * targets.length);
            setParticles(prev => [
                ...prev.slice(-40), // More particles!
                { id: Date.now() + Math.random(), target: targets[rIndex], type: types[rIndex] }
            ]);
        }, 100);

        return () => clearInterval(interval);
    }, [isActive, hasError]);

    // DB Nodes Config
    const nodes = [
        {
            id: 'postgres', title: 'PostgreSQL (SQL)', subtitle: 'Структуровані Факти', icon: Database,
            color: 'text-yellow-400', glow: 'shadow-yellow-500/50', border: 'border-yellow-500/30', bg: 'bg-yellow-900/20',
            position: 'top-0 right-0 translate-x-[110%] -translate-y-[50%]', stat: stats.postgres
        },
        {
            id: 'graph', title: 'Neo4j (Графи)', subtitle: 'Нейронні Зв\'язки', icon: Share2,
            color: 'text-purple-400', glow: 'shadow-purple-500/50', border: 'border-purple-500/30', bg: 'bg-purple-900/20',
            position: 'bottom-0 right-0 translate-x-[110%] translate-y-[50%]', stat: stats.graph
        },
        {
            id: 'opensearch', title: 'Пошуковий Індекс', subtitle: 'Повнотекстовий Пошук', icon: Search,
            color: 'text-cyan-400', glow: 'shadow-cyan-500/50', border: 'border-cyan-500/30', bg: 'bg-cyan-900/20',
            position: 'top-0 left-0 -translate-x-[110%] -translate-y-[50%]', stat: stats.opensearch
        },
        {
            id: 'qdrant', title: 'Векторна БД', subtitle: 'Векторний Простір', icon: Target,
            color: 'text-emerald-400', glow: 'shadow-emerald-500/50', border: 'border-emerald-500/30', bg: 'bg-emerald-900/20',
            position: 'bottom-0 left-0 -translate-x-[110%] translate-y-[50%]', stat: stats.qdrant
        },
    ];

    const reactorColor = hasError ? 'text-red-500' : isActive ? 'text-blue-500' : 'text-slate-500';

    return (
        <div className={`relative w-full h-[650px] flex justify-center items-center overflow-visible rounded-[32px] border border-white/5 transition-all duration-1000 ${xrayMode ? 'bg-[#050B14]' : 'bg-[#0A0E17]'}`}>

            {/* Header / Mode Toggle */}
            <div className="absolute top-6 right-6 z-50 flex gap-4">
                <button
                    onClick={() => setXrayMode(!xrayMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-md transition-all ${xrayMode
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                        : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                >
                    <Glasses size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">режим X-Ray</span>
                </button>
            </div>

            {/* X-Ray specific grid backgrounds */}
            <AnimatePresence>
                {xrayMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[url('/hex-grid.svg')] bg-center bg-repeat pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none" />

            {/* Main Assembly */}
            <div className="relative z-10 scale-[0.6] sm:scale-[0.7] md:scale-90 lg:scale-[0.8] xl:scale-90 2xl:scale-100">
                {/* Visual DB Connections */}
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0" style={{ transform: 'scale(1.5)' }}>
                    {nodes.map(node => {
                        const isLeft = node.position.includes('left-0');
                        const isTop = node.position.includes('top-0');
                        const x2 = isLeft ? -100 : 200;
                        const y2 = isTop ? -70 : 170;
                        const isAnimating = isActive && !hasError;
                        const strokeColor = xrayMode ? node.color.replace('text-', '').replace('-400', '') : "#3b82f6";

                        return (
                            <g key={`connection-${node.id}`}>
                                <motion.path
                                    d={`M 50 50 C ${isLeft ? 0 : 100} 50, ${x2} ${y2}, ${x2} ${y2}`}
                                    fill="none"
                                    stroke={isAnimating ? strokeColor : "#334155"}
                                    strokeWidth={xrayMode ? "3" : "2"}
                                    strokeDasharray={isAnimating ? "8 8" : "none"}
                                    animate={isAnimating ? { strokeDashoffset: [32, 0] } : {}}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    strokeOpacity={isAnimating ? (xrayMode ? 0.6 : 0.4) : 0.2}
                                />
                                {xrayMode && isAnimating && (
                                    <motion.circle r="2" fill={strokeColor}
                                        animate={{ offsetDistance: ["0%", "100%"] }}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Engine Core */}
                <div className="relative z-20 mx-auto">
                    <motion.div
                        className={`w-36 h-36 rounded-full border-4 bg-[#0F172A] flex items-center justify-center relative ${hasError ? 'border-red-500' : isActive ? 'border-blue-500' : 'border-slate-600'
                            }`}
                        animate={{
                            boxShadow: hasError ? ['0 0 20px rgba(239,68,68,0.2)', '0 0 50px rgba(239,68,68,0.5)', '0 0 20px rgba(239,68,68,0.2)']
                                : isActive ? [`0 0 30px rgba(59,130,246,0.3)`, `0 0 80px rgba(59,130,246,0.${xrayMode ? '8' : '5'})`]
                                    : '0 0 0px rgba(0,0,0,0)',
                            scale: isActive && xrayMode ? [1, 1.05, 1] : 1
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {/* Inner Rotating Rings */}
                        <motion.div animate={isActive ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            className={`absolute inset-2 rounded-full border-2 border-dashed opacity-50 ${hasError ? 'border-red-400' : isActive ? 'border-blue-400' : 'border-slate-500'}`} />
                        {xrayMode && (
                            <motion.div animate={isActive ? { rotate: -360 } : { rotate: 0 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className={`absolute -inset-4 rounded-full border border-dotted opacity-30 border-blue-300`} />
                        )}

                        <div className={`relative z-10 ${reactorColor}`}>
                            {hasError ? <AlertTriangle size={56} /> : xrayMode ? <Network size={56} /> : <Cpu size={56} />}
                        </div>

                        {/* Title Label */}
                        <div className="absolute -bottom-10 whitespace-nowrap text-center left-1/2 -translate-x-1/2">
                            <span className={`text-sm font-black tracking-[0.2em] ${hasError ? 'text-red-400' : isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                                ЯДРО МА Ш УТИЗАЦІЇ
                            </span>
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Багатовимірнийрозподілювач</div>
                        </div>
                    </motion.div>

                    {/* Incoming Main Payload Stream (From MinIO) */}
                    {isActive && (
                        <div className="absolute -top-[140px] left-1/2 -translate-x-1/2 w-4 h-36 overflow-hidden mt-6 bg-[#0A0E17]/80 backdrop-blur-md rounded-full border-x border-[#0A0E17] z-0">
                            <motion.div className="w-full h-full bg-gradient-to-b from-transparent via-blue-500/80 to-blue-600 shadow-[0_0_20px_#3b82f6]"
                                animate={{ y: ['-100%', '100%'] }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                        </div>
                    )}

                    {/* MinIO Raw Data Source Node */}
                    <div className="absolute -top-[160px] left-1/2 -translate-x-1/2 z-30">
                        <motion.div
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border backdrop-blur-xl transition-all w-48 ${xrayMode ? 'bg-[#0A0E17]/90 hover:bg-[#0F172A]' : 'bg-slate-900/60'
                                } ${isActive ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.3)]' : 'border-slate-800'}`}
                        >
                            <div className="flex items-center gap-2 mb-1 w-full justify-center">
                                <Archive size={16} className={isActive ? 'text-orange-400' : 'text-slate-500'} />
                                <span className="text-xs font-black uppercase tracking-wider text-orange-400">MinIO (Об'єктне Сховище)</span>
                            </div>
                            <div className="text-[9px] text-slate-400 uppercase tracking-widest text-center w-full border-t border-white/5 pt-1 mt-1">
                                {isActive ? 'СИ І ДАНІ ЗАХИЩЕНО' : 'DZ / ХОЛОДНЕ СХОВИЩЕ'}
                            </div>

                            {/* File progress indicator in X-Ray mode */}
                            <AnimatePresence>
                                {xrayMode && isActive && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full">
                                        <div className="w-full bg-slate-900 rounded-full h-1 mt-2 border border-white/10 overflow-hidden">
                                            <motion.div className="h-full bg-orange-500" animate={{ width: ['0%', '100%'] }} transition={{ duration: 2, ease: "linear" }} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>

                {/* Databases Display */}
                {nodes.map((node) => {
                    const isNodeActive = isActive && node.stat.state === 'active';

                    return (
                        <div key={node.id} className={`absolute w-56 ${node.position} z-10 transition-all duration-500`}>
                            <motion.div
                                className={`flex flex-col p-4 rounded-xl border backdrop-blur-xl transition-all ${xrayMode ? 'bg-[#0A0E17]/90 hover:bg-[#0F172A]' : node.bg
                                    } ${node.border} ${isNodeActive ? `shadow-[0_0_30px_var(--glow)]` : ''}`}
                                style={{ '--glow': node.color.replace('text-', '').replace('-400', '') } as any}
                                whileHover={{ scale: 1.05, zIndex: 50 }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2.5 rounded-xl bg-[#0A0E17] border ${node.border} ${node.color} relative`}>
                                        <node.icon size={20} />
                                        {isNodeActive && (
                                            <motion.div className="absolute inset-0 rounded-xl bg-current opacity-20"
                                                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-md font-black truncate uppercase tracking-wider ${node.color}`}>{node.title}</h4>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{node.subtitle}</p>
                                    </div>
                                </div>

                                {/* Metrics Section */}
                                <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">Всього Сутностей</span>
                                        <span className={`text-sm font-mono font-black ${isNodeActive ? 'text-white' : 'text-slate-500'}`}>
                                            {node.stat.count.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* X-Ray deep metrics */}
                                    <AnimatePresence>
                                        {xrayMode && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                                                    <span className="text-[8px] text-slate-600 uppercase flex items-center gap-1"><TerminalSquare size={8} /> Пропускна здатність</span>
                                                    <span className={`text-[9px] font-mono ${node.color}`}>{isNodeActive ? node.stat.details?.throughput || '1.1k/s' : '0.0/s'}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[8px] text-slate-600 uppercase flex items-center gap-1"><Activity size={8} /> Затримка</span>
                                                    <span className="text-[9px] font-mono text-emerald-400">{isNodeActive ? node.stat.details?.latency || '12ms' : '-'}</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}

                {/* Particle Emitters */}
                <AnimatePresence>
                    {particles.map(p => {
                        const targetNode = nodes.find(n => n.id === p.target);
                        if (!targetNode) return null;

                        const isLeft = targetNode.position.includes('left-0');
                        const isTop = targetNode.position.includes('top-0');

                        // Particle trajectory
                        const x = isLeft ? -200 : 200;
                        const y = isTop ? -100 : 100;
                        const colorClass = targetNode.color.replace('text-', 'bg-');

                        return (
                            <motion.div key={p.id}
                                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                                animate={{ x, y, scale: xrayMode ? 1.5 : 1, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: xrayMode ? 0.6 : 1, ease: "circIn" }}
                                className={`absolute left-1/2 top-1/2 w-2 h-2 rounded-full -ml-1 -mt-1 ${colorClass} shadow-[0_0_15px_currentColor] z-30 pointer-events-none`}
                            >
                                {xrayMode && (
                                    <span className="absolute -top-3 -left-4 text-[6px] font-mono text-white/50">{p.type}</span>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Bottom State Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                <div className={`flex items-center gap-2 px-6 py-2 rounded-full border backdrop-blur-md transition-colors ${isActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900/80 border-slate-800 text-slate-600'
                    }`}>
                    <Server size={14} className={isActive ? 'animate-pulse' : ''} />
                    <span className="text-[10px] uppercase font-black tracking-widest">
                        Стан Системи: {isActive ? 'СИНХРОНІЗАЦІЯ МАНІФЕСТУ' : 'ОЧІКУВАННЯ ДАНИХ'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DataReactorCore;
