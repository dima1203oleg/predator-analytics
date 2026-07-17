/**
 * 🧬 EvolutionAgentPanel — Мета-агент аналізу трендів та деградацій
 * FABRYKA v2.0 – AUTONOMOUS CORE
 *
 * Відповідає за:
 *   - Аналіз трендіврефективності компонентів
 *   - Виявлення деградацій у часі
 *   - Пропозиції рефакторингу
 *   - Глобальна оптимізація архітектурних рішень
 *
 * © 2026 PREDATOR Analytics — HR-04 (100% українська мова)
 */

import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Play,
  RefreshCw,
  Sparkles,
  Square,
  Terminal,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
  Zap,
  Loader,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  EvolutionAgentState,
  RefactorProposal,
  EvolutionTrend,
} from '../types';

// ─── Mock початкові дані ─────────────────────────────────────────────────────

const MOCK_TRENDS: EvolutionTrend[] = [];

const MOCK_PROPOSALS: RefactorProposal[] = [];

const EVOLUTION_BOOT_LOGS: string[] = [];

// ─── Утиліти ─────────────────────────────────────────────────────────────────

const getTrendIcon = (direction: EvolutionTrend['direction']) => {
  if (direction === 'improving') return TrendingUp;
  if (direction === 'degrading') return TrendingDown;
  return Minus;
};

const getTrendColor = (direction: EvolutionTrend['direction']) => {
  if (direction === 'improving') return 'text-[#00ffcc]';
  if (direction === 'degrading') return 'text-[#ff007f]';
  return 'text-[#ffaa00]';
};

const getTrendBorder = (direction: EvolutionTrend['direction']) => {
  if (direction === 'improving') return 'border-[#00ffcc]/30 bg-[#00ffcc]/5 shadow-[inset_0_0_15px_rgba(0,255,204,0.05)]';
  if (direction === 'degrading') return 'border-[#ff007f]/30 bg-[#ff007f]/5 shadow-[inset_0_0_15px_rgba(255,0,127,0.05)]';
  return 'border-white/5 bg-white/5';
};

const getPriorityBadge = (p: RefactorProposal['priority']) => {
  if (p === 'high') return 'border-[#ff007f]/50 bg-[#ff007f]/20 text-[#ff007f] shadow-[0_0_10px_rgba(255,0,127,0.3)]';
  if (p === 'medium') return 'border-[#ffaa00]/50 bg-[#ffaa00]/20 text-[#ffaa00] shadow-[0_0_10px_rgba(255,170,0,0.3)]';
  return 'border-[#00ffcc]/50 bg-[#00ffcc]/20 text-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.3)]';
};

const getPriorityLabel = (p: RefactorProposal['priority']) => {
  if (p === 'high') return 'КРИТИЧНИЙ';
  if (p === 'medium') return 'СЕРЕДНІЙ';
  return 'НИЗЬКИЙ';
};

const getStatusBadge = (s: RefactorProposal['status']) => {
  if (s === 'accepted') return 'border-[#00ffcc]/50 bg-[#00ffcc]/20 text-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.3)]';
  if (s === 'rejected') return 'border-slate-500/50 bg-slate-500/20 text-slate-300';
  return 'border-[#ff007f]/50 bg-[#ff007f]/20 text-[#ff007f] shadow-[0_0_10px_rgba(255,0,127,0.3)]';
};

const getStatusLabel = (s: RefactorProposal['status']) => {
  if (s === 'accepted') return 'ПРИЙНЯТО';
  if (s === 'rejected') return 'ВІДХИЛЕНО';
  return 'ОЧІКУЄ';
};

// ─── Мікро-граф тренду (sparkline) ───────────────────────────────────────────

