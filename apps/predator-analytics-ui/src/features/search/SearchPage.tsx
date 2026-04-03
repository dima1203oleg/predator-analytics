/**
 * 🔍 PREDATOR Semantic Search | v56.1.4.1 (TACTICAL_OVERRIDE)
 * НЕЙРОФОРМНИЙ ПОШУКОВИЙ ДВИГУН (SOVEREIGN SEARCH)
 * 
 * "УСТРАШАЮЧИЙ" РЕЖИМ: Глибинний аналіз ризиків та кримінальних структур.
 * © 2026 PREDATOR Analytics - СУВОРИЙ УКРАЇНСЬКИЙ ІНТЕРФЕЙС (HR-04)
 */

import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, SlidersHorizontal, RefreshCw, 
    ArrowRight, Globe, Database, Target, Brain,
    Shield, Briefcase, FileText, User, MapPin,
    AlertTriangle, CheckCircle2, ChevronRight,
    Zap, Sparkles, Orbit, Binary, Layout,
    Skull, ShieldAlert, Activity, Eye, Ghost,
    Info, Lock, Fingerprint, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { Badge } from '@/components/ui/badge';
import { CyberOrb } from '@/components/CyberOrb';
import { AudioSanctuary } from '@/components/shared/AudioSanctuary';
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
        // Імітація глибокого сканування
        setTimeout(() => {
            setResults([
                { id: '1', title: 'ТОВ "МИТНИЙ_ОФШОР"', type: 'COMPANY', risk: 94, info: 'Виявлено зв\'язки з санкційними списками РФ', date: '2026-03-22', severity: 'CRITICAL' },
                { id: '2', title: 'Декларація №445582/2026', type: 'DECLARATION', risk: 42, info: 'Підозра на заниження митної вартості: титан', date: '2026-03-21', severity: 'HIGH' },
                { id: '3', title: 'Петро Порошенко (Бенефіціар)', type: 'PERSON', risk: 15, info: 'Кінцевий бенефіціар 24 офшорних структур', date: '2026-03-20', severity: 'LOW' },
                { id: '4', title: 'Перевалка "Південь"', type: 'LOCATION', risk: 68, info: 'Аномальна активність нічних вантажів', date: '2026-03-19', severity: 'MEDIUM' },
            ]);
            setIsSearching(false);
            setThreatLevel(89); // Підвищуємо рівень загрози після виявлення
        }, 2000);
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#010204] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(244, 63, 94, 0.03)" />
                <NeuralPulse color="rgba(244, 63, 94, 0.05)" size={1600} />
                
                {/* Tactical Overlay (Scanning Line) */}
                <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-20">
                    <div className="w-full h-1 bg-red-600/30 blur-[4px] absolute animate-[scan_6s_linear_infinite]" />
                    <div className="w-full h-[100vh] bg-[linear-gradient(rgba(244,63,94,0)_0%,rgba(244,63,94,0.05)_50%,rgba(244,63,94,0)_100%)] absolute animate-[scan_6s_linear_infinite]" />
                </div>

                <div className="relative z-10 max-w-[1400px] mx-auto p-4 sm:p-12 space-y-16">
                    
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-10">
                                <div className="relative group/orb">
                                    <div className="absolute inset-0 bg-red-600/30 blur-[100px] rounded-full scale-150 animate-pulse opacity-20" />
                                    <div className="relative p-7 bg-black/80 border border-red-500/30 rounded-[2.5rem] shadow-[0_0_100px_rgba(244,63,94,0.2)] backdrop-blur-3xl transition-all">
                                        <Skull size={42} className="text-red-500 drop-shadow-[0_0_20px_#f43f5e]" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-7xl font-black text-white tracking-[-0.02em] uppercase leading-none font-display italic skew-x-[-4deg]">
                                        ПОШУК <span className="text-red-600 group-hover:animate-glitch">ПРЕДАТОРА</span>
                                    </h1>
                                    <div className="flex items-center gap-6">
                                        <div className="h-0.5 w-24 bg-gradient-to-r from-red-600 to-transparent" />
                                        <span className="text-[12px] font-mono font-black text-red-500 uppercase tracking-[0.6em] flex items-center gap-3">
                                            <ShieldAlert size={14} className="animate-pulse" /> СИСТЕМА_ВТЕЧІ_НЕМОЖЛИВА_v56.1.4
                                        </span>
                                    </div>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'РІВЕНЬ_ЗАГРОЗИ', value: `${threatLevel}%`, color: threatLevel > 70 ? 'danger' : 'primary', icon: <Skull size={14} />, animate: true },
                            { label: 'АКТИВНІ_ЦІЛІ', value: '1.42M', color: 'primary', icon: <Target size={14} /> },
                            { label: 'ВІДГУК_ЯДРА', value: '2ms', color: 'success', icon: <Zap size={14} />, animate: true }
                        ]}
                    />

                    {/* Threat Interface Overlay */}
                    <div className="flex flex-col gap-12 items-center w-full relative">
                        <div className="absolute -top-12 left-0 right-0 flex justify-between px-12 pointer-events-none">
                            <span className="text-[10px] font-black text-red-500 font-mono tracking-widest opacity-40 uppercase italic animate-[blink_2s_infinite]">SYSTEM_STATUS: AGGRESSIVE</span>
                            <span className="text-[10px] font-black text-red-500 font-mono tracking-widest opacity-40 uppercase italic">SCAN_COORDINATES: [48.3794, 31.1656]</span>
                        </div>

                        <TacticalCard variant="cyber" className="w-full max-w-5xl p-4 bg-black/60 rounded-[3rem] border-red-900/30 shadow-[0_0_80px_rgba(0,0,0,1)] group/search" noPadding>
                            <div className="relative p-8 flex items-center gap-8">
                                <div className="p-6 bg-red-600/10 rounded-2xl shadow-[inset_0_0_20px_rgba(244,63,94,0.1)] group-focus-within/search:bg-red-600/20 transition-all">
                                    <Search size={38} className="text-red-500 group-focus-within/search:scale-125 transition-transform drop-shadow-[0_0_10px_#f43f5e]" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="ВВЕДІТЬ ОБ'ЄКТ СПОСТЕРЕЖЕННЯ (ЄДРПОУ, НАЗВА)..."
                                    className="flex-1 bg-transparent border-none text-4xl font-black text-white italic tracking-tighter placeholder:text-red-950/40 focus:outline-none focus:ring-0 leading-none uppercase"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <div className="flex items-center gap-6">
                                    <button className="p-5 bg-red-500/5 hover:bg-red-500/10 rounded-2xl text-red-900 hover:text-red-500 transition-all border border-red-900/20">
                                        <SlidersHorizontal size={28} />
                                    </button>
                                    <motion.button 
                                        whileHover={{ scale: 1.05, x: 5, boxShadow: '0 0 50px rgba(220, 38, 38, 0.4)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSearch}
                                        className="px-14 py-6 bg-red-600 text-white font-black rounded-3xl text-[12px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(220,38,38,0.3)] hover:bg-red-500 transition-all flex items-center gap-6 italic group"
                                    >
                                        <span>ІНІЦІЮВАТИ_ПОШУК</span>
                                        <ArrowRight size={24} className="group-hover:translate-x-3 transition-transform" />
                                    </motion.button>
                                </div>
                            </div>
                        </TacticalCard>

                        {/* Search Filters with Tactical Style */}
                        <div className="flex flex-wrap justify-center gap-4">
                            {['ALL', 'COMPANIES', 'DECLARATIONS', 'PERSONS', 'LOCATIONS', 'CUSTOMS'].map((f) => (
                                <button 
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={cn(
                                        "px-10 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all italic border shadow-2xl skew-x-[-8deg]",
                                        activeFilter === f 
                                            ? "bg-red-600 border-red-400 text-white shadow-[0_0_40px_rgba(220,38,38,0.4)]" 
                                            : "bg-black/80 border-red-950/20 text-red-950 hover:text-red-500 hover:border-red-500/40"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results / Tactical Recon */}
                    <div className="grid grid-cols-12 gap-12 mt-20 relative">
                        {isSearching ? (
                            <div className="col-span-12 flex flex-col items-center justify-center py-40 gap-16">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-600/20 blur-[100px] scale-150 animate-pulse" />
                                    <CyberOrb size={220} color="#f43f5e" intensity={0.8} pulse />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <Eye size={40} className="text-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-6">
                                    <span className="text-2xl font-black text-red-500 uppercase tracking-[1em] italic animate-pulse block">ДЕТЕКЦІЯ_КРИМІНАЛЬНИХ_ЗВ'ЯЗКІВ</span>
                                    <div className="h-1.5 w-96 bg-red-950/30 rounded-full overflow-hidden mx-auto border border-red-900/20 shadow-2xl">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="h-full bg-red-600 shadow-[0_0_20px_#f43f5e]"
                                        />
                                    </div>
                                    <p className="text-[10px] font-black text-red-900 uppercase tracking-[0.5em] italic">RECON_IN_PROGRESS_v56.1.4</p>
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-12 px-6">
                                <AnimatePresence mode="popLayout">
                                    {results.map((res, i) => (
                                        <motion.div
                                            key={res.id}
                                            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            className="group relative"
                                        >
                                            <TacticalCard variant="cyber" className={cn(
                                                "p-12 border-red-900/20 bg-black/60 rounded-[3rem] hover:border-red-600/40 transition-all shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex gap-12 overflow-hidden group/item",
                                                res.risk > 80 && "border-red-600/50"
                                            )} noPadding={false}>
                                                <div className="absolute top-0 right-0 p-12 opacity-[0.01] group-hover/item:opacity-[0.1] transition-all transform group-hover/item:scale-125 group-hover/item:rotate-[-12deg] pointer-events-none">
                                                    {res.severity === 'CRITICAL' ? <Skull size={320} className="text-red-600" /> : <Ghost size={320} className="text-red-900" />}
                                                </div>

                                                <div className="flex-1 space-y-8 relative z-10">
                                                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className={cn(
                                                                "p-4 rounded-2xl shadow-inner",
                                                                res.severity === 'CRITICAL' ? "bg-red-600/20" : "bg-white/5"
                                                            )}>
                                                                {res.type === 'COMPANY' ? <Briefcase size={22} className="text-red-500" /> : <Database size={22} className="text-red-500" />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[12px] font-black text-red-500 uppercase tracking-[0.4em] italic leading-none">{res.type}</span>
                                                                <span className="text-[9px] font-mono text-red-900 uppercase mt-1">ID: {res.id.padStart(6, '0')}</span>
                                                            </div>
                                                        </div>
                                                        {res.severity === 'CRITICAL' && (
                                                            <Badge variant="outline" className="bg-red-600/10 border-red-600/50 text-red-500 text-[9px] px-4 py-1.5 font-black uppercase tracking-[0.4em] animate-pulse">КРИТИЧНО</Badge>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="space-y-4">
                                                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none group-hover/item:text-red-500 transition-colors">{res.title}</h3>
                                                        <div className="p-6 bg-red-600/5 border-l-4 border-red-600 rounded-r-2xl">
                                                            <p className="text-[16px] text-slate-300 leading-relaxed font-black uppercase italic tracking-tight">{res.info}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                        <div className="flex items-center gap-10">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">ДАТА_ФОРМУВАННЯ</span>
                                                                <span className="text-[12px] font-mono font-black text-red-800">{res.date}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">RISK_SCORE</span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-24 bg-red-950/40 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-red-600" style={{ width: `${res.risk}%` }} />
                                                                    </div>
                                                                    <span className={cn("text-xl font-black font-mono italic", res.risk > 70 ? "text-red-500" : "text-emerald-500")}>{res.risk}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <motion.button 
                                                            whileHover={{ x: 12 }}
                                                            className="flex items-center gap-4 text-[12px] font-black text-red-500 hover:text-white transition-colors uppercase italic tracking-[0.3em] group/btn"
                                                        >
                                                            РОЗПОЧАТИ_ДОПИТ <Fingerprint size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </TacticalCard>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="col-span-12 flex flex-col items-center justify-center py-40 text-center gap-12">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-red-600/5 blur-[80px] rounded-full scale-200" />
                                    <Ghost size={120} className="text-red-950/40 relative z-10 animate-pulse" />
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-4xl font-black text-red-950 uppercase tracking-[0.8em] italic">СИСТЕМА ТИШІ</h3>
                                    <p className="text-[12px] text-red-900/60 font-black uppercase italic tracking-[0.3em] max-w-xl mx-auto leading-relaxed border-t border-red-900/10 pt-8">
                                        ПРЕДАТОР ПОТРЕБУЄ ЦІЛЬ ДЛЯ АНАЛІЗУ. ВВЕДІТЬ ДАНІ ДЛЯ ІНІЦІАЦІЇ ПРОТОКОЛУ СПОСТЕРЕЖЕННЯ.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <AudioSanctuary />

                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes scan {
                        0% { top: -100px; }
                        100% { top: 100vh; }
                    }
                    @keyframes blink {
                        0%, 100% { opacity: 0.1; }
                        50% { opacity: 0.4; }
                    }
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .font-display {
                        font-family: 'Inter', sans-serif;
                    }
                `}} />
            </div>
        </PageTransition>
    );
};

export default SearchPage;
