/**
 * 🏭 Sovereign Auto-Factory | v58.2-WRAITH
 * PREDATOR — � обочий Центр Автономного Вдосконалення
 * 
 * Контроль OODA-циклу, патч-менеджмент та еволюція нейронних архітектур.
 * Sovereign Power Design System · Gold/Rose Palette · Tier-1 Access
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Binary,
  BrainCircuit,
  CheckCircle2,
  Factory,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { factoryApi } from '@/services/api/factory';
import { systemApi, type SystemStatsResponse, type SystemStatusResponse } from '@/services/api/system';
import { cn } from '@/utils/cn';
import {
  normalizeAutoFactorySnapshot,
  type AutoFactoryBugRecord,
  type AutoFactoryEngineRecord,
  type AutoFactoryLogRecord,
  type AutoFactoryMetricCard,
  type AutoFactoryReliabilityBar,
  type AutoFactoryTone,
} from './autoFactoryView.utils';

const AXIOMS = [
  {
    code: 'AX-09',
    title: 'Контрольована еволюція',
    detail: 'Будь-який автономний цикл повинен мати підтверджений серверний стан і бути відтворюваним у журналах.',
  },
  {
    code: 'AX-10',
    title: 'Незмінність ядра',
    detail: 'Критичні компоненти не змінюються локальним інтерфейсом без окремого керувального маршруту.',
  },
  {
    code: 'AX-12',
    title: 'Колективний розум',
    detail: '� ішення про виправлення спирається на реальну телеметрію, чергу багів і підтверджені сервером артефакти узгодження.',
  },
  {
    code: 'AX-15',
    title: 'Цифровий суверенітет',
    detail: 'Контур не використовує вигадані SaaS або фальшиві хмарні інтеграції замість реального контракту.',
  },
];

const toneClasses: Record<AutoFactoryTone, { border: string; panel: string; text: string; badge: string; dot: string }> = {
  emerald: {
    border: 'border-emerald-500/20',
    panel: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    dot: 'bg-emerald-400',
  },
  amber: {
    border: 'border-rose-500/20',
    panel: 'bg-rose-500/10',
    text: 'text-rose-400',
    badge: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
    dot: 'bg-rose-400',
  },
  rose: {
    border: 'border-rose-500/20',
    panel: 'bg-rose-500/10',
    text: 'text-rose-400',
    badge: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
    dot: 'bg-rose-400',
  },
  sky: {
    border: 'border-rose-500/20',
    panel: 'bg-rose-500/10',
    text: 'text-rose-400',
    badge: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
    dot: 'bg-rose-400',
  },
  gold: {
    border: 'border-[#D4AF37]/20',
    panel: 'bg-[#D4AF37]/10',
    text: 'text-[#D4AF37]',
    badge: 'border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]',
    dot: 'bg-[#D4AF37]',
  },
  slate: {
    border: 'border-white/10',
    panel: 'bg-white/5',
    text: 'text-slate-300',
    badge: 'border-white/10 bg-white/5 text-slate-200',
    dot: 'bg-slate-400',
  },
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[36px] border border-dashed border-white/10 bg-black/20 px-8 text-center">
    <AlertCircle className="mb-4 h-10 w-10 text-rose-300" />
    <div className="text-lg font-black text-white">{title}</div>
    <div className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</div>
  </div>
);

const MetricCard = ({ card }: { card: AutoFactoryMetricCard }) => {
  const tone = toneClasses[card.tone];

  return (
    <TacticalCard variant="holographic" className={cn('rounded-[32px] border bg-slate-950/50 p-6', tone.border)}>
      <div className="space-y-3">
        <div className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">{card.label}</div>
        <div className={cn('text-4xl font-black tracking-tight', tone.text)}>{card.value}</div>
        <div className="text-sm leading-6 text-slate-400">{card.hint}</div>
      </div>
    </TacticalCard>
  );
};

const BugCard = ({ bug }: { bug: AutoFactoryBugRecord }) => {
  const tone = toneClasses[bug.tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-[32px] border bg-slate-950/50 p-6 shadow-[0_24px_60px_rgba(2,6,23,0.25)]', tone.border)}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-black uppercase tracking-[0.2em] text-white">{bug.title}</div>
            <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase tracking-widest', tone.badge)}>
              {bug.statusLabel}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-6 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            <span>Компонент: <span className="text-slate-200">{bug.componentLabel}</span></span>
            <span>� изик: <span className={tone.text}>{bug.riskLabel}</span></span>
            <span>Погодження: <span className="text-slate-200">{bug.councilLabel}</span></span>
          </div>
          <div className="text-sm leading-6 text-slate-400">{bug.detailLabel}</div>
        </div>

        <div className="min-w-[180px] rounded-[24px] border border-white/10 bg-black/20 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Прогрес</div>
          <div className={cn('mt-2 text-3xl font-black', tone.text)}>{bug.progressLabel}</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full border border-white/5 bg-slate-950">
            <div
              className={cn('h-full rounded-full transition-all', tone.panel)}
              style={{ width: `${bug.progress ?? 0}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EngineCard = ({ engine }: { engine: AutoFactoryEngineRecord }) => {
  const tone = toneClasses[engine.tone];

  return (
    <div className={cn('rounded-[28px] border p-5', tone.border, tone.panel)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{engine.title}</div>
          <div className={cn('mt-2 text-lg font-black', tone.text)}>{engine.statusLabel}</div>
        </div>
        <div className={cn('h-3 w-3 rounded-full', tone.dot)} />
      </div>
      <div className="mt-3 text-sm leading-6 text-slate-300">{engine.detailLabel}</div>
    </div>
  );
};

const ReliabilityCard = ({ bar }: { bar: AutoFactoryReliabilityBar }) => {
  const tone = toneClasses[bar.tone];

  return (
    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{bar.label}</div>
        <div className={cn('text-sm font-black', tone.text)}>{bar.valueLabel}</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full border border-white/5 bg-slate-950">
        <div
          className={cn('h-full rounded-full transition-all', tone.panel)}
          style={{ width: `${bar.value ?? 0}%` }}
        />
      </div>
      <div className="mt-3 text-xs leading-5 text-slate-400">{bar.hint}</div>
    </div>
  );
};

const LogRow = ({ log }: { log: AutoFactoryLogRecord }) => {
  const tone = toneClasses[log.tone];

  return (
    <div className="grid grid-cols-[120px_90px_1fr] gap-4 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 text-sm">
      <div className="font-mono text-slate-500">{log.timestampLabel}</div>
      <div className={cn('font-black uppercase tracking-[0.18em]', tone.text)}>{log.levelLabel}</div>
      <div className="leading-6 text-slate-200">{log.message}</div>
    </div>
  );
};

export default function AutoFactoryView() {
  const backendStatus = useBackendStatus();
  const [tab, setTab] = useState<'pipeline' | 'fixes' | 'axioms' | 'terminal'>('pipeline');
  const [statusPayload, setStatusPayload] = useState<unknown>(null);
  const [bugsPayload, setBugsPayload] = useState<unknown>([]);
  const [goldPatternsPayload, setGoldPatternsPayload] = useState<unknown>([]);
  const [statsPayload, setStatsPayload] = useState<unknown>(null);
  const [logsPayload, setLogsPayload] = useState<unknown>([]);
  const [systemStats, setSystemStats] = useState<SystemStatsResponse | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'emerald' | 'amber'; message: string } | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const loadData = useCallback(async (silent: boolean = false) => {
    if (silent) {
      setRefreshing(true);
    }

    try {
      const [statusResult, bugsResult, goldPatternsResult, statsResult, logsResult, systemStatsResult, systemStatusResult] = await Promise.allSettled([
        factoryApi.getInfiniteStatus(),
        factoryApi.getBugs(),
        factoryApi.getGoldPatterns(),
        factoryApi.getStats(),
        factoryApi.getLogs(),
        systemApi.getStats(),
        systemApi.getStatus(),
      ]);

      setStatusPayload(statusResult.status === 'fulfilled' ? statusResult.value : null);
      setBugsPayload(bugsResult.status === 'fulfilled' ? bugsResult.value : []);
      setGoldPatternsPayload(goldPatternsResult.status === 'fulfilled' ? goldPatternsResult.value : []);
      setStatsPayload(statsResult.status === 'fulfilled' ? statsResult.value : null);
      setLogsPayload(logsResult.status === 'fulfilled' ? logsResult.value : []);
      setSystemStats(systemStatsResult.status === 'fulfilled' ? systemStatsResult.value : null);
      setSystemStatus(systemStatusResult.status === 'fulfilled' ? systemStatusResult.value : null);

      const failures = [
        statusResult,
        bugsResult,
        goldPatternsResult,
        statsResult,
        logsResult,
        systemStatsResult,
        systemStatusResult,
      ].filter((result) => result.status === 'rejected').length;

      if (failures === 7) {
        setFeedback({
          tone: 'amber',
          message: 'Автозавод не отримав підтверджених даних від Factory API та System API.',
        });
      } else if (!silent) {
        setFeedback(null);
        
        // ЕЛІТ-діагностика: успішна синхронізація Автозаводу
        window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'AI_AutoFactory',
            message: backendStatus.isOffline 
              ? 'Автозавод синхронізовано через автономний MIRROR-вузол.' 
              : 'Автозавод успішно підключено до центральних виробничих ліній.',
            severity: 'info',
            timestamp: new Date().toISOString(),
            code: backendStatus.isOffline ? 'FACTORY_OFFLINE' : 'FACTORY_SUCCESS'
          }
        }));
      }
    } catch (error) {
      console.error('[AutoFactoryView] Не вдалося завантажити дані:', error);
      setFeedback({
        tone: 'amber',
        message: 'Автозавод не зміг синхронізувати реальні дані з бекендом.',
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    const interval = window.setInterval(() => {
      void loadData(true);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadData]);

  const snapshot = useMemo(
    () => normalizeAutoFactorySnapshot(
      statusPayload,
      bugsPayload,
      goldPatternsPayload,
      statsPayload,
      logsPayload,
      systemStats,
      systemStatus,
    ),
    [statusPayload, bugsPayload, goldPatternsPayload, logsPayload, statsPayload, systemStats, systemStatus],
  );

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [snapshot.logs]);

  const handleToggleCycle = useCallback(async () => {
    setBusy(true);
    setFeedback(null);

    try {
      if (snapshot.isRunning) {
        await factoryApi.stopInfinite();
        setFeedback({
          tone: 'emerald',
          message: 'Запит на зупинку OODA-циклу передано бекенду. Стан буде оновлено після підтвердження.',
        });
      } else {
        await factoryApi.startInfinite();
        setFeedback({
          tone: 'emerald',
          message: 'Запит на запуск OODA-циклу передано бекенду. Локальна симуляція не використовується.',
        });
      }

      await loadData(true);
    } catch (error) {
      console.error('[AutoFactoryView] Не вдалося змінити стан OODA:', error);
      setFeedback({
        tone: 'amber',
        message: 'Бекенд не підтвердив зміну стану OODA-циклу.',
      });
    } finally {
      setBusy(false);
    }
  }, [loadData, snapshot.isRunning]);

  const feedbackTone = feedback?.tone === 'amber'
    ? 'border-rose-500/20 bg-rose-500/10 text-rose-100'
    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100';

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-[#020202] pb-24 text-slate-200">
        <AdvancedBackground />
        <CyberGrid color="rgba(212,175,55,0.06)" />

        <div className="relative z-10 mx-auto max-w-[1760px] space-y-8 px-4 py-8 sm:px-8 lg:px-12">
          <ViewHeader
            title={(
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 scale-150 rounded-full bg-[#D4AF37]/20 blur-[60px]" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-[28px] border border-[#D4AF37]/20 bg-slate-950/90 shadow-2xl">
                    <Factory size={30} className="text-[#D4AF37] drop-shadow-[0_0_14px_rgba(212,175,55,0.75)]" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-black uppercase tracking-[0.14em] text-white sm:text-5xl">
                    Автономний <span className="text-[#D4AF37]">завод</span>
                  </h1>
                  <p className="mt-3 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.34em] text-[#D4AF37]/75">
                    <Sparkles size={12} className="animate-pulse" />
                    v58.2-WRAITH · МОДУЛЬ НЕЙ� ОННОЇ ЕВОЛЮЦІЇ
                  </p>
                </div>
              </div>
            )}
            icon={<Factory size={20} className="text-[#D4AF37]" />}
            breadcrumbs={['PREDATOR', 'ШІ', 'Автозавод']}
            stats={[
              {
                label: 'Статус',
                value: snapshot.statusLabel,
                icon: <Activity size={14} />,
                color: snapshot.isRunning ? 'warning' : 'default',
                animate: snapshot.isRunning,
              },
              {
                label: 'Цикли',
                value: snapshot.cycleLabel,
                icon: <RefreshCw size={14} />,
                color: 'primary',
              },
              {
                label: 'Середній бал',
                value: snapshot.avgScoreLabel,
                icon: <TrendingUp size={14} />,
                color: 'success',
              },
            ]}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn('border px-4 py-2 text-[11px] font-bold', backendStatus.isOffline ? toneClasses.amber.badge : toneClasses.sky.badge)}>
              {backendStatus.statusLabel}
            </Badge>
            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
              Джерела: /factory/infinite/status, /factory/bugs, /factory/patterns/gold, /factory/stats, /factory/logs, /system/status, /system/stats
            </Badge>
            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
              Оновлено: {snapshot.lastUpdatedLabel ?? 'Немає підтвердженої синхронізації'}
            </Badge>
            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
              Джерело бекенду: {backendStatus.sourceLabel}
            </Badge>
          </div>

          {feedback && (
            <div className={cn('rounded-[24px] border px-5 py-4 text-sm leading-6', feedbackTone)}>
              {feedback.message}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {snapshot.metrics.map((metric) => (
              <MetricCard key={metric.label} card={metric} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 rounded-[28px] border border-white/10 bg-slate-950/50 p-3">
                {[
                  { id: 'pipeline', label: 'OODA контур', icon: Activity },
                  { id: 'fixes', label: 'Черга виправлень', icon: Wrench },
                  { id: 'axioms', label: 'Аксіоми', icon: Shield },
                  { id: 'terminal', label: 'Журнал ядра', icon: Terminal },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id as typeof tab)}
                    className={cn(
                      'inline-flex items-center gap-3 rounded-[22px] px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] transition',
                      tab === item.id
                        ? 'bg-[#D4AF37] text-slate-950 shadow-[0_18px_36px_rgba(212,175,55,0.3)]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </button>
                ))}
              </div>

              {tab === 'pipeline' && (
                <TacticalCard variant="holographic" title="Поточний цикл OODA" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/50 p-8">
                  {snapshot.hasAnyData ? (
                    <div className="space-y-8">
                      <div className="grid gap-4 lg:grid-cols-5">
                        {snapshot.pipeline.map((stage) => {
                          const tone = toneClasses[stage.tone];

                          return (
                            <div
                              key={stage.id}
                              className={cn(
                                'rounded-[28px] border p-5 text-center shadow-[0_16px_40px_rgba(2,6,23,0.18)]',
                                tone.border,
                                stage.status === 'active' ? tone.panel : 'bg-black/20',
                              )}
                            >
                              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{stage.label}</div>
                              <div className={cn('mt-3 text-sm font-black uppercase tracking-[0.18em]', tone.text)}>
                                {stage.status === 'done' ? 'Завершено' : stage.status === 'active' ? 'Активно' : 'Очікує'}
                              </div>
                              <div className="mt-4 text-sm leading-6 text-slate-300">{stage.detail}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-[32px] border border-white/10 bg-black/20 p-6">
                        <div className="flex items-center gap-3">
                          <BrainCircuit size={18} className="text-[#D4AF37]" />
                          <div className="text-sm font-black uppercase tracking-[0.22em] text-white">Поточний стан рішення</div>
                        </div>
                        <div className="mt-4 text-base leading-7 text-slate-300">
                          Автозавод показує лише серверний стан циклу. Якщо бекенд не повернув фазу, прогрес або журнал, відповідні блоки лишаються порожніми без домальованих етапів.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="OODA-цикл не підтверджений"
                      description="Factory API не повернув статус автономного циклу. Візуалізація етапів не генерується локально."
                    />
                  )}
                </TacticalCard>
              )}

              {tab === 'fixes' && (
                <TacticalCard variant="holographic" title="Черга виправлень" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/50 p-8">
                  {snapshot.bugs.length > 0 ? (
                    <div className="space-y-5">
                      {snapshot.bugs.map((bug) => (
                        <BugCard key={bug.id} bug={bug} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Черга виправлень порожня"
                      description="`/factory/bugs` не повернув елементів. Матриця патчів не заповнюється демо-багами."
                    />
                  )}
                </TacticalCard>
              )}

              {tab === 'axioms' && (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {AXIOMS.map((axiom) => (
                      <TacticalCard key={axiom.code} variant="holographic" className="rounded-[36px] border-white/10 bg-slate-950/50 p-8">
                        <div className="flex items-start gap-5">
                          <div className="rounded-[24px] border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-sm font-black text-[#D4AF37]">
                            {axiom.code}
                          </div>
                          <div>
                            <div className="text-lg font-black uppercase tracking-[0.16em] text-white">{axiom.title}</div>
                            <div className="mt-3 text-sm leading-6 text-slate-400">{axiom.detail}</div>
                          </div>
                        </div>
                      </TacticalCard>
                    ))}
                  </div>

                  <TacticalCard variant="holographic" title="Суверенний контур" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/50 p-8">
                    <div className="grid gap-4 md:grid-cols-3">
                      {snapshot.engines.map((engine) => (
                        <EngineCard key={engine.id} engine={engine} />
                      ))}
                    </div>
                  </TacticalCard>
                </div>
              )}

              {tab === 'terminal' && (
                <TacticalCard variant="holographic" title="Журнал ядра" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/80 p-0 overflow-hidden">
                  <div className="border-b border-white/10 bg-black/30 px-6 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                    Потік підтверджених подій Factory API
                  </div>
                  <div className="max-h-[720px] space-y-3 overflow-y-auto p-6 font-mono">
                    {snapshot.logs.length > 0 ? (
                      <>
                        {snapshot.logs.map((log) => (
                          <LogRow key={log.id} log={log} />
                        ))}
                        <div ref={logsEndRef} />
                      </>
                    ) : (
                      <EmptyState
                        title="Журнал ядра порожній"
                        description="`/factory/logs` і поточний OODA статус не повернули повідомлень. Консоль не генерує локальні рядки."
                      />
                    )}
                  </div>
                </TacticalCard>
              )}
            </div>

            <div className="space-y-6">
              <TacticalCard variant="holographic" title="Керування контуром" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/50 p-8">
                <div className="space-y-6">
                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Стан бекенду</div>
                    <div className="mt-2 text-2xl font-black text-white">{snapshot.statusLabel}</div>
                    <div className="mt-3 text-sm leading-6 text-slate-300">
                      Запуск і зупинка OODA відбуваються тільки через реальні `POST /factory/infinite/start` та `POST /factory/infinite/stop`.
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        void handleToggleCycle();
                      }}
                      disabled={busy}
                      className={cn(
                        'inline-flex items-center justify-center gap-3 rounded-[24px] px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] transition',
                        snapshot.isRunning
                          ? 'border border-rose-500/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15'
                          : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15',
                        busy && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : snapshot.isRunning ? <Pause size={16} /> : <Play size={16} />}
                      {snapshot.isRunning ? 'Зупинити цикл' : 'Запустити цикл'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void loadData(true);
                      }}
                      disabled={refreshing}
                      className={cn(
                        'inline-flex items-center justify-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-white transition hover:bg-white/10',
                        refreshing && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      Оновити дані
                    </button>
                  </div>
                </div>
              </TacticalCard>

              <TacticalCard variant="holographic" title="Контурні сигнали" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/50 p-8">
                <div className="space-y-4">
                  {snapshot.engines.map((engine) => (
                    <EngineCard key={engine.id} engine={engine} />
                  ))}
                </div>
              </TacticalCard>

              <TacticalCard variant="holographic" title="Надійність контуру" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/50 p-8">
                {snapshot.reliability.some((bar) => bar.value != null) ? (
                  <div className="space-y-4">
                    {snapshot.reliability.map((bar) => (
                      <ReliabilityCard key={bar.id} bar={bar} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Немає підтверджених агрегатів"
                      description="Factory API і System API не повернули достатньо даних для побудови індикаторів надійності."
                  />
                )}
              </TacticalCard>

              <div className="rounded-[36px] border border-[#D4AF37]/20 bg-[linear-gradient(135deg,rgba(168,162,158,0.1),rgba(15,23,42,0.92))] p-6 shadow-[0_22px_60px_rgba(212,175,55,0.15)]">
                <div className="flex items-start gap-4">
                  <div className="rounded-[24px] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                    {snapshot.isRunning ? <Zap size={22} /> : <ShieldCheck size={22} />}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Висновок</div>
                    <div className="mt-2 text-lg font-black text-white">
                      {snapshot.isRunning
                        ? 'Автозавод працює у підтвердженому серверному циклі.'
                        : 'Активний цикл не підтверджено, контур у режимі очікування.'}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-300">
                      Екран більше не домальовує покоління, успішність або синтетичні патчі. Кожен блок або привʼязаний до реального Factory/System API, або показує чесний порожній стан.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
