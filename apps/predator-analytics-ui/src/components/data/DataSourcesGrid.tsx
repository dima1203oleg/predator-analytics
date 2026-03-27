
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Globe, CheckCircle, Database, RefreshCw, FileSearch, Trash2, Upload } from 'lucide-react';

export interface Source {
  id: string;
  name: string;
  source_type: 'file' | 'api' | 'telegram' | 'registry';
  status: 'draft' | 'uploaded' | 'parsing' | 'indexed' | 'error';
  last_update: string;
  sector?: string;
  config?: any;
}

interface DataSourcesGridProps {
    sources: Source[];
    loading: boolean;
    analyzingSourceId: string | null;
    onAnalyze: (source: Source) => void;
    onUploadClick: () => void;
}

const getStatusText = (status: string) => {
    const map: any = {
        'indexed': 'ПРОІНДЕКСОВАНО',
        'uploaded': 'ЗАВАНТАЖЕНО',
        'parsing': 'ОБРОБКА',
        'error': 'ПОМИЛКА',
        'draft': 'ЧЕРНЕТКА'
    };
    return map[status] || status.toUpperCase();
};

export const DataSourcesGrid: React.FC<DataSourcesGridProps> = ({
    sources,
    loading,
    analyzingSourceId,
    onAnalyze,
    onUploadClick
}) => {
    return (
        <motion.div
            key="sources"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {loading ? (
                [...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 rounded-2xl bg-slate-800/30 border border-slate-700/50 animate-pulse" />
                ))
            ) : (
                sources.map((source) => (
                    <motion.div
                        key={source.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02, borderColor: 'rgba(99, 102, 241, 0.5)' }}
                        className="group relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm transition-all "
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white shadow-inner">
                                {source.source_type === 'file' ? <FileText className="text-cyan-400" size={24} /> :
                                 source.source_type === 'api' ? <Globe className="text-purple-400" size={24} /> :
                                 source.source_type === 'registry' ? <CheckCircle className="text-emerald-400" size={24} /> :
                                 <Database className="text-indigo-400" size={24} />}
                            </div>
                            <div className={`
                                flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black tracking-widest uppercase
                                ${['indexed', 'uploaded'].includes(source.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    source.status === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'}
                            `}>
                                <div className={`w-1.5 h-1.5 rounded-full ${source.status === 'indexed' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                                {getStatusText(source.status)}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 relative z-10 group-hover:text-cyan-300 transition-colors">
                            {source.name}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-6 relative z-10 uppercase tracking-tighter">
                            <span className="px-2 py-0.5 bg-slate-800 rounded border border-white/5">{source.source_type}</span>
                            {source.sector && <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">{source.sector}</span>}
                        </div>

                        <div className="space-y-3 relative z-10 border-t border-white/5 pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 font-mono uppercase">Оновлено:</span>
                                <span className="text-xs text-slate-300 font-mono italic">{new Date(source.last_update).toLocaleDateString('uk-UA')}</span>
                            </div>
                        </div>

                        {/* Накладання дій */}
                        <div className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20 backdrop-blur-sm">
                            <button
                                onClick={() => onAnalyze(source)}
                                disabled={analyzingSourceId === source.id}
                                className="p-3 bg-cyan-600 rounded-xl text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50"
                                title="Запустити AI Аналіз"
                            >
                                {analyzingSourceId === source.id ? <RefreshCw className="animate-spin" size={18} /> : <FileSearch size={18} />}
                            </button>
                            <button className="p-3 bg-slate-800 rounded-xl text-white hover:bg-slate-700 transition-all" title="Синхронізувати">
                                <RefreshCw size={18} />
                            </button>
                            <button className="p-3 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all" title="Видалити">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))
            )}

            {!loading && sources.length === 0 && (
                <motion.div
                    onClick={onUploadClick}
                    whileHover={{ scale: 1.01, borderColor: 'rgba(99, 102, 241, 0.5)' }}
                    className="h-80 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 flex flex-col items-center justify-center gap-6 cursor-pointer group transition-all col-span-full bg-gradient-to-br from-slate-900/60 to-slate-800/40"
                >
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                    >
                        <Upload className="text-indigo-400" size={48} />
                    </motion.div>
                    <div className="text-center">
                        <h3 className="text-xl text-white font-bold group-hover:text-indigo-300 uppercase tracking-wider mb-2">Перетягніть файл сюди</h3>
                        <p className="text-sm text-slate-500 uppercase font-mono">або натисніть для вибору</p>
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">XLSX</span>
                            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs font-bold border border-cyan-500/20">CSV</span>
                            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-bold border border-purple-500/20">PDF</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
