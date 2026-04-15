/**
 * 💎 CUSTOMS PREMIUM // МИТНИЙ ПРО | v56.5-ELITE
 * PREDATOR Analytics — Commercial Intelligence & Deep Market Analysis
 * 
 * Глибока аналітика для бізнесу: Аналіз конкурентів, ринкові ніші,
 * прогнози цін та ШІ-інсайти.
 * 
 * Sovereign Power Design · Tactical · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Package, DollarSign, Globe,
  Building2, Users, ShieldAlert, Eye, Search, Filter,
  Download, Crown, Zap, Target, AlertTriangle, ArrowUpRight,
  ArrowDownRight, BarChart3, PieChart, Map, FileText, Bell,
  Sparkles, ChevronRight, Lock, ShieldCheck, Cpu, Database,
  Layers, Scan, Microscope, Box, Factory, Truck, RefreshCw,
  Orbit, Fingerprint, Activity
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { AdvancedBackground } from '@/components/AdvancedBackground';

interface CompetitorData {
  name: string;
  imports: number;
  exports: number;
  topProducts: string[];
  countries: string[];
  trend: 'up' | 'down' | 'stable';
  marketShare: number;
}

const TOP_IMPORTERS: CompetitorData[] = [
  { name: 'ТОВ "МЕТАЛ-ТРЕЙД ОПТ"', imports: 14200000, exports: 2100000, topProducts: ['Сталь h10', 'Арматура'], countries: ['Китай', 'Туреччина'], trend: 'up', marketShare: 12 },
  { name: 'ПРАТ "ЕНЕРГО-СИСТЕМИ"', imports: 9800000, exports: 500000, topProducts: ['Трансформатори'], countries: ['Німеччина', 'Польща'], trend: 'up', marketShare: 8 },
  { name: 'ТОВ "АГРО-ІМПОРТ ПЛЮС"', imports: 7400000, exports: 12000000, topProducts: ['Добрива'], countries: ['Нідерланди'], trend: 'down', marketShare: 6 },
];

export default function CustomsIntelligencePremium() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 px-4 xl:px-12">
        <AdvancedBackground />
        <CyberGrid color="rgba(212, 175, 55, 0.04)" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.03),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto space-y-16 flex flex-col items-stretch pt-12">
          
          {/* HEADER ELITE HUD */}
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 py-10 border-b border-white/[0.04]">
            <div className="flex items-center gap-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-yellow-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                <div className="relative p-8 bg-black border-2 border-yellow-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all duration-700">
                  <Crown size={48} className="text-yellow-500 shadow-[0_0_30px_#d4af37]" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                    PREMIUM_MARKET_INTEL // SOVEREIGN_QUOTA
                  </span>
                  <div className="h-px w-16 bg-yellow-500/20" />
                  <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v56.5-ELITE</span>
                </div>
                <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none">
                  МИТНИЙ <span className="text-yellow-500 underline decoration-yellow-600/30 decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter">PROJECT</span>
                </h1>
                <div className="flex items-center gap-6 text-[12px] text-slate-600 font-black uppercase tracking-[0.5em] mt-8 italic border-l-4 border-yellow-500/30 pl-10 opacity-95">
                  <Scan size={16} className="text-yellow-500 font-black" /> 
                  <span>РОЗШИРЕНА БІЗНЕС-АНАЛІТИКА ТА ШІ-ГЕНЕРАЦІЯ ІНСАЙТІВ</span>
                  <span className="text-slate-900 mx-2">|</span>
                  <span className="text-emerald-500 animate-pulse flex items-center gap-3 bg-emerald-500/5 px-4 py-2 rounded-2xl border border-emerald-500/20">
                    <Activity size={16} /> СТАТУС: ELITE_ACCESS_GRANTED
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
               <button 
                onClick={handleRefresh} 
                className={cn(
                  "p-7 bg-black border-2 border-white/[0.04] rounded-[2rem] text-slate-500 hover:text-yellow-500 transition-all shadow-4xl group/btn",
                  refreshing && "animate-spin cursor-not-allowed opacity-50"
                )}
              >
                <RefreshCw size={32} className={cn("transition-transform duration-700", refreshing ? "" : "group-hover/btn:rotate-180")} />
              </button>
              <button className="relative px-12 py-7 h-fit group/main overflow-hidden rounded-[2.2rem]">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-500 transition-transform duration-500 group-hover/main:scale-105" />
                <div className="relative flex items-center gap-6 text-black font-black uppercase italic tracking-[0.3em] text-[12px]">
                  <Crown size={24} /> АКТИВУВАТИ_VIP_АНАЛІЗ
                </div>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/main:translate-x-[100%] transition-transform duration-1000" />
              </button>
            </div>
          </header>

          {/* KPI GRID SOVEREIGN */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { label: 'РИНКОВА_ЧАСТКА_СУБ\'ЄКТА', value: '42.8%', icon: Target, color: '#D4AF37', sub: 'За охопленим сегментом' },
                { label: 'ШІ_ПРЕДИКЦІЙНІ_ТОЧКИ', value: '2,841', icon: Sparkles, color: '#D4AF37', sub: 'Активні вузли аналізу' },
                { label: 'РІВЕНЬ_КОНФІДЕНЦІЙНОСТІ', value: 'MAX', icon: ShieldCheck, color: '#D4AF37', sub: 'Квантове шифрування GDS' },
              ].map((m, i) => (
                <div key={i} className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.03] shadow-4xl group relative overflow-hidden transition-all hover:border-white/10">
                  <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700 rotate-12 group-hover:rotate-0">
                    <m.icon size={160} style={{ color: m.color }} />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                     <div className="space-y-4">
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.4em] italic leading-none">{m.label}</p>
                        <h3 className="text-6xl font-black text-white italic font-mono tracking-tighter leading-none">{m.value}</h3>
                        <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-[0.3em]">{m.sub}</p>
                     </div>
                     <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl group-hover:scale-110 transition-transform duration-700" style={{ color: m.color }}>
                        <m.icon size={32} />
                     </div>
                  </div>
                </div>
              ))}
          </section>

          <div className="grid grid-cols-12 gap-12">
            
            {/* COMPETITION CORE */}
            <div className="col-span-12 xl:col-span-8 space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { l: 'ЗАГАЛЬНИЙ_ІМПОРТ', v: '$1.42B', c: '+12.4%', i: Package, cl: 'text-yellow-500' },
                    { l: 'УНІКАЛЬНИХ_ГРАВЦІВ', v: '14,842', c: '+8.2%', i: Factory, cl: 'text-slate-400' },
                    { l: 'МИТНІ_ПЛАТЕЖІ', v: '₴2.8B', c: '-3.1%', i: DollarSign, cl: 'text-emerald-500' },
                  ].map((k, i) => (
                    <div key={i} className="p-10 rounded-[3.5rem] bg-black border-2 border-white/[0.03] shadow-4xl group relative overflow-hidden transition-all hover:border-white/10">
                       <div className="flex items-center justify-between mb-8">
                          <div className={cn("p-5 rounded-2xl bg-black border-2 border-white/5", k.cl)}>
                             <k.i size={24} />
                          </div>
                          <span className="text-[11px] font-black text-emerald-500 italic font-mono bg-emerald-500/5 px-4 py-1.5 rounded-xl border border-emerald-500/20">{k.c} ▲</span>
                       </div>
                       <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest italic mb-2 leading-none">{k.l}</p>
                       <h3 className="text-4xl font-black text-white italic font-mono tracking-tighter leading-none">{k.v}</h3>
                    </div>
                  ))}
               </div>

               <div className="p-16 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-16 opacity-[0.02]">
                     <Orbit size={320} className="text-yellow-500 animate-spin-slow" />
                  </div>
                  <div className="flex items-center justify-between border-b-2 border-white/[0.04] pb-10 relative z-10">
                     <h3 className="text-2xl font-black text-white italic uppercase tracking-[0.5em] flex items-center gap-6">
                        <BarChart3 size={32} className="text-yellow-500" /> АНАЛІЗ_КОНКУРЕНТНОГО_СЕРЕДОВИЩА
                     </h3>
                     <button className="text-[11px] font-black text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 px-8 py-3 rounded-2xl uppercase italic tracking-widest hover:bg-yellow-500 hover:text-black transition-all duration-500">
                       ВСІ_СУБ'ЄКТИ_ELITE
                     </button>
                  </div>
                  <div className="space-y-8 relative z-10">
                     {TOP_IMPORTERS.map((data, i) => (
                       <div key={i} className="p-10 rounded-[4rem] bg-white/[0.01] border-2 border-white/[0.03] hover:bg-yellow-500/[0.02] hover:border-yellow-500/30 transition-all duration-700 group relative overflow-hidden shadow-inset">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-10">
                                <div className="text-6xl font-black italic text-slate-900 font-mono leading-none group-hover:text-yellow-500/20 transition-colors duration-1000">0{i+1}</div>
                                <div className="space-y-3">
                                   <div className="flex items-center gap-4">
                                      <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter group-hover:text-yellow-500 transition-colors duration-700 leading-none">{data.name}</h4>
                                      <div className="p-2 border border-white/5 bg-black/40 rounded-lg"><Building2 size={16} className="text-slate-800" /></div>
                                   </div>
                                   <div className="flex gap-4">
                                      {data.topProducts.map(p => (
                                         <span key={p} className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic bg-black/40 px-4 py-1.5 rounded-xl border border-white/5">{p}</span>
                                      ))}
                                   </div>
                                </div>
                             </div>
                             <div className="text-right space-y-2">
                                <p className="text-5xl font-black text-white italic font-mono tracking-tighter leading-none mb-1 group-hover:scale-105 transition-transform duration-700 shadow-sm">${(data.imports / 1000000).toFixed(1)}M</p>
                                <div className="flex items-center justify-end gap-3 text-[11px] font-black text-emerald-500 uppercase italic bg-emerald-500/5 px-4 py-1.5 rounded-xl border border-emerald-500/20">
                                   <TrendingUp size={14} /> {data.marketShare}% РИНКУ_UA
                                </div>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* AI HUB & ACTIONS */}
            <div className="col-span-12 xl:col-span-4 space-y-12">
               <div className="p-12 rounded-[5rem] bg-gradient-to-br from-yellow-600/10 to-rose-600/10 border-4 border-yellow-500/20 shadow-4xl space-y-10 relative overflow-hidden group/ai">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover/ai:opacity-[0.1] transition-opacity duration-1000">
                     <Sparkles size={180} className="text-yellow-500 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-6 border-b-2 border-white/[0.05] pb-8 relative z-10">
                    <div className="p-5 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-[2rem] text-yellow-500">
                       <Cpu size={32} />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-xl font-black text-white italic uppercase tracking-[0.5em]">AI_INSIGHT_HUB</h3>
                       <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.3em] font-mono italic">REALTIME_ANALYSIS_STREAM</p>
                    </div>
                  </div>
                  <div className="space-y-8 relative z-10 pt-4">
                     {[
                       { t: 'МАРКЕТ_ТРЕНД', v: 'Імпорт металопрокату зріс на 42% за 7 днів // ЛОГІСТИЧНЕ_ВІКНО_ВІДКРИТО', cl: 'text-yellow-500', i: TrendingUp },
                       { t: 'РИЗИК_СУБ\'ЄКТА', v: '7 конкурентів ініціювали зміну основних кодів УКТЗЕД з КНР // МОЖЛИВА_СХЕМА', cl: 'text-rose-600', i: ShieldAlert },
                       { t: 'БІЗНЕС_ОПТИМІЗАЦІЯ', v: 'Новий ланцюг поставок добрив через Варшаву на 18% дешевше // РЕКОМЕНДОВАНО', cl: 'text-emerald-500', i: Zap },
                     ].map((ins, i) => (
                       <div key={i} className="p-8 rounded-[2.5rem] bg-black/60 border-2 border-white/[0.03] space-y-4 group/item hover:border-yellow-500/30 transition-all duration-500 shadow-inner italic">
                          <div className="flex items-center gap-4">
                             <ins.i size={16} className={ins.cl} />
                             <p className={cn("text-[11px] font-black uppercase tracking-[0.3em]", ins.cl)}>{ins.t}</p>
                          </div>
                          <p className="text-lg font-black text-slate-300 italic leading-snug tracking-tight">"{ins.v}"</p>
                       </div>
                     ))}
                  </div>
                  <button className="w-full py-8 bg-yellow-500 text-black rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] italic shadow-4xl hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 transition-all duration-500 relative z-10">
                     ЗАПУСТИТИ_НЕЙРОФОРКАСТ_2026
                  </button>
               </div>

               <div className="p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden group/actions">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(212,175,55,0.03),transparent_70%)] pointer-events-none" />
                  <h3 className="text-[14px] font-black text-slate-700 italic uppercase tracking-[0.6em] border-b border-white/[0.03] pb-8 relative z-10 flex items-center justify-between">
                     ТАКТИЧНІ_ДІЇ_ELITE <Layers size={18} />
                  </h3>
                  <div className="space-y-6 relative z-10 pt-4 font-black">
                     {[
                       { i: Search, l: 'ЗНАЙТИ_КОНКУРЕНТІВ', c: 'text-yellow-500', sub: 'ГЕО-ПОШУК_UA' },
                       { i: Target, l: 'АНАЛІЗ_ПОСТАЧАЛЬНИКА', c: 'text-rose-600', sub: 'PRO-ВЕРІФІКАЦІЯ' },
                       { i: BarChart3, l: 'ГЕНЕРУВАТИ_VIP_ЗВІТ', c: 'text-emerald-500', sub: 'PDF_MANIFEST_EXPORT' },
                       { i: Bell, l: 'SMART_ALERT_МОНІТОР', c: 'text-yellow-500', sub: 'МИТНИЙ_TRIGGER' },
                     ].map((a, i) => (
                       <button key={i} className="w-full flex items-center justify-between p-8 rounded-[2.5rem] bg-white/[0.01] border-2 border-white/[0.03] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 group/act shadow-xl italic">
                          <div className="flex items-center gap-8">
                             <div className="p-4 rounded-2xl bg-black border-2 border-white/[0.03] group-hover/act:border-white/10 transition-all">
                                <a.i size={24} className={a.c} />
                             </div>
                             <div className="text-left">
                                <span className="text-[13px] font-black text-slate-400 uppercase italic tracking-[0.2em] group-hover:text-white transition-colors leading-none">{a.l}</span>
                                <p className="text-[9px] text-slate-800 uppercase tracking-widest mt-1">{a.sub}</p>
                             </div>
                          </div>
                          <ChevronRight size={20} className="text-slate-900 group-hover/act:text-yellow-500 transition-all group-hover/act:translate-x-2" />
                       </button>
                     ))}
                  </div>
               </div>
            </div>

          </div>
        </div>

        {/* CUSTOM ELITE STYLES */}
        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 80px 150px -40px rgba(0,0,0,0.95), 0 0 100px rgba(212,175,55,0.02); }
            .shadow-inset { box-shadow: inset 0 2px 20px rgba(0,0,0,0.8); }
            .animate-spin-slow { animation: spin 20s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .perspective-1000 { perspective: 1000px; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.1); border-radius: 20px; border: 3px solid black; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.2); }
            .backdrop-blur-4xl { backdrop-filter: blur(120px) saturate(180%); }
        `}} />
      </div>
    </PageTransition>
  );
}
