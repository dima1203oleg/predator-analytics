import React from 'react';
import { motion } from 'framer-motion';
import { Swords, TrendingUp, TrendingDown, Users, DollarSign, Activity, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface Competitor {
  id: string;
  name: string;
  marketShare: number;
  growth: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  lastMove: string;
  color: string;
}

export const CompetitorWarBoardWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const competitors: Competitor[] = [
    { id: '1', name: 'Alpha Corp', marketShare: 32, growth: 12.5, riskLevel: 'Low', lastMove: 'Відкрито новий маршрут з Китаю', color: '#6366f1' },
    { id: '2', name: 'Beta Logistics', marketShare: 28, growth: -2.3, riskLevel: 'Medium', lastMove: 'Виявлено підсанкційного постачальника', color: '#f43f5e' },
    { id: '3', name: 'Gamma Import', marketShare: 15, growth: 45.0, riskLevel: 'High', lastMove: 'Агресивне ціноутворення в HS 8507', color: '#fbbf24' },
  ];

  return (
    <div className="bg-slate-950/80 border border-white/5 rounded-[32px] backdrop-blur-xl overflow-hidden h-full flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <Swords size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{premiumLocales.competitorWarBoard.title}</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{premiumLocales.competitorWarBoard.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
              <Zap size={10} /> {premiumLocales.competitorWarBoard.aiActive}
           </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto scrollbar-hide space-y-6">
        <div className="space-y-4">
          {competitors.map((comp, i) => (
            <motion.div
              key={comp.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-[24px] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/card"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black border",
                        comp.color === '#6366f1' ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40" :
                        comp.color === '#f43f5e' ? "bg-rose-500/20 text-rose-400 border-rose-500/40" :
                        "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    )}
                  >
                    {comp.name[0]}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">{comp.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                          <Users size={10} /> {premiumLocales.competitorWarBoard.marketLabel}: {comp.marketShare}%
                       </span>
                       <span className={cn(
                         "text-[10px] font-bold flex items-center gap-0.5",
                         comp.growth > 0 ? "text-emerald-400" : "text-rose-400"
                       )}>
                         {comp.growth > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                         {Math.abs(comp.growth)}%
                       </span>
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                  comp.riskLevel === 'Low' ? "bg-emerald-500/10 text-emerald-400" :
                  comp.riskLevel === 'Medium' ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                )}>
                  {premiumLocales.competitorWarBoard.riskLabel}: {comp.riskLevel === 'Low' ? premiumLocales.competitorWarBoard.riskLevels.low : comp.riskLevel === 'Medium' ? premiumLocales.competitorWarBoard.riskLevels.medium : premiumLocales.competitorWarBoard.riskLevels.high}
                </div>
              </div>

              {/* Progress Bar (Visual Share) */}
              <div className="mb-6">
                 <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase mb-2">
                    <span>{premiumLocales.competitorWarBoard.efficiencyMetric}</span>
                    <span>{comp.marketShare + 15}/100</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${comp.marketShare + 15}%` }}
                      className={cn(
                          "h-full shadow-[0_0_10px_rgba(255,255,255,0.1)]",
                          comp.color === '#6366f1' ? "bg-indigo-500" :
                          comp.color === '#f43f5e' ? "bg-rose-500" : "bg-amber-500"
                      )}
                    />
                 </div>
              </div>

              {/* Tactical Insight */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-start gap-3">
                 <ShieldCheck size={14} className="text-indigo-400 mt-0.5" />
                 <div>
                    <div className="text-[10px] text-slate-500 uppercase font-black mb-1">{premiumLocales.competitorWarBoard.latestIntelligence}</div>
                    <div className="text-xs text-slate-300 italic">"{comp.lastMove}"</div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer / Summary */}
      <div className="p-6 border-t border-white/5 bg-black/40">
         <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
               <span className="text-[9px] text-slate-500 uppercase font-black">{premiumLocales.competitorWarBoard.aiForecast}</span>
               <span className="text-xs text-emerald-400 font-bold">{premiumLocales.competitorWarBoard.marketConsolidationForecast}</span>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
               {premiumLocales.competitorWarBoard.fullGapAnalysis}
            </button>
         </div>
      </div>
    </div>
  );
};
