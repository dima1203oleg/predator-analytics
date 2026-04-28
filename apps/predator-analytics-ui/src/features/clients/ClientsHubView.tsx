import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Building2,
  Database,
  DollarSign,
  FileCheck,
  Globe,
  Landmark,
  Loader2,
  Radio,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { createMetric, createRisk, createStandardContextActions } from '@/components/layout/contextRail.builders';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { useContextRail } from '@/hooks/useContextRail';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/utils/cn';
import { useAppStore } from '@/store/useAppStore';
import { dashboardApi, type DashboardOverview } from '@/services/api/dashboard';
import { systemApi, type SystemStatsResponse, type SystemStatusResponse } from '@/services/api/system';
import {
  normalizeClientsHubSnapshot,
  type ClientPersona,
  type ClientsHubSummaryCard,
  type ClientsHubTone,
  type SegmentKey,
} from './clientsHubView.utils';

type SegmentCardDefinition = {
  key: SegmentKey;
  title: string;
  subtitle: string;
  persona: ClientPersona;
  icon: React.ComponentType<{ className?: string }>;
  accent: {
    border: string;
    panel: string;
    text: string;
    badge: string;
    glow: string;
  };
};

const SEGMENTS: SegmentCardDefinition[] = [
  {
    key: 'business',
    title: 'Бізнес та корпорації',
    subtitle: 'Конкурентна розвідка, контрагенти, ланцюги постачання і торговельний контекст.',
    persona: 'BUSINESS',
    icon: Building2,
    accent: {
      border: 'border-rose-500/20',
      panel: 'bg-rose-500/10',
      text: 'text-rose-200',
      badge: 'border-rose-500/20 bg-rose-500/10 text-rose-100',
      glow: 'from-rose-500/24 via-rose-500/8 to-transparent',
    },
  },
  {
    key: 'banking',
    title: 'Банки та фінанси',
    subtitle: 'AML, санкційний контур, ризикові сигнали та швидкість обробки пошуку.',
    persona: 'BANKING',
    icon: DollarSign,
    accent: {
      border: 'border-rose-600/20',
      panel: 'bg-rose-600/10',
      text: 'text-rose-300',
      badge: 'border-rose-600/20 bg-rose-600/10 text-rose-100',
      glow: 'from-rose-600/24 via-rose-600/8 to-transparent',
    },
  },
  {
    key: 'government',
    title: 'Державні органи',
    subtitle: 'Імпорт, експорт, моніторинг потоків і стан виробничих пайплайнів.',
    persona: 'GOVERNMENT',
    icon: Landmark,
    accent: {
      border: 'border-blue-500/20',
      panel: 'bg-blue-500/10',
      text: 'text-blue-200',
      badge: 'border-blue-500/20 bg-blue-500/10 text-blue-100',
      glow: 'from-blue-500/24 via-blue-500/8 to-transparent',
    },
  },
  {
    key: 'law',
    title: 'Правоохоронний контур',
    subtitle: 'Граф звʼязків, ризикові сигнали та алерти для оперативних сценаріїв.',
    persona: 'INTELLIGENCE',
    icon: ShieldAlert,
    accent: {
      border: 'border-rose-400/20',
      panel: 'bg-rose-400/10',
      text: 'text-rose-200',
      badge: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
      glow: 'from-rose-400/24 via-rose-400/8 to-transparent',
    },
  },
  {
    key: 'regulators',
    title: '� егулятори та контроль',
    subtitle: 'Технічна готовність сервісів, завершені цикли та контроль індексів.',
    persona: 'GOVERNMENT',
    icon: FileCheck,
    accent: {
      border: 'border-rose-600/20',
      panel: 'bg-rose-600/10',
      text: 'text-rose-200',
      badge: 'border-rose-600/20 bg-rose-600/10 text-rose-100',
      glow: 'from-rose-600/24 via-rose-600/8 to-transparent',
    },
  },
  {
    key: 'legal',
    title: 'Юридичний контур',
    subtitle: 'Належна перевірка, ризикові списки, векторна база і затримка відповіді.',
    persona: 'BUSINESS',
    icon: Scale,
    accent: {
      border: 'border-slate-400/20',
      panel: 'bg-slate-400/10',
      text: 'text-slate-100',
      badge: 'border-slate-400/20 bg-slate-400/10 text-slate-100',
      glow: 'from-slate-400/20 via-slate-400/8 to-transparent',
    },
  },
];

