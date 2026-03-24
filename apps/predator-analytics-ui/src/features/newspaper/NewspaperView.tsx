/**
 * PREDATOR v55.5 | Газета PREDATOR — Реальні дані з API
 * Дайджест: компромат, тренди, митниця, алерти — все з реальної БД.
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Flame,
  Globe,
  Loader2,
  Network,
  RefreshCw,
  Siren,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  UserX,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { newspaperApi } from '../../services/api/newspaper';
import type {
  NewspaperData,
  ComprommatItem,
  TrendItem,
  CustomsItem,
  AlertItem,
} from '../../services/api/newspaper';

/* ═══════════════════════════════════════════════════════════════
   АНІМАЦІЇ — Framer Motion правила
   ═══════════════════════════════════════════════════════════════ */

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
};

const cardHover = {
  rest: { scale: 1, boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
  hover: {
    scale: 1.012,
    boxShadow: '0 8px 30px -8px rgba(0,0,0,0.6)',
    transition: { duration: 0.18, ease: 'easeOut' },
  },
};

/* ═══════════════════════════════════════════════════════════════
   УТИЛІТИ
   ═══════════════════════════════════════════════════════════════ */

const RiskBadge = ({ score }: { score: number }) => {
  const color =
    score >= 80 ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
    score >= 50 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
    'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

  return (
    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded border tracking-wider', color)}>
      РИЗИК {score}%
    </span>
  );
};

const UrgencyDot = ({ urgency }: { urgency: AlertItem['urgency'] }) => {
  const colorClass =
    urgency === 'high' ? 'bg-rose-500' :
    urgency === 'medium' ? 'bg-amber-400' :
    'bg-cyan-400';

  return (
    <span className="relative flex h-2 w-2 shrink-0 mt-0.5">
      {urgency === 'high' && (
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", colorClass)} />
      )}
      <span className={cn("relative inline-flex rounded-full h-2 w-2", colorClass)} />
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ГОЛОВНИЙ МАТЕРІАЛ
   ═══════════════════════════════════════════════════════════════ */

const MainHeadline = ({ headline }: { headline: NewspaperData['headline'] }) => (
  <motion.div
    {...fadeInUp}
    transition={{ duration: 0.25, delay: 0.05 }}
    className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 shadow-[0_0_60px_-20px_rgba(244,63,94,0.15)]"
  >
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.06),transparent_60%)] pointer-events-none" />

    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30">
        <Flame className="w-3 h-3 text-rose-400" />
        <span className="text-[9px] font-black text-rose-400 tracking-[0.2em] uppercase">
          {headline.tag}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
        </span>
        <span className="text-[9px] text-rose-400/60 font-mono">ГАРЯЧЕ</span>
      </div>
    </div>

    <motion.h2
      animate={{ opacity: [1, 0.85, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="font-['Courier_Prime',monospace] text-xl font-bold text-white leading-snug mb-3"
    >
      {headline.title}
    </motion.h2>

    <div className="flex items-center gap-3 mb-4">
      <RiskBadge score={headline.riskScore} />
      <span className="text-[10px] font-mono text-slate-500">
        ЄДРПОУ: {headline.edrpou}
      </span>
      {headline.declarationNumber && (
        <span className="text-[10px] font-mono text-slate-600">
          №{headline.declarationNumber}
        </span>
      )}
    </div>

    <p className="text-[13px] text-slate-400 leading-relaxed mb-4 font-['Courier_Prime',monospace]">
      {headline.subtitle}
    </p>

    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/8 border border-rose-500/15 mb-5">
      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
      <span className="text-[12px] font-semibold text-rose-300">{headline.hook}</span>
    </div>

    <div className="flex items-center gap-3">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[12px] font-bold transition-colors shadow-lg shadow-rose-500/20"
      >
        <FileText className="w-3.5 h-3.5" />
        Повне досьє
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[12px] font-semibold transition-colors"
      >
        <Network className="w-3.5 h-3.5" />
        Граф потоків
      </motion.button>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   КАРТКА КОМПРОМАТУ
   ═══════════════════════════════════════════════════════════════ */

const ComprommatCard = ({ item, delay }: { item: ComprommatItem; delay: number }) => {
  const riskColor =
    item.riskLevel === 'high'
      ? { border: 'border-rose-500/20', bg: 'bg-rose-500/5', badge: 'text-rose-400 bg-rose-500/10 border-rose-500/25', dot: 'bg-rose-500' }
      : {  border: 'border-amber-500/15', bg: 'bg-amber-500/5', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/25', dot: 'bg-amber-400' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      whileHover="hover"
      variants={cardHover}
      className={cn(
        'rounded-xl border p-4 cursor-pointer transition-colors duration-200 group',
        riskColor.border,
        riskColor.bg,
        'hover:bg-white/[0.02]'
      )}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <UserX className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white leading-tight mb-1 group-hover:text-rose-200 transition-colors">
            {item.title}
          </p>
          <p className="text-[10px] font-['Courier_Prime',monospace] text-slate-500 leading-snug">
            {item.subtitle}
          </p>
        </div>
      </div>

      <div className={cn('text-[9px] font-bold px-2 py-0.5 rounded border inline-block mb-2', riskColor.badge)}>
        {item.risk}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-rose-300/80 flex-1 mr-2">{item.hook}</p>
        <ChevronRight className="w-3.5 h-3.5 text-rose-400/40 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
      </div>

      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/[0.04]">
        <Globe className="w-2.5 h-2.5 text-slate-600" />
        <span className="text-[8px] font-mono text-slate-600">{item.source}</span>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   КАРТКА ТРЕНДУ
   ═══════════════════════════════════════════════════════════════ */

const TrendCard = ({ item, delay }: { item: TrendItem; delay: number }) => {
  const isUp = item.direction === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      whileHover="hover"
      variants={cardHover}
      className={cn(
        'rounded-xl border p-4 cursor-pointer group transition-colors duration-200',
        isUp
          ? 'border-cyan-500/15 bg-cyan-500/5 hover:bg-cyan-500/8'
          : 'border-amber-500/15 bg-amber-500/5 hover:bg-amber-500/8'
      )}
    >
      <div className="flex items-start gap-2.5 mb-3">
        {isUp ? (
          <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        ) : (
          <TrendingDown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[12px] font-semibold text-white leading-tight group-hover:text-cyan-200 transition-colors">
              {item.title}
            </p>
          </div>
          <p className="text-[10px] font-['Courier_Prime',monospace] text-slate-500 leading-snug">
            {item.subtitle}
          </p>
        </div>
      </div>

      {/* Мінімальний бар-індикатор */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] text-slate-600 font-mono">УКТ ЗЕД {item.hsCode}</span>
          <span className={cn(
            'text-[11px] font-black tracking-tight',
            isUp ? 'text-cyan-400' : 'text-amber-400'
          )}>
            {isUp ? '+' : '-'}{item.percent}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(item.percent, 100)}%` }}
            transition={{ duration: 0.6, delay: delay + 0.2, ease: 'easeOut' }}
            className={cn('h-full rounded-full', isUp ? 'bg-cyan-500' : 'bg-amber-500')}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className={cn('text-[11px] flex-1 mr-2', isUp ? 'text-cyan-300/80' : 'text-amber-300/80')}>
          {item.hook}
        </p>
        <ChevronRight className={cn(
          'w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-all duration-200',
          isUp ? 'text-cyan-400/40 group-hover:text-cyan-400' : 'text-amber-400/40 group-hover:text-amber-400'
        )} />
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   КАРТКА МИТНИЦІ
   ═══════════════════════════════════════════════════════════════ */

const CustomsCard = ({ item, delay }: { item: CustomsItem; delay: number }) => {
  const isOpp = item.type === 'opportunity';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      whileHover="hover"
      variants={cardHover}
      className={cn(
        'rounded-xl border p-4 cursor-pointer group transition-colors duration-200',
        isOpp
          ? 'border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/8'
          : 'border-rose-500/15 bg-rose-500/5 hover:bg-rose-500/8'
      )}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <Truck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-white leading-tight mb-1 group-hover:text-indigo-200 transition-colors">
            {item.title}
          </p>
          <p className="text-[10px] font-['Courier_Prime',monospace] text-slate-500 leading-snug">
            {item.subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className={cn('text-[11px] flex-1 mr-2', isOpp ? 'text-indigo-300/80' : 'text-rose-300/80')}>
          {item.hook}
        </p>
        <ChevronRight className="w-3.5 h-3.5 text-indigo-400/40 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   СТРІЧКА АЛЕРТІВ
   ═══════════════════════════════════════════════════════════════ */

const AlertsStrip = ({ alerts }: { alerts: AlertItem[] }) => {
  const [newAlerts, setNewAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (alerts.length > 0) {
      setNewAlerts(new Set(alerts.slice(0, 2).map(a => a.id)));
      const t = setTimeout(() => setNewAlerts(new Set()), 3000);
      return () => clearTimeout(t);
    }
  }, [alerts]);

  if (alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.45 }}
      className="rounded-2xl border border-white/[0.06] bg-slate-900/60 p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Siren className="w-4 h-4 text-amber-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
          Алерти та удари
        </span>
        <span className="ml-auto text-[9px] font-mono text-slate-600">
          {alerts.length} сигналів
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {alerts.map((alert: AlertItem) => {
          const isNew = newAlerts.has(alert.id);
          const borderColor =
            alert.urgency === 'high' ? 'border-rose-500/25 bg-rose-500/6' :
            alert.urgency === 'medium' ? 'border-amber-500/20 bg-amber-500/5' :
            'border-cyan-500/15 bg-cyan-500/5';

          return (
            <motion.div
              key={alert.id}
              initial={isNew ? { backgroundColor: 'rgba(34,211,238,0.15)' } : {}}
              animate={{ backgroundColor: 'transparent' }}
              transition={{ duration: 1.5 }}
              className={cn(
                'flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer hover:brightness-110 transition-all duration-200',
                borderColor
              )}
            >
              <UrgencyDot urgency={alert.urgency} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-300 leading-snug">
                  {alert.text}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="w-2.5 h-2.5 text-slate-600" />
                  <span className="text-[8px] font-mono text-slate-600">{alert.time}</span>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-600 hover:text-slate-400 shrink-0 mt-0.5 transition-colors" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ГОЛОВНИЙ КОМПОНЕНТ — NewspaperView
   ═══════════════════════════════════════════════════════════════ */

export default function NewspaperView() {
  const [issueTime, setIssueTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NewspaperData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const result = await newspaperApi.getData();
      setData(result);
    } catch (err) {
      console.error('Newspaper fetch error:', err);
      setError('Не вдалося завантажити дані газети. Перевірте з\'єднання з сервером.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIssueTime(
        now.toLocaleDateString('uk-UA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) +
          ', ' +
          now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-full bg-[#010b18] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-[12px] font-mono text-slate-500 uppercase tracking-wider">
            Завантаження газети...
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-full bg-[#010b18] text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
          <p className="text-[13px] text-slate-400">{error}</p>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[12px] font-semibold hover:bg-indigo-500/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { headline, compromat, trends, customs, alerts, metrics, summary } = data;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-full bg-[#010b18] text-white p-6 space-y-6 font-['Inter',sans-serif]"
    >
      {/* ── ШАПКА «ГАЗЕТИ» ── */}
      <motion.header
        {...fadeInUp}
        className="pb-5 border-b border-white/[0.06]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <motion.div
              className="flex items-center gap-3 mb-2"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="font-['Courier_Prime',monospace] text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                ГАЗЕТА PREDATOR
              </span>
            </motion.div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-600" />
                <span className="font-['Courier_Prime',monospace] text-[12px] text-slate-500">
                  {issueTime}
                </span>
              </div>
              <span className="text-slate-700">·</span>
              <span className="text-[12px] text-slate-500">
                {summary}
              </span>
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-[9px] font-black text-emerald-400 tracking-wider">НАЖИВО</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              onClick={fetchData}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06] text-slate-400 hover:text-white text-[11px] font-semibold transition-all"
            >
              <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} />
              Оновити випуск
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold transition-all"
            >
              <Bell className="w-3 h-3" />
              Підписатися на тематику
            </motion.button>
          </div>
        </div>

        {/* Статистика випуску — реальні дані з API */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.04]">
          {[
            { label: 'Декларацій', value: String(metrics.totalDeclarations), color: 'text-white' },
            { label: 'Ризик-алертів', value: String(metrics.riskAlerts), color: 'text-rose-400' },
            { label: 'Трендів', value: String(metrics.trends), color: 'text-cyan-400' },
            { label: 'Митних подій', value: String(metrics.customsEvents), color: 'text-indigo-400' },
            { label: 'Імпорт', value: String(metrics.importCount), color: 'text-emerald-400' },
            { label: 'Експорт', value: String(metrics.exportCount), color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-1.5">
              <span className={cn('text-[15px] font-black tracking-tight', stat.color)}>{stat.value}</span>
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.header>

      {/* ── ГОЛОВНИЙ МАТЕРІАЛ (above the fold) ── */}
      <MainHeadline headline={headline} />

      {/* ── 3 КОЛОНКИ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── ЛІВА: Компромат дня ── */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="flex items-center gap-2 pb-2 border-b border-rose-500/20"
          >
            <div className="w-1 h-4 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
              Компромат дня
            </span>
            <span className="ml-auto text-[8px] font-mono text-slate-600">
              {compromat.length} матеріалів
            </span>
          </motion.div>

          {compromat.map((item: ComprommatItem, i: number) => (
            <ComprommatCard key={item.id} item={item} delay={0.15 + i * 0.06} />
          ))}
        </div>

        {/* ── ЦЕНТР: Тренди по категоріях ── */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="flex items-center gap-2 pb-2 border-b border-cyan-500/20"
          >
            <div className="w-1 h-4 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
              Тренди по категоріях
            </span>
            <span className="ml-auto text-[8px] font-mono text-slate-600">
              ${(metrics.totalValueUsd / 1000000).toFixed(1)}M загалом
            </span>
          </motion.div>

          {trends.map((item: TrendItem, i: number) => (
            <TrendCard key={item.id} item={item} delay={0.2 + i * 0.06} />
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">ШІ-аналіз</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug font-['Courier_Prime',monospace]">
              На основі {metrics.totalDeclarations} митних декларацій на суму ${(metrics.totalValueUsd / 1000000).toFixed(1)}M. Оновлення кожні 2 хвилини.
            </p>
          </motion.div>
        </div>

        {/* ── ПРАВА: Митниця та постачання ── */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.25 }}
            className="flex items-center gap-2 pb-2 border-b border-indigo-500/20"
          >
            <div className="w-1 h-4 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
              Митниця та постачання
            </span>
          </motion.div>

          {customs.map((item: CustomsItem, i: number) => (
            <CustomsCard key={item.id} item={item} delay={0.25 + i * 0.06} />
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3"
          >
            <p className="text-[10px] text-indigo-400/70 leading-snug">
              Дані митних декларацій оновлюються автоматично. Обробка {metrics.totalDeclarations} записів.
            </p>
            <button className="flex items-center gap-1 mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
              <ArrowRight className="w-3 h-3" />
              Усі {metrics.customsEvents} митних подій
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── НИЖНЯ СТРІЧКА АЛЕРТІВ ── */}
      <AlertsStrip alerts={alerts} />

      {/* ── ПІДВАЛ ГАЗЕТИ ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="pt-4 border-t border-white/[0.04] flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-indigo-400" />
          <span className="text-[9px] font-['Courier_Prime',monospace] text-slate-600">
            PREDATOR Analytics · {issueTime} · {metrics.totalDeclarations} декларацій
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-slate-700">Джерела: ЄДРПОУ · ДПС · Митниця UA · OpenSearch</span>
          <button className="text-[9px] text-indigo-400/60 hover:text-indigo-400 transition-colors flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />
            Архів
          </button>
        </div>
      </motion.footer>
    </motion.div>
  );
}
