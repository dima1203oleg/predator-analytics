/**
 * 🔍 PREDATOR Semantic Search | v57.2-WRAITH
 * НЕЙРОФОРМНИЙ ПОШУКОВИЙ ДВИГУН (INTEL NEXUS SEARCH)
 * 
 * Гібридний OSINT-пошук: Реєстри, Митниця, Медіа, Санкції, Graph.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, SlidersHorizontal, RefreshCw, 
    ArrowRight, Globe, Database, Target, Brain,
    Shield, Briefcase, FileText, User, MapPin,
    AlertTriangle, CheckCircle2, ChevronRight,
    Zap, Sparkles, Orbit, Binary, Layout,
    Skull, ShieldAlert, Activity, Eye, Ghost,
    Info, Lock, Fingerprint, Terminal, Crosshair
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { Badge } from '@/components/ui/badge';
import { CyberOrb } from '@/components/CyberOrb';
import { cn } from '@/utils/cn';

const SearchPage: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [threatLevel, setThreatLevel] = useState(42);

    const handleSearch = () => {
        if (!query.trim()) return;
        setIsSearching(true);
        setTimeout(() => {
            setResults([
                { id: '1', title: 'ТОВ "ЗАВОД ОМЕГА-ТИТАН"', type: 'COMPANY', risk: 94, info: 'Виявлено зв\'язки з підсанкційними холдингами РФ (ВТБ)', date: '2026-04-12', severity: 'CRITICAL' },
                { id: '2', title: 'Декларація UA-4001/01/26', type: 'DECLARATION', risk: 62, info: 'Аномальна митна вартість для групи HS-72 (Залізо)', date: '2026-04-11', severity: 'HIGH' },
                { id: '3', title: 'Олексій Резніков (Archive)', type: 'PERSON', risk: 28, info: 'Зв\'язок через 3 структури з постачаннями БПЛА', date: '2026-04-01', severity: 'LOW' },
                { id: '4', title: 'Хустський Логістичний Хаб', type: 'LOCATION', risk: 55, info: 'Раптова зміна власника на кіпрський офшор', date: '2026-03-29', severity: 'MEDIUM' },
            ]);
            setIsSearching(false);
            setThreatLevel(89);
        }, 2200);
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(220, 38, 38, 0.04)" />
                
                {/* Tactical Scanning Overlay */}
                <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-[0.03]">
                    <div className="w-full h-1 bg-red-600 absolute animate-[scan_8s_linear_infinite]" />
                    <div className="w-full h-full bg-[linear-gradient(rgba(220,38,38,0)_0%,rgba(220,38,38,0.05)_50%,rgba(220,38,38,0)_100%)] absolute" />
                </div>

                <div className="relative z-10 max-w-[1500px] mx-auto p-4 sm:p-12 space-y-16">
                    
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-10">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                    <div className="relative p-7 bg-black border border-red-900/40 rounded-[2.5rem] shadow-2xl">
                                        <Crosshair size={42} className="text-red-600 animate-spin-slow" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                       <span className="badge-v2 bg-red-600/10 border border-red-600/20 text-red-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                         TITAN_OSINT // SEARCH_DEEP
                                       </span>
                                       <div className="h-px w-10 bg-red-600/20" />
                                       <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v57.2-WRAITH</span>
                                    </div>
                                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
                                        ПОШУК <span className="text-red-600 underline decoration-red-600/20 decoration-8">ПРЕДАТОРА</span>
                                    </h1>
                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                                        СЕМАНТИЧНИЙ ДВИГУН РОЗВІДКИ • ГЛОБАЛЬНЕ ТРЕКУВАННЯ ОБ'ЄКТІВ
                                    </p>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'THREAT_LEVEL', value: `${threatLevel}%`, color: threatLevel > 70 ? 'danger' : 'primary', icon: <Skull size={14} />, animate: true },
                            { label: 'ENTITIES_SCAN', value: '1.42M', color: 'primary', icon: <Target size={14} /> },
                            { label: 'KERNEL_LATENCY', value: '2ms', color: 'success', icon: <Zap size={14} />, animate: true }
                        ]}
                    />

                    {/* SEARCH INPUT HUD */}
                    <div className="flex flex-col gap-12 items-center w-full relative">
                        <section className="w-full max-w-5xl rounded-[3rem] bg-black border-2 border-red-900/20 p-6 shadow-3xl group/search">
                            <div className="flex items-center gap-8 px-6">
                                <div className="p-5 bg-red-600/10 rounded-2xl border border-red-600/20 group-focus-within/search:bg-red-600/20 transition-all">
                                    <Search size={32} className="text-red-600" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="ВВЕДІТЬ НАЗВУ, UEID АБО ПЕРСОНУ..."
                                    className="flex-1 bg-transparent border-none text-3xl font-black text-white italic tracking-tighter placeholder:text-red-950/40 focus:outline-none focus:ring-0 leading-none uppercase"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <div className="flex items-center gap-6">
                                    <motion.button 
                                        whileHover={{ scale: 1.05, x: 5 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSearch}
                                        className="px-14 py-5 bg-red-700 text-white font-black rounded-[1.5rem] text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-red-600 transition-all flex items-center gap-6 italic"
                                    >
                                        <span>ІНІЦІЮВАТИ_ПОШУК</span>
                                        <ArrowRight size={20} />
                                    </motion.button>
                                </div>
                            </div>
                        </section>

                        <div className="flex flex-wrap justify-center gap-4">
                            {['ALL', 'COMPANIES', 'DECLARATIONS', 'PERSONS', 'LOCATIONS', 'CUSTOMS'].map((f) => (
                                <button 
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={cn(
                                        "px-10 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all italic border shadow-lg skew-x-[-8deg]",
                                        activeFilter === f 
                                            ? "bg-red-700 border-red-400 text-white shadow-xl" 
                                            : "bg-black/80 border-white/5 text-slate-600 hover:text-red-500 hover:border-red-500/40"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-20">
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-16">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-600/20 blur-[100px] scale-150 animate-pulse" />
                                    <CyberOrb size={200} color="#dc2626" intensity={0.6} pulse />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <Eye size={40} className="text-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-4">
                                    <span className="text-2xl font-black text-red-600 uppercase tracking-[1em] italic animate-pulse block">АНАЛІЗ_КРИМІНАЛЬНИХ_ВЕКТОРІВ</span>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] italic">SEARCH_IN_PROGRESS_v57.2</p>
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                <AnimatePresence mode="popLayout">
                                    {results.map((res, i) => (
                                        <motion.div
                                            key={res.id}
                                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="group relative h-full"
                                        >
                                            <section className="relative h-full rounded-[3rem] bg-black border-2 border-white/[0.04] p-10 shadow-3xl overflow-hidden hover:border-red-600/30 transition-all flex flex-col">
                                                <div className="absolute -right-10 -bottom-10 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.1] transition-all scale-150 rotate-[-15deg]">
                                                    {res.severity === 'CRITICAL' ? <Skull size={300} className="text-red-600" /> : <ShieldAlert size={300} className="text-red-900" />}
                                                </div>

                                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.04]">
                                                   <div className="flex items-center gap-5">
                                                      <div className="p-3 bg-red-600/10 text-red-600 rounded-xl border border-red-600/20">
                                                         {res.type === 'COMPANY' ? <Briefcase size={20} /> : <Database size={20} />}
                                                      </div>
                                                      <div className="text-left font-black italic">
                                                         <p className="text-[11px] text-red-600 uppercase tracking-widest leading-none">{res.type}</p>
                                                         <p className="text-[8px] text-slate-700 uppercase tracking-widest mt-1">UUID:{res.id.padStart(6, '0')}</p>
                                                      </div>
                                                   </div>
                                                   {res.severity === 'CRITICAL' && (
                                                      <span className="bg-red-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full animate-pulse shadow-lg">КРИТИЧНИЙ_РИЗИК</span>
                                                   )}
                                                </div>

                                                <div className="space-y-6 flex-1">
                                                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-red-500 transition-colors">{res.title}</h3>
                                                   <div className="p-6 bg-red-600/5 border-l-4 border-red-600 rounded-r-2xl">
                                                      <p className="text-sm font-bold text-slate-300 italic uppercase leading-relaxed">{res.info}</p>
                                                   </div>
                                                </div>

                                                <div className="mt-10 pt-8 border-t border-white/[0.04] flex items-center justify-between">
                                                   <div className="flex items-center gap-10">
                                                      <div className="text-left">
                                                         <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">RISK_SCORE</p>
                                                         <p className={cn("text-2xl font-black italic font-mono leading-none tracking-tighter", res.risk > 70 ? 'text-red-500' : 'text-emerald-500')}>{res.risk}%</p>
                                                      </div>
                                                      <div className="h-10 w-px bg-white/5" />
                                                      <div className="text-left">
                                                         <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">DATA_SYNC</p>
                                                         <p className="text-lg font-black text-slate-300 italic font-mono leading-none">{res.date}</p>
                                                      </div>
                                                   </div>
                                                   <button className="flex items-center gap-4 text-[11px] font-black text-red-600 hover:text-white uppercase italic tracking-[0.2em] transition-all group/btn">
                                                      ДОСЬЄ_ОБ'ЄКТА <Fingerprint size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                                   </button>
                                                </div>
                                            </section>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40 text-center gap-10">
                                <Ghost size={120} className="text-red-950/20 animate-pulse" />
                                <div className="space-y-4">
                                   <p className="text-4xl font-black text-red-950/40 uppercase tracking-[0.8em] italic">СИСТЕМА ТИШІ</p>
                                   <p className="text-[11px] text-red-950/30 font-black uppercase tracking-[0.4em] italic leading-tight">ПРЕДАТОР ПОТРЕБУЄ ЦІЛЬ. ІНІЦІЮЙТЕ СКАНУВАННЯ.</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes scan { 0% { top: -100px; } 100% { top: 100vh; } }
                    .animate-spin-slow { animation: spin 10s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
                `}} />
            </div>
        </PageTransition>
    );
};

export default SearchPage;