const toneClasses: Record<ClientsHubTone, { badge: string; text: string }> = {
  rose: {
    badge: 'border-rose-500/20 bg-rose-500/10 text-rose-100',
    text: 'text-rose-200',
  },
  crimson: {
    badge: 'border-rose-700/20 bg-rose-700/10 text-rose-100',
    text: 'text-rose-200',
  },
  sky: {
    badge: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
    text: 'text-sky-200',
  },
  slate: {
    badge: 'border-white/10 bg-white/5 text-slate-200',
    text: 'text-slate-200',
  },
};

const summaryToneClasses: Record<ClientsHubTone, { border: string; panel: string; value: string }> = {
  rose: {
    border: 'border-rose-500/20',
    panel: 'bg-rose-500/10',
    value: 'text-rose-200',
  },
  crimson: {
    border: 'border-rose-700/20',
    panel: 'bg-rose-700/10',
    value: 'text-rose-200',
  },
  sky: {
    border: 'border-sky-500/20',
    panel: 'bg-sky-500/10',
    value: 'text-sky-200',
  },
  slate: {
    border: 'border-white/10',
    panel: 'bg-white/5',
    value: 'text-slate-100',
  },
};

const personaLabel = (persona: string): string => {
  switch (persona) {
    case 'BUSINESS':
      return 'Бізнес';
    case 'BANKING':
      return 'Фінанси';
    case 'GOVERNMENT':
      return 'Держава';
    case 'INTELLIGENCE':
      return '� озвідка';
    default:
      return 'Змішаний режим';
  }
};

