
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Archive } from 'lucide-react';
import { Case, CaseStatus } from './CaseCard';

interface CaseStatsProps {
  cases: Case[];
  activeFilter: CaseStatus | 'ALL';
  onFilterChange: (filter: CaseStatus | 'ALL') => void;
}

export const CaseStats: React.FC<CaseStatsProps> = ({ cases, activeFilter, onFilterChange }) => {
  const stats = useMemo(() => ({
    total: cases.length,
    critical: cases.filter(c => c.status === 'К� ИТИЧНО').length,
    attention: cases.filter(c => c.status === 'УВАГА').length,
    safe: cases.filter(c => c.status === 'БЕЗПЕЧНО').length,
    archived: cases.filter(c => c.status === 'А� ХІВ').length,
  }), [cases]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
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

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFilterChange('К� ИТИЧНО')}
        className={`
          p-4 rounded-2xl border transition-all
          ${activeFilter === 'К� ИТИЧНО'
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

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFilterChange('А� ХІВ')}
        className={`
          p-4 rounded-2xl border transition-all
          ${activeFilter === 'А� ХІВ'
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
