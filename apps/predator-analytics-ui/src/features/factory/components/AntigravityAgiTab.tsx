/**
 * 🤖 AntigravityAgiTab — Модуль автономного AGI-оркестратора
 * PREDATOR Factory v61.0-ELITE
 *
 * реалізує ТЗ "Google Antigravity Coder v1.0 Enterprise MVP":
 *   - Статус оркестратора (LLM Gateway, Sandbox, бюджет)
 *   - Матриця 4 агентів (Архітектор, Хірург, QA Браузер, QA DevTools)
 *   - Черга AGI-задач
 *   - Термінал логів вибраної задачі
 *   - Форма створення нової задачі
 *
 * © 2026 PREDATOR Analytics — HR-04 (100% українська мова)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Chrome,
  CircleDot,
  Clock,
  DollarSign,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { factoryApi } from '@/services/api/factory';
import {
  buildAntigravitySnapshot,
  createEmptyOrchestratorStatus,
  formatSpentUsd,
  getAgentLabel,
  getLlmStatusLabel,
  getSandboxStatusLabel,
  getStatusTone,
  getTaskPriorityLabel,
  getTaskStatusLabel,
  normalizeOrchestratorStatus,
  normalizeTaskList,
  normalizeTaskLogs,
} from '../antigravityView.utils';
import type {
  AgentCardSnapshot,
  AgentTask,
  AgentTaskLog,
  AgentTaskPriority,
  AgentType,
  AntigravitySnapshot,
} from '../antigravityView.types';

// ─── Іконки агентів ───────────────────────────────────────────────────────────

const AGENT_ICONS: Record<AgentType, React.ElementType> = {
  architect: BrainCircuit,
  surgeon: Wrench,
  qa_browser: Globe,
  qa_devtools: Chrome,
};

// ─── Колірна схема тонів ──────────────────────────────────────────────────────

type ToneKey = 'amber' | 'emerald' | 'rose' | 'sky' | 'gold' | 'slate';

const TONE_CLASSES: Record<ToneKey, { border: string; bg: string; text: string; badge: string; dot: string; bar: string }> = {
  amber: {
    border: 'border-rose-500/25',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    badge: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
    dot: 'bg-rose-400',
    bar: 'bg-rose-400/80',
  },
  emerald: {
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-400/80',
  },
  rose: {
    border: 'border-rose-500/25',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    badge: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
    dot: 'bg-rose-400',
    bar: 'bg-rose-400/80',
  },
  sky: {
    border: 'border-rose-500/25',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    badge: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
    dot: 'bg-rose-400',
    bar: 'bg-rose-400/80',
  },
  gold: {
    border: 'border-[#D4AF37]/25',
    bg: 'bg-[#D4AF37]/10',
    text: 'text-[#D4AF37]',
    badge: 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]',
    dot: 'bg-[#D4AF37]',
    bar: 'bg-[#D4AF37]/80',
  },
  slate: {
    border: 'border-white/10',
    bg: 'bg-white/5',
    text: 'text-slate-300',
    badge: 'border-white/10 bg-white/5 text-slate-300',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400/80',
  },
};

// ─── Підкомпоненти ────────────────────────────────────────────────────────────

/** Порожній стан — API не повернув даних */
const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/20 p-8 text-center">
    <AlertCircle className="mb-4 h-9 w-9 text-rose-400" />
    <div className="text-base font-black text-white">{title}</div>
    <div className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</div>
  </div>
);

