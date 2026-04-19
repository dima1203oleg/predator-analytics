import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, Download, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ui/ViewHeader';

const MOCK_SANCTIONS = [
  { id: 1, name: 'ТОВ "Вектор Плюс"', type: 'Entity', list: 'OFAC SDN', date: '2024-03-12', reason: 'Сприяння обходу санкцій', risk: 'Critical' },
  { id: 2, name: 'Іванов Сергій Петрович', type: 'Person', list: 'РНБО', date: '2023-11-05', reason: 'Фінансування тероризму', risk: 'High' },
  { id: 3, name: 'Bank of Eurasia', type: 'Entity', list: 'EU Consolidated', date: '2024-01-20', reason: 'Секторальні санкції', risk: 'Medium' },
];

export const SanctionsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full gap-6 p-6 overflow-y-auto custom-scrollbar">
      <ViewHeader 
        title="САНКЦІЙНІ СПИСКИ ТА PEP"
        subtitle="Глобальний моніторинг санкційних режимів (OFAC, EU, UN, РНБО)"
        stats={[
          { label: 'АКТИВНІ САНКЦІЇ', value: '12,482' },
          { label: 'PEP ОСОБИ', value: '45,102' },
          { label: 'ОНОВЛЕНО', value: 'СЬОГОДНІ' }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <TacticalCard className="md:col-span-1">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Фільтрація</h3>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Тип об'єкта</label>
              <select className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-500/50">
                <option>ВСІ</option>
                <option>ЮРИДИЧНІ ОСОБИ</option>
                <option>ФІЗИЧНІ ОСОБИ</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Реєстр</label>
              <div className="space-y-1">
                {['OFAC', 'EU', 'RNBO', 'UN'].map(reg => (
                  <label key={reg} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                    <input type="checkbox" className="accent-cyan-500" defaultChecked />
                    <span className="text-xs font-bold text-slate-300">{reg}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </TacticalCard>

        <div className="md:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Пошук за назвою, кодом або ПІБ..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all shadow-xl backdrop-blur-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {MOCK_SANCTIONS.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <TacticalCard variant="interactive" className="group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border ${
                        item.risk === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        item.risk === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                        'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      }`}>
                        <ShieldAlert size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">{item.name}</h4>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{item.type}</span>
                          <span className="text-[10px] font-bold text-cyan-600 uppercase">{item.list}</span>
                          <span className="text-[10px] font-bold text-slate-600">{item.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded text-[10px] font-black uppercase border ${
                        item.risk === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        'bg-orange-500/10 border-orange-500/20 text-orange-500'
                      }`}>
                        {item.risk}
                      </div>
                      <button className="p-2 bg-slate-900 border border-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase mb-1">
                      <AlertTriangle size={12} className="text-amber-500" />
                      Підстава накладення
                    </div>
                    <p className="text-xs text-slate-400">{item.reason}</p>
                  </div>
                </TacticalCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SanctionsTab;
