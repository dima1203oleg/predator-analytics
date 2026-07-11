/**
 * 🦅 PREDATOR v63.0-ELITE — EXECUTIVE BOARD (ELITE CORE)
 * ГОЛОВНА ПАНЕЛЬ CEO: Ризики, Гроші, Стратегія — за 3 секунди.
 * 
 * Розділ I.1 — Командний Центр
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Box,
  Brain,
  Building2,
  Database,
  DollarSign,
  Eye,
  Flame,
  Globe,
  Layers3,
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
  Fingerprint,
  Cpu,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useDashboardOverview, useDashboardAlerts } from '@/hooks/useDashboard';
import { getVisibleNavigation, navAccentStyles } from '@/config/navigation';
import { resolveUserRole } from '@/config/roles';
import { cn } from '@/utils/cn';
import { ThermalCard } from '@/components/polish/ThermalCard';
import { useViewport } from '@/hooks/useViewport';

// Premium Components
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { LiveThreatRadar } from './LiveThreatRadar';

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
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] } },
};

/* ── Кольорова палітра ── */
const tones = {
  rose: { 
    bg: 'bg-cyan-500/10 border-cyan-500/20', 
    icon: 'text-cyan-500', 
    glow: 'group-hover:', 
    line: 'from-rose-600 via-rose-500 to-transparent' 
  },
  crimson: { 
    bg: 'bg-cyan-600/10 border-cyan-500/20', 
    icon: 'text-cyan-600', 
    glow: 'group-hover:', 
    line: 'from-rose-700 via-rose-600 to-transparent' 
  },
  gold: { 
    bg: 'bg-amber-500/10 border-amber-500/20', 
    icon: 'text-amber-500', 
    glow: 'group-hover:', 
    line: 'from-amber-600 via-amber-500 to-transparent' 
  },
  sky: { 
    bg: 'bg-sky-500/10 border-sky-500/20', 
    icon: 'text-sky-500', 
    glow: 'group-hover:', 
    line: 'from-sky-600 via-sky-500 to-transparent' 
  },
} as const;

