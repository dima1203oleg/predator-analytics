import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, List, Search, Filter, ChevronDown,
  Calendar, Tag, AlertTriangle, CheckCircle, Clock,
  FileText, ArrowUpRight, MoreHorizontal
} from 'lucide-react';

// ============================================================================
// SMART CASE BROWSER - Predator v45 | Neural Analytics.0
// Intuitive case management with advanced filtering
// ============================================================================

interface Case {
  id: string;
  title: string;
  situation: string;
  status: 'ВІДК� ИТО' | 'В � ОБОТІ' | 'ЗАВЕ� ШЕНО' | 'К� ИТИЧНО';
  priority: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  sector: string;
  created_at: string;
  updated_at: string;
  ai_insight?: string;
  entity_id?: string;
}

const statusConfig = {
  'ВІДК� ИТО': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: FileText },
  'В � ОБОТІ': { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  'ЗАВЕ� ШЕНО': { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  'К� ИТИЧНО': { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: AlertTriangle },
};

const priorityColors = {
  low: 'bg-slate-500/10',
  medium: 'bg-blue-500/10',
  high: 'bg-amber-500/10',
  critical: 'bg-rose-500/10',
};

const getRiskColor = (score: number) => {
  if (score >= 80) return 'text-rose-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-blue-400';
  return 'text-emerald-400';
};

const CaseCard = ({ caseItem, onClick }: { caseItem: Case; onClick: () => void }) => {
  const StatusIcon = statusConfig[caseItem.status]?.icon || FileText;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`
        relative p-5 rounded-2xl cursor-pointer 
        bg-gradient-to-br from-slate-800/80 to-slate-900/80
        border border-white/10 hover:border-cyan-500/30
        transition-all duration-300
        ${priorityColors[caseItem.priority]}
      `}
    >
      {/* Risk indicator bar */}
      <div
        className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r opacity-60"
        style={{
          backgroundImage: `linear-gradient(to right,
            ${caseItem.risk_score >= 80 ? 'rgb(244, 63, 94)' :
              caseItem.risk_score >= 60 ? 'rgb(245, 158, 11)' :
              caseItem.risk_score >= 40 ? 'rgb(59, 130, 246)' :
              'rgb(16, 185, 129)'} 0%,
            transparent ${caseItem.risk_score}%)`
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg line-clamp-1">{caseItem.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-medium border
              ${statusConfig[caseItem.status]?.color}
            `}>
              <StatusIcon size={10} className="inline mr-1" />
              {caseItem.status}
            </span>
            <span className="text-xs text-slate-400">#{caseItem.id.slice(0, 8)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className={`text-2xl font-black ${getRiskColor(caseItem.risk_score)}`}>
            {caseItem.risk_score}
          </span>
          <span className="text-[10px] text-slate-500 uppercase">� ИЗИК</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-300 line-clamp-2 mb-4">
        {caseItem.situation}
      </p>

      {/* AI Insight */}
      {caseItem.ai_insight && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1">
            🤖 AI ІНСАЙТ
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">{caseItem.ai_insight}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Tag size={12} />
            <span>{caseItem.sector}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{new Date(caseItem.created_at).toLocaleDateString('uk-UA')}</span>
          </div>
        </div>
        <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group">
          <ArrowUpRight size={16} className="text-slate-400 group-hover:text-cyan-400" />
        </button>
      </div>
    </motion.div>
  );
};

const CaseListItem = ({ caseItem, onClick }: { caseItem: Case; onClick: () => void }) => {
  const StatusIcon = statusConfig[caseItem.status]?.icon || FileText;

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all"
    >
      {/* Risk Score */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg
        ${caseItem.risk_score >= 80 ? 'bg-rose-500/20 text-rose-400' :
          caseItem.risk_score >= 60 ? 'bg-amber-500/20 text-amber-400' :
          caseItem.risk_score >= 40 ? 'bg-blue-500/20 text-blue-400' :
          'bg-emerald-500/20 text-emerald-400'}
      `}>
        {caseItem.risk_score}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-white truncate">{caseItem.title}</h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig[caseItem.status]?.color}`}>
            {caseItem.status}
          </span>
        </div>
        <p className="text-sm text-slate-400 truncate">{caseItem.situation}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>{caseItem.sector}</span>
        <span>{new Date(caseItem.created_at).toLocaleDateString('uk-UA')}</span>
      </div>

      <button className="p-2 hover:bg-white/10 rounded-lg">
        <MoreHorizontal size={16} className="text-slate-400" />
      </button>
    </motion.div>
  );
};

export const SmartCaseBrowser: React.FC<{ onCaseSelect?: (caseItem: Case) => void }> = ({
  onCaseSelect
}) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'risk'>('date');

  // Fetch cases from real API
  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch('/api/v1/cases');
        if (!res.ok) throw new Error('API unavailable');
        const data = await res.json();
        setCases(Array.isArray(data) ? data : data.items || data.cases || []);
      } catch (err) {
        console.warn('[SmartCaseBrowser] API недоступний:', err);
        setCases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  // Filtered and sorted cases
  const filteredCases = useMemo(() => {
    let result = [...cases];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.situation.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'risk') return b.risk_score - a.risk_score;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [cases, searchQuery, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full md:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук кейсів..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-500/50 outline-none appearance-none cursor-pointer"
          >
            <option value="all">Всі статуси</option>
            <option value="К� ИТИЧНО">Критично</option>
            <option value="ВІДК� ИТО">Відкрито</option>
            <option value="В � ОБОТІ">В роботі</option>
            <option value="ЗАВЕ� ШЕНО">Завершено</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'risk')}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-500/50 outline-none appearance-none cursor-pointer"
          >
            <option value="date">За датою</option>
            <option value="risk">За ризиком</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-cyan-400' : 'text-slate-400'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-cyan-400' : 'text-slate-400'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Cases Display */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filteredCases.map(c => (
              <CaseCard
                key={c.id}
                caseItem={c}
                onClick={() => onCaseSelect?.(c)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {filteredCases.map(c => (
              <CaseListItem
                key={c.id}
                caseItem={c}
                onClick={() => onCaseSelect?.(c)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredCases.length === 0 && (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Кейсів не знайдено</h3>
          <p className="text-sm text-slate-400">Спробуйте змінити фільтри або пошуковий запит</p>
        </div>
      )}
    </div>
  );
};

export default SmartCaseBrowser;
