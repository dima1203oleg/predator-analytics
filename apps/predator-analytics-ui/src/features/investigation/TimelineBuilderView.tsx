/**
 * TimelineBuilderView — інтерактивна хронологічна стрічка подій.
 * Прив'язка до кейсів, категорії, WORM-фіксація.
 * Фаза 3 v59.0-NEXUS.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Filter,
  Hash,
  History,
  Lock,
  MapPin,
  MessageSquare,
  PlusCircle,
  Search,
  Shield,
  TrendingUp,
  User,
} from 'lucide-react';

// ─── Типи ────────────────────────────────────────────────────────────────────

type EventCategory = 'financial' | 'legal' | 'contact' | 'travel' | 'document' | 'risk' | 'investigation';

interface TimelineEvent {
  id: string;
  date: string;
  time?: string;
  category: EventCategory;
  title: string;
  description: string;
  source: string;
  confidence: number; // 0–100
  relatedEntities?: string[];
  documents?: string[];
  caseId?: string;
  verified: boolean;
}

// ─── Mock-дані ────────────────────────────────────────────────────────────────

const MOCK_EVENTS: TimelineEvent[] = [
  {
    id: 'EVT-001',
    date: '2025-01-15',
    time: '09:30',
    category: 'financial',
    title: 'Відкриття рахунку в Monobank',
    description: 'Відкрито поточний рахунок UA213206490000026007233566001. Первісний депозит 50,000 UAH.',
    source: 'Банківські реєстри',
    confidence: 98,
    relatedEntities: ['Марченко Р.Г.', 'Monobank'],
    caseId: 'CASE-2025-089',
    verified: true,
  },
  {
    id: 'EVT-002',
    date: '2025-02-03',
    category: 'legal',
    title: 'Реєстрація ТОВ "ГОЛДЕН ТРЕЙД"',
    description: 'Зареєстровано нову юридичну особу. КВЕДи: 46.39, 46.90. Статутний капітал 1,000 UAH.',
    source: 'ЄДР України',
    confidence: 100,
    relatedEntities: ['ТОВ "ГОЛДЕН ТРЕЙД"', 'Марченко Р.Г.'],
    verified: true,
  },
  {
    id: 'EVT-003',
    date: '2025-02-28',
    time: '14:15',
    category: 'financial',
    title: 'Серія підозрілих транзакцій',
    description: '18 переказів по 14,850–14,990 UAH на різні рахунки. Ознаки структурування.',
    source: 'AML-система Predator',
    confidence: 87,
    relatedEntities: ['Рахунок UA213...', 'Рахунок UA456...'],
    caseId: 'CASE-2025-089',
    documents: ['AML-звіт від 28.02.25'],
    verified: false,
  },
  {
    id: 'EVT-004',
    date: '2025-03-10',
    category: 'travel',
    title: 'Виїзд до Дубаю (ОАЕ)',
    description: 'Перетин кордону через аеропорт Бориспіль. Дата повернення не встановлена.',
    source: 'ОСМД-дані (OSINT)',
    confidence: 72,
    relatedEntities: ['Марченко Р.Г.'],
    verified: false,
  },
  {
    id: 'EVT-005',
    date: '2025-03-22',
    category: 'document',
    title: 'Нотаріальне посвідчення договору',
    description: 'Договір купівлі-продажу нерухомості в Дубаї. Вартість: 1,200,000 AED.',
    source: 'Нотаріальні архіви (ОАЕ)',
    confidence: 65,
    relatedEntities: ['Марченко Р.Г.', 'BRAVEX TRADING LTD'],
    caseId: 'CASE-2025-089',
    verified: false,
  },
  {
    id: 'EVT-006',
    date: '2025-04-01',
    time: '18:00',
    category: 'risk',
    title: 'Ідентифікація PEP-зв\'язку',
    description: 'Встановлено ділові відносини з Олещуком В.О. — заступником міністра. Ризик: HIGH.',
    source: 'Аналітик Сидоренко Н.Р.',
    confidence: 92,
    relatedEntities: ['Марченко Р.Г.', 'Олещук В.О.'],
    caseId: 'CASE-2025-089',
    documents: ['Звіт PEP-аналізу'],
    verified: true,
  },
  {
    id: 'EVT-007',
    date: '2025-04-20',
    time: '09:15',
    category: 'investigation',
    title: 'Кейс ескальовано до керівника відділу',
    description: 'Рішення DEC-2025-00343: ескальовано для підтвердження вищою інстанцією.',
    source: 'Журнал Рішень PREDATOR',
    confidence: 100,
    relatedEntities: ['Марченко Р.Г.'],
    caseId: 'CASE-2025-089',
    verified: true,
  },
];

// ─── Конфігурація категорій ───────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  financial: { label: 'Фінанси', color: 'border-emerald-500 bg-emerald-500/20 text-emerald-400', icon: DollarSign },
  legal: { label: 'Правові', color: 'border-blue-500 bg-blue-500/20 text-blue-400', icon: Shield },
  contact: { label: 'Контакт', color: 'border-sky-500 bg-sky-500/20 text-sky-400', icon: MessageSquare },
  travel: { label: 'Переміщення', color: 'border-amber-500 bg-amber-500/20 text-amber-400', icon: MapPin },
  document: { label: 'Документи', color: 'border-indigo-500 bg-indigo-500/20 text-indigo-400', icon: FileText },
  risk: { label: 'Ризик', color: 'border-rose-500 bg-rose-500/20 text-rose-400', icon: AlertTriangle },
  investigation: { label: 'Слідство', color: 'border-purple-500 bg-purple-500/20 text-purple-400', icon: Eye },
};

// ─── Компонент події ──────────────────────────────────────────────────────────

function EventCard({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CATEGORY_CONFIG[event.category];
  const Icon = cfg.icon;

  return (
    <div className="relative flex gap-4">
      {/* Вертикальна лінія */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-white/[0.06]" />
      )}

      {/* Іконка категорії */}
      <div className="flex-shrink-0 z-10">
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${cfg.color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 pb-6">
        {/* Дата */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-white/40">
            {new Date(event.date).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })}
            {event.time && ` · ${event.time}`}
          </span>
          {!event.verified && (
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">
              Неверифіковано
            </span>
          )}
          {/* Confidence */}
          <span className={`text-[9px] font-mono ${event.confidence >= 90 ? 'text-emerald-400' : event.confidence >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
            {event.confidence}% впевненість
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left"
        >
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="flex items-start gap-3">
              {expanded ? (
                <ChevronDown className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <h3 className="text-sm font-semibold text-white/90">{event.title}</h3>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{event.description}</p>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.color}`}>
                {cfg.label}
              </span>
              {event.caseId && (
                <span className="text-[9px] font-mono text-sky-400/60">{event.caseId}</span>
              )}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="mt-2 ml-3 p-3 rounded-lg bg-white/[0.015] border border-white/[0.04] space-y-3">
            <div>
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Джерело</div>
              <p className="text-xs text-white/60">{event.source}</p>
            </div>

            {event.relatedEntities && event.relatedEntities.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Пов\'язані суб\'єкти</div>
                <div className="flex flex-wrap gap-1.5">
                  {event.relatedEntities.map((e) => (
                    <span key={e} className="text-xs text-sky-400/70 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded font-mono">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {event.documents && event.documents.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Документи</div>
                <div className="flex flex-wrap gap-1.5">
                  {event.documents.map((d) => (
                    <span key={d} className="flex items-center gap-1 text-xs text-indigo-400/70 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      <FileText className="w-3 h-3" />
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-white/25">
              <Lock className="w-3 h-3" />
              <span>ID: {event.id} · WORM-захищено після верифікації</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Головний компонент ───────────────────────────────────────────────────────

export const TimelineBuilderView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'ALL'>('ALL');

  const filtered = MOCK_EVENTS.filter((e) => {
    const matchSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchSearch && matchCategory;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Реконструктор Хронології (Timeline Builder)</h1>
            <p className="text-xs text-white/40 mt-0.5">Хронологічна реконструкція подій · CASE-2025-089</p>
          </div>
        </div>

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-500/30 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors">
          <PlusCircle className="w-3.5 h-3.5" />
          Додати подію
        </button>
      </div>

      {/* Фільтри */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук подій..."
            className="pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-indigo-500/40 transition-colors w-64"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-white/30" />
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded text-[11px] border transition-all ${categoryFilter === 'ALL' ? 'bg-white/10 text-white/80 border-white/20' : 'text-white/40 border-white/[0.06] hover:border-white/[0.12]'}`}
          >
            Всі
          </button>
          {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(categoryFilter === key ? 'ALL' : key)}
              className={`px-2.5 py-1 rounded text-[11px] border transition-all ${categoryFilter === key ? `${cfg.color}` : 'text-white/40 border-white/[0.06] hover:border-white/[0.12]'}`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-white/30 font-mono">{filtered.length} подій</div>
      </div>

      {/* Шкала часу */}
      <div className="ml-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Немає подій за вибраними фільтрами</p>
          </div>
        ) : (
          filtered.map((event, index) => (
            <EventCard key={event.id} event={event} isLast={index === filtered.length - 1} />
          ))
        )}
      </div>
    </div>
  );
};

export default TimelineBuilderView;
