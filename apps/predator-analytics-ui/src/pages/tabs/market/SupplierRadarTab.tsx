import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, MapPin, CheckCircle, AlertCircle, Siren, 
  Search, Filter, ExternalLink, Mail, Sparkles, Target,
  RefreshCw, TrendingUp, Loader2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { intelligenceApi } from '@/services/api';

// --- MOCK DATA ---
const MOCK_SUPPLIERS = [
  { id: 'S1', name: 'ZHEJIANG ELECTRONICS CO.', country: 'China', city: 'Shenzhen', reliability: 94, competitiveness: 88, products: ['Chips', 'Circuit Boards'] },
  { id: 'S2', name: 'NORDIC LOGISTICS AG', country: 'Germany', city: 'Hamburg', reliability: 98, competitiveness: 65, products: ['Engines', 'Pumps'] },
  { id: 'S3', name: 'GLOBAL AGRO TRADE', country: 'Turkey', city: 'Istanbul', reliability: 45, competitiveness: 92, products: ['Seeds', 'Fertilizers'] },
];

const ReliabilityBadge: React.FC<{ score: number }> = ({ score }) => {
  const isHigh = score >= 90;
  const isMid = score >= 70;
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic border",
      isHigh ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
      isMid ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
      "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
    )}>
      {isHigh ? <CheckCircle size={10} /> : isMid ? <AlertCircle size={10} /> : <Siren size={10} />}
      {score}% {isHigh ? 'НАДІЙНО' : isMid ? 'ВЕРІФІКОВАНО' : 'РИЗИКОВАНО'}
    </div>
  );
};

export const SupplierRadarTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeSupplier, setActiveSupplier] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const data = await intelligenceApi.getSuppliers();
        setSuppliers(data || []);
      } catch (error) {
        console.error('Failed to fetch suppliers', error);
        setSuppliers(MOCK_SUPPLIERS);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const filtered = useMemo(() => {
    const list = suppliers.length > 0 ? suppliers : MOCK_SUPPLIERS;
    return list.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      (s.products && Array.isArray(s.products) && s.products.some((p: string) => p.toLowerCase().includes(search.toLowerCase())))
    );
  }, [suppliers, search]);

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-end gap-12 mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
            <Target size={32} className="text-yellow-500" /> Радар постачальників
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] pl-12 border-l-2 border-yellow-500/20">GLOBAL_SOURCING // PREM_INTEL_RADAR</p>
        </div>
        <div className="relative flex-1 max-w-xl group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-yellow-500 transition-colors" size={20} />
           <input 
             type="text" placeholder="Пошук за товаром або назвою..."
             value={search} onChange={e => setSearch(e.target.value)}
             className="w-full bg-white/[0.02] border-2 border-white/[0.04] p-4 pl-16 rounded-[1.5rem] text-sm font-bold text-white italic tracking-tighter focus:border-yellow-500/40 outline-none transition-all shadow-inner"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && suppliers.length === 0 ? (
           <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 opacity-50">
              <Loader2 size={48} className="text-yellow-500 animate-spin" />
              <p className="text-xs font-black text-white uppercase tracking-[0.4em] italic">Сканування глобальних ринків...</p>
           </div>
        ) : filtered.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveSupplier(activeSupplier === s.id ? null : s.id)}
            className={cn(
               "p-6 rounded-[2.5rem] bg-black/40 border-2 transition-all cursor-pointer group relative overflow-hidden",
               activeSupplier === s.id ? "border-yellow-500/40 bg-yellow-500/[0.02]" : "border-white/[0.04] hover:border-yellow-600/20"
            )}
          >
             <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-black border border-white/5 text-slate-600 group-hover:text-yellow-500 transition-colors shadow-xl">
                   <Building2 size={24} />
                </div>
                <ReliabilityBadge score={s.reliability} />
             </div>
             
             <div className="space-y-4">
                <div className="space-y-1">
                   <h3 className="text-xl font-black text-white italic tracking-tighter uppercase group-hover:text-yellow-500 transition-colors truncate">{s.name}</h3>
                   <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">
                      <MapPin size={10} /> {s.country} // {s.city}
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                   <div>
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">КОНКУРЕНТОСПРОМОЖНІСТЬ</p>
                      <p className="text-2xl font-black text-emerald-500 italic font-mono leading-none">{s.competitiveness}%</p>
                   </div>
                   <div className="flex flex-wrap justify-end gap-1 max-w-[150px]">
                      {s.products.map((p: string) => (
                        <span key={p} className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-bold text-slate-400 uppercase">{p}</span>
                      ))}
                   </div>
                </div>
             </div>

             <AnimatePresence>
                {activeSupplier === s.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-4"
                  >
                     <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-white transition-all">
                           <ExternalLink size={14} /> Профіль
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-white transition-all">
                           <Mail size={14} /> Контакт
                        </button>
                     </div>
                     <button className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-xl transition-all">
                        ІНІЦІЮВАТИ_SOURCING
                     </button>
                  </motion.div>
                )}
             </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
