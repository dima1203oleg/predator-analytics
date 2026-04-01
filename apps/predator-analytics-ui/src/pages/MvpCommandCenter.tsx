import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BadgePercent,
  BrainCircuit,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Database,
  FileCheck2,
  Figma,
  Layers3,
  PlayCircle,
  Radar,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  Upload,
  WalletCards,
  Workflow,
} from 'lucide-react';
import { getVisibleNavigation, navAccentStyles } from '@/config/navigation';
import { getRoleDisplayName } from '@/config/roles';
import { useUser } from '@/context/UserContext';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';
import { FigmaDesignBridge } from '@/components/design/FigmaDesignBridge';

const tierLabels: Record<'basic' | 'pro' | 'enterprise', string> = {
  basic: 'Базовий',
  pro: 'Про',
  enterprise: 'Корпоративний',
};

const dataStrategyItems = [
  {
    icon: Database,
    title: 'Критичні джерела',
    description: 'Митні декларації та санкційні списки оновлюються щодня з обовʼязковою валідацією.',
    badge: 'Щодня',
  },
  {
    icon: RefreshCw,
    title: 'Вторинні джерела',
    description: 'Комерційні бази імпорту та логістичні тарифи оновлюються щотижня.',
    badge: 'Щотижня',
  },
  {
    icon: FileCheck2,
    title: 'Валідація економії',
    description: 'Кожен результат містить confidence score, припущення та юридичне застереження.',
    badge: 'Довіра',
  },
  {
    icon: Scale,
    title: 'Fallback-режим',
    description: 'При неповних даних показується діапазон економії замість неточної цифри.',
    badge: 'Діапазон',
  },
];

