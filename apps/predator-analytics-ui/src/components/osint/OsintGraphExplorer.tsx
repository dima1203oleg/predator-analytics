/**
 * 🕸️ PREDATOR OSINT Graph Explorer (v3.0 Advanced)
 *
 * Супер-просунута візуалізація графа зв'язків з лівою панеллю історії
 * та правою багатофункціональною панеллю досьє (Entity Profile).
 *
 * Всі тексти — українською (HR-03/HR-04)
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Target, User, Building2, MapPin, AlertOctagon, 
    ShieldAlert, Network, Download, RefreshCw, X, Link as LinkIcon, 
    AlertTriangle, History, Bookmark, FileText, Activity, ChevronDown
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Імпортуємо наш існуючий граф
import GraphViewer, { GraphNode, GraphEdge, NodeType } from '../graph/GraphViewer';

// ─── Симуляційна База Даних ──────────────────────────────────────────
const EXPANSION_DB: Record<string, { nodes: GraphNode[], edges: GraphEdge[] }> = {
    'c1': {
        nodes: [
            { id: 'p1', label: 'Іванов І.І.', type: 'Person', riskLevel: 'high', riskScore: 85, properties: { inn: '3123456789', role: 'Засновник', pass: 'СЕ123456' } },
            { id: 'p2', label: 'Петров П.П.', type: 'Person', riskLevel: 'low', riskScore: 20, properties: { inn: '2987654321', role: 'Директор', phone: '+380501234567' } },
            { id: 'l1', label: 'м. Київ, вул. Хрещова, 1', type: 'Location', riskLevel: 'minimal', riskScore: 0, properties: { type: 'Юридична адреса', index: '01001' } },
            { id: 'a1', label: 'Рахунок UA42...', type: 'Asset', riskLevel: 'minimal', riskScore: 0, properties: { bank: 'ПриватБанк', currency: 'UAH' } },
        ],
        edges: [
            { id: 'e1', source: 'p1', target: 'c1', type: 'OWNS', label: 'Володіє (60%)' },
            { id: 'e2', source: 'p2', target: 'c1', type: 'MANAGES', label: 'Керує' },
            { id: 'e3', source: 'c1', target: 'l1', type: 'REGISTERED_AT', label: 'Зареєстровано' },
            { id: 'e4', source: 'c1', target: 'a1', type: 'OWNS', label: 'Має рахунок' },
        ]
    },
    'p1': {
        nodes: [
            { id: 'c2', label: 'Offshore Holdings LLC', type: 'Organization', riskLevel: 'critical', riskScore: 98, properties: { edrpou: 'КІПР', status: 'Офшор', sanctions: 'РНБО' } },
            { id: 'p3', label: 'Сидоров С.С.', type: 'Person', riskLevel: 'high', riskScore: 90, properties: { inn: '3456789123', role: 'Партнер' } },
        ],
        edges: [
            { id: 'e5', source: 'p1', target: 'c2', type: 'CONTROLS', label: 'Бенефіціар' },
            { id: 'e6', source: 'p1', target: 'p3', type: 'RELATED_TO', label: 'Бізнес-зв\'язок' },
        ]
    },
    'c2': {
        nodes: [
            { id: 'ind1', label: 'Справа №123/45 (Відмивання)', type: 'Indicator', riskLevel: 'critical', riskScore: 100, properties: { type: 'Кримінал', status: 'Активна', court: 'Печерський суд' } },
            { id: 'l2', label: 'Кіпр, Лімасол', type: 'Location', riskLevel: 'high', riskScore: 75, properties: { type: 'Юрисдикція', tax: '0%' } },
        ],
        edges: [
            { id: 'e7', source: 'c2', target: 'ind1', type: 'INVOLVED_IN', label: 'Фігурант' },
            { id: 'e8', source: 'p1', target: 'ind1', type: 'INVOLVED_IN', label: 'Співучасник' },
            { id: 'e9', source: 'c2', target: 'l2', type: 'REGISTERED_AT', label: 'Зареєстровано' },
        ]
    }
};

const SAVED_TARGETS = [
    { id: 'c1', label: 'ТОВ "МЕГА БУД"', type: 'Organization', score: 65, date: '10 хв тому' },
    { id: 'p1', label: 'Іванов І.І.', type: 'Person', score: 85, date: '1 год тому' },
    { id: 'c3', label: 'БФ "Допомога"', type: 'Organization', score: 10, date: 'Вчора' },
];

// Іконки
const getNodeIcon = (type: NodeType, className = "w-5 h-5") => {
    switch (type) {
        case 'Person': return <User className={cn("text-blue-400", className)} />;
        case 'Organization': return <Building2 className={cn("text-emerald-400", className)} />;
        case 'Location': return <MapPin className={cn("text-amber-400", className)} />;
        case 'Asset': return <Target className={cn("text-pink-400", className)} />;
        case 'Indicator': return <AlertOctagon className={cn("text-red-400", className)} />;
        default: return <LinkIcon className={cn("text-slate-400", className)} />;
    }
};

export function OsintGraphExplorer() {
    // Стан графа
    const [nodes, setNodes] = useState<GraphNode[]>([{ id: 'c1', label: 'ТОВ "МЕГА БУД"', type: 'Organization', riskLevel: 'medium', riskScore: 65, properties: { edrpou: '38123456', status: 'Активно', address: 'м. Київ' } }]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);
    
    // Стан UI
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<NodeType | 'All'>('All');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [profileTab, setProfileTab] = useState<'overview' | 'docs' | 'relations'>('overview');

    // Розгортання графа
    const expandNode = useCallback((nodeId: string) => {
        if (!EXPANSION_DB[nodeId] || isExpanding) return;

        setIsExpanding(true);

        setTimeout(() => {
            const expansion = EXPANSION_DB[nodeId];
            const newNodes = expansion.nodes.filter(n => !nodes.some(extNode => extNode.id === n.id));
            const newEdges = expansion.edges.filter(e => !edges.some(extEdge => extEdge.id === e.id));

            setNodes(prev => [...prev, ...newNodes]);
            setEdges(prev => [...prev, ...newEdges]);
            setIsExpanding(false);
        }, 800);

    }, [nodes, edges, isExpanding]);

    // Скидання
    const resetGraph = useCallback(() => {
        setNodes([{ id: 'c1', label: 'ТОВ "МЕГА БУД"', type: 'Organization', riskLevel: 'medium', riskScore: 65, properties: { edrpou: '38123456', status: 'Активно', address: 'м. Київ' } }]);
        setEdges([]);
        setSelectedNode(null);
    }, []);

    // Глобальний пошук
    const handleGlobalSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        const newNode: GraphNode = {
            id: `new_${Date.now()}`,
            label: searchQuery,
            type: searchType === 'All' ? 'Organization' : searchType as NodeType,
            riskLevel: 'medium',
            riskScore: 50,
            properties: { source: 'Global Search', status: 'Unknown' }
        };
        
        setNodes([newNode]);
        setEdges([]);
        setSelectedNode(newNode);
        setSearchQuery('');
    };

    // Завантаження цілі з історії
    const loadTarget = (targetId: string) => {
        if (targetId === 'c1') {
            resetGraph();
        } else if (targetId === 'p1') {
            setNodes([{ id: 'p1', label: 'Іванов І.І.', type: 'Person', riskLevel: 'high', riskScore: 85, properties: { inn: '3123456789', role: 'Засновник', pass: 'СЕ123456' } }]);
            setEdges([]);
            setSelectedNode(null);
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-[#020617] text-slate-200">
            {/* ─── ЛІВА ПАНЕЛЬ: РОЗСЛІДУВАННЯ ──────────────────────── */}
            <div className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 z-20 shadow-2xl">
                <div className="p-4 border-b border-slate-800/60 bg-slate-900/50">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <History className="w-4 h-4 text-cyan-500" />
                        Ваші Розслідування
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {SAVED_TARGETS.map(target => (
                        <button 
                            key={target.id}
                            onClick={() => loadTarget(target.id)}
                            className="w-full text-left p-3 rounded-xl bg-slate-900/40 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 rounded-lg shadow-inner">
                                    {getNodeIcon(target.type as NodeType, "w-4 h-4")}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-200 truncate">{target.label}</div>
                                    <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{target.date}</div>
                                </div>
                                <div className={cn(
                                    "px-2 py-1 rounded text-[10px] font-black font-mono shadow-sm border",
                                    target.score >= 80 ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                    target.score >= 50 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                )}>
                                    {target.score}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <button className="w-full py-2.5 rounded-lg border border-dashed border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2">
                        <Bookmark className="w-4 h-4" />
                        Зберегти Поточний Граф
                    </button>
                </div>
            </div>

            {/* ─── ЦЕНТРАЛЬНА ЗОНА: ГРАФ & ПОШУК ───────────────────── */}
            <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.5),transparent_100%)]">
                {/* Advanced Search Bar */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[600px]">
                    <form 
                        onSubmit={handleGlobalSearch} 
                        className={cn(
                            "relative flex items-center bg-slate-900/90 backdrop-blur-xl border rounded-2xl shadow-2xl transition-all duration-300",
                            isSearchActive ? "border-cyan-500/50 shadow-cyan-500/10" : "border-slate-700"
                        )}
                    >
                        <div className="pl-4 pr-2 flex items-center border-r border-slate-700/50">
                            <select 
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value as any)}
                                className="bg-transparent text-xs font-bold text-slate-400 uppercase tracking-widest outline-none cursor-pointer appearance-none pr-4"
                            >
                                <option value="All">ВСІ</option>
                                <option value="Organization">КОМПАНІЇ</option>
                                <option value="Person">ФІЗИЧНІ ОСОБИ</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-500 -ml-3 pointer-events-none" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onFocus={() => setIsSearchActive(true)}
                            onBlur={() => setIsSearchActive(false)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Введіть ЄДРПОУ, ПІБ, IBAN або адресу..."
                            className="flex-1 bg-transparent py-4 px-4 text-sm text-white placeholder-slate-500 focus:outline-none"
                        />
                        <button type="submit" className="p-2 mr-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                {/* Toolbar */}
                <div className="absolute top-6 right-6 z-30 flex gap-2">
                    <button 
                        onClick={resetGraph}
                        className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md transition-colors tooltip group relative"
                    >
                        <RefreshCw className="h-5 w-5" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Скинути Граф</span>
                    </button>
                    <button className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md transition-colors group relative">
                        <Download className="h-5 w-5" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Експорт PDF</span>
                    </button>
                </div>

                {/* Graph Area */}
                <div className="flex-1 relative">
                    <GraphViewer 
                        nodes={nodes}
                        edges={edges}
                        onNodeClick={setSelectedNode}
                        onNodeDoubleClick={(node) => expandNode(node.id)}
                        selectedNodeId={selectedNode?.id}
                        height="100%"
                        showControls={true}
                    />
                </div>
            </div>

            {/* ─── ПРАВА ПАНЕЛЬ: ENTITY PROFILE (ДОСЬЄ В 3.0) ────────── */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 420, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="h-full bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 flex flex-col shrink-0 z-40 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] overflow-hidden relative"
                    >
                        {/* Glow effect at top based on risk */}
                        <div className={cn(
                            "absolute top-0 left-0 right-0 h-1",
                            selectedNode.riskLevel === 'critical' ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]' :
                            selectedNode.riskLevel === 'high' ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)]' :
                            selectedNode.riskLevel === 'medium' ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.8)]' :
                            'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]'
                        )} />

                        {/* Хедер досьє */}
                        <div className="p-6 pb-0 flex-shrink-0">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-inner">
                                        {getNodeIcon(selectedNode.type, "w-6 h-6")}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-1">
                                            {selectedNode.type === 'Person' ? 'Фізична Особа' : 
                                             selectedNode.type === 'Organization' ? 'Юридична Особа' : 
                                             selectedNode.type === 'Location' ? 'Геолокація' : 
                                             selectedNode.type === 'Asset' ? 'Актив' : 'Індикатор'}
                                        </div>
                                        <h2 className="text-xl font-black text-white leading-tight break-words pr-4">
                                            {selectedNode.label}
                                        </h2>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedNode(null)}
                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/50 text-slate-400 rounded-lg transition-colors mt-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Вкладки %} */}
                            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 shrink-0 mt-6 mb-4">
                                {[
                                    { id: 'overview', icon: Activity, label: 'ОГЛЯД' },
                                    { id: 'docs', icon: FileText, label: 'РЕЄСТРИ' },
                                    { id: 'relations', icon: Network, label: "ЗВ'ЯЗКИ" }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setProfileTab(tab.id as any)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 px-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                            profileTab === tab.id
                                                ? "bg-slate-800 text-white shadow p-0"
                                                : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Контент Досьє (Анімований Scroll) */}
                        <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {/* Вкладка ОГЛЯД */}
                                {profileTab === 'overview' && (
                                    <motion.div
                                        key="overview"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        {/* Score Widget */}
                                        <div className="flex items-center gap-5 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden">
                                            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-800/20 to-transparent pointer-events-none" />
                                            <div className="relative">
                                                <svg className="w-16 h-16 transform -rotate-90">
                                                    <circle cx="32" cy="32" r="28" fill="none" className="stroke-slate-800" strokeWidth="6" />
                                                    <circle 
                                                        cx="32" cy="32" r="28" fill="none" 
                                                        className={cn(
                                                            "transition-all duration-1000 ease-out",
                                                            selectedNode.riskLevel === 'critical' ? 'stroke-red-500' :
                                                            selectedNode.riskLevel === 'high' ? 'stroke-orange-500' :
                                                            selectedNode.riskLevel === 'medium' ? 'stroke-amber-500' :
                                                            'stroke-emerald-500'
                                                        )}
                                                        strokeWidth="6" 
                                                        strokeDasharray="175" 
                                                        strokeDashoffset={175 - (175 * (selectedNode.riskScore || 0)) / 100}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-white">
                                                    {selectedNode.riskScore || 0}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">OSINT Score</div>
                                                <div className={cn(
                                                    "text-lg font-bold leading-none",
                                                    selectedNode.riskLevel === 'critical' ? 'text-red-400' :
                                                    selectedNode.riskLevel === 'high' ? 'text-orange-400' :
                                                    selectedNode.riskLevel === 'medium' ? 'text-amber-400' :
                                                    'text-emerald-400'
                                                )}>
                                                    {selectedNode.riskLevel === 'critical' ? 'Критичний Ризик' : 
                                                     selectedNode.riskLevel === 'high' ? 'Високий Ризик' : 
                                                     selectedNode.riskLevel === 'medium' ? 'Підвищений Ризик' : 'Безпечно'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Кнопка Expand */}
                                        {EXPANSION_DB[selectedNode.id] && (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => expandNode(selectedNode.id)}
                                                disabled={isExpanding}
                                                className="w-full relative overflow-hidden group flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-4 rounded-xl font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] disabled:opacity-50"
                                            >
                                                {isExpanding ? (
                                                    <><RefreshCw className="w-5 h-5 animate-spin" /> АНАЛІЗУЄТЬСЯ...</>
                                                ) : (
                                                    <><Network className="w-5 h-5" /> РОЗГОРНУТИ В ГРАФІ</>
                                                )}
                                            </motion.button>
                                        )}

                                        {/* Properties */}
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                                                Базова Інформація
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {selectedNode.properties ? Object.entries(selectedNode.properties).map(([key, value], i) => (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        key={key} 
                                                        className={cn(
                                                            "bg-slate-900 border border-slate-800/80 rounded-xl p-3",
                                                            (key === 'address' || key === 'status') && "col-span-2" // ширші карточки
                                                        )}
                                                    >
                                                        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{key}</div>
                                                        <div className="text-sm font-bold text-slate-200">{String(value)}</div>
                                                    </motion.div>
                                                )) : (
                                                    <div className="col-span-2 text-sm text-slate-500 italic px-4 py-6 text-center bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                                                        Дані відсутні
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Вкладка РЕЄСТРИ */}
                                {profileTab === 'docs' && (
                                    <motion.div
                                        key="docs"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-4"
                                    >
                                        {selectedNode.type === 'Organization' || selectedNode.type === 'Person' ? (
                                            <>
                                                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-4">
                                                    <div className="p-2 bg-slate-800 rounded-lg shrink-0 mt-0.5"><Building2 className="w-4 h-4 text-emerald-400" /></div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white mb-1">ЄДР Виписка</div>
                                                        <div className="text-xs text-slate-400 mb-2">Оновлено сьогодні (Міністерство Юстиції)</div>
                                                        <button className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300">Переглянути →</button>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-slate-900 border border-red-900/50 bg-red-950/20 rounded-xl flex items-start gap-4">
                                                    <div className="p-2 bg-red-900/50 rounded-lg shrink-0 mt-0.5"><ShieldAlert className="w-4 h-4 text-red-500" /></div>
                                                    <div>
                                                        <div className="text-sm font-bold text-red-200 mb-1">Реєстр Божників</div>
                                                        <div className="text-xs text-red-400/80 mb-2">Знайдено 2 записи про стягнення коштів (ДВС)</div>
                                                        <button className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-300">Деталі Боргу →</button>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-4">
                                                    <div className="p-2 bg-indigo-900/30 rounded-lg shrink-0 mt-0.5"><History className="w-4 h-4 text-indigo-400" /></div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white mb-1">YouControl Досьє</div>
                                                        <div className="text-xs text-slate-400 mb-2">Синхронізовано через API (Кеш 24г)</div>
                                                        <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300">Відкрити Аналітику →</button>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-10 text-slate-500 text-sm">Реєстри доступні лише для Компаній та Осіб</div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Вкладка ЗВ'ЯЗКИ */}
                                {profileTab === 'relations' && (
                                    <motion.div
                                        key="relations"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Відомі зв'язки (1-го рівня)</div>
                                        {EXPANSION_DB[selectedNode.id]?.edges.map((edge, i) => {
                                            const targetNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
                                            const targetNode = EXPANSION_DB[selectedNode.id]?.nodes.find(n => n.id === targetNodeId) || nodes.find(n => n.id === targetNodeId);
                                            
                                            // Fallback label if node is not found purely in this mock
                                            const displayLabel = targetNode?.label || `Вузол ${targetNodeId}`;
                                            const displayType = targetNode?.type || 'Person';

                                            return (
                                            <div key={edge.id} className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center gap-3 transition-colors cursor-pointer" onClick={() => expandNode(selectedNode.id)}>
                                                <div className="p-2 bg-slate-950 rounded-lg">
                                                    <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">{edge.label}</div>
                                                    <div className="text-sm font-bold text-slate-200 truncate flex items-center gap-1.5">
                                                        {getNodeIcon(displayType as NodeType, "w-3 h-3")} {displayLabel}
                                                    </div>
                                                </div>
                                            </div>
                                        )})}
                                        {!EXPANSION_DB[selectedNode.id] && (
                                             <div className="text-center py-10 text-slate-500 text-sm italic border border-dashed border-slate-800 rounded-xl">Не знайдено зв'язків для розгорнення</div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default OsintGraphExplorer;
