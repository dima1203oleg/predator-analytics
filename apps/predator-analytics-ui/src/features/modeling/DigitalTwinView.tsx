import React from 'react';
import { motion } from 'framer-motion';
import { 
  Box, Cpu, Activity, ShieldCheck, Target, Layers, 
  RotateCcw, Zap, Globe, Share2, Hexagon, AlertTriangle
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloCard } from '@/components/ui/HoloCard';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { useUISound, UISoundType } from '@/hooks/useUISound';

export default function DigitalTwinView() {
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
                     <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full scale-150 " />
                     <div className="relative p-6 bg-black border-2 border-sky-500/40 rounded-[2rem] shadow-4xl transform -rotate-3 transition-all">
                        <Hexagon size={36} className="text-sky-500 shadow-[0_0_20px_#0ea5e9]" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center gap-3">
                        <span className="bg-sky-500/10 border border-sky-500/20 text-sky-500 px-3 py-0.5 text-[10px] font-black tracking-widest uppercase italic rounded-md">
                          БІЗНЕС_СИМУЛЯЦІЯ // DIGITAL_TWIN
                        </span>
                        <span className="text-[9px] font-black text-slate-600 font-mono tracking-widest uppercase italic">v61.0-ELITE</span>
                     </div>
                     <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                       ЦИФРОВИЙ <span className="text-sky-500">ДВІЙНИК</span>
                     </h1>
                  </div>
               </div>
             }
             breadcrumbs={['МОДЕЛЮВАННЯ', 'СТРЕС-ТЕСТ', 'ЦИФРОВИЙ ДВІЙНИК']}
             badges={[
               { label: 'STATE_MACHINE', color: 'primary', icon: <Cpu size={10} /> },
               { label: 'REAL_TIME_SYNC', color: 'success', icon: <Activity size={10} /> },
             ]}
             stats={[
               { label: 'АКТИВНІ_ВУЗЛИ', value: '1,492', icon: <Share2 size={14} />, color: 'primary' },
               { label: 'ЗДОРОВ\'Я_СИСТЕМИ', value: '98.9%', icon: <ShieldCheck size={14} />, color: 'success', animate: true },
             ]}
             actions={
               <button onClick={() => play(UISoundType.CLICK)} className="px-6 py-3 bg-sky-600/10 border border-sky-500/20 text-sky-500 rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-sky-600 hover:text-white transition-all shadow-xl">
                 <Zap size={16} className="inline mr-2" /> СТРЕС_ТЕСТ (INIT)
               </button>
             }
           />

           <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
                <HoloCard variant="cyber" className="p-10 rounded-[3rem] h-[600px] flex flex-col relative overflow-hidden border-sky-500/20 bg-sky-900/5">
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                         <Globe size={24} className="text-sky-500 animate-pulse" />
                         <h3 className="text-2xl font-black text-white italic uppercase tracking-widest">3D МАПА ПІДПРИЄМСТВА (STATE MACHINE)</h3>
                      </div>
                      <span className="px-4 py-1.5 bg-black border border-sky-500/30 text-sky-500 text-[10px] font-black uppercase tracking-widest rounded-lg">SYNC_ONLINE</span>
                   </div>
                   
                   <div className="flex-1 border-2 border-dashed border-sky-500/20 rounded-2xl flex items-center justify-center bg-black/60 relative">
                      <p className="text-sm font-black text-sky-500/50 tracking-widest uppercase">РЕНДЕР_STATE_MACHINE (CANVAS_PLACEHOLDER)</p>
                      
                      {/* Placeholder nodes */}
                      <div className="absolute top-[20%] left-[20%] p-3 bg-sky-500/20 border border-sky-500 text-sky-500 rounded-full animate-bounce">
                         <Box size={24} />
                      </div>
                      <div className="absolute top-[50%] left-[50%] p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-500 rounded-full">
                         <Target size={32} />
                      </div>
                      <div className="absolute bottom-[30%] right-[20%] p-3 bg-rose-500/20 border border-rose-500 text-rose-500 rounded-full animate-pulse">
                         <Activity size={24} />
                      </div>
                   </div>
                </HoloCard>
             </div>

             <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                <div className="p-8 bg-black border border-white/5 rounded-[2.5rem] shadow-2xl h-full space-y-6">
                   <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                      <Layers size={24} className="text-slate-500" />
                      <h3 className="text-lg font-black text-white italic uppercase tracking-widest">АКТИВНІ АНОМАЛІЇ</h3>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col gap-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">КАСОВИЙ_РОЗРИВ_Q3</span>
                            <AlertTriangle size={14} className="text-rose-500" />
                         </div>
                         <p className="text-xs font-bold text-slate-300">Імовірність виникнення розриву ліквідності у зв'язку з затримкою платежів від контрагента X.</p>
                      </div>

                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col gap-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">ЛОГІСТИЧНИЙ_ЗБІЙ</span>
                            <AlertTriangle size={14} className="text-amber-500" />
                         </div>
                         <p className="text-xs font-bold text-slate-300">Перевантаження транзитного хабу (Навантаження: 92%).</p>
                      </div>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </PageTransition>
  );
}
