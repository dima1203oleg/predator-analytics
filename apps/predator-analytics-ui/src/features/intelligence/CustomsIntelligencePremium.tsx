/**
 * 💎 CUSTOMS PREMIUM // МИТНИЙ ПРО | v56.2-TITAN
 * PREDATOR Analytics — Commercial Intelligence & Deep Market Analysis
 * 
 * Глибока аналітика для бізнесу: Аналіз конкурентів, ринкові ніші,
 * прогнози цін та ШІ-інсайти.
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
  Layers, Scan, Microscope, Box, Factory, Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient as api } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { ViewHeader } from '@/components/ViewHeader';

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
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<'business' | 'government' | 'premium'>('premium');

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(245, 158, 11, 0.04)" />
        
        <div className="relative z-10 max-w-[1700px] mx-auto p-6 lg:p-12 space-y-12 h-screen flex flex-col">
           
           {/* HEADER HUD */}
           <ViewHeader
             title={
               <div className="flex items-center gap-10">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-amber-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                     <div className="relative p-7 bg-black border border-amber-900/40 rounded-[2.5rem] shadow-2xl">
                        <Crown size={42} className="text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <span className="badge-v2 bg-amber-600/10 border border-amber-600/20 text-amber-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                          PREMIUM_QUOTA // CUSTOMS_PRO_v56.2
                        </span>
                        <div className="h-px w-10 bg-amber-600/20" />
                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">TITAN ACCESS</span>
                     </div>
                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                       МИТНИЙ <span className="text-amber-500 underline decoration-amber-600/20 decoration-8 italic uppercase">PROJECT</span>
                     </h1>
                     <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-80 leading-none">
                        <Zap size={14} className="text-amber-500" /> 
                        <span>РОЗШИРЕНА БІЗНЕС-АНАЛІТИКА ТА ШІ-ГЕНЕРАЦІЯ ИНСАЙТІВ</span>
                     </div>
                  </div>
               </div>
             }
             stats={[
               { label: 'РИНКОВА_ЧАСТКА', value: '42%', icon: <Target size={14} />, color: 'warning' },
               { label: 'ШІ_ПРОГНОЗИ', value: '247', icon: <Sparkles size={14} />, color: 'primary', animate: true },
               { label: 'VIP_STATUS', value: 'ELITE', icon: <Crown size={14} />, color: 'warning' }
             ]}
             actions={
               <div className="flex gap-4">
                  <button className="px-10 py-5 bg-amber-700 text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-amber-600 shadow-2xl transition-all flex items-center gap-4">
                     <Crown size={20} /> ПОВНИЙ_ДОСТУП_ELITE
                  </button>
               </div>
             }
           />

           <div className="grid grid-cols-12 gap-10 flex-1 min-h-0">
              
              {/* LEFT: COMPETITORS & KPI */}
              <section className="col-span-12 xl:col-span-8 space-y-10 overflow-y-auto no-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { l: 'ЗАГАЛЬНИЙ_ІМПОРТ', v: '$847M', c: '+12.4%', i: Package, cl: 'text-amber-500' },
                      { l: 'УНІКАЛЬНИХ_ГРАВЦІВ', v: '12,847', c: '+8.2%', i: Factory, cl: 'text-indigo-500' },
                      { l: 'МИТНІ_ПЛАТЕЖІ', v: '₴2.4B', c: '-3.1%', i: DollarSign, cl: 'text-emerald-500' },
                    ].map((k, i) => (
                      <div key={i} className="p-8 rounded-[2.5rem] bg-black border border-white/[0.04] shadow-3xl hover:border-amber-500/30 transition-all group">
                         <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-4 rounded-xl bg-black border border-white/5", k.cl)}>
                               <k.i size={24} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 italic font-mono">{k.c} ▲</span>
                         </div>
                         <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic mb-1">{k.l}</p>
                         <h3 className="text-4xl font-black text-white italic font-mono tracking-tighter">{k.v}</h3>
                      </div>
                    ))}
                 </div>

                 <div className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-10">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-8">
                       <h3 className="text-[14px] font-black text-white italic uppercase tracking-[0.5em] flex items-center gap-6">
                          <BarChart3 size={24} className="text-amber-500" /> АНАЛІЗ_КОНКУРЕНТНОГО_СЕРЕДОВИЩА
                       </h3>
                       <button className="text-[10px] font-black text-amber-500 uppercase italic tracking-widest hover:underline">ВСІ_КОМПАНІЇ_v56</button>
                    </div>
                    <div className="space-y-6">
                       {TOP_IMPORTERS.map((data, i) => (
                         <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.04] hover:bg-amber-600/[0.03] hover:border-amber-600/30 transition-all group relative overflow-hidden">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-8">
                                  <div className="text-4xl font-black italic text-slate-800 font-mono">0{i+1}</div>
                                  <div className="space-y-1">
                                     <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-amber-400 transition-colors leading-none">{data.name}</h4>
                                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">{data.topProducts.join(' • ')}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-3xl font-black text-white italic font-mono tracking-tighter leading-none mb-1">${(data.imports / 1000000).toFixed(1)}M</p>
                                  <div className="flex items-center justify-end gap-2 text-[9px] font-black text-emerald-500 uppercase italic">
                                     <TrendingUp size={12} /> {data.marketShare}% РИНКУ
                                  </div>
                               </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/[0.02] flex gap-10 opacity-0 group-hover:opacity-100 transition-all">
                               <div className="space-y-1">
                                  <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">ОСНОВНІ_КРАЇНИ</p>
                                  <p className="text-[10px] font-black text-slate-400 italic">{data.countries.join(', ')}</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">ОБСЯГ_ЕКСПОРТУ</p>
                                  <p className="text-[10px] font-black text-emerald-400 italic">${(data.exports / 1000000).toFixed(1)}M</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </section>

              {/* RIGHT: AI INSIGHTS & QUICK ACTIONS */}
              <section className="col-span-12 xl:col-span-4 space-y-10 overflow-y-auto no-scrollbar">
                 <div className="p-10 rounded-[3.5rem] bg-gradient-to-br from-amber-600/10 to-orange-600/10 border-2 border-amber-600/20 shadow-3xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <Sparkles size={120} className="text-amber-500 animate-pulse" />
                    </div>
                    <h3 className="text-[14px] font-black text-white italic uppercase tracking-[0.5em] flex items-center gap-6">
                       <Cpu size={24} className="text-amber-500" /> AI_INSIGHTS_ENGINE
                    </h3>
                    <div className="space-y-6">
                       {[
                         { t: 'ХАБ_ДЕТЕКЦІЯ', v: 'Імпорт електроніки з Китаю зріс на 34% за останній тиждень.', cl: 'text-amber-400' },
                         { t: 'УВАГА_РИЗИК', v: '15 компаній змінили код УКТЗЕД на товари з меншим митом.', cl: 'text-rose-500' },
                         { t: 'ОПТИМІЗАЦІЯ', v: 'Нові постачальники добрив з Польщі пропонують ціни на 12% нижче.', cl: 'text-emerald-500' },
                       ].map((ins, i) => (
                         <div key={i} className="p-6 rounded-3xl bg-black/40 border border-white/5 space-y-2 group hover:bg-black transition-all">
                            <p className={cn("text-[9px] font-black uppercase tracking-widest", ins.cl)}>{ins.t}</p>
                            <p className="text-sm font-black text-slate-300 italic leading-snug">"{ins.v}"</p>
                         </div>
                       ))}
                    </div>
                    <button className="w-full py-5 bg-white text-black rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.4em] italic shadow-2xl hover:bg-slate-200 transition-all">АКТИВУВАТИ_НЕЙРО-ПРОГНОЗ</button>
                 </div>

                 <div className="p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-8">
                    <h3 className="text-[12px] font-black text-slate-500 italic uppercase tracking-[0.4em] mb-4">ШВИДКІ_ДІЇ_ELITE</h3>
                    <div className="space-y-4">
                       {[
                         { i: Search, l: 'ЗНАЙТИ_КОНКУРЕНТІВ', c: 'text-amber-500' },
                         { i: Target, l: 'АНАЛІЗ_ПОСТАЧАЛЬНИКА', c: 'text-indigo-500' },
                         { i: BarChart3, l: 'ПОБУДУВАТИ_VIP_ЗВІТ', c: 'text-emerald-500' },
                         { i: Bell, l: 'НАЛАШТУВАТИ_SMART_ALERT', c: 'text-orange-500' },
                       ].map((a, i) => (
                         <button key={i} className="w-full flex items-center justify-between p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-6">
                               <a.i size={20} className={a.c} />
                               <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-widest group-hover:text-white transition-colors">{a.l}</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-800" />
                         </button>
                       ))}
                    </div>
                 </div>
              </section>

           </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
      </div>
    </PageTransition>
  );
}
