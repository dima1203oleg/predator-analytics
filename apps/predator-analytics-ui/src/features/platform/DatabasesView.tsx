
import React, { useState, useEffect, useRef } from 'react';
import { ViewHeader } from '@/components/ViewHeader';
import Modal from '@/components/Modal';
import {
    Database, HardDrive, RefreshCw, Layers, Play, X, Terminal, Binary,
    Share2, CheckCircle2, MessageSquare, Activity, Cpu, Network, Zap,
    ShieldCheck, Box, Server, DatabaseZap
} from 'lucide-react';
import { DatabaseTable, SqlTrainingPair } from '@/types';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// Extracted Sub-views
import { RelationalView } from '@/components/databases/RelationalView';
import { ObjectStorageView } from '@/components/databases/ObjectStorageView';
import { VectorDBView } from '@/components/databases/VectorDBView';
import { GraphDBView } from '@/components/databases/GraphDBView';
import { CalibrationView } from '@/components/databases/CalibrationView';
import { EtlProcessMonitor } from '@/components/etl/EtlProcessMonitor';

type DBTab = 'RELATIONAL' | 'OBJECT' | 'VECTOR' | 'GRAPH' | 'CALIBRATION' | 'ETL';

type ObjectStorageBucket = {
    name: string;
    type: string;
    status: string;
    size: string;
    count: number;
};

const normalizeBuckets = (value: unknown): ObjectStorageBucket[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => ({
            name: typeof item.name === 'string' && item.name.trim().length > 0 ? item.name.trim() : 'Н/д',
            type: typeof item.type === 'string' && item.type.trim().length > 0 ? item.type.trim() : 'Н/д',
            status: typeof item.status === 'string' && item.status.trim().length > 0 ? item.status.trim() : 'Н/д',
            size: typeof item.size === 'string' && item.size.trim().length > 0 ? item.size.trim() : 'Н/д',
            count: typeof item.count === 'number' && Number.isFinite(item.count) ? item.count : 0,
        }));
};