const TrendSparkline = ({ direction, delta }: { direction: EvolutionTrend['direction']; delta: number }) => {
  const points = Array.from({ length: 12 }, (_, i) => {
    const base = 50;
    const noise = (Math.sin(i * 1.7 + delta) * 10);
    const trend = direction === 'improving' ? i * 2 : direction === 'degrading' ? -i * 2 : 0;
    return Math.max(5, Math.min(90, base + noise + trend));
  });
  const w = 80;
  const h = 30;
  const step = w / (points.length - 1);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (p / 100) * h}`).join(' ');
  const color = direction === 'improving' ? '#00ffcc' : direction === 'degrading' ? '#ff007f' : '#ffaa00';
  return (
    <svg width={w} height={h} className="overflow-visible" style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </svg>
  );
};

// ─── Головний компонент ───────────────────────────────────────────────────────

export function EvolutionAgentPanel() {
  const [agentState, setAgentState] = useState<EvolutionAgentState>({
    is_running: false,
    last_analysis: null,
    trends: MOCK_TRENDS,
    proposals: MOCK_PROPOSALS,
    logs: [],
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proposals, setProposals] = useState<RefactorProposal[]>(MOCK_PROPOSALS);
  const [logIdx, setLogIdx] = useState(0);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Авто-скрол логів
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentState.logs]);

  // Запустити аналіз
  const handleRunAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAgentState((prev) => ({ ...prev, is_running: true, logs: [] }));
    setLogIdx(0);

    // EvolutionAgent поки не підключений до бекенду
    const ts = new Date().toLocaleTimeString('uk-UA');
    setAgentState((prev) => ({
      ...prev,
      logs: [`[${ts}] 📡 EVOLUTION_CORE: Чекаю підключення до Meta-Analysis API...`],
      is_running: false,
      last_analysis: new Date().toISOString(),
    }));
    setIsAnalyzing(false);
  }, [isAnalyzing]);

  // Прийняти/відхилити пропозицію
  const handleProposalAction = useCallback((id: string, action: 'accepted' | 'rejected') => {
    setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: action } : p));
  }, []);

  const degradingCount = agentState.trends.filter((t) => t.direction === 'degrading').length;
  const improvingCount = agentState.trends.filter((t) => t.direction === 'improving').length;

  return (
    <div className="space-y-6">

      {/* ── EvolutionAgent Header ── */}
      <div className="border border-[#00ffcc]/30 bg-[#050b14]/80 p-6 relative overflow-hidden backdrop-blur-md shadow-[0_0_20px_rgba(0,255,204,0.1)] rounded-sm">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,204,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,204,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 border-2 border-[#00ffcc] bg-[#00ffcc]/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,204,0.4)] relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white" />
              <BrainCircuit size={32} className="text-[#00ffcc]" style={{ filter: 'drop-shadow(0 0 5px #00ffcc)' }} />
            </div>
            <div>
              <div className="text-[11px] font-orbitron font-bold uppercase tracking-[0.4em] text-[#00ffcc]/70 mb-1">
                EvolutionAgent · Meta-Analysis Core
              </div>
              <div className="text-xl font-orbitron font-black text-white tracking-widest" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>САМООПТИМІЗУЮЧА ЕКОСИСТЕМА</div>
              <div className="text-[10px] font-mono text-[#00ffcc]/50 mt-1">
                {agentState.last_analysis
                  ? `ОСТАННІЙ АНАЛІЗ: ${new Date(agentState.last_analysis).toLocaleString('uk-UA')}`
                  : 'АНАЛІЗ ЩЕ НЕ ЗАПУСКАВСЯ В ЦІЙ СЕСІЇ'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* KPI зведення */}
            <div className="flex gap-4">
              <div className="text-center px-5 py-3 border border-[#00ffcc]/30 bg-[#00ffcc]/10 shadow-[inset_0_0_15px_rgba(0,255,204,0.1)] relative">
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#00ffcc]" />
                <div className="text-2xl font-orbitron font-black text-[#00ffcc]" style={{ textShadow: '0 0 10px #00ffcc' }}>{improvingCount}</div>
                <div className="text-[10px] text-[#00ffcc]/70 uppercase font-orbitron tracking-widest mt-1">ПОКРАЩУЮТЬСЯ</div>
              </div>
              <div className="text-center px-5 py-3 border border-[#ff007f]/30 bg-[#ff007f]/10 shadow-[inset_0_0_15px_rgba(255,0,127,0.1)] relative">
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#ff007f]" />
                <div className="text-2xl font-orbitron font-black text-[#ff007f]" style={{ textShadow: '0 0 10px #ff007f' }}>{degradingCount}</div>
                <div className="text-[10px] text-[#ff007f]/70 uppercase font-orbitron tracking-widest mt-1">ДЕГРАДУЮТЬ</div>
              </div>
              <div className="text-center px-5 py-3 border border-[#ff007f]/30 bg-[#ff007f]/10 shadow-[inset_0_0_15px_rgba(255,0,127,0.1)] relative">
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#ff007f]" />
                <div className="text-2xl font-orbitron font-black text-[#ff007f]" style={{ textShadow: '0 0 10px #ff007f' }}>{proposals.filter((p) => p.status === 'pending').length}</div>
                <div className="text-[10px] text-[#ff007f]/70 uppercase font-orbitron tracking-widest mt-1">ПРОПОЗИЦІЇ</div>
              </div>
            </div>

            <Button
              variant="neon"
              onClick={() => void handleRunAnalysis()}
              disabled={isAnalyzing}
              className="bg-[#00ffcc]/20 text-[#00ffcc] border-2 border-[#00ffcc] hover:bg-[#00ffcc]/40 font-orbitron font-black uppercase tracking-[0.2em] text-[12px] h-12 px-6 shadow-[0_0_15px_rgba(0,255,204,0.4)]"
            >
              {isAnalyzing
                ? <><Loader size={16} className="mr-2 animate-spin" /> АНАЛІЗ...</>
                : <><Sparkles size={16} className="mr-2" /> ЗАПУСТИТИ АНАЛІЗ</>
              }
            </Button>
          </div>
        </div>
      </div>

      {/* ── Тренди компонентів ── */}
      <div>
        <div className="flex items-center gap-3 px-1 mb-4 border-b-2 border-[#00ffcc]/30 pb-2">
          <div className="w-2 h-2 bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]" />
          <div className="text-[12px] font-orbitron font-bold uppercase tracking-[0.3em] text-[#00ffcc]">
            ТРЕНДИ ЕФЕКТИВНОСТІ · {agentState.trends.length} КОМПОНЕНТІВ
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {agentState.trends.map((trend, idx) => {
            const Icon = getTrendIcon(trend.direction);
            return (
              <motion.div
                key={trend.component}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={cn('p-5 transition-all relative overflow-hidden backdrop-blur-sm', getTrendBorder(trend.direction))}
              >
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={getTrendColor(trend.direction)} style={{ filter: `drop-shadow(0 0 5px currentColor)` }} />
                    <span className="text-[12px] font-orbitron font-bold text-white uppercase tracking-widest">{trend.component}</span>
                  </div>
                  <span className={cn('text-xl font-orbitron font-black', getTrendColor(trend.direction))} style={{ textShadow: '0 0 8px currentColor' }}>
                    {trend.delta_percent > 0 ? '+' : ''}{trend.delta_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <TrendSparkline direction={trend.direction} delta={trend.delta_percent} />
                  <div className="text-[10px] text-white/50 font-mono text-right bg-black/40 px-2 py-1 border border-white/10">
                    {new Date(trend.last_checked).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Пропозиції рефакторингу ── */}
      <div>
        <div className="flex items-center gap-3 px-1 mb-4 border-b-2 border-[#ff007f]/30 pb-2">
          <div className="w-2 h-2 bg-[#ff007f] shadow-[0_0_8px_#ff007f] animate-pulse" />
          <div className="text-[12px] font-orbitron font-bold uppercase tracking-[0.3em] text-[#ff007f]">
            ПРОПОЗИЦІЇ РЕФАКТОРИНГУ · {proposals.filter((p) => p.status === 'pending').length} ОЧІКУЮТЬ РІШЕННЯ
          </div>
        </div>
        <div className="space-y-4">
          {proposals.map((proposal, idx) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={cn(
                'border p-6 transition-all relative overflow-hidden backdrop-blur-sm',
                proposal.status === 'accepted' ? 'border-[#00ffcc]/30 bg-[#00ffcc]/10 shadow-[inset_0_0_20px_rgba(0,255,204,0.1)]' :
                proposal.status === 'rejected' ? 'border-white/10 bg-black/40 opacity-50' :
                'border-[#ff007f]/30 bg-[#ff007f]/10 shadow-[inset_0_0_20px_rgba(255,0,127,0.1)]',
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-white/40">{proposal.id}</span>
                    <Badge className={cn('border text-[10px] font-orbitron font-bold px-2.5 py-0.5 tracking-wider', getPriorityBadge(proposal.priority))}>
                      {getPriorityLabel(proposal.priority)}
                    </Badge>
                    <Badge className={cn('border text-[10px] font-orbitron font-bold px-2.5 py-0.5 tracking-wider', getStatusBadge(proposal.status))}>
                      {getStatusLabel(proposal.status)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 bg-black/40 px-2 py-1 border border-white/10">
                  <span className="text-[10px] text-white/50 font-mono">
                    {new Date(proposal.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3 relative z-10">
                <ChevronRight size={14} className="text-[#ff007f] shrink-0" style={{ filter: 'drop-shadow(0 0 5px #ff007f)' }} />
                <span className="text-[13px] font-orbitron font-black uppercase tracking-widest text-[#ff007f]" style={{ textShadow: '0 0 8px #ff007f' }}>{proposal.component}</span>
              </div>
              <p className="text-[14px] text-white/80 leading-relaxed mb-5 font-rajdhani relative z-10">{proposal.description}</p>

              {proposal.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t-2 border-white/10 relative z-10">
                  <Button variant="cyber"
                    type="button"
                    onClick={() => handleProposalAction(proposal.id, 'accepted')}
                    className="flex-1 flex items-center justify-center gap-2 border border-[#00ffcc]/50 bg-[#00ffcc]/20 py-3 text-[11px] font-orbitron font-black uppercase text-[#00ffcc] hover:bg-[#00ffcc]/40 transition-colors shadow-[0_0_10px_rgba(0,255,204,0.2)]"
                  >
                    <CheckCircle2 size={14} /> ПРИЙНЯТИ ДИРЕКТИВУ
                  </Button>
                  <Button variant="cyber"
                    type="button"
                    onClick={() => handleProposalAction(proposal.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 border border-[#ff007f]/50 bg-[#ff007f]/10 py-3 text-[11px] font-orbitron font-black uppercase text-[#ff007f] hover:bg-[#ff007f]/30 transition-colors shadow-[0_0_10px_rgba(255,0,127,0.2)]"
                  >
                    <X size={14} /> ВІДХИЛИТИ
                  </Button>
                </div>
              )}
              {proposal.status === 'accepted' && (
                <div className="flex items-center gap-2 text-[#00ffcc] text-[11px] font-orbitron font-black uppercase pt-3 border-t-2 border-[#00ffcc]/20 relative z-10" style={{ textShadow: '0 0 8px #00ffcc' }}>
                  <CheckCircle2 size={14} /> ПРИЙНЯТО ДО ВПРОВАДЖЕННЯ
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Термінал EvolutionAgent ── */}
      {(agentState.logs.length > 0 || isAnalyzing) && (
        <div className="border border-[#00ffcc]/30 bg-[#050b14]/90 overflow-hidden shadow-[0_0_20px_rgba(0,255,204,0.15)] relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,204,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
          <div className="flex items-center gap-3 border-b-2 border-[#00ffcc]/30 bg-[#00ffcc]/10 px-5 py-3 relative z-10">
            <Terminal size={16} className="text-[#00ffcc]" style={{ filter: 'drop-shadow(0 0 5px #00ffcc)' }} />
            <span className="text-[11px] font-orbitron font-black uppercase tracking-[0.3em] text-[#00ffcc]">EVOLUTION_CORE · ТЕРМІНАЛ</span>
            {isAnalyzing && (
              <span className="flex items-center gap-2 text-[10px] text-[#ff007f] font-orbitron font-black uppercase ml-auto">
                <span className="w-2 h-2 bg-[#ff007f] animate-ping" />
                ВИКОНУЄТЬСЯ
              </span>
            )}
          </div>
          <div className="p-5 font-mono text-[12px] max-h-[250px] overflow-y-auto space-y-1 relative z-10">
            {agentState.logs.map((log, i) => (
              <div key={i} className={cn(
                'py-1 tracking-wide',
                log.includes('[DETECTION]') ? 'text-[#ff007f]' :
                log.includes('[PROPOSALS]') ? 'text-[#ffaa00]' :
                log.includes('[EVOLUTION]') ? 'text-[#00ffcc]' :
                'text-[#00ffcc]/70',
              )}>
                {log}
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-[#00ffcc]/50 py-1">
                <span className="animate-pulse">_</span>
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

    </div>
  );
}
