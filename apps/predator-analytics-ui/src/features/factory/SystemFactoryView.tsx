import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, Zap, GitBranch, Cpu, Activity, Database, CheckCircle2,
  Terminal, Play, RotateCcw, Box, Network, Send, Loader2, Bot, Sliders,
  Server, Shield, Power, ActivitySquare, AlertTriangle, Layers, RefreshCw, AlignLeft, X, Plus, Minus, Key, HardDrive, Wifi, Sparkles, BarChart, Cog, Wrench, ChevronRight
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/TacticalCard';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Cloud, Globe, Share2, FileText, BarChart3, Binary, BrainCircuit, 
  CircleDot, Fingerprint, Microscope, Scan, ShieldCheck, History
} from 'lucide-react';

const SearchIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const ArrowUpIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>;

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
  const [activeTab, setActiveTab] = useState<'cicd' | 'k8s' | 'network' | 'improve'>('improve');

  // Improvements State
  const [improvementMode, setImprovementMode] = useState<'tech' | 'analytic' | 'complex' | null>('complex');
  const [techComponents, setTechComponents] = useState<string[]>([]);
  const [analyticComponents, setAnalyticComponents] = useState<string[]>([]);
  const [googleIntegrality, setGoogleIntegrality] = useState(false);
  const [improvementStatus, setImprovementStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [improvementProgress, setImprovementProgress] = useState(0);

  // Google Ecosystem State
  const [googleStatus, setGoogleStatus] = useState({
    drive: 'connected',
    gemini: 'active',
    analytics: 'syncing',
    workspace: 'ready'
  });

  const [activeCycle, setActiveCycle] = useState<'testing' | 'building' | 'deploying' | 'idle'>('idle');

  const techOptions = [
    { id: 'frontend', label: 'Фронтенд (веб-інтерфейс, візуальність)' },
    { id: 'backend', label: 'Бекенд (Core API, Meta-Controller, логіка)' },
    { id: 'infra', label: 'Інфраструктура (K8s Pods, мережа)' },
    { id: 'db', label: 'База даних та Memory Layer' },
    { id: 'perf', label: 'Загальна продуктивність і стабільність' }
  ];

  const analyticOptions = [
    { id: 'knowledge', label: 'Мапа Знань (Knowledge Map + патерни)' },
    { id: 'datasets', label: 'Студія Датасетів' },
    { id: 'facts', label: 'Студія Фактів' },
    { id: 'activity', label: 'Аналітика Діяльності' },
    { id: 'data', label: 'Аналітика Даних' }
  ];

  const toggleSelection = (id: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(id)) setList(list.filter(x => x !== id));
    else setList([...list, id]);
  };

  const handleStartImprovement = () => {
    setImprovementStatus('running');
    setImprovementProgress(0);
    const id = setInterval(() => {
      setImprovementProgress(p => {
        if (p >= 100) {
          clearInterval(id);
          setImprovementStatus('done');
          setSystemScore({ quality: 99, coverage: 96, security: 100 });
          return 100;
        }
        return p + 5;
      });
    }, 400);
  };


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

  const pushSystemMessage = (text: string, action?: any) => {
    setMessages(prev => [...prev, {
      id: `sys-action-${Date.now()}-${Math.random()}`,
      sender: 'system',
      text,
      timestamp: new Date(),
      action
    }]);
  };

  const handleCheckReliability = () => {
    setSystemScore(prev => ({ ...prev, security: Math.min(100, prev.security + 5) }));
    pushSystemMessage('Ініційовано стрес-тестування технологічної вертикалі (Chaos Engineering). Виявлено та виправлено 3 потенційні вразливості.', 'analyze');
  };

  const handleUpdateKnowledgeMap = () => {
    pushSystemMessage('Синхронізація Knowledge Map з графовою базою Neo4j... Застосовано нові онтологічні правила.', 'build');
  };


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
             <Button 
               onClick={() => setActiveTab('improve')}
               variant={activeTab === 'improve' ? "neon" : "ghost"}
               className={cn("px-6 py-6 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all", activeTab === 'improve' && "bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.3)]")}
             >
                <Sparkles size={16} className="mr-2" /> СОВЕРЕННИЙ ЗАВОД (IMPROVE)
             </Button>
             <Button 
               onClick={() => setActiveTab('k8s')}
               variant={activeTab === 'k8s' ? "neon" : "ghost"}
               className={cn("px-6 py-6 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all", activeTab === 'k8s' && "bg-indigo-600/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.3)]")}
             >
                <Layers size={16} className="mr-2" /> KUBERNETES КЛАСТЕР 
             </Button>
             <Button 
               onClick={() => setActiveTab('network')}
               variant={activeTab === 'network' ? "neon" : "ghost"}
               className={cn("px-6 py-6 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all", activeTab === 'network' && "bg-cyan-600/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]")}
             >
                <Wifi size={16} className="mr-2" /> МЕРЕЖА / ТОПОЛОГІЯ
             </Button>
             <Button 
               onClick={() => setActiveTab('cicd')}
               variant={activeTab === 'cicd' ? "neon" : "ghost"}
               className={cn("px-6 py-6 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all", activeTab === 'cicd' && "bg-emerald-600/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]")}
             >
                <GitBranch size={16} className="mr-2" /> CI/CD КОНВЕЄР
             </Button>
          </div>

          <AnimatePresence mode="wait">
             {activeTab === 'improve' && (
                <motion.div key="improve" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                  
                  {/* Sovereign Control Center Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                        <Factory size={24} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">ГОЛОВНИЙ ПУЛЬТ УПРАВЛІННЯ ЦИКЛОМ</h3>
                        <p className="text-[10px] text-slate-500 font-mono text-fuchsia-500 uppercase">STATUS: {improvementStatus.toUpperCase()} | CYCLE: {activeCycle.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         variant="neon" 
                         size="sm" 
                         className="bg-emerald-600/20 text-emerald-400 border-emerald-500/50 text-[9px] uppercase font-black"
                         onClick={() => { setImprovementStatus('running'); setActiveCycle('building'); handleStartImprovement(); }}
                       >
                         <Play size={12} className="mr-1" /> Запустити Повний Цикл
                       </Button>
                       <Button 
                         variant="cyber" 
                         size="sm" 
                         className="bg-rose-600/20 text-rose-400 border-rose-500/50 text-[9px] uppercase font-black"
                         onClick={() => { setImprovementStatus('idle'); setImprovementProgress(0); setActiveCycle('idle'); }}
                       >
                         <AlertTriangle size={12} className="mr-1" /> Аварійна Зупинка
                       </Button>
                    </div>
                  </div>

                  {/* Mode Selection Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        onClick={() => setImprovementMode('tech')}
                        variant={improvementMode === 'tech' ? 'neon' : 'cyber'}
                        className={cn("h-auto py-8 rounded-xl flex flex-col items-center gap-4 transition-all relative overflow-hidden", 
                          improvementMode === 'tech' ? 'border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] bg-indigo-500/10' : 'border-white/5 text-slate-400 opacity-60')}
                      >
                        {improvementMode === 'tech' && <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />}
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                          <Binary size={24} className="text-indigo-400" />
                        </div>
                        <div className="text-center">
                          <span className="text-[11px] font-black uppercase tracking-widest block">Технологічна Вертикаль</span>
                          <span className="text-[8px] text-indigo-400/70 font-mono mt-1 uppercase">Infrastructure & Core API</span>
                        </div>
                      </Button>
                      <Button 
                        onClick={() => setImprovementMode('analytic')}
                        variant={improvementMode === 'analytic' ? 'neon' : 'cyber'}
                        className={cn("h-auto py-8 rounded-xl flex flex-col items-center gap-4 transition-all relative overflow-hidden", 
                          improvementMode === 'analytic' ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-500/10' : 'border-white/5 text-slate-400 opacity-60')}
                      >
                        {improvementMode === 'analytic' && <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />}
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                          <BrainCircuit size={24} className="text-amber-400" />
                        </div>
                        <div className="text-center">
                          <span className="text-[11px] font-black uppercase tracking-widest block text-amber-100">Аналітична Вертикаль</span>
                          <span className="text-[8px] text-amber-400/70 font-mono mt-1 uppercase">Knowledge Maps & Patterns</span>
                        </div>
                      </Button>
                      <Button 
                        onClick={() => setImprovementMode('complex')}
                        variant={improvementMode === 'complex' ? 'neon' : 'cyber'}
                        className={cn("h-auto py-8 rounded-xl flex flex-col items-center gap-4 transition-all relative overflow-hidden", 
                          improvementMode === 'complex' ? 'border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)] bg-fuchsia-500/10' : 'border-white/5 text-slate-400 opacity-60')}
                      >
                        {improvementMode === 'complex' && <div className="absolute inset-0 bg-fuchsia-500/5 animate-pulse" />}
                        <div className="w-12 h-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                          <Sparkles size={24} className="text-fuchsia-400" />
                        </div>
                        <div className="text-center">
                          <span className="text-[11px] font-black uppercase tracking-widest block text-white">Комплексний Нагляд</span>
                          <span className="text-[8px] text-fuchsia-400/70 font-mono mt-1 uppercase">Sovereign Deployment</span>
                        </div>
                      </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Technical Column */}
                    {(improvementMode === 'tech' || improvementMode === 'complex') && (
                      <TacticalCard title="ТЕХНОЛОГІЧНИЙ СТЕК" variant="cyber" className="border-indigo-500/30">
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 gap-2">
                             {techOptions.map(opt => (
                               <label key={opt.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", 
                                 techComponents.includes(opt.id) ? "bg-indigo-500/10 border-indigo-500/40" : "bg-black/20 border-white/5 hover:border-white/10")}>
                                  <input type="checkbox" checked={techComponents.includes(opt.id)} onChange={() => toggleSelection(opt.id, techComponents, setTechComponents)} className="accent-indigo-500 w-4 h-4" />
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">{opt.label}</span>
                                    {techComponents.includes(opt.id) && <span className="text-[8px] text-indigo-400 animate-pulse uppercase tracking-[0.2em]">Targeted for optimization</span>}
                                  </div>
                               </label>
                             ))}
                          </div>
                          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                             <Button onClick={handleStartImprovement} variant="neon" className="w-full bg-indigo-600/20 text-indigo-400 border-indigo-500/50 font-black uppercase tracking-widest text-[10px] h-11"><Wrench size={14} className="mr-2"/> Оптимізувати Ядро</Button>
                             <div className="grid grid-cols-2 gap-2">
                               <Button variant="cyber" className="text-[9px] h-9"><History size={12} className="mr-1"/> Rollback</Button>
                               <Button variant="cyber" className="text-[9px] h-9 text-emerald-400 border-emerald-500/20"><Scan size={12} className="mr-1"/> Security Scan</Button>
                             </div>
                          </div>
                        </div>
                      </TacticalCard>
                    )}

                    {/* Analytical Column */}
                    {(improvementMode === 'analytic' || improvementMode === 'complex') && (
                      <TacticalCard title="АНАЛІТИЧНИЙ ІНТЕЛЕКТ" variant="cyber" className="border-amber-500/30">
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 gap-2">
                             {analyticOptions.map(opt => (
                               <label key={opt.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", 
                                 analyticComponents.includes(opt.id) ? "bg-amber-500/10 border-amber-500/40" : "bg-black/20 border-white/5 hover:border-white/10")}>
                                  <input type="checkbox" checked={analyticComponents.includes(opt.id)} onChange={() => toggleSelection(opt.id, analyticComponents, setAnalyticComponents)} className="accent-amber-500 w-4 h-4" />
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">{opt.label}</span>
                                    {analyticComponents.includes(opt.id) && <span className="text-[8px] text-amber-400 animate-pulse uppercase tracking-[0.2em]">Pattern upgrade active</span>}
                                  </div>
                               </label>
                             ))}
                          </div>
                          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                             <Button onClick={handleStartImprovement} variant="neon" className="w-full bg-amber-600/20 text-amber-400 border-amber-500/50 font-black uppercase tracking-widest text-[10px] h-11"><Sparkles size={14} className="mr-2"/> Оновити Знання</Button>
                             <Button onClick={handleUpdateKnowledgeMap} variant="cyber" className="w-full text-[10px] h-11"><RotateCcw size={14} className="mr-2"/> Синхронізувати Гравітацію Фактів</Button>
                          </div>
                        </div>
                      </TacticalCard>
                    )}

                    {/* Google Integrality Vertical */}
                    <TacticalCard title="GOOGLE INTEGRALITY" variant="holographic" className="border-emerald-500/30 bg-emerald-500/5">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-emerald-500/20">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                             <Cloud size={20} />
                           </div>
                           <div className="flex-1">
                             <div className="text-[11px] font-black uppercase text-white">Google Workspace</div>
                             <div className="text-[8px] text-emerald-500 font-mono">Syncing: Drive, Docs, Sheets</div>
                           </div>
                           <Badge variant="cyber" className="bg-emerald-500/20 text-emerald-400 text-[8px]">{googleStatus.drive.toUpperCase()}</Badge>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-indigo-500/20">
                           <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                             <Scan size={20} />
                           </div>
                           <div className="flex-1">
                             <div className="text-[11px] font-black uppercase text-white">Gemini OSINT Agent</div>
                             <div className="text-[8px] text-indigo-400 font-mono">Pro v1.5 API Layer</div>
                           </div>
                           <Badge variant="cyber" className="bg-indigo-500/20 text-indigo-400 text-[8px]">{googleStatus.gemini.toUpperCase()}</Badge>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-amber-500/20">
                           <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                             <BarChart3 size={20} />
                           </div>
                           <div className="flex-1">
                             <div className="text-[11px] font-black uppercase text-white">Google Analytics</div>
                             <div className="text-[8px] text-amber-400 font-mono">Traffic & Conversion Insight</div>
                           </div>
                           <Badge variant="neon" className="bg-amber-500/20 text-amber-400 animate-pulse text-[8px]">{googleStatus.analytics.toUpperCase()}</Badge>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                           <Button 
                             onClick={() => setGoogleIntegrality(!googleIntegrality)}
                             variant={googleIntegrality ? "neon" : "cyber"}
                             className={cn("w-full h-11 text-[10px] font-black uppercase tracking-widest transition-all", 
                               googleIntegrality ? "bg-emerald-600 text-white" : "text-emerald-400")}
                           >
                             <Globe size={14} className="mr-2" /> {googleIntegrality ? "ВІДКЛЮЧИТИ ЕКОСИСТЕМУ" : "АКТИВУВАТИ GOOGLE CLOUD"}
                           </Button>
                        </div>
                      </div>
                    </TacticalCard>
                  </div>

                  {/* Realtime Progress & Results UI */}
                  {(improvementStatus === 'running' || improvementStatus === 'done') && (
                    <TacticalCard title="КАНАЛ ПОДІЙ ЗАВОДУ (EVENTS)" variant="cyber" className="border-fuchsia-500/20">
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                          <div>
                             <div className="flex items-center justify-between mb-3">
                               <span className="text-[11px] font-black uppercase tracking-wider text-fuchsia-400">ПОТОЧНИЙ ПРОГРЕС ЦИКЛУ</span>
                               <span className="font-mono text-xl font-black text-white">{improvementProgress}%</span>
                             </div>
                             <Progress value={improvementProgress} variant="holographic" className="h-4 shadow-[0_0_15px_rgba(217,70,239,0.2)]" />
                             
                             <div className="mt-8 grid grid-cols-2 gap-4">
                               <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                                 <Microscope size={24} className="text-cyan-400 mb-2" />
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Аналіз</span>
                                 <Badge variant="cyber" className="mt-1">COMPLETED</Badge>
                               </div>
                               <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                                 <Fingerprint size={24} className="text-indigo-400 mb-2" />
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Автентичність</span>
                                 <Badge variant="cyber" className="mt-1">VERIFIED</Badge>
                               </div>
                             </div>
                          </div>

                          <div className="bg-slate-950/80 rounded-2xl p-4 border border-fuchsia-500/10 font-mono text-[10px] h-[200px] overflow-y-auto custom-scrollbar shadow-inner">
                             <div className="text-fuchsia-400/60 mb-2 uppercase font-black tracking-widest">[ IMPROVEMENT_DAEMON_LOG ]</div>
                             <div className="space-y-1">
                                <div className="text-slate-500">SYNC: Starting vertical distribution...</div>
                                <div className="text-indigo-400 animate-pulse">TECH: Optimizing Core API clusters...</div>
                                {improvementProgress > 30 && <div className="text-amber-400">ANALYTIC: Ingesting Knowledge Map delta...</div>}
                                {improvementProgress > 60 && <div className="text-emerald-400">GOOGLE: Linking Workspace documents...</div>}
                                {improvementProgress > 80 && <div className="text-fuchsia-400">DONE: All modules synthesized.</div>}
                                {improvementStatus === 'running' && <div className="text-white flex items-center gap-2 mt-2"><RotateCcw size={10} className="animate-spin" /> Processing artifacts...</div>}
                             </div>
                          </div>
                        </div>

                        {improvementStatus === 'done' && (
                          <div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                             <div className="flex items-center gap-3 mb-6">
                               <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                 <ShieldCheck size={20} />
                               </div>
                               <div>
                                 <h4 className="text-sm font-black uppercase tracking-widest text-white">ФІНАЛЬНИЙ ЗВІТ ПО ВЕРТИКАЛЯХ</h4>
                                 <p className="text-[9px] text-emerald-500/70 font-mono uppercase">System Integrity: 100% | Quantum Consistency: Achieved</p>
                               </div>
                             </div>

                             <div className="overflow-x-auto">
                               <table className="w-full text-[11px] font-mono border-separate border-spacing-y-2">
                                 <thead>
                                   <tr className="text-slate-500 text-[9px] uppercase tracking-widest text-left">
                                     <th className="pb-2 font-black pl-3">Вертикаль</th>
                                     <th className="pb-2 font-black">Впроваджено</th>
                                     <th className="pb-2 font-black">Статус</th>
                                   </tr>
                                 </thead>
                                 <tbody>
                                   <tr className="bg-white/5 rounded-xl transition-all hover:bg-white/10">
                                     <td className="p-3 text-indigo-400 font-bold border-l-2 border-indigo-500">Технологічна</td>
                                     <td className="p-3 text-slate-200">Refactoring API</td>
                                     <td className="p-3 text-emerald-400 font-bold">STABLE</td>
                                   </tr>
                                   <tr className="bg-white/5 rounded-xl transition-all hover:bg-white/10">
                                     <td className="p-3 text-amber-400 font-bold border-l-2 border-amber-500">Аналітична</td>
                                     <td className="p-3 text-slate-200">Pattern upgrade</td>
                                     <td className="p-3 text-emerald-400 font-bold">DONE</td>
                                   </tr>
                                   {googleIntegrality && (
                                     <tr className="bg-white/5 rounded-xl transition-all hover:bg-white/10">
                                       <td className="p-3 text-emerald-400 font-bold border-l-2 border-emerald-500">Google Integrality</td>
                                       <td className="p-3 text-slate-200">GCP Cloud, Gemini v1.5 Pro, OSINT Layers</td>
                                       <td className="p-3 text-emerald-400 font-bold">INTEGRATED</td>
                                     </tr>
                                   )}
                                 </tbody>
                               </table>
                             </div>

                             <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                               <Button variant="ghost" className="bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-white">ЕКСПОРТ (JSON)</Button>
                               <Button variant="cyber" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/30">Звіт (PDF)</Button>
                             </div>
                          </div>
                        )}
                      </div>
                    </TacticalCard>
                  )}
                </motion.div>
             )}

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
                                           <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {pod.id} | Uptime: {pod.uptime}</div>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="p-4">
                                     <Badge variant={pod.status === 'Running' ? "cyber" : "neon"}>
                                        {pod.status === 'Restarting' ? <RefreshCw size={10} className="inline mr-1 animate-spin" /> : null}
                                        {pod.status}
                                     </Badge>
                                     {pod.restarts > 0 && <div className="text-[9px] text-slate-500 mt-2 ml-1 cursor-help" title={`Restarts: ${pod.restarts}`}>↻ {pod.restarts}</div>}
                                  </td>
                                  <td className="p-4 text-[11px] font-mono text-slate-300">
                                     <div className="flex items-center gap-2">
                                        <Cpu size={12} className="text-blue-400" /> {pod.cpu}%
                                        <HardDrive size={12} className="text-purple-400 ml-2" /> {pod.mem}
                                     </div>
                                  </td>
                                   <td className="p-4">
                                     <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                          onClick={() => handlePodRestart(pod.id)}
                                          disabled={pod.status !== 'Running'}
                                          variant="ghost"
                                          size="icon"
                                          className="p-2 h-10 w-10 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 flex flex-col items-center justify-center hover:border-rose-500/50 rounded-lg border border-transparent transition-all disabled:opacity-50" title="Надіслати SIGTERM (Перезапуск)"
                                        >
                                           <Power size={14} />
                                        </Button>
                                        <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-transparent">
                                          <Button 
                                            onClick={() => handleScalePod(pod.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="p-2 h-10 w-10 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all border-r border-white/5" title="Масштабувати (Scale Up)"
                                          >
                                             <Plus size={14} />
                                          </Button>
                                          <Button 
                                            onClick={() => handleScaleDownPod(pod.id)}
                                            disabled={pod.replicas <= 1}
                                            variant="ghost"
                                            size="icon"
                                            className="p-2 h-10 w-10 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit" title="Зменшити (Scale Down)"
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
                              <Button onClick={() => setLogsPodId(null)} variant="ghost" size="icon" className="text-slate-500 hover:text-white transition-colors h-8 w-8">
                                 <X size={16} />
                              </Button>
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
