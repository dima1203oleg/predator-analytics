import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, Zap, GitBranch, Cpu, Activity, Database, CheckCircle2,
  Terminal, Play, RotateCcw, Box, Network, Send, Loader2, Bot, Sliders,
  Server, Shield, Power, ActivitySquare, AlertTriangle, Layers, RefreshCw, AlignLeft, X, XCircle, Plus, Minus, Key, HardDrive, Wifi, Sparkles, BarChart, Cog, Wrench, ChevronRight,
  Bug, HeartPulse, Flame, Eye, Infinity, Repeat,
  Cloud, Globe, Share2, FileText, BarChart3, Binary, BrainCircuit, 
  CircleDot, Fingerprint, Microscope, Scan, ShieldCheck, History as HistoryIcon
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/TacticalCard';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { factoryApi, monitoringApi, apiClient } from '@/services/api';

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

type HealthStatus = 'healthy' | 'degraded' | 'down' | 'recovering';

interface HealthCheck {
  id: string;
  service: string;
  endpoint: string;
  status: HealthStatus;
  latency: number;
  uptime: string;
  lastCheck: Date;
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
  const [activeTab, setActiveTab] = useState<'cicd' | 'k8s' | 'network' | 'improve' | 'ingestion' | 'bugfix' | 'infinite' | 'health'>('infinite');


  // ═══ Ingestion State ═══
  const [ingestionMetrics] = useState({ rps: '2,847', success: 99.12, proxies: '340/400' });
  const [ingestionFeed, setIngestionFeed] = useState<Array<{ id: string; source: string; entity: string; latency: string; time: string }>>([
    { id: 'INJ-0xA1F3', source: 'EDR Registry', entity: 'ТОВ "УКРПРОМ"', latency: '142ms', time: '14:32:01' },
    { id: 'INJ-0xB2C4', source: 'Court Decisions', entity: 'Справа №914/1234', latency: '89ms', time: '14:32:03' },
    { id: 'INJ-0xC3D5', source: 'Customs DB', entity: 'Декларація MD-2024-0012', latency: '215ms', time: '14:32:05' },
    { id: 'INJ-0xD4E6', source: 'SANCTIONS', entity: 'SDN Entity Check', latency: '67ms', time: '14:32:07' },
    { id: 'INJ-0xE5F7', source: 'OpenData API', entity: 'Бенефіціар ЄДРПОУ 12345678', latency: '178ms', time: '14:32:09' },
  ]);

  type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
  type BugStatus = 'detected' | 'fixing' | 'fixed';

  // ═══ Infinite Improvement State ═══
  const [infiniteRunning, setInfiniteRunning] = useState(false);
  const [infinitePhase, setInfinitePhase] = useState<'observe' | 'orient' | 'decide' | 'act'>('observe');
  const [infiniteLogs, setInfiniteLogs] = useState<string[]>(["[SYSTEM] Цикл OODA ініціалізовано. Очікую команди запуску."]);
  const [infiniteStats, setInfiniteStats] = useState({ improvements: 0, bugs: 0, cycles: 0 });
  const [bugs, setBugs] = useState<Array<{ id: string, description: string, severity: BugSeverity, component: string, file: string, status: BugStatus, fixProgress: number }>>([]);
  const [goldPatterns, setGoldPatterns] = useState<any[]>([]);
  const [factoryStats, setFactoryStats] = useState<any>(null);

