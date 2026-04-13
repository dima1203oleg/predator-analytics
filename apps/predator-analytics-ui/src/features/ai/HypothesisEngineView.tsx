/**
 * 🧠 AI HYPOTHESIS ENGINE | v56.4
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
  Activity, Lock, FileText, Send, Loader2, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    summary: 'AI виявив статистично аномальне зменшення активів МЕТАЛУРГ-ІНВЕСТ за 90 днів до відкриття провадження. Корельовано з 3 офшорними трансферами до Kyoto Holdings (BVI) загальним обсягом $18.4M.',
    category: 'financial',
    status: 'confirmed',
    confidence: 94,
    impact: 'Кримінальна відповідальність · Стягнення активів',
    impactValue: '$18.4M',
    createdAt: '04:12:34',
    entities: ['МЕТАЛУРГ-ІНВЕСТ', 'Kyoto Holdings Ltd (BVI)', 'Ткаченко В.М.'],
    evidence: [
      { source: 'ЄДР / Фінансова звітність', description: 'Активи зменшились з $31.2M до $12.8M за 3 місяці', weight: 95, timestamp: '2025-01-15' },
      { source: 'SWIFT-монітор', description: '3 трансфери $4.1M, $8.7M, $5.6M → Kyoto Holdings', weight: 98, timestamp: '2024-11-03' },
      { source: 'YouControl', description: 'Kyoto Holdings — повʼязана особа: Ткаченко В.М. (PEP)', weight: 87, timestamp: '2024-12-21' },
      { source: 'Судовий реєстр', description: 'Справа про банкрутство відкрита через 91 день після трансферів', weight: 91, timestamp: '2025-02-01' },
    ],
    nextActions: [
      'Подати заяву до НАБУ — ст. 199 ККУ',
      'Клопотання про визнання угод недійсними',
      'Запит до кіпрського регулятора на розкриття UBO',
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
    entities: ['ТОВ "ЗАХИСТ-ТРЕЙД"', 'ФОП Бойченко І.В.', 'БФ "ПЕРЕМОГА"'],
    evidence: [
      { source: 'ProZorro API', description: '47 тендерів — переморогавці ротуються за схемою 1-2-3', weight: 88, timestamp: '2024-08-01' },
      { source: 'ЄДР Граф', description: 'Спільний директор в 2 з 3 компаній: Гнатюк О.Р.', weight: 79, timestamp: '2025-01-20' },
      { source: 'ContactData', description: 'Однакові контактні дані та IP-адреси заявок у ProZorro', weight: 85, timestamp: '2025-03-12' },
    ],
    nextActions: [
      'Запит до АМКУ — антимонопольне провадження',
      'Аналіз IP-адрес подачі тендерних пропозицій',
      'Порівняльний аналіз специфікацій за 47 лотами',
    ],
    aiModel: 'PREDATOR-GRAPH-4B',
    processingTime: '3.1с',
  },
  {
    id: 'HYP-0698',
    title: 'Санкційне ухилення через ланцюг ОАЕ → Туреччина → UA',
    summary: 'Виявлено маршрут обходу санкцій: товари з РФ переоформлюються через Gulf Meridian FZCO (ОАЕ) і Ankara Transit LLC (TR), потрапляють в Україну як "турецьке виробництво". Подвійне використання — 7 SKU.',
    category: 'sanctions',
    status: 'probable',
    confidence: 77,
    impact: 'Санкційні порушення · Кримінал',
    impactValue: '$23M',
    createdAt: '02:18:44',
    entities: ['Gulf Meridian FZCO (UAE)', 'Ankara Transit LLC', 'ТОВ "ЕА-ТРЕЙД"'],
    evidence: [
      { source: 'Митниця', description: '3 партії з ОАЕ містять компоненти рос. виробника (DUAL-USE)', weight: 82, timestamp: '2025-02-20' },
      { source: 'AIS Maritime', description: 'Суден маршрут: Новоросійськ → Батумі → Стамбул → Одеса', weight: 74, timestamp: '2025-01-07' },
      { source: 'UN Experts DB', description: 'Gulf Meridian у базі підозрілих посередників OSAC-2024', weight: 88, timestamp: '2024-11-15' },
    ],
    nextActions: [
      'Повідомити ДФСУ та СБУ',
      'Технічна аналіз SKU — відповідність заявленому COO',
      'Запит до OFAC щодо статусу Gulf Meridian',
    ],
    aiModel: 'PREDATOR-SANCTIONS-3B',
    processingTime: '1.8с',
  },
  {
    id: 'HYP-0612',
    title: 'Прихований контроль держзакупівель через підставних ФОП',
    summary: 'AI виявив патерн: 14 ФОП отримали держконтракти на $4.1M, зареєстровані в один день, з однаковим видом діяльності та КВЕД. Всі кошти обналічені через 2 банки. Можливий схематоз.',
    category: 'corruption',
    status: 'possible',
    confidence: 63,
    impact: 'Бюджетні збитки',
    impactValue: '$4.1M',
    createdAt: '01:55:08',
    entities: ['14× ФОП (реєстрація 2024-09-14)', 'ПАТ "УКРОБОЗОВНІШНІМ"', 'Мотрієнко Д.С.'],
    evidence: [
      { source: 'ЄДР', description: '14 ФОП зареєстровані 2024-09-14, однаковий КВЕД 46.90', weight: 71, timestamp: '2024-09-14' },
      { source: 'ProZorro', description: 'Всі 14 отримали контракти від однієї установи за 45 днів', weight: 68, timestamp: '2024-10-30' },
    ],
    nextActions: [
      'Фінансовий моніторинг ФОП через ДФС',
      'Запит до банків щодо операцій (ст. 64 Закону про банки)',
    ],
    aiModel: 'PREDATOR-PATTERN-2B',
    processingTime: '4.2с',
  },
];

const STATUS_CFG = {
  confirmed: { label: 'ПІДТВЕРДЖЕНО', color: '#10b981', bg: 'bg-emerald-900/20', border: 'border-emerald-800/40', icon: CheckCircle },
  probable:  { label: 'ЙМОВІРНО',    color: '#f59e0b', bg: 'bg-amber-900/15',   border: 'border-amber-800/30',  icon: AlertTriangle },
  possible:  { label: 'МОЖЛИВО',     color: '#6366f1', bg: 'bg-indigo-900/15',  border: 'border-indigo-800/30', icon: Eye },
  refuted:   { label: 'СПРОСТОВАНО', color: '#475569', bg: 'bg-slate-900/30',   border: 'border-slate-700/40',  icon: Lock },
};

const CATEGORY_CFG = {
  financial:  { label: 'Фінансова',    icon: DollarSign, color: '#ef4444' },
  network:    { label: 'Мережевий',    icon: Network,    color: '#06b6d4' },
  sanctions:  { label: 'Санкційна',    icon: Globe,      color: '#f59e0b' },
  corruption: { label: "Корупційна",   icon: AlertTriangle, color: '#dc2626' },
  supply:     { label: 'Ланцюг пост.', icon: Activity,   color: '#8b5cf6' },
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
    '> PREDATOR Hypothesis Engine v56.4 завантажено',
    '> Моделі: SIGINT-7B · GRAPH-4B · SANCTIONS-3B · PATTERN-2B',
    '> Датасети: ЄДР · ProZorro · Митниця · SWIFT · YouControl · OFAC',
    '> Статус: ГОТОВИЙ · Гіпотез у черзі: 0',
  ]);

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setGenerating(true);

    const steps = [
      `> ЗАПИТ: "${promptText}"`,
      '> Ініціалізація multi-model ensemble...',
      '> [SIGINT-7B] Аналіз фінансових аномалій...',
      '> [GRAPH-4B] Побудова графа зв\'язків...',
      '> [PATTERN-2B] Пошук повторюваних патернів...',
      '> [SANCTIONS-3B] Перевірка санкційних баз...',
      '> Крос-верифікація між моделями...',
      '> Ранжування гіпотез за confidence score...',
      '─────────────────────────────────────',
      '> ✓ НОВА ГІПОТЕЗА СФОРМОВАНА · Confidence: 79%',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 280 + Math.random() * 200));
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
    <div className="min-h-screen text-slate-200 font-sans pb-24 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.05) 0%, transparent 55%)' }} />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-6 space-y-8">

        {/* ── ЗАГОЛОВОК ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-700/15 blur-2xl rounded-full" />
              <div className="relative p-5 bg-black border border-violet-900/50">
                <Brain size={38} className="text-violet-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.4)]" />
                <motion.span
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-violet-600 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles size={10} className="text-violet-600 animate-pulse" />
                <span className="text-[8px] font-black text-violet-700/70 uppercase tracking-[0.5em]">
                  AI HYPOTHESIS ENGINE · MULTI-MODEL · SOVEREIGN AI · v56.4
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                HYPOTHESIS{' '}
                <span className="text-violet-400 drop-shadow-[0_0_20px_rgba(139,92,246,0.35)]">ENGINE</span>
              </h1>
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] mt-1">
                АВТОГЕНЕРАЦІЯ СЛІДЧИХ ГІПОТЕЗ · АНОМАЛІЇ · ПАТЕРНИ · AI-ВЕРИФІКАЦІЯ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 bg-black border border-violet-900/40 flex items-center gap-3">
              <Sparkles size={13} className="text-violet-600" />
              <div>
                <p className="text-[7px] font-black text-slate-700 uppercase">Активних моделей</p>
                <p className="text-[13px] font-black text-violet-400 font-mono">4 / 4 ONLINE</p>
              </div>
            </div>
            <button className="px-8 py-3 bg-violet-700 text-white text-[9px] font-black uppercase tracking-wider hover:bg-violet-600 transition-colors border border-violet-500/30 flex items-center gap-2">
              <Download size={13} />
              INTELLIGENCE REPORT
            </button>
          </div>
        </div>

        {/* ── МЕТРИКИ ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { l: 'ГІПОТЕЗ СФОРМОВАНО', v: '4',    sub: 'Цього тижня',       c: '#8b5cf6' },
            { l: 'ПІДТВЕРДЖЕНО',       v: '1',    sub: '94% confidence',     c: '#10b981' },
            { l: 'ЗАГАЛЬНИЙ ВПЛИВ',    v: '$112M', sub: 'Виявлено ризику',   c: '#ef4444' },
            { l: 'СЕРЕДНІЙ ЧАС',       v: '2.9с', sub: 'Генерація гіпотези', c: '#6366f1' },
          ].map((m, i) => (
            <motion.div
              key={m.l}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-6 bg-black border border-slate-800/50 hover:border-slate-700/60 transition-all"
            >
              <p className="text-[7px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">{m.l}</p>
              <p className="text-[24px] font-black font-mono" style={{ color: m.c }}>{m.v}</p>
              <p className="text-[8px] text-slate-700 font-black uppercase mt-1">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── ГЕНЕРАТОР ЗАПИТІВ ── */}
        <div className="bg-black border border-violet-900/30 p-6 space-y-4">
          <h2 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] flex items-center gap-2">
            <Brain size={12} className="text-violet-600" />
            ЗАПУСТИТИ НОВУ ГІПОТЕЗУ
          </h2>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 border border-violet-900/30 bg-violet-950/10 px-5 py-3">
              <Sparkles size={14} className="text-violet-700 shrink-0" />
              <input
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="Опишіть підозру або назвіть суб'єкт... напр: 'ТОВ Агро-Лідер підозрілі транзакції'"
                className="flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-700 font-mono"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              disabled={generating || !promptText.trim()}
              className={cn(
                "px-8 py-3 text-[9px] font-black uppercase tracking-wider flex items-center gap-3 transition-all border",
                generating
                  ? "bg-violet-900/40 text-violet-600 border-violet-800/30 cursor-wait"
                  : "bg-violet-700 text-white border-violet-500/40 hover:bg-violet-600"
              )}
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {generating ? 'АНАЛІЗ...' : 'ГЕНЕРУВАТИ'}
            </motion.button>
          </div>

          {/* Терміанл */}
          <div
            ref={terminalRef}
            className="h-[120px] overflow-y-auto bg-black border border-violet-900/20 p-4 font-mono space-y-1 custom-scrollbar"
          >
            {terminalLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "text-[9px] leading-relaxed",
                  line.startsWith('> ✓') ? "text-emerald-400 font-black" :
                  line.startsWith('> [') ? "text-violet-500" :
                  line.startsWith('───') ? "text-slate-800" :
                  line.startsWith('> ЗАПИТ') ? "text-amber-400" :
                  "text-slate-600"
                )}
              >
                {line}
              </motion.div>
            ))}
            {generating && (
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="text-[9px] text-violet-600"
                >█</motion.span>
              </div>
            )}
          </div>

          {/* Підказки */}
          <div className="flex flex-wrap gap-2">
            {[
              'Офшорні структури БВО',
              'Схема банкрутства + трансфери',
              'Картельна змова ProZorro',
              'Санкційне ухилення ОАЕ',
            ].map(hint => (
              <button
                key={hint}
                onClick={() => setPromptText(hint)}
                className="text-[8px] font-black text-slate-600 bg-slate-900 border border-slate-800 px-3 py-1.5 hover:text-violet-400 hover:border-violet-900/50 transition-all uppercase tracking-wide"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>

        {/* ── СПИСОК ГІПОТЕЗ + ДЕТАЛІ ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Список гіпотез */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex gap-1 p-1 bg-black border border-slate-800/50 w-fit">
              {(['all', 'confirmed', 'probable', 'possible'] as const).map(s => {
                const sc = s !== 'all' ? STATUS_CFG[s] : null;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      "px-3 py-1.5 text-[7px] font-black uppercase tracking-wider transition-all",
                      filterStatus === s
                        ? s === 'all' ? "bg-slate-800 text-white"
                          : "text-white font-black"
                        : "text-slate-600 hover:text-slate-300"
                    )}
                    style={filterStatus === s && sc ? { backgroundColor: sc.color + '25', color: sc.color } : {}}
                  >
                    {s === 'all' ? 'УСІ' : sc!.label}
                  </button>
                );
              })}
            </div>

            {newHypAdded && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-emerald-800/50 bg-emerald-950/20 flex items-center gap-3"
              >
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400">НОВА ГІПОТЕЗА ДОДАНА ДО ЧЕРГИ ВЕРИФІКАЦІЇ</span>
              </motion.div>
            )}

            {filtered.map((hyp, i) => {
              const sc = STATUS_CFG[hyp.status];
              const cc = CATEGORY_CFG[hyp.category];
              const StatusIcon = sc.icon;
              const CatIcon = cc.icon;
              return (
                <motion.div
                  key={hyp.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  onClick={() => setSelected(hyp)}
                  className={cn(
                    "p-6 border cursor-pointer transition-all relative overflow-hidden group",
                    selected?.id === hyp.id
                      ? "bg-violet-950/10 border-violet-800/50"
                      : "bg-black border-slate-800/40 hover:border-slate-700/60"
                  )}
                >
                  {selected?.id === hyp.id && (
                    <div className="absolute left-0 inset-y-0 w-0.5 bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  )}

                  <div className="flex items-center justify-between mb-3 pl-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black font-mono text-slate-700">{hyp.id}</span>
                      <span className={cn("text-[7px] font-black px-2 py-0.5 border flex items-center gap-1", sc.bg, sc.border)} style={{ color: sc.color }}>
                        <StatusIcon size={9} />
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CatIcon size={11} style={{ color: cc.color }} />
                      <span className="text-[8px] font-black" style={{ color: cc.color }}>{cc.label}</span>
                    </div>
                  </div>

                  <h3 className="text-[11px] font-black text-white group-hover:text-violet-300 transition-colors leading-tight pl-3 mb-3">
                    {hyp.title}
                  </h3>

                  <div className="flex items-center gap-5 pl-3">
                    <div>
                      <p className="text-[7px] text-slate-700 uppercase">Confidence</p>
                      <p className="text-[16px] font-black font-mono" style={{ color: sc.color }}>{hyp.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-700 uppercase">Під ризиком</p>
                      <p className="text-[14px] font-black text-white font-mono">{hyp.impactValue}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-700 uppercase">Модель</p>
                      <p className="text-[8px] font-black text-violet-600 font-mono">{hyp.aiModel.replace('PREDATOR-', '')}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-slate-700">
                      <Clock size={9} />
                      <span className="text-[8px] font-mono">{hyp.createdAt}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Деталі гіпотези */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Заголовок + метрики */}
                  <div className="bg-black border border-violet-900/30 p-7">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[8px] font-mono text-slate-700">{selected.id}</span>
                          <span
                            className={cn("text-[7px] font-black px-2 py-0.5 border flex items-center gap-1",
                              STATUS_CFG[selected.status].bg, STATUS_CFG[selected.status].border
                            )}
                            style={{ color: STATUS_CFG[selected.status].color }}
                          >
                            {React.createElement(STATUS_CFG[selected.status].icon, { size: 9 })}
                            {STATUS_CFG[selected.status].label}
                          </span>
                        </div>
                        <h2 className="text-[15px] font-black text-white leading-tight max-w-lg">{selected.title}</h2>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-[28px] font-black font-mono" style={{ color: STATUS_CFG[selected.status].color }}>
                          {selected.confidence}%
                        </p>
                        <p className="text-[7px] text-slate-600 uppercase font-black">CONFIDENCE</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed border-l-2 border-violet-900/50 pl-4">
                      {selected.summary}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selected.entities.map((e, i) => (
                        <span key={i} className="text-[8px] font-black px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                          {e}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-900">
                      <div className="text-[9px] text-slate-600">
                        ⚡ Модель: <span className="text-violet-500 font-black">{selected.aiModel}</span>
                      </div>
                      <div className="text-[9px] text-slate-600">
                        ⏱ Час: <span className="text-slate-400 font-black">{selected.processingTime}</span>
                      </div>
                      <div className="text-[9px] text-slate-600">
                        🎯 Вплив: <span className="text-red-400 font-black">{selected.impactValue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Докази */}
                  <div className="bg-black border border-slate-800/50 p-6">
                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                      <FileText size={12} className="text-violet-600" />
                      ДОКАЗОВА БАЗА · {selected.evidence.length} ДЖЕРЕЛ
                    </h3>
                    <div className="space-y-3">
                      {selected.evidence.map((ev, i) => (
                        <motion.div
                          key={i}
                          onClick={() => setActiveEvidence(activeEvidence === i ? null : i)}
                          className={cn(
                            "border cursor-pointer transition-all",
                            activeEvidence === i ? "border-violet-800/50 bg-violet-950/15" : "border-slate-800/40 hover:border-slate-700/60 bg-black"
                          )}
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 flex items-center justify-center border shrink-0 font-black text-[13px] font-mono"
                                style={{
                                  borderColor: `rgba(139,92,246,${ev.weight / 100 * 0.6})`,
                                  color: ev.weight > 85 ? '#10b981' : ev.weight > 70 ? '#f59e0b' : '#64748b',
                                }}
                              >
                                {ev.weight}
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-violet-500 uppercase">{ev.source}</p>
                                <p className="text-[9px] text-slate-400 font-black">{ev.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[7px] font-mono text-slate-700">{ev.timestamp}</span>
                              <ChevronRight size={12} className={cn("text-slate-700 transition-transform", activeEvidence === i && "rotate-90")} />
                            </div>
                          </div>
                          {activeEvidence === i && (
                            <div className="px-4 pb-4 pt-0 border-t border-slate-800/40">
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[8px] text-slate-600">Вага доказу:</span>
                                <div className="flex items-center gap-2">
                                  <div className="h-1 w-24 bg-slate-900">
                                    <div className="h-full" style={{ width: `${ev.weight}%`, backgroundColor: ev.weight > 85 ? '#10b981' : '#f59e0b' }} />
                                  </div>
                                  <span className="text-[9px] font-black font-mono" style={{ color: ev.weight > 85 ? '#10b981' : '#f59e0b' }}>
                                    {ev.weight}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Наступні дії */}
                  <div className="bg-black border border-slate-800/50 p-6">
                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                      <Target size={12} className="text-amber-600" />
                      РЕКОМЕНДОВАНІ ДІЇ
                    </h3>
                    <div className="space-y-3">
                      {selected.nextActions.map((action, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 border border-slate-800/40 hover:border-amber-900/40 hover:bg-amber-950/5 transition-all cursor-pointer group">
                          <div className="w-6 h-6 border border-amber-900/40 bg-amber-950/20 flex items-center justify-center shrink-0">
                            <span className="text-[8px] font-black text-amber-700">{i + 1}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-200 transition-colors">{action}</span>
                          <ArrowUpRight size={13} className="ml-auto text-slate-700 group-hover:text-amber-600 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-4 bg-violet-700 text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-violet-600 transition-colors flex items-center justify-center gap-3 border border-violet-500/30">
                      <Sparkles size={14} />
                      ПОГЛИБИТИ АНАЛІЗ
                    </button>
                    <button className="py-4 bg-black border border-slate-700/50 text-slate-400 text-[9px] font-black uppercase tracking-wider hover:bg-slate-900 transition-colors flex items-center justify-center gap-3">
                      <Download size={14} />
                      СЛІДЧИЙ ЗВІТ PDF
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-black border border-slate-800/30 p-16 text-center">
                  <Brain size={40} className="mx-auto mb-4 text-slate-800" />
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                    ОБЕРІТЬ ГІПОТЕЗУ АБО ЗГЕНЕРУЙТЕ НОВУ
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:3px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(139,92,246,.15)}` }} />
    </div>
  );
};

export default HypothesisEngineView;