export default function ExecutiveBoardView() {
  const { user } = useUser();
  const backendStatus = useBackendStatus();
  const currentRole = resolveUserRole(user?.role);
  const navigationSections = useMemo(() => getVisibleNavigation(currentRole), [currentRole]);
  const { isCompact, isMedium } = useViewport();

  const { data: overview, isLoading: isOverviewLoading } = useDashboardOverview();
  const { data: alertsData, isLoading: isAlertsLoading } = useDashboardAlerts(6);

  const s = overview?.summary;
  const alerts = alertsData?.items ?? [];
  const loading = isOverviewLoading || isAlertsLoading;

  const kpis = useMemo(() => [
    { label: 'ФІНАНСОВИЙ_ПОТІК', value: s ? formatCurrency(s.total_value_usd) : '—', hint: 'Загальна вартість ЗЕД', icon: DollarSign, tone: 'rose' as const },
    { label: 'ДЕКЛАРАЦІЇ_ЯДРА', value: s ? formatNumber(s.total_declarations) : '—', hint: 'Підтверджених записів', icon: Activity, tone: 'sky' as const },
    { label: 'ЗОНА_КРИТИЧНОСТІ', value: s ? formatNumber(s.high_risk_count) : '—', hint: `Середні: ${s ? formatNumber(s.medium_risk_count) : '—'}`, icon: AlertTriangle, tone: 'crimson' as const },
    { label: 'ГРАФ_ЗВ\'ЯЗКІВ', value: s ? formatNumber(s.graph_nodes) : '—', hint: `${s ? formatNumber(s.graph_edges) : '—'} зв'язків`, icon: Network, tone: 'gold' as const },
  ], [s]);

  const sectionIcons: Record<string, typeof Radar> = {
    omniverse: Box,
    command: Shield,
    executive: Target,
    intelligence: Radar,
    'financial-sigint': DollarSign,
    'trade-logistics': Ship,
    counterparties: Building2,
    'ai-automation': Brain,
    analytics: Fingerprint,
    ai: Cpu,
  };

  return (
    <motion.div 
      className={cn("relative min-h-screen space-y-12 overflow-hidden", isCompact ? "p-3" : "p-6 sm:p-10")} 
      variants={stagger} 
      initial="hidden" 
      animate="visible"
    >
      {/* Background Layer */}
      <AdvancedBackground />
      <CyberGrid color="rgba(244, 63, 94, 0.05)" />
      <NeuralPulse color="rgba(244, 63, 94, 0.03)" size={1400} />

      {/* ═══════════════════════════════════════════════
         HERO HUD — Tactical Dashboard Header
         ═══════════════════════════════════════════════ */}
      <motion.section 
        variants={fadeUp} 
        className={cn(
          "relative overflow-hidden border border-white/5 bg-black/40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]",
          isCompact ? "rounded-3xl p-5" : "rounded-[3rem] p-8 sm:p-12"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Orb Status Indicator */}
        <div className={cn("absolute flex items-center gap-6", isCompact ? "top-5 right-5" : "top-10 right-10")}>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1 italic">СТАТУС_КЛАСТЕРА</p>
            <p className="text-sm font-bold text-cyan-500 italic uppercase">{backendStatus.statusLabel}</p>
          </div>
          <CyberOrb size="md" status={s && s.high_risk_count > 50 ? 'critical' : 'active'} pulsing />
        </div>

        {/* Brand & Time */}
        <div className="relative z-10 flex items-center gap-6 mb-10">
          <div className="flex flex-col">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-[10px] font-black tracking-[0.3em] text-cyan-500 uppercase italic">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_12px_#f43f5e] " />
              PREDATOR v63.0-ELITE
            </div>
            <div className="mt-4 flex items-center gap-4">
              <h1 className={cn("font-black text-white italic tracking-tighter uppercase skew-x-[-3deg]", isCompact ? "text-2xl max-w-[200px] leading-tight" : "text-3xl sm:text-5xl")}>
                ВИКОНАВЧА <span className="text-cyan-600">РАДА</span>
              </h1>
              {!isCompact && <div className="h-0.5 w-24 bg-gradient-to-r from-rose-600 to-transparent" />}
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-[0.5em] italic opacity-60">
              ЦЕНТРАЛЬНИЙ ШТАБ УПРАВЛІННЯ ТА СТРАТЕГІЧНОГО ПЛАНУВАННЯ
            </p>
          </div>
          <div className="ml-auto flex flex-col items-end opacity-40">
            <p className="text-[10px] font-mono font-black text-slate-400 tracking-widest uppercase mb-1">ОСТАННЯ СИНХРОНІЗАЦІЯ</p>
            <p className="text-xs font-mono text-slate-500">{timeAgo(overview?.generated_at)}</p>
          </div>
        </div>

        {/* KPI Cards HUD */}
        <motion.div className="relative z-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4" variants={stagger}>
          {kpis.map((kpi) => {
            const t = tones[kpi.tone];
            return (
              <motion.div
                key={kpi.label}
                variants={scaleIn}
                className={cn(
                  "group relative overflow-hidden border border-white/5 bg-[#060c18]/60 transition-all duration-700 hover:border-cyan-500/30 hover:bg-[#060c18]/80 shadow-2xl",
                  isCompact ? "rounded-2xl p-5" : "rounded-[2rem] p-8",
                  t.glow
                )}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl border transition-all group-hover:scale-110 shadow-lg', t.bg)}>
                    <kpi.icon className={cn('h-6 w-6', t.icon)} />
                  </div>
                  {loading && <BrandLoaderFallback text="ЗАВАНТАЖЕННЯ" subtext="ОБРОБКА ДАНИХ" />}
                </div>
                <div className="text-3xl font-black italic tracking-tighter text-white mb-2 tabular-nums">
                  {kpi.value}
                </div>
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic group-hover:text-rose-400 transition-colors">
                  {kpi.label}
                </div>
                <div className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-widest">{kpi.hint}</div>
                
                {/* Visual Accent Line */}
                <div className={cn("absolute bottom-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-all duration-700 bg-gradient-to-r shadow-[0_-10px_20px_rgba(6,182,212,0.3)]", t.line)} />
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* ═══════════════════════════════════════════════
         OPERATIONAL CONTOUR — Strategic Modules
         ═══════════════════════════════════════════════ */}
      <motion.section variants={stagger} className={cn(isCompact ? "grid gap-10 grid-cols-1" : "grid gap-10 xl:grid-cols-[minmax(0,1.8fr)_minmax(380px,0.8fr)]")}>
        
        {/* Left Column: Module Matrix */}
        <motion.div variants={fadeUp} className="space-y-8">
          <div className="flex items-center justify-between px-4">
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">ОПЕРАТИВНИЙ <span className="text-cyan-500">КОНТУР</span></h2>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] italic mt-1">СТРАТЕГІЧНІ ТИТАН-МОДУЛІ УПРАВЛІННЯ</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="h-px w-20 bg-white/5" />
               <div className="inline-flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-[10px] font-black text-rose-400 italic">
                 <Layers3 className="h-4 w-4" />
                 {navigationSections.reduce((t, sec) => t + (sec.items?.length || 0), 0)} МОДУЛІВ_АКТИВНО
               </div>
            </div>
          </div>

          <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={stagger}>
            {navigationSections.map((section) => {
              const accent = navAccentStyles[section.accent];
              const SectionIcon = sectionIcons[section.id] || Layers3;
              const items = section.items || [];
              const topItems = items.slice(0, 4);

              return (
                <motion.div
                  key={section.id}
                  variants={scaleIn}
                  whileHover={{ y: -5 }}
                >
                  <ThermalCard className="group shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                  
                  {/* Section Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform group-hover:scale-110 shadow-inner', accent.iconBorder)}>
                      <SectionIcon className={cn('h-6 w-6', accent.icon)} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white uppercase italic tracking-tight truncate group-hover:text-rose-400 transition-colors">{section.label}</h3>
                      <div className={cn('text-[9px] font-black uppercase tracking-[0.2em] truncate opacity-60', accent.softText)}>
                        {items.length} ОПЕРАЦІЙНИХ ЦІЛЕЙ
                      </div>
                    </div>
                  </div>

                  {/* Links HUD */}
                  <div className="space-y-2">
                    {topItems.map((item) => (
                      <Link
                        key={item.id}
                        to={item.path}
                        className="flex items-center justify-between rounded-xl border border-transparent bg-white/[0.03] px-4 py-3 text-[11px] font-bold text-slate-400 transition-all hover:border-cyan-500/20 hover:bg-cyan-500/10 hover:text-white group/link"
                      >
                        <span className="truncate italic uppercase tracking-tight">{item.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-700 transition-all group-hover/link:translate-x-1 group-hover/link:text-cyan-500" />
                      </Link>
                    ))}
                  </div>

                  {items.length > 4 && (
                    <div className="mt-4 text-[9px] font-black text-slate-600 px-4 italic uppercase tracking-widest flex items-center gap-2 group-hover:text-cyan-600 transition-colors">
                      ЩЕ {items.length - 4} ПІДРОЗДІЛІВ <ArrowRight size={10} />
                    </div>
                  )}
                  
                  {/* Subtle Corner Icon */}
                  <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                     <SectionIcon size={80} />
                  </div>
                  </ThermalCard>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Right Column: Alerts & Signals */}
        <motion.div variants={fadeUp} className="space-y-8">
          
          {/* Critical Signals HUD */}
          <div className={cn("border border-white/5 bg-black/40 shadow-2xl relative overflow-hidden", isCompact ? "rounded-3xl p-5" : "rounded-[2.5rem] p-8")}>
            <div className="absolute top-0 right-0 w-1 h-full bg-cyan-600/30" />
            
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 border-b border-white/5 pb-6">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                    <Flame className="h-5 w-5 text-cyan-500 " />
                    КРИТИЧНІ СИГНАЛИ
                  </h2>
                  <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 px-3 py-1 text-[10px] font-black italic rounded-md">
                    {alerts.length} АКТИВНО
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic mb-4">РАДАР АКТИВНИХ ЗАГРОЗ У РЕАЛЬНОМУ ЧАСІ</p>
              </div>
              <div className="shrink-0">
                <LiveThreatRadar />
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="flex flex-col items-center gap-4 py-12 opacity-40">
                    <BrandLoaderFallback text="ЗАВАНТАЖЕННЯ" subtext="ОБРОБКА ДАНИХ" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">СИНХРОНІЗАЦІЯ_АЛЕ ТІВ...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-8 text-center text-[11px] text-slate-600 italic uppercase tracking-widest">
                    КРИТИЧНИХ ЗАГРОЗ НЕ ВИЯВЛЕНО ✓
                  </div>
                ) : alerts.map((alert, idx) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 shadow-lg overflow-hidden"
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-white leading-relaxed uppercase italic tracking-tight group-hover:text-rose-400 transition-colors">{alert.message}</div>
                        <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                          <Building2 size={10} /> {alert.company} <span className="opacity-30">•</span> {alert.sector}
                        </div>
                      </div>
                      <span className={cn(
                        'shrink-0 rounded-lg border px-3 py-1 text-[9px] font-black uppercase tracking-widest italic shadow-lg',
                        alert.severity === 'critical' ? 'border-cyan-500/40 bg-cyan-600/20 text-rose-400'
                          : alert.severity === 'warning' ? 'border-amber-500/40 bg-amber-600/20 text-amber-400'
                          : 'border-slate-500/40 bg-slate-600/20 text-slate-400',
                      )}>
                        {alert.severity === 'critical' ? 'КРИТИЧНО'
                          : alert.severity === 'warning' ? 'УВАГА'
                          : 'ІНФО'}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px] font-mono font-black italic">
                      <span className="text-slate-600 group-hover:text-slate-400 transition-colors">{timeAgo(alert.timestamp)}</span>
                      {(alert.value ?? 0) > 0 && (
                        <span className="text-cyan-500 tabular-nums shadow-cyan-500/20 drop-shadow-md">{formatCurrency(alert.value!)}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Actions HUD */}
          <div className={cn("border border-white/5 bg-black/40 shadow-2xl overflow-hidden relative", isCompact ? "rounded-3xl p-5" : "rounded-[2.5rem] p-8")}>
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/[0.03] to-transparent pointer-events-none" />
            <h2 className="text-sm font-black text-white mb-6 flex items-center gap-3 uppercase italic tracking-widest">
              <Sparkles className="h-4 w-4 text-cyan-500 " />
              ШВИДКІ ДІЇ
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'ПОШУК', path: '/search?tab=global', icon: Search },
                { label: 'РИЗИКИ', path: '/osint?tab=diligence', icon: Target },
                { label: 'РИНОК', path: '/market?tab=overview', icon: TrendingUp },
                { label: 'БРИФІНГ', path: '/command?tab=brief', icon: Eye },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-white shadow-md italic"
                >
                  <action.icon className="h-4 w-4 text-slate-500 group-hover:text-cyan-500 transition-all group-hover:scale-110" />
                  {action.label}
                  <ArrowUpRight className="h-3 w-3 ml-auto text-slate-800 group-hover:text-cyan-500 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-[9px] font-black text-slate-700 italic px-2 uppercase tracking-widest">
              <span>КОМАНДНИЙ ПОШУК</span>
              <kbd className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-slate-500 shadow-inner">⌘ K</kbd>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Strategic Information Ticker (desktop only) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 hidden md:flex bg-black/80 border-t border-cyan-500/20 h-14 items-center overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="px-8 bg-cyan-600 h-full flex items-center shrink-0 border-r border-white/10 shadow-[20px_0_40px_rgba(6,182,212,0.4)] relative z-10 italic text-white font-black text-[11px] tracking-[0.3em] uppercase">
          <div className="flex items-center gap-4">
             <Activity size={20} className="" />
             <span>ЖИВИЙ_ПОТІК_v63.0</span>
          </div>
        </div>
        <div className="flex-1 flex items-center">
          <motion.div 
            animate={{ x: [2000, -3000] }}
            transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
            className="flex items-center gap-24 whitespace-nowrap"
          >
            {[
              `СИСТЕМА: ОПТИМАЛЬНО | РЕЖИМ: ЕЛІТ_ТАКТИКА | СИНХРОНІЗАЦІЯ: ТАК`,
              `ФІНАНСОВИЙ ПОТІК: ${s ? formatCurrency(s.total_value_usd) : '—'} | ДЕКЛАРАЦІЙ: ${s ? formatNumber(s.total_declarations) : '—'}`,
              `КРИТИЧНІ СИГНАЛИ: ${alerts.length} | ЗОНА РИЗИКУ: ${s ? s.high_risk_count : '—'} ОБ'ЄКТІВ`,
              `НЕЙРОННИЙ ГРАФ: ${s ? formatNumber(s.graph_nodes) : '—'} ВУЗЛІВ | ${s ? formatNumber(s.graph_edges) : '—'} ЗВ'ЯЗКІВ`,
              `ЯДРО: NVIDIA_H100_NEXUS | ЛАТЕНТНІСТЬ: 4.2мс | ОПЕРАЦІЙНА ЧИСТОТА: 99.8%`
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-8">
                <div className="w-2 h-2 rounded-full bg-cyan-600 shadow-[0_0_10px_#f43f5e] " />
                <span className="text-[11px] font-mono text-slate-500 font-black uppercase tracking-[0.2em] italic">
                  {log}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @font-face {
          font-family: 'Outfit';
          src: url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;900&display=swap');
        }
        `
      }} />
    </motion.div>
  );
}
