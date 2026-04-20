/**
 * 💼 P&L РИЗИКІВ ПОРТФЕЛЮ | v58.2-WRAITH
 * PREDATOR Analytics — Portfolio Risk Management
 *
 * Скільки $ у зоні ризику прямо зараз:
 * контрагенти, санкції, ланцюги постачання, фін. ризики.
 * CEO-рівень · Sovereign Power Design · LIVE · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingDown, TrendingUp, AlertTriangle,
  Shield, Activity, Building2, Globe, Lock, Zap,
  RefreshCw, Download, Eye, BarChart3, Target,
  ChevronRight, Clock, Flame, Star,
  ArrowUpRight, AlertOctagon, Cpu, Radar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { RiskLevelValue } from '@/types/intelligence';

// ─── ДАНІ ────────────────────────────────────────────────────────────

const RISK_TIMELINE = [
  { t: '00:00', risk: 112 }, { t: '02:00', risk: 108 }, { t: '04:00', risk: 115 },
  { t: '06:00', risk: 118 }, { t: '08:00', risk: 109 }, { t: '10:00', risk: 121 },
  { t: '12:00', risk: 119 }, { t: '14:00', risk: 124 }, { t: '16:00', risk: 122 },
  { t: '18:00', risk: 126 }, { t: '20:00', risk: 125 }, { t: '22:00', risk: 127 },
  { t: 'Зараз', risk: 127.4 },
];

const RISK_BREAKDOWN = [
  { name: 'Санкційний',   value: 33, amount: '$41.8M',  color: '#E11D48' },
  { name: 'Контрагент',  value: 26, amount: '$33.1M',  color: '#BE123C' },
  { name: 'Ланцюг пост.',value: 20, amount: '$25.5M',  color: '#D4AF37' },
  { name: 'FX / Валютний',value: 14, amount: '$17.8M', color: '#92400e' },
  { name: 'Операційний', value: 7, amount: '$9.2M',    color: '#475569' },
];

interface RiskPosition {
  id: string;
  counterparty: string;
  type: string;
  exposure: string;
  atRisk: string;
  riskPct: number;
  riskLevel: RiskLevelValue;
  trigger: string;
  daysToMaturity: number;
  country: string;
  action: string;
  trend: 'up' | 'down' | 'stable';
}

const RISK_POSITIONS: RiskPosition[] = [
  {
    id: 'POS-001',
    counterparty: 'KYOTO HOLDINGS LTD (BVI)',
    type: 'Торговий кредит',
    exposure: '$18.4M',
    atRisk: '$18.4M',
    riskPct: 100,
    riskLevel: 'critical',
    trigger: 'Попадання в список SDN — OFAC 2025-03-15',
    daysToMaturity: 12,
    country: '🇻🇬 BVI',
    action: 'ЗАМОРОЗИТИ РОЗРАХУНКИ',
    trend: 'up',
  },
  {
    id: 'POS-002',
    counterparty: 'ТОВ "МЕТАЛУРГ-ІНВЕСТ"',
    type: 'Дебіторська заборгованість',
    exposure: '$12.1M',
    atRisk: '$9.7M',
    riskPct: 80,
    riskLevel: 'critical',
    trigger: 'Відкрито банкрутство (справа №910/4521/25)',
    daysToMaturity: 0,
    country: '🇺🇦 Україна',
    action: 'ПОДАТИ КРЕДИТОРСЬКІ ВИМОГИ',
    trend: 'up',
  },
  {
    id: 'POS-003',
    counterparty: 'SUNRISE CAPITAL (CY)',
    type: 'Інвестиційна угода',
    exposure: '$8.2M',
    atRisk: '$6.1M',
    riskPct: 74,
    riskLevel: 'high',
    trigger: 'Власник під слідством ФБР (PEP + INTERPOL)',
    daysToMaturity: 45,
    country: '🇨🇾 Кіпр',
    action: 'ПРАВОВИЙ АНАЛІЗ + FREEZE',
    trend: 'up',
  },
  {
    id: 'POS-004',
    counterparty: 'АГРО-ЛІДЕР ГРУП',
    type: 'Контракт на поставку',
    exposure: '$22.5M',
    atRisk: '$5.8M',
    riskPct: 26,
    riskLevel: 'high',
    trigger: 'UBO через офшор · Виявлено фіктивну структуру',
    daysToMaturity: 88,
    country: '🇺🇦 Україна',
    action: 'ПЕРЕУКЛАСТИ З ГАРАНТІЯМИ',
    trend: 'stable',
  },
];

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────

const RISK_COLOR: Partial<Record<RiskLevelValue, string>> = {
  critical: '#E11D48',
  high:     '#fbbf24',
  medium:   '#d97706',
  low:      '#34d399',
};

const RISK_LABEL: Partial<Record<RiskLevelValue, string>> = {
  critical: 'КРИТИЧНИЙ',
  high:     'ВИСОКИЙ',
  medium:   'СЕРЕДНІЙ',
  low:      'НИЗЬКИЙ',
};

const PortfolioRiskView: React.FC = () => {
  const [selectedPos, setSelectedPos] = useState<RiskPosition | null>(RISK_POSITIONS[0]);
  const [liveRisk, setLiveRisk] = useState(127.4);
  const [filter, setFilter] = useState<RiskLevelValue | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline, nodeSource, healingProgress } = useBackendStatus();

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'PortfolioRisk',
          message: `РЕЖИМ АВТОНОМНОЇ РИЗИК-ФОРЕНЗИКИ [${nodeSource}]: Використовується локальна база RISK_NODES.`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'RISK_OFFLINE'
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'PortfolioRisk',
          message: `RISK_CORE_READY [${nodeSource}]: Моніторинг ризиків синхронізовано з NVIDIA Master.`,
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'RISK_SUCCESS'
        }
      }));
    }
  }, [isOffline, nodeSource]);

  useEffect(() => {
    const id = setInterval(() => {
      const delta = (Math.random() - 0.48) * 0.3;
      setLiveRisk(r => Math.max(120, Math.min(135, +(r + delta).toFixed(1))));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const filtered = RISK_POSITIONS.filter(p =>
    filter === 'all' || p.riskLevel === filter
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen text-slate-200 font-sans pb-32 relative overflow-hidden bg-[#020202]">
        <AdvancedBackground mode="sovereign" />
        <CyberGrid opacity={0.03} />

        <div className="relative z-10 max-w-[1850px] mx-auto p-12 space-y-12">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-red-500/15 blur-3xl rounded-full scale-150 group-hover:scale-200 transition-transform duration-1000" />
                  <div className="relative p-7 bg-black border-2 border-red-500/40 rounded-[3rem] shadow-4xl transform rotate-3 hover:rotate-0 transition-all cursor-crosshair">
                    <DollarSign size={54} className="text-red-500 drop-shadow-[0_0_20px_rgba(225,29,72,0.4)]" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-4 border-black animate-pulse shadow-[0_0_15px_#e11d48]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_#e11d48]" />
                    <span className="text-[10px] font-black text-red-500/80 uppercase tracking-[0.6em]">
                      ЦЕНТР ПОРТФЕЛЬНИХ РИЗИКІВ · v58.2-WRAITH
                    </span>
                  </div>
                  <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg]">
                    P&L <span className="text-red-600 underline decoration-red-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">РИЗИКІВ</span>
                  </h1>
                  <p className="text-[12px] text-slate-600 font-black uppercase tracking-[0.5em] mt-6 italic border-l-4 border-red-500/30 pl-8 opacity-90 max-w-2xl">
                    МОНІТОРИНГ ДЕФОЛТНИХ ВЕКТОРІВ · КРИТИЧНА ЕКСПОЗИЦІЯ · СУВЕРЕННИЙ АНАЛІЗ
                  </p>
                </div>
              </div>
            }
            badges={[
              { label: 'CLASSIFIED_T1', color: 'amber', icon: <Lock size={10} /> },
              { label: 'SOVEREIGN_READY', color: 'primary', icon: <Shield size={10} /> },
              { 
                label: nodeSource, 
                color: isOffline ? 'warning' : 'danger', 
                icon: <Activity size={10} className={isOffline ? 'animate-pulse' : ''} /> 
              },
            ]}
            stats={[
              { label: 'У ЗОНІ РИЗИКУ', value: `$${liveRisk}M`, icon: <TrendingUp size={14} />, color: 'danger' },
              { 
                label: isOffline ? 'FAILOVER_SYNC' : 'КРИТИЧНИЙ_NET', 
                value: isOffline ? `${Math.floor(healingProgress)}%` : '$41.8M', 
                icon: isOffline ? <Activity /> : <AlertTriangle />, 
                color: isOffline ? 'warning' : 'danger',
                animate: isOffline
              },
              { label: 'СИСТЕМНИЙ ПОРТФЕЛЬ', value: '$847M', icon: <Activity size={14} />, color: 'primary' },
              { label: 'NODE_SOURCE', value: isOffline ? 'MIRROR' : 'PRIMARY', icon: <Cpu />, color: isOffline ? 'warning' : 'success' },
            ]}
            actions={
              <div className="flex items-center gap-6">
                <button
                  onClick={handleRefresh}
                  className="p-6 rounded-[2rem] bg-black/60 border-2 border-white/5 text-slate-500 hover:text-red-500 hover:border-red-500/30 transition-all shadow-4xl group"
                >
                  <RefreshCw size={24} className={cn(refreshing && 'animate-spin text-red-500')} />
                </button>
                <button className="px-14 py-6 bg-red-600 text-white text-[12px] font-black uppercase tracking-[0.4em] italic hover:brightness-110 transition-all rounded-[2rem] shadow-4xl flex items-center gap-4 font-bold">
                  <Download size={24} />
                  ДОСЬЄ_ПРАВЛІННЯ_ЕЛІТА
                </button>
              </div>
            }
          />

          {/* ── KPI GRID WRAITH ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { l: 'КРИТИЧНІ ЛОТИ',    v: '2',          sub: 'POS-001, POS-002',       c: '#E11D48' },
              { l: 'РИЗИК_INDEX',      v: '15.1%',      sub: 'Від загальних активів',       c: '#D4AF37' },
              { l: 'ГЕО_ОХОПЛЕННЯ',    v: '4 Країни',   sub: 'Географічне покриття',  c: '#D4AF37' },
              { l: 'ВІДКРИТІСТЬ_АЛЬФА',   v: '$127.4M',    sub: 'Вплив на суверенний прибуток',  c: '#E11D48' },
            ].map((m, i) => (
              <motion.div
                key={m.l}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-10 bg-black/60 backdrop-blur-2xl border-2 border-white/5 hover:border-red-500/30 transition-all rounded-[3.5rem] shadow-2xl group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500/40 to-transparent opacity-40" />
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] mb-4 italic">{m.l}</p>
                <p className="text-4xl font-black font-mono tracking-tighter italic" style={{ color: m.c }}>{m.v}</p>
                <p className="text-[10px] text-slate-800 font-black uppercase mt-4 tracking-widest opacity-60 underline decoration-red-500/10">{m.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-10">
            {/* ── ЛІВА ПАНЕЛЬ: ПОЗИЦІЇ ── */}
            <div className="col-span-12 xl:col-span-8 space-y-8">
              
              <div className="flex items-center gap-4 p-3 bg-black border-2 border-white/5 rounded-[2.5rem] w-fit shadow-4xl backdrop-blur-3xl">
                <div className="flex gap-2 bg-black border-2 border-white/5 p-2 rounded-2xl shadow-inner">
                  {(['all', 'critical', 'high', 'medium'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all rounded-xl italic",
                        filter === f
                          ? "bg-red-600 text-white shadow-4xl scale-105 font-bold"
                          : "text-slate-600 hover:text-slate-300 border-2 border-transparent hover:border-red-500/10 hover:bg-white/5"
                      )}
                    >
                      {f === 'all' ? 'УСІ_ПОЗИЦІЇ' : RISK_LABEL[f]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {filtered.map((pos, i) => (
                  <motion.div
                    key={pos.id}
                    initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    onClick={() => setSelectedPos(pos)}
                    className={cn(
                      "p-10 border-2 cursor-pointer transition-all relative overflow-hidden group rounded-[3.5rem] shadow-3xl",
                      selectedPos?.id === pos.id
                        ? "bg-red-600/[0.03] border-red-500/30 shadow-4xl"
                        : "bg-black/60 border-white/5 hover:border-white/20"
                    )}
                  >
                    {selectedPos?.id === pos.id && (
                      <div className="absolute left-0 inset-y-0 w-2.5 bg-red-600 shadow-[0_0_20px_#e11d48]" />
                    )}

                    <div className="flex items-start gap-10 pl-4">
                      <div className="w-24 h-24 shrink-0 rounded-[2rem] bg-black/80 border-2 border-white/5 flex flex-col items-center justify-center shadow-inner group-hover:border-red-500/30 transition-all">
                        <span className="text-3xl font-black font-mono italic tracking-tighter leading-none" style={{ color: RISK_COLOR[pos.riskLevel] }}>
                          {pos.riskPct}%
                        </span>
                        <span className="text-[8px] font-black uppercase text-slate-700 mt-2 tracking-widest italic">РИЗИК</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-[11px] font-black font-mono text-slate-700 uppercase tracking-widest">{pos.id}</span>
                          <span className="text-[10px] font-black text-red-500/60 uppercase tracking-widest italic">{pos.country}</span>
                        </div>
                        <h3 className="text-3xl font-black text-white group-hover:text-red-500 transition-colors uppercase italic tracking-tighter leading-none mb-4 font-serif">
                          {pos.counterparty}
                        </h3>
                        <div className="flex items-center gap-8 mb-6">
                          <div className="flex items-center gap-3 text-slate-500">
                             <Building2 size={16} />
                             <span className="text-[12px] font-black uppercase italic tracking-tight">{pos.type}</span>
                          </div>
                          <div className={cn("flex items-center gap-2 px-4 py-1.5 rounded-xl border italic text-[9px] font-black tracking-widest uppercase shadow-inner",
                            pos.riskLevel === 'critical' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-slate-800 text-slate-500 bg-white/5'
                          )}>
                             {RISK_LABEL[pos.riskLevel]}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10">
                          <div>
                            <p className="text-[9px] text-slate-700 uppercase font-black tracking-[0.4em] mb-2">ЕКСПОЗИЦІЯ_NET</p>
                            <p className="text-2xl font-black text-white font-mono italic">{pos.exposure}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-700 uppercase font-black tracking-[0.4em] mb-2">У_ЗОНІ_РИЗИКУ</p>
                            <p className="text-2xl font-black font-mono italic" style={{ color: RISK_COLOR[pos.riskLevel] }}>{pos.atRisk}</p>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 pt-6">
                        {pos.trend === 'up' ? (
                          <div className="relative">
                            <TrendingUp size={32} className="text-red-500 drop-shadow-[0_0_10px_#e11d48]" />
                            <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity }} className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                          </div>
                        ) : (
                          <Activity size={32} className="text-slate-800" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── ПРАВА ПАНЕЛЬ: ДЕТАЛІ ── */}
            <div className="col-span-12 xl:col-span-4 space-y-10">
              
              <AnimatePresence mode="wait">
                {selectedPos && (
                  <motion.div
                    key={selectedPos.id}
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <TacticalCard variant="holographic" className="p-10 bg-black/80 border-2 border-red-500/20 rounded-[4rem] shadow-4xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-24 opacity-[0.03] pointer-events-none">
                          <Target size={260} className="text-red-500" />
                       </div>
                       <div className="relative z-10 space-y-10">
                          <div className="flex items-center justify-between">
                             <div className="px-5 py-2 bg-red-600/10 border border-red-600/30 rounded-full">
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">{selectedPos.id}</span>
                             </div>
                             <div className="flex gap-2">
                                <span className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                                <span className="text-[9px] font-black text-red-700 uppercase tracking-widest font-mono italic">АКТИВНА_ЗАГРОЗА</span>
                             </div>
                          </div>

                          <div>
                             <h2 className="text-[42px] font-black text-white leading-none tracking-tighter italic uppercase font-serif mb-4">{selectedPos.counterparty}</h2>
                             <p className="text-[12px] text-red-600 font-black uppercase tracking-[0.5em] italic bg-red-500/5 px-6 py-2 rounded-full w-fit border border-red-500/10">
                               {selectedPos.country} · {selectedPos.type}
                             </p>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            {[
                              { l: 'ЕКСПОЗИЦІЯ', v: selectedPos.exposure },
                              { l: 'NET_РИЗИК',   v: selectedPos.atRisk },
                              { l: 'ІНДЕКС_X',     v: `${selectedPos.riskPct}%` },
                              { l: 'ЗРІЛІСТЬ',     v: selectedPos.daysToMaturity > 0 ? `${selectedPos.daysToMaturity} ДН` : 'ДЕФОЛТ' },
                            ].map((f, i) => (
                              <div key={i} className="p-6 border-2 border-white/5 bg-black rounded-[2.5rem] shadow-inner group hover:border-red-500/20 transition-all">
                                <p className="text-[9px] text-slate-800 uppercase font-black tracking-widest mb-3 group-hover:text-red-500/60 transition-colors italic">{f.l}</p>
                                <p className="text-2xl font-black text-white font-mono italic tracking-tighter">{f.v}</p>
                              </div>
                            ))}
                          </div>

                          <div className="p-8 bg-red-600/5 border-2 border-red-500/20 rounded-[3rem] relative group/action">
                             <div className="flex items-center gap-4 mb-4">
                                <Flame size={20} className="text-red-500 animate-pulse" />
                                <h4 className="text-[11px] font-black text-red-500/60 uppercase tracking-[0.5em] italic">КРИТИЧНИЙ_ТРИГЕР</h4>
                             </div>
                             <p className="text-[15px] font-black text-red-100 italic leading-tight uppercase tracking-tight">
                               {selectedPos.trigger}
                             </p>
                             <div className="absolute top-0 right-0 p-8 opacity-10">
                                <AlertOctagon size={60} className="text-red-600" />
                             </div>
                          </div>

                          <div className="space-y-4">
                            <button className="w-full py-8 bg-red-600 text-white text-[14px] font-black uppercase tracking-[0.6em] italic hover:brightness-110 transition-all shadow-4xl rounded-[2.5rem] flex items-center justify-center gap-6 border-4 border-red-500/20">
                               <Zap size={24} /> ВИКОНАТИ_ПРИМУС
                            </button>
                            <button className="w-full py-6 bg-black border-2 border-white/10 text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] italic hover:text-white hover:border-red-500/30 transition-all rounded-[2.5rem] shadow-2xl">
                               ЗАВАНТАЖИТИ_ЮРИДИЧНИЙ_ФАЙЛ
                            </button>
                          </div>
                       </div>
                    </TacticalCard>

                    {/* ── ТАЙМЛАЙН WRAITH ── */}
                    <TacticalCard className="p-10 bg-black/60 border-2 border-white/5 rounded-[3.5rem] shadow-3xl">
                       <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] mb-10 flex items-center gap-4 italic relative">
                          <Activity size={18} className="text-red-600 animate-pulse" />
                          ХРОНОЛОГІЯ_ШВИДКОСТІ_РИЗИКУ
                          <div className="ml-auto w-2 h-2 bg-red-600 rounded-full shadow-[0_0_10px_#e11d48]" />
                       </h3>
                       <div className="h-[220px]">
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={RISK_TIMELINE} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                             <defs>
                               <linearGradient id="riskGradElite" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%"  stopColor="#E11D48" stopOpacity={0.4} />
                                 <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                               </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,175,55,0.02)" vertical={false} />
                             <XAxis dataKey="t" hide />
                             <YAxis hide domain={[100, 130]} />
                             <Tooltip
                               contentStyle={{ background: '#020202', border: '2px solid rgba(225,29,72,0.4)', borderRadius: '24px', color: '#fff', fontSize: '10px' }}
                               itemStyle={{ color: '#E11D48', fontWeight: '900' }}
                             />
                             <Area type="monotone" dataKey="risk" stroke="#E11D48" strokeWidth={4} fill="url(#riskGradElite)" animationDuration={3000} />
                           </AreaChart>
                         </ResponsiveContainer>
                       </div>
                    </TacticalCard>

                    {/* ── СЕКТОРНИЙ РОЗПОДІЛ WRAITH ── */}
                    <TacticalCard className="p-10 bg-black/60 border-2 border-white/5 rounded-[3.5rem] shadow-3xl overflow-hidden relative">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Radar size={100} className="text-red-500" />
                       </div>
                       <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] mb-8 italic leading-none">РАДАР_СЕКТОРНОГО_РИЗИКУ</h3>
                       <div className="flex items-center gap-10">
                          <PieChart width={140} height={140}>
                             <Pie data={RISK_BREAKDOWN} innerRadius={42} outerRadius={62} paddingAngle={4} dataKey="value" cx="50%" cy="50%">
                               {RISK_BREAKDOWN.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                             </Pie>
                          </PieChart>
                          <div className="space-y-4 flex-1">
                            {RISK_BREAKDOWN.map((r, i) => (
                              <div key={i} className="flex items-center justify-between group/leg">
                                <div className="flex items-center gap-4">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color, boxShadow: `0 0 10px ${r.color}40` }} />
                                  <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-tight group-hover/leg:text-slate-300 transition-colors leading-none">{r.name}</span>
                                </div>
                                <span className="text-[11px] font-black text-white font-mono italic leading-none">{r.amount}</span>
                              </div>
                            ))}
                          </div>
                       </div>
                    </TacticalCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="max-w-[1850px] mx-auto px-12 mt-12 pb-24">
            <DiagnosticsTerminal />
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(225,29,72,.15);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(225,29,72,.3)}` }} />
      </div>
    </PageTransition>
  );
};

export default PortfolioRiskView;
