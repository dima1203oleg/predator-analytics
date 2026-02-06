import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Search, Shield, AlertTriangle,
  CheckCircle, RefreshCw, Filter, ExternalLink
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

export const SanctionsIntelligenceWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setResults([
        { list: 'OFAC (USA)', status: 'Clear', label: premiumLocales.sanctionsIntelligence.statusClear, date: premiumLocales.sanctionsIntelligence.today },
        { list: 'EU Sanctions', status: 'Clear', label: premiumLocales.sanctionsIntelligence.statusClear, date: premiumLocales.sanctionsIntelligence.today },
        { list: 'РНБО (Україна)', status: 'Увага', label: premiumLocales.sanctionsIntelligence.statusMatch, date: premiumLocales.sanctionsIntelligence.yesterday, alert: premiumLocales.sanctionsIntelligence.matchFound },
        { list: 'UN Security Council', status: 'Clear', label: premiumLocales.sanctionsIntelligence.statusClear, date: premiumLocales.sanctionsIntelligence.today },
      ]);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="bg-slate-950/80 border border-rose-500/20 rounded-[32px] backdrop-blur-xl overflow-hidden h-full flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{premiumLocales.sanctionsIntelligence.title}</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{premiumLocales.sanctionsIntelligence.subtitle}</p>
          </div>
        </div>
        <div className="hidden md:flex bg-slate-900 rounded-lg p-1 border border-white/5">
           <button aria-label="Фільтр списків" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-all">
              <Filter size={18} />
           </button>
        </div>
      </div>

      {/* Search/Scan Area */}
      <div className="p-8 space-y-6 relative z-10 flex-1 overflow-y-auto scrollbar-hide">
        <div className="relative group/input">
           <input
             type="text"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             placeholder={premiumLocales.sanctionsIntelligence.placeholder}
             className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-all placeholder:text-slate-600"
           />
           <button
             onClick={handleScan}
             disabled={!searchTerm || isScanning}
             className={cn(
               "absolute right-2 top-2 p-3 rounded-xl transition-all",
               searchTerm ? "bg-rose-500 text-white hover:bg-rose-400" : "bg-white/5 text-slate-600"
             )}
           >
              {isScanning ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
           </button>
        </div>

        {/* Live Results */}
        <div className="space-y-3">
          {isScanning && (
            <div className="p-8 text-center space-y-4">
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full mx-auto"
               />
               <p className="text-[10px] text-slate-500 uppercase font-black animate-pulse">{premiumLocales.sanctionsIntelligence.scanningMessage}</p>
            </div>
          )}

          {!isScanning && results.length > 0 && results.map((res, i) => (
            <motion.div
              key={res.list}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group/res hover:bg-white/10 transition-all"
            >
               <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    res.status === 'Clear' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {res.status === 'Clear' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{res.list}</div>
                    <div className="text-[9px] text-slate-500 uppercase">{res.date}</div>
                  </div>
               </div>
               <div className="text-right">
                  <div className={cn("text-[10px] font-black uppercase tracking-widest", res.status === 'Clear' ? "text-emerald-400" : "text-amber-400")}>
                    {res.label}
                  </div>
                  {res.alert && <div className="text-[8px] text-rose-400 font-bold mt-1">{res.alert}</div>}
               </div>
            </motion.div>
          ))}

          {!isScanning && results.length === 0 && (
            <div className="p-12 text-center rounded-3xl border border-white/5 bg-black/40">
               <Shield size={40} className="mx-auto text-slate-800 mb-4" />
               <p className="text-xs text-slate-600">{premiumLocales.sanctionsIntelligence.noResults}</p>
            </div>
          )}
        </div>
      </div>

      {/* Automated Warnings Section */}
      <div className="p-8 border-t border-white/5 bg-black/40 space-y-4">
         <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">{premiumLocales.sanctionsIntelligence.warningTitle}</span>
         </div>
         <p className="text-[11px] text-slate-400 leading-relaxed bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 border-dashed">
           "{premiumLocales.sanctionsIntelligence.warningMessage}"
         </p>
         <button className="w-full py-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-rose-500/20 transition-all">
            {premiumLocales.sanctionsIntelligence.fullReportButton}
         </button>
      </div>

      <div className="p-4 bg-rose-500/10 text-center border-t border-rose-500/20">
         <span className="text-[9px] font-black text-rose-400 uppercase tracking-[0.3em]">Compliance Hub Engine Active</span>
      </div>
    </div>
  );
};
