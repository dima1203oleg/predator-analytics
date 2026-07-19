/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ARCHITECTURE_NODES, ARCHITECTURE_EDGES } from '../data';
import { ArchitectureNode } from '../types';
import { 
  Shield, Cpu, Activity, HelpCircle, Network, Info, CheckCircle2, 
  Sliders, Play, Settings, Search, Lock, Globe, Terminal, BookOpen, 
  AlertTriangle, Layers, ChevronDown, ChevronUp, Eye, Database 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Hand-coded nodes with relative coordinates for SVG rendering
const NODE_COORDS: Record<string, { x: number; y: number }> = {
  client: { x: 90, y: 120 },
  gateway: { x: 90, y: 280 },
  core_api: { x: 90, y: 460 },
  
  pg: { x: 330, y: 120 },
  graph_db: { x: 330, y: 230 },
  vector_db: { x: 330, y: 340 },
  search_db: { x: 330, y: 450 },
  minio: { x: 330, y: 560 },
  
  kafka: { x: 550, y: 340 },
  
  osint_worker: { x: 740, y: 180 },
  ai_worker: { x: 740, y: 340 },
  etl_worker: { x: 740, y: 500 },
  
  vllm: { x: 920, y: 260 },
  whisper: { x: 920, y: 340 },
  doctr: { x: 920, y: 420 }
};

const LEVELS_DATA = [
  {
    level: 1,
    title: "LEVEL 1 — Production",
    badge: "Production Ready",
    color: "emerald",
    purpose: "Модулі цього рівня призначені для щоденної роботи аналітиків, комплаєнс-офіцерів, ризик-менеджерів, журналістов-розслідувачів. Вони оперують виключно тими даними, які отримані з джерел з підтвердженим правом доступу та не містять обмежень на комерційне чи аналітичне використання.",
    sourcesTitle: "Дозволені джерела даних",
    sources: [
      "Відкриті державні реєстри юридичних осіб, фізичних осіб-підприємців, бенефіціарів",
      "Реєстри нерухомості, земельних ділянок, обтяжень",
      "Судові рішення (єдині державні та міжнародні бази)",
      "Тендерні майданчики, системи електронних закупівель",
      "Офіційні API державних органів (податкові, митні, статистичні)",
      "Відкриті фінансові звіти, аудиторські висновки",
      "Глобальні реєстри санкцій, списки терористів та екстремістів",
      "Міжнародні бази політично значущих осіб (PEP)",
      "Дані фондових бірж, реєстри цінних паперів",
      "Митна статистика зовнішньоекономічної діяльності",
      "Геопросторові відкриті дані (кадастрові карти, супутникові знімки)",
      "Офіційні прес-релізи компаній, новинні стрічки",
      "Публічні профілі у професійних та ділових соціальних мережах",
      "Корпоративні бази даних, доступ до яких надано через офіційні угоди",
      "Добровільно надані користувачем документи (контракти, акти, звіти)",
      "Відкриті реєстри інтелектуальної власності, патенти, торговельні марки",
      "Ліцензійні реєстри, дозвільна документація"
    ],
    functionsTitle: "Доступний функціонал",
    functions: [
      "Автоматизований збір та агрегація профілю компанії або публічної особи",
      "Побудова ланцюгів володіння, графів афілійованості",
      "Аналіз тендерної історії, конкурентного середовища",
      "Виявлення ознак пов’язаності через спільні адреси, телефони, засновників",
      "Оцінка ризиків на основі судової історії, санкційних списків, медійного фону",
      "Формування Due Diligence-звітів, профілів контрагентів",
      "Відстеження змін у реєстрах, сповіщення про нові події",
      "Інтеграція з CRM, ERP-системами через API",
      "Візуалізація зв’язків на інтерактивному графі"
    ],
    example: "Перевірка потенційного партнера перед укладенням контракту; оцінка благонадійності кандидата на топ-посаду; журналістське розслідування на основі відкритих реєстрів."
  },
  {
    level: 2,
    title: "LEVEL 2 — Research Intelligence",
    badge: "Security & Threat Intel",
    color: "amber",
    purpose: "Модулі цього рівня призначені для підрозділів кібербезпеки, Threat Intelligence, Red/Purple Team, внутрішніх аудиторів, наукових груп. Вони спрямовані на моделювання загроз, дослідження тактик та аналіз інцидентів в ізольованому середовищі без активного впливу чи взаємодії з цілями (без живої взаємодії з цілями).",
    sourcesTitle: "Дозволені напрями досліджень",
    sources: [
      "Аналіз тактик, технік і процедур (TTP) згідно класифікації MITRE ATT&CK",
      "Дослідження відомих кампаній APT-угруповань, кібершпигунства та цільових атак",
      "Вивчення архітектури фінансових шахрайств, кейсів соціальної інженерії",
      "Аналіз методів відмивання коштів, схем обходу санкцій",
      "Дослідження корупційних мереж на знеособлених або синтетичних даних",
      "Моделювання графів кримінальних зв’язків для оцінки системних ризиків",
      "Аналіз індикаторів компрометації (IOC) з відкритих та комерційних Threat Intelligence-потоків",
      "Дослідження шкідливого ПЗ у ізольованих пісочницях, вивчення векторів зараження",
      "Вивчення історичних витоків даних для оцінки потенційного впливу на організацію (без завантаження та поширення персональних даних)",
      "Аналіз структури ботнетів, рансомвару та supply chain-атак",
      "Дослідження методів обходу захисних механізмів та експлуатації вразливостей на концептуальному рівні",
      "Аналіз криптографічних атак та слабких місць у протоколах",
      "Побудова моделей ризиків для конкретних галузей, автоматична класифікація інцидентів",
      "Моделювання сценаріїв атак (Red Team) на власну інфраструктуру організації",
      "Аналіз журналів системних інцидентів, кореляція та ретроспективний аналіз подій",
      "Purple Team-вправи: валідація засобів виявлення та налаштування SIEM/SOAR"
    ],
    functionsTitle: "Доступний режим",
    functions: [
      "Дослідження та моделювання без активної взаємодії із зовнішніми цілями",
      "Симуляція та аналітика у закритих контурах",
      "Створення правил виявлення загроз (YARA, Sigma)"
    ],
    example: "Вивчення нової фішингової кампанії, адаптація захисних правил; тренування команди реагування на інциденти; оцінка вразливості бізнес-процесів до методів соціальної інженерії."
  },
  {
    level: 3,
    title: "LEVEL 3 — Restricted",
    badge: "Restricted & Labs",
    color: "rose",
    purpose: "Цей рівень визначає функціонал, використання якого в інструментах комерційного характеру заборонено або жорстко контролюється. Доступ до таких модулів обмежено з метою запобігання зловживанням, незаконному стеженню або кібератакам.",
    sourcesTitle: "Обмежені / Заборонені дії",
    sources: [
      "Несанкціонований доступ до комп’ютерних систем, мереж чи облікових записів",
      "Епсплуатація вразливостей з метою нанесення шкоди, ескалація привілеїв у сторонніх системах",
      "Викрадення, перехоплення чи автоматизований підбір облікових даних (credentials)",
      "Обхід систем багатофакторної автентифікації сторонніх ресурсів",
      "Приховане проникнення та закріплення (persistence) у зовнішніх інфраструктурах",
      "Встановлення, розповсюдження чи керування шкідливим програмним забезпеченням",
      "Масовий автоматизований збір персональних даних без належних юридичних підстав",
      "Доксинг (публікація приватної інформації осіб зі злим умислом)",
      "Сталкінг, незаконне відстеження та моніторинг фізичних осіб",
      "Прихований моніторинг активності (клавіатурні шпигуни, запис екрану без згоди)",
      "Використання викрадених баз даних, зливів персональних даних",
      "Автоматизована соціальна інженерія з метою маніпуляції конкретними особами",
      "Автоматизоване створення та цільова розсилка фішингових повідомлень",
      "Інструменти для шахрайства, генерації підроблених документів",
      "Обхід систем захисту авторських прав та керування правами (DRM)",
      "Саботаж, знищення даних чи порушення працездатності систем"
    ],
    functionsTitle: "Спеціалізований режим для авторизованих лабораторій",
    functions: [
      "Університетські лабораторії, сертифіковані дослідницькі центри, внутрішні R&D команди",
      "Доступ до знеособлених (anonymized) наборів даних про кіберінциденти",
      "Можливість запускати власні моделі машинного навчання на синтетичних графах загроз",
      "Інструменти для розбору та аналізу конкретних зразків шкідливого коду в ізольованих контейнерах",
      "Модулі візуалізації TTP, маппінг на матрицю MITRE ATT&CK, порівняння профілів угруповань",
      "Генератори синтетичних OSINT-профілів для тренування аналітиків",
      "Симулятори фішингових кампаній для внутрішніх навчань співробітників (з обов'язковим інформуванням)",
      "Бібліотеки відомих експлойтів та шелл-кодів для вивчення механізмів дії (без виконання на реальних системах)",
      "Аналіз криптографічних вразливостей виключно у навчальних та дослідницьких цілях"
    ],
    example: "Цілісний освітній процес у рамках університевської лабораторії кібербезпеки; тестування на проникнення на замовлення клієнта за підписаним NDA; дослідження шкідливого ПЗ у сертифікованій антивірусній лабораторії."
  }
];

export default function ArchitectureTab() {
  const [activeSubView, setActiveSubView] = useState<'diagram' | 'capabilities'>('diagram');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('core_api');
  const [activeLayer, setActiveLayer] = useState<string>('all'); // all, data, ai, event, edge
  const [capSearchQuery, setCapSearchQuery] = useState<string>('');
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });

  const selectedNode = ARCHITECTURE_NODES.find(n => n.id === selectedNodeId) || ARCHITECTURE_NODES[2];

  // Group filter logic to dim irrelevant nodes
  const isNodeDimmed = (node: ArchitectureNode) => {
    if (activeLayer === 'all') return false;
    if (activeLayer === 'data' && node.group === 'Database') return false;
    if (activeLayer === 'ai' && (node.group === 'AI' || node.id === 'ai_worker')) return false;
    if (activeLayer === 'event' && (node.group === 'Event' || node.group === 'Worker')) return false;
    if (activeLayer === 'edge' && (node.group === 'Client' || node.group === 'Gateway' || node.group === 'Core')) return false;
    return true;
  };

  const getGroupColorClass = (group: string) => {
    switch (group) {
      case 'Client': return 'fill-sky-500/10 stroke-sky-400 text-sky-400';
      case 'Gateway': return 'fill-indigo-500/10 stroke-indigo-400 text-indigo-400';
      case 'Core': return 'fill-purple-500/10 stroke-purple-400 text-purple-400';
      case 'Database': return 'fill-emerald-500/10 stroke-emerald-400 text-emerald-400';
      case 'Event': return 'fill-amber-500/10 stroke-amber-400 text-amber-400';
      case 'Worker': return 'fill-pink-500/10 stroke-pink-400 text-pink-400';
      case 'AI': return 'fill-teal-500/10 stroke-teal-400 text-teal-400';
      default: return 'fill-slate-500/10 stroke-slate-400 text-slate-300';
    }
  };

  const getGroupTitleUkrainian = (group: string) => {
    switch (group) {
      case 'Client': return 'Клієнтський рівень';
      case 'Gateway': return 'Точка входу';
      case 'Core': return 'Центральне ядро';
      case 'Database': return 'База даних';
      case 'Event': return 'Шина подій';
      case 'Worker': return 'Фонові обробники';
      case 'AI': return 'ШІ Підсистема';
      default: return 'Системний сервіс';
    }
  };

  const toggleLevelExpand = (lvl: number) => {
    setExpandedLevels(prev => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  const filteredLevels = LEVELS_DATA.map(lvl => {
    if (!capSearchQuery) return { ...lvl, matches: true, matchedSources: lvl.sources, matchedFunctions: lvl.functions };
    
    const query = capSearchQuery.toLowerCase();
    const matchesTitle = lvl.title.toLowerCase().includes(query);
    const matchesPurpose = lvl.purpose.toLowerCase().includes(query);
    const matchesExample = lvl.example.toLowerCase().includes(query);
    
    const filteredSources = lvl.sources.filter(s => s.toLowerCase().includes(query));
    const filteredFunctions = lvl.functions.filter(f => f.toLowerCase().includes(query));
    
    const hasMatch = matchesTitle || matchesPurpose || matchesExample || filteredSources.length > 0 || filteredFunctions.length > 0;
    
    return {
      ...lvl,
      matches: hasMatch,
      matchedSources: filteredSources.length > 0 ? filteredSources : lvl.sources,
      matchedFunctions: filteredFunctions.length > 0 ? filteredFunctions : lvl.functions,
      highlightAll: matchesTitle || matchesPurpose || matchesExample
    };
  }).filter(lvl => lvl.matches);

  return (
    <div className="space-y-6" id="architecture-tab-root">
      {/* Intro Header */}
      <div className="bg-slate-900/60 border border-indigo-500/10 rounded-xl p-6 backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" id="arch-title-icon" />
            Архітектура та Можливості Платформи PREDATOR
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Системна модель архітектурного ландшафту та чітка трирівнева сегментація функціоналу відповідно до вимог безпеки, комплаєнсу та дослідницької діяльності.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-indigo-500/10 self-start lg:self-center">
          <button
            onClick={() => setActiveSubView('diagram')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${activeSubView === 'diagram' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            <Network className="w-4 h-4" />
            Граф залежностей
          </button>
          <button
            onClick={() => setActiveSubView('capabilities')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${activeSubView === 'capabilities' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            <Layers className="w-4 h-4" />
            Три рівні функціоналу
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubView === 'diagram' ? (
          <motion.div
            key="diagram-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 bg-slate-900/40 p-3 rounded-xl border border-indigo-500/5 items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Фільтрація шарів архітектури:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  id="layer-all-btn"
                  onClick={() => setActiveLayer('all')}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${activeLayer === 'all' ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-medium' : 'bg-slate-900/50 border-indigo-500/10 text-slate-300 hover:text-slate-200'}`}
                >
                  Уся мережа
                </button>
                <button
                  id="layer-data-btn"
                  onClick={() => setActiveLayer('data')}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${activeLayer === 'data' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium' : 'bg-slate-900/50 border-indigo-500/10 text-slate-300 hover:text-emerald-300'}`}
                >
                  Сховища / БД
                </button>
                <button
                  id="layer-ai-btn"
                  onClick={() => setActiveLayer('ai')}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${activeLayer === 'ai' ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 font-medium' : 'bg-slate-900/50 border-indigo-500/10 text-slate-300 hover:text-teal-300'}`}
                >
                  Штучний інтелект
                </button>
                <button
                  id="layer-event-btn"
                  onClick={() => setActiveLayer('event')}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${activeLayer === 'event' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium' : 'bg-slate-900/50 border-indigo-500/10 text-slate-300 hover:text-amber-300'}`}
                >
                  Шина & Воркери
                </button>
                <button
                  id="layer-edge-btn"
                  onClick={() => setActiveLayer('edge')}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${activeLayer === 'edge' ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-medium' : 'bg-slate-900/50 border-indigo-500/10 text-slate-300 hover:text-sky-300'}`}
                >
                  Ядро & Клієнт
                </button>
              </div>
            </div>

            {/* Main Interactive Diagram and Sidebar Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              
              {/* Interactive SVG Diagram */}
              <div className="xl:col-span-3 bg-slate-950/80 border border-indigo-500/10 rounded-xl p-4 overflow-x-auto relative flex justify-center" id="svg-canvas-container">
                <div className="min-w-[1000px] w-full aspect-[1000/680] relative">
                  <svg
                    className="w-full h-full select-none"
                    viewBox="0 0 1020 680"
                    xmlns="http://www.w3.org/2000/svg"
                    id="architecture-svg-canvas"
                  >
                    {/* Background grid pattern */}
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                      </pattern>
                      
                      {/* Marker arrow definition for lines */}
                      <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                      </marker>
                      
                      <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
                      </marker>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" opacity="0.4" />

                    {/* Subgraph Boundary Labels */}
                    <rect x="25" y="40" width="220" height="580" fill="#312e81" fillOpacity="0.02" stroke="#312e81" strokeWidth="1" strokeDasharray="5 5" rx="10" />
                    <text x="35" y="65" fill="#6366f1" fontSize="10" fontWeight="bold" letterSpacing="1">PIPELINE CORE</text>

                    <rect x="270" y="40" width="210" height="580" fill="#065f46" fillOpacity="0.02" stroke="#065f46" strokeWidth="1" strokeDasharray="5 5" rx="10" />
                    <text x="280" y="65" fill="#34d399" fontSize="10" fontWeight="bold" letterSpacing="1">DATA STORAGE LAYER</text>

                    <rect x="660" y="40" width="335" height="580" fill="#9d174d" fillOpacity="0.015" stroke="#9d174d" strokeWidth="1" strokeDasharray="5 5" rx="10" />
                    <text x="670" y="65" fill="#f43f5e" fontSize="10" fontWeight="bold" letterSpacing="1">AI SUBSYSTEM & EXTERNAL</text>

                    {/* DRAW EDGES (LINES) */}
                    {ARCHITECTURE_EDGES.map((edge, idx) => {
                      const fromCoord = NODE_COORDS[edge.from];
                      const toCoord = NODE_COORDS[edge.to];
                      if (!fromCoord || !toCoord) return null;

                      const fromNode = ARCHITECTURE_NODES.find(n => n.id === edge.from)!;
                      const toNode = ARCHITECTURE_NODES.find(n => n.id === edge.to)!;
                      const isSelectedEdge = edge.from === selectedNodeId || edge.to === selectedNodeId;
                      const isDimmedEdge = isNodeDimmed(fromNode) || isNodeDimmed(toNode);

                      return (
                        <g key={idx} opacity={isDimmedEdge ? 0.08 : isSelectedEdge ? 1 : 0.45}>
                          <line
                            x1={fromCoord.x}
                            y1={fromCoord.y}
                            x2={toCoord.x}
                            y2={toCoord.y}
                            stroke={isSelectedEdge ? '#818cf8' : '#475569'}
                            strokeWidth={isSelectedEdge ? 2 : 1.2}
                            strokeDasharray={edge.type === 'async' ? '5 3' : undefined}
                            markerEnd={isSelectedEdge ? 'url(#arrow-active)' : 'url(#arrow)'}
                            className="transition-all duration-300"
                          />
                          {edge.label && isSelectedEdge && (
                            <g transform={`translate(${(fromCoord.x + toCoord.x) / 2}, ${(fromCoord.y + toCoord.y) / 2 - 8})`}>
                              <rect x="-60" y="-10" width="120" height="18" fill="#090d16" rx="4" stroke="#1e293b" strokeWidth="1" />
                              <text
                                textAnchor="middle"
                                fill="#c7d2fe"
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="semibold"
                                y="2"
                              >
                                {edge.label}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* DRAW NODES */}
                    {ARCHITECTURE_NODES.map((node) => {
                      const coord = NODE_COORDS[node.id];
                      if (!coord) return null;

                      const isSelected = node.id === selectedNodeId;
                      const isDimmed = isNodeDimmed(node);
                      const colorClasses = getGroupColorClass(node.group);

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${coord.x}, ${coord.y})`}
                          onClick={() => setSelectedNodeId(node.id)}
                          className="cursor-pointer"
                          opacity={isDimmed ? 0.15 : 1}
                        >
                          {/* Pulsing glow under selected node */}
                          {isSelected && (
                            <circle r="50" className="fill-indigo-500/5 stroke-indigo-500/20 animate-pulse" strokeWidth="2" />
                          )}

                          {/* Main Node Card Shape */}
                          <rect
                            x="-70"
                            y="-26"
                            width="140"
                            height="52"
                            rx="8"
                            className={`transition-all duration-300 ${isSelected ? 'fill-slate-900 stroke-indigo-500 stroke-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'fill-slate-950/90 hover:fill-slate-900 stroke-slate-800 hover:stroke-slate-700'}`}
                          />

                          {/* Small accent bar */}
                          <rect
                            x="-70"
                            y="-26"
                            width="4"
                            height="52"
                            rx="2"
                            className={`${isSelected ? 'fill-indigo-400' : 'fill-slate-700'}`}
                          />

                          {/* Node Text Label */}
                          <text
                            textAnchor="middle"
                            y="-2"
                            className={`text-[12px] font-bold ${isSelected ? 'fill-white' : 'fill-slate-200'}`}
                          >
                            {node.label}
                          </text>

                          {/* Node Metadata (Tech / Version) */}
                          <text
                            textAnchor="middle"
                            y="14"
                            className="fill-slate-500 text-[9px] font-mono"
                          >
                            {node.tech.split(',')[0]}
                          </text>

                          {/* Small category indicator */}
                          <circle
                            cx="56"
                            cy="-16"
                            r="4"
                            className={colorClasses.split(' ')[2]}
                            fill="currentColor"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Quick Map Legend Overlay */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/95 border border-indigo-500/10 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-300 font-mono shadow-lg">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Клієнтський рівень
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Сховища та Бази даних
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Точка входу
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-400"></span> Асинхронні воркери
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> fastapi Core
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span> ШІ Моделі (vLLM/Whisper)
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Component Specification Sidebar */}
              <div className="xl:col-span-1 flex flex-col justify-between" id="architecture-sidebar">
                <div className="bg-slate-900/40 border border-indigo-500/10 rounded-xl p-5 space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-indigo-500/10 pb-3">
                      <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold block font-mono">
                        {getGroupTitleUkrainian(selectedNode.group)}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                        {selectedNode.label}
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      </h3>
                    </div>

                    {/* Section: Description */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                        Призначення мікросервісу
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-indigo-500/5">
                        {selectedNode.description}
                      </p>
                      <p className="text-[11px] text-slate-300 italic">
                        {selectedNode.details}
                      </p>
                    </div>

                    {/* Tech Stack */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                        Технологічний стек
                      </span>
                      <code className="block text-xs font-mono bg-slate-950/40 p-2 rounded-lg border border-indigo-500/5 text-slate-300">
                        {selectedNode.tech}
                      </code>
                    </div>

                    {/* Security Standards */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-rose-400" />
                        Рівень безпеки & Контур
                      </span>
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-indigo-500/5 text-[11px]">
                        {selectedNode.security}
                      </p>
                    </div>

                    {/* Horizontal Scaling & Resource Limits */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        Масштабування в K8s
                      </span>
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-indigo-500/5 text-[11px]">
                        {selectedNode.scaling}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-indigo-500/10/80 bg-slate-900/10 text-center">
                    <span className="text-[10px] text-slate-500 block font-mono">Апаратна архітектура</span>
                    <span className="text-xs font-bold text-slate-300">Kubernetes High-Availability Cluster</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="capabilities-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search Bar for capabilities */}
            <div className="bg-slate-900/40 border border-indigo-500/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Матриця сумісності</span>
                <h3 className="text-sm font-bold text-slate-200">Пошук та фільтрація повноважень</h3>
              </div>
              
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Шукати джерела, тактики (напр. MITRE, реєстри)..."
                  value={capSearchQuery}
                  onChange={(e) => setCapSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-indigo-500/10 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 font-sans"
                />
              </div>
            </div>

            {/* Render Three Levels */}
            <div className="space-y-6">
              {filteredLevels.length === 0 ? (
                <div className="bg-slate-900/20 border border-dashed border-indigo-500/10 rounded-xl p-12 text-center">
                  <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300 text-sm font-medium">Співпадінь не знайдено</p>
                  <p className="text-slate-600 text-xs mt-1">Спробуйте змінити пошуковий запит</p>
                </div>
              ) : (
                filteredLevels.map((lvl) => {
                  const isExpanded = expandedLevels[lvl.level];
                  const isEmerald = lvl.color === 'emerald';
                  const isAmber = lvl.color === 'amber';
                  const isRose = lvl.color === 'rose';

                  let levelBorderColor = "border-indigo-500/10";
                  let levelBgColor = "bg-slate-900/40";
                  let badgeColor = "bg-indigo-500/10 text-indigo-400";
                  let iconColor = "text-indigo-400";

                  if (isEmerald) {
                    levelBorderColor = "border-emerald-500/20 hover:border-emerald-500/40";
                    levelBgColor = "bg-emerald-950/5";
                    badgeColor = "bg-emerald-500/10 text-emerald-400";
                    iconColor = "text-emerald-400";
                  } else if (isAmber) {
                    levelBorderColor = "border-amber-500/20 hover:border-amber-500/40";
                    levelBgColor = "bg-amber-950/5";
                    badgeColor = "bg-amber-500/10 text-amber-400";
                    iconColor = "text-amber-400";
                  } else if (isRose) {
                    levelBorderColor = "border-rose-500/20 hover:border-rose-500/40";
                    levelBgColor = "bg-rose-950/5";
                    badgeColor = "bg-rose-500/10 text-rose-400";
                    iconColor = "text-rose-400";
                  }

                  return (
                    <motion.div
                      layout
                      key={lvl.level}
                      className={`border ${levelBorderColor} ${levelBgColor} rounded-xl p-5 transition-all duration-300`}
                    >
                      {/* Header Segment */}
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleLevelExpand(lvl.level)}
                      >
                        <div className="flex items-center gap-3">
                          {isEmerald && <Globe className={`w-5 h-5 ${iconColor}`} />}
                          {isAmber && <Terminal className={`w-5 h-5 ${iconColor}`} />}
                          {isRose && <Lock className={`w-5 h-5 ${iconColor}`} />}
                          
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-base font-bold text-slate-100">{lvl.title}</h3>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${badgeColor}`}>
                                {lvl.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-4xl">
                              {lvl.purpose}
                            </p>
                          </div>
                        </div>

                        <button className="text-slate-500 hover:text-slate-300 transition-colors">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Content Segment */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mt-4 pt-4 border-t border-indigo-500/10 space-y-4 text-xs"
                          >
                            <p className="text-slate-300 leading-relaxed text-xs">
                              {lvl.purpose}
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Left Column: Data Sources or allowed vectors */}
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-500/5 pb-1">
                                  {isEmerald && <Database className="w-3.5 h-3.5 text-emerald-400" />}
                                  {isAmber && <Terminal className="w-3.5 h-3.5 text-amber-400" />}
                                  {isRose && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                                  {lvl.sourcesTitle}
                                </h4>
                                
                                <ul className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {lvl.matchedSources.map((source, idx) => {
                                    const isHighlighted = capSearchQuery && source.toLowerCase().includes(capSearchQuery.toLowerCase());
                                    return (
                                      <li 
                                        key={idx} 
                                        className={`flex items-start gap-2 p-1 rounded transition-colors ${isHighlighted ? 'bg-indigo-500/20 text-white font-medium border-l-2 border-indigo-500 pl-1.5' : 'text-slate-300'}`}
                                      >
                                        <span className={`font-bold mt-0.5 ${isEmerald ? 'text-emerald-500' : isAmber ? 'text-amber-500' : 'text-rose-500'}`}>•</span>
                                        <span>{source}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>

                              {/* Right Column: Functions / Sandbox specs */}
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-500/5 pb-1">
                                  {isEmerald && <Activity className="w-3.5 h-3.5 text-emerald-400" />}
                                  {isAmber && <Cpu className="w-3.5 h-3.5 text-amber-400" />}
                                  {isRose && <BookOpen className="w-3.5 h-3.5 text-rose-400" />}
                                  {lvl.functionsTitle}
                                </h4>

                                <ul className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {lvl.matchedFunctions.map((fn, idx) => {
                                    const isHighlighted = capSearchQuery && fn.toLowerCase().includes(capSearchQuery.toLowerCase());
                                    return (
                                      <li 
                                        key={idx} 
                                        className={`flex items-start gap-2 p-1 rounded transition-colors ${isHighlighted ? 'bg-indigo-500/20 text-white font-medium border-l-2 border-indigo-500 pl-1.5' : 'text-slate-300'}`}
                                      >
                                        <span className={`font-bold mt-0.5 ${isEmerald ? 'text-emerald-500' : isAmber ? 'text-amber-500' : 'text-rose-500'}`}>•</span>
                                        <span>{fn}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            </div>

                            {/* Practical Case Example */}
                            <div className="bg-slate-950/60 p-4 rounded-lg border border-indigo-500/5 mt-4">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Приклад практичного застосування</span>
                              <p className="text-slate-200 italic leading-relaxed">
                                &ldquo;{lvl.example}&rdquo;
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
