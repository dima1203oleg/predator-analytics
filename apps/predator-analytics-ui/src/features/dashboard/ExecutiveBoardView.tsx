/**
 * 🦅 PREDATOR v58.2 — EXECUTIVE BOARD (WRAITH CORE)
 * Головна панель CEO: � изики, Гроші, Стратегія — за 3 секунди.
 * 
 * � озділ I.1 — Командний Центр
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

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
  Building2,
  Database,
  DollarSign,
  Eye,
  Flame,
  Globe,
  Layers3,
  Loader2,
  Lock,
  Network,
  Radar,
  Search,
  Shield,
  ShieldCheck,
  Ship,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { dashboardApi, type DashboardOverview } from '@/services/api/dashboard';
import { getVisibleNavigation, navAccentStyles } from '@/config/navigation';
import { useUser } from '@/context/UserContext';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useDashboardOverview, useDashboardAlerts } from '@/hooks/useDashboard';
import { cn } from '@/utils/cn';

/* ── Утиліти форматування ── */
const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)} млрд`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)} млн`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)} тис`;
  return `$${value.toLocaleString('uk-UA')}`;
};

const formatNumber = (value: number): string => value.toLocaleString('uk-UA');

const timeAgo = (timestamp?: string): string => {
  if (!timestamp) return 'Немає синхронізації';
  const diff = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diff) || diff < 0) return 'Щойно';
  if (diff < 60_000) return 'Щойно';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} хв тому`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} год тому`;
  return `${Math.floor(diff / 86_400_000)} дн тому`;
};


/* ── Анімації ── */
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } },
};
const scaleIn = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } },
};

/* ── Кольорова палітра ── */
const tones = {
  rose: { bg: 'bg-rose-500/8 border-rose-400/15', icon: 'text-rose-500', glow: 'group-hover:shadow-[0_0_40px_rgba(225,29,72,0.15)]', line: 'from-rose-600 to-rose-400' },
  crimson: { bg: 'bg-rose-600/8 border-rose-500/15', icon: 'text-rose-600', glow: 'group-hover:shadow-[0_0_40px_rgba(190,18,60,0.15)]', line: 'from-rose-700 to-rose-500' },
  pink: { bg: 'bg-rose-400/8 border-rose-300/15', icon: 'text-rose-400', glow: 'group-hover:shadow-[0_0_40px_rgba(244,63,94,0.15)]', line: 'from-rose-500 to-rose-300' },
  warm: { bg: 'bg-rose-500/10 border-rose-500/20', icon: 'text-rose-400', glow: 'group-hover:shadow-[0_0_40px_rgba(225,29,72,0.12)]', line: 'from-rose-600 to-rose-400' },
} as const;

/* ══════════════════════════════════════════════════════════════
   EXECUTIVE BOARD VIEW — Головний Командний Дашборд CEO
   ══════════════════════════════════════════════════════════════ */
export default function ExecutiveBoardView() {
  const { user } = useUser();
  const backendStatus = useBackendStatus();
  const currentRole = user?.role ?? 'viewer';
  const navigationSections = useMemo(() => getVisibleNavigation(currentRole), [currentRole]);

  // � еактивні дані через TanStack Query
  const { data: overview, isLoading: isOverviewLoading } = useDashboardOverview();
  const { data: alertsData, isLoading: isAlertsLoading } = useDashboardAlerts(4);

  const s = overview?.summary;
  const alerts = alertsData?.items ?? [];
  const loading = isOverviewLoading || isAlertsLoading;

  /* ── 4 головні KPI ── */
  const kpis = useMemo(() => [
    { label: 'Обсяг операцій', value: s ? formatCurrency(s.total_value_usd) : '—', hint: 'Загальна вартість ЗЕД', icon: DollarSign, tone: 'rose' as const },
    { label: 'Декларації', value: s ? formatNumber(s.total_declarations) : '—', hint: 'Підтверджених записів', icon: Activity, tone: 'warm' as const },
    { label: '� изикових сигналів', value: s ? formatNumber(s.high_risk_count) : '—', hint: `Середні: ${s ? formatNumber(s.medium_risk_count) : '—'}`, icon: AlertTriangle, tone: 'crimson' as const },
    { label: 'Граф зв\'язків', value: s ? formatNumber(s.graph_nodes) : '—', hint: `${s ? formatNumber(s.graph_edges) : '—'} зв'язків`, icon: Network, tone: 'pink' as const },
  ], [s]);

  /* ── Навігаційні секції з іконками ── */
  const sectionIcons: Record<string, typeof Radar> = {
    command: Shield,
    intelligence: Radar,
    'financial-sigint': DollarSign,
    'trade-logistics': Ship,
    counterparties: Building2,
    'ai-automation': Brain,
  };

  return (
    <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="visible">
      
      {/* ═══════════════════════════════════════════════
         HERO — Статус-бар + KPI
         ═══════════════════════════════════════════════ */}
      <motion.section variants={fadeUp} className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#030810] p-6 sm:p-8">
        {/* Фонові елементи */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_-10%,rgba(225,29,72,0.06),transparent_60%)] pointer-events-none" />
        <div className="absolute top-4 right-4 opacity-[0.02] pointer-events-none">
          <Shield size={200} strokeWidth={0.5} className="text-rose-400" />
        </div>

        {/* Верхній рядок: badge + status */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-rose-500 uppercase italic">
            <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)] animate-pulse" />
            PREDATOR v58.2-WRAITH
          </div>
          <div className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black tracking-[0.15em] uppercase italic text-rose-600 border-rose-500/20 bg-rose-500/10",
          )}>
            <div className={cn("h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse")} />
            {backendStatus.statusLabel}
          </div>
          <div className="ml-auto text-[10px] font-mono text-slate-600 tracking-wider">
            {timeAgo(overview?.generated_at)}
          </div>
        </div>

        {/* KPI Картки */}
        <motion.div className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" variants={stagger}>
          {kpis.map((kpi) => {
            const t = tones[kpi.tone];
            return (
              <motion.div
                key={kpi.label}
                variants={scaleIn}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-white/[0.05] bg-[#060c18]/50 p-5 transition-all duration-500 hover:border-white/[0.14]",
                  t.glow
                )}
                whileHover={{ y: -3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', t.bg)}>
                    <kpi.icon className={cn('h-4.5 w-4.5', t.icon)} />
                  </div>
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" />}
                </div>
                <div className="text-2xl font-black tracking-tight text-white mb-1">{kpi.value}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</div>
                <div className="text-[10px] text-slate-600 mt-1">{kpi.hint}</div>
                {/* Accent line */}
                <div className={cn("absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r", t.line)} />
              </motion.div>
            );
          })}
        </motion.div>

      </motion.section>

      {/* ═══════════════════════════════════════════════
         ОСНОВНА СІТКА: Блоки + Алерти
         ═══════════════════════════════════════════════ */}
      <motion.section variants={stagger} className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.8fr)]">
        
        {/* ── Ліва колонка: 6 Titan-контурів ── */}
        <motion.div variants={fadeUp} className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white italic tracking-tight">ОПЕ� АТИВНИЙ КОНТУ� </h2>
              <p className="text-xs text-slate-500 mt-0.5">6 стратегічних Titan-модулів управління</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/15 bg-rose-500/8 px-2.5 py-1 text-[10px] font-bold text-rose-400">
              <Layers3 className="h-3 w-3" />
              {navigationSections.reduce((t, sec) => t + (sec.items?.length || 0), 0)} модулів
            </div>
          </div>

          <motion.div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3" variants={stagger}>
            {navigationSections.map((section) => {
              const accent = navAccentStyles[section.accent];
              const SectionIcon = sectionIcons[section.id] || Layers3;
              const items = section.items || [];
              const topItems = items.slice(0, 3);

              return (
                <motion.div
                  key={section.id}
                  variants={scaleIn}
                  className="group rounded-2xl border border-white/[0.05] bg-[#060c18]/40 p-4 transition-all duration-400 hover:border-white/[0.12] hover:bg-[#060c18]/60"
                  whileHover={{ y: -3 }}
                >
                  {/* Заголовок секції */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl border shrink-0', accent.iconBorder)}>
                      <SectionIcon className={cn('h-4 w-4', accent.icon)} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white truncate uppercase italic">{section.label}</h3>
                      <div className={cn('text-[10px] font-bold uppercase tracking-wider truncate', accent.softText)}>
                        {items.length} модулів
                      </div>
                    </div>
                  </div>

                  {/* Лінки на головні підрозділи */}
                  <div className="space-y-1">
                    {topItems.map((item) => (
                      <Link
                        key={item.id}
                        to={item.path}
                        className="flex items-center justify-between rounded-lg border border-transparent bg-white/[0.02] px-3 py-2 text-xs text-slate-300 transition-all hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white"
                      >
                        <span className="truncate font-medium">{item.label}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-slate-600 transition-transform group-hover:text-slate-400" />
                      </Link>
                    ))}
                  </div>

                  {items.length > 3 && (
                    <div className="mt-2 text-[10px] text-slate-600 pl-3 italic">
                      Ще {items.length - 3} модулів →
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* ── Права колонка: Алерти + Покриття ── */}
        <motion.div variants={fadeUp} className="space-y-5">
          
          {/* Критичні сигнали */}
          <div className="rounded-2xl border border-white/[0.05] bg-[#060c18]/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase italic tracking-tight">
                <Flame className="h-4 w-4 text-rose-500" />
                Критичні сигнали
              </h2>
              <div className="inline-flex items-center gap-1 rounded-full border border-rose-400/15 bg-rose-500/8 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                {alerts.length}
              </div>
            </div>

            <div className="space-y-2">
              {loading && (
                <div className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-4 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Завантаження...
                </div>
              )}
              {!loading && alerts.length === 0 && (
                <div className="rounded-xl bg-black/20 px-3 py-4 text-xs text-slate-500 italic">
                  Критичних алертів немає ✓
                </div>
              )}
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  className="group rounded-xl border border-white/[0.04] bg-black/20 px-3 py-3 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]"
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white leading-relaxed">{alert.message}</div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {alert.company} • {alert.sector}
                      </div>
                    </div>
                    <span className={cn(
                      'shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                      alert.severity === 'critical' ? 'border-rose-400/20 bg-rose-600/10 text-rose-400'
                        : alert.severity === 'warning' ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                        : 'border-slate-400/20 bg-slate-500/10 text-slate-400',
                    )}>
                      {alert.severity === 'critical' ? 'Критично'
                        : alert.severity === 'warning' ? 'Увага'
                        : 'Інфо'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600 font-mono">
                    <span>{timeAgo(alert.timestamp)}</span>
                    {(alert.value ?? 0) > 0 && (
                      <span className="font-semibold text-slate-400 tabular-nums">{formatCurrency(alert.value!)}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Покриття даних */}
          <div className="rounded-2xl border border-white/[0.05] bg-[#060c18]/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase italic tracking-tight">
                <Database className="h-4 w-4 text-rose-500" />
                Покриття даних
              </h2>
              <div className="inline-flex items-center gap-1 rounded-full border border-rose-500/15 bg-rose-500/8 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                ОНЛАЙН
              </div>
            </div>

            <div className="space-y-1.5">
              {[
                { label: 'Пошуковий індекс', value: s ? formatNumber(s.search_documents) : '—', hint: 'документів', icon: Search, tone: tones.rose },
                { label: 'Векторні ембедінги', value: s ? formatNumber(s.vectors) : '—', hint: 'записів', icon: Brain, tone: tones.pink },
                { label: 'Митні офіси', value: overview ? formatNumber(Object.keys(overview.customs_offices || {}).length) : '—', hint: 'активних', icon: ShieldCheck, tone: tones.rose },
                { label: 'Пайплайни', value: s ? formatNumber(s.active_pipelines) : '—', hint: `${s ? formatNumber(s.completed_pipelines) : '—'} завершених`, icon: Zap, tone: tones.crimson },
              ].map((item) => (
                <div
                  key={item.label}
                  className="group flex items-center justify-between rounded-xl border border-white/[0.04] bg-black/20 px-3 py-2.5 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border', item.tone.bg)}>
                      <item.icon className={cn('h-3.5 w-3.5', item.tone.icon)} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate uppercase italic">{item.label}</div>
                      <div className="text-[10px] text-slate-600">{item.hint}</div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-white tabular-nums">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Швидкі дії */}
          <div className="rounded-2xl border border-white/[0.05] bg-[#060c18]/40 p-4">
            <h2 className="text-sm font-black text-white mb-3 flex items-center gap-2 uppercase italic tracking-tight">
              <Sparkles className="h-4 w-4 text-violet-400" />
              Швидкі дії
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Пошук', path: '/search?tab=global', icon: Search, accent: 'rose' },
                { label: '� изики', path: '/diligence', icon: Target, accent: 'rose' },
                { label: '� инок', path: '/market?tab=overview', icon: TrendingUp, accent: 'rose' },
                { label: 'Брифінг', path: '/command?tab=brief', icon: Eye, accent: 'rose' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="group flex items-center gap-2 rounded-xl border border-white/[0.04] bg-black/20 px-3 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-white"
                >
                  <action.icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  {action.label}
                  <ArrowUpRight className="h-3 w-3 ml-auto text-slate-700 group-hover:text-white transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-600 px-1 italic">
              <span>Командний пошук</span>
              <kbd className="rounded border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">⌘K</kbd>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
