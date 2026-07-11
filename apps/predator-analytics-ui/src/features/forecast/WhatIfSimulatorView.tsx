import { Button } from '@/components/ui/button';
import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Activity, Play, RotateCcw, AlertTriangle, Crosshair, 
  Settings2, Zap, Save, ChevronRight, BarChart3, Database
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloCard } from '@/components/ui/HoloCard';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { useUISound, UISoundType } from '@/hooks/useUISound';
import { SlideToExecute } from '@/components/ui/SlideToExecute';

export default function WhatIfSimulatorView() {
  const { play } = useUISound();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        
        <div className="relative z-10 max-w-[1750px] mx-auto p-4 sm:p-12 space-y-8">
           <ViewHeader
             title={
               <div className="flex items-center gap-8">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 " />
                     <div className="relative p-6 bg-black border-2 border-emerald-500/40 rounded-[2rem] shadow-4xl transform -rotate-3 transition-all">
                        <TrendingUp size={36} className="text-emerald-500 shadow-[0_0_20px_#10b981]" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center gap-3">
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-0.5 text-[10px] font-black tracking-widest uppercase italic rounded-md">
                          МОДЕЛЮВАННЯ_СЦЕНАРІЇВ // WHAT_IF
                        </span>
                        <span className="text-[9px] font-black text-slate-600 font-mono tracking-widest uppercase italic">v61.0-ELITE</span>
                     </div>
                     <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                       СИМУЛЯТОР <span className="text-emerald-500">WHAT-IF</span>
                     </h1>
                  </div>
               </div>
             }
             breadcrumbs={['ПРОГНОЗУВАННЯ', 'MONTE CARLO', 'WHAT-IF СИМУЛЯТОР']}
             badges={[
               { label: 'MONTE_CARLO', color: 'success', icon: <Database size={10} /> },
               { label: '10K_ІТЕРАЦІЙ', color: 'primary', icon: <Activity size={10} /> },
             ]}
             stats={[
               { label: 'АКТИВНІ_МОДЕЛІ', value: '4', icon: <Zap size={14} />, color: 'primary' },
               { label: 'ТОЧНІСТЬ_ПРОГНОЗУ', value: '92.4%', icon: <Crosshair size={14} />, color: 'success', animate: true },
             ]}
             actions={
               <Button variant="cyber" onClick={() => play(UISoundType.CLICK)} className="px-6 py-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-emerald-600 hover:text-white transition-all shadow-xl">
                 <Save size={16} className="inline mr-2" /> ЗБЕРЕГТИ_СЦЕНАРІЙ
               </Button>
             }
           />

           <div className="grid grid-cols-12 gap-8">
             
             {/* LEFT: DRAG & DROP BUILDER */}
             <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                <div className="p-8 bg-black border border-white/5 rounded-[2.5rem] shadow-2xl space-y-8 h-full">
                   <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                      <Settings2 size={24} className="text-slate-500" />
                      <h3 className="text-xl font-black text-white italic uppercase tracking-widest">ПАРАМЕТРИ СИМУЛЯЦІЇ</h3>
                   </div>
                   
                   <div className="space-y-6">
                      {/* Factor 1 */}
                      <div className="space-y-3 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">КУРС_ВАЛЮТ (USD/UAH)</span>
                            <span className="text-sm font-black text-white">41.50</span>
                         </div>
                         <input type="range" className="w-full accent-emerald-500" />
                      </div>

                      {/* Factor 2 */}
                      <div className="space-y-3 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">ІНФЛЯЦІЙНИЙ_ТИСК (%)</span>
                            <span className="text-sm font-black text-white">8.5%</span>
                         </div>
                         <input type="range" className="w-full accent-rose-500" />
                      </div>

                      {/* Factor 3 */}
                      <div className="space-y-3 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">ЛОГІСТИЧНІ_ВИТРАТИ (INDEX)</span>
                            <span className="text-sm font-black text-white">124.0</span>
                         </div>
                         <input type="range" className="w-full accent-sky-500" />
                      </div>
                   </div>

                   <div className="pt-8">
                     <SlideToExecute 
                        onConfirm={() => play(UISoundType.SUCCESS)}
                        label="ЗАПУСТИТИ MONTE CARLO"
                        confirmLabel="СИМУЛЯЦІЯ..."
                        variant="default"
                     />
                   </div>
                </div>
             </div>

             {/* RIGHT: RESULTS DASHBOARD */}
             <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
                <HoloCard variant="cyber" className="p-10 rounded-[3rem] h-[500px] flex flex-col relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                     <BarChart3 size={200} className="text-emerald-500" />
                   </div>
                   <div className="flex items-center gap-4 mb-8">
                      <Activity size={24} className="text-emerald-500 animate-pulse" />
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-widest">ГЛОБАЛЬНИЙ АНАЛІЗ ЧУТЛИВОСТІ (SOBOL)</h3>
                   </div>
                   
                   <div className="flex-1 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center bg-black/50">
                      <p className="text-sm font-black text-slate-500 tracking-widest uppercase">ГРАФІК_РОЗПОДІЛУ_ЙМОВІРНОСТЕЙ (РЕЗЕРВ СИСТЕМИ)</p>
                   </div>
                </HoloCard>

                <div className="grid grid-cols-3 gap-6">
                   <div className="p-6 bg-black border border-white/5 rounded-3xl flex flex-col gap-2 shadow-xl">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ПЕСИМІСТИЧНИЙ_СЦЕНАРІЙ (P5)</span>
                      <span className="text-2xl font-black text-cyan-500">-12.4%</span>
                   </div>
                   <div className="p-6 bg-black border border-emerald-500/20 rounded-3xl flex flex-col gap-2 shadow-xl bg-emerald-500/5">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">БАЗОВИЙ_СЦЕНАРІЙ (P50)</span>
                      <span className="text-2xl font-black text-white">+4.2%</span>
                   </div>
                   <div className="p-6 bg-black border border-white/5 rounded-3xl flex flex-col gap-2 shadow-xl">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ОПТИМІСТИЧНИЙ_СЦЕНАРІЙ (P95)</span>
                      <span className="text-2xl font-black text-sky-500">+18.8%</span>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </PageTransition>
  );
}
