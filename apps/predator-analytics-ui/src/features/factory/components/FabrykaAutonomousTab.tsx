/**
 * 🔥 FabrykaAutonomousTab — FABRYKA v2.0 AUTONOMOUS CORE
 * PREDATOR Factory v58.2-WRAITH
 *
 * � еалізує ТЗ «FABRYKA v2.0 – AUTONOMOUS CORE»:
 *   - Перемикач режимів AUTONOMOUS ↔ API
 *   - VRAM Scheduler HUD (GTX 1080, 8GB)
 *   - Fitness / KPI Engine (оцінка кожного коміту)
 *   - Risk Engine (LOW / MEDIUM / HIGH)
 *   - Прапорці Функцій (Feature Flags)
 *   - Хаос-інженерія (Chaos Engineering)
 *
 * © 2026 PREDATOR Analytics — HR-04 (100% українська мова)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Flame,
  GitMerge,
  Layers,
  Loader2,
  Monitor,
  Network,
  Play,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { API_BASE_URL } from '@/services/api/config';
import { factoryApi } from '@/services/api/factory';

import { AgentSwarmMap } from './AgentSwarmMap';
import { ReasoningStream } from './ReasoningStream';
import { E2BSandboxFeed } from './E2BSandboxFeed';
import { JulesIntelBridge } from './JulesIntelBridge';
import { ChromeOrchestrator } from './ChromeOrchestrator';
import { GeminiTerminal } from './GeminiTerminal';

import type {
  ChaosLogEntry,
  ChaosScenario,
  ChaosScenarioType,
  FeatureFlag,
  FitnessMetrics,
  LlmCascadeEntry,
  LlmModeState,
  RiskEvent,
  RiskLevel,
  SystemMode,
  VramMetrics,
  SwarmAgent,
  ReasoningStep,
  SandboxSession,
} from '../types';

// ─── Моковані початкові дані ──────────────────────────────────────────────────

const INITIAL_LLM_MODE: LlmModeState = {
  active: 'API',
  active_model: 'gemini-2.5-flash',
  active_provider: 'gemini',
  active_cascade_level: 1,
  tri_state_mode: 'HYBRID',
  auto_switch_enabled: true,
  cascade: [
    { id: 'l1-gemini-flash', name: 'Gemini 2.5 Flash (Free Tier)', provider: 'gemini', role: 'lead_architect', online: true, latency_ms: 350, model_tag: 'gemini-2.5-flash' },
    { id: 'l1-gemini-code', name: 'Gemini Code Execution', provider: 'gemini', role: 'primary', online: true, latency_ms: 800, model_tag: 'gemini-2.5-flash+code' },
    { id: 'l1-groq', name: 'Cloud Pool (Groq)', provider: 'groq', role: 'fallback_fast', online: true, latency_ms: 120, model_tag: 'llama3-70b' },
    { id: 'l2-mistral', name: 'Codestral (Mistral)', provider: 'zai', role: 'fallback_azure', online: true, latency_ms: 400, model_tag: 'codestral-latest' },
    { id: 'l3-sovereign', name: 'Logic Specialist (Nemotron)', provider: 'ollama', role: 'fallback_local', online: true, latency_ms: 65, model_tag: 'nemotron-cascade-2' },
    { id: 'l3-coder', name: 'Surgical Coder (Qwen3)', provider: 'ollama', role: 'surgical_coder', online: true, latency_ms: 42, model_tag: 'qwen3-coder-next' },
    { id: 'l4-parser', name: 'Light Parser (Gemma4)', provider: 'ollama', role: 'light_parser', online: true, latency_ms: 15, model_tag: 'gemma4:e2b' },
  ],
  rules: [
    { condition: 'vram > 7.6GB', switch_to: 'CLOUD', triggered: false },
    { condition: 'api_429', switch_to: 'SOVEREIGN', triggered: false },
  ],
};

const INITIAL_VRAM: VramMetrics = {
  used_percent: 62,
  allocation: { llm_gb: 5, rendering_gb: 2, buffer_gb: 1, total_gb: 8 },
  warning: false,
  active_models: ['deepseek-coder:6.7b-Q4'],
};

const INITIAL_FITNESS: FitnessMetrics | null = null;

const CHAOS_SCENARIOS: ChaosScenario[] = [
  { id: 'kill_pod', name: 'Вбити под', description: 'Примусово завершити один із системних подів K8s', severity: 'high', duration_sec: 30 },
  { id: 'network_delay', name: 'Затримка мережі', description: 'Додати 200ms latency до всіх внутрішніх запитів', severity: 'medium', duration_sec: 60 },
  { id: 'gemini_429', name: 'Gemini Rate Limit (429)', description: 'Симуляція вичерпання лімітів Gemini API (15 RPM). Перехід на SOVEREIGN.', severity: 'high', duration_sec: 45 },
  { id: 'sandbox_crash', name: 'Code Sandbox Crash', description: 'Примусовий збій виконання коду в хмарі. Fallback на локальний Python.', severity: 'high', duration_sec: 20 },
  { id: 'memory_pressure', name: 'Тиск пам\'яті', description: 'Виділити 48GB RAM, симулювати OOM ситуацію', severity: 'high', duration_sec: 45 },
  { id: 'gpu_overload', name: 'Перевантаження GPU', description: 'Запустити стрес-тест VRAM + inference одночасно', severity: 'high', duration_sec: 20 },
];

const INITIAL_FEATURE_FLAGS: FeatureFlag[] = [];

const INITIAL_RISK_EVENTS: RiskEvent[] = [];

// ─── � ежим Кодера ──────────────────────────────────────────────────────────────

/** Джерело виконання коду */
type CoderSource = 'ollama' | 'api';

interface CoderModel {
  id: string;
  name: string;
  source: CoderSource;
  tag: string;
  specialty: string;
  vram_gb?: number;
  online: boolean;
  cost_per_1k?: string;
  context_k: number;
}

const INITIAL_SWARM: SwarmAgent[] = [];

const INITIAL_SANDBOX: SandboxSession | null = null;

const INITIAL_STEPS: ReasoningStep[] = [];

