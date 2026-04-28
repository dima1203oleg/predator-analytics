/**
 * 🛰️ Semantic Radar Matrix | v61.0-ELITE Sovereign Matrix
 * PREDATOR Семантичний Аналітичний  адар — Когнітивний Граф Зв'язків
 *
 * Візуалізація зв'язків між сутностями (Граф) та глибока аналітика.
 * Включає:
 * - Physics-based Entity Graph (Семантичний  адар)
 * - Нейронний HUD сутності
 * - AI Інсайти та аналізризиків
 * -розширена візуальна аналітика
 *
 * Sovereign Power Design · Classified · Tier-1
 * 
 * © 2026 PREDATOR Analytics — Повна українізація v61.0-ELITE
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Activity, BrainCircuit, AlertTriangle, AlertOctagon,
    Briefcase, Stethoscope, Leaf, Building2, Crosshair,
    Share2, Info, FileText, Filter,
    Zap, Eye, Target, TrendingUp, ShieldAlert, Cpu, Network, Globe,
    Hexagon, Layers, Box, Boxes, Terminal, ShieldCheck,
    ChevronRight, ArrowUpRight, Radio, Sparkles, Brain, BarChart3,
    Fingerprint, Lock, ZapOff
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { api } from '@/services/api';
import { cn } from '@/utils/cn';
import { premiumLocales } from '@/locales/uk/premium';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { CyberOrb } from '@/components/CyberOrb';
import { HoloContainer } from '@/components/HoloContainer';
import { VisualAnalytics } from '@/components/premium/VisualAnalytics';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { ViewHeader } from '@/components/ViewHeader';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';

// === ТИПИ ТА КОНФІГУ АЦІЯ ELITE ===
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
    PERSON: { color: '#fbbf24', icon: <Info size={14} />, label: premiumLocales.semanticRadar.categories.person },
    ORGANIZATION: { color: '#D4AF37', icon: <Building2 size={14} />, label: premiumLocales.semanticRadar.categories.organization },
    LOCATION: { color: '#F59E0B', icon: <Globe size={14} />, label: premiumLocales.semanticRadar.categories.location },
    PROJECT: { color: '#B45309', icon: <Target size={14} />, label: premiumLocales.semanticRadar.categories.project },
    EVENT: { color: '#D97706', icon: <Activity size={14} />, label: premiumLocales.semanticRadar.categories.event },
    CONCEPT: { color: '#64748b', icon: <BrainCircuit size={14} />, label: premiumLocales.semanticRadar.categories.concept },
    DEFAULT: { color: '#D4AF37', icon: <Network size={14} />, label: premiumLocales.semanticRadar.categories.default }
};

// === ДОПОМІЖНІ КОМПОНЕНТИ ELITE ===

const RadarOverlay: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[48px]">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
        <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03]" />

        {/* Spinning Radar Beam ELITE */}
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 w-[220%] h-[220%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-500/10 to-transparent origin-center opacity-40 shadow-[0_0_100px_rgba(212,175,55,0.05)]"
            style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 55%)' }}
        />

        {/* Concentric Circles ELITE */}
        <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className="absolute rounded-full border-2 border-yellow-500/[0.03] shadow-[inner_0_0_40px_rgba(212,175,55,0.02)]"
                    style={{ width: `${i * 20}%`, height: `${i * 20}%` }}
                />
            ))}
        </div>

        {/* Tactical Indicators ELITE */}
        <div className="absolute top-12 left-12 text-[10px] font-black text-yellow-600/40 uppercase tracking-[0.5em] font-serif italic">
            RADAR_STATUS: ACTIVE // COGNITIVE_DEPTH: ELITE
        </div>
        <div className="absolute bottom-12 right-12 text-[10px] font-black text-yellow-600/40 uppercase tracking-[0.5em] font-serif italic">
            SIGNAL_LOCK: 50.4501° N, 30.5234° E
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
            radius: n.label === 'ORGANIZATION' ? 45 : 35,
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

            // PHYSICS ELITE
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const n1 = nodes[i];
                    const n2 = nodes[j];
                    const dx = n2.x! - n1.x!;
                    const dy = n2.y! - n1.y!;
                    const distSq = dx * dx + dy * dy || 1;
                    const dist = Math.sqrt(distSq);
                    if (dist < 400) {
                        const force = (400 - dist) / 400;
                        const fx = (dx / dist) * force * 4;
                        const fy = (dy / dist) * force * 4;
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
                    const targetDist = 250;
                    const force = (dist - targetDist) * 0.08;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    if (s !== draggingNode.current) { s.vx! += fx; s.vy! += fy; }
                    if (t !== draggingNode.current) { t.vx! -= fx; t.vy! -= fy; }
                }
            });

            nodes.forEach(n => {
                if (n !== draggingNode.current) {
                    n.vx! += (0 - n.x!) * 0.015; 
                    n.vy! += (0 - n.y!) * 0.015;
                    n.vx! *= 0.82; 
                    n.vy! *= 0.82;
                    n.x! += n.vx!;
                    n.y! += n.vy!;
                }
            });

            // RENDER ELITE
            ctx.save();
            ctx.translate(cx, cy);

            // Links ELITE
            links.forEach(link => {
                const s = nodes.find(n => n.id === link.source);
                const t = nodes.find(n => n.id === link.target);
                if (s && t) {
                    ctx.beginPath();
                    ctx.moveTo(s.x!, s.y!);
                    ctx.lineTo(t.x!, t.y!);
                    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
                    ctx.setLineDash([8, 12]);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.setLineDash([]);

                    if (link.relation && Math.hypot(s.x! - t.x!, s.y! - t.y!) > 180) {
                        ctx.font = 'black 10px Courier New';
                        ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
                        ctx.textAlign = 'center';
                        ctx.fillText(link.relation.toUpperCase(), (s.x! + t.x!) / 2, (s.y! + t.y!) / 2);
                    }
                }
            });

            // Nodes ELITE
            nodes.forEach(node => {
                const pulse = Math.sin(Date.now() / 800) * 0.05 + 1;

                // Glow ELITE
                const gradient = ctx.createRadialGradient(node.x!, node.y!, 0, node.x!, node.y!, node.radius! * pulse * 2.5);
                gradient.addColorStop(0, `${node.color}22`);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!+(Math.sin(Date.now()/1000)*5), node.radius! * pulse * 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Core ELITE
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.radius!, 0, Math.PI * 2);
                ctx.fillStyle = '#0a0a0a';
                ctx.fill();
                ctx.strokeStyle = node.color!;
                ctx.lineWidth = 4;
                ctx.stroke();

                // Inner Ring ELITE
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, node.radius! - 8, 0, Math.PI * 2);
                ctx.strokeStyle = `${node.color}44`;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Name ELITE
                ctx.font = 'black 14px "Outfit", sans-serif';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 15;
                ctx.shadowColor = node.color!;
                ctx.fillText(node.name.toUpperCase(), node.x!, node.y! + node.radius! + 24);
                ctx.shadowBlur = 0;

                // Type ELITE
                ctx.font = '900 9px monospace';
                ctx.fillStyle = 'rgba(212,175,55,0.4)';
                ctx.fillText((CATEGORY_MAP[node.label] || CATEGORY_MAP.DEFAULT).label.toUpperCase(), node.x!, node.y! + node.radius! + 38);
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

        const hit = nodesRef.current.find(n => Math.hypot(n.x! - mx, n.y! - my) < n.radius! + 15);
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
        <div ref={containerRef} className="w-full h-full relative cursor-crosshair group overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[4rem] border-2 border-white/[0.04] shadow-4xl transition-all hover:border-yellow-500/20">
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

