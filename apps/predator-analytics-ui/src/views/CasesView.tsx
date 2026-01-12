
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, AlertCircle, CheckCircle, Clock, Archive,
  ChevronRight, Eye, FileText, Building2, Briefcase,
  Stethoscope, Leaf, TrendingUp, BrainCircuit, Filter,
  Sparkles, Search, ExternalLink, ArchiveRestore, Send
} from 'lucide-react';
import { api } from '../services/api';
import { useGlobalState } from '../context/GlobalContext';
import { useUser, UserRole } from '../context/UserContext';
import { useShell, UIShell } from '../context/ShellContext';
import { NeutralizedContent } from '../components/NeutralizedContent';

// ============================================================================
// PREDATOR CASES VIEW - "КЕЙСИ" - ЦЕНТРАЛЬНА ЦІННІСТЬ ПЛАТФОРМИ
// Принцип: Бачиш → Розумієш → Дієш
// ============================================================================

// Типи Кейсів
type CaseStatus = 'КРИТИЧНО' | 'УВАГА' | 'БЕЗПЕЧНО' | 'АРХІВ';
type CaseSector = 'GOV' | 'BIZ' | 'MED' | 'SCI';

interface Case {
  id: string;
  title: string;
  situation: string;      // Короткий опис ситуації
  conclusion: string;     // Висновок AI
  status: CaseStatus;
  riskScore: number;      // 0-100
  sector: CaseSector;
  createdAt: Date;
  updatedAt: Date;
  entityId?: string;
  evidence: Evidence[];
  aiInsight?: string;
}

interface Evidence {
  id: string;
  type: 'REGISTRY' | 'TRANSACTION' | 'TENDER' | 'COURT' | 'OSINT';
  source: string;
  summary: string;
  riskLevel: number;
  timestamp: string;
}

// Конфігурація секторів
const SECTOR_CONFIG = {
  GOV: {
    label: 'Держсектор',
    icon: <Building2 size={16} />,
    color: 'blue',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400'
  },
  BIZ: {
    label: 'Бізнес',
    icon: <Briefcase size={16} />,
    color: 'amber',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400'
  },
  MED: {
    label: 'Медицина',
    icon: <Stethoscope size={16} />,
    color: 'rose',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400'
  },
  SCI: {
    label: 'Наука',
    icon: <Leaf size={16} />,
    color: 'emerald',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400'
  },
};

// Конфігурація статусів
const STATUS_CONFIG = {
  'КРИТИЧНО': {
    icon: <AlertCircle size={16} />,
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
    pulse: true
  },
  'УВАГА': {
    icon: <AlertTriangle size={16} />,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    pulse: false
  },
  'БЕЗПЕЧНО': {
    icon: <CheckCircle size={16} />,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    pulse: false
  },
  'АРХІВ': {
    icon: <Archive size={16} />,
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/50',
    text: 'text-slate-400',
    glow: 'shadow-slate-500/20',
    pulse: false
  },
};

// ============================================================================
// КОМПОНЕНТ КАРТКИ КЕЙСУ
// ============================================================================

interface CaseCardProps {
  caseItem: Case;
  onView: (id: string) => void;
  onArchive: (id: string) => void;
  onEscalate: (id: string) => void;
  isExpanded?: boolean;
}

