import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Target, 
  Shield, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';

import { analyticsService } from '@/services/unified/analytics.service';

const MOCK_OFFSHORE = [
  { name: 'Б� ИТ. ВІ� Г. О-ВИ', value: 38, amount: '$142.5M', color: '#10b981' },
  { name: 'КІП� ', value: 27, amount: '$98.2M',  color: '#059669' },
  { name: 'ОАЕ',  value: 18, amount: '$67.0M',  color: '#047857' },
  { name: 'БЕЛІЗ', value: 11, amount: '$41.1M', color: '#064e3b' },
  { name: 'ІНШІ', value: 6,  amount: '$22.0M',  color: '#022c22' },
];

export const OffshoreDetectorTab: React.FC = () => {
  const [offshoreData, setOffshoreData] = useState(MOCK_OFFSHORE);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsService.getFinancialSigint();
        if (result && result.offshore) {
          setOffshoreData(result.offshore as any);
        }
      } catch (err) {
        console.warn('Using fallback data for OffshoreDetectorTab');
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-12 gap-8 p-6 h-full overflow-y-auto custom-scrollbar">
      {/* Ліва колонка: � адар офшорів */}
      <div className="col-span-12 xl:col-span-5 p-8 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl space-y-8 relative overflow-hidden">
        <h2 className="text-sm font-black text-emerald-500 italic uppercase tracking-[0.4em] border-b border-white/10 pb-6 flex items-center gap-4">
          <Globe size={20} className="animate-spin-slow text-emerald-500" /> 
          � АДА� _ОФШО� НОЇ_ЛІКВІДНОСТІ
        </h2>
        
        <div className="flex items-center justify-center p-6 bg-slate-900/40 rounded-[3rem] relative group border border-white/5 shadow-inner">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={offshoreData} 
                  innerRadius={70} 
                  outerRadius={110} 
                  paddingAngle={8} 
                  dataKey="value" 
                  cx="50%" 
                  cy="50%"
                  stroke="none"
                >
                  {offshoreData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'rgba(2,6,23,0.98)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px' }} 
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white font-black italic text-2xl font-mono tracking-tighter">$470M</text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          {offshoreData.map(d => (
            <div key={d.name} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase italic tracking-widest">{d.name}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-lg font-black text-white italic font-mono tracking-tighter">{d.amount}</span>
                <div className="bg-slate-900 px-2 py-1 rounded-md border border-white/5">
                  <span className="text-[10px] font-black text-emerald-500 italic font-mono">{d.value}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Права колонка: Аналіз кластерів */}
      <div className="col-span-12 xl:col-span-7 p-8 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl space-y-8 relative overflow-hidden flex flex-col">
        <h2 className="text-sm font-black text-emerald-500 italic uppercase tracking-[0.4em] border-b border-white/10 pb-6 flex items-center gap-4">
          <Target size={20} className="text-emerald-500" /> 
          АНАЛІЗ_ГПС_КЛАСТЕ� ІВ // ВЛАСНИКИ
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-2 flex-1">
          {[
            { name: 'Kyoto Holdings Ltd', jur: 'BVI', links: 14, risk: 97, amount: '$47M', ubo: 'ПІДТВЕ� ДЖЕНО', color: '#10b981' },
            { name: 'Sunrise Capital Ltd', jur: 'Кіпр', links: 8, risk: 89, amount: '$21M', ubo: 'ЧАСТКОВО', color: '#059669' },
            { name: 'Gulf Meridian FZCO', jur: 'ОАЕ', links: 11, risk: 94, amount: '$31M', ubo: 'ПІДТВЕ� ДЖЕНО', color: '#10b981' },
            { name: 'Belize Trust Corp', jur: 'Белізе', links: 5, risk: 82, amount: '$18M', ubo: 'НЕВІДОМО', color: '#059669' },
            { name: 'Alpha Neptune LP', jur: 'Маршалли', links: 19, risk: 99, amount: '$82M', ubo: 'ПІДТВЕ� ДЖЕНО', color: '#10b981' },
            { name: 'Zodiac Nexus FZ', jur: 'Панама', links: 7, risk: 85, amount: '$12M', ubo: 'НЕВІДОМО', color: '#059669' },
          ].map((s, i) => (
            <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.03] hover:border-emerald-500/30 transition-all group flex flex-col justify-between h-[300px] shadow-2xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-white italic uppercase tracking-tighter group-hover:text-emerald-500 transition-colors leading-none">{s.name}</h4>
                    <p className="text-[9px] font-black text-slate-600 uppercase italic tracking-widest">{s.jur} // ЗВ'ЯЗКИ: {s.links}</p>
                  </div>
                  <div className="p-3 bg-black border border-white/5 rounded-xl">
                    <Shield size={16} className={s.risk > 90 ? "text-emerald-500 animate-pulse" : "text-emerald-600"} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-black italic font-mono text-white leading-none tracking-tighter">{s.amount}</p>
                  <span className={cn(
                    "text-[8px] font-black italic tracking-widest uppercase px-3 py-1 rounded-lg border inline-block",
                    s.ubo === 'ПІДТВЕ� ДЖЕНО' ? "bg-emerald-600/10 border-emerald-600/30 text-emerald-500" : 
                    s.ubo === 'ЧАСТКОВО' ? "bg-amber-600/10 border-amber-600/30 text-amber-500" : 
                    "bg-slate-700/10 border-slate-700/30 text-slate-700"
                  )}>КБВ: {s.ubo}</span>
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t border-white/[0.03]">
                <div className="flex items-center justify-between text-[9px] font-black text-slate-700 uppercase italic tracking-widest">
                  <span>� ИЗИК</span>
                  <span style={{ color: s.color }}>{s.risk}%</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${s.risk}%` }} 
                    transition={{ delay: 0.3 + i * 0.05, duration: 1 }} 
                    className="h-full rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .animate-spin-slow { animation: spin 20s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default OffshoreDetectorTab;
