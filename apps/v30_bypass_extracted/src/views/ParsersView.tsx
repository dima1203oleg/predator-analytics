
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { useToast } from '../context/ToastContext';
import {
    Activity, Globe, RefreshCw, Shield, Code, Play, Settings,
    Search, X, Check, AlertTriangle, Database, Server, Workflow,
    Filter, Zap, UploadCloud, ChevronRight
} from 'lucide-react';
import { UAConnector } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface UAConnectorExtended extends UAConnector {
    secretRef?: string;
    schedule?: string;
}

const ConnectorCard: React.FC<{ connector: UAConnectorExtended, idx: number }> = ({ connector, idx }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const handleTest = async () => {
        setLoading(true);
        try {
            const res = await api.testConnector(connector.id);
            toast.success("Квантовий Лінк Перевірено", `${connector.name}: ${res.message} (${res.latency_ms}мс)`);
        } catch (e) { toast.error("Помилка Моста", `Неможливо синхронізуватися з ${connector.name}`); }
        finally { setLoading(false); }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className={`p-6 bg-slate-900/40 border rounded-3xl flex flex-col justify-between h-full transition-all group glass-morphism panel-3d ${connector.status === 'OFFLINE' ? 'border-rose-900/30 opacity-60' : 'border-white/5'}`}
        >
            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-1000/50 rounded-2xl border border-white/5 group-hover:border-blue-500/20 transition-all shadow-inner"><Globe size={18} className="text-blue-500" /></div>
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider truncate max-w-[140px]" title={connector.name}>{connector.name}</h4>
                            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">{connector.category}</span>
                        </div>
                    </div>
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className={`w-2.5 h-2.5 rounded-full ${connector.status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_10px_lime]' : 'bg-rose-500 shadow-[0_0_10px_red]'}`} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] mb-6">
                    {[{ l: 'ПОТІК', v: connector.rpm + ' RPM' }, { l: 'ЗАТРИМКА', v: connector.latency + 'мс' }].map(s => (
                        <div key={s.l} className="bg-slate-950/50 p-3 rounded-2xl border border-white/5 text-center">
                            <div className="text-slate-500 font-bold uppercase tracking-tighter mb-1">{s.l}</div>
                            <div className="font-mono text-white text-xs font-bold">{s.v}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-white/5 pt-4">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleTest} disabled={loading} className="p-2.5 bg-slate-950/80 rounded-xl text-slate-500 hover:text-white border border-white/5 transition-all"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2.5 bg-slate-950/80 rounded-xl text-slate-500 hover:text-white border border-white/5 transition-all"><Play size={14} /></motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2.5 bg-slate-950/80 rounded-xl text-slate-500 hover:text-white border border-white/5 transition-all"><Settings size={14} /></motion.button>
            </div>
        </motion.div>
    );
};

const ParsersView: React.FC = () => {
    const [connectors, setConnectors] = useState<UAConnectorExtended[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const isMounted = useRef(false);

    const chartData = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ time: i, val: 300 })), []);

    useEffect(() => {
        isMounted.current = true;
        api.getConnectors().then(data => { if (isMounted.current) { setConnectors(data as UAConnectorExtended[]); setLoading(false); } });
        return () => { isMounted.current = false; };
    }, []);

    const filtered = connectors.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto relative z-10">
            <ViewHeader
                title="Ядро Нейронного Прийому"
                icon={<Workflow size={20} className="icon-3d-amber" />}
                breadcrumbs={['ДАНІ', 'ПРИЙОМ', 'ПАЙПЛАЙНИ']}
                stats={[
                    { label: 'Точки Прийому', value: String(connectors.length), icon: <Globe size={14} />, color: 'primary' },
                    { label: 'Пропускна здатність', value: '18.4 GB/s', icon: <Zap size={14} />, color: 'warning', animate: true },
                    { label: 'Точність Синхрону', value: '99.98%', icon: <Shield size={14} />, color: 'success' },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <TacticalCard variant="holographic" title="Швидкість Глобального Потоку" className="glass-morphism panel-3d h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs><linearGradient id="pIngest" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                                <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="url(#pIngest)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </TacticalCard>

                    <nav className="flex flex-col sm:flex-row gap-6 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Ініціалізація фільтру..." className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white focus:border-blue-500/30 outline-none glass-morphism" />
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 flex items-center gap-3"><RefreshCw size={14} /> Синхронізувати Все</motion.button>
                    </nav>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <motion.div whileHover={{ scale: 1.02 }} className="p-6 bg-blue-600/5 border-2 border-dashed border-blue-500/20 rounded-3xl flex flex-col justify-between items-center text-center group cursor-pointer hover:border-blue-500/50 transition-all h-[240px]">
                            <div className="p-5 bg-blue-600/10 rounded-full border border-blue-500/20"><UploadCloud size={32} className="text-blue-500 group-hover:scale-110 transition-transform" /></div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Пряма Ін'єкція Файлів</h4>
                                <p className="text-[10px] text-slate-500 uppercase tracking-tight leading-relaxed max-w-[150px] mx-auto">Завантажте квантові артефакти (.xlsx, .csv) до Золотого Шару.</p>
                            </div>
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Очікування Імпульсу</span>
                        </motion.div>
                        {filtered.map((c, i) => <ConnectorCard key={c.id} connector={c} idx={i} />)}
                    </div>
                </div>

                <div className="space-y-8">
                    <TacticalCard variant="holographic" title="Траєкторія Пайплайну" className="glass-morphism panel-3d">
                        <div className="space-y-8 relative py-4">
                            {[
                                { t: 'Імпульс Прийому', s: 'Celery Пакет', v: connectors.length + ' точок', c: 'bg-blue-500' },
                                { t: 'Матриця Обробки', s: 'Llama-Cleaner', v: 'Черга: 1.4k', c: 'bg-amber-500' },
                                { t: 'Семантичне Збагачення', s: 'Qdrant-Vec', v: 'Затримка: 28мс', c: 'bg-purple-500' },
                                { t: 'Фінальна Кристалізація', s: 'Postgres S3', v: 'Запис: 30 GB/s', c: 'bg-emerald-500' },
                            ].map((s, i) => (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="relative pl-12 group">
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/5 group-last:bg-transparent"></div>
                                    <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full ${s.c} ring-4 ring-black shadow-lg shadow-white/5`}></div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest">{s.t}</h4>
                                    <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{s.s}</div>
                                    <div className="mt-2 text-[9px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-1 rounded inline-block">{s.v}</div>
                                </motion.div>
                            ))}
                        </div>
                    </TacticalCard>

                    <TacticalCard variant="holographic" title="Нейронні Шлюзи Якості" className="glass-morphism panel-3d">
                        <div className="space-y-4">
                            {[
                                { l: 'Когерентність Схеми', v: '100%', c: 'text-emerald-500' },
                                { l: 'Зниження Ентропії', v: '98.4%', c: 'text-amber-500' },
                                { l: 'Темпоральна Точність', v: '99.9%', c: 'text-emerald-500' },
                            ].map(g => (
                                <div key={g.l} className="flex justify-between items-center p-4 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{g.l}</span>
                                    <span className={`text-[11px] font-black ${g.c}`}>{g.v}</span>
                                </div>
                            ))}
                        </div>
                    </TacticalCard>
                </div>
            </div>
        </div>
    );
};

export default ParsersView;
