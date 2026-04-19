import React from 'react';
import { Users, Star, ShieldCheck, ExternalLink, Globe } from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ui/ViewHeader';

const MOCK_SUPPLIERS = [
  { id: 1, name: 'Global Logistics GmbH', country: 'DE', rating: 4.8, reliability: 'High', category: 'Transport', volume: '$12.1M' },
  { id: 2, name: 'Shenzhen Tech Ltd', country: 'CN', rating: 4.5, reliability: 'Medium', category: 'Electronics', volume: '$45.8M' },
  { id: 3, name: 'Polska Stal S.A.', country: 'PL', rating: 4.9, reliability: 'Elite', category: 'Raw Materials', volume: '$32.4M' },
];

export const SuppliersTab: React.FC = () => {
  return (
    <div className="flex flex-col h-full gap-6 p-6 overflow-y-auto custom-scrollbar">
      <ViewHeader 
        title="РЕЄСТР ПОСТАЧАЛЬНИКІВ"
        subtitle="Агрегований рейтинг надійності та аналіз активності іноземних контрагентів"
        stats={[
          { label: 'ПЕРЕВІРЕНІ', value: '4,219' },
          { label: 'CRONY_INDEX', value: 'LOW' },
          { label: 'НОВІ ЗА МІСЯЦЬ', value: '+124' }
        ]}
      />

      <div className="grid grid-cols-1 gap-4">
        {MOCK_SUPPLIERS.map((supplier, i) => (
          <TacticalCard key={supplier.id} variant="interactive" className="group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl">
                    <Users size={24} className="text-indigo-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full border-2 border-slate-950">
                    <ShieldCheck size={10} className="text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{supplier.name}</h4>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-black">{supplier.country}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-slate-300">{supplier.rating}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{supplier.category}</span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Обсяг: {supplier.volume}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Надійність</div>
                  <div className={`text-xs font-black uppercase ${
                    supplier.reliability === 'Elite' ? 'text-cyan-400' :
                    supplier.reliability === 'High' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {supplier.reliability}
                  </div>
                </div>
                <button className="p-3 bg-slate-900 hover:bg-white/5 border border-white/5 rounded-xl text-slate-400 transition-all">
                  <ExternalLink size={18} />
                </button>
              </div>
            </div>
          </TacticalCard>
        ))}
      </div>
    </div>
  );
};

export default SuppliersTab;
