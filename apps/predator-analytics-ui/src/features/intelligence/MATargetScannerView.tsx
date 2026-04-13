/**
 * 🎯 M&A TARGET SCANNER | v56.4
 * PREDATOR Analytics — Mergers & Acquisitions Intelligence
 *
 * Компанії у фінансових труднощах — можливості:
 * поглинання, партнерства, купівля активів,
 * конкурентна розвідка, market entry.
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Building2, TrendingDown, TrendingUp, DollarSign,
  AlertTriangle, Search, Filter, Download, Eye,
  Users, BarChart3, Globe, Clock, ChevronRight,
  Crosshair, Star, Zap, ShieldAlert, ArrowUpRight,
  Lock, CheckCircle, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { cn } from '@/utils/cn';

// ─── ТИПИ і ДАНІ ──────────────────────────────────────────

type CompanyStatus = 'distress' | 'restructuring' | 'opportunity' | 'watch';
type DealType = 'acquisition' | 'partnership' | 'asset-buy' | 'equity';

interface MATarget {
  id: string;
  name: string;
  edrpou: string;
  sector: string;
  revenue: string;
  debt: string;
  distressScore: number;
  opportunityScore: number;
  status: CompanyStatus;
  dealTypes: DealType[];
  employees: number;
  founded: number;
  location: string;
  reason: string[];
  assets: string;
  priceTarget: string;
}

const MA_TARGETS: MATarget[] = [
  {
    id: 'ma-001',
    name: 'ТОВ "АгроМаш-Схід"',
    edrpou: '34521876',
    sector: 'Сільгоспмашинобудування',
    revenue: '$8.4M',
    debt: '$12.1M',
    distressScore: 87,
    opportunityScore: 91,
    status: 'distress',
    dealTypes: ['acquisition', 'asset-buy'],
    employees: 312,
    founded: 2004,
    location: 'Дніпро',
    reason: ['Борг > виручка', 'Судові провадження (3)', 'Втрата ключового замовника'],
    assets: 'Завод 12,000 м², 180 od. техніки, патенти',
    priceTarget: '$3.2M–$5.5M',
  },
  {
    id: 'ma-002',
    name: 'ПАТ "КАРГО-ТРАНС"',
    edrpou: '21908743',
    sector: 'Вантажні перевезення',
    revenue: '$22M',
    debt: '$8.4M',
    distressScore: 61,
    opportunityScore: 84,
    status: 'restructuring',
    dealTypes: ['partnership', 'equity'],
    employees: 847,
    founded: 1998,
    location: 'Одеса',
    reason: ['Реструктуризація боргу', 'Мажоритарний акціонер виходить', '40% автопарку застаріло'],
    assets: '420 вантажівок, 18 складів, 3 термінали',
    priceTarget: '$9M–$14M',
  },
  {
    id: 'ma-003',
    name: 'ТОВ "МедТех Україна"',
    edrpou: '43120956',
    sector: 'Медичне обладнання',
    revenue: '$4.1M',
    debt: '$1.2M',
    distressScore: 38,
    opportunityScore: 96,
    status: 'opportunity',
    dealTypes: ['acquisition', 'partnership', 'equity'],
    employees: 94,
    founded: 2016,
    location: 'Харків',
    reason: ['Власник шукає вихід', 'Зростання 45%/рік', 'Унікальна ліцензія МОЗ'],
    assets: 'Ліцензії, B2B-контракти з 47 лікарнями, R&D команда',
    priceTarget: '$4.5M–$7.8M',
  },
  {
    id: 'ma-004',
    name: 'ФОП "IT-Construct"',
    edrpou: '2847391028',
    sector: 'Будівельні технології',
    revenue: '$1.8M',
    debt: '$3.2M',
    distressScore: 92,
    opportunityScore: 62,
    status: 'distress',
    dealTypes: ['asset-buy'],
    employees: 28,
    founded: 2019,
    location: 'Київ',
    reason: ['Форс-мажор через бойові дії', 'Замовники розірвали контракти', 'Заборгованість з оренди'],
    assets: 'SaaS-платформа BIM, 12 активних ліцензій',
    priceTarget: '$280K–$600K',
  },
  {
    id: 'ma-005',
    name: 'ТОВ "ЕкоЕнерго Захід"',
    edrpou: '38740921',
    sector: 'Відновлювана енергетика',
    revenue: '$6.7M',
    debt: '$2.1M',
    distressScore: 28,
    opportunityScore: 98,
    status: 'watch',
    dealTypes: ['equity', 'partnership'],
    employees: 156,
    founded: 2013,
    location: 'Львів',
    reason: ['Зростання x3 за 2 роки', 'Шукають інвестора для масштабування', 'Грантова підтримка ЄС'],
    assets: '3 сонячні парки (64 MWт), 2 БіоГЕС дозволи',
    priceTarget: '$18M–$28M',
  },
];

const SECTOR_DATA = [
  { sector: 'Агро', targets: 24, avgRisk: 74 },
  { sector: 'Логістика', targets: 18, avgRisk: 61 },
  { sector: 'Медтех', targets: 12, avgRisk: 38 },
  { sector: 'IT', targets: 31, avgRisk: 55 },
  { sector: 'Енергія', targets: 9, avgRisk: 29 },
  { sector: 'Будівництво', targets: 22, avgRisk: 81 },
];

const STATUS_CFG = {
  distress:       { label: 'ФІНАНСОВИЙ СТРЕС',   color: '#ef4444', bg: 'bg-red-900/20',     border: 'border-red-800/40',    icon: AlertTriangle },
  restructuring:  { label: 'РЕСТРУКТУРИЗАЦІЯ',   color: '#f59e0b', bg: 'bg-amber-900/15',   border: 'border-amber-800/30',  icon: RefreshCw },
  opportunity:    { label: 'МОЖЛИВІСТЬ',          color: '#10b981', bg: 'bg-emerald-900/15', border: 'border-emerald-800/30', icon: Star },
  watch:          { label: 'СПОСТЕРЕЖЕННЯ',       color: '#6366f1', bg: 'bg-indigo-900/15',  border: 'border-indigo-800/30', icon: Eye },
};

const DEAL_CFG = {
  acquisition: { label: 'Поглинання',  color: '#ef4444' },
  partnership: { label: 'Партнерство', color: '#06b6d4' },
  'asset-buy': { label: 'Купівля активів', color: '#f59e0b' },
  equity:      { label: 'Вхід в капітал',  color: '#10b981' },
};

// ─── КОМПОНЕНТ ──────────────────────────────────────────────

const MATargetScannerView: React.FC = () => {
  const [selectedTarget, setSelectedTarget] = useState<MATarget | null>(null);
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'opportunity' | 'distress'>('opportunity');

  const filtered = MA_TARGETS
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t =>
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sector.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === 'opportunity'
        ? b.opportunityScore - a.opportunityScore
        : b.distressScore - a.distressScore
    );

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-24 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 40% 10%, rgba(99,102,241,0.04) 0%, transparent 55%)' }} />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-6 space-y-8">

        {/* ── ЗАГОЛОВОК ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-700/15 blur-2xl rounded-full" />
              <div className="relative p-5 bg-black border border-indigo-900/50">
                <Target size={38} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-1 h-1 bg-indigo-600 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-indigo-700/70 uppercase tracking-[0.5em]">
                  M&A INTELLIGENCE · DEAL SOURCING · CLASSIFIED · v56.4
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                M&A TARGET{' '}
                <span className="text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">SCANNER</span>
              </h1>
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] mt-1">
                КОМПАНІЇ ПІД ТИСКОМ · МОЖЛИВОСТІ ПОГЛИНАНЬ · АКТИВИ ДО ПРОДАЖУ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-5 py-3 bg-black border border-indigo-900/40">
              <Crosshair size={13} className="text-indigo-600" />
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                {MA_TARGETS.length} ЦІЛЕЙ АКТИВНИХ
              </span>
            </div>
            <button className="px-8 py-3 bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider hover:bg-indigo-600 transition-colors border border-indigo-500/30 flex items-center gap-2">
              <Download size={13} />
              DEAL PACK PDF
            </button>
          </div>
        </div>

        {/* ── МЕТРИКИ ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'ЦІЛЕЙ ЗНАЙДЕНО',       value: '127',   icon: Target,      color: '#6366f1', sub: 'По Україні' },
            { label: 'В ДЕФОЛТ-ЗОНІ',         value: '43',    icon: AlertTriangle, color: '#ef4444', sub: 'Стрес > 80%' },
            { label: 'ТОПОВИХ МОЖЛИВОСТЕЙ',   value: '18',    icon: Star,        color: '#10b981', sub: 'Score > 90%' },
            { label: 'ЗАГАЛЬНА ОЦІНКА',       value: '$340M', icon: DollarSign,  color: '#f59e0b', sub: 'Сукупна вартість' },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-7 bg-black border border-slate-800/50 hover:border-slate-700/60 transition-all relative overflow-hidden group"
            >
              <div className="absolute -right-3 -bottom-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <m.icon size={70} style={{ color: m.color }} />
              </div>
              <div className="space-y-2 relative">
                <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">{m.label}</p>
                <h3 className="text-3xl font-black text-white font-mono">{m.value}</h3>
                <p className="text-[8px] text-slate-700 font-black uppercase tracking-wider">{m.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── ОСНОВНИЙ КОНТЕНТ ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Список цілей */}
          <div className="lg:col-span-7 space-y-4">
            {/* Фільтри */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-black border border-slate-800/50 px-4 py-2">
                <Search size={12} className="text-slate-600" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Назва або сектор..."
                  className="bg-transparent text-[11px] text-white outline-none placeholder:text-slate-700 font-mono w-36"
                />
              </div>
              <div className="flex gap-1 bg-black border border-slate-800/50 p-1">
                {([['all', 'УСІ'], ['distress', 'СТРЕС'], ['opportunity', 'НАГОДА'], ['watch', 'НАГЛЯД']] as const).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setFilterStatus(v)}
                    className={cn(
                      "px-3 py-1.5 text-[7px] font-black uppercase tracking-wider transition-all",
                      filterStatus === v ? "bg-indigo-700 text-white" : "text-slate-600 hover:text-slate-300"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-black border border-slate-800/50 p-1">
                <button
                  onClick={() => setSortBy('opportunity')}
                  className={cn("px-3 py-1.5 text-[7px] font-black uppercase tracking-wider transition-all", sortBy === 'opportunity' ? "bg-emerald-800/60 text-emerald-300" : "text-slate-600")}
                >
                  ↑ НАГОДА
                </button>
                <button
                  onClick={() => setSortBy('distress')}
                  className={cn("px-3 py-1.5 text-[7px] font-black uppercase tracking-wider transition-all", sortBy === 'distress' ? "bg-red-900/40 text-red-400" : "text-slate-600")}
                >
                  ↑ СТРЕС
                </button>
              </div>
            </div>

            {/* Список */}
            <div className="space-y-3">
              {filtered.map((target, i) => {
                const sc = STATUS_CFG[target.status];
                const StatusIcon = sc.icon;
                return (
                  <motion.div
                    key={target.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedTarget(target)}
                    className={cn(
                      "p-6 border cursor-pointer transition-all relative overflow-hidden group",
                      selectedTarget?.id === target.id
                        ? "bg-indigo-950/15 border-indigo-800/50"
                        : "bg-black border-slate-800/40 hover:border-slate-700/60"
                    )}
                  >
                    {selectedTarget?.id === target.id && (
                      <div className="absolute left-0 inset-y-0 w-0.5 bg-indigo-600 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                    )}

                    <div className="flex items-start gap-5">
                      {/* Скор */}
                      <div className="text-center shrink-0 w-16">
                        <div className="text-[26px] font-black font-mono text-emerald-400 leading-none">
                          {target.opportunityScore}
                        </div>
                        <div className="text-[7px] font-black text-emerald-700 uppercase mt-0.5">НАГОДА</div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="text-[13px] font-black text-white group-hover:text-indigo-300 transition-colors uppercase">
                            {target.name}
                          </h3>
                          <span className={cn("text-[7px] font-black px-2 py-0.5 border uppercase flex items-center gap-1", sc.bg, sc.border)}>
                            <StatusIcon size={9} style={{ color: sc.color }} />
                            {sc.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[8px] text-slate-600 font-mono mb-3">
                          <span className="font-black text-slate-500">{target.sector}</span>
                          <span>·</span>
                          <span>{target.location}</span>
                          <span>·</span>
                          <span>{target.employees} осіб</span>
                          <span>·</span>
                          <span>ЄДРПОУ {target.edrpou}</span>
                        </div>

                        <div className="flex items-center gap-4 mb-3">
                          <div>
                            <p className="text-[7px] text-slate-700 uppercase">Виручка</p>
                            <p className="text-[11px] font-black text-white font-mono">{target.revenue}</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-slate-700 uppercase">Борг</p>
                            <p className="text-[11px] font-black text-red-400 font-mono">{target.debt}</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-slate-700 uppercase">Ціна входу</p>
                            <p className="text-[11px] font-black text-indigo-400 font-mono">{target.priceTarget}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {target.dealTypes.map(d => (
                            <span key={d} className="text-[7px] font-black px-2 py-0.5 bg-slate-900 border border-slate-800 uppercase tracking-wider"
                              style={{ color: DEAL_CFG[d].color }}>
                              {DEAL_CFG[d].label}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <div className="text-[10px] font-black font-mono" style={{ color: target.distressScore > 70 ? '#ef4444' : '#f59e0b' }}>
                          СТРЕС {target.distressScore}%
                        </div>
                        <div className="h-12 w-0.5 bg-slate-800 relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 right-0 transition-all"
                            style={{ height: `${target.distressScore}%`, backgroundColor: target.distressScore > 70 ? '#ef4444' : '#f59e0b' }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Деталі та графіки */}
          <div className="lg:col-span-5 space-y-5">
            {/* Деталі цілі */}
            <AnimatePresence mode="wait">
              {selectedTarget ? (
                <motion.div
                  key={selectedTarget.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-black border border-indigo-900/30 p-6 space-y-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-[15px] font-black text-white uppercase">{selectedTarget.name}</h2>
                      <p className="text-[9px] text-slate-600 mt-0.5">{selectedTarget.sector} · {selectedTarget.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[22px] font-black text-emerald-400 font-mono">{selectedTarget.opportunityScore}%</p>
                      <p className="text-[7px] text-emerald-700 uppercase font-black">OPPORTUNITY SCORE</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      { l: 'Виручка', v: selectedTarget.revenue, c: 'text-white' },
                      { l: 'Борг',    v: selectedTarget.debt,    c: 'text-red-400' },
                      { l: 'Ціль',   v: selectedTarget.priceTarget, c: 'text-indigo-400' },
                    ].map((f, i) => (
                      <div key={i} className="p-3 border border-slate-800/50 bg-slate-950/40">
                        <p className="text-[7px] text-slate-600 uppercase font-black">{f.l}</p>
                        <p className={cn("text-[12px] font-black font-mono mt-1", f.c)}>{f.v}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-3">ПРИЧИНИ ВРАЗЛИВОСТІ</p>
                    <div className="space-y-2">
                      {selectedTarget.reason.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border border-slate-800/40">
                          <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                          <span className="text-[10px] font-black text-slate-400">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">АКТИВИ</p>
                    <div className="p-4 border border-slate-800/40 bg-slate-950/40">
                      <p className="text-[10px] font-black text-slate-300">{selectedTarget.assets}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">ТИПИ УГОДИ</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedTarget.dealTypes.map(d => (
                        <div key={d} className="px-4 py-2 border text-[9px] font-black uppercase tracking-wider" style={{ color: DEAL_CFG[d].color, borderColor: `${DEAL_CFG[d].color}30` }}>
                          {DEAL_CFG[d].label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="w-full py-4 bg-indigo-700 text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-3">
                    <Crosshair size={15} />
                    ІНІЦІЮВАТИ КОНТАКТ
                  </button>
                </motion.div>
              ) : (
                <div className="bg-black border border-slate-800/30 p-10 text-center">
                  <Target size={36} className="mx-auto mb-4 text-slate-800" />
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                    ОБЕРІТЬ ЦІЛЬ ДЛЯ ДЕТАЛЬНОГО АНАЛІЗУ
                  </p>
                </div>
              )}
            </AnimatePresence>

            {/* Розподіл по секторах */}
            <div className="bg-black border border-slate-800/50 p-6">
              <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] mb-5 flex items-center gap-2">
                <BarChart3 size={12} className="text-indigo-600" />
                ЦІЛІ ПО СЕКТОРАХ
              </h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SECTOR_DATA} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="sector" tick={{ fill: '#475569', fontSize: 8, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#020008', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 0 }}
                    />
                    <Bar dataKey="targets" name="Цілей" fill="#6366f1" radius={[2, 2, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MATargetScannerView;
