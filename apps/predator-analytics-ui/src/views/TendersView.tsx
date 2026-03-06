import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, Search, RefreshCw, ExternalLink, Filter,
    ArrowRight, Landmark, Calendar, DollarSign, Tag,
    FileText, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { apiClient } from '../services/api/config';
import { PageTransition } from '../components/layout/PageTransition';
import { TacticalCard } from '../components/TacticalCard';
import { Badge } from '../components/ui/badge';
import { AdvancedBackground } from '../components/AdvancedBackground';

interface Tender {
    id: string;
    title: string;
    value: number;
    currency: string;
    status: string;
    procuringEntity: string;
    date: string;
}

const TendersView: React.FC = () => {
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    const fetchTenders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/osint_ua/prozorro/tenders?limit=20');
            if (response.data?.tenders) {
                setTenders(response.data.tenders);
                setLastUpdate(new Date().toLocaleTimeString());
            }
        } catch (err: any) {
            console.error('Failed to fetch tenders:', err);
            setError('Не вдалося завантажити дані з Prozorro. Перевірте з’єднання з API.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenders();
    }, []);

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('active')) return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase text-[9px] font-black">ACTIVE</Badge>;
        if (s.includes('complete')) return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase text-[9px] font-black">COMPLETE</Badge>;
        if (s.includes('unsuccessful')) return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 uppercase text-[9px] font-black">FAILED</Badge>;
        return <Badge className="bg-slate-800 text-slate-400 border-white/5 uppercase text-[9px] font-black">{status}</Badge>;
    };

    return (
        <PageTransition>
            <div className="min-h-screen p-10 flex flex-col gap-10 relative">
                <AdvancedBackground />

                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <Landmark size={20} className="text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">SOURCE: PROZORRO_OFFICIAL</span>
                        </div>
                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase font-display">
                            ДЕРЖАВНІ <span className="text-emerald-400">ЗАКУПІВЛІ</span>
                        </h1>
                        <p className="text-slate-400 max-w-xl mt-4 font-medium">
                            Моніторинг тендерів України в реальному часі. Аналіз учасників, сум та корупційних ризиків безпосередньо з Prozorro API.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col text-right mr-4">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ОСТАННЄ_ОНОВЛЕННЯ</span>
                            <span className="text-xs font-black text-white font-mono">{lastUpdate || '--:--:--'}</span>
                        </div>
                        <button
                            onClick={fetchTenders}
                            disabled={loading}
                            className="p-5 bg-slate-950 border border-white/5 rounded-3xl text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-xl disabled:opacity-50"
                        >
                            <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="grid grid-cols-12 gap-8 z-10">
                    <div className="col-span-12 lg:col-span-8 flex gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="ПОШУК ТЕНДЕРІВ ЗА НАЗВОЮ АБО ЄДРПОУ..."
                                className="w-full bg-slate-950/60 border border-white/5 rounded-[24px] pl-16 pr-6 py-5 text-sm text-white focus:outline-none focus:border-emerald-500/40 backdrop-blur-3xl transition-all"
                            />
                        </div>
                        <button className="px-8 py-5 bg-slate-950/60 border border-white/5 rounded-[24px] text-slate-400 hover:text-white transition-all flex items-center gap-3">
                            <Filter size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">ФІЛЬТРИ</span>
                        </button>
                    </div>

                    <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
                        <TacticalCard variant="holographic" className="p-6 bg-emerald-500/5 items-center flex flex-col justify-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">РЕАЛЬНИХ_ТЕНДЕРІВ</span>
                            <span className="text-2xl font-black text-emerald-400 font-mono">{tenders.length}</span>
                        </TacticalCard>
                        <TacticalCard variant="holographic" className="p-6 bg-blue-500/5 items-center flex flex-col justify-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">API_STATUS</span>
                            <span className="text-2xl font-black text-blue-400 font-mono">200_OK</span>
                        </TacticalCard>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-6 z-10 overflow-hidden">
                    {error && (
                        <div className="p-10 bg-rose-500/10 border border-rose-500/20 rounded-[40px] flex flex-col items-center gap-6 text-center animate-in zoom-in-95">
                            <AlertCircle size={64} className="text-rose-500" />
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">ПОМИЛКА ЗВ’ЯЗКУ</h3>
                                <p className="text-rose-400/80 max-w-md">{error}</p>
                            </div>
                            <button onClick={fetchTenders} className="px-10 py-4 bg-rose-500 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl">СПРОБУВАТИ ЗНОВУ</button>
                        </div>
                    )}

                    {loading && tenders.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {Array(6).fill(0).map((_, i) => (
                                <div key={i} className="h-64 bg-slate-950/40 border border-white/5 rounded-[40px] animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            <AnimatePresence mode="popLayout">
                                {tenders.map((tender, i) => (
                                    <motion.div
                                        key={tender.id}
                                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group"
                                    >
                                        <TacticalCard variant="matrix" className="p-8 bg-slate-950/40 border-white/5 hover:bg-slate-900/60 transition-all h-full flex flex-col relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000">
                                                <Target size={120} />
                                            </div>

                                            <div className="flex justify-between items-start mb-6">
                                                <div className="p-3 bg-slate-900 rounded-2xl border border-white/5">
                                                    <FileText size={20} className="text-emerald-400" />
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    {getStatusBadge(tender.status)}
                                                    <span className="text-[9px] font-mono text-slate-600 mt-2">ID: {tender.id.substring(0, 8)}...</span>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-tight mb-4 flex-1 line-clamp-3">
                                                {tender.title}
                                            </h3>

                                            <div className="space-y-4 mb-8">
                                                <div className="flex items-center gap-3">
                                                    <Landmark size={14} className="text-slate-500 shrink-0" />
                                                    <span className="text-[11px] font-bold text-slate-400 line-clamp-1">{tender.procuringEntity}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Calendar size={14} className="text-slate-500 shrink-0" />
                                                    <span className="text-[11px] font-mono text-slate-400">{new Date(tender.date).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-6 border-t border-white/5 flex items-end justify-between">
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">СУМА_ТЕНДЕРУ</span>
                                                    <span className="text-2xl font-black text-white font-mono leading-none">
                                                        {tender.value ? tender.value.toLocaleString() : '---'}
                                                        <span className="text-xs text-emerald-500 ml-1">{tender.currency}</span>
                                                    </span>
                                                </div>
                                                <a
                                                    href={`https://prozorro.gov.ua/tender/${tender.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg"
                                                >
                                                    <ArrowRight size={20} />
                                                </a>
                                            </div>
                                        </TacticalCard>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {tenders.length > 0 && (
                        <div className="flex justify-center mt-10">
                            <button className="px-16 py-6 bg-slate-950 border border-white/5 rounded-[32px] text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center gap-4">
                                <RefreshCw size={16} /> ЗАВАНТАЖИТИ БІЛЬШЕ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default TendersView;
