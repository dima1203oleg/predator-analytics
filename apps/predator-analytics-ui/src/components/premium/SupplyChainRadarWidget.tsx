import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, AlertCircle, TrendingUp, Zap, Globe, Crosshair, Target, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface RadarPing {
  id: string;
  x: number;
  y: number;
  type: 'opportunity' | 'risk' | 'anomaly';
  label: string;
  value: string;
  details: string;
}

export const SupplyChainRadarWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [pings, setPings] = useState<RadarPing[]>([]);
  const [activePing, setActivePing] = useState<RadarPing | null>(null);

  // Генерируємо "пінги"
  useEffect(() => {
    const initialPings: RadarPing[] = [
      { id: '1', x: 25, y: 30, type: 'risk', label: 'ТОВ Вектор', value: 'Високий Ризик', details: 'Спроба обходу санкцій через треті країни.' },
      { id: '2', x: 65, y: 45, type: 'opportunity', label: 'Новий Маршрут', value: '-15% Витрат', details: 'Відкрито зелений коридор через порт Гданськ.' },
      { id: '3', x: 45, y: 75, type: 'anomaly', label: 'Кластер Літієвих Батарей', value: 'Стрибок Об\'єму', details: 'Нетипове зростання імпорту (8507) на +300%.' },
    ];
    setPings(initialPings);

    const interval = setInterval(() => {
      // Додаємо випадкові шумові пінги для ефекту "живого" радару
      const newPing: RadarPing = {
        id: Math.random().toString(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        type: Math.random() > 0.5 ? 'anomaly' : 'opportunity',
        label: 'Процесинг...',
        value: 'Дані Live',
        details: 'Сканування митних потоків у реальному часі.'
      };
      setPings(prev => [...prev.slice(-5), newPing]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-950/90 border border-emerald-500/20 rounded-[40px] backdrop-blur-3xl overflow-hidden h-full flex flex-col relative group shadow-[0_0_50px_rgba(16,185,129,0.05)]">
      {/* Radar Background Effects */}
      <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="relative">
             <div className="absolute inset-0 bg-emerald-500 animate-ping rounded-full opacity-20" />
             <div className="relative p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Target size={24} />
             </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{premiumLocales.supplyChainRadar.title}</h3>
            <p className="text-[10px] text-emerald-500 font-mono font-bold uppercase tracking-[0.2em] animate-pulse">{premiumLocales.supplyChainRadar.scanning}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
           <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-black">{premiumLocales.supplyChainRadar.accuracy}</div>
              <div className="text-sm font-black text-white font-mono">99.8%</div>
           </div>
           <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-black">{premiumLocales.supplyChainRadar.nodesOnline}</div>
              <div className="text-sm font-black text-white font-mono">1,402</div>
           </div>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-8">
        {/* The Radar Disc */}
        <div className="relative w-full aspect-square max-w-[500px] border-2 border-emerald-500/10 rounded-full flex items-center justify-center">
            {/* Concentric Circles */}
            <div className="absolute inset-0 border border-emerald-500/5 rounded-full scale-[0.75]" />
            <div className="absolute inset-0 border border-emerald-500/5 rounded-full scale-[0.5]" />
            <div className="absolute inset-0 border border-emerald-500/5 rounded-full scale-[0.25]" />

            {/* Axes */}
            <div className="absolute w-full h-[1px] bg-emerald-500/5" />
            <div className="absolute h-full w-[1px] bg-emerald-500/5" />

            {/* Scanning Sweep */}
            <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 via-transparent to-transparent origin-center z-10"
               style={{ clipPath: 'conic-gradient(from 0deg, transparent 0deg, rgba(16,185,129,0.1) 40deg, transparent 50deg)' }}
            />

            {/* Pings */}
            {pings.map((ping) => (
               <motion.div
                 key={ping.id}
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
                 className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                 onMouseEnter={() => setActivePing(ping)}
               >
                 <div className={cn(
                   "w-4 h-4 rounded-full border-2 animate-pulse",
                   ping.type === 'risk' ? "bg-rose-500 border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)]" :
                   ping.type === 'opportunity' ? "bg-emerald-500 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]" :
                   "bg-blue-500 border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                 )} />
               </motion.div>
            ))}

            {/* Active Detail Overlay */}
            <AnimatePresence>
               {activePing && (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0 }}
                   className="absolute top-4 left-4 z-30 w-64 p-6 bg-slate-900/95 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl"
                 >
                    <div className="flex justify-between items-start mb-4">
                       <span className={cn(
                         "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                         activePing.type === 'risk' ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                       )}>
                         {premiumLocales.supplyChainRadar.pingTypes.tactical} {activePing.type === 'risk' ? premiumLocales.supplyChainRadar.pingTypes.risk : activePing.type === 'opportunity' ? premiumLocales.supplyChainRadar.pingTypes.opportunity : premiumLocales.supplyChainRadar.pingTypes.anomaly}
                       </span>
                       <button aria-label="Закрити опис" onClick={() => setActivePing(null)} className="text-slate-500 hover:text-white">
                          <AlertCircle size={14} />
                       </button>
                    </div>
                    <div className="text-sm font-black text-white mb-1">{activePing.label}</div>
                    <div className="text-[10px] text-emerald-400 font-mono mb-3">{activePing.value}</div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-4">{activePing.details}</p>
                    <button className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                       {premiumLocales.supplyChainRadar.exploreNode}
                    </button>
                 </motion.div>
               )}
            </AnimatePresence>
        </div>
      </div>

      {/* Live Activity Feed Sidebar (Simulated) */}
      <div className="absolute top-32 right-8 bottom-8 w-40 hidden lg:flex flex-col gap-3 relative z-10">
         <div className="text-[9px] text-slate-500 uppercase font-black mb-2 flex items-center gap-2">
            <Radio size={10} className="animate-pulse text-emerald-500" /> {premiumLocales.supplyChainRadar.liveIntelFeed}
         </div>
         {[
           'Виявлено нетиповий потік імпорту в HS 8471',
           'Знайдено ціновий розрив у турецькому коридорі',
           'Прогнозування черги в порту Констанца',
           'Сканування оновлень санкцій #4421'
         ].map((msg, i) => (
           <motion.div
             key={i}
             initial={{ x: 20, opacity: 0 }}
             animate={{ x: 0, opacity: 0.8 }}
             className="text-[8px] text-slate-400 p-2 bg-white/5 rounded-lg border-l border-emerald-500/30 font-mono"
           >
             {msg}
           </motion.div>
         ))}
      </div>

      {/* Legend Footer */}
      <div className="p-6 border-t border-white/5 bg-black/44 flex items-center justify-between">
         <div className="flex gap-4">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-rose-500" />
               <span className="text-[9px] text-slate-500 uppercase font-black">{premiumLocales.supplyChainRadar.criticalRisk}</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500" />
               <span className="text-[9px] text-slate-500 uppercase font-black">{premiumLocales.supplyChainRadar.alphaOpportunity}</span>
            </div>
         </div>
         <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <Zap size={12} className="text-amber-500" />
            <span className="font-bold uppercase">{premiumLocales.supplyChainRadar.aiAccuracyVersion}</span>
         </div>
      </div>
    </div>
  );
};
