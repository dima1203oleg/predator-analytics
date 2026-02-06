import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, RefreshCw, Server, Shield, Globe, FileText,
  CheckCircle, XCircle, AlertTriangle, Play, Settings,
  Radio, MessageSquare, Lock, Plus, X, Link, Terminal, Upload
} from 'lucide-react';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { PipelineMonitor } from '../components/pipeline/PipelineMonitor';
import { api } from '../services/api';
import { cn } from '../utils/cn';
import { useAppStore } from '../store/useAppStore';

// --- TYPES ---
interface Connector {
  id: string;
  name: string;
  type: 'api' | 'scraper' | 'file' | 'stream' | 'telegram' | 'website';
  status: 'active' | 'idle' | 'error' | 'syncing';
  lastSync: string;
  itemsCount: number;
  icon?: any;
  description: string;
  config?: any;
}

// --- COMPONENTS ---

const StatusIndicator = ({ status }: { status: string }) => {
    if (status === 'active') return <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>Активний</span>;
    if (status === 'syncing') return <span className="flex items-center gap-1.5 text-xs text-blue-400 font-bold uppercase tracking-wider"><RefreshCw className="w-3 h-3 animate-spin"/>Синхронізація</span>;
    if (status === 'error') return <span className="flex items-center gap-1.5 text-xs text-rose-400 font-bold uppercase tracking-wider"><XCircle className="w-3 h-3"/>Помилка</span>;
    return <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider"><CheckCircle className="w-3 h-3"/>Очікування</span>;
};

const ConnectorCard = ({ connector, onSync }: { connector: Connector, onSync: (id: string) => void }) => {
    const Icon = connector.type === 'telegram' ? MessageSquare :
                 connector.type === 'website' ? Globe :
                 connector.type === 'file' ? FileText : Database;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "bg-slate-900 border rounded-xl p-6 relative overflow-hidden group transition-all",
                connector.status === 'error' ? 'border-rose-900/50' :
                connector.status === 'active' ? 'border-emerald-500/20 hover:border-emerald-500/50 shadow-lg shadow-emerald-900/10' :
                'border-slate-800 hover:border-slate-700'
            )}
        >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border",
                    connector.type === 'telegram' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                    connector.type === 'website' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                    'bg-slate-800 border-slate-700 text-slate-400'
                )}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors" title="Налаштування" aria-label="Налаштування">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onSync(connector.id)}
                        disabled={connector.status === 'syncing'}
                        className={cn("p-2 rounded-lg transition-colors border",
                            connector.status === 'syncing' ? "bg-blue-500/10 border-blue-500/20 text-blue-400 cursor-wait" :
                            "bg-slate-800 border-slate-700 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
                        )}
                    >
                        {connector.status === 'syncing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                </div>
            </div>

            <div className="relative z-10 mb-4">
                <h3 className="text-lg font-bold text-slate-100 mb-1 truncate" title={connector.name}>{connector.name}</h3>
                <p className="text-sm text-slate-400 leading-relaxed min-h-[40px] line-clamp-2">{connector.description || connector.config?.url || 'Немає опису'}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800 relative z-10">
                <StatusIndicator status={connector.status} />
                <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Об'єктів</div>
                    <div className="text-sm font-mono text-slate-300">{connector.itemsCount?.toLocaleString('uk-UA') || 0}</div>
                </div>
            </div>

             {/* Live Activity Pulse for Active Streams */}
             {connector.status === 'active' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-50 animate-pulse" />
             )}
        </motion.div>
    );
};

const AddSourceModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (type: string, url: string, file?: File | null) => Promise<void> }) => {
    const [type, setType] = useState('website');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (type !== 'file' && !url) return;
        if (type === 'file' && !file) return;

        setLoading(true);
        await onAdd(type, type === 'file' ? file?.name || 'Uploaded File' : url, file);
        setLoading(false);
        setUrl('');
        setFile(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-slate-900/90 border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl relative backdrop-blur-2xl panel-3d"
            >
                <div className="absolute inset-0 scanline opacity-5 pointer-events-none" />
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors" title="Закрити" aria-label="Закрити">
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                    <Plus className="w-6 h-6 text-emerald-500 dynamic-color-pulse rounded-full" />
                    <span className="tracking-tighter">ADD_DATA_SOURCE</span>
                </h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Тип Джерела</label>
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                type="button"
                                onClick={() => setType('website')}
                                className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                    type === 'website' ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                )}
                            >
                                <Globe className="w-6 h-6" />
                                <span className="font-medium text-[10px] uppercase tracking-wider">Сайт</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('telegram')}
                                className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                    type === 'telegram' ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                )}
                            >
                                <MessageSquare className="w-6 h-6" />
                                <span className="font-medium text-[10px] uppercase tracking-wider">Telegram</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('file')}
                                className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                    type === 'file' ? "bg-amber-500/10 border-amber-500 text-amber-400" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                )}
                            >
                                <FileText className="w-6 h-6" />
                                <span className="font-medium text-[10px] uppercase tracking-wider">Файл</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                            {type === 'website' ? 'URL Адреса' : type === 'telegram' ? 'Посилання на Канал / @username' : 'Виберіть Файл'}
                        </label>
                        <div className="relative">
                            {type === 'file' ? (
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50 hover:bg-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group"
                                    >
                                        {file ? (
                                            <div className="flex flex-col items-center gap-2 text-amber-400">
                                                <FileText className="w-8 h-8" />
                                                <span className="text-[10px] font-mono font-bold truncate max-w-[200px]">{file.name}</span>
                                                <span className="text-[8px] opacity-50">{(file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-300">
                                                <Upload className="w-8 h-8" />
                                                <span className="text-[10px] uppercase font-black tracking-widest">Обрати файл для завантаження</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            ) : (
                                <>
                                    <Link className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder={type === 'website' ? "https://example.com" : "https://t.me/news_channel"}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none font-mono text-sm"
                                        autoFocus
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (type === 'file' ? !file : !url)}
                        className={cn(
                            "w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed",
                            type === 'file' ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
                        )}
                    >
                        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                        {loading ? 'Ініціалізація...' : 'Підключити та Просканувати'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

const ParsersView = () => {
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [loading, setLoading] = useState(true);
    const [etlStatus, setEtlStatus] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const [conRes, etlRes] = await Promise.allSettled([
                api.getConnectors(),
                (api as any).v25.getEtlStatus()
            ]);

            if (conRes.status === 'fulfilled' && Array.isArray(conRes.value)) {
                setConnectors(conRes.value);
            }
            if (etlRes.status === 'fulfilled') {
                setEtlStatus(etlRes.value);
            }
        } catch (e) {
            console.error("Sync error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSync = async (id: string) => {
        try {
             // Optimistic update
             setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'syncing' } : c));
             await api.syncConnector(id);
             // Status will update on next poll
        } catch (e) {
             console.error(e);
        }
    };

    const handleAddSource = async (type: string, url: string, file?: File | null) => {
        try {
            let fileId: string | undefined = undefined;

            if (type === 'file' && file) {
                // 1. Upload File
                const uploadRes = await api.ingestion.uploadFile(file);
                fileId = uploadRes.file_id;
            }

            // 2. Start Pipeline Job
            const jobRes = await api.ingestion.startJob({
                source_type: type,
                file_id: fileId,
                url: type !== 'file' ? url : undefined
            });

            console.log("Pipeline started:", jobRes);
            setIsModalOpen(false);

            // Set active job for PipelineMonitor
            setActiveJobId(jobRes.job_id);

        } catch (e: any) {
            console.error("Failed to create source", e);
            const msg = e.response?.data?.detail || e.message || "Unknown error";
            alert(`Помилка створення джерела: ${msg}`);
        }
    };

    return (
        <div className="flex flex-col space-y-8 pb-20 relative min-h-screen">
            <AdvancedBackground />
            <AddSourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddSource} />

            {/* Pipeline Monitor - shows when job is active */}
            {activeJobId && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full">
                        <PipelineMonitor
                            jobId={activeJobId}
                            onComplete={() => {
                                setActiveJobId(null);
                                loadData();
                            }}
                            onError={(error) => {
                                console.error('Pipeline error:', error);
                            }}
                        />
                        <button
                            onClick={() => setActiveJobId(null)}
                            className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                            aria-label="Закрити монітор"
                        >
                            Сховати монітор (pipeline продовжує працювати)
                        </button>
                    </div>
                </div>
            )}


            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                     <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 mb-2">
                        КЕРУВАННЯ ДЖЕРЕЛАМИ (DATA SOURCES)
                    </h1>
                     <p className="text-slate-400 text-lg">
                        Керування потоками даних, парсерами та API інтеграціями.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/20 font-bold tracking-wide"
                >
                    <Plus size={20} />
                    ДОДАТИ ДЖЕРЕЛО
                </button>
            </div>


            {/* Metrics */}
            {etlStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                     <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Загальний Об'єм</div>
                        <div className="text-2xl font-mono text-white">{etlStatus.total_docs?.toLocaleString() || '0'}</div>
                     </div>
                     <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Оброблено (24г)</div>
                        <div className="text-2xl font-mono text-emerald-400">+{etlStatus.new_docs_24h || 0}</div>
                     </div>
                     <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Активні Процеси (Workers)</div>
                        <div className="text-2xl font-mono text-blue-400">{etlStatus.active_workers || 0}</div>
                     </div>
                     <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Черга Індексації</div>
                        <div className="text-2xl font-mono text-slate-300">{etlStatus.queue_size || 0}</div>
                     </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectors.map(c => (
                    <ConnectorCard key={c.id} connector={c} onSync={handleSync} />
                ))}

                {/* Add New Connector Card */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-emerald-500/50 hover:text-emerald-400 transition-all hover:bg-slate-900/50 group min-h-[220px]"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 ml-1" />
                    </div>
                    <span className="font-medium">Додати джерело</span>
                </button>
            </div>

            {!loading && connectors.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    <Database className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Джерела даних відсутні. Додайте перший сайт або канал для початку індексації.</p>
                </div>
            )}
        </div>
    );
};

export default ParsersView;
