
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Activity, BrainCircuit, AlertTriangle, AlertOctagon,
    Briefcase, Stethoscope, Leaf, Building2, Crosshair,
    Share2, Info, FileText, Filter, ZoomIn, ZoomOut, Maximize,
    Zap, Eye, Target, TrendingUp, ShieldAlert, Cpu, Network, Globe
} from 'lucide-react';
import { useGlobalState } from '../context/GlobalContext';
import { api } from '../services/api';
import { ViewHeader } from '../components/ViewHeader';
import { premiumLocales } from '../locales/uk/premium';
import { VisualAnalytics } from '../components/premium/VisualAnalytics';
import { cn } from '../utils/cn';

// ============================================================================
// ANALYSIS VIEW - СЕМАНТИЧНИЙ РАДАР (v45)
// Принцип: "Бачити невидиме крізь шум даних"
// ============================================================================

interface GraphNode {
    id: string;
    name: string;
    label: string;
    properties?: any;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    radius?: number;
    color?: string;
}

interface GraphLink {
    id: string;
    source: string; // ID
    target: string; // ID
    relation: string;
    weight: number;
}


const CATEGORY_MAP: Record<string, { color: string; icon: any; label: string }> = {
    PERSON: { color: '#60a5fa', icon: <Info size={14} />, label: premiumLocales.semanticRadar.categories.person },
    ORGANIZATION: { color: '#f59e0b', icon: <Building2 size={14} />, label: premiumLocales.semanticRadar.categories.organization },
    LOCATION: { color: '#10b981', icon: <Globe size={14} />, label: premiumLocales.semanticRadar.categories.location },
    PROJECT: { color: '#ec4899', icon: <Target size={14} />, label: premiumLocales.semanticRadar.categories.project },
    EVENT: { color: '#ef4444', icon: <Activity size={14} />, label: premiumLocales.semanticRadar.categories.event },
    CONCEPT: { color: '#8b5cf6', icon: <BrainCircuit size={14} />, label: premiumLocales.semanticRadar.categories.concept },
    DEFAULT: { color: '#94a3b8', icon: <Network size={14} />, label: premiumLocales.semanticRadar.categories.default }
};

// --- RADAR BACKGROUND ---
const RadarOverlay: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[40px]">
            {/* Dynamic Scanline */}
            <div className="scanline opacity-20" />

            {/* Spinning Beam */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500/10 to-transparent origin-center opacity-30 radar-beam-mask"
            />

            {/* Tactical Grid */}
            <div className="absolute inset-0 bg-dot-grid opacity-[0.05]" />

            {/* Concentric Circles */}
            <div className="absolute inset-0 flex items-center justify-center">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "absolute rounded-full border border-blue-500/20 radar-hud-circle-glow",
                            i === 1 ? "radar-circle-25" : i === 2 ? "radar-circle-50" : i === 3 ? "radar-circle-75" : "radar-circle-100"
                        )}
                    />
                ))}
            </div>

            {/* Crosshairs */}
            <div className="absolute top-0 left-1/2 w-px h-full bg-blue-500/10" />
            <div className="absolute top-1/2 left-0 w-full h-px bg-blue-500/10" />

            {/* Scanning Line (Digital Pulse) */}
            <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent opacity-30"
            />
        </div>
    );
};

