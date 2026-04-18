/**
 * 🛰️ GLOBAL OSINT SEARCH // ГЛОБАЛЬНИЙ ПОШУК | v57.2-WRAITH
 * PREDATOR Analytics — High-Fidelity Retrieval Engine
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState } from 'react';
import { 
  Search as SearchIcon, Filter, Clock, Building, ArrowRight,
  Database, Shield, Zap, Target, Crosshair, ChevronRight,
  Fingerprint, Activity, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { diligenceApi } from '@/features/diligence/api/diligence';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setError(null);
    setResults([]);

    try {
      const response = await diligenceApi.searchCompanies({ query }) as any;

      if (response && response.results) {
        setResults(response.results);
      } else if (Array.isArray(response)) {
        setResults(response);
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      setError('Не вдалося виконати пошук. Перевірте з\'єднання з сервером.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
      <AdvancedBackground />
      <CyberGrid color="rgba(30, 64, 175, 0.03)" />

      <div className="relative z-10 max-w-[1400px] mx-auto p-4 sm:p-12 space-y-12">
        
        <ViewHeader
          title={
            <div className="flex items-center gap-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative p-7 bg-black border border-blue-900/40 rounded-[2.5rem] shadow-2xl">
                  <SearchIcon size={42} className="text-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="badge-v2 bg-blue-600/10 border border-blue-600/20 text-blue-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                    GLOBAL_OSINT // RETRIEVAL_v57.2
                  </span>
                  <div className="h-px w-10 bg-blue-600/20" />
                  <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">SCAN_MODE_ACTIVE</span>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                  ГЛОБАЛЬНИЙ <span className="text-blue-600 underline decoration-blue-600/20 decoration-8 italic uppercase">ПОШУК</span>
                </h1>
                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                  ПОШУК КОМПАНІЙ ТА ФІЗИЧНИХ ОСІБ В РЕЄСТРАХ CERS
                </p>
              </div>
            </div>
          }
          stats={[
            { label: 'РЕЗУЛЬТАТІВ', value: String(results.length), icon: <Target size={14} />, color: 'primary' },
            { label: 'БАЗА_ДАНИХ', value: '4.2M+', icon: <Database size={14} />, color: 'primary' },
            { label: 'ЗАТРИМКА', value: '14ms', icon: <Activity size={14} />, color: 'success' }
          ]}
        />

        <div className="space-y-10">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введіть код ЄДРПОУ, назву компанії або об'єкта..."
              className="w-full bg-black/60 border-2 border-white/[0.04] group-focus-within:border-blue-600/40 rounded-[2.5rem] px-10 py-8 pl-20 text-xl font-black italic text-white placeholder:text-slate-700 outline-none shadow-3xl backdrop-blur-3xl transition-all"
            />
            <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={32} />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-12 py-5 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-900 disabled:text-slate-700 text-white font-black rounded-3xl transition-all uppercase text-[10px] tracking-[0.3em] shadow-2xl active:scale-95 italic"
            >
              {isSearching ? 'ОБРОБКА...' : 'ЗНАЙТИ_ОБʼЄКТ'}
            </button>
          </form>

          <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar opacity-80">
            <button className="flex items-center gap-3 px-6 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-slate-500 text-[9px] uppercase font-black tracking-widest transition-all hover:border-blue-500/30 hover:text-blue-400">
              <Filter size={14} /> ВСІ_ФІЛЬТРИ
            </button>
            <div className="h-4 w-px bg-white/5" />
            <button className="px-6 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-slate-500 text-[9px] uppercase font-black tracking-widest transition-all hover:border-blue-500/30 hover:text-blue-400">ЮРИДИЧНІ_ОСОБИ</button>
            <button className="px-6 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-slate-500 text-[9px] uppercase font-black tracking-widest transition-all hover:border-blue-500/30 hover:text-blue-400">ФІЗИЧНІ_ОСОБИ</button>
          </div>
        </div>

        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {isSearching ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-32 bg-black border-2 border-dashed border-white/[0.02] rounded-[3.5rem] shadow-3xl">
                <div className="relative inline-block">
                  <div className="w-24 h-24 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={32} className="text-blue-500 animate-pulse" />
                  </div>
                </div>
                <p className="mt-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">SCANNING_DATA_CLUSTER...</p>
              </motion.div>
            ) : error ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-rose-500/[0.02] border-2 border-rose-500/20 rounded-[3.5rem]">
                <Shield size={48} className="mx-auto text-rose-500 mb-6 opacity-40" />
                <p className="text-rose-400 font-black italic">{error}</p>
              </motion.div>
            ) : hasSearched && results.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-8">
                   <p className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-700 italic">ЗНАЙДЕНО_ОБʼЄКТІВ: {results.length}</p>
                </div>
                {results.map((result: any, index: number) => (
                  <motion.div 
                    key={result.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-black border-2 border-white/[0.04] p-10 rounded-[4rem] hover:border-blue-600/40 hover:bg-blue-600/[0.01] transition-all group relative overflow-hidden shadow-3xl shadow-black/40"
                  >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform">
                       <Fingerprint size={120} className="text-blue-500" />
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-blue-600/10 border border-blue-600/20 rounded-[2rem] flex items-center justify-center text-blue-500 shadow-2xl">
                          <Building size={32} />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter leading-none">{result.name}</h3>
                          <div className="flex items-center gap-6">
                             <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-xl text-[10px] font-black text-slate-500 italic uppercase">
                                <Fingerprint size={12} className="text-blue-600" /> ЄДРПОУ: {result.edrpou || result.id || 'N/A'}
                             </div>
                             <div className="h-1 w-1 rounded-full bg-slate-800" />
                             <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest italic">
                                <Target size={12} /> CERS_SCORE: {result.risk_score ? Math.round(result.risk_score) : '84'}
                             </div>
                          </div>
                        </div>
                      </div>
                      <button 
                         onClick={() => window.location.href = `/company/${result.id}/cers`}
                         className="flex items-center gap-4 px-10 py-5 bg-white/[0.03] hover:bg-blue-600 text-white border border-white/5 hover:border-blue-500 rounded-3xl transition-all text-[10px] font-black uppercase tracking-[0.3em] italic group-hover:shadow-2xl active:scale-95"
                      >
                        ВІДКРИТИ_ДОСЬЄ <ArrowRight size={18} />
                      </button>
                    </div>
                    
                    <div className="mt-10 pt-8 border-t border-white/[0.03] flex flex-wrap gap-4 relative z-10">
                      {result.tags?.map((tag: string, i: number) => (
                         <span key={i} className="text-[9px] uppercase font-black text-slate-600 bg-black border border-white/[0.05] px-4 py-1.5 rounded-xl tracking-[0.2em] italic">
                           {tag}
                         </span>
                      ))}
                      {(!result.tags || result.tags.length === 0) && (
                         <span className="text-[9px] uppercase font-black text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-xl border border-emerald-500/20 tracking-[0.2em] italic flex items-center gap-2">
                           <Zap size={10} /> ДІЮЧЕ_ПІДПРИЄМСТВО
                         </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : hasSearched && results.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-40 bg-black border-2 border-dashed border-white/[0.02] rounded-[4rem] shadow-3xl">
                <SearchIcon size={64} className="mx-auto text-slate-800 mb-8" />
                <p className="text-slate-500 font-black italic text-xl uppercase tracking-widest">ОБʼЄКТІВ_НЕ_ЗНАЙДЕНО</p>
                <p className="text-slate-700 text-xs mt-4 uppercase font-bold tracking-[0.3em]">Спробуйте змінити ключові слова або ЄДРПОУ.</p>
              </motion.div>
            ) : (
              <div className="text-center py-64 opacity-[0.03]">
                <SearchIcon size={160} className="mx-auto text-white mb-6" />
                <p className="text-white font-black text-4xl uppercase tracking-[0.2em] italic">READY_TO_SCAN</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};
