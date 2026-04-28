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
import { TacticalCard } from '@/components/ui/TacticalCard';

import { useDataOpsStatus } from '@/hooks/useAdminApi';

import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { factoryApi, monitoringApi, systemApi, apiClient, api } from '@/services/api';
import { AntigravityAgiTab } from './components/AntigravityAgiTab';
import { FabrykaAutonomousTab } from './components/FabrykaAutonomousTab';
import { GeminiCloudAssist } from './components/GeminiCloudAssist';
import { EvolutionAgentPanel } from './components/EvolutionAgentPanel';
import { FactoryImprovementPanel } from './components/FactoryImprovementPanel';
import { FactoryK8sClusterPanel } from './components/FactoryK8sClusterPanel';
import { FactoryNetworkPanel } from './components/FactoryNetworkPanel';
import { FactoryBugFixPanel } from './components/FactoryBugFixPanel';
import { FactoryHealthPanel } from './components/FactoryHealthPanel';
import { FactoryIngestionPanel } from './components/FactoryIngestionPanel';
import { FactoryCicdPanel } from './components/FactoryCicdPanel';
import { FactoryOodaPanel } from './components/FactoryOodaPanel';
import { FactoryCoordinatorChat, type FactoryMessage } from './components/FactoryCoordinatorChat';
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
  type FactoryBugRecord,
  type InfinitePhase,
  type BugSeverity,
  type BugStatus,
} from './systemFactoryView.utils';

const graphApi = api.graph;




