/**
 * 🛰️ Semantic Radar Matrix | v56.1.4 Sovereign Matrix
 * PREDATOR Семантичний Аналітичний Радар — Когнітивний Граф Зв'язків
 *
 * Візуалізація зв'язків між сутностями (Граф) та глибока аналітика.
 * Включає:
 * - Physics-based Entity Graph (Семантичний Радар)
 * - Нейронний HUD сутності
 * - AI Інсайти та аналіз ризиків
 * - Розширена візуальна аналітика
 *
 * © 2026 PREDATOR Analytics — Повна українізація v56.1.4
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Activity, BrainCircuit, AlertTriangle, AlertOctagon,
    Briefcase, Stethoscope, Leaf, Building2, Crosshair,
    Share2, Info, FileText, Filter,
    Zap, Eye, Target, TrendingUp, ShieldAlert, Cpu, Network, Globe,
    Hexagon, Layers, Box, Boxes, Terminal, ShieldCheck,
    ChevronRight, ArrowUpRight, Radio, Sparkles, Brain, BarChart3
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { premiumLocales } from '@/locales/uk/premium';
import { TacticalCard } from '@/components/TacticalCard';
import { CyberOrb } from '@/components/CyberOrb';
import { HoloContainer } from '@/components/HoloContainer';
import { VisualAnalytics } from '@/components/premium/VisualAnalytics';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { ViewHeader } from '@/components/ViewHeader';

// === ТИПИ ТА КОНФІГУРАЦІЯ ===
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
    source: string;
    target: string;
    relation: string;
    weight: number;
}

const CATEGORY_MAP: Record<string, { color: string; icon: any; label: string }> = {
    PERSON: { color: '#60a5fa', icon: <Info size={14} />, label: premiumLocales.semanticRadar.categories.person },
    ORGANIZATION: { color: '#f59e0b', icon: <Building2 size={14} />, label: premiumLocales.semanticRadar.categories.organization },
    LOCATION: { color: '#f43f5e', icon: <Globe size={14} />, label: premiumLocales.semanticRadar.categories.location },
    PROJECT: { color: '#e11d48', icon: <Target size={14} />, label: premiumLocales.semanticRadar.categories.project },
    EVENT: { color: '#be123c', icon: <Activity size={14} />, label: premiumLocales.semanticRadar.categories.event },
    CONCEPT: { color: '#fb7185', icon: <BrainCircuit size={14} />, label: premiumLocales.semanticRadar.categories.concept },
    DEFAULT: { color: '#9f1239', icon: <Network size={14} />, label: premiumLocales.semanticRadar.categories.default }
};

// === ДОПОМІЖНІ КОМПОНЕНТИ ===

const RadarOverlay: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[48px]">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
        <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03]" />

        {/* Spinning Radar Beam */}
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-red-500/10 to-transparent origin-center opacity-30"
            style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 60%)' }}
        />

        {/* Concentric Circles */}
        <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="absolute rounded-full border border-red-500/10 shadow-[inner_0_0_20px_rgba(239,68,68,0.05)]"
                    style={{ width: `${i * 25}%`, height: `${i * 25}%` }}
                />
            ))}
        </div>

        {/* Tactical Indicators */}
        <div className="absolute top-10 left-10 text-[8px] font-black text-red-500/40 uppercase tracking-[0.4em] font-mono">
            РАДАР_АКТИВНИЙ // ГЛИБИНА: 4
        </div>
        <div className="absolute bottom-10 right-10 text-[8px] font-black text-red-500/40 uppercase tracking-[0.4em] font-mono">
            КООРДИНАТИ: 50.4501° N, 30.5234° E
        </div>
    </div>
);

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

    const nodesRef = useRef<GraphNode[]>([]);
    const linksRef = useRef<GraphLink[]>([]);

    useEffect(() => {
        nodesRef.current = initialNodes.map(n => ({
            ...n,
            x: (Math.random() - 0.5) * 600,
            y: (Math.random() - 0.5) * 600,
            vx: 0,
            vy: 0,
            radius: n.label === 'ORGANIZATION' ? 40 : 30,
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

        const draw = () => {
            if (!active) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            const cx = width / 2;
            const cy = height / 2;

            ctx.clearRect(0, 0, width, height);

            const nodes = nodesRef.current;
            const links = linksRef.current;

            // PHYSICS
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const n1 = nodes[i];
                    const n2 = nodes[j];
                    const dx = n2.x! - n1.x!;
                    const dy = n2.y! - n1.y!;
                    const distSq = dx * dx + dy * dy || 1;
                    const dist = Math.sqrt(distSq);
                    if (dist < 300) {
                        const force = (300 - dist) / 300;
                        const fx = (dx / dist) * force * 3;
                        const fy = (dy / dist) * force * 3;
                        if (n1 !== draggingNode.current) { n1.vx! -= fx; n1.vy! -= fy; }
                        if (n2 !== draggingNode.current) { n2.vx! += fx; n2.vy! += fy; }
                    }
                }
            }

            links.forEach(link => {
                const s = nodes.find(n => n.id === link.source);
                const t = nodes.find(n => n.id === link.target);
                if (s && t) {
                    const dx = t.x! - s.x!;
                    const dy = t.y! - s.y!;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const targetDist = 200;
                    const force = (dist - targetDist) * 0.05;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    if (s !== draggingNode.current) { s.vx! += fx; s.vy! += fy; }
                    if (t !== draggingNode.current) { t.vx! -= fx; t.vy! -= fy; }
                }
            });

            nodes.forEach(n => {
                if (n !== draggingNode.current) {
                    n.vx! += (0 - n.x!) * 0.01; // Gravity to center
                    n.vy! += (0 - n.y!) * 0.01;
                    n.vx! *= 0.85; // Friction
                    n.vy! *= 0.85;
                    n.x! += n.vx!;
                    n.y! += n.vy!;
                }
            });

            // RENDER
            ctx.save();
            ctx.translate(cx, cy);

            // Links
            links.forEach(link => {
                const s = nodes.find(n => n.id === link.source);
                const t = nodes.find(n => n.id === link.target);
                if (s && t) {
                    ctx.beginPath();
                    ctx.moveTo(s.x!, s.y!);
                    ctx.lineTo(t.x!, t.y!);
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
                    ctx.setLineDash([5, 5]);
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.setLineDash([]);

                    if (link.relation && Math.hypot(s.x! - t.x!, s.y! - t.y!) > 150) {
                        ctx.font = 'bold 8px Courier New';
                        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
                        ctx.textAlign = 'center';
                        ctx.fillText(link.relation.toUpperCase(), (s.x! + t.x!) / 2, (s.y! + t.y!) / 2);
                    }
                }
            });

            // Nodes
            nodes.forEach(node => {
                const pulse = Math.sin(Date.now() / 600) * 0.1 + 1;

                // Glow
                const gradient = ctx.createRadialGradient(node.x!, node.y!, 0, node.x!, node.y!, node.radius! * pulse * 2);
                gradient.addColorStop(0, `${node.color}33`);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.radius! * pulse * 2, 0, Math.PI * 2);
                ctx.fill();

                // Border Hexagon (Pseudo)
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.radius!, 0, Math.PI * 2);
                ctx.fillStyle = '#020617';
                ctx.fill();
                ctx.strokeStyle = node.color!;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Name
                ctx.font = 'black 12px Inter, sans-serif';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 10;
                ctx.shadowColor = node.color!;
                ctx.fillText(node.name, node.x!, node.y! + node.radius! + 20);
                ctx.shadowBlur = 0;

                // Type
                ctx.font = '8px monospace';
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillText((CATEGORY_MAP[node.label] || CATEGORY_MAP.DEFAULT).label.toUpperCase(), node.x!, node.y! + node.radius! + 32);
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
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
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
        <div ref={containerRef} className="w-full h-full relative cursor-crosshair group overflow-hidden bg-slate-950/20 backdrop-blur-xl rounded-[48px] border border-white/5 shadow-2xl">
            <RadarOverlay />
            <canvas
                ref={canvasRef}
                className="block w-full h-full relative z-10"
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={() => draggingNode.current = null}
                onMouseLeave={() => draggingNode.current = null}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={() => draggingNode.current = null}
            />
        </div>
    );
};

// === ГОЛОВНИЙ КОМПОНЕНТ ===
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
        handleSearch("Енерго"); // Lead search
    }, []);

    const loadSummary = async () => {
        try {
            const data = await api.graph.summary();
            setSummary(data);
        } catch (e) {
            console.error("Summary failed", e);
        }
    };

    const handleSearch = async (q?: string) => {
        const query = q || searchQuery;
        if (!query.trim()) return;

        setIsScanning(true);
        try {
            const result = await api.graph.search(query, 2);
            if (result && Array.isArray(result.nodes)) {
                setNodes(result.nodes);
                setLinks(result.edges || []);
                if (result.nodes.length > 0) setSelectedEntity(result.nodes[0]);
            }
        } catch (e) {
            console.error("Graph search failed", e);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-10 gap-10 relative z-10 animate-in fade-in duration-1000">
            <AdvancedBackground />

            {/* Ambient Lighting Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-red-500/5 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-rose-500/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* ViewHeader v56.1.4 */}
            <ViewHeader
                title="СЕМАНТИЧНИЙ РАДАР"
                icon={<Network className="text-red-400" />}
                breadcrumbs={['OSINT-HUB', 'АНАЛІТИКА', 'GLOBAL_STATS v56.1.4']}
                badges={[
                    { label: 'OSINT_HUB_v56.1.4_CERTIFIED', color: 'primary', icon: <Zap size={10} /> },
                    { label: 'CONSTITUTIONAL_SHIELD_ACTIVE', color: 'success', icon: <ShieldCheck size={10} /> },
                ]}
                stats={[
                    { label: 'Вузлів у графі', value: summary?.total_nodes ? String(summary.total_nodes) : '...', icon: <Network />, color: 'primary' },
                    { label: 'Зв\'язків', value: summary?.total_edges ? String(summary.total_edges) : '...', icon: <Share2 />, color: 'warning' },
                    { label: 'Точність', value: '98.2%', icon: <ShieldCheck />, color: 'success' },
                ]}
            />

            {/* Tactical Search & View Toggle */}
            <div className="flex flex-col xl:flex-row gap-6 items-center z-20">
                <div className="relative flex-1 group w-full">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={premiumLocales.semanticRadar.search.placeholder}
                        className="w-full pl-16 pr-40 py-6 bg-slate-950/60 border border-white/5 rounded-[28px] text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium backdrop-blur-3xl shadow-2xl"
                    />
                    <Search size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <div className="absolute right-3 top-2.5 bottom-2.5 flex items-center gap-2">
                        <button
                            onClick={() => handleSearch()}
                            className="px-8 h-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-[20px] transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl"
                        >
                            {isScanning ? <Activity size={16} className="animate-spin" /> : <><Target size={16} /> {premiumLocales.semanticRadar.search.button}</>}
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 p-2 bg-slate-950/60 border border-white/5 rounded-[30px] backdrop-blur-3xl shadow-xl">
                    {[
                        { id: 'radar', label: premiumLocales.semanticRadar.title, icon: Network },
                        { id: 'visual', label: premiumLocales.visualAnalytics.title, icon: BarChart3 }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-8 py-4 rounded-[22px] flex items-center gap-3 transition-all duration-500",
                                activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    ))}
                    <div className="w-px h-8 bg-white/5 mx-2 self-center" />
                    <button title="Фільтр" className="p-4 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><Filter size={20} /></button>
                </div>
            </div>

            {/* Main Workspace Area */}
            <div className="flex-1 min-h-[600px] relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'radar' ? (
                        <motion.div
                            key="radar-matrix"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="grid grid-cols-12 gap-10 h-full"
                        >
                            {/* Visual Graph Area */}
                            <div className="col-span-12 xl:col-span-8 relative group">
                                {isScanning && (
                                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 rounded-[48px] backdrop-blur-md">
                                        <div className="relative mb-8">
                                            <div className="w-32 h-32 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Activity size={48} className="text-blue-500 animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-[0.4em] font-display animate-pulse">{premiumLocales.semanticRadar.search.scanning}</h3>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-4">ЗАХОПЛЕННЯ НЕЙРОННИХ СИГНАЛІВ...92%</p>
                                    </div>
                                )}
                                <AnalysisGraph
                                    nodes={nodes}
                                    links={links}
                                    onSelectNode={setSelectedEntity}
                                    active={!isScanning}
                                />
                            </div>

                            {/* Entity Intelligence HUD */}
                            <div className="col-span-12 xl:col-span-4 flex flex-col gap-8">
                                <AnimatePresence mode="wait">
                                    {selectedEntity ? (
                                        <motion.div
                                            key={selectedEntity.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex flex-col gap-8 h-full"
                                        >
                                            {/* Primary Entity Card */}
                                            <TacticalCard variant="holographic" className="p-10 bg-slate-950 shadow-2xl relative overflow-hidden group/entity">
                                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/entity:opacity-30 transition-all duration-1000 rotate-12 group-hover/entity:rotate-0 scale-150">
                                                    {CATEGORY_MAP[selectedEntity.label]?.icon || <Network size={120} />}
                                                </div>

                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className={cn("p-4 rounded-2xl border border-white/10 shadow-lg", `text-[${CATEGORY_MAP[selectedEntity.label]?.color}]`)}>
                                                        {CATEGORY_MAP[selectedEntity.label]?.icon || <Activity size={24} />}
                                                    </div>
                                                    <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        {CATEGORY_MAP[selectedEntity.label]?.label || 'ENTITY_NODE'}
                                                    </div>
                                                </div>

                                                <h2 className="text-4xl font-black text-white leading-none tracking-tighter mb-8 font-display group-hover/entity:text-blue-400 transition-colors">
                                                    {selectedEntity.name}
                                                </h2>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <button className="flex-1 py-4 bg-blue-600 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3">
                                                        <Target size={16} /> {premiumLocales.semanticRadar.entityHud.openCase}
                                                    </button>
                                                    <button className="p-4 bg-white/5 border border-white/10 rounded-[20px] text-white hover:bg-white/10 transition-all flex items-center justify-center">
                                                        <Share2 size={20} />
                                                    </button>
                                                </div>
                                            </TacticalCard>

                                            {/* Parameters Breakdown */}
                                            <div className="p-8 bg-slate-950/60 border border-white/5 rounded-[40px] shadow-2xl backdrop-blur-3xl">
                                                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                                    <Terminal size={16} /> {premiumLocales.semanticRadar.entityHud.params}
                                                </h3>
                                                <div className="space-y-4">
                                                    {Object.entries(selectedEntity.properties || {}).map(([key, val]: [string, any], idx) => (
                                                        <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5 group/row">
                                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover/row:text-slate-400 transition-colors">{key.replace(/_/g, ' ')}</span>
                                                            <span className="text-xs font-mono text-white max-w-[180px] truncate">{String(val)}</span>
                                                        </div>
                                                    ))}
                                                    {(!selectedEntity.properties || Object.keys(selectedEntity.properties).length === 0) && (
                                                        <div className="py-10 text-center opacity-20">
                                                            <Box size={40} className="mx-auto mb-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{premiumLocales.common.noData}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* AI Neural Insight */}
                                            <div className="p-8 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-[40px] shadow-2xl backdrop-blur-3xl relative overflow-hidden group/insight">
                                                <div className="absolute top-0 right-0 p-6 opacity-10 animate-pulse">
                                                    <BrainCircuit size={80} />
                                                </div>
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 text-blue-400">
                                                        <Brain size={20} />
                                                    </div>
                                                    <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{premiumLocales.semanticRadar.entityHud.aiInsight}</span>
                                                </div>
                                                <p className="text-sm text-blue-100/80 leading-relaxed font-serif italic mb-8 relative z-10 transition-all group-hover/insight:text-white">
                                                    "{premiumLocales.semanticRadar.entityHud.aiInsightText.replace('{name}', selectedEntity.name).replace('{type}', selectedEntity.label)}"
                                                </p>
                                                <div className="flex flex-wrap gap-4 relative z-10">
                                                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                                        <ShieldCheck size={14} className="text-emerald-400" />
                                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{premiumLocales.semanticRadar.entityHud.safe}</span>
                                                    </div>
                                                    <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 opacity-40">
                                                        <AlertTriangle size={14} className="text-rose-400" />
                                                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{premiumLocales.semanticRadar.entityHud.risk}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-700 opacity-40">
                                            <div className="p-10 bg-slate-900 border border-dashed border-white/10 rounded-[48px] mb-8">
                                                <Activity size={80} className="animate-pulse" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-[0.4em]">{premiumLocales.semanticRadar.entityHud.selectNode}</span>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="visual-matrix"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="h-full"
                        >
                            <VisualAnalytics />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Стрічка Глобального Інтелекту */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-10 p-10 bg-slate-950/60 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group"
            >
                <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                            <Globe size={48} className="text-blue-400 relative z-10 animate-spin-slow" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Глобальна Семантична Мережа</h4>
                            <p className="text-xs text-slate-500 font-medium">Моніторинг зв'язків у реальному часі за межами локальної мережі знань.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-10">
                        {[
                            { label: 'ОХОПЛЕННЯ', value: '142 КРАЇНИ', icon: Globe },
                            { label: 'КРОС-ДОМЕН', value: 'АКТИВНО', icon: Share2 },
                            { label: 'НЕЙРО-МІСТ', value: 'V55_GEN3', icon: BrainCircuit },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <item.icon size={10} /> {item.label}
                                </span>
                                <span className="text-[12px] font-black text-white">{item.value}</span>
                            </div>
                        ))}
                    </div>
                    <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-[24px] text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3">
                        РОЗШИРИТИ ГОРИЗОНТ <ArrowUpRight size={18} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AnalyticsView;
