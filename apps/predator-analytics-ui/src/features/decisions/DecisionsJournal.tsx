/**
 * DecisionsJournal — WORM-журнал прийнятих рішень.
 * Записи незмінні після фіксації (audit_log-сумісний).
 * Фаза 3 реструктуризації v59.0-NEXUS.
 */

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Filter,
  Hash,
  Lock,
  Search,
  Shield,
  TrendingUp,
  User,
  XCircle,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// ─── Типи ────────────────────────────────────────────────────────────────────

type DecisionStatus = 'APPROVED' | 'REJECTED' | 'PENDING' | 'ESCALATED';
type DecisionCategory = 'KYC' | 'AML' | 'RISK' | 'COMPLIANCE' | 'OPERATIONAL';

interface Decision {
  id: string;
  caseId?: string;
  subject: string;
  subjectType: 'company' | 'person' | 'transaction';
  category: DecisionCategory;
  status: DecisionStatus;
  analyst: string;
  timestamp: string;
  riskScore: number;
  summary: string;
  rationale: string;
  tags: string[];
  immutable: true; // WORM — завжди true
}

// ─── Тестові дані ─────────────────────────────────────────────────────────────

const MOCK_DECISIONS: Decision[] = [
  {
    id: 'DEC-2025-00341',
    caseId: 'CASE-2025-089',
    subject: 'ТОВ "АГРО-ПРАЙМ"',
    subjectType: 'company',
    category: 'KYC',
    status: 'APPROVED',
    analyst: 'Іванов О.В.',
    timestamp: '2025-04-19T14:32:00Z',
    riskScore: 28,
    summary: 'KYC-верифікація пройдена. Реальний бенефіціар встановлений.',
    rationale: 'Перевірено структуру власності по 4 юрисдикціям. UBO — Петренко М.О. (62%). Санкційних ризиків не виявлено.',
    tags: ['ubo', 'ukraine', 'agriculture', 'low-risk'],
    immutable: true,
  },
  {
    id: 'DEC-2025-00342',
    caseId: 'CASE-2025-091',
    subject: 'РАХУНОК UA213206490000026007233566001',
    subjectType: 'transaction',
    category: 'AML',
    status: 'REJECTED',
    analyst: 'Коваль Т.І.',
    timestamp: '2025-04-19T16:05:00Z',
    riskScore: 87,
    summary: 'Транзакція заблокована. Виявлено ознаки структурування.',
    rationale: '18 переказів по ~14,900 UAH протягом 72 годин. Класична схема structuring. Передано до фінмон.',
    tags: ['structuring', 'aml', 'blocked', 'finmon'],
    immutable: true,
  },
  {
    id: 'DEC-2025-00343',
    subject: 'Марченко Роман Григорович',
    subjectType: 'person',
    category: 'RISK',
    status: 'ESCALATED',
    analyst: 'Сидоренко Н.Р.',
    timestamp: '2025-04-20T09:15:00Z',
    riskScore: 72,
    summary: 'Кейс ескальовано. Виявлено PEP-зв\'язки 2-го рівня.',
    rationale: 'Досліджувана особа є партнером у бізнесі з чиновником міністерства. Потребує підтвердження керівника відділу.',
    tags: ['pep', 'escalated', 'politics', 'high-risk'],
    immutable: true,
  },
  {
    id: 'DEC-2025-00344',
    caseId: 'CASE-2025-094',
    subject: 'BRAVEX TRADING LTD (BVI)',
    subjectType: 'company',
    category: 'COMPLIANCE',
    status: 'PENDING',
    analyst: 'Мельник О.С.',
    timestamp: '2025-04-20T11:42:00Z',
    riskScore: 55,
    summary: 'Очікується відповідь юридичного відділу по BVI-структурі.',
    rationale: 'Компанія зареєстрована на BVI. Запит про підтвердження реального бенефіціара відправлено 18.04.',
    tags: ['offshore', 'bvi', 'pending', 'legal'],
    immutable: true,
  },
  {
    id: 'DEC-2025-00345',
    subject: 'ФОП Гнатюк В.М.',
    subjectType: 'person',
    category: 'OPERATIONAL',
    status: 'APPROVED',
    analyst: 'Бойко А.І.',
    timestamp: '2025-04-20T12:00:00Z',
    riskScore: 15,
    summary: 'Контрагент верифікований. Онбординг завершено.',
    rationale: 'Стандартний KYB-процес. Платник ЄСВ, без боргів. Ризик мінімальний.',
    tags: ['kyb', 'fop', 'low-risk', 'approved'],
    immutable: true,
  },
];

// ─── Константи стилів ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DecisionStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  APPROVED: { label: 'Схвалено', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  REJECTED: { label: 'Відхилено', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: XCircle },
  PENDING: { label: 'Очікування', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock },
  ESCALATED: { label: 'Ескальовано', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: AlertTriangle },
};

