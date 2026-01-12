
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import Modal from '../components/Modal';
import { Database, HardDrive, Search, RefreshCw, Layers, Zap, UploadCloud, Play, X, Download, FileCode, Table as TableIcon, AlertCircle, Activity, Network, ArrowRight, Server, FileJson, Terminal, Binary, Calculator, Share2, Scan, CheckCircle2, ThumbsUp, ThumbsDown, MessageSquare, Code, GitBranch, Share, Shield, Eye } from 'lucide-react';
import { DatabaseTable, SqlTrainingPair } from '../types';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, Cell, CartesianGrid, PieChart, Pie } from 'recharts';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '../components/AdvancedBackground';

const mockMinioBuckets: any[] = [];

const COLORS = ['#3b82f6', '#ef4444', '#eab308', '#22c55e'];

type DBTab = 'RELATIONAL' | 'OBJECT' | 'SEARCH' | 'VECTOR' | 'GRAPH' | 'CALIBRATION';

const MOCK_TRAINING_PAIRS: SqlTrainingPair[] = [];

const DatabasesView: React.FC = () => {
    const metrics = useSystemMetrics();
    const [activeTab, setActiveTab] = useState<DBTab>('RELATIONAL');
    const [tables, setTables] = useState<DatabaseTable[]>([]);
    const [loading, setLoading] = useState(false);
    const [queryModal, setQueryModal] = useState<{ isOpen: boolean, table: string | null }>({ isOpen: false, table: null });
    const [isExecuting, setIsExecuting] = useState(false);
    const [queryResult, setQueryResult] = useState<any[] | null>(null);
    const [sqlQuery, setSqlQuery] = useState('');

    // Vector Inspector State
    const [selectedVector, setSelectedVector] = useState<any | null>(null);
    const [vectorData, setVectorData] = useState<any[]>([]);

    // Vanna Training State
    const [trainingPairs, setTrainingPairs] = useState<SqlTrainingPair[]>(MOCK_TRAINING_PAIRS);

    // Graph DB State
    const [cypherQuery, setCypherQuery] = useState("MATCH (c:Company)-[:WON_TENDER]->(t:Tender)\nWHERE t.amount > 1000000\nRETURN c, t LIMIT 25");

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const vectorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;

        vectorIntervalRef.current = setInterval(() => {
            if (!isMounted.current) return;
            setVectorData(prev => prev);
        }, 1000);

        const fetchTables = async () => {
            setLoading(true);
            try {
                const data = await api.getDatabases();
                if (isMounted.current) setTables(data);
            } catch (e) {
                // Silently handle error
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        const fetchVectors = async () => {
            try {
                const data = await api.getVectors();
                if (isMounted.current) setVectorData(data);
            } catch (e) {
                // Silently handle error
            }
        };

        if (activeTab === 'RELATIONAL') fetchTables();
        if (activeTab === 'VECTOR') fetchVectors();

        return () => {
            isMounted.current = false;
            if (timerRef.current) clearTimeout(timerRef.current);
            if (vectorIntervalRef.current) clearInterval(vectorIntervalRef.current);
        };
    }, [activeTab]);

    const handleOpenQuery = (tableName: string) => {
        setSqlQuery(`SELECT * FROM ${tableName} \nWHERE updated_at > NOW() - INTERVAL '24 hours' \nAND status = 'ACTIVE' \nLIMIT 10;`);
        setQueryModal({ isOpen: true, table: tableName });
        setQueryResult(null);
    };

    const handleExecute = async () => {
        setIsExecuting(true);
        try {
            const result = await api.executeQuery(sqlQuery);
            if (isMounted.current) {
                if (result.rows && result.columns) {
                    const adapted = result.rows.map((row: any[], i: number) => {
                        const obj: any = { key: i };
                        result.columns.forEach((col: string, idx: number) => {
                            obj[col] = row[idx];
                        });
                        return obj;
                    });
                    setQueryResult(adapted);
                } else {
                    setQueryResult([]);
                }
            }
        } catch (e) {
            // Silently handle error
        } finally {
            if (isMounted.current) setIsExecuting(false);
        }
    };

    const handleExecuteCypher = async () => {
        try {
            await api.graph.execute(cypherQuery);
        } catch (e) {
            // Silently handle error
        }
    };

    const handleVerifySql = (id: string, isCorrect: boolean) => {
        setTrainingPairs(prev => prev.map(p => p.id === id ? { ...p, status: isCorrect ? 'VERIFIED' : 'REJECTED' } : p));
    };

    const renderRelational = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {tables.map((table, idx) => (
                        <motion.div
                            key={table.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative overflow-hidden p-6 glass-ultra rounded-3xl hover:border-blue-500/40 transition-all duration-500 shadow-2xl panel-3d"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <TableIcon size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-white uppercase tracking-tighter">{table.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                            <Layers size={10} /> {table.type} <span className="text-slate-700">•</span> {table.size}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black border border-emerald-500/20 uppercase tracking-widest">Stable</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                <div>
                                    <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Записів</div>
                                    <div className="text-sm font-black text-slate-300 font-mono">{table.records.toLocaleString()}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenQuery(table.name)}
                                        className="p-2.5 bg-slate-950 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-blue-500/30 transition-all active:scale-95"
                                        title="Open SQL Terminal"
                                    >
                                        <Terminal size={14} />
                                    </button>
                                    <button className="p-2.5 bg-slate-950 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95">
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );

    const renderObjectStorage = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
        >
            {mockMinioBuckets.map((bucket, idx) => {
                const isLocked = bucket.status === 'Locked';
                return (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        className={`group relative overflow-hidden p-6 rounded-3xl border transition-all duration-500 glass-ultra ${isLocked ? 'border-red-500/40' : 'hover:border-amber-500/40 shadow-2xl panel-3d'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isLocked ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white shadow-lg shadow-amber-500/20'
                                    }`}>
                                    {isLocked ? <Shield size={24} /> : <HardDrive size={24} />}
                                </div>
                                <div>
                                    <div className="text-sm font-black text-white uppercase tracking-tighter">{bucket.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 uppercase font-bold tracking-widest mt-1">
                                        {bucket.type} <span className="text-slate-800">•</span> S3 Compliant
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[8px] font-black px-2.5 py-1 rounded-full border-2 uppercase tracking-widest ${isLocked ? 'border-red-500/20 text-red-500 bg-red-500/5' : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                                }`}>
                                {bucket.status === 'Active' ? 'Online' : 'Restricted'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Зайнято Об'єму</div>
                                    <div className="text-xl font-black text-white font-mono leading-none">{bucket.size}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Файлів</div>
                                    <div className="text-sm font-black text-slate-400 font-mono">{bucket.count}</div>
                                </div>
                            </div>

                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: isLocked ? '100%' : '65%' }}
                                    className={`h-full ${isLocked ? 'bg-red-500' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button className="flex-1 py-2 bg-slate-950 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white hover:border-white/10 uppercase tracking-widest transition-all">Огляд</button>
                            <button className="flex-1 py-2 bg-slate-950 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white hover:border-white/10 uppercase tracking-widest transition-all">Політики</button>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );

    const renderVectorDB = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            <div className="lg:col-span-2">
                <TacticalCard variant="holographic" title="Qdrant Векторний Простір (Semantic Radar)" className="h-[500px] panel-3d glass-morphism relative overflow-hidden">
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none"></div>
                    <div className="h-full w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart
                                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                                onClick={(e) => {
                                    if (e && e.activePayload && e.activePayload[0]) {
                                        setSelectedVector(e.activePayload[0].payload);
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis type="number" dataKey="x" name="Dimension X" stroke="#475569" tick={{ fontSize: 10 }} hide />
                                <YAxis type="number" dataKey="y" name="Dimension Y" stroke="#475569" tick={{ fontSize: 10 }} hide />
                                <ZAxis type="number" dataKey="z" range={[50, 600]} />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                />
                                <Scatter name="Vectors" data={vectorData} fill="#8884d8">
                                    {vectorData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.cluster.includes('GOV') ? '#3b82f6' : entry.cluster.includes('MED') ? '#ef4444' : entry.cluster.includes('BIZ') ? '#eab308' : '#22c55e'}
                                            className="drop-shadow-[0_0_8px_rgba(currentColor,0.5)] cursor-pointer hover:scale-125 transition-transform"
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </TacticalCard>
            </div>
            <div className="space-y-6">
                <TacticalCard variant="holographic" title="Vector Inspector" className="h-[500px] flex flex-col">
                    <AnimatePresence mode="wait">
                        {selectedVector ? (
                            <motion.div
                                key={selectedVector.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col pt-4"
                            >
                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Binary size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Embedding ID</div>
                                            <div className="text-sm font-mono font-black text-white">{selectedVector.id.substring(0, 12)}...</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-[8px] text-slate-600 uppercase font-black mb-1">Cluster</div>
                                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded inline-block">{selectedVector.cluster}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] text-slate-600 uppercase font-black mb-1">Dimensions</div>
                                            <div className="text-[10px] font-black text-slate-300 font-mono">1536 (OpenAI)</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Preview Meta</h4>
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-blue-400 leading-relaxed max-h-[180px] overflow-auto custom-scrollbar">
                                        {`"metadata": {\n  "source": "${selectedVector.cluster}_active",\n  "relevance": 0.984,\n  "checksum": "8f2e...9a4c",\n  "indexed_at": "2023-12-21T15:42"\n}`}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedVector(null)}
                                    className="mt-auto w-full py-3 bg-slate-950 border border-white/5 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em]"
                                >
                                    Close Inspector
                                </button>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <Scan size={48} className="text-slate-800 mb-6 animate-pulse" />
                                <p className="text-xs text-slate-600 uppercase font-black tracking-widest leading-relaxed">
                                    Оберіть вектор на радарі для активації детектору смислів
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </TacticalCard>
            </div>
        </motion.div>
    );

    const renderGraphDB = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            <div className="lg:col-span-2">
                <TacticalCard variant="holographic" title="Neo4j Граф Знань (Bloom)" className="panel-3d glass-morphism" action={
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-green-900/20 text-green-500 px-2 py-0.5 rounded border border-green-900/50 font-bold shadow-[0_0_5px_lime]">ОНЛАЙН</span>
                    </div>
                }>
                    <div className="relative h-[400px] bg-slate-950 border border-slate-800 rounded overflow-hidden flex items-center justify-center">
                        <svg width="100%" height="100%" viewBox="0 0 600 400" className="pointer-events-none">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                                </marker>
                            </defs>
                            <line x1="300" y1="200" x2="150" y2="100" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                            <line x1="300" y1="200" x2="450" y2="100" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                            <line x1="300" y1="200" x2="300" y2="320" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                            <line x1="150" y1="100" x2="50" y2="150" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

                            <g className="cursor-pointer hover:scale-110 transition-transform origin-center">
                                <circle cx="300" cy="200" r="35" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="2" />
                                <motion.text animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} x="300" y="205" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">ТОВ "МегаБуд"</motion.text>
                            </g>
                            <g className="cursor-pointer"><circle cx="150" cy="100" r="25" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" /><text x="150" y="105" textAnchor="middle" fontSize="9" fill="white">Директор</text></g>
                            <g className="cursor-pointer"><circle cx="450" cy="100" r="25" fill="#eab308" fillOpacity="0.2" stroke="#eab308" strokeWidth="2" /><text x="450" y="105" textAnchor="middle" fontSize="9" fill="white">Тендер #1</text></g>
                            <g className="cursor-pointer"><circle cx="300" cy="320" r="25" fill="#a855f7" fillOpacity="0.2" stroke="#a855f7" strokeWidth="2" /><text x="300" y="325" textAnchor="middle" fontSize="9" fill="white">Адреса</text></g>
                        </svg>
                        <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 p-2 rounded text-[10px] font-mono text-slate-400">
                            <div>Вузлів: 1,420k</div>
                            <div>Зв'язків: 5,200k</div>
                        </div>
                    </div>
                </TacticalCard>
            </div>
            <div className="space-y-6">
                <TacticalCard variant="holographic" title="Cypher Запит (Graph)" className="panel-3d">
                    <div className="space-y-4">
                        <div className="bg-slate-950 border border-slate-800 rounded p-2">
                            <textarea
                                value={cypherQuery}
                                onChange={(e) => setCypherQuery(e.target.value)}
                                className="w-full h-32 bg-transparent text-xs font-mono text-purple-300 focus:outline-none resize-none"
                            />
                        </div>
                        <button
                            onClick={handleExecuteCypher}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors btn-3d"
                        >
                            <Play size={14} /> Виконати Cypher
                        </button>
                    </div>
                </TacticalCard>
            </div>
        </motion.div>
    );

    const renderCalibration = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            <div className="lg:col-span-2 space-y-6">
                <TacticalCard variant="holographic" title="Text-to-SQL RLHF Optimization" className="panel-3d glass-morphism">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl relative overflow-hidden">
                            <motion.div
                                animate={{ opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent pointer-events-none"
                            />
                            <div className="relative z-10">
                                <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-1">Active Neural Model</div>
                                <div className="text-xl font-black text-white uppercase tracking-tighter">CodeLlama-34b-v25-Instruct</div>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1.5 grayscale opacity-60">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[9px] font-black text-white uppercase font-mono tracking-widest">Weights: Frozen</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        <span className="text-[9px] font-black text-white uppercase font-mono tracking-widest">LoRA: Active</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right relative z-10">
                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">SQL Accuracy</div>
                                <div className="text-3xl font-black text-emerald-400 font-mono shadow-emerald-500/20 drop-shadow-lg">92.4%</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Queue of Pending Queries for Verification</h4>
                            <AnimatePresence mode="popLayout">
                                {trainingPairs.map((pair, idx) => (
                                    <motion.div
                                        key={pair.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-slate-950/60 border border-white/5 rounded-3xl p-5 group hover:border-blue-500/30 transition-all duration-300"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                                                    <MessageSquare size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Human Request</div>
                                                    <div className="text-sm font-black text-slate-200 italic">"{pair.question}"</div>
                                                </div>
                                            </div>
                                            <div className="text-[9px] font-mono text-slate-600 bg-slate-900 px-2 py-1 rounded-lg uppercase">{pair.timestamp}</div>
                                        </div>

                                        <div className="bg-black/80 p-4 rounded-2xl border border-white/5 font-mono text-xs text-blue-300 relative group/sql">
                                            <div className="absolute top-2 right-4 text-[8px] text-slate-700 font-black uppercase tracking-widest opacity-0 group-hover/sql:opacity-100 transition-opacity">Generated SQL</div>
                                            {pair.generatedSql}
                                        </div>

                                        <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Confidence</div>
                                                <div className={`text-xs font-black font-mono ${pair.confidence > 0.9 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {(pair.confidence * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {pair.status === 'PENDING' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleVerifySql(pair.id, true)}
                                                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerifySql(pair.id, false)}
                                                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Refine
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest ${pair.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                        }`}>
                                                        {pair.status === 'VERIFIED' ? <CheckCircle2 size={12} /> : <X size={12} />}
                                                        {pair.status}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </TacticalCard>
            </div>
            <div className="space-y-6">
                <TacticalCard variant="holographic" title="Training Stats" className="panel-3d">
                    <div className="space-y-6">
                        <div className="text-center p-8 bg-black/40 border border-white/5 rounded-3xl">
                            <Binary size={48} className="text-blue-500/40 mx-auto mb-4" />
                            <div className="text-4xl font-black text-white font-mono mb-2">1,542</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Training samples</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="text-xs font-black text-emerald-400 font-mono">98%</div>
                                <div className="text-[8px] text-slate-600 uppercase font-black mt-1">Consistency</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="text-xs font-black text-blue-400 font-mono">15ms</div>
                                <div className="text-[8px] text-slate-600 uppercase font-black mt-1">Inference</div>
                            </div>
                        </div>
                        <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 transition-all btn-3d">
                            Start Fine-tuning Loop
                        </button>
                    </div>
                </TacticalCard>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-6 pb-20 w-full max-w-[1600px] mx-auto relative z-10 min-h-screen">
            <AdvancedBackground />
            <Modal
                isOpen={queryModal.isOpen}
                onClose={() => setQueryModal({ isOpen: false, table: null })}
                title={`SQL Terminal: ${queryModal.table}`}
                icon={<Terminal size={20} className="text-blue-400" />}
                size="xl"
            >
                <div className="p-1 h-[500px] flex flex-col glass-morphism">
                    <textarea
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-primary-400 font-mono text-xs focus:border-primary-500 outline-none resize-none mb-4"
                    />
                    <div className="flex justify-end mb-4">
                        <button onClick={handleExecute} disabled={isExecuting} className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl flex items-center gap-2 btn-3d">
                            {isExecuting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} Виконати
                        </button>
                    </div>
                    <div className="flex-1 bg-black/40 border border-slate-800 rounded-xl overflow-auto custom-scrollbar p-2">
                        {queryResult ? (
                            <table className="w-full text-left text-[11px] font-mono">
                                <thead className="text-slate-500 uppercase tracking-tighter border-b border-slate-800">
                                    <tr>{Object.keys(queryResult[0] || {}).map(key => <th key={key} className="p-3">{key}</th>)}</tr>
                                </thead>
                                <tbody className="text-slate-400">
                                    {queryResult.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-white/5">{Object.values(row).map((val: any, i) => <td key={i} className="p-3 whitespace-nowrap">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>)}</tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="h-full flex items-center justify-center text-slate-700 italic">Немає результатів для відображення.</div>}
                    </div>
                </div>
            </Modal>

            <ViewHeader
                title="НЕЙРОННА СІТКА СХОВИЩ (STORAGE V25)"
                icon={<Database size={20} className="icon-3d-blue" />}
                breadcrumbs={['СИНАПСИС', 'ДАНІ', 'СХОВИЩА']}
                className="mb-8"
                stats={[
                    { label: 'Загальний Об\'єм', value: '18.4 TB', icon: <HardDrive size={14} />, color: 'primary' },
                    { label: 'Статус', value: 'ОПТИМАЛЬНО', icon: <Activity size={14} />, color: 'success' },
                    { label: 'Вектори RAG', value: '14.2M', icon: <Share2 size={14} />, color: 'warning' },
                ]}
            />

            <div className="flex p-1.5 bg-slate-950/50 backdrop-blur-3xl border border-white/5 rounded-2xl mb-8 sticky top-20 z-40 overflow-x-auto scrollbar-hide shadow-2xl">
                {[
                    { id: 'RELATIONAL', label: 'Реляційні', icon: <DatabaseIcon size={18} />, color: 'blue' },
                    { id: 'OBJECT', label: 'Об\'єктні S3', icon: <HardDrive size={18} />, color: 'amber' },
                    { id: 'VECTOR', label: 'Векторні', icon: <Layers size={18} />, color: 'emerald' },
                    { id: 'GRAPH', label: 'Графові', icon: <Share2 size={18} />, color: 'purple' },
                    { id: 'CALIBRATION', label: 'Калібрування AI', icon: <Binary size={18} />, color: 'primary' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 min-w-[160px] py-4 px-4 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 flex items-center justify-center gap-3 relative group ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <span className={activeTab === tab.id ? (tab.color === 'blue' ? 'text-blue-400' : tab.color === 'amber' ? 'text-amber-400' : tab.color === 'emerald' ? 'text-emerald-400' : tab.color === 'purple' ? 'text-purple-400' : 'text-primary-400') : 'text-slate-600'}>
                            {tab.icon}
                        </span>
                        <span className="uppercase tracking-[0.2em] whitespace-nowrap">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
                        )}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px] relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'RELATIONAL' && renderRelational()}
                    {activeTab === 'OBJECT' && renderObjectStorage()}
                    {activeTab === 'VECTOR' && renderVectorDB()}
                    {activeTab === 'GRAPH' && renderGraphDB()}
                    {activeTab === 'CALIBRATION' && renderCalibration()}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Internal alias for lucide Database to avoid name collision with Tab ID
const DatabaseIcon = Database;

export default DatabasesView;
