import { Button } from '@/components/ui/button';
import React from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloCard } from '@/components/ui/HoloCard';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { Scale, FileText, AlertCircle, RefreshCw, Filter, CheckCircle2 } from 'lucide-react';

export default function RegulatoryRadarView() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        
        <div className="relative z-10 max-w-[1750px] mx-auto p-4 sm:p-12 space-y-8">
           <ViewHeader
             title={
               <div className="flex items-center gap-8">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 " />
                     <div className="relative p-6 bg-black border-2 border-indigo-500/40 rounded-[2rem] shadow-4xl transform rotate-3 transition-all">
                        <Scale size={36} className="text-indigo-500 shadow-[0_0_20px_#6366f1]" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center gap-3">
                        <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 px-3 py-0.5 text-[10px] font-black tracking-widest uppercase italic rounded-md">
                          КОМПЛАЄНС // REGULATORY_RADAR
                        </span>
                     </div>
                     <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                       РЕГУЛЯТОРНИЙ <span className="text-indigo-500">РАДАР</span>
                     </h1>
                  </div>
               </div>
             }
             breadcrumbs={['БЕЗПЕКА', 'КОМПЛАЄНС', 'РЕГУЛЯТОРНИЙ РАДАР']}
             badges={[
               { label: 'GDPR_ACTIVE', color: 'success', icon: <CheckCircle2 size={10} /> },
               { label: 'AML_MONITORING', color: 'primary', icon: <RefreshCw size={10} /> },
             ]}
             stats={[]}
             actions={
               <Button variant="cyber" className="px-6 py-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-indigo-600 hover:text-white transition-all shadow-xl">
                 <Filter size={16} className="inline mr-2" /> ОНОВИТИ_БАЗУ_ПРАВИЛ
               </Button>
             }
           />

           <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <div className="p-8 bg-black border border-white/5 rounded-[2.5rem] shadow-2xl h-[500px] overflow-y-auto">
                   <h3 className="text-xl font-black text-white italic uppercase tracking-widest mb-6">ЗМІНИ В ЗАКОНОДАВСТВІ</h3>
                   <div className="space-y-4">
                      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col gap-2">
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">ДИРЕКТИВА_EU_2026</span>
                         <p className="text-xs font-bold text-slate-300">Нові вимоги щодо звітності ESG (Екологія, Соціальна політика).</p>
                         <span className="text-[9px] font-mono text-slate-500 mt-2">НАБУВАЄ ЧИННОСТІ: 01.09.2026</span>
                      </div>
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex flex-col gap-2">
                         <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">AML/CFT_ПОПРАВКИ</span>
                         <p className="text-xs font-bold text-slate-300">Посилений фінмоніторинг криптоактивів.</p>
                         <span className="text-[9px] font-mono text-slate-500 mt-2">НАБУВАЄ ЧИННОСТІ: 15.07.2026</span>
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                <HoloCard variant="cyber" className="p-10 rounded-[3rem] h-[500px] flex flex-col relative overflow-hidden bg-indigo-900/5 border-indigo-500/20">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
                     <FileText size={200} className="text-indigo-500" />
                   </div>
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-widest mb-4">МАПІНГ РИЗИКІВ (COMPLIANCE MATRIX)</h3>
                   <div className="flex-1 border-2 border-dashed border-indigo-500/20 rounded-2xl flex items-center justify-center bg-black/60">
                      <p className="text-sm font-black text-indigo-500/50 tracking-widest uppercase">МАТРИЦЯ_ВІДПОВІДНОСТІ (RENDER)</p>
                   </div>
                </HoloCard>
             </div>
           </div>
        </div>
      </div>
    </PageTransition>
  );
}
