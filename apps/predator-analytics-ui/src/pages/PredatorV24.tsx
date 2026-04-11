import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  Database,
  Layers3,
  Loader2,
  Network,
  Radio,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { dashboardApi, type DashboardOverview } from '@/services/api/dashboard';
import { MorningBriefing, type BriefingItem } from '@/components/shared/MorningBriefing';
import { ConstitutionalShield } from '@/components/shared/ConstitutionalShield';
import {
  getRecommendedNavigation,
  getVisibleNavigation,
  navAccentStyles,
} from '@/config/navigation';
import { useUser } from '@/context/UserContext';
import { useCommandCenterRoi } from '@/hooks/useCommandCenterRoi';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';

/* ── Утиліти форматування ── */
const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)} млрд`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)} млн`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)} тис`;
  return `$${value.toLocaleString('uk-UA')}`;
};

const formatNumber = (value: number): string => value.toLocaleString('uk-UA');

const timeAgo = (timestamp?: string): string => {
  if (!timestamp) return 'Немає підтвердженої синхронізації';
  const diff = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diff) || diff < 0) return 'Щойно синхронізовано';
  if (diff < 60_000) return 'Щойно синхронізовано';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} хв тому`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} год тому`;
  return `${Math.floor(diff / 86_400_000)} дн тому`;
};

// --- MOCK DATA FALLBACK (v56.1.4-ELITE) ---
const MOCK_OVERVIEW: DashboardOverview = {
  summary: {
    total_declarations: 4218932,
    total_value_usd: 12450000000,
    high_risk_count: 142,
    medium_risk_count: 854,
    import_count: 2843102,
    export_count: 1375830,
    graph_nodes: 154200,
    graph_edges: 892100,
    search_documents: 14205000,
    vectors: 14205000,
    active_pipelines: 12,
    completed_pipelines: 4580,
  },
  radar: [],
  top_risk_companies: [],
  alerts: [
    { id: 'a1', type: 'risk', message: 'Аномальна активність у секторі паливно-мастильних матеріалів', severity: 'critical', timestamp: new Date().toISOString(), sector: 'Паливо', company: 'ТОВ "ЕНЕРДЖИ-ГРУП"', value: 45000000 },
    { id: 'a2', type: 'market', message: 'Різке зростання імпорту електроніки з нових коридорів', severity: 'warning', timestamp: new Date().toISOString(), sector: 'Електроніка', company: 'Global Tech LLC', value: 12000000 },
    { id: 'a3', type: 'info', message: 'Планове оновлення бази знань ШІ завершено успішно', severity: 'info', timestamp: new Date().toISOString(), sector: 'Система', company: 'PREDATOR AI', value: 0 },
  ],
  categories: {},
  countries: {},
  customs_offices: { '1': { count: 1, value: 100, highRisk: 0 }, '2': { count: 1, value: 100, highRisk: 0 } },
  infrastructure: { 'os': { status: 'optimal' }, 'db': { status: 'optimal' } },
  engines: {},
  generated_at: new Date().toISOString(),
};

/* ── Анімаційні варіанти ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

/* ── Палітра тонів для статистичних карток ── */
const toneStyles = {
  emerald: {
    iconBg: 'bg-emerald-500/10 border-emerald-400/20',
    iconColor: 'text-emerald-400',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    accentLine: 'from-emerald-500 via-emerald-400 to-teal-400',
    badge: 'badge-emerald',
  },
  cyan: {
    iconBg: 'bg-cyan-500/10 border-cyan-400/20',
    iconColor: 'text-cyan-400',
    glowColor: 'rgba(6, 182, 212, 0.15)',
    accentLine: 'from-cyan-500 via-cyan-400 to-sky-400',
    badge: 'badge-cyan',
  },
  rose: {
    iconBg: 'bg-rose-500/10 border-rose-400/20',
    iconColor: 'text-rose-400',
    glowColor: 'rgba(244, 63, 94, 0.15)',
    accentLine: 'from-rose-500 via-rose-400 to-pink-400',
    badge: 'badge-rose',
  },
  amber: {
    iconBg: 'bg-amber-500/10 border-amber-400/20',
    iconColor: 'text-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    accentLine: 'from-amber-500 via-amber-400 to-yellow-400',
    badge: 'badge-amber',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10 border-indigo-400/20',
    iconColor: 'text-indigo-400',
    glowColor: 'rgba(99, 102, 241, 0.15)',
    accentLine: 'from-indigo-500 via-indigo-400 to-violet-400',
    badge: 'badge-indigo',
  },
} as const;

/* ══════════════════════════════════════════════════════════════════════════════
   PREDATOR V24 — Головний Командний Дашборд
   v56: Преміальний дизайн з ambient glow, анімованими картками,
   живими індикаторами статусу та інтерактивними hover-станами.
   ══════════════════════════════════════════════════════════════════════════════ */
const PredatorV24 = () => {
  const { user } = useUser();
  const backendStatus = useBackendStatus();
  const currentRole = user?.role ?? 'viewer';
  const navigationSections = useMemo(() => getVisibleNavigation(currentRole), [currentRole]);
  const recommendedNavigation = useMemo(() => getRecommendedNavigation(currentRole, 4), [currentRole]);

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBriefing, setShowBriefing] = useState(true);

  // Завантажуємо реальні дані з бекенду замість хардкоду
  const briefingItems: BriefingItem[] = useMemo(() => {
    if (!overview?.alerts || overview.alerts.length === 0) return [];
    
    return overview.alerts.slice(0, 3).map((alert) => {
      let type: 'market' | 'risk' | 'insight' = 'insight';
      if (alert.severity === 'critical') type = 'risk';
      if (alert.sector) type = 'market';
      
      const impact = alert.value && alert.value > 0 ? formatCurrency(alert.value) : undefined;
      const trend = alert.severity === 'critical' ? 'down' : 'up';

      return {
        id: alert.id,
        type,
        title: `Сигнал: ${alert.company || alert.sector || 'Системний'}`,
        description: alert.message,
        impact,
        trend
      };
    });
  }, [overview]);

  useEffect(() => {
    let isMounted = true;
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardApi.getOverview();
        if (isMounted) setOverview(response);
      } catch (fetchError) {
        if (isMounted) {
          console.warn('[PredatorV24] API недоступний, активовано автономний режим (MOCK):', fetchError);
          setOverview(MOCK_OVERVIEW);
          setError('Працює в режимі автономної симуляції. Підключення до Core API відсутнє.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchOverview();
    return () => { isMounted = false; };
  }, []);

  const summary = overview?.summary;
  const { roiStats, onboardingSteps } = useCommandCenterRoi(summary ?? null);
  const navigationItems = useMemo(
    () =>
      navigationSections.flatMap((section) =>
        (section.items || []).map((item) => ({
          ...item,
          accent: section.accent,
          sectionLabel: section.label,
        })),
      ),
    [navigationSections],
  );

  const operationalStats = [
    { label: 'Декларації', value: summary ? formatNumber(summary.total_declarations) : '—', hint: 'Підтверджені записи', icon: Activity, tone: 'emerald' as const },
    { label: 'Обсяг операцій', value: summary ? formatCurrency(summary.total_value_usd) : '—', hint: 'Сумарна вартість', icon: TrendingUp, tone: 'cyan' as const },
    { label: 'Ризикові сигнали', value: summary ? formatNumber(summary.high_risk_count) : '—', hint: 'Критичний рівень', icon: AlertTriangle, tone: 'rose' as const },
    { label: 'Активні пайплайни', value: summary ? formatNumber(summary.active_pipelines) : '—', hint: 'Поточна обробка', icon: Layers3, tone: 'amber' as const },
  ];

  const topAlerts = overview?.alerts?.slice(0, 4) ?? [];
  const quickLinks = useMemo(() => {
    if (recommendedNavigation.length >= 4) return recommendedNavigation;
    const preferredPaths = ['/overview', '/market', '/diligence', '/search'];
    const selected = preferredPaths
      .map((path) => navigationItems.find((item) => item.path === path))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (selected.length >= 4) return selected;
    const fallback = navigationItems.filter(
      (item) => item.path !== '/' && !selected.some((s) => s.id === item.id),
    );
    return [...selected, ...fallback].slice(0, 4);
  }, [navigationItems, recommendedNavigation]);

  const coverageStats = useMemo(
    () => [
      { label: 'Граф зв\'язків', value: summary ? formatNumber(summary.graph_nodes) : '—', hint: summary ? `${formatNumber(summary.graph_edges)} зв'язків` : 'Очікує синхронізацію', icon: Network, tone: 'indigo' as const },
      { label: 'Пошуковий індекс', value: summary ? formatNumber(summary.search_documents) : '—', hint: summary ? `${formatNumber(summary.vectors)} векторів` : 'Очікує синхронізацію', icon: Search, tone: 'cyan' as const },
      { label: 'Митниці', value: overview ? formatNumber(Object.keys(overview.customs_offices || {}).length) : '—', hint: 'Активні офіси', icon: ShieldCheck, tone: 'emerald' as const },
      { label: 'Інфраструктура', value: overview ? formatNumber(Object.keys(overview.infrastructure || {}).length) : '—', hint: 'Підключені сервіси', icon: Database, tone: 'amber' as const },
    ],
    [overview, summary],
  );

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {showBriefing && (
        <MorningBriefing
          userName={user?.name?.split(' ')[0]}
          items={briefingItems}
          onAction={(id) => console.log('Briefing action:', id)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
         СЕКЦІЯ 1: HERO — Головний банер з KPI та ambient glow
         ══════════════════════════════════════════════════════════════ */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[40px] border border-white/[0.08] bg-[#03080f] p-8 shadow-[0_45px_100px_rgba(0,0,0,0.6)] sm:p-10"
      >
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none transform -rotate-6">
          <Brain size={240} strokeWidth={0.5} className="text-emerald-400" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

        <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:justify-between relative z-10">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="badge-v2 badge-v2-emerald text-[10px] font-black tracking-[0.2em]">
                <span className="relative z-10">PREDATOR v56.1.4 | КОМАНДНИЙ ЦЕНТР</span>
                <div className="badge-v2-glimmer" />
              </div>
              <div className={cn(
                "badge-v2 px-4 font-black uppercase tracking-[0.15em]",
                backendStatus.isOffline ? "badge-v2-rose" : "badge-v2-cyan"
              )}>
                {backendStatus.statusLabel}
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
                Інтерфейс, який показує <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">де заробити</span>, 
                що зекономити і який ризик зняти першим.
              </h1>
              <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-300 drop-shadow-sm [text-wrap:balance]">
                Домашній екран зібраний навколо шести бізнес-блоків під безпрецедентним захистом <span className="text-emerald-400 font-bold border-b border-emerald-400/30">Constitutional Shield</span>. 
                Він відсікає технічний шум та підсвічує чистий стратегічний ROI.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 xl:w-[680px]">
            <div className="card-depth group rounded-[32px] border border-white/[0.12] bg-[#02060d]/60 backdrop-blur-3xl p-6 transition-all hover:bg-[#02060d]/80 shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-emerald-400 transition-colors">OSINT-ВУЗОЛ</span>
              </div>
              <div className="text-lg font-black text-white tracking-widest uppercase">СУВЕРЕННИЙ АПЕКС v56</div>
              <div className="text-[9px] text-slate-500 mt-2 font-mono uppercase tracking-widest bg-white/5 inline-block px-2 py-1 rounded-md">Синхронізовано</div>
            </div>

            <div className="card-depth group rounded-[32px] border border-white/[0.12] bg-[#02060d]/60 backdrop-blur-3xl p-6 transition-all hover:bg-[#02060d]/80 shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_0_40px_rgba(34,211,238,0.15)] hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-cyan-400 transition-colors">ЛАГ ДАНИХ</span>
              </div>
              <div className="text-lg font-black text-white tracking-widest">{timeAgo(overview?.generated_at)}</div>
              <div className="text-[9px] text-cyan-400/50 mt-2 font-mono uppercase tracking-widest bg-cyan-500/10 inline-block px-2 py-1 rounded-md">ВУЗОЛ L4 | ШИФРОВАНО</div>
            </div>

            <div className="card-depth rounded-[32px] border border-amber-400/20 bg-amber-500/[0.05] backdrop-blur-3xl p-6 shadow-[inset_0_0_30px_rgba(251,191,36,0.1)] col-span-2 sm:col-span-1 flex flex-col justify-between hover:border-amber-400/40 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/80">ВЕРИФІКАЦІЯ</span>
                </div>
                <div className="text-lg font-black text-amber-400 tracking-widest uppercase leading-none">СЕРТИФІКОВАНО</div>
              </div>
              <div className="text-[9px] text-amber-500/60 mt-3 font-mono tracking-widest uppercase bg-amber-500/10 inline-block px-2 py-1 rounded-md w-max">PREDATOR МАЙСТЕР</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid gap-8 xl:grid-cols-[1fr_380px] xl:items-start">
          <div className="max-w-4xl">

              {/* ── ROI KPI Картки ── */}
              <motion.div
                className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                variants={containerVariants}
              >
                {roiStats.map((stat, index) => {
                  const tone = toneStyles[stat.tone as keyof typeof toneStyles] ?? toneStyles.indigo;
                  const isEmerald = stat.tone === 'emerald';
                  const isCyan = stat.tone === 'cyan';
                  const isAmber = stat.tone === 'amber';
                  
                  return (
                    <motion.div
                      key={stat.label}
                      variants={cardVariants}
                      className="group stat-card-v2 relative overflow-hidden rounded-[32px] border border-white/[0.05] bg-[#050b14]/40 p-6 shadow-2xl transition-all duration-500 hover:border-white/20"
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                        isEmerald && "bg-gradient-to-br from-emerald-500/[0.03] to-transparent",
                        isCyan && "bg-gradient-to-br from-cyan-500/[0.03] to-transparent",
                        isAmber && "bg-gradient-to-br from-amber-500/[0.03] to-transparent"
                      )} />

                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:scale-110 shadow-lg', 
                            tone.iconBg
                          )}>
                            <stat.icon className={cn('h-5 w-5', tone.iconColor)} />
                          </div>
                          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 group-hover:text-white/60 transition-colors duration-300">
                            {stat.label}
                          </div>
                          <div className="text-3xl font-black tracking-tight text-white drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-500 origin-left">
                            {stat.value}
                          </div>
                          <div className="text-[10px] font-medium text-slate-500/80 group-hover:text-slate-400 transition-colors uppercase tracking-wider">
                            {stat.hint}
                          </div>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r",
                        tone.accentLine
                      )} />
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* ── Operational mini-stats ── */}
              <div className="mt-4 flex flex-wrap gap-2">
                {operationalStats.map((stat) => {
                  const tone = toneStyles[stat.tone] ?? toneStyles.indigo;
                  return (
                    <div
                      key={stat.label}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-slate-300 backdrop-blur-sm transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
                    >
                      <stat.icon className={cn('h-3.5 w-3.5', tone.iconColor)} />
                      <span className="font-semibold text-white">{stat.value}</span>
                      <span className="text-slate-500">{stat.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* ── Onboarding — Перший ROI ── */}
              <motion.div
                className="mt-8 rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-5"
                variants={itemVariants}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Перший ROI за 10 хвилин</span>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {onboardingSteps.map((step, index) => (
                    <Link
                      key={step.id}
                      to={step.path}
                      className="group relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-black/20 px-4 py-4 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] text-[10px] font-bold text-white">
                            {index + 1}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Крок</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-white">{step.label}</div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-white" />
                        </div>
                        <div className="mt-2 text-xs leading-5 text-slate-400/80">{step.detail}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── Sidebar panel: Рекомендації ── */}
            <motion.div
              variants={itemVariants}
              className="card-depth p-5"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Наступний крок</span>
              </div>
              <h2 className="mt-3 text-xl font-black tracking-tight text-white">Що система радить зараз</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400/80">
                Рекомендовані маршрути підібрані під роль та поведінку, щоб швидше дійти до бізнес-ефекту.
              </p>

              <div className="mt-5 space-y-2">
                {quickLinks.map((item, i) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="group flex items-center justify-between rounded-[18px] border border-white/[0.06] bg-black/20 px-4 py-3.5 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{item.sectionLabel}</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                  </Link>
                ))}
              </div>

              <hr className="divider-gradient my-5" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Рольова адаптація</span>
                  <span className="text-slate-500">{currentRole === 'admin' ? 'Повний контур' : 'Бізнес-контур'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Командний пошук</span>
                  <kbd className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-slate-400">⌘K</kbd>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Синхронізація</span>
                  <span className="text-slate-500">{timeAgo(overview?.generated_at)}</span>
                </div>
              </div>
            </motion.div>
        </div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mx-6 mb-6 rounded-[20px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100 backdrop-blur-sm"
          >
            <AlertTriangle className="mr-2 inline-block h-4 w-4" />
            {error}
          </motion.div>
        )}
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════
         СЕКЦІЯ 2: Бізнес-блоки + Критичні сигнали
         ══════════════════════════════════════════════════════════════ */}
      <motion.section
        variants={containerVariants}
        className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(340px,0.9fr)]"
      >
        {/* ── Лівий стовпець: 6 бізнес-блоків ── */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="section-header-v2">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">6 бізнес-блоків</h2>
              <p className="mt-1 text-sm text-slate-400/80">
                Навігація зведена до шести верхніх блоків. Модулі зібрані в логічні групи.
              </p>
            </div>
            <div className="badge-v2 badge-indigo">
              <Layers3 className="h-3 w-3" />
              {navigationSections.reduce((t, s) => t + (s.items?.length || 0), 0)} модулів
            </div>
          </div>

          <motion.div
            className="grid gap-4 lg:grid-cols-2"
            variants={containerVariants}
          >
            {navigationSections.map((section, sIdx) => {
              const accent = navAccentStyles[section.accent];
              return (
                <motion.div
                  key={section.id}
                  variants={cardVariants}
                  className="card-depth group p-5"
                  whileHover={{ y: -4 }}
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', accent.badge)}>
                          {(section.items || []).length} модулів
                        </div>
                        <h3 className="mt-3 text-lg font-black text-white">{section.label}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-400/80">{section.description}</p>
                        <p className={cn('mt-2 text-sm leading-6', accent.softText)}>{section.outcome}</p>
                      </div>
                    </div>

                    {/* Теги груп */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {(section.groups ?? []).slice(0, 4).map((group) => (
                        <span
                          key={group.title}
                          className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-slate-400"
                        >
                          {group.title}
                        </span>
                      ))}
                    </div>

                    {/* Список модулів */}
                    <div className="mt-5 space-y-1.5">
                      {(section.items || []).slice(0, 4).map((item) => (
                        <Link
                          key={item.id}
                          to={item.path}
                          className="flex items-center justify-between rounded-2xl border border-white/[0.04] bg-black/20 px-4 py-3 text-sm text-slate-200 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{item.label}</div>
                            <div className="mt-0.5 truncate text-[11px] text-slate-500">{item.description}</div>
                          </div>
                          <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:text-slate-400" />
                        </Link>
                      ))}
                    </div>

                    {(section.items || []).length > 4 && (
                      <div className="mt-4 text-xs text-slate-500">
                        Ще {(section.items || []).length - 4} модулів доступно всередині секції.
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* ── Правий стовпець: Алерти + Покриття ── */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Критичні сигнали */}
          <div className="card-depth p-5">
            <div className="section-header-v2 mb-4 border-b-0 pb-0">
              <div>
                <h2 className="text-lg font-black tracking-tight text-white">Критичні сигнали</h2>
                <p className="mt-1 text-xs text-slate-400/80">
                  Алерти, що впливають на гроші, ризик або репутацію.
                </p>
              </div>
              <div className="badge-v2 badge-rose">
                <AlertTriangle className="h-3 w-3" />
                {topAlerts.length}
              </div>
            </div>

            <div className="space-y-2">
              {loading && (
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-5 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Завантаження алертів...
                </div>
              )}

              {!loading && topAlerts.length === 0 && (
                <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-5 text-sm text-slate-400">
                  Підтверджених алертів зараз немає.
                </div>
              )}

              {topAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  className="group rounded-[18px] border border-white/[0.06] bg-black/20 px-4 py-3.5 transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.02]"
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{alert.message}</div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {alert.company || 'Невказана компанія'} • {alert.sector || 'Невизначений сектор'}
                      </div>
                    </div>
                    <span className={cn(
                      'badge-v2 shrink-0',
                      alert.severity === 'critical' ? 'badge-rose'
                        : alert.severity === 'warning' ? 'badge-amber'
                        : 'badge-cyan',
                    )}>
                      {alert.severity === 'critical' ? 'Критично'
                        : alert.severity === 'warning' ? 'Увага'
                        : 'Інфо'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{timeAgo(alert.timestamp)}</span>
                    <span className="font-semibold text-slate-400">{formatCurrency(alert.value || 0)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Покриття даних */}
          <div className="card-depth p-5">
            <div className="section-header-v2 mb-4 border-b-0 pb-0">
              <div>
                <h2 className="text-lg font-black tracking-tight text-white">Покриття даних</h2>
                <p className="mt-1 text-xs text-slate-400/80">
                  Реальний стан пластів даних у системі.
                </p>
              </div>
              <div className="badge-v2 badge-emerald">
                <Database className="h-3 w-3" />
                Онлайн
              </div>
            </div>

            <div className="space-y-2">
              {coverageStats.map((stat) => {
                const tone = toneStyles[stat.tone] ?? toneStyles.indigo;
                return (
                  <div
                    key={stat.label}
                    className="group flex items-center justify-between gap-3 rounded-[18px] border border-white/[0.06] bg-black/20 px-4 py-3.5 transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.02]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', tone.iconBg)}>
                        <stat.icon className={cn('h-4 w-4', tone.iconColor)} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">{stat.label}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{stat.hint}</div>
                      </div>
                    </div>
                    <div className="text-right text-lg font-black tracking-tight text-white">{stat.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.section>

      <ConstitutionalShield />
    </motion.div>
  );
};

export default PredatorV24;
