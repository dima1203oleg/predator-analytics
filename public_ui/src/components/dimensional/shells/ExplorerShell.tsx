import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, FileText, TrendingUp, Filter } from 'lucide-react';
import { QuantumCard, ExplorerView } from '../'; // Import from index of dimensional components
import { TacticalCard } from '../../../components'; // Import shared components
import { SystemMetrics } from '../../../types/metrics'; // Assume metrics types exist

interface ExplorerShellProps {
  metrics: SystemMetrics;
  recentSearches: any[];
  onNavigate?: (view: string) => void;
}

export const ExplorerShell: React.FC<ExplorerShellProps> = ({
  metrics,
  recentSearches,
  onNavigate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Introduction / Welcome Card */}
      <QuantumCard className="lg:col-span-3" animated>
        <div className="p-8 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-[32px]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Explorer Dimension</h2>
              <p className="text-sm text-slate-400 mt-1">Досліджуйте дані, аналізуйте загрози та знаходьте інсайти.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-3xl font-black text-purple-400">
                {(metrics?.documentsTotal / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Об'єктів Знань</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-blue-400">
                {metrics?.health.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Якість Даних</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-cyan-400">
                {recentSearches?.length || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Активні Сесії</p>
            </div>
          </div>
        </div>
      </QuantumCard>

      {/* Recent Activity */}
      <TacticalCard variant="glass" title="📊 Останні Дослідження" className="lg:col-span-2">
        <div className="space-y-3">
          {recentSearches?.map((search, idx) => (
            <div
              key={idx}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/30 transition-all cursor-pointer group"
              onClick={() => onNavigate && onNavigate('search')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-bold text-white">{search.query}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{search.time}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-400">{search.results} результатів</span>
              </div>
            </div>
          ))}
        </div>
      </TacticalCard>

      {/* Quick Actions */}
      <TacticalCard variant="glass" title="✨ Інструменти">
        <div className="space-y-3">
          {[
            { icon: Search, label: 'Глобальний Пошук', color: 'purple', action: 'search' },
            { icon: FileText, label: 'База Знань', color: 'blue', action: 'knowledge' },
            { icon: Filter, label: 'Фільтр Даних', color: 'indigo', action: 'filter' },
            { icon: TrendingUp, label: 'Тренди', color: 'cyan', action: 'trends' },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate && onNavigate(action.action)}
              className={`w-full p-4 rounded-2xl bg-${action.color}-500/10 border border-${action.color}-500/20 hover:border-${action.color}-500/40 transition-all group text-left`}
            >
              <div className="flex items-center gap-3">
                <action.icon className={`w-5 h-5 text-${action.color}-400 group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-bold text-white">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      </TacticalCard>
    </div>
  );
};