const CATEGORY_CONFIG: Record<DecisionCategory, { label: string; color: string }> = {
  KYC: { label: 'KYC', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  AML: { label: 'AML', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  RISK: { label: 'Ризик', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  COMPLIANCE: { label: 'Комплаєнс', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  OPERATIONAL: { label: 'Операційне', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

// ─── Компонент Risk Score ─────────────────────────────────────────────────────

function RiskScore({ score }: { score: number }) {
  const color = score < 30 ? 'text-emerald-400' : score < 60 ? 'text-amber-400' : 'text-rose-400';
  const bg = score < 30 ? 'bg-emerald-500' : score < 60 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bg}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold ${color}`}>{score}</span>
    </div>
  );
}

// ─── Рядок рішення ────────────────────────────────────────────────────────────

function DecisionRow({ decision }: { decision: Decision }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[decision.status];
  const category = CATEGORY_CONFIG[decision.category];
  const StatusIcon = status.icon;

  const date = new Date(decision.timestamp);
  const dateStr = date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="border border-white/[0.06] rounded-lg overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
      {/* Заголовок рядка */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/40" />
          )}
        </div>

        {/* ID */}
        <div className="w-36 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Hash className="w-3 h-3 text-white/30" />
            <span className="text-xs font-mono text-white/60">{decision.id}</span>
          </div>
          {decision.caseId && (
            <div className="text-[10px] text-sky-400/60 font-mono mt-0.5">{decision.caseId}</div>
          )}
        </div>

        {/* Суб'єкт */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/90 truncate">{decision.subject}</div>
          <div className="text-xs text-white/40 mt-0.5">{decision.summary}</div>
        </div>

        {/* Категорія */}
        <div className="flex-shrink-0 w-28">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${category.color}`}>
            {category.label}
          </span>
        </div>

        {/* Ризик */}
        <div className="flex-shrink-0 w-28">
          <RiskScore score={decision.riskScore} />
        </div>

        {/* Статус */}
        <div className="flex-shrink-0 w-32">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        {/* Аналітик */}
        <div className="flex-shrink-0 w-32 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <User className="w-3 h-3 text-white/30" />
            <span className="text-xs text-white/50">{decision.analyst}</span>
          </div>
          <div className="text-[10px] text-white/30 font-mono mt-0.5">{dateStr} {timeStr}</div>
        </div>

        {/* WORM lock */}
        <div className="flex-shrink-0 ml-2">
          <Lock className="w-3.5 h-3.5 text-white/20" title="WORM-захищений запис" />
        </div>
      </button>

      {/* Розгорнутий вміст */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06] bg-white/[0.01]">
          <div className="ml-8 mt-4 space-y-3">
            <div>
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">
                Обґрунтування рішення
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{decision.rationale}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {decision.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] font-mono text-white/40 bg-white/[0.04] border border-white/[0.06]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-white/25 mt-2">
              <Lock className="w-3 h-3" />
              <span>Запис захищений WORM-протоколом. Зміни неможливі після фіксації.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Головний компонент ───────────────────────────────────────────────────────

export const DecisionsJournal: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<DecisionCategory | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    return MOCK_DECISIONS.filter((d) => {
      const matchSearch =
        !search ||
        d.subject.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.summary.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || d.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [search, statusFilter, categoryFilter]);

  const stats = useMemo(() => ({
    total: MOCK_DECISIONS.length,
    approved: MOCK_DECISIONS.filter((d) => d.status === 'APPROVED').length,
    rejected: MOCK_DECISIONS.filter((d) => d.status === 'REJECTED').length,
    pending: MOCK_DECISIONS.filter((d) => d.status === 'PENDING').length,
    escalated: MOCK_DECISIONS.filter((d) => d.status === 'ESCALATED').length,
  }), []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Журнал Рішень</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-white/30" />
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                    WORM-захищено · Аудит-сумісний
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white/70 hover:border-white/20 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Експорт CSV
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Всього', value: stats.total, color: 'text-white/70' },
          { label: 'Схвалено', value: stats.approved, color: 'text-emerald-400' },
          { label: 'Відхилено', value: stats.rejected, color: 'text-rose-400' },
          { label: 'Очікування', value: stats.pending, color: 'text-amber-400' },
          { label: 'Ескальовано', value: stats.escalated, color: 'text-orange-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Фільтри */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за суб'єктом або ID..."
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-sky-500/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DecisionStatus | 'ALL')}
            className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white/70 focus:outline-none focus:border-sky-500/40 transition-colors cursor-pointer"
          >
            <option value="ALL">Всі статуси</option>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as DecisionCategory | 'ALL')}
            className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white/70 focus:outline-none focus:border-sky-500/40 transition-colors cursor-pointer"
          >
            <option value="ALL">Всі категорії</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-white/30 font-mono">
          {filtered.length} / {MOCK_DECISIONS.length} записів
        </div>
      </div>

      {/* Список рішень */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Немає рішень за вибраними фільтрами</p>
          </div>
        ) : (
          filtered.map((decision) => (
            <DecisionRow key={decision.id} decision={decision} />
          ))
        )}
      </div>

      {/* Інформаційна плашка */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
        <TrendingUp className="w-4 h-4 text-white/20 flex-shrink-0" />
        <p className="text-[11px] text-white/25">
          Всі записи захищені WORM-протоколом. Видалення та редагування заборонені (HR-16).
          Журнал сумісний з вимогами FATF та NBU щодо фінансового моніторингу.
        </p>
      </div>
    </div>
  );
};

export default DecisionsJournal;