const CaseCard: React.FC<CaseCardProps> = ({
  caseItem,
  onView,
  onArchive,
  onEscalate,
  isExpanded
}) => {
  const { currentShell } = useShell();
  const statusConfig = STATUS_CONFIG[caseItem.status];
  const sectorConfig = SECTOR_CONFIG[caseItem.sector];

  const isOperatorMode = currentShell === UIShell.OPERATOR;
  const isCommanderMode = currentShell === UIShell.COMMANDER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className={`
        relative p-6 rounded-[32px] border backdrop-blur-3xl transition-all cursor-pointer overflow-hidden group
        ${isCommanderMode ? 'bg-amber-500/[0.03] border-amber-500/20 shadow-amber-500/5' :
          isOperatorMode ? 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-emerald-500/5' :
          statusConfig.bg + ' ' + statusConfig.border + ' ' + statusConfig.glow}
        hover:shadow-2xl hover:border-white/10
      `}
      onClick={() => onView(caseItem.id)}
    >
      {/* Visual Glitch/Neural Effect Background for High Roles */}
      {(isOperatorMode || isCommanderMode) && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent blur-2xl group-hover:opacity-100 opacity-30 transition-opacity" />
      )}
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Статус індикатор */}
          <div className={`
            p-2 rounded-xl ${statusConfig.bg} ${statusConfig.text}
          `}>
            {statusConfig.icon}
          </div>

          {/* Сектор */}
          <div className={`
            px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
            ${sectorConfig.bg} ${sectorConfig.text} ${sectorConfig.border} border
          `}>
            <div className="flex items-center gap-1.5">
              {sectorConfig.icon}
              {sectorConfig.label}
            </div>
          </div>
        </div>

        {/* Ризик */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Ризик
          </span>
          <div className={`
            text-xl font-black ${
              caseItem.riskScore > 80 ? 'text-red-400' :
              caseItem.riskScore > 50 ? 'text-amber-400' : 'text-emerald-400'
            }
          `}>
            {caseItem.riskScore}%
          </div>
        </div>
      </div>

      {/* Назва */}
      <h3 className="text-lg font-black text-white mb-2 leading-tight">
        <NeutralizedContent
          content={caseItem.title}
          requiredRole={UserRole.OPERATOR}
          redactedLabel="PROTECTED_CASE_ALPHA"
        />
      </h3>

      {/* Ситуація */}
      <div className="mb-4">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2 opacity-50">
          СИТУАЦІЙНИЙ КОНТЕКСТ
        </span>
        <p className={`text-sm leading-relaxed ${isOperatorMode ? 'font-mono text-emerald-400/70' : 'text-slate-300'}`}>
          <NeutralizedContent
            content={caseItem.situation}
            mode="blur"
            requiredRole={UserRole.COMMANDER}
            redactedLabel="CONTEXT_REDACTED"
          />
        </p>
      </div>

      {/* Висновок AI */}
      {caseItem.conclusion && (
        <div className={`p-4 rounded-2xl border transition-all ${isCommanderMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-purple-500/5 border-purple-500/20'} mb-4`}>
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit size={14} className={isCommanderMode ? 'text-amber-400' : 'text-purple-400'} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isCommanderMode ? 'text-amber-400' : 'text-purple-400'}`}>
              ВЕРДИКТ_СИНАПСУ
            </span>
          </div>
          <p className={`text-sm italic leading-relaxed ${isCommanderMode ? 'text-slate-200 font-medium' : 'text-slate-300'}`}>
            <NeutralizedContent
              content={`"${caseItem.conclusion}"`}
              mode="hash"
              requiredRole={UserRole.OPERATOR}
            />
          </p>
        </div>
      )}

      {/* Прогрес-бар ризику */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${caseItem.riskScore}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            caseItem.riskScore > 80 ? 'bg-red-500' :
            caseItem.riskScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />
      </div>

      {/* Мета та дії */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Clock size={12} />
          {new Date(caseItem.createdAt).toLocaleString('uk-UA', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(caseItem.id); }}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Архівувати"
          >
            <Archive size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEscalate(caseItem.id); }}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
            title="Ескалювати"
          >
            <Send size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onView(caseItem.id); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all text-xs font-medium"
          >
            <Eye size={14} />
            Деталі
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// СТАТИСТИКА КЕЙСІВ
// ============================================================================

interface CaseStatsProps {
  cases: Case[];
  activeFilter: CaseStatus | 'ALL';
  onFilterChange: (filter: CaseStatus | 'ALL') => void;
}

const CaseStats: React.FC<CaseStatsProps> = ({ cases, activeFilter, onFilterChange }) => {
  const stats = useMemo(() => ({
    total: cases.length,
    critical: cases.filter(c => c.status === 'КРИТИЧНО').length,
    attention: cases.filter(c => c.status === 'УВАГА').length,
    safe: cases.filter(c => c.status === 'БЕЗПЕЧНО').length,
    archived: cases.filter(c => c.status === 'АРХІВ').length,
  }), [cases]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {/* Всі */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFilterChange('ALL')}
        className={`
          p-4 rounded-2xl border transition-all
          ${activeFilter === 'ALL'
            ? 'bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/20'
            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}
        `}
      >
        <div className="text-2xl font-black text-white mb-1">{stats.total}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Всі кейси
        </div>
      </motion.button>

      {/* Критичні */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFilterChange('КРИТИЧНО')}
        className={`
          p-4 rounded-2xl border transition-all
          ${activeFilter === 'КРИТИЧНО'
            ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/20'
            : 'bg-slate-900/50 border-slate-800 hover:border-red-500/30'}
        `}
      >
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle size={20} className="text-red-400" />
          <span className="text-2xl font-black text-red-400">{stats.critical}</span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Критично
        </div>
      </motion.button>

      {/* Увага */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFilterChange('УВАГА')}
        className={`
          p-4 rounded-2xl border transition-all
          ${activeFilter === 'УВАГА'
            ? 'bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/20'
            : 'bg-slate-900/50 border-slate-800 hover:border-amber-500/30'}
        `}
      >
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={20} className="text-amber-400" />
          <span className="text-2xl font-black text-amber-400">{stats.attention}</span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Увага
        </div>
      </motion.button>

      {/* Безпечно */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFilterChange('БЕЗПЕЧНО')}
        className={`
          p-4 rounded-2xl border transition-all
          ${activeFilter === 'БЕЗПЕЧНО'
            ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/20'
            : 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/30'}
        `}
      >
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={20} className="text-emerald-400" />
          <span className="text-2xl font-black text-emerald-400">{stats.safe}</span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Безпечно
        </div>
      </motion.button>

      {/* Архів */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFilterChange('АРХІВ')}
        className={`
          p-4 rounded-2xl border transition-all
          ${activeFilter === 'АРХІВ'
            ? 'bg-slate-500/10 border-slate-500/50 ring-2 ring-slate-500/20'
            : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}
        `}
      >
        <div className="flex items-center gap-2 mb-1">
          <Archive size={20} className="text-slate-400" />
          <span className="text-2xl font-black text-slate-400">{stats.archived}</span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Архів
        </div>
      </motion.button>
    </div>
  );
};

// ============================================================================
// ГОЛОВНИЙ КОМПОНЕНТ CASES VIEW
// ============================================================================

const CasesView: React.FC = () => {
  const { user } = useUser();
  const { currentShell } = useShell();
  const { dispatchEvent } = useGlobalState();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CaseStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const isCommanderShell = currentShell === UIShell.COMMANDER;
  const isOperatorShell = currentShell === UIShell.OPERATOR;

  // Завантаження кейсів
  useEffect(() => {
    const loadCases = async () => {
      setLoading(true);
      try {
        const data = await (api as any).v25.getCases();
        setCases(data);
      } catch (e) {
        console.error('Помилка завантаження кейсів:', e);
      } finally {
        setLoading(false);
      }
    };

    loadCases();
    const interval = setInterval(loadCases, 10000);
    return () => clearInterval(interval);
  }, []);

  // Фільтрація кейсів
  const filteredCases = useMemo(() => {
    let result = cases;

    // Фільтр за статусом
    if (activeFilter !== 'ALL') {
      result = result.filter(c => c.status === activeFilter);
    }

    // Пошук
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.situation.toLowerCase().includes(q) ||
        c.conclusion.toLowerCase().includes(q)
      );
    }

    // Сортування: критичні першими
    return result.sort((a, b) => {
      const statusOrder = { 'КРИТИЧНО': 0, 'УВАГА': 1, 'БЕЗПЕЧНО': 2, 'АРХІВ': 3 };
      return statusOrder[a.status] - statusOrder[b.status] || b.riskScore - a.riskScore;
    });
  }, [cases, activeFilter, searchQuery]);

  // Обробники дій
  const handleViewCase = (id: string) => {
    const caseItem = cases.find(c => c.id === id);
    if (caseItem) {
      setSelectedCase(caseItem);
      dispatchEvent('CASE_VIEWED', caseItem.title);
    }
  };

  const handleArchiveCase = async (id: string) => {
    setCases(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'АРХІВ' as CaseStatus } : c
    ));
    dispatchEvent('CASE_ARCHIVED', id);
  };

  const handleEscalateCase = async (id: string) => {
    dispatchEvent('CASE_ESCALATED', id);
    // TODO: Інтеграція з системою сповіщень
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 animate-in fade-in duration-500">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter uppercase italic">
              {isCommanderShell ? 'CASE_GOVERNANCE' : isOperatorShell ? 'OPERATIONAL_QUEUE' : 'Кейси'}
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-widest">
              SYSTEM_QUEUE: {filteredCases.length} ITEMS // FILTER: {activeFilter}
            </p>
          </div>

          {/* Пошук */}
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Пошук кейсів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        {/* AI Інсайт */}
        {cases.some(c => c.status === 'КРИТИЧНО') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 mb-6"
          >
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-0.5">
                Рекомендація AI
              </div>
              <div className="text-sm text-slate-200">
                Виявлено {cases.filter(c => c.status === 'КРИТИЧНО').length} критичних кейсів.
                Рекомендую розпочати з <span className="text-white font-semibold">"{cases.find(c => c.status === 'КРИТИЧНО')?.title}"</span> — найвищий рівень ризику.
              </div>
            </div>
            <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-all">
              Перейти
            </button>
          </motion.div>
        )}
      </div>

      {/* Статистика / Фільтри */}
      <CaseStats
        cases={cases}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Список кейсів */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Archive size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-400 mb-2">
            Кейсів не знайдено
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            {searchQuery
              ? 'Спробуйте змінити пошуковий запит або фільтри'
              : 'Наразі немає активних кейсів у цій категорії'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                onView={handleViewCase}
                onArchive={handleArchiveCase}
                onEscalate={handleEscalateCase}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Модальне вікно деталей кейсу */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedCase(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* TODO: Детальний вигляд кейсу */}
              <h2 className="text-2xl font-bold text-white mb-4">
                {selectedCase.title}
              </h2>
              <p className="text-slate-400 mb-6">
                {selectedCase.situation}
              </p>
              <button
                onClick={() => setSelectedCase(null)}
                className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all"
              >
                Закрити
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CasesView;
