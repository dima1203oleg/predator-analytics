import React from 'react';
import { motion } from 'framer-motion';
import { Map, Clock, DollarSign, AlertCircle, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface Corridor {
  id: string;
  name: string;
  avgTime: string;
  avgCost: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  trend: 'up' | 'down' | 'stable';
  efficiency: number;
}

export const TradeCorridorWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const corridors: Corridor[] = [
    { id: '1', name: premiumLocales.tradeCorridor.corridors.cnPlUa, avgTime: `35-42 ${premiumLocales.tradeCorridor.time.ofDays}`, avgCost: '$4,200', riskLevel: 'Low', trend: 'down', efficiency: 94 },
    { id: '2', name: premiumLocales.tradeCorridor.corridors.cnRoUa, avgTime: `28-32 ${premiumLocales.tradeCorridor.time.ofDays}`, avgCost: '$3,800', riskLevel: 'Medium', trend: 'stable', efficiency: 82 },
    { id: '3', name: premiumLocales.tradeCorridor.corridors.trGeUa, avgTime: `12-15 ${premiumLocales.tradeCorridor.time.days}`, avgCost: '$2,100', riskLevel: 'Low', trend: 'up', efficiency: 88 },
    { id: '4', name: premiumLocales.tradeCorridor.corridors.euDirect, avgTime: `3-5 ${premiumLocales.tradeCorridor.time.days}`, avgCost: '$1,500', riskLevel: 'High', trend: 'up', efficiency: 65 },
  ];

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-[24px] backdrop-blur-xl overflow-hidden h-full flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none transition-all duration-500 group-hover:from-indigo-500/10" />

      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Globe size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              {premiumLocales.tradeCorridor.title}
            </h3>
            <p className="text-[9px] text-slate-500 font-mono italic">{premiumLocales.tradeCorridor.subtitle}</p>
          </div>
        </div>
        <div className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-bold uppercase">
          {premiumLocales.tradeCorridor.marketIntelligence}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 scrollbar-hide">
        {corridors.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer group/item"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white group-hover/item:text-indigo-400 transition-colors">{c.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                   <span className="flex items-center gap-1"><Clock size={12} /> {c.avgTime}</span>
                   <span className="flex items-center gap-1"><DollarSign size={12} /> {c.avgCost}</span>
                </div>
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[9px] font-black uppercase",
                c.riskLevel === 'Low' ? "bg-emerald-500/20 text-emerald-400" :
                c.riskLevel === 'Medium' ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
              )}>
                {premiumLocales.tradeCorridor.risk}: {c.riskLevel === 'Low' ? premiumLocales.tradeCorridor.riskLevels.low : c.riskLevel === 'Medium' ? premiumLocales.tradeCorridor.riskLevels.medium : premiumLocales.tradeCorridor.riskLevels.high}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.efficiency}%` }}
                  className={cn(
                    "h-full rounded-full",
                    c.efficiency > 90 ? "bg-indigo-500" :
                    c.efficiency > 80 ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">{c.efficiency}% {premiumLocales.tradeCorridor.efficiency}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40">
        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
           {premiumLocales.tradeCorridor.simulateRoute} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
