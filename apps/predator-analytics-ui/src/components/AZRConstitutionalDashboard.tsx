/**
 * 🏛️ AZR Constitutional Dashboard
 * Predator v45 | Neural Analytics*
 * Візуалізація системи AZR (Autonomous Zero-Risk Amendment Runtime):
 * - Статус Конституції
 * - Активні та запропоновані поправки
 * - Порушення аксіом
 * - Ризикова експозиція
 * - Статус арбітера
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TruthLedgerSection } from './TruthLedgerSection';
import {
  Shield,
  Scale,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Zap,
  Lock,
  Eye,
  FileText,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  BookOpen,
  BarChart3,
  Target,
  AlertOctagon
} from 'lucide-react';

// === ТИПИ ===
interface ConstitutionStatus {
  active: boolean;
  version: string;
  enforcement: string[];
  immutable_core_protected: boolean;
  no_ai_override_active: boolean;
}

interface Amendment {
  id: string;
  title: string;
  category: string;
  state: string;
  risk_level: string;
  risk_score?: number;
  created_at: string;
  approvals?: Record<string, { approved: boolean; unanimous: boolean }>;
}

interface Violation {
  id: string;
  axiom: string;
  severity: string;
  message: string;
  detected_at: string;
}

interface AZRMetrics {
  total_proposals: number;
  by_state: Record<string, number>;
  by_risk_level: Record<string, number>;
  constitutional_violations: number;
  rollback_rate: number;
}

// === КОНСТАНТИ ===
const AXIOMS = [
  { id: 9, name: "Закон обмеженого самовдосконалення", icon: Zap },
  { id: 10, name: "Закон недоторканності ядра", icon: Lock },
  { id: 11, name: "Закон повної обіцянки", icon: FileText },
  { id: 12, name: "Закон багатосторонньої відповідальності", icon: Scale },
  { id: 13, name: "Закон оберненого доказу", icon: Eye },
  { id: 14, name: "Закон часової незворотності", icon: Clock }
];

const RISK_COLORS = {
  LOW: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  MEDIUM: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  EXTREME: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' }
};

const STATE_LABELS: Record<string, string> = {
  PROPOSED: 'Запропоновано',
  VALIDATING: 'Валідація',
  SIMULATING: 'Симуляція',
  CHAOS_TESTING: 'Хаос-тест',
  AWAITING_APPROVAL: 'Очікує схвалення',
  APPROVED: 'Схвалено',
  DEPLOYING: 'Розгортання',
  ACTIVE: 'Активно',
  ROLLING_BACK: 'Відкат',
  ROLLED_BACK: 'Відкочено',
  REJECTED: 'Відхилено',
  COMPLETED: 'Завершено',
  FAILED: 'Помилка'
};

// === КОМПОНЕНТИ ===

const AxiomCard: React.FC<{ axiom: typeof AXIOMS[0]; violations: number }> = ({ axiom, violations }) => {
  const Icon = axiom.icon;
  const isViolated = violations > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        p-4 rounded-2xl border transition-all cursor-pointer
        ${isViolated
          ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50'
          : 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30'}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${isViolated ? 'bg-rose-500/20' : 'bg-slate-700/50'}`}>
          <Icon size={18} className={isViolated ? 'text-rose-400' : 'text-slate-400'} />
        </div>
        <div className="flex items-center gap-2">
          {isViolated ? (
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase rounded-lg border border-rose-500/30">
              {violations} порушень
            </span>
          ) : (
            <CheckCircle2 size={16} className="text-emerald-400" />
          )}
        </div>
      </div>
      <div className="text-xs font-bold text-white mb-1">Аксіома {axiom.id}</div>
      <div className="text-[10px] text-slate-500 line-clamp-1">{axiom.name}</div>
    </motion.div>
  );
};

const RiskGauge: React.FC<{ score: number }> = ({ score }) => {
  const percentage = Math.round(score * 100);
  const color = score < 0.3 ? 'emerald' : score < 0.5 ? 'amber' : score < 0.7 ? 'orange' : 'rose';

  return (
    <div className="relative">
      <svg className="w-32 h-32 -rotate-90">
        <circle
          className="text-slate-800"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r="52"
          cx="64"
          cy="64"
        />
        <circle
          className={`text-${color}-500`}
          strokeWidth="8"
          strokeDasharray={`${percentage * 3.27} 327`}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="52"
          cx="64"
          cy="64"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-black text-${color}-400`}>{percentage}%</span>
        <span className="text-[9px] text-slate-500 uppercase">Ризик</span>
      </div>
    </div>
  );
};

const AmendmentCard: React.FC<{ amendment: Amendment }> = ({ amendment }) => {
  const riskColor = RISK_COLORS[amendment.risk_level as keyof typeof RISK_COLORS] || RISK_COLORS.LOW;
  const stateLabel = STATE_LABELS[amendment.state] || amendment.state;

  const isActive = ['DEPLOYING', 'ACTIVE', 'SIMULATING', 'CHAOS_TESTING'].includes(amendment.state);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white truncate">{amendment.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-slate-500 font-mono">{amendment.id.substring(0, 8)}</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${riskColor.bg} ${riskColor.text}`}>
              {amendment.risk_level}
            </span>
          </div>
        </div>
        <div className={`
          flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase
          ${isActive
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            : 'bg-slate-800 text-slate-400 border border-slate-700'}
        `}>
          {isActive && <Activity size={10} className="animate-pulse" />}
          {stateLabel}
        </div>
      </div>

      {/* Прогрес схвалень */}
      {amendment.approvals && (
        <div className="flex items-center gap-1 mt-3">
          {['technical', 'security', 'business', 'arbiter'].map(committee => {
            const approval = amendment.approvals?.[committee];
            const status = approval?.approved
              ? (approval.unanimous ? 'unanimous' : 'approved')
              : 'pending';

            return (
              <div
                key={committee}
                className={`
                  flex-1 h-1.5 rounded-full
                  ${status === 'unanimous' ? 'bg-emerald-500' :
                    status === 'approved' ? 'bg-blue-500' :
                    'bg-slate-700'}
                `}
                title={`${committee}: ${status}`}
              />
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <span className="text-[10px] text-slate-500">
          {new Date(amendment.created_at).toLocaleDateString('uk-UA')}
        </span>
        {amendment.risk_score !== undefined && (
          <span className="text-[10px] text-slate-400 font-mono">
            Ризик: {(amendment.risk_score * 100).toFixed(1)}%
          </span>
        )}
      </div>
    </motion.div>
  );
};

// === ГОЛОВНИЙ КОМПОНЕНТ ===

export const AZRConstitutionalDashboard: React.FC = () => {
  const [constitution, setConstitution] = useState<ConstitutionStatus | null>(null);
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [metrics, setMetrics] = useState<AZRMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllAxioms, setShowAllAxioms] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [constitutionRes, proposalsRes, metricsRes] = await Promise.all([
        fetch('/api/v45/azr/constitution/verify'),
        fetch('/api/v45/azr/proposals?limit=10'),
        fetch('/api/v45/azr/metrics')
      ]);

      if (constitutionRes.ok) {
        setConstitution(await constitutionRes.json());
      }

      if (proposalsRes.ok) {
        const data = await proposalsRes.json();
        setAmendments(data.proposals || []);
      }

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }
    } catch (error) {
      console.error('Помилка завантаження AZR даних:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeAmendments = amendments.filter(a =>
    ['DEPLOYING', 'ACTIVE', 'SIMULATING', 'CHAOS_TESTING', 'AWAITING_APPROVAL'].includes(a.state)
  );

  const pendingAmendments = amendments.filter(a =>
    ['PROPOSED', 'VALIDATING'].includes(a.state)
  );

  // Підрахунок порушень по аксіомах
  const violationsByAxiom: Record<number, number> = {};
  violations.forEach(v => {
    const axiomNum = parseInt(v.axiom);
    if (axiomNum) {
      violationsByAxiom[axiomNum] = (violationsByAxiom[axiomNum] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              🏛️ AZR Конституція
              {constitution?.active && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-lg border border-emerald-500/30">
                  АКТИВНА
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Autonomous Zero-Risk Amendment Runtime • v{constitution?.version || '26'}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* Головні метрики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Статус конституції */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            p-4 rounded-2xl border
            ${constitution?.active
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-rose-500/10 border-rose-500/30'}
          `}
        >
          <div className="flex items-center gap-2 mb-2">
            {constitution?.active ? (
              <CheckCircle2 className="text-emerald-400" size={20} />
            ) : (
              <XCircle className="text-rose-400" size={20} />
            )}
            <span className={`text-xs font-bold ${constitution?.active ? 'text-emerald-400' : 'text-rose-400'}`}>
              ENFORCEMENT
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {constitution?.active ? 'ON' : 'OFF'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {constitution?.no_ai_override_active ? '🔒 NO-AI-OVERRIDE' : ''}
          </div>
        </motion.div>

        {/* Порушення */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`
            p-4 rounded-2xl border
            ${metrics?.constitutional_violations === 0
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-rose-500/10 border-rose-500/30'}
          `}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon size={20} className={
              metrics?.constitutional_violations === 0 ? 'text-emerald-400' : 'text-rose-400'
            } />
            <span className="text-xs font-bold text-slate-400">ПОРУШЕННЯ</span>
          </div>
          <div className={`text-2xl font-black ${
            metrics?.constitutional_violations === 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {metrics?.constitutional_violations || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">За весь час</div>
        </motion.div>

        {/* Активні поправки */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity size={20} className="text-blue-400" />
            <span className="text-xs font-bold text-slate-400">АКТИВНИХ</span>
          </div>
          <div className="text-2xl font-black text-blue-400">
            {activeAmendments.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            +{pendingAmendments.length} в черзі
          </div>
        </motion.div>

        {/* Rollback Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={20} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-400">ROLLBACK</span>
          </div>
          <div className="text-2xl font-black text-white">
            {((metrics?.rollback_rate || 0) * 100).toFixed(1)}%
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown size={10} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-400">Стабільно</span>
          </div>
        </motion.div>
      </div>

      {/* TRUTH LEDGER AUDIT */}
      <TruthLedgerSection />

      {/* Аксіоми */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-400" />
            Конституційні Аксіоми
          </h3>
          <button
            onClick={() => setShowAllAxioms(!showAllAxioms)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
          >
            {showAllAxioms ? 'Згорнути' : 'Показати всі'}
            <ChevronDown size={14} className={showAllAxioms ? 'rotate-180' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {AXIOMS.slice(0, showAllAxioms ? 6 : 3).map(axiom => (
            <AxiomCard
              key={axiom.id}
              axiom={axiom}
              violations={violationsByAxiom[axiom.id] || 0}
            />
          ))}
        </div>
      </div>

      {/* Активні поправки */}
      {activeAmendments.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap size={16} className="text-blue-400" />
            Активні Поправки
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAmendments.map(amendment => (
              <AmendmentCard key={amendment.id} amendment={amendment} />
            ))}
          </div>
        </div>
      )}

      {/* Останні пропозиції */}
      {amendments.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText size={16} className="text-slate-400" />
            Останні Пропозиції
          </h3>
          <div className="space-y-3">
            {amendments.slice(0, 5).map(amendment => (
              <motion.div
                key={amendment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-white/5 hover:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    amendment.state === 'COMPLETED' ? 'bg-emerald-500' :
                    amendment.state === 'ACTIVE' ? 'bg-blue-500 animate-pulse' :
                    amendment.state === 'REJECTED' ? 'bg-rose-500' :
                    'bg-slate-500'
                  }`} />
                  <span className="text-sm text-white font-medium truncate max-w-xs">
                    {amendment.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    RISK_COLORS[amendment.risk_level as keyof typeof RISK_COLORS]?.bg || 'bg-slate-800'
                  } ${RISK_COLORS[amendment.risk_level as keyof typeof RISK_COLORS]?.text || 'text-slate-400'}`}>
                    {amendment.risk_level}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {STATE_LABELS[amendment.state] || amendment.state}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Формула */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 text-center"
      >
        <p className="text-slate-400 italic text-sm leading-relaxed font-serif">
          "Система може еволюціонувати, але не перевизначати свою істину.<br/>
          Може діяти автономно, але ніколи без доказу.<br/>
          Може оптимізувати себе, але ніколи не уникнути своєї конституції."
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-slate-600 font-mono uppercase">
          <Lock size={12} />
          Конституція v45 • AZR Runtime
        </div>
      </motion.div>
    </div>
  );
};

export default AZRConstitutionalDashboard;
