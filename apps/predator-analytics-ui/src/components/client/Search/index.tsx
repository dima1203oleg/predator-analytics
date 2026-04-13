import React, { useState } from 'react';
import { Search as SearchIcon, Filter, Clock, Building, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { diligenceApi } from '@/features/diligence/api/diligence';

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
      const response = await diligenceApi.searchCompanies(query) as any;
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Глобальний пошук OSINT</h1>

        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введіть код ЄДРПОУ, назву компанії або об'єкта..."
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 pl-14 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none shadow-2xl backdrop-blur-xl transition-all"
          />
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={24} />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all uppercase text-xs tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-95"
          >
            {isSearching ? 'Обробка...' : 'Знайти'}
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none opacity-60">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-black/40 hover:bg-white/5 border border-white/5 rounded-lg text-slate-300 text-[10px] uppercase font-bold tracking-widest transition-colors whitespace-nowrap">
            <Filter size={14} /> Всі фільтри
          </button>
          <button className="px-3 py-1.5 bg-black/40 hover:bg-white/5 border border-white/5 rounded-lg text-slate-300 text-[10px] uppercase font-bold tracking-widest transition-colors whitespace-nowrap">
            Юридичні особи
          </button>
          <button className="px-3 py-1.5 bg-black/40 hover:bg-white/5 border border-white/5 rounded-lg text-slate-300 text-[10px] uppercase font-bold tracking-widest transition-colors whitespace-nowrap">
            Фізичні особи
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isSearching ? (
          <div className="text-center py-20 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-xl">
            <div className="inline-block w-10 h-10 border-t-blue-500 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin border-2"></div>
            <p className="mt-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Виконується запит до бази даних...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-500/5 rounded-3xl border border-red-500/20">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        ) : hasSearched && results.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-2">Знайдено об'єктів: {results.length}</p>
            {results.map((result: any, index: number) => (
              <div key={result.id || index} className="bg-black/40 border border-white/5 p-6 rounded-2xl hover:border-white/10 hover:bg-black/60 transition-all group backdrop-blur-xl">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Building size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{result.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                         <span className="text-slate-400 font-mono">ЄДРПОУ: {result.edrpou || result.id || 'N/A'}</span>
                         <span className="w-1 h-1 rounded-full bg-slate-700" />
                         <span className="text-amber-500 font-bold uppercase tracking-widest text-[10px]">CERS-Оцінка: {result.risk_score ? Math.round(result.risk_score) : 'ОБЧИСЛЮЄТЬСЯ'}</span>
                      </div>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all">
                    <ArrowRight size={18} />
                  </button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 overflow-x-auto scrollbar-none">
                  {result.tags?.map((tag: string, i: number) => (
                     <span key={i} className="text-[9px] uppercase font-black text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 tracking-widest">
                       {tag}
                     </span>
                  ))}
                  {(!result.tags || result.tags.length === 0) && (
                     <span className="text-[9px] uppercase font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 tracking-widest">
                       ДІЮЧЕ ПІДПРИЄМСТВО
                     </span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        ) : hasSearched && results.length === 0 ? (
          <div className="text-center py-20 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-xl">
            <SearchIcon size={48} className="mx-auto text-slate-600 mb-6" />
            <p className="text-slate-400 font-medium">За вашим запитом об'єктів не знайдено</p>
            <p className="text-slate-500 text-sm mt-2">Спробуйте змінити ключові слова або перевірте правильність введеного ЄДРПОУ.</p>
          </div>
        ) : (
          <div className="text-center py-32 opacity-50">
            <SearchIcon size={64} className="mx-auto text-slate-700 mb-6" />
            <p className="text-slate-500 font-medium tracking-wide">Введіть пошуковий запит для роботи з даними</p>
          </div>
        )}
      </div>
    </div>
  );
};

