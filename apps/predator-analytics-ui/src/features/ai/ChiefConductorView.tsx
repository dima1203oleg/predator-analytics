import { Button } from '@/components/ui/button';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Zap, GitMerge, Network, Activity, HardDrive, 
  Search, Terminal, Play, Square, RefreshCw, Layers,
  ListFilter, AlertCircle, CheckCircle2, Orbit, Clock,
  Bot, ShieldCheck, Microscope, Database
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HoloCard } from '@/components/ui/HoloCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { factoryApi, type AntigravityTask } from '@/services/api/factory';
import { useAgentsStats, useChaosStatus, useSetChaosExperiment } from '@/hooks/useAdminApi';
import type { ChaosExperimentName } from '@/services/adminApi';

const AGENT_ICON_MAP: Record<string, any> = {
  orchestrator: Bot,
  analyst: Network,
  coder: Terminal,
  qa: ShieldCheck,
  researcher: Search,
  worker: Database,
  architect: Microscope,
  surgeon: Zap,
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in_progress': return 'text-yellow-500';
    case 'completed': return 'text-emerald-500';
    case 'failed': return 'text-cyan-500';
    case 'pending': return 'text-slate-400';
    default: return 'text-slate-500';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical': return 'bg-cyan-500/20 text-cyan-500 border-cyan-500/20';
    case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/20';
    case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/20';
  }
};

