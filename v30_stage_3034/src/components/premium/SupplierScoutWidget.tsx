import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Building2, ShieldCheck, AlertTriangle, Phone, Mail, Globe, Star, Users } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface Supplier {
  id: string;
  name: string;
  country: string;
  rating: number; // 0-100
  risk: 'low' | 'medium' | 'high';
  deals: number;
  mainProduct: string;
}

export const SupplierScoutWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Supplier[] | null>(null);

  if (persona !== 'TITAN') return null;

  const handleSearch = () => {
    if (!query) return;
    setIsSearching(true);
    setResults(null);

    // AI Find Simulation
    setTimeout(() => {
      setResults([
        { id: '1', name: 'Zhejiang Power Co.', country: 'КНР', rating: 98, risk: 'low', deals: 1420, mainProduct: 'Промислові Мотори' },
        { id: '2', name: 'Istanbul Tech Group', country: 'Туреччина', rating: 85, risk: 'low', deals: 320, mainProduct: 'Комплектуючі' },
        { id: '3', name: 'Global Trade LLC', country: 'ОАЕ', rating: 45, risk: 'high', deals: 12, mainProduct: 'Реекспорт' },
      ]);
      setIsSearching(false);
    }, 2000);
  };

  return (
    <div className="bg-slate-950/80 border border-emerald-500/20 rounded-[24px] backdrop-blur-xl overflow-hidden h-full min-h-[400px] flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none transition-all duration-500 group-hover:from-emerald-500/10" />

      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20">
            <Users className="text-emerald-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              {premiumLocales.supplierScout.title}
            </h3>
            <p className="text-[9px] text-slate-500 font-mono">{premiumLocales.supplierScout.subtitle}</p>
          </div>
        </div>
        <div className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold uppercase">
            POWERED BY AI
        </div>
      </div>

      {/* Search Area */}
      <div className="p-6 pb-2 relative z-10">
        <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={16} />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={premiumLocales.supplierScout.placeholder}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-32 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder-slate-600"
            />
            <button
                onClick={handleSearch}
                disabled={isSearching || !query}
                className="absolute right-1 top-1 bottom-1 px-4 my-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:bg-slate-800"
            >
                {isSearching ? <span className="animate-pulse text-[9px] uppercase">{premiumLocales.supplierScout.scanning}</span> : <span className="text-[10px] uppercase">{premiumLocales.supplierScout.search}</span>}
            </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3 relative z-10 scrollbar-hide">
        <AnimatePresence>
            {results && results.map((supplier, i) => (
                <motion.div
                    key={supplier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all cursor-pointer group/card"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-slate-400 group-hover/card:text-white transition-colors" />
                            <div>
                                <h4 className="text-sm font-bold text-white leading-none">{supplier.name}</h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] text-slate-500">{supplier.country}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="text-[10px] text-slate-500">{supplier.mainProduct}</span>
                                </div>
                            </div>
                        </div>
                        <div className={cn(
                            "px-2 py-1 rounded text-[10px] font-black uppercase border",
                            supplier.risk === 'low' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                            supplier.risk === 'high' ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        )}>
                            {supplier.risk === 'low' ? premiumLocales.supplierScout.verified : premiumLocales.supplierScout.highRisk}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/5 mt-3 mb-2">
                        <div className="text-center">
                            <div className="text-[9px] text-slate-500 uppercase">{premiumLocales.supplierScout.rating}</div>
                            <div className="text-sm font-mono font-bold text-white flex items-center justify-center gap-1">
                                {supplier.rating} <Star size={10} className="text-amber-400 fill-amber-400" />
                            </div>
                        </div>
                        <div className="text-center border-l border-white/5">
                            <div className="text-[9px] text-slate-500 uppercase">{premiumLocales.supplierScout.deals}</div>
                            <div className="text-sm font-mono font-bold text-white">{supplier.deals}</div>
                        </div>
                        <div className="text-center border-l border-white/5">
                            <div className="text-[9px] text-slate-500 uppercase">{premiumLocales.supplierScout.trust}</div>
                            <div className="text-sm font-mono font-bold text-white">{supplier.rating > 90 ? 'A+' : supplier.rating > 50 ? 'B' : 'D'}</div>
                        </div>
                    </div>

                    <div className="flex gap-2 opacity-60 group-hover/card:opacity-100 transition-opacity">
                        <button className="flex-1 py-1.5 rounded bg-white/5 text-[10px] text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2">
                            <Globe size={12} /> {premiumLocales.supplierScout.website}
                        </button>
                        <button className="flex-1 py-1.5 rounded bg-white/5 text-[10px] text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2">
                            <Mail size={12} /> {premiumLocales.supplierScout.contact}
                        </button>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>

        {!results && !isSearching && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-3 opacity-60">
                <Globe size={40} strokeWidth={1} />
                <p className="text-[10px] uppercase tracking-widest text-center max-w-[200px]">
                    {premiumLocales.supplierScout.aiDescription}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
