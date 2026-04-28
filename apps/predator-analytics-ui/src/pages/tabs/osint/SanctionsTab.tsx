import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, Download, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/lib/utils';

const MOCK_SANCTIONS = [
  { id: 1, name: 'ТОВ "Вектор Плюс"', type: 'Юридична особа', list: 'OFAC SDN', date: '2024-03-12', reason: 'Сприяння обходу санкцій', risk: 'Critical' },
  { id: 2, name: 'Іванов Сергій Петрович', type: 'Фізична особа', list: '� НБО', date: '2023-11-05', reason: 'Фінансування тероризму', risk: 'High' },
  { id: 3, name: 'Банк Євразія', type: 'Юридична особа', list: 'EU Consolidated', date: '2024-01-20', reason: 'Секторальні санкції', risk: 'Medium' },
];

const riskLabels: Record<string, string> = {
  'Critical': 'Критичний',
  'High': 'Високий',
  'Medium': 'Середній',
  'Low': 'Низький'
};

export const SanctionsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full gap-4 p-4 lg:p-6 overflow-y-auto custom-scrollbar bg-slate-950/40">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <TacticalCard className="md:col-span-1 border-white/5 bg-slate-900/40 backdrop-blur-md">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Filter size={14} className="text-rose-500" />
              Фільтрація
            </h3>
            <div className="space-y-3">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Тип об'єкта</label>
              <select className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500/50 transition-all cursor-pointer">
                <option>ВСІ ТИПИ</option>
                <option>Ю� ИДИЧНІ ОСОБИ</option>
                <option>ФІЗИЧНІ ОСОБИ</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">� еєстри Моніторингу</label>
              <div className="space-y-1.5">
                {['OFAC SDN', 'EU Consolidated', '� НБО (Україна)', 'ООН (UNSC)'].map(reg => (
                  <label key={reg} className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-all group border border-transparent hover:border-white/5">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-slate-950 text-rose-500 focus:ring-rose-500/30" defaultChecked />
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors uppercase tracking-tight">{reg}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all flex items-center justify-center gap-2">
                <Download size={14} />
                Експорт Списку
            </button>
          </div>
        </TacticalCard>

        <div className="md:col-span-3 space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-rose-500/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
            <input 
              type="text" 
              placeholder="Пошук за назвою, ЄД� ПОУ або ПІБ..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50 transition-all shadow-2xl backdrop-blur-xl relative z-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {MOCK_SANCTIONS.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <TacticalCard variant="interactive" className="group border-white/5 bg-slate-900/20 hover:bg-slate-900/40 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "p-4 rounded-2xl border transition-all shadow-lg",
                        item.risk === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-rose-500/5' :
                        item.risk === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500 shadow-orange-500/5' :
                        'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/5'
                      )}>
                        <ShieldAlert size={24} className={item.risk === 'Critical' ? 'animate-pulse' : ''} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white group-hover:text-rose-400 transition-colors uppercase italic tracking-tight">{item.name}</h4>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ТИП:</span>
                            <span className="text-[10px] font-bold text-slate-300 uppercase">{item.type}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">� ЕЄСТ� :</span>
                            <span className="text-[10px] font-bold text-rose-500 uppercase">{item.list}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ДАТА:</span>
                            <span className="text-[10px] font-bold text-slate-500">{item.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                        item.risk === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                        item.risk === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                        'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      )}>
                        � ИЗИК: {riskLabels[item.risk]}
                      </div>
                      <button className="p-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:border-white/20 transition-all">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 p-4 bg-slate-950/40 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      <AlertTriangle size={12} className="text-amber-500" />
                      Юридична підстава санкційного тиску
                    </div>
                    <p className="text-xs text-slate-400 italic leading-relaxed">{item.reason}</p>
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