const CODER_MODELS: CoderModel[] = [
  // ── Zero-Cost ELITE Stack (April 2026) ──
  { id: 'groq-qwen3-32b',  name: '⚡ Qwen 3 (32B) · Groq', source: 'api', tag: 'qwen3-32b-latest', specialty: 'Ultra-Fast Reasoning (1000 RPD)', online: true, cost_per_1k: 'FREE (1k RPD)', context_k: 128 },
  { id: 'groq-llama4-scout', name: '🛡️ Llama 4 Scout (17B)', source: 'api', tag: 'llama4-17b-scout', specialty: 'Agentic / Logic (1000 RPD)', online: true, cost_per_1k: 'FREE (1k RPD)', context_k: 64 },
  { id: 'groq-llama3-instant', name: '🚀 Llama 3.1 8B Instant', source: 'api', tag: 'llama-3.1-8b-instant', specialty: 'Massive Vol. (14,400 RPD)', online: true, cost_per_1k: 'FREE (14k RPD)', context_k: 128 },
  { id: 'gemini-2.5-flash',   name: '💎 Gemini 2.5 Flash', source: 'api', tag: 'gemini-2.5-flash', specialty: 'Stable / Multimodal (1500 RPD)', online: true, cost_per_1k: 'FREE (AI Studio)', context_k: 1048 },
  { id: 'gemini-2.5-pro',     name: '�  Gemini 2.5 Pro', source: 'api', tag: 'gemini-2.5-pro', specialty: 'Deep Logic (Best Effort)', online: true, cost_per_1k: 'FREE (Trial)', context_k: 2048 },
  { id: 'deepseek-v3',        name: '🐳 DeepSeek V3 (Code)', source: 'api', tag: 'deepseek-coder', specialty: 'Advanced Coding / No RPD Limit', online: true, cost_per_1k: 'Free Quota', context_k: 128 },
  { id: 'vertex-model-garden', name: '🔍 Model Garden / Vertex', source: 'api', tag: 'google/vertex-search', specialty: 'Enterprise OSINT / Search', online: true, cost_per_1k: 'FREE', context_k: 128 },

  // ── Інші Free API ──
  { id: 'groq-llama3.1',   name: 'Llama 3.1 70B (Groq)', source: 'api', tag: 'llama-3.1-70b-versatile', specialty: 'Ultra-Fast Inference', online: true, cost_per_1k: 'FREE (Beta)', context_k: 128 },
  { id: 'hf-all-models',   name: 'Hugging Face API', source: 'api', tag: 'mistralai/Mistral-7B-v0.3', specialty: 'Research / NLP', online: true, cost_per_1k: 'FREE', context_k: 32 },
];





// ─── Допоміжні утиліти ────────────────────────────────────────────────────────

const getRiskIcon = (level: RiskLevel) => {
  if (level === 'LOW') return ShieldCheck;
  if (level === 'MEDIUM') return ShieldAlert;
  return Flame;
};

