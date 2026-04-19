import React from 'react';
import { Truck, Box, ArrowRightLeft, TrendingUp, AlertCircle } from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ui/ViewHeader';

const MOCK_FLOWS = [
  { id: 1, route: 'Польща -> Україна', category: 'Паливо', value: '$84.2M', volume: '12.4k t', trend: '+5.2%' },
  { id: 2, route: 'Китай -> Україна', category: 'Електроніка', value: '$124.5M', volume: '4.1k t', trend: '+12.8%' },
  { id: 3, route: 'Німеччина -> Україна', category: 'Автозапчастини', value: '$45.1M', volume: '2.8k t', trend: '-2.1%' },
];

export const SupplyChainTab: React.FC = () => {
  return (
    <div className="flex flex-col h-full gap-6 p-6 overflow-y-auto custom-scrollbar">
      <ViewHeader 
        title="ПОТОКИ ТОВАРІВ"
        subtitle="Аналіз ланцюгів постачання та логістичних маршрутів у реальному часі"
        stats={[
          { label: 'АКТИВНІ МАРШРУТИ', value: '842' },
          { label: 'ЗАТРИМКИ', value: '4.2%' },
          { label: 'ПРОПУСКНА ЗДАТНІСТЬ', value: 'HIGH' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Глобальні потоку</h3>
          {MOCK_FLOWS.map((flow, i) => (
            <TacticalCard key={flow.id} variant="interactive" className="group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-xl">
                    <Truck size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h4 className="text-sm font-black text-white">{flow.route}</h4>
                       <ArrowRightLeft size={12} className="text-slate-600" />
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{flow.category}</span>
                      <span className="text-[10px] font-bold text-cyan-600 uppercase">{flow.volume}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-white">{flow.value}</div>
                  <div className={`text-[10px] font-black ${flow.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                    {flow.trend}
                  </div>
                </div>
              </div>
            </TacticalCard>
          ))}
        </div>

        <div className="space-y-6">
          <TacticalCard className="bg-amber-500/5 border-amber-500/20">
             <div className="flex items-center gap-2 text-amber-500 mb-4">
                <AlertCircle size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Аномалії трафіку</h3>
             </div>
             <p className="text-xs text-slate-400 mb-4">Виявлено нетипове зростання обсягів імпорту в категорії "Електрогенератори" на митному посту "Ягодин".</p>
             <button className="w-full py-2 bg-amber-500 text-black text-[10px] font-black uppercase rounded-lg hover:bg-amber-400 transition-colors">
                ДЕТАЛЬНИЙ АНАЛІЗ
             </button>
          </TacticalCard>

          <TacticalCard>
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Топ категорій (Вага)</h3>
             <div className="space-y-3">
                {[
                  { label: 'Зернові', val: 75 },
                  { label: 'Метали', val: 45 },
                  { label: 'Руда', val: 32 }
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>{item.label}</span>
                      <span>{item.val}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
             </div>
          </TacticalCard>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainTab;