const DatabasesView: React.FC = () => {
    const backendStatus = useBackendStatus();
    const metrics = useSystemMetrics();
    const [activeTab, setActiveTab] = useState<DBTab>('ETL');
    const [tables, setTables] = useState<DatabaseTable[]>([]);
    const [loading, setLoading] = useState(false);
    const [queryModal, setQueryModal] = useState<{ isOpen: boolean, table: string | null }>({ isOpen: false, table: null });
    const [isExecuting, setIsExecuting] = useState(false);
    const [queryResult, setQueryResult] = useState<any[] | null>(null);
    const [sqlQuery, setSqlQuery] = useState('');

    const [selectedVector, setSelectedVector] = useState<any | null>(null);
    const [vectorData, setVectorData] = useState<any[]>([]);
    const [buckets, setBuckets] = useState<ObjectStorageBucket[]>([]);
    const [trainingPairs, setTrainingPairs] = useState<SqlTrainingPair[]>([]);
    const [cypherQuery, setCypherQuery] = useState("MATCH (c:Company)-[:WON_TENDER]->(t:Tender)\nWHERE t.amount > 1000000\nRETURN c, t LIMIT 25");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [lastSync, setLastSync] = useState('');

    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        const fetchRelational = async () => {
            setLoading(true);
            try {
                const data = await api.getDatabases();
                if (isMounted.current) setTables(Array.isArray(data) ? data : []);
                if (isMounted.current) {
                    setFeedback(null);
                    setLastSync(new Date().toLocaleTimeString('uk-UA'));
                }
            } catch (e) {
                console.error("Failed to fetch tables", e);
                if (isMounted.current) setFeedback('Маршрут `/databases` не повернув підтверджених таблиць.');
            }
            finally { if (isMounted.current) setLoading(false); }
        };
        const fetchVectors = async () => {
            setLoading(true);
            try {
                const data = await api.getVectors();
                if (isMounted.current) setVectorData(Array.isArray(data) ? data : []);
                if (isMounted.current) {
                    setFeedback(null);
                    setLastSync(new Date().toLocaleTimeString('uk-UA'));
                }
            } catch (e) {
                console.error("Failed to fetch vectors", e);
                if (isMounted.current) setFeedback('Маршрут `/vectors` не повернув підтверджених векторів.');
            }
            finally { if (isMounted.current) setLoading(false); }
        };
        const fetchBuckets = async () => {
            setLoading(true);
            try {
                const data = await api.getBuckets();
                if (isMounted.current) {
                    setBuckets(normalizeBuckets(data));
                    setFeedback(null);
                    setLastSync(new Date().toLocaleTimeString('uk-UA'));
                }
            } catch (e) {
                console.error("Failed to fetch buckets", e);
                if (isMounted.current) {
                    setBuckets([]);
                    setFeedback('Маршрут `/buckets` не повернув підтверджених обʼєктних сховищ. Локальні bucket-и не підставляються.');
                }
            }
            finally { if (isMounted.current) setLoading(false); }
        };
        const fetchTrainingPairs = async () => {
            setLoading(true);
            try {
                const data = await api.getTrainingPairs();
                if (isMounted.current) setTrainingPairs(Array.isArray(data) ? data : []);
                if (isMounted.current) {
                    setFeedback(null);
                    setLastSync(new Date().toLocaleTimeString('uk-UA'));
                }
            } catch (e) {
                console.error("Failed to fetch training pairs", e);
                if (isMounted.current) setFeedback('Маршрут `/ml/training-pairs` не повернув підтверджених пар навчання.');
            }
            finally { if (isMounted.current) setLoading(false); }
        };

        if (activeTab === 'RELATIONAL') fetchRelational();
        if (activeTab === 'VECTOR') fetchVectors();
        if (activeTab === 'OBJECT') fetchBuckets();
        if (activeTab === 'CALIBRATION') fetchTrainingPairs();

        return () => { isMounted.current = false; };
    }, [activeTab]);

    const handleOpenQuery = (tableName: string) => {
        setSqlQuery(`SELECT id, status, updated_at FROM ${tableName} \nWHERE updated_at > NOW() - INTERVAL '24 hours' \nAND status = 'ACTIVE' \nLIMIT 10;`);
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
                        result.columns.forEach((col: string, idx: number) => { obj[col] = row[idx]; });
                        return obj;
                    });
                    setQueryResult(adapted);
                } else setQueryResult([]);
            }
        } catch (e) { console.error("SQL Execution failed", e); }
        finally { if (isMounted.current) setIsExecuting(false); }
    };

    const handleExecuteCypher = async () => {
        try { await api.graph.execute(cypherQuery); }
        catch (e) { console.error("Cypher Execution failed", e); }
    };

    const handleVerifySql = (id: string, isCorrect: boolean) => {
        setTrainingPairs(prev => prev.map(p => p.id === id ? { ...p, status: isCorrect ? 'VERIFIED' : 'REJECTED' } : p));
    };

    return (
        <div className="space-y-12 pb-24 w-full max-w-[1700px] mx-auto relative z-10 min-h-screen px-4 xl:px-8 overflow-hidden">
            <AdvancedBackground />

            <Modal
                isOpen={queryModal.isOpen}
                onClose={() => setQueryModal({ isOpen: false, table: null })}
                title={`SQL контур: ${queryModal.table}`}
                icon={<Terminal size={20} className="text-cyan-400" />}
                size="xl"
            >
                <div className="p-4 h-[550px] flex flex-col glass-morphism rounded-2xl border border-white/10 bg-black/60">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Активний маршрут: /databases/query</span>
                    </div>
                    <textarea
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        className="w-full h-40 bg-slate-950 border border-white/5 rounded-2xl p-6 text-cyan-400 font-mono text-sm focus:border-cyan-500/50 outline-none resize-none mb-6 shadow-inner transition-all"
                        placeholder="ВВЕДІТЬ SQL ЗАПИТ..."
                        title="SQL запит"
                    />
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-4">
                            <span className="text-[10px] font-mono text-slate-300">Рядки: {queryResult?.length || 0}</span>
                            <span className="text-[10px] font-mono text-slate-300">Час виконання: Н/д</span>
                        </div>
                        <button onClick={handleExecute} disabled={isExecuting} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[11px] rounded-xl flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50 italic">
                            {isExecuting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} Виконати запит
                        </button>
                    </div>
                    <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl overflow-auto custom-scrollbar shadow-inner relative">
                        {queryResult ? (
                            <table className="w-full text-left text-[11px] font-mono">
                                <thead className="bg-slate-900/80 sticky top-0 z-10">
                                    <tr className="border-b border-white/10">
                                        {Object.keys(queryResult[0] || {}).map(key => <th key={key} className="p-4 text-slate-300 uppercase font-black tracking-tighter">{key}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {queryResult.map((row, idx) => (
                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            {Object.values(row).map((val: any, i) => <td key={i} className="p-4 text-slate-300 font-medium whitespace-nowrap">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 transform scale-150">
                                <Terminal size={48} className="text-slate-300 mb-4" />
                                <span className="font-mono text-xs text-slate-300">ТЕРМІНАЛ_ОЧІКУЄ</span>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Neural Hub Header v58.2-WRAITH Sovereign */}
            <div className="relative z-20 mt-12 mb-16 rounded-[48px] border border-white/5 bg-[#020408] backdrop-blur-[40px] p-10 flex flex-col lg:flex-row items-center gap-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
                <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

                <div className="relative w-40 h-40 shrink-0">
                    <div className="absolute inset-0 border border-red-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
                    <div className="absolute inset-4 border border-dashed border-red-400/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-red-500/10 border border-red-400/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.3)] backdrop-blur-xl">
                            <DatabaseZap className="w-10 h-10 text-red-500" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 text-center lg:text-left relative z-10">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full font-black text-[10px] uppercase tracking-[0.3em] text-red-500 mb-6 italic">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        СУВЕРЕННИЙ ДАТА-ЦЕНТР v58.2-WRAITH
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-none mb-4 skew-x-[-2deg]">
                        ЯДРО <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-500 to-red-700">СУВЕРЕНИТЕТУ</span>
                    </h1>
                    <p className="text-slate-400 font-medium max-w-2xl leading-relaxed text-sm lg:text-base italic">
                        Централізований шлюз до всіх рівнів зберігання даних. Від реляційних транзакцій до графових топологій та високочастотних векторних пошуків під захистом <span className="text-red-500 font-bold">Конституційного Щита (Constitutional Shield)</span>.
                    </p>
                </div>

                <div className="flex gap-4 shrink-0 w-full lg:w-auto">
                    {[
                        { label: 'S3 СХОВИЩА', val: buckets.length > 0 ? String(buckets.length) : 'Н/д', color: 'text-red-500', icon: HardDrive },
                        {
                            label: 'СТАН БЕКЕНДУ',
                            val: backendStatus.isOffline ? 'НЕДОСТУПНИЙ' : metrics.isLive ? 'АКТИВНИЙ' : 'Н/д',
                            color: backendStatus.isOffline ? 'text-amber-600' : metrics.isLive ? 'text-red-500' : 'text-slate-300',
                            icon: ShieldCheck,
                        }
                    ].map((s, idx) => (
                        <div key={idx} className="flex-1 lg:w-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-center shadow-lg backdrop-blur-xl transition-all hover:border-red-500/40 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-px bg-gradient-to-l from-red-600 to-transparent" />
                            <s.icon size={16} className={cn("mx-auto mb-3 transition-colors", s.color)} />
                            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1 italic">{s.label}</p>
                            <p className={cn("text-xl font-black font-mono transition-transform group-hover:scale-110", s.color)}>{s.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 px-2">
                <div className={cn(
                    'border px-4 py-2 text-[11px] font-bold rounded-full',
                    backendStatus.isOffline
                        ? 'border-amber-500/20 bg-amber-500/10 text-amber-100'
                        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                )}>
                    {backendStatus.statusLabel}
                </div>
                <div className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200 rounded-full">
                    Джерела: /databases, /vectors, /buckets, /ml/training-pairs
                </div>
                <div className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200 rounded-full">
                    Джерело бекенду: {backendStatus.sourceLabel}
                </div>
                <div className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200 rounded-full">
                    Синхронізація: {lastSync || 'Н/д'}
                </div>
            </div>

            {feedback && (
                <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm leading-6 text-amber-100">
                    {feedback}
                </div>
            )}

            {/* Custom V55 Tab Selector */}
            <div className="sticky top-24 z-40 px-4">
                <div className="max-w-fit mx-auto p-2 bg-slate-900/80 backdrop-blur-2xl border border-white/5 rounded-3xl flex flex-wrap shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
                    {[
                        { id: 'ETL', label: 'ПОТІК ETL', icon: Network, color: 'text-amber-500' },
                        { id: 'RELATIONAL', label: 'Реляційні', icon: Database, color: 'text-red-500' },
                        { id: 'OBJECT', label: 'S3 Об\'єкти', icon: Server, color: 'text-amber-500' },
                        { id: 'VECTOR', label: 'Векторний ШІ', icon: Layers, color: 'text-red-500' },
                        { id: 'GRAPH', label: 'Топологія Графу', icon: Share2, color: 'text-amber-600' },
                        { id: 'CALIBRATION', label: 'ШІ Синтез', icon: Binary, color: 'text-slate-400' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "relative py-3.5 px-6 rounded-[20px] transition-all duration-500 flex items-center gap-3 overflow-hidden group italic",
                                    isActive ? "bg-white/10 shadow-[0_0_30px_rgba(220,38,38,0.1)] scale-105 z-10" : "hover:bg-white/5"
                                )}
                            >
                                <span className={cn("transition-transform duration-500", isActive ? "scale-110" : "opacity-40", tab.color)}>
                                    <tab.icon size={18} />
                                </span>
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap",
                                    isActive ? "text-white" : "text-slate-300"
                                )}>
                                    {tab.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="tabUnderline"
                                        className={cn("absolute inset-0 border-b-2 bg-gradient-to-t from-white/10 to-transparent shadow-[inset_0_-2px_10px_rgba(0,0,0,0.5)]", tab.color.replace('text', 'border'))}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Display v58.2-WRAITH */}
            <div className="relative min-h-[600px] mt-12 bg-slate-950/20 rounded-[48px] border border-white/5 p-8 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.02, y: -20 }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                    >
                        {activeTab === 'ETL' && <EtlProcessMonitor />}
                        {activeTab === 'RELATIONAL' && <RelationalView tables={tables} onOpenQuery={handleOpenQuery} />}
                        {activeTab === 'OBJECT' && <ObjectStorageView buckets={buckets} />}
                        {activeTab === 'VECTOR' && <VectorDBView vectorData={vectorData} selectedVector={selectedVector} onSelectVector={setSelectedVector} />}
                        {activeTab === 'GRAPH' && <GraphDBView cypherQuery={cypherQuery} onCypherQueryChange={setCypherQuery} onExecuteCypher={handleExecuteCypher} />}
                        {activeTab === 'CALIBRATION' && <CalibrationView trainingPairs={trainingPairs} onVerifySql={handleVerifySql} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DatabasesView;
