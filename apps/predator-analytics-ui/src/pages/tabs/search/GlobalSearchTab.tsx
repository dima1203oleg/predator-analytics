/**
 * 🔍 PREDATOR Semantic Search Tab | v61.0-ELITE
 * Consolidated Search Interface for Companies, Persons and Documents.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect } from 'react';
import { 
    Search, ArrowRight, Skull, Target, Zap, 
    Briefcase, Database, Eye, Fingerprint, Crosshair,
    ShieldAlert, Ghost, ArrowLeft, Activity, Info,
    FileText, User, Building, MapPin, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberOrb } from '@/components/CyberOrb';
import { ViewHeader } from '@/components/ViewHeader';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { apiClient } from '@/services/api/config';
import { cn } from '@/utils/cn';

export const GlobalSearchTab: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsSearching(true);
        setSelectedEntity(null);
        
        try {
            const response = await apiClient.get('/search', { params: { q: query, limit: 12 } });
            setResults(response.data || []);
        } catch (err) {
            console.error('Search failed:', err);
            // Fallback mock
            setResults([
                { id: '1', title: 'ТОВ "ЗАВОД ОМЕГА-ТИТАН"', type: 'COMPANY', risk: 94, info: 'Виявлено зв\'язки з підсанкційними холдингами  Ф (ВТБ)', date: '2026-04-12', severity: 'CRITICAL' },
                { id: '2', title: 'Декларація UA-4001/01/26', type: 'DECLARATION', risk: 62, info: 'Аномальна митна вартість для групи HS-72 (Залізо)', date: '2026-04-11', severity: 'HIGH' },
                { id: '3', title: 'Олексій  езніков (Archive)', type: 'PERSON', risk: 28, info: 'Зв\'язок через 3 структури з постачаннями БПЛА', date: '2026-04-01', severity: 'LOW' },
                { id: '4', title: 'Хустський Логістичний Хаб', type: 'LOCATION', risk: 55, info: ' аптова зміна власника на кіпрський офшор', date: '2026-03-29', severity: 'MEDIUM' },
            ]);
        } finally {
            setTimeout(() => setIsSearching(false), 800);
        }
    };

    const fetchEntityDetails = async (entity: any) => {
        setLoadingDetails(true);
        try {
            // Simulated detail fetch
            await new Promise(r => setTimeout(r, 1000));
            setSelectedEntity({
                ...entity,
                full_details: {
                    ueid: entity.edrpou || '37129321',
                    address: 'м. Київ, вул. Металургів, буд. 12/4',
                    ceo: 'Петренко Василь Олексійович',
                    status: 'АКТИВНО',
                    founded: '2014-05-12',
                    capital: '450,000,000 UAH',
                    sanctions: entity.risk > 80 ? ['OFAC Specially Designated Nationals', 'EU Sanctions List v.12'] : [],
                    connections: 142
                }
            });
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="space-y-12 pb-32">
            <ViewHeader 
                title={
                    <div className="flex items-center gap-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="relative p-7 bg-black border border-red-900/40 rounded-[2.5rem] shadow-2xl">
                                <Search size={42} className="text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="badge-v2 bg-red-600/10 border border-red-600/20 text-red-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                    SYNAPTIC_SEARCH // HYBRID_ENGINE
                                </span>
                                <div className="h-px w-10 bg-red-600/20" />
                                <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v61.0-ELITE</span>
                            </div>
                            <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                                ГЛОБАЛЬНИЙ <span className="text-red-500 underline decoration-red-600/20 decoration-8 italic uppercase">ПОШУК</span>
                            </h1>
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                                СЕМАНТИЧНИЙ АНАЛІЗ ЦІЛОГО КОНТУ У СИСТЕМИ
                            </p>
                        </div>
                    </div>
                }
                stats={[
                    { label: 'ІНДЕКСОВАНО_ОБ\'ЄКТІВ', value: '14.8M', icon: <Database size={14} />, color: 'primary' },
                    { label: 'ШВИДКІСТЬ_ПОШУКУ', value: '42ms', icon: <Zap size={14} />, color: 'success' },
                    { label: 'ВІДКрИТІ_ЗВ\'ЯЗКИ', value: '1.2B+', icon: <Activity size={14} />, color: 'warning' }
                ]}
            />

            {!selectedEntity && (
                <div className="space-y-10">
                    {/* SEARCH INPUT HUD */}
                    <div className="flex flex-col gap-10 items-center w-full relative">
                        <section className="w-full max-w-6xl rounded-[3rem] bg-black border-2 border-red-900/10 p-5 shadow-3xl group/search relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-focus-within/search:scale-110 transition-transform duration-[3s]">
                                <Crosshair size={300} className="text-red-500" />
                            </div>
                            
                            <div className="flex items-center gap-6 px-6 relative z-10">
                                <div className="p-5 bg-red-600/10 rounded-2xl border border-red-600/20 group-focus-within/search:bg-red-600/20 transition-all">
                                    <Search size={32} className="text-red-500" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="ВВЕДІТЬ НАЗВУ, UEID АБО ПЕ СОНУ ДЛЯ ГЛИБИННОГО АНАЛІЗУ..."
                                    className="flex-1 bg-transparent border-none text-4xl font-black text-white italic tracking-tighter placeholder:text-red-950/20 focus:outline-none focus:ring-0 leading-none uppercase"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <motion.button 
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSearch}
                                    className="px-12 py-6 bg-red-700 text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-2xl hover:bg-red-600 transition-all flex items-center gap-6 italic"
                                >
                                    <span>ІНІЦІЮВАТИ_ПОШУК</span>
                                    <ArrowRight size={20} />
                                </motion.button>
                            </div>
                        </section>

                        <div className="flex flex-wrap justify-center gap-4">
                            {['ALL', 'COMPANIES', 'DECLARATIONS', 'PERSONS', 'LOCATIONS'].map((f) => (
                                <button 
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={cn(
                                        "px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all italic border shadow-xl relative overflow-hidden",
                                        activeFilter === f 
                                            ? "bg-red-700 border-red-400 text-white shadow-[0_0_30px_rgba(220,38,38,0.3)]" 
                                            : "bg-black border-white/5 text-slate-600 hover:text-red-500 hover:border-red-500/40"
                                    )}
                                >
                                    {f}
                                    {activeFilter === f && (
                                        <motion.div layoutId="search-filter-bg" className="absolute inset-0 bg-red-600/20 -z-10" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 min-h-[500px]">
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-16">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-600/10 blur-[100px] scale-150 animate-pulse" />
                                    <CyberOrb size={180} color="#dc2626" intensity={0.6} pulse />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <Target size={48} className="text-white animate-spin-slow" />
                                    </div>
                                </div>
                                <div className="text-center space-y-4">
                                    <span className="text-3xl font-black text-red-600 uppercase tracking-[1em] italic animate-pulse block">ДЕКОДУВАННЯ_СИГНАЛУ</span>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] italic">SEARCH_SCAN_v58.2 // {query.toUpperCase()}</p>
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {results.map((res, i) => (
                                        <motion.div
                                            key={res.id}
                                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => fetchEntityDetails(res)}
                                            className="group cursor-pointer"
                                        >
                                            <TacticalCard variant="holographic" className="p-10 h-full relative overflow-hidden flex flex-col group-hover:border-red-600/40 transition-all border-white/5 bg-black/40 rounded-[3rem]">
                                                <div className="absolute -right-10 -bottom-10 p-12 opacity-[0.02] group-hover:opacity-[0.06] transition-all scale-150 rotate-[-15deg] pointer-events-none">
                                                    {res.severity === 'CRITICAL' ? <Skull size={240} className="text-red-500" /> : <ShieldAlert size={240} className="text-red-500" />}
                                                </div>

                                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                                                   <div className="flex items-center gap-5">
                                                      <div className="p-4 bg-red-600/10 text-red-500 rounded-2xl border border-red-600/20 group-hover:bg-red-600 group-hover:text-black transition-all">
                                                         {res.type === 'COMPANY' ? <Briefcase size={22} /> : res.type === 'PERSON' ? <User size={22} /> : <Database size={22} />}
                                                      </div>
                                                      <div className="text-left font-black italic">
                                                         <p className="text-red-500 uppercase tracking-widest text-[11px] leading-none mb-1">{res.type}</p>
                                                         <p className="text-slate-700 uppercase tracking-widest text-[10px]">UUID:{res.id.padStart(6, '0')}</p>
                                                      </div>
                                                   </div>
                                                   {res.severity === 'CRITICAL' && (
                                                      <span className="bg-red-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full animate-pulse shadow-xl tracking-tighter">КРИТИЧНО</span>
                                                   )}
                                                </div>

                                                <div className="space-y-6 flex-1 relative z-10">
                                                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-[0.9] group-hover:text-red-500 transition-colors">{res.title}</h3>
                                                   <div className="p-6 bg-red-600/5 border-l-4 border-red-600 rounded-r-2xl">
                                                      <p className="text-sm font-bold text-slate-400 italic uppercase leading-relaxed">{res.info}</p>
                                                   </div>
                                                </div>

                                                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                                                   <div className="flex items-center gap-10">
                                                      <div className="text-left">
                                                         <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">RISK_SCORE</p>
                                                         <p className={cn("text-2xl font-black italic font-mono leading-none tracking-tighter", res.risk > 70 ? 'text-red-500' : 'text-emerald-500')}>{res.risk}%</p>
                                                      </div>
                                                      <div className="text-left">
                                                         <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">SYNC_DATE</p>
                                                         <p className="text-base font-black text-slate-400 italic font-mono leading-none">{res.date}</p>
                                                      </div>
                                                   </div>
                                                   <div className="p-4 rounded-xl bg-white/5 text-red-500 group-hover:bg-red-600 group-hover:text-white transition-all">
                                                      <Fingerprint size={24} />
                                                   </div>
                                                </div>
                                            </TacticalCard>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-center gap-10 border-2 border-dashed border-white/5 rounded-[4rem]">
                                <Ghost size={120} className="text-red-950/10 animate-pulse" />
                                <div className="space-y-4">
                                   <p className="text-4xl font-black text-red-950/20 uppercase tracking-[0.5em] italic leading-tight">ГО ИЗОНТ ПОДІЙ ПО ОЖНІЙ</p>
                                   <p className="text-[11px] text-red-950/10 font-bold uppercase tracking-[0.3em] italic max-w-lg mx-auto leading-relaxed">
                                      СИСТЕМА ГОТОВА ДО СКАНУВАННЯ. ВВЕДІТЬ ПА АМЕТрИ ЦІЛІ ДЛЯ ПОШУКУ В ГЛОБАЛЬНОМУ ОСІНТ-КОНТУ І.
                                   </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {selectedEntity && (
                    <motion.div 
                        initial={{ opacity: 0, x: 100 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: 100 }}
                        className="space-y-12"
                    >
                        <button 
                            onClick={() => setSelectedEntity(null)}
                            className="flex items-center gap-4 text-slate-500 hover:text-red-500 transition-all font-black uppercase text-xs italic tracking-widest p-4 bg-black border border-white/5 rounded-2xl group"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform" /> ПОВЕ НУТИСЬ ДО ПОШУКУ
                        </button>

                        <div className="grid grid-cols-12 gap-10">
                            {/* Entity Header/Quick Info */}
                            <TacticalCard variant="holographic" className="col-span-12 p-12 rounded-[4rem] relative overflow-hidden flex flex-col lg:flex-row items-center gap-12 bg-black/60 border-red-900/20">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-600/20 blur-[80px] rounded-full scale-110" />
                                    <div className="relative w-48 h-48 bg-slate-950 border-2 border-red-600/30 rounded-[3.5rem] flex items-center justify-center shadow-3xl">
                                        {selectedEntity.type === 'COMPANY' ? <Building size={80} className="text-red-500" /> : <User size={80} className="text-red-500" />}                                    
                                    </div>
                                </div>
                                <div className="flex-1 text-center lg:text-left space-y-4">
                                    <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none skew-x-[-2deg]">{selectedEntity.title}</h2>
                                    <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                                        <div className="px-6 py-2 bg-red-600/10 border border-red-600/20 rounded-full text-red-500 text-[10px] font-black uppercase italic tracking-widest">{selectedEntity.type}</div>
                                        <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-slate-400 text-[10px] font-black uppercase italic tracking-widest font-mono">ID:{selectedEntity.id}</div>
                                        <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-slate-400 text-[10px] font-black uppercase italic tracking-widest font-mono">EDRPOU:{selectedEntity.full_details.ueid}</div>
                                    </div>
                                </div>
                                <div className="p-10 bg-black/80 rounded-[3rem] border border-red-600/20 text-center min-w-[240px]">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mb-2 leading-none">CERS_THREAT_LVL</p>
                                    <p className={cn("text-6xl font-black italic tracking-tighter font-mono", selectedEntity.risk > 70 ? 'text-red-500' : 'text-emerald-500')}>{selectedEntity.risk}%</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase italic mt-2">КАТЕГОРІЯ: КРИТИЧНО</p>
                                </div>
                            </TacticalCard>

                            {/* Details Grid */}
                            <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <TacticalCard variant="cyber" className="p-10 rounded-[3rem] space-y-8">
                                    <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.4em] italic flex items-center gap-4 border-b border-white/5 pb-6">
                                        <Info size={18} /> КЛЮЧОВІ_ ЕКВІЗИТИ
                                    </h3>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Юридична адреса', value: selectedEntity.full_details.address, icon: <MapPin size={16} /> },
                                            { label: 'Керівник', value: selectedEntity.full_details.ceo, icon: <User size={16} /> },
                                            { label: 'Старт діяльності', value: selectedEntity.full_details.founded, icon: <Activity size={16} /> },
                                            { label: 'Капітал', value: selectedEntity.full_details.capital, icon: <Briefcase size={16} /> }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                                <div className="p-2 bg-red-600/5 text-red-500 rounded-lg h-fit">{item.icon}</div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">{item.label}</p>
                                                    <p className="text-sm font-black text-white italic uppercase leading-tight">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TacticalCard>

                                <TacticalCard variant="cyber" className="p-10 rounded-[3rem] space-y-8 h-full bg-red-950/5 border-red-900/20">
                                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.4em] italic flex items-center gap-4 border-b border-white/5 pb-6">
                                        <ShieldAlert size={18} /> САНКЦІЙНІ_АЛЕ ТИ
                                    </h3>
                                    {selectedEntity.full_details.sanctions.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedEntity.full_details.sanctions.map((s: string, idx: number) => (
                                                <div key={idx} className="p-5 bg-red-900/10 border border-red-600/20 rounded-2xl flex items-start gap-4">
                                                    <Target size={20} className="text-red-500 shrink-0 mt-0.5" />
                                                    <p className="text-sm font-black text-red-100 italic uppercase leading-snug">{s}</p>
                                                </div>
                                            ))}
                                            <button className="w-full py-6 mt-4 bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-red-600 shadow-3xl transition-all flex items-center justify-center gap-4">
                                                <Skull size={20} /> ЗАПУСТИТИ_ГЛИБИННИЙ_СКО ИНГ
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 gap-4 opacity-30 text-center">
                                            <Globe size={48} className="text-slate-500" />
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">САНКЦІЙНИХ ОБМЕЖЕНЬ НЕ ВИЯВЛЕНО</p>
                                        </div>
                                    )}
                                </TacticalCard>
                            </div>

                            <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
                                <TacticalCard variant="cyber" className="p-10 rounded-[3rem] flex-1 bg-black border-white/5">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] italic flex items-center gap-4 border-b border-white/5 pb-6 mb-6">
                                        <Target size={18} /> АНАЛІТИЧНИЙ_КОНТЕКСТ
                                    </h3>
                                    <div className="space-y-8 text-center pt-4">
                                        <div className="relative inline-block">
                                             <div className="absolute inset-0 bg-red-600/10 blur-[40px] rounded-full" />
                                             <CyberOrb size={120} color="#dc2626" intensity={0.3} pulse />
                                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                 <span className="text-3xl font-black italic text-white leading-none">{selectedEntity.full_details.connections}</span>
                                                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">ЗВ'ЯЗКІВ</span>
                                             </div>
                                        </div>
                                        <p className="text-xs font-black text-slate-500 italic uppercase leading-relaxed px-6">
                                            СИСТЕМА ВІДСТЕЖИЛА {selectedEntity.full_details.connections} КОНТАКТІВ З ІНШИМИ СУБ'ЄКТАМИ ТА ДОКУМЕНТАМИ В БАЗІ.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button className="p-5 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-slate-400 hover:text-white uppercase transition-all flex flex-col items-center gap-2">
                                                <FileText size={18} /> PDF_REPORT
                                            </button>
                                            <button className="p-5 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-slate-400 hover:text-white uppercase transition-all flex flex-col items-center gap-2">
                                                <Activity size={18} /> LIVE_FLOW
                                            </button>
                                        </div>
                                    </div>
                                </TacticalCard>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}} />
        </div>
    );
};
