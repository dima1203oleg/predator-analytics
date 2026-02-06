import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit, Play, Pause, Settings,
  Terminal, RefreshCw, Send, FileCode
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface Saga {
  id: string;
  name: string;
  status: 'active' | 'paused';
  progress: number;
  lastAction: string;
}

export const NeuralAutomationWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [sagas] = useState<Saga[]>([
    { id: 'S1', name: premiumLocales.neuralAutomation.sagas.riskCrawler, status: 'active', progress: 65, lastAction: premiumLocales.neuralAutomation.sagas.actions.rotterdam },
    { id: 'S2', name: premiumLocales.neuralAutomation.sagas.sourcingSignals, status: 'active', progress: 42, lastAction: premiumLocales.neuralAutomation.sagas.actions.hsCheck },
    { id: 'S3', name: premiumLocales.neuralAutomation.sagas.sanctionsDetector, status: 'paused', progress: 100, lastAction: premiumLocales.neuralAutomation.sagas.actions.dbUpdate },
  ]);

  const [logs] = useState<string[]>([
    premiumLocales.neuralAutomation.logs.init,
    premiumLocales.neuralAutomation.logs.scanStart,
    premiumLocales.neuralAutomation.logs.anomalyFound,
    premiumLocales.neuralAutomation.logs.monitoringActive,
  ]);

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[40px] backdrop-blur-3xl overflow-hidden h-full flex flex-col relative group">
      <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />

      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{premiumLocales.neuralAutomation.title}</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{premiumLocales.neuralAutomation.subtitle}</p>
          </div>
        </div>
        <button aria-label="Оновити статус" className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-y-auto scrollbar-hide space-y-8">

        {/* Sagas List */}
        <div className="space-y-4">
          {sagas.map((saga, i) => (
            <motion.div
              key={saga.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-[24px] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/saga"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className={cn(
                     "w-2 h-2 rounded-full",
                     saga.status === 'active' ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-500"
                   )} />
                   <h4 className="text-sm font-black text-white">{saga.name}</h4>
                </div>
                <div className="flex gap-2">
                   <button
                     aria-label={saga.status === 'active' ? "Пауза" : "Запуск"}
                     className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-all"
                   >
                      {saga.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                   </button>
                   <button
                     aria-label="Налаштування саги"
                     className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-all"
                   >
                      <Settings size={14} />
                   </button>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <span>{saga.lastAction}</span>
                    <span>{saga.progress}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${saga.progress}%` }}
                      className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    />
                 </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Neural Logs Console */}
        <div className="rounded-[24px] bg-black/60 border border-white/5 p-6 font-mono overflow-hidden">
           <div className="flex items-center gap-2 mb-4">
              <Terminal size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{premiumLocales.neuralAutomation.consoleTitle}</span>
           </div>
           <div className="space-y-2 h-40 overflow-y-auto scrollbar-hide">
              {logs.map((log, i) => (
                <div key={i} className="text-[10px] text-slate-400 leading-relaxed border-l border-white/5 pl-3">
                   <span className="text-blue-500/50 mr-2">{'>'}</span> {log}
                </div>
              ))}
              <div className="flex items-center gap-2 text-[10px] text-blue-400 animate-pulse">
                 <span className="mr-2">{'>'}</span> {premiumLocales.neuralAutomation.processing}
              </div>
           </div>
        </div>
      </div>

      {/* Integration Shortcuts */}
      <div className="p-6 border-t border-white/5 bg-black/40 grid grid-cols-2 gap-4">
         <button
           aria-label="Telegram Bot"
           className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
         >
            <div className="text-blue-400"><Send size={18} /></div>
            <div className="text-left">
               <div className="text-[10px] font-black text-white uppercase">{premiumLocales.neuralAutomation.telegramBot}</div>
               <div className="text-[8px] text-slate-500">{premiumLocales.neuralAutomation.notificationsDesc}</div>
            </div>
         </button>
         <button
           aria-label="API Documentation"
           className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
         >
            <div className="text-emerald-400"><FileCode size={18} /></div>
            <div className="text-left">
               <div className="text-[10px] font-black text-white uppercase">{premiumLocales.neuralAutomation.apiDocs}</div>
               <div className="text-[8px] text-slate-500">{premiumLocales.neuralAutomation.integrateDesc}</div>
            </div>
         </button>
      </div>

      <div className="p-4 bg-blue-500/10 text-center border-t border-blue-500/20">
         <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">{premiumLocales.neuralAutomation.interfaceOnline}</span>
      </div>
    </div>
  );
};