/** Картка окремого агента */
const AgentCard = ({ agent, onClick }: { agent: AgentCardSnapshot; onClick?: () => void }) => {
  const tone = TONE_CLASSES[agent.tone];
  const Icon = AGENT_ICONS[agent.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-[28px] border p-5 transition-all cursor-default',
        tone.border,
        agent.isBusy ? tone.bg : 'bg-black/20',
        onClick && 'hover:bg-white/5 cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn('rounded-[18px] border p-3', tone.border, tone.bg)}>
          <Icon size={18} className={tone.text} />
        </div>
        <div className="flex items-center gap-2">
          {agent.isBusy ? (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
              Активний
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Очікує
            </span>
          )}
        </div>
      </div>
      <div className="mt-4">
        <div className={cn('text-sm font-black uppercase tracking-[0.16em]', tone.text)}>
          {agent.label}
        </div>
        <div className="mt-1 text-[10px] font-mono text-slate-500">{agent.technology}</div>
      </div>
      <div className="mt-3 text-xs leading-5 text-slate-400">{agent.description}</div>
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Завершено задач
        </span>
        <span className={cn('text-sm font-black', tone.text)}>{agent.tasksCompleted}</span>
      </div>
    </motion.div>
  );
};

/**  ядок задачі у таблиці */
const TaskRow = ({
  task,
  isSelected,
  onClick,
  onCancel,
  cancelling,
}: {
  task: AgentTask;
  isSelected: boolean;
  onClick: () => void;
  onCancel: (id: string) => void;
  cancelling: string | null;
}) => {
  const tone = TONE_CLASSES[getStatusTone(task.status)];
  const canCancel = task.status === 'pending' || task.status === 'in_progress';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={cn(
        'grid grid-cols-[1fr_120px_90px_90px_80px_36px] gap-3 rounded-[20px] border px-4 py-3.5 text-sm transition-all cursor-pointer',
        isSelected
          ? 'border-rose-500/40 bg-rose-500/10'
          : 'border-white/5 bg-black/20 hover:bg-white/5',
      )}
    >
      {/* Опис */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="truncate font-semibold text-slate-200">{task.description}</div>
        {task.progress && (
          <div className="mt-0.5 truncate text-[11px] text-slate-500">{task.progress}</div>
        )}
      </div>

      {/* Статус */}
      <div className="flex items-center">
        <Badge className={cn('border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest truncate', tone.badge)}>
          {getTaskStatusLabel(task.status)}
        </Badge>
      </div>

      {/* Пріоритет */}
      <div className="flex items-center">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
          {getTaskPriorityLabel(task.priority)}
        </span>
      </div>

      {/* Витрати */}
      <div className="flex items-center">
        <span className={cn('text-sm font-black', task.spent_usd != null ? 'text-[#D4AF37]' : 'text-slate-600')}>
          {formatSpentUsd(task.spent_usd)}
        </span>
      </div>

      {/* Час */}
      <div className="flex items-center">
        <span className="text-[10px] font-mono text-slate-500">
          {new Date(task.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Дії */}
      <div className="flex items-center justify-center">
        {canCancel && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancel(task.task_id); }}
            disabled={cancelling === task.task_id}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
            title="Скасувати задачу"
          >
            {cancelling === task.task_id ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <X size={14} />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

/**  ядок логу задачі */
const LogLine = ({ log }: { log: AgentTaskLog }) => {
  const colorMap: Record<AgentTaskLog['level'], string> = {
    info: 'text-slate-300',
    warn: 'text-rose-400',
    error: 'text-rose-400',
    debug: 'text-slate-500',
  };
  const prefixMap: Record<AgentTaskLog['level'], string> = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
    debug: '[DEBUG]',
  };

  return (
    <div className="grid grid-cols-[80px_56px_1fr] gap-3 py-1.5 font-mono text-xs">
      <span className="text-slate-600">
        {new Date(log.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className={cn('font-black', colorMap[log.level])}>{prefixMap[log.level]}</span>
      <span className="leading-5 text-slate-200">
        {log.agent_type && (
          <span className="mr-2 text-[#D4AF37]">[{getAgentLabel(log.agent_type)}]</span>
        )}
        {log.message}
      </span>
    </div>
  );
};

// ─── Головний компонент ───────────────────────────────────────────────────────

export function AntigravityAgiTab() {
  // ── Стан ──
  const [statusRaw, setStatusRaw] = useState<unknown>(null);
  const [tasksRaw, setTasksRaw] = useState<unknown[]>([]);
  const [logsRaw, setLogsRaw] = useState<unknown[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'amber' | 'emerald'; message: string } | null>(null);

  // Форма нової задачі
  const [showForm, setShowForm] = useState(false);
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<AgentTaskPriority>('medium');
  const [formBudget, setFormBudget] = useState('');

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // ── Нормалізовані дані ──
  const orchestratorStatus = useMemo(
    () => normalizeOrchestratorStatus(statusRaw),
    [statusRaw],
  );
  const snapshot: AntigravitySnapshot = useMemo(
    () => buildAntigravitySnapshot(orchestratorStatus),
    [orchestratorStatus],
  );
  const tasks: AgentTask[] = useMemo(() => normalizeTaskList(tasksRaw), [tasksRaw]);
  const logs: AgentTaskLog[] = useMemo(() => normalizeTaskLogs(logsRaw), [logsRaw]);
  const selectedTask = useMemo(
    () => tasks.find((t) => t.task_id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  // ── Завантаження даних ──
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [statusResult, tasksResult] = await Promise.allSettled([
        factoryApi.getAntigravityStatus(),
        factoryApi.getAntigravityTasks(),
      ]);
      if (statusResult.status === 'fulfilled') setStatusRaw(statusResult.value);
      if (tasksResult.status === 'fulfilled') setTasksRaw(
        Array.isArray(tasksResult.value) ? tasksResult.value : [],
      );
    } catch {
      // помилки ігноруємо — EmptyState покаже це
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ── Логи вибраної задачі ──
  const loadLogs = useCallback(async (taskId: string) => {
    try {
      const data = await factoryApi.getAntigravityTaskLogs(taskId);
      setLogsRaw(Array.isArray(data) ? data : []);
    } catch {
      setLogsRaw([]);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const interval = window.setInterval(() => void loadData(true), 15_000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (selectedTaskId) {
      void loadLogs(selectedTaskId);
      const interval = window.setInterval(() => void loadLogs(selectedTaskId), 8_000);
      return () => window.clearInterval(interval);
    } else {
      setLogsRaw([]);
    }
    return undefined;
  }, [selectedTaskId, loadLogs]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ── Дії ──
  const handleCancel = useCallback(async (taskId: string) => {
    setCancelling(taskId);
    try {
      await factoryApi.cancelAntigravityTask(taskId);
      setFeedback({ tone: 'emerald', message: `Задачу ${taskId} скасовано.` });
      await loadData(true);
    } catch {
      setFeedback({ tone: 'amber', message: 'Помилка скасування задачі. Бекенд не підтвердив запит.' });
    } finally {
      setCancelling(null);
    }
  }, [loadData]);

  const handleCreateTask = useCallback(async () => {
    if (!formDesc.trim()) {
      setFeedback({ tone: 'amber', message: 'Заповніть опис задачі (мінімум 10 символів).' });
      return;
    }
    if (formDesc.trim().length < 10) {
      setFeedback({ tone: 'amber', message: 'Опис задачі занадто короткий. Мінімум 10 символів.' });
      return;
    }
    setCreating(true);
    setFeedback(null);
    try {
      const budgetVal = formBudget ? parseFloat(formBudget) : null;
      const result = await factoryApi.createAntigravityTask({
        description: formDesc.trim(),
        priority: formPriority,
        max_budget_usd: budgetVal != null && Number.isFinite(budgetVal) ? budgetVal : null,
      });
      const newId = result?.task_id ?? null;
      setFeedback({ tone: 'emerald', message: `AGI-задачу створено. ID: ${newId ?? '—'}` });
      setFormDesc('');
      setFormPriority('medium');
      setFormBudget('');
      setShowForm(false);
      await loadData(true);
      if (newId) setSelectedTaskId(newId);
    } catch {
      setFeedback({ tone: 'amber', message: 'Бекенд не підтвердив створення задачі. Перевірте доступність API.' });
    } finally {
      setCreating(false);
    }
  }, [formDesc, formPriority, formBudget, loadData]);

  // ──  ендер ──
  return (
    <div className="space-y-6">

      {/* ── Фідбек ── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'flex items-center justify-between gap-4 rounded-[22px] border px-5 py-3.5 text-sm leading-6',
              feedback.tone === 'amber'
                ? 'border-rose-500/25 bg-rose-500/10 text-rose-200'
                : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
            )}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="shrink-0 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          БЛОК 1 — Статус оркестратора
      ══════════════════════════════════════════════════════════ */}
      <div className="rounded-[32px] border border-[#D4AF37]/20 bg-gradient-to-br from-slate-950/90 to-black/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-[18px] border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-2.5">
              <BrainCircuit size={18} className="text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                AGI Оркестратор
              </div>
              <div className="text-sm font-black text-white">
                {snapshot.isRunning ? 'Активний · Задачі обробляються' : 'Очікування · Бекенд не підтверджено'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {snapshot.isRunning && (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Онлайн
              </span>
            )}
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-300 transition hover:bg-white/10"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              Оновити
            </button>
          </div>
        </div>

        {/* KPI-рядок */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {/* Активні задачі */}
          <div className="rounded-[22px] border border-rose-500/20 bg-black/30 p-4">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Активні задачі
            </div>
            <div className="mt-2 text-2xl font-black text-rose-400">{snapshot.activeTasks}</div>
          </div>

          {/* Завершено */}
          <div className="rounded-[22px] border border-emerald-500/20 bg-black/30 p-4">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Завершено
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-400">{snapshot.completedTasks}</div>
          </div>

          {/* Помилки */}
          <div className="rounded-[22px] border border-rose-500/20 bg-black/30 p-4">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Помилки
            </div>
            <div className="mt-2 text-2xl font-black text-rose-400">{snapshot.failedTasks}</div>
          </div>

          {/* Бюджет */}
          <div className="rounded-[22px] border border-[#D4AF37]/20 bg-black/30 p-4 col-span-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Витрачено / Ліміт
            </div>
            <div className="mt-2 text-base font-black text-[#D4AF37]">
              {snapshot.spentLabel}
              <span className="ml-1 text-slate-500 text-xs">/ {snapshot.limitLabel}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  snapshot.budgetUsedPercent > 85 ? 'bg-rose-500' : 'bg-[#D4AF37]/80',
                )}
                style={{ width: `${snapshot.budgetUsedPercent}%` }}
              />
            </div>
          </div>

          {/* LLM Gateway */}
          <div className="rounded-[22px] border border-white/10 bg-black/30 p-4">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              LLM Gateway
            </div>
            <div className={cn('mt-2 text-sm font-black',
              snapshot.llmStatus === 'online' ? 'text-emerald-400' :
              snapshot.llmStatus === 'degraded' ? 'text-rose-400' : 'text-rose-400'
            )}>
              {getLlmStatusLabel(snapshot.llmStatus)}
            </div>
            <div className="mt-1 text-[10px] font-mono text-slate-600 truncate">
              {snapshot.activeModel}
            </div>
          </div>

          {/* Sandbox */}
          <div className="rounded-[22px] border border-white/10 bg-black/30 p-4">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Kata Sandbox
            </div>
            <div className={cn('mt-2 text-sm font-black',
              snapshot.sandboxStatus === 'online' ? 'text-emerald-400' :
              snapshot.sandboxStatus === 'initializing' ? 'text-rose-400' : 'text-rose-400'
            )}>
              {getSandboxStatusLabel(snapshot.sandboxStatus)}
            </div>
            <div className="mt-1 text-[10px] text-slate-600">VM-ізоляція</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          БЛОК 2 — Агентна матриця
      ══════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          Агентна матриця · {snapshot.agents.filter((a) => a.isBusy).length} з {snapshot.agents.length} активних
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {snapshot.agents.map((agent) => (
            <AgentCard key={agent.type} agent={agent} />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          БЛОК 3 + 4 — Черга задач / Термінал логів
      ══════════════════════════════════════════════════════════ */}
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">

        {/* Черга задач */}
        <div className="rounded-[32px] border border-[#D4AF37]/15 bg-slate-950/60 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-black/30 px-5 py-4">
            <div className="flex items-center gap-3">
              <CircleDot size={16} className="text-[#D4AF37]" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                Черга AGI-задач
              </span>
              <Badge className="border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[10px] font-black text-rose-300">
                {tasks.length}
              </Badge>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className={cn(
                'flex items-center gap-2 rounded-[16px] border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition',
                showForm
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15'
                  : 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/15',
              )}
            >
              {showForm ? <X size={12} /> : <Plus size={12} />}
              {showForm ? 'Закрити' : 'Нова задача'}
            </button>
          </div>

          {/* Заголовок таблиці */}
          {tasks.length > 0 && (
            <div className="grid grid-cols-[1fr_120px_90px_90px_80px_36px] gap-3 border-b border-white/5 bg-black/20 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.24em] text-slate-600">
              <span>Опис</span>
              <span>Статус</span>
              <span>Пріоритет</span>
              <span>Витрати</span>
              <span>Час</span>
              <span />
            </div>
          )}

          <div className="max-h-[400px] space-y-1.5 overflow-y-auto p-3">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskRow
                  key={task.task_id}
                  task={task}
                  isSelected={task.task_id === selectedTaskId}
                  onClick={() => setSelectedTaskId(
                    task.task_id === selectedTaskId ? null : task.task_id,
                  )}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                />
              ))
            ) : (
              <EmptyState
                title="Черга задач порожня"
                description="Ендпоїнт /antigravity/tasks не повернув задач. Створіть першу AGI-задачу за допомогою кнопки «Нова задача»."
              />
            )}
          </div>
        </div>

        {/* Термінал логів вибраної задачі */}
        <div className="rounded-[32px] border border-white/8 bg-slate-950/60 overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 border-b border-white/5 bg-black/30 px-5 py-4">
            <Terminal size={16} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
              {selectedTask ? `Логи · ${selectedTask.task_id.slice(0, 8)}…` : 'Журнал задачі'}
            </span>
          </div>

          <div className="flex-1 max-h-[400px] overflow-y-auto p-4 font-mono">
            {selectedTask ? (
              <>
                {/* Метадані задачі */}
                <div className="mb-4 rounded-[18px] border border-white/8 bg-black/30 p-4 space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Деталі zadачі</div>
                  <div className="text-xs text-slate-300 leading-5 break-words">{selectedTask.description}</div>
                  {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Підзадачі агентів</div>
                      {selectedTask.subtasks.map((sub) => {
                        const subTone = TONE_CLASSES[getStatusTone(sub.status)];
                        return (
                          <div key={sub.id} className="flex items-start gap-2">
                            <span className={cn('text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5', subTone.text)}>
                              {getAgentLabel(sub.agent_type)}
                            </span>
                            <span className="text-[11px] text-slate-400 leading-5">{sub.description}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Логи */}
                {logs.length > 0 ? (
                  <>
                    {logs.map((log) => <LogLine key={log.id} log={log} />)}
                    <div ref={logsEndRef} />
                  </>
                ) : (
                  <div className="text-[11px] text-slate-600 text-center py-6">
                    Логи ще не отримано або задача щойно створена
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
                <Terminal size={28} className="mb-3 text-slate-700" />
                <div className="text-xs text-slate-600">
                  Виберіть задачу зі списку дляперегляду логів
                </div>
              </div>
            )}
          </div>

          {/* Кнопка скасування */}
          {selectedTask && (selectedTask.status === 'pending' || selectedTask.status === 'in_progress') && (
            <div className="border-t border-white/5 bg-black/30 p-3">
              <button
                type="button"
                onClick={() => handleCancel(selectedTask.task_id)}
                disabled={cancelling === selectedTask.task_id}
                className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-rose-300 transition hover:bg-rose-500/15"
              >
                {cancelling === selectedTask.task_id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <XCircle size={13} />
                )}
                Скасувати задачу
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          БЛОК 5 — Форма нової задачі
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-[32px] border border-[#D4AF37]/25 bg-gradient-to-br from-slate-950/90 to-black/60 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-[16px] border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-2.5">
                  <Sparkles size={16} className="text-[#D4AF37]" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    Нова AGI-задача
                  </div>
                  <div className="text-sm font-black text-white">
                    Оркестратор автоматично роздасть підзадачі агентам
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Опис */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 mb-2">
                    Опис завдання *
                  </label>
                  <textarea
                    id="antigravity-task-description"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={4}
                    placeholder="Наприклад: Створити FastAPI сервіс з авторизацією через JWT та CRUD для товарів митна декларація. Включити Dockerfile та GitHub Actions CI…"
                    className="w-full rounded-[18px] border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 resize-none"
                  />
                  <div className="mt-1 flex justify-end">
                    <span className={cn('text-[10px] font-mono', formDesc.length < 10 ? 'text-slate-600' : 'text-slate-500')}>
                      {formDesc.length} / 10000
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Пріоритет */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 mb-2">
                      Пріоритет
                    </label>
                    <select
                      id="antigravity-task-priority"
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as AgentTaskPriority)}
                      className="w-full rounded-[18px] border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 focus:border-rose-500/50 focus:outline-none"
                    >
                      <option value="low">Низький</option>
                      <option value="medium">Середній</option>
                      <option value="high">Високий</option>
                      <option value="critical">Критичний</option>
                    </select>
                  </div>

                  {/* Бюджет */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 mb-2">
                      Бюджет LLM (USD, необов'язково)
                    </label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="antigravity-task-budget"
                        type="number"
                        min="0"
                        step="0.50"
                        value={formBudget}
                        onChange={(e) => setFormBudget(e.target.value)}
                        placeholder="5.00"
                        className="w-full rounded-[18px] border border-white/10 bg-black/40 pl-9 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-rose-500/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    id="antigravity-task-submit"
                    onClick={() => void handleCreateTask()}
                    disabled={creating || formDesc.trim().length < 10}
                    className={cn(
                      'flex items-center gap-2 rounded-[20px] border border-[#D4AF37]/30 bg-[#D4AF37]/15 px-6 py-3 text-[12px] font-black uppercase tracking-[0.22em] text-[#D4AF37] transition',
                      'hover:bg-[#D4AF37]/25 disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Запустити AGI-задачу
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-[20px] border border-white/10 bg-white/5 px-5 py-3 text-[12px] font-black uppercase tracking-wider text-slate-400 transition hover:bg-white/10"
                  >
                    Відмінити
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Підвал: відмова від відповідальності ── */}
      <div className="flex items-start gap-4 rounded-[24px] border border-white/8 bg-black/20 p-5">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#D4AF37]" />
        <div className="text-xs leading-6 text-slate-500">
          <span className="font-black text-slate-400">AGI Оркестратор PREDATOR</span> · Всі дії агентів
          реалізуються виключно через офіційні API-виклики (LiteLLM, GitHub, офіційні SDK). Виконання
          коду ізольовано у Kata Containers (VM-рівень). Будь-який код, що порушує HR-06 (секрети лише
          у Vault), автоматично блокується на рівні пайплайну CI/CD.
        </div>
      </div>
    </div>
  );
}
