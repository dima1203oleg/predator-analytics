import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Power, Plus, Minus, AlignLeft, X, Cpu, HardDrive
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { type FactoryPodRecord } from '../systemFactoryView.utils';

export interface FactoryK8sClusterPanelProps {
  pods: FactoryPodRecord[];
  handlePodRestart: (podId: string) => void;
  handleScalePod: (podId: string) => void;
  handleScaleDownPod: (podId: string) => void;
  handleShowLogs: (podId: string) => void;
  logsPodId: string | null;
  setLogsPodId: (podId: string | null) => void;
  liveLogs: string[];
  logsEndRef: React.RefObject<HTMLDivElement>;
}

export const FactoryK8sClusterPanel: React.FC<FactoryK8sClusterPanelProps> = ({
  pods,
  handlePodRestart,
  handleScalePod,
  handleScaleDownPod,
  handleShowLogs,
  logsPodId,
  setLogsPodId,
  liveLogs,
  logsEndRef
}) => {
  return (
    <div className="space-y-6">
      <section className="page-section section-slate shadow-xl overflow-hidden mt-2">
        <div className="section-header">
          <div className="section-dot-slate" />
          <h2 className="section-title">Інтерактивна Топологія Подів (Pods)</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40 text-[9px] uppercase tracking-widest text-slate-500">
                <th className="p-4 font-black">Підсистема (Pod)</th>
                <th className="p-4 font-black">Статус</th>
                <th className="p-4 font-black">� есурси</th>
                <th className="p-4 font-black">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pods.length > 0 ? pods.map(pod => (
                <tr key={pod.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", pod.status === 'Running' ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-rose-500 animate-pulse")} />
                      <div>
                        <div className="text-[13px] font-bold text-white flex items-center gap-2">
                          {pod.name}
                          <span className="text-[9px] font-black tracking-widest bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-yellow-400">×{pod.replicas}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {pod.id} | Аптайм: {pod.uptime}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded", 
                      pod.status === 'Running' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                      {pod.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Cpu size={12} className="text-rose-400" /> {pod.cpu}
                      <HardDrive size={12} className="text-slate-400 ml-2" /> {pod.mem}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Button 
                        onClick={() => handlePodRestart(pod.id)}
                        variant="ghost"
                        size="icon"
                        className="p-2 h-10 w-10 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 flex flex-col items-center justify-center hover:border-rose-500/50 rounded-lg border border-transparent transition-all disabled:opacity-40" title="Перезапустити Pod"
                      >
                        <Power size={14} />
                      </Button>
                      <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-transparent">
                        <Button 
                          onClick={() => handleScalePod(pod.id)}
                          variant="ghost"
                          size="icon"
                          className="p-2 h-10 w-10 hover:bg-yellow-500/20 hover:text-yellow-400 transition-all border-r border-white/5 disabled:opacity-40" title="Збільшити репліки"
                        >
                          <Plus size={14} />
                        </Button>
                        <Button 
                          onClick={() => handleScaleDownPod(pod.id)}
                          variant="ghost"
                          size="icon"
                          className="p-2 h-10 w-10 hover:bg-yellow-500/20 hover:text-yellow-400 transition-all disabled:opacity-40" title="Зменшити репліки"
                        >
                          <Minus size={14} />
                        </Button>
                      </div>
                      <Button 
                        onClick={() => handleShowLogs(pod.id)}
                        variant="ghost"
                        size="icon"
                        className="p-2 h-10 w-10 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 rounded-lg border border-transparent transition-all" title="Live Логи"
                      >
                        <AlignLeft size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm leading-6 text-slate-400">
                    `/system/cluster` не повернув pod-обʼєкти. Таблиця лишається порожньою, а керування pod-ами заблоковане до появи оркестраційного API.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* LIVE LOGS OVERLAY PANEL */}
      <AnimatePresence>
        {logsPodId && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 300 }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-slate-950/90 border border-emerald-500/30 rounded-xl overflow-hidden flex flex-col shadow-[0_0_30px_rgba(16,185,129,0.1)] relative"
          >
            <div className="px-4 py-2 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] uppercase font-black tracking-widest">
                <Terminal size={14} /> 
                STDOUT & STDERR &gt; {pods.find(p => p.id === logsPodId)?.name}
              </div>
              <Button onClick={() => setLogsPodId(null)} variant="ghost" size="icon" className="text-slate-500 hover:text-white transition-colors h-8 w-8">
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 p-4 font-mono text-[11px] text-emerald-400/80 overflow-y-auto custom-scrollbar">
              {liveLogs.length > 0 ? liveLogs.map((log, index) => (
                <div key={index} className="mb-0.5 break-all">
                  {log.includes('INFO') ? <span className="text-blue-400">{log.substring(0, 15)}</span> : <span className="text-slate-500">{log.substring(0, 15)}</span>}
                  {log.substring(15)}
                </div>
              )) : (
                <div className="text-slate-500">
                  Для вибраного pod не знайдено підтверджених рядків у `/system/logs/stream`. Оверлей не домальовує stdout локально.
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
