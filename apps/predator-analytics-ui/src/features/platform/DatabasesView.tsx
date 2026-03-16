
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

// Extracted Sub-views
import { RelationalView } from '@/components/databases/RelationalView';
import { ObjectStorageView } from '@/components/databases/ObjectStorageView';
import { VectorDBView } from '@/components/databases/VectorDBView';
import { GraphDBView } from '@/components/databases/GraphDBView';
import { CalibrationView } from '@/components/databases/CalibrationView';
import { EtlProcessMonitor } from '@/components/etl/EtlProcessMonitor';

const mockMinioBuckets = [
    { name: 'evidence-vault', type: 'Private', status: 'Active', size: '4.2 TB', count: 125400 },
    { name: 'osint-raw-shards', type: 'Public', status: 'Active', size: '8.1 TB', count: 850300 },
    { name: 'medical-phi-encrypted', type: 'Restricted', status: 'Locked', size: '1.2 TB', count: 42000 },
    { name: 'governance-archives', type: 'Private', status: 'Active', size: '4.9 TB', count: 210000 },
];

type DBTab = 'RELATIONAL' | 'OBJECT' | 'VECTOR' | 'GRAPH' | 'CALIBRATION' | 'ETL';

const DatabasesView: React.FC = () => {
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
    const [buckets, setBuckets] = useState<any[]>([]);
    const [trainingPairs, setTrainingPairs] = useState<SqlTrainingPair[]>([]);
    const [cypherQuery, setCypherQuery] = useState("MATCH (c:Company)-[:WON_TENDER]->(t:Tender)\nWHERE t.amount > 1000000\nRETURN c, t LIMIT 25");

    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        const fetchRelational = async () => {
            setLoading(true);
            try {
                const data = await api.getDatabases();
                if (isMounted.current) setTables(Array.isArray(data) ? data : []);
            } catch (e) { console.error("Failed to fetch tables", e); }
            finally { if (isMounted.current) setLoading(false); }
        };
        const fetchVectors = async () => {
            setLoading(true);
            try {
                const data = await api.getVectors();
                if (isMounted.current) setVectorData(Array.isArray(data) ? data : []);
            } catch (e) { console.error("Failed to fetch vectors", e); }
            finally { if (isMounted.current) setLoading(false); }
        };
        const fetchBuckets = async () => {
            setLoading(true);
            try {
                const data = await api.getBuckets();
                if (isMounted.current) setBuckets(Array.isArray(data) ? data : []);
            } catch (e) { console.error("Failed to fetch buckets", e); }
            finally { if (isMounted.current) setLoading(false); }
        };
        const fetchTrainingPairs = async () => {
            setLoading(true);
            try {
                const data = await api.getTrainingPairs();
                if (isMounted.current) setTrainingPairs(Array.isArray(data) ? data : []);
            } catch (e) { console.error("Failed to fetch training pairs", e); }
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
                title={`SQL Terminal Interface: ${queryModal.table}`}
                icon={<Terminal size={20} className="text-cyan-400" />}
                size="xl"
            >
                <div className="p-4 h-[550px] flex flex-col glass-morphism rounded-2xl border border-white/10 bg-black/60">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Connection: POSTGRES_MASTER</span>
                    </div>
                    <textarea
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        className="w-full h-40 bg-slate-950 border border-white/5 rounded-2xl p-6 text-cyan-400 font-mono text-sm focus:border-cyan-500/50 outline-none resize-none mb-6 shadow-inner transition-all"
                        placeholder="ENTER SQL COMMANDS..."
                        title="SQL Query"
                    />
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-4">
                            <span className="text-[10px] font-mono text-slate-300">Rows: {queryResult?.length || 0}</span>
                            <span className="text-[10px] font-mono text-slate-300">Execution time: 14ms</span>
                        </div>
                        <button onClick={handleExecute} disabled={isExecuting} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all active:scale-95 disabled:opacity-50">
                            {isExecuting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} Execute Query
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
                                <span className="font-mono text-xs text-slate-300">TERMINAL_IDLE</span>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Neural Hub Header v55 Extreme */}
            <div className="relative z-20 mt-12 mb-16 rounded-[48px] border border-white/5 bg-slate-950/40 backdrop-blur-[40px] p-10 flex flex-col lg:flex-row items-center gap-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
                <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                <div className="relative w-40 h-40 shrink-0">
                    <div className="absolute inset-0 border border-cyan-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
                    <div className="absolute inset-4 border border-dashed border-cyan-400/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-400/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)] backdrop-blur-xl">
                            <DatabaseZap className="w-10 h-10 text-cyan-400" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 text-center lg:text-left relative z-10">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full font-black text-[10px] uppercase tracking-[0.3em] text-cyan-400 mb-6">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        СИНХРОНІЗОВАНЕ ЯДРО ЗНАНЬ v55
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
                        НЕЙРОННА СІТКА <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">СХОВИЩ</span>
                    </h1>
                    <p className="text-slate-400 font-medium max-w-2xl leading-relaxed text-sm lg:text-base">
                        Централізований шлюз до всіх рівнів зберігання даних. Від реляційних транзакцій до графових топологій та високочастотних векторних пошуків.
                    </p>
                </div>

                <div className="flex gap-4 shrink-0 w-full lg:w-auto">
                    {[
                        { label: 'ЄМНІСТЬ', val: '18.4 TB', color: 'text-cyan-400', icon: HardDrive },
                        { label: 'СТАН СИСТЕМИ', val: '100%', color: 'text-emerald-400', icon: ShieldCheck }
                    ].map((s, idx) => (
                        <div key={idx} className="flex-1 lg:w-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-center shadow-lg backdrop-blur-xl transition-all hover:border-cyan-500/30">
                            <s.icon size={16} className={cn("mx-auto mb-3", s.color)} />
                            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1">{s.label}</p>
                            <p className={cn("text-xl font-black font-mono", s.color)}>{s.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom V55 Tab Selector */}
            <div className="sticky top-24 z-40 px-4">
                <div className="max-w-fit mx-auto p-2 bg-slate-900/80 backdrop-blur-2xl border border-white/5 rounded-3xl flex flex-wrap shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
                    {[
                        { id: 'ETL', label: 'ПОТІК ETL', icon: Network, color: 'text-amber-400' },
                        { id: 'RELATIONAL', label: 'Реляційні', icon: Database, color: 'text-blue-400' },
                        { id: 'OBJECT', label: 'S3 Об\'єкти', icon: Server, color: 'text-indigo-400' },
                        { id: 'VECTOR', label: 'Векторний ШІ', icon: Layers, color: 'text-emerald-400' },
                        { id: 'GRAPH', label: 'Топологія Графу', icon: Share2, color: 'text-purple-400' },
                        { id: 'CALIBRATION', label: 'ШІ Синтез', icon: Binary, color: 'text-rose-400' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "relative py-3.5 px-6 rounded-[20px] transition-all duration-500 flex items-center gap-3 overflow-hidden group",
                                    isActive ? "bg-white/10 shadow-lg scale-105 z-10" : "hover:bg-white/5"
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
                                        className={cn("absolute inset-0 border-b-2 bg-gradient-to-t from-white/10 to-transparent", tab.color.replace('text', 'border'))}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Display v55 */}
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
                        {activeTab === 'OBJECT' && <ObjectStorageView buckets={buckets.length > 0 ? buckets : mockMinioBuckets} />}
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
