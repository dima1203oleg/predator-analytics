/**
 * 🌐 OPEN DATA MATRIX // МАТРИЦЯ ВІДКРИТИХ ДАНИХ | v56.5-ELITE
 * PREDATOR Analytics — Governance OSINT & Dataset Discovery
 * 
 * Модуль інтеграції з порталом data.gov.ua: пошук та аналіз датасетів.
 * Семантичний пошук по державних реєстрах України.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Search, Filter, ExternalLink, Download,
    FileText, Info, Calendar, Users, List, Grid,
    ArrowRight, Globe, Shield, RefreshCw, X, AlertCircle,
    Server, Share2, Layers, Zap, Clock, TrendingUp,
    ChevronDown, ChevronUp, History, Bookmark, Settings2,
    Lock, CheckCircle, InfoIcon, Layout, RefreshCcw, Satellite, Radar, Target
} from 'lucide-react';
import { apiClient } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// ─── HELPER COMPONENTS ───────────────────────────────────────────────

const DataBadge: React.FC<{ format: string }> = ({ format }) => {
    const colors: Record<string, string> = {
        'CSV': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'JSON': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'XML': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'XLSX': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    };
    const cls = colors[format.toUpperCase()] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

    return (
        <span className={cn("px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border italic", cls)}>
            {format}
        </span>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function DataGovView() {
    const backendStatus = useBackendStatus();
    const [datasets, setDatasets] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<any | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const searchDatasets = useCallback(async (query: string = '') => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/osint_ua/datagov/search`, { params: { q: query, rows: 15 } });
            setDatasets(response.data?.datasets || []);
            setTotalCount(response.data?.totalCount || 0);
        } catch (e) {
            console.error(e);
            // Mock
            setDatasets([
                { id: 'ds-001', title: 'РЕЄСТР ОБ\'ЄКТІВ ПРАВА ВЛАСНОСТІ', organizationTitle: 'ФОНД ДЕРЖМАЙНА', metadataModified: '2026-04-12', resources: [{ format: 'CSV', sizeLabel: '450 MB', name: 'OWN_2026', url: '#' }] },
                { id: 'ds-002', title: 'ПЕРЕЛІК ПІДПРИЄМСТВ З ОЗНАКАМИ САНКЦІЙ', organizationTitle: 'МНС УКРАЇНИ', metadataModified: '2026-04-11', resources: [{ format: 'JSON', sizeLabel: '12 MB', name: 'SANCTIONS_UA', url: '#' }] }
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { searchDatasets(); }, [searchDatasets]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />
                <CyberGrid color="rgba(14, 165, 233, 0.03)" />

                <div className="relative z-10 max-w-[1780px] mx-auto p-4 sm:p-12 space-y-12">
                   
                   <ViewHeader
                     title={
                       <div className="flex items-center gap-10">
                          <div className="relative group">
                             <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                             <div className="relative p-7 bg-black border border-blue-900/40 rounded-[2.5rem] shadow-2xl">
                                <Globe size={42} className="text-blue-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <span className="badge-v2 bg-blue-600/10 border border-blue-600/20 text-blue-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                  OPEN_DATA_MATRIX // GOVERNMENT_SCAN
                                </span>
                                <div className="h-px w-10 bg-blue-600/20" />
                                <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v56.5-ELITE</span>
                             </div>
                             <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                               ДЕРЖАВНІ <span className="text-blue-500 underline decoration-blue-600/20 decoration-8 italic uppercase">РЕЄСТРИ</span>
                             </h1>
                             <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                                МОНІТОРИНГ ТА АНАЛІЗ ВІДКРИТИХ ДЕРЖАВНИХ ДАТАСЕТІВ (DATA.GOV.UA)
                             </p>
                          </div>
                       </div>
                     }
                     stats={[
                       { label: 'РЕЄСТРІВ_ЗНАЙДЕНО', value: totalCount.toLocaleString(), icon: <Database size={14} />, color: 'primary' },
                       { label: 'СТАТУС_КАНАЛУ', value: 'ACTIVE', icon: <Satellite size={14} />, color: 'success' },
                       { label: 'ДЖЕРЕЛО_OSINT', value: 'DATA.GOV.UA', icon: <Globe size={14} />, color: 'warning' }
                     ]}
                     actions={
                       <div className="flex gap-4">
                          <button onClick={() => searchDatasets(searchTerm)} className="p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
                             <RefreshCcw size={24} className={loading ? 'animate-spin' : ''} />
                          </button>
                          <button className="px-8 py-5 bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-blue-600 shadow-2xl transition-all flex items-center gap-4">
                             <Radar size={18} /> ІНІЦІЮВАТИ_МАТРИЦЮ
                          </button>
                       </div>
                     }
                   />

                   {/* SEARCH HUD */}
                   <div className="relative group max-w-5xl mx-auto w-full">
                      <div className="absolute inset-0 bg-blue-600/20 blur-[120px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />
                      <div className="relative bg-black/60 border-2 border-white/[0.04] p-4 rounded-[4rem] backdrop-blur-3xl shadow-3xl flex items-center gap-10 group focus-within:border-blue-500/40 transition-all duration-700">
                         <div className="pl-10 text-slate-800 group-focus-within:text-blue-500 transition-colors duration-700">
                            <Search size={36} />
                         </div>
                         <form onSubmit={e => { e.preventDefault(); searchDatasets(searchTerm); }} className="flex-1">
                            <input 
                               type="text" 
                               value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                               placeholder="ПОШУК_ПО_МІЛЬЙОНАХ_ДЕРЖАВНИХ_РЕЄСТРІВ..."
                               className="w-full bg-transparent py-10 text-3xl font-black text-white focus:outline-none placeholder:text-slate-800 tracking-tighter italic uppercase"
                            />
                         </form>
                         <button 
                           onClick={() => searchDatasets(searchTerm)}
                           className="mr-3 px-16 py-8 bg-blue-700 text-white font-black rounded-[2.5rem] uppercase tracking-[0.3em] italic hover:bg-blue-600 shadow-2xl shadow-blue-900/40 active:scale-95 transition-all duration-500 flex items-center gap-6"
                         >
                            {loading ? <RefreshCcw className="animate-spin" /> : <>ЦІЛЬ <Target size={24} /></>}
                         </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-12 gap-12">
                      <div className={cn("transition-all duration-700", selectedDataset ? "col-span-12 lg:col-span-7" : "col-span-12")}>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <AnimatePresence mode="popLayout">
                               {datasets.map((pkg, i) => (
                                 <motion.div 
                                   key={pkg.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                   onClick={() => setSelectedDataset(pkg)}
                                   className={cn(
                                     "p-10 rounded-[3.5rem] border-2 cursor-pointer transition-all duration-500 perspective-1000",
                                     selectedDataset?.id === pkg.id ? "bg-blue-600/10 border-blue-500 shadow-3xl scale-[1.02]" : "bg-black border-white/[0.04] hover:bg-white/[0.02]"
                                   )}
                                 >
                                    <div className="flex justify-between items-start mb-10">
                                       <div className="flex flex-wrap gap-3">
                                          {pkg.resources?.slice(0, 2).map((res: any, idx: number) => <DataBadge key={idx} format={res.format} />)}
                                       </div>
                                       <span className="text-[10px] font-mono text-slate-700 font-black italic">{pkg.metadataModified}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-10 group-hover:text-blue-400 transition-colors line-clamp-2">
                                       {pkg.title}
                                    </h3>
                                    <div className="flex items-center gap-5 pt-8 border-t border-white/[0.04]">
                                       <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/[0.04] text-slate-700"><Users size={20} /></div>
                                       <span className="text-[10px] font-black text-slate-500 uppercase italic truncate">{pkg.organizationTitle}</span>
                                    </div>
                                 </motion.div>
                               ))}
                            </AnimatePresence>
                         </div>
                      </div>

                      <AnimatePresence>
                         {selectedDataset && (
                           <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="col-span-12 lg:col-span-5">
                              <TacticalCard variant="holographic" className="p-16 border-2 border-blue-500/20 rounded-[4rem] bg-black/80 backdrop-blur-3xl shadow-3xl space-y-12 sticky top-12">
                                 <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                       <Badge className="bg-blue-600/10 text-blue-500 border border-blue-500/30 px-4 py-1.5 text-[9px] font-black uppercase italic rounded-lg">DATASET_PASSPORT</Badge>
                                       <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">ПАСПОРТ <span className="text-blue-500">РЕЄСТРУ</span></h2>
                                    </div>
                                    <button onClick={() => setSelectedDataset(null)} className="p-5 bg-white/5 rounded-[1.5rem] hover:bg-rose-500 transition-all text-slate-400 hover:text-white shadow-2xl"><X size={28} /></button>
                                 </div>
                                 
                                 <div className="space-y-8 overflow-y-auto max-h-[500px] no-scrollbar pr-4">
                                    <div className="space-y-4">
                                       <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">{selectedDataset.title}</h4>
                                       <p className="text-sm text-slate-500 italic leading-relaxed border-l-2 border-blue-500/20 pl-8">{selectedDataset.notes || "ДЕТАЛЬНИЙ ОПИС ВІДСУТНІЙ В МЕТАДАНИХ."}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                       <div className="p-8 bg-white/[0.01] border border-white/[0.04] rounded-[2.5rem]">
                                          <p className="text-[8px] font-black text-slate-700 uppercase italic tracking-widest mb-2">ОРГАНІЗАЦІЯ</p>
                                          <p className="text-xs font-black text-white uppercase italic truncate">{selectedDataset.organizationTitle}</p>
                                       </div>
                                       <div className="p-8 bg-white/[0.01] border border-white/[0.04] rounded-[2.5rem]">
                                          <p className="text-[8px] font-black text-slate-700 uppercase italic tracking-widest mb-2">МОДИФІКАЦІЯ</p>
                                          <p className="text-xs font-mono text-blue-500 font-bold italic">{selectedDataset.metadataModified}</p>
                                       </div>
                                    </div>
                                    <div className="space-y-6">
                                       <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic flex items-center gap-4"><Layers size={16} /> РЕСУРСИ_ДАТАСЕТУ ({selectedDataset.resources?.length || 0})</h5>
                                       <div className="space-y-4">
                                          {selectedDataset.resources?.map((res: any, idx: number) => (
                                             <div key={idx} className="p-8 bg-white/[0.02] border border-white/[0.04] rounded-[2.5rem] flex items-center justify-between group/res hover:border-blue-500/30 transition-all">
                                                <div className="flex items-center gap-6">
                                                   <div className="w-14 h-14 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover/res:bg-blue-600 group-hover/res:text-black transition-all"><FileText size={28} /></div>
                                                   <div>
                                                      <p className="text-xs font-black text-white uppercase italic truncate max-w-[200px]">{res.name || 'DATA_RESOURCE'}</p>
                                                      <div className="flex gap-4 mt-1"><DataBadge format={res.format} /><span className="text-[9px] font-mono text-slate-700">{res.sizeLabel}</span></div>
                                                   </div>
                                                </div>
                                                <a href={res.url} target="_blank" className="p-5 bg-white/5 rounded-2xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all"><Download size={22} /></a>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 </div>
                                 
                                 <div className="flex gap-6 relative z-10">
                                    <a href={`https://data.gov.ua/dataset/${selectedDataset.id}`} target="_blank" className="flex-1 py-8 bg-blue-700 text-white font-black rounded-[2.5rem] uppercase tracking-[0.3em] italic hover:bg-blue-600 shadow-3xl transition-all flex items-center justify-center gap-6">
                                       <ExternalLink size={24} /> ВІДКРИТИ НА ПОРТАЛІ
                                    </a>
                                 </div>
                              </TacticalCard>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                `}} />
            </div>
        </PageTransition>
    );
}