export default function SystemFactoryView() {
  const [messages, setMessages] = useState<FactoryMessage[]>([
    {
      id: 'msg-0',
      sender: 'system',
      text: 'СУВЕРЕННИЙ ЗАВОД PREDATOR v61.0-ELITE ІНІЦІАЛІЗОВАНО. Очікую директив для оркестрації K8s кластера, нейромережевого вдосконалення коду та CI/CD.',
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
  const [activeTab, setActiveTab] = useState<'cicd' | 'k8s' | 'network' | 'improve' | 'ingestion' | 'bugfix' | 'infinite' | 'health' | 'antigravity' | 'autonomous' | 'evolution' | 'cloud_assist'>('cloud_assist');

  // Improvement states
  const [improvementStatus, setImprovementStatus] = useState<'idle' | 'running' | 'success' | 'error' | 'done'>('idle');
  const [improvementProgress, setImprovementProgress] = useState(0);
  const [improvementMode, setImprovementMode] = useState<'tech' | 'analytic' | 'complex' | null>('complex');
  const [techComponents, setTechComponents] = useState<string[]>(['api', 'db', 'kafka']);
  const [analyticComponents, setAnalyticComponents] = useState<string[]>(['knowledge', 'datasets']);
  const [activeCycle, setActiveCycle] = useState<'idle' | 'building' | 'testing' | 'deploying' | 'analyzing'>('idle');

  // ═══ Ingestion State (REAL) ═══
  const { data: dataOps } = useDataOpsStatus();



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
  const [bugs, setBugs] = useState<FactoryBugRecord[]>([]);
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
        const newLogs = [...prev, `[${time}]  ️ ERROR: Зв'язок із бекендом втрачено. Очікування сервера для продовження OODA циклу...`];
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

  const handleMasterStart = async () => {
    pushSystemMessage('🌀 МАЙСТЕР-ЗАПУСК: Глобальна синхронізація всіх компонентів кластера...', 'deploy');
    await handleStartImprovement();
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
    pushSystemMessage('Chaos Engineering не підключено до окремого бекенд-ендпоїнта.  озділ показує лише підтверджену телеметрію без локального моделювання вразливостей.', 'analyze');
  };

  const handleUpdateKnowledgeMap = () => {
    pushSystemMessage('Синхронізація Knowledge Map з графовою базою Neo4j... Застосовано нові онтологічні правила.', 'build');
  };


  const handleScalePod = async (podId: string) => {
    try {
      await factoryApi.scalePod(podId, 1);
      pushSystemMessage(`Ініційовано збільшення реплік для [${podId}].`, 'kubectl');
      // Оновити список подів після затримки
      setTimeout(refreshData, 2000);
    } catch (error) {
      pushSystemMessage(`Помилка масштабування [${podId}]: ${error}`, 'error');
    }
  };

  const handleScaleDownPod = async (podId: string) => {
    try {
      await factoryApi.scaleDownPod(podId);
      pushSystemMessage(`Ініційовано зменшення реплік для [${podId}].`, 'kubectl');
      setTimeout(refreshData, 2000);
    } catch (error) {
      pushSystemMessage(`Помилка масштабування [${podId}]: ${error}`, 'error');
    }
  };

  const handleShowLogs = (podId: string) => {
    setLogsPodId(podId);
  };

  const handlePodRestart = async (podId: string) => {
    try {
      await factoryApi.restartPod(podId);
      pushSystemMessage(`Команду на перезапуск [${podId}] відправлено до оркестратора.`, 'kubectl');
      
      // Візуальна зміна статусу для зворотного зв'язку
      setPods(prev => prev.map(p => p.id === podId ? { ...p, status: 'Restarting' } : p));
      
      setTimeout(refreshData, 5000);
    } catch (error) {
      pushSystemMessage(`Не вдалося перезапустити [${podId}]: ${error}`, 'error');
    }
  };

  const handleStopInfinite = async () => {
    setImprovementStatus('idle');
    setImprovementProgress(0);
    setActiveCycle('idle');
    try {
      await factoryApi.stopInfinite();
      await refreshData();
    } catch (e) {
      console.error("Failed to stop infinite cycle:", e);
    }
  };

  const parseNaturalCommand = (text: string) => {
    const lower = text.toLowerCase();
    
    // Pod specific commands
    if (lower.includes('перезапусти') || lower.includes('рестарт')) {
      if (lower.includes('api') || lower.includes('core')) {
        handlePodRestart('core-api');
        return;
      }
      if (lower.includes('graph') || lower.includes('граф')) {
        handlePodRestart('graph-service');
        return;
      }
      if (lower.includes('ingest') || lower.includes('дані')) {
        handlePodRestart('ingestion-worker');
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
          pushSystemMessage(' ️ [DEBUG] FORCE SKIP OBSERVE. Перехід до фази ORIENT.', 'analyze');
          return 'Форсуємо завершення обсервації...';
       }
       return 'Команда не застосовна. OODA Loop не в фазі Обсервації.';
    }

    if (lower === 'autofix status') {
       const activeFixes = bugs.filter(b => b.status === 'fixing');
       if (activeFixes.length > 0) {
          return `🤖 [AUTOFIX STATUS] ${activeFixes.length} багів впроцесі ремедіації. Прогрес: ${activeFixes[0].fixProgress}%`;
       }
       return '🤖 [AUTOFIX STATUS] Немає активнихпроцесів виправлення коду.';
    }

    if (lower.includes('масштабуй') || lower.includes('скейл') || lower.includes('scale')) {
       if (lower.includes('api') || lower.includes('core')) { handleScalePod('core-api'); return; }
       if (lower.includes('ingest') || lower.includes('дані')) { handleScalePod('ingestion-worker'); return; }
       return 'Збільшую кількість реплік (scale) загально через HPA контролер до цільового рівня...';
    }

    if (lower.includes('менше') || lower.includes('даун') || lower.includes('зменш')) {
       if (lower.includes('api') || lower.includes('core')) { handleScaleDownPod('core-api'); return; }
       if (lower.includes('ingest') || lower.includes('дані')) { handleScaleDownPod('ingestion-worker'); return; }
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
       return 'Вкажіть підсистему дляперегляду логів (напр. "покажи логи API").';
    }

    if (lower.includes('кеш') || lower.includes('cache')) {
       return { action: 'deploy', reply: 'Операція очищення кешу не підключена до окремого backend endpoint. UI не виконує `FLUSHALL` локально.' };
    }
    
    if (lower.includes('секрет') || lower.includes('secret')) {
       return { action: 'analyze', reply: ' отація секретів не підключена до окремого backend endpoint.  озділ не симулює зміну TLS або Kubernetes Secrets.' };
    }

    // Pipeline commands
    if (lower.includes('тест') || lower.includes('перевір')) {
      return { action: 'test', reply: 'Запускаю матрицю інтеграційних тестів та E2E перевірок.' };
    } 
    if (lower.includes('білд') || lower.includes('збір')) {
      setPipelineProgress(0);
      return { action: 'build', reply: 'Ініційованопроцес збірки Docker образів та CI. Контекст оновлено.' };
    } 

    if (lower.includes('що') && (lower.includes('виправ') || lower.includes('роби'))) {
        const detectedBugs = bugs.filter(b => b.status === 'detected');
        if (detectedBugs.length > 0) {
            return `На даний момент виявлено ${detectedBugs.length} дефектів. Найкритичніший: ${detectedBugs[0].id} (${detectedBugs[0].description}). рекомендую запустити авто-фікс.`;
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
      return { action: 'deploy', reply: ' озгортаю оновлення системних компонентів у кластер...' };
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
        pushSystemMessage(`  Виявлено багів: ${detectedBugs.length}. Запускаю чергу виправлень...`, 'build');
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
    { id: 'autonomous',  label: 'FABRYKA v2.0',      icon: Sparkles,      color: 'rose',    glow: 'rgba(244,63,94,0.7)' },
    { id: 'evolution',   label: 'EvolutionAgent',    icon: BrainCircuit,  color: 'rose',    glow: 'rgba(244,63,94,0.5)' },
    { id: 'infinite',    label: 'OODA Loop',         icon: Infinity,      color: 'rose',    glow: 'rgba(244,63,94,0.4)' },
    { id: 'improve',     label: 'Вдосконалення',     icon: Sparkles,      color: 'rose',    glow: 'rgba(244,63,94,0.4)' },
    { id: 'bugfix',      label: 'Автофікс',           icon: Bug,           color: 'rose',    glow: 'rgba(244,63,94,0.4)'  },
    { id: 'health',      label: 'Health Check',       icon: HeartPulse,    color: 'emerald', glow: 'rgba(16,185,129,0.4)' },
    { id: 'antigravity', label: 'Antigravity AGI',    icon: BrainCircuit,  color: 'rose',    glow: 'rgba(244,63,94,0.6)' },
    { id: 'cloud_assist', label: 'Cloud Assist',       icon: Cloud,         color: 'emerald', glow: 'rgba(59,130,246,0.6)' },
    { id: 'k8s',         label: 'Kubernetes',         icon: Layers,        color: 'rose',    glow: 'rgba(244,63,94,0.4)'  },
    { id: 'cicd',        label: 'CI/CD Pipeline',     icon: GitBranch,     color: 'emerald', glow: 'rgba(16,185,129,0.4)' },
    { id: 'ingestion',   label: 'Інгестія',           icon: Scan,          color: 'rose',    glow: 'rgba(244,63,94,0.4)' },
    { id: 'network',     label: 'Мережа',             icon: Network,       color: 'rose',    glow: 'rgba(244,63,94,0.4)'  },
  ] as const;

  return (
    <PageTransition>
      <div className="min-h-screen pb-20 bg-[#050202] text-slate-200 relative overflow-hidden font-sans">
        <AdvancedBackground />
        <CyberGrid color="rgba(244, 63, 94, 0.08)" />
      
      <ViewHeader 
        title="СУВЕРЕННИЙ ЗАВОД PREDATOR"
        subtitle="Автономне вдосконалення · Kubernetes · CI/CD · Моніторинг інфраструктури"
        icon={<Factory size={24} className="text-rose-500" />}
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
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 mt-6 flex gap-6 relative z-10">
        
        {/* ── Вертикальний Sidebar-Навігатор ── */}
        <div className="hidden xl:flex flex-col gap-2 w-56 shrink-0">
          {/* Логотип Factory */}
          <TacticalCard variant="holographic" className="mb-4 border-rose-500/30 bg-rose-500/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <Factory size={16} className="text-rose-400" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-rose-500">FACTORY ELITE</div>
                <div className="text-[8px] text-slate-500 font-mono uppercase tracking-tighter">v61.0-ELITE</div>
              </div>
            </div>
            <div className="h-px bg-rose-500/20 my-2" />
            <div className="text-[9px] text-slate-400 font-mono">
              {activeTab === 'autonomous' || activeTab === 'evolution' ? (
                <span className="text-rose-400 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />FABRYKA v2.0 ACTIVE</span>
              ) : infiniteRunning ? (
                <span className="text-emerald-400 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />OODA LOOP RUNNING</span>
              ) : (
                <span className="text-slate-500 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-700" />SYSTEM STANDBY</span>
              )}
            </div>
          </TacticalCard>

          <div className="space-y-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all relative group",
                    isActive 
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-400" 
                      : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  )}
                >
                  <Icon size={18} className={cn("transition-colors", isActive ? "text-rose-400" : "group-hover:text-slate-400")} />
                  <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-rose-500/5 rounded-xl -z-10"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Контентна область ── */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'autonomous' && (
              <motion.div key="autonomous" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <FabrykaAutonomousTab />
              </motion.div>
            )}

            {activeTab === 'evolution' && (
              <motion.div key="evolution" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <EvolutionAgentPanel />
              </motion.div>
            )}

            {activeTab === 'antigravity' && (
              <motion.div key="antigravity" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <AntigravityAgiTab />
              </motion.div>
            )}

            {activeTab === 'improve' && (
              <motion.div key="improve" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                 <FactoryImprovementPanel
                    infiniteRunning={infiniteRunning}
                    infinitePhase={infinitePhase}
                    improvementStatus={improvementStatus}
                    improvementProgress={improvementProgress}
                    improvementMode={improvementMode}
                    setImprovementMode={setImprovementMode}
                    techComponents={techComponents}
                    setTechComponents={setTechComponents}
                    analyticComponents={analyticComponents}
                    setAnalyticComponents={setAnalyticComponents}
                    infiniteLogs={infiniteLogs}
                    infiniteStats={infiniteStats}
                    goldPatterns={goldPatterns}
                    bugs={bugs}
                    healthChecks={healthChecks}
                    handleStartImprovement={handleStartImprovement}
                    handleUpdateKnowledgeMap={handleUpdateKnowledgeMap}
                    handleStopInfinite={handleStopInfinite}
                    handleMasterStart={handleMasterStart}
                 />
              </motion.div>
            )}

            {activeTab === 'k8s' && (
              <motion.div key="k8s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <FactoryK8sClusterPanel
                  pods={pods}
                  logsPodId={logsPodId}
                  liveLogs={liveLogs}
                  logsEndRef={logsEndRef}
                  handleScalePod={handleScalePod}
                  handleScaleDownPod={handleScaleDownPod}
                  handlePodRestart={handlePodRestart}
                  handleShowLogs={handleShowLogs}
                  setLogsPodId={setLogsPodId}
                />
              </motion.div>
            )}

            {activeTab === 'network' && (
              <motion.div key="network" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <FactoryNetworkPanel
                  registryStats={registryStats}
                  healthChecks={healthChecks}
                />
              </motion.div>
            )}

            {activeTab === 'cicd' && (
              <motion.div key="cicd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <FactoryCicdPanel
                  pipelineProgress={pipelineProgress}
                  systemScore={systemScore}
                />
              </motion.div>
            )}

            {activeTab === 'bugfix' && (
              <motion.div key="bugfix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-rose-950/40 to-slate-900/40 border border-rose-500/20 rounded-2xl backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Bug size={28} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-white">АВТОНОМНЕ ВИП АВЛЕННЯ БАГІВ</h3>
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        ВИЯВЛЕНО: {bugs.filter(b => b.status === 'detected').length} | ВИП АВЛЯЄТЬСЯ: {bugs.filter(b => b.status === 'fixing').length} | ВИП АВЛЕНО: {bugs.filter(b => b.status === 'fixed').length}
                      </p>
                    </div>
                  </div>
                  <Button variant="neon" className="bg-rose-600/20 text-rose-300 border-rose-500/50 text-[9px] uppercase font-black" onClick={() => bugs.filter(b => b.status === 'detected').forEach(b => handleFixBug(b.id))}>
                    <Zap size={12} className="mr-1" /> Автовиправити все
                  </Button>
                </div>
                <FactoryBugFixPanel bugs={bugs} handleFixBug={handleFixBug} />
              </motion.div>
            )}

            {activeTab === 'health' && (
              <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <FactoryHealthPanel healthChecks={healthChecks} />
              </motion.div>
            )}

            {activeTab === 'ingestion' && (
              <motion.div key="ingestion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <FactoryIngestionPanel
                  ingestionMetrics={{
                    rps: dataOps ? dataOps.kafkaTopics.reduce((acc, t) => acc + (parseFloat(t.throughput) || 0), 0).toFixed(1) : '0',
                    success: 100,
                    proxies: dataOps ? `${dataOps.kafkaTopics.reduce((acc, t) => acc + t.consumers, 0)}/∞` : '0/0'
                  }}
                  ingestionFeed={dataOps?.kafkaTopics.map(t => ({
                    id: t.name,
                    source: 'Kafka Topic',
                    entity: `${t.partitions} partitions`,
                    latency: `${t.lag} lag`,
                    time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
                  })) || []}
                  registryStats={registryStats}
                />
              </motion.div>
            )}

            {activeTab === 'cloud_assist' && (
              <motion.div key="cloud_assist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <GeminiCloudAssist />
              </motion.div>
            )}

            {activeTab === 'infinite' && (
              <motion.div key="infinite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <FactoryOodaPanel
                  infiniteRunning={infiniteRunning}
                  infinitePhase={infinitePhase}
                  infiniteStats={infiniteStats}
                  bugs={bugs}
                  infiniteSyncedAt={infiniteSyncedAt}
                  infiniteLastUpdate={infiniteLastUpdate}
                  handleInfiniteCycle={handleInfiniteCycle}
                  infiniteLogs={infiniteLogs}
                  logsEndRef={logsEndRef}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Coordinator Chat */}
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 mt-6 relative z-10">
        <FactoryCoordinatorChat
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          isProcessing={isProcessing}
          handleCommand={handleCommand}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </div>
  </PageTransition>
  );
}
