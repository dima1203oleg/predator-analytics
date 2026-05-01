/**
 * 🛰️ CHIEF CONDUCTOR VIEW // ГЛОБАЛЬНИЙ_ДИрИГЕНТ_v61.0
 * PREDATOR Analytics — Autonomous Orchestration Matrix
 * 
 * Моніторинг LangGraph ланцюжків та управління AGI-задачами.
 * 
 * © 2026 PREDATOR Analytics
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Zap, GitMerge, Network, Activity, HardDrive, 
  Search, Terminal, Play, Square, RefreshCw, Layers,
  ListFilter, AlertCircle, CheckCircle2, Orbit
} from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { factoryApi } from '@/services/api/factory';

interface AGITask {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: string;
  progress: number;
  agent: string;
  startedAt: string;
}

const MOCK_TASKS: AGITask[] = [
  { id: 'task-001', description: 'Аналіз графу власності ТОВ "Енерго-Плюс"', status: 'running', priority: 'HIGH', progress: 65, agent: 'GraphAnalyst', startedAt: '2026-05-01 12:40:15' },
  { id: 'task-002', description: 'Рісерч нових санкцій РНБО за 04.2026', status: 'pending', priority: 'MEDIUM', progress: 0, agent: 'NewsAgent', startedAt: '2026-05-01 12:44:00' },
  { id: 'task-003', description: 'Оптимізація семантичного індексу Qdrant', status: 'completed', priority: 'LOW', progress: 100, agent: 'SystemAgent', startedAt: '2026-05-01 11:30:12' },
];

export default function ChiefConductorView() {
  const [tasks, setTasks] = useState<AGITask[]>(MOCK_TASKS);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 uppercase font-black text-[10px] tracking-widest px-3">
               AGI_О КЕСТ АЦІЯ
             </Badge>
             <div className="h-px w-8 bg-yellow-500/20" />
             <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">v61.0-ELITE</span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
            Chief<span className="text-yellow-500">Conductor</span>
          </h2>
          <p className="text-xs text-slate-500 font-black uppercase tracking-[0.4em] italic leading-none">
            Глобальний координатор автономних агентів та LangGraph-ланцюжків
          </p>
        </div>

        <div className="flex gap-4">
           <button className="px-8 py-4 bg-yellow-700/10 hover:bg-yellow-700 border border-yellow-500/30 text-yellow-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic transition-all flex items-center gap-4">
              <Zap size={18} /> НОВА_ЗАДАЧА
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-8">
        <div className="space-y-8">
          <TacticalCard variant="holographic" title="Черга AGI-задач" className="rounded-[40px] border-yellow-500/20 bg-slate-950/50 p-8">
            <div className="space-y-4">
               {tasks.map((task, i) => (
                 <motion.div
                   key={task.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="group relative overflow-hidden rounded-[30px] border border-white/5 bg-black/40 hover:bg-white/[0.02] transition-all p-6"
                 >
                    <div className="flex items-start gap-8">
                       <div className={cn(
                         "p-4 rounded-2xl border flex items-center justify-center transition-all duration-500 shadow-2xl",
                         task.status === 'running' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 animate-pulse" : "bg-slate-900 border-white/10 text-slate-500"
                       )}>
                          {task.status === 'running' ? <Cpu size={24} /> : task.status === 'completed' ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Clock size={24} />}
                       </div>

                       <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                             <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                   <h4 className="text-xl font-black text-white tracking-tight uppercase italic">{task.description}</h4>
                                   <Badge className={cn(
                                     "text-[8px] font-black border-none",
                                     task.priority === 'HIGH' ? "bg-rose-500/20 text-rose-400" : "bg-slate-500/20 text-slate-400"
                                   )}>{task.priority}</Badge>
                                </div>
                                <div className="flex items-center gap-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                                   <span className="flex items-center gap-2"><Orbit size={12} /> {task.agent}</span>
                                   <span className="flex items-center gap-2"><Clock size={12} /> {task.startedAt}</span>
                                   <span className="font-mono text-slate-700">ID: {task.id}</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="text-2xl font-black text-white italic tracking-tighter">{task.progress}%</div>
                                <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic mt-1">Виконання</div>
                             </div>
                          </div>

                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${task.progress}%` }}
                               transition={{ duration: 1.5, ease: "easeOut" }}
                               className={cn(
                                 "h-full rounded-full shadow-lg",
                                 task.status === 'running' ? "bg-yellow-500 shadow-yellow-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                               )}
                             />
                          </div>
                       </div>

                       <div className="flex flex-col gap-2">
                          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><Terminal size={16} /></button>
                          <button className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-xl text-slate-500 hover:text-rose-500 transition-all"><Square size={16} /></button>
                       </div>
                    </div>
                 </motion.div>
               ))}
            </div>
          </TacticalCard>
        </div>

        <div className="space-y-8">
           <TacticalCard variant="holographic" title="Статус Агентів" className="rounded-[40px] border-yellow-500/20 bg-slate-950/50 p-8">
              <div className="space-y-6">
                 {[
                   { name: 'Researcher', status: 'АКТИВНИЙ', load: 45, icon: Search },
                   { name: 'GraphAnalyst', status: 'ЗАЙНЯТИЙ', load: 88, icon: Network },
                   { name: 'NewsAgent', status: 'ОЧІКУВАННЯ', load: 12, icon: Layers },
                   { name: 'SystemAgent', status: 'ОПТИМІЗАЦІЯ', load: 95, icon: HardDrive },
                 ].map((agent) => (
                   <div key={agent.name} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl group hover:border-yellow-500/20 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-slate-900 rounded-xl text-slate-500 group-hover:text-yellow-500 transition-all">
                            <agent.icon size={20} />
                         </div>
                         <div>
                            <div className="text-[11px] font-black text-white uppercase tracking-widest">{agent.name}</div>
                            <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">{agent.status}</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-lg font-black text-slate-300 italic">{agent.load}%</div>
                         <div className="text-[7px] font-black text-slate-700 uppercase tracking-widest">VRAM</div>
                      </div>
                   </div>
                 ))}
              </div>
           </TacticalCard>

           <TacticalCard variant="cyber" className="p-8 rounded-[36px] bg-yellow-600/5 border-yellow-500/20">
              <div className="flex items-center gap-5 mb-6">
                 <div className="p-3 bg-yellow-600/20 rounded-2xl text-yellow-500">
                    <Activity size={20} />
                 </div>
                 <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">LangGraph Flow</h4>
              </div>
              <div className="space-y-3">
                 <div className="text-xs text-slate-400 italic">Активний ланцюжок:</div>
                 <div className="p-4 bg-black/60 rounded-2xl border border-white/5 font-mono text-[10px] text-yellow-500/80">
                    node:start -> agent:researcher -> node:judge -> agent:fixer -> node:end
                 </div>
                 <div className="flex justify-between items-center text-[9px] font-black text-slate-700 uppercase tracking-widest mt-4">
                    <span>Токени: 14.5k</span>
                    <span>Вартість: $0.12</span>
                 </div>
              </div>
           </TacticalCard>
        </div>
      </div>
    </div>
  );
}
