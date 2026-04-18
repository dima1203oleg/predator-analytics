import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
import { TransactionFlow } from '@/services/unified/analytics.service';

interface FinancialFlowPanelProps {
  flows: TransactionFlow[];
}

export const FinancialFlowPanel: React.FC<FinancialFlowPanelProps> = ({ flows }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic">ФІНАНСОВІ_ПОТОКИ_WRAITH</h4>
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-slate-500 font-mono italic uppercase tracking-widest">LIVE_DB_SOURCE</span>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
        {flows.map((flow, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ДЖЕРЕЛО / ПРИЗНАЧЕННЯ</span>
                <p className="text-[10px] font-black text-white uppercase italic tracking-tighter truncate max-w-[200px]">
                  {flow.from} <ArrowRightLeft size={10} className="inline mx-2 text-amber-500" /> {flow.to}
                </p>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black font-mono",
                flow.amount > 1000000 ? "bg-rose-500/20 text-rose-500 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-500 border border-emerald-500/40"
              )}>
                {flow.amount.toLocaleString()} {flow.currency}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-1">
                 <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                   <Calendar size={8} /> ДАТА
                 </span>
                 <p className="text-[9px] font-mono font-black text-slate-400">{flow.date}</p>
               </div>
               <div className="space-y-1">
                 <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                   <TrendingUp size={8} /> РИЗИК
                 </span>
                 <p className={cn(
                   "text-[9px] font-mono font-black",
                   flow.risk_score > 0.7 ? "text-rose-500" : "text-emerald-500"
                 )}>{(flow.risk_score * 10).toFixed(1)}/10</p>
               </div>
               <div className="space-y-1">
                 <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                   <DollarSign size={8} /> ТИП
                 </span>
                 <p className="text-[9px] font-mono font-black text-slate-400 uppercase italic">КЛІРИНГ</p>
               </div>
            </div>

            {flow.risk_score > 0.8 && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em]">ПОТЕНЦІЙНИЙ_ВИВІД_КАПІТАЛУ</span>
              </div>
            )}
          </motion.div>
        ))}
        {flows.length === 0 && (
          <div className="p-10 border border-dashed border-white/5 rounded-2xl text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">ФІНАНСОВІ_АНОВМАЛІЇ_НЕ_ВИЯВЛЕНІ</p>
          </div>
        )}
      </div>
    </div>
  );
};
