import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Search, Filter, ExternalLink, Download,
    FileText, Info, Calendar, Users, List, Grid,
    ArrowRight, Globe, Shield, RefreshCw
} from 'lucide-react';
import { apiClient } from '../services/api/config';
import { PageTransition } from '../components/layout/PageTransition';
import { TacticalCard } from '../components/TacticalCard';
import { Badge } from '../components/ui/badge';
import { AdvancedBackground } from '../components/AdvancedBackground';

interface Resource {
    id: string;
    name: string;
    format: string;
    url: string;
    last_modified: string;
    size: number | null;
}

interface Dataset {
    id: string;
    name: string;
    title: string;
    notes: string;
    organization: {
        title: string;
    };
    metadata_modified: string;
    resources: Resource[];
}

const DataExplorerView: React.FC = () => {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const searchDatasets = async (query: string = '') => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/osint_ua/datagov/search?q=${encodeURIComponent(query)}&rows=15`);
            if (response.data) {
                setDatasets(response.data.results || []);
                setTotalCount(response.data.count || 0);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        searchDatasets();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchDatasets(searchTerm);
    };

    return (
        <PageTransition>
            <div className="min-h-screen p-10 flex flex-col gap-10 relative">
                <AdvancedBackground />

                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <Globe size={20} className="text-blue-400" />
                            </div>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">SOURCE: DATA_GOV_UA</span>
                        </div>
                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase font-display">
                            ВІДКРИТІ <span className="text-blue-400">ДАНІ</span> УКРАЇНИ
                        </h1>
                        <p className="text-slate-400 max-w-xl mt-4 font-medium">
                            Доступ до мільйонів записів державного реєстру. Пошук, аналіз та автоматизована обробка датасетів офіційного порталу відкритих даних.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <TacticalCard variant="holographic" className="px-6 py-4 bg-blue-500/5 flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ЗНАЙДЕНО_РЕЄСТРІВ</span>
                            <span className="text-2xl font-black text-blue-400 font-mono">{totalCount.toLocaleString()}</span>
                        </TacticalCard>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="z-10 bg-slate-950/40 border border-white/5 p-2 rounded-[32px] backdrop-blur-3xl shadow-2xl flex items-center gap-4 max-w-4xl mx-auto w-full group focus-within:border-blue-500/40 transition-all">
                    <div className="pl-6 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                        <Search size={22} />
                    </div>
                    <form onSubmit={handleSearch} className="flex-1">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ПОШУК ДАТАСЕТІВ (н-р: компанії, декларації, ліцензії)..."
                            className="w-full bg-transparent py-6 text-lg font-bold text-white focus:outline-none placeholder:text-slate-600 tracking-tight"
                        />
                    </form>
                    <button
                        onClick={() => searchDatasets(searchTerm)}
                        disabled={loading}
                        className="mr-2 px-10 py-5 bg-blue-600 text-white font-black rounded-[24px] uppercase tracking-widest shadow-xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : 'ЗНАЙТИ'}
                    </button>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-12 gap-8 z-10">
                    <div className={`${selectedDataset ? 'col-span-12 lg:col-span-7' : 'col-span-12'} transition-all duration-500`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence mode="popLayout">
                                {datasets.map((pkg, i) => (
                                    <motion.div
                                        key={pkg.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedDataset(pkg)}
                                        className="cursor-pointer group"
                                    >
                                        <TacticalCard
                                            variant={selectedDataset?.id === pkg.id ? 'holographic' : 'cyber'}
                                            className={`p-6 border-white/5 group-hover:bg-slate-900/40 transition-all h-full flex flex-col ${selectedDataset?.id === pkg.id ? 'border-blue-500/40' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="px-3 py-1 bg-blue-500/10 rounded-lg text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                                                    {pkg.resources?.[0]?.format || 'DATA'}
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-600">
                                                    {new Date(pkg.metadata_modified).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-black text-white uppercase tracking-tighter line-clamp-2 mb-4 group-hover:text-blue-400 transition-colors">
                                                {pkg.title}
                                            </h3>

                                            <div className="mt-auto flex items-center gap-3">
                                                <Users size={12} className="text-slate-600" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase truncate">
                                                    {pkg.organization?.title}
                                                </span>
                                            </div>
                                        </TacticalCard>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Details Panel */}
                    <AnimatePresence>
                        {selectedDataset && (
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className="col-span-12 lg:col-span-5"
                            >
                                <TacticalCard variant="holographic" className="p-10 border-blue-500/20 h-full flex flex-col sticky top-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">
                                            ДЕТАЛІ <span className="text-blue-400">РЕЄСТРУ</span>
                                        </h2>
                                        <button onClick={() => setSelectedDataset(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                            <Download size={24} className="rotate-45" />
                                        </button>
                                    </div>

                                    <div className="space-y-8 overflow-y-auto pr-4 custom-scrollbar flex-1">
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-black text-white uppercase">{selectedDataset.title}</h3>
                                            <p className="text-sm text-slate-400 leading-relaxed italic">
                                                {selectedDataset.notes || 'Опис відсутній.'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">ОРГАНІЗАЦІЯ</span>
                                                <span className="text-xs font-bold text-white uppercase">{selectedDataset.organization?.title}</span>
                                            </div>
                                            <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">ОНОВЛЕНО</span>
                                                <span className="text-xs font-mono text-white italic">{new Date(selectedDataset.metadata_modified).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">ФАЙЛИ ТА РЕСУРСИ ({selectedDataset.resources?.length || 0})</h4>
                                            <div className="space-y-3">
                                                {selectedDataset.resources?.map((res) => (
                                                    <div key={res.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between group/res hover:border-blue-500/30 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-blue-400 font-black text-xs">
                                                                {res.format}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-bold text-white truncate max-w-[150px]">{res.name}</span>
                                                                <span className="text-[9px] font-mono text-slate-600">
                                                                    {res.size ? `${(res.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={res.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                                                        >
                                                            <Download size={16} />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
                                        <button className="flex-1 py-5 bg-blue-600 text-white font-black rounded-3xl uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                                            <Shield size={20} />
                                            <span>АНАЛІЗУВАТИ AI</span>
                                        </button>
                                        <button className="p-5 bg-slate-900 border border-white/10 rounded-3xl text-white hover:bg-white hover:text-slate-950 transition-all">
                                            <ExternalLink size={20} />
                                        </button>
                                    </div>
                                </TacticalCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </PageTransition>
    );
};

export default DataExplorerView;
