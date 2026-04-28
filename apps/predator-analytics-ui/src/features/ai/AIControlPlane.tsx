/**
 * 🕹️ AI Sovereign Control Plane | v58.2-WRAITH
 * PREDATOR — Контур Суверенного Керування Інтелектом
 * 
 * Моніторинг та налаштування нейронних рушіїв, телеметрія та управління політиками.
 * Sovereign Power Design System · Gold/Amber Palette · Tier-1 Access
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Cpu,
  Gauge,
  Loader2,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useSystemStatus, useSystemStats, useAIEngines, useSystemLogs } from '@/hooks/useAdminApi';
import { cn } from '@/utils/cn';
import {
  normalizeAIControlPlaneSnapshot,
  type AIControlEngineRecord,
  type AIControlLogRecord,
  type AIControlMetricCard,
  type AIControlTone,
} from './aiControlPlane.utils';

type TabId = 'engines' | 'governance' | 'logs';

const toneClasses: Record<AIControlTone, { border: string; panel: string; text: string; badge: string }> = {
  emerald: {
    border: 'border-emerald-500/20',
    panel: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  },
  amber: {
    border: 'border-rose-500/20',
    panel: 'bg-rose-500/10',
    text: 'text-rose-400',
    badge: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
  },
  sky: {
    border: 'border-rose-500/20', 
    panel: 'bg-rose-500/10',
    text: 'text-rose-500',
    badge: 'border-rose-500/20 bg-rose-500/10 text-rose-500',
  },
  gold: {
    border: 'border-[#D4AF37]/20',
    panel: 'bg-[#D4AF37]/10',
    text: 'text-[#D4AF37]',
    badge: 'border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]',
  },
  slate: {
    border: 'border-white/10',
    panel: 'bg-white/5',
    text: 'text-slate-200',
    badge: 'border-white/10 bg-white/5 text-slate-200',
  },
};

const metricIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  engines: Server,
  score: BarChart3,
  latency: Gauge,
  throughput: Activity,
  services: Radio,
};

const governanceCards = [
  {
    id: 'contract',
    title: 'Контракт даних',
    detail: 'Панель використовує лише `/system/engines`, `/system/status`, `/system/stats` і `/system/logs/stream`.',
  },
  {
    id: 'control',
    title: 'Керування рушіями',
    detail: 'Підтверджених керувальних маршрутів для локального вмикання, вимикання чи переналаштування рушіїв у цьому контурі немає.',
  },
  {
    id: 'limits',
    title: 'Межі телеметрії',
    detail: 'Якщо бекенд не повертає модель, провайдера, токенний бюджет чи температуру, інтерфейс не вигадує ці поля.',
  },
];

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-black/20 px-8 text-center">
    <AlertCircle className="mb-4 h-10 w-10 text-rose-300" />
    <div className="text-lg font-black text-white">{title}</div>
    <div className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</div>
  </div>
);

const MetricCard = ({ metric }: { metric: AIControlMetricCard }) => {
  const tone = toneClasses[metric.tone];
  const Icon = metricIcons[metric.id] ?? Activity;

  return (
    <TacticalCard variant="holographic" className={cn('rounded-[30px] border bg-slate-950/50 p-6', tone.border)}>
      <div className="flex items-start justify-between gap-4">
        <div className={cn('rounded-[18px] border p-3', tone.border, tone.panel)}>
          <Icon className={cn('h-5 w-5', tone.text)} />
        </div>
        <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase tracking-widest', tone.badge)}>
          {metric.label}
        </Badge>
      </div>

      <div className="mt-6 space-y-3">
        <div className={cn('text-4xl font-black tracking-tight', tone.text)}>{metric.value}</div>
        <div className="text-sm leading-6 text-slate-400">{metric.hint}</div>
      </div>
    </TacticalCard>
  );
};

const EngineCard = ({ engine }: { engine: AIControlEngineRecord }) => {
  const [expanded, setExpanded] = useState(false);
  const tone = toneClasses[engine.tone];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('overflow-hidden rounded-[30px] border bg-slate-950/55', tone.border)}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-start gap-4 px-5 py-5 text-left transition hover:bg-white/[0.02]"
      >
        <div className={cn('mt-1 rounded-full p-1', tone.panel)}>
          {expanded ? <ChevronDown className={cn('h-4 w-4', tone.text)} /> : <ChevronRight className={cn('h-4 w-4', tone.text)} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-white">{engine.title}</div>
            <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase tracking-widest', tone.badge)}>
              {engine.statusLabel}
            </Badge>
          </div>
          <div className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-slate-500">{engine.keyLabel}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { label: 'Бал', value: engine.scoreLabel },
              { label: 'Потік', value: engine.throughputLabel },
              { label: 'Затримка', value: engine.latencyLabel },
              { label: 'Навантаження', value: engine.loadLabel },
            ].map((item) => (
              <div key={item.label} className="rounded-[20px] border border-white/5 bg-black/25 px-3 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                <div className="mt-2 text-sm font-black text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-white/5 bg-black/20 px-4 py-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Тренд</div>
              <div className="mt-2 text-lg font-black text-white">{engine.trendLabel}</div>
            </div>
            <div className="rounded-[22px] border border-white/5 bg-black/20 px-4 py-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Примітка</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{engine.detailLabel}</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const LogRow = ({ log }: { log: AIControlLogRecord }) => {
  const tone = toneClasses[log.tone];

  return (
    <div className="grid grid-cols-[150px_110px_120px_1fr] gap-4 rounded-[20px] border border-white/5 bg-black/20 px-4 py-3 text-sm">
      <div className="font-mono text-slate-500">{log.timestampLabel}</div>
      <div className={cn('font-black uppercase tracking-[0.18em]', tone.text)}>{log.levelLabel}</div>
      <div className="font-mono text-slate-400">{log.serviceLabel}</div>
      <div className="leading-6 text-slate-200">{log.message}</div>
    </div>
  );
};

export default function AIControlPlane() {
  const backendStatus = useBackendStatus();
  const [activeTab, setActiveTab] = useState<TabId>('engines');

  // TanStack Query Hooks (v56.5-ELITE Integration)
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus, isRefetching: statusRefetching } = useSystemStatus();
  const { data: statsData, refetch: refetchStats, isRefetching: statsRefetching } = useSystemStats();
  const { data: enginesData, isLoading: enginesLoading, refetch: refetchEngines, isRefetching: enginesRefetching } = useAIEngines();
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs, isRefetching: logsRefetching } = useSystemLogs();

  const isInitialLoading = statusLoading || enginesLoading || logsLoading;
  const isRefreshing = statusRefetching || statsRefetching || enginesRefetching || logsRefetching;

  const snapshot = normalizeAIControlPlaneSnapshot(
    enginesData,
    statusData ?? null,
    statsData ?? null,
    logsData
  );

  const handleRefresh = async () => {
    await Promise.all([
      refetchStatus(),
      refetchStats(),
      refetchEngines(),
      refetchLogs()
    ]);
  };

  // Ефект для діагностики контуру
  useEffect(() => {
    if (!isInitialLoading && snapshot.hasAnyData) {
      const message = backendStatus.isOffline
        ? `АВТОНОМНИЙ_КОНТУ�  [${backendStatus.nodeSource}]: Телеметрія рушіїв завантажена з кешу Mirror Vault.`
        : `КОНТУ� _КЕ� УВАННЯ [${backendStatus.nodeSource}]: Телеметрію рушіїв успішно синхронізовано.`;

      window.dispatchEvent(
        new CustomEvent('predator-error', {
          detail: {
            service: 'AI_ControlPlane',
            message,
            severity: backendStatus.isOffline ? 'warning' : 'info',
            timestamp: new Date().toISOString(),
            code: backendStatus.isOffline ? 'CONTROL_PLANE_OFFLINE' : 'CONTROL_PLANE_SUCCESS',
          },
        })
      );
    }
  }, [isInitialLoading, snapshot.hasAnyData, backendStatus.isOffline, backendStatus.nodeSource]);

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-[#030712] pb-20 text-slate-100">
        <AdvancedBackground />
        <CyberGrid color="rgba(56,189,248,0.05)" />

        <div className="relative z-10 mx-auto max-w-[1760px] space-y-8 px-4 py-8 sm:px-8 lg:px-12">
          <ViewHeader
            title={(
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#D4AF37]/20 blur-[48px]" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-[26px] border border-[#D4AF37]/20 bg-slate-950/90 shadow-2xl">
                    <Sparkles className="h-8 w-8 text-[#D4AF37]" />
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-black uppercase tracking-[0.14em] text-white sm:text-5xl">
                    Контур керування <span className="text-[#D4AF37]">ШІ</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.34em] text-[#D4AF37]/70">
                    <Zap size={12} className="animate-pulse" />
                    v58.2-WRAITH · МОНІТО� ИНГ СУВЕ� ЕННИХ � УШІЇВ
                  </div>
                </div>
              </div>
            )}
            icon={<Sparkles className="h-5 w-5 text-[#D4AF37]" />}
            breadcrumbs={['PREDATOR', 'ШІ', 'Контур керування']}
            stats={[
              {
                label: '� ушії',
                value: snapshot.metrics[0]?.value ?? 'Н/д',
                icon: <Server size={14} />,
                color: 'primary',
              },
              {
                label: 'Затримка',
                value: snapshot.metrics[2]?.value ?? 'Н/д',
                icon: <Gauge size={14} />,
                color: 'warning',
              },
              {
                label: 'Сервіси',
                value: snapshot.metrics[4]?.value ?? 'Н/д',
                icon: <Radio size={14} />,
                color: backendStatus.isOffline ? 'danger' : 'success',
                animate: !backendStatus.isOffline,
              },
            ]}
            actions={(
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  'inline-flex items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-5 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-white transition hover:bg-white/10',
                  isRefreshing && 'cursor-not-allowed opacity-60',
                )}
              >
                {isRefreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                Оновити дані
              </button>
            )}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn('border px-4 py-2 text-[11px] font-bold', backendStatus.isOffline ? toneClasses.amber.badge : toneClasses.gold.badge)}>
              {backendStatus.statusLabel}
            </Badge>
            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
              Джерела: /system/engines, /system/status, /system/stats, /system/logs/stream
            </Badge>
            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
              Оновлено: {snapshot.lastUpdatedLabel ?? 'Немає підтвердженої синхронізації'}
            </Badge>
            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
              Керування рушіями: підтверджених керувальних маршрутів немає
            </Badge>
            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
              Джерело бекенду: {backendStatus.sourceLabel}
            </Badge>
          </div>

          {isInitialLoading && !snapshot.hasAnyData && (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6">
               <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37]" />
               <div className="text-sm font-black uppercase tracking-widest text-[#D4AF37]/70">Завантаження контуру...</div>
            </div>
          )}

          {!isInitialLoading && snapshot.metrics.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-5"
            >
              {snapshot.metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </motion.div>
          )}

          <div className="flex flex-wrap gap-3 rounded-[28px] border border-white/10 bg-slate-950/50 p-3">
            {[
              { id: 'engines' as const, label: '� ушії', icon: Server },
              { id: 'governance' as const, label: 'Політики', icon: ShieldAlert },
              { id: 'logs' as const, label: 'Журнал', icon: Terminal },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'inline-flex items-center gap-3 rounded-[22px] px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] transition',
                  activeTab === item.id
                    ? 'bg-[#D4AF37] text-slate-950 shadow-[0_18px_36px_rgba(212,175,55,0.24)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                )}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </div>

          {activeTab === 'engines' && (
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <TacticalCard variant="holographic" title="� еєстр рушіїв" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/50 p-8">
                {snapshot.engines.length > 0 ? (
                  <div className="space-y-4">
                    {snapshot.engines.map((engine) => (
                      <EngineCard key={engine.id} engine={engine} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="� ушії не підтверджені"
                    description="`/system/engines` не повернув елементів. Панель не домальовує локальний список мовних, векторних чи графових модулів."
                  />
                )}
              </TacticalCard>

              <div className="space-y-6">
                <TacticalCard variant="holographic" title="Стан контуру" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/50 p-8">
                  <div className="space-y-4">
                    {[
                      { label: 'Оптимальні', value: String(snapshot.activeCount), tone: 'emerald' as const },
                      { label: 'Калібрування', value: String(snapshot.degradedCount), tone: 'amber' as const },
                      { label: 'Недоступні', value: String(snapshot.offlineCount), tone: 'amber' as const },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                          <div className={cn('text-2xl font-black', toneClasses[item.tone].text)}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TacticalCard>

                <TacticalCard variant="holographic" title="Висновок" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/50 p-8">
                  <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(14,116,144,0.18),rgba(2,6,23,0.92))] p-5">
                    <div className="flex items-start gap-4">
                      <div className="rounded-[20px] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-lg font-black text-white">
                          {snapshot.hasAnyData
                            ? 'Панель показує лише підтверджену телеметрію рушіїв і системи.'
                            : 'Підтверджених даних для контуру керування зараз немає.'}
                        </div>
                        <div className="mt-3 text-sm leading-6 text-slate-300">
                          Якщо контракт не повертає температуру графічного процесора, токенний бюджет або операційні перемикачі, ці блоки відсутні замість декоративних цифр і локальних тумблерів.
                        </div>
                      </div>
                    </div>
                  </div>
                </TacticalCard>
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {governanceCards.map((card) => (
                <TacticalCard key={card.id} variant="holographic" className="rounded-[36px] border-[#D4AF37]/20 bg-slate-950/50 p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-[22px] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-lg font-black uppercase tracking-[0.14em] text-white">{card.title}</div>
                      <div className="mt-3 text-sm leading-6 text-slate-300">{card.detail}</div>
                    </div>
                  </div>
                </TacticalCard>
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <TacticalCard variant="holographic" title="Журнал системного контуру" className="rounded-[40px] border-[#D4AF37]/20 bg-slate-950/75 p-0 overflow-hidden">
              <div className="border-b border-white/10 bg-black/30 px-6 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                Потік підтверджених подій `/system/logs/stream`
              </div>
              <div className="max-h-[760px] space-y-3 overflow-y-auto p-6 font-mono">
                {snapshot.logs.length > 0 ? (
                  snapshot.logs.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))
                ) : (
                  <EmptyState
                    title="Журнал порожній"
                    description="`/system/logs/stream` не повернув записів. Панель не генерує локальні INFO, WARN чи ERROR рядки."
                  />
                )}
              </div>
            </TacticalCard>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
