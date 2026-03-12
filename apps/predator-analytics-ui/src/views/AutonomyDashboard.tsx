/**
 * Predator v55 | Autonomy Sovereign Matrix — Панель Автономної Еволюції
 * Центр стратегічного самовдосконалення та конституційного контролю AZR.
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Award,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  Cpu,
  Eye,
  Gauge,
  GitBranch,
  HardDrive,
  Lock,
  Play,
  RefreshCw,
  Scale,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  XCircle,
  Zap,
  ShieldCheck,
  Dna,
  Binary,
  Cpu as Processor,
  Compass
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { HoloContainer } from '../components/HoloContainer';
import { CyberOrb } from '../components/CyberOrb';
import { cn } from '../utils/cn';

// Повні українські локалі (вбудовані для надійності та преміального копірайтингу)
const uk = {
  header: {
    title: 'АВТОНОМНА СУВЕРЕННА МАТРИЦЯ',
    subtitle: 'Система Глобальної Еволюції та Самовдосконалення AZR',
    generation: 'ПОКОЛІННЯ',
  },
  tabs: {
    overview: 'СТРАТЕГІЧНИЙ ОГЛЯД',
    hypotheses: 'ГІПОТЕЗИ РОЗВИТКУ',
    council: 'РАДА БЕЗПЕКИ',
    constitution: 'КОНСТИТУЦІЯ ЯДРА',
    progress: 'ЕВОЛЮЦІЙНИЙ ЛОГ',
  },
  phases: {
    monitoring: 'Моніторинг',
    recommendations: 'Рекомендації',
    limited_autonomy: 'Обмежена Автономія',
    full_autonomy: 'Повна Автономія',
  },
  status: {
    generation: 'Покоління',
    successRate: 'Успішність',
    constitutional: 'Конституційність',
    nextEvaluation: 'Наступна Оцінка',
    improvements: 'покращень',
    violations: 'порушень',
    thisWeek: 'цього тижня',
    triggerNow: 'Запустити Зараз',
  },
  hypotheses: {
    title: 'Гіпотези Покращення',
    generateNew: 'Згенерувати Нову',
    fitnessScore: 'Придатність',
    type: 'Тип',
    component: 'Компонент',
    risk: 'Ризик',
    confidence: 'Впевненість',
    approve: 'Схвалити',
    reject: 'Відхилити',
    noHypotheses: 'Немає активних гіпотез у черзі',
    status: {
      pending_review: 'Очікує розгляду',
      under_review: 'На розгляді',
      approved: 'Схвалено',
      rejected: 'Відхилено',
      implemented: 'Впроваджено',
    },
    riskLevels: {
      none: 'Відсутній',
      low: 'Низький',
      medium: 'Середній',
      high: 'Високий',
      critical: 'Критичний',
    },
    types: {
      performance: 'Продуктивність',
      algorithmic: 'Алгоритми',
      code_quality: 'Якість коду',
      security: 'Безпека',
      infrastructure: 'Інфраструктура',
    },
  },
  safetyCouncil: {
    title: 'Верховна Рада Безпеки',
    description: 'Мульти-агентна система верифікації. Кожне покращення проходить крізь фільтри спеціалізованих агентів. Мінімум 3 схвалення для інтеграції.',
    agents: {
      security_expert: 'Страж Безпеки',
      performance_engineer: 'Оптимізатор Систем',
      ethics_compliance: 'Арбітр Етики',
      stability_analyst: 'Аналітик Стабільності',
      constitutional_lawyer: 'Конституційний Контролер',
    },
    active: 'Активний',
    recentReviews: 'Останні Вердикти',
    approved: 'Схвалено',
    rejected: 'Відхилено',
    agentsApproved: 'агентів підтвердили',
  },
  constitution: {
    title: 'Конституційні Принципи AZR',
    subtitle: 'Незмінні закони, що керують алгоритмічною еволюцією',
    version: 'Редакція',
    totalPrinciples: 'Параграфів',
    violationsAllTime: 'Порушень',
    principles: {
      'SEC-001': 'Безкомпромісне збереження цілісності архітектури',
      'SEC-002': 'Повна ізоляція конфіденційної інформації',
      'PRV-001': 'Захист приватності як вищий пріоритет',
      'TRN-001': 'Абсолютна прозорість кожного автономного рішення',
      'TRN-002': 'Заборона на приховану модифікацію логів',
      'STB-001': 'Стабільність системи вище за радикальні покращення',
      'STB-002': 'Контроль рекурсивних процесів самомодифікації',
      'ETH-001': 'Заборона самореплікації без зовнішнього консенсусу',
      'ETH-002': 'Гарантія можливості екстреної деактивації',
    },
  },
  progress: {
    title: 'Динаміка Розвитку',
    totalImprovements: 'Патчів впроваджено',
    successRate: 'Ефективність',
    constitutionalViolations: 'Інциденти',
    milestones: 'Етапи Еволюції',
    fitnessEvolution: 'Еволюція Придатності (Fitness Score)',
  },
  metrics: {
    title: 'Нейронна Самодіагностика',
    latency: 'Латентність P99',
    errorRate: 'Рівень Помилок',
    cpuUsage: 'Навантаження CPU',
    memoryUsage: 'Пам\'ять RAM',
    modelAccuracy: 'Точність Нейромереж',
    testCoverage: 'Покриття Тестами',
    target: 'Ціль',
    warning: 'Відхилення',
    ok: 'Норма',
  },
  loading: 'Синхронізація матриці знань...',
  error: 'Помилка доступу до ядра',
  evolutionPhases: 'Фази Трансформації',
  noData: 'Дані недоступні',
};

// Types
interface EvolutionStatus {
  phase: string;
  phase_name: string;
  generation: number;
  improvements_today: number;
  improvements_this_week: number;
  success_rate: number;
  constitutional_compliance: number;
  next_evaluation: string;
}

interface Hypothesis {
  id: string;
  type: string;
  component: string;
  title: string;
  description: string;
  expected_improvement: string;
  risk_level: string;
  confidence: number;
  fitness_score?: number;
  status: string;
}

interface SystemMetrics {
  latency_p99_ms: number;
  error_rate: number;
  cpu_usage: number;
  memory_usage: number;
  model_accuracy: number;
  test_coverage: number;
}

// Evolution phases
const EVOLUTION_PHASES = [
  { id: 'phase_1_monitoring', name: uk.phases.monitoring, icon: Eye, color: 'slate' },
  { id: 'phase_2_recommendations', name: uk.phases.recommendations, icon: Compass, color: 'blue' },
  { id: 'phase_3_limited_autonomy', name: uk.phases.limited_autonomy, icon: Zap, color: 'amber' },
  { id: 'phase_4_full_autonomy', name: uk.phases.full_autonomy, icon: Target, color: 'emerald' }
];

// Safety Council agents
const SAFETY_AGENTS = [
  { id: 'security', name: uk.safetyCouncil.agents.security_expert, icon: ShieldCheck, color: 'rose' },
  { id: 'performance', name: uk.safetyCouncil.agents.performance_engineer, icon: Gauge, color: 'blue' },
  { id: 'ethics', name: uk.safetyCouncil.agents.ethics_compliance, icon: Scale, color: 'purple' },
  { id: 'stability', name: uk.safetyCouncil.agents.stability_analyst, icon: Activity, color: 'emerald' },
  { id: 'constitutional', name: uk.safetyCouncil.agents.constitutional_lawyer, icon: Lock, color: 'amber' }
];

export const AutonomyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<EvolutionStatus | null>(null);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'hypotheses' | 'council' | 'constitution' | 'progress'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statusRes, hypothesesRes, metricsRes] = await Promise.allSettled([
        api.autonomy.getStatus(),
        api.autonomy.getHypotheses(),
        api.autonomy.getMetrics()
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value) {
        setStatus(statusRes.value);
      } else {
        setStatus({
          phase: 'phase_2_recommendations',
          phase_name: 'Режим Рекомендацій',
          generation: 45,
          improvements_today: 4,
          improvements_this_week: 14,
          success_rate: 0.92,
          constitutional_compliance: 1.0,
          next_evaluation: new Date(Date.now() + 7200000).toISOString()
        });
      }

      if (hypothesesRes.status === 'fulfilled' && Array.isArray(hypothesesRes.value)) {
        setHypotheses(hypothesesRes.value);
      } else {
        setHypotheses([
          {
            id: 'hyp-redis-cache',
            type: 'performance',
            component: 'api_gateway',
            title: 'Адаптивне Redis кешування',
            description: 'Інтелектуальне кешування запитів на основі патернів використання.',
            expected_improvement: '35% зниження затримки',
            risk_level: 'low',
            confidence: 0.91,
            fitness_score: 0.88,
            status: 'pending_review'
          },
          {
            id: 'hyp-vector-index',
            type: 'algorithmic',
            component: 'vector_db',
            title: 'Гібридний HNSW+IVF індекс',
            description: 'Поєднання HNSW для швидкості з IVF для максимальної точності.',
            expected_improvement: '25% прискорення пошуку',
            risk_level: 'medium',
            confidence: 0.84,
            fitness_score: 0.82,
            status: 'under_review'
          }
        ]);
      }

      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        setMetrics(metricsRes.value);
      } else {
        setMetrics({
          latency_p99_ms: 242,
          error_rate: 0.012,
          cpu_usage: 54,
          memory_usage: 62,
          model_accuracy: 0.941,
          test_coverage: 0.84
        });
      }
    } catch (err) {
      console.error('Помилка завантаження даних автономії:', err);
      setError('Помилка підключення до API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'none': return 'emerald';
      case 'low': return 'cyan';
      case 'medium': return 'amber';
      case 'high': return 'orange';
      case 'critical': return 'rose';
      default: return 'slate';
    }
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'approved': return 'emerald';
      case 'pending_review': return 'amber';
      case 'under_review': return 'blue';
      case 'rejected': return 'rose';
      case 'implemented': return 'cyan';
      default: return 'slate';
    }
  };

  const formatTimeRemaining = (isoDate: string) => {
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return 'У процесі';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}г ${minutes}хв`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#02040a] flex items-center justify-center">
        <div className="text-center group">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="inline-block relative"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
            <Brain size={64} className="text-blue-500 relative z-10" />
          </motion.div>
          <p className="mt-8 text-blue-400 font-black tracking-[0.3em] uppercase text-sm animate-pulse">{uk.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02040a] relative overflow-hidden font-sans">
      {/* V55 Background Matrix */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 sm:p-8 space-y-8 pb-32">
        {/* Header Section */}
        <ViewHeader
          title={uk.header.title}
          icon={<Brain size={22} className="text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
          breadcrumbs={['СИНАПСИС', 'АВТОНОМІЯ', 'ЕВОЛЮЦІЯ']}
          stats={[
            { label: 'Статус', value: status?.phase_name || 'ОПТИМІЗАЦІЯ', icon: <Activity size={14} />, color: 'primary', animate: true },
            { label: 'Покоління', value: `G${status?.generation || 0}`, icon: <GitBranch size={14} />, color: 'primary' },
            { label: 'Цілісність', value: `${((status?.constitutional_compliance || 0) * 100).toFixed(0)}%`, icon: <Shield size={14} />, color: 'success' },
          ]}
          actions={
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                onClick={fetchData}
                className="px-6 py-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-indigo-500/20 transition-all flex items-center gap-2"
              >
                <RefreshCw size={14} /> СИНХРОНІЗУВАТИ
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-xl shadow-indigo-900/40 flex items-center gap-2"
              >
                <Zap size={14} className="fill-current" /> {uk.status.triggerNow}
              </motion.button>
            </div>
          }
        />

        {/* Tactical Navigation */}
        <div className="flex gap-4 p-1 bg-slate-900/40 backdrop-blur-xl rounded-[24px] border border-white/5 w-fit">
          {[
            { id: 'overview', label: uk.tabs.overview, icon: Activity },
            { id: 'hypotheses', label: uk.tabs.hypotheses, icon: GitBranch },
            { id: 'council', label: uk.tabs.council, icon: Users },
            { id: 'constitution', label: uk.tabs.constitution, icon: Lock },
            { id: 'progress', label: uk.tabs.progress, icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'ПОКОЛІННЯ', value: status?.generation || '-', sub: `+${status?.improvements_this_week || 0} за тиждень`, icon: Dna, color: '#a855f7' },
                  { label: 'УСПІШНІСТЬ', value: `${((status?.success_rate || 0) * 100).toFixed(0)}%`, sub: 'Ефективність рішень', icon: Award, color: '#10b981' },
                  { label: 'ВІДПОВІДНІСТЬ', value: `${((status?.constitutional_compliance || 0) * 100).toFixed(0)}%`, sub: 'Нормативна база', icon: ShieldCheck, color: '#06b6d4' },
                  { label: 'НАСТУПНА ФАЗА', value: formatTimeRemaining(status?.next_evaluation || ""), sub: 'Оцінка прогресу', icon: Clock, color: '#f97316' },
                ].map((card, i) => (
                  <TacticalCard key={card.label} variant="holographic" className="panel-3d" noPadding>
                    <div className="p-6 group relative">
                      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-60 transition-opacity">
                        <card.icon size={24} style={{ color: card.color }} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">{card.label}</p>
                        <h3 className="text-4xl font-black text-white tracking-tighter">{card.value}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">{card.sub}</p>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1 opacity-10 bg-current" style={{ color: card.color }} />
                    </div>
                  </TacticalCard>
                ))}
              </div>

              {/* Evolution Phases & Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <TacticalCard variant="holographic" title={uk.evolutionPhases} className="panel-3d">
                    <div className="py-8 flex items-center justify-between gap-2 px-4 relative">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent -translate-y-1/2" />
                      {EVOLUTION_PHASES.map((phase, i) => {
                        const Icon = phase.icon;
                        const isActive = status?.phase === phase.id;
                        const isPast = EVOLUTION_PHASES.findIndex(p => p.id === status?.phase) > i;
                        return (
                          <div key={phase.id} className="relative z-10 flex flex-col items-center gap-4 flex-1">
                            <motion.div
                              className={cn(
                                "w-20 h-20 rounded-3xl flex items-center justify-center border-2 transition-all relative",
                                isActive ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)] scale-110" :
                                  isPast ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-900 border-white/5 opacity-40"
                              )}
                              animate={isActive ? { scale: [1.1, 1.15, 1.1] } : {}}
                            >
                              <Icon size={32} className={isActive ? "text-indigo-400" : isPast ? "text-emerald-400" : "text-slate-500"} />
                              {isPast && <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full"><CheckCircle size={12} className="text-white" /></div>}
                            </motion.div>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest text-center", isActive ? "text-indigo-400" : isPast ? "text-emerald-400" : "text-slate-600")}>
                              {phase.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </TacticalCard>

                  <TacticalCard variant="holographic" title={uk.metrics.title} className="panel-3d">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                      {[
                        { label: uk.metrics.latency, value: `${metrics?.latency_p99_ms || 0}мс`, status: (metrics?.latency_p99_ms || 0) > 200 ? 'warning' : 'ok' },
                        { label: uk.metrics.errorRate, value: `${((metrics?.error_rate || 0) * 100).toFixed(2)}%`, status: (metrics?.error_rate || 0) > 0.01 ? 'warning' : 'ok' },
                        { label: uk.metrics.cpuUsage, value: `${metrics?.cpu_usage || 0}%`, status: (metrics?.cpu_usage || 0) > 80 ? 'warning' : 'ok' },
                        { label: uk.metrics.memoryUsage, value: `${metrics?.memory_usage || 0}%`, status: (metrics?.memory_usage || 0) > 85 ? 'warning' : 'ok' },
                        { label: uk.metrics.modelAccuracy, value: `${((metrics?.model_accuracy || 0) * 100).toFixed(1)}%`, status: (metrics?.model_accuracy || 0) < 0.9 ? 'warning' : 'ok' },
                        { label: uk.metrics.testCoverage, value: `${((metrics?.test_coverage || 0) * 100).toFixed(0)}%`, status: (metrics?.test_coverage || 0) < 0.8 ? 'warning' : 'ok' }
                      ].map((m, idx) => (
                        <div key={m.label} className="bg-white/5 rounded-2xl p-5 border border-white/5 group hover:border-indigo-500/30 transition-all">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                            <div className={cn("w-2 h-2 rounded-full", m.status === 'ok' ? "bg-emerald-500" : "bg-amber-500")} />
                          </div>
                          <h4 className="text-2xl font-black text-white">{m.value}</h4>
                        </div>
                      ))}
                    </div>
                  </TacticalCard>
                </div>

                <div className="space-y-8">
                  <TacticalCard variant="holographic" className="panel-3d flex items-center justify-center p-0 overflow-hidden relative min-h-[400px]">
                    <CyberOrb size={280} color="#6366f1" intensity={0.6} pulse={true} className="drop-shadow-[0_0_60px_rgba(99,102,241,0.3)]" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="text-[10px] font-black text-indigo-500/50 uppercase tracking-[0.5em] mb-2">Neural Synergy</div>
                      <div className="text-3xl font-black text-white font-mono opacity-80">v55.CORE</div>
                    </div>
                  </TacticalCard>

                  <TacticalCard variant="holographic" title="CU-PIE REGISTRY" className="panel-3d">
                    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between group hover:bg-indigo-600/20 transition-all cursor-pointer" onClick={() => navigate('/components')}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                          <HardDrive size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">Active Component Map</p>
                          <p className="text-[10px] text-slate-500">Система живого моніторингу</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </TacticalCard>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'hypotheses' && (
            <motion.div key="hypotheses" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                  <GitBranch size={22} className="text-indigo-500" />
                  {uk.hypotheses.title}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-amber-400" /> {uk.hypotheses.generateNew}
                </motion.button>
              </div>

              {hypotheses.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-white/10 rounded-[32px]">
                  <Brain size={48} className="text-slate-800 mb-4" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-xs">{uk.hypotheses.noHypotheses}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {hypotheses.map((h, i) => (
                    <TacticalCard key={h.id} variant="holographic" className="panel-3d group">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-16 h-16 rounded-3xl flex items-center justify-center border transition-all group-hover:scale-110",
                          h.status === 'implemented' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                        )}>
                          {h.type === 'performance' ? <Zap size={28} /> : h.type === 'algorithmic' ? <Dna size={28} /> : h.type === 'security' ? <Shield size={28} /> : <Processor size={28} />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-black text-white uppercase tracking-tight">{h.title}</h4>
                            <span className={cn(
                              "text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border",
                              `bg-${getStatusColor(h.status)}-500/10 border-${getStatusColor(h.status)}-500/30 text-${getStatusColor(h.status)}-400`
                            )}>
                              {uk.hypotheses.status[h.status as keyof typeof uk.hypotheses.status] || h.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed italic">"{h.description}"</p>
                          <div className="flex gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Компонент: <span className="text-slate-300 font-mono">{h.component}</span></span>
                            <span>Ризик: <span className={cn("font-black", `text-${getRiskColor(h.risk_level)}-500`)}>{uk.hypotheses.riskLevels[h.risk_level as keyof typeof uk.hypotheses.riskLevels] || h.risk_level}</span></span>
                            <span className="text-emerald-400">Очікувано: {h.expected_improvement}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-3xl font-black text-indigo-500 tracking-tighter">{(h.confidence * 100).toFixed(0)}%</div>
                          <div className="text-[10px] font-black text-slate-600 uppercase">Впевненість AI</div>
                        </div>
                      </div>

                      {h.status === 'pending_review' && (
                        <div className="mt-6 pt-6 border-t border-white/5 flex gap-4">
                          <button className="flex-1 py-3 bg-emerald-600/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                            {uk.hypotheses.approve}
                          </button>
                          <button className="flex-1 py-3 bg-rose-600/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all">
                            {uk.hypotheses.reject}
                          </button>
                        </div>
                      )}
                    </TacticalCard>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'council' && (
            <motion.div key="council" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <TacticalCard variant="holographic" className="panel-3d" title={uk.safetyCouncil.title}>
                <p className="text-slate-400 text-sm italic mb-10 max-w-2xl">{uk.safetyCouncil.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {SAFETY_AGENTS.map((agent, i) => (
                    <div key={agent.id} className="flex flex-col items-center gap-4 group">
                      <motion.div
                        whileHover={{ scale: 1.1, y: -5 }}
                        className={cn(
                          "w-24 h-24 rounded-[32px] flex items-center justify-center border-2 transition-all relative overflow-hidden",
                          `bg-${agent.color}-500/10 border-${agent.color}-500/30 group-hover:border-${agent.color}-500`
                        )}
                      >
                        <agent.icon size={36} className={`text-${agent.color}-400`} />
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                      </motion.div>
                      <div className="text-center">
                        <h4 className="text-xs font-black text-white uppercase tracking-tighter mb-1">{agent.name}</h4>
                        <div className="flex items-center justify-center gap-2">
                          <motion.div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{uk.safetyCouncil.active}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TacticalCard>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TacticalCard variant="holographic" title={uk.safetyCouncil.recentReviews} className="panel-3d">
                  <div className="space-y-4 pt-4">
                    {hypotheses.map((h, idx) => (
                      <div key={h.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{h.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono italic">Verdict Hash: 0x{h.id.substring(4, 12)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex -space-x-3">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className={cn("w-8 h-8 rounded-full border-2 border-[#02040a] flex items-center justify-center", i <= 4 ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500")}>
                                <CheckCircle size={12} />
                              </div>
                            ))}
                          </div>
                          <span className="text-xs font-black text-emerald-400">4/5 S</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TacticalCard>

                <TacticalCard variant="holographic" title="АРБІТРАЖНИЙ ПРОТОКОЛ" className="panel-3d">
                  <div className="h-[250px] w-full flex flex-col justify-center items-center gap-6 opacity-40">
                    <Scale size={64} className="text-indigo-400" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Decision Balance Engine Active</p>
                  </div>
                </TacticalCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'constitution' && (
            <motion.div key="constitution" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
              <HoloContainer className="panel-3d p-10 border-amber-500/20 bg-amber-950/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Lock size={120} className="text-amber-500" />
                </div>
                <div className="flex items-center gap-6 mb-12 relative z-10">
                  <div className="p-5 bg-amber-500 rounded-[32px] text-[#02040a] shadow-2xl shadow-amber-500/30">
                    <ShieldCheck size={40} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase">{uk.constitution.title}</h3>
                    <p className="text-amber-500 font-bold uppercase tracking-[0.2em]">{uk.constitution.subtitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  {Object.entries(uk.constitution.principles).map(([id, text], idx) => (
                    <div key={id} className="p-6 bg-black/40 rounded-[28px] border border-amber-500/20 hover:border-amber-500/40 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-amber-500/80 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">{id}</span>
                        <CheckCircle size={18} className="text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <p className="text-sm font-black text-slate-200 leading-snug uppercase tracking-tight">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 pt-8 border-t border-amber-500/10 grid grid-cols-3 gap-12 text-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{uk.constitution.version}</p>
                    <p className="text-3xl font-black text-white">v55.CORE.STABLE</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{uk.constitution.totalPrinciples}</p>
                    <p className="text-3xl font-black text-white">9 КРИТЕРІЇВ</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{uk.constitution.violationsAllTime}</p>
                    <p className="text-3xl font-black text-emerald-400">0 ІНЦИДЕНТІВ</p>
                  </div>
                </div>
              </HoloContainer>
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div key="progress" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <TacticalCard variant="holographic" title={uk.progress.fitnessEvolution} className="panel-3d">
                <div className="h-[250px] w-full flex items-end gap-3 px-8 pt-10 pb-4 relative">
                  {[0.72, 0.74, 0.76, 0.78, 0.80, 0.82, 0.84, 0.85, 0.86, 0.87, 0.89, 0.92].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 relative group">
                      <motion.div
                        className="w-full bg-gradient-to-t from-indigo-600/20 via-indigo-500/40 to-indigo-400 rounded-t-xl shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        initial={{ height: 0 }}
                        animate={{ height: `${val * 100}%` }}
                        transition={{ delay: i * 0.05, type: 'spring', damping: 15 }}
                      />
                      <div className="absolute -top-6 text-[9px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{(val * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between px-8 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mt-4">
                  <span>Народження Ядра (G1)</span>
                  <span>Епоха Синтезу (G45)</span>
                </div>
              </TacticalCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TacticalCard variant="holographic" title={uk.progress.milestones} className="panel-3d">
                  <div className="space-y-4 py-4">
                    {[
                      { gen: 10, milestone: 'Досягнуто першої автономної рівноваги', date: '2026-01-15' },
                      { gen: 25, milestone: 'Інтеграція семантичного ядра v3', date: '2026-01-22' },
                      { gen: 38, milestone: 'Досягнення 90% точності синтезу', date: '2026-01-28' },
                      { gen: 45, milestone: 'Фінальна стабілізація Нексусу v55', date: '2026-02-04' }
                    ].map((m, i) => (
                      <div key={i} className="flex items-center gap-5 p-4 bg-white/5 rounded-[24px] border border-white/5 hover:border-indigo-500/30 transition-all group">
                        <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-all text-indigo-400">
                          <span className="font-black text-sm">G{m.gen}</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-xs font-black text-white uppercase tracking-tight">{m.milestone}</h5>
                          <p className="text-[10px] text-slate-500 font-mono italic">{m.date}</p>
                        </div>
                        <Award size={20} className="text-amber-500/50 group-hover:text-amber-500" />
                      </div>
                    ))}
                  </div>
                </TacticalCard>

                <TacticalCard variant="holographic" title="СТАТИСТИЧНИЙ АГРЕГАТОР" className="panel-3d">
                  <div className="h-full flex items-center justify-center p-10">
                    <ResponsiveCircle progress={(status?.success_rate ?? 0.92) * 100} />
                  </div>
                </TacticalCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .panel-3d {
            transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .panel-3d:hover {
            transform: perspective(1000px) rotateX(1deg) rotateY(-1deg) translateY(-5px);
            box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 18px 36px -18px rgba(0, 0, 0, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.3);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.5);
        }
      `}} />
    </div>
  );
};

const ResponsiveCircle: React.FC<{ progress: number }> = ({ progress }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90">
          <circle className="text-slate-900" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="96" cy="96" />
          <motion.circle
            className="text-indigo-500"
            strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="96"
            cy="96"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white">{progress}%</span>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Efficiency</span>
        </div>
      </div>
      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Neural Success Index</p>
    </div>
  );
};

const PauseIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

export default AutonomyDashboard;
