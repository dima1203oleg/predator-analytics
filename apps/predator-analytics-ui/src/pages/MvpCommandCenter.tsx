/**
 * MvpCommandCenter — ПОКРАЩЕНА ВЕРСІЯ
 * Командний центр з real-time метриками, красивим дизайном та інтерактивними елементами
 * Python: 3.12 | Українська мова | ТЗ 11.3
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Zap,
  BarChart3,
  Users,
  Award,
  Rocket,
  Lightbulb,
} from 'lucide-react';
import { getVisibleNavigation, navAccentStyles } from '@/config/navigation';
import { getRoleDisplayName } from '@/config/roles';
import { useUser } from '@/context/UserContext';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';

// ============ ДАНІ ============

const KPI_METRICS = [
  { label: 'Активні користувачі', value: '1,247', change: '+12.5%', icon: Users, color: 'emerald' },
  { label: 'Запуски сценаріїв', value: '34,821', change: '+28.3%', icon: PlayCircle, color: 'cyan' },
  { label: 'Середня економія', value: '₴847K', change: '+45.2%', icon: TrendingDown, color: 'amber' },
  { label: 'Коефіцієнт конверсії', value: '28.4%', change: '+5.1%', icon: Target, color: 'violet' },
];

const REAL_TIME_SCENARIOS = [
  {
    id: 1,
    company: 'ТОВ Логіст Україна',
    scenario: 'Оптимізація закупівель',
    savings: 345000,
    confidence: 92,
    status: 'success',
    timestamp: 'Щойно',
  },
  {
    id: 2,
    company: 'ПАТ Імпорт Plus',
    scenario: 'Аудит контрагента',
    savings: 0,
    confidence: 78,
    status: 'success',
    timestamp: '2 хв тому',
  },
  {
    id: 3,
    company: 'ООО Трейдинг Київ',
    scenario: 'Аналіз ризику',
    savings: 0,
    confidence: 65,
    status: 'running',
    timestamp: 'Зараз виконується',
  },
];

const DATA_STRATEGY = [
  {
    icon: Database,
    title: 'Критичні джерела',
    description: 'Митні декларації та санкційні списки оновлюються щодня',
    badge: 'Щодня',
    color: 'emerald',
    count: '125K',
  },
  {
    icon: RefreshCw,
    title: 'Вторинні джерела',
    description: 'Комерційні бази імпорту та логістичні тарифи',
    badge: 'Щотижня',
    color: 'cyan',
    count: '50K+',
  },
  {
    icon: FileCheck2,
    title: 'Валідація економії',
    description: 'Confidence score + припущення + disclaimer',
    badge: 'Довіра',
    color: 'amber',
    count: '98%',
  },
  {
    icon: Scale,
    title: 'Fallback-режим',
    description: 'Діапазон замість неточної цифри',
    badge: 'Безпека',
    color: 'violet',
    count: '100%',
  },
];

const MONETIZATION = [
  {
    icon: WalletCards,
    title: 'Підписка',
    description: 'Basic, Pro, Enterprise',
    price: 'від $299',
    color: 'bg-emerald-600/20 border-emerald-500/30',
  },
  {
    icon: BadgePercent,
    title: '% від економії',
    description: 'Комісія від результату',
    price: '5-8%',
    color: 'bg-cyan-600/20 border-cyan-500/30',
  },
  {
    icon: CreditCard,
    title: 'Оплата за дію',
    description: 'Фіксована вартість',
    price: '$99+',
    color: 'bg-amber-600/20 border-amber-500/30',
  },
];

// ============ КОМПОНЕНТ ============

export default function MvpCommandCenter() {
  const { user } = useUser();
  const { status } = useBackendStatus();
  const [selectedMetric, setSelectedMetric] = useState(0);

  const navigation = useMemo(() => getVisibleNavigation(user?.role || 'viewer', user?.tier || 'basic'), [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ===== ЗАГОЛОВОК ===== */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                🎯 Командний центр
              </h1>
              <p className="text-slate-400 text-lg mt-1">
                Добро пожалувати, {user?.name || 'користувач'}! ({getRoleDisplayName(user?.role || 'viewer')} • {user?.tier?.toUpperCase() || 'BASIC'})
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">{status === 'online' ? '🟢 В мережі' : '🔴 Відключено'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== KPI МЕТРИКИ ===== */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {KPI_METRICS.map((metric, idx) => {
            const Icon = metric.icon;
            const colorClass = {
              emerald: 'from-emerald-600/20 to-emerald-500/10 border-emerald-500/30 text-emerald-400',
              cyan: 'from-cyan-600/20 to-cyan-500/10 border-cyan-500/30 text-cyan-400',
              amber: 'from-amber-600/20 to-amber-500/10 border-amber-500/30 text-amber-400',
              violet: 'from-violet-600/20 to-violet-500/10 border-violet-500/30 text-violet-400',
            }[metric.color];

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedMetric(idx)}
                className="cursor-pointer group"
              >
                <div
                  className={`p-6 rounded-xl border bg-gradient-to-br ${colorClass} hover:shadow-xl transition-all duration-300 hover:scale-105`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="text-xs font-bold px-2 py-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                      {metric.change}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{metric.label}</p>
                  <p className="text-4xl font-black text-white">{metric.value}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ===== LIVE СЦЕНАРІЇ ===== */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-cyan-400" />
              Live сценарії
            </h2>
            <Link
              to="/execution-center-v2"
              className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Переглянути все <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-2">
            {REAL_TIME_SCENARIOS.map((scenario, idx) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className={cn(
                  'p-4 rounded-lg border transition-all group',
                  scenario.status === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                    : scenario.status === 'running'
                    ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-slate-800/40 border-slate-700/50',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{scenario.company}</p>
                    <p className="text-sm text-slate-400">{scenario.scenario}</p>
                  </div>
                  <div className="text-right space-y-1">
                    {scenario.savings > 0 && (
                      <p className="font-bold text-emerald-400">
                        +₴{(scenario.savings / 1000).toFixed(0)}K
                      </p>
                    )}
                    <p className="text-xs text-slate-500">{scenario.timestamp}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <div
                        className="w-16 h-2 bg-slate-700/50 rounded-full overflow-hidden"
                      >
                        <motion.div
                          className={cn(
                            'h-full',
                            scenario.confidence >= 80
                              ? 'bg-emerald-500'
                              : scenario.confidence >= 60
                              ? 'bg-amber-500'
                              : 'bg-rose-500',
                          )}
                          style={{ width: `${scenario.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">{scenario.confidence}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ===== DATA STRATEGY ===== */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-400" />
            Стратегія даних
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {DATA_STRATEGY.map((item, idx) => {
              const Icon = item.icon;
              const colorClass = {
                emerald: 'from-emerald-600/20 border-emerald-500/30',
                cyan: 'from-cyan-600/20 border-cyan-500/30',
                amber: 'from-amber-600/20 border-amber-500/30',
                violet: 'from-violet-600/20 border-violet-500/30',
              }[item.color];

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.08 }}
                  className={`p-5 rounded-lg border bg-gradient-to-br ${colorClass} hover:shadow-lg transition-all group`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-6 h-6 text-slate-300 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold px-2 py-1 rounded bg-white/10 group-hover:bg-white/20">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{item.description}</p>
                  <p className="text-lg font-black text-white opacity-60">{item.count}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ===== МОНЕТИЗАЦІЯ ===== */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <WalletCards className="w-6 h-6 text-cyan-400" />
            Модель монетизації
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MONETIZATION.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  className={`p-6 rounded-lg border ${item.color} hover:shadow-lg transition-all group cursor-pointer`}
                >
                  <Icon className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                  <p className="text-sm text-slate-400 mb-4 flex-1">{item.description}</p>
                  <p className="text-2xl font-black text-white">{item.price}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ===== НАВІГАЦІЯ ===== */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-2xl font-bold text-white">🗺️ Розділи платформи</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {navigation
              .filter(section => section.items && section.items.length > 0)
              .slice(0, 6)
              .map((section, sectionIdx) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + sectionIdx * 0.08 }}
                  className="p-5 rounded-lg border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all group"
                >
                  <h3 className="font-bold text-white mb-3 text-lg flex items-center gap-2 group-hover:text-cyan-300 transition-colors">
                    {section.label}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">{section.description}</p>
                  <ul className="space-y-1">
                    {section.items?.slice(0, 3).map((item) => (
                      <li key={item.id} className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                        • {item.label}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
          </div>
        </motion.div>

        {/* ===== FOOTER ===== */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-600/10 to-emerald-600/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Готові почати?
              </h3>
              <p className="text-sm text-slate-400">
                Запустіть демо-режим або завантажте власні дані для першого аналізу
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/procurement-optimizer"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center gap-2 transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                Розпочати
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
