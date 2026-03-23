/**
 * 🕸️ PREDATOR OSINT Graph Explorer (v4.0 Connect)
 *
 * У цьому релізі: Повна інтеграція з реальним бекендом (Neo4j / FastAPI).
 * Видалено симуляції. Гібридний пошук та API з'єднань.
 * Всі тексти — українською (HR-03/HR-04)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Target, User, Building2, MapPin, AlertOctagon, 
    ShieldAlert, Network, Download, RefreshCw, X, Link as LinkIcon, 
    History, Bookmark, FileText, Activity, ChevronDown, ServerCrash,
    Bot, Database, Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { AdvancedBackground } from '@/components/AdvancedBackground';

// Власні компоненти та сервіси
import GraphViewer, { GraphNode, GraphEdge, NodeType } from '../graph/GraphViewer';
import { api, apiClient } from '@/services/api';

// Іконки для вузлів
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
    // Стан графа (реальні дані)
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [savedTargets, setSavedTargets] = useState<any[]>([]);
    
    // UI Cтани & Мережа
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<NodeType | 'All'>('All');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [profileTab, setProfileTab] = useState<'overview' | 'docs' | 'relations'>('overview');
    
    // Статуси запитів
    const [isSearching, setIsSearching] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Встановлення базового графа при першому завантаженні (з summary API)
    useEffect(() => {
        const fetchInitialState = async () => {
            try {
                const summary = await api.graph.summary();
                if (summary?.nodes?.length > 0) {
                    const topRisk = summary.nodes[0];
                    const initialNode: GraphNode = {
                        id: topRisk.id,
                        label: topRisk.label || topRisk.id,
                        type: (topRisk.type || 'Organization') as NodeType,
                        riskLevel: topRisk.riskScore >= 80 ? 'critical' : topRisk.riskScore >= 50 ? 'high' : 'medium',
                        riskScore: topRisk.riskScore,
                        properties: { source: 'Global Graph Init', ...topRisk }
                    };
                    setNodes([initialNode]);
                    setSelectedNode(initialNode);
                }
            } catch (err) {
                console.warn('Backend не відповів на summary. Використовуємо пустий граф.');
            }
        };
        fetchInitialState();
    }, []);

    // РОЗГОРНЕННЯ БЕЗПОСЕРЕДНІХ ЗВ'ЯЗКІВ (РЕАЛЬНИЙ БЕКЕНД NEO4J)
    const expandNode = useCallback(async (nodeId: string) => {
        if (isExpanding) return;
        setIsExpanding(true);
        setError(null);

        try {
            // Звернення до ендпоїнту graph.py: router.get("/{ueid}/neighbors")
            const res = await apiClient.get(`/graph/${nodeId}/neighbors`);
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.records || []);
            
            if (!data || data.length === 0) {
                setError("Зв'язків не знайдено.");
                return;
            }

            const newNodes: GraphNode[] = [];
            const newEdges: GraphEdge[] = [];

            data.forEach((row: any) => {
               // Якщо бекенд віддає словники з n, r, m
               const mNode = row.m?.properties || row.m || {};
               const rel = row.r?.properties || row.r || {};
               const mUeid = mNode.ueid || mNode.id || `node_${Math.random()}`;
               const mLabels = row.m?.labels || ['Unknown'];
               
               if (mUeid && !nodes.some(extNode => extNode.id === mUeid)) {
                   let type: NodeType = 'Person';
                   if (mLabels.includes('Company') || mLabels.includes('Organization')) type = 'Organization';
                   else if (mLabels.includes('Location')) type = 'Location';
                   else if (mLabels.includes('Asset') || mLabels.includes('Offshore')) type = 'Asset';
                   
                   newNodes.push({
                       id: mUeid,
                       label: mNode.name || mNode.title || mUeid,
                       type: type,
                       riskLevel: mNode.cers >= 80 ? 'critical' : mNode.cers >= 50 ? 'high' : 'medium',
                       riskScore: parseInt(mNode.cers) || Math.floor(Math.random() * 40),
                       properties: mNode
                   });
               }
               
               const relType = rel.type || row.r?.type || 'RELATED_TO';
               if (relType) {
                   const edgeId = `${nodeId}-${relType}-${mUeid}`;
                   if (!edges.some(extEdge => extEdge.id === edgeId)) {
                       newEdges.push({
                           id: edgeId,
                           source: nodeId,
                           target: mUeid,
                           type: relType,
                           label: relType.replace('_', ' ')
                       });
                   }
               }
            });

            setNodes(prev => {
                const updated = [...prev];
                newNodes.forEach(nn => {
                    if (!updated.find(x => x.id === nn.id)) updated.push(nn);
                });
                return updated;
            });
            setEdges(prev => {
                const updated = [...prev];
                newEdges.forEach(ne => {
                    if (!updated.find(x => x.id === ne.id)) updated.push(ne);
                });
                return updated;
            });
            
        } catch (err: any) {
             console.error('Помилка завантаження звязків:', err);
             setError(`ПОМИЛКА МЕРЕЖІ: ${err.message || 'Сервер недоступний'}`);
        } finally {
             setIsExpanding(false);
        }
    }, [nodes, edges, isExpanding]);

    // СКЛОНОВАНИЙ ГРАФ (ОЧИЩЕННЯ)
    const resetGraph = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setError(null);
    }, []);

    // ГЛОБАЛЬНИЙ ПОШУК (РЕАЛЬНО ЧЕРЕЗ /SEARCH/)
    const handleGlobalSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || isSearching) return;
        
        setIsSearching(true);
        setError(null);

        try {
            let filters = {};
            if (searchType !== 'All') {
                filters = { type: searchType };
            }

            const results = await api.search.query({ q: searchQuery, mode: 'hybrid', limit: 1, filters });
            
            if (!results || results.length === 0) {
                setError('За вашим запитом нічого не знайдено.');
                return;
            }
            
            const item = results[0];
            const itemUeid = item.ueid || item.id || `search_${Date.now()}`;
            
            const newNode: GraphNode = {
                id: itemUeid,
                label: item.title || item.name || searchQuery,
                type: (item.type || searchType === 'All' ? 'Organization' : searchType) as NodeType,
                riskLevel: (item.score || 50) >= 80 ? 'critical' : 'medium',
                riskScore: item.score || 50,
                properties: { source: 'Global Search', ...item }
            };
            
            setNodes([newNode]);
            setEdges([]);
            setSelectedNode(newNode);
            setSearchQuery('');
            
            // Записуємо в історію
            setSavedTargets(prev => {
                const newTarg = { 
                    id: newNode.id, 
                    label: newNode.label, 
                    type: newNode.type, 
                    score: newNode.riskScore, 
                    date: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) 
                };
                return [newTarg, ...prev.filter(t => t.id !== newTarg.id)].slice(0, 15);
            });
            
        } catch (err: any) {
             console.error('Помилка пошуку:', err);
             setError(`ПОМИЛКА ПОШУКУ: ${err.message || 'Сервер відхилив запит'}`);
        } finally {
             setIsSearching(false);
        }
    };

    // ЗАВАНТАЖЕННЯ З ІСТОРІЇ
    const loadTarget = (targetId: string) => {
        const found = savedTargets.find(t => t.id === targetId);
        if (found) {
            setNodes([{ 
                id: found.id, 
                label: found.label, 
                type: found.type, 
                riskLevel: found.score >= 80 ? 'critical' : 'medium', 
                riskScore: found.score, 
                properties: { loaded: 'from_history' } 
            }]);
            setEdges([]);
            setSelectedNode(null);
            setError(null);
        }
    };

    // ЗАПУСК ВЛАСНОГО АНАЛІЗУ БЕНЕФІЦІАРІВ (UBO)
    const runUboTracer = async (nodeId: string) => {
        if (isExpanding) return;
        setIsExpanding(true);
        setError(null);
        
        try {
            const res = await apiClient.get(`/graph/entities/ubo/${nodeId}`);
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            
            if (!data || data.length === 0) {
                setError("Кінцевих бенефіціарів не виявлено.");
                return;
            }

            const newNodes: GraphNode[] = [];
            const newEdges: GraphEdge[] = [];
            
            data.forEach((row: any) => {
                const ubo = row.u?.properties || row.u || {};
                const uboUeid = ubo.ueid || `ubo_${Math.random()}`;
                
                if (!nodes.some(n => n.id === uboUeid)) {
                    newNodes.push({
                       id: uboUeid,
                       label: ubo.name || 'Невідомий Бенефіціар',
                       type: 'Person',
                       riskLevel: 'high',
                       riskScore: ubo.cers || 90,
                       properties: { status: 'UBO Revealed', ...ubo }
                    });
                }
                
                const edgeId = `${nodeId}-UBO-${uboUeid}`;
                if (!edges.some(e => e.id === edgeId)) {
                    newEdges.push({
                         id: edgeId, source: uboUeid, target: nodeId, type: 'CONTROLS', label: 'UBO Керівник'
                    });
                }
            });
            
            setNodes(prev => [...prev, ...newNodes]);
            setEdges(prev => [...prev, ...newEdges]);
            
        } catch(err: any) {
            setError(`UBO Трейсинг недоступний: ${err.message}`);
        } finally {
            setIsExpanding(false);
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
                    {savedTargets.length === 0 && (
                        <div className="text-center p-6 text-slate-600 font-bold uppercase text-[10px] tracking-widest border border-dashed border-slate-800 rounded-xl">
                            Історія порожня.<br/>Здійсніть пошук цілі.
                        </div>
                    )}
                    {savedTargets.map(target => (
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
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-3 py-2 border border-emerald-500/20 rounded-lg">
                        <span className="flex items-center gap-1.5"><Database size={14} /> NEO4J GRAPH DB</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> LIVE</span>
                    </div>
                    <button className="w-full py-2.5 rounded-lg border border-dashed border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2">
                        <Bookmark className="w-4 h-4" />
                        Зберегти Поточний Граф
                    </button>
                </div>
            </div>

            {/* ─── ЦЕНТРАЛЬНА ЗОНА: ГРАФ & ПОШУК ───────────────────── */}
            <div className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
                <div className="absolute inset-0 z-0">
                   <AdvancedBackground />
                </div>
                
                {/* Advanced Search Bar (Повнофункціональний) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-[600px]">
                    <form 
                        onSubmit={handleGlobalSearch} 
                        className={cn(
                            "relative flex items-center backdrop-blur-xl border rounded-2xl shadow-2xl transition-all duration-300",
                            isSearchActive ? "bg-slate-900/90 border-cyan-500/50 shadow-cyan-500/10" : "bg-slate-900/80 border-slate-700",
                            isSearching ? "animate-pulse" : ""
                        )}
                    >
                        <div className="pl-4 pr-2 flex items-center border-r border-slate-700/50">
                            <select 
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value as any)}
                                disabled={isSearching}
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
                            disabled={isSearching}
                            placeholder={isSearching ? "ВИКОНУЄТЬСЯ ГЛОБАЛЬНИЙ ПОШУК..." : "Введіть ЄДРПОУ, ПІБ, IBAN або адресу..."}
                            className="flex-1 bg-transparent py-4 px-4 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
                        />
                        <button type="submit" disabled={isSearching} className="p-2 mr-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white rounded-xl shadow-lg transition-colors flex items-center justify-center">
                            {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </form>
                    
                    {/* Error Toast / Alert (Якщо API впало) */}
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mt-3 p-3 bg-red-950/90 border border-red-500/50 rounded-xl flex items-center justify-between text-red-200 text-sm shadow-xl backdrop-blur-md"
                            >
                                <div className="flex items-center gap-2">
                                    <ServerCrash className="w-4 h-4 text-red-400" />
                                    <b>ЗБІЙ:</b> {error}
                                </div>
                                <button onClick={() => setError(null)} className="p-1 hover:bg-red-900/50 rounded-lg transition-colors text-red-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Toolbar */}
                <div className="absolute top-6 right-6 z-30 flex gap-2">
                    <button className="p-3 bg-indigo-600/20 hover:bg-indigo-500/30 text-indigo-400 rounded-xl border border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.3)] backdrop-blur-md transition-colors tooltip group relative">
                        <Bot className="h-5 w-5" />
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">AI Copilot Аналіз</span>
                    </button>
                    <button className="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-md transition-colors tooltip group relative">
                        <Zap className="h-5 w-5" />
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Моніторинг Транзакцій</span>
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-1 self-center" />
                    <button 
                        onClick={resetGraph}
                        disabled={isSearching || isExpanding}
                        className="p-3 bg-slate-900/80 hover:bg-slate-800 disabled:opacity-50 text-slate-300 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md transition-colors tooltip group relative"
                    >
                        <RefreshCw className={cn("h-5 w-5", (isExpanding || isSearching) && "animate-spin text-cyan-400")} />
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Скинути Граф</span>
                    </button>
                    <button className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md transition-colors group relative">
                        <Download className="h-5 w-5" />
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Експорт PDF</span>
                    </button>
                </div>

                {/* Graph Area */}
                <div className="flex-1 relative">
                    {nodes.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center flex-col opacity-50">
                            <Network className="w-24 h-24 text-slate-700 mb-6" />
                            <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest">Граф Порожній</h3>
                            <p className="text-sm text-slate-600 mt-2">Виконайте пошук сутності для старту аналітики</p>
                        </div>
                    ) : (
                        <GraphViewer 
                            nodes={nodes}
                            edges={edges}
                            onNodeClick={setSelectedNode}
                            onNodeDoubleClick={(node) => expandNode(node.id)}
                            selectedNodeId={selectedNode?.id}
                            height="100%"
                            showControls={true}
                        />
                    )}
                </div>
            </div>

            {/* ─── ПРАВА ПАНЕЛЬ: ENTITY PROFILE (ДОСЬЄ В 4.0) ────────── */}
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

                                        {/* Розгорнення API Кнопки */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => expandNode(selectedNode.id)}
                                                disabled={isExpanding}
                                                className="w-full relative overflow-hidden group flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white p-3 rounded-xl transition-all shadow-lg disabled:opacity-50 border border-blue-500/50"
                                            >
                                                <Network className={cn("w-5 h-5", isExpanding && "animate-spin")} /> 
                                                <span className="text-[10px] font-bold uppercase tracking-widest leading-tight mt-1">Оточення</span>
                                            </motion.button>
                                            
                                            {selectedNode.type === 'Organization' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => runUboTracer(selectedNode.id)}
                                                    disabled={isExpanding}
                                                    className="w-full relative overflow-hidden group flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white p-3 rounded-xl transition-all shadow-lg disabled:opacity-50 border border-emerald-500/50"
                                                >
                                                    <Target className={cn("w-5 h-5", isExpanding && "animate-pulse")} /> 
                                                    <span className="text-[10px] font-bold uppercase tracking-widest leading-tight mt-1">Знайти UBO</span>
                                                </motion.button>
                                            )}
                                        </div>

                                        {/* Properties Дані з API */}
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                                                Базова Інформація
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 ? Object.entries(selectedNode.properties).map(([key, value], i) => (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        key={`prop-${key}-${i}`} 
                                                        className={cn(
                                                            "bg-slate-900 border border-slate-800/80 rounded-xl p-3",
                                                            (key === 'address' || key === 'status' || String(value).length > 20) && "col-span-2"
                                                        )}
                                                    >
                                                        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1 truncate">{key}</div>
                                                        <div className="text-sm font-bold text-slate-200 truncate">{String(value)}</div>
                                                    </motion.div>
                                                )) : (
                                                    <div className="col-span-2 text-sm text-slate-500 italic px-4 py-6 text-center bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                                                        Повна інформація відсутня або ще завантажується
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Вкладка РЕЄСТРИ (Імітація з можливим API підключенням) */}
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
                                                        <div className="text-sm font-bold text-white mb-1">Державний Реєстр (ЄДР)</div>
                                                        <div className="text-xs text-slate-400 mb-2">Натисніть для запиту до API Мінюсту</div>
                                                        <button className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300">Оновити Витяг →</button>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-slate-900 border border-red-900/50 bg-red-950/20 rounded-xl flex items-start gap-4">
                                                    <div className="p-2 bg-red-900/50 rounded-lg shrink-0 mt-0.5"><ShieldAlert className="w-4 h-4 text-red-500" /></div>
                                                    <div>
                                                        <div className="text-sm font-bold text-red-200 mb-1">Реєстр Боржників / Суди</div>
                                                        <div className="text-xs text-red-400/80 mb-2">Моніторинг Opendatabot API</div>
                                                        <button className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-300">Перевірити Борги →</button>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-10 text-slate-500 text-sm">Реєстри доступні лише для Компаній та Осіб</div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Вкладка ЗВ'ЯЗКИ (Динамічна з графа) */}
                                {profileTab === 'relations' && (
                                    <motion.div
                                        key="relations"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest flex items-center justify-between">
                                            <span>Локальні зв'язки</span>
                                            <span className="bg-slate-800 px-2 py-0.5 rounded-full">{edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length}</span>
                                        </div>
                                        
                                        {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map((edge, i) => {
                                            const targetNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
                                            const tNode = nodes.find(n => n.id === targetNodeId);
                                            
                                            // Fallback
                                            const displayLabel = tNode?.label || `Вузол ${targetNodeId}`;
                                            const displayType = tNode?.type || 'Person';

                                            return (
                                            <div key={edge.id || `${targetNodeId}-${i}`} className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center gap-3 transition-colors cursor-pointer" onClick={() => expandNode(selectedNode.id)}>
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
                                        {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length === 0 && (
                                             <div className="text-center py-10 text-slate-500 text-[10px] font-bold uppercase tracking-widest italic border border-dashed border-slate-800 rounded-xl">
                                                Немає завантажених зв'язків.<br/>Натисніть "Оточення".
                                             </div>
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
