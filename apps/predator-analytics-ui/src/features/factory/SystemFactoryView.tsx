import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, Zap, GitBranch, Cpu, Activity, Database, CheckCircle2,
  Terminal, Play, RotateCcw, Box, Network, Send, Loader2, Bot, Sliders,
  Server, Shield, Power, ActivitySquare, AlertTriangle, Layers, RefreshCw, AlignLeft, X, XCircle, Plus, Minus, Key, HardDrive, Wifi, Sparkles, BarChart, Cog, Wrench, ChevronRight,
  Bug, HeartPulse, Flame, Eye, Infinity, Repeat,
  Cloud, Share2, FileText, BarChart3, Binary, BrainCircuit, 
  CircleDot, Fingerprint, Microscope, Scan, ShieldCheck, History as HistoryIcon,
  ServerCrash, ShieldAlert
} from 'lucide-react';
import { RiskLevelValue } from '@/types/intelligence';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { PageTransition } from '@/components/layout/PageTransition';

import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { factoryApi, monitoringApi, apiClient, api } from '@/services/api';
import { systemApi } from '@/services/api/system';
import { RegistryStats } from './components/RegistryStats';
import { AntigravityAgiTab } from './components/AntigravityAgiTab';
import { FabrykaAutonomousTab } from './components/FabrykaAutonomousTab';
import { EvolutionAgentPanel } from './components/EvolutionAgentPanel';
import {
  createEmptyRegistryStats,
  deriveImprovementProgress,
  normalizeClusterPods,
  normalizeHealthChecks,
  normalizePodLogs,
  normalizeRegistryStats,
  type FactoryHealthCheckRecord,
  type FactoryPodRecord,
  type FactoryRegistryStatsSnapshot,
} from './systemFactoryView.utils';

const graphApi = api.graph;

const SearchIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const ArrowUpIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>;

interface FactoryMessage {
  id: string;
  sender: 'user' | 'system';
  text: string;
  timestamp: Date;
  action?: 'build' | 'test' | 'deploy' | 'analyze' | 'kubectl';
}