// --- PHYSICS GRAPH ---
const AnalysisGraph: React.FC<{
    nodes: GraphNode[];
    links: GraphLink[];
    onSelectNode: (node: GraphNode) => void;
    active: boolean;
}> = ({ nodes: initialNodes, links: initialLinks, onSelectNode, active }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const draggingNode = useRef<GraphNode | null>(null);
    const requestRef = useRef<number | null>(null);

    // Mutable state for physics simulation
    const nodesRef = useRef<GraphNode[]>([]);
    const linksRef = useRef<GraphLink[]>([]);

    useEffect(() => {
        // Map and initialize nodes
        nodesRef.current = initialNodes.map(n => ({
            ...n,
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            vx: 0,
            vy: 0,
            radius: n.label === 'ORGANIZATION' ? 35 : 25,
            color: (CATEGORY_MAP[n.label] || CATEGORY_MAP.DEFAULT).color
        }));
        linksRef.current = initialLinks;
    }, [initialNodes, initialLinks]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);

        const draw = () => {
            if (!active) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            const cx = width / 2;
            const cy = height / 2;

            ctx.clearRect(0, 0, width, height);

            // 1. Physics Cycle
            const nodes = nodesRef.current;
            const links = linksRef.current;

            // Repulsion (All vs All)
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const n1 = nodes[i];
                    const n2 = nodes[j];
                    const dx = n2.x! - n1.x!;
                    const dy = n2.y! - n1.y!;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (dist < 250) {
                        const force = (250 - dist) / 250;
                        const fx = (dx / dist) * force * 2;
                        const fy = (dy / dist) * force * 2;
                        if (n1 !== draggingNode.current) { n1.vx! -= fx; n1.vy! -= fy; }
                        if (n2 !== draggingNode.current) { n2.vx! += fx; n2.vy! += fy; }
                    }
                }
            }

            // Attraction (Links)
            links.forEach(link => {
                const s = nodes.find(n => n.id === link.source);
                const t = nodes.find(n => n.id === link.target);
                if (s && t) {
                    const dx = t.x! - s.x!;
                    const dy = t.y! - s.y!;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const targetDist = 150;
                    const force = (dist - targetDist) * 0.04;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    if (s !== draggingNode.current) { s.vx! += fx; s.vy! += fy; }
                    if (t !== draggingNode.current) { t.vx! -= fx; t.vy! -= fy; }
                }
            });

            // Update positions
            nodes.forEach(n => {
                if (n !== draggingNode.current) {
                    // Center gravity
                    n.vx! += (0 - n.x!) * 0.005;
                    n.vy! += (0 - n.y!) * 0.005;

                    n.vx! *= 0.9; // Friction
                    n.vy! *= 0.9;
                    n.x! += n.vx!;
                    n.y! += n.vy!;
                }
            });

            // 2. Render Cycle
            ctx.save();
            ctx.translate(cx, cy);

            // Draw Links
            links.forEach(link => {
                const s = nodes.find(n => n.id === link.source);
                const t = nodes.find(n => n.id === link.target);
                if (s && t) {
                    ctx.beginPath();
                    ctx.moveTo(s.x!, s.y!);
                    ctx.lineTo(t.x!, t.y!);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = link.weight * 2;
                    ctx.stroke();

                    // Connection label
                    if (link.relation && dist(s, t) > 100) {
                        ctx.font = '8px monospace';
                        ctx.fillStyle = 'rgba(255,255,255,0.3)';
                        ctx.textAlign = 'center';
                        ctx.fillText(link.relation, (s.x! + t.x!) / 2, (s.y! + t.y!) / 2);
                    }
                }
            });

            // Draw Nodes
            nodes.forEach(node => {
                const isOrg = node.label === 'ORGANIZATION';

                // Outer Glow
                const pulse = Math.sin(Date.now() / 800) * 0.2 + 1;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.radius! * pulse * 1.2, 0, Math.PI * 2);
                ctx.fillStyle = `${node.color}10`;
                ctx.fill();

                // Main body
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.radius!, 0, Math.PI * 2);
                ctx.fillStyle = '#0f172a';
                ctx.fill();
                ctx.strokeStyle = node.color!;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Label
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText(node.name, node.x!, node.y! + node.radius! + 15);

                // Subtitle (Type)
                ctx.font = '9px monospace';
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillText((CATEGORY_MAP[node.label] || CATEGORY_MAP.DEFAULT).label.toUpperCase(), node.x!, node.y! + node.radius! + 26);
            });

            ctx.restore();
            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, [active]);

    const handleStart = (e: any) => {
        const rc = canvasRef.current!.getBoundingClientRect();
        const width = rc.width;
        const height = rc.height;
        const mx = (e.clientX || e.touches?.[0].clientX) - rc.left - width / 2;
        const my = (e.clientY || e.touches?.[0].clientY) - rc.top - height / 2;

        const hit = nodesRef.current.find(n => Math.hypot(n.x! - mx, n.y! - my) < n.radius! + 10);
        if (hit) {
            draggingNode.current = hit;
            onSelectNode(hit);
        }
    };

    const handleMove = (e: any) => {
        if (!draggingNode.current) return;
        const rc = canvasRef.current!.getBoundingClientRect();
        const width = rc.width;
        const height = rc.height;
        draggingNode.current.x = (e.clientX || e.touches?.[0].clientX) - rc.left - width / 2;
        draggingNode.current.y = (e.clientY || e.touches?.[0].clientY) - rc.top - height / 2;
    };

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-crosshair group overflow-hidden bg-slate-950/40 backdrop-blur-md rounded-[40px] border border-white/5">
            <RadarOverlay />
            <canvas
                ref={canvasRef}
                className="block w-full h-full relative z-10"
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={() => draggingNode.current = null}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={() => draggingNode.current = null}
            />
        </div>
    );
};

