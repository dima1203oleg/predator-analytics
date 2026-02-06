import React from 'react';
import { Brain, Cpu, CheckCircle } from 'lucide-react';

export const Models: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">ML Моделі</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 relative ">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Brain size={64} /></div>
            <h3 className="text-lg font-bold text-white mb-2">GPT-4 Turbo</h3>
            <p className="text-slate-500 text-sm mb-4">Основна модель для генерації звітів та аналізу текстів.</p>
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase">
               <CheckCircle size={14} /> Active
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 relative ">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Cpu size={64} /></div>
            <h3 className="text-lg font-bold text-white mb-2">BERT-UA-Large</h3>
            <p className="text-slate-500 text-sm mb-4">Спеціалізована модель для української мови (NER, Sentiment).</p>
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase">
               <CheckCircle size={14} /> Active
            </div>
         </div>

         <div className="bg-slate-900/50 border border-blue-500/20 rounded-xl p-6 relative  bg-gradient-to-br from-blue-900/10 to-transparent">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-blue-500"><Brain size={64} /></div>
            <h3 className="text-lg font-bold text-blue-400 mb-2">SOM Hypervisor v29</h3>
            <p className="text-slate-400 text-sm mb-4">Автономний агент контролю цілісності та безпеки.</p>
            <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase font-mono">
               <CheckCircle size={14} /> Active
            </div>
         </div>

         <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 relative  bg-gradient-to-br from-cyan-900/10 to-transparent">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-cyan-500"><Cpu size={64} /></div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Truth Ledger Core</h3>
            <p className="text-slate-400 text-sm mb-4">Криптографічна перевірка фактів та фіксація записів.</p>
            <div className="flex items-center gap-2 text-cyan-500 text-xs font-bold uppercase font-mono">
               <CheckCircle size={14} /> Active
            </div>
         </div>
      </div>
    </div>
  );
};
