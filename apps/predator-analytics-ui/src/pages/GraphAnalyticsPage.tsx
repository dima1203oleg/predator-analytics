/**
 * 🕸️ PREDATOR Cognitive Graph Analytics | v62.7-ELITE
 * СИСТЕМА ГЛИБИННОГО Г АФОВОГО АНАЛІЗУ (GNN)
 * 
 * Візуалізація та аналіз складних взаємозв'язків між суб'єктами.
 * Sovereign Elite Design System · Crimson-Noir Palette · Tier-1 Strategic Access
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Network, Filter, Search, Share2, Download, Settings, 
    Zap, Brain, Shield, Target, Cpu, Activity, Database,
    Maximize2, Minimize2, ChevronRight, Info, Layers, Workflow,
    RefreshCw, ZoomIn, ZoomOut, MousePointer2, Box, Eye,
    Trash2, Save, FileText, AlertTriangle, TrendingUp, Sparkles,
    Circle, Square, Triangle, Terminal, Radio, Binary, Fingerprint,
    ListFilter, MoreVertical, LayoutGrid, LayoutList
} from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { HoloContainer } from '@/components/HoloContainer';
import { useAppStore } from '@/store/useAppStore';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { CyberOrb } from '@/components/CyberOrb';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// ========================
// Types
// ========================

interface GraphNode {
    id: string;
    label: string;
    type: 'COMPANY' | 'PERSON' | 'IP' | 'TRANSACTION' | 'ASSET';
    val: number;
    risk?: number;
    details?: any;
}

interface GraphLink {
    source: string;
    target: string;
    type: 'OWNER' | 'DIRECTOR' | 'LINKED' | 'TRANSFER' | 'NETWORK';
    weight?: number;
}

// ========================
// Sub-Components
// ========================

/**
 * Node Detail Panel (Sidebar)
 */
const NodeDetailPanel: React.FC<{ node: GraphNode | null; onClose: () => void }> = ({ node, onClose }) => {
    if (!node) return null;

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute top-0 right-0 h-full w-[450px] bg-slate-900/90 backdrop-blur-3xl border-l border-white/10 z-50 p-10 flex flex-col shadow-[-20px_0_100px_rgba(0,0,0,0.8)]"
        >
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-5">
                    <div className={cn(
                        "p-4 rounded-2xl",
                        node.type === 'COMPANY' ? "bg-[#D4AF37]/20 text-[#D4AF37]" :
                        node.type === 'PERSON' ? "bg-rose-500/20 text-rose-400" :
                        "bg-white/10 text-slate-400"
                    )}>
                        <Box size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">{node.label}</h3>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">ID: {node.id}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-white">
                    <Minimize2 size={20} />
                </button>
            </div>

            <div className="flex-1 space-y-10 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-black/40 border border-white/5 rounded-[2rem]">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">РІВЕНЬ РИЗИКУ</p>
                        <div className="flex items-center gap-3">
                            <div className="text-3xl font-mono font-black text-rose-500 italic">{(node.risk || 0.12 * 100).toFixed(0)}%</div>
                            <TrendingUp size={16} className="text-rose-500 animate-pulse" />
                        </div>
                    </div>
                    <div className="p-6 bg-black/40 border border-white/5 rounded-[2rem]">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">ІНДЕКС ЗВ'ЯЗНОСТІ</p>
                        <div className="text-3xl font-mono font-black text-[#D4AF37] italic">0.94</div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic flex items-center gap-3 border-l-2 border-red-600 pl-4">
                        СТРАТЕГІЧНИЙ П ОФІЛЬ
                    </h4>
                    <pre className="p-8 bg-black/60 border border-white/5 rounded-[2.5rem] text-[12px] text-red-500 font-mono italic leading-relaxed whitespace-pre-wrap shadow-[inset_0_0_20px_rgba(220,38,38,0.05)]">
                        {`{
  "industry": "Strategic Maritime Infrastructure",
  "sanctions_check": "VERIFIED_CLEAR",
  "last_audit": "2026-04-20",
  "anomaly_score": 0.0012,
  "nexus_role": "STRATEGIC_HUB",
  "shadow_risk": "MINIMAL",
  "cognitive_flags": ["ULTRA_STABILITY", "OODA_MAX_SYNC"]
}`}
                    </pre>
                </div>

                <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic flex items-center gap-3 border-l-2 border-[#D4AF37] pl-4">
                        АКТИВНІ ЗВ'ЯЗКИ
                    </h4>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="group p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-between hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-red-500 transition-colors">
                                        <Share2 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase">ТЕХНО-МАСТЕ  ТОВ</p>
                                        <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">ЧЕ ЕЗ: УЧАСНИК</p>
                                    </div>
                                </div>
                                <div className="text-xs font-mono font-black text-red-500">92%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button className="mt-10 w-full py-6 bg-rose-600 hover:bg-rose-500 text-white rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-3xl shadow-rose-900/40 transition-all active:scale-95 flex items-center justify-center gap-4">
               <Fingerprint size={16} /> ПЕ ЕЙТИ ДО ПОВНОГО ЗВІТУ
            </button>
        </motion.div>
    );
};

