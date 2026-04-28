import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  ArrowDownRight, 
  RefreshCw, 
  Skull, 
  Zap 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { analyticsService, SuspiciousTx } from '@/services/unified/analytics.service';
import { SovereignAudio } from '@/utils/sovereign-audio';

const MOCK_SWIFT_FLOW = [
  { hour: '00:00', normal: 12, suspicious: 0.2 },
  { hour: '04:00', normal: 5,  suspicious: 0.4 },
  { hour: '08:00', normal: 45, suspicious: 1.2 },
  { hour: '12:00', normal: 120, suspicious: 14.4 },
  { hour: '16:00', normal: 84, suspicious: 4.8 },
  { hour: '20:00', normal: 38, suspicious: 1.6 },
  { hour: '23:59', normal: 14, suspicious: 0.3 },
];

const MOCK_SUSPICIOUS_TX = [
  { id: 'TX-ELITE-8821', from: 'ТОВ "АГ О-ЛІДЕ "', to: 'Kyoto Holdings Ltd (BVI)', amount: '$4.7M', currency: 'USD', time: '12:14:22', risk: 98, type: 'Фіктивна компанія', route: 'UA → BVI → ОАЕ' },
  { id: 'TX-ELITE-7203', from: 'БФ "ВІД ОДЖЕННЯ"', to: 'Sunrise Capital Ltd (CY)', amount: '$2.1M', currency: 'USD', time: '10:47:08', risk: 89, type: 'Шайрування', route: 'UA → CY → MT' },
  { id: 'TX-ELITE-5509', from: 'ФОП ТКАЧЕНКО В.М.', to: 'Gulf Meridian FZCO (UAE)', amount: '$1.4M', currency: 'AED', time: '08:55:19', risk: 94, type: 'PEP експозиція', route: 'UA → AE → SA' },
  { id: 'TX-ELITE-4412', from: 'ТОВ "МЕТАЛ-Г УП"', to: 'Belize Trust Corp (BZ)', amount: '$3.2M', currency: 'USD', time: '07:14:55', risk: 92, type: 'Санкційний вузол', route: 'UA → BZ → PA' },
];

export const SwiftMonitorTab: React.FC = () => {
  const [swiftData, setSwiftData] = useState(MOCK_SWIFT_FLOW);
  const [suspiciousTx, setSuspiciousTx] = useState<SuspiciousTx[]>(MOCK_SUSPICIOUS_TX);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsService.getFinancialSigint();
        if (result) {
          if (result.swift) setSwiftData(result.swift as any);
          if (result.suspicious) setSuspiciousTx(result.suspicious);
        }
      } catch (err) {
        console.warn('Using fallback data for SwiftMonitorTab');
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-12 gap-8 p-6 h-full overflow-y-auto custom-scrollbar">
      {/* Ліва колонка: Графік потоків */}
      <div className="col-span-12 xl:col-span-8 p-8 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-6">
          <h2 className="text-sm font-black text-white italic uppercase tracking-[0.4em] flex items-center gap-4">
            <Activity size={20} className="text-emerald-500 shadow-[0_0_15px_#10b981]" />
            ДИНАМІКА_ПОТОКІВ_SWIFT // МОНІТО ИНГ
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">НОРМАЛЬНИЙ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">ЗАГ ОЗА</span>
            </div>
          </div>
        </div>
        
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={swiftData}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="10 10" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: '900' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: '900' }} />
              <Tooltip 
                contentStyle={{ background: 'rgba(2,6,23,0.95)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px' }} 
                itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }} 
              />
              <Area type="monotone" dataKey="normal" stroke="rgba(255,255,255,0.05)" strokeWidth={2} fill="url(#goldGrad)" fillOpacity={0.05} />
              <Area type="monotone" dataKey="suspicious" stroke="#10b981" strokeWidth={4} fill="url(#goldGrad)" dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Права колонка: Підозрілі транзакції */}
      <div className="col-span-12 xl:col-span-4 p-8 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-all rotate-12 duration-[10s] pointer-events-none">
          <Skull size={200} className="text-emerald-600" />
        </div>
        <h3 className="text-[12px] font-black text-emerald-600 italic uppercase tracking-[0.4em] mb-6 border-b border-emerald-500/10 pb-6 flex items-center justify-between">
          <span>ЗАГ ОЗЛИВІ_Т АНЗАКЦІЇ</span>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse delay-75" />
          </div>
        </h3>
        
        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {suspiciousTx.map((tx) => (
            <div key={tx.id} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-emerald-600/30 transition-all cursor-pointer group/item space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black font-mono text-emerald-600 tracking-wider uppercase">{tx.id}</span>
                <Badge className="bg-emerald-600/20 text-emerald-400 border-none font-black italic px-2 py-0.5 rounded-md uppercase text-[9px]">{tx.time}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-white italic truncate tracking-tight">{tx.from}</p>
                <div className="flex items-center gap-3 opacity-20">
                  <div className="h-px bg-slate-800 flex-1" />
                  <ArrowDownRight size={14} className="text-emerald-600" />
                  <div className="h-px bg-slate-800 flex-1" />
                </div>
                <p className="text-sm font-black text-emerald-500 italic truncate tracking-tight uppercase">{tx.to}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none">СУМА</p>
                  <span className="text-lg font-black italic font-mono text-white tracking-tighter">{tx.amount}</span>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">РИЗИК</p>
                  <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-md bg-emerald-600 shadow-lg font-mono">{tx.risk}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-6 relative w-full py-5 group/btn overflow-hidden rounded-[1.5rem] border border-emerald-600/20 bg-emerald-600/5 hover:bg-emerald-600 transition-colors duration-500">
          <div className="relative text-emerald-600 group-hover/btn:text-white font-black uppercase tracking-[0.4em] text-[10px] italic transition-colors">
            БЛОКУВАТИ ПОТІК
          </div>
        </button>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.3); }
      `}</style>
    </div>
  );
};

export default SwiftMonitorTab;
