import React from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, TrendingUp, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { premiumLocales } from '../../locales/uk/premium';

export const ExecutiveBriefingWidget: React.FC<{
  persona: string;
  onOpenDossier?: (name: string) => void;
}> = ({ persona, onOpenDossier }) => {
  if (persona !== 'TITAN' && persona !== 'SOVEREIGN') return null;


  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-[24px] backdrop-blur-xl overflow-hidden h-full flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between relative z-10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Mail className="text-slate-300" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              {premiumLocales.executiveBriefingWidget.title}
            </h3>
            <p className="text-[9px] text-slate-400 font-mono">02.02.2026 • 08:00</p>
          </div>
        </div>
        <button className="text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            {premiumLocales.executiveBriefingWidget.archive} <ArrowRight size={10} />
        </button>
      </div>

      {/* Report Content */}
      <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6 relative z-10 font-sans text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">

        {/* Intro */}
        <div>
           <h4 className="text-lg font-bold text-white mb-2">{premiumLocales.executiveBriefingWidget.greetings}</h4>
           <p className="text-sm text-slate-400">
             {premiumLocales.executiveBriefingWidget.intro}
           </p>
        </div>

        {/* Key Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                 <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs uppercase">
                    <TrendingUp size={14} /> {premiumLocales.executiveBriefingWidget.opportunities}
                 </div>
                 <p className="text-xs text-slate-300">
                    {premiumLocales.executiveBriefingWidget.opportunitiesDesc}
                 </p>
             </div>

             <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                 <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-xs uppercase">
                    <AlertTriangle size={14} /> {premiumLocales.executiveBriefingWidget.risks}
                 </div>
                 <p className="text-xs text-slate-300">
                    {premiumLocales.executiveBriefingWidget.risksDesc}
                 </p>
             </div>
        </div>

        {/* Action Items list */}
        <div className="space-y-3">
            <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                {premiumLocales.executiveBriefingWidget.recommendedActions}
            </h5>
            <ul className="space-y-3">
                <li className="flex gap-3 items-start group/item cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                    <div className="mt-0.5 w-4 h-4 rounded-full border border-slate-600 group-hover/item:border-emerald-500 group-hover/item:bg-emerald-500/20 transition-all flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/item:bg-emerald-500" />
                    </div>
                    <div>
                        <span className="text-sm text-white font-medium block">{premiumLocales.executiveBriefingWidget.actions.confirmPurchase}</span>
                        <span className="text-xs text-slate-500">{premiumLocales.executiveBriefingWidget.actions.confirmPurchaseSub}</span>
                    </div>
                </li>
                <li
                  onClick={() => onOpenDossier?.('ТОВ Вектор')}
                  className="flex gap-3 items-start group/item cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2"
                >
                    <div className="mt-0.5 w-4 h-4 rounded-full border border-slate-600 group-hover/item:border-emerald-500 group-hover/item:bg-emerald-500/20 transition-all flex items-center justify-center">
                         <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/item:bg-emerald-500" />
                    </div>
                    <div>
                        <span className="text-sm text-white font-medium block">{premiumLocales.executiveBriefingWidget.actions.updateRisk}</span>
                        <span className="text-xs text-slate-500">{premiumLocales.executiveBriefingWidget.actions.updateRiskSub}</span>
                    </div>
                </li>
            </ul>
        </div>

        {/* Summary Footer */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck size={14} />
                <span>{premiumLocales.executiveBriefingWidget.protectionActive}</span>
            </div>
            <div className="font-mono text-slate-500">
                {premiumLocales.executiveBriefingWidget.signature}
            </div>
        </div>

      </div>
    </div>
  );
};