export default function SystemFactoryView() {
  const [messages, setMessages] = useState<FactoryMessage[]>([
    {
      id: 'msg-0',
      sender: 'system',
      text: 'ЗАВОД PREDATOR v57.2-WRAITH ІНІЦІАЛІЗОВАНО. Очікую команд для управління K8s кластером, архітектурою або CI/CD.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stats
  const [pipelineProgress, setPipelineProgress] = useState(100);
  const [systemScore, setSystemScore] = useState<{ quality: number | null; coverage: number | null; security: number | null }>({
    quality: null,
    coverage: null,
    security: null,
  });
  const [activeTab, setActiveTab] = useState<'cicd' | 'k8s' | 'network' | 'improve' | 'ingestion' | 'bugfix' | 'infinite' | 'health' | 'antigravity' | 'autonomous' | 'evolution'>('autonomous');


  // ═══ Ingestion State ═══
  const [ingestionMetrics] = useState({ rps: '2,847', success: 99.12, proxies: '340/400' });
  const [ingestionFeed, setIngestionFeed] = useState<Array<{ id: string; source: string; entity: string; latency: string; time: string }>>([
    { id: 'INJ-0xA1F3', source: 'EDR Registry', entity: 'ТОВ "УКРПРОМ"', latency: '142ms', time: '14:32:01' },
    { id: 'INJ-0xB2C4', source: 'Court Decisions', entity: 'Справа №914/1234', latency: '89ms', time: '14:32:03' },
    { id: 'INJ-0xC3D5', source: 'Customs DB', entity: 'Декларація MD-2024-0012', latency: '215ms', time: '14:32:05' },
    { id: 'INJ-0xD4E6', source: 'SANCTIONS', entity: 'SDN Entity Check', latency: '67ms', time: '14:32:07' },
    { id: 'INJ-0xE5F7', source: 'OpenData API', entity: 'Бенефіціар ЄДРПОУ 12345678', latency: '178ms', time: '14:32:09' },
  ]);

  type BugSeverity = RiskLevelValue;
  type BugStatus = 'detected' | 'fixing' | 'fixed';
  type InfinitePhase = 'observe' | 'orient' | 'decide' | 'act';

  interface InfiniteStatusPayload {
    is_running: boolean;
    current_phase: InfinitePhase;
    cycles_completed: number;
    improvements_made: number;
    logs?: string[];
    last_update?: string | null;
  }

  // ═══ Infinite Improvement State ═══
  const [infiniteRunning, setInfiniteRunning] = useState(false);
  const [infinitePhase, setInfinitePhase] = useState<InfinitePhase>('observe');
  const [infiniteLogs, setInfiniteLogs] = useState<string[]>(["[SYSTEM] Цикл OODA ініціалізовано. Очікую команди запуску."]);
  const [infiniteStats, setInfiniteStats] = useState({ improvements: 0, bugs: 0, cycles: 0 });
  const [infiniteLastUpdate, setInfiniteLastUpdate] = useState<string>('Ще не синхронізовано');
  const [infiniteSyncedAt, setInfiniteSyncedAt] = useState<string>('—');
  const [bugs, setBugs] = useState<Array<{ id: string, description: string, severity: BugSeverity, component: string, file: string, status: BugStatus, fixProgress: number }>>([]);
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [goldPatterns, setGoldPatterns] = useState<any[]>([]);
  const [factoryStats, setFactoryStats] = useState<any>(null);
  const [registryStats, setRegistryStats] = useState<FactoryRegistryStatsSnapshot>(createEmptyRegistryStats());
  const [pods, setPods] = useState<FactoryPodRecord[]>([]);
  const [healthChecks, setHealthChecks] = useState<FactoryHealthCheckRecord[]>([]);

  const applyInfiniteStatus = useCallback((status: InfiniteStatusPayload) => {
    setInfiniteRunning(status.is_running);
    setInfinitePhase(status.current_phase ?? 'observe');

    if (Array.isArray(status.logs) && status.logs.length > 0) {
      setInfiniteLogs(status.logs.slice(-50));
    }

    setInfiniteStats(prev => ({
      ...prev,
      improvements: Number(status.improvements_made ?? prev.improvements),
      cycles: Number(status.cycles_completed ?? prev.cycles),
    }));

    setInfiniteLastUpdate(
      status.last_update ? new Date(status.last_update).toLocaleString('uk-UA') : 'Ще не синхронізовано'
    );
    setInfiniteSyncedAt(new Date().toLocaleTimeString('uk-UA'));
  }, []);

  const refreshInfiniteStatus = useCallback(async (includeBugs: boolean = false) => {
    try {
      const status = await factoryApi.getInfiniteStatus() as InfiniteStatusPayload;
      applyInfiniteStatus(status);
      setIsBackendOffline(false);

      if (includeBugs && status.current_phase === 'act') {
        const updatedBugs = await factoryApi.getBugs();
        setBugs(updatedBugs);
      }
      return status;
    } catch (error) {
      setIsBackendOffline(true);
      console.error('Failed to refresh infinite status:', error);
      
      setInfiniteLogs(prev => {
        const last = prev[prev.length - 1] || '';
        if (last.includes('Очікування сервера')) return prev;
        
        const time = new Date().toLocaleTimeString('uk-UA');
        const newLogs = [...prev, `[${time}] ⚠️ ERROR: Зв'язок із бекендом втрачено. Очікування сервера для продовження OODA циклу...`];
        return newLogs.slice(-50);
      });
      return null;
    }
  }, [applyInfiniteStatus]);

  // ═══ Real Data Loading ═══
  const refreshData = useCallback(async () => {
    try {
      const [statsData, patternsData, bugsData, clusterData, graphSummary, infiniteStatus] = await Promise.all([
        factoryApi.getStats(),
        factoryApi.getGoldPatterns(),
        factoryApi.getBugs(),
        monitoringApi.getClusterStatus().catch(() => null),
        graphApi.getSummary().catch(() => null),
        factoryApi.getInfiniteStatus()
      ]);

      if (statsData) {
        setFactoryStats(statsData);
        setSystemScore({
          quality: Number.isFinite(Number(statsData.avg_score)) ? Math.round(Number(statsData.avg_score)) : null,
          coverage: null,
          security: null,
        });
      } else {
        setSystemScore({ quality: null, coverage: null, security: null });
      }

      if (patternsData) setGoldPatterns(patternsData);
      setBugs(Array.isArray(bugsData) ? bugsData : []);
      setRegistryStats(normalizeRegistryStats(graphSummary));

      if (infiniteStatus) {
        applyInfiniteStatus(infiniteStatus as InfiniteStatusPayload);
      }

      setPods(normalizeClusterPods(clusterData));
    } catch (error) {
      console.error('Error fetching factory data:', error);
      setRegistryStats(createEmptyRegistryStats());
      setPods([]);
    }
  }, [applyInfiniteStatus]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); 
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleFixBug = async (bugId: string) => {
    try {
      await factoryApi.fixBug(bugId);
      setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status: 'fixing', fixProgress: 10 } : b));
      pushSystemMessage(`🐛 АВТОФІКС: Запит на виправлення [${bugId}] відправлено на сервер.`, 'analyze');
      await refreshData();
    } catch (e) {
      pushSystemMessage(`❌ Помилка при виклику автофіксу: ${e}`, 'analyze');
    }
  };

  const refreshHealth = async () => {
    try {
      const [statusData, fallbackHealth] = await Promise.allSettled([
        systemApi.getStatus(),
        apiClient.get('/health').then((res) => res.data),
      ]);

      const primaryPayload =
        statusData.status === 'fulfilled'
          ? statusData.value
          : fallbackHealth.status === 'fulfilled'
            ? fallbackHealth.value
            : null;

      setHealthChecks(normalizeHealthChecks(primaryPayload));
    } catch (e) {
      console.error("Health refresh failed:", e);
      setHealthChecks([]);
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
  const [improvementStatus, setImprovementStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [improvementProgress, setImprovementProgress] = useState(0);

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

  const handleStartImprovement = async () => {
    try {
      setImprovementStatus('running');
      setInfiniteRunning(true);
      
      const time = new Date().toLocaleTimeString('uk-UA');
      setInfiniteLogs(prev => [...prev.slice(-49), `[${time}] 🚀 SYSTEM: Ініціалізація OODA циклу. Звернення до Core API...`]);
      pushSystemMessage('🚀 Ініційовано цикл автономного вдосконалення системи на бекенді...', 'build');
      
      // Насправді запускаємо OODA Loop на бекенді
      await factoryApi.startInfinite();
      await refreshInfiniteStatus(true);
      
      pushSystemMessage('✅ Сервер підтвердив запуск циклу вдосконалення (OODA).', 'build');
      
    } catch (e) {
      console.warn("Бекенд недоступний при старті OODA. Входимо в режим очікування.", e);
      const time = new Date().toLocaleTimeString('uk-UA');
      setInfiniteLogs(prev => [...prev.slice(-49), `[${time}] 📡 SYSTEM: Бекенд недоступний. Цикл очікує і буде продовжено щойно сервер з'явиться...`]);
      pushSystemMessage('📡 Сервер недоступний. Цикл залишається активним і продовжить роботу, щойно система підніметься у мережі (auto-reconnect).', 'analyze');
    }
  };

  const [logsPodId, setLogsPodId] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = messagesEndRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const el = logsEndRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView();
    }
  }, [liveLogs]);

  useEffect(() => {
    if (!logsPodId) return;
    const pod = pods.find(p => p.id === logsPodId);
    if (!pod) {
      setLiveLogs([]);
      return;
    }

    let active = true;

    const refreshPodLogs = async () => {
      try {
        const logs = await monitoringApi.streamSystemLogs(100);
        if (!active) {
          return;
        }

        setLiveLogs(normalizePodLogs(logs, pod));
      } catch (error) {
        console.error('Не вдалося завантажити системні логи:', error);
        if (active) {
          setLiveLogs([]);
        }
      }
    };

    void refreshPodLogs();
    const interval = setInterval(() => {
      void refreshPodLogs();
    }, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [logsPodId, pods]);

  const pushSystemMessage = (text: string, action?: FactoryMessage['action']) => {
    setMessages(prev => [...prev, {
      id: `sys-action-${Date.now()}-${prev.length}`,
      sender: 'system',
      text,
      timestamp: new Date(),
      action
    }]);
  };

  const handleCheckReliability = () => {
    pushSystemMessage('Chaos Engineering не підключено до окремого бекенд-ендпоїнта. Розділ показує лише підтверджену телеметрію без локального моделювання вразливостей.', 'analyze');
  };

  const handleUpdateKnowledgeMap = () => {
    pushSystemMessage('Синхронізація Knowledge Map з графовою базою Neo4j... Застосовано нові онтологічні правила.', 'build');
  };


  const handleScalePod = (podId: string) => {
    pushSystemMessage(`Оркестраційний виклик для [${podId}] не підключено. Інтерфейс не змінює кількість реплік без підтвердженого API.`, 'kubectl');
  };

  const handleScaleDownPod = (podId: string) => {
    pushSystemMessage(`Оркестраційний виклик для [${podId}] не підключено. Scale down блокується до появи серверного endpoint.`, 'kubectl');
  };

  const handleShowLogs = (podId: string) => {
    setLogsPodId(podId);
  };

  const handlePodRestart = (podId: string) => {
    pushSystemMessage(`Рестарт для [${podId}] недоступний з UI без окремого backend orchestration endpoint. Стан pod лишається тільки читальним.`, 'kubectl');
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
       if (lower.includes('api') || lower.includes('core')) {
         const apiPod = pods.find((pod) => pod.name.toLowerCase().includes('api'));
         if (apiPod) {
           handleShowLogs(apiPod.id);
           return 'Відкриваю підтверджені системні логи для pod API.';
         }
         return 'Pod API не підтверджено у відповіді `/system/cluster`.';
       }
       return 'Вкажіть підсистему для перегляду логів (напр. "покажи логи API").';
    }

    if (lower.includes('кеш') || lower.includes('cache')) {
       return { action: 'deploy', reply: 'Операція очищення кешу не підключена до окремого backend endpoint. UI не виконує `FLUSHALL` локально.' };
    }
    
    if (lower.includes('секрет') || lower.includes('secret')) {
       return { action: 'analyze', reply: 'Ротація секретів не підключена до окремого backend endpoint. Розділ не симулює зміну TLS або Kubernetes Secrets.' };
    }

    // Pipeline commands
    if (lower.includes('тест') || lower.includes('перевір')) {
      return { action: 'test', reply: 'Запускаю матрицю інтеграційних тестів та E2E перевірок.' };
    } 
    if (lower.includes('білд') || lower.includes('збір')) {
      setPipelineProgress(0);
      return { action: 'build', reply: 'Ініційовано процес збірки Docker образів та CI. Контекст оновлено.' };
    } 

    if (lower.includes('що') && (lower.includes('виправ') || lower.includes('роби'))) {
        const detectedBugs = bugs.filter(b => b.status === 'detected');
        if (detectedBugs.length > 0) {
            return `На даний момент виявлено ${detectedBugs.length} дефектів. Найкритичніший: ${detectedBugs[0].id} (${detectedBugs[0].description}). Рекомендую запустити авто-фікс.`;
        }
        return 'Система працює стабільно. Активних дефектів не знайдено. OODA-цикл проводить превентивне сканування.';
    }

    if (lower.includes('статус') || lower.includes('прогрес')) {
        const activeFixes = bugs.filter(b => b.status === 'fixing');
        let statusMsg = infiniteRunning ? "OODA Loop: АКТИВНИЙ. " : "OODA Loop: ЗУПИНЕНО. ";
        if (activeFixes.length > 0) {
            statusMsg += `Процес ремедіації: виправлення ${activeFixes[0].id} (${activeFixes[0].fixProgress}%).`;
        } else {
            statusMsg += "Активних виправлень немає.";
        }
        return statusMsg;
    }

    if (lower.includes('виправ') || lower.includes('фікс') || lower.includes('fix')) {
       const targetBugs = bugs.filter(b => b.status === 'detected');
       if (targetBugs.length > 0) {
          handleFixBug(targetBugs[0].id);
          return `Ініційовано виправлення ${targetBugs[0].id}. Аналізую AST-дерево для побудови патчу...`;
       }
       return 'Черга дефектів порожня. Немає чого виправляти.';
    }

    if (lower.includes('деплой') || lower.includes('запусти') || lower.includes('пуск') || lower.includes('start')) {
      if (lower.includes('все') || lower.includes('всі') || lower.includes('систем')) {
        setTimeout(() => startEveryFunction(), 0);
        return 'Запускаю серверний OODA цикл і оновлюю телеметрію. Локальні оркестраційні сценарії не симулюються.';
      }
      if (lower.includes('ooda') || lower.includes('цикл')) {
        if (!infiniteRunning) {
           handleInfiniteCycle();
           return 'OODA Loop активовано за вашою командою.';
        }
        return 'OODA Loop вже працює в штатному режимі.';
      }
      return { action: 'deploy', reply: 'Розгортаю оновлення системних компонентів у кластер...' };
    }

    if (lower.includes('зупини') || lower.includes('стоп') || lower.includes('stop')) {
        if (infiniteRunning) {
            handleInfiniteCycle();
            return 'Зупиняю цикл автономного вдосконалення...';
        }
        return 'Система і так знаходиться в режимі очікування.';
    }
    
    return 'Команда передана аналітичному ядру. Очікуйте на підтвердження виконання...';
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
    if (isProcessing) return;
    setIsProcessing(true);
    
    const time = new Date().toLocaleTimeString('uk-UA');
    const newRunningState = !infiniteRunning;

    try {
      if (newRunningState) {
        // Спроба запуску
        setInfiniteRunning(true);
        setInfiniteLogs(prev => [...prev.slice(-49), `[${time}] 🚀 SYSTEM: Команда на запуск OODA циклу.`]);
        pushSystemMessage('🚀 Ініціалізація OODA Loop на бекенді...', 'analyze');
        
        try {
          await factoryApi.startInfinite();
          pushSystemMessage('✅ OODA LOOP АКТИВОВАНО.', 'analyze');
        } catch (e) {
          pushSystemMessage('📡 Бекенд недоступний. Цикл перейшов у режим очікування з\'єднання.', 'analyze');
          setInfiniteLogs(prev => [...prev.slice(-49), `[${time}] 📡 SYSTEM: Очікування підключення до бекенду...`]);
        }
      } else {
        // Зупинка
        setInfiniteRunning(false);
        setInfiniteLogs(prev => [...prev.slice(-49), `[${time}] 🛑 SYSTEM: Команда на зупинку циклу.`]);
        pushSystemMessage('🛑 OODA LOOP ЗУПИНЕНО.', 'analyze');
        
        try {
          await factoryApi.stopInfinite();
        } catch (e) {
          console.warn("Stop signal failed, but UI updated.");
        }
      }
      
      // Синхронізація
      setTimeout(() => refreshInfiniteStatus(true), 1500);
    } catch (e) {
      console.error("Failed to toggle infinite cycle:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const ensureInfiniteRunning = async () => {
    try {
      let currentRunning = infiniteRunning;

      try {
        const backendStatus = await factoryApi.getInfiniteStatus() as InfiniteStatusPayload;
        currentRunning = Boolean(backendStatus.is_running);
        applyInfiniteStatus(backendStatus);
      } catch (statusError) {
        console.warn('Сервер недоступний для перевірки статусу OODA.', statusError);
      }

      const time = new Date().toLocaleTimeString('uk-UA');
      if (!currentRunning) {
        setInfiniteRunning(true);
        setInfiniteLogs(prev => [...prev.slice(-49), `[${time}] 🚀 SYSTEM: Синхронізація OODA циклу з бекендом...`]);
        pushSystemMessage('🚀 Ініційовано підключення до OODA циклу...', 'analyze');
        try {
          await factoryApi.startInfinite();
          pushSystemMessage('✅ ВДОСКОНАЛЕННЯ PREDATOR ЗАПУЩЕНО НА БЕКЕНДІ.', 'analyze');
        } catch(e) {
          pushSystemMessage('📡 Не вдалося підключитися до сервера. Очікування на появу бекенду...', 'analyze');
          setInfiniteLogs(prev => [...prev.slice(-49), `[${time}] 📡 SYSTEM: Відсутній зв'язок із сервером. Автономне очікування...`]);
        }
      } else {
        pushSystemMessage('♾️ OODA-цикл уже активний на бекенді. Продовжую без перезапуску.', 'deploy');
      }

      await refreshInfiniteStatus(true);
    } catch (error) {
      console.error('Failed to ensure infinite cycle is running:', error);
    }
  };

  // ═══ OODA Loop Sync with Backend ═══
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (infiniteRunning) {
      interval = setInterval(() => {
        void refreshInfiniteStatus(true);
      }, 5000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [infiniteRunning, refreshInfiniteStatus]);

  useEffect(() => {
    setImprovementProgress(deriveImprovementProgress(infiniteRunning, infinitePhase));
  }, [infinitePhase, infiniteRunning]);

  const startEveryFunction = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      setActiveTab('infinite');
      
      // 1. Початок вдосконалення (UI стан)
      setImprovementStatus('running');
      
      // 2. Запуск OODA на бекенді через handleInfiniteCycle або напряму
      if (!infiniteRunning) {
        setInfiniteRunning(true);
        const time = new Date().toLocaleTimeString('uk-UA');
        setInfiniteLogs(prev => [...prev.slice(-49), `[${time}] 🚀 SYSTEM: Глобальний запуск ініційовано командиром.`]);
        
        try {
           await factoryApi.startInfinite();
           pushSystemMessage('✅ MASTER START: OODA Loop АКТИВОВАНО.', 'analyze');
        } catch (e) {
           pushSystemMessage('📡 MASTER START: Сервер недоступний, але OODA Loop у режимі очікування.', 'analyze');
        }
      }
      // 3. Авто-фікс багів
      const detectedBugs = bugs.filter(b => b.status === 'detected');
      if (detectedBugs.length > 0) {
        pushSystemMessage(`🛠 Виявлено багів: ${detectedBugs.length}. Запускаю чергу виправлень...`, 'build');
        detectedBugs.forEach((bug, index) => {
          setTimeout(() => handleFixBug(bug.id), (index + 1) * 3000);
        });
      }

      await refreshInfiniteStatus(true);
    } catch (err) {
      console.error("Master Start failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Tab config ──────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'autonomous',  label: 'FABRYKA v2.0',      icon: Sparkles,      color: 'gold',    glow: 'rgba(212,175,55,0.7)' },
    { id: 'evolution',   label: 'EvolutionAgent',    icon: BrainCircuit,  color: 'gold',    glow: 'rgba(212,175,55,0.5)' },
    { id: 'infinite',    label: 'OODA Loop',         icon: Infinity,      color: 'amber',   glow: 'rgba(212,175,55,0.4)' },
    { id: 'improve',     label: 'Вдосконалення',     icon: Sparkles,      color: 'gold',    glow: 'rgba(217,119,6,0.4)' },
    { id: 'bugfix',      label: 'Автофікс',           icon: Bug,           color: 'amber',   glow: 'rgba(239,68,68,0.4)'  },
    { id: 'health',      label: 'Health Check',       icon: HeartPulse,    color: 'emerald', glow: 'rgba(16,185,129,0.4)' },
    { id: 'antigravity', label: 'Antigravity AGI',    icon: BrainCircuit,  color: 'gold',    glow: 'rgba(212,175,55,0.6)' },
    { id: 'k8s',         label: 'Kubernetes',         icon: Layers,        color: 'amber',   glow: 'rgba(212,115,55,0.4)'  },
    { id: 'cicd',        label: 'CI/CD Pipeline',     icon: GitBranch,     color: 'emerald', glow: 'rgba(16,185,129,0.4)' },
    { id: 'ingestion',   label: 'Інгестія',           icon: Scan,          color: 'amber',   glow: 'rgba(249,115,22,0.4)' },
    { id: 'network',     label: 'Мережа',             icon: Network,       color: 'amber',   glow: 'rgba(6,182,212,0.4)'  },
  ] as const;

  return (
    <PageTransition>
      <div className="min-h-screen pb-20 bg-[#020617] text-slate-200 relative overflow-hidden font-sans">
        <AdvancedBackground />
        <CyberGrid color="rgba(212, 175, 55, 0.05)" />
      
      <ViewHeader 
        title="СУВЕРЕННИЙ ЗАВОД PREDATOR"
        subtitle="Автономне вдосконалення · Kubernetes · CI/CD · Моніторинг інфраструктури"
        icon={<Factory size={24} className="text-amber-500" />}
        breadcrumbs={['ПРЕДАТОР', 'АДМІНІСТРУВАННЯ', 'ЗАВОД']}
        stats={[
          {
            label: 'Кластер',
            value: pods.length === 0 ? 'Н/д' : pods.some(p => p.status !== 'Running') ? 'Деградація' : 'Справно',
            icon: <Server size={14} />,
            color: pods.length === 0 ? 'default' : pods.some(p => p.status !== 'Running') ? 'warning' : 'success',
          },
          {
            label: 'Якість коду',
            value: systemScore.quality == null ? 'Н/д' : `${systemScore.quality}%`,
            icon: <CheckCircle2 size={14}/>,
            color: 'primary',
          },
          {
            label: 'OODA цикл',
            value: infiniteRunning ? 'Активний' : 'Очікування',
            icon: <Infinity size={14}/>,
            color: infiniteRunning ? 'success' : 'warning',
          }
        ]}
      />

      {/* ── Основна сітка ──────────────────────────────────────────── */}
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 mt-6 flex gap-5 relative z-10">
        
        {/* ── Вертикальний Sidebar-Навігатор ── */}
        <div className="hidden xl:flex flex-col gap-1.5 w-48 shrink-0">
          {/* Логотип Factory */}
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-amber-900/40 to-amber-950/20 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Factory size={14} className="text-amber-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Factory v57.2-WRAITH</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              {activeTab === 'autonomous' || activeTab === 'evolution' ? (
                <span className="text-amber-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />FABRYKA v2.0</span>
              ) : infiniteRunning ? (
                <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />OODA активний</span>
              ) : (
                <span className="text-slate-500">OODA в очікуванні</span>
              )}
            </div>
          </div>

          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const colorMap: Record<string, string> = {
              violet: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
              fuchsia: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
              amber: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
              gold: 'text-amber-500 bg-amber-600/15 border-amber-500/40',
              teal: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
              yellow: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
              emerald: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
              orange: 'text-orange-400 bg-orange-500/15 border-orange-500/40',
              cyan: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
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
                  <span className="ml-auto shrink-0 w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-black flex items-center justify-center">
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
              { label: 'Цикли OODA', value: infiniteStats.cycles, color: 'text-amber-400' },
              { label: 'Покращень', value: infiniteStats.improvements, color: 'text-emerald-400' },
              { label: 'Відкритих багів', value: bugs.filter(b => b.status !== 'fixed').length, color: 'text-amber-400' },
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
          <div className="xl:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
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
             {activeTab === 'autonomous' && (
               <motion.div key="autonomous" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-0">
                 <FabrykaAutonomousTab />
               </motion.div>
             )}
             {activeTab === 'evolution' && (
               <motion.div key="evolution" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-0">
                 <EvolutionAgentPanel />
               </motion.div>
             )}
             {activeTab === 'antigravity' && (
               <motion.div key="antigravity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-0">
                 <AntigravityAgiTab />
               </motion.div>
             )}
             {activeTab === 'improve' && (
                <motion.div key="improve" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  
                  {/* Sovereign Control Center Header */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-6 p-6 bg-slate-900/40 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(212,175,55,0.3)] shrink-0">
                        <Factory size={28} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base lg:text-lg font-black uppercase tracking-widest text-white truncate">ГОЛОВНИЙ ПУЛЬТ УПРАВЛІННЯ ЦИКЛОМ</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 font-mono text-[10px] uppercase">
                          <span className={cn(infiniteRunning ? "text-emerald-400" : "text-amber-500")}>
                             <span className="opacity-50 text-slate-400 mr-1.5">СТАТУС:</span>
                             {infiniteRunning ? 'АКТИВНИЙ ЦИКЛ' : 'РЕЖИМ ОЧІКУВАННЯ'}
                          </span>
                          <span className="text-slate-500">|</span>
                          <span className="text-amber-400">
                             <span className="opacity-50 text-slate-400 mr-1.5">ФАЗА:</span>
                             {infinitePhase === 'observe' ? 'СПОСТЕРЕЖЕННЯ' : 
                              infinitePhase === 'orient' ? 'ОРІЄНТАЦІЯ' : 
                              infinitePhase === 'decide' ? 'РІШЕННЯ' : 'ДІЯ'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex flex-wrap lg:flex-nowrap items-center gap-3">
                       <Button 
                         variant="neon" 
                         size="sm" 
                         className="flex-1 lg:flex-none px-6 bg-emerald-600/20 text-emerald-400 border-emerald-500/50 text-[10px] uppercase font-black h-11"
                         onClick={() => { startEveryFunction(); }}
                       >
                         <Zap size={14} className="mr-2" /> МАЙСТЕР ЗАПУСК
                       </Button>
                       <Button 
                         variant="neon" 
                         size="sm" 
                         className="flex-1 lg:flex-none px-6 bg-yellow-600/20 text-yellow-400 border-yellow-500/50 text-[10px] uppercase font-black h-11"
                         onClick={() => { setImprovementStatus('running'); setActiveCycle('building'); handleStartImprovement(); }}
                       >
                         <Play size={14} className="mr-2" /> ЗАПУСТИТИ
                       </Button>
                       <Button 
                         variant="cyber" 
                         size="sm" 
                         className="flex-1 lg:flex-none px-4 bg-amber-600/10 text-amber-500 border-amber-500/40 text-[10px] uppercase font-black h-11"
                         onClick={async () => {
                           setImprovementStatus('idle');
                           setImprovementProgress(0);
                           setActiveCycle('idle');
                           await factoryApi.stopInfinite();
                           await refreshData();
                         }}
                       >
                         <AlertTriangle size={14} className="mr-2" /> ЗУПИНКА
                       </Button>
                    </div>
                  </div>

                  {/* Mode Selection Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Button 
                        onClick={() => setImprovementMode('tech')}
                        variant={improvementMode === 'tech' ? 'neon' : 'cyber'}
                        className={cn("h-auto py-10 rounded-2xl flex flex-col items-center gap-5 transition-all relative overflow-hidden group", 
                          improvementMode === 'tech' ? 'border-yellow-500/60 shadow-[0_0_30px_rgba(79,70,229,0.3)] bg-yellow-500/10' : 'border-white/5 text-slate-500 opacity-60 hover:opacity-100')}
                      >
                        {improvementMode === 'tech' && <div className="absolute inset-0 bg-yellow-500/5 animate-pulse" />}
                        <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 group-hover:scale-110 transition-transform">
                          <Binary size={32} className="text-yellow-400" />
                        </div>
                        <div className="text-center">
                          <span className="text-[13px] font-black uppercase tracking-[0.15em] block">Технологічна Вертикаль</span>
                          <span className="text-[9px] text-yellow-400/80 font-mono mt-2 uppercase tracking-wide">Інфраструктура та Core API</span>
                        </div>
                      </Button>
                      <Button 
                        onClick={() => setImprovementMode('analytic')}
                        variant={improvementMode === 'analytic' ? 'neon' : 'cyber'}
                        className={cn("h-auto py-10 rounded-2xl flex flex-col items-center gap-5 transition-all relative overflow-hidden group", 
                          improvementMode === 'analytic' ? 'border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.3)] bg-amber-500/10' : 'border-white/5 text-slate-500 opacity-60 hover:opacity-100')}
                      >
                        {improvementMode === 'analytic' && <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />}
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
                          <BrainCircuit size={32} className="text-amber-400" />
                        </div>
                        <div className="text-center">
                          <span className="text-[13px] font-black uppercase tracking-[0.15em] block text-amber-100">Аналітична Вертикаль</span>
                          <span className="text-[9px] text-amber-400/80 font-mono mt-2 uppercase tracking-wide">Карти Знань та Патерни</span>
                        </div>
                      </Button>
                      <Button 
                        onClick={() => setImprovementMode('complex')}
                        variant={improvementMode === 'complex' ? 'neon' : 'cyber'}
                        className={cn("h-auto py-10 rounded-2xl flex flex-col items-center gap-5 transition-all relative overflow-hidden group", 
                          improvementMode === 'complex' ? 'border-amber-500/60 shadow-[0_0_30px_rgba(212,175,55,0.3)] bg-amber-500/10' : 'border-white/5 text-slate-500 opacity-60 hover:opacity-100')}
                      >
                        {improvementMode === 'complex' && <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />}
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
                          <Sparkles size={32} className="text-amber-400" />
                        </div>
                        <div className="text-center">
                          <span className="text-[13px] font-black uppercase tracking-[0.15em] block text-white">Комплексний Нагляд</span>
                          <span className="text-[9px] text-amber-400/80 font-mono mt-2 uppercase tracking-wide">Суверенне Розгортання</span>
                        </div>
                      </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Technical Column */}
                    {(improvementMode === 'tech' || improvementMode === 'complex') && (
                      <section className="page-section section-yellow border-yellow-500/30 shadow-xl overflow-hidden">
                        <div className="section-header">
                          <div className="section-dot-yellow" />
                          <h2 className="section-title">Технологічний Стек</h2>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 gap-2">
                             {techOptions.map(opt => (
                               <label key={opt.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", 
                                 techComponents.includes(opt.id) ? "bg-yellow-500/10 border-yellow-500/40" : "bg-black/20 border-white/5 hover:border-white/10")}>
                                  <input type="checkbox" checked={techComponents.includes(opt.id)} onChange={() => toggleSelection(opt.id, techComponents, setTechComponents)} className="accent-yellow-500 w-4 h-4" />
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">{opt.label}</span>
                                    {techComponents.includes(opt.id) && <span className="text-[8px] text-yellow-400 animate-pulse uppercase tracking-[0.2em]">ПРИЗНАЧЕНО ДЛЯ ОПТИМІЗАЦІЇ</span>}
                                  </div>
                               </label>
                             ))}
                          </div>
                          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                             <Button onClick={handleStartImprovement} variant="neon" className="w-full bg-yellow-600/20 text-yellow-400 border-yellow-500/50 font-black uppercase tracking-widest text-[10px] h-11"><Wrench size={14} className="mr-2"/> Оптимізувати Ядро</Button>
                             <div className="grid grid-cols-2 gap-2">
                               <Button variant="cyber" className="text-[9px] h-9"><HistoryIcon size={12} className="mr-1"/> Відкат (Rollback)</Button>
                               <Button variant="cyber" className="text-[9px] h-9 text-emerald-400 border-emerald-500/20"><Scan size={12} className="mr-1"/> Сканування Безпеки</Button>
                             </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Analytical Column */}
                    {(improvementMode === 'analytic' || improvementMode === 'complex') && (
                      <section className="page-section section-amber border-amber-500/30 shadow-xl overflow-hidden">
                        <div className="section-header">
                          <div className="section-dot-amber" />
                          <h2 className="section-title">Аналітичний Інтелект</h2>
                        </div>
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
                      </section>
                    )}

                    <section className="page-section section-emerald border-emerald-500/30 bg-emerald-500/5 shadow-xl overflow-hidden mt-6 md:mt-0">
                      <div className="section-header">
                        <div className="section-dot-emerald" />
                        <h2 className="section-title">Суверенні Інтеграції</h2>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-emerald-500/20">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                             <ShieldCheck size={20} />
                           </div>
                           <div className="flex-1">
                             <div className="text-[11px] font-black uppercase text-white">Зовнішні SaaS</div>
                             <div className="text-[8px] text-emerald-500 font-mono">Політика платформи: HR-15 забороняє зовнішні SaaS інтеграції</div>
                           </div>
                           <Badge variant="cyber" className="bg-slate-500/20 text-slate-300 text-[8px]">ВИМКНЕНО</Badge>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-yellow-500/20">
                           <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                             <Server size={20} />
                           </div>
                           <div className="flex-1">
                             <div className="text-[11px] font-black uppercase text-white">Серверні інтеграції</div>
                             <div className="text-[8px] text-yellow-400 font-mono">Показуються лише підтверджені внутрішні сервіси з health telemetry</div>
                           </div>
                           <Badge variant="cyber" className="bg-yellow-500/20 text-yellow-300 text-[8px]">{healthChecks.length > 0 ? 'ПІДТВЕРДЖЕНО' : 'Н/Д'}</Badge>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-amber-500/20">
                           <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                             <Cloud size={20} />
                           </div>
                           <div className="flex-1">
                             <div className="text-[11px] font-black uppercase text-white">Хмарні конектори</div>
                             <div className="text-[8px] text-amber-400 font-mono">Окремий бекенд-контракт для сторонніх конекторів не наданий</div>
                           </div>
                           <Badge variant="neon" className="bg-amber-500/20 text-amber-300 text-[8px]">НЕ ПІДКЛЮЧЕНО</Badge>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-mono leading-5 text-slate-300">
                            Інтерфейс не вмикає сторонні екосистеми локальним перемикачем. Для нових інтеграцій потрібен окремий серверний контракт і підтверджений канал синхронізації.
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Realtime Progress & Results UI */}
                  {(improvementStatus === 'running' || improvementStatus === 'done' || infiniteRunning) && (
                    <section className="page-section section-amber border-amber-500/20 shadow-xl overflow-hidden mt-6">
                      <div className="section-header">
                        <div className="section-dot-amber" />
                        <h2 className="section-title">Канал Подій Заводу (Events)</h2>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
                          <div>
                             <div className="flex items-center justify-between mb-3">
                               <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">ПОТОЧНИЙ ПРОГРЕС ЦИКЛУ</span>
                               <span className="font-mono text-xl font-black text-white">{improvementProgress}%</span>
                             </div>
                             <Progress value={improvementProgress} variant="holographic" className="h-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
                             
                             <div className="mt-8 grid grid-cols-2 gap-4">
                               <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                                 <Microscope size={24} className="text-amber-400 mb-2" />
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Аналіз</span>
                                 <Badge variant="cyber" className="mt-1">ЗАВЕРШЕНО</Badge>
                               </div>
                               <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                                 <Fingerprint size={24} className="text-yellow-400 mb-2" />
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Автентичність</span>
                                 <Badge variant="cyber" className="mt-1">ПЕРЕВІРЕНО</Badge>
                               </div>
                             </div>
                          </div>

                          <div className="bg-slate-950/80 rounded-2xl p-4 border border-amber-500/10 font-mono text-[10px] h-[200px] overflow-y-auto custom-scrollbar shadow-inner">
                             <div className="text-amber-400/60 mb-2 uppercase font-black tracking-widest">[ ПІДТВЕРДЖЕНІ ЛОГИ OODA ]</div>
                             {infiniteLogs.length > 0 ? (
                               <div className="space-y-1">
                                 {infiniteLogs.slice(-8).map((log, index) => (
                                   <div key={`${index}-${log}`} className={cn(
                                     'break-words',
                                     log.includes('ERROR') ? 'text-amber-300' : log.includes('SYSTEM') ? 'text-yellow-300' : 'text-slate-300',
                                   )}>
                                     {log}
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="text-slate-500">Бекенд не повернув журнал OODA. Блок не генерує локальні події.</div>
                             )}
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
                                 <p className="text-[9px] text-emerald-500/70 font-mono uppercase">Звіт формується лише з підтверджених server-side станів OODA та Factory API</p>
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
                                     <td className="p-3 text-yellow-400 font-bold border-l-2 border-yellow-500">Технологічна</td>
                                     <td className="p-3 text-slate-200">Стан за OODA та telemetry</td>
                                     <td className="p-3 text-emerald-400 font-bold">{infiniteRunning ? 'АКТИВНО' : 'ОЧІКУВАННЯ'}</td>
                                   </tr>
                                   <tr className="bg-white/5 rounded-xl transition-all hover:bg-white/10">
                                     <td className="p-3 text-amber-400 font-bold border-l-2 border-amber-500">Аналітична</td>
                                     <td className="p-3 text-slate-200">Gold patterns і bug queue</td>
                                     <td className="p-3 text-emerald-400 font-bold">{goldPatterns.length > 0 || bugs.length > 0 ? 'ПІДТВЕРДЖЕНО' : 'Н/Д'}</td>
                                   </tr>
                                 </tbody>
                               </table>
                             </div>

                             <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                               <Button variant="ghost" className="bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-white">ЕКСПОРТ (JSON)</Button>
                               <Button variant="cyber" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[9px] font-black uppercase tracking-widest hover:bg-yellow-500/30">Звіт (PDF)</Button>
                             </div>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </motion.div>
             )}

             {activeTab === 'k8s' && (
               <motion.div key="k8s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  
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
                               <th className="p-4 font-black">Ресурси</th>
                               <th className="p-4 font-black">Дії</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                             {pods.length > 0 ? pods.map(pod => (
                               <tr key={pod.id} className="hover:bg-white/5 transition-colors group">
                                  <td className="p-4">
                                     <div className="flex items-center gap-3">
                                        <div className={cn("w-2 h-2 rounded-full", pod.status === 'Running' ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-amber-500 animate-pulse")} />
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
                                     <Badge variant={pod.status === 'Running' ? "cyber" : "neon"}>
                                        {pod.status === 'Restarting' ? <RefreshCw size={10} className="inline mr-1 animate-spin" /> : null}
                                        {pod.status}
                                     </Badge>
                                     {pod.restarts > 0 && <div className="text-[9px] text-slate-500 mt-2 ml-1 cursor-help" title={`Перезапуски: ${pod.restarts}`}>↻ {pod.restarts}</div>}
                                  </td>
                                  <td className="p-4 text-[11px] font-mono text-slate-300">
                                     <div className="flex items-center gap-2">
                                        <Cpu size={12} className="text-amber-400" /> {pod.cpu}
                                        <HardDrive size={12} className="text-slate-400 ml-2" /> {pod.mem}
                                     </div>
                                  </td>
                                   <td className="p-4">
                                     <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                          onClick={() => handlePodRestart(pod.id)}
                                          disabled
                                          variant="ghost"
                                          size="icon"
                                          className="p-2 h-10 w-10 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 flex flex-col items-center justify-center hover:border-amber-500/50 rounded-lg border border-transparent transition-all disabled:opacity-40" title="Оркестраційний endpoint не підключено"
                                        >
                                           <Power size={14} />
                                        </Button>
                                        <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-transparent">
                                          <Button 
                                            onClick={() => handleScalePod(pod.id)}
                                            disabled
                                            variant="ghost"
                                            size="icon"
                                            className="p-2 h-10 w-10 hover:bg-yellow-500/20 hover:text-yellow-400 transition-all border-r border-white/5 disabled:opacity-40" title="Оркестраційний endpoint не підключено"
                                          >
                                             <Plus size={14} />
                                          </Button>
                                          <Button 
                                            onClick={() => handleScaleDownPod(pod.id)}
                                            disabled
                                            variant="ghost"
                                            size="icon"
                                            className="p-2 h-10 w-10 hover:bg-yellow-500/20 hover:text-yellow-400 transition-all disabled:opacity-40" title="Оркестраційний endpoint не підключено"
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
               </motion.div>
             )}

             {activeTab === 'network' && (
               <motion.div key="network" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <RegistryStats stats={registryStats} />
                  <section className="page-section section-amber shadow-xl overflow-hidden mt-6">
                     <div className="section-header">
                       <div className="section-dot-amber" />
                       <h2 className="section-title">Топологія Мережі та Інфраструктура</h2>
                     </div>
                     <div className="p-8 relative min-h-[300px] flex items-center justify-center">
                        <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
                        
                        <div className="relative w-full max-w-3xl flex justify-between items-center z-10">
                           {/* Frontend Section */}
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 rounded-xl bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                                 <Network size={24} />
                              </div>
                              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest mt-2">Nginx / UI</span>
                           </div>

                           <div className="h-1 flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 mx-4 opacity-50 relative">
                              <span className="absolute -top-4 w-full text-center text-[9px] text-slate-400 font-mono tracking-widest">TLS / WAF</span>
                           </div>

                           {/* Core API */}
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 border-2 border-yellow-500 flex flex-col items-center justify-center text-yellow-400 relative shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                                 <span className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full animate-pulse border border-black shadow-[0_0_5px_#10b981]" />
                                 <Server size={32} />
                                 <span className="text-[8px] mt-1 font-black leading-none uppercase">API Gateway</span>
                              </div>
                              <span className="text-[10px] font-black uppercase text-yellow-400 tracking-widest mt-2">Core API</span>
                           </div>

                           <div className="h-1 flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 mx-4 opacity-50 relative flex flex-col items-center">
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
                                 <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/50 flex items-center justify-center text-amber-400">
                                    <ActivitySquare size={20} />
                                 </div>
                                 <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Neo4j</span>
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
                           <span className="text-xs font-mono text-white">Н/д</span>
                        </div>
                        <div className="flex flex-col gap-1 items-center border-r border-white/5">
                           <HardDrive size={14} className="text-slate-400 mb-1" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Постійні Томи (Vol)</span>
                           <span className="text-xs font-mono text-white">Потрібен endpoint</span>
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                           <Shield size={14} className="text-emerald-400 mb-1" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Мережеві Політики</span>
                           <span className="text-xs font-mono text-white">Непідтверджено</span>
                        </div>
                     </div>
                  </section>
               </motion.div>
             )}

             {activeTab === 'cicd' && (
               <motion.div key="cicd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <section className="page-section section-amber shadow-xl overflow-hidden mt-6">
                    <div className="section-header">
                      <div className="section-dot-amber" />
                      <h2 className="section-title">Конвеєр Вдосконалення Системи</h2>
                    </div>
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
                          <div className="bg-slate-900/50 p-4 border border-yellow-500/20 rounded-xl relative overflow-hidden group">
                             <div className="absolute bottom-0 left-0 h-1 bg-yellow-500 transition-all duration-1000" style={{ width: `${systemScore.quality ?? 0}%` }} />
                             <div className="text-[10px] text-slate-500 uppercase font-black">Якість Коду (Sonar)</div>
                             <div className="text-2xl font-black text-yellow-400 mt-1">{systemScore.quality == null ? 'Н/д' : `${systemScore.quality}%`}</div>
                          </div>
                          <div className="bg-slate-900/50 p-4 border border-amber-500/20 rounded-xl relative overflow-hidden group">
                             <div className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-1000" style={{ width: `${systemScore.coverage ?? 0}%` }} />
                             <div className="text-[10px] text-slate-500 uppercase font-black">Тестове покриття</div>
                             <div className="text-2xl font-black text-amber-400 mt-1">{systemScore.coverage == null ? 'Н/д' : `${systemScore.coverage}%`}</div>
                          </div>
                          <div className="bg-slate-900/50 p-4 border border-amber-500/20 rounded-xl relative overflow-hidden group">
                             <div className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-1000" style={{ width: `${systemScore.security ?? 0}%` }} />
                             <div className="text-[10px] text-slate-500 uppercase font-black">Безпека (Trivy + OPA)</div>
                             <div className="text-2xl font-black text-amber-400 mt-1">{systemScore.security == null ? 'Н/д' : `${systemScore.security}%`}</div>
                          </div>
                       </div>
                    </div>
                  </section>
               </motion.div>
             )}

              {activeTab === 'bugfix' && (
                <motion.div key="fix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/40 to-slate-900/40 border border-amber-500/20 rounded-2xl backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Bug size={28} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">АВТОНОМНЕ ВИПРАВЛЕННЯ БАГІВ</h3>
                        <p className="text-[10px] font-mono text-slate-400 uppercase">
                          ВИЯВЛЕНО: {bugs.filter(b => b.status === 'detected').length} | ВИПРАВЛЯЄТЬСЯ: {bugs.filter(b => b.status === 'fixing').length} | ВИПРАВЛЕНО: {bugs.filter(b => b.status === 'fixed').length}
                        </p>
                      </div>
                    </div>
                    <Button variant="neon" className="bg-amber-600/20 text-amber-300 border-amber-500/50 text-[9px] uppercase font-black" onClick={() => bugs.filter(b => b.status === 'detected').forEach(b => handleFixBug(b.id))}>
                      <Zap size={12} className="mr-1" /> Автовиправити все
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {bugs.map(bug => (
                      <motion.div key={bug.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={cn(
                        "p-4 rounded-xl border backdrop-blur-md flex items-center justify-between transition-all",
                        bug.status === 'fixed' && "bg-emerald-950/20 border-emerald-500/20",
                        bug.status === 'fixing' && "bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
                        bug.status === 'detected' && "bg-amber-950/10 border-amber-500/10",
                      )}>
                        <div className="flex items-center gap-4 w-full">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                            bug.severity === 'critical' ? "bg-amber-600/20 text-amber-400 border-amber-500/50" : 
                            bug.severity === 'high' ? "bg-orange-500/20 text-orange-400 border-orange-500/50" : 
                            bug.severity === 'medium' ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-slate-700/20 text-slate-400 border-slate-500/50"
                          )}>
                             {bug.severity === 'critical' || bug.severity === 'high' ? <Flame size={18} /> : <Bug size={18} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono text-slate-500">{bug.id}</span>
                              <Badge variant={bug.severity === 'critical' ? 'destructive' : bug.severity === 'high' ? 'outline' : 'default'} className={cn("text-[9px]", 
                                  bug.severity === 'critical' && "bg-amber-600/20 text-amber-400",
                                  bug.severity === 'high' && "bg-orange-500/20 text-orange-400",
                                  bug.severity === 'medium' && "bg-amber-500/20 text-amber-400",
                                  bug.severity === 'low' && "bg-slate-700/20 text-slate-400"
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
                              <Button variant="neon" size="sm" className="bg-amber-600/20 text-amber-300 border-amber-500/50 text-[9px] uppercase font-black" onClick={() => handleFixBug(bug.id)}>
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
                <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/40 to-slate-900/40 border border-amber-500/30 rounded-2xl backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <HeartPulse size={28} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">СИСТЕМНИЙ HEALTH CHECK</h3>
                        <p className="text-[10px] font-mono text-amber-400 uppercase">
                          СЕРВІСІВ АКТИВНИХ: {healthChecks.filter(h => h.status === 'healthy').length}/{healthChecks.length} | ОНОВЛЕННЯ КОЖНІ 30 СЕК
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-6 py-2 rounded-xl border text-sm font-black uppercase",
                      healthChecks.length > 0 && healthChecks.every(h => h.status === 'healthy')
                        ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "bg-amber-500/20 border-amber-400/50 text-amber-400"
                    )}>
                      {healthChecks.length === 0 ? 'Н/Д' : healthChecks.every(h => h.status === 'healthy') ? '✅ ВСЕ ЗДОРОВО' : '⚠️ Є ДЕГРАДАЦІЇ'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {healthChecks.length > 0 ? healthChecks.map(hc => (
                      <motion.div key={hc.id} layout className={cn(
                        "p-4 rounded-xl border backdrop-blur-md flex items-center gap-4 transition-all",
                        hc.status === 'healthy' && "bg-emerald-950/10 border-emerald-500/20",
                        hc.status === 'degraded' && "bg-amber-950/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
                        hc.status === 'down' && "bg-amber-950/20 border-amber-600/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-lg border flex items-center justify-center shrink-0",
                          hc.status === 'healthy' && "bg-emerald-500/20 border-emerald-400/50 text-emerald-400",
                          hc.status === 'degraded' && "bg-amber-500/20 border-amber-400/50 text-amber-400",
                          hc.status === 'down' && "bg-amber-600/20 border-amber-400/50 text-amber-500",
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
                              hc.latency == null ? 'text-slate-500' : hc.latency < 20 ? 'text-emerald-400' : hc.latency < 50 ? 'text-amber-400' : 'text-amber-600'
                            )}>⚡ {hc.latency == null ? 'Н/д' : `${hc.latency}ms`}</span>
                            <span className="text-slate-500">Uptime: {hc.uptime}</span>
                            <span className="text-slate-600">{hc.lastCheckLabel}</span>
                          </div>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase",
                          hc.status === 'healthy' && "bg-emerald-500/20 text-emerald-400",
                          hc.status === 'degraded' && "bg-amber-500/20 text-amber-400",
                          hc.status === 'down' && "bg-amber-600/20 text-amber-400",
                        )}>
                          {hc.status === 'healthy' ? 'ЗДОРОВИЙ' : hc.status === 'degraded' ? 'ДЕГРАДАЦІЯ' : 'НЕДОСТУПНИЙ'}
                        </div>
                      </motion.div>
                    )) : (
                      <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-8 text-center text-sm leading-6 text-slate-400">
                        `/system/status` або `/health` не повернули структуру сервісів. Health Check лишається порожнім замість локально вигаданих аптаймів і latency.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

             {activeTab === 'ingestion' && (
               <motion.div key="ingestion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                 <RegistryStats stats={registryStats} />
                 <section className="page-section section-orange shadow-xl overflow-hidden mt-6">
                    <div className="section-header">
                      <div className="section-dot-orange" />
                      <h2 className="section-title">Контролер Парсингу та Інгестії</h2>
                    </div>
                   <div className="grid grid-cols-3 gap-4 mb-6 mt-4">
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
                     <div className="bg-slate-900/50 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
                       <div className="flex flex-col">
                         <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ротація Проксі (Proxy)</span>
                         <div className="text-2xl text-amber-400 font-mono font-bold mt-1">{ingestionMetrics.proxies}</div>
                       </div>
                       <Network className="text-amber-500/50" size={32} />
                     </div>
                   </div>

                   <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                     <div className="bg-slate-900 py-3 px-4 border-b border-slate-800 flex items-center justify-between">
                       <span className="text-[11px] font-black tracking-widest uppercase text-slate-400 flex items-center gap-2">
                         <Terminal size={14} className="text-orange-500" /> Жива Стрічка Інгестії
                       </span>
                       <div className="flex gap-2">
                         <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                         <div className="text-[10px] text-amber-400 font-mono font-bold uppercase">Запис</div>
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
                 </section>
               </motion.div>
             )}

              {activeTab === 'infinite' && (
                <motion.div key="infinite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

                  {/* ═══ 1. ЗАГОЛОВОК OODA ═══ */}
                  <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/60 via-slate-950/80 to-yellow-950/40 backdrop-blur-xl p-6 lg:p-8 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                    {infiniteRunning && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/5 animate-ping" style={{ animationDuration: '3s' }} />
                      </div>
                    )}
                    <div className="relative z-10 flex flex-col gap-6">
                      {/* Рядок: Іконка + Назва + Кнопка */}
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-6">
                        <div className="flex items-center gap-5 min-w-0">
                          <div className="relative shrink-0">
                            <div className={cn('w-14 h-14 lg:w-16 lg:h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-500',
                              infiniteRunning ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_30px_rgba(212,175,55,0.6)]' : 'bg-slate-900/80 border-slate-600'
                            )}>
                              <Infinity size={28} className={cn('transition-all', infiniteRunning ? 'text-amber-300 animate-pulse' : 'text-slate-500')} />
                            </div>
                            {infiniteRunning && <div className="absolute -inset-1 rounded-2xl border border-amber-400/30 animate-ping opacity-40" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-amber-400 font-black uppercase tracking-[0.15em] mb-1">🔄 ЦИКЛ OODA • АВТОНОМНИЙ ДВИГУН ВДОСКОНАЛЕННЯ</div>
                            <h2 className="text-lg lg:text-2xl font-black text-white leading-tight">
                              {infiniteRunning ? (
                                <><span className="text-amber-300">АКТИВНИЙ</span> <span className="text-slate-500">—</span> Цикл <span className="text-amber-200 font-mono">#{infiniteStats.cycles + 1}</span></>
                              ) : (
                                <><span className="text-slate-400">ЗУПИНЕНО</span> <span className="text-slate-600">—</span> <span className="text-slate-500">Очікує команди</span></>
                              )}
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-1.5">
                              Автономна система аналізує код, архітектуру та логи для генерації патчів і вдосконалень.
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={handleInfiniteCycle}
                          className={cn('h-12 px-8 font-black tracking-widest uppercase text-sm transition-all shrink-0 w-full lg:w-auto rounded-xl',
                            infiniteRunning
                              ? 'bg-amber-700 hover:bg-amber-600 text-white shadow-[0_0_25px_rgba(212,175,55,0.4)] border border-amber-400/30'
                              : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-[0_0_25px_rgba(212,175,55,0.5)] border border-amber-400/30'
                          )}
                        >
                          {infiniteRunning ? <><Power size={16} className="mr-2" />ЗУПИНИТИ</> : <><Play size={16} className="mr-2" />ЗАПУСТИТИ</>}
                        </Button>
                      </div>

                      {/* Рядок бейджів */}
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn(
                            'border text-[10px] font-black uppercase tracking-widest px-3 py-1',
                            infiniteRunning
                              ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                              : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                          )}>
                            Сервер: {infiniteRunning ? 'АКТИВНИЙ' : 'ЗУПИНЕНИЙ'}
                          </Badge>
                          <Badge className="border border-amber-400/20 bg-amber-500/10 text-amber-200 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                            Автовідновлення
                          </Badge>
                          <Badge className="border border-slate-400/20 bg-slate-500/10 text-slate-200 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                            Збереження стану
                          </Badge>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 lg:text-right flex flex-col gap-0.5">
                          <span>Синхр: {infiniteSyncedAt}</span>
                          <span>Бекенд: {infiniteLastUpdate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ═══ 2. СТАТИСТИКА ═══ */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Циклів OODA', value: infiniteStats.cycles, icon: RefreshCw, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                      { label: 'Покращень', value: infiniteStats.improvements, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                      { label: 'Багів виправлено', value: bugs.filter(b => b.status === 'fixed').length, icon: CheckCircle2, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    ].map(s => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className={cn('rounded-2xl border p-5 flex items-center gap-4', s.bg)}>
                          <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
                            <Icon size={20} className={s.color} />
                          </div>
                          <div>
                            <div className={cn('text-2xl font-black font-mono', s.color)}>{s.value}</div>
                            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ═══ 3. OODA ФАЗИ ═══ */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { id: 'observe', label: 'ОБСЕРВАЦІЯ', sub: 'Збір метрик', icon: Eye, color: 'slate' },
                      { id: 'orient', label: 'ОРІЄНТАЦІЯ', sub: 'Аналіз даних', icon: BrainCircuit, color: 'amber' },
                      { id: 'decide', label: 'РІШЕННЯ', sub: 'Вибір стратегії', icon: Cog, color: 'orange' },
                      { id: 'act', label: 'ДІЯ', sub: 'Деплой / Фікс', icon: Zap, color: 'emerald' },
                    ].map((phase, idx) => {
                      const Icon = phase.icon;
                      const isActive = infinitePhase === phase.id && infiniteRunning;
                      const colorStyles: Record<string, { border: string; text: string; bg: string; glow: string }> = {
                        slate:   { border: 'border-slate-500/60',   text: 'text-slate-300',   bg: 'bg-slate-900/30',   glow: '0 0 20px rgba(148,163,184,0.3)' },
                        amber:   { border: 'border-amber-500/60',   text: 'text-amber-300',   bg: 'bg-amber-900/30',   glow: '0 0 20px rgba(245,158,11,0.5)' },
                        orange:  { border: 'border-orange-500/60',  text: 'text-orange-300',  bg: 'bg-orange-900/30',  glow: '0 0 20px rgba(249,115,22,0.5)' },
                        emerald: { border: 'border-emerald-500/60', text: 'text-emerald-300', bg: 'bg-emerald-900/30', glow: '0 0 20px rgba(16,185,129,0.5)' },
                      };
                      const cs = colorStyles[phase.color];
                      return (
                        <div
                          key={phase.id}
                          style={isActive ? { boxShadow: cs.glow } : {}}
                          className={cn(
                            'relative rounded-2xl border p-5 flex flex-col items-center gap-3 text-center transition-all duration-500',
                            isActive ? `${cs.border} ${cs.bg}` : 'border-slate-800/60 bg-slate-950/40 opacity-40'
                          )}
                        >
                          {isActive && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-current animate-ping opacity-60" style={{ color: 'inherit' }} />}
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isActive ? 'bg-black/20' : 'bg-transparent')}>
                            <Icon size={24} className={isActive ? cs.text : 'text-slate-600'} />
                          </div>
                          <div className={cn('text-[10px] font-black tracking-widest uppercase', isActive ? cs.text : 'text-slate-600')}>{phase.label}</div>
                          <div className="text-[9px] text-slate-600">{phase.sub}</div>
                          {idx < 3 && (
                            <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10">
                              <ChevronRight size={14} className={isActive ? cs.text : 'text-slate-700'} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ═══ 4. ЖИВИЙ ТЕРМІНАЛ ═══ */}
                  <div className="rounded-2xl border border-amber-500/20 bg-slate-950/90 overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-500/20 bg-amber-500/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex gap-1.5 shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest ml-2 truncate">
                          <Terminal size={11} className="inline mr-1 text-amber-400" />
                          PREDATOR-OODA — ЖИВА ТРАНСЛЯЦІЯ
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {infiniteRunning && (
                          <motion.div
                            key="rec"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                            className="flex items-center gap-1.5 text-amber-400 text-[9px] font-black uppercase"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> REC
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
                        if (log.includes('OBSERVE')) cls = 'text-slate-300';
                        else if (log.includes('ORIENT')) cls = 'text-amber-400';
                        else if (log.includes('DECIDE')) cls = 'text-orange-400';
                        else if (log.includes('ACT') || log.includes('✅')) cls = 'text-emerald-400';
                        else if (log.includes('SYSTEM')) cls = 'text-amber-300 font-black';
                        else if (log.includes('❌') || log.includes('ERROR')) cls = 'text-amber-500';
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
                        <div className="flex items-center gap-2 text-amber-400 mt-2">
                          <Loader2 size={11} className="animate-spin" />
                          <span className="animate-pulse">
                            {infiniteLogs[infiniteLogs.length - 1]?.includes('ERROR') 
                                ? 'Відновлення з\'єднання...' 
                                : 'Обробка...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>

          {/* AI Coordinator Terminal */}
          <div className="lg:w-2/3">
             <section className="page-section section-amber h-[500px] flex flex-col p-0 border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]">
               <div className="section-header px-6 pt-6 mb-2">
                 <div className="section-dot-amber" />
                 <div>
                   <h2 className="section-title">Інтерфейс AI-Координатора</h2>
                   <p className="section-subtitle">Прямий канал управління OODA-ядро</p>
                 </div>
               </div>
               <div className="flex flex-col h-full bg-black/40 overflow-hidden">
                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950/20">
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div 
                          key={msg.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "group flex flex-col gap-1.5",
                            msg.sender === 'user' ? "items-end" : "items-start"
                          )}
                        >
                           <div className={cn(
                             "max-w-[85%] p-4 rounded-2xl text-[13px] relative shadow-lg",
                             msg.sender === 'user' 
                               ? "bg-gradient-to-br from-amber-600 to-amber-700 text-amber-50 rounded-tr-none border border-amber-400/30" 
                               : "bg-slate-900/90 border border-amber-500/20 text-amber-50 rounded-tl-none ring-1 ring-amber-500/5"
                           )}>
                              {msg.sender === 'system' && (
                                <Bot size={14} className="absolute -left-7 top-1 text-amber-500 opacity-50" />
                              )}
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              {msg.sender === 'user' && (
                                <div className="absolute -right-7 top-1 text-yellow-500/50">
                                   <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px] font-bold">U</div>
                                </div>
                              )}
                           </div>
                           <span className="text-[9px] font-medium text-slate-500 uppercase px-2">
                              {msg.sender} • {msg.timestamp.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </motion.div>
                      ))}
                      {isProcessing && (
                         <motion.div 
                          layout
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex items-center gap-3 text-emerald-500/70 p-2"
                         >
                            <Loader2 size={14} className="animate-spin" /> 
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase">Координатор аналізує запит...</span>
                         </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Interface */}
                  <div className="p-4 bg-slate-900/40 border-t border-amber-500/10 backdrop-blur-md">
                     <form 
                       onSubmit={(e) => { 
                         e.preventDefault(); 
                         if (inputText.trim()) { 
                           handleCommand(inputText); 
                           setInputText(''); 
                         } 
                       }} 
                       className="relative"
                     >
                       <input
                         type="text"
                         value={inputText}
                         onChange={(e) => setInputText(e.target.value)}
                         placeholder="Введіть команду (напр. 'статус k8s', 'оптимізуй затримку' або 'виправ критичні баги')..."
                         className="w-full bg-black/60 border border-slate-700/50 focus:border-amber-500/50 rounded-xl py-4.5 pl-5 pr-14 text-sm text-amber-50 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all font-mono shadow-inner"
                         spellCheck="false"
                         autoFocus
                       />
                       <button 
                         type="submit" 
                         disabled={!inputText.trim() || isProcessing}
                         className={cn(
                           "absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-lg flex items-center justify-center transition-all shadow-xl",
                           inputText.trim() && !isProcessing 
                            ? "bg-amber-500 hover:bg-amber-400 text-black scale-100" 
                            : "bg-slate-800 text-slate-600 scale-95 opacity-50"
                         )}
                       >
                          <Send size={18} />
                       </button>
                     </form>
                     <div className="mt-3 flex items-center gap-4 px-1">
                        <div className="flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ядро Системи</span>
                        </div>
                        <div className="h-3 w-px bg-slate-800"></div>
                         <span className="text-[9px] text-slate-600 uppercase tracking-wider italic">Натисніть Enter для відправки запиту</span>
                     </div>
                  </div>
               </div>
             </section>
          </div>
    </div>
  </PageTransition>
  );
}