// --- MAIN VIEW ---
const AnalyticsView: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<GraphNode | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'radar' | 'visual'>('radar');

    useEffect(() => {
        loadSummary();
        handleSearch("ТОВ"); // Initial lead
    }, []);

    const loadSummary = async () => {
        try {
            const data = await api.graph.summary();
            setSummary(data);
        } catch (e) {
            console.error("Summary load failed", e);
        }
    };

    const handleSearch = async (q: string) => {
        const query = q || searchQuery;
        if (!query.trim()) return;

        setIsScanning(true);
        try {
            const result = await api.graph.search(query, 2);
            const nodes = Array.isArray(result?.nodes) ? result.nodes : [];
            const edges = Array.isArray(result?.edges) ? result.edges : [];
            setNodes(nodes);
            setLinks(edges);
            if (nodes.length > 0) {
                setSelectedEntity(nodes[0]);
            }
        } catch (e) {
            console.error("Search failed", e);
            // Fallback for presentation stability
            setNodes([]);
            setLinks([]);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-6 gap-6 relative z-10">
            <ViewHeader
                title={
                    <span className="typewriter-effect inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                        {premiumLocales.semanticRadar.title}
                    </span>
                }
                icon={<Network size={20} className="icon-3d-blue" />}
                breadcrumbs={premiumLocales.semanticRadar.breadcrumbs}
                stats={[
                    { label: premiumLocales.semanticRadar.stats.nodes, value: summary?.total_nodes?.toString() || '...', icon: <Cpu size={14} />, color: 'primary' },
                    { label: premiumLocales.semanticRadar.stats.edges, value: summary?.total_edges?.toString() || '...', icon: <Share2 size={14} />, color: 'success' },
                    { label: premiumLocales.semanticRadar.stats.accuracy, value: '98.2%', icon: <BrainCircuit size={14} className="icon-3d-purple" />, color: 'purple' },
                ]}
            />

            {/* TOP BAR / SEARCH */}
            <div className="flex flex-col sm:flex-row gap-4 items-center z-20">
                <div className="relative flex-1 max-w-2xl group w-full">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                        placeholder={premiumLocales.semanticRadar.search.placeholder}
                        className="w-full pl-14 pr-32 py-4 bg-slate-900/60 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium backdrop-blur-xl"
                    />
                    <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <button
                        onClick={() => handleSearch(searchQuery)}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest flex items-center shadow-lg shadow-blue-900/40"
                    >
                        {isScanning ? <Activity size={18} className="animate-spin" /> : premiumLocales.semanticRadar.search.button}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('radar')}
                        className={cn(
                            "px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border",
                            activeTab === 'radar'
                                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40"
                                : "bg-slate-900/60 text-slate-500 border-white/5 hover:text-white"
                        )}
                    >
                        {premiumLocales.semanticRadar.title}
                    </button>
                    <button
                        onClick={() => setActiveTab('visual')}
                        className={cn(
                            "px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border",
                            activeTab === 'visual'
                                ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/40"
                                : "bg-slate-900/60 text-slate-500 border-white/5 hover:text-white"
                        )}
                    >
                        {premiumLocales.visualAnalytics.title}
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-2 self-center" />
                    <button title="Фільтр" className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"><Filter size={20} /></button>
                    <button title="На весь екран" className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"><Maximize size={20} /></button>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 min-h-0 relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'radar' ? (
                        <motion.div
                            key="radar-workspace"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full"
                        >
                            {/* Visual Radar Area */}
                            <div className="lg:col-span-3 min-h-[400px] relative">
                                <AnimatePresence mode="wait">
                                    {isScanning ? (
                                        <motion.div
                                            key="scanning"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-[40px] z-30 backdrop-blur-sm"
                                        >
                                            <div className="relative mb-8">
                                                <div className="w-24 h-24 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                                <Zap size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 animate-pulse" />
                                            </div>
                                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] animate-pulse">{premiumLocales.semanticRadar.search.scanning}</div>
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn("absolute rounded-full border border-white/5 radar-bg-ring", `radar-ring-${i + 1}`)}
                                    />
                                ))}
                                <AnalysisGraph
                                    nodes={nodes}
                                    links={links}
                                    onSelectNode={setSelectedEntity}
                                    active={!isScanning}
                                />
                            </div>

                            {/* AI Insight Sidebar */}
                            <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {selectedEntity ? (
                                        <motion.div
                                            key={selectedEntity.id}
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="space-y-4"
                                        >
                                            <div className="p-6 rounded-[32px] bg-black/40 border border-white/5 backdrop-blur-2xl relative overflow-hidden group shadow-2xl">
                                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-all duration-700 -rotate-12 group-hover:rotate-0 scale-150">
                                                    {CATEGORY_MAP[selectedEntity.label]?.icon || <Network size={80} />}
                                                </div>
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-3">
                                                    <div
                                                        className={cn("w-2 h-2 rounded-full accent-pulse-dynamic", `accent-${selectedEntity.label}`)}
                                                    />
                                                    {CATEGORY_MAP[selectedEntity.label]?.label || premiumLocales.semanticRadar.entityHud.type}
                                                </div>
                                                <h2 className="text-2xl font-black text-white leading-none tracking-tighter mb-6">{selectedEntity.name}</h2>
                                                <div className="flex gap-3">
                                                    <button className="flex-1 py-3 bg-blue-600/10 border border-blue-500/30 rounded-2xl text-blue-400 text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all tracking-[0.2em] shadow-lg shadow-blue-500/5">{premiumLocales.semanticRadar.entityHud.openCase}</button>
                                                    <button title="Поділитися" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white"><Share2 size={18} /></button>
                                                </div>
                                            </div>

                                            <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-xl">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{premiumLocales.semanticRadar.entityHud.params}</h4>
                                                <div className="space-y-3">
                                                    {Object.entries(selectedEntity.properties || {}).map(([key, val]: [string, any]) => (
                                                        <div key={key} className="flex justify-between items-center py-2 border-b border-white/5">
                                                            <span className="text-[10px] text-slate-400 capitalize">{key.replace('_', ' ')}</span>
                                                            <span className="text-xs font-mono text-white max-w-[150px] truncate">{String(val)}</span>
                                                        </div>
                                                    ))}
                                                    {Object.entries(selectedEntity.properties || {}).length === 0 && <div className="text-xs text-slate-600 italic">{premiumLocales.common.noData}...</div>}
                                                </div>
                                            </div>

                                            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 backdrop-blur-xl relative">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><BrainCircuit size={18} /></div>
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{premiumLocales.semanticRadar.entityHud.aiInsight}</span>
                                                </div>
                                                <p className="text-xs text-slate-300 leading-relaxed italic">
                                                    "{premiumLocales.semanticRadar.entityHud.aiInsightText.replace('{name}', selectedEntity.name).replace('{type}', selectedEntity.label)}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center gap-2 hover:bg-emerald-500/10 transition-all cursor-pointer">
                                                    <ShieldAlert size={18} className="text-emerald-400" />
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{premiumLocales.semanticRadar.entityHud.safe}</span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col items-center gap-2 hover:bg-rose-500/10 transition-all cursor-pointer">
                                                    <AlertTriangle size={18} className="text-rose-400" />
                                                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{premiumLocales.semanticRadar.entityHud.risk}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-20 text-slate-500">
                                            <Activity size={64} className="mb-4" />
                                            <div className="text-[10px] font-black uppercase tracking-widest">{premiumLocales.semanticRadar.entityHud.selectNode}</div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="visual-workspace"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="h-full overflow-y-auto pr-2 custom-scrollbar"
                        >
                            <VisualAnalytics />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AnalyticsView;
