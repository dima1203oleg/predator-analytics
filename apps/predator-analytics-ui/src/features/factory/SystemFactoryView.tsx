import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, Zap, GitBranch, Cpu, Activity, Database, CheckCircle2,
  Terminal, Play, RotateCcw, Box, Network, Send, Loader2, Bot, Sliders,
  Server, Shield, Power, ActivitySquare, AlertTriangle, Layers, RefreshCw, AlignLeft, X, Plus, Minus, Key, HardDrive, Wifi
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/TacticalCard';
import { cn } from '@/utils/cn';

interface FactoryMessage {
  id: string;
  sender: 'user' | 'system';
  text: string;
  timestamp: Date;
  action?: 'build' | 'test' | 'deploy' | 'analyze' | 'kubectl';
}

interface K8sPod {
  id: string;
  name: string;
  status: 'Running' | 'Pending' | 'Terminating' | 'Restarting';
  restarts: number;
  replicas: number;
  cpu: string;
  mem: string;
  uptime: string;
}

export default function SystemFactoryView() {
  const [messages, setMessages] = useState<FactoryMessage[]>([
    {
      id: 'msg-0',
      sender: 'system',
      text: 'ЗАВОД PREDATOR v55.1 ІНІЦІАЛІЗОВАНО. Очікую команд для управління K8s кластером, архітектурою або CI/CD.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stats
  const [pipelineProgress, setPipelineProgress] = useState(100);
  const [systemScore, setSystemScore] = useState({ quality: 98, coverage: 94, security: 100 });
  const [activeTab, setActiveTab] = useState<'cicd' | 'k8s' | 'network'>('k8s');

  // K8s Pods State
  const [pods, setPods] = useState<K8sPod[]>([
    { id: 'core-api-8f4b', name: 'predator-core-api', status: 'Running', restarts: 0, replicas: 2, cpu: '112m', mem: '450Mi', uptime: '4d 12h' },
    { id: 'graph-worker-2d1', name: 'predator-graph-worker', status: 'Running', restarts: 1, replicas: 1, cpu: '8m', mem: '210Mi', uptime: '1d 4h' },
    { id: 'ingest-5c9a', name: 'predator-ingestion', status: 'Running', restarts: 0, replicas: 3, cpu: '340m', mem: '1.2Gi', uptime: '4d 12h' },
    { id: 'ui-front-v55', name: 'predator-ui-frontend', status: 'Running', restarts: 0, replicas: 1, cpu: '12m', mem: '80Mi', uptime: '8h' },
  ]);

  const [logsPodId, setLogsPodId] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView();
  }, [liveLogs]);

  useEffect(() => {
    if (!logsPodId) return;
    const pod = pods.find(p => p.id === logsPodId);
    
    setLiveLogs([
      `[PREDATOR K8S] Initiating tail for pod ${pod?.name} (${pod?.id})`,
      `[PREDATOR K8S] Connecting to container runtime... OK`,
    ]);

    const interval = setInterval(() => {
      setLiveLogs(prev => {
        const newLog = `[${new Date().toISOString().split('T')[1].slice(0, -1)}] INFO: Streaming live metrics and trace logs [TraceID: ${Math.random().toString(36).substr(2, 6)}]`;
        return [...prev, newLog].slice(-50); // Keep last 50
      });
    }, 800);

    return () => clearInterval(interval);
  }, [logsPodId]);

  const handleScalePod = (podId: string) => {
    setPods(pds => pds.map(p => p.id === podId ? { ...p, replicas: p.replicas + 1 } : p));
    const sysMsg: FactoryMessage = {
      id: `sys-pod-scale-${Date.now()}`,
      sender: 'system',
      text: `Збільшую кількість реплік (Scale Up) для поду [${podId}]. HPA контролер оновлено.`,
      timestamp: new Date(),
      action: 'kubectl'
    };
    setMessages(prev => [...prev, sysMsg]);
  };

  const handleScaleDownPod = (podId: string) => {
    setPods(pds => pds.map(p => p.id === podId && p.replicas > 0 ? { ...p, replicas: p.replicas - 1 } : p));
    const sysMsg: FactoryMessage = {
      id: `sys-pod-scaledown-${Date.now()}`,
      sender: 'system',
      text: `Зменшую кількість реплік (Scale Down) для поду [${podId}]. HPA контролер оновлено.`,
      timestamp: new Date(),
      action: 'kubectl'
    };
    setMessages(prev => [...prev, sysMsg]);
  };

  const handleShowLogs = (podId: string) => {
    setLogsPodId(podId);
  };

  const handlePodRestart = (podId: string) => {
    setPods(pds => pds.map(p => p.id === podId ? { ...p, status: 'Restarting' } : p));
    
    const sysMsg: FactoryMessage = {
      id: `sys-pod-${Date.now()}`,
      sender: 'system',
      text: `Ініційовано перезапуск поду [${podId}]. Відправляю SIGTERM...`,
      timestamp: new Date(),
      action: 'kubectl'
    };
    setMessages(prev => [...prev, sysMsg]);

    setTimeout(() => {
      setPods(pds => pds.map(p => p.id === podId ? { ...p, status: 'Running', restarts: p.restarts + 1, uptime: '0m' } : p));
      setMessages(prev => [...prev, {
        id: `sys-pod-done-${Date.now()}`,
        sender: 'system',
        text: `Под [${podId}] успішно перезапущено (Running). Ресурси перерозподілено.`,
        timestamp: new Date()
      }]);
    }, 4000);
  };

  const parseNaturalCommand = (text: string) => {
    const lower = text.toLowerCase();
    
    // Pod specific commands
    if (lower.includes('перезапусти') || lower.includes('рестарт')) {
      if (lower.includes('api') || lower.includes('core')) {
        handlePodRestart('core-api-8f4b');
        return;
      }
      if (lower.includes('graph') || lower.includes('граф')) {
        handlePodRestart('graph-worker-2d1');
        return;
      }
      if (lower.includes('всі') || lower.includes('all')) {
         pods.forEach(p => handlePodRestart(p.id));
         return;
      }
      return 'Не вказано конкретний сервіс. Уточніть (напр: "Перезапусти API").';
    }

    if (lower.includes('масштабуй') || lower.includes('скейл') || lower.includes('scale')) {
       if (lower.includes('api') || lower.includes('core')) { handleScalePod('core-api-8f4b'); return; }
       if (lower.includes('ingest') || lower.includes('дані')) { handleScalePod('ingest-5c9a'); return; }
       return 'Збільшую кількість реплік (scale) загально через HPA контролер до цільового рівня...';
    }

    if (lower.includes('менше') || lower.includes('даун') || lower.includes('зменш')) {
       if (lower.includes('api') || lower.includes('core')) { handleScaleDownPod('core-api-8f4b'); return; }
       if (lower.includes('ingest') || lower.includes('дані')) { handleScaleDownPod('ingest-5c9a'); return; }
    }

    if (lower.includes('лог') || lower.includes('logs')) {
       if (lower.includes('api') || lower.includes('core')) { handleShowLogs('core-api-8f4b'); return 'Підключаю WebSocket до stdout поду API...'; }
       return 'Вкажіть підсистему для перегляду логів (напр. "покажи логи API").';
    }

    if (lower.includes('кеш') || lower.includes('cache')) {
       return { action: 'deploy', reply: 'ВІДПРАВЛЕНО КОМАНДУ `FLUSHALL` НА REDIS КЛАСТЕР. Кеш очищено.' };
    }
    
    if (lower.includes('секрет') || lower.includes('secret')) {
       return { action: 'analyze', reply: 'Ініційовано ротацію Kubernetes Secrets. Застосовано новий TLS сертифікат.' };
    }

    // Pipeline commands
    if (lower.includes('тест') || lower.includes('перевір')) {
      return { action: 'test', reply: 'Запускаю матрицю інтеграційних тестів та E2E перевірок.' };
    } 
    if (lower.includes('білд') || lower.includes('збір')) {
      setPipelineProgress(0);
      return { action: 'build', reply: 'Ініційовано процес збірки Docker образів та CI. Контекст оновлено.' };
    } 
    if (lower.includes('деплой') || lower.includes('запусти')) {
      return { action: 'deploy', reply: 'Синхронізація з ArgoCD. GitOps update активовано.' };
    }
    
    // Generic chat response
    setSystemScore(prev => ({ ...prev, quality: Math.min(100, prev.quality + 1) }));
    return { action: 'analyze', reply: 'Команда прийнята. Аналізую топологію кластера та конфігурації для оптимізації.' };
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const newMsg: FactoryMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    const cmdText = inputText;
    setInputText('');
    setIsProcessing(true);

    setTimeout(() => {
      const result = parseNaturalCommand(cmdText);
      
      if (typeof result === 'string') {
        const sysMsg: FactoryMessage = {
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: result,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, sysMsg]);
      } else if (result) {
        setMessages(prev => [...prev, {
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: result.reply,
          timestamp: new Date(),
          action: result.action as any
        }]);

        if (result.action === 'build') {
          const iv = setInterval(() => {
            setPipelineProgress(p => {
              if (p >= 100) {
                clearInterval(iv);
                setMessages(prev => [...prev, {
                  id: `sys-${Date.now()}-done`,
                  sender: 'system',
                  text: 'ЗБІРКА УСПІШНО ЗАВЕРШЕНА. Всі тести пройдено.',
                  timestamp: new Date()
                }]);
                return 100;
              }
              return p + 10;
            });
          }, 400);
        }
      }
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700">
      <AdvancedBackground />
      
      <ViewHeader 
        title="СУВЕРЕННИЙ ЗАВОД (FACTORY)"
        subtitle="Інтерактивне управління Kubernetes кластером, CI/CD конвеєром та AI Координатор."
        icon={<Factory size={24} className="text-indigo-400" />}
        breadcrumbs={['ПРЕДАТОР', 'АДМІНІСТРУВАННЯ', 'ЗАВОД']}
        stats={[
          { label: 'Стан кластера', value: pods.some(p => p.status !== 'Running') ? 'СИНХРОНІЗАЦІЯ' : 'ЗДОРОВИЙ', icon: <Server size={14} />, color: pods.some(p => p.status !== 'Running') ? 'warning' : 'success' },
          { label: 'Quality Shore', value: `${systemScore.quality}%`, icon: <CheckCircle2 size={14}/>, color: 'primary' },
          { label: 'Рівень Безпеки', value: `HR-00`, icon: <Shield size={14}/>, color: 'danger' }
        ]}
      />

      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Factory Dashboards */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Custom Tabs */}
          <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
             <button 
               onClick={() => setActiveTab('k8s')}
               className={cn("flex whitespace-nowrap items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all", activeTab === 'k8s' ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.3)]" : "bg-white/5 text-slate-400 hover:bg-white/10")}
             >
                <Layers size={16} /> KUBERNETES КЛАСТЕР 
             </button>
             <button 
               onClick={() => setActiveTab('network')}
               className={cn("flex whitespace-nowrap items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all", activeTab === 'network' ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]" : "bg-white/5 text-slate-400 hover:bg-white/10")}
             >
                <Wifi size={16} /> МЕРЕЖА / ТОПОЛОГІЯ
             </button>
             <button 
               onClick={() => setActiveTab('cicd')}
               className={cn("flex whitespace-nowrap items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all", activeTab === 'cicd' ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5 text-slate-400 hover:bg-white/10")}
             >
                <GitBranch size={16} /> CI/CD КОНВЕЄР
             </button>
          </div>

          <AnimatePresence mode="wait">
             {activeTab === 'k8s' && (
               <motion.div key="k8s" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                  
                  <TacticalCard title="ІНТЕРАКТИВНА ТОПОЛОГІЯ ПОДІВ (PODS)" variant="cyber">
                     <div className="p-0">
                        <table className="w-full text-left border-collapse">
                           <thead>
                             <tr className="border-b border-white/5 bg-black/40 text-[9px] uppercase tracking-widest text-slate-500">
                               <th className="p-4 font-black">Підсистема (Pod)</th>
                               <th className="p-4 font-black">Статус</th>
                               <th className="p-4 font-black">Ресурси</th>
                               <th className="p-4 font-black">Дії (Actions)</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                             {pods.map(pod => (
                               <tr key={pod.id} className="hover:bg-white/5 transition-colors group">
                                  <td className="p-4">
                                     <div className="flex items-center gap-3">
                                        <div className={cn("w-2 h-2 rounded-full", pod.status === 'Running' ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-amber-500 animate-pulse")} />
                                        <div>
                                           <div className="text-[13px] font-bold text-white flex items-center gap-2">
                                              {pod.name} 
                                              <span className="text-[9px] font-black tracking-widest bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-indigo-400">×{pod.replicas}</span>
                                           </div>
                                           <div className="text-[9px] font-mono text-slate-500 mt-1">ID: {pod.id} • Уптайм: {pod.uptime}</div>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="p-4">
                                     <span className={cn(
                                       "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border",
                                       pod.status === 'Running' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                     )}>
                                        {pod.status === 'Restarting' ? <RefreshCw size={10} className="inline mr-1 animate-spin" /> : null}
                                        {pod.status}
                                     </span>
                                     {pod.restarts > 0 && <div className="text-[9px] text-slate-500 mt-1 ml-1 cursor-help" title={`Restarts: ${pod.restarts}`}>↻ {pod.restarts}</div>}
                                  </td>
                                  <td className="p-4">
                                     <div className="flex flex-col gap-1">
                                        <div className="text-[10px] font-mono"><span className="text-indigo-400">CPU:</span> {pod.cpu}</div>
                                        <div className="text-[10px] font-mono"><span className="text-violet-400">MEM:</span> {pod.mem}</div>
                                     </div>
                                  </td>
                                  <td className="p-4">
                                     <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => handlePodRestart(pod.id)}
                                          disabled={pod.status !== 'Running'}
                                          className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 flex flex-col items-center justify-center hover:border-rose-500/50 rounded-lg border border-transparent transition-all disabled:opacity-50" title="Надіслати SIGTERM (Перезапуск)"
                                        >
                                           <Power size={14} />
                                        </button>
                                        <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-transparent">
                                          <button 
                                            onClick={() => handleScalePod(pod.id)}
                                            className="p-2 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all border-r border-white/5" title="Масштабувати (Scale Up)"
                                          >
                                             <Plus size={14} />
                                          </button>
                                          <button 
                                            onClick={() => handleScaleDownPod(pod.id)}
                                            disabled={pod.replicas <= 1}
                                            className="p-2 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit" title="Зменшити (Scale Down)"
                                          >
                                             <Minus size={14} />
                                          </button>
                                        </div>
                                        <button 
                                          onClick={() => handleShowLogs(pod.id)}
                                          className="p-2 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 rounded-lg border border-transparent transition-all" title="Live Логи"
                                        >
                                           <AlignLeft size={14} />
                                        </button>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                           </tbody>
                        </table>
                     </div>
                  </TacticalCard>

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
                              <button onClick={() => setLogsPodId(null)} className="text-slate-500 hover:text-white transition-colors">
                                 <X size={16} />
                              </button>
                           </div>
                           <div className="flex-1 p-4 font-mono text-[11px] text-emerald-400/80 overflow-y-auto custom-scrollbar">
                              {liveLogs.map((log, index) => (
                                 <div key={index} className="mb-0.5 break-all">
                                    {log.includes('INFO') ? <span className="text-blue-400">{log.substring(0, 15)}</span> : <span className="text-slate-500">{log.substring(0, 15)}</span>}
                                    {log.substring(15)}
                                 </div>
                              ))}
                              <div ref={logsEndRef} />
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </motion.div>
             )}

             {activeTab === 'network' && (
               <motion.div key="network" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                  <TacticalCard title="ТОПОЛОГІЯ МЕРЕЖІ ТА ІНФРАСТРУКТУРА" variant="cyber">
                     <div className="p-8 relative min-h-[300px] flex items-center justify-center">
                        <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
                        
                        <div className="relative w-full max-w-3xl flex justify-between items-center z-10">
                           {/* Frontend Section */}
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 rounded-xl bg-cyan-500/10 border-2 border-cyan-500 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                 <Network size={24} />
                              </div>
                              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest mt-2">Nginx / UI</span>
                           </div>

                           <div className="h-1 flex-1 bg-gradient-to-r from-cyan-500 to-indigo-500 mx-4 opacity-50 relative">
                              <span className="absolute -top-4 w-full text-center text-[9px] text-slate-400 font-mono tracking-widest">TLS / WAF</span>
                           </div>

                           {/* Core API */}
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500 flex flex-col items-center justify-center text-indigo-400 relative shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                                 <span className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full animate-pulse border border-black shadow-[0_0_5px_#10b981]" />
                                 <Server size={32} />
                                 <span className="text-[8px] mt-1 font-black leading-none uppercase">API Gateway</span>
                              </div>
                              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-2">Core API</span>
                           </div>

                           <div className="h-1 flex-1 bg-gradient-to-r from-indigo-500 to-rose-500 mx-4 opacity-50 relative flex flex-col items-center">
                              <span className="absolute -top-4 w-full text-center text-[9px] text-slate-400 font-mono tracking-widest">gRPC / NAT</span>
                           </div>

                           {/* Databases */}
                           <div className="flex flex-col gap-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/50 flex items-center justify-center text-orange-400">
                                    <Database size={20} />
                                 </div>
                                 <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest">PostgreSQL</span>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-lg bg-rose-500/10 border border-rose-500/50 flex items-center justify-center text-rose-400">
                                    <ActivitySquare size={20} />
                                 </div>
                                 <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Neo4j</span>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                                    <Zap size={20} />
                                 </div>
                                 <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Redis Cache</span>
                              </div>
                           </div>
                        </div>

                     </div>
                     <div className="grid grid-cols-3 border-t border-white/5 bg-black/40 p-4">
                        <div className="flex flex-col gap-1 items-center border-r border-white/5">
                           <Key size={14} className="text-amber-400 mb-1" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">K8s Secrets</span>
                           <span className="text-xs font-mono text-white">ACTIVE (Synced)</span>
                        </div>
                        <div className="flex flex-col gap-1 items-center border-r border-white/5">
                           <HardDrive size={14} className="text-violet-400 mb-1" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Persistent Vol</span>
                           <span className="text-xs font-mono text-white">4 / 4 Mounted</span>
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                           <Shield size={14} className="text-emerald-400 mb-1" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Policies</span>
                           <span className="text-xs font-mono text-white">Strict (Default Deny)</span>
                        </div>
                     </div>
                  </TacticalCard>
               </motion.div>
             )}

             {activeTab === 'cicd' && (
               <motion.div key="cicd" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                  <TacticalCard title="КОНВЕЄР ВДОСКОНАЛЕННЯ СИСТЕМИ" variant="cyber">
                    <div className="p-6 relative overflow-hidden">
                       <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
                       <div className="relative z-10 grid grid-cols-4 gap-4 items-center">
                          {[
                            { name: 'Аналіз & Лінтер', state: pipelineProgress >= 20, icon: SearchIcon },
                            { name: 'Збірка Образів', state: pipelineProgress >= 50, icon: Box },
                            { name: 'GitOps Оновлення', state: pipelineProgress >= 80, icon: GitBranch },
                            { name: 'ArgoCD Синхр.', state: pipelineProgress === 100, icon: RotateCcw }
                          ].map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3 relative">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 z-10",
                                step.state ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-slate-900 border-slate-700 text-slate-500"
                              )}>
                                <step.icon size={20} />
                              </div>
                              <div className="text-[10px] font-black uppercase text-center text-slate-400">{step.name}</div>
                              {idx !== 3 && (
                                <div className="absolute top-6 left-[60%] w-[80%] h-0.5 bg-slate-800 -z-10">
                                   <motion.div 
                                     initial={{ width: 0 }} 
                                     animate={{ width: step.state ? '100%' : '0%' }} 
                                     className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                                   />
                                </div>
                              )}
                            </div>
                          ))}
                       </div>
                       
                       <div className="mt-8 grid grid-cols-3 gap-4">
                          <div className="bg-slate-900/50 p-4 border border-indigo-500/20 rounded-xl relative overflow-hidden group">
                             <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-1000" style={{ width: `${systemScore.quality}%` }} />
                             <div className="text-[10px] text-slate-500 uppercase font-black">Якість Коду (Sonar)</div>
                             <div className="text-2xl font-black text-indigo-400 mt-1">{systemScore.quality}%</div>
                          </div>
                          <div className="bg-slate-900/50 p-4 border border-violet-500/20 rounded-xl relative overflow-hidden group">
                             <div className="absolute bottom-0 left-0 h-1 bg-violet-500 transition-all duration-1000" style={{ width: `${systemScore.coverage}%` }} />
                             <div className="text-[10px] text-slate-500 uppercase font-black">Тестове Покриття</div>
                             <div className="text-2xl font-black text-violet-400 mt-1">{systemScore.coverage}%</div>
                          </div>
                          <div className="bg-slate-900/50 p-4 border border-rose-500/20 rounded-xl relative overflow-hidden group">
                             <div className="absolute bottom-0 left-0 h-1 bg-rose-500 transition-all duration-1000" style={{ width: `${systemScore.security}%` }} />
                             <div className="text-[10px] text-slate-500 uppercase font-black">Security (Trivy + OPA)</div>
                             <div className="text-2xl font-black text-rose-400 mt-1">{systemScore.security}%</div>
                          </div>
                       </div>
                    </div>
                  </TacticalCard>
               </motion.div>
             )}
          </AnimatePresence>

        </div>

        {/* Right Column: AI Natural Language Factory Controller */}
        <div className="lg:col-span-4 flex flex-col h-[700px]">
           <TacticalCard title="АВТОНОМНИЙ ЧАТ-КООРДИНАТОР" variant="holographic" className="flex-1 flex flex-col h-full relative border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
             {/* Chat History */}
             <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-black/40">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-xl relative",
                        msg.sender === 'user' 
                          ? "bg-gradient-to-br from-indigo-600 to-indigo-800 border-indigo-400/30 text-indigo-50 ml-6 rounded-tr-none shadow-lg" 
                          : "bg-slate-900 border border-emerald-500/20 text-emerald-100 mr-6 rounded-tl-none font-mono text-[13px] shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                      )}
                    >
                       {msg.sender === 'system' && (
                         <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-slate-950 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                            <Bot size={16} className="text-emerald-400" />
                         </div>
                       )}
                       <span className="leading-relaxed">{msg.text}</span>
                       {msg.action && (
                         <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-[10px] text-white font-black tracking-widest w-fit animate-pulse">
                           <Terminal size={12} className={msg.action === 'kubectl' ? "text-rose-400" : "text-emerald-400"} /> 
                           DIAGNOSTIC_ACTION: {msg.action.toUpperCase()}
                         </div>
                       )}
                    </motion.div>
                  ))}
                  {isProcessing && (
                     <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-slate-900 border border-slate-700 text-slate-400 p-4 rounded-xl mr-8 font-mono text-[11px] flex items-center gap-3 w-fit"
                     >
                        <Loader2 size={16} className="animate-spin text-indigo-500" /> 
                        <span className="tracking-widest uppercase">Аналіз Нейролінком...</span>
                     </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
             </div>

             {/* Input Form */}
             <div className="p-4 bg-slate-950/90 border-t border-indigo-500/20 mt-auto">
                <form onSubmit={handleCommand} className="relative group">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Направити координатора (напр: 'Перезапусти API', 'Масштабуй воркер')..."
                    className="w-full bg-black/60 border border-indigo-500/30 group-focus-within:border-indigo-400 rounded-2xl py-5 pl-5 pr-14 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono shadow-inner"
                    spellCheck="false"
                  />
                  <button 
                    type="submit" 
                    disabled={!inputText.trim() || isProcessing}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 text-white disabled:bg-slate-800 disabled:shadow-none disabled:text-slate-600 transition-all"
                  >
                     <Send size={18} className={cn(inputText.trim() && !isProcessing && "translate-x-0.5")} />
                  </button>
                </form>
             </div>
           </TacticalCard>
        </div>

      </div>
    </div>
  );
}

const SearchIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
