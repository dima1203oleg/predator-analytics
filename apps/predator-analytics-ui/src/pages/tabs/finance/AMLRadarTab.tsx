import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Target, 
  Cpu, 
  Network, 
  Sparkles 
} from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar as RechartsRadar, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';

import { CyberOrb } from '@/components/CyberOrb';
import { analyticsService } from '@/services/unified/analytics.service';

const MOCK_AML_RADAR = [
  { subject: 'СТ УКТУ УВАННЯ', A: 120, B: 110 },
  { subject: 'ШАЙ УВАННЯ', A: 98, B: 130 },
  { subject: 'ОФШО ІЗАЦІЯ', A: 86, B: 130 },
  { subject: 'PEP-РИЗИК', A: 140, B: 100 },
  { subject: 'САНКЦІЇ', A: 125, B: 90 },
  { subject: 'ТЕ  ПОТОКИ', A: 65, B: 85 },
];

export const AMLRadarTab: React.FC = () => {
  const [amlRadar, setAmlRadar] = useState(MOCK_AML_RADAR);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsService.getFinancialSigint();
        if (result && result.aml) {
          setAmlRadar(result.aml as any);
        }
      } catch (err) {
        console.warn('Using fallback data for AMLRadarTab');
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-12 gap-8 p-6 h-full overflow-y-auto custom-scrollbar">
      {/* Ліва колонка: Radar Chart */}
      <div className="col-span-12 xl:col-span-6 p-8 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl space-y-8 relative overflow-hidden flex flex-col items-center">
        <h2 className="w-full text-sm font-black text-emerald-500 italic uppercase tracking-[0.4em] border-b border-white/10 pb-6 flex items-center gap-4">
          <ShieldCheck size={20} className="text-emerald-500" /> 
          AML_НЕЙ О_ АДА  // ШІ_СКО ИНГ
        </h2>
        
        <div className="flex-1 w-full flex items-center justify-center min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={amlRadar}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: '900', fontStyle: 'italic' }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
              <RechartsRadar name="ОБ'ЄКТ" dataKey="A" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.4} />
              <RechartsRadar name="НОРМА" dataKey="B" stroke="#064e3b" strokeWidth={1} fill="#064e3b" fillOpacity={0.1} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Права колонка: Вердикт */}
      <div className="col-span-12 xl:col-span-6 p-8 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl space-y-10 relative overflow-hidden flex flex-col">
        <h3 className="text-sm font-black text-emerald-500 italic uppercase tracking-[0.4em] border-b border-white/10 pb-6">
          ВЕ ДИКТ_SOVEREIGN_ORACLE
        </h3>
        
        <div className="flex-1 flex flex-col justify-center space-y-12">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="relative group">
              <CyberOrb size={150} color="#10b981" intensity={0.6} pulse />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Sparkles className="text-white opacity-20 group-hover:opacity-60 transition-opacity" size={32} />
              </div>
            </div>
            
            <div className="space-y-4 text-center lg:text-left">
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 italic">КІНЦЕВИЙ_ВЕ ДИКТ</p>
                <p className="text-4xl font-black italic text-white tracking-tighter leading-none uppercase">ВИСОКА_ЙМОВІ НІСТЬ</p>
              </div>
              <p className="text-7xl font-black italic text-emerald-500 font-mono leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">94.8%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase italic tracking-wide border-l-4 border-emerald-500/20 pl-4 leading-relaxed max-w-sm">
                КрИТИЧНА ЙМОВІ НІСТЬ ПЕ ЕХОВУВАННЯ КБВ ЧЕ ЕЗ СХЕМУ "ЗВО ОТНІХ ПОЗИК" ТА ОФШО НІ ДЕ ИВАТИВИ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: 'ТОПОЛОГІЯ_РИЗИКУ', value: 'КЛАСТЕ _АЛЬФА_IX', icon: Network, color: '#10b981' },
              { label: 'АНАЛІЗ_ДВИГУНА', value: '6.2s // NEURAL_X', icon: Cpu, color: '#059669' }
            ].map((it, i) => (
              <div key={i} className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/[0.05] flex items-center gap-6 hover:border-white/10 transition-all cursor-default">
                <div className="p-4 bg-black border border-white/5 rounded-2xl" style={{ color: it.color }}>
                  <it.icon size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.2em]">{it.label}</p>
                  <p className="text-sm font-black text-white italic tracking-tight">{it.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full py-6 bg-emerald-600 text-slate-950 rounded-[2rem] tracking-[0.6em] text-[12px] font-black uppercase italic hover:bg-emerald-500 shadow-xl transition-all border border-emerald-400/20 active:scale-95">
          ВІДКрИТИ ПОВНУ ЕКСПЕ ТИЗУ
        </button>
      </div>
    </div>
  );
};

export default AMLRadarTab;