// === ГОЛОВНИЙ КОМПОНЕНТ ELITE ===
const AnalyticsView: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<GraphNode | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'radar' | 'visual'>('radar');

    const { isOffline, nodeSource } = useBackendStatus();

    useEffect(() => {
        loadSummary();
        handleSearch("Енерго");
    }, [isOffline]);

    useEffect(() => {
        if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'SemanticRadar',
                    message: 'СЕМАНТИЧНИЙ  АДА : Активовано автономний режим (SEMANTIC_NODES). Використовується локальний дзеркальний контур.',
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'SEMANTIC_OFFLINE'
                }
            }));
        }

        window.dispatchEvent(new CustomEvent('predator-error', {
            detail: {
                service: 'SemanticRadar',
                message: ` АДА _МАТрИЦЯ [${nodeSource}]: Семантичний контур активовано. Готовність до когнітивного сканування.`,
                severity: 'info',
                timestamp: new Date().toISOString(),
                code: 'SEMANTIC_SUCCESS'
            }
        }));
    }, [isOffline, nodeSource]);

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
                    
                    window.dispatchEvent(new CustomEvent('predator-error', {
                        detail: {
                            service: 'SemanticRadar',
                            message: `СЕ ВЕ _ АДА А [${nodeSource}]: Нейронна дешифрація '${query}' завершена. Оброблено ${result.nodes.length} вузлів.`,
                            severity: 'info',
                            timestamp: new Date().toISOString(),
                            code: 'SEMANTIC_SUCCESS'
                        }
                    }));
                }
        } catch (e) {
            console.error("Graph search failed", e);
            
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'SemanticRadar',
                    message: `КрИТИЧНА ПОМИЛКА СКАНУВАННЯ ВУЗЛА SEMANTIC_NODES. Перевірте з'єднання з ${nodeSource}.`,
                    severity: 'critical',
                    timestamp: new Date().toISOString(),
                    code: 'SEMANTIC_NODES'
                }
            }));
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-12 gap-12 relative z-10 animate-in fade-in duration-1000 bg-[#020202]">
            <AdvancedBackground />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.05),transparent_70%)] pointer-events-none" />

            {/* ViewHeader v61.0-ELITE */}
            <ViewHeader
                title={
                    <div className="flex items-center gap-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="relative p-7 bg-black border-2 border-yellow-500/40 rounded-[2.5rem] shadow-4xl transform rotate-2 hover:rotate-0 transition-all">
                                <Network size={42} className="text-yellow-500 shadow-[0_0_20px_#d4af37]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <div className="flex items-center gap-4">
                                <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                                    SEMANTIC_CORE // {isOffline ? 'MIRROR_SCAN' : 'RADAR_ARRAY'}
                                </span>
                                <div className="h-px w-12 bg-yellow-500/20" />
                                <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v58.2-{isOffline ? 'MIRROR' : 'ELITE'}</span>
                             </div>
                             <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                                СЕМАНТИЧНИЙ <span className="text-yellow-500 underline decoration-yellow-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter"> АДА </span>
                             </h1>
                        </div>
                    </div>
                }
                breadcrumbs={['OSINT-HUB', 'АНАЛІТИКА', 'GLOBAL_COGNITION_v58.2']}
                badges={[
                    { label: 'SOVEREIGN_ELITE_FORCE', color: 'primary', icon: <Zap size={10} /> },
                    { label: 'SENTINEL_SHIELD_ACTIVE', color: 'success', icon: <ShieldCheck size={10} /> },
                ]}
                stats={[
                    { label: 'ТОПО_ВУЗЛІВ', value: summary?.total_nodes ? String(summary.total_nodes) : '...', icon: <Network />, color: 'primary' },
                    { label: 'АКТИВНІ_ЗВ\'ЯЗКИ', value: summary?.total_edges ? String(summary.total_edges) : '...', icon: <Share2 />, color: 'warning' },
                    { label: 'FIDELITY_INDEX', value: '98.8%', icon: <ShieldCheck />, color: 'success' },
                ]}
            />

            {/* Tactical Search & View Toggle ELITE */}
            <div className="flex flex-col xl:flex-row gap-8 items-center z-20">
                <div className="relative flex-1 group w-full">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={premiumLocales.semanticRadar.search.placeholder}
                        className="w-full pl-20 pr-48 py-8 bg-black border-2 border-white/5 rounded-[3rem] text-white placeholder-slate-800 focus:border-yellow-500/40 focus:ring-8 focus:ring-yellow-500/5 transition-all font-black italic text-lg backdrop-blur-3xl shadow-4xl tracking-tight"
                    />
                    <Search size={32} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-yellow-500 transition-colors" />
                    <div className="absolute right-4 top-3 bottom-3 flex items-center gap-4">
                        <button
                            onClick={() => handleSearch()}
                            className="px-12 h-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black rounded-[2rem] transition-all font-black text-[12px] uppercase tracking-[0.4em] italic flex items-center gap-4 shadow-4xl border-2 border-yellow-400/20"
                        >
                            {isScanning ? <Activity size={20} className="animate-spin" /> : <><Target size={20} /> EXECUTE_SCAN</>}
                        </button>
                    </div>
                </div>

                <div className="flex gap-6 p-3 bg-black border-2 border-white/5 rounded-[4rem] backdrop-blur-3xl shadow-4xl">
                    {[
                        { id: 'radar', label: 'RADAR_ARRAY', icon: Network },
                        { id: 'visual', label: 'VISUAL_VECTOR', icon: BarChart3 }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-10 py-5 rounded-[2.5rem] flex items-center gap-4 transition-all duration-700 italic border-2",
                                activeTab === tab.id
                                    ? "bg-yellow-600 border-yellow-500 text-white shadow-4xl scale-105"
                                    : "text-slate-700 border-transparent hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={20} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{tab.label}</span>
                        </button>
                    ))}
                    <div className="w-px h-10 bg-white/5 mx-2 self-center" />
                    <button title="Фільтр" className="p-5 text-slate-700 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-3xl transition-all"><Filter size={24} /></button>
                </div>
            </div>

            {/* Main Workspace Area ELITE */}
            <div className="flex-1 min-h-[700px] relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'radar' ? (
                        <motion.div
                            key="radar-matrix"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="grid grid-cols-12 gap-12 h-full"
                        >
                            {/* Visual Graph Area ELITE */}
                            <div className="col-span-12 xl:col-span-8 relative group">
                                {isScanning && (
                                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 rounded-[4rem] backdrop-blur-2xl border-4 border-yellow-500/10">
                                        <div className="relative mb-12">
                                            <div className="w-48 h-48 border-4 border-yellow-500/5 border-t-yellow-500 rounded-full animate-spin shadow-[0_0_50px_rgba(212,175,55,0.2)]" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <CyberOrb size={100} color="#D4AF37" intensity={0.6} pulse />
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black text-white uppercase tracking-[0.6em] font-serif animate-pulse">CAPTURING_SIGNALS...</h3>
                                        <p className="text-[12px] font-mono text-yellow-800 uppercase tracking-[0.4em] mt-6 italic">NEURAL_DECRYPTION: ACTIVE • 92%_FIDELITY</p>
                                    </div>
                                )}
                                <AnalysisGraph
                                    nodes={nodes}
                                    links={links}
                                    onSelectNode={setSelectedEntity}
                                    active={!isScanning}
                                />
                            </div>

                            {/* Entity Intelligence HUD ELITE */}
                            <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
                                <AnimatePresence mode="wait">
                                    {selectedEntity ? (
                                        <motion.div
                                            key={selectedEntity.id}
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            className="flex flex-col gap-10 h-full"
                                        >
                                            {/* Primary Entity Card ELITE */}
                                            <TacticalCard variant="holographic" className="p-12 bg-black shadow-4xl rounded-[4rem] border-yellow-500/10 relative overflow-hidden group/entity">
                                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover/entity:opacity-20 transition-all duration-[5s] rotate-45 group-hover/entity:rotate-0 scale-150">
                                                    {CATEGORY_MAP[selectedEntity.label]?.icon || <Network size={200} />}
                                                </div>

                                                <div className="flex items-center gap-6 mb-10">
                                                    <div className="p-5 bg-black border-2 border-white/5 rounded-[2.5rem] shadow-2xl transform group-hover/entity:rotate-6 transition-transform" style={{ color: CATEGORY_MAP[selectedEntity.label]?.color }}>
                                                        {CATEGORY_MAP[selectedEntity.label]?.icon || <Activity size={32} />}
                                                    </div>
                                                    <div className="px-6 py-2 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-full text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] italic font-serif">
                                                        {CATEGORY_MAP[selectedEntity.label]?.label || 'ASSET_NODE'}
                                                    </div>
                                                </div>

                                                <h2 className="text-5xl font-black text-white leading-none tracking-tighter mb-10 font-serif italic uppercase group-hover/entity:text-yellow-500 transition-colors">
                                                    {selectedEntity.name}
                                                </h2>

                                                <div className="grid grid-cols-2 gap-6 relative z-10">
                                                    <button className="flex-1 py-6 bg-yellow-600 border-2 border-yellow-500/40 text-black rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] italic shadow-4xl hover:brightness-110 transition-all flex items-center justify-center gap-4">
                                                        <Crosshair size={22} /> OPEN_DOSSIER
                                                    </button>
                                                    <button className="p-6 bg-white/[0.02] border-2 border-white/5 rounded-[2.5rem] text-slate-600 hover:text-white hover:border-white/20 transition-all flex items-center justify-center shadow-xl">
                                                        <Share2 size={26} />
                                                    </button>
                                                </div>
                                            </TacticalCard>

                                            {/* Parameters Breakdown ELITE */}
                                            <div className="p-10 bg-black/60 border-2 border-white/5 rounded-[4rem] shadow-4xl backdrop-blur-3xl relative overflow-hidden group/params">
                                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
                                                <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-[0.5em] mb-10 flex items-center gap-5 italic font-serif">
                                                    <Fingerprint size={20} className="text-yellow-600" /> TOPOLOGY_PARAMETERS
                                                </h3>
                                                <div className="space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-4 italic">
                                                    {Object.entries(selectedEntity.properties || {}).map(([key, val]: [string, any], idx) => (
                                                        <div key={idx} className="flex justify-between items-center py-5 border-b-2 border-slate-900 group/row hover:border-yellow-900/40 transition-all">
                                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest group-hover/row:text-slate-400 transition-colors">{key.replace(/_/g, ' ')}</span>
                                                            <span className="text-[13px] font-mono text-white font-bold tracking-tighter shadow-sm">{String(val)}</span>
                                                        </div>
                                                    ))}
                                                    {(!selectedEntity.properties || Object.keys(selectedEntity.properties).length === 0) && (
                                                        <div className="py-16 text-center opacity-10">
                                                            <Boxes size={60} className="mx-auto mb-6" />
                                                            <span className="text-[11px] font-black uppercase tracking-[0.6em] italic">NULL_DATA_FIELD</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* AI Neural Insight ELITE */}
                                            <div className="p-10 bg-amber-950/20 border-2 border-amber-500/20 rounded-[4rem] shadow-4xl backdrop-blur-3xl relative overflow-hidden group/insight">
                                                <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover/insight:opacity-20 transition-all duration-[5s] rotate-12">
                                                    <Brain size={120} className="text-amber-500" />
                                                </div>
                                                <div className="flex items-center gap-6 mb-8">
                                                    <div className="p-5 bg-black border-2 border-amber-600/30 rounded-[2rem] text-amber-500 shadow-2xl">
                                                        <Sparkles size={24} className="animate-pulse" />
                                                    </div>
                                                    <span className="text-[12px] font-black text-white uppercase tracking-[0.5em] italic font-serif leading-none underline decoration-amber-600/30 decoration-4 underline-offset-4">COGNITIVE_INSIGHT_X</span>
                                                </div>
                                                <p className="text-xl text-amber-100/80 leading-relaxed font-serif italic mb-10 relative z-10 transition-all group-hover/insight:text-white uppercase tracking-tight">
                                                    "{premiumLocales.semanticRadar.entityHud.aiInsightText.replace('{name}', selectedEntity.name).replace('{type}', selectedEntity.label)}"
                                                </p>
                                                <div className="flex flex-wrap gap-6 relative z-10">
                                                    <div className="px-8 py-4 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[1.5rem] flex items-center gap-5 italic shadow-inner">
                                                        <ShieldCheck size={20} className="text-emerald-500" />
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">VERIFIED_SAFE</span>
                                                    </div>
                                                    <div className="px-8 py-4 bg-amber-500/10 border-2 border-amber-500/20 rounded-[1.5rem] flex items-center gap-5 italic opacity-40 grayscale group-hover/insight:grayscale-0 group-hover/insight:opacity-100 transition-all">
                                                        <AlertTriangle size={20} className="text-amber-500" />
                                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">RISK_VECTOR</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-800 opacity-20">
                                            <div className="p-16 bg-black border-4 border-dashed border-white/5 rounded-[5rem] mb-12 shadow-inner group transition-all hover:bg-white/[0.02]">
                                                <Activity size={120} className="animate-pulse group-hover:scale-110 transition-transform duration-[10s]" />
                                            </div>
                                            <span className="text-[14px] font-black uppercase tracking-[1em] italic text-center">AWAITING_NODE_SELECTION</span>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="visual-matrix"
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full"
                        >
                            <VisualAnalytics />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Стрічка Глобального Інтелекту ELITE */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 p-12 bg-black border-2 border-white/[0.04] rounded-[5rem] backdrop-blur-3xl shadow-4xl relative overflow-hidden group hover:border-yellow-500/10 transition-all duration-1000"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/[0.02] to-transparent pointer-events-none" />
                <div className="flex flex-col xl:flex-row items-center justify-between gap-12 relative z-10">
                    <div className="flex items-center gap-10">
                        <div className="relative group/globe">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full scale-150 animate-pulse group-hover/globe:bg-yellow-500/40 transition-all duration-[5s]" />
                            <div className="p-6 bg-black border-2 border-yellow-500/20 rounded-[3rem] shadow-4xl relative z-10">
                                <Globe size={64} className="text-yellow-500 animate-spin-slow" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic font-serif leading-none group-hover:text-yellow-500 transition-colors">Глобальна Семантична Мережа</h4>
                            <p className="text-[11px] text-slate-700 font-black uppercase tracking-[0.4em] italic leading-none border-l-4 border-yellow-500/30 pl-8">DEEP_COGNITION_SURVEILLANCE // GLOBAL_REACH_ARRAY</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-14 border-x-2 border-white/5 px-20">
                        {[
                            { label: 'GLOBAL_COVERAGE', value: '142_STATES', icon: Globe, color: 'text-yellow-500' },
                            { label: 'CROSS_DOMAIN_MESH', value: 'ULTRA_ACTIVE', icon: Share2, color: 'text-white' },
                            { label: 'NEURAL_BRIDGE_X', value: 'V56.5_PLATINUM', icon: BrainCircuit, color: 'text-yellow-600' },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col gap-4 italic group/item">
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] mb-1 flex items-center gap-4 group-hover/item:text-yellow-700 transition-colors">
                                    <item.icon size={16} /> {item.label}
                                </span>
                                <span className={cn("text-2xl font-black font-mono tracking-tighter leading-none shadow-sm", item.color)}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <button className="px-14 py-8 bg-yellow-600 text-black border-2 border-yellow-500/40 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] italic hover:brightness-110 transition-all flex items-center gap-6 shadow-4xl font-bold">
                        EXPAND_NETWORK_HORIZON <ArrowUpRight size={24} className="animate-pulse" />
                    </button>
                </div>
            </motion.div>

            <div className="mt-12">
                <DiagnosticsTerminal />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(212,175,55,.1);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(212,175,55,.2)}` }} />
        </div>
    );
};

export default AnalyticsView;
