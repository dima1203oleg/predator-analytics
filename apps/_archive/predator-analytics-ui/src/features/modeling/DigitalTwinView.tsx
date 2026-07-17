import { Button } from '@/components/ui/button';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloCard } from '@/components/ui/HoloCard';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { useUISound, UISoundType } from '@/hooks/useUISound';
import { StateMachineVisualizer } from './components/StateMachineVisualizer';
import type { MonteCarloParams, MonteCarloResult } from '@/workers/monteCarlo.worker';
import { Cpu, Activity, ShieldCheck, Share2, Hexagon, Globe, Layers, AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function DigitalTwinView() {
  const { play } = useUISound();
  
  const [simStatus, setSimStatus] = useState<'idle' | 'simulating' | 'completed'>('idle');
  const [mcResults, setMcResults] = useState<MonteCarloResult | undefined>(undefined);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('../../workers/monteCarlo.worker.ts', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e: MessageEvent<MonteCarloResult>) => {
      setMcResults(e.data);
      setSimStatus('completed');
      play(UISoundType.SUCCESS);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [play]);

  const handleStartSimulation = useCallback(() => {
    if (simStatus === 'simulating' || !workerRef.current) return;
    
    play(UISoundType.CLICK);
    setSimStatus('simulating');
    setMcResults(undefined);

    const params: MonteCarloParams = {
      iterations: 10000,
      baseLiquidity: 500000,
      monthlyBurnRate: 120000,
      monthlyRevenueAvg: 135000,
      revenueVolatility: 0.3,
      monthsToSimulate: 12,
      activeAnomalies: [
        { id: 'cash_gap', riskMultiplier: 1.15 },
        { id: 'logistic_delay', riskMultiplier: 1.05 }
      ]
    };

    workerRef.current.postMessage(params);
  }, [simStatus, play]);

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
               { label: 'ЗДОРОВ\'Я_СИСТЕМИ', value: mcResults ? `${mcResults.successRate.toFixed(1)}%` : '98.9%', icon: <ShieldCheck size={14} />, color: mcResults && mcResults.successRate < 80 ? 'warning' : 'success', animate: true },
             ]}
             actions={
               <Button variant="cyber" 
                 onClick={handleStartSimulation} 
                 disabled={simStatus === 'simulating'}
                 className={cn(
                   "px-6 py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all shadow-xl flex items-center",
                   simStatus === 'simulating' 
                    ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed" 
                    : "bg-sky-600/10 border-sky-500/20 text-sky-500 hover:bg-sky-600 hover:text-white"
                 )}
               >
                 {simStatus === 'simulating' ? (
                   <><RefreshCw size={16} className="inline mr-2 animate-spin" /> ОБЧИСЛЕННЯ...</>
                 ) : (
                   <><Zap size={16} className="inline mr-2" /> СТРЕС_ТЕСТ (10K ITERS)</>
                 )}
               </Button>
             }
           />

           <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
                <HoloCard variant="cyber" className="p-10 rounded-[3rem] h-[600px] flex flex-col relative overflow-hidden border-sky-500/20 bg-sky-900/5">
                   <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                         <Globe size={24} className={cn("text-sky-500", simStatus === 'simulating' && "animate-spin")} />
                         <h3 className="text-2xl font-black text-white italic uppercase tracking-widest">3D МАПА ПІДПРИЄМСТВА (STATE MACHINE)</h3>
                      </div>
                      <span className={cn(
                        "px-4 py-1.5 border text-[10px] font-black uppercase tracking-widest rounded-lg",
                        simStatus === 'simulating' ? "bg-amber-500/20 border-amber-500 text-amber-500 animate-pulse" : "bg-black border-sky-500/30 text-sky-500"
                      )}>
                        {simStatus === 'simulating' ? 'SIMULATION_ACTIVE' : 'SYNC_ONLINE'}
                      </span>
                   </div>
                   
                   <div className="flex-1 rounded-2xl bg-black/60 relative overflow-hidden">
                      <StateMachineVisualizer status={simStatus} results={mcResults} />
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
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex flex-col gap-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">КАСОВИЙ_РОЗРИВ_Q3</span>
                            <AlertTriangle size={14} className="text-cyan-500" />
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

                   {/* Simulation Config Panel */}
                   <div className="mt-8 pt-8 border-t border-white/5">
                     <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4 block">ПАРАМЕТРИ MONTE CARLO</span>
                     <div className="space-y-3 font-mono text-[11px] text-slate-400">
                       <div className="flex justify-between"><span>ІТЕРАЦІЙ:</span><span className="text-sky-400">10,000</span></div>
                       <div className="flex justify-between"><span>ГОРИЗОНТ:</span><span className="text-sky-400">12 МІСЯЦІВ</span></div>
                       <div className="flex justify-between"><span>ВОЛАТИЛЬНІСТЬ:</span><span className="text-sky-400">30%</span></div>
                       <div className="flex justify-between"><span>КОЕФ. РИЗИКУ:</span><span className="text-rose-400">HIGH (x1.2)</span></div>
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
