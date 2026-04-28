import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  ArrowUpRight, 
  Fingerprint, 
  Shield 
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { analyticsService, FrozenAsset } from '@/services/unified/analytics.service';

const MOCK_FROZEN = [
  { entity: 'ПУМБ  АХУНОК 4521', amount: '$12.4M', date: '2025-12-01', authority: 'РНБО', reason: 'Санкційний список', status: 'ЗАМО ОЖЕНО' },
  { entity: 'ТОВ "АЛЬФА-ХОЛДИНГ"', amount: '$7.8M',  date: '2026-01-15', authority: 'EU SDN', reason: 'Фінансування агресії', status: 'ЗАМО ОЖЕНО' },
  { entity: 'ЯХТА "SOVEREIGN"', amount: '$18.5M', date: '2026-03-08', authority: 'MAS', reason: 'Ухилення від санкцій', status: 'КОНФІСКОВАНО' },
];

export const AssetTrackerTab: React.FC = () => {
  const [frozenAssets, setFrozenAssets] = useState<FrozenAsset[]>(MOCK_FROZEN);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsService.getFinancialSigint();
        if (result && result.frozen) {
          setFrozenAssets(result.frozen);
        }
      } catch (err) {
        console.warn('Using fallback data for AssetTrackerTab');
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar flex flex-col gap-8">
      <div className="bg-black/40 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden relative group">
        <div className="p-10 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white italic uppercase tracking-[0.4em] flex items-center gap-4">
              <div className="p-3 bg-emerald-600/10 border border-emerald-600/20 rounded-xl text-emerald-500">
                <Lock size={20} className="animate-pulse" />
              </div>
              РЕЄСТР_ЗАМО ОЖЕНИХ_АКТИВІВ // АКТИВНИЙ_ЩИТ
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic border-l-2 border-emerald-500/40 pl-4">
              ПЕ ЕЛІК ПЕ ЕК ИТИХ КАНАЛІВ ФІНАНСУВАННЯ ТА ВИЛУЧЕНОГО МАЙНА
            </p>
          </div>
          <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-white/10 hover:border-emerald-500/50 transition-all flex items-center gap-3">
            ARBITRAGE_МАТ ИЦЯ <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.02]">
              <tr>
                {['ОБ\'ЄКТ_ВЛАСНОСТІ', 'СУМА', 'ДАТА', 'О ГАН', 'СТАТУС'].map(h => (
                  <th key={h} className="px-10 py-6 text-[9px] font-black text-slate-600 uppercase tracking-widest italic font-mono border-b border-white/5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frozenAssets.map((asset, i) => (
                <tr key={i} className="border-b border-white/[0.02] hover:bg-emerald-950/20 transition-all cursor-pointer group/row relative overflow-hidden">
                  <td className="px-10 py-8 text-lg font-black text-white italic truncate max-w-[300px] group-hover/row:text-emerald-400 transition-colors uppercase tracking-tight relative z-10">{asset.entity}</td>
                  <td className="px-10 py-8 text-2xl font-black text-emerald-500 italic font-mono tracking-tighter relative z-10">{asset.amount}</td>
                  <td className="px-10 py-8 text-[11px] font-black text-slate-500 italic font-mono relative z-10">{asset.date}</td>
                  <td className="px-10 py-8 relative z-10">
                    <span className="bg-emerald-600/10 border border-emerald-600/30 text-emerald-500 px-4 py-1.5 rounded-lg text-[9px] font-black italic tracking-wider shadow-inner">{asset.authority}</span>
                  </td>
                  <td className="px-10 py-8 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full shadow-lg", asset.status === 'ЗАМО ОЖЕНО' ? "bg-emerald-600 animate-pulse shadow-emerald-900/50" : "bg-cyan-600 shadow-cyan-900/50")} />
                      <span className="text-[10px] font-black text-white uppercase italic tracking-widest">{asset.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-white/[0.01] flex justify-center border-t border-white/5">
          <div className="flex items-center gap-3 text-[9px] font-black text-slate-700 uppercase italic tracking-widest">
            <Fingerprint size={12} /> КІНЕЦЬ_СПИСКУ_ЗАПИСІВ_SOVEREIGN
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetTrackerTab;
