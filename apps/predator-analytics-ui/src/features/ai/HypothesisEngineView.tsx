/**
 *   AI HYPOTHESIS ENGINE | v58.2-WRAITH
 * PREDATOR Analytics — Autonomous Intelligence Hypothesis Generation
 *
 * Автоматична генерація слідчих гіпотез на базі аномалій, патернів
 * і кросс-кореляцій у даних. AI-first, zero-human-bias.
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Brain, Target, AlertTriangle, CheckCircle,
  Clock, Zap, Eye, ArrowUpRight, RefreshCw, Download,
  Filter, ChevronRight, Network, DollarSign, Globe,
  Activity, Lock, FileText, Send, Loader2, Star, Fingerprint, Cpu, Search, Radar
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { ViewHeader } from '@/components/ViewHeader';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';

// ─── ТИПИ ────────────────────────────────────────────────────────────

type HypothesisStatus = 'confirmed' | 'probable' | 'possible' | 'refuted';
type HypothesisCategory = 'financial' | 'network' | 'sanctions' | 'corruption' | 'supply';

interface Evidence {
  source: string;
  description: string;
  weight: number;
  timestamp: string;
}

interface Hypothesis {
  id: string;
  title: string;
  summary: string;
  category: HypothesisCategory;
  status: HypothesisStatus;
  confidence: number;
  impact: string;
  impactValue: string;
  createdAt: string;
  entities: string[];
  evidence: Evidence[];
  nextActions: string[];
  aiModel: string;
  processingTime: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────

const HYPOTHESES: Hypothesis[] = [
  {
    id: 'HYP-0821',
    title: 'Схема виведення активів через BVI-структуру напередодні банкрутства',
    summary: 'AI виявив статистично аномальне зменшення активів МЕТАЛУ Г-ІНВЕСТ за 90 днів до відкриття провадження. Корельовано з 3 офшорними трансферами до Kyoto Holdings (BVI) загальним обсягом $18.4M.',
    category: 'financial',
    status: 'confirmed',
    confidence: 94,
    impact: 'Кримінальна відповідальність · Стягнення активів',
    impactValue: '$18.4M',
    createdAt: '04:12:34',
    entities: ['МЕТАЛУ Г-ІНВЕСТ', 'Kyoto Holdings Ltd (BVI)', 'Ткаченко В.М.'],
    evidence: [
      { source: 'ЄД  / Фінансова звітність', description: 'Активи зменшились з $31.2M до $12.8M за 3 місяці', weight: 95, timestamp: '2025-01-15' },
      { source: 'SWIFT-монітор', description: '3 трансфери $4.1M, $8.7M, $5.6M → Kyoto Holdings', weight: 98, timestamp: '2024-11-03' },
      { source: 'YouControl', description: 'Kyoto Holdings — повʼязана особа: Ткаченко В.М. (PEP)', weight: 87, timestamp: '2024-12-21' },
      { source: 'Судовий реєстр', description: 'Справа про банкрутство відкрита через 91 день після трансферів', weight: 91, timestamp: '2025-02-01' },
    ],
    nextActions: [
      'ПОДАТИ ЗАЯВУ ДО НАБУ — СТ. 199 ККУ',
      'КЛОПОТАННЯ П О ВИЗНАННЯ УГОД НЕДІЙСНИМИ',
      'ЗАПИТ ДО КІП СЬКОГО  ЕГУЛЯТО А НА  ОЗК ИТТЯ UBO',
    ],
    aiModel: 'PREDATOR-SIGINT-7B',
    processingTime: '2.4с',
  },
  {
    id: 'HYP-0734',
    title: 'Картельна змова на тендерах Міноборони через спільних директорів',
    summary: 'Три компанії-учасники 47 тендерів мають спільних кінцевих бенефіціарів через номінальних директорів. Pattern: чергові перемоги без реальної конкуренції. Ймовірна схема "карусель переможців".',
    category: 'corruption',
    status: 'probable',
    confidence: 81,
    impact: 'Збитки державі · Конкурентне право',
    impactValue: '$67M',
    createdAt: '03:47:19',
    entities: ['ТОВ "ЗАХИСТ-Т ЕЙД"', 'ФОП Бойченко І.В.', 'БФ "ПЕ ЕМОГА"'],
    evidence: [
      { source: 'ProZorro API', description: '47 тендерів — переморогавці ротуються за схемою 1-2-3', weight: 88, timestamp: '2024-08-01' },
      { source: 'ЄД  Граф', description: 'Спільний директор в 2 з 3 компаній: Гнатюк О. .', weight: 79, timestamp: '2025-01-20' },
      { source: 'ContactData', description: 'Однакові контактні дані та IP-адреси заявок у ProZorro', weight: 85, timestamp: '2025-03-12' },
    ],
    nextActions: [
      'ЗАПИТ ДО АМКУ — АНТИМОНОПОЛЬНЕ П ОВАДЖЕННЯ',
      'АНАЛІЗ IP-АД ЕС ПОДАЧІ ТЕНДЕ НИХ П ОПОЗИЦІЙ',
      'ПО ІВНЯЛЬНИЙ АНАЛІЗ СПЕЦИФІКАЦІЙ ЗА 47 ЛОТАМИ',
    ],
    aiModel: 'PREDATOR-GRAPH-4B',
    processingTime: '3.1с',
  },
];

const STATUS_CFG = {
  confirmed: { label: 'ПІДТВЕ ДЖЕНО', color: '#10b981', bg: 'bg-emerald-900/20', border: 'border-emerald-800/40', icon: CheckCircle },
  probable:  { label: 'ЙМОВІ НО',    color: '#D4AF37', bg: 'bg-yellow-900/15',  border: 'border-yellow-800/30', icon: AlertTriangle },
  possible:  { label: 'МОЖЛИВО',     color: '#475569', bg: 'bg-slate-900/15',   border: 'border-slate-800/30',  icon: Eye },
  refuted:   { label: 'СП ОСТОВАНО', color: '#F59E0B', bg: 'bg-rose-900/15',    border: 'border-rose-800/30',   icon: Lock },
};

const CATEGORY_CFG = {
  financial:  { label: 'Фінансова',    icon: DollarSign, color: '#D4AF37' },
  network:    { label: 'Мережевий',    icon: Network,    color: '#34d399' },
  sanctions:  { label: 'Санкційна',    icon: Globe,      color: '#E11D48' },
  corruption: { label: "Корупційна",   icon: AlertTriangle, color: '#f59e0b' },
  supply:     { label: 'Ланцюг пост.', icon: Activity,   color: '#D4AF37' },
};

// ─── КОМПОНЕНТ ───────────────────────────────────────────────────────

const HypothesisEngineView: React.FC = () => {
  const [selected, setSelected] = useState<Hypothesis | null>(HYPOTHESES[0]);
  const [activeEvidence, setActiveEvidence] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [newHypAdded, setNewHypAdded] = useState(false);
  const [filterStatus, setFilterStatus] = useState<HypothesisStatus | 'all'>('all');
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '> Статус: ГОТОВИЙ · Гіпотез у черзі: 0',
  ]);
  const { isOffline, nodeSource, healingProgress } = useBackendStatus();

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'HypothesisEngine',
          message: 'АКТИВОВАНО АВТОНОМНИЙ  ЕЖИМ ГЕНЕ АЦІЇ ГІПОТЕЗ (COGNITIVE_NODES). Використовується локальна нейромережа.',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'COGNITIVE_NODES'
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'HypothesisEngine',
          message: 'СИНХ ОНІЗАЦІЯ ГЕНЕ АТО А ГІПОТЕЗ УСПІШНА (HYPOTHESIS_SUCCESS). Зв\'язок з NVIDIA-кластером стабільний.',
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'HYPOTHESIS_SUCCESS'
        }
      }));
    }
  }, [isOffline]);

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setGenerating(true);

    const steps = [
      `> ЗАПИТ: "${promptText}"`,
      '> Ініціалізація SOVEREIGN multi-model ensemble...',
      '> [SIGINT-7B] Аналіз фінансових аномалій...',
      '> [GRAPH-4B] Побудова графа зв\'язків...',
      '> [PATTERN-2B] Пошук повторюваних патернів...',
      '> [SANCTIONS-3B] Перевірка санкційних баз...',
      '> Крос-верифікація між моделями...',
      '>  анжування гіпотез за confidence score...',
      '─────────────────────────────────────',
      '> ✓ НОВА ГІПОТЕЗА СФО МОВАНА · Впевненість: 79%',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 150));
      setTerminalLines(prev => [...prev, steps[i]]);
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }

    setGenerating(false);
    setPromptText('');
    setNewHypAdded(true);
    setTimeout(() => setNewHypAdded(false), 5000);
  };

  const filtered = HYPOTHESES.filter(h => filterStatus === 'all' || h.status === filterStatus);

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-32 relative overflow-hidden bg-[#020202]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.05) 0%, transparent 55%)' }} />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-12 space-y-12">

        {/* ── ЗАГОЛОВОК WRAITH ── */}
        <ViewHeader
          title={
            <div className="flex items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/15 blur-3xl rounded-full" />
                <div className="relative p-7 bg-black border border-yellow-500/40 rounded-[2.5rem] shadow-4xl">
                  <Brain size={48} className="text-yellow-500 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                  <motion.span
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-4 border-black"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <Sparkles size={12} className="text-yellow-600 animate-pulse" />
                  <span className="text-[10px] font-black text-yellow-500/70 uppercase tracking-[0.6em]">
                    СУВЕ ЕННЕ ЯДРО ГІПОТЕЗ · v58.2-WRAITH
                  </span>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                  ЯДРО{' '}
                  <span className="text-yellow-500 drop-shadow-[0_0_30px_rgba(212,175,55,0.4)] italic uppercase">ГІПОТЕЗ</span>
                </h1>
                <p className="text-[12px] text-slate-600 font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-4">
                  <Fingerprint size={16} className="text-yellow-500" /> АВТОГЕНЕ АЦІЯ СЛІДЧИХ ГІПОТЕЗ · TIER-1 ACCESS
                </p>
              </div>
            </div>
          }
          breadcrumbs={['INTEL', 'AI', 'HYPOTHESIS_ENGINE']}
          badges={[
            { label: 'ОБМЕЖЕНИЙ_Т1', color: 'gold', icon: <Lock size={10} /> },
            { label: 'СУВЕ ЕННЕ_ЯДРО', color: 'primary', icon: <Cpu size={10} /> },
            { 
              label: nodeSource, 
              color: isOffline ? 'warning' : 'gold', 
              icon: <Activity size={10} className={isOffline ? 'animate-pulse' : ''} /> 
            },
          ]}
          stats={[
            { label: 'ГІПОТЕЗ', value: '47', icon: <Target />, color: 'gold' },
            { 
              label: isOffline ? 'SYNC_HEAL' : 'CONFIRMATION', 
              value: isOffline ? `${Math.floor(healingProgress)}%` : '94.2%', 
              icon: isOffline ? <Activity /> : <CheckCircle />, 
              color: isOffline ? 'warning' : 'success',
              animate: isOffline
            },
            { label: 'РИЗИК_ВПЛИВУ', value: '$184M', icon: <DollarSign />, color: 'danger' },
            { label: 'ОБЧИСЛЕННЯ', value: isOffline ? 'ЛОКАЛЬНІ' : 'ХМА НІ', icon: <Cpu />, color: isOffline ? 'warning' : 'primary' },
          ]}
          actions={
            <div className="flex items-center gap-6">
              <div className="px-8 py-5 bg-black/60 backdrop-blur-xl border-2 border-yellow-500/20 rounded-2xl flex items-center gap-5 shadow-2xl">
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                   <Cpu size={24} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Вузол обчислень</p>
                  <p className="text-xl font-black text-yellow-500 font-mono italic">{isOffline ? 'WRAITH_LOCAL' : 'PREDATOR_SIGINT'}</p>
                </div>
              </div>
              <button className="px-12 py-5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-110 transition-all rounded-2xl shadow-3xl flex items-center gap-4 italic font-bold">
                <Download size={20} />
                СТРАТЕГІЧНИЙ_ЗВІТ_WRAITH
              </button>
            </div>
          }
        />

        {/* ── МЕТ ИКИ WRAITH ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { l: 'ГІПОТЕЗ СФО МОВАНО', v: '47',    sub: 'Активний векторний скан',       c: '#D4AF37' },
            { l: 'ТОЧНІСТЬ_МАТЧИНГУ',  v: '94.2%', sub: 'Висока відповідність',     c: '#10b981' },
            { l: 'ОБСЯГ_ВИЯВЛЕНЬ',     v: '$184M', sub: 'Виявлено витік капіталу',   c: '#E11D48' },
            { l: 'ШВИДКІСТЬ_МЕШУ',      v: '1.8ms', sub: 'Продуктивність нейромережі', c: '#D4AF37' },
          ].map((m, i) => (
            <motion.div
              key={m.l}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-10 bg-black/60 backdrop-blur-2xl border border-white/5 hover:border-yellow-500/30 transition-all rounded-[3rem] shadow-2xl group overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-yellow-500/40 to-transparent" />
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] mb-4 group-hover:text-yellow-500/60 transition-colors">{m.l}</p>
              <p className="text-4xl font-black font-mono tracking-tighter italic" style={{ color: m.c }}>{m.v}</p>
              <p className="text-[10px] text-slate-700 font-black uppercase mt-3 tracking-widest opacity-60">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── ГЕНЕ АТО  ЗАПИТІВ WRAITH ── */}
        <div className="bg-black border-2 border-yellow-500/10 p-10 space-y-8 rounded-[4rem] shadow-4xl relative overflow-hidden backdrop-blur-3xl">
          <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
             <Brain size={400} className="text-yellow-500" />
          </div>
          <h2 className="text-[11px] font-black text-yellow-500/60 uppercase tracking-[0.6em] flex items-center gap-4 italic font-bold relative z-10">
            <Zap size={16} className="text-yellow-500 animate-pulse" />
            ІНІЦІАЛІЗАЦІЯ_ПОСЛІДОВНОСТІ_СКАНУВАННЯ
          </h2>
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            <div className="flex-1 flex items-center gap-6 border-2 border-white/5 bg-white/[0.02] px-10 py-6 rounded-3xl group hover:border-yellow-500/30 transition-all shadow-inner">
              <Search size={24} className="text-slate-700 group-hover:text-yellow-500 transition-colors" />
              <input
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="ВВЕДІТЬ_ПА АМЕТ И_ПОШУКУ_ОБ'ЄКТА..."
                className="flex-1 bg-transparent text-xl font-black text-white outline-none placeholder:text-slate-800 font-mono italic"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleGenerate}
              disabled={generating || !promptText.trim()}
              className={cn(
                "px-16 py-6 text-[12px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all rounded-3xl shadow-3xl italic",
                generating
                  ? "bg-slate-900 text-yellow-600 border-2 border-yellow-500/20 cursor-wait"
                  : "bg-yellow-500 text-black border-none hover:brightness-110"
              )}
            >
              {generating ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              {generating ? 'АНАЛІЗ...' : 'АКТИВУВАТИ'}
            </motion.button>
          </div>

          {/* Термінал WRAITH */}
          <div
            ref={terminalRef}
            className="h-[180px] overflow-y-auto bg-black/80 border-2 border-white/5 p-8 font-mono space-y-2 custom-scrollbar rounded-3xl shadow-inner relative z-10"
          >
            {terminalLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "text-[10px] leading-relaxed italic font-bold",
                  line.startsWith('> ✓') ? "text-emerald-400 font-black" :
                  line.startsWith('> [') ? "text-yellow-500/70" :
                  line.startsWith('───') ? "text-slate-900" :
                  line.startsWith('> ZAПИТ') ? "text-yellow-500" :
                  "text-slate-700"
                )}
              >
                {line}
              </motion.div>
            ))}
            {generating && (
              <div className="flex items-center gap-3">
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="text-yellow-500 font-black"
                >_ОЧІКУВАННЯ_КОМАНДИ_WRAITH</motion.span>
              </div>
            )}
          </div>
        </div>

        {/* ── СПИСОК ГІПОТЕЗ + ДЕТАЛІ WRAITH ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Список гіпотез */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-6">
            <div className="flex gap-2 p-2 bg-black border-2 border-white/5 rounded-2xl w-fit shadow-2xl">
              {(['all', 'confirmed', 'probable', 'possible'] as const).map(s => {
                const sc = s !== 'all' ? STATUS_CFG[s] : null;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      "px-6 py-3 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-xl italic",
                      filterStatus === s
                        ? s === 'all' ? "bg-white/10 text-white"
                          : "text-white font-black"
                        : "text-slate-600 hover:text-slate-300"
                    )}
                    style={filterStatus === s && sc ? { backgroundColor: sc.color + '25', color: sc.color, borderColor: sc.color + '40', borderWidth: '1px' } : {}}
                  >
                    {s === 'all' ? 'УСІ_ВЕКТО И' : sc!.label}
                  </button>
                );
              })}
            </div>

            {newHypAdded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-6 border-2 border-emerald-500/20 bg-emerald-500/5 flex items-center gap-4 rounded-3xl shadow-xl"
              >
                <CheckCircle size={20} className="text-emerald-400" />
                <span className="text-[12px] font-black text-emerald-400 italic">НОВА ГІПОТЕЗА СИНТЕЗОВАНА · ЧЕ ГА_ВЕ ИФІКАЦІЇ_АКТИВНА</span>
              </motion.div>
            )}

            <div className="space-y-4">
              {filtered.map((hyp, i) => {
                const sc = STATUS_CFG[hyp.status];
                const cc = CATEGORY_CFG[hyp.category];
                const StatusIcon = sc.icon;
                const CatIcon = cc.icon;
                return (
                  <motion.div
                    key={hyp.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    onClick={() => setSelected(hyp)}
                    className={cn(
                      "p-10 border-2 cursor-pointer transition-all relative overflow-hidden group rounded-[3rem] shadow-2xl",
                      selected?.id === hyp.id
                        ? "bg-yellow-500/[0.03] border-yellow-500/30"
                        : "bg-black/60 border-white/5 hover:border-yellow-500/20"
                    )}
                  >
                    {selected?.id === hyp.id && (
                      <div className="absolute left-0 inset-y-0 w-2 bg-yellow-500 shadow-[0_0_20px_#d4af37]" />
                    )}

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black font-mono text-slate-700">{hyp.id}</span>
                        <span className={cn("text-[8px] font-black px-4 py-1 border-2 flex items-center gap-2 rounded-lg italic", sc.bg, sc.border)} style={{ color: sc.color }}>
                          <StatusIcon size={12} />
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
                        <CatIcon size={14} style={{ color: cc.color }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cc.color }}>{cc.label}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-white group-hover:text-yellow-500 transition-colors italic leading-tight mb-8">
                      {hyp.title}
                    </h3>

                    <div className="grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
                      <div>
                        <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-2">Впевненість</p>
                        <p className="text-3xl font-black font-mono italic" style={{ color: sc.color }}>{hyp.confidence}%</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-2">Вплив</p>
                        <p className="text-2xl font-black text-white font-mono italic">{hyp.impactValue}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-2">Джерело</p>
                        <p className="text-[10px] font-black text-yellow-600 font-mono italic">{hyp.aiModel.split('-')[1]}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Деталі гіпотези WRAITH */}
          <div className="lg:col-span-12 xl:col-span-7">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="bg-black/80 backdrop-blur-3xl border-2 border-yellow-500/10 p-12 rounded-[4rem] shadow-4xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500 opacity-20" />
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-[11px] font-mono text-slate-700 font-black">{selected.id}</span>
                          <span
                            className={cn("text-[9px] font-black px-5 py-1.5 border-2 flex items-center gap-2 rounded-xl italic",
                              STATUS_CFG[selected.status].bg, STATUS_CFG[selected.status].border
                            )}
                            style={{ color: STATUS_CFG[selected.status].color }}
                          >
                            {React.createElement(STATUS_CFG[selected.status].icon, { size: 14 })}
                            {STATUS_CFG[selected.status].label}
                          </span>
                        </div>
                        <h2 className="text-[32px] font-black text-white leading-[1.1] max-w-2xl italic uppercase tracking-tighter">{selected.title}</h2>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[56px] font-black font-mono leading-none tracking-tighter italic" style={{ color: STATUS_CFG[selected.status].color }}>
                          {selected.confidence}%
                        </p>
                        <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.5em] mt-2"> ЕЙТИНГ_ВПЕВНЕННОСТІ</p>
                      </div>
                    </div>
                    
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative mb-10">
                       <p className="text-[16px] text-slate-300 leading-relaxed font-medium italic">
                         {selected.summary}
                       </p>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-10">
                      {selected.entities.map((e, i) => (
                        <span key={i} className="text-[10px] font-black px-6 py-2 bg-black border-2 border-white/5 text-slate-400 uppercase tracking-widest rounded-full italic hover:border-yellow-500/30 transition-all cursor-default group hover:text-white">
                          <Fingerprint size={12} className="inline mr-2 text-yellow-500 opacity-0 group-hover:opacity-100 transition-all" />{e}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-10 border-t-2 border-white/5 pt-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl"><Cpu size={20} className="text-yellow-500" /></div>
                        <div>
                           <p className="text-[9px] text-slate-700 font-black uppercase mb-1">Вузол Обчислень</p>
                           <p className="text-[13px] font-black text-white font-mono">{selected.aiModel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl"><Clock size={20} className="text-slate-500" /></div>
                        <div>
                           <p className="text-[9px] text-slate-700 font-black uppercase mb-1">Час обробки</p>
                           <p className="text-[13px] font-black text-white font-mono">{selected.processingTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500/10 rounded-2xl"><Target size={20} className="text-rose-500" /></div>
                        <div>
                           <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase italic font-bold">ОПЕ АТИВНИЙ ВПЛИВ</p>
                           <p className="text-[13px] font-black text-rose-500 font-mono italic uppercase">{selected.impactValue}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Докази WRAITH */}
                  <div className="bg-black/60 border-2 border-white/5 p-10 rounded-[3.5rem] shadow-3xl">
                    <h3 className="text-[11px] font-black text-yellow-500/60 uppercase tracking-[0.5em] mb-8 flex items-center gap-4 italic">
                      <FileText size={20} className="text-yellow-500" />
                      ДОКАЗОВА_БАЗА · {selected.evidence.length} ПОТОКІВ
                    </h3>
                    <div className="space-y-4">
                      {selected.evidence.map((ev, i) => (
                        <motion.div
                          key={i}
                          onClick={() => setActiveEvidence(activeEvidence === i ? null : i)}
                          className={cn(
                            "border-2 cursor-pointer transition-all rounded-3xl overflow-hidden",
                            activeEvidence === i ? "border-yellow-500/40 bg-yellow-500/[0.03] shadow-lg" : "border-white/5 hover:border-white/20 bg-black shadow-none"
                          )}
                        >
                          <div className="flex items-center justify-between p-7">
                            <div className="flex items-center gap-6">
                              <div
                                className="w-12 h-12 flex items-center justify-center border-2 shrink-0 font-black text-[18px] font-mono italic rounded-xl shadow-inner"
                                style={{
                                  borderColor: `rgba(212,175,55,${ev.weight / 100 * 0.4})`,
                                  color: ev.weight > 85 ? '#10b981' : ev.weight > 70 ? '#f59e0b' : '#64748b',
                                  backgroundColor: `rgba(212,175,55,${ev.weight / 100 * 0.05})`
                                }}
                              >
                                {ev.weight}
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest italic mb-1">{ev.source}</p>
                                <p className="text-[14px] text-slate-300 font-bold tracking-tight">{ev.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-5">
                              <span className="text-[9px] font-mono text-slate-700 font-black">{ev.timestamp}</span>
                              <ChevronRight size={18} className={cn("text-slate-800 transition-transform", activeEvidence === i && "rotate-90 text-yellow-500")} />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/*  ЕКОМЕНДОВАНИ ДІЇ WRAITH */}
                  <div className="bg-black/60 border-2 border-white/5 p-10 rounded-[3.5rem] shadow-3xl">
                    <h3 className="text-[11px] font-black text-rose-500/60 uppercase tracking-[0.5em] mb-8 flex items-center gap-4 italic font-bold">
                      <Target size={20} className="text-rose-500 animate-pulse" />
                      Цілі Операції
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {selected.nextActions.map((action, i) => (
                        <div key={i} className="flex items-center gap-5 p-7 border-2 border-white/5 bg-white/[0.01] hover:border-yellow-500/30 hover:bg-yellow-500/[0.02] transition-all cursor-pointer group rounded-3xl shadow-xl">
                          <div className="w-10 h-10 border-2 border-white/10 bg-black flex items-center justify-center shrink-0 rounded-xl group-hover:border-yellow-500/50 group-hover:scale-110 transition-all">
                            <span className="text-sm font-black text-slate-700 group-hover:text-yellow-500 font-mono italic">{i + 1}</span>
                          </div>
                          <span className="text-[12px] font-black text-slate-400 group-hover:text-white transition-colors uppercase italic tracking-tight">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-6">
                    <button className="py-7 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-[11px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all shadow-4xl rounded-3xl flex items-center justify-center gap-4 italic">
                      <Sparkles size={22} className="animate-pulse" />
                      ГЛИБОКЕ_СЕНСО НЕ_СКАНУВАННЯ
                    </button>
                    <button className="py-7 bg-black border-2 border-white/10 text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] hover:text-white hover:border-yellow-500/40 transition-all rounded-3xl flex items-center justify-center gap-4 italic shadow-2xl">
                      <Download size={20} />
                      ЕКСПОРТ_МАТЕ ІАЛІВ_СП АВИ
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-black/40 border-4 border-dashed border-white/5 p-32 text-center rounded-[5rem] flex flex-col items-center justify-center">
                  <div className="relative mb-10">
                     <Brain size={120} className="text-slate-900" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Radar size={60} className="text-slate-800 animate-pulse" />
                     </div>
                  </div>
                  <p className="text-[14px] font-black text-slate-800 uppercase tracking-[.8em] italic">
                    ОБЕ ІТЬ_АНАЛІТИЧНУ_ЦІЛЬ
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto px-12 mt-12 pb-24">
            <DiagnosticsTerminal />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(212,175,55,.12);border-radius:20px}` }} />
    </div>
  );
};

export default HypothesisEngineView;
