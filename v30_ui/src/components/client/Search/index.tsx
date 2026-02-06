import React, { useState } from 'react';
import { Search as SearchIcon, Filter, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Mock results for demo
  const mockResults = [
    { id: 1, title: 'Звіт про експорт зернових Q3 2025', type: 'document', date: '2025-10-15', snippet: 'Аналіз обсягів експорту... зростання на 15%...' },
    { id: 2, title: 'Тенденції енергетичного ринку', type: 'analytics', date: '2025-11-02', snippet: 'Ключові гравці ринку... прогноз цін...' },
    { id: 3, title: 'Огляд логістичних маршрутів', type: 'report', date: '2025-09-20', snippet: 'Нові митні правила... затримки на кордоні...' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => setIsSearching(false), 1000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-white">Пошук інформації</h1>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введіть ключові слова, назви компаній або події..."
            className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-6 py-4 pl-14 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-lg transition-all"
          />
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          >
            Знайти
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors whitespace-nowrap">
            <Filter size={14} /> Всі фільтри
          </button>
          <button className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors whitespace-nowrap">
            Останні 24 години
          </button>
          <button className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors whitespace-nowrap">
            Документи PDF
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isSearching ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 check-blue-500 border-t-transparent rounded-full animate-spin border-4 border-blue-500"></div>
            <p className="mt-4 text-slate-500">Пошук у базі даних...</p>
          </div>
        ) : query.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-sm text-slate-500">Знайдено результатів: {mockResults.length}</p>
            {mockResults.map((result) => (
              <div key={result.id} className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl hover:bg-slate-900/60 transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-blue-400 group-hover:text-blue-300">{result.title}</h3>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded flex items-center gap-1">
                    <Clock size={12} /> {result.date}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{result.snippet}</p>
                <div className="mt-3 flex gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded">{result.type}</span>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 opacity-50">
            <SearchIcon size={64} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500">Введіть запит, щоб розпочати пошук</p>
          </div>
        )}
      </div>
    </div>
  );
};
