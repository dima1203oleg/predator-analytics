
import React, { useState, useEffect, useRef } from 'react';
import { ViewHeader } from '../components/ViewHeader';
import Modal from '../components/Modal';
import { Database, HardDrive, RefreshCw, Layers, Play, X, Terminal, Binary, Share2, CheckCircle2, MessageSquare, Activity } from 'lucide-react';
import { DatabaseTable, SqlTrainingPair } from '../types';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '../components/AdvancedBackground';

// Extracted Sub-views
import { RelationalView } from '../components/databases/RelationalView';
import { ObjectStorageView } from '../components/databases/ObjectStorageView';
import { VectorDBView } from '../components/databases/VectorDBView';
import { GraphDBView } from '../components/databases/GraphDBView';
import { CalibrationView } from '../components/databases/CalibrationView';
import { EtlProcessMonitor } from '../components/etl/EtlProcessMonitor';

const mockMinioBuckets = [
    { name: 'evidence-vault', type: 'Private', status: 'Active', size: '4.2 TB', count: 125400 },
    { name: 'osint-raw-shards', type: 'Public', status: 'Active', size: '8.1 TB', count: 850300 },
    { name: 'medical-phi-encrypted', type: 'Restricted', status: 'Locked', size: '1.2 TB', count: 42000 },
    { name: 'governance-archives', type: 'Private', status: 'Active', size: '4.9 TB', count: 210000 },
];

type DBTab = 'RELATIONAL' | 'OBJECT' | 'VECTOR' | 'GRAPH' | 'CALIBRATION' | 'ETL';

const MOCK_TRAINING_PAIRS: SqlTrainingPair[] = [
    {
        id: 'tp-1',
        question: 'Показати всі компанії з ризиком вище 80 за останній тиждень',
        generatedSql: 'SELECT * FROM companies WHERE risk_score > 80 AND updated_at > NOW() - INTERVAL \'7 days\'',
        schema: 'public',
        confidence: 0.98,
        status: 'PENDING',
        timestamp: '10:42:15'
    },
    {
        id: 'tp-2',
        question: 'Знайти тендери МОУ на суму понад 100 млн грн',
        generatedSql: 'SELECT * FROM tenders WHERE buyer_name LIKE \'%МОУ%\' AND amount > 100000000',
        schema: 'public',
        confidence: 0.85,
        status: 'PENDING',
        timestamp: '11:15:30'
    }
];

const DatabasesView: React.FC = () => {
    const metrics = useSystemMetrics();
    const [activeTab, setActiveTab] = useState<DBTab>('ETL'); // Default to ETL for now
    const [tables, setTables] = useState<DatabaseTable[]>([]);
    const [loading, setLoading] = useState(false);
    const [queryModal, setQueryModal] = useState<{ isOpen: boolean, table: string | null }>({ isOpen: false, table: null });
    const [isExecuting, setIsExecuting] = useState(false);
    const [queryResult, setQueryResult] = useState<any[] | null>(null);
    const [sqlQuery, setSqlQuery] = useState('');

    // Vector Inspector State
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
                if (isMounted.current) setTables(data);
            } catch (e) {
                console.error("Failed to fetch tables", e);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        const fetchVectors = async () => {
            setLoading(true);
            try {
                const data = await api.getVectors();
                if (isMounted.current) setVectorData(data);
            } catch (e) {
                console.error("Failed to fetch vectors", e);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        const fetchBuckets = async () => {
            setLoading(true);
            try {
                const data = await api.getBuckets();
                if (isMounted.current) setBuckets(data);
            } catch (e) {
                console.error("Failed to fetch buckets", e);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        const fetchTrainingPairs = async () => {
            setLoading(true);
            try {
                const data = await api.getTrainingPairs();
                if (isMounted.current) setTrainingPairs(data);
            } catch (e) {
                console.error("Failed to fetch training pairs", e);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        if (activeTab === 'RELATIONAL') fetchRelational();
        if (activeTab === 'VECTOR') fetchVectors();
        if (activeTab === 'OBJECT') fetchBuckets();
        if (activeTab === 'CALIBRATION') fetchTrainingPairs();

        return () => {
            isMounted.current = false;
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
            console.error("SQL Execution failed", e);
        } finally {
            if (isMounted.current) setIsExecuting(false);
        }
    };

    const handleExecuteCypher = async () => {
        try {
            await api.graph.execute(cypherQuery);
        } catch (e) {
            console.error("Cypher Execution failed", e);
        }
    };

    const handleVerifySql = (id: string, isCorrect: boolean) => {
        setTrainingPairs(prev => prev.map(p => p.id === id ? { ...p, status: isCorrect ? 'VERIFIED' : 'REJECTED' } : p));
    };

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
                        title="SQL Query"
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
                title="НЕЙРОННА СІТКА СХОВИЩ (STORAGE V45)"
                icon={<DatabaseIcon size={20} className="icon-3d-blue" />}
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
                    { id: 'ETL', label: 'ETL PIPELINE', icon: <Activity size={18} />, color: 'amber' },
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
                    {activeTab === 'ETL' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <EtlProcessMonitor />
                        </motion.div>
                    )}
                    {activeTab === 'RELATIONAL' && <RelationalView tables={tables} onOpenQuery={handleOpenQuery} />}
                    {activeTab === 'OBJECT' && <ObjectStorageView buckets={mockMinioBuckets} />}
                    {activeTab === 'VECTOR' && <VectorDBView vectorData={vectorData} selectedVector={selectedVector} onSelectVector={setSelectedVector} />}
                    {activeTab === 'GRAPH' && <GraphDBView cypherQuery={cypherQuery} onCypherQueryChange={setCypherQuery} onExecuteCypher={handleExecuteCypher} />}
                    {activeTab === 'CALIBRATION' && <CalibrationView trainingPairs={trainingPairs} onVerifySql={handleVerifySql} />}
                </AnimatePresence>
            </div>
        </div>
    );
};

const DatabaseIcon = Database;

export default DatabasesView;
