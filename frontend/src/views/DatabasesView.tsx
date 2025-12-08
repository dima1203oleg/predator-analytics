
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import Modal from '../components/Modal';
import { Database, HardDrive, Search, RefreshCw, Layers, Zap, UploadCloud, Play, X, Download, FileCode, Table as TableIcon, AlertCircle, Activity, Network, ArrowRight, Server, FileJson, Terminal, Binary, Calculator, Share2, Scan, CheckCircle2, ThumbsUp, ThumbsDown, MessageSquare, Code, GitBranch, Share } from 'lucide-react';
import { DatabaseTable, SqlTrainingPair } from '../types';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, Cell, CartesianGrid, PieChart, Pie } from 'recharts';
import { api } from '../services/api';

const mockMinioBuckets = [
    { name: 'raw-gov-landing-zone', count: '14.2k файлів', size: '2.4 TB', status: 'Active', type: 'S3 Standard' },
    { name: 'customs-scans-archive', count: '1.1M файлів', size: '4.1 TB', status: 'Active', type: 'S3 Cold' },
    { name: 'etl-parquet-processed', count: '5.1k файлів', size: '800 GB', status: 'Active', type: 'S3 Standard' },
    { name: 'velero-k3s-backups', count: '42 знімки', size: '150 GB', status: 'Locked', type: 'WORM Compliant' },
];

// Updated Colors mapping: Blue (GOV), Red (MED), Yellow (BIZ), Green (SCI)
const COLORS = ['#3b82f6', '#ef4444', '#eab308', '#22c55e'];

type DBTab = 'RELATIONAL' | 'OBJECT' | 'SEARCH' | 'VECTOR' | 'GRAPH' | 'CALIBRATION';