export default function ChiefConductorView() {
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['antigravity', 'tasks'],
    queryFn: factoryApi.getAntigravityTasks,
    refetchInterval: 5000,
  });

  const { data: agentData, isLoading: agentsLoading } = useAgentsStats();
  const { data: chaosStatus } = useChaosStatus();
  const setChaos = useSetChaosExperiment();

  const activeTasksCount = tasks?.filter(t => t.status === 'in_progress' || t.status === 'pending').length || 0;

  return (
    <div className="p-10 space-y-12 bg-slate-950 min-h-screen selection:bg-yellow-500/30">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-3"
          >
            <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
              <Orbit className="text-yellow-500 animate-spin-slow" size={24} />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Chief Conductor</h2>
          </motion.div>
          <p className="text-slate-500 font-medium text-xs tracking-widest uppercase ml-14">
            Глобальний AGI-оркестратор автономних циклів розробки
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right mr-4 hidden sm:block">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Активні задачі</div>
            <div className="text-2xl font-black text-yellow-500 italic tabular-nums">{activeTasksCount}</div>
          </div>
          <Button variant="cyber" className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-tighter">
            <Play size={14} fill="currentColor" /> Нова Задача
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <HoloCard className="rounded-[48px] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#c9a227]/10 rounded-lg">
                <ListFilter size={18} className="text-[#c9a227]" />
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Очередь AGI-Задач</h4>
            </div>
            <div className="flex items-center justify-between mb-8 px-4">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full " />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Синхронізація: Active</span>
               </div>
               <div className="flex items-center gap-2">
                  <Button variant="cyber" className="p-2 text-slate-500 hover:text-white transition-colors"><ListFilter size={16} /></Button>
                  <Button variant="cyber" className="p-2 text-slate-500 hover:text-white transition-colors"><RefreshCw size={16} /></Button>
               </div>
            </div>

            <div className="space-y-6">
               <AnimatePresence mode="popLayout">
               {tasksLoading ? (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-4">
                    <RefreshCw className="animate-spin" size={32} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Завантаження задач...</span>
                 </div>
               ) : tasks?.length === 0 ? (
                 <div className="text-center py-20 text-slate-600 italic">Задач не виявлено</div>
               ) : tasks?.map((task) => (
                  <motion.div 
                    key={task.task_id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 bg-black/40 border border-white/5 rounded-[32px] hover:border-yellow-500/20 transition-all group"
                  >
                     <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                           <div className="flex items-center gap-3">
                              <Badge variant="outline" className={cn("rounded-lg font-black italic", getPriorityColor(task.priority))}>
                                 {task.priority.toUpperCase()}
                              </Badge>
                              <span className={cn("text-[9px] font-black uppercase tracking-widest italic", getStatusColor(task.status))}>
                                 {task.status.replace('_', ' ')}
                              </span>
                           </div>
                           
                           <div>
                              <h3 className="text-lg font-bold text-white tracking-tight leading-tight mb-2">{task.description}</h3>
                              <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
                                 <span className="flex items-center gap-2"><Clock size={12} /> {new Date(task.created_at).toLocaleString('uk-UA')}</span>
                                 <span className="font-mono text-slate-700">ID: {task.task_id}</span>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <div className="flex justify-between items-end">
                                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                    {task.progress || 'Очікування початку...'}
                                 </div>
                                 <div className="text-xl font-black text-white italic tracking-tighter">
                                    {task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '45%' : '0%'}
                                 </div>
                              </div>
                              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '45%' : '0%' }}
                                   transition={{ duration: 1.5, ease: "easeOut" }}
                                   className={cn(
                                     "h-full rounded-full shadow-lg",
                                     task.status === 'in_progress' ? "bg-yellow-500 shadow-yellow-500/50" : 
                                     task.status === 'completed' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-slate-700"
                                   )}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col gap-2">
                           <Button variant="cyber" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><Terminal size={16} /></Button>
                           <Button variant="cyber" className="p-3 bg-white/5 hover:bg-cyan-500/20 rounded-xl text-slate-500 hover:text-cyan-500 transition-all"><Square size={16} /></Button>
                        </div>
                     </div>
                  </motion.div>
               ))}
               </AnimatePresence>
            </div>
          </HoloCard>
        </div>

        <div className="space-y-8">
           <HoloCard variant="gold" className="rounded-[40px] p-8">
             <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-[#c9a227]/10 rounded-lg">
                 <Bot size={18} className="text-[#c9a227]" />
               </div>
               <h4 className="text-sm font-black text-white uppercase tracking-tight">Swarm Registry</h4>
             </div>
              <div className="space-y-6">
                 {agentsLoading ? (
                    <div className="text-center py-10 text-slate-600  italic">Синхронізація реєстру...</div>
                 ) : agentData?.list?.map((agent: any) => {
                    const Icon = AGENT_ICON_MAP[agent.type] || Bot;
                    return (
                      <div key={agent.id} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl group hover:border-yellow-500/20 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-900 rounded-xl text-slate-500 group-hover:text-yellow-500 transition-all">
                               <Icon size={20} />
                            </div>
                            <div>
                               <div className="text-[11px] font-black text-white uppercase tracking-widest">{agent.name}</div>
                               <div className={cn(
                                 "text-[8px] font-black uppercase tracking-widest mt-0.5",
                                 agent.status === 'alive' ? "text-emerald-500" : "text-slate-500"
                               )}>{agent.status === 'alive' ? 'ACTIVE' : 'IDLE'}</div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-lg font-black text-slate-300 italic tabular-nums">{agent.cpu}%</div>
                            <div className="text-[7px] font-black text-slate-700 uppercase tracking-widest">CPU LOAD</div>
                         </div>
                      </div>
                    );
                 })}
              </div>
           </HoloCard>

           <HoloCard variant="gold" className="p-8 rounded-[36px]">
              <div className="flex items-center gap-5 mb-6">
                 <div className="p-3 bg-yellow-600/20 rounded-2xl text-yellow-500">
                    <Activity size={20} />
                  </div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">OODA Telemetry</h4>
              </div>
              <div className="space-y-3">
                 <div className="text-xs text-slate-400 italic">Ланцюжок рішення:</div>
                 <div className="p-4 bg-black/60 rounded-2xl border border-white/5 font-mono text-[10px] text-yellow-500/80">
                    {"planner -> agent:surgeon -> council:review -> git:push -> node:end"}
                 </div>
                 <div className="flex justify-between items-center text-[9px] font-black text-slate-700 uppercase tracking-widest mt-4">
                    <span>VRAM: {agentData?.stats?.usedVram || '0'} / {agentData?.stats?.totalVram || '0'} GB</span>
                    <span>Nodes: {agentData?.stats?.alive || '0'}</span>
                 </div>
              </div>
           </HoloCard>

           <HoloCard className="p-8 rounded-[36px]">
             <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-cyan-500/10 rounded-lg">
                 <Zap size={18} className="text-cyan-500" />
               </div>
               <h4 className="text-sm font-black text-white uppercase tracking-tight">Chaos Scenario</h4>
             </div>
              <div className="flex items-center gap-5 mb-6">
                 <div className="p-3 bg-cyan-600/20 rounded-2xl text-cyan-500">
                    <Zap size={20} />
                 </div>
                 <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">Хаос-Експерименти</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { id: 'db_latency', label: 'DB Latency' },
                   { id: 'cache_failure', label: 'Cache Fail' },
                   { id: 'random_errors', label: '500 Errors' },
                   { id: 'llm_hallucination', label: 'LLM Halluc' },
                   { id: 'agent_timeout', label: 'Timeout' },
                   { id: 'overheat_simulation', label: 'Overheat' },
                 ].map((exp) => (
                   <Button variant="cyber" 
                     key={exp.id}
                     onClick={() => setChaos.mutate({ name: exp.id as ChaosExperimentName, active: !chaosStatus?.[exp.id as ChaosExperimentName] })}
                     className={cn(
                       "p-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all text-center",
                       chaosStatus?.[exp.id as ChaosExperimentName] 
                         ? "bg-cyan-500 text-white border-cyan-400 " 
                         : "bg-black/40 text-slate-500 border-white/5 hover:border-cyan-500/30"
                     )}
                   >
                     {exp.label}
                   </Button>
                 ))}
              </div>
           </HoloCard>
        </div>
      </div>
    </div>
  );
}