// ========================
// Main Component
// ========================

const GraphAnalyticsPage: React.FC = () => {
    const { userRole } = useAppStore();
    const { isOffline, nodeSource } = useBackendStatus();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [activeAlgorithm, setActiveAlgorithm] = useState<'Pagerank' | 'Louvain' | 'Pathfinding'>('Pagerank');

    useEffect(() => {
        if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'GraphGNN',
                    message: `АВТОНОМНИЙ Г АФ [${nodeSource}]: Виявлення зв'язків через локальний Mirror Vault. Аналіз GNN обмежений.`,
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'GRAPH_OFFLINE'
                }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'GraphGNN',
                    message: `Г АФОВИЙ_ВУЗОЛ [${nodeSource}]: Нейронну топологію синхронізовано. Готовність до обчислень L5.`,
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'GRAPH_SUCCESS'
                }
            }));
        }
    }, [isOffline, nodeSource]);

    const toggleLoading = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 1500);
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(212, 175, 55, 0.08)" />

                <div className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-8 lg:p-12 space-y-12">
                    
                    {/* Integrated Strategic Header */}
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-8">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full scale-150 animate-pulse opacity-40" />
                                    <div className="relative p-6 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl transition-all group-hover:scale-105 group-hover:border-red-600/40">
                                        <Network size={36} className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-5xl font-black text-white tracking-widest uppercase leading-none font-display italic skew-x-[-2deg]">
                                        COGNITIVE <span className="text-red-600">GRAPH</span>
                                    </h1>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="h-0.5 w-12 bg-red-600/50" />
                                        <span className="text-[10px] font-mono font-black text-red-500/80 uppercase tracking-[0.5em] animate-pulse">
                                            NEURAL_TOPOLOGY_ANALYZER // v62.7-ELITE
                                        </span>
                                    </div>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'ВУЗЛІВ ОП АЦЬОВАНО', value: '1.2M+', color: 'primary', icon: <Database size={14} />, animate: true },
                            { label: 'К ИТИЧНІСТЬ МЕ ЕЖІ', value: '0.92', color: 'success', icon: <Share2 size={14} /> },
                            { label: 'NODE_SOURCE', value: nodeSource, color: isOffline ? 'warning' : 'success', icon: <Cpu size={14} /> },
                            { label: 'LATENCY (OODA)', value: '8ms', color: 'warning', icon: <Zap size={14} />, animate: true }
                        ]}
                        breadcrumbs={['ЯДРО', 'Г АФОВА_МАТ ИЦЯ', 'STRATEGIC_OSINT']}
                    />

                    <div className="grid grid-cols-12 gap-10">
                        
                        {/* Main Graph Playground */}
                        <div className="col-span-12 xl:col-span-9 space-y-10">
                            <TacticalCard 
                                variant="holographic" 
                                className="h-[800px] overflow-hidden relative group/graph shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
                                noPadding
                            >
                                {/* Graph HUD - Top Bar */}
                                <div className="absolute top-10 left-10 z-20 flex items-center gap-10">
                                     <div className="flex bg-black/60 backdrop-blur-2xl p-2 rounded-[2rem] border border-white/5 shadow-2xl">
                                         {['Pagerank', 'Louvain', 'Pathfinding'].map(alg => (
                                             <button 
                                                key={alg}
                                                onClick={() => { setActiveAlgorithm(alg as any); toggleLoading(); }}
                                                className={cn(
                                                    "px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                                                    activeAlgorithm === alg ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]" : "text-slate-500 hover:text-slate-200"
                                                )}
                                             >
                                                {alg}
                                             </button>
                                         ))}
                                     </div>

                                     <div className="flex gap-4">
                                        <button className="p-4 bg-black/60 rounded-2xl border border-white/5 text-slate-500 hover:text-indigo-400 transition-all"><Search size={18} /></button>
                                        <button className="p-4 bg-black/60 rounded-2xl border border-white/5 text-slate-500 hover:text-emerald-400 transition-all"><Filter size={18} /></button>
                                     </div>
                                </div>

                                {/* Graph HUD - Right Controls */}
                                <div className="absolute right-10 bottom-10 z-20 flex flex-col gap-4">
                                     {[
                                        { icon: ZoomIn, label: 'ZOOM_IN' },
                                        { icon: ZoomOut, label: 'ZOOM_OUT' },
                                        { icon: Maximize2, label: 'FS' },
                                        { icon: RefreshCw, label: 'RESET', rotate: true }
                                     ].map(ctrl => (
                                         <button key={ctrl.label} className="p-5 bg-black/60 backdrop-blur-3xl rounded-3xl border border-white/5 text-slate-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all group/btn shadow-2xl">
                                             <ctrl.icon size={22} className={cn("transition-transform group-hover/btn:scale-110", ctrl.rotate && "group-hover/btn:rotate-180 duration-500")} />
                                         </button>
                                     ))}
                                </div>

                                {/* Graph Rendering Simulation */}
                                <div className="absolute inset-0 z-0">
                                     <AdvancedBackground />
                                     <CyberGrid color="rgba(99, 102, 241, 0.05)" />
                                     
                                     {/* Simulated Graph Nodes */}
                                     {isLoading ? (
                                         <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">
                                             <div className="relative">
                                                 <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
                                                 <CyberOrb size={220} color="#6366f1" intensity={0.9} pulse />
                                                 <div className="absolute inset-0 flex items-center justify-center">
                                                     <Brain size={64} className="text-white animate-pulse" />
                                                 </div>
                                             </div>
                                             <div className="text-center space-y-4">
                                                <h3 className="text-2xl font-black text-white px-10 uppercase tracking-[0.6em] animate-pulse italic leading-none">НЕЙ О- ЕНДЕ ИНГ</h3>
                                                <p className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest">ОБ АХУНОК_АЛГО ИТМУ_{activeAlgorithm.toUpperCase()}...</p>
                                             </div>
                                         </div>
                                     ) : (
                                         <div className="w-full h-full relative cursor-crosshair overflow-hidden" onClick={() => setSelectedNode({ id: '1234', label: 'УК -ОБО ОН-ЕКСПОРТ', type: 'COMPANY', val: 100, risk: 0.88 })}>
                                             {/* Abstract connection lines */}
                                             <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                                                 <line x1="20%" y1="20%" x2="50%" y2="50%" stroke="white" strokeWidth="0.5" strokeDasharray="10 5" />
                                                 <line x1="80%" y1="30%" x2="50%" y2="50%" stroke="white" strokeWidth="0.5" />
                                                 <line x1="40%" y1="80%" x2="50%" y2="50%" stroke="white" strokeWidth="0.5" strokeDasharray="5 5" />
                                                 <line x1="20%" y1="20%" x2="10%" y2="40%" stroke="white" strokeWidth="0.5" />
                                             </svg>

                                             {/* Simulated Nodes */}
                                             <motion.div 
                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                             >
                                                 <div className="relative p-12 group/main hover:scale-110 transition-transform">
                                                     <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full group-hover/main:blur-[120px] transition-all" />
                                                     <div className="relative w-32 h-32 bg-slate-900 border-4 border-indigo-500 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.5)]">
                                                         <Shield size={48} className="text-indigo-400 group-hover:scale-110 transition-transform duration-500" />
                                                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-500 text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl">ЦЕНТ АЛЬНИЙ ВУЗОЛ</div>
                                                     </div>
                                                 </div>
                                             </motion.div>

                                             {/* Satellite nodes */}
                                             {[
                                                 { pos: 'top-[20%] left-[20%]', icon: Box, color: 'text-emerald-400', label: 'ЛОГІСТИКА-А' },
                                                 { pos: 'top-[30%] left-[80%]', icon: Target, color: 'text-rose-400', label: 'РИЗИК-ФАКТО ' },
                                                 { pos: 'bottom-[20%] left-[40%]', icon: Cpu, color: 'text-amber-400', label: 'ТЕХНО-ХАБ' }
                                             ].map((sat, i) => (
                                                 <motion.div 
                                                    key={i}
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.2 }}
                                                    className={cn("absolute group/sat hover:scale-110 transition-all", sat.pos)}
                                                 >
                                                     <div className="relative p-6">
                                                         <div className="absolute inset-0 bg-white/5 blur-3xl opacity-0 group-hover/sat:opacity-100 transition-opacity" />
                                                         <div className="relative w-16 h-16 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-xl group-hover:border-white/30">
                                                             <sat.icon size={28} className={sat.color} />
                                                             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">
                                                                 {sat.label}
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </motion.div>
                                             ))}

                                             {/* Graph Legend */}
                                             <div className="absolute bottom-10 left-10 z-20 flex gap-8 items-center bg-black/40 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">КОМПАНІЇ</span>
                                                 </div>
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-3 h-3 rounded-full bg-slate-500 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ОСОБИ</span>
                                                 </div>
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-3 h-3 rounded-full bg-red-600/30 shadow-[0_0_10px_rgba(220,38,38,0.3)]" />
                                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Т АНЗАКЦІЇ</span>
                                                 </div>
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.7)]" />
                                                     <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">CRITICAL_THREAT</span>
                                                 </div>
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ВИСОКИЙ РИЗИК</span>
                                                 </div>
                                             </div>
                                         </div>
                                     )}
                                 </div>

                                <AnimatePresence>
                                    {selectedNode && <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />}
                                </AnimatePresence>
                            </TacticalCard>

                            {/* Additional Intelligence Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <HoloContainer className="p-10 h-[450px] relative overflow-hidden group">
                                     <div className="flex items-center justify-between mb-8">
                                         <div className="flex items-center gap-4">
                                             <div className="p-3 bg-red-600/20 rounded-xl">
                                                 <Activity size={20} className="text-red-500" />
                                             </div>
                                             <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] italic leading-none">СТРАТЕГІЧНИЙ_АНАЛІЗ_v62</h3>
                                         </div>
                                         <Badge className="bg-red-600 text-white px-4 rounded-lg uppercase tracking-widest text-[9px] font-black italic shadow-[0_0_10px_rgba(220,38,38,0.5)]">ELITE_ANALYZER</Badge>
                                     </div>
                                     
                                     <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-4">
                                         {[
                                            { label: 'К ИТИЧНІСТЬ_КЛАСТЕ У', val: 0.84, color: 'bg-indigo-500' },
                                            { label: 'ІНДЕКС_ІЗОЛЯЦІЇ', val: 0.12, color: 'bg-emerald-500' },
                                            { label: 'РИЗИК_КОНТАМІНАЦІЇ', val: 0.45, color: 'bg-amber-500' },
                                            { label: 'ШЛЯХ_OODA', val: 0.99, color: 'bg-rose-500' }
                                         ].map(stat => (
                                             <div key={stat.label} className="space-y-3">
                                                 <div className="flex justify-between items-center px-1">
                                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</span>
                                                     <span className="text-sm font-mono font-black text-white italic">{(stat.val * 100).toFixed(0)}%</span>
                                                 </div>
                                                 <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                                                     <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${stat.val * 100}%` }}
                                                        className={cn("h-full rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]", stat.color)}
                                                     />
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                </HoloContainer>

                                <TacticalCard variant="cyber" className="p-10 h-[450px] border-indigo-500/20 relative overflow-hidden group/ops">
                                     <div className="flex items-center justify-between mb-10">
                                         <div className="flex items-center gap-4">
                                             <div className="p-3 bg-amber-500/20 rounded-xl">
                                                 <Terminal size={20} className="text-amber-400" />
                                             </div>
                                             <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] italic leading-none">ЛОГ_Г АФОВИХ_ОПЕРАЦІЙ</h3>
                                         </div>
                                         <span className="text-amber-500 animate-pulse"><Radio size={18} /></span>
                                     </div>

                                     <div className="space-y-6 font-mono text-[11px] flex-1 overflow-y-auto no-scrollbar pr-4 text-emerald-500/80 italic">
                                         <p className="border-l border-white/10 pl-4 py-1 hover:text-white transition-colors">{">> "} ПЕ ЕВІ КА ВУЗЛА 1234:5678... [OK]</p>
                                         <p className="border-l border-white/10 pl-4 py-1 hover:text-white transition-colors">{">> "} ВИЯВЛЕНОПРИХОВАНУ ОБЛАСТЬ ЗВ'ЯЗКІВ L2</p>
                                         <p className="border-l border-indigo-500 pl-4 py-1 text-indigo-400 font-black uppercase">{">> "} ЗАПУСК PAGERANK_OPTIMIZED_v58.2-WRAITH</p>
                                         <p className="border-l border-white/10 pl-4 py-1 hover:text-white transition-colors">{">> "} МОДЕЛЬ_GNN: ВАХ_СКО  = 0.9984</p>
                                         <p className="border-l border-amber-500 pl-4 py-1 text-amber-500">{">> "} УВАГА: АНОМАЛЬНИЙ Т АФІК У КЛАСТЕ І "B-12"</p>
                                         <p className="border-l border-white/10 pl-4 py-1 hover:text-white transition-colors">{">> "} А ХІВАЦІЯ СНАПШОТУ Г АФА... [ЗАВЕ ШЕНО]</p>
                                     </div>
                                     
                                     <div className="absolute -right-20 -bottom-20 opacity-[0.03] group-hover/ops:opacity-[0.08] transition-opacity">
                                         <Binary size={320} className="text-indigo-400" />
                                     </div>
                                </TacticalCard>
                            </div>
                        </div>

                        {/* Sidebar Analytics */}
                        <div className="col-span-12 xl:col-span-3 space-y-10">
                             <HoloContainer className="p-10 bg-[#030712]/90 border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-4 opacity-5">
                                     <Fingerprint size={120} className="text-red-600" />
                                 </div>
                                 <div className="flex items-center gap-5 mb-10 border-b border-white/5 pb-8">
                                     <div className="p-4 bg-red-600/10 rounded-2xl">
                                         <Target size={24} className="text-red-500" />
                                     </div>
                                     <div>
                                         <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">ТОП КЛАСТЕ И</h4>
                                         <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest italic">ЗА ІНДЕКСОМ В АЗЛИВОСТІ</p>
                                     </div>
                                 </div>

                                 <div className="space-y-6">
                                     {[
                                         { name: 'Транзит-Груп-Еліта', risk: 0.98, impact: 'HIGH', label: 'L5' },
                                         { name: 'Офшорні Кореляції', risk: 0.85, impact: 'HIGH', label: 'SHADOW' },
                                         { name: 'Крит-Імпорт-UA', risk: 0.12, impact: 'LOW', label: 'CORE' },
                                         { name: 'ВПК Постачання', risk: 0.44, impact: 'MED', label: 'L3' }
                                     ].map(cluster => (
                                         <div key={cluster.name} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all group/cl">
                                             <div className="flex justify-between items-start mb-4">
                                                  <div className="flex items-center gap-4">
                                                      <div className="p-3 bg-slate-900 rounded-xl group-hover/cl:text-red-500 transition-colors">
                                                          <Workflow size={14} />
                                                      </div>
                                                      <span className="text-[10px] font-black text-white uppercase italic">{cluster.name}</span>
                                                  </div>
                                                  <Badge className={cn(
                                                      "text-[8px] border-none px-3 py-1 font-black shadow-sm",
                                                      cluster.impact === 'HIGH' ? "bg-red-600 text-white" : "bg-white/10 text-slate-400"
                                                  )}>{cluster.impact}</Badge>
                                             </div>
                                             <div className="flex items-center justify-between">
                                                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mr-4 border border-white/5">
                                                      <div className={cn("h-full", cluster.risk > 0.8 ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "bg-red-400")} style={{ width: `${cluster.risk * 100}%` }} />
                                                  </div>
                                                  <span className="text-xs font-mono font-black text-white italic">{cluster.label}</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </HoloContainer>

                             <TacticalCard variant="glass" className="p-10 border border-white/10 rounded-[3rem] overflow-hidden relative group/diag">
                                 <div className="flex items-center gap-5 mb-10">
                                     <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover/diag:animate-pulse">
                                         <Radio size={24} className="text-emerald-400" />
                                     </div>
                                     <div>
                                         <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">ДІАГНОСТИКА_ЯД А</h4>
                                         <p className="text-[8px] font-mono text-slate-600 mt-2 uppercase tracking-widest italic">GRAPH_LATENCY_v8.1</p>
                                     </div>
                                 </div>

                                 <div className="space-y-6">
                                     <div className="flex flex-col gap-3">
                                         <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest italic px-2">
                                             <span>ПАМ'ЯТЬ NEO4J</span>
                                             <span className="text-white">64.4GB / 128GB</span>
                                         </div>
                                         <div className="h-10 bg-black/40 rounded-2xl flex items-center px-4 border border-white/5">
                                              <NeuralPulse color="#10b981" />
                                              <div className="flex-1 ml-4 flex gap-1">
                                                  {[...Array(20)].map((_, i) => (
                                                      <div key={i} className={cn("h-3 w-1.5 rounded-full", i < 12 ? "bg-emerald-500/60" : "bg-white/10")} />
                                                  ))}
                                              </div>
                                         </div>
                                     </div>
                                     
                                     <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] flex items-center justify-between">
                                          <div className="flex items-center gap-4">
                                               <Cpu size={18} className="text-indigo-400" />
                                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">CPU_THREADS_v58.2-WRAITH</span>
                                          </div>
                                          <span className="text-xl font-mono font-black text-white italic tracking-tighter">X256</span>
                                     </div>
                                 </div>

                                 <button className="w-full mt-10 py-6 border border-white/10 rounded-[2rem] text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-4 group active:scale-95">
                                      <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" /> ПЕ ЕЗАВАНТАЖИТИ_ГЕОМЕТ ІЮ
                                 </button>
                             </TacticalCard>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                        .font-display {
                            font-family: 'Inter', sans-serif;
                            letter-spacing: -0.05em;
                        }
                        .panel-3d {
                            transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
                        }
                        .panel-3d:hover {
                            transform: translateY(-10px) scale(1.01);
                            box-shadow: 0 60px 120px -30px rgba(0, 0, 0, 0.9), 0 0 40px rgba(79, 70, 229, 0.15);
                        }
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                `}} />
            </div>
        </PageTransition>
    );
};

export default GraphAnalyticsPage;

