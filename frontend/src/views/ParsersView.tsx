
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { useToast } from '../context/ToastContext';
import {
    Activity, Globe, RefreshCw, Shield, Code, Play, Settings,
    Search, X, Check, AlertTriangle, Database, Server, Workflow,
    Filter, Zap
} from 'lucide-react';
import { UAConnector } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../services/api';

interface UAConnectorExtended extends UAConnector {
    secretRef?: string;
    schedule?: string;
}

const ConnectorCard: React.FC<{ connector: UAConnectorExtended }> = ({ connector }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const handleTest = async () => {
        setLoading(true);
        try {
            const res = await api.testConnector(connector.id);
            toast.success("Тест Пройдено", `${connector.name}: ${res.message} (${res.latency_ms}ms)`);
        } catch (e) {
            toast.error("Помилка Тесту", `Не вдалося підключитися до ${connector.name}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            await api.syncConnector(connector.id);
            toast.info("Синхронізацію Розпочато", `Синхронізацію для ${connector.name} ініційовано.`);
        } catch (e) {
            toast.error("Помилка Синхронізації", `Не вдалося запустити синхронізацію для ${connector.name}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`p-4 bg-slate-900 border rounded-lg flex flex-col justify-between h-full transition-all group panel-3d ${connector.status === 'OFFLINE' ? 'border-red-900/30 opacity-70' : 'border-slate-800'
            }`}>
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-950 rounded border border-slate-800 group-hover:border-slate-700 icon-3d-blue">
                            <Globe size={16} className="text-blue-400" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-200 truncate max-w-[120px]" title={connector.name}>{connector.name}</h4>
                            <span className="text-[9px] text-slate-500 font-mono uppercase">{connector.category}</span>
                        </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${connector.status === 'ONLINE' ? 'bg-success-500 shadow-[0_0_10px_lime]' : 'bg-red-500 shadow-[0_0_10px_red]'}`}></div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                    <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/50 text-center">
                        <div className="text-slate-500">RPM</div>
                        <div className="font-mono text-slate-200">{connector.rpm}</div>
                    </div>
                    <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/50 text-center">
                        <div className="text-slate-500">Ping</div>
                        <div className="font-mono text-slate-200">{connector.latency}ms</div>
                    </div>
                </div>
            </div>

            <div className="flex gap-1 justify-end border-t border-slate-800 pt-2">
                <button onClick={handleTest} disabled={loading} className="p-1.5 rounded text-slate-400 hover:text-white btn-3d" title="Тест">
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <Code size={12} />}
                </button>
                <button onClick={handleSync} disabled={loading} className="p-1.5 rounded text-slate-400 hover:text-white btn-3d" title="Синхронізація"><Play size={12} /></button>
                <button className="p-1.5 rounded text-slate-400 hover:text-white btn-3d" title="Налаштування"><Settings size={12} /></button>
            </div>
        </div>
    );
};

const ParsersView: React.FC = () => {
    const [connectors, setConnectors] = useState<UAConnectorExtended[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(false);

    // Fake Ingestion Data
    const [chartData] = useState(Array.from({ length: 20 }, (_, i) => ({
        time: i,
        val: Math.floor(Math.random() * 500) + 200
    })));

    useEffect(() => {
        isMounted.current = true;
        const fetch = async () => {
            try {
                const data = await api.getConnectors();
                if (isMounted.current) {
                    setConnectors(data as UAConnectorExtended[]);
                    setLoading(false);
                }
            } catch (e) { console.error(e); }
        };
        fetch();
        return () => { isMounted.current = false; };
    }, []);

    const filtered = connectors.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-safe w-full max-w-[1600px] mx-auto">
            <ViewHeader
                title="Система Прийому Даних (ETL)"
                icon={<Workflow size={20} className="icon-3d-amber" />}
                breadcrumbs={['ДАНІ', 'ПАЙПЛАЙНИ ПРИЙОМУ']}
                stats={[
                    { label: 'Активні Джерела', value: String(connectors.length), icon: <Globe size={14} />, color: 'primary' },
                    { label: 'Пропускна Здатність', value: '14.2k/m', icon: <Zap size={14} />, color: 'warning', animate: true },
                    { label: 'Поріг Якості', value: '99.9%', icon: <Shield size={14} />, color: 'success' },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Pipeline Monitor */}
                <div className="lg:col-span-2 space-y-6">
                    <TacticalCard title="Ingestion Throughput (Global)" className="panel-3d">
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorIngest" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="url(#colorIngest)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </TacticalCard>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                        <div className="relative w-full sm:w-auto sm:flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                type="text"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Filter connectors..."
                                className="w-full bg-slate-900 border border-slate-700 rounded pl-8 pr-3 py-2 text-xs text-slate-200 focus:border-primary-500 outline-none"
                            />
                        </div>
                        <button className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2 btn-3d btn-3d-blue">
                            <RefreshCw size={12} /> Sync All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="col-span-full text-center py-8 text-slate-500">Loading pipelines...</div>
                        ) : (
                            filtered.map(c => <ConnectorCard key={c.id} connector={c} />)
                        )}
                    </div>
                </div>

                {/* Right: Status & Quality */}
                <div className="space-y-6">
                    <TacticalCard title="Pipeline Stages" className="panel-3d">
                        <div className="space-y-4 relative">
                            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-800"></div>

                            <div className="relative pl-8">
                                <div className="absolute left-[5px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-slate-950 z-10 shadow-[0_0_10px_blue]"></div>
                                <div className="text-sm font-bold text-slate-200">1. Ingestion</div>
                                <div className="text-[10px] text-slate-500">Celery Workers (Pull)</div>
                                <div className="mt-1 text-blue-400 text-xs font-mono">Active: {connectors.length} sources</div>
                            </div>

                            <div className="relative pl-8">
                                <div className="absolute left-[5px] top-1 w-4 h-4 rounded-full bg-yellow-500 border-4 border-slate-950 z-10 shadow-[0_0_10px_yellow]"></div>
                                <div className="text-sm font-bold text-slate-200">2. Processing</div>
                                <div className="text-[10px] text-slate-500">Normalization & Cleaning</div>
                                <div className="mt-1 text-yellow-400 text-xs font-mono">Queue: 142 items</div>
                            </div>

                            <div className="relative pl-8">
                                <div className="absolute left-[5px] top-1 w-4 h-4 rounded-full bg-purple-500 border-4 border-slate-950 z-10 shadow-[0_0_10px_purple]"></div>
                                <div className="text-sm font-bold text-slate-200">3. Enrichment</div>
                                <div className="text-[10px] text-slate-500">Geo-coding & NLP Tagging</div>
                                <div className="mt-1 text-purple-400 text-xs font-mono">Latency: 45ms</div>
                            </div>

                            <div className="relative pl-8">
                                <div className="absolute left-[5px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-slate-950 z-10 shadow-[0_0_10px_lime]"></div>
                                <div className="text-sm font-bold text-slate-200">4. Storage</div>
                                <div className="text-[10px] text-slate-500">Postgres + Qdrant + S3</div>
                                <div className="mt-1 text-green-400 text-xs font-mono">Write: 12 MB/s</div>
                            </div>
                        </div>
                    </TacticalCard>

                    <TacticalCard title="Data Quality Gates" className="panel-3d">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                                <span className="text-xs text-slate-400">Schema Valid</span>
                                <span className="text-xs font-bold text-success-500 text-glow-green">100%</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                                <span className="text-xs text-slate-400">Completeness</span>
                                <span className="text-xs font-bold text-yellow-500">98.5%</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                                <span className="text-xs text-slate-400">Timeliness</span>
                                <span className="text-xs font-bold text-success-500 text-glow-green">99.9%</span>
                            </div>
                        </div>
                    </TacticalCard>
                </div>
            </div>
        </div>
    );
};

export default ParsersView;
