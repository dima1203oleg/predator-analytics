import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, TrendingUp, AlertCircle, CheckCircle2, Building, ArrowRight, DollarSign, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface Tender {
  id: string;
  title: string;
  customer: string;
  amount: string;
  deadline: string;
  probability: number; // 0-100
  competitors: number;
  status: 'open' | 'review';
  matchReason: string;
}

export const TenderIntelligenceWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [tenders, setTenders] = useState<Tender[]>([
    {
      id: '1',
      title: 'Поставка акумуляторних батарей LiFePO4',
      customer: 'ДП "Енергоатом"',
      amount: '45 000 000 ₴',
      deadline: '3 дні',
      probability: 87,
      competitors: 2,
      status: 'open',
      matchReason: 'У вас найкраща ціна імпорту в регіоні'
    },
    {
      id: '2',
      title: 'Закупівля захищених ноутбуків',
      customer: 'Міністерство Оборони',
      amount: '12 500 000 ₴',
      deadline: '5 днів',
      probability: 64,
      competitors: 5,
      status: 'open',
      matchReason: 'Конкуренти мають проблеми з логістикою'
    },
    {
      id: '3',
      title: 'Мережеве обладнання Cisco',
      customer: 'Нацбанк України',
      amount: '8 200 000 ₴',
      deadline: '12 годин',
      probability: 45,
      competitors: 8,
      status: 'review',
      matchReason: 'Висока конкуренція, але ваш склад повний'
    }
  ]);

  if (persona !== 'TITAN') return null;

  return (
    <div className="bg-slate-950/80 border border-blue-500/20 rounded-[24px] backdrop-blur-xl overflow-hidden h-full flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none transition-all duration-500 group-hover:from-blue-500/10" />

      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20">
            <Gavel className="text-blue-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              {premiumLocales.tenderIntelligence.title}
            </h3>
            <p className="text-[9px] text-slate-500 font-mono">{premiumLocales.tenderIntelligence.subtitle}</p>
          </div>
        </div>
        <div className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1">
            <TrendingUp size={12} /> AI Scoring
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 scrollbar-hide">
         {tenders.map((tender, i) => (
             <motion.div
               key={tender.id}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all group/card cursor-pointer"
             >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-1 group-hover/card:text-blue-400 transition-colors leading-snug">
                            {tender.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                             <Building size={10} /> {tender.customer}
                        </div>
                    </div>
                     <div className="text-right">
                        <div className="text-sm font-black text-white font-mono">{tender.amount}</div>
                        <div className="text-[9px] text-rose-400 flex items-center justify-end gap-1 font-bold">
                            <Calendar size={10} /> {tender.deadline}
                        </div>
                     </div>
                </div>

                {/* AI Insight */}
                <div className="mb-4 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-start gap-2">
                    <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-emerald-300 leading-snug">
                        <span className="font-bold">{premiumLocales.tenderIntelligence.aiInsight}</span> {tender.matchReason}
                    </p>
                </div>

                {/* Probability Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-slate-500">{premiumLocales.tenderIntelligence.winProbability}</span>
                        <span className={cn(
                            tender.probability > 70 ? "text-emerald-400" :
                            tender.probability > 40 ? "text-amber-400" : "text-rose-400"
                        )}>{tender.probability}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                           initial={{ width: 0 }}
                           animate={{ width: `${tender.probability}%` }}
                           className={cn(
                               "h-full rounded-full",
                               tender.probability > 70 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                               tender.probability > 40 ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-rose-500 to-rose-400"
                           )}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center opacity-60 group-hover/card:opacity-100 transition-opacity">
                    <div className="text-[10px] text-slate-500">
                        {tender.competitors} {premiumLocales.tenderIntelligence.competitors}
                    </div>
                    <button className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        {premiumLocales.tenderIntelligence.applyButton} <ArrowRight size={12} />
                    </button>
                </div>
             </motion.div>
         ))}

         <div className="pt-2 text-center">
            <button className="text-xs text-slate-500 hover:text-white transition-colors underline decoration-dotted">
                {premiumLocales.tenderIntelligence.viewMore.replace('{count}', '14')}
            </button>
         </div>
      </div>
    </div>
  );
};