// Mock Vanna Training Data
const MOCK_TRAINING_PAIRS: SqlTrainingPair[] = [
    { id: 't1', question: "Яка загальна сума тендерів ТОВ 'МегаБуд' за 2023 рік?", generatedSql: "SELECT SUM(amount) FROM ua_prozorro_tenders WHERE winner_name = 'ТОВ МегаБуд' AND date >= '2023-01-01' AND date <= '2023-12-31'", schema: "public.ua_prozorro_tenders", confidence: 0.92, status: 'PENDING', timestamp: '14:30' },
    { id: 't2', question: "Знайди топ 5 боржників у Київській області", generatedSql: "SELECT name, debt_amount FROM ua_tax_debt WHERE region = 'Kyiv' ORDER BY debt_amount DESC LIMIT 5", schema: "public.ua_tax_debt", confidence: 0.88, status: 'VERIFIED', timestamp: '12:15' },
    { id: 't3', question: "Кількість декларацій з кодом 8703 (Автомобілі)", generatedSql: "SELECT COUNT(*) FROM customs_declarations WHERE goods_code LIKE '8703%'", schema: "public.customs_declarations", confidence: 0.95, status: 'PENDING', timestamp: '10:05' },
];

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

    // Vector Animation State
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

        // Live Vector Drift Animation
        vectorIntervalRef.current = setInterval(() => {
            if (!isMounted.current) return;

            setVectorData(prev => {
                if (prev.length === 0) return prev;
                return prev.map(p => ({
                    ...p,
                    x: p.x + (Math.random() - 0.5) * 2, // Drift X
                    y: p.y + (Math.random() - 0.5) * 2, // Drift Y
                    z: Math.max(50, Math.min(500, p.z + (Math.random() - 0.5) * 10)) // Drift Size/Score
                }));
            });
        }, 1000);

        // Fetch Databases (Truth-Only)
        const fetchTables = async () => {
            setLoading(true);
            try {
                const data = await api.getDatabases();
                if (isMounted.current) setTables(data);
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        const fetchVectors = async () => {
            try {
                const data = await api.getVectors();
                if (isMounted.current) setVectorData(data);
            } catch (e) {
                console.error("Vector fetch failed", e);
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
                // Adapt response to table format
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
            console.error(e);
        } finally {
            if (isMounted.current) setIsExecuting(false);
        }
    };

    const handleExecuteCypher = async () => {
        try {
            const res = await api.executeCypher(cypherQuery);
            console.log("Cypher result:", res);
            // TODO: Show result in UI
        } catch (e) {
            console.error(e);
        }
    };

    const handleVerifySql = (id: string, isCorrect: boolean) => {
        setTrainingPairs(prev => prev.map(p => p.id === id ? { ...p, status: isCorrect ? 'VERIFIED' : 'REJECTED' } : p));
    };

    const renderRelational = () => (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 gap-4">
                {tables.map(table => (
                    <div key={table.id} className="p-4 bg-slate-950 border border-slate-800 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-blue-500/30 transition-colors panel-3d gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-900/20 rounded border border-blue-900/30 text-blue-500 icon-3d-blue">
                                <TableIcon size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-slate-200 text-sm">{table.name}</div>
                                <div className="text-xs text-slate-500 font-mono">
                                    {table.type} • {table.records.toLocaleString()} рядків • {table.size}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-400">Синхронізація</div>
                                <div className="text-[10px] text-slate-500 font-mono">{table.lastUpdated}</div>
                            </div>
                            <button
                                onClick={() => handleOpenQuery(table.name)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded hover:text-white transition-colors border border-slate-700 btn-3d"
                            >
                                <Terminal size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderObjectStorage = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
            {mockMinioBuckets.map((bucket, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded relative overflow-hidden panel-3d group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <HardDrive size={20} className="text-yellow-500 icon-3d-amber" />
                            <div>
                                <div className="font-bold text-sm text-slate-200">{bucket.name}</div>
                                <div className="text-[10px] text-slate-500 uppercase">{bucket.type}</div>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{bucket.status}</span>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                        <div>
                            <div className="text-xs text-slate-500">Об'єм</div>
                            <div className="text-lg font-mono font-bold text-slate-200">{bucket.size}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500">Об'єктів</div>
                            <div className="text-sm font-mono text-slate-300">{bucket.count}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderVectorDB = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <TacticalCard title="Qdrant Векторний Простір (Embeddings)" className="panel-3d">
                <div className="h-[300px] w-full bg-slate-950/50 rounded border border-slate-800 relative overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                            onClick={(e) => {
                                if (e && e.activePayload && e.activePayload[0]) {
                                    setSelectedVector(e.activePayload[0].payload);
                                }
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" dataKey="x" name="Dimension X" stroke="#475569" tick={{ fontSize: 10 }} />
                            <YAxis type="number" dataKey="y" name="Dimension Y" stroke="#475569" tick={{ fontSize: 10 }} />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }}
                            />
                            <Scatter name="Vectors" data={vectorData} fill="#8884d8" cursor="pointer">
                                {vectorData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.cluster.includes('GOV') ? COLORS[0] : entry.cluster.includes('MED') ? COLORS[1] : entry.cluster.includes('BIZ') ? COLORS[2] : COLORS[3]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4 text-[10px] text-slate-400 font-mono text-center">
                    <div className="flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_blue]"></span> GOV (Тендери)</div>
                    <div className="flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_red]"></span> MED (Пацієнти)</div>
                    <div className="flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_yellow]"></span> BIZ (Фінанси)</div>
                    <div className="flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_lime]"></span> SCI (Сенсори)</div>
                </div>
            </TacticalCard>
        </div>
    );

    const renderGraphDB = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <div className="lg:col-span-2">
                <TacticalCard title="Neo4j Граф Знань (Bloom)" className="panel-3d" action={
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-green-900/20 text-green-500 px-2 py-0.5 rounded border border-green-900/50 font-bold shadow-[0_0_5px_lime]">ONLINE</span>
                        <span className="text-[10px] text-slate-500 font-mono">v5.12.0</span>
                    </div>
                }>
                    <div className="relative h-[400px] bg-slate-950 border border-slate-800 rounded overflow-hidden flex items-center justify-center">
                        <svg width="100%" height="100%" viewBox="0 0 600 400" className="pointer-events-none">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                                </marker>
                            </defs>

                            {/* Links */}
                            <line x1="300" y1="200" x2="150" y2="100" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                            <line x1="300" y1="200" x2="450" y2="100" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                            <line x1="300" y1="200" x2="300" y2="320" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                            <line x1="150" y1="100" x2="50" y2="150" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

                            {/* Central Node */}
                            <g className="cursor-pointer hover:scale-110 transition-transform origin-center">
                                <circle cx="300" cy="200" r="35" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="2" />
                                <text x="300" y="205" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">ТОВ "МегаБуд"</text>
                            </g>

                            {/* Linked Nodes */}
                            <g className="cursor-pointer hover:scale-110 transition-transform origin-center">
                                <circle cx="150" cy="100" r="25" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" />
                                <text x="150" y="105" textAnchor="middle" fontSize="9" fill="white">Директор</text>
                            </g>

                            <g className="cursor-pointer hover:scale-110 transition-transform origin-center">
                                <circle cx="450" cy="100" r="25" fill="#eab308" fillOpacity="0.2" stroke="#eab308" strokeWidth="2" />
                                <text x="450" y="105" textAnchor="middle" fontSize="9" fill="white">Тендер #1</text>
                            </g>

                            <g className="cursor-pointer hover:scale-110 transition-transform origin-center">
                                <circle cx="300" cy="320" r="25" fill="#a855f7" fillOpacity="0.2" stroke="#a855f7" strokeWidth="2" />
                                <text x="300" y="325" textAnchor="middle" fontSize="9" fill="white">Адреса</text>
                            </g>

                            <g className="cursor-pointer hover:scale-110 transition-transform origin-center">
                                <circle cx="50" cy="150" r="20" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="2" />
                                <text x="50" y="155" textAnchor="middle" fontSize="8" fill="white">PEP</text>
                            </g>
                        </svg>

                        <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 p-2 rounded text-[10px] font-mono text-slate-400">
                            <div>Nodes: 1,420,500</div>
                            <div>rels: 5,200,100</div>
                        </div>
                    </div>
                </TacticalCard>
            </div>

            <div className="space-y-6">
                <TacticalCard title="Cypher Запит (Graph)" className="panel-3d">
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
                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors btn-3d btn-3d-purple">
                            <Play size={14} /> Виконати Cypher
                        </button>
                    </div>
                </TacticalCard>

                <div className="bg-slate-900 border border-slate-800 rounded p-4 panel-3d">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-900/20 text-blue-400 rounded icon-3d-blue">
                            <GitBranch size={18} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-200">Схема Графа</div>
                            <div className="text-[10px] text-slate-500">v4.2 (Golden Master)</div>
                        </div>
                    </div>
                    <div className="space-y-2 text-xs text-slate-400 font-mono">
                        <div className="flex justify-between">
                            <span>(:Company)</span>
                            <span className="text-slate-500">450k</span>
                        </div>
                        <div className="flex justify-between">
                            <span>(:Person)</span>
                            <span className="text-slate-500">820k</span>
                        </div>
                        <div className="flex justify-between">
                            <span>(:Tender)</span>
                            <span className="text-slate-500">1.2M</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800 pt-1 mt-1">
                            <span>[:BENEFICIARY]</span>
                            <span className="text-slate-500">320k</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCalibration = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <TacticalCard title="Text-to-SQL Калібрування (Vanna.ai RLHF)" className="panel-3d">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded panel-3d">
                        <div>
                            <div className="text-sm font-bold text-slate-200">Статус Навчання Vanna.ai</div>
                            <div className="text-xs text-slate-500">Модель: <span className="text-primary-400">CodeLlama-34b-v2</span></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-xs font-bold text-slate-400">Точність</div>
                                <div className="text-success-500 font-mono font-bold text-glow-green">92.4%</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-bold text-slate-400">Пар (Пари)</div>
                                <div className="text-blue-400 font-mono font-bold">1,420</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {trainingPairs.map(pair => (
                            <div key={pair.id} className="bg-slate-950 border border-slate-800 rounded p-4 flex flex-col gap-3 panel-3d">
                                <div className="flex items-start gap-3">
                                    <MessageSquare size={16} className="text-slate-500 mt-1 shrink-0 icon-3d" />
                                    <div className="text-sm text-slate-200 font-medium italic">"{pair.question}"</div>
                                </div>

                                <div className="bg-black/50 p-3 rounded border border-slate-800 font-mono text-xs text-blue-300 relative group">
                                    <div className="absolute top-2 right-2 text-[9px] text-slate-500 flex items-center gap-1">
                                        <Code size={10} /> {pair.schema}
                                    </div>
                                    {pair.generatedSql}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                                    <div className="text-[10px] text-slate-500">
                                        Впевненість: <span className={`font-bold ${pair.confidence > 0.9 ? 'text-success-500' : 'text-yellow-500'}`}>{(pair.confidence * 100).toFixed(0)}%</span>
                                    </div>

                                    {pair.status === 'PENDING' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleVerifySql(pair.id, true)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-success-900/20 border border-slate-700 hover:border-success-500/50 rounded text-xs text-slate-400 hover:text-success-400 transition-all btn-3d"
                                            >
                                                <ThumbsUp size={12} /> Вірно
                                            </button>
                                            <button
                                                onClick={() => handleVerifySql(pair.id, false)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-red-900/20 border border-slate-700 hover:border-red-500/50 rounded text-xs text-slate-400 hover:text-red-400 transition-all btn-3d"
                                            >
                                                <ThumbsDown size={12} /> Редагувати
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`flex items-center gap-1 text-xs font-bold ${pair.status === 'VERIFIED' ? 'text-success-500' : 'text-red-500'}`}>
                                            {pair.status === 'VERIFIED' ? <CheckCircle2 size={14} className="icon-3d-green" /> : <X size={14} className="icon-3d-red" />}
                                            {pair.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </TacticalCard>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 w-full max-w-[1600px] mx-auto">

            {/* Query Modal */}
            <Modal
                isOpen={queryModal.isOpen}
                onClose={() => setQueryModal({ isOpen: false, table: null })}
                title={`SQL Запит: ${queryModal.table}`}
                icon={<Terminal size={20} className="text-blue-400 icon-3d-blue" />}
                size="xl"
            >
                <div className="flex flex-col h-[500px]">
                    <div className="flex-1 p-4 bg-[#0d1117] font-mono text-xs overflow-hidden flex flex-col">
                        <textarea
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-3 text-slate-300 focus:border-blue-500 outline-none resize-none mb-4"
                        />

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={handleExecute}
                                disabled={isExecuting}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center gap-2 disabled:opacity-50 btn-3d btn-3d-blue"
                            >
                                {isExecuting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                                Виконати
                            </button>
                        </div>

                        <div className="flex-1 border border-slate-800 rounded overflow-auto custom-scrollbar">
                            {queryResult ? (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900 text-slate-500 sticky top-0">
                                        <tr>
                                            {Object.keys(queryResult[0]).map(key => (
                                                <th key={key} className="p-2 border-b border-slate-800">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-300">
                                        {queryResult.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/50">
                                                {Object.values(row).map((val: any, i) => (
                                                    <td key={i} className="p-2 border-b border-slate-800/50">
                                                        {/* Fix for [object Object] error: check type and stringify if object */}
                                                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600">
                                    Немає результатів.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Vector Inspector Modal */}
            <Modal
                isOpen={!!selectedVector}
                onClose={() => setSelectedVector(null)}
                title="Інспектор Embeddings"
                icon={<Scan size={20} className="text-purple-400 icon-3d-purple" />}
                size="lg"
            >
                {selectedVector && (
                    <div className="p-6 space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-4 bg-slate-950 rounded border border-slate-800 shadow-inner panel-3d">
                                <Layers size={32} className={`${selectedVector.cluster.includes('GOV') ? 'text-blue-500' : selectedVector.cluster.includes('MED') ? 'text-red-500' : 'text-yellow-500'} icon-3d`} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-200">{selectedVector.cluster}</h3>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
                                    <span>ID: {selectedVector.id}</span>
                                    <span>•</span>
                                    <span>Оцінка: {selectedVector.z}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/50 p-4 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Векторне Представлення (1536-dim snippet)</div>
                            <div className="flex flex-wrap gap-0.5 h-16 overflow-hidden">
                                {Array.from({ length: 120 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1 h-full opacity-80"
                                        style={{
                                            backgroundColor: `hsl(${Math.random() * 260 + 180}, 70%, 50%)`,
                                            opacity: Math.random()
                                        }}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-950 rounded border border-slate-800 panel-3d">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Косинусна Подібність</div>
                                <div className="text-2xl font-mono font-bold text-success-500 text-glow-green">0.9241</div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded border border-slate-800 panel-3d">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Найближчі Сусіди</div>
                                <div className="text-xs text-slate-300 space-y-1">
                                    <div>1. ID-4421 (0.91)</div>
                                    <div>2. ID-9922 (0.88)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ViewHeader
                title="Сховища Даних (Data Grid)"
                icon={<Database size={20} className="icon-3d-blue" />}
                breadcrumbs={['DATA GRID', 'СХОВИЩА']}
                stats={[
                    { label: 'Загальний Об\'єм', value: '18.4 TB', icon: <HardDrive size={14} className="icon-3d-amber" />, color: 'primary' },
                    { label: 'Здоров\'я БД', value: 'НОРМА', icon: <Activity size={14} className="icon-3d-green" />, color: 'success' },
                    { label: 'Вектори', value: '14.2M', icon: <Share2 size={14} className="icon-3d-purple" />, color: 'warning' },
                ]}
            />

            {/* Tabs */}
            <div className="flex border-b border-slate-800 mb-6 bg-slate-950/30 rounded-t overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveTab('RELATIONAL')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'RELATIONAL' ? 'border-blue-500 text-blue-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <Database size={16} /> Relational
                </button>
                <button
                    onClick={() => setActiveTab('OBJECT')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'OBJECT' ? 'border-yellow-500 text-yellow-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <HardDrive size={16} /> Object (S3)
                </button>
                <button
                    onClick={() => setActiveTab('VECTOR')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'VECTOR' ? 'border-purple-500 text-purple-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <Layers size={16} /> Vector
                </button>
                <button
                    onClick={() => setActiveTab('GRAPH')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'GRAPH' ? 'border-orange-500 text-orange-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <Share2 size={16} /> Graph (Neo4j)
                </button>
                <button
                    onClick={() => setActiveTab('CALIBRATION')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'CALIBRATION' ? 'border-green-500 text-green-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <Binary size={16} /> Calibration (Vanna)
                </button>
            </div>

            <div className="min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 z-10">
                        <RefreshCw className="animate-spin text-primary-500" size={32} />
                    </div>
                )}
                {activeTab === 'RELATIONAL' && renderRelational()}
                {activeTab === 'OBJECT' && renderObjectStorage()}
                {activeTab === 'VECTOR' && renderVectorDB()}
                {activeTab === 'GRAPH' && renderGraphDB()}
                {activeTab === 'CALIBRATION' && renderCalibration()}
            </div>
        </div>
    );
};

export default DatabasesView;