const SummaryCard = ({ card }: { card: ClientsHubSummaryCard }) => {
  const tone = summaryToneClasses[card.tone];

  return (
    <TacticalCard variant="holographic" className={cn('rounded-[32px] border bg-slate-950/50 p-6', tone.border)}>
      <div className="space-y-3">
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{card.label}</div>
        <div className={cn('text-4xl font-black tracking-tight', tone.value)}>{card.value}</div>
        <div className="text-sm leading-6 text-slate-400">{card.hint}</div>
      </div>
      <div className={cn('mt-5 h-1.5 rounded-full', tone.panel)} />
    </TacticalCard>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-[32px] border border-dashed border-white/10 bg-black/20 px-6 py-8 text-center text-sm leading-6 text-slate-400">
    {message}
  </div>
);

export default function ClientsHubView() {
  const navigate = useNavigate();
  const { persona, setPersona } = useAppStore();
  const backendStatus = useBackendStatus();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStatsResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async (silent: boolean = false) => {
    if (silent) {
      setRefreshing(true);
    }

    try {
      const [overviewResult, systemStatusResult, systemStatsResult] = await Promise.allSettled([
        dashboardApi.getOverview(),
        systemApi.getStatus(),
        systemApi.getStats(),
      ]);

      setOverview(overviewResult.status === 'fulfilled' ? overviewResult.value : null);
      setSystemStatus(systemStatusResult.status === 'fulfilled' ? systemStatusResult.value : null);
      setSystemStats(systemStatsResult.status === 'fulfilled' ? systemStatsResult.value : null);

      const failures = [overviewResult, systemStatusResult, systemStatsResult].filter((result) => result.status === 'rejected').length;

      if (failures === 3) {
        setFeedback('Клієнтський хаб не отримав підтверджених даних від API дашборду та системного API.');
      } else if (!silent) {
        setFeedback(null);
      }
    } catch (error) {
      console.error('[ClientsHubView] Не вдалося завантажити дані:', error);
      setFeedback('Клієнтський хаб не зміг синхронізувати реальні дані з бекендом.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    const interval = window.setInterval(() => {
      void loadData(true);
    }, 60000);

    return () => window.clearInterval(interval);
  }, [loadData]);

  const snapshot = useMemo(
    () => normalizeClientsHubSnapshot(overview, systemStatus, systemStats),
    [overview, systemStatus, systemStats],
  );
  const activeSegment = useMemo(
    () => SEGMENTS.find((segment) => segment.persona === persona) ?? SEGMENTS[0],
    [persona],
  );
  const clientsRailPayload = useMemo(
    () => ({
      entityId: 'clients',
      entityType: 'клієнтський контур',
      title: activeSegment.title,
      subtitle: activeSegment.subtitle,
      status: {
        label: `� ежим: ${personaLabel(persona)}`,
        tone: (backendStatus.isOffline ? 'warning' : 'info') as any,
      },
      actions: createStandardContextActions({
        auditPath: '/diligence',
        documentsPath: '/documents',
        agentPath: '/agents',
      }),
      insights: snapshot.summary.slice(0, 3).map((card) =>
        createMetric(card.id, card.label, card.value, card.hint, card.tone === 'amber' ? 'danger' : 'info'),
      ),
      relations: SEGMENTS.slice(0, 3).map((segment) =>
        createMetric(
          `segment-${segment.key}`,
          segment.title,
          snapshot.segments[segment.key].statusLabel,
          snapshot.segments[segment.key].note,
          segment.persona === persona ? 'success' : 'neutral',
        ),
      ),
      documents: [
        {
          id: 'clients-hub',
          label: 'Клієнтський хаб',
          detail: `Оновлено: ${snapshot.lastUpdatedLabel ?? 'очікує синхронізацію'}`,
          path: '/clients',
        },
        {
          id: 'clients-segment',
          label: 'Активний сегмент',
          detail: activeSegment.title,
          path: `/clients/${activeSegment.key}`,
        },
      ],
      risks: feedback
        ? [createRisk('clients-feedback', 'Потрібна перевірка API', feedback, 'warning')]
        : [createRisk('clients-fallback', 'Контур стабільний', 'Підтверджені агрегати доступні в клієнтському хабі.', 'success')],
      sourcePath: '/clients',
    }),
    [activeSegment, backendStatus.isOffline, feedback, persona, snapshot],
  );

  useContextRail(clientsRailPayload);

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-[#040915] pb-20 text-slate-100">
        <AdvancedBackground />
        <CyberGrid color="rgba(225,29,72,0.05)" />

        <div className="relative z-10 mx-auto max-w-[1760px] space-y-8 px-4 py-8 sm:px-8 lg:px-12">
          <ViewHeader
            title={(
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-[48px]" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-[26px] border border-rose-500/20 bg-slate-950/90 shadow-2xl">
                    <Sparkles className="h-8 w-8 text-rose-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-black uppercase tracking-[0.14em] text-white sm:text-5xl">
                    Клієнтські <span className="text-rose-400">контури</span>
                  </h1>
                  <p className="mt-3 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.34em] text-rose-300/70">
                    <Zap size={12} className="animate-pulse" />
                    � обочі режими без локальних лічильників
                  </p>
                </div>
              </div>
            )}
            icon={<Sparkles className="h-5 w-5 text-rose-400" />}
            breadcrumbs={['PREDATOR', 'Клієнти', 'Контури']}
            stats={[
              {
                label: '� ежим',
                value: personaLabel(persona),
                icon: <Activity size={14} />,
                color: 'primary',
              },
              {
                label: 'Декларації',
                value: snapshot.summary[0]?.value ?? 'Н/д',
                icon: <Database size={14} />,
                color: 'rose',
              },
              {
                label: 'Сервіси',
                value: snapshot.summary[3]?.value ?? 'Н/д',
                icon: <Radio size={14} />,
                color: backendStatus.isOffline ? 'danger' : 'success',
                animate: !backendStatus.isOffline,
              },
            ]}
            actions={(
              <button
                type="button"
                onClick={() => {
                  void loadData(true);
                }}
                disabled={refreshing}
                className={cn(
                  'inline-flex items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-5 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-white transition hover:bg-white/10',
                  refreshing && 'cursor-not-allowed opacity-60',
                )}
              >
                {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                Оновити дані
              </button>
            )}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn('border px-4 py-2 text-[11px] font-bold', backendStatus.isOffline ? toneClasses.crimson.badge : toneClasses.sky.badge)}>
              {backendStatus.statusLabel}
            </Badge>
            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
              Джерела: /dashboard/overview, /system/status, /system/stats
            </Badge>
            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
              Оновлено: {snapshot.lastUpdatedLabel ?? 'Немає підтвердженої синхронізації'}
            </Badge>
            <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
              Джерело бекенду: {backendStatus.sourceLabel}
            </Badge>
          </div>

          {feedback && (
            <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm leading-6 text-rose-100">
              {feedback}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {snapshot.summary.map((card) => (
              <SummaryCard key={card.id} card={card} />
            ))}
          </div>

          {!snapshot.hasAnyData && (
            <EmptyState message="API дашборду та системний API не повернули підтверджених агрегатів. Картки доступні для навігації, але значення не домальовуються локально." />
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {SEGMENTS.map((segment) => {
              const segmentState = snapshot.segments[segment.key];
              const isActive = persona === segment.persona;
              const statusTone = toneClasses[segmentState.tone];
              const Icon = segment.icon;

              return (
                <motion.div
                  key={segment.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <TacticalCard
                    variant="holographic"
                    className={cn(
                      'relative h-full overflow-hidden rounded-[36px] border bg-slate-950/60 p-7 shadow-[0_28px_70px_rgba(2,6,23,0.28)]',
                      segment.accent.border,
                    )}
                  >
                    <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b opacity-90', segment.accent.glow)} />

                    <div className="relative z-10 flex h-full flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className={cn('rounded-[24px] border p-4 shadow-inner', segment.accent.border, segment.accent.panel)}>
                          <Icon className={cn('h-6 w-6', segment.accent.text)} />
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase tracking-widest', statusTone.badge)}>
                            {segmentState.statusLabel}
                          </Badge>
                          {isActive && (
                            <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase tracking-widest', segment.accent.badge)}>
                              Активний режим
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="text-xl font-black uppercase tracking-[0.12em] text-white">{segment.title}</div>
                        <div className="mt-3 text-sm leading-6 text-slate-300">{segment.subtitle}</div>
                      </div>

                      <div className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-5">
                        <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                          <Globe className="h-3.5 w-3.5" />
                          Підтверджені агрегати
                        </div>

                        <div className="space-y-3">
                          {segmentState.metrics.map((metric) => (
                            <div key={metric.label} className="rounded-[20px] border border-white/5 bg-black/20 px-4 py-3">
                              <div className="flex items-center justify-between gap-4">
                                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{metric.label}</div>
                                <div className={cn('text-sm font-black', statusTone.text)}>{metric.value}</div>
                              </div>
                              <div className="mt-2 text-xs leading-5 text-slate-500">{metric.hint}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-slate-300">
                        {segmentState.note}
                      </div>

                      <div className="mt-6 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPersona(segment.persona);
                            navigate(`/clients/${segment.key}`);
                          }}
                          className={cn(
                            'inline-flex flex-1 items-center justify-center gap-3 rounded-[22px] px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] transition',
                            isActive
                              ? cn(segment.accent.badge, 'border hover:opacity-90')
                              : 'border border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10',
                          )}
                        >
                          <Sparkles className="h-4 w-4" />
                          Активувати контур
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/clients/${segment.key}`)}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                          aria-label={`Відкрити сегмент ${segment.title}`}
                        >
                          <ArrowRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </TacticalCard>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="rounded-[36px] border border-rose-500/20 bg-[linear-gradient(135deg,rgba(71,0,36,0.72),rgba(2,6,23,0.94))] p-6 shadow-[0_24px_70px_rgba(159,18,57,0.22)]">
            <div className="flex items-start gap-4">
              <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-3 text-rose-200">
                <Radio className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-100/70">� обочий принцип</div>
                <div className="mt-2 text-lg font-black text-white">Хаб показує сегменти доступу, а не намальовану операційну статистику.</div>
                <div className="mt-3 text-sm leading-6 text-slate-300">
                  Кожна картка тепер бере підтверджені агрегати з API дашборду та системного API. Якщо значення відсутнє, воно позначається як `Н/д`, а не підмінюється випадковими діапазонами чи локальними таймерами.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
