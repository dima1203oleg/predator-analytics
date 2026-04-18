import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Server, 
  Activity, 
  Cpu, 
  Database as DatabaseIcon, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle,
  Bot,
  Layers
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ServiceStatusGrid } from './components/ServiceStatusGrid';
import { StorageChart } from './components/StorageChart';
import { ResourceDynamicsChart } from './components/ResourceDynamicsChart';
import { OODALoopPanel } from './components/OODALoopPanel';
import { BackendSwitcher } from './components/BackendSwitcher';
import { ResourceNodeCard } from './components/ResourceNodeCard';
import { OODAStatus, OODAStep } from './ooda-types';
import { infraApi } from '@/services/api/infra';
import { useAgents } from '@/context/AgentContext';
import { cn } from '@/utils/cn';

export default function InfraView() {
  const { data: infrastructure, isLoading: isInfraLoading, error: infraError } = useQuery({
    queryKey: ['system', 'infrastructure'],
    queryFn: infraApi.getInfrastructure,
    refetchInterval: 15000,
  });

  const { data: nodes, isLoading: isNodesLoading } = useQuery({
    queryKey: ['system', 'nodes'],
    queryFn: infraApi.getNodes,
    refetchInterval: 10000,
  });

  const { data: predictions } = useQuery({
    queryKey: ['system', 'predictions'],
    queryFn: infraApi.getPredictions,
    refetchInterval: 30000,
  });

  const [oodaStatus, setOodaStatus] = React.useState<OODAStatus>('OBSERVING');
  const [activeIncidents, setActiveIncidents] = React.useState<OODAStep[]>([]);
  const [isFullyAutomated, setIsFullyAutomated] = React.useState<boolean>(true);
  const { agents } = useAgents();

  const alertLevel = React.useMemo(() => {
    if (!infrastructure) return 'NORMAL';
    const issues = Object.values(infrastructure.components || {}).filter((c: any) => c.status !== 'UP').length;
    if (issues > 2) return 'CRITICAL';
    if (issues > 0) return 'ELEVATED';
    return 'NORMAL';
  }, [infrastructure]);

  const handleApprove = (id: string) => {
    setActiveIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, human_approval_required: false, status: 'ACTING' } : inc
    ));
    setOodaStatus('ACTING');
  };

  const handleDecline = (id: string) => {
    setActiveIncidents(prev => prev.filter(inc => inc.id !== id));
    setOodaStatus('OBSERVING');
  };

  // Auto-approval in fully automated mode
  React.useEffect(() => {
    if (isFullyAutomated && activeIncidents.length > 0) {
      const pending = activeIncidents.filter(inc => inc.human_approval_required && inc.status === 'DECIDING');
      if (pending.length > 0) {
        const timer = setTimeout(() => {
          pending.forEach(inc => handleApprove(inc.id));
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isFullyAutomated, activeIncidents]);

  // Simple OODA Cycle Simulation
  React.useEffect(() => {
    if (!infrastructure?.components) return;

    const issues = Object.entries(infrastructure.components)
      .filter(([_, comp]) => (comp as any).status !== 'UP')
      .map(([key, comp], idx) => {
        const c = comp as any;
        const agent = agents[idx % agents.length] || { id: 'agent-01', name: 'PREDATOR_CORE', type: 'SYSTEM' };
        
        return {
          id: `inc-${key}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          status: oodaStatus,
          component: key.toUpperCase(),
          finding: c.status === 'DOWN' ? 'Вузол не відповідає на запити.' : 'Спостерігається висока затримка (>50ms).',
          action_plan: c.status === 'DOWN' ? ['Restart service container', 'Check resource limits', 'Notify SRE team'] : ['Optimize queries', 'Flush buffers'],
          automated: true,
          human_approval_required: !isFullyAutomated && idx === 0 && oodaStatus === 'DECIDING', 
          assigned_agent: {
            id: agent.id,
            name: (agent as any).name,
            type: (agent as any).type || 'WATCHER'
          }
        };
      });

    setActiveIncidents(issues as any);
    
    if (issues.length > 0) {
      const cycle = ['OBSERVING', 'ORIENTING', 'DECIDING', 'ACTING'];
      let idx = 0;
      const interval = setInterval(() => {
        setOodaStatus(cycle[idx] as OODAStatus);
        idx = (idx + 1) % cycle.length;
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setOodaStatus('OBSERVING');
    }
  }, [infrastructure, agents, oodaStatus, isFullyAutomated]);

  const isLoading = isInfraLoading || isNodesLoading;
  const error = infraError;

  return (
    <PageTransition>
      <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
        <AdvancedBackground />
        <CyberGrid opacity={0.05} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 h-full w-full flex flex-col"
        >
          <div className="p-6 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between">
            <ViewHeader
              title="Інфраструктура"
              subtitle="Моніторинг NVIDIA Server, MacBook та Google Colab"
              icon={Server}
            />
            
            <div className="flex items-center gap-6">
              <BackendSwitcher />
              
              <div className="h-10 w-px bg-white/10" />

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">РЕЖИМ АВТОМАТИЗАЦІЇ</span>
                <div 
                  onClick={() => setIsFullyAutomated(!isFullyAutomated)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all duration-300",
                    isFullyAutomated 
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
                      : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                  )}
                >
                  <Bot className={cn("w-4 h-4", isFullyAutomated && "animate-pulse")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isFullyAutomated ? "Fully Automated" : "Human in the Loop"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {isLoading && !infrastructure ? (
              <div className="flex items-center justify-center h-full">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                  <RefreshCw className="w-8 h-8 text-yellow-400" />
                </motion.div>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-2xl mx-auto mt-10">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={20} />
                  <span className="font-bold">Помилка завантаження даних інфраструктури:</span>
                  <span>{(error as Error).message}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-7xl mx-auto pb-20">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: Activity, label: 'Статус Сервісів', value: 'Online', color: 'emerald' },
                    { icon: Cpu, label: 'Сумарна RAM', value: '172 GB', color: 'amber' },
                    { icon: DatabaseIcon, label: 'Загальне Сховище', value: '11.5 TB', color: 'yellow' },
                    { icon: ShieldCheck, label: 'Uptime', value: '30 дн.', color: 'violet' },
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn("bg-white/5 border border-white/10 rounded-lg p-5", `border-${stat.color}-500/20`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</div>
                          <div className="text-2xl font-bold text-white mt-1">{stat.value}</div>
                        </div>
                        <div className={cn("p-3 rounded-full bg-white/5", `text-${stat.color}-400`)}>
                          <stat.icon className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Hardare Nodes Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                      <Layers className="text-blue-500 w-6 h-6" /> 
                      Моніторинг Апаратних Вузлів
                    </h2>
                    <span className="text-[10px] text-slate-500 font-mono">3 СИСТЕМИ ВИЯВЛЕНО</span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {nodes?.map((node: any) => (
                      <ResourceNodeCard key={node.id} node={node} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-400" /> Динаміка Ресурсів (24г)
                      </h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">Моніторинг CPU та RAM у часі</p>
                      <ResourceDynamicsChart />
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <DatabaseIcon className="w-5 h-5 text-yellow-400" /> БД та Сховища
                      </h3>
                      {infrastructure?.components ? (
                        <ServiceStatusGrid data={infrastructure.components} />
                      ) : (
                        <div className="text-slate-500 text-sm">Дані відсутні</div>
                      )}
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <DatabaseIcon className="w-5 h-5 text-yellow-400" /> Розподіл Сховища
                      </h3>
                      <StorageChart />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="bg-black/60 border border-white/10 rounded-xl p-6 backdrop-blur-md shadow-2xl">
                      <OODALoopPanel 
                        currentStatus={oodaStatus} 
                        activeIncidents={activeIncidents} 
                        alertLevel={alertLevel as any}
                        onApprove={handleApprove}
                        onDecline={handleDecline}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
