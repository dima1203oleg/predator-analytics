/**
 * 🏛️ AZR Constitutional Sovereign Controller | v58.2-WRAITH Premium Matrix
 * Predator v58.2-WRAITH | Neural Analytics*
 * 
 * Автономна система управління конституційними аксіомами (AZR Runtime):
 * - Моніторинг та енфорсмент аксіом ядра
 * - Керування динамічними поправками
 * - Детекція парадигмальних порушень
 * - Візуалізація ризикової експозиції через Truth Ledger
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v58.2-WRAITH
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TruthLedgerSection } from './TruthLedgerSection';
import {
  Shield, Scale, AlertTriangle, CheckCircle2, XCircle,
  Clock, Activity, Zap, Lock, Eye, FileText, ArrowRight,
  TrendingUp, TrendingDown, RefreshCw, ChevronDown,
  BookOpen, BarChart3, Target, AlertOctagon, Unlock,
  Cpu, Hexagon, Globe, Boxes, Layers, Terminal
} from 'lucide-react';
import { cn } from '../utils/cn';
import { TacticalCard } from './ui/TacticalCard';
import { HoloContainer } from './HoloContainer';
import { CyberOrb } from './CyberOrb';

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
  { id: 9, name: "Закон обмеженого самовдосконалення", icon: Zap, desc: "AI не може модифікувати власні обмеження без зовнішньої санкції" },
  { id: 10, name: "Закон недоторканності ядра", icon: Lock, desc: "Вузол прийняття рішень захищений криптографічним бар'єром" },
  { id: 11, name: "Закон повної обіцянки", icon: FileText, desc: "Кожна дія повинна мати незмінний слід у Truth Ledger" },
  { id: 12, name: "Закон багатосторонньої відповідальності", icon: Scale, desc: "Рішення вимагає консенсусу мінімум трьох незалежних вузлів" },
  { id: 13, name: "Закон оберненого доказу", icon: Eye, desc: "Відмова в дії вимагає меншого обґрунтування, ніж дозвіл" },
  { id: 14, name: "Закон часової незворотності", icon: Clock, desc: "Конституційні зміни мають період стабілізації перед активацією" }
];

const RISK_COLORS: Record<string, { bg: string, text: string, border: string, glow: string }> = {
  LOW: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  MEDIUM: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
  EXTREME: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/20' }
};

const STATE_LABELS: Record<string, string> = {
  PROPOSED: 'ЗАПРОПОНОВАНО',
  VALIDATING: 'ВАЛІДАЦІЯ',
  SIMULATING: 'СИМУЛЯЦІЯ',
  CHAOS_TESTING: 'ХАОС-ТЕСТ',
  AWAITING_APPROVAL: 'ОЧІКУЄ_СХВАЛЕННЯ',
  APPROVED: 'СХВАЛЕНО',
  DEPLOYING: 'РОЗГОРТАННЯ',
  ACTIVE: 'АКТИВНО',
  ROLLING_BACK: 'ВІДКАТ',
  ROLLED_BACK: 'ВІДКОЧЕНО',
  REJECTED: 'ВІДХИЛЕНО',
  COMPLETED: 'ЗАВЕРШЕНО',
  FAILED: 'ПОМИЛКА'
};

// === КОМПОНЕНТИ ===

const AxiomCard: React.FC<{ axiom: typeof AXIOMS[0]; violations: number }> = ({ axiom, violations }) => {
  const Icon = axiom.icon;
  const isViolated = violations > 0;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "p-6 rounded-[32px] border transition-all duration-500 cursor-pointer relative overflow-hidden group panel-3d shadow-xl",
        isViolated
          ? 'bg-rose-950/20 border-rose-500/50 shadow-rose-500/10'
          : 'bg-slate-950/40 border-white/5 hover:border-emerald-500/30'
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: isViolated ? '#f43f5e' : '#10b981' }} />
      <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03] pointer-events-none" />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className={cn(
          "p-3 rounded-xl bg-slate-900 border border-white/5 shadow-inner transition-colors duration-500",
          isViolated ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : 'text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30'
        )}>
          <Icon size={20} className={isViolated ? 'animate-pulse' : ''} />
        </div>
        <div className="flex items-center gap-2">
          {isViolated ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 rounded-full border border-rose-500/30 animate-pulse">
              <AlertTriangle size={12} className="text-rose-400" />
              <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{violations} ПОРУШЕНЬ</span>
            </div>
          ) : (
            <div className="p-1 px-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-[8px] font-black text-emerald-500 uppercase">АКТИВНИЙ_ЗАХИСТ</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-sm font-black text-white mb-2 uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">АКСІОМА_{axiom.id}</div>
      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-4 leading-relaxed group-hover:text-slate-300 transition-colors">{axiom.name}</div>
      <p className="text-[9px] text-slate-600 font-medium italic opacity-0 group-hover:opacity-100 transition-opacity duration-500 h-0 group-hover:h-auto overflow-hidden">
        {axiom.desc}
      </p>
    </motion.div>
  );
};

const AmendmentCard: React.FC<{ amendment: Amendment }> = ({ amendment }) => {
  const riskColor = RISK_COLORS[amendment.risk_level as keyof typeof RISK_COLORS] || RISK_COLORS.LOW;
  const stateLabel = STATE_LABELS[amendment.state] || amendment.state;
  const isActive = ['DEPLOYING', 'ACTIVE', 'SIMULATING', 'CHAOS_TESTING', 'VALIDATING'].includes(amendment.state);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01, x: 5 }}
      className="p-6 rounded-[32px] bg-slate-950/60 border border-white/5 hover:border-white/10 transition-all duration-500 shadow-xl group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-base font-black text-white truncate uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{amendment.title}</h4>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded text-[8px] font-mono text-slate-500 tracking-widest">{amendment.id.substring(0, 12)}</span>
            <div className={cn("px-3 py-1 rounded-full text-[9px] font-black tracking-[0.2em] border", riskColor.bg, riskColor.text, riskColor.border, riskColor.glow)}>
              {amendment.risk_level}
            </div>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[9px] font-black tracking-[0.2em] transition-all",
          isActive
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
            : 'bg-slate-900/60 text-slate-500 border border-white/5'
        )}>
          {isActive ? <Activity size={12} className="animate-pulse" /> : <Clock size={12} />}
          {stateLabel}
        </div>
      </div>

      {/* Approve Indicators */}
      {amendment.approvals && (
        <div className="flex gap-2 mt-6">
          {Object.entries(amendment.approvals).map(([committee, approval]) => (
            <div key={committee} className="flex-1 flex flex-col gap-1">
              <div className={cn(
                "h-1.5 rounded-full shadow-inner transition-all duration-700",
                approval.approved ? (approval.unanimous ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-blue-500 shadow-blue-500/40') : 'bg-slate-800'
              )} />
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter truncate text-center">{committee}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-2 text-slate-600 font-mono text-[9px]">
          <Clock size={10} />
          {new Date(amendment.created_at).toLocaleDateString('uk-UA')}
        </div>
        {amendment.risk_score !== undefined && (
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Risk Index:</span>
            <div className="px-3 py-1 bg-slate-900 border border-white/5 rounded-lg text-[10px] font-black text-white font-mono">
              {(amendment.risk_score * 100).toFixed(1)}%
            </div>
          </div>
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
      setIsLoading(true);
      const [constitutionRes, proposalsRes, metricsRes] = await Promise.all([
        fetch('/api/v45/azr/constitution/verify'),
        fetch('/api/v45/azr/proposals?limit=10'),
        fetch('/api/v45/azr/metrics')
      ]);

      if (constitutionRes.ok) setConstitution(await constitutionRes.json());
      if (proposalsRes.ok) {
        const data = await proposalsRes.json();
        setAmendments(data.proposals || []);
      }
      if (metricsRes.ok) setMetrics(await metricsRes.json());
    } catch (error) {
      console.error('AZR Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeAmendments = useMemo(() =>
    amendments.filter(a => ['DEPLOYING', 'ACTIVE', 'SIMULATING', 'CHAOS_TESTING', 'AWAITING_APPROVAL', 'VALIDATING'].includes(a.state)),
    [amendments]
  );

  const violationsByAxiom = useMemo(() => {
    const counts: Record<number, number> = {};
    violations.forEach(v => {
      const axiomNum = parseInt(v.axiom);
      if (axiomNum) counts[axiomNum] = (counts[axiomNum] || 0) + 1;
    });
    return counts;
  }, [violations]);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-1000">

      {/* Sovereign Header Control */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 p-10 bg-slate-950/40 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <div className="flex items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full scale-150 group-hover:bg-indigo-500/40 transition-all duration-1000" />
            <div className="relative p-6 bg-slate-900 border border-indigo-500/30 rounded-[32px] shadow-2xl panel-3d group-hover:rotate-6 transition-transform duration-700">
              <Shield className="text-indigo-400 icon-3d-indigo scale-125" size={40} />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-3 font-display">
              Constitutional <span className="text-indigo-500">Sovereign</span> Controller
            </h2>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">AZR_RUNTIME_v58.2-WRAITH.1_STABLE</span>
              </div>
              {constitution?.active && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <Lock size={12} className="text-emerald-400" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">ENFORCEMENT_ACTIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10 w-full lg:w-auto">
          <div className="flex flex-col items-end pr-8 border-r border-white/5 mr-4 hidden xl:flex">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">ЦІЛІСНІСТЬ_КОНСТИТУЦІЇ</span>
            <span className="text-2xl font-black text-white font-mono">100.0%</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="p-5 rounded-2xl bg-slate-900 border border-white/5 text-slate-400 hover:text-indigo-400 transition-all shadow-xl"
          >
            <RefreshCw size={24} className={isLoading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>

      {/* Primary Infrastructure Matrix */}
      <div className="grid grid-cols-12 gap-10">

        {/* Core Guardians Status */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-8">
          <TacticalCard variant="holographic" title="CONSTITUTIONAL_CORE_PROTECTION" className="p-10 flex flex-col items-center justify-center bg-slate-950/60 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03] pointer-events-none" />
            <div className="relative mb-10 mt-6 scale-110">
              <div className={cn(
                "absolute inset-0 blur-[130px] rounded-full scale-150 transition-all duration-1000",
                constitution?.active ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              )} />
              <CyberOrb size={240} color={constitution?.active ? "#10b981" : "#f43f5e"} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {constitution?.active ? <Lock size={48} className="text-emerald-400 animate-pulse" /> : <Unlock size={48} className="text-rose-400" />}
                <div className="mt-4 text-xs font-mono font-black text-white uppercase tracking-widest">
                  {constitution?.active ? 'Secured' : 'Exposed'}
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[12px] font-black text-white uppercase tracking-[0.4em] mb-4">Core Enforcement Mode</div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-6 py-2 bg-slate-900/60 rounded-2xl border border-white/5 shadow-inner">
                  <Shield size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Immutable Core Protection</span>
                </div>
                <div className="flex items-center gap-3 px-6 py-2 bg-slate-900/60 rounded-2xl border border-white/5 shadow-inner">
                  <Cpu size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No-AI Override Enabled</span>
                </div>
              </div>
            </div>
          </TacticalCard>

          <div className="grid grid-cols-2 gap-8">
            <div className="p-8 rounded-[40px] bg-slate-950/40 border border-white/5 shadow-xl flex flex-col gap-4 group hover:bg-slate-900/60 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Violations</span>
                <AlertOctagon size={18} className={metrics?.constitutional_violations === 0 ? 'text-emerald-500' : 'text-rose-500'} />
              </div>
              <div className={cn("text-4xl font-black font-display tracking-tighter", metrics?.constitutional_violations === 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {metrics?.constitutional_violations || 0}
              </div>
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Total detected event cycles</span>
            </div>
            <div className="p-8 rounded-[40px] bg-slate-950/40 border border-white/5 shadow-xl flex flex-col gap-4 group hover:bg-slate-900/60 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Rollback Rate</span>
                <RefreshCw size={18} className="text-indigo-400" />
              </div>
              <div className="text-4xl font-black text-white font-display tracking-tighter">
                {((metrics?.rollback_rate || 0) * 100).toFixed(1)}%
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown size={14} className="text-emerald-500" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Declining Trend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Axioms Matrix & Amendments */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">

          {/* Axioms Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <BookOpen size={24} className="text-indigo-500" />
                <h3 className="text-lg font-black text-white uppercase tracking-tighter font-display">Ядерні Конституційні Аксіоми</h3>
              </div>
              <button
                onClick={() => setShowAllAxioms(!showAllAxioms)}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest transition-all"
              >
                {showAllAxioms ? 'ЗГОРНУТИ_МАТРИЦЮ' : 'ПОКАЗАТИ_ВСІ_АКСІОМИ'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {AXIOMS.slice(0, showAllAxioms ? 6 : 3).map(axiom => (
                <AxiomCard
                  key={axiom.id}
                  axiom={axiom}
                  violations={violationsByAxiom[axiom.id] || 0}
                />
              ))}
            </div>
          </div>

          {/* Truth Ledger Integration */}
          <TruthLedgerSection />

          {/* Active Evolution (Amendments) */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Zap size={24} className="text-blue-500" />
              <h3 className="text-lg font-black text-white uppercase tracking-tighter font-display">Активні Парадигмальні Зміни</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {activeAmendments.length > 0 ? (
                activeAmendments.map(amendment => (
                  <AmendmentCard key={amendment.id} amendment={amendment} />
                ))
              ) : (
                <div className="col-span-2 py-20 bg-slate-950/20 border border-dashed border-white/5 rounded-[48px] flex flex-col items-center justify-center opacity-30">
                  <Boxes size={48} className="mb-4" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">No active evolution cycles</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Trace History */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <Terminal size={24} className="text-slate-500" />
                <h3 className="text-lg font-black text-white uppercase tracking-tighter font-display">Трасування Останніх Пропоз</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {amendments.slice(0, 4).map(amendment => (
                <motion.div
                  key={amendment.id}
                  className="group p-6 rounded-[28px] bg-slate-950/40 border border-white/5 flex items-center justify-between hover:bg-slate-900/60 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all" />
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-3 h-3 rounded-full shadow-lg",
                      amendment.state === 'COMPLETED' || amendment.state === 'ACTIVE' ? 'bg-emerald-500 shadow-emerald-500/40' :
                        amendment.state === 'REJECTED' || amendment.state === 'FAILED' ? 'bg-rose-500 shadow-rose-500/40' : 'bg-amber-500 shadow-amber-500/40'
                    )} />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-200 uppercase tracking-tighter group-hover:text-white transition-colors">{amendment.title}</span>
                      <span className="text-[9px] text-slate-600 font-mono tracking-widest">{amendment.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className={cn("px-3 py-1 bg-slate-900 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest", RISK_COLORS[amendment.risk_level]?.text || 'text-slate-500')}>
                      {amendment.risk_level}
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:block">
                      {STATE_LABELS[amendment.state]}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sovereign Mandate Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-12 rounded-[48px] bg-slate-950/60 border border-white/5 relative overflow-hidden group shadow-2xl"
      >
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-1000" />
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl mb-8 shadow-xl">
            <Shield className="text-indigo-400 group-hover:scale-110 transition-transform duration-700" size={32} />
          </div>
          <p className="text-xl md:text-2xl text-slate-300 font-serif italic leading-relaxed max-w-4xl mx-auto mb-10 group-hover:text-slate-100 transition-colors">
            "Система може еволюціонувати, але не перевизначати свою істину. Може діяти автономно, але ніколи без доказу. Може оптимізувати себе, але ніколи не уникнути своєї конституції."
          </p>
          <div className="flex items-center gap-8 pt-8 border-t border-white/5 w-full justify-center">
            <div className="flex items-center gap-3">
              <Lock size={14} className="text-indigo-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">SOVEREIGN_MANDATE_v58.2-WRAITH</span>
            </div>
            <div className="flex items-center gap-3">
              <Hexagon size={14} className="text-cyan-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">CORE_STABILITY_LOCK</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AZRConstitutionalDashboard;
