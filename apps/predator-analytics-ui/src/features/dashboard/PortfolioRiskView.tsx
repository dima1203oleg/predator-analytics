/**
 * 💼 P&L РИЗИКІВ ПОРТФЕЛЮ | v63.0-ELITE
 * PREDATOR Analytics — Portfolio Risk Management
 *
 * Скільки $ у зоні ризику прямо зараз:
 * контрагенти, санкції, ланцюги постачання, фін.ризики.
 * CEO-рівень · Sovereign Power Design · LIVE · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { Button } from '@/components/ui/button';
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
import { useThermalHover } from '@/hooks/useThermalHover';
import { useViewport } from '@/hooks/useViewport';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { HoloCard } from '@/components/ui/HoloCard';
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
  { name: 'Санкційний',   value: 33, amount: '$41.8M',  color: '#f43f5e' },
  { name: 'КОНТРАГЕНТИ',  value: 26, amount: '$33.1M',  color: '#e11d48' },
  { name: 'ЛАНЦЮГИ_ПОСТАЧАННЯ',value: 20, amount: '$25.5M',  color: '#fb7185' },
  { name: 'FX / Валютний',value: 14, amount: '$17.8M', color: '#9f1239' },
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
  critical: '#f43f5e',
  high:     '#fbbf24',
  medium:   '#f59e0b',
  low:      '#10b981',
};

const RISK_LABEL: Partial<Record<RiskLevelValue, string>> = {
  critical: 'КРИТИЧНИЙ',
  high:     'ВИСОКИЙ',
  medium:   'СЕРЕДНІЙ',
  low:      'НИЗЬКИЙ',
};

const RiskPositionCard: React.FC<{
  pos: RiskPosition;
  index: number;
  selectedPos: RiskPosition | null;
  setSelectedPos: (pos: RiskPosition) => void;
}> = ({ pos, index, selectedPos, setSelectedPos }) => {
  const { isCompact } = useViewport();
  const { ref: thermalRef, style: thermalStyle } = useThermalHover(1.2);
  const isSelected = selectedPos?.id === pos.id;

  return (
    <motion.div
      key={pos.id}
      ref={thermalRef as any}
      style={thermalStyle}
      initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }}
      onClick={() => setSelectedPos(pos)}
      className={cn(
        "border-2 cursor-pointer transition-all relative overflow-hidden group shadow-3xl",
        isCompact ? "p-5 rounded-3xl" : "p-10 rounded-[3.5rem]",
        isSelected
          ? "bg-cyan-600/[0.03] border-cyan-500/30 shadow-4xl"
          : "bg-black/60 border-white/5 hover:border-white/20"
      )}
    >
      {isSelected && (
        <div className="absolute left-0 inset-y-0 w-2.5 bg-cyan-600 shadow-[0_0_20px_#f43f5e]" />
      )}

      <div className={cn("flex items-start", isCompact ? "gap-4 pl-0" : "gap-10 pl-4")}>
        <div className={cn(
          "shrink-0 rounded-[2rem] bg-black/80 border-2 border-white/5 flex flex-col items-center justify-center shadow-inner group-hover:border-cyan-500/30 transition-all",
          isCompact ? "w-16 h-16 rounded-2xl" : "w-24 h-24 rounded-[2rem]"
        )}>
          <span className={cn("font-black font-mono italic tracking-tighter leading-none", isCompact ? "text-xl" : "text-3xl")} style={{ color: RISK_COLOR[pos.riskLevel] }}>
            {pos.riskPct}%
          </span>
          <span className="text-[8px] font-black uppercase text-slate-700 mt-2 tracking-widest italic">РИЗИК</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-[11px] font-black font-mono text-slate-700 uppercase tracking-widest">{pos.id}</span>
            <span className="text-[10px] font-black text-cyan-500/60 uppercase tracking-widest italic">{pos.country}</span>
          </div>
          <h3 className={cn("font-black text-white group-hover:text-cyan-500 transition-colors uppercase italic tracking-tighter leading-none mb-4", isCompact ? "text-xl" : "text-3xl")}>
            {pos.counterparty}
          </h3>
          <div className="flex items-center gap-8 mb-6">
            <div className="flex items-center gap-3 text-slate-500">
               <Building2 size={16} />
               <span className="text-[12px] font-black uppercase italic tracking-tight">{pos.type}</span>
            </div>
            <div className={cn("flex items-center gap-2 px-4 py-1.5 rounded-xl border italic text-[9px] font-black tracking-widest uppercase shadow-inner",
              pos.riskLevel === 'critical' ? 'border-cyan-500/30 text-cyan-500 bg-cyan-500/5' : 'border-slate-800 text-slate-500 bg-white/5'
            )}>
               {RISK_LABEL[pos.riskLevel]}
            </div>
          </div>

          <div className={cn("grid gap-6", isCompact ? "grid-cols-1" : "grid-cols-2 gap-10")}>
            <div>
              <p className="text-[9px] text-slate-700 uppercase font-black tracking-[0.4em] mb-2 italic">ЕКСПОЗИЦІЯ_NET</p>
              <p className={cn("font-black text-white font-mono italic", isCompact ? "text-xl" : "text-2xl")}>{pos.exposure}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-700 uppercase font-black tracking-[0.4em] mb-2 italic">У_ЗОНІ_РИЗИКУ</p>
              <p className={cn("font-black font-mono italic", isCompact ? "text-xl" : "text-2xl")} style={{ color: RISK_COLOR[pos.riskLevel] }}>{pos.atRisk}</p>
            </div>
          </div>
        </div>

        <div className="shrink-0 pt-6">
          {pos.trend === 'up' ? (
            <div className="relative">
              <TrendingUp size={32} className="text-cyan-500 " />
              <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity }} className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-500 rounded-full" />
            </div>
          ) : (
            <Activity size={32} className="text-slate-800" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

const PortfolioRiskView: React.FC = () => {
  const [selectedPos, setSelectedPos] = useState<RiskPosition | null>(RISK_POSITIONS[0]);
  const [liveRisk, setLiveRisk] = useState(127.4);
  const [filter, setFilter] = useState<RiskLevelValue | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline, nodeSource, healingProgress } = useBackendStatus();
  const { isCompact } = useViewport();

  // Нав'язливі повідомлення про автономний режим видалено (HR-04 compliant)

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
      <div className={cn("min-h-screen text-slate-200 font-sans relative overflow-hidden bg-[#010409]", isCompact ? "pb-10" : "pb-32")}>
        <AdvancedBackground mode="sovereign" />
        <CyberGrid color="rgba(244, 63, 94, 0.05)" />

        <div className={cn("relative z-10 max-w-[1850px] mx-auto space-y-12", isCompact ? "p-4" : "p-12")}>
          
          <ViewHeader
            title={
              <div className="flex items-center gap-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-500/15 blur-3xl rounded-full scale-150 group-hover:scale-200 transition-transform duration-1000" />
                  <div className="relative p-7 bg-black border-2 border-cyan-500/40 rounded-[3rem] shadow-4xl transform rotate-3 hover:rotate-0 transition-all cursor-crosshair">
                    <DollarSign size={54} className="text-cyan-500 " />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-600 rounded-full border-4 border-black  shadow-[0_0_15px_#f43f5e]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full  shadow-[0_0_8px_#f43f5e]" />
                    <span className="text-[10px] font-black text-cyan-500/80 uppercase tracking-[0.6em] italic">
                      ЦЕНТР ПОРТФЕЛЬНИХ РИЗИКІВ · v63.0-ELITE
                    </span>
                  </div>
                  <h1 className={cn("font-black text-white tracking-tighter uppercase italic skew-x-[-3deg]", isCompact ? "text-4xl" : "text-6xl")}>
                    P&L <span className={cn("text-cyan-600 underline decoration-rose-600/30 underline-offset-[12px] italic uppercase tracking-tighter", isCompact ? "decoration-[8px]" : "decoration-[14px]")}>РИЗИКІВ</span>
                  </h1>
                  <p className="text-[12px] text-slate-600 font-black uppercase tracking-[0.5em] mt-6 italic border-l-4 border-cyan-500/30 pl-8 opacity-90 max-w-2xl">
                    МОНІТОРИНГ ДЕФОЛТНИХ ВЕКТОРІВ · КРИТИЧНА ЕКСПОЗИЦІЯ · СУВЕРЕННИЙ АНАЛІЗ
                  </p>
                </div>
              </div>
            }
            badges={[
              { label: 'ТАЙНО_Т1', color: 'amber', icon: <Lock size={10} /> },
              { label: 'СУВЕРЕН_ГОТОВНІСТЬ', color: 'primary', icon: <Shield size={10} /> },
              { 
                label: nodeSource, 
                color: isOffline ? 'warning' : 'danger', 
                icon: <Activity size={10} className={isOffline ? '' : ''} /> 
              },
            ]}
            stats={[
              { label: 'У ЗОНІ РИЗИКУ', value: `$${liveRisk}M`, icon: <TrendingUp size={14} />, color: 'danger' },
              { 
                label: isOffline ? 'РЕЗЕРВ_СИНХРО' : 'КРИТИЧНИЙ_NET', 
                value: isOffline ? `${Math.floor(healingProgress)}%` : '$41.8M', 
                icon: isOffline ? <Activity /> : <AlertTriangle />, 
                color: isOffline ? 'warning' : 'danger',
                animate: isOffline
              },
              { label: 'СИСТЕМНИЙ ПОРТФЕЛЬ', value: '$847M', icon: <Activity size={14} />, color: 'primary' },
              { label: 'ВУЗОЛ_ДЖЕРЕЛО', value: isOffline ? 'ДЗЕРКАЛО' : 'ОСНОВНИЙ', icon: <Cpu />, color: isOffline ? 'warning' : 'success' },
            ]}
            actions={
              <div className="flex items-center gap-6">
                <Button variant="cyber"
                  onClick={handleRefresh}
                  className="p-6 rounded-[2rem] bg-black/60 border-2 border-white/5 text-slate-500 hover:text-cyan-500 hover:border-cyan-500/30 transition-all shadow-4xl group"
                >
                  <RefreshCw size={24} className={cn(refreshing && 'animate-spin text-cyan-500')} />
                </Button>
                <Button variant="cyber" className="px-14 py-6 bg-cyan-600 text-white text-[12px] font-black uppercase tracking-[0.4em] italic hover:brightness-110 transition-all rounded-[2rem] shadow-4xl flex items-center gap-4 font-bold">
                  <Download size={24} />
                  {!isCompact && "ДОСЬЄ_УПРАВЛІННЯ_ЕЛІТА"}
                </Button>
              </div>
            }
          />

          {/* ── KPI GRID ELITE ── */}
          <div className={cn("grid", isCompact ? "grid-cols-1 gap-4" : "grid-cols-2 lg:grid-cols-4 gap-8")}>
            {[
              { l: 'КРИТИЧНІ ЛОТИ',    v: '2',          sub: 'POS-001, POS-002',       c: '#f43f5e' },
              { l: 'ІНДЕКС_РИЗИКУ',    v: '15.1%',      sub: 'Від загальних активів',       c: '#fb7185' },
              { l: 'ГЕО_ОХОПЛЕННЯ',    v: '4 Країни',   sub: 'Географічне покриття',  c: '#fb7185' },
              { l: 'ВІДКРИТІСТЬ_АЛЬФА',   v: `$127.4M`,    sub: 'Вплив на суверенний прибуток',  c: '#f43f5e' },
            ].map((m, i) => (
              <motion.div
                key={m.l}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={cn("bg-black/60 border-2 border-white/5 hover:border-cyan-500/30 transition-all shadow-2xl group relative overflow-hidden", isCompact ? "p-5 rounded-3xl" : "p-10 rounded-[3.5rem]")}
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rose-500/40 to-transparent opacity-40" />
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] mb-4 italic">{m.l}</p>
                <p className="text-4xl font-black font-mono tracking-tighter italic" style={{ color: m.c }}>{m.v}</p>
                <p className="text-[10px] text-slate-800 font-black uppercase mt-4 tracking-widest opacity-60 underline decoration-rose-500/10 italic">{m.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className={cn("grid grid-cols-12", isCompact ? "gap-4" : "gap-10")}>
            {/* ── ЛІВА ПАНЕЛЬ: ПОЗИЦІЇ ── */}
            <div className="col-span-12 xl:col-span-8 space-y-8">
              
              <div className="flex items-center gap-4 p-3 bg-black border-2 border-white/5 rounded-[2.5rem] w-full max-w-full overflow-x-auto no-scrollbar shadow-4xl ">
                <div className="flex gap-2 bg-black border-2 border-white/5 p-2 rounded-2xl shadow-inner min-w-max">
                  {(['all', 'critical', 'high', 'medium'] as const).map(f => (
                    <Button variant="cyber"
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all rounded-xl italic",
                        filter === f
                          ? "bg-cyan-600 text-white shadow-4xl scale-105 font-bold"
                          : "text-slate-600 hover:text-slate-300 border-2 border-transparent hover:border-cyan-500/10 hover:bg-white/5"
                      )}
                    >
                      {f === 'all' ? 'УСІ_ПОЗИЦІЇ' : RISK_LABEL[f]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {filtered.map((pos, i) => (
                  <RiskPositionCard
                    key={pos.id}
                    pos={pos}
                    index={i}
                    selectedPos={selectedPos}
                    setSelectedPos={setSelectedPos}
                  />
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
                    <HoloCard variant="holographic" className={cn("bg-black/80 border-2 border-cyan-500/20 shadow-4xl relative overflow-hidden", isCompact ? "p-6 rounded-[2.5rem]" : "p-10 rounded-[4rem]")}>
                       <div className="absolute top-0 right-0 p-24 opacity-[0.03] pointer-events-none">
                          <Target size={260} className="text-cyan-500" />
                       </div>
                       <div className="relative z-10 space-y-10">
                          <div className="flex items-center justify-between">
                             <div className="px-5 py-2 bg-cyan-600/10 border border-cyan-600/30 rounded-full">
                                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest italic">{selectedPos.id}</span>
                             </div>
                             <div className="flex gap-2">
                                <span className="w-2 h-2 bg-cyan-600 rounded-full animate-ping" />
                                <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest font-mono italic">АКТИВНА_ЗАГРОЗА</span>
                             </div>
                          </div>

                          <div>
                             <h2 className={cn("font-black text-white leading-none tracking-tighter italic uppercase mb-4", isCompact ? "text-[28px]" : "text-[42px]")}>{selectedPos.counterparty}</h2>
                             <p className="text-[12px] text-cyan-600 font-black uppercase tracking-[0.5em] italic bg-cyan-500/5 px-6 py-2 rounded-full w-fit border border-cyan-500/10 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                               {selectedPos.country} · {selectedPos.type}
                             </p>
                          </div>

                          <div className={cn("grid gap-4", isCompact ? "grid-cols-1" : "grid-cols-2 gap-6")}>
                            {[
                              { l: 'ЕКСПОЗИЦІЯ', v: selectedPos.exposure },
                              { l: 'NET_РИЗИК',   v: selectedPos.atRisk },
                              { l: 'ІНДЕКС_X',     v: `${selectedPos.riskPct}%` },
                              { l: 'ЗРІЛІСТЬ',     v: selectedPos.daysToMaturity > 0 ? `${selectedPos.daysToMaturity} ДН` : 'ДЕФОЛТ' },
                            ].map((f, i) => (
                              <div key={i} className={cn("border-2 border-white/5 bg-black shadow-inner group hover:border-cyan-500/20 transition-all", isCompact ? "p-4 rounded-[1.5rem]" : "p-6 rounded-[2.5rem]")}>
                                <p className="text-[9px] text-slate-800 uppercase font-black tracking-widest mb-3 group-hover:text-cyan-500/60 transition-colors italic">{f.l}</p>
                                <p className={cn("font-black text-white font-mono italic tracking-tighter", isCompact ? "text-xl" : "text-2xl")}>{f.v}</p>
                              </div>
                            ))}
                          </div>

                          <div className="p-8 bg-cyan-600/5 border-2 border-cyan-500/20 rounded-[3rem] relative group/action">
                             <div className="flex items-center gap-4 mb-4">
                                <Flame size={20} className="text-cyan-500 " />
                                <h4 className="text-[11px] font-black text-cyan-500/60 uppercase tracking-[0.5em] italic">КРИТИЧНИЙ_ТРИГЕР</h4>
                             </div>
                             <p className="text-[15px] font-black text-rose-100 italic leading-tight uppercase tracking-tight">
                               {selectedPos.trigger}
                             </p>
                             <div className="absolute top-0 right-0 p-8 opacity-10">
                                <AlertOctagon size={60} className="text-cyan-600" />
                             </div>
                          </div>

                          <div className="space-y-4">
                            <Button variant="cyber" className="w-full py-8 bg-cyan-600 text-white text-[14px] font-black uppercase tracking-[0.6em] italic hover:brightness-110 transition-all shadow-4xl rounded-[2.5rem] flex items-center justify-center gap-6 border-4 border-cyan-500/20">
                               <Zap size={24} /> ВИКОНАТИ_ПРИМУС
                            </Button>
                            <Button variant="cyber" className="w-full py-6 bg-black border-2 border-white/10 text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] italic hover:text-white hover:border-cyan-500/30 transition-all rounded-[2.5rem] shadow-2xl">
                               ЗАВАНТАЖИТИ_ЮРИДИЧНИЙ_ФАЙЛ
                            </Button>
                          </div>
                       </div>
                    </HoloCard>

                    {/* ── ТАЙМЛАЙН ELITE ── */}
                    <HoloCard className={cn("bg-black/60 border-2 border-white/5 shadow-3xl", isCompact ? "p-5 rounded-3xl" : "p-10 rounded-[3.5rem]")}>
                       <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] mb-10 flex items-center gap-4 italic relative">
                          <Activity size={18} className="text-cyan-600 " />
                          ХРОНОЛОГІЯ_ШВИДКОСТІ_РИЗИКУ
                          <div className="ml-auto w-2 h-2 bg-cyan-600 rounded-full shadow-[0_0_10px_#f43f5e]" />
                       </h3>
                       <div className="h-[220px]">
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={RISK_TIMELINE} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                             <defs>
                               <linearGradient id="riskGradElite" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.4} />
                                 <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                               </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,175,55,0.02)" vertical={false} />
                             <XAxis dataKey="t" hide />
                             <YAxis hide domain={[100, 130]} />
                             <Tooltip
                               contentStyle={{ background: '#020202', border: '2px solid rgba(244, 63, 94, 0.4)', borderRadius: '24px', color: '#fff', fontSize: '10px' }}
                               itemStyle={{ color: '#f43f5e', fontWeight: '900' }}
                             />
                             <Area type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={4} fill="url(#riskGradElite)" animationDuration={3000} />
                           </AreaChart>
                         </ResponsiveContainer>
                       </div>
                    </HoloCard>

                    {/* ── СЕКТОРНИЙ РОЗПОДІЛ ELITE ── */}
                    <HoloCard className={cn("bg-black/60 border-2 border-white/5 shadow-3xl overflow-hidden relative", isCompact ? "p-5 rounded-3xl" : "p-10 rounded-[3.5rem]")}>
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Radar size={100} className="text-cyan-500" />
                       </div>
                       <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] mb-8 italic leading-none">РАДАР_СЕКТОРНОГО_РИЗИКУ</h3>
                       <div className={cn("flex", isCompact ? "flex-col items-center gap-6" : "items-center gap-10")}>
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
                    </HoloCard>
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
.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(244, 63, 94,.15);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(244, 63, 94,.3)}` }} />
      </div>
    </PageTransition>
  );
};

export default PortfolioRiskView;