const getRiskColors = (level: RiskLevel) => {
  if (level === 'LOW') return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' };
  if (level === 'MEDIUM') return { border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' };
  return { border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' };
};

const getProviderColors = (provider: LlmCascadeEntry['provider']) => {
  if (provider === 'gemini') return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10';
  if (provider === 'groq') return 'border-rose-500/40 text-rose-400 bg-rose-500/10';
  if (provider === 'zai') return 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10';
  if (provider === 'azure') return 'border-rose-500/40 text-rose-400 bg-rose-500/10';
  return 'border-white/20 text-white bg-white/5';
};

const getRoleLabel = (role: LlmCascadeEntry['role']) => {
  if (role === 'lead_architect') return 'Головний Архітектор (Хмара)';
  if (role === 'surgical_coder') return 'Хірургічний Кодер (Локально)';
  if (role === 'fallback_local') return 'Логічний Спеціаліст (Локально)';
  if (role === 'primary') return 'Хмарне Ядро';
  return 'Шар Утиліт';
};

const getRiskActionLabel = (action: RiskEvent['action']) => {
  if (action === 'auto_merge') return 'Авто-мердж';
  if (action === 'canary') return 'Canary Deploy';
  return '� учна перевірка';
};

// ─── Кругова VRAM діаграма ────────────────────────────────────────────────────

const VramDonutChart = ({ metrics }: { metrics: VramMetrics }) => {
  const r = 70;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  const { llm_gb, rendering_gb, buffer_gb, total_gb } = metrics.allocation;

  const segments = [
    { label: 'LLM інференс', gb: llm_gb, color: '#D4AF37', offset: 0 },
    { label: 'Rendering', gb: rendering_gb, color: '#10b981', offset: llm_gb / total_gb },
    { label: 'Буфер', gb: buffer_gb, color: '#6b7280', offset: (llm_gb + rendering_gb) / total_gb },
  ];

  let cumulativeDash = 0;
  return (
    <div className="flex items-center gap-8">
      <div className="relative">
        <svg width={180} height={180} className="-rotate-90">
          {/* Трек */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={20} />
          {segments.map((seg) => {
            const dash = (seg.gb / total_gb) * circumference;
            const el = (
              <circle
                key={seg.label}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={20}
                strokeDasharray={`${dash - 3} ${circumference - dash + 3}`}
                strokeDashoffset={-cumulativeDash}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            );
            cumulativeDash += dash;
            return el;
          })}
          {/* Попередження дуга */}
          {metrics.warning && (
            <circle cx={cx} cy={cy} r={r + 15} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 6" opacity={0.6} />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-black', metrics.warning ? 'text-rose-400' : 'text-white')}>
            {metrics.used_percent}%
          </span>
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">VRAM</span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">GTX 1080</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <div>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider">{seg.label}</div>
              <div className="text-[11px] font-mono text-slate-500">{seg.gb} GB / {total_gb} GB</div>
            </div>
          </div>
        ))}
        {metrics.active_models.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Активні моделі</div>
            {metrics.active_models.map((m) => (
              <div key={m} className="text-[10px] font-mono text-rose-400/80">{m}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Fitness KPI Bar ──────────────────────────────────────────────────────────

const KpiBar = ({ label, value, max, unit, ok }: { label: string; value: number; max: number; unit: string; ok: boolean }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-slate-500 uppercase font-black tracking-wider">{label}</span>
      <span className={cn('font-mono font-black', ok ? 'text-emerald-400' : 'text-rose-400')}>
        {value}{unit}
      </span>
    </div>
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={cn('h-full rounded-full', ok ? 'bg-emerald-400' : 'bg-rose-400')}
      />
    </div>
  </div>
);

// ─── Головний компонент ───────────────────────────────────────────────────────

export function FabrykaAutonomousTab() {
  const [llmMode, setLlmMode] = useState<LlmModeState>(INITIAL_LLM_MODE);
  const [vram, setVram] = useState<VramMetrics>(INITIAL_VRAM);
  const [fitness] = useState<FitnessMetrics | null>(INITIAL_FITNESS);
  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>(INITIAL_RISK_EVENTS);
  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FEATURE_FLAGS);
  const [chaosLog, setChaosLog] = useState<ChaosLogEntry[]>([]);
  const [runningChaos, setRunningChaos] = useState<ChaosScenarioType | null>(null);
  const [confirmChaos, setConfirmChaos] = useState<ChaosScenarioType | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [activeSection, setActiveSection] = useState<'mode' | 'vram' | 'fitness' | 'risk' | 'flags' | 'chaos'>('mode');
  const { llmTriStateMode, vramMetrics } = useBackendStatus();
  const [cascadeLevel, setCascadeLevel] = useState<1 | 2 | 3 | 4>(1);
  const vramInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Стан Кодера ──
  const [coderSource, setCoderSource] = useState<CoderSource>('ollama');
  const [activeCoderModel, setActiveCoderModel] = useState<string>('ds-coder-6.7b');
  const [isCoderSwitching, setIsCoderSwitching] = useState(false);

  // ── Стан v5.0 (Swarm & Reasoning) ──
  const [swarm, setSwarm] = useState<SwarmAgent[]>(INITIAL_SWARM);
  const [sandbox, setSandbox] = useState<SandboxSession | null>(INITIAL_SANDBOX);
  const [steps, setSteps] = useState<ReasoningStep[]>(INITIAL_STEPS);
  const [isStreaming, setIsStreaming] = useState(true);
  // ── WebSocket Live Observation (Observer Mode v5.0) ────────────────────────
  useEffect(() => {
    // Determining WebSocket URL based on API config
    const apiHost = API_BASE_URL.replace(/^https?:\/\//, '');
    const wsUrl = `${API_BASE_URL.startsWith('https') ? 'wss' : 'ws'}://${apiHost}/factory/ws/observer`;
    
    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      console.log(`📡 Підключення до спостерігача Factory: ${wsUrl}`);
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('✅ Спостерігач Factory підключений');
        setIsStreaming(true);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'FACTORY_STATE_UPDATE') {
            if (data.swarm) setSwarm(data.swarm);
            if (data.latest_step) {
              setSteps(prev => [data.latest_step, ...prev.slice(0, 19)]);
            }
            if (data.vram) {
              setVram({
                used_percent: (data.vram.used / data.vram.total) * 100,
                warning: data.vram.critical,
                total_gb: data.vram.total
              });

              // Dispatch Global Telemetry for Infrastructure Banner
              window.dispatchEvent(new CustomEvent('predator-vram-update', {
                detail: {
                  vramMetrics: {
                    total: data.vram.total,
                    used: data.vram.used,
                    status: data.vram.critical ? 'critical' : (data.vram.used > 7 ? 'warning' : 'nominal')
                  },
                  llmTriStateMode: data.vram.recommendation || 'HYBRID'
                }
              }));
            }
          }
        } catch (err) {
          console.error('❌ Помилка декодування спостерігача:', err);
        }
      };
      
      socket.onclose = () => {
        console.log('🛑 З\'єднання Factory WS втрачено. Спроба відновлення через 5с...');
        setIsStreaming(false);
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };
    
    connect();
    return () => {
      socket?.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // ── Перемикач режиму ──
  const handleModeSwitch = useCallback(async (target: SystemMode) => {
    if (isSwitching || llmMode.active === target) return;
    setIsSwitching(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLlmMode((prev) => ({
      ...prev,
      active: target,
      active_provider: target === 'AUTONOMOUS' ? 'ollama' : 'groq',
      active_model: target === 'AUTONOMOUS' ? 'deepseek-coder:6.7b-Q4' : 'llama3-70b-8192',
    }));
    setIsSwitching(false);
  }, [isSwitching, llmMode.active]);

  // ── Перемикач джерела кодера ──
  const handleCoderSourceSwitch = useCallback(async (target: CoderSource) => {
    if (isCoderSwitching || coderSource === target) return;
    setIsCoderSwitching(true);
    await new Promise((r) => setTimeout(r, 900));
    setCoderSource(target);
    // Автоматично вибираємо першу доступну модель нового джерела
    const firstAvailable = CODER_MODELS.find((m) => m.source === target && m.online);
    if (firstAvailable) setActiveCoderModel(firstAvailable.id);
    setIsCoderSwitching(false);
  }, [isCoderSwitching, coderSource]);

  const handleCoderModelSelect = useCallback((modelId: string) => {
    const model = CODER_MODELS.find((m) => m.id === modelId);
    if (!model || !model.online) return;
    setActiveCoderModel(modelId);
    setCoderSource(model.source);
  }, []);


  // ── Feature Flag toggle ──
  const handleFlagToggle = useCallback((id: string) => {
    setFlags((prev) => prev.map((f) => f.id === id ? { ...f, enabled: !f.enabled } : f));
  }, []);

  // ── Chaos scenario launch ──
  const handleLaunchChaos = useCallback(async (scenarioId: ChaosScenarioType) => {
    if (runningChaos) return;
    setConfirmChaos(null);
    setRunningChaos(scenarioId);
    const scenario = CHAOS_SCENARIOS.find((s) => s.id === scenarioId)!;
    const entryId = `CHAOS-${Date.now()}`;

    setChaosLog((prev) => [{
      id: entryId,
      scenario: scenarioId,
      started_at: new Date().toISOString(),
      status: 'running',
      outcome: `Виклик API: Launch Chaos [${scenarioId}]...`,
    }, ...prev.slice(0, 9)]);

    try {
      // Виклик реального API замість симуляції
      await factoryApi.launchChaos(scenarioId);
      
      setChaosLog((prev) => prev.map((e) =>
        e.id === entryId
          ? { ...e, status: 'completed', outcome: `Сценарій «${scenario.name}» успішно ініційовано на кластері.` }
          : e,
      ));
    } catch (err: any) {
      setChaosLog((prev) => prev.map((e) =>
        e.id === entryId
          ? { ...e, status: 'failed', outcome: `Помилка запуску: ${err.message || 'Unknown error'}` }
          : e,
      ));
    } finally {
      setRunningChaos(null);
    }
  }, [runningChaos]);

  // ── Risk approve ──
  const handleResolveRisk = useCallback((id: string) => {
    setRiskEvents((prev) => prev.map((e) => e.id === id ? { ...e, resolved: true } : e));
  }, []);

  const isAutonomous = llmMode.active === 'AUTONOMOUS';

  const renderVramGuardian = () => {
    const { total, localReserve, uiReserve, used } = vramMetrics;
    const usedPercent = (used / total) * 100;
    const isCritical = used >= 7.6;

    return (
      <div className="bg-black/40 rounded-[28px] border border-white/5 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Вартовий VRAM (VRAM Guardian) v3.0</h3>
            <p className="text-[9px] text-slate-500 font-mono uppercase">GTX 1080 · 8GB GDDR5X</p>
          </div>
          {isCritical && (
            <Badge className="bg-rose-500 text-white animate-pulse border-none text-[8px] font-black italic">
              VRAM_ПЕ� ЕВАНТАЖЕННЯ_АКТИВНО
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="text-[8px] font-black text-emerald-400 uppercase mb-2">Local LLM � озділ</div>
            <div className="text-xl font-black italic text-white">{localReserve} GB</div>
            <div className="text-[8px] text-slate-500 mt-1">ЗАБ� ОНЬОВАНО ДЛЯ OLLAMA</div>
          </div>
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
            <div className="text-[8px] font-black text-rose-400 uppercase mb-2">Sovereign OS / UI</div>
            <div className="text-xl font-black italic text-white">{uiReserve} GB</div>
            <div className="text-[8px] text-slate-500 mt-1">ЗАБ� ОНЬОВАНО ДЛЯ THREE.JS</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-slate-500">Глобальне споживання</span>
            <span className={isCritical ? 'text-rose-400' : 'text-emerald-400'}>{used.toFixed(2)} / {total.toFixed(2)} GB</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 flex">
              <div className="h-full bg-emerald-500/40" style={{ width: `${(localReserve / total) * 100}%` }} />
              <div className="h-full bg-rose-500/40 border-l border-white/10" style={{ width: `${(uiReserve / total) * 100}%` }} />
            </div>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${usedPercent}%` }}
              className={cn("h-full relative z-10", isCritical ? 'bg-rose-500' : 'bg-white/40')} 
            />
          </div>
          <div className="flex items-center justify-between text-[8px] text-slate-600 font-mono italic">
            <span>0.0 GB</span>
            <span>7.6 GB (FAILOVER_ХМА� И)</span>
            <span>8.0 GB</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {/* ══ Заголовок режиму ═══════════════════════════════════════════════════ */}
      <div className={cn(
        'relative rounded-[32px] border p-6 overflow-hidden transition-all duration-700',
        isAutonomous
          ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-slate-950/60'
          : 'border-rose-500/30 bg-gradient-to-br from-rose-950/40 to-slate-950/60',
      )}>
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255,255,255,0.03) 30px, rgba(255,255,255,0.03) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,255,255,0.03) 30px, rgba(255,255,255,0.03) 31px)' }}
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          {/* Лівий блок — назва режиму */}
          <div className="flex items-center gap-5">
            <div className={cn(
              'w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-500',
              isAutonomous ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-[0_0_30px_rgba(225,29,72,0.3)]',
            )}>
              {isAutonomous ? <WifiOff size={28} /> : <Wifi size={28} />}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">
                FABRYKA v2.0 — Поточний режим
              </div>
              <div className={cn('text-2xl font-black uppercase tracking-widest', isAutonomous ? 'text-emerald-400' : 'text-rose-400')}>
                {isAutonomous ? 'AUTONOMOUS (АВТОНОМНО)' : 'API � ЕЖИМ'}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-tighter">
                {llmTriStateMode === 'SOVEREIGN' 
                  ? 'Суверенний � ежим (Nemotron 30B MoE) · 100% Локально · Air-Gapped' 
                  : llmTriStateMode === 'HYBRID'
                    ? 'Гібридний Інтелект · Баланс Local Edge + Cloud Pool'
                    : 'Хмарний Override (GLM-5.1 + Azure) · Екстремальна Швидкість · VRAM Звільнено'}
              </div>
            </div>
          </div>

          {/* Правий блок — перемикач */}
          <div className="flex items-center gap-4">
            <span className={cn('text-sm font-black uppercase tracking-widest', isAutonomous ? 'text-emerald-400' : 'text-slate-400')}>
              ЛОКАЛЬНО
            </span>
            <button
              type="button"
              disabled={isSwitching}
              onClick={() => handleModeSwitch(isAutonomous ? 'API' : 'AUTONOMOUS')}
              className={cn(
                'relative w-20 h-10 rounded-full border-2 transition-all duration-500 cursor-pointer',
                isAutonomous ? 'border-emerald-500/60 bg-emerald-950/50' : 'border-rose-500/60 bg-rose-950/50',
              )}
            >
              {isSwitching ? (
                <Loader2 size={18} className="absolute inset-0 m-auto animate-spin text-white" />
              ) : (
                <motion.div
                  animate={{ x: isAutonomous ? 4 : 42 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className={cn(
                    'absolute top-1 w-7 h-7 rounded-full shadow-lg',
                    isAutonomous ? 'bg-emerald-400' : 'bg-rose-400',
                  )}
                />
              )}
            </button>
            <span className={cn('text-sm font-black uppercase tracking-widest', !isAutonomous ? 'text-rose-400' : 'text-slate-400')}>
              API
            </span>
          </div>
        </div>

        {/* Авто-перемикач статус */}
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <Sliders size={11} />
            Авто-перемикач: {llmMode.auto_switch_enabled ? <span className="text-emerald-400 ml-1">АКТИВНИЙ</span> : <span className="text-slate-500 ml-1">ВИМКНЕНО</span>}
          </div>
          {llmMode.rules.map((rule, i) => (
            <div key={i} className={cn(
              'flex items-center gap-2 border rounded-full px-3 py-1.5 text-[10px] font-mono',
              rule.triggered ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'border-white/5 bg-white/5 text-slate-600',
            )}>
              {rule.triggered && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
              <ChevronRight size={10} />
              {rule.condition} → {rule.switch_to}
            </div>
          ))}
        </div>
      </div>

      {/* ══ � ЕЖИМ КОДЕ� А — Перемикач ══════════════════════════════════════════ */}
      <div className="rounded-[28px] border border-white/8 bg-slate-950/70 overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/5 bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center">
              <Terminal size={16} className="text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">� ежим виконання · Кодер</div>
              <div className="text-xs font-black text-white">
                {coderSource === 'ollama' ? '🖥️ Локальний сервер (Ollama)' : '☁️ Зовнішні API (Cloud)'}
              </div>
            </div>
          </div>
          {/* Великий перемикач Ollama ↔ API */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isCoderSwitching}
              onClick={() => void handleCoderSourceSwitch('ollama')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-[14px] border text-[10px] font-black uppercase tracking-wider transition-all duration-300',
                coderSource === 'ollama'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                  : 'border-white/10 bg-white/5 text-slate-500 hover:text-slate-300',
              )}
            >
              {isCoderSwitching && coderSource !== 'ollama' ? <Loader2 size={12} className="animate-spin" /> : <WifiOff size={12} />}
              Ollama · Локально
            </button>
            <div className="text-slate-600 text-[11px] font-black">/</div>
            <button
              type="button"
              disabled={isCoderSwitching}
              onClick={() => void handleCoderSourceSwitch('api')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-[14px] border text-[10px] font-black uppercase tracking-wider transition-all duration-300',
                coderSource === 'api'
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-300 shadow-[0_0_16px_rgba(225,29,72,0.25)]'
                  : 'border-white/10 bg-white/5 text-slate-500 hover:text-slate-300',
              )}
            >
              {isCoderSwitching && coderSource !== 'api' ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
              API · Хмара
            </button>
          </div>
        </div>

        {/* Сітка моделей — розділена по джерелу */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/5">

          {/* ── Ліва колонка: Ollama (сервер) ── */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Ollama · NVIDIA Server</span>
              <span className="text-[9px] text-slate-600 font-mono ml-auto">GTX 1080 · 8GB VRAM</span>
            </div>
            {CODER_MODELS.filter((m) => m.source === 'ollama').map((model) => {
              const isActive = activeCoderModel === model.id;
              return (
                <motion.button
                  key={model.id}
                  type="button"
                  layout
                  disabled={!model.online}
                  onClick={() => handleCoderModelSelect(model.id)}
                  className={cn(
                    'w-full text-left rounded-[18px] border p-3.5 transition-all duration-200 relative overflow-hidden',
                    isActive
                      ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : model.online
                        ? 'border-white/8 bg-black/20 hover:border-white/20 hover:bg-white/5 cursor-pointer'
                        : 'border-white/4 bg-black/10 opacity-40 cursor-not-allowed',
                  )}
                >
                  {isActive && <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-500/10 rounded-full translate-x-6 -translate-y-6 blur-xl pointer-events-none" />}
                  <div className="flex items-start justify-between gap-2 relative">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                        <span className={cn('text-[11px] font-black', isActive ? 'text-emerald-300' : 'text-white')}>{model.name}</span>
                        {!model.online && <span className="text-[9px] text-slate-600 font-black uppercase">Офлайн</span>}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 mb-1 truncate">{model.tag}</div>
                      <div className="text-[9px] text-slate-400">{model.specialty}</div>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      {model.vram_gb && (
                        <div className="text-[9px] font-mono text-rose-400/80">{model.vram_gb}GB VRAM</div>
                      )}
                      <div className="text-[9px] font-mono text-slate-600">{model.context_k}K ctx</div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* ── Права колонка: API ── */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-400">API · Зовнішні сервіси</span>
              <span className="text-[9px] text-slate-600 font-mono ml-auto">LiteLLM proxy :4000</span>
            </div>
            {CODER_MODELS.filter((m) => m.source === 'api').map((model) => {
              const isActive = activeCoderModel === model.id;
              return (
                <motion.button
                  key={model.id}
                  type="button"
                  layout
                  disabled={!model.online}
                  onClick={() => handleCoderModelSelect(model.id)}
                  className={cn(
                    'w-full text-left rounded-[18px] border p-3.5 transition-all duration-200 relative overflow-hidden',
                    isActive
                      ? 'border-rose-500/50 bg-rose-500/10 shadow-[0_0_12px_rgba(225,29,72,0.2)]'
                      : model.online
                        ? 'border-white/8 bg-black/20 hover:border-white/20 hover:bg-white/5 cursor-pointer'
                        : 'border-white/4 bg-black/10 opacity-40 cursor-not-allowed',
                  )}
                >
                  {isActive && <div className="absolute right-0 top-0 w-16 h-16 bg-rose-500/10 rounded-full translate-x-6 -translate-y-6 blur-xl pointer-events-none" />}
                  <div className="flex items-start justify-between gap-2 relative">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />}
                        <span className={cn('text-[11px] font-black', isActive ? 'text-rose-300' : 'text-white')}>{model.name}</span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 mb-1 truncate">{model.tag}</div>
                      <div className="text-[9px] text-slate-400">{model.specialty}</div>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      {model.cost_per_1k && (
                        <div className="text-[9px] font-mono text-rose-400/70">{model.cost_per_1k}</div>
                      )}
                      <div className="text-[9px] font-mono text-slate-600">{model.context_k}K ctx</div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Статус-рядок активного кодера */}
        <div className="px-5 py-3 border-t border-white/5 bg-black/20 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap size={12} className={coderSource === 'ollama' ? 'text-emerald-400' : 'text-rose-400'} />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Активний кодер:</span>
            <span className={cn('text-[10px] font-black font-mono', coderSource === 'ollama' ? 'text-emerald-300' : 'text-rose-300')}>
              {CODER_MODELS.find((m) => m.id === activeCoderModel)?.tag ?? '—'}
            </span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="text-[10px] font-mono text-slate-500">
            Джерело: <span className={cn('font-black', coderSource === 'ollama' ? 'text-emerald-400' : 'text-rose-400')}>
              {coderSource === 'ollama' ? 'Локальний Ollama (сервер)' : 'API Gateway (LiteLLM :4000)'}
            </span>
          </div>
          {coderSource === 'ollama' && (
            <div className="text-[10px] font-mono text-slate-600 ml-auto">Cost: <span className="text-emerald-500">$0.000</span></div>
          )}
          {coderSource === 'api' && (
            <div className="text-[10px] font-mono text-slate-600 ml-auto">Статус: <span className="text-emerald-400">БЕЗКОШТОВНИЙ � ІВЕНЬ (FREE TIER)</span></div>
          )}

        </div>
      </div>

      {/* ══ Sub-навігація ══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'mode', label: 'LLM Каскад', icon: BrainCircuit },
          { id: 'vram', label: 'Планувальник VRAM', icon: Cpu },
          { id: 'fitness', label: 'Двигун Фітнесу (Fitness)', icon: Activity },
          { id: 'risk', label: 'Двигун � изиків (Risk)', icon: Shield },
          { id: 'flags', label: 'Прапорці функцій', icon: Sliders },
          { id: 'chaos', label: 'Хаос-інженерія', icon: Flame },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all',
              activeSection === id
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : 'border-white/5 bg-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10',
            )}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}

      <AnimatePresence mode="wait">

        {/* ── Autonomous Factory Observer Mode (v5.0) ── */}
        {activeSection === 'mode' && (
          <motion.div 
            key="mode" 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }} 
            className="space-y-6"
          >
            {/* Observer Mode Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/40 rounded-3xl border border-white/5 p-5 flex items-center justify-between group hover:border-rose-500/20 transition-colors">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Навантаження_� ою</div>
                  <div className="text-xl font-black text-white italic">{(swarm.reduce((acc, a) => acc + a.vram_usage_gb, 0)).toFixed(1)} ГБ VRAM</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform">
                  <Cpu size={18} className="text-rose-500" />
                </div>
              </div>
              <div className="bg-black/40 rounded-3xl border border-white/5 p-5 flex items-center justify-between group hover:border-emerald-500/20 transition-colors">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Цілісність_Пісочниці</div>
                  <div className="text-xl font-black text-emerald-400 italic">SECURE_WORM</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={18} className="text-emerald-500" />
                </div>
              </div>
              <div className="bg-black/40 rounded-3xl border border-white/5 p-5 flex items-center justify-between group hover:border-rose-500/20 transition-colors">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Швидкість_OODA</div>
                  <div className="text-xl font-black text-rose-400 italic">4.2 ОП/СЕК</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform">
                  <Zap size={18} className="text-rose-500" />
                </div>
              </div>
            </div>

            {/* ══ Factory Intelligence Cloud (Google AI & Browser Agents) ═══════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="space-y-5">
                <JulesIntelBridge />
                <GeminiTerminal />
              </div>
              <ChromeOrchestrator />
            </div>

            {renderVramGuardian()}

            {/* Main Visualizers Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[500px]">
              {/* Left: Swarm Map */}
              <div className="bg-black/40 rounded-[32px] border border-white/5 overflow-hidden flex flex-col pt-6 pr-6">
                <AgentSwarmMap 
                  agents={swarm} 
                  className="flex-1"
                />
              </div>

              {/* Right: Reasoning Stream */}
              <div className="h-full">
                <ReasoningStream 
                  steps={steps} 
                  isStreaming={isStreaming} 
                  activeAgentId={swarm.find(a => a.status === 'THINKING')?.id} 
                />
              </div>
            </div>

            {/* Bottom: E2B Sandbox Feed */}
            <div className="h-[300px]">
              <E2BSandboxFeed session={sandbox} />
            </div>

            {/* VRAM Watchdog Protocol Overlay */}
            <div className="p-6 rounded-[32px] border border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/40">
                  <Activity size={24} className="text-rose-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Hardware Watchdog Protocol v5.0</h4>
                  <p className="text-[10px] text-slate-400 font-mono">AUTOMATED_MODEL_FAILOVER_READY // TRIGGER_POINT: 7.6GB</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] font-black italic">OLLAMA_MESH_LINK: OK</Badge>
                <Badge className="bg-rose-500/20 text-rose-300 border-none text-[8px] font-black italic">VRAM_LOAD: 6.2GB</Badge>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── VRAM Scheduler ── */}
        {activeSection === 'vram' && (
          <motion.div key="vram" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className={cn(
              'rounded-[32px] border p-6 transition-all',
              vram.warning ? 'border-rose-500/40 bg-rose-950/20' : 'border-rose-500/20 bg-slate-950/60',
            )}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">VRAM Scheduler</div>
                  <div className="text-sm font-black text-white">GTX 1080 · 8GB GDDR5X</div>
                  {vram.warning && (
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-rose-400 font-black uppercase">
                      <AlertTriangle size={11} /> Критичне навантаження — активовано API Fallback
                    </div>
                  )}
                </div>
                <Badge className={cn(
                  'border px-3 py-1.5 text-[10px] font-black uppercase',
                  vram.warning ? 'border-rose-500/40 bg-rose-500/20 text-rose-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
                )}>
                  {vram.used_percent}% VRAM
                </Badge>
              </div>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <VramDonutChart metrics={vram} />
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-3">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">Правила розподілу</div>
                    {[
                      { label: 'LLM Інференс', value: vram.allocation.llm_gb, total: vram.allocation.total_gb, unit: 'GB', color: 'bg-[#D4AF37]' },
                      { label: 'Rendering / UI', value: vram.allocation.rendering_gb, total: vram.allocation.total_gb, unit: 'GB', color: 'bg-emerald-400' },
                      { label: 'Системний буфер', value: vram.allocation.buffer_gb, total: vram.allocation.total_gb, unit: 'GB', color: 'bg-slate-500' },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-black uppercase tracking-wider">{item.label}</span>
                          <span className="font-mono text-slate-300">{item.value} / {item.total} {item.unit}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / item.total) * 100}%` }}
                            transition={{ duration: 1 }}
                            className={cn('h-full rounded-full', item.color)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">Пріоритети VRAM</div>
                    <div className="flex gap-2 flex-wrap">
                      {['Інференс', 'Тестування', 'UI Rendering'].map((p, i) => (
                        <div key={p} className="flex items-center gap-1.5 border border-white/5 bg-black/30 rounded-full px-2.5 py-1 text-[9px] font-black uppercase text-slate-500">
                          <span className="text-rose-400">#{i + 1}</span> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Fitness Engine ── */}
        {activeSection === 'fitness' && (
          <motion.div key="fitness" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {fitness ? (
              <>
                {/* Score Banner */}
                <div className={cn(
                  'rounded-[28px] border p-5 text-center relative overflow-hidden',
                  fitness.passed ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-rose-500/30 bg-rose-950/20',
                )}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent pointer-events-none" />
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Fitness Score · Поточний коміт</div>
                  <div className={cn('text-5xl font-black', fitness.passed ? 'text-emerald-400' : 'text-rose-400')}>
                    {fitness.score.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    Поріг: {fitness.threshold.toFixed(1)} · {fitness.passed ? '✅ П� ИЙНЯТО' : '❌ ВІДХИЛЕНО'}
                  </div>
                  <div className="mt-3 text-[10px] text-slate-600 font-mono">
                    score = (perf_gain × 2 + stability_gain) / (cpu_cost + vram_cost + latency_cost)
                  </div>
                </div>

                {/* 4 колонки KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {/* Backend */}
                  <div className="rounded-[24px] border border-rose-500/20 bg-black/30 p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Network size={14} className="text-rose-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Backend</span>
                    </div>
                    <KpiBar label="Latency P95" value={fitness.backend.latency_p95_ms} max={fitness.backend.latency_threshold_ms} unit="ms" ok={fitness.backend.latency_p95_ms < fitness.backend.latency_threshold_ms} />
                    <KpiBar label="Error Rate" value={fitness.backend.error_rate_percent} max={0.5} unit="%" ok={fitness.backend.error_rate_percent < 0.5} />
                  </div>

                  {/* Frontend */}
                  <div className="rounded-[24px] border border-rose-500/20 bg-black/30 p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor size={14} className="text-rose-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Frontend</span>
                    </div>
                    <KpiBar label="FPS" value={fitness.frontend.fps} max={60} unit="" ok={fitness.frontend.fps >= 50} />
                    <KpiBar label="Memory" value={fitness.frontend.memory_mb} max={fitness.frontend.memory_limit_mb} unit="MB" ok={fitness.frontend.memory_mb < fitness.frontend.memory_limit_mb} />
                  </div>

                  {/* LLM */}
                  <div className="rounded-[24px] border border-[#D4AF37]/20 bg-black/30 p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit size={14} className="text-[#D4AF37]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">LLM</span>
                    </div>
                    <KpiBar label="Tokens/sec" value={fitness.llm.tokens_per_sec} max={fitness.llm.baseline_tps * 2} unit="" ok={fitness.llm.tokens_per_sec > fitness.llm.baseline_tps} />
                    <KpiBar label="Hallucination" value={Math.round(fitness.llm.hallucination_score * 100)} max={Math.round(fitness.llm.hallucination_threshold * 100)} unit="%" ok={fitness.llm.hallucination_score < fitness.llm.hallucination_threshold} />
                  </div>

                  {/* Infra */}
                  <div className="rounded-[24px] border border-emerald-500/20 bg-black/30 p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Infra</span>
                    </div>
                    <KpiBar label="CPU Load" value={fitness.infra.cpu_load_percent} max={80} unit="%" ok={fitness.infra.cpu_load_percent < 80} />
                    <KpiBar label="VRAM" value={fitness.infra.vram_used_percent} max={100} unit="%" ok={fitness.infra.vram_used_percent < 85} />
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 bg-black/40 rounded-[32px] border border-white/5 flex flex-col items-center justify-center text-slate-600">
                <Activity size={32} className="mb-2 opacity-20" />
                <div className="text-[10px] font-black uppercase tracking-widest">Дані Fitness відсутні (Чекаємо на стрім)</div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Risk Engine ── */}
        {activeSection === 'risk' && (
          <motion.div key="risk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Três cartões de nível */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['LOW', 'MEDIUM', 'HIGH'] as RiskLevel[]).map((level) => {
                const c = getRiskColors(level);
                const RIcon = getRiskIcon(level);
                const actionMap = { LOW: 'Авто-мердж', MEDIUM: 'Canary Deploy', HIGH: '� учна перевірка' };
                const descMap = {
                  LOW: 'Автоматично мержиться після успішного CI. Score > 1.2 + всі тести зелені.',
                  MEDIUM: '� озгортається на 5% трафіку через canary. Чекає підтвердження метрик 30хв.',
                  HIGH: 'Блокується до ручного ревʼю відповідального інженера. Сповіщення у Slack.',
                };
                return (
                  <div key={level} className={cn('rounded-[24px] border p-5', c.border, c.bg)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.bg, 'border', c.border)}>
                        <RIcon size={18} className={c.text} />
                      </div>
                      <div>
                        <div className={cn('text-sm font-black', c.text)}>{level}</div>
                        <div className="text-[9px] text-slate-500 font-mono uppercase">{actionMap[level]}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-5">{descMap[level]}</div>
                  </div>
                );
              })}
            </div>

            {/* Лог подій */}
            <div className="rounded-[28px] border border-white/8 bg-slate-950/60 overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/5 bg-black/30 px-5 py-3.5">
                <Shield size={14} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Останні події ризику</span>
              </div>
              <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
                {riskEvents?.length > 0 ? (
                  riskEvents.map((evt) => {
                    const c = getRiskColors(evt.level);
                    const RIcon = getRiskIcon(evt.level);
                    return (
                      <div key={evt.id} className={cn(
                        'flex items-start justify-between gap-4 rounded-[18px] border p-4 transition-all',
                        evt.resolved ? 'border-white/5 bg-black/20 opacity-50' : cn(c.border, c.bg),
                      )}>
                        <div className="flex items-start gap-3">
                          <RIcon size={16} className={cn(c.text, 'mt-0.5 shrink-0')} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('text-[10px] font-black uppercase', c.text)}>{evt.level}</span>
                              <span className="text-[10px] font-mono text-slate-500">{evt.commit_hash}</span>
                              <span className="text-[10px] text-slate-600">· {getRiskActionLabel(evt.action)}</span>
                            </div>
                            <div className="text-[11px] text-slate-300">{evt.reason}</div>
                            <div className="text-[9px] text-slate-600 font-mono mt-0.5">
                              {new Date(evt.timestamp).toLocaleString('uk-UA')}
                            </div>
                          </div>
                        </div>
                        {!evt.resolved && (
                          <button
                            type="button"
                            onClick={() => handleResolveRisk(evt.id)}
                            className="shrink-0 flex items-center gap-1.5 border border-white/10 bg-white/5 rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-white transition"
                          >
                            <UserCheck size={11} />
                            Підтвердити
                          </button>
                        )}
                        {evt.resolved && (
                          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900/50 flex items-center justify-center mb-3 border border-white/5">
                      <Shield size={20} className="text-slate-600" />
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">Подій не виявлено</div>
                    <div className="text-[10px] text-slate-600 max-w-[200px]">Система Risk Engine наразі не зафіксувала жодних аномалій або критичних ризиків.</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Feature Flags ── */}
        {activeSection === 'flags' && (
          <motion.div key="flags" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-[28px] border border-white/8 bg-slate-950/60 overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/5 bg-black/30 px-5 py-3.5">
                <Sliders size={14} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Прапорці функцій (Feature Flags)</span>
                <Badge className="border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[10px] font-black text-rose-300">
                  {flags.filter((f) => f.enabled).length} активні
                </Badge>
                <div className="ml-auto text-[9px] text-slate-600 font-mono">Зберігаються локально · HR-15 compliant</div>
              </div>
              <div className="divide-y divide-white/5">
                {flags.map((flag) => (
                  <div key={flag.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-black text-white">{flag.name}</span>
                        <Badge className={cn(
                          'border text-[9px] font-black px-1.5',
                          flag.storage === 'postgresql' ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-slate-500/30 bg-slate-500/10 text-slate-400',
                        )}>
                          {flag.storage === 'postgresql' ? 'PostgreSQL' : 'Local'}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-slate-500">{flag.description}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                        Rollout: <span className="text-rose-400 font-black">{flag.rollout_percent}%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFlagToggle(flag.id)}
                        className="shrink-0"
                      >
                        {flag.enabled
                          ? <ToggleRight size={28} className="text-emerald-400" />
                          : <ToggleLeft size={28} className="text-slate-500" />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Chaos Engineering ── */}
        {activeSection === 'chaos' && (
          <motion.div key="chaos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-[28px] border border-rose-500/20 bg-rose-950/10 px-5 py-4 flex items-center gap-3">
              <AlertTriangle size={18} className="text-rose-400 shrink-0" />
              <div className="text-[11px] text-rose-300 leading-5">
                <strong>� ️ УВАГА:</strong> Chaos Engineering запускає � ЕАЛЬНІ деструктивні сценарії на кластері. Переконайтеся, що у вас є rollback-план і достатньо ресурсів. Кожен запуск логується.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CHAOS_SCENARIOS.map((scenario) => {
                const isRunning = runningChaos === scenario.id;
                const isPending = confirmChaos === scenario.id;
                const severityColors = {
                  low: 'border-emerald-500/20 bg-emerald-950/10',
                  medium: 'border-rose-500/20 bg-rose-950/10',
                  high: 'border-rose-500/25 bg-rose-950/15',
                };
                return (
                  <div key={scenario.id} className={cn('rounded-[24px] border p-5 transition-all', severityColors[scenario.severity])}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">
                          {scenario.severity === 'high' ? '🔴' : scenario.severity === 'medium' ? '🟡' : '🟢'} Severity: {scenario.severity.toUpperCase()} · {scenario.duration_sec}с
                        </div>
                        <div className="text-sm font-black text-white">{scenario.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1 leading-5">{scenario.description}</div>
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      {isRunning ? (
                        <div className="flex items-center gap-2 text-[10px] text-rose-400 font-black uppercase">
                          <Loader2 size={12} className="animate-spin" />
                          Виконується...
                        </div>
                      ) : isPending ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleLaunchChaos(scenario.id)}
                            className="flex-1 flex items-center justify-center gap-2 border border-rose-500/40 bg-rose-500/15 rounded-xl py-2 text-[10px] font-black uppercase text-rose-300 hover:bg-rose-500/25 transition"
                          >
                            <Flame size={11} /> Підтвердити
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmChaos(null)}
                            className="flex-1 flex items-center justify-center gap-2 border border-white/10 bg-white/5 rounded-xl py-2 text-[10px] font-black uppercase text-slate-400 hover:text-white transition"
                          >
                            Скасувати
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!!runningChaos}
                          onClick={() => setConfirmChaos(scenario.id)}
                          className="w-full flex items-center justify-center gap-2 border border-slate-600/40 bg-slate-800/40 rounded-xl py-2 text-[10px] font-black uppercase text-slate-400 hover:border-rose-500/30 hover:text-rose-300 hover:bg-rose-950/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Play size={11} /> Запустити
                        </button>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Лог */}
            {chaosLog.length > 0 && (
              <div className="rounded-[24px] border border-white/5 bg-black/30 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-white/5 bg-black/20 px-4 py-3">
                  <Terminal size={13} className="text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Журнал Chaos</span>
                </div>
                <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto">
                  {chaosLog.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-[90px_1fr] gap-2 font-mono text-[10px]">
                      <span className={cn(
                        'font-black uppercase',
                        entry.status === 'running' ? 'text-rose-400' : entry.status === 'completed' ? 'text-emerald-400' : 'text-rose-400',
                      )}>
                        {entry.status === 'running' ? '⟳ ACTIVE' : entry.status === 'completed' ? '✓ DONE' : '✗ FAIL'}
                      </span>
                      <span className="text-slate-300">[{entry.scenario}] {entry.outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
