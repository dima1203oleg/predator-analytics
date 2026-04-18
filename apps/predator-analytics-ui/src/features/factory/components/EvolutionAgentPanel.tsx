/**
 * 🧬 EvolutionAgentPanel — Мета-агент аналізу трендів та деградацій
 * FABRYKA v2.0 – AUTONOMOUS CORE
 *
 * Відповідає за:
 *   - Аналіз трендів ефективності компонентів
 *   - Виявлення деградацій у часі
 *   - Пропозиції рефакторингу
 *   - Глобальна оптимізація архітектурних рішень
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
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  Square,
  Terminal,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  EvolutionAgentState,
  RefactorProposal,
  EvolutionTrend,
} from '../types';

// ─── Mock початкові дані ─────────────────────────────────────────────────────

const MOCK_TRENDS: EvolutionTrend[] = [
  { component: 'core-api', direction: 'improving', delta_percent: +8.4, last_checked: new Date(Date.now() - 180000).toISOString() },
  { component: 'graph-service', direction: 'stable', delta_percent: +0.2, last_checked: new Date(Date.now() - 240000).toISOString() },
  { component: 'ingestion-worker', direction: 'degrading', delta_percent: -12.1, last_checked: new Date(Date.now() - 300000).toISOString() },
  { component: 'analytics-ui', direction: 'improving', delta_percent: +5.7, last_checked: new Date(Date.now() - 360000).toISOString() },
  { component: 'llm-gateway', direction: 'degrading', delta_percent: -6.3, last_checked: new Date(Date.now() - 420000).toISOString() },
  { component: 'redis-cache', direction: 'stable', delta_percent: +1.1, last_checked: new Date(Date.now() - 480000).toISOString() },
];

const MOCK_PROPOSALS: RefactorProposal[] = [
  {
    id: 'REF-001',
    component: 'ingestion-worker',
    description: 'Застаріла черга обробки: замінити синхронний цикл на паралельний батчинг через asyncio.gather(). Очікуване прискорення: +40% throughput.',
    priority: 'high',
    created_at: new Date(Date.now() - 300000).toISOString(),
    status: 'pending',
  },
  {
    id: 'REF-002',
    component: 'llm-gateway',
    description: 'LiteLLM proxy перенавантажений токен-валідацією. Перевести JWT-перевірку на middleware-рівень FastAPI. Збереження -15ms latency/запит.',
    priority: 'high',
    created_at: new Date(Date.now() - 240000).toISOString(),
    status: 'pending',
  },
  {
    id: 'REF-003',
    component: 'analytics-ui',
    description: 'Re-render cascade у TanStack Table при оновленні даних. Додати memo() та useMemo() для рядків таблиці. Прогнозований FPS gain: +12.',
    priority: 'medium',
    created_at: new Date(Date.now() - 180000).toISOString(),
    status: 'accepted',
  },
];

const EVOLUTION_BOOT_LOGS = [
  '[EVOLUTION] Агент EvolutionCore v1.0 ініціалізовано',
  '[EVOLUTION] Підключення до Qdrant vector store... OK',
  '[EVOLUTION] Підключення до PostgreSQL pattern DB... OK',
  '[ANALYSIS] Завантаження 90-денної телеметрії сервісів...',
  '[ANALYSIS] Побудова базового профілю ефективності...',
  '[ANALYSIS] Обчислення delta для всіх компонентів...',
  '[DETECTION] Знайдено 2 деградуючих компоненти: ingestion-worker, llm-gateway',
  '[PROPOSALS] Згенеровано 3 пропозиції рефакторингу',
  '[EVOLUTION] Аналіз завершено. Наступний запуск: через 6 годин.',
];

// ─── Утиліти ─────────────────────────────────────────────────────────────────

const getTrendIcon = (direction: EvolutionTrend['direction']) => {
  if (direction === 'improving') return TrendingUp;
  if (direction === 'degrading') return TrendingDown;
  return Minus;
};

const getTrendColor = (direction: EvolutionTrend['direction']) => {
  if (direction === 'improving') return 'text-emerald-400';
  if (direction === 'degrading') return 'text-rose-400';
  return 'text-slate-400';
};

const getTrendBorder = (direction: EvolutionTrend['direction']) => {
  if (direction === 'improving') return 'border-emerald-500/20 bg-emerald-950/10';
  if (direction === 'degrading') return 'border-rose-500/20 bg-rose-950/10';
  return 'border-white/5 bg-black/20';
};

const getPriorityBadge = (p: RefactorProposal['priority']) => {
  if (p === 'high') return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
  if (p === 'medium') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  return 'border-slate-500/30 bg-slate-500/10 text-slate-400';
};

const getPriorityLabel = (p: RefactorProposal['priority']) => {
  if (p === 'high') return 'Критичний';
  if (p === 'medium') return 'Середній';
  return 'Низький';
};

const getStatusBadge = (s: RefactorProposal['status']) => {
  if (s === 'accepted') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (s === 'rejected') return 'border-slate-500/20 bg-slate-500/5 text-slate-600';
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
};

const getStatusLabel = (s: RefactorProposal['status']) => {
  if (s === 'accepted') return 'Прийнято';
  if (s === 'rejected') return 'Відхилено';
  return 'Очікує';
};

// ─── Мікро-граф тренду (sparkline) ───────────────────────────────────────────

const TrendSparkline = ({ direction, delta }: { direction: EvolutionTrend['direction']; delta: number }) => {
  const points = Array.from({ length: 12 }, (_, i) => {
    const base = 50;
    const noise = (Math.sin(i * 1.7 + delta) * 10);
    const trend = direction === 'improving' ? i * 2 : direction === 'degrading' ? -i * 2 : 0;
    return Math.max(5, Math.min(90, base + noise + trend));
  });
  const w = 80;
  const h = 30;
  const step = w / (points.length - 1);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (p / 100) * h}`).join(' ');
  const color = direction === 'improving' ? '#10b981' : direction === 'degrading' ? '#f43f5e' : '#6b7280';
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
    </svg>
  );
};

// ─── Головний компонент ───────────────────────────────────────────────────────

export function EvolutionAgentPanel() {
  const [agentState, setAgentState] = useState<EvolutionAgentState>({
    is_running: false,
    last_analysis: null,
    trends: MOCK_TRENDS,
    proposals: MOCK_PROPOSALS,
    logs: [],
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proposals, setProposals] = useState<RefactorProposal[]>(MOCK_PROPOSALS);
  const [logIdx, setLogIdx] = useState(0);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Авто-скрол логів
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentState.logs]);

  // Запустити аналіз
  const handleRunAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAgentState((prev) => ({ ...prev, is_running: true, logs: [] }));
    setLogIdx(0);

    // Симуляція потокових логів
    for (let i = 0; i < EVOLUTION_BOOT_LOGS.length; i++) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
      const ts = new Date().toLocaleTimeString('uk-UA');
      setAgentState((prev) => ({
        ...prev,
        logs: [...prev.logs, `[${ts}] ${EVOLUTION_BOOT_LOGS[i]}`],
      }));
    }

    // Фінал
    setAgentState((prev) => ({
      ...prev,
      is_running: false,
      last_analysis: new Date().toISOString(),
    }));
    setIsAnalyzing(false);
  }, [isAnalyzing]);

  // Прийняти/відхилити пропозицію
  const handleProposalAction = useCallback((id: string, action: 'accepted' | 'rejected') => {
    setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: action } : p));
  }, []);

  const degradingCount = agentState.trends.filter((t) => t.direction === 'degrading').length;
  const improvingCount = agentState.trends.filter((t) => t.direction === 'improving').length;

  return (
    <div className="space-y-5">

      {/* ── EvolutionAgent Header ── */}
      <div className="rounded-[32px] border border-[#D4AF37]/20 bg-gradient-to-br from-slate-950/90 to-black/70 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.2)]">
              <BrainCircuit size={28} className="text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500 mb-1">
                EvolutionAgent · Meta-Analysis Core
              </div>
              <div className="text-lg font-black text-white">Самооптимізуюча Екосистема</div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                {agentState.last_analysis
                  ? `Останній аналіз: ${new Date(agentState.last_analysis).toLocaleString('uk-UA')}`
                  : 'Аналіз ще не запускався в цій сесії'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* KPI зведення */}
            <div className="flex gap-3">
              <div className="text-center px-4 py-3 border border-emerald-500/20 bg-emerald-950/20 rounded-2xl">
                <div className="text-2xl font-black text-emerald-400">{improvingCount}</div>
                <div className="text-[9px] text-slate-500 uppercase font-black">Покращуються</div>
              </div>
              <div className="text-center px-4 py-3 border border-rose-500/20 bg-rose-950/20 rounded-2xl">
                <div className="text-2xl font-black text-rose-400">{degradingCount}</div>
                <div className="text-[9px] text-slate-500 uppercase font-black">Деградують</div>
              </div>
              <div className="text-center px-4 py-3 border border-amber-500/20 bg-amber-950/20 rounded-2xl">
                <div className="text-2xl font-black text-amber-400">{proposals.filter((p) => p.status === 'pending').length}</div>
                <div className="text-[9px] text-slate-500 uppercase font-black">Пропозиції</div>
              </div>
            </div>

            <Button
              variant="neon"
              onClick={() => void handleRunAnalysis()}
              disabled={isAnalyzing}
              className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40 hover:bg-[#D4AF37]/25 font-black uppercase tracking-widest text-[10px] h-11 px-5"
            >
              {isAnalyzing
                ? <><Loader2 size={14} className="mr-2 animate-spin" /> Аналіз...</>
                : <><Sparkles size={14} className="mr-2" /> Запустити аналіз</>
              }
            </Button>
          </div>
        </div>
      </div>

      {/* ── Тренди компонентів ── */}
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1 mb-3">
          Тренди ефективності · {agentState.trends.length} компонентів
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {agentState.trends.map((trend, idx) => {
            const Icon = getTrendIcon(trend.direction);
            return (
              <motion.div
                key={trend.component}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={cn('rounded-[22px] border p-4 transition-all', getTrendBorder(trend.direction))}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon size={15} className={getTrendColor(trend.direction)} />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">{trend.component}</span>
                  </div>
                  <span className={cn('text-lg font-black', getTrendColor(trend.direction))}>
                    {trend.delta_percent > 0 ? '+' : ''}{trend.delta_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <TrendSparkline direction={trend.direction} delta={trend.delta_percent} />
                  <div className="text-[9px] text-slate-600 font-mono text-right">
                    {new Date(trend.last_checked).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Пропозиції рефакторингу ── */}
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1 mb-3">
          Пропозиції рефакторингу · {proposals.filter((p) => p.status === 'pending').length} очікують рішення
        </div>
        <div className="space-y-3">
          {proposals.map((proposal, idx) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={cn(
                'rounded-[24px] border p-5 transition-all',
                proposal.status === 'accepted' ? 'border-emerald-500/20 bg-emerald-950/10' :
                proposal.status === 'rejected' ? 'border-white/5 bg-black/10 opacity-50' :
                'border-amber-500/20 bg-amber-950/10',
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">{proposal.id}</span>
                    <Badge className={cn('border text-[9px] font-black px-2', getPriorityBadge(proposal.priority))}>
                      {getPriorityLabel(proposal.priority)}
                    </Badge>
                    <Badge className={cn('border text-[9px] font-black px-2', getStatusBadge(proposal.status))}>
                      {getStatusLabel(proposal.status)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] text-slate-600 font-mono">
                    {new Date(proposal.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <ChevronRight size={11} className="text-amber-400 shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">{proposal.component}</span>
              </div>
              <p className="text-sm text-slate-300 leading-6 mb-4">{proposal.description}</p>

              {proposal.status === 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleProposalAction(proposal.id, 'accepted')}
                    className="flex-1 flex items-center justify-center gap-2 border border-emerald-500/30 bg-emerald-500/10 rounded-xl py-2 text-[10px] font-black uppercase text-emerald-300 hover:bg-emerald-500/20 transition"
                  >
                    <CheckCircle2 size={11} /> Прийняти
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProposalAction(proposal.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 border border-white/10 bg-white/5 rounded-xl py-2 text-[10px] font-black uppercase text-slate-400 hover:text-white transition"
                  >
                    <X size={11} /> Відхилити
                  </button>
                </div>
              )}
              {proposal.status === 'accepted' && (
                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase pt-2 border-t border-white/5">
                  <CheckCircle2 size={12} /> Прийнято до впровадження
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Термінал EvolutionAgent ── */}
      {(agentState.logs.length > 0 || isAnalyzing) && (
        <div className="rounded-[28px] border border-[#D4AF37]/15 bg-slate-950/80 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-white/5 bg-black/30 px-5 py-3.5">
            <Terminal size={14} className="text-[#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">EvolutionAgent · Термінал</span>
            {isAnalyzing && (
              <span className="flex items-center gap-1.5 text-[10px] text-amber-300 font-black uppercase ml-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                виконується
              </span>
            )}
          </div>
          <div className="p-4 font-mono text-[11px] max-h-[220px] overflow-y-auto space-y-0.5">
            {agentState.logs.map((log, i) => (
              <div key={i} className={cn(
                'py-0.5',
                log.includes('[DETECTION]') ? 'text-rose-400' :
                log.includes('[PROPOSALS]') ? 'text-amber-300' :
                log.includes('[EVOLUTION]') ? 'text-[#D4AF37]' :
                'text-slate-400',
              )}>
                {log}
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex items-center gap-1.5 text-slate-600 py-0.5">
                <span className="animate-pulse">█</span>
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

    </div>
  );
}
