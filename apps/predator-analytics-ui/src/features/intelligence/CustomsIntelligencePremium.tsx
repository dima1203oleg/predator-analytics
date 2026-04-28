/**
 * 💎 CUSTOMS PREMIUM // МИТНИЙПРО | v61.0-ELITE
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
  Orbit, Fingerprint, Activity, Siren
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { ViewHeader } from '@/components/ViewHeader';
import { useBackendStatus } from '@/hooks/useBackendStatus';

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
  { name: 'ТОВ "МЕТАЛ-Т ЕЙД ОПТ"', imports: 14200000, exports: 2100000, topProducts: ['Сталь h10', 'Арматура'], countries: ['Китай', 'Туреччина'], trend: 'up', marketShare: 12 },
  { name: 'П АТ "ЕНЕ ГО-СИСТЕМИ"', imports: 9800000, exports: 500000, topProducts: ['Трансформатори'], countries: ['Німеччина', 'Польща'], trend: 'up', marketShare: 8 },
  { name: 'ТОВ "АГ О-ІМПОРТ ПЛЮС"', imports: 7400000, exports: 12000000, topProducts: ['Добрива'], countries: ['Нідерланди'], trend: 'down', marketShare: 6 },
];

export default function CustomsIntelligencePremium() {
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline, activeFailover } = useBackendStatus();

  useEffect(() => {
    if (isOffline) {
        window.dispatchEvent(new CustomEvent('predator-error', {
            detail: {
                service: 'CustomsPremium',
                message: `МИТНИЙПРО: Вузол NVIDIA недоступний. Працюємо через автономне дзеркало (COMMERCIAL_NODES).`,
                severity: 'warning',
                timestamp: new Date().toISOString(),
                code: 'COMMERCIAL_NODES'
            }
        }));
    }
  }, [isOffline]);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'CustomsPremium',
          message: 'Примусове оновлення преміум-даних через MIRROR_CHANNEL завершено (COMMERCIAL_NODES).',
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'COMMERCIAL_NODES'
        }
      }));
    }

    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 px-4 xl:px-12">
        <AdvancedBackground />
        <CyberGrid color="rgba(225, 29, 72, 0.04)" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.03),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto space-y-16 flex flex-col items-stretch pt-12">
          
          {/* HEADER ELITE HUD */}
          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-rose-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-8 bg-black border-2 border-rose-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all duration-700">
                    <Crown size={48} className="text-rose-500 shadow-[0_0_30px_#e11d48]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className={cn(
                      "px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl border",
                      isOffline ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-rose-600/10 border-rose-600/20 text-rose-500"
                    )}>
                      {isOffline ? 'SOVEREIGN_EMERGENCY' : 'PREMIUM_MARKET_INTEL'} // SOVEREIGN_QUOTA
                    </span>
                    <div className="h-px w-16 bg-rose-500/20" />
                    <span className="text-[10px] font-black text-rose-800 font-mono tracking-widest uppercase italic shadow-sm">v61.0-ELITE</span>
                  </div>
                  <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none">
                    МИТНИЙ <span className={cn("underline decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter", isOffline ? "text-rose-500 decoration-rose-500/20" : "text-rose-600 decoration-rose-600/30")}>PROJECT</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['INTEL', 'COMMERCIAL', 'PROJECT_ELITE']}
            badges={[
              { label: 'SOVEREIGN_ACCESS', color: 'gold', icon: <Crown size={10} /> },
              { label: 'CLASSIFIED_T1', color: 'primary', icon: <Fingerprint size={10} /> },
            ]}
            stats={[
              { label: 'NODE_SOURCE', value: isOffline ? 'SOVEREIGN_MIRROR' : 'NVIDIA_PROD', icon: <Cpu />, color: isOffline ? 'warning' : 'gold' },
              { label: 'FAILOVER', value: activeFailover ? 'COLAB_SHARED' : isOffline ? 'PROXIFIED' : 'STANDBY', icon: <Orbit />, color: isOffline ? 'warning' : 'primary' },
              { label: 'ALPHA_TRUST', value: 'MAX', icon: <ShieldCheck />, color: 'success' },
              { label: 'CORE_STATUS', value: isOffline ? 'EMERGENCY' : 'NOMINAL', icon: <Activity />, color: isOffline ? 'warning' : 'primary' },
            ]}
            actions={
              <div className="flex gap-6">
                 <button 
                  onClick={handleRefresh} 
                  className={cn(
                    "p-7 bg-black border-2 border-white/[0.04] rounded-[2rem] text-slate-500 hover:text-rose-500 transition-all shadow-4xl group/btn",
                    refreshing && "animate-spin cursor-not-allowed opacity-50"
                  )}
                >
                  <RefreshCw size={32} className={cn("transition-transform duration-700", refreshing ? "" : "group-hover/btn:rotate-180")} />
                </button>
                <button className="relative px-12 py-7 h-fit group/main overflow-hidden rounded-[2.2rem]">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-500 transition-transform duration-500 group-hover/main:scale-105" />
                  <div className="relative flex items-center gap-6 text-black font-black uppercase italic tracking-[0.3em] text-[12px]">
                    <Crown size={24} /> АКТИВУВАТИ_VIP_АНАЛІЗ
                  </div>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/main:translate-x-[100%] transition-transform duration-1000" />
                </button>
              </div>
            }
          />

          {/* KPI GRID SOVEREIGN */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { label: 'РИНКОВА_ЧАСТКА_СУБ'ЄКТА', value: '42.8%', icon: Target, color: '#e11d48', sub: 'За охопленим сегментом' },
                { label: 'ШІ_ПРЕДИКЦІЙНІ_ТОЧКИ', value: '2,841', icon: Sparkles, color: '#e11d48', sub: 'Активні вузли аналізу' },
                { label: 'РІВЕНЬ_КОНФІДЕНЦІЙНОСТІ', value: 'MAX', icon: ShieldCheck, color: '#e11d48', sub: 'Квантове шифрування GDS' },
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
                    { l: 'ЗАГАЛЬНИЙ_ІМПОРТ', v: '$1.42B', c: '+12.4%', i: Package, cl: 'text-rose-500' },
                    { l: 'УНІКАЛЬНИХ_Г АВЦІВ', v: '14,842', c: '+8.2%', i: Factory, cl: 'text-slate-400' },
                    { l: 'МИТНІ_ПЛАТЕЖІ', v: '₴2.8B', c: '-3.1%', i: DollarSign, cl: 'text-emerald-500' },
                  ].map((k, i) => (
                    <div key={i} className="p-10 rounded-[3.5rem] bg-black border-2 border-white/[0.03] shadow-4xl group relative overflow-hidden transition-all hover:border-white/10">
                       <div className="flex items-center justify-between mb-8">
                          <div className={cn("p-5 rounded-2xl bg-black border-2 border-white/5", k.cl)}>
                             <k.i size={24} />
                          </div>
                          <span className={cn("text-[10px] font-black italic", k.c.startsWith('+') ? 'text-emerald-500' : 'text-amber-500')}>{k.c}</span>
                       </div>
                       <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic mb-2">{k.l}</p>
                       <h4 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none font-mono">{k.v}</h4>
                    </div>
                  ))}
               </div>

               <div className="p-12 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-10">
                  <div className="flex items-center justify-between pb-8 border-b border-white/[0.04]">
                     <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-6">
                        <Users className="text-rose-500" size={32} /> ТОП ІМПОРТЕ ІВ СЕГМЕНТУ
                     </h3>
                     <button className="text-rose-500 text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 hover:gap-5 transition-all">
                        ПОВНИЙ СПИСОК <ChevronRight size={16} />
                     </button>
                  </div>
                  <div className="space-y-6">
                     {TOP_IMPORTERS.map((comp, i) => (
                       <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.01] border-2 border-white/[0.04] hover:border-rose-500/20 transition-all group flex items-center justify-between">
                          <div className="flex items-center gap-8">
                             <div className="w-16 h-16 rounded-3xl bg-black border border-white/10 flex items-center justify-center text-slate-600 group-hover:text-rose-500 transition-colors">
                                <Building2 size={24} />
                             </div>
                             <div className="space-y-1">
                                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase group-hover:text-rose-500 transition-colors leading-none">{comp.name}</h4>
                                <div className="flex items-center gap-3 text-[9px] font-black text-slate-700 uppercase italic tracking-[0.2em]">
                                   <span>{comp.countries.join(', ')}</span>
                                   <span>|</span>
                                   <span>ЧАСТКА: {comp.marketShare}%</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-12">
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic leading-none mb-1">ОБСЯГ_ІМПОРТУ</p>
                                <p className="text-2xl font-black text-white italic font-mono tracking-tighter leading-none">${(comp.imports / 1000000).toFixed(1)}M</p>
                             </div>
                             <div className={cn("p-4 rounded-xl border-2 italic", comp.trend === 'up' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/20 text-amber-500 bg-amber-500/5')}>
                                {comp.trend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* SIDE RECON BAR */}
            <div className="col-span-12 xl:col-span-4 space-y-10">
               <div className="p-10 rounded-[4rem] bg-black border-2 border-rose-500/10 shadow-3xl flex flex-col gap-10">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-6">
                     <Sparkles className="text-rose-500" size={32} /> ШІ-АНАЛІЗ  ИНКУ
                  </h3>
                  <div className="space-y-6">
                     {[
                       { t: 'ВИЯВЛЕНО_НІШУ', d: 'Сегмент запасних частин для агротехніки демонструє дефіцит пропозиції при високому попиті.', r: 'high' },
                       { t: 'П ЕДИКЦІЯ_ЦІНИ', d: 'Очікується стабілізація цін на сталь h10 протягом наступних 14 днів.', r: 'medium' },
                       { t: 'РИЗИК_ЛОГІСТИКИ', d: 'Зміна маршрутів у Чорному морі може вплинути на терміни доставки з Туреччини.', r: 'low' },
                     ].map((insight, i) => (
                       <div key={i} className="p-6 rounded-3xl bg-white/[0.01] border-2 border-white/[0.04] space-y-3">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">{insight.t}</span>
                             <span className={cn("w-2 h-2 rounded-full", insight.r === 'high' ? 'bg-rose-500 shadow-[0_0_8px_#e11d48]' : insight.r === 'medium' ? 'bg-rose-600' : 'bg-emerald-500')} />
                          </div>
                          <p className="text-[11px] text-slate-400 italic font-medium leading-relaxed uppercase">{insight.d}</p>
                       </div>
                     ))}
                  </div>
                  <button className="w-full py-6 bg-rose-600 hover:bg-rose-500 text-black rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] font-serif italic shadow-4xl transition-all">
                     ЗГЕНЕ УВАТИ_ПОВНИЙ_ЗВІТ_PDF
                  </button>
               </div>

               <div className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl text-center space-y-6">
                  <div className="mx-auto w-24 h-24 bg-rose-500/5 border border-rose-500/30 rounded-full flex items-center justify-center mb-4">
                     <Lock className="text-rose-500 animate-pulse" size={40} />
                  </div>
                  <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">БЕЗПЕКА_ДАННИХ_S1</h4>
                  <p className="text-[10px] text-slate-700 uppercase tracking-widest leading-relaxed">ВЕСЬ АНАЛІЗПРОВОДИТЬСЯ В ІЗОЛЬОВАНОМУ КВАНТОВОМУ СЕ ЕДОВИЩІ PREDATOR QUANTUM</p>
               </div>
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .shadow-4xl { box-shadow: 0 40px 80px -20px rgba(225,29,72,0.3); }
        `}} />
      </div>
    </PageTransition>
  );
}
