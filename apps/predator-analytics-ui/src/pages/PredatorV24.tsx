import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Briefcase,
  Building2,
  ChevronRight,
  Layers3,
  Loader2,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { dashboardApi, type DashboardOverview } from '@/services/api/dashboard';
import {
  getVisibleNavigation,
  navAccentStyles,
} from '@/config/navigation';
import { useUser } from '@/context/UserContext';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)} млрд`;
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)} млн`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)} тис`;
  }

  return `$${value.toLocaleString('uk-UA')}`;
};

const formatNumber = (value: number): string => value.toLocaleString('uk-UA');

const timeAgo = (timestamp?: string): string => {
  if (!timestamp) {
    return 'Немає підтвердженої синхронізації';
  }

  const diff = Date.now() - new Date(timestamp).getTime();

  if (Number.isNaN(diff) || diff < 0) {
    return 'Щойно синхронізовано';
  }

  if (diff < 60_000) {
    return 'Щойно синхронізовано';
  }

  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)} хв тому`;
  }

  if (diff < 86_400_000) {
    return `${Math.floor(diff / 3_600_000)} год тому`;
  }

  return `${Math.floor(diff / 86_400_000)} дн тому`;
};

const PredatorV24 = () => {
  const { canonicalRole, canonicalTier } = useUser();
  const backendStatus = useBackendStatus();
  const navigationSections = useMemo(() => getVisibleNavigation(canonicalRole, canonicalTier), [canonicalTier, canonicalRole]);

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardApi.getOverview();

        if (isMounted) {
          setOverview(response);
        }
      } catch (fetchError) {
        if (isMounted) {
          console.error('[PredatorV24] Не вдалося завантажити головний огляд:', fetchError);
          setError('Головний огляд поки недоступний. Підтверджені дані не отримано від Core API.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = overview?.summary;
  const topRiskCompanies = overview?.top_risk_companies?.slice(0, 3) ?? [];
  const engineEntries = Object.values(overview?.engines ?? {}).slice(0, 4);
  const infrastructureEntries = Object.entries(overview?.infrastructure ?? {}).slice(0, 6);
  const countryEntries = Object.entries(overview?.countries ?? {}).slice(0, 5);

  const keyStats = [
    {
      label: 'Декларації',
      value: summary ? formatNumber(summary.total_declarations) : '—',
      hint: 'Підтверджені записи',
      icon: Activity,
      tone: 'emerald',
    },
    {
      label: 'Обсяг операцій',
      value: summary ? formatCurrency(summary.total_value_usd) : '—',
      hint: 'Сумарна вартість',
      icon: TrendingUp,
      tone: 'cyan',
    },
    {
      label: 'Ризикові сигнали',
      value: summary ? formatNumber(summary.high_risk_count) : '—',
      hint: 'Критичний рівень',
      icon: AlertTriangle,
      tone: 'rose',
    },
    {
      label: 'Активні пайплайни',
      value: summary ? formatNumber(summary.active_pipelines) : '—',
      hint: 'Поточна обробка',
      icon: Layers3,
      tone: 'amber',
    },
  ] as const;

  const quickActions = [
    {
      label: 'Оптимізація закупівель',
      description: 'Швидкий перехід до MVP-сценарію та екрану цінності',
      to: '/procurement-optimizer',
      icon: BadgeCheck,
    },
    {
      label: 'Центр виконання',
      description: 'Подивитися активні job-based сценарії і результат',
      to: '/scenario-progress',
      icon: Zap,
    },
    {
      label: 'Перевірка контрагента',
      description: 'Відкрити досьє компанії та CERS-аналіз',
      to: '/diligence',
      icon: BrainCircuit,
    },
    {
      label: 'Ринковий аналіз',
      description: 'Оцінити тенденції, країни й цінові сигнали',
      to: '/market',
      icon: TrendingUp,
    },
  ] as const;

  const topAlerts = overview?.alerts?.slice(0, 4) ?? [];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(3,12,21,0.96),rgba(8,18,31,0.94))] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_26%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200">
                Операційний центр
              </span>
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]',
                  backendStatus.isOffline
                    ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                    : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
                )}
              >
                {backendStatus.statusLabel}
              </span>
            </div>

            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Інтуїтивний старт для всієї платформи без декоративної синтетики.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Тут зведено реальні системні метрики, карту всіх розділів і короткі переходи до
              підрозділів. Якщо звʼязок із Core API відсутній, інтерфейс прямо це показує замість
              вигаданих показників.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Джерело: {backendStatus.sourceLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2">
                <Radio className="h-4 w-4 text-cyan-300" />
                Оновлено: {timeAgo(overview?.generated_at)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                {navigationSections.length} секцій / {navigationSections.reduce((total, section) => total + section.items.length, 0)} підрозділів
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/20 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/20">
                      <action.icon className="h-5 w-5 text-emerald-300" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-white">{action.label}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{action.description}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[540px]">
            {keyStats.map((stat) => {
              const toneMap = {
                amber: 'border-amber-400/18 bg-amber-500/10 text-amber-200',
                cyan: 'border-cyan-400/18 bg-cyan-500/10 text-cyan-200',
                emerald: 'border-emerald-400/18 bg-emerald-500/10 text-emerald-200',
                rose: 'border-rose-400/18 bg-rose-500/10 text-rose-200',
              } as const;

              return (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border', toneMap[stat.tone])}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                  </div>
                  <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-tight text-white">{stat.value}</div>
                  <div className="mt-1 text-xs text-slate-400">{stat.hint}</div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="relative mt-6 rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            {error}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Топ ризикові компанії</h2>
              <p className="mt-1 text-sm text-slate-400">Найбільш критичні підтверджені записи з головного огляду.</p>
            </div>
            <Link to="/diligence" className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/15">
              Відкрити досьє
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {topRiskCompanies.length > 0 ? (
              topRiskCompanies.map((company, index) => (
                <div key={`${company.edrpou}-${index}`} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-cyan-300" />
                        <div className="truncate font-semibold text-white">{company.name}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">ЄДРПОУ: {company.edrpou} • Записів: {company.count}</div>
                    </div>
                    <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', company.maxRisk >= 80 ? 'border-rose-400/20 bg-rose-500/10 text-rose-200' : company.maxRisk >= 50 ? 'border-amber-400/20 bg-amber-500/10 text-amber-200' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200')}>
                      {company.maxRisk}% ризику
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Сумарна вартість</div>
                      <div className="mt-1 text-sm font-semibold text-white">{formatCurrency(company.totalValue)}</div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Ризиковий максимум</div>
                      <div className="mt-1 text-sm font-semibold text-white">{company.maxRisk}%</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-5 text-sm text-slate-400">
                Поки немає підтверджених топ-ризиків або бекенд не повернув дані.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
          <h2 className="text-xl font-black tracking-tight text-white">Стан інфраструктури</h2>
          <p className="mt-1 text-sm text-slate-400">Короткий огляд ключових підсистем платформи.</p>

          <div className="mt-5 space-y-3">
            {infrastructureEntries.length > 0 ? (
              infrastructureEntries.map(([name, component]) => (
                <div key={name} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{name}</div>
                    <span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', component.status === 'healthy' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : component.status === 'warning' ? 'border-amber-400/20 bg-amber-500/10 text-amber-200' : 'border-rose-400/20 bg-rose-500/10 text-rose-200')}>
                      {component.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {'records' in component && component.records !== undefined && <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1">Записи: {component.records}</span>}
                    {'documents' in component && component.documents !== undefined && <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1">Документи: {component.documents}</span>}
                    {'vectors' in component && component.vectors !== undefined && <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1">Вектори: {component.vectors}</span>}
                    {'nodes' in component && component.nodes !== undefined && <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1">Вузли: {component.nodes}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-5 text-sm text-slate-400">Немає доступних індикаторів інфраструктури.</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Двигуни платформи</h2>
              <p className="mt-1 text-sm text-slate-400">Продуктивність, навантаження та стан ключових сервісів.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {engineEntries.length > 0 ? (
              engineEntries.map((engine) => (
                <div key={engine.id} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{engine.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{engine.trend}</div>
                    </div>
                    <span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', engine.status === 'optimal' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : engine.status === 'calibrating' ? 'border-amber-400/20 bg-amber-500/10 text-amber-200' : 'border-rose-400/20 bg-rose-500/10 text-rose-200')}>
                      {engine.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2">Score<br /><span className="text-sm font-semibold text-white">{engine.score}</span></div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2">Latency<br /><span className="text-sm font-semibold text-white">{engine.latency}мс</span></div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2">Load<br /><span className="text-sm font-semibold text-white">{engine.load}%</span></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-5 text-sm text-slate-400">Дані двигунів ще не підвантажені.</div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Географія потоку</h2>
              <p className="mt-1 text-sm text-slate-400">Країни з найбільшим вкладом у зовнішньоекономічну активність.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {countryEntries.length > 0 ? (
              countryEntries.map(([code, stat]) => (
                <div key={code} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{code}</div>
                      <div className="mt-1 text-xs text-slate-500">Транзакцій: {stat.count}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{formatCurrency(stat.value)}</div>
                      <div className="mt-1 text-xs text-slate-500">Обсяг</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-5 text-sm text-slate-400">Немає даних по країнах.</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Карта розділів</h2>
              <p className="mt-1 text-sm text-slate-400">
                Кожна секція пояснює своє призначення і одразу веде до корисних підрозділів.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {navigationSections.map((section) => {
              const accent = navAccentStyles[section.accent];

              return (
                <div
                  key={section.id}
                  className={cn(
                    'group rounded-[28px] border bg-white/[0.03] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.04]',
                    accent.sectionBorder,
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', accent.badge)}>
                        {section.items.length} модулів
                      </div>
                      <h3 className="mt-3 text-lg font-black text-white">{section.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{section.description}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {section.items.slice(0, 4).map((item) => (
                      <Link
                        key={item.id}
                        to={item.path}
                        className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm text-slate-200 transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{item.label}</div>
                          <div className="mt-1 truncate text-xs text-slate-500">{item.description}</div>
                        </div>
                        <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-slate-500" />
                      </Link>
                    ))}
                  </div>

                  {section.items.length > 4 && (
                    <div className="mt-4 text-xs text-slate-500">
                      Ще {section.items.length - 4} підрозділів доступно всередині секції.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <h2 className="text-xl font-black tracking-tight text-white">Критичні сигнали</h2>
            <p className="mt-1 text-sm text-slate-400">
              Останні підтверджені алерти з головного дашборду. Нульовий список означає, що бекенд не віддав дані.
            </p>

            <div className="mt-5 space-y-3">
              {loading && (
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-5 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Завантаження поточних алертів...
                </div>
              )}

              {!loading && topAlerts.length === 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-5 text-sm text-slate-400">
                  Підтверджених алертів зараз немає або бекенд не відповів.
                </div>
              )}

              {topAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{alert.message}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {alert.company || 'Невказана компанія'} • {alert.sector || 'Невизначений сектор'}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]',
                        alert.severity === 'critical'
                          ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                          : alert.severity === 'warning'
                          ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                          : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
                      )}
                    >
                      {alert.severity === 'critical'
                        ? 'Критично'
                        : alert.severity === 'warning'
                        ? 'Увага'
                        : 'Інфо'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{timeAgo(alert.timestamp)}</span>
                    <span>{formatCurrency(alert.value || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <h2 className="text-xl font-black tracking-tight text-white">Пояснення режиму</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
              <p>
                Домашній екран більше не показує демо-продажі чи синтетичні фінансові картки. Усі верхні
                показники беруться з `dashboard/overview`.
              </p>
              <p>
                Якщо інтерфейс не має підтвердженого зʼєднання, він показує стан недоступності замість
                вигаданих цифр. Це критично для довіри до аналітики.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PredatorV24;