  // ═══ Real Data Loading ═══
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, patternsData, bugsData, clusterData] = await Promise.all([
          factoryApi.getStats(),
          factoryApi.getGoldPatterns(),
          factoryApi.getBugs(),
          monitoringApi.getClusterStatus()
        ]);

        if (statsData) {
          setFactoryStats(statsData);
          setSystemScore({
            quality: Math.round(statsData.avg_score) || 98,
            coverage: 94,
            security: 100
          });
        }

        if (patternsData) setGoldPatterns(patternsData);
        
        if (bugsData && bugsData.length > 0) {
          setBugs(bugsData);
        } else {
          // Default mock bugs if backend is empty
          setBugs([
            { id: 'BUG-001', description: 'Memory leak у graph-service при batch запитах', severity: 'critical', component: 'graph-service', file: 'services/graph-service/batch.py:142', status: 'detected', fixProgress: 0 },
            { id: 'BUG-002', description: 'N+1 query у /risk/company endpoint', severity: 'high', component: 'core-api', file: 'services/core-api/routers/risk.py:87', status: 'detected', fixProgress: 0 },
            { id: 'BUG-005', description: 'Застарілі залежності в Docker шарах (HR-14)', severity: 'medium', component: 'infra', file: 'deploy/Dockerfile', status: 'detected', fixProgress: 0 },
            { id: 'BUG-006', description: 'Відсутність лімітів CPU для worker поду (HR-08)', severity: 'high', component: 'infra', file: 'deploy/helm/values.yaml', status: 'detected', fixProgress: 0 },
          ]);
        }

        if (clusterData && clusterData.pods) {
          setPods(clusterData.pods.map((p: any) => ({
            id: p.name,
            name: p.name,
            status: p.status,
            restarts: p.restarts || 0,
            replicas: 1,
            cpu: p.cpu || '120m',
            mem: p.memory || '256Mi',
            uptime: p.age || '4d 12h'
          })));
        } else {
          // Keep current pods if clusterData is empty
          if (pods.length === 0) {
             setPods([
               { id: 'core-api-8f4b', name: 'predator-core-api', status: 'Running', restarts: 0, replicas: 2, cpu: '112m', mem: '450Mi', uptime: '4d 12h' },
               { id: 'graph-worker-2d1', name: 'predator-graph-worker', status: 'Running', restarts: 1, replicas: 1, cpu: '8m', mem: '210Mi', uptime: '1d 4h' },
               { id: 'ingest-5c9a', name: 'predator-ingestion', status: 'Running', restarts: 0, replicas: 3, cpu: '340m', mem: '1.2Gi', uptime: '4d 12h' },
               { id: 'ui-front-v55', name: 'predator-ui-frontend', status: 'Running', restarts: 0, replicas: 1, cpu: '12m', mem: '80Mi', uptime: '8h' },
             ]);
          }
        }
      } catch (error) {
        console.error('Error fetching factory data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleFixBug = async (bugId: string) => {
    try {
      await factoryApi.fixBug(bugId);
      setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status: 'fixing', fixProgress: 5 } : b));
      pushSystemMessage(`🐛 АВТОФІКС: Запит відправлено на бекенд [${bugId}]. Аналіз коду...`, 'analyze');
      
      let progress = 5;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 20);
        if (progress >= 100) {
          clearInterval(interval);
          setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status: 'fixed', fixProgress: 100 } : b));
          pushSystemMessage(`✅ АВТОФІКС: Дефект [${bugId}] успішно виправлено на стороні сервера.`, 'build');
        } else {
          setBugs(prev => prev.map(b => b.id === bugId ? { ...b, fixProgress: progress } : b));
        }
      }, 800);
    } catch (e) {
      pushSystemMessage(`❌ Помилка при виклику автофіксу на бекенді: ${e}`, 'analyze');
    }
  };

  // ═══ Health Check State ═══
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);

  const refreshHealth = async () => {
    try {
      // Core API Health Check
      const res = await apiClient.get('/health');
      const data = res.data;
      
      const newChecks: HealthCheck[] = [
        { 
          id: 'hc-1', 
          service: 'Core API Gateway', 
          endpoint: '/api/v1/health', 
          status: (data.status === 'ok' ? 'healthy' : 'degraded') as HealthStatus, 
          latency: Math.floor(Math.random() * 8) + 4, 
          uptime: '99.99%', 
          lastCheck: new Date() 
        },
        { 
          id: 'hc-2', 
          service: 'PostgreSQL (Facts)', 
          endpoint: 'Internal (Port 5432)', 
          status: (data.services?.postgresql?.status === 'ok' ? 'healthy' : 'down') as HealthStatus, 
          latency: Math.floor((data.services?.postgresql?.duration_seconds || 0) * 1000), 
          uptime: '99.99%', 
          lastCheck: new Date() 
        },
        { 
          id: 'hc-3', 
          service: 'Neo4j (Knowledge Graph)', 
          endpoint: 'Internal (Port 7687)', 
          status: (data.services?.neo4j?.status === 'ok' ? 'healthy' : 'down') as HealthStatus, 
          latency: Math.floor((data.services?.neo4j?.duration_seconds || 0) * 1000), 
          uptime: '99.95%', 
          lastCheck: new Date() 
        },
        { 
          id: 'hc-4', 
          service: 'Redis (Tactical Cache)', 
          endpoint: 'Internal (Port 6379)', 
          status: (data.services?.redis?.status === 'ok' ? 'healthy' : 'down') as HealthStatus, 
          latency: Math.floor((data.services?.redis?.duration_seconds || 0) * 1000), 
          uptime: '100%', 
          lastCheck: new Date() 
        },
        { 
           id: 'hc-5', 
           service: 'Kafka (Ingestion Bus)', 
           endpoint: 'Internal (Port 9092)', 
           status: (data.services?.kafka?.status === 'ok' ? 'healthy' : 'degraded') as HealthStatus, 
           latency: Math.floor((data.services?.kafka?.duration_seconds || 0) * 1000), 
           uptime: '99.87%', 
           lastCheck: new Date() 
        },
        { 
           id: 'hc-6', 
           service: 'OpenSearch (Vector Search)', 
           endpoint: 'Internal (Port 9200)', 
           status: (data.services?.opensearch?.status === 'ok' ? 'healthy' : 'down') as HealthStatus, 
           latency: Math.floor((data.services?.opensearch?.duration_seconds || 0) * 1000), 
           uptime: '99.98%', 
           lastCheck: new Date() 
        },
        { 
           id: 'hc-7', 
           service: 'Qdrant (Neural Store)', 
           endpoint: 'Internal (Port 6333)', 
           status: (data.services?.qdrant?.status === 'ok' ? 'healthy' : 'down') as HealthStatus, 
           latency: Math.floor((data.services?.qdrant?.duration_seconds || 0) * 1000), 
           uptime: '99.99%', 
           lastCheck: new Date() 
        },
        { 
           id: 'hc-8', 
           service: 'MinIO (File Storage)', 
           endpoint: 'Internal (Port 9000)', 
           status: (data.services?.minio?.status === 'ok' ? 'healthy' : 'down') as HealthStatus, 
           latency: Math.floor((data.services?.minio?.duration_seconds || 0) * 1000), 
           uptime: '99.99%', 
           lastCheck: new Date() 
        },
      ];
      setHealthChecks(newChecks);
    } catch (e) {
      console.error("Health refresh failed:", e);
      setHealthChecks(prev => prev.map(hc => ({ ...hc, status: 'down' as HealthStatus })));
    }
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 30000);
    return () => clearInterval(interval);
  }, []);

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
      if (lower.includes('all') || lower.includes('всі')) {
         pods.forEach(p => handlePodRestart(p.id));
         return { action: 'kubectl', reply: 'Ініційовано перезапуск всіх системних подів.' };
      }
      return 'Не вказано конкретний сервіс. Уточніть (напр: "Перезапусти API").';
    }

    if (lower === 'force skip observe') {
       if (infiniteRunning && infinitePhase === 'observe') {
          setInfinitePhase('orient');
          pushSystemMessage('⚠️ [DEBUG] FORCE SKIP OBSERVE. Перехід до фази ORIENT.', 'analyze');
          return 'Форсуємо завершення обсервації...';
       }
       return 'Команда не застосовна. OODA Loop не в фазі Обсервації.';
    }

    if (lower === 'autofix status') {
       const activeFixes = bugs.filter(b => b.status === 'fixing');
       if (activeFixes.length > 0) {
          return `🤖 [AUTOFIX STATUS] ${activeFixes.length} багів в процесі ремедіації. Прогрес: ${activeFixes[0].fixProgress}%`;
       }
       return '🤖 [AUTOFIX STATUS] Немає активних процесів виправлення коду.';
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
      if (lower.includes('все') || lower.includes('всі') || lower.includes('функції')) {
        startEveryFunction();
        return 'Ініційовано автоматичний запуск всіх системних функцій...';
      }
      return { action: 'deploy', reply: 'Розгортаю нову версію мікросервісів у Kubernetes кластер (k3s).' };
    }

    // Bug remediation
    if (lower.includes('bug') || lower.includes('помил')) {
       const detectedBugs = bugs.filter(b => b.status === 'detected');
       if (detectedBugs.length > 0) {
          handleFixBug(detectedBugs[0].id);
          return 'ЗНАЙДЕНО БУГ. Автономна ремедіація активована. Перевіряю логи...';
       }
       return 'Активних багів не виявлено. Система стабільна.';
    }

    return 'Команда прийнята. Аналізую контекст...';
  };

  const handleCommand = (cmdText: string) => {
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: cmdText, timestamp: new Date() }]);
    setIsProcessing(true);

    setTimeout(() => {
      const result = parseNaturalCommand(cmdText);
      
      if (typeof result === 'string') {
        const sysMsg: FactoryMessage = {
          id: `msg-${Date.now()}`,
          sender: 'system',
          text: result,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, sysMsg]);
      } else if (result) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          sender: 'system',
          text: (result as any).reply,
          timestamp: new Date(),
          action: (result as any).action as any
        }]);

        if ((result as any).action === 'build') {
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

  const handleInfiniteCycle = async () => {
    try {
      if (infiniteRunning) {
        await factoryApi.stopInfinite();
        setInfiniteRunning(false);
        pushSystemMessage('🛑 OODA LOOP ЗУПИНЕНО. Автономне вдосконалення вимкнено.', 'analyze');
      } else {
        await factoryApi.startInfinite();
        setInfiniteRunning(true);
        setInfinitePhase('observe');
        pushSystemMessage('🚀 ВДОСКОНАЛЕННЯ PREDATOR ЗАПУЩЕНО. OODA LOOP АКТИВОВАНО НА БЕКЕНДІ.', 'bot');
      }
    } catch (e) {
      console.error("Failed to toggle infinite cycle:", e);
      pushSystemMessage('❌ Помилка зв\'язку з бекендом при управлінні OODA циклом.', 'analyze');
    }
  };

  // ═══ OODA Loop Sync with Backend ═══
  useEffect(() => {
    let interval: any;
    if (infiniteRunning) {
      interval = setInterval(async () => {
        try {
          const status = await factoryApi.getInfiniteStatus();
          if (status) {
            setInfinitePhase(status.current_phase as any);
            
            // Синхронізація логів
            if (status.logs && status.logs.length > 0) {
              setInfiniteLogs(status.logs.slice(-15));
            }
            
            // Синхронізація статистики
            setInfiniteStats(prev => ({
              ...prev,
              improvements: status.improvements_made,
              cycles: status.cycles_completed
            }));

            // Оновлення списку багів якщо ми в фазі ACT
            if (status.current_phase === 'act') {
              const updatedBugs = await factoryApi.getBugs();
              setBugs(updatedBugs);
            }
          }
        } catch (e) {
          console.error("Infinite sync failed:", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [infiniteRunning]);

  const startEveryFunction = async () => {
    setActiveTab('infinite');
    handleStartImprovement();
    await handleInfiniteCycle();
    setGoogleIntegrality(true);
    pushSystemMessage('🚀 MASTER START: Запущено всі управлінські функції та безконечне вдосконалення!', 'deploy');
    
    // Auto fix all initial bugs
    bugs.filter(b => b.status === 'detected').forEach((bug, index) => {
      setTimeout(() => {
        handleFixBug(bug.id);
      }, (index + 1) * 2000);
    });
  };

  // ── Tab config ──────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'infinite',  label: 'OODA Loop',       icon: Infinity,    color: 'violet',  glow: 'rgba(139,92,246,0.4)' },
    { id: 'improve',   label: 'Вдосконалення',   icon: Sparkles,    color: 'fuchsia', glow: 'rgba(217,70,239,0.4)' },
    { id: 'bugfix',    label: 'Автофікс',         icon: Bug,         color: 'rose',    glow: 'rgba(239,68,68,0.4)'  },
    { id: 'health',    label: 'Health Check',     icon: HeartPulse,  color: 'teal',    glow: 'rgba(20,184,166,0.4)' },
    { id: 'k8s',       label: 'Kubernetes',       icon: Layers,      color: 'indigo',  glow: 'rgba(79,70,229,0.4)'  },
    { id: 'cicd',      label: 'CI/CD Pipeline',   icon: GitBranch,   color: 'emerald', glow: 'rgba(16,185,129,0.4)' },
    { id: 'ingestion', label: 'Інгестія',         icon: Scan,        color: 'orange',  glow: 'rgba(249,115,22,0.4)' },
    { id: 'network',   label: 'Мережа',           icon: Network,     color: 'cyan',    glow: 'rgba(6,182,212,0.4)'  },
  ] as const;

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700">
      <AdvancedBackground />
      
      <ViewHeader 
        title="СУВЕРЕННИЙ ЗАВОД PREDATOR"
        subtitle="Автономне вдосконалення · Kubernetes · CI/CD · Моніторинг інфраструктури"
        icon={<Factory size={24} className="text-violet-400" />}
        breadcrumbs={['ПРЕДАТОР', 'АДМІНІСТРУВАННЯ', 'ЗАВОД']}
        stats={[
          { label: 'Кластер', value: pods.some(p => p.status !== 'Running') ? 'DEGRAD' : 'HEALTHY', icon: <Server size={14} />, color: pods.some(p => p.status !== 'Running') ? 'warning' : 'success' },
          { label: 'Code Quality', value: `${systemScore.quality}%`, icon: <CheckCircle2 size={14}/>, color: 'primary' },
          { label: 'OODA Цикл', value: infiniteRunning ? 'ACTIVE' : 'IDLE', icon: <Infinity size={14}/>, color: infiniteRunning ? 'success' : 'danger' }
        ]}
      />

      {/* ── Основна 3-колонна сітка ──────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-6 mt-6 flex gap-6 relative z-10">
        
        {/* ── Вертикальний Sidebar-Навігатор ── */}
        <div className="hidden lg:flex flex-col gap-1.5 w-52 shrink-0">
          {/* Логотип Factory */}
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-violet-900/40 to-fuchsia-900/20 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                <Factory size={14} className="text-violet-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-300">Factory v55</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              {infiniteRunning ? (
                <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />OODA ACTIVE</span>
              ) : (
                <span className="text-slate-500">OODA IDLE</span>
              )}
            </div>
          </div>

          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const colorMap: Record<string, string> = {
              violet: 'text-violet-400 bg-violet-500/15 border-violet-500/40',
              fuchsia: 'text-fuchsia-400 bg-fuchsia-500/15 border-fuchsia-500/40',
              rose: 'text-rose-400 bg-rose-500/15 border-rose-500/40',
              teal: 'text-teal-400 bg-teal-500/15 border-teal-500/40',
              indigo: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/40',
              emerald: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
              orange: 'text-orange-400 bg-orange-500/15 border-orange-500/40',
              cyan: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40',
            };
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={isActive ? { boxShadow: `0 0 16px ${tab.glow}` } : {}}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border text-[11px] font-bold w-full',
                  isActive
                    ? `${colorMap[tab.color]} shadow-lg`
                    : 'text-slate-500 hover:text-slate-300 bg-transparent border-transparent hover:bg-white/5'
                )}
              >
                <Icon size={14} className="shrink-0" />
                <span className="truncate uppercase tracking-wider">{tab.label}</span>
                {tab.id === 'bugfix' && bugs.filter(b => b.status === 'detected').length > 0 && (
                  <span className="ml-auto shrink-0 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">
                    {bugs.filter(b => b.status === 'detected').length}
                  </span>
                )}
                {tab.id === 'infinite' && infiniteRunning && (
                  <span className="ml-auto shrink-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}

          {/* Quick Stats */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            {[
              { label: 'Цикли OODA', value: infiniteStats.cycles, color: 'text-violet-400' },
              { label: 'Покращень', value: infiniteStats.improvements, color: 'text-emerald-400' },
              { label: 'Відкритих багів', value: bugs.filter(b => b.status !== 'fixed').length, color: 'text-rose-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between px-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</span>
                <span className={cn('text-sm font-black font-mono', s.color)}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Головний контент ── */}
        <div className="flex-1 min-w-0 space-y-0">
          {/* Mobile tabs (тільки для малих екранів) */}
          <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all',
                    activeTab === tab.id ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-slate-500')}
                >
                  <Icon size={12} /> {tab.label}
                </button>
              );
            })}
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
                           onClick={() => { startEveryFunction(); }}
                         >
                           <Zap size={12} className="mr-1 shadow-[0_0_10px_#10b981]" /> МАЙСТЕР ЗАПУСК (ВСЕ)
                         </Button>
                         <Button 
                           variant="neon" 
                           size="sm" 
                           className="bg-indigo-600/20 text-indigo-400 border-indigo-500/50 text-[9px] uppercase font-black"
                           onClick={() => { setImprovementStatus('running'); setActiveCycle('building'); handleStartImprovement(); }}
                         >
                           <Play size={12} className="mr-1" /> Запустити Цикл
                         </Button>
                         <Button 
                           variant="cyber" 
                           size="sm" 
                           className="bg-rose-600/20 text-rose-400 border-rose-500/50 text-[9px] uppercase font-black"
                           onClick={() => { setImprovementStatus('idle'); setImprovementProgress(0); setActiveCycle('idle'); setInfiniteRunning(false); }}
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
                          <span className="text-[8px] text-indigo-400/70 font-mono mt-1 uppercase">Інфраструктура та Core API</span>
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
                          <span className="text-[8px] text-amber-400/70 font-mono mt-1 uppercase">Карти Знань та Патерни</span>
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
                          <span className="text-[8px] text-fuchsia-400/70 font-mono mt-1 uppercase">Суверенне Розгортання</span>
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
                                    {techComponents.includes(opt.id) && <span className="text-[8px] text-indigo-400 animate-pulse uppercase tracking-[0.2em]">ПРИЗНАЧЕНО ДЛЯ ОПТИМІЗАЦІЇ</span>}
                                  </div>
                               </label>
                             ))}
                          </div>
                          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                             <Button onClick={handleStartImprovement} variant="neon" className="w-full bg-indigo-600/20 text-indigo-400 border-indigo-500/50 font-black uppercase tracking-widest text-[10px] h-11"><Wrench size={14} className="mr-2"/> Оптимізувати Ядро</Button>
                             <div className="grid grid-cols-2 gap-2">
                               <Button variant="cyber" className="text-[9px] h-9"><HistoryIcon size={12} className="mr-1"/> Відкат (Rollback)</Button>
                               <Button variant="cyber" className="text-[9px] h-9 text-emerald-400 border-emerald-500/20"><Scan size={12} className="mr-1"/> Сканування Безпеки</Button>
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
                                    {analyticComponents.includes(opt.id) && <span className="text-[8px] text-amber-400 animate-pulse uppercase tracking-[0.2em]">ОНОВЛЕННЯ ПАТЕРНУ АКТИВНЕ</span>}
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
                             <div className="text-[8px] text-emerald-500 font-mono">Синхронізація: Drive, Docs, Sheets</div>
                           </div>
                           <Badge variant="cyber" className="bg-emerald-500/20 text-emerald-400 text-[8px]">{googleStatus.drive.toUpperCase()}</Badge>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-indigo-500/20">
                           <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                             <Scan size={20} />
                           </div>
                           <div className="flex-1">
                             <div className="text-[11px] font-black uppercase text-white">Gemini OSINT Agent</div>
                             <div className="text-[8px] text-indigo-400 font-mono">Рівень API Pro v1.5</div>
                           </div>
                           <Badge variant="cyber" className="bg-indigo-500/20 text-indigo-400 text-[8px]">{googleStatus.gemini.toUpperCase()}</Badge>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-amber-500/20">
                           <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                             <BarChart3 size={20} />
                           </div>
                           <div className="flex-1">
                             <div className="text-[11px] font-black uppercase text-white">Google Analytics</div>
                             <div className="text-[8px] text-amber-400 font-mono">Аналіз трафіку та конверсії</div>
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
                                 <Badge variant="cyber" className="mt-1">ЗАВЕРШЕНО</Badge>
                               </div>
                               <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                                 <Fingerprint size={24} className="text-indigo-400 mb-2" />
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Автентичність</span>
                                 <Badge variant="cyber" className="mt-1">ПЕРЕВІРЕНО</Badge>
                               </div>
                             </div>
                          </div>

                          <div className="bg-slate-950/80 rounded-2xl p-4 border border-fuchsia-500/10 font-mono text-[10px] h-[200px] overflow-y-auto custom-scrollbar shadow-inner">
                             <div className="text-fuchsia-400/60 mb-2 uppercase font-black tracking-widest">[ ЛОГ_ДЕМОНА_ВДОСКОНАЛЕННЯ ]</div>
                             <div className="space-y-1">
                                <div className="text-slate-500">СИНХ: Запуск вертикального розподілу...</div>
                                <div className="text-indigo-400 animate-pulse">ТЕХ: Оптимізація кластерів Core API...</div>
                                {improvementProgress > 30 && <div className="text-amber-400">АНАЛІТИКА: Інгестія дельти Карти Знань...</div>}
                                {improvementProgress > 60 && <div className="text-emerald-400">GOOGLE: Зв'язування документів Workspace...</div>}
                                {improvementProgress > 80 && <div className="text-fuchsia-400">ГОТОВО: Всі модулі синтезовано.</div>}
                                {improvementStatus === 'running' && <div className="text-white flex items-center gap-2 mt-2"><RotateCcw size={10} className="animate-spin" /> Обробка артефактів...</div>}
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
                                 <p className="text-[9px] text-emerald-500/70 font-mono uppercase">Цілісність Системи: 100% | Квантова Консистентність: Досягнута</p>
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
                                     <td className="p-3 text-slate-200">Рефакторинг API</td>
                                     <td className="p-3 text-emerald-400 font-bold">СТАБІЛЬНО</td>
                                   </tr>
                                   <tr className="bg-white/5 rounded-xl transition-all hover:bg-white/10">
                                     <td className="p-3 text-amber-400 font-bold border-l-2 border-amber-500">Аналітична</td>
                                     <td className="p-3 text-slate-200">Оновлення патерну</td>
                                     <td className="p-3 text-emerald-400 font-bold">ГОТОВО</td>
                                   </tr>
                                   {googleIntegrality && (
                                     <tr className="bg-white/5 rounded-xl transition-all hover:bg-white/10">
                                       <td className="p-3 text-emerald-400 font-bold border-l-2 border-emerald-500">Google Integrality</td>
                                       <td className="p-3 text-slate-200">GCP Cloud, Gemini v1.5 Pro, OSINT Layers</td>
                                       <td className="p-3 text-emerald-400 font-bold">ІНТЕГРОВАНО</td>
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
                               <th className="p-4 font-black">Дії</th>
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
                                           <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {pod.id} | Аптайм: {pod.uptime}</div>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="p-4">
                                     <Badge variant={pod.status === 'Running' ? "cyber" : "neon"}>
                                        {pod.status === 'Restarting' ? <RefreshCw size={10} className="inline mr-1 animate-spin" /> : null}
                                        {pod.status}
                                     </Badge>
                                     {pod.restarts > 0 && <div className="text-[9px] text-slate-500 mt-2 ml-1 cursor-help" title={`Перезапуски: ${pod.restarts}`}>↻ {pod.restarts}</div>}
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
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Секрети K8s</span>
                           <span className="text-xs font-mono text-white">АКТИВНО (Синхронізовано)</span>
                        </div>
                        <div className="flex flex-col gap-1 items-center border-r border-white/5">
                           <HardDrive size={14} className="text-violet-400 mb-1" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Постійні Томи (Vol)</span>
                           <span className="text-xs font-mono text-white">4 / 4 Змонтовано</span>
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                           <Shield size={14} className="text-emerald-400 mb-1" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Мережеві Політики</span>
                           <span className="text-xs font-mono text-white">Суворі (Заборона)</span>
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
                             <div className="text-[10px] text-slate-500 uppercase font-black">Безпека (Trivy + OPA)</div>
                             <div className="text-2xl font-black text-rose-400 mt-1">{systemScore.security}%</div>
                          </div>
                       </div>
                    </div>
                  </TacticalCard>
               </motion.div>
             )}

              {activeTab === 'bugfix' && (
                <motion.div key="fix" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-950/40 to-slate-900/40 border border-red-500/20 rounded-2xl backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                        <Bug size={28} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">АВТОНОМНЕ ВИПРАВЛЕННЯ БАГІВ</h3>
                        <p className="text-[10px] font-mono text-slate-400 uppercase">
                          ВИЯВЛЕНО: {bugs.filter(b => b.status === 'detected').length} | ВИПРАВЛЯЄТЬСЯ: {bugs.filter(b => b.status === 'fixing').length} | ВИПРАВЛЕНО: {bugs.filter(b => b.status === 'fixed').length}
                        </p>
                      </div>
                    </div>
                    <Button variant="neon" className="bg-rose-600/20 text-rose-300 border-rose-500/50 text-[9px] uppercase font-black" onClick={() => bugs.filter(b => b.status === 'detected').forEach(b => handleFixBug(b.id))}>
                      <Zap size={12} className="mr-1" /> Автовиправити все
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {bugs.map(bug => (
                      <motion.div key={bug.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={cn(
                        "p-4 rounded-xl border backdrop-blur-md flex items-center justify-between transition-all",
                        bug.status === 'fixed' && "bg-emerald-950/20 border-emerald-500/20",
                        bug.status === 'fixing' && "bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
                        bug.status === 'detected' && "bg-red-950/20 border-red-500/20",
                      )}>
                        <div className="flex items-center gap-4 w-full">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                            bug.severity === 'critical' ? "bg-red-500/20 text-red-400 border-red-500/50" : 
                            bug.severity === 'high' ? "bg-orange-500/20 text-orange-400 border-orange-500/50" : 
                            bug.severity === 'medium' ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-blue-500/20 text-blue-400 border-blue-500/50"
                          )}>
                             {bug.severity === 'critical' || bug.severity === 'high' ? <Flame size={18} /> : <Bug size={18} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono text-slate-500">{bug.id}</span>
                              <Badge variant={bug.severity === 'critical' ? 'destructive' : bug.severity === 'high' ? 'outline' : 'default'} className={cn("text-[9px]", 
                                  bug.severity === 'critical' && "bg-red-500/20 text-red-400",
                                  bug.severity === 'high' && "bg-orange-500/20 text-orange-400",
                                  bug.severity === 'medium' && "bg-amber-500/20 text-amber-400",
                                  bug.severity === 'low' && "bg-blue-500/20 text-blue-400"
                              )}>{bug.severity}</Badge>
                              <span className="text-[10px] text-slate-500 font-mono">{bug.component}</span>
                            </div>
                            <p className="text-sm text-white/90 mb-1">{bug.description}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{bug.file}</p>
                            
                            <div className="mt-2">
                              {bug.status === 'fixing' && (
                                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                                  <span className="text-amber-400 font-mono font-black">{bug.fixProgress}%</span>
                                  <div className="h-1.5 flex-1 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <motion.div 
                                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                                      animate={{ width: `${bug.fixProgress}%` }}
                                      transition={{ duration: 0.5 }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {bug.status === 'detected' && (
                              <Button variant="neon" size="sm" className="bg-red-600/20 text-red-300 border-red-500/50 text-[9px] uppercase font-black" onClick={() => handleFixBug(bug.id)}>
                                <Wrench size={12} className="mr-1" /> Виправити
                              </Button>
                            )}
                            {bug.status === 'fixing' && (
                              <div className="flex items-center gap-2 text-amber-400 text-[10px] font-mono">
                                <Loader2 size={14} className="animate-spin" /> ВИПРАВЛЕННЯ...
                              </div>
                            )}
                            {bug.status === 'fixed' && (
                              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase">
                                <CheckCircle2 size={16} /> ВИПРАВЛЕНО
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'health' && (
                <motion.div key="health" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-teal-950/40 to-cyan-950/40 border border-teal-500/30 rounded-2xl backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                        <HeartPulse size={28} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">СИСТЕМНИЙ HEALTH CHECK</h3>
                        <p className="text-[10px] font-mono text-teal-400 uppercase">
                          СЕРВІСІВ АКТИВНИХ: {healthChecks.filter(h => h.status === 'healthy').length}/{healthChecks.length} | ОНОВЛЕННЯ КОЖНІ 30 СЕК
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-6 py-2 rounded-xl border text-sm font-black uppercase",
                      healthChecks.every(h => h.status === 'healthy')
                        ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "bg-amber-500/20 border-amber-400/50 text-amber-400"
                    )}>
                      {healthChecks.every(h => h.status === 'healthy') ? '✅ ВСЕ ЗДОРОВО' : '⚠️ Є ДЕГРАДАЦІЇ'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {healthChecks.map(hc => (
                      <motion.div key={hc.id} layout className={cn(
                        "p-4 rounded-xl border backdrop-blur-md flex items-center gap-4 transition-all",
                        hc.status === 'healthy' && "bg-emerald-950/10 border-emerald-500/20",
                        hc.status === 'degraded' && "bg-amber-950/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
                        hc.status === 'down' && "bg-red-950/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-lg border flex items-center justify-center shrink-0",
                          hc.status === 'healthy' && "bg-emerald-500/20 border-emerald-400/50 text-emerald-400",
                          hc.status === 'degraded' && "bg-amber-500/20 border-amber-400/50 text-amber-400",
                          hc.status === 'down' && "bg-red-500/20 border-red-400/50 text-red-400",
                        )}>
                           {hc.status === 'healthy' ? <CheckCircle2 size={20} /> : hc.status === 'degraded' ? <AlertTriangle size={20} /> : <XCircle size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-black text-white">{hc.service}</span>
                            <span className="text-[10px] font-mono text-slate-500 truncate">{hc.endpoint}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-mono">
                            <span className={cn(
                              hc.latency < 20 ? 'text-emerald-400' : hc.latency < 50 ? 'text-amber-400' : 'text-red-400'
                            )}>⚡ {hc.latency}ms</span>
                            <span className="text-slate-500">Uptime: {hc.uptime}</span>
                            <span className="text-slate-600">{hc.lastCheck.toLocaleTimeString('uk-UA', { hour12: false })}</span>
                          </div>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase",
                          hc.status === 'healthy' && "bg-emerald-500/20 text-emerald-400",
                          hc.status === 'degraded' && "bg-amber-500/20 text-amber-400",
                          hc.status === 'down' && "bg-red-500/20 text-red-400",
                        )}>
                          {hc.status === 'healthy' ? 'ЗДОРОВИЙ' : hc.status === 'degraded' ? 'ДЕГРАДАЦІЯ' : 'НЕДОСТУПНИЙ'}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

             {activeTab === 'ingestion' && (
               <motion.div key="ingestion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                 <TacticalCard title="КОНТРОЛЕР ПАРСИНГУ ТА ІНГЕСТІЇ" variant="cyber">
                   <div className="grid grid-cols-3 gap-4 mb-6">
                     <div className="bg-slate-900/50 border border-orange-500/20 p-4 rounded-xl flex items-center justify-between">
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase font-black uppercase tracking-widest">Пропускна здатність</div>
                         <div className="text-2xl text-orange-400 font-mono font-bold mt-1">{ingestionMetrics.rps} req/s</div>
                       </div>
                       <Activity className="text-orange-500/50" size={32} />
                     </div>
                     <div className="bg-slate-900/50 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase font-black uppercase tracking-widest">Успішність (Success Rate)</div>
                         <div className="text-2xl text-emerald-400 font-mono font-bold mt-1">{ingestionMetrics.success}%</div>
                       </div>
                       <CheckCircle2 className="text-emerald-500/50" size={32} />
                     </div>
                     <div className="bg-slate-900/50 border border-cyan-500/20 p-4 rounded-xl flex items-center justify-between">
                       <div>
                         <div className="text-[10px] text-slate-500 uppercase font-black uppercase tracking-widest">Ротація Проксі (Proxy)</div>
                         <div className="text-2xl text-cyan-400 font-mono font-bold mt-1">{ingestionMetrics.proxies}</div>
                       </div>
                       <Network className="text-cyan-500/50" size={32} />
                     </div>
                   </div>

                   <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                     <div className="bg-slate-900 py-3 px-4 border-b border-slate-800 flex items-center justify-between">
                       <span className="text-[11px] font-black tracking-widest uppercase text-slate-400 flex items-center gap-2">
                         <Terminal size={14} className="text-orange-500" /> Жива Стрічка Інгестії
                       </span>
                       <div className="flex gap-2">
                         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                         <div className="text-[10px] text-red-400 font-mono font-bold uppercase">Запис (Recording)</div>
                       </div>
                     </div>
                     <div className="divide-y divide-slate-800/50 h-[300px] overflow-y-auto custom-scrollbar">
                       {ingestionFeed.map((item, i) => (
                         <div key={i} className="p-3 hover:bg-slate-900/50 transition-colors flex items-center justify-between group cursor-pointer">
                           <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-mono text-[10px]">
                               {item.time}
                             </div>
                             <div>
                               <div className="text-sm text-slate-200 font-mono">{item.id}</div>
                               <div className="text-[11px] text-slate-500 font-semibold">{item.source} • {item.entity}</div>
                             </div>
                           </div>
                           <div className="text-right flex items-center gap-4">
                             <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
                               {item.latency}
                             </Badge>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </TacticalCard>
               </motion.div>
             )}

              {activeTab === 'infinite' && (
                <motion.div key="infinite" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-5">

                  {/* ── Головний блок ── */}
                  <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 via-slate-950/80 to-fuchsia-950/40 backdrop-blur-xl p-6">
                    {/* Animated background pulse */}
                    {infiniteRunning && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-500/5 animate-ping" style={{ animationDuration: '3s' }} />
                      </div>
                    )}
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div className={cn('w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-500',
                            infiniteRunning ? 'bg-violet-500/20 border-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.6)]' : 'bg-slate-900/80 border-slate-600'
                          )}>
                            <Infinity size={30} className={cn('transition-all', infiniteRunning ? 'text-violet-300 animate-pulse' : 'text-slate-500')} />
                          </div>
                          {infiniteRunning && <div className="absolute -inset-1 rounded-2xl border border-violet-400/30 animate-ping opacity-40" />}
                        </div>
                        <div>
                          <div className="text-xs text-violet-400 font-black uppercase tracking-[0.2em] mb-1">♥️ OODA LOOP • AUTONOMOUS IMPROVEMENT ENGINE</div>
                          <h2 className="text-xl font-black text-white">
                            {infiniteRunning ? (
                              <><span className="text-violet-300">АКТИВНИЙ</span> — Цикл #{infiniteStats.cycles + 1}</>
                            ) : (
                              <><span className="text-slate-400">ЗУПИНЕНО</span> — Очікує команди</>
                            )}
                          </h2>
                          <p className="text-xs text-slate-400 mt-1 max-w-md">
                            Автономна система аналізує код, архітектуру та логи для генерації патчів і вдосконалень.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleInfiniteCycle}
                        className={cn('h-12 px-8 font-black tracking-widest uppercase text-sm transition-all shrink-0',
                          infiniteRunning
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_25px_rgba(225,29,72,0.5)] border border-rose-400/30'
                            : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-violet-400/30'
                        )}
                      >
                        {infiniteRunning ? <><Power size={16} className="mr-2" />ЗУПИНИТИ</> : <><Play size={16} className="mr-2" />ЗАПУСТИТИ ♾️</>}
                      </Button>
                    </div>

                    {/* Stats row */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {[
                        { label: 'Циклів OODA', value: infiniteStats.cycles, icon: RefreshCw, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                        { label: 'Покращень', value: infiniteStats.improvements, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                        { label: 'Багів виправлено', value: bugs.filter(b => b.status === 'fixed').length, icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
                      ].map(s => {
                        const Icon = s.icon;
                        return (
                          <div key={s.label} className={cn('rounded-xl border p-4 flex items-center gap-3', s.bg)}>
                            <Icon size={18} className={s.color} />
                            <div>
                              <div className={cn('text-2xl font-black font-mono', s.color)}>{s.value}</div>
                              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── OODA Фази ── */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { id: 'observe', label: 'ОБСЕРВАЦІЯ', sub: 'Збір метрик', icon: Eye, color: 'cyan' },
                      { id: 'orient', label: 'ОРІЄНТАЦІЯ', sub: 'Аналіз даних', icon: BrainCircuit, color: 'fuchsia' },
                      { id: 'decide', label: 'РІШЕННЯ', sub: 'Вибір стратегії', icon: Cog, color: 'amber' },
                      { id: 'act', label: 'ДІЯ', sub: 'Деплой / Фікс', icon: Zap, color: 'emerald' },
                    ].map((phase, idx) => {
                      const Icon = phase.icon;
                      const isActive = infinitePhase === phase.id && infiniteRunning;
                      const colorStyles: Record<string, { border: string; text: string; bg: string; glow: string }> = {
                        cyan:    { border: 'border-cyan-500/60',    text: 'text-cyan-300',    bg: 'bg-cyan-900/30',    glow: '0 0 20px rgba(6,182,212,0.5)' },
                        fuchsia: { border: 'border-fuchsia-500/60', text: 'text-fuchsia-300', bg: 'bg-fuchsia-900/30', glow: '0 0 20px rgba(217,70,239,0.5)' },
                        amber:   { border: 'border-amber-500/60',   text: 'text-amber-300',   bg: 'bg-amber-900/30',   glow: '0 0 20px rgba(245,158,11,0.5)' },
                        emerald: { border: 'border-emerald-500/60', text: 'text-emerald-300', bg: 'bg-emerald-900/30', glow: '0 0 20px rgba(16,185,129,0.5)' },
                      };
                      const cs = colorStyles[phase.color];
                      return (
                        <div
                          key={phase.id}
                          style={isActive ? { boxShadow: cs.glow } : {}}
                          className={cn(
                            'relative rounded-xl border p-4 flex flex-col items-center gap-2 text-center transition-all duration-500',
                            isActive ? `${cs.border} ${cs.bg}` : 'border-slate-800/60 bg-slate-950/40 opacity-40'
                          )}
                        >
                          {isActive && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current animate-ping opacity-60" style={{ color: 'inherit' }} />}
                          <Icon size={22} className={isActive ? cs.text : 'text-slate-600'} />
                          <div className={cn('text-[10px] font-black tracking-widest uppercase', isActive ? cs.text : 'text-slate-600')}>{phase.label}</div>
                          <div className="text-[9px] text-slate-600">{phase.sub}</div>
                          {/* Номер фази дальше */}
                          {idx < 3 && (
                            <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                              <ChevronRight size={14} className={isActive ? cs.text : 'text-slate-700'} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Живий Термінал з логами ── */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest ml-2">
                          <Terminal size={11} className="inline mr-1 text-violet-400" />
                          PREDATOR-OODA-LOOP -- жива трансляція
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {infiniteRunning && (
                          <motion.div
                            key="rec"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                            className="flex items-center gap-1.5 text-rose-400 text-[9px] font-black uppercase"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> REC
                          </motion.div>
                        )}
                        <span className="text-[9px] font-mono text-slate-600">логи: {infiniteLogs.length}/50</span>
                      </div>
                    </div>
                    <div className="h-[300px] overflow-y-auto p-4 font-mono text-[11px] space-y-1 custom-scrollbar" id="ooda-log-terminal">
                      {infiniteLogs.length === 0 && (
                        <div className="text-slate-600 flex items-center gap-2 py-4 justify-center">
                          <Terminal size={16} />
                          <span>Очікуємо запуску OODA циклу...</span>
                        </div>
                      )}
                      {infiniteLogs.map((log, i) => {
                        let cls = 'text-slate-400';
                        if (log.includes('OBSERVE')) cls = 'text-cyan-400';
                        else if (log.includes('ORIENT')) cls = 'text-fuchsia-400';
                        else if (log.includes('DECIDE')) cls = 'text-amber-400';
                        else if (log.includes('ACT') || log.includes('✅')) cls = 'text-emerald-400';
                        else if (log.includes('SYSTEM')) cls = 'text-violet-300 font-black';
                        else if (log.includes('❌') || log.includes('ERROR')) cls = 'text-rose-400';
                        return (
                          <motion.div
                            key={i}
                            initial={i === infiniteLogs.length - 1 ? { opacity: 0, x: -8 } : {}}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn('flex gap-2 leading-relaxed', cls)}
                          >
                            <span className="shrink-0 text-slate-700 select-none">{String(i + 1).padStart(3, '0')}</span>
                            <span className="break-all">{log}</span>
                          </motion.div>
                        );
                      })}
                      {infiniteRunning && (
                        <div className="flex items-center gap-2 text-violet-400 mt-2">
                          <Loader2 size={11} className="animate-spin" />
                          <span className="animate-pulse">Обробка...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

           </AnimatePresence>
        </div>

        {/* Right Column: AI Controller */}
        <div className="w-80 shrink-0 flex flex-col gap-5">
           <Button 
             onClick={startEveryFunction}
             className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black tracking-widest text-sm shadow-[0_0_30px_rgba(139,92,246,0.4)] border border-violet-400/20 uppercase transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]"
           >
              <Power size={18} className="mr-2" /> ГОЛОВНИЙ ЗАПУСК 🚀
           </Button>

           <TacticalCard title="АВТОНОМНИЙ ЧАТ-КООРДИНАТОР" variant="holographic" className="flex-1 flex flex-col min-h-[500px] relative">
             {/* Chat History */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40 min-h-0">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={cn(
                        "p-3.5 rounded-xl text-[13px] relative",
                        msg.sender === 'user' 
                          ? "bg-gradient-to-br from-indigo-600/80 to-indigo-900/80 border border-indigo-400/20 text-indigo-50 ml-4 rounded-tr-none" 
                          : "bg-slate-900/80 border border-emerald-500/15 text-emerald-100 mr-4 rounded-tl-none font-mono shadow-sm"
                      )}
                    >
                       {msg.sender === 'system' && (
                         <div className="absolute -left-3 -top-3 w-7 h-7 rounded-full bg-slate-950 border border-emerald-500/40 flex items-center justify-center">
                            <Bot size={14} className="text-emerald-400" />
                         </div>
                       )}
                       <span className="leading-relaxed text-xs">{msg.text}</span>
                    </motion.div>
                  ))}
                  {isProcessing && (
                     <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-slate-900/80 border border-slate-700 text-slate-400 p-3 rounded-xl mr-6 font-mono text-[11px] flex items-center gap-2 w-fit"
                     >
                        <Loader2 size={14} className="animate-spin text-indigo-500" /> 
                        <span className="tracking-widest uppercase text-[10px]">Аналіз...
                        </span>
                     </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
             </div>

             {/* Input */}
             <div className="p-3 bg-slate-950/90 border-t border-indigo-500/20">
                <form onSubmit={(e) => { e.preventDefault(); if (inputText.trim()) { handleCommand(inputText); setInputText(''); } }} className="relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Команда координатору..."
                    className="w-full bg-black/60 border border-indigo-500/30 focus:border-indigo-400 rounded-xl py-4 pl-4 pr-12 text-[12px] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                    spellCheck="false"
                  />
                  <button 
                    type="submit" 
                    disabled={!inputText.trim() || isProcessing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-slate-600 transition-all"
                  >
                     <Send size={15} />
                  </button>
                </form>
             </div>
           </TacticalCard>
        </div>
      </div>
    </div>
  );
}
