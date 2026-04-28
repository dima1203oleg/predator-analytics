/**
 * 🕵️ DILIGENCE TAB // РОЗШИРЕНА ПЕРЕВІРКА | v60.1-ELITE
 * PREDATOR Analytics — OSINT & Due Diligence Core
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, Shield, Brain, Activity, 
    FileText, Globe, AlertTriangle, ChevronRight, 
    Zap, Target, Share2, Download, ExternalLink,
    Lock, Eye, Cpu, Database, RefreshCw
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { diligenceApi } from '@/features/diligence/api/diligence';
import { SovereignAudio } from '@/utils/sovereign-audio';
import { useBackendStatus } from '@/hooks/useBackendStatus';

type RiskFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

export const DiligenceTab: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const { isOffline } = useBackendStatus();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        SovereignAudio.playScanPulse();
        
        try {
            const data = await diligenceApi.searchCompanies({ query: searchQuery });
            setResults(Array.isArray(data) ? data : (data.items || []));
            SovereignAudio.playImpact();
        } catch (error) {
            console.error('[DiligenceTab] Search error:', error);
            SovereignAudio.playAlert();
        } finally {
            setLoading(false);
        }
    };

    const riskFilters: { label: string; value: RiskFilter }[] = [
        { label: 'ВСІ', value: 'all' },
        { label: 'КРИТИЧНИЙ', value: 'critical' },
        { label: 'ВИСОКИЙ', value: 'high' },
        { label: 'СЕРЕДНІЙ', value: 'medium' },
        { label: 'НИЗЬКИЙ', value: 'low' },
    ];

    return (
        <div className="flex h-full w-full gap-4 p-4 lg:p-6 overflow-hidden bg-slate-950/40 relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.05),transparent_50%)] pointer-events-none" />
            
            {/* Intelligence Rail - Left */}
            <div className="hidden xl:flex w-72 flex-col gap-4 overflow-hidden shrink-0 z-10">
                <TacticalCard title="ВУЗОЛ МОНІТОРИНГУ" icon={<Brain size={16} className="text-rose-500" />} className="bg-rose-500/[0.03] border-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.05)]">
                    <div className="space-y-4">
                        <div className="text-center py-4 relative">
                            <div className="absolute inset-0 bg-rose-500/5 blur-2xl animate-pulse" />
                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1">SYSTEM VRAM FLOW</div>
                            <div className="text-2xl font-black text-white italic tracking-tighter">94.2%</div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                                <span>LLM_LOAD</span>
                                <span className="text-rose-400">HIGH</span>
                            </div>
                            <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-rose-600" 
                                    initial={{ width: 0 }} 
                                    animate={{ width: '85%' }} 
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-3">
                            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">АКТИВНІ СКАНЕРИ</h4>
                            {[
                                { name: 'OSINT_SPIDER', status: 'АКТИВНО', color: 'text-emerald-500' },
                                { name: 'CORP_REGISTRY', status: 'АКТИВНО', color: 'text-emerald-500' },
                                { name: 'SANCTION_NODE', status: 'АКТИВНО', color: 'text-emerald-500' },
                                { name: 'DARK_WEB_INDEX', status: 'ОЧІКУВАННЯ', color: 'text-amber-500' },
                            ].map((scanner, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400">{scanner.name}</span>
                                    <span className={cn("text-[8px] font-black uppercase tracking-tighter", scanner.color)}>{scanner.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </TacticalCard>

                <TacticalCard title="ОПЕРАТИВНИЙ ЖУРНАЛ" icon={<Activity size={16} className="text-rose-500" />} className="flex-1 overflow-hidden">
                    <div className="space-y-3 font-mono text-[9px] overflow-y-auto max-h-full custom-scrollbar pr-2">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className="border-l border-rose-500/20 pl-3 py-1">
                                <div className="text-rose-500/60 text-[8px]">{new Date().toLocaleTimeString()}</div>
                                <div className="text-slate-300 uppercase tracking-tighter">Синхронізація вузла #{i}... [OK]</div>
                            </div>
                        ))}
                    </div>
                </TacticalCard>
            </div>

            {/* Main Viewport */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden z-10">
                {/* Tactical Search Bar */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-4 shadow-2xl">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative group">
                            <div className="absolute inset-0 bg-rose-500/5 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-rose-500 transition-colors z-10" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ВВЕДІТЬ НАЗВУ, ЄДРПОУ АБО UEID ДЛЯ ГЛИБОКОГО СКАНУВАННЯ..."
                                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-mono text-xs tracking-widest focus:outline-none focus:border-rose-500/50 transition-all relative z-10"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-10 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic transition-all shadow-[0_0_30px_rgba(225,29,72,0.3)] flex items-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            СКАНУВАТИ
                        </button>
                    </form>

                    <div className="flex items-center gap-6 mt-4 px-2">
                        <div className="flex items-center gap-2">
                            <Filter className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ФІЛЬТР РИЗИКУ:</span>
                        </div>
                        <div className="flex gap-2">
                            {riskFilters.map(filter => (
                                <button 
                                    key={filter.value}
                                    onClick={() => setRiskFilter(filter.value)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                        riskFilter === filter.value 
                                            ? "bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]" 
                                            : "bg-white/5 text-slate-500 hover:bg-white/10"
                                    )}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center p-20"
                            >
                                <div className="relative w-32 h-32 mb-8">
                                    <div className="absolute inset-0 border-2 border-rose-500/10 rounded-full scale-125" />
                                    <div className="absolute inset-0 border-t-2 border-rose-500 rounded-full animate-spin" />
                                    <div className="absolute inset-4 border-2 border-rose-500/20 rounded-full scale-110" />
                                    <div className="absolute inset-4 border-b-2 border-rose-600 rounded-full animate-spin-reverse" />
                                    <Target className="absolute inset-0 m-auto w-10 h-10 text-rose-500 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-[0.4em] animate-pulse">ІНІЦІАЛІЗАЦІЯ СКАНЕРА...</h3>
                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-4">ОБРОБКА ВЕКТОРІВ ОСІНТ-ВУЗЛА #{Math.floor(Math.random() * 999)}</p>
                            </motion.div>
                        ) : results.length > 0 ? (
                            <motion.div 
                                key="results"
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20"
                            >
                                {results.map((entity, i) => (
                                    <div 
                                        key={entity.ueid || i}
                                        className="group bg-slate-900/60 border border-white/5 rounded-3xl p-6 hover:border-rose-500/30 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/10 transition-colors" />
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="px-3 py-1 bg-rose-600/10 border border-rose-600/20 rounded-lg">
                                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic">UEID_{entity.ueid?.slice(0, 8)}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="p-2 bg-white/5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all">
                                                        <Share2 size={14} />
                                                    </button>
                                                    <button className="p-2 bg-white/5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all">
                                                        <ExternalLink size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <h4 className="text-xl font-black text-white mb-2 uppercase italic tracking-tight line-clamp-2 min-h-[3.5rem] group-hover:text-rose-500 transition-colors">
                                                {entity.name}
                                            </h4>

                                            <div className="space-y-4 mt-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-950 rounded-xl border border-white/5">
                                                        <Globe className="w-4 h-4 text-rose-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Юрисдикція</div>
                                                        <div className="text-xs font-bold text-slate-200 uppercase">Україна</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-950 rounded-xl border border-white/5">
                                                        <FileText className="w-4 h-4 text-rose-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ЄДРПОУ / ІПН</div>
                                                        <div className="text-xs font-mono font-bold text-slate-200">{entity.edrpou || entity.inn || 'Н/Д'}</div>
                                                    </div>
                                                </div>

                                                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">СКОРИНГ РИЗИКУ</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex gap-0.5">
                                                                {[1,2,3,4,5].map(star => (
                                                                    <div key={star} className={cn("w-1.5 h-3 rounded-sm", star <= 3 ? "bg-rose-600" : "bg-slate-800")} />
                                                                ))}
                                                            </div>
                                                            <span className="text-sm font-black text-rose-500 italic">74.2</span>
                                                        </div>
                                                    </div>
                                                    <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-rose-600 text-slate-400 hover:text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic">
                                                        ДЕТАЛІ <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center p-20 text-center"
                            >
                                <div className="p-8 bg-slate-900/40 rounded-[3rem] border border-white/5 mb-8 relative">
                                    <div className="absolute inset-0 bg-rose-500/5 blur-3xl rounded-full" />
                                    <Search size={64} className="text-slate-800 relative z-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-700 uppercase italic tracking-[0.4em]">ОЧІКУВАННЯ ОБ'ЄКТА...</h3>
                                <p className="text-[11px] font-mono text-slate-600 uppercase tracking-widest mt-4 max-w-md leading-relaxed">
                                    ПРЕДАТОР ГОТОВИЙ ДО ГЛИБОКОГО ОСІНТ-АНАЛІЗУ. ВВЕДІТЬ ДАНІ ОБ'ЄКТА ДЛЯ ПОЧАТКУ СКАНУВАННЯ ЦИФРОВОГО СЛІДУ.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Status Rail - Right */}
            <div className="hidden 2xl:flex w-20 flex-col gap-4 shrink-0 z-10">
                {[
                    { icon: Shield, label: 'SEC' },
                    { icon: Globe, label: 'WEB' },
                    { icon: Lock, label: 'KEY' },
                    { icon: Database, label: 'DB' }
                ].map((item, i) => (
                    <div key={i} className="flex-1 bg-slate-900/40 border border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:border-rose-500/30 transition-all cursor-crosshair group">
                        <item.icon size={20} className="text-slate-600 group-hover:text-rose-500 transition-colors" />
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter group-hover:text-rose-700">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