const executionStates = [
  { id: 'queued', label: 'queued', text: 'Черга очікування', tone: 'border-slate-400/20 bg-slate-500/10 text-slate-200' },
  { id: 'running', label: 'running', text: 'Виконується', tone: 'border-amber-400/20 bg-amber-500/10 text-amber-200' },
  { id: 'success', label: 'success', text: 'Успішно завершено', tone: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' },
  { id: 'failed', label: 'failed', text: 'Потрібна увага', tone: 'border-rose-400/20 bg-rose-500/10 text-rose-200' },
  { id: 'partial', label: 'partial', text: 'Частковий результат', tone: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200' },
];

const monetizationCards = [
  {
    icon: WalletCards,
    title: 'Підписка',
    description: 'Базовий, Про та Корпоративний плани з лімітами запусків і різною глибиною функцій.',
  },
  {
    icon: BadgePercent,
    title: '% від економії',
    description: 'Комісія після підтвердження угоди через інвойс, ERP або ручну верифікацію.',
  },
  {
    icon: CreditCard,
    title: 'Оплата за дію',
    description: 'Фіксована вартість за глибокий аудит контрагента чи складний агентний запуск.',
  },
];

const lifecycleSteps = [
  'Demo',
  'First result',
  'Save scenario',
  'Subscribe',
  'Automate',
  'Scale',
];

const designPrinciples = [
  {
    label: 'Полотно',
    value: 'Темний космічний фон',
    description: 'Канвас і поверхні в Figma узгоджені з токенами з tokens.css.',
  },
  {
    label: 'Акцент',
    value: 'Емеральд + Cyan',
    description: 'Ключові CTA та стани підкреслюють сценарії з грошовим ефектом.',
  },
  {
    label: 'Геометрія',
    value: '24 / 28 / 32 px',
    description: 'Радіуси підтримують відчуття преміального панелювання без шуму.',
  },
  {
    label: 'Типографіка',
    value: 'Inter + JetBrains Mono',
    description: 'Ділова читабельність для рішень та технічна точність для чисел.',
  },
];

const explainabilityFactors = [
  'Ціна постачальника на 20% нижча за ринкову медіану.',
  'Ризик контрагента низький за санкціями, репутацією та історією поставок.',
  'Частота імпорту та доступність маршруту стабільні протягом останніх 6 місяців.',
];

const entryActions = [
  {
    to: '/procurement-optimizer',
    title: 'Зекономити на закупівлях',
    description: 'Запустити ключовий сценарій для імпортера і отримати екран цінності з сумою економії.',
    icon: TrendingDown,
    badge: 'MVP',
  },
  {
    to: '/scenario/counterparty',
    title: 'Перевірити контрагента',
    description: 'Оцінити санкції, репутацію та фактори ризику перед угодою.',
    icon: ShieldCheck,
    badge: '1 клік',
  },
  {
    to: '/scenario/market',
    title: 'Працювати на ринку',
    description: 'Дослідити цінові сигнали, маршрути та нових постачальників без власних даних.',
    icon: Radar,
    badge: 'Ринок',
  },
  {
    to: '/scenario-progress',
    title: 'Центр виконання',
    description: 'Подивитися статуси job-based запусків і результати сценаріїв для бізнес-користувача.',
    icon: Workflow,
    badge: 'Черги',
  },
];

const MvpCommandCenter: React.FC = () => {
  const { user, canonicalRole, canonicalTier } = useUser();
  const backendStatus = useBackendStatus();

  const sections = useMemo(
    () => getVisibleNavigation(canonicalRole, canonicalTier).filter((section) => !section.isGlobal),
    [canonicalRole, canonicalTier],
  );

  const sectionCards = sections.slice(0, 6);

  return (
    <div className="space-y-8 text-slate-100">
      <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(2,12,20,0.96),rgba(7,18,32,0.96))] p-6 shadow-[0_28px_90px_rgba(2,6,23,0.42)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.15),transparent_28%)]" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200">
                ТЗ 11.1 • MVP
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Роль: {getRoleDisplayName(canonicalRole)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Тариф: {tierLabels[canonicalTier]}
              </span>
            </div>

            <h1 className="max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl">
              Командний центр для швидкого виходу на перший результат за 3 хвилини.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Інтерфейс переведено в outcome-first режим: головний сценарій для MVP тепер будується
              навколо оптимізації закупівель імпортера, екрану цінності, демо-режиму, центру виконання
              та прозорої монетизації.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/procurement-optimizer"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                <PlayCircle className="h-4 w-4" />
                Запустити ключовий сценарій
              </Link>
              <Link
                to="/getting-started"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Швидкий старт і демо-режим
              </Link>
              <Link
                to="/billing"
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
              >
                <CreditCard className="h-4 w-4" />
                Перевірити тариф і білінг
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">ICP</div>
                <div className="mt-2 text-lg font-bold text-white">Імпортери &gt; $1M</div>
                <div className="mt-1 text-sm text-slate-400">Фокус на українських компаніях із регулярними закупівлями.</div>
              </div>
              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Тригер</div>
                <div className="mt-2 text-lg font-bold text-white">“Зекономимо X грн за 1 день”</div>
                <div className="mt-1 text-sm text-slate-400">Комунікація будується на конкретній сумі економії.</div>
              </div>
              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Режим даних</div>
                <div className={cn('mt-2 text-lg font-bold', backendStatus.isOffline ? 'text-rose-200' : 'text-emerald-200')}>
                  {backendStatus.statusLabel}
                </div>
                <div className="mt-1 text-sm text-slate-400">{backendStatus.sourceLabel}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-emerald-400/18 bg-[linear-gradient(180deg,rgba(6,20,29,0.92),rgba(5,15,24,0.92))] p-5 shadow-[0_24px_70px_rgba(16,185,129,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300/80">Екран цінності</div>
                <h2 className="mt-2 text-2xl font-black text-white">Потенційна економія 250 000 ₴</h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
                confidence 78%
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Постачальник</div>
                <div className="mt-2 text-lg font-semibold text-white">Guangzhou PowerTech Ltd</div>
                <div className="mt-1 text-sm text-slate-400">Китай • низький ризик • $850 / од.</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Оптимальний код</div>
                <div className="mt-2 text-lg font-semibold text-white">8504.40.30</div>
                <div className="mt-1 text-sm text-slate-400">Митний тариф 10% • маршрут морем 25-30 днів</div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <BrainCircuit className="h-4 w-4 text-cyan-300" />
                Чому ця рекомендація?
              </div>
              <div className="mt-3 space-y-2">
                {explainabilityFactors.map((factor) => (
                  <div key={factor} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
                    {factor}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
              Оцінка на основі історичних даних. Фактичний результат може відрізнятися залежно
              від курсу валют, обсягу партії та умов конкретної угоди.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {entryActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/18 hover:bg-white/[0.05]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/20">
                <action.icon className="h-5 w-5 text-emerald-300" />
              </div>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                {action.badge}
              </span>
            </div>
            <div className="mt-4 text-lg font-black text-white">{action.title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">{action.description}</div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">
              Відкрити
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.9fr)]">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">Фундаментальні підсистеми MVP</h2>
              <p className="mt-1 text-sm text-slate-400">
                Data Strategy, Validation of Savings, Access Model, Performance, Explainability та Empty State.
              </p>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
              Phase 1
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {dataStrategyItems.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10">
                    <item.icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                    {item.badge}
                  </span>
                </div>
                <div className="mt-4 text-lg font-bold text-white">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-400">{item.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-black text-white">Execution Model</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Кожен запуск сценарію зберігається як окремий job з унікальним ID, історією та бізнес-результатом.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {executionStates.map((state) => (
                <span
                  key={state.id}
                  className={cn('rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em]', state.tone)}
                >
                  {state.label}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              {executionStates.map((state) => (
                <div key={state.id} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>{state.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <h2 className="text-xl font-black text-white">Доступ = роль ∩ тариф</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Навігація та маршрути тепер узгоджені з перетином ролі користувача і тарифного плану.
            </p>
            <Link
              to="/billing"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
            >
              Керувати доступом і тарифом
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <Figma className="h-5 w-5 text-cyan-300" />
            <h2 className="text-xl font-black text-white">Дизайн-система з Figma</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Ключова візуальна логіка зберігається в канонічних токенах і синхронізується з макетом, щоб shell, сторінки та цільові сценарії виглядали як один продукт.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {designPrinciples.map((principle) => (
              <div key={principle.label} className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{principle.label}</div>
                <div className="mt-2 text-lg font-black text-white">{principle.value}</div>
                <div className="mt-1 text-sm leading-6 text-slate-400">{principle.description}</div>
              </div>
            ))}
          </div>
        </div>

        <FigmaDesignBridge className="h-full" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">Навігаційна архітектура</h2>
              <p className="mt-1 text-sm text-slate-400">
                Шість кореневих розділів плюс глобальний шар. Тут видно, що shell уже працює в новій структурі.
              </p>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
              {sectionCards.length} секцій
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {sectionCards.map((section) => {
              const accent = navAccentStyles[section.accent];
              const groupItems = section.groups?.reduce((total, group) => total + group.items.length, 0) ?? 0;
              const totalItems = section.items.length + groupItems;

              return (
                <div
                  key={section.id}
                  className={cn(
                    'rounded-[24px] border bg-black/20 p-4 transition-colors hover:bg-white/[0.04]',
                    accent.sectionBorder,
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]', accent.badge)}>
                      {totalItems} модулів
                    </div>
                    <div className={cn('h-2.5 w-2.5 rounded-full', accent.dot)} />
                  </div>
                  <div className="mt-3 text-lg font-black text-white">{section.label}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">{section.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-amber-300" />
              <h2 className="text-xl font-black text-white">Монетизація</h2>
            </div>
            <div className="mt-4 space-y-3">
              {monetizationCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10">
                      <card.icon className="h-4 w-4 text-amber-300" />
                    </div>
                    <div className="text-base font-bold text-white">{card.title}</div>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">{card.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-violet-300" />
              <h2 className="text-xl font-black text-white">Customer Lifecycle</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {lifecycleSteps.map((step, index) => (
                <div key={step} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-slate-300">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-black text-violet-200">
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-cyan-300" />
            <h2 className="text-xl font-black text-white">Aha Moment ≤ 3 хв</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Стартовий потік зведено до демо-режиму, швидкого запуску сценарію і видимого екрану цінності без довгого навчання.
          </p>
        </div>
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-black text-white">Empty State UX</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Якщо власних даних немає, користувач бачить чіткий вибір: завантажити свої дані або працювати на ринку.
          </p>
        </div>
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-amber-300" />
            <h2 className="text-xl font-black text-white">Go-To-Market</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Прямі B2B-продажі та партнерська мережа навколо митних брокерів і консалтингу з упором на вимірювану економію.
          </p>
        </div>
      </section>
    </div>
  );
};

export default MvpCommandCenter;
