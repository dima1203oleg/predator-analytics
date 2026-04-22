import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Cpu, HardDrive, RefreshCw, Plus, Minus, AlignLeft, X, Power 
} from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { FactoryPodRecord } from '../systemFactoryView.utils';

interface K8sTabProps {
  pods: FactoryPodRecord[];
  handlePodRestart: (id: string) => void;
  handleScalePod: (id: string) => void;
  handleScaleDownPod: (id: string) => void;
  handleShowLogs: (id: string) => void;
  logsPodId: string | null;
  setLogsPodId: (id: string | null) => void;
  liveLogs: string[];
  logsEndRef: React.RefObject<HTMLDivElement>;
}

export const K8sTab: React.FC<K8sTabProps> = ({
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
    <motion.div 
      key="k8s" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-6"
    >
      <TacticalCard variant="holographic" className="border-rose-500/20 bg-slate-900/40 p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-rose-500/20 bg-rose-500/5">
          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
          <h2 className="text-xs font-black uppercase tracking-widest text-white">Інтерактивна Топологія Подів (Pods)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40 text-[9px] uppercase tracking-widest text-slate-500">
                <th className="p-4 font-black">Підсистема (Pod)</th>
                <th className="p-4 font-black">Статус</th>
                <th className="p-4 font-black">Ресурси</th>
                <th className="p-4 font-black text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pods.length > 0 ? pods.map(pod => (
                <tr key={pod.id} className="hover:bg-rose-500/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]", 
                        pod.status === 'Running' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-500 animate-pulse shadow-rose-500/50"
                      )} />
                      <div>
                        <div className="text-[13px] font-bold text-white flex items-center gap-2">
                          {pod.name}
                          <span className="text-[9px] font-black tracking-widest bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-rose-400">×{pod.replicas}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-tight">ID: {pod.id} | Аптайм: {pod.uptime}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={pod.status === 'Running' ? "cyber" : "neon"} className={cn(
                      pod.status === 'Running' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                      {pod.status === 'Restarting' ? <RefreshCw size={10} className="inline mr-1 animate-spin" /> : null}
                      {pod.status}
                    </Badge>
                    {pod.restarts > 0 && <div className="text-[9px] text-slate-500 mt-2 ml-1 font-mono uppercase tracking-widest">↻ {pod.restarts} Restarts</div>}
                  </td>
                  <td className="p-4 text-[11px] font-mono text-slate-300">
                    <div className="flex items-center gap-2">
                      <Cpu size={12} className="text-rose-400" /> {pod.cpu}
                      <HardDrive size={12} className="text-slate-400 ml-2" /> {pod.mem}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Button 
                        onClick={() => handlePodRestart(pod.id)}
                        disabled
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 bg-slate-800/50 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/50 rounded-xl border border-white/5 transition-all disabled:opacity-20"
                      >
                        <Power size={14} />
                      </Button>
                      <div className="flex bg-slate-800/50 rounded-xl overflow-hidden border border-white/5">
                        <Button 
                          onClick={() => handleScalePod(pod.id)}
                          disabled
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-rose-500/20 hover:text-rose-400 transition-all border-r border-white/5 disabled:opacity-20"
                        >
                          <Plus size={14} />
                        </Button>
                        <Button 
                          onClick={() => handleScaleDownPod(pod.id)}
                          disabled
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-rose-500/20 hover:text-rose-400 transition-all disabled:opacity-20"
                        >
                          <Minus size={14} />
                        </Button>
                      </div>
                      <Button 
                        onClick={() => handleShowLogs(pod.id)}
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-9 w-9 bg-slate-800/50 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 rounded-xl border border-white/5 transition-all",
                          logsPodId === pod.id && "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 opacity-100"
                        )}
                      >
                        <AlignLeft size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-xs font-mono uppercase tracking-[0.2em] text-slate-500">
                    📡 Очікування синхронізації з Kubernetes API...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TacticalCard>

      {/* LIVE LOGS OVERLAY PANEL */}
      <AnimatePresence>
        {logsPodId && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full bg-slate-950/90 border border-emerald-500/30 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.1)] relative"
          >
            <div className="px-5 py-3 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-emerald-400 font-mono text-[10px] uppercase font-black tracking-widest">
                <Terminal size={14} className="animate-pulse" /> 
                STDOUT &gt; {pods.find(p => p.id === logsPodId)?.name}
              </div>
              <Button onClick={() => setLogsPodId(null)} variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-white/5 transition-all h-8 w-8 rounded-lg">
                <X size={16} />
              </Button>
            </div>
            <div className="h-[300px] p-5 font-mono text-[11px] text-emerald-400/80 overflow-y-auto custom-scrollbar bg-black/40">
              {liveLogs.length > 0 ? liveLogs.map((log, index) => (
                <div key={index} className="mb-1.5 flex gap-4 group">
                  <span className="text-slate-700 shrink-0 select-none group-hover:text-emerald-500/40 transition-colors">{String(index + 1).padStart(3, '0')}</span>
                  <span className="break-all">
                    {log.includes('INFO') ? <span className="text-blue-400/80 font-black">{log.substring(0, 15)}</span> : <span className="text-slate-600">{log.substring(0, 15)}</span>}
                    {log.substring(15)}
                  </span>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic uppercase tracking-widest text-[10px]">
                  Очікування потоку подій від контейнера...
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
