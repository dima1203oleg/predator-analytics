import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, Target, Eye, Network, ShieldAlert, BarChart3,
  TrendingUp, Zap, Activity, Brain, Crosshair, Shield,
  ChevronRight, Sparkles, ArrowUpRight
} from 'lucide-react';
import { ViewHeader } from '../../ViewHeader';

// ─── Анімований лічильник ────────────────────────────────────────────────────
const AnimatedCounter: React.FC<{
  target: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}> = ({ target, suffix = '', prefix = '', decimals = 0, duration = 2000, className }) => {
  const [current, setCurrent] = useState(0);
  const startRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    startRef.current = current;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(startRef.current + (target - startRef.current) * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
     
  }, [target, duration]);

  return (
    <span className={className}>
      {prefix}{current.toFixed(decimals)}{suffix}
    </span>
  );
};

// ─── Мікро-спарклайн ────────────────────────────────────────────────────────
const MicroSparkline: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({
  data, color, width = 80, height = 24
}) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
  ).join(' ');
  const fillPts = `0,${height} ${pts} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

// ─── Конфігурація модулів ────────────────────────────────────────────────────
interface TornadoModule {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgGlow: string;
  kpi: { label: string; value: number; suffix: string; prefix?: string; decimals?: number };
  sparkData: number[];
  status: string;
  route: string;
}

const modules: TornadoModule[] = [
  {
    id: 'forecast',
    title: 'ПРОГНОЗУВАННЯ',
    subtitle: 'Математичний Розрахунок',
    description: 'Аналіз історичних продажів, податкових потоків та сезонних аномалій. Точні точки входу/виходу з ринку.',
    icon: TrendingUp,
    color: '#10b981',
    borderColor: 'border-emerald-500/20 hover:border-emerald-500/50',
    bgGlow: 'rgba(16,185,129,0.15)',
    kpi: { label: 'Точність прогнозу', value: 94.2, suffix: '%', decimals: 1 },
    sparkData: [65, 70, 68, 75, 82, 78, 85, 90, 88, 92, 94, 94],
    status: 'ACTIVE',
    route: '/forecast',
  },
  {
    id: 'market',
    title: 'КАРТА РИНКУ',
    subtitle: 'Глибинна Конкуренція',
    description: 'Виявлення прихованих бенефіціарів, демпінгових схем та фірм-прокладок у реальному часі.',
    icon: Target,
    color: '#3b82f6',
    borderColor: 'border-blue-500/20 hover:border-blue-500/50',
    bgGlow: 'rgba(59,130,246,0.15)',
    kpi: { label: 'Моніторинг суб\'єктів', value: 1.2, suffix: 'M', decimals: 1 },
    sparkData: [40, 45, 55, 60, 58, 65, 72, 78, 82, 90, 95, 120],
    status: 'ACTIVE',
    route: '/market',
  },
  {
    id: 'graph',
    title: 'ГРАФОВИЙ OSINT',
    subtitle: 'Тіньові Зв\'язки',
    description: 'Легальний OSINT через ProZorro, фінансові транзакції, судові справи та реєстри бенефіціарів.',
    icon: Network,
    color: '#a855f7',
    borderColor: 'border-purple-500/20 hover:border-purple-500/50',
    bgGlow: 'rgba(168,85,247,0.15)',
    kpi: { label: 'Нодів у графі', value: 45, suffix: 'M' },
    sparkData: [10, 15, 18, 22, 28, 30, 35, 38, 40, 42, 44, 45],
    status: 'ACTIVE',
    route: '/osint?tab=graph',
  },
  {
    id: 'diligence',
    title: 'DUE DILIGENCE 2.0',
    subtitle: 'Захист від Ризиків',
    description: 'Виявлення судових ризиків, кримінальних фігурантів та ознак фіктивного банкрутства.',
    icon: ShieldAlert,
    color: '#e11d48',
    borderColor: 'border-rose-500/20 hover:border-rose-500/50',
    bgGlow: 'rgba(225,29,72,0.15)',
    kpi: { label: 'Червоних прапорців', value: 12, suffix: ' кат.' },
    sparkData: [2, 3, 4, 5, 6, 7, 8, 9, 9, 10, 11, 12],
    status: 'ACTIVE',
    route: '/osint?tab=diligence',
  },
  {
    id: 'anomaly',
    title: 'МІСІЯ-КОНТРОЛЬ',
    subtitle: 'Виявлення Аномалій',
    description: 'Автоматична фіксація віялових платежів, демпінгу, продажу нижче собівартості та підозрілої логістики.',
    icon: Eye,
    color: '#06b6d4',
    borderColor: 'border-cyan-500/20 hover:border-cyan-500/50',
    bgGlow: 'rgba(6,182,212,0.15)',
    kpi: { label: 'Транзакцій/сек', value: 847, suffix: '' },
    sparkData: [500, 520, 580, 610, 650, 700, 720, 750, 780, 800, 830, 847],
    status: 'LIVE',
    route: '/command?tab=observer',
  },
  {
    id: 'scenario',
    title: 'ВІЙСЬКОВІ ІГРИ (WAR-GAMING)',
    subtitle: 'Моделювання Майбутнього',
    description: 'Автономні симуляції впливу курсу, податків, логістичних розривів та ворожих дій на систему.',
    icon: BarChart3,
    color: '#6366f1',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/50',
    bgGlow: 'rgba(99,102,241,0.15)',
    kpi: { label: 'Активних симуляцій', value: 8, suffix: '' },
    sparkData: [2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8],
    status: 'ACTIVE_WAR',
    route: '/wargaming',
  },
];

// ─── Глобальні KPI ────────────────────────────────────────────────────────────
const globalKpis = [
  { label: 'МОДУЛІВ', value: 6, suffix: '', icon: Brain, color: '#f59e0b' },
  { label: 'ДЖЕРЕЛ', value: 142, suffix: '', icon: Activity, color: '#10b981' },
  { label: 'ПОКРИТТЯ', value: 14.2, suffix: 'M', icon: Shield, decimals: 1, color: '#e11d48' },
  { label: 'ОНОВЛЕННЯ', value: 8, suffix: 'сек', icon: Zap, color: '#06b6d4' },
];

/**
 * 🌪️ TORNADO INSIGHTS SHELL // СТРАТЕГІЧНИЙ РАДАР | v61.0-ELITE
 * Ядро стратегічної розвідки та прогнозування PREDATOR.
 */
export const TornadoInsightsShell: React.FC = () => {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* ─── ЗАГОЛОВОК ───────────────────────────────────────────────── */}
      <ViewHeader
        title="TORNADO INSIGHTS"
        subtitle="Автономна система стратегічної розвідки. Прогнозування, аналіз ринку, граф зв'язків та захист від ризиків."
        icon={Radar}
        breadcrumbs={['PREDATOR', 'AI CORE', 'TORNADO INSIGHTS']}
        badges={[
          { label: 'v63.0-ELITE', color: 'amber', icon: <Sparkles size={10} /> },
          { label: 'SOVEREIGN', color: 'success', icon: <Shield size={10} /> },
        ]}
        stats={globalKpis.map(k => ({
          label: k.label,
          value: `${k.value}${k.suffix}`,
          icon: <k.icon size={16} />,
          color: 'gold' as const,
        }))}
      />

      {/* ─── МОДУЛІ (6 карток) ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {modules.map((mod, idx) => {
          const Icon = mod.icon;
          const isHovered = hoveredModule === mod.id;

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setHoveredModule(mod.id)}
              onMouseLeave={() => setHoveredModule(null)}
              className={cn(
                'group relative rounded-[2rem] border bg-black/50  overflow-hidden cursor-pointer transition-all duration-500 shadow-2xl',
                mod.borderColor,
                isHovered && 'scale-[1.02] shadow-[0_20px_60px_rgba(0,0,0,0.5)]'
              )}
            >
              {/* Фоновий glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  background: `radial-gradient(ellipse at top left, ${mod.bgGlow}, transparent 60%)`,
                }}
              />
              {/* Сканлайн */}
              <motion.div
                className="absolute left-0 right-0 h-px opacity-0 group-hover:opacity-100"
                style={{ background: `linear-gradient(90deg, transparent, ${mod.color}40, transparent)` }}
                animate={isHovered ? { top: ['0%', '100%'] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />

              <div className="relative z-10 p-6">
                {/* Верхній рядок: іконка + статус */}
                <div className="flex items-start justify-between mb-5">
                  <div className="relative">
                    <div
                      className="absolute inset-0 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-60 transition-opacity duration-700"
                      style={{ background: mod.color }}
                    />
                    <div
                      className="relative w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110"
                      style={{
                        background: `${mod.color}15`,
                        borderColor: `${mod.color}40`,
                      }}
                    >
                      <Icon
                        size={28}
                        style={{ color: mod.color }}
                        className="drop-shadow-lg"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full "
                      style={{
                        background: mod.color,
                        boxShadow: `0 0 8px ${mod.color}`,
                      }}
                    />
                    <span
                      className="text-[9px] font-black uppercase tracking-[0.2em] italic"
                      style={{ color: `${mod.color}cc` }}
                    >
                      {mod.status}
                    </span>
                  </div>
                </div>

                {/* Заголовок */}
                <h3
                  className="text-lg font-black uppercase tracking-tight italic mb-1 transition-colors duration-300"
                  style={{ color: isHovered ? mod.color : '#ffffff' }}
                >
                  {mod.title}
                </h3>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] italic mb-3">
                  {mod.subtitle}
                </div>

                {/* Опис */}
                <p className="text-[11px] text-slate-400 leading-relaxed mb-5 min-h-[40px]">
                  {mod.description}
                </p>

                {/* KPI + Спарклайн */}
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.25em] italic mb-1">
                      {mod.kpi.label}
                    </div>
                    <AnimatedCounter
                      target={mod.kpi.value}
                      suffix={mod.kpi.suffix}
                      prefix={mod.kpi.prefix}
                      decimals={mod.kpi.decimals}
                      className="text-2xl font-black font-mono italic"
                      // @ts-ignore inline style
                    />
                    <style>{`.group:hover [data-counter="${mod.id}"] { color: ${mod.color} }`}</style>
                  </div>
                  <MicroSparkline data={mod.sparkData} color={mod.color} />
                </div>

                {/* Кнопка переходу */}
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                    {mod.route}
                  </span>
                  <motion.div
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ color: mod.color }}
                    whileHover={{ x: 4 }}
                  >
                    ВІДКРИТИ <ArrowUpRight size={12} />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── НИЖНІЙ СТАТУС ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-between px-8 py-4 bg-black/30  rounded-[2rem] border border-white/5"
      >
        <div className="flex items-center gap-4">
          <Crosshair size={16} className="text-amber-500/60 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
            TORNADO_ENGINE // ВСЬОГО МОДУЛІВ: <span className="text-amber-500">6</span> // АКТИВНИХ: <span className="text-emerald-500">6</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500  " />
          <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-[0.2em] italic">
            ВСІ СИСТЕМИ НОРМА
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default TornadoInsightsShell;
